import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { variants, products } from '@/db/schema';
import { verifySessionToken, getCookie } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function checkAdmin(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = getCookie(cookieHeader, 'session');
  if (!token) return false;
  const payload = await verifySessionToken(token);
  return payload && payload.role === 'admin';
}

export async function POST(req: Request) {
  try {
    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { variantId, stock } = (await req.json()) as any;
    if (!variantId || stock === undefined) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const db = getDb();
    const numericStock = Math.max(0, parseInt(stock));

    // 1. Update stock in variants table
    await db
      .update(variants)
      .set({ stock: numericStock })
      .where(eq(variants.id, variantId));

    // 2. Fetch the variant to see product ID and size
    const variant = await db.select().from(variants).where(eq(variants.id, variantId)).get();
    
    // 3. If size is 50ml, sync products.stock too
    if (variant && variant.size === '50ml') {
      await db
        .update(products)
        .set({ stock: numericStock })
        .where(eq(products.id, variant.productId));
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
