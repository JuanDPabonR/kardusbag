import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =========================================================================
// 0. CONTROL DE ACCESO, USUARIOS Y ROLES (RBAC + CLERK)
// =========================================================================

// Catálogo de roles del sistema (ej: 'admin', 'customer', 'warehouse', 'support')
export const rolesTable = pgTable('roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 50 }).notNull().unique(), // 'admin', 'customer'
  description: varchar('description', { length: 255 }),
  isDefault: boolean('is_default').default(false).notNull(), // Marca el rol para nuevos registros
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Catálogo atómico de permisos del sistema (ej: 'product:create', 'order:update')
export const permissionsTable = pgTable('permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  slug: varchar('slug', { length: 100 }).notNull().unique(), // 'product:create'
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Tabla asociativa de relación muchos a muchos: Roles <-> Permisos
export const rolePermissionsTable = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'cascade' }),
    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissionsTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('role_permission_pk').on(table.roleId, table.permissionId),
  ],
);

// Usuarios del sistema vinculados a la identidad de Clerk
export const usersTable = pgTable(
  'users',
  {
    // ID único interno en nuestra base de datos (UUID)
    id: uuid('id').defaultRandom().primaryKey(),
    // ID emitido por Clerk que llega en el token (request.user.id / sub)
    clerkId: varchar('clerk_id', { length: 100 }).notNull().unique(),
    // Correo sincronizado con Clerk
    email: varchar('email', { length: 255 }).notNull().unique(),
    // Rol principal asignado al usuario
    roleId: uuid('role_id')
      .notNull()
      .references(() => rolesTable.id, { onDelete: 'restrict' }),
    // Interruptor de acceso al sistema
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Índice crítico: acelera la validación del Guard en cada petición HTTP
    uniqueIndex('users_clerk_id_idx').on(table.clerkId),
    index('users_role_id_idx').on(table.roleId),
  ],
);

// =========================================================================
// 1. ENUMS DEL SISTEMA (Consistencia total de estados de ciclo de vida)
// =========================================================================

export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment',
  'payment_failed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'approved',
  'rejected',
  'voided',
  'refunded',
]);

export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending',
  'label_generated',
  'picked_up',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'incident_in_delivery',
  'returned_to_sender',
]);

export const discountTypeEnum = pgEnum('discount_type', [
  'percentage',
  'fixed_amount',
  'free_shipping',
]);

export const addressTypeEnum = pgEnum('address_type', ['shipping', 'billing']);

// =========================================================================
// 2. TAXONOMÍA: CATEGORÍAS Y COLECCIONES
// =========================================================================

export const categoriesTable = pgTable('categories', {
  id: uuid('id').defaultRandom().primaryKey(),
  parentId: uuid('parent_id'),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  description: text('description'),
  imageUrl: text('image_url'),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const collectionsTable = pgTable('collections', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 150 }).notNull(),
  slug: varchar('slug', { length: 170 }).notNull().unique(),
  description: text('description'),
  bannerUrl: text('banner_url'),
  isActive: boolean('is_active').default(true).notNull(),
  startsAt: timestamp('starts_at', { withTimezone: true }),
  endsAt: timestamp('ends_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// =========================================================================
// 3. PRODUCTO PRINCIPAL (Concepto del Bolso)
// =========================================================================

export const bagsTable = pgTable(
  'bags',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    categoryId: uuid('category_id').references(() => categoriesTable.id, {
      onDelete: 'set null',
    }),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    skuPrefix: varchar('sku_prefix', { length: 50 }),
    description: text('description'),
    shortDescription: varchar('short_description', { length: 500 }),
    careInstructions: text('care_instructions'),
    basePrice: numeric('base_price', { precision: 12, scale: 2 }).notNull(),
    compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 })
      .default('19.00')
      .notNull(),
    currency: varchar('currency', { length: 3 }).default('COP').notNull(),
    material: varchar('material', { length: 150 }),
    liningMaterial: varchar('lining_material', { length: 150 }),
    hardwareMaterial: varchar('hardware_material', { length: 100 }),
    dimensions: jsonb('dimensions'),
    capacityLiters: numeric('capacity_liters', { precision: 5, scale: 2 }),
    weightGrams: integer('weight_grams').notNull().default(600),
    hasLaptopSleeve: boolean('has_laptop_sleeve').default(false).notNull(),
    maxLaptopSizeInches: numeric('max_laptop_size_inches', {
      precision: 3,
      scale: 1,
    }),
    isWaterResistant: boolean('is_water_resistant').default(false).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isFeatured: boolean('is_featured').default(false).notNull(),
    isNewArrival: boolean('is_new_arrival').default(false).notNull(),
    metaTitle: varchar('meta_title', { length: 150 }),
    metaDescription: varchar('meta_description', { length: 255 }),
    metadata: jsonb('metadata').default({}),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    index('bags_category_idx').on(table.categoryId),
    index('bags_is_active_idx').on(table.isActive),
    index('bags_slug_idx').on(table.slug),
  ],
);

export const bagsToCollectionsTable = pgTable(
  'bags_to_collections',
  {
    bagId: uuid('bag_id')
      .notNull()
      .references(() => bagsTable.id, { onDelete: 'cascade' }),
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collectionsTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    uniqueIndex('bag_collection_pk').on(table.bagId, table.collectionId),
  ],
);

// =========================================================================
// 4. VARIANTES Y CONTROL DE INVENTARIO FÍSICO
// =========================================================================

export const bagVariantsTable = pgTable(
  'bag_variants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bagId: uuid('bag_id')
      .notNull()
      .references(() => bagsTable.id, { onDelete: 'cascade' }),
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    barcode: varchar('barcode', { length: 50 }),
    colorName: varchar('color_name', { length: 80 }).notNull(),
    colorHex: varchar('color_hex', { length: 10 }),
    size: varchar('size', { length: 50 }).default('Único').notNull(),
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    costPrice: numeric('cost_price', { precision: 12, scale: 2 }),
    stockOnHand: integer('stock_on_hand').notNull().default(0),
    stockReserved: integer('stock_reserved').notNull().default(0),
    lowStockThreshold: integer('low_stock_threshold').default(3).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('variants_bag_id_idx').on(table.bagId),
    uniqueIndex('variants_sku_idx').on(table.sku),
  ],
);

export const stockReservationsTable = pgTable(
  'stock_reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => bagVariantsTable.id, { onDelete: 'cascade' }),
    cartId: uuid('cart_id').notNull(),
    quantity: integer('quantity').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('reservations_variant_id_idx').on(table.variantId),
    index('reservations_expires_at_idx').on(table.expiresAt),
  ],
);

// =========================================================================
// 5. IMÁGENES MULTIMEDIA
// =========================================================================

export const bagImagesTable = pgTable(
  'bag_images',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bagId: uuid('bag_id')
      .notNull()
      .references(() => bagsTable.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => bagVariantsTable.id, {
      onDelete: 'set null',
    }),
    url: text('url').notNull(),
    altText: varchar('alt_text', { length: 255 }),
    sortOrder: integer('sort_order').default(0).notNull(),
    isThumbnail: boolean('is_thumbnail').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('images_bag_id_idx').on(table.bagId),
    index('images_variant_id_idx').on(table.variantId),
  ],
);

// =========================================================================
// 6. CLIENTES, FACTURACIÓN Y DIRECCIONES
// =========================================================================

// Perfiles de clientes vinculados a la cuenta de usuario
export const customersTable = pgTable('customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  // Enlace opcional pero recomendado con usersTable
  userId: uuid('user_id').references(() => usersTable.id, {
    onDelete: 'set null',
  }),
  email: varchar('email', { length: 255 }).notNull().unique(),
  phone: varchar('phone', { length: 30 }),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  documentType: varchar('document_type', { length: 10 }).default('CC'),
  documentNumber: varchar('document_number', { length: 30 }),
  taxRegime: varchar('tax_regime', { length: 50 }),
  isAcceptsMarketing: boolean('is_accepts_marketing').default(false).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const customerAddressesTable = pgTable('customer_addresses', {
  id: uuid('id').defaultRandom().primaryKey(),
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customersTable.id, { onDelete: 'cascade' }),
  type: addressTypeEnum('type').default('shipping').notNull(),
  recipientName: varchar('recipient_name', { length: 200 }).notNull(),
  recipientPhone: varchar('recipient_phone', { length: 30 }).notNull(),
  addressLine1: varchar('address_line_1', { length: 255 }).notNull(),
  addressLine2: varchar('address_line_2', { length: 255 }),
  neighborhood: varchar('neighborhood', { length: 100 }),
  city: varchar('city', { length: 100 }).notNull(),
  department: varchar('department', { length: 100 }).notNull(),
  postalCode: varchar('postal_code', { length: 20 }),
  country: varchar('country', { length: 50 }).default('Colombia').notNull(),
  deliveryInstructions: text('delivery_instructions'),
  isDefault: boolean('is_default').default(false).notNull(),
});

// =========================================================================
// 7. MOTOR DE CUPONES Y DESCUENTOS
// =========================================================================

export const couponsTable = pgTable('coupons', {
  id: uuid('id').defaultRandom().primaryKey(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  type: discountTypeEnum('type').notNull(),
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  minOrderSubtotal: numeric('min_order_subtotal', { precision: 12, scale: 2 }),
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
});

// =========================================================================
// 8. CARRITO DE COMPRAS
// =========================================================================

export const shoppingCartsTable = pgTable('shopping_carts', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: varchar('session_id', { length: 255 }),
  customerId: uuid('customer_id').references(() => customersTable.id, {
    onDelete: 'cascade',
  }),
  appliedCouponId: uuid('applied_coupon_id').references(() => couponsTable.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const cartItemsTable = pgTable('cart_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  cartId: uuid('cart_id')
    .notNull()
    .references(() => shoppingCartsTable.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id')
    .notNull()
    .references(() => bagVariantsTable.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// =========================================================================
// 9. ÓRDENES, TRANSACCIONES Y BITÁCORA HISTÓRICA
// =========================================================================

export const ordersTable = pgTable(
  'orders',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    customerId: uuid('customer_id').references(() => customersTable.id, {
      onDelete: 'set null',
    }),
    shippingAddressId: uuid('shipping_address_id').references(
      () => customerAddressesTable.id,
      { onDelete: 'set null' },
    ),
    billingAddressId: uuid('billing_address_id').references(
      () => customerAddressesTable.id,
      { onDelete: 'set null' },
    ),
    couponId: uuid('coupon_id').references(() => couponsTable.id, {
      onDelete: 'set null',
    }),
    status: orderStatusEnum('status').default('pending_payment').notNull(),
    paymentStatus: paymentStatusEnum('payment_status')
      .default('pending')
      .notNull(),
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    taxTotal: numeric('tax_total', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    shippingFee: numeric('shipping_fee', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    discountTotal: numeric('discount_total', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    currency: varchar('currency', { length: 3 }).default('COP').notNull(),
    customerNotes: text('customer_notes'),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index('orders_customer_idx').on(table.customerId),
    index('orders_status_idx').on(table.status),
  ],
);

export const orderItemsTable = pgTable('order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  variantId: uuid('variant_id').references(() => bagVariantsTable.id, {
    onDelete: 'set null',
  }),
  productNameSnapshot: varchar('product_name_snapshot', {
    length: 255,
  }).notNull(),
  variantDescriptionSnapshot: varchar('variant_desc_snapshot', { length: 150 }),
  skuSnapshot: varchar('sku_snapshot', { length: 100 }).notNull(),
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 })
    .default('0.00')
    .notNull(),
  quantity: integer('quantity').notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
});

export const paymentTransactionsTable = pgTable('payment_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  gateway: varchar('gateway', { length: 50 }).notNull(),
  gatewayTransactionId: varchar('gateway_tx_id', { length: 255 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  status: paymentStatusEnum('status').notNull(),
  gatewayResponseRaw: jsonb('gateway_response_raw'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orderTimelineEventsTable = pgTable('order_timeline_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  actor: varchar('actor', { length: 100 }).notNull(),
  event: varchar('event', { length: 100 }).notNull(),
  message: text('message'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// =========================================================================
// 10. ENVÍOS Y LOGÍSTICA
// =========================================================================

export const shipmentsTable = pgTable('shipments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  carrier: varchar('carrier', { length: 100 }).notNull(),
  trackingNumber: varchar('tracking_number', { length: 100 }).notNull(),
  trackingUrl: text('tracking_url'),
  status: shipmentStatusEnum('status').default('pending').notNull(),
  shippingLabelUrl: text('shipping_label_url'),
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// =========================================================================
// 11. RESEÑAS VERIFICADAS Y FEEDBACK
// =========================================================================

export const reviewsTable = pgTable(
  'reviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    bagId: uuid('bag_id')
      .notNull()
      .references(() => bagsTable.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customersTable.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id').references(() => ordersTable.id, {
      onDelete: 'set null',
    }),
    isVerifiedPurchase: boolean('is_verified_purchase')
      .default(false)
      .notNull(),
    rating: integer('rating').notNull(),
    title: varchar('title', { length: 150 }),
    comment: text('comment'),
    isApproved: boolean('is_approved').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('reviews_bag_idx').on(table.bagId)],
);

// =========================================================================
// 12. RELACIONES DRIZZLE ORM
// =========================================================================

export const usersRelations = relations(usersTable, ({ one }) => ({
  role: one(rolesTable, {
    fields: [usersTable.roleId],
    references: [rolesTable.id],
  }),
  customer: one(customersTable, {
    fields: [usersTable.id],
    references: [customersTable.userId],
  }),
}));

export const rolesRelations = relations(rolesTable, ({ many }) => ({
  users: many(usersTable),
  rolePermissions: many(rolePermissionsTable),
}));

export const permissionsRelations = relations(permissionsTable, ({ many }) => ({
  rolePermissions: many(rolePermissionsTable),
}));

export const rolePermissionsRelations = relations(
  rolePermissionsTable,
  ({ one }) => ({
    role: one(rolesTable, {
      fields: [rolePermissionsTable.roleId],
      references: [rolesTable.id],
    }),
    permission: one(permissionsTable, {
      fields: [rolePermissionsTable.permissionId],
      references: [permissionsTable.id],
    }),
  }),
);

export const customersRelations = relations(
  customersTable,
  ({ one, many }) => ({
    user: one(usersTable, {
      fields: [customersTable.userId],
      references: [usersTable.id],
    }),
    addresses: many(customerAddressesTable),
    orders: many(ordersTable),
    reviews: many(reviewsTable),
  }),
);

export const bagsRelations = relations(bagsTable, ({ one, many }) => ({
  category: one(categoriesTable, {
    fields: [bagsTable.categoryId],
    references: [categoriesTable.id],
  }),
  variants: many(bagVariantsTable),
  images: many(bagImagesTable),
  reviews: many(reviewsTable),
  collections: many(bagsToCollectionsTable),
}));

export const bagVariantsRelations = relations(
  bagVariantsTable,
  ({ one, many }) => ({
    bag: one(bagsTable, {
      fields: [bagVariantsTable.bagId],
      references: [bagsTable.id],
    }),
    images: many(bagImagesTable),
    reservations: many(stockReservationsTable),
    cartItems: many(cartItemsTable),
    orderItems: many(orderItemsTable),
  }),
);

export const ordersRelations = relations(ordersTable, ({ one, many }) => ({
  customer: one(customersTable, {
    fields: [ordersTable.customerId],
    references: [customersTable.id],
  }),
  shippingAddress: one(customerAddressesTable, {
    fields: [ordersTable.shippingAddressId],
    references: [customerAddressesTable.id],
  }),
  billingAddress: one(customerAddressesTable, {
    fields: [ordersTable.billingAddressId],
    references: [customerAddressesTable.id],
  }),
  items: many(orderItemsTable),
  transactions: many(paymentTransactionsTable),
  timeline: many(orderTimelineEventsTable),
  shipment: one(shipmentsTable, {
    fields: [ordersTable.id],
    references: [shipmentsTable.orderId],
  }),
}));
