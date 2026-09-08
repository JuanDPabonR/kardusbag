// apps/kardusbag/src/app/promotions/promotions-admin.service.ts
import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { eq, and, isNull, desc } from 'drizzle-orm';
import {
  type DrizzleDb,
  promotionsTable,
  promotionBagsTable,
  promotionVariantsTable,
  promotionCategoriesTable,
  promotionCollectionsTable,
} from '@kardusbag/database';
import {
  CreatePromotionDto,
  PromotionScopeDto,
} from '../dtos/create-promotion.dto';

@Injectable()
export class PromotionsAdminService {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  /**
   * Crea una nueva promoción o cupón con validaciones lógicas
   */
  async create(dto: CreatePromotionDto) {
    // 1. Validar fechas de vigencia
    const startsAt = dto.startsAt ? new Date(dto.startsAt) : new Date();
    if (dto.expiresAt && new Date(dto.expiresAt) <= startsAt) {
      throw new BadRequestException(
        'La fecha de vencimiento debe ser posterior a la fecha de inicio.',
      );
    }

    // 2. Validar porcentaje lógico
    if (dto.type === 'percentage' && dto.value > 100) {
      throw new BadRequestException(
        'El descuento porcentual no puede exceder el 100%.',
      );
    }

    // 3. Validar unicidad del código (si es cupón manual)
    if (dto.code) {
      const existing = await this.db.query.promotionsTable.findFirst({
        where: and(
          eq(promotionsTable.code, dto.code),
          isNull(promotionsTable.deletedAt),
        ),
      });

      if (existing) {
        throw new ConflictException(
          `El código de cupón "${dto.code}" ya está en uso.`,
        );
      }
    }

    // 4. Validar coherencia del scope con sus IDs
    this.validateScopeIntegrity(dto);

    // 5. Ejecutar la inserción de forma atómica en una transacción
    return await this.db.transaction(async (tx) => {
      const [newPromotion] = await tx
        .insert(promotionsTable)
        .values({
          name: dto.name,
          code: dto.code || null,
          type: dto.type as any,
          value: dto.value.toFixed(2),
          scope: dto.scope as any,
          attributeRules: dto.attributeRules || {},
          minOrderSubtotal: dto.minOrderSubtotal
            ? dto.minOrderSubtotal.toFixed(2)
            : '0.00',
          maxDiscountAmount: dto.maxDiscountAmount
            ? dto.maxDiscountAmount.toFixed(2)
            : null,
          usageLimitTotal: dto.usageLimitTotal || null,
          usageLimitPerCustomer: dto.usageLimitPerCustomer ?? 1,
          startsAt,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          isActive: dto.isActive ?? true,
        })
        .returning();

      // Inserciones en tablas pivote según el scope
      if (
        dto.scope === PromotionScopeDto.CATEGORIES &&
        dto.categoryIds?.length
      ) {
        await tx.insert(promotionCategoriesTable).values(
          dto.categoryIds.map((categoryId) => ({
            promotionId: newPromotion.id,
            categoryId,
          })),
        );
      } else if (
        dto.scope === PromotionScopeDto.COLLECTIONS &&
        dto.collectionIds?.length
      ) {
        await tx.insert(promotionCollectionsTable).values(
          dto.collectionIds.map((collectionId) => ({
            promotionId: newPromotion.id,
            collectionId,
          })),
        );
      } else if (
        dto.scope === PromotionScopeDto.SPECIFIC_BAGS &&
        dto.bagIds?.length
      ) {
        await tx.insert(promotionBagsTable).values(
          dto.bagIds.map((bagId) => ({
            promotionId: newPromotion.id,
            bagId,
          })),
        );
      } else if (
        dto.scope === PromotionScopeDto.SPECIFIC_VARIANTS &&
        dto.variantIds?.length
      ) {
        await tx.insert(promotionVariantsTable).values(
          dto.variantIds.map((variantId) => ({
            promotionId: newPromotion.id,
            variantId,
          })),
        );
      }

      return newPromotion;
    });
  }

  /**
   * Lista todas las promociones del sistema (admin view)
   */
  async findAll() {
    return await this.db.query.promotionsTable.findMany({
      where: isNull(promotionsTable.deletedAt),
      orderBy: [desc(promotionsTable.createdAt)],
      with: {
        targetBags: true,
        targetVariants: true,
        targetCategories: true,
        targetCollections: true,
      },
    });
  }

  /**
   * Obtiene una promoción por su ID con todas sus relaciones
   */
  async findOne(id: string) {
    const promo = await this.db.query.promotionsTable.findFirst({
      where: and(eq(promotionsTable.id, id), isNull(promotionsTable.deletedAt)),
      with: {
        targetBags: true,
        targetVariants: true,
        targetCategories: true,
        targetCollections: true,
      },
    });

    if (!promo) {
      throw new NotFoundException(`Promoción con ID ${id} no encontrada.`);
    }

    return promo;
  }

  /**
   * Eliminación lógica (Soft Delete) de una promoción
   */
  async softDelete(id: string) {
    const promo = await this.findOne(id);

    await this.db
      .update(promotionsTable)
      .set({
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(promotionsTable.id, promo.id));

    return { message: `Promoción ${promo.name} archivada exitosamente.` };
  }

  /**
   * Validación cruzada de datos para no guardar estados inconsistentes
   */
  private validateScopeIntegrity(dto: CreatePromotionDto) {
    if (
      dto.scope === PromotionScopeDto.CATEGORIES &&
      (!dto.categoryIds || dto.categoryIds.length === 0)
    ) {
      throw new BadRequestException(
        'Debes proporcionar al menos un ID de categoría para el alcance "categories".',
      );
    }
    if (
      dto.scope === PromotionScopeDto.COLLECTIONS &&
      (!dto.collectionIds || dto.collectionIds.length === 0)
    ) {
      throw new BadRequestException(
        'Debes proporcionar al menos un ID de colección para el alcance "collections".',
      );
    }
    if (
      dto.scope === PromotionScopeDto.SPECIFIC_BAGS &&
      (!dto.bagIds || dto.bagIds.length === 0)
    ) {
      throw new BadRequestException(
        'Debes proporcionar al menos un ID de bolso para el alcance "specific_bags".',
      );
    }
    if (
      dto.scope === PromotionScopeDto.SPECIFIC_VARIANTS &&
      (!dto.variantIds || dto.variantIds.length === 0)
    ) {
      throw new BadRequestException(
        'Debes proporcionar al menos un ID de variante para el alcance "specific_variants".',
      );
    }
    if (
      dto.scope === PromotionScopeDto.ATTRIBUTES &&
      (!dto.attributeRules || Object.keys(dto.attributeRules).length === 0)
    ) {
      throw new BadRequestException(
        'Debes configurar al menos una regla de atributos para el alcance "attributes".',
      );
    }
  }
}
