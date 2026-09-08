import { Injectable, Inject } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  PROMOTION_REPOSITORY_PORT,
  type PromotionRepositoryPort,
} from '../../domain/ports/promotion-repository.port';
import {
  Promotion,
  type DiscountType,
  type PromotionScope,
  type PromotionAttributeRules,
} from '../../domain/entities/promotion.entity';
import {
  InvalidPromotionDataException,
  PromotionConflictException,
  PromotionNotFoundException,
} from '../../domain/exceptions/promotion.exceptions';

export interface CreatePromotion {
  name: string;
  code?: string | null;
  type: DiscountType;
  value: number;
  scope: PromotionScope;
  attributeRules?: PromotionAttributeRules | null;
  minOrderSubtotal?: number;
  maxDiscountAmount?: number | null;
  usageLimitTotal?: number | null;
  usageLimitPerCustomer?: number;
  startsAt?: Date | string;
  expiresAt?: Date | string | null;
  isActive?: boolean;
  categoryIds?: string[];
  collectionIds?: string[];
  bagIds?: string[];
  variantIds?: string[];
}

@Injectable()
export class PromotionsAdminService {
  constructor(
    @Inject(PROMOTION_REPOSITORY_PORT)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  async create(createPromotion: CreatePromotion): Promise<Promotion> {
    const startsAt = createPromotion.startsAt
      ? new Date(createPromotion.startsAt)
      : new Date();
    const expiresAt = createPromotion.expiresAt
      ? new Date(createPromotion.expiresAt)
      : null;

    if (expiresAt && expiresAt <= startsAt) {
      throw new InvalidPromotionDataException(
        'La fecha de vencimiento debe ser posterior a la fecha de inicio.',
      );
    }

    if (
      createPromotion.type === 'percentage' &&
      (createPromotion.value <= 0 || createPromotion.value > 100)
    ) {
      throw new InvalidPromotionDataException(
        'El descuento porcentual debe estar entre 0.01% y 100%.',
      );
    }

    if (createPromotion.code) {
      const codeClean = createPromotion.code.toUpperCase().trim();
      const existing = await this.repository.findByCode(codeClean);
      if (existing) {
        throw new PromotionConflictException(
          `El código de cupón "${codeClean}" ya se encuentra registrado.`,
        );
      }
    }

    this.validateScopeIntegrity(createPromotion);

    const promotion = new Promotion({
      id: randomUUID(),
      name: createPromotion.name,
      code: createPromotion.code || null,
      type: createPromotion.type,
      value: createPromotion.value,
      scope: createPromotion.scope,
      attributeRules: createPromotion.attributeRules || {},
      minOrderSubtotal: createPromotion.minOrderSubtotal ?? 0,
      maxDiscountAmount: createPromotion.maxDiscountAmount ?? null,
      usageLimitTotal: createPromotion.usageLimitTotal ?? null,
      usageLimitPerCustomer: createPromotion.usageLimitPerCustomer ?? 1,
      currentUsageCount: 0,
      startsAt,
      expiresAt,
      isActive: createPromotion.isActive ?? true,
      targetCategoryIds: createPromotion.categoryIds ?? [],
      targetCollectionIds: createPromotion.collectionIds ?? [],
      targetBagIds: createPromotion.bagIds ?? [],
      targetVariantIds: createPromotion.variantIds ?? [],
    });

    return await this.repository.save(promotion);
  }

  async findAll(): Promise<Promotion[]> {
    return await this.repository.findAll();
  }

  async findById(id: string): Promise<Promotion> {
    const promotion = await this.repository.findById(id);
    if (!promotion) {
      throw new PromotionNotFoundException(id);
    }
    return promotion;
  }

  async softDelete(id: string): Promise<{ id: string; message: string }> {
    const promotion = await this.findById(id);
    await this.repository.softDelete(id);
    return {
      id,
      message: `Promoción "${promotion.toPrimitives().name}" archivada exitosamente.`,
    };
  }

  private validateScopeIntegrity(createPromotion: CreatePromotion) {
    if (
      createPromotion.scope === 'categories' &&
      (!createPromotion.categoryIds || createPromotion.categoryIds.length === 0)
    ) {
      throw new InvalidPromotionDataException(
        'Debes proporcionar al menos un ID de categoría para el alcance "categories".',
      );
    }
    if (
      createPromotion.scope === 'collections' &&
      (!createPromotion.collectionIds ||
        createPromotion.collectionIds.length === 0)
    ) {
      throw new InvalidPromotionDataException(
        'Debes proporcionar al menos un ID de colección para el alcance "collections".',
      );
    }
    if (
      createPromotion.scope === 'specific_bags' &&
      (!createPromotion.bagIds || createPromotion.bagIds.length === 0)
    ) {
      throw new InvalidPromotionDataException(
        'Debes proporcionar al menos un ID de bolso para el alcance "specific_bags".',
      );
    }
    if (
      createPromotion.scope === 'specific_variants' &&
      (!createPromotion.variantIds || createPromotion.variantIds.length === 0)
    ) {
      throw new InvalidPromotionDataException(
        'Debes proporcionar al menos un ID de variante para el alcance "specific_variants".',
      );
    }
    if (
      createPromotion.scope === 'attributes' &&
      (!createPromotion.attributeRules ||
        Object.keys(createPromotion.attributeRules).length === 0)
    ) {
      throw new InvalidPromotionDataException(
        'Debes configurar al menos una regla de atributos para el alcance "attributes".',
      );
    }
  }
}
