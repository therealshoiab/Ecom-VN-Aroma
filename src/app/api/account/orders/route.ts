import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { orders, orderItems, products } from '@/db/schema';
import { verifySessionToken, getCookie } from '@/lib/auth';
import { eq, desc } from 'drizzle-orm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function getSessionUser(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = getCookie(cookieHeader, 'session');
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    
    // Fetch all orders for this user
    const dbOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, user.userId))
      .orderBy(desc(orders.createdAt))
      .all();

    const formattedOrders = [];

    // For each order, fetch corresponding items
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
          imageUrls: products.imageUrls,
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, order.id))
        .all();

      const formattedItems = items.map((item) => {
        let imageUrl = '/images/trio.png';
        try {
          const urls = JSON.parse(item.imageUrls);
          if (Array.isArray(urls) && urls.length > 0) {
            imageUrl = urls[0];
          }
        } catch (e) {}

        return {
          id: item.id,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          priceAtPurchase: item.priceAtPurchase,
          size: item.size,
          name: item.name,
          imageUrl,
        };
      });

      formattedOrders.push({
        ...order,
        shippingAddress: JSON.parse(order.shippingAddress),
        items: formattedItems,
      });
    }

    return NextResponse.json(formattedOrders);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
