import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { products, variants, orders, orderItems, settings } from '@/db/schema';
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

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Route: /api/admin/products
    if (path.endsWith('/products')) {
      const isAdmin = await checkAdmin(req);
      if (!isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const db = getDb();
      const dbProducts = await db.select().from(products).all();
      const productsWithVariants = [];

      for (const p of dbProducts) {
        const prodVariants = await db
          .select()
          .from(variants)
          .where(eq(variants.productId, p.id))
          .all();
        
        productsWithVariants.push({
          ...p,
          imageUrls: JSON.parse(p.imageUrls),
          variants: prodVariants,
        });
      }
      return NextResponse.json({ products: productsWithVariants });
    }

    // Route: /api/admin/settings (public GET)
    if (path.endsWith('/settings')) {
      const db = getDb();
      const allSettings = await db.select().from(settings).all();
      const settingsMap = allSettings.reduce((acc, curr) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {} as Record<string, string>);

      return NextResponse.json({ settings: settingsMap });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDb();
    const body = await req.json() as any;

    // Route: /api/admin/inventory/update-stock
    if (path.endsWith('/update-stock')) {
      const { variantId, stock } = body;
      if (!variantId || stock === undefined) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      const numericStock = Math.max(0, parseInt(stock));
      await db.update(variants).set({ stock: numericStock }).where(eq(variants.id, variantId));

      const variant = await db.select().from(variants).where(eq(variants.id, variantId)).get();
      if (variant && variant.size === '50ml') {
        await db.update(products).set({ stock: numericStock }).where(eq(products.id, variant.productId));
      }
      return NextResponse.json({ success: true });
    }

    // Route: /api/admin/orders/update-status
    if (path.endsWith('/update-status')) {
      const { orderId, status } = body;
      if (!orderId || !status) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }
      await db.update(orders).set({ status }).where(eq(orders.id, orderId));
      return NextResponse.json({ success: true });
    }

    // Route: /api/admin/products
    if (path.endsWith('/products')) {
      const {
        name, slug, tagline, description, price, compareAtPrice,
        imageUrls, stock, isFeatured, topNotes, heartNotes, baseNotes, tags, customVariants
      } = body;

      if (!name || !slug || !tagline || !description || price === undefined) {
        return NextResponse.json({ error: 'Missing required product details' }, { status: 400 });
      }

      const existing = await db.select().from(products).where(eq(products.slug, slug)).get();
      if (existing) {
        return NextResponse.json({ error: 'Product with this slug already exists' }, { status: 400 });
      }

      const productId = 'prod-' + crypto.randomUUID().slice(0, 8);
      const parsedImages = Array.isArray(imageUrls) ? imageUrls : [imageUrls || '/images/trio_luxury.jpg'];

      await db.insert(products).values({
        id: productId,
        name,
        slug,
        tagline,
        description,
        price: parseInt(price),
        compareAtPrice: compareAtPrice ? parseInt(compareAtPrice) : null,
        imageUrls: JSON.stringify(parsedImages),
        stock: parseInt(stock || 0),
        isFeatured: isFeatured ? 1 : 0,
        topNotes: topNotes || 'Fresh Accord',
        heartNotes: heartNotes || 'Floral Accord',
        baseNotes: baseNotes || 'Woody Accord',
        tags: tags || 'Fresh',
        createdAt: Math.floor(Date.now() / 1000),
      });

      const variantsToCreate = customVariants && customVariants.length > 0 
        ? customVariants 
        : [
            { size: '30ml', price: Math.round(price * 0.7), stock: 15 },
            { size: '50ml', price: price, stock: stock || 20 },
            { size: '100ml', price: Math.round(price * 1.5), stock: 10 }
          ];

      for (const v of variantsToCreate) {
        await db.insert(variants).values({
          id: 'var-' + crypto.randomUUID().slice(0, 8),
          productId,
          size: v.size,
          price: parseInt(v.price),
          stock: parseInt(v.stock || 0),
        });
      }
      return NextResponse.json({ success: true, productId });
    }

    // Route: /api/admin/settings
    if (path.endsWith('/settings')) {
      const { key, value } = body;
      if (!key || value === undefined) {
        return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
      }

      const existing = await db.select().from(settings).where(eq(settings.key, key)).get();
      if (existing) {
        await db.update(settings).set({ value }).where(eq(settings.key, key));
      } else {
        await db.insert(settings).values({ key, value });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDb();
    const body = await req.json() as any;

    // Route: /api/admin/products
    if (path.endsWith('/products')) {
      const {
        id, name, slug, tagline, description, price, compareAtPrice,
        imageUrls, stock, isFeatured, topNotes, heartNotes, baseNotes, tags, customVariants
      } = body;

      if (!id || !name || !slug) {
        return NextResponse.json({ error: 'Missing product ID, name, or slug' }, { status: 400 });
      }

      const parsedImages = Array.isArray(imageUrls) ? imageUrls : [imageUrls || '/images/trio_luxury.jpg'];

      await db
        .update(products)
        .set({
          name, slug, tagline, description,
          price: parseInt(price),
          compareAtPrice: compareAtPrice ? parseInt(compareAtPrice) : null,
          imageUrls: JSON.stringify(parsedImages),
          stock: parseInt(stock || 0),
          isFeatured: isFeatured ? 1 : 0,
          topNotes, heartNotes, baseNotes, tags,
        })
        .where(eq(products.id, id));

      if (customVariants && customVariants.length > 0) {
        for (const v of customVariants) {
          if (v.id) {
            await db
              .update(variants)
              .set({ size: v.size, price: parseInt(v.price), stock: parseInt(v.stock) })
              .where(eq(variants.id, v.id));
          } else {
            await db.insert(variants).values({
              id: 'var-' + crypto.randomUUID().slice(0, 8),
              productId: id,
              size: v.size,
              price: parseInt(v.price),
              stock: parseInt(v.stock),
            });
          }
        }
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const path = url.pathname;

    const isAdmin = await checkAdmin(req);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const db = getDb();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    // Route: /api/admin/products
    if (path.endsWith('/products')) {
      if (!id) {
        return NextResponse.json({ error: 'Missing product ID' }, { status: 400 });
      }
      await db.delete(variants).where(eq(variants.productId, id));
      await db.delete(products).where(eq(products.id, id));
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
