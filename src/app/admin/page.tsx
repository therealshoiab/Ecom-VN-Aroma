import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken } from '@/lib/auth';
import { getDb } from '@/db';
import { orders, orderItems, products, variants, settings } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import AdminPageClient from '@/components/AdminPageClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

function isNextRedirectError(error: any) {
  return (
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    typeof error.digest === 'string' &&
    error.digest.startsWith('NEXT_REDIRECT')
  );
}

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

  try {
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

    // 3. Fetch all products
    const dbProducts = await db.select().from(products).all();
    const formattedProducts = dbProducts.map((p) => {
      let images: string[] = ['/images/trio.png'];
      try {
        const parsed = JSON.parse(p.imageUrls);
        if (Array.isArray(parsed) && parsed.length > 0) {
          images = parsed;
        }
      } catch (e) {}
      return {
        ...p,
        imageUrls: images,
      };
    });

    // 4. Fetch settings
    const dbSettings = await db.select().from(settings).all();
    const settingsMap = dbSettings.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);

    return (
      <AdminPageClient
        initialOrders={ordersWithItems}
        initialVariants={inventoryVariants}
        initialProducts={formattedProducts}
        initialSettings={settingsMap}
      />
    );
  } catch (e) {
    if (isNextRedirectError(e)) {
      throw e;
    }
    // Fallback for static build
    return (
      <AdminPageClient
        initialOrders={[]}
        initialVariants={[]}
        initialProducts={[]}
        initialSettings={{}}
      />
    );
  }
}
