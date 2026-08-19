import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { orders } from '@/db/schema';
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

    const { orderId, status } = (await req.json()) as any;
    if (!orderId || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const db = getDb();
    
    // Update order status in database
    await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, orderId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
