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
// 1. ENUMS DEL SISTEMA (Consistencia total de estados de ciclo de vida)
// =========================================================================

// Controla las etapas comerciales y operativas del pedido completo
export const orderStatusEnum = pgEnum('order_status', [
  'pending_payment', // Pedido creado en checkout; esperando respuesta de pasarela
  'payment_failed', // Pasarela reportó cobro declinado o fondos insuficientes
  'processing', // Pago confirmado; pedido en bodega para picking y embalaje
  'shipped', // Pedido rotulado y entregado a la transportadora
  'delivered', // Cliente recibió el paquete a satisfacción
  'cancelled', // Cancelado por el cliente, falta de pago o falta de stock
  'refunded', // Fondos devueltos total o parcialmente al cliente
]);

// Registra la confirmación monetaria devuelta por la pasarela de pago
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending', // Transacción enviada a validar por el banco/red
  'approved', // Fondos capturados exitosamente en la cuenta recaudadora
  'rejected', // Transacción rechazada por prevención de fraude o saldo
  'voided', // Autorización anulada antes de efectuar la captura
  'refunded', // Reembolso procesado a través de la pasarela
]);

// Rastreo granular de la guía de la transportadora logística
export const shipmentStatusEnum = pgEnum('shipment_status', [
  'pending', // Esperando que bodega genere la remesa
  'label_generated', // Guía generada e impresa en bodega
  'picked_up', // Paquete recolectado por el vehículo de la transportadora
  'in_transit', // En ruta entre centros logísticos de distribución
  'out_for_delivery', // En la camioneta/moto del mensajero hacia el domicilio
  'delivered', // Entregado al destinatario final
  'incident_in_delivery', // Intento fallido (dirección errónea, destinatario ausente)
  'returned_to_sender', // Paquete devuelto al remitente por imposibilidad de entrega
]);

// Define la mecánica matemática de aplicación de un cupón
export const discountTypeEnum = pgEnum('discount_type', [
  'percentage', // Aplica descuento porcentual sobre el subtotal (ej: 15%)
  'fixed_amount', // Resta un importe monetario fijo (ej: $30.000 COP)
  'free_shipping', // Exonera el cobro de la tarifa de transporte
]);

// Clasifica el propósito de la dirección guardada por el cliente
export const addressTypeEnum = pgEnum('address_type', [
  'shipping', // Domicilio físico donde se entrega el paquete
  'billing', // Dirección fiscal asociada a la factura de venta
]);

// =========================================================================
// 2. TAXONOMÍA: CATEGORÍAS Y COLECCIONES
// =========================================================================

// Categorización jerárquica para menús y filtros de navegación
export const categoriesTable = pgTable('categories', {
  // Identificador único de la categoría
  id: uuid('id').defaultRandom().primaryKey(),
  // Referencia a categoría padre para soportar subcategorías (ej: Bolsos -> Mochilas)
  parentId: uuid('parent_id'),
  // Nombre público de la categoría (ej: "Mochilas Ejecutivas")
  name: varchar('name', { length: 100 }).notNull(),
  // Identificador amigable para URL (ej: "mochilas-ejecutivas")
  slug: varchar('slug', { length: 120 }).notNull().unique(),
  // Explicación descriptiva para SEO y cabecera de la sección
  description: text('description'),
  // Imagen de portada o banner representativo de la categoría
  imageUrl: text('image_url'),
  // Posición numérica para ordenar los botones en el menú principal
  sortOrder: integer('sort_order').default(0).notNull(),
  // Switch para mostrar u ocultar la categoría en la tienda
  isActive: boolean('is_active').default(true).notNull(),
  // Fecha y hora en que se creó la categoría
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Agrupaciones transversales y promocionales de productos
export const collectionsTable = pgTable('collections', {
  // Identificador único de la colección
  id: uuid('id').defaultRandom().primaryKey(),
  // Título de la campaña o edición (ej: "Colección Cuero Vintage 2026")
  name: varchar('name', { length: 150 }).notNull(),
  // URL amigable de la campaña (ej: "cuero-vintage-2026")
  slug: varchar('slug', { length: 170 }).notNull().unique(),
  // Texto narrativo o concepto de diseño de la colección
  description: text('description'),
  // Banner publicitario principal de la campaña
  bannerUrl: text('banner_url'),
  // Determina si la colección se muestra al público
  isActive: boolean('is_active').default(true).notNull(),
  // Fecha opcional de inicio de publicación automática
  startsAt: timestamp('starts_at', { withTimezone: true }),
  // Fecha opcional de finalización y retiro de campaña
  endsAt: timestamp('ends_at', { withTimezone: true }),
  // Fecha de registro de la colección
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// =========================================================================
// 3. PRODUCTO PRINCIPAL (Concepto del Bolso)
// =========================================================================

// Entidad raíz del bolso (concentra datos conceptuales e invariables)
export const bagsTable = pgTable(
  'bags',
  {
    // Identificador único del bolso
    id: uuid('id').defaultRandom().primaryKey(),
    // Llave foránea que enlaza la categoría asignada
    categoryId: uuid('category_id').references(() => categoriesTable.id, {
      onDelete: 'set null',
    }),
    // Nombre comercial general del bolso (ej: "Mochila Urbana Kardus")
    name: varchar('name', { length: 255 }).notNull(),
    // Slug único para posicionamiento web y rutas del frontend (ej: "mochila-urbana-kardus")
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    // Prefijo base para generar los códigos de inventario de sus variantes (ej: "KB-URB")
    skuPrefix: varchar('sku_prefix', { length: 50 }),
    // Descripción completa detallando confección, bolsillos y beneficios
    description: text('description'),
    // Resumen breve para tarjetas de catálogo, meta tags y WhatsApp previews
    shortDescription: varchar('short_description', { length: 500 }),
    // Manual de recomendaciones de limpieza y preservación del material
    careInstructions: text('care_instructions'),

    // Precio sugerido o base visible en tarjetas de listado
    basePrice: numeric('base_price', { precision: 12, scale: 2 }).notNull(),
    // Precio tachado de referencia para mostrar ofertas en vitrina
    compareAtPrice: numeric('compare_at_price', { precision: 12, scale: 2 }),
    // Porcentaje de impuesto al valor agregado aplicado al artículo (ej: 19.00%)
    taxRate: numeric('tax_rate', { precision: 5, scale: 2 })
      .default('19.00')
      .notNull(),
    // Código ISO monetario estándar de la transacción (ej: COP, USD)
    currency: varchar('currency', { length: 3 }).default('COP').notNull(),

    // Composición textil exterior (ej: "Lona encerada de algodón 100%")
    material: varchar('material', { length: 150 }),
    // Composición textil interna (ej: "Poliéster impermeable de alta densidad")
    liningMaterial: varchar('lining_material', { length: 150 }),
    // Especificación de herrajes (ej: "Cremalleras metálicas YKK y hebillas de latón")
    hardwareMaterial: varchar('hardware_material', { length: 100 }),
    // Estructura volumétrica en JSON: { height: 45, width: 30, depth: 15, unit: "cm" }
    dimensions: jsonb('dimensions'),
    // Volumen interior útil expresado en litros
    capacityLiters: numeric('capacity_liters', { precision: 5, scale: 2 }),
    // Masa física en gramos requerida por las APIs de transporte para cotizar el flete
    weightGrams: integer('weight_grams').notNull().default(600),

    // Indicador booleano de compartimento acolchado para computadora portátil
    hasLaptopSleeve: boolean('has_laptop_sleeve').default(false).notNull(),
    // Dimensión diagonal máxima admitida para portátiles (ej: 15.6)
    maxLaptopSizeInches: numeric('max_laptop_size_inches', {
      precision: 3,
      scale: 1,
    }),
    // Indicador booleano de resistencia a salpicaduras o repelencia al agua
    isWaterResistant: boolean('is_water_resistant').default(false).notNull(),

    // Visibilidad del bolso en la tienda pública
    isActive: boolean('is_active').default(true).notNull(),
    // Bandera para destacar el bolso en el home o carruseles principales
    isFeatured: boolean('is_featured').default(false).notNull(),
    // Etiqueta visual de nuevo lanzamiento en el catálogo
    isNewArrival: boolean('is_new_arrival').default(false).notNull(),
    // Título SEO personalizado para la etiqueta <title> en motores de búsqueda
    metaTitle: varchar('meta_title', { length: 150 }),
    // Descripción SEO personalizada para el tag meta description
    metaDescription: varchar('meta_description', { length: 255 }),

    // Almacén de atributos flexibles sin alterar el esquema (etiquetas, tags de temporada)
    metadata: jsonb('metadata').default({}),
    // Fecha de inserción inicial del registro
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Fecha de la última modificación en base de datos
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Fecha de eliminación lógica (Soft Delete) para preservar órdenes históricas
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    // Optimiza búsquedas y filtrados de productos por categoría
    index('bags_category_idx').on(table.categoryId),
    // Acelera la consulta de productos activos para la vitrina pública
    index('bags_is_active_idx').on(table.isActive),
    // Acceso instantáneo a la ficha del producto mediante la URL
    index('bags_slug_idx').on(table.slug),
  ],
);

// Tabla asociativa de relación muchos a muchos entre Bolsos y Colecciones
export const bagsToCollectionsTable = pgTable(
  'bags_to_collections',
  {
    // Clave foránea referenciando el bolso asociado
    bagId: uuid('bag_id')
      .notNull()
      .references(() => bagsTable.id, { onDelete: 'cascade' }),
    // Clave foránea referenciando la colección asociada
    collectionId: uuid('collection_id')
      .notNull()
      .references(() => collectionsTable.id, { onDelete: 'cascade' }),
  },
  (table) => [
    // Impide asociar dos veces el mismo bolso a una idéntica colección
    uniqueIndex('bag_collection_pk').on(table.bagId, table.collectionId),
  ],
);

// =========================================================================
// 4. VARIANTES Y CONTROL DE INVENTARIO FÍSICO
// =========================================================================

// Almacena las versiones físicas reales vendibles (color, tamaño, inventario)
export const bagVariantsTable = pgTable(
  'bag_variants',
  {
    // Identificador único de la variante física
    id: uuid('id').defaultRandom().primaryKey(),
    // Bolso matriz al que pertenece la variante
    bagId: uuid('bag_id')
      .notNull()
      .references(() => bagsTable.id, { onDelete: 'cascade' }),
    // Código de referencia de stock único universal (ej: "KB-URB-BLK-01")
    sku: varchar('sku', { length: 100 }).notNull().unique(),
    // Código de barras legible por escáner de bodega (EAN-13 o UPC)
    barcode: varchar('barcode', { length: 50 }),
    // Denominación comercial del color (ej: "Negro Mate", "Caramelo", "Verde Militar")
    colorName: varchar('color_name', { length: 80 }).notNull(),
    // Código hexadecimal para pintar el selector circular en la interfaz (ej: "#1A1A1A")
    colorHex: varchar('color_hex', { length: 10 }),
    // Talla o capacidad volumétrica específica de la variante (ej: "Único", "M", "L")
    size: varchar('size', { length: 50 }).default('Único').notNull(),

    // Precio final de venta específico de esta variante
    price: numeric('price', { precision: 12, scale: 2 }).notNull(),
    // Costo de compra o producción para calcular reportes internos de margen operativo
    costPrice: numeric('cost_price', { precision: 12, scale: 2 }),

    // Unidades reales ubicadas físicamente en los estantes de bodega
    stockOnHand: integer('stock_on_hand').notNull().default(0),
    // Unidades retenidas provisionalmente por checkouts activos no pagados
    stockReserved: integer('stock_reserved').notNull().default(0),
    // Umbral mínimo para detonar alertas internas de reabastecimiento urgente
    lowStockThreshold: integer('low_stock_threshold').default(3).notNull(),

    // Habilita la compra activa de esta variante en particular
    isActive: boolean('is_active').default(true).notNull(),
    // Fecha de creación de la variante
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Fecha de última actualización de inventario o precio
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Agiliza traer todas las variantes pertenecientes a un bolso específico
    index('variants_bag_id_idx').on(table.bagId),
    // Búsqueda instantánea al escanear o buscar por código SKU
    uniqueIndex('variants_sku_idx').on(table.sku),
  ],
);

// Bloqueo provisional de inventario para evitar ventas simultáneas (Race Conditions)
export const stockReservationsTable = pgTable(
  'stock_reservations',
  {
    // Identificador único del bloqueo de stock
    id: uuid('id').defaultRandom().primaryKey(),
    // Variante de bolso retenida
    variantId: uuid('variant_id')
      .notNull()
      .references(() => bagVariantsTable.id, { onDelete: 'cascade' }),
    // Carrito de compras que originó la reserva
    cartId: uuid('cart_id').notNull(),
    // Número de unidades apartadas
    quantity: integer('quantity').notNull(),
    // Momento en que expira la reserva (ej: 15 min) para devolver el stock si no se pagó
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    // Instante en que se generó la reserva
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Acelera la verificación de disponibilidad por variante
    index('reservations_variant_id_idx').on(table.variantId),
    // Permite que un cron job encuentre rápidamente reservas vencidas para liberarlas
    index('reservations_expires_at_idx').on(table.expiresAt),
  ],
);

// =========================================================================
// 5. IMÁGENES MULTIMEDIA
// =========================================================================

// Galería fotográfica organizada por producto y color
export const bagImagesTable = pgTable(
  'bag_images',
  {
    // Identificador único de la fotografía
    id: uuid('id').defaultRandom().primaryKey(),
    // Bolso al que pertenece la imagen
    bagId: uuid('bag_id')
      .notNull()
      .references(() => bagsTable.id, { onDelete: 'cascade' }),
    // Variante opcional vinculada (permite cambiar la foto según el color seleccionado)
    variantId: uuid('variant_id').references(() => bagVariantsTable.id, {
      onDelete: 'set null',
    }),
    // Enlace público al CDN o bucket S3 de almacenamiento de la imagen
    url: text('url').notNull(),
    // Texto descriptivo accesible para lectores de pantalla e indexación SEO
    altText: varchar('alt_text', { length: 255 }),
    // Posición en la galería (0 indica que es la foto principal o portada)
    sortOrder: integer('sort_order').default(0).notNull(),
    // Bandera para usar como foto miniatura en listados rápidos y carritos
    isThumbnail: boolean('is_thumbnail').default(false).notNull(),
    // Fecha de carga del archivo
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Acelera la carga de la galería de un bolso
    index('images_bag_id_idx').on(table.bagId),
    // Filtra las fotos exclusivas del color que el cliente tiene seleccionado
    index('images_variant_id_idx').on(table.variantId),
  ],
);

// =========================================================================
// 6. CLIENTES, FACTURACIÓN Y DIRECCIONES
// =========================================================================

// Registro de perfiles de clientes de la tienda
export const customersTable = pgTable('customers', {
  // Identificador único del cliente
  id: uuid('id').defaultRandom().primaryKey(),
  // Correo electrónico utilizado para login y notificaciones transaccionales
  email: varchar('email', { length: 255 }).notNull().unique(),
  // Número de teléfono o móvil para contacto de entrega
  phone: varchar('phone', { length: 30 }),
  // Nombre de pila del cliente
  firstName: varchar('first_name', { length: 100 }).notNull(),
  // Apellidos del cliente
  lastName: varchar('last_name', { length: 100 }).notNull(),

  // Documento de identidad tributario (requerido para facturación electrónica)
  documentType: varchar('document_type', { length: 10 }).default('CC'),
  // Número de identificación tributaria (ej: Cédula o NIT)
  documentNumber: varchar('document_number', { length: 30 }),
  // Régimen fiscal del comprador (ej: Persona Natural, Responsable de IVA)
  taxRegime: varchar('tax_regime', { length: 50 }),

  // Consentimiento explícito para envío de promociones y boletines por correo
  isAcceptsMarketing: boolean('is_accepts_marketing').default(false).notNull(),
  // Fecha de registro en la plataforma
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Libreta de direcciones de envío y facturación guardadas por cada usuario
export const customerAddressesTable = pgTable('customer_addresses', {
  // Identificador de la dirección
  id: uuid('id').defaultRandom().primaryKey(),
  // Cliente propietario de esta dirección
  customerId: uuid('customer_id')
    .notNull()
    .references(() => customersTable.id, { onDelete: 'cascade' }),
  // Destino funcional de la dirección: 'shipping' o 'billing'
  type: addressTypeEnum('type').default('shipping').notNull(),
  // Nombre de la persona autorizada para recibir el paquete en la puerta
  recipientName: varchar('recipient_name', { length: 200 }).notNull(),
  // Teléfono directo del destinatario para que el mensajero llame al llegar
  recipientPhone: varchar('recipient_phone', { length: 30 }).notNull(),
  // Dirección principal con nomenclatura vial (ej: "Calle 10 # 43E - 20")
  addressLine1: varchar('address_line_1', { length: 255 }).notNull(),
  // Complemento de la ubicación física (ej: "Apto 502, Torre 3, Edificio Prisma")
  addressLine2: varchar('address_line_2', { length: 255 }),
  // Barrio o sector urbano (clave para enrutamiento de transportadoras)
  neighborhood: varchar('neighborhood', { length: 100 }),
  // Municipio o ciudad de destino (ej: "Bello", "Medellín", "Bogotá")
  city: varchar('city', { length: 100 }).notNull(),
  // Departamento, provincia o estado (ej: "Antioquia", "Cundinamarca")
  department: varchar('department', { length: 100 }).notNull(),
  // Código postal oficial de la zona
  postalCode: varchar('postal_code', { length: 20 }),
  // País de destino del despacho
  country: varchar('country', { length: 50 }).default('Colombia').notNull(),
  // Indicaciones adicionales para el repartidor (ej: "Dejar en portería si no responden")
  deliveryInstructions: text('delivery_instructions'),
  // Marca para precargar automáticamente esta dirección en futuros checkouts
  isDefault: boolean('is_default').default(false).notNull(),
});

// =========================================================================
// 7. MOTOR DE CUPONES Y DESCUENTOS
// =========================================================================

// Sistema de cupones promocionales con validación estricta
export const couponsTable = pgTable('coupons', {
  // Identificador interno del cupón
  id: uuid('id').defaultRandom().primaryKey(),
  // Código alfanumérico que el usuario escribe en checkout (ej: "LANZAMIENTO15")
  code: varchar('code', { length: 50 }).notNull().unique(),
  // Tipo de rebaja: 'percentage', 'fixed_amount' o 'free_shipping'
  type: discountTypeEnum('type').notNull(),
  // Magnitud del descuento: valor porcentual (15.00) o monto fijo en moneda
  value: numeric('value', { precision: 10, scale: 2 }).notNull(),
  // Subtotal mínimo exigido en el carrito para que el cupón sea válido
  minOrderSubtotal: numeric('min_order_subtotal', { precision: 12, scale: 2 }),
  // Límite monetario máximo de descuento cuando se usa porcentaje
  maxDiscountAmount: numeric('max_discount_amount', {
    precision: 12,
    scale: 2,
  }),
  // Número máximo de canjes permitidos en toda la tienda (ej: primeros 100 usos)
  usageLimitTotal: integer('usage_limit_total'),
  // Límite de veces que un mismo cliente puede canjear el cupón
  usageLimitPerCustomer: integer('usage_limit_per_customer').default(1),
  // Contador acumulativo de canjes exitosos realizados
  currentUsageCount: integer('current_usage_count').default(0).notNull(),
  // Fecha a partir de la cual entra en vigencia el cupón
  startsAt: timestamp('starts_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  // Fecha límite de vencimiento de la promoción
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  // Control manual para desactivar el cupón de inmediato
  isActive: boolean('is_active').default(true).notNull(),
});

// =========================================================================
// 8. CARRITO DE COMPRAS (Soporte Híbrido: Invitados y Usuarios)
// =========================================================================

// Carrito persistente utilizable con o sin inicio de sesión previo
export const shoppingCartsTable = pgTable('shopping_carts', {
  // Identificador único del carrito
  id: uuid('id').defaultRandom().primaryKey(),
  // Hash único en cookie para usuarios anónimos o invitados no registrados
  sessionId: varchar('session_id', { length: 255 }),
  // Enlace al perfil cuando el usuario inicia sesión (permite fusionar carritos)
  customerId: uuid('customer_id').references(() => customersTable.id, {
    onDelete: 'cascade',
  }),
  // Cupón promocional aplicado tentativamente en la sesión de compra
  appliedCouponId: uuid('applied_coupon_id').references(() => couponsTable.id, {
    onDelete: 'set null',
  }),
  // Fecha de inicio de navegación con el carrito
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
  // Última vez que se agregaron o retiraron artículos del carrito
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Artículos contenidos dentro del carrito de compras activo
export const cartItemsTable = pgTable('cart_items', {
  // Identificador de la fila del ítem
  id: uuid('id').defaultRandom().primaryKey(),
  // Carrito de compras que contiene el producto
  cartId: uuid('cart_id')
    .notNull()
    .references(() => shoppingCartsTable.id, { onDelete: 'cascade' }),
  // Variante específica de bolso seleccionada (con color y tamaño exacto)
  variantId: uuid('variant_id')
    .notNull()
    .references(() => bagVariantsTable.id, { onDelete: 'cascade' }),
  // Cantidad de unidades solicitadas de esta variante
  quantity: integer('quantity').notNull().default(1),
  // Fecha en que se añadió el artículo
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// =========================================================================
// 9. ÓRDENES, TRANSACCIONES Y BITÁCORA HISTÓRICA
// =========================================================================

// Cabecera principal del pedido consolidado
export const ordersTable = pgTable(
  'orders',
  {
    // Identificador único del pedido
    id: uuid('id').defaultRandom().primaryKey(),
    // Código de orden secuencial y amigable para el cliente (ej: "KB-2026-0001")
    orderNumber: varchar('order_number', { length: 50 }).notNull().unique(),
    // Cliente que realizó la compra (opcional para checkouts de invitados)
    customerId: uuid('customer_id').references(() => customersTable.id, {
      onDelete: 'set null',
    }),
    // Dirección física donde debe entregarse el pedido
    shippingAddressId: uuid('shipping_address_id').references(
      () => customerAddressesTable.id,
      { onDelete: 'set null' },
    ),
    // Dirección asociada al titular para emisión de factura
    billingAddressId: uuid('billing_address_id').references(
      () => customerAddressesTable.id,
      { onDelete: 'set null' },
    ),
    // Cupón que se redimió en esta orden
    couponId: uuid('coupon_id').references(() => couponsTable.id, {
      onDelete: 'set null',
    }),

    // Estado operativo actual de la orden en el embudo de despacho
    status: orderStatusEnum('status').default('pending_payment').notNull(),
    // Estado financiero actual del pago
    paymentStatus: paymentStatusEnum('payment_status')
      .default('pending')
      .notNull(),

    // Suma bruta de precios base de los productos antes de impuestos y fletes
    subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
    // Valor total consolidado correspondiente a impuestos (ej: IVA 19%)
    taxTotal: numeric('tax_total', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    // Tarifa final cobrada al comprador por el envío logístico
    shippingFee: numeric('shipping_fee', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    // Valor monetario restado mediante cupones o promociones aplicadas
    discountTotal: numeric('discount_total', { precision: 12, scale: 2 })
      .default('0.00')
      .notNull(),
    // Total definitivo a pagar por el cliente (Subtotal + IVA + Envío - Descuentos)
    totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
    // Moneda utilizada para toda la transacción
    currency: varchar('currency', { length: 3 }).default('COP').notNull(),

    // Instrucciones o comentarios dejados por el comprador al ordenar
    customerNotes: text('customer_notes'),
    // Fecha y hora exacta de creación de la orden
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
    // Fecha y hora del último cambio de estado
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Búsqueda ágil de todos los pedidos asociados a un cliente
    index('orders_customer_idx').on(table.customerId),
    // Filtro por estado para el panel administrativo (ej: pedidos 'processing' para bodega)
    index('orders_status_idx').on(table.status),
  ],
);

// Desglose congelado de artículos comprados (Snapshot inmutable ante cambios futuros)
export const orderItemsTable = pgTable('order_items', {
  // Identificador único de la línea de detalle
  id: uuid('id').defaultRandom().primaryKey(),
  // Orden a la que pertenece este producto
  orderId: uuid('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  // Variante original vinculada (puede ser null si la variante se borra a futuro)
  variantId: uuid('variant_id').references(() => bagVariantsTable.id, {
    onDelete: 'set null',
  }),

  // Copia exacta del nombre del producto al momento de comprar (auditoría fiscal)
  productNameSnapshot: varchar('product_name_snapshot', {
    length: 255,
  }).notNull(),
  // Copia exacta de los atributos físicos (ej: "Color: Caramelo / Cuero Genuino")
  variantDescriptionSnapshot: varchar('variant_desc_snapshot', { length: 150 }),
  // Copia congelada del SKU vigente en la fecha de la venta
  skuSnapshot: varchar('sku_snapshot', { length: 100 }).notNull(),
  // Precio unitario cobrado al momento de comprar (inmutable a alzas futuras de precio)
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  // Impuesto exacto calculado por cada unidad vendida
  taxAmount: numeric('tax_amount', { precision: 12, scale: 2 })
    .default('0.00')
    .notNull(),
  // Número de unidades adquiridas
  quantity: integer('quantity').notNull(),
  // Subtotal de la línea (unitPrice * quantity)
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).notNull(),
});

// Registro de intentos y cobros emitidos por pasarelas (Wompi, Mercado Pago, Bold, Addi, Stripe)
export const paymentTransactionsTable = pgTable('payment_transactions', {
  // Identificador único del registro de pago
  id: uuid('id').defaultRandom().primaryKey(),
  // Orden comercial vinculada a la transacción
  orderId: uuid('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  // Nombre de la entidad procesadora del cobro (ej: "wompi", "mercadopago")
  gateway: varchar('gateway', { length: 50 }).notNull(),
  // ID de cobro o autorización devuelto por el procesador externo
  gatewayTransactionId: varchar('gateway_tx_id', { length: 255 }).notNull(),
  // Canal monetario utilizado por el cliente (ej: "pse", "card", "bancolombia_transfer")
  paymentMethod: varchar('payment_method', { length: 50 }),
  // Monto cobrado reportado por la pasarela
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  // Estado final de la transacción de pago
  status: paymentStatusEnum('status').notNull(),
  // Copia cruda del cuerpo del webhook o payload recibido de la pasarela para auditoría forense
  gatewayResponseRaw: jsonb('gateway_response_raw'),
  // Fecha en que se registró el intento o cobro
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// Bitácora cronológica de eventos de la orden (auditoría operativa y soporte técnico)
export const orderTimelineEventsTable = pgTable('order_timeline_events', {
  // Identificador del evento
  id: uuid('id').defaultRandom().primaryKey(),
  // Orden afectada por la acción
  orderId: uuid('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  // Responsable que disparó la acción (ej: 'system_webhook', 'admin_support', 'customer')
  actor: varchar('actor', { length: 100 }).notNull(),
  // Tipo técnico de suceso (ej: 'payment_approved', 'shipping_label_printed', 'order_cancelled')
  event: varchar('event', { length: 100 }).notNull(),
  // Explicación humana o motivo del cambio para revisión interna
  message: text('message'),
  // Momento en que ocurrió el suceso
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// =========================================================================
// 10. ENVÍOS Y LOGÍSTICA
// =========================================================================

// Información de despacho, transportadora y remesas de entrega
export const shipmentsTable = pgTable('shipments', {
  // Identificador único del envío
  id: uuid('id').defaultRandom().primaryKey(),
  // Pedido que contiene los productos despachados
  orderId: uuid('order_id')
    .notNull()
    .references(() => ordersTable.id, { onDelete: 'cascade' }),
  // Empresa encargada de la distribución (ej: "Coordinadora", "Inter Rapidísimo", "Servientrega")
  carrier: varchar('carrier', { length: 100 }).notNull(),
  // Número de guía de transporte asignado por la empresa de mensajería
  trackingNumber: varchar('tracking_number', { length: 100 }).notNull(),
  // Enlace web público para que el cliente consulte el tracking en vivo
  trackingUrl: text('tracking_url'),
  // Estado logístico del paquete reportado por la transportadora
  status: shipmentStatusEnum('status').default('pending').notNull(),
  // URL o enlace al PDF de la etiqueta/rótulo de envío para imprimir en bodega
  shippingLabelUrl: text('shipping_label_url'),
  // Fecha y hora en que la transportadora recolectó el paquete
  shippedAt: timestamp('shipped_at', { withTimezone: true }),
  // Fecha y hora en que se confirmó la entrega física en destino
  deliveredAt: timestamp('delivered_at', { withTimezone: true }),
  // Fecha de registro del despacho en el sistema
  createdAt: timestamp('created_at', { withTimezone: true })
    .defaultNow()
    .notNull(),
});

// =========================================================================
// 11. RESEÑAS VERIFICADAS Y FEEDBACK
// =========================================================================

// Calificaciones y opiniones de clientes sobre los bolsos
export const reviewsTable = pgTable(
  'reviews',
  {
    // Identificador único de la reseña
    id: uuid('id').defaultRandom().primaryKey(),
    // Bolso que está siendo calificado
    bagId: uuid('bag_id')
      .notNull()
      .references(() => bagsTable.id, { onDelete: 'cascade' }),
    // Cliente que escribió la reseña
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customersTable.id, { onDelete: 'cascade' }),
    // Orden asociada para validar si el usuario compró legalmente el artículo
    orderId: uuid('order_id').references(() => ordersTable.id, {
      onDelete: 'set null',
    }),
    // Insignia de credibilidad que confirma si la opinión viene de una compra confirmada
    isVerifiedPurchase: boolean('is_verified_purchase')
      .default(false)
      .notNull(),
    // Calificación numérica en estrellas (del 1 al 5)
    rating: integer('rating').notNull(),
    // Título o resumen de la reseña del comprador (ej: "¡Excelente calidad del cuero!")
    title: varchar('title', { length: 150 }),
    // Comentario detallado del cliente sobre el uso y acabados del bolso
    comment: text('comment'),
    // Switch de moderación para aprobar la reseña antes de publicarla en el catálogo
    isApproved: boolean('is_approved').default(false).notNull(),
    // Fecha y hora en que el cliente publicó su calificación
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    // Acelera la consulta de opiniones para la página de detalle del bolso
    index('reviews_bag_idx').on(table.bagId),
  ],
);

// =========================================================================
// 12. RELACIONES DE DRIZZLE ORM (Mapeo relacional de alto nivel)
// =========================================================================

// Configuración relacional para consultas anidadas automáticas (db.query)
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
