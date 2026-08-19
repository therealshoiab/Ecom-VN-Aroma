import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { orders, orderItems, cartItems, variants, products } from '@/db/schema';
import { verifySessionToken, getCookie } from '@/lib/auth';
import { sendEmail } from '@/lib/resend';
import { eq, and } from 'drizzle-orm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

async function getSessionUser(req: Request) {
  const cookieHeader = req.headers.get('cookie') || '';
  const token = getCookie(cookieHeader, 'session');
  if (!token) return null;
  return await verifySessionToken(token);
}

// Web Crypto HMAC-SHA256 Verification
async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const text = `${orderId}|${paymentId}`;
  const encoder = new TextEncoder();
  
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(text)
  );
  
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
    
  return signatureHex === signature;
}

export async function POST(req: Request) {
  try {
    const user = await getSessionUser(req);
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddress,
      email,
      items,
      orderNumber,
      isMock,
    } = (await req.json()) as any;

    if (!razorpay_order_id || !razorpay_payment_id || !shippingAddress || !items || !orderNumber) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // 1. Signature Verification
    if (!isMock && keySecret && keySecret !== 'razorpay_secret_placeholder') {
      const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid payment signature verification' }, { status: 400 });
      }
    } else {
      console.log('📢 [MOCK PAYMENTS] Bypassing payment signature verification.');
    }

    const db = getDb();
    let totalAmount = 0;

    // 2. Perform DB updates in sequence (Verify stock and compute total)
    for (const item of items) {
      const variant = await db.select().from(variants).where(eq(variants.id, item.variantId)).get();
      if (!variant) {
        return NextResponse.json({ error: `Variant not found for item: ${item.name}` }, { status: 400 });
      }
      if (variant.stock < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for ${item.name}` }, { status: 400 });
      }
      totalAmount += variant.price * item.quantity;
    }

    // 3. Write Order Record
    const orderId = crypto.randomUUID();
    await db.insert(orders).values({
      id: orderId,
      userId: user ? user.userId : null,
      orderNumber,
      totalAmount,
      shippingAddress: JSON.stringify(shippingAddress),
      status: 'Processing',
      paymentStatus: 'Paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      createdAt: Math.floor(Date.now() / 1000),
    });

    // 4. Write Order Items and Reduce Stock
    for (const item of items) {
      const variant = await db.select().from(variants).where(eq(variants.id, item.variantId)).get();
      if (!variant) continue;

      // Insert order item
      await db.insert(orderItems).values({
        id: crypto.randomUUID(),
        orderId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        priceAtPurchase: variant.price,
        size: variant.size,
      });

      // Reduce stock in variants table
      const newVariantStock = variant.stock - item.quantity;
      await db
        .update(variants)
        .set({ stock: newVariantStock })
        .where(eq(variants.id, item.variantId));

      // If default size is 50ml, also update main products table stock
      if (variant.size === '50ml') {
        const prod = await db.select().from(products).where(eq(products.id, item.productId)).get();
        if (prod) {
          await db
            .update(products)
            .set({ stock: Math.max(0, prod.stock - item.quantity) })
            .where(eq(products.id, item.productId));
        }
      }
    }

    // 5. Clear cart if user logged in
    if (user) {
      await db.delete(cartItems).where(eq(cartItems.userId, user.userId));
    }

    // 6. Send Order Confirmation Email via Resend
    const customerEmail = user ? user.email : email;
    const itemsHtml = items
      .map((item: any) => `<li>${item.name} (${item.size}) x ${item.quantity} - ₹${(item.price * item.quantity).toLocaleString('en-IN')}</li>`)
      .join('');

    const emailHtml = `
      <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FAF9F6; color: #111111; border: 1px solid #E6E3DB;">
        <h1 style="text-align: center; text-transform: uppercase; tracking-wider; font-size: 24px;">VN Aroma</h1>
        <p style="text-align: center; font-size: 10px; text-transform: uppercase; color: #C5A880; margin-top: -10px;">For Men & Women</p>
        <hr style="border: 0; border-top: 1px solid #E6E3DB; margin: 20px 0;" />
        <h2 style="font-size: 18px; font-weight: normal;">Thank you for your order.</h2>
        <p style="font-size: 13px; line-height: 1.6; color: #555;">We have successfully received your payment for order <strong>${orderNumber}</strong>. Our olfactory artisans are now preparing your parcel.</p>
        
        <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 30px; border-bottom: 1px solid #E6E3DB; padding-bottom: 5px;">Your Selections</h3>
        <ul style="font-size: 13px; padding-left: 20px; line-height: 1.8; color: #333;">
          ${itemsHtml}
        </ul>
        
        <p style="font-size: 14px; font-weight: bold; margin-top: 20px;">Total Amount: ₹${totalAmount.toLocaleString('en-IN')}</p>
        
        <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 30px; border-bottom: 1px solid #E6E3DB; padding-bottom: 5px;">Delivery Address</h3>
        <p style="font-size: 12px; line-height: 1.5; color: #555;">
          ${shippingAddress.name}<br />
          ${shippingAddress.addressLine1}<br />
          ${shippingAddress.addressLine2 ? `${shippingAddress.addressLine2}<br />` : ''}
          ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postalCode}<br />
          Phone: ${shippingAddress.phone}
        </p>
        
        <hr style="border: 0; border-top: 1px solid #E6E3DB; margin: 30px 0;" />
        <p style="font-size: 11px; text-align: center; color: #999; text-transform: uppercase;">VN Aroma · Boutique Fragrance House</p>
      </div>
    `;

    await sendEmail({
      to: customerEmail,
      subject: `Order Confirmation - ${orderNumber} | VN Aroma`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, orderNumber });
  } catch (e: any) {
    console.error('Payment verification failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
