import { Injectable, Inject } from '@nestjs/common';
import { and, eq, isNull, lte, gte, or, desc } from 'drizzle-orm';
import {
  type DrizzleDb,
  promotionsTable,
  promotionVariantsTable,
  promotionBagsTable,
  promotionCategoriesTable,
  promotionCollectionsTable,
  cartItemsTable,
  shoppingCartsTable,
} from '@kardusbag/database';
import {
  PromotionRepositoryPort,
  CartEvaluationItem,
} from '../../domain/ports/promotion-repository.port';
import { Promotion } from '../../domain/entities/promotion.entity';

export const DRIZZLE_DB = Symbol('DRIZZLE_DB');

@Injectable()
export class PromotionRepository implements PromotionRepositoryPort {
  constructor(
    @Inject(DRIZZLE_DB)
    private readonly db: DrizzleDb,
  ) {}

  private async loadPromotionTargets(promotionId: string) {
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

  private toDomain(
    raw: any,
    targets?: {
      targetVariantIds?: string[];
      targetBagIds?: string[];
      targetCategoryIds?: string[];
      targetCollectionIds?: string[];
    },
  ): Promotion {
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

  async findById(id: string): Promise<Promotion | null> {
    const raw = await this.db.query.promotionsTable.findFirst({
      where: and(eq(promotionsTable.id, id), isNull(promotionsTable.deletedAt)),
      with: {
        targetBags: true,
        targetVariants: true,
        targetCategories: true,
        targetCollections: true,
      },
    });

    if (!raw) return null;
    return this.toDomain(raw);
  }

  async findByCode(code: string): Promise<Promotion | null> {
    const raw = await this.db.query.promotionsTable.findFirst({
      where: and(
        eq(promotionsTable.code, code.toUpperCase().trim()),
        isNull(promotionsTable.deletedAt),
      ),
    });

    if (!raw) return null;
    const targets = await this.loadPromotionTargets(raw.id);
    return this.toDomain(raw, targets);
  }

  async findActiveCoupon(
    code: string,
    now = new Date(),
  ): Promise<Promotion | null> {
    const raw = await this.db.query.promotionsTable.findFirst({
      where: and(
        eq(promotionsTable.code, code.toUpperCase().trim()),
        eq(promotionsTable.isActive, true),
        isNull(promotionsTable.deletedAt),
        lte(promotionsTable.startsAt, now),
        or(
          isNull(promotionsTable.expiresAt),
          gte(promotionsTable.expiresAt, now),
        ),
      ),
    });

    if (!raw) return null;
    const targets = await this.loadPromotionTargets(raw.id);
    return this.toDomain(raw, targets);
  }

  async findActiveAutomaticPromotions(now = new Date()): Promise<Promotion[]> {
    const raws = await this.db.query.promotionsTable.findMany({
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

    return await Promise.all(
      raws.map(async (raw) => {
        const targets = await this.loadPromotionTargets(raw.id);
        return this.toDomain(raw, targets);
      }),
    );
  }

  async findAll(): Promise<Promotion[]> {
    const raws = await this.db.query.promotionsTable.findMany({
      where: isNull(promotionsTable.deletedAt),
      orderBy: [desc(promotionsTable.createdAt)],
      with: {
        targetBags: true,
        targetVariants: true,
        targetCategories: true,
        targetCollections: true,
      },
    });

    return raws.map((raw) => this.toDomain(raw));
  }

  async save(promotion: Promotion): Promise<Promotion> {
    const props = promotion.toPrimitives();

    return await this.db.transaction(async (tx) => {
      const [newRow] = await tx
        .insert(promotionsTable)
        .values({
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
        })
        .returning();

      if (props.scope === 'categories' && props.targetCategoryIds?.length) {
        await tx.insert(promotionCategoriesTable).values(
          props.targetCategoryIds.map((categoryId) => ({
            promotionId: newRow.id,
            categoryId,
          })),
        );
      } else if (
        props.scope === 'collections' &&
        props.targetCollectionIds?.length
      ) {
        await tx.insert(promotionCollectionsTable).values(
          props.targetCollectionIds.map((collectionId) => ({
            promotionId: newRow.id,
            collectionId,
          })),
        );
      } else if (
        props.scope === 'specific_bags' &&
        props.targetBagIds?.length
      ) {
        await tx.insert(promotionBagsTable).values(
          props.targetBagIds.map((bagId) => ({
            promotionId: newRow.id,
            bagId,
          })),
        );
      } else if (
        props.scope === 'specific_variants' &&
        props.targetVariantIds?.length
      ) {
        await tx.insert(promotionVariantsTable).values(
          props.targetVariantIds.map((variantId) => ({
            promotionId: newRow.id,
            variantId,
          })),
        );
      }

      return this.toDomain(newRow, {
        targetCategoryIds: props.targetCategoryIds,
        targetCollectionIds: props.targetCollectionIds,
        targetBagIds: props.targetBagIds,
        targetVariantIds: props.targetVariantIds,
      });
    });
  }

  async update(promotion: Promotion): Promise<void> {
    const props = promotion.toPrimitives();
    await this.db
      .update(promotionsTable)
      .set({
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
      })
      .where(eq(promotionsTable.id, props.id));
  }

  async softDelete(id: string): Promise<void> {
    await this.db
      .update(promotionsTable)
      .set({
        deletedAt: new Date(),
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(promotionsTable.id, id));
  }

  async getCartItemsForEvaluation(
    cartId: string,
  ): Promise<CartEvaluationItem[]> {
    const items = await this.db.query.cartItemsTable.findMany({
      where: eq(cartItemsTable.cartId, cartId),
      with: {
        variant: {
          with: {
            bag: {
              with: {
                collections: true,
              },
            },
          },
        },
      },
    });

    return items.map((item) => ({
      cartItemId: item.id,
      quantity: item.quantity,
      evaluationItem: {
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
      },
    }));
  }

  async linkCouponToCart(cartId: string, promotionId: string): Promise<void> {
    await this.db
      .update(shoppingCartsTable)
      .set({ appliedCouponId: promotionId, updatedAt: new Date() })
      .where(eq(shoppingCartsTable.id, cartId));
  }
}
