import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  createdAt: integer('created_at').notNull(),
});

export const products = sqliteTable('products', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').unique().notNull(),
  tagline: text('tagline').notNull(),
  description: text('description').notNull(),
  price: integer('price').notNull(), // INR price for default size
  compareAtPrice: integer('compare_at_price'), // Discount price comparison
  imageUrls: text('image_urls').notNull(), // JSON array of string image URLs
  stock: integer('stock').notNull().default(0), // Total stock for default size
  isFeatured: integer('is_featured').notNull().default(0), // 0 = false, 1 = true
  topNotes: text('top_notes').notNull(), // Comma-separated top notes
  heartNotes: text('heart_notes').notNull(), // Comma-separated heart notes
  baseNotes: text('base_notes').notNull(), // Comma-separated base notes
  tags: text('tags').notNull(), // Comma-separated tags, e.g. "Woody, Oriental"
  createdAt: integer('created_at').notNull(),
});

export const variants = sqliteTable('variants', {
  id: text('id').primaryKey(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  size: text('size').notNull(), // e.g. "30ml", "50ml", "100ml"
  price: integer('price').notNull(), // Price in INR for this variant
  stock: integer('stock').notNull().default(0), // Stock count for this variant
});

export const orders = sqliteTable('orders', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // null for guests
  orderNumber: text('order_number').unique().notNull(),
  totalAmount: integer('total_amount').notNull(), // Total order amount in INR
  shippingAddress: text('shipping_address').notNull(), // JSON string for shipping address
  status: text('status').notNull().default('Processing'), // 'Processing' | 'Shipped' | 'Delivered'
  paymentStatus: text('payment_status').notNull().default('Pending'), // 'Pending' | 'Paid' | 'Failed'
  razorpayOrderId: text('razorpay_order_id'),
  razorpayPaymentId: text('razorpay_payment_id'),
  createdAt: integer('created_at').notNull(),
});

export const orderItems = sqliteTable('order_items', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id),
  variantId: text('variant_id').references(() => variants.id),
  quantity: integer('quantity').notNull(),
  priceAtPurchase: integer('price_at_purchase').notNull(),
  size: text('size').notNull(), // Size purchased (e.g. "50ml")
});

export const cartItems = sqliteTable('cart_items', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  variantId: text('variant_id').references(() => variants.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull().default(1),
});
