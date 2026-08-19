import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { products, variants } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { verifySessionToken, getCookie } from '@/lib/auth';

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
    const { items } = (await req.json()) as any;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Shopping bag is empty' }, { status: 400 });
    }

    const db = getDb();
    let totalAmount = 0;
    const validatedItems = [];

    // 1. Validate prices and stock levels against database
    for (const item of items) {
      const variant = await db.select().from(variants).where(eq(variants.id, item.variantId)).get();
      if (!variant) {
        return NextResponse.json({ error: `Item variant not found: ${item.name}` }, { status: 404 });
      }

      if (variant.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${item.name}. Only ${variant.stock} left.` }, { status: 400 });
      }

      const itemTotal = variant.price * item.quantity;
      totalAmount += itemTotal;

      validatedItems.push({
        productId: variant.productId,
        variantId: variant.id,
        quantity: item.quantity,
        priceAtPurchase: variant.price,
        size: variant.size,
      });
    }

    const orderNumber = `VN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Check if we are running in Mock mode
    const isMock = !keyId || keyId === 'rzp_test_placeholder' || !keySecret || keySecret === 'razorpay_secret_placeholder';

    if (isMock) {
      // Mock Razorpay Order Creation
      console.log(`📢 [MOCK PAYMENTS] Creating Mock Razorpay Order for ₹${totalAmount}`);
      return NextResponse.json({
        id: `order_mock_${Math.random().toString(36).substring(2, 11)}`,
        amount: totalAmount * 100, // paise
        currency: 'INR',
        receipt: orderNumber,
        isMock: true,
        keyId: 'rzp_test_placeholder',
      });
    }

    // Real Razorpay API Order Creation using native Fetch
    const authString = btoa(`${keyId}:${keySecret}`);
    const res = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        amount: totalAmount * 100, // Razorpay amount is in paise
        currency: 'INR',
        receipt: orderNumber,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Razorpay Order Error:', errText);
      return NextResponse.json({ error: 'Failed to create payment order' }, { status: 500 });
    }

    const razorpayOrder = (await res.json()) as any;
    return NextResponse.json({
      id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      receipt: orderNumber,
      isMock: false,
      keyId: keyId,
    });
  } catch (e: any) {
    console.error('Order creation failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
