import { Injectable, Inject } from '@nestjs/common';
import {
  PROMOTION_REPOSITORY_PORT,
  type PromotionRepositoryPort,
} from '../../domain/ports/promotion-repository.port';
import {
  PromotionRuleEngine,
  type PromotionEvaluationData,
  type VariantEvaluationItem,
} from '../../domain/rules/promotion-rule.engine';
import {
  CouponNotFoundOrExpiredException,
  CouponUsageLimitReachedException,
  InvalidPromotionDataException,
  MinOrderSubtotalNotMetException,
} from '../../domain/exceptions/promotion.exceptions';

export interface EvaluatedCartLine {
  cartItemId: string;
  variantId: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  totalOriginal: number;
  isEligible: boolean;
  discountApplied: number;
  totalFinal: number;
}

export interface ApplyCouponResult {
  appliedCoupon: {
    id: string;
    code: string | null;
    name: string;
    type: string;
    value: number;
  };
  summary: {
    eligibleSubtotal: number;
    totalDiscount: number;
    isFreeShipping: boolean;
  };
  items: EvaluatedCartLine[];
}

@Injectable()
export class PromotionsService {
  constructor(
    @Inject(PROMOTION_REPOSITORY_PORT)
    private readonly repository: PromotionRepositoryPort,
  ) {}

  async applyCoupon(
    cartId: string,
    couponCode: string,
  ): Promise<ApplyCouponResult> {
    const cleanCode = couponCode.toUpperCase().trim();
    const promotion = await this.repository.findActiveCoupon(cleanCode);

    if (!promotion) {
      throw new CouponNotFoundOrExpiredException(cleanCode);
    }

    if (promotion.hasReachedUsageLimit()) {
      throw new CouponUsageLimitReachedException(cleanCode);
    }

    const cartItems = await this.repository.getCartItemsForEvaluation(cartId);
    if (!cartItems || cartItems.length === 0) {
      throw new InvalidPromotionDataException('El carrito está vacío.');
    }

    const promoProps = promotion.toPrimitives();
    const promoData: PromotionEvaluationData = {
      id: promoProps.id,
      code: promoProps.code,
      name: promoProps.name,
      type: promoProps.type,
      value: promoProps.value,
      scope: promoProps.scope,
      attributeRules: promoProps.attributeRules,
      targetVariantIds: promoProps.targetVariantIds ?? [],
      targetBagIds: promoProps.targetBagIds ?? [],
      targetCategoryIds: promoProps.targetCategoryIds ?? [],
      targetCollectionIds: promoProps.targetCollectionIds ?? [],
    };

    let eligibleSubtotal = 0;
    let totalDiscount = 0;

    const items: EvaluatedCartLine[] = cartItems.map((item) => {
      const evaluation = item.evaluationItem;
      const isEligible = PromotionRuleEngine.isEligible(evaluation, promoData);
      let lineDiscount = 0;

      if (isEligible) {
        eligibleSubtotal += evaluation.price * item.quantity;
        lineDiscount = PromotionRuleEngine.computeDiscount(
          evaluation.price,
          item.quantity,
          promoData,
        );
      }

      const totalLinePrice = evaluation.price * item.quantity;
      const finalLinePrice = Math.max(0, totalLinePrice - lineDiscount);

      return {
        cartItemId: item.cartItemId,
        variantId: evaluation.variantId,
        sku: evaluation.sku,
        unitPrice: evaluation.price,
        quantity: item.quantity,
        totalOriginal: totalLinePrice,
        isEligible,
        discountApplied: Number(lineDiscount.toFixed(2)),
        totalFinal: Number(finalLinePrice.toFixed(2)),
      };
    });

    if (
      promoProps.minOrderSubtotal &&
      eligibleSubtotal < promoProps.minOrderSubtotal
    ) {
      throw new MinOrderSubtotalNotMetException(promoProps.minOrderSubtotal);
    }

    totalDiscount = items.reduce((acc, line) => acc + line.discountApplied, 0);

    if (
      promoProps.maxDiscountAmount &&
      totalDiscount > promoProps.maxDiscountAmount
    ) {
      totalDiscount = promoProps.maxDiscountAmount;
    }

    await this.repository.linkCouponToCart(cartId, promoProps.id);

    return {
      appliedCoupon: {
        id: promoProps.id,
        code: promoProps.code,
        name: promoProps.name,
        type: promoProps.type,
        value: promoProps.value,
      },
      summary: {
        eligibleSubtotal: Number(eligibleSubtotal.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        isFreeShipping: promoProps.type === 'free_shipping',
      },
      items,
    };
  }

  async decorateCatalogBags(bags: any[]): Promise<any[]> {
    const autoPromos = await this.repository.findActiveAutomaticPromotions();

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

    const promotionsWithTargets: PromotionEvaluationData[] = autoPromos.map(
      (p) => {
        const primitives = p.toPrimitives();
        return {
          id: primitives.id,
          name: primitives.name,
          type: primitives.type,
          value: primitives.value,
          scope: primitives.scope,
          attributeRules: primitives.attributeRules,
          targetVariantIds: primitives.targetVariantIds ?? [],
          targetBagIds: primitives.targetBagIds ?? [],
          targetCategoryIds: primitives.targetCategoryIds ?? [],
          targetCollectionIds: primitives.targetCollectionIds ?? [],
        };
      },
    );

    return bags.map((bag) => {
      const basePrice = Number(bag.basePrice);
      let bestDiscount = 0;
      let badge: string | null = null;

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
