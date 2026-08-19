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

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = getDb();
    const dbItems = await db
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

    // Format the items to resolve JSON images
    const formattedItems = dbItems.map((item) => {
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

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId, variantId, quantity, action } = (await req.json()) as any;
    if (!variantId || quantity === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const db = getDb();

    // Check if item already exists in database
    const existing = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, user.userId), eq(cartItems.variantId, variantId)))
      .get();

    if (action === 'add') {
      if (existing) {
        await db
          .update(cartItems)
          .set({ quantity: existing.quantity + quantity })
          .where(eq(cartItems.id, existing.id));
      } else {
        if (!productId) return NextResponse.json({ error: 'Missing productId for new item' }, { status: 400 });
        await db.insert(cartItems).values({
          id: crypto.randomUUID(),
          userId: user.userId,
          productId,
          variantId,
          quantity,
        });
      }
    } else if (action === 'set') {
      if (quantity <= 0) {
        if (existing) {
          await db.delete(cartItems).where(eq(cartItems.id, existing.id));
        }
      } else {
        if (existing) {
          await db
            .update(cartItems)
            .set({ quantity })
            .where(eq(cartItems.id, existing.id));
        } else {
          if (!productId) return NextResponse.json({ error: 'Missing productId for new item' }, { status: 400 });
          await db.insert(cartItems).values({
            id: crypto.randomUUID(),
            userId: user.userId,
            productId,
            variantId,
            quantity,
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { variantId, clearAll } = (await req.json()) as any;
    const db = getDb();

    if (clearAll) {
      await db.delete(cartItems).where(eq(cartItems.userId, user.userId));
    } else if (variantId) {
      await db
        .delete(cartItems)
        .where(and(eq(cartItems.userId, user.userId), eq(cartItems.variantId, variantId)));
    } else {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
