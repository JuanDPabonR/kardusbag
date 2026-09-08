// apps/kardusbag/src/promotions/promotion-rule.engine.ts
export interface VariantEvaluationItem {
  variantId: string;
  sku: string;
  price: number; // bag_variants.price
  quantity: number;
  colorName: string;
  bag: {
    id: string;
    categoryId: string | null;
    collectionIds: string[];
    material: string | null;
    isWaterResistant: boolean;
    hasLaptopSleeve: boolean;
    maxLaptopSizeInches: number | null;
  };
}

export interface PromotionEvaluationData {
  id: string;
  code?: string | null;
  name: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  scope:
    | 'global'
    | 'categories'
    | 'collections'
    | 'specific_bags'
    | 'specific_variants'
    | 'attributes';
  attributeRules?: {
    material?: string;
    isWaterResistant?: boolean;
    hasLaptopSleeve?: boolean;
    minLaptopInches?: number;
    colorNames?: string[];
  } | null;
  targetVariantIds: string[];
  targetBagIds: string[];
  targetCategoryIds: string[];
  targetCollectionIds: string[];
}

export class PromotionRuleEngine {
  /**
   * Evalúa si una variante y su bolso matriz califican para una promoción
   */
  static isEligible(
    item: VariantEvaluationItem,
    promo: PromotionEvaluationData,
  ): boolean {
    switch (promo.scope) {
      case 'global':
        return true;

      case 'specific_variants':
        return promo.targetVariantIds.includes(item.variantId);

      case 'specific_bags':
        return promo.targetBagIds.includes(item.bag.id);

      case 'categories':
        return (
          !!item.bag.categoryId &&
          promo.targetCategoryIds.includes(item.bag.categoryId)
        );

      case 'collections':
        return item.bag.collectionIds.some((cId) =>
          promo.targetCollectionIds.includes(cId),
        );

      case 'attributes': {
        const rules = promo.attributeRules || {};

        if (
          rules.material &&
          (!item.bag.material ||
            !item.bag.material
              .toLowerCase()
              .includes(rules.material.toLowerCase()))
        ) {
          return false;
        }

        if (
          rules.isWaterResistant !== undefined &&
          item.bag.isWaterResistant !== rules.isWaterResistant
        ) {
          return false;
        }

        if (
          rules.hasLaptopSleeve !== undefined &&
          item.bag.hasLaptopSleeve !== rules.hasLaptopSleeve
        ) {
          return false;
        }

        if (
          rules.minLaptopInches &&
          (!item.bag.maxLaptopSizeInches ||
            item.bag.maxLaptopSizeInches < rules.minLaptopInches)
        ) {
          return false;
        }

        if (rules.colorNames && rules.colorNames.length > 0) {
          const matchColor = rules.colorNames.some(
            (c) => c.toLowerCase() === item.colorName.toLowerCase(),
          );
          if (!matchColor) return false;
        }

        return true;
      }

      default:
        return false;
    }
  }

  /**
   * Calcula el descuento para una línea del carrito
   */
  static computeDiscount(
    price: number,
    quantity: number,
    promo: PromotionEvaluationData,
  ): number {
    const totalLine = price * quantity;
    if (promo.type === 'percentage') {
      return (totalLine * promo.value) / 100;
    }
    if (promo.type === 'fixed_amount') {
      return Math.min(promo.value * quantity, totalLine);
    }
    return 0; // free_shipping no afecta el precio del ítem
  }
}
