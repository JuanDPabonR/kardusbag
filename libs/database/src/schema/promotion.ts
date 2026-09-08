// apps/kardusbag/src/db/schema/promotions.ts
import {
  pgTable,
  uuid,
  varchar,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  bagsTable,
  bagVariantsTable,
  categoriesTable,
  collectionsTable,
} from './bag';

export const discountTypeEnum = pgEnum('discount_type', [
  'percentage',
  'fixed_amount',
  'free_shipping',
]);

export const promotionScopeEnum = pgEnum('promotion_scope', [
  'global', // Toda la tienda / orden
  'categories', // Por categoriesTable.id
  'collections', // Por collectionsTable.id (vía bagsToCollectionsTable)
  'specific_bags', // Por bagsTable.id (matriz)
  'specific_variants', // Por bagVariantsTable.id (color o talla puntual)
  'attributes', // Por JSONB (material, laptop, impermeable)
]);

export const promotionsTable = pgTable(
  'promotions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: varchar('name', { length: 150 }).notNull(),
    // Si code es NULL -> Descuento automático de vitrina / catálogo
    // Si code tiene valor -> Cupón manual digitado por el usuario
    code: varchar('code', { length: 50 }).unique(),
    type: discountTypeEnum('type').notNull(),
    value: numeric('value', { precision: 10, scale: 2 }).notNull(),
    scope: promotionScopeEnum('scope').default('global').notNull(),

    attributeRules: jsonb('attribute_rules')
      .$type<{
        material?: string;
        isWaterResistant?: boolean;
        hasLaptopSleeve?: boolean;
        minLaptopInches?: number;
        colorNames?: string[];
      }>()
      .default({}),

    minOrderSubtotal: numeric('min_order_subtotal', {
      precision: 12,
      scale: 2,
    }).default('0.00'),
    maxDiscountAmount: numeric('max_discount_amount', {
      precision: 12,
      scale: 2,
    }),
    usageLimitTotal: integer('usage_limit_total'),
    usageLimitPerCustomer: integer('usage_limit_per_customer').default(1),
    currentUsageCount: integer('current_usage_count').default(0).notNull(),

    startsAt: timestamp('starts_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    isActive: boolean('is_active').default(true).notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [
    uniqueIndex('promotions_code_idx').on(t.code),
    index('promotions_is_active_idx').on(t.isActive),
    index('promotions_starts_ends_idx').on(t.startsAt, t.expiresAt),
    index('promotions_deleted_at_idx').on(t.deletedAt),
  ],
);

// Tablas pivote para scopes específicos
export const promotionCollectionsTable = pgTable(
  'promotion_collections',
  {
    promotionId: uuid('promotion_id')
      .notNull()
      .references(() => promotionsTable.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collectionsTable.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('prom_col_pk').on(t.promotionId, t.collectionId)],
);

export const promotionCategoriesTable = pgTable(
  'promotion_categories',
  {
    promotionId: uuid('promotion_id')
      .notNull()
      .references(() => promotionsTable.id, { onDelete: 'cascade' }),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categoriesTable.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('prom_cat_pk').on(t.promotionId, t.categoryId)],
);

export const promotionBagsTable = pgTable(
  'promotion_bags',
  {
    promotionId: uuid('promotion_id')
      .notNull()
      .references(() => promotionsTable.id, { onDelete: 'cascade' }),
    bagId: uuid('bag_id')
      .notNull()
      .references(() => bagsTable.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('prom_bag_pk').on(t.promotionId, t.bagId)],
);

export const promotionVariantsTable = pgTable(
  'promotion_variants',
  {
    promotionId: uuid('promotion_id')
      .notNull()
      .references(() => promotionsTable.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => bagVariantsTable.id, { onDelete: 'cascade' }),
  },
  (t) => [uniqueIndex('prom_var_pk').on(t.promotionId, t.variantId)],
);

// Relaciones Drizzle
export const promotionsRelations = relations(promotionsTable, ({ many }) => ({
  targetBags: many(promotionBagsTable),
  targetVariants: many(promotionVariantsTable),
  targetCategories: many(promotionCategoriesTable),
  targetCollections: many(promotionCollectionsTable),
}));
