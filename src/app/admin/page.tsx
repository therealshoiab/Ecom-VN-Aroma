import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/auth';
import { getDb } from '@/db';
import { orders, orderItems, products, variants } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import AdminPageClient from '@/components/AdminPageClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) {
    redirect('/account');
  }

  const session = await verifySessionToken(token);
  if (!session || session.role !== 'admin') {
    redirect('/account');
  }

  const db = getDb();

  // 1. Fetch all orders with details
  const dbOrders = await db.select().from(orders).orderBy(desc(orders.createdAt)).all();
  const ordersWithItems = [];

  for (const order of dbOrders) {
    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        variantId: orderItems.variantId,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        size: orderItems.size,
        name: products.name,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, order.id))
      .all();

    ordersWithItems.push({
      ...order,
      shippingAddress: JSON.parse(order.shippingAddress),
      items,
    });
  }

  // 2. Fetch all inventory variants joining with products
  const inventoryVariants = await db
    .select({
      id: variants.id,
      productId: variants.productId,
      size: variants.size,
      price: variants.price,
      stock: variants.stock,
      name: products.name,
    })
    .from(variants)
    .innerJoin(products, eq(variants.productId, products.id))
    .all();

  return (
    <AdminPageClient
      initialOrders={ordersWithItems}
      initialVariants={inventoryVariants}
    />
  );
}
