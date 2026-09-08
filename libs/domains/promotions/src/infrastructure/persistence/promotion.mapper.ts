import { InferSelectModel, InferInsertModel } from 'drizzle-orm';
import { promotionsTable } from '@kardusbag/database';
import { Promotion } from '../../domain/entities/promotion';

export type PromotionDbRecord = InferSelectModel<typeof promotionsTable>;
export type PromotionDbInsert = InferInsertModel<typeof promotionsTable>;

export interface PromotionTargets {
  targetVariantIds?: string[];
  targetBagIds?: string[];
  targetCategoryIds?: string[];
  targetCollectionIds?: string[];
}

export class PromotionMapper {
  /**
   * Mapea un registro crudo de base de datos a la entidad de dominio Promotion
   */
  public static toDomain(raw: any, targets?: PromotionTargets): Promotion {
    return new Promotion({
      id: raw.id,
      name: raw.name,
      code: raw.code,
      type: raw.type,
      value: Number(raw.value),
      scope: raw.scope,
      attributeRules: raw.attributeRules,
      minOrderSubtotal: raw.minOrderSubtotal ? Number(raw.minOrderSubtotal) : 0,
      maxDiscountAmount: raw.maxDiscountAmount
        ? Number(raw.maxDiscountAmount)
        : null,
      usageLimitTotal: raw.usageLimitTotal,
      usageLimitPerCustomer: raw.usageLimitPerCustomer,
      currentUsageCount: raw.currentUsageCount,
      startsAt: new Date(raw.startsAt),
      expiresAt: raw.expiresAt ? new Date(raw.expiresAt) : null,
      isActive: raw.isActive,
      deletedAt: raw.deletedAt ? new Date(raw.deletedAt) : null,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
      targetVariantIds:
        targets?.targetVariantIds ??
        raw.targetVariants?.map((v: any) => v.variantId) ??
        [],
      targetBagIds:
        targets?.targetBagIds ?? raw.targetBags?.map((b: any) => b.bagId) ?? [],
      targetCategoryIds:
        targets?.targetCategoryIds ??
        raw.targetCategories?.map((c: any) => c.categoryId) ??
        [],
      targetCollectionIds:
        targets?.targetCollectionIds ??
        raw.targetCollections?.map((col: any) => col.collectionId) ??
        [],
    });
  }

  /**
   * Convierte la entidad Promotion a objeto de inserción para Drizzle
   */
  public static toPersistenceInsert(promotion: Promotion): PromotionDbInsert {
    const props = promotion.toPrimitives();

    return {
      id: props.id,
      name: props.name,
      code: props.code || null,
      type: props.type as any,
      value: props.value.toFixed(2),
      scope: props.scope as any,
      attributeRules: props.attributeRules || {},
      minOrderSubtotal: props.minOrderSubtotal
        ? props.minOrderSubtotal.toFixed(2)
        : '0.00',
      maxDiscountAmount: props.maxDiscountAmount
        ? props.maxDiscountAmount.toFixed(2)
        : null,
      usageLimitTotal: props.usageLimitTotal || null,
      usageLimitPerCustomer: props.usageLimitPerCustomer ?? 1,
      currentUsageCount: props.currentUsageCount ?? 0,
      startsAt: props.startsAt,
      expiresAt: props.expiresAt || null,
      isActive: props.isActive ?? true,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }

  /**
   * Convierte la entidad Promotion a objeto de actualización para Drizzle
   */
  public static toPersistenceUpdate(
    promotion: Promotion,
  ): Partial<PromotionDbInsert> {
    const props = promotion.toPrimitives();

    return {
      name: props.name,
      code: props.code || null,
      type: props.type as any,
      value: props.value.toFixed(2),
      scope: props.scope as any,
      attributeRules: props.attributeRules || {},
      minOrderSubtotal: props.minOrderSubtotal
        ? props.minOrderSubtotal.toFixed(2)
        : '0.00',
      maxDiscountAmount: props.maxDiscountAmount
        ? props.maxDiscountAmount.toFixed(2)
        : null,
      usageLimitTotal: props.usageLimitTotal || null,
      usageLimitPerCustomer: props.usageLimitPerCustomer ?? 1,
      currentUsageCount: props.currentUsageCount ?? 0,
      startsAt: props.startsAt,
      expiresAt: props.expiresAt || null,
      isActive: props.isActive ?? true,
      updatedAt: new Date(),
    };
  }
}
