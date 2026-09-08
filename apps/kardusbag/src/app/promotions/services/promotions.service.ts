// apps/kardusbag/src/promotions/promotions.service.ts
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { and, eq, isNull, lte, gte, or } from 'drizzle-orm';
import { DrizzleDb } from '@kardusbag/database';
import {
  promotionsTable,
  promotionVariantsTable,
  promotionBagsTable,
  promotionCategoriesTable,
  promotionCollectionsTable,
} from '@kardusbag/database';
import { cartItemsTable, shoppingCartsTable } from '@kardusbag/database';
import {
  PromotionRuleEngine,
  VariantEvaluationItem,
  PromotionEvaluationData,
} from '../promotion-rule.engine';

@Injectable()
export class PromotionsService {
  constructor(@Inject('DRIZZLE_DB') private readonly db: DrizzleDb) {}

  /**
   * Carga una promoción junto con todas sus tablas pivote
   */
  private async loadPromotionWithTargets(promotionId: string) {
    const [variants, bags, categories, collections] = await Promise.all([
      this.db
        .select()
        .from(promotionVariantsTable)
        .where(eq(promotionVariantsTable.promotionId, promotionId)),
      this.db
        .select()
        .from(promotionBagsTable)
        .where(eq(promotionBagsTable.promotionId, promotionId)),
      this.db
        .select()
        .from(promotionCategoriesTable)
        .where(eq(promotionCategoriesTable.promotionId, promotionId)),
      this.db
        .select()
        .from(promotionCollectionsTable)
        .where(eq(promotionCollectionsTable.promotionId, promotionId)),
    ]);

    return {
      targetVariantIds: variants.map((v) => v.variantId),
      targetBagIds: bags.map((b) => b.bagId),
      targetCategoryIds: categories.map((c) => c.categoryId),
      targetCollectionIds: collections.map((col) => col.collectionId),
    };
  }

  /**
   * Aplica un cupón al carrito evaluando cada variante
   */
  async applyCouponToCart(cartId: string, couponCode: string) {
    const now = new Date();

    // 1. Buscar cupón activo y vigente
    const promotion = await this.db.query.promotionsTable.findFirst({
      where: and(
        eq(promotionsTable.code, couponCode.toUpperCase().trim()),
        eq(promotionsTable.isActive, true),
        isNull(promotionsTable.deletedAt),
        lte(promotionsTable.startsAt, now),
        or(
          isNull(promotionsTable.expiresAt),
          gte(promotionsTable.expiresAt, now),
        ),
      ),
    });

    if (!promotion) {
      throw new NotFoundException(
        'El cupón ingresado no existe o no se encuentra vigente.',
      );
    }

    if (
      promotion.usageLimitTotal &&
      promotion.currentUsageCount >= promotion.usageLimitTotal
    ) {
      throw new BadRequestException(
        'El cupón ha alcanzado su límite máximo de usos.',
      );
    }

    // 2. Cargar los ítems del carrito con variantes, bolso matriz y colecciones
    const cartItems = await this.db.query.cartItemsTable.findMany({
      where: eq(cartItemsTable.cartId, cartId),
      with: {
        variant: {
          with: {
            bag: {
              with: {
                collections: true, // bagsToCollectionsTable
              },
            },
          },
        },
      },
    });

    if (cartItems.length === 0) {
      throw new BadRequestException('El carrito está vacío.');
    }

    // 3. Obtener los targets de la promoción
    const targets = await this.loadPromotionWithTargets(promotion.id);
    const promoData: PromotionEvaluationData = {
      id: promotion.id,
      code: promotion.code,
      name: promotion.name,
      type: promotion.type as any,
      value: Number(promotion.value),
      scope: promotion.scope as any,
      attributeRules: promotion.attributeRules,
      ...targets,
    };

    // 4. Evaluar elegibilidad variante por variante
    let eligibleSubtotal = 0;
    let totalDiscount = 0;

    const evaluatedLines = cartItems.map((item) => {
      const evaluationContext: VariantEvaluationItem = {
        variantId: item.variant.id,
        sku: item.variant.sku,
        price: Number(item.variant.price),
        quantity: item.quantity,
        colorName: item.variant.colorName,
        bag: {
          id: item.variant.bag.id,
          categoryId: item.variant.bag.categoryId,
          collectionIds: item.variant.bag.collections.map(
            (c) => c.collectionId,
          ),
          material: item.variant.bag.material,
          isWaterResistant: item.variant.bag.isWaterResistant,
          hasLaptopSleeve: item.variant.bag.hasLaptopSleeve,
          maxLaptopSizeInches: item.variant.bag.maxLaptopSizeInches
            ? Number(item.variant.bag.maxLaptopSizeInches)
            : null,
        },
      };

      const isEligible = PromotionRuleEngine.isEligible(
        evaluationContext,
        promoData,
      );
      let lineDiscount = 0;

      if (isEligible) {
        eligibleSubtotal += evaluationContext.price * item.quantity;
        lineDiscount = PromotionRuleEngine.computeDiscount(
          evaluationContext.price,
          item.quantity,
          promoData,
        );
      }

      const totalLinePrice = evaluationContext.price * item.quantity;
      const finalLinePrice = Math.max(0, totalLinePrice - lineDiscount);

      return {
        cartItemId: item.id,
        variantId: item.variant.id,
        sku: item.variant.sku,
        unitPrice: evaluationContext.price,
        quantity: item.quantity,
        totalOriginal: totalLinePrice,
        isEligible,
        discountApplied: Number(lineDiscount.toFixed(2)),
        totalFinal: Number(finalLinePrice.toFixed(2)),
      };
    });

    // 5. Validar subtotal mínimo de compra
    if (
      promotion.minOrderSubtotal &&
      eligibleSubtotal < Number(promotion.minOrderSubtotal)
    ) {
      throw new BadRequestException(
        `Para usar este cupón necesitas al menos $${Number(promotion.minOrderSubtotal).toLocaleString('es-CO')} en artículos válidos.`,
      );
    }

    totalDiscount = evaluatedLines.reduce(
      (acc, line) => acc + line.discountApplied,
      0,
    );

    // 6. Aplicar tope máximo si está definido
    if (
      promotion.maxDiscountAmount &&
      totalDiscount > Number(promotion.maxDiscountAmount)
    ) {
      totalDiscount = Number(promotion.maxDiscountAmount);
    }

    // 7. Vincular el cupón al carrito en base de datos
    await this.db
      .update(shoppingCartsTable)
      .set({ appliedCouponId: promotion.id, updatedAt: new Date() })
      .where(eq(shoppingCartsTable.id, cartId));

    return {
      appliedCoupon: {
        code: promotion.code,
        name: promotion.name,
        type: promotion.type,
        value: Number(promotion.value),
      },
      summary: {
        eligibleSubtotal: Number(eligibleSubtotal.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        isFreeShipping: promotion.type === 'free_shipping',
      },
      items: evaluatedLines,
    };
  }

  /**
   * Para el Catálogo: Calcula el precio tachado y badges para las cards del frontend
   */
  async decorateBagsWithCatalogPromotions(bags: any[]) {
    const now = new Date();

    // Obtener todas las promociones automáticas vigentes (code es NULL)
    const autoPromos = await this.db.query.promotionsTable.findMany({
      where: and(
        isNull(promotionsTable.code),
        eq(promotionsTable.isActive, true),
        isNull(promotionsTable.deletedAt),
        lte(promotionsTable.startsAt, now),
        or(
          isNull(promotionsTable.expiresAt),
          gte(promotionsTable.expiresAt, now),
        ),
      ),
    });

    if (autoPromos.length === 0) {
      return bags.map((b) => ({
        ...b,
        pricing: {
          originalPrice: Number(b.basePrice),
          finalPrice: Number(b.basePrice),
          hasDiscount: false,
          discountBadge: null,
        },
      }));
    }

    // Pre-cargar targets de las promociones automáticas
    const promotionsWithTargets: PromotionEvaluationData[] = await Promise.all(
      autoPromos.map(async (p) => {
        const targets = await this.loadPromotionWithTargets(p.id);
        return {
          id: p.id,
          name: p.name,
          type: p.type as any,
          value: Number(p.value),
          scope: p.scope as any,
          attributeRules: p.attributeRules,
          ...targets,
        };
      }),
    );

    return bags.map((bag) => {
      const basePrice = Number(bag.basePrice);
      let bestDiscount = 0;
      let badge: string | null = null;

      // Mock de contexto sobre la variante base/primaria
      const primaryVariant = bag.variants?.[0];
      const evaluationContext: VariantEvaluationItem = {
        variantId: primaryVariant?.id || '',
        sku: primaryVariant?.sku || bag.slug,
        price: primaryVariant ? Number(primaryVariant.price) : basePrice,
        quantity: 1,
        colorName: primaryVariant?.colorName || '',
        bag: {
          id: bag.id,
          categoryId: bag.categoryId,
          collectionIds: bag.collections?.map((c: any) => c.collectionId) || [],
          material: bag.material,
          isWaterResistant: bag.isWaterResistant,
          hasLaptopSleeve: bag.hasLaptopSleeve,
          maxLaptopSizeInches: bag.maxLaptopSizeInches
            ? Number(bag.maxLaptopSizeInches)
            : null,
        },
      };

      for (const promo of promotionsWithTargets) {
        if (PromotionRuleEngine.isEligible(evaluationContext, promo)) {
          const discount = PromotionRuleEngine.computeDiscount(
            evaluationContext.price,
            1,
            promo,
          );
          if (discount > bestDiscount) {
            bestDiscount = discount;
            badge =
              promo.type === 'percentage'
                ? `${Math.round(promo.value)}% OFF`
                : promo.name;
          }
        }
      }

      return {
        ...bag,
        pricing: {
          originalPrice: evaluationContext.price,
          finalPrice: Math.max(0, evaluationContext.price - bestDiscount),
          hasDiscount: bestDiscount > 0,
          discountAmount: bestDiscount,
          discountBadge: badge,
        },
      };
    });
  }
}
