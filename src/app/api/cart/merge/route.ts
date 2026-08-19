import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { cartItems, products, variants } from '@/db/schema';
import { verifySessionToken, getCookie } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function getSessionUser(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = getCookie(cookieHeader, 'session');
  if (!token) return null;
  return await verifySessionToken(token);
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items } = (await req.json()) as any;
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 });
    }

    const db = getDb();

    // Loop through local items and merge into user's DB cart
    for (const item of items) {
      if (!item.variantId || !item.productId || !item.quantity) continue;

      const existing = await db
        .select()
        .from(cartItems)
        .where(and(eq(cartItems.userId, user.userId), eq(cartItems.variantId, item.variantId)))
        .get();

      if (existing) {
        await db
          .update(cartItems)
          .set({ quantity: existing.quantity + item.quantity })
          .where(eq(cartItems.id, existing.id));
      } else {
        await db.insert(cartItems).values({
          id: crypto.randomUUID(),
          userId: user.userId,
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        });
      }
    }

    // Return the final merged cart
    const mergedDbItems = await db
      .select({
        id: cartItems.variantId,
        productId: cartItems.productId,
        variantId: cartItems.variantId,
        name: products.name,
        size: variants.size,
        price: variants.price,
        imageUrls: products.imageUrls,
        quantity: cartItems.quantity,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .innerJoin(variants, eq(cartItems.variantId, variants.id))
      .where(eq(cartItems.userId, user.userId))
      .all();

    const formattedItems = mergedDbItems.map((item) => {
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
        name: item.name,
        size: item.size,
        price: item.price,
        imageUrl,
        quantity: item.quantity,
      };
    });

    return NextResponse.json(formattedItems);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
