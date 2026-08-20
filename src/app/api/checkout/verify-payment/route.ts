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
      isCOD,
    } = (await req.json()) as any;

    if (!shippingAddress || !items || !orderNumber) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    if (!isCOD && (!razorpay_order_id || !razorpay_payment_id)) {
      return NextResponse.json({ error: 'Missing payment parameters for online checkout' }, { status: 400 });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // 1. Signature Verification (Only if NOT Cash on Delivery)
    if (!isCOD && !isMock && keySecret && keySecret !== 'razorpay_secret_placeholder') {
      const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, keySecret);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid payment signature verification' }, { status: 400 });
      }
    } else {
      console.log(isCOD ? '📢 [COD ORDER] Bypassing online signature verification.' : '📢 [MOCK PAYMENTS] Bypassing payment signature verification.');
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
      paymentStatus: isCOD ? 'COD' : 'Paid',
      razorpayOrderId: isCOD ? 'cod_order' : razorpay_order_id,
      razorpayPaymentId: isCOD ? 'cod_payment' : razorpay_payment_id,
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

    const line1 = shippingAddress.houseFlatNo || shippingAddress.addressLine1 || '';
    const line2 = shippingAddress.areaStreetNearby || shippingAddress.addressLine2 || '';
    const zip = shippingAddress.pincode || shippingAddress.postalCode || '';
    const paymentMethodText = isCOD ? 'Cash on Delivery (COD)' : 'Paid Online (Razorpay)';

    const emailHtml = `
      <div style="font-family: 'Playfair Display', Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #FAF9F6; color: #111111; border: 1px solid #E6E3DB;">
        <h1 style="text-align: center; text-transform: uppercase; tracking-wider; font-size: 24px;">VN Aroma</h1>
        <p style="text-align: center; font-size: 10px; text-transform: uppercase; color: #C5A880; margin-top: -10px;">For Men & Women</p>
        <hr style="border: 0; border-top: 1px solid #E6E3DB; margin: 20px 0;" />
        <h2 style="font-size: 18px; font-weight: normal;">Thank you for your order.</h2>
        <p style="font-size: 13px; line-height: 1.6; color: #555;">We have successfully received your order <strong>${orderNumber}</strong>. Our olfactory artisans are now preparing your parcel.</p>
        <p style="font-size: 13px; color: #555;"><strong>Payment Method:</strong> ${paymentMethodText}</p>
        
        <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 30px; border-bottom: 1px solid #E6E3DB; padding-bottom: 5px;">Your Selections</h3>
        <ul style="font-size: 13px; padding-left: 20px; line-height: 1.8; color: #333;">
          ${itemsHtml}
        </ul>
        
        <p style="font-size: 14px; font-weight: bold; margin-top: 20px;">Total Amount: ₹${totalAmount.toLocaleString('en-IN')}</p>
        
        <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 30px; border-bottom: 1px solid #E6E3DB; padding-bottom: 5px;">Delivery Address</h3>
        <p style="font-size: 12px; line-height: 1.5; color: #555;">
          ${shippingAddress.name}<br />
          ${line1}<br />
          ${line2 ? `${line2}<br />` : ''}
          ${shippingAddress.city}, ${shippingAddress.state} - ${zip}<br />
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

    // Also send an email notification to the Admin about the new order
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_FROM || 'admin@vn-aroma.pages.dev';
      const adminEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; background-color: #fcfcfc;">
          <h2 style="color: #c5a880; text-transform: uppercase;">New Order Received!</h2>
          <p>Order Number: <strong>${orderNumber}</strong></p>
          <p>Payment Method: <strong>${paymentMethodText}</strong></p>
          <p>Customer: ${shippingAddress.name} (${customerEmail})</p>
          <p>Phone: ${shippingAddress.phone}</p>
          <h3>Selections</h3>
          <ul>${itemsHtml}</ul>
          <p>Total Amount: <strong>₹${totalAmount.toLocaleString('en-IN')}</strong></p>
          <h3>Shipping Address</h3>
          <p>
            ${line1}<br />
            ${line2 ? `${line2}<br />` : ''}
            ${shippingAddress.city}, ${shippingAddress.state} - ${zip}
          </p>
          <a href="https://vn-aroma.pages.dev/admin" style="display: inline-block; padding: 10px 20px; background-color: #c5a880; color: white; text-decoration: none; font-weight: bold; margin-top: 20px;">Go to Admin Panel</a>
        </div>
      `;
      await sendEmail({
        to: adminEmail,
        subject: `[NEW ORDER] ${orderNumber} - ₹${totalAmount.toLocaleString('en-IN')}`,
        html: adminEmailHtml,
      });
    } catch (adminEmailError) {
      console.error('Failed to send admin order notification email:', adminEmailError);
    }

    return NextResponse.json({ success: true, orderNumber });
  } catch (e: any) {
    console.error('Payment verification failed:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
