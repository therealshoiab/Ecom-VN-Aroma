import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users, products, variants } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Web Crypto PBKDF2 Password Hashing Helper
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const baseKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKeyBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    256
  );

  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  const keyHex = Array.from(new Uint8Array(derivedKeyBits)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${saltHex}:${keyHex}`;
}

export async function GET() {
  try {
    const db = getDb();

    // 1. Create tables if they do not exist
    const createTableQueries = [
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        tagline TEXT NOT NULL,
        description TEXT NOT NULL,
        price INTEGER NOT NULL,
        compare_at_price INTEGER,
        image_urls TEXT NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        is_featured INTEGER NOT NULL DEFAULT 0,
        top_notes TEXT NOT NULL,
        heart_notes TEXT NOT NULL,
        base_notes TEXT NOT NULL,
        tags TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );`,
      `CREATE TABLE IF NOT EXISTS variants (
        id TEXT PRIMARY KEY,
        product_id TEXT NOT NULL,
        size TEXT NOT NULL,
        price INTEGER NOT NULL,
        stock INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
      );`,
      `CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        order_number TEXT UNIQUE NOT NULL,
        total_amount INTEGER NOT NULL,
        shipping_address TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Processing',
        payment_status TEXT NOT NULL DEFAULT 'Pending',
        razorpay_order_id TEXT,
        razorpay_payment_id TEXT,
        created_at INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
      );`,
      `CREATE TABLE IF NOT EXISTS order_items (
        id TEXT PRIMARY KEY,
        order_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        variant_id TEXT,
        quantity INTEGER NOT NULL,
        price_at_purchase INTEGER NOT NULL,
        size TEXT NOT NULL,
        FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id)
      );`,
      `CREATE TABLE IF NOT EXISTS cart_items (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        variant_id TEXT,
        quantity INTEGER NOT NULL DEFAULT 1,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
      );`
    ];

    // Drizzle executes raw queries via db.run() for D1/SQLite
    for (const query of createTableQueries) {
      await db.run(query);
    }

    // 2. Clear existing seed data to ensure fresh seed
    await db.delete(variants);
    await db.delete(products);

    // 3. Create Admin User if not exists
    const adminEmail = 'admin@vnaroma.com';
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).get();
    
    if (!existingAdmin) {
      const hashedAdminPassword = await hashPassword('admin123');
      await db.insert(users).values({
        id: crypto.randomUUID(),
        email: adminEmail,
        passwordHash: hashedAdminPassword,
        name: 'VN Aroma Admin',
        role: 'admin',
        createdAt: Math.floor(Date.now() / 1000),
      });
    }

    // 4. Perfume Seed Data
    const perfumesData = [
      {
        id: 'prod-lune-bleue',
        name: 'Lune Bleue',
        slug: 'lune-bleue',
        tagline: 'Citrus, sea salt, and whispers of moonlight.',
        description: 'A luminous and fresh fragrance inspired by cool ocean breezes under a full moon. Bright grapefruit and sea salt open into a heart of mineral sage, grounded by dark cedarwood and soft musk. Clean, marine, and elegant.',
        price: 4500,
        compareAtPrice: 5500,
        imageUrls: JSON.stringify(['/images/lune_bleue.jpg', '/images/trio.png']),
        stock: 50,
        isFeatured: 1,
        topNotes: 'Bergamot, Grapefruit, Sea Accord',
        heartNotes: 'Sea Salt, Sage, Rosemary',
        baseNotes: 'Cedarwood, Ambergris, Musk',
        tags: 'Fresh, Marine, Unisex, Bestseller',
      },
      {
        id: 'prod-epice-noire',
        name: 'Épice Noire',
        slug: 'epice-noire',
        tagline: 'Warm amber, black pepper, and sacred woods.',
        description: 'A rich, seductive, and complex fragrance that captures the warmth of oriental spices. Bold black pepper and aromatic cardamom fuse with cinnamon and cloves, resting on a base of creamy sandalwood and rich amber.',
        price: 4800,
        compareAtPrice: 5800,
        imageUrls: JSON.stringify(['/images/epice_noire.jpg', '/images/trio.png']),
        stock: 40,
        isFeatured: 1,
        topNotes: 'Black Pepper, Cardamom, Bergamot',
        heartNotes: 'Cinnamon, Clove, Nutmeg',
        baseNotes: 'Sandalwood, Patchouli, Amber, Vanilla',
        tags: 'Spicy, Amber, Woody, Unisex, Bestseller',
      },
      {
        id: 'prod-inhale',
        name: 'Inhale',
        slug: 'inhale',
        tagline: 'Soft rose, lychee, and fresh linen.',
        description: 'A clean, soft, and powdery floral fragrance that evokes the purity of morning light and fresh linen. Crisp pear and sweet lychee lead to a heart of blooming rose and peony, ending in a warm cashmere wood embrace.',
        price: 4600,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/inhale.jpg', '/images/trio.png']),
        stock: 60,
        isFeatured: 1,
        topNotes: 'Pear, Lychee, Aldehydes',
        heartNotes: 'Damask Rose, Peony, Freesia',
        baseNotes: 'White Musk, Sandalwood, Cashmere Wood',
        tags: 'Floral, Clean, Powdery, Unisex, New Arrival',
      },
      {
        id: 'prod-bois-sacre',
        name: 'Bois Sacré',
        slug: 'bois-sacre',
        tagline: 'Smoky incense, cedarwood, and gold resin.',
        description: 'An elegant, meditative woody fragrance. Rich incense smoke and dried spices blend into deep cedarwood and vetiver, creating an aura of sacred silence and dry warmth.',
        price: 4900,
        compareAtPrice: 6200,
        imageUrls: JSON.stringify(['/images/epice_noire.jpg', '/images/trio.png']),
        stock: 30,
        isFeatured: 0,
        topNotes: 'Frankincense, Pink Pepper',
        heartNotes: 'Cedarwood, Atlas Cedar, Cypress',
        baseNotes: 'Vetiver, Sandalwood, Amber',
        tags: 'Woody, Incense, Warm, Unisex',
      },
      {
        id: 'prod-ombre-rose',
        name: 'Ombre Rose',
        slug: 'ombre-rose',
        tagline: 'Velvety rose, dark oud, and sweet saffron.',
        description: 'A dramatic, dark floral masterpiece. Velvety Turkish rose is wrapped in the smoky shadows of precious oud and precious saffron, with a rich hint of dark praline and vanilla.',
        price: 5200,
        compareAtPrice: 6500,
        imageUrls: JSON.stringify(['/images/inhale.jpg', '/images/trio.png']),
        stock: 25,
        isFeatured: 0,
        topNotes: 'Saffron, Clove, Red Fruits',
        heartNotes: 'Damask Rose, Rose Absolute, Jasmine',
        baseNotes: 'Oud, Praline, Vanilla, Amber',
        tags: 'Floral, Oud, Sweet, Unisex, Bestseller',
      },
      {
        id: 'prod-eau-fraiche',
        name: 'Eau Fraîche',
        slug: 'eau-fraiche',
        tagline: 'Crushed mint, verbena, and botanical dew.',
        description: 'An energizing, green citrus scent that feels like walking through a damp garden at dawn. Crushed mint leaves, wild basil, and lemon verbena rest on a light base of clean musk and green vetiver.',
        price: 4200,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/lune_bleue.jpg', '/images/trio.png']),
        stock: 45,
        isFeatured: 0,
        topNotes: 'Spearmint, Wild Basil, Lemon',
        heartNotes: 'Verbena, Green Tea, Jasmine',
        baseNotes: 'Vetiver, White Musk, Cedarwood',
        tags: 'Fresh, Green, Citrus, Unisex, New Arrival',
      },
      {
        id: 'prod-cuir-sauvage',
        name: 'Cuir Sauvage',
        slug: 'cuir-sauvage',
        tagline: 'Smoky leather, cardamom, and warm tobacco.',
        description: 'A bold, sophisticated leather fragrance. Warm cardamom and raspberry give way to a heart of rugged black leather and tobacco leaves, finished with earthy oakmoss and amber.',
        price: 5100,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/epice_noire.jpg', '/images/trio.png']),
        stock: 20,
        isFeatured: 0,
        topNotes: 'Cardamom, Raspberry, Saffron',
        heartNotes: 'Tuscan Leather, Jasmine, Thyme',
        baseNotes: 'Amber, Oakmoss, Patchouli, Oud',
        tags: 'Leather, Smoky, Woody, Unisex',
      },
      {
        id: 'prod-nuit-blanche',
        name: 'Nuit Blanche',
        slug: 'nuit-blanche',
        tagline: 'Black coffee, white florals, and sweet vanilla.',
        description: 'An addictive, nocturnal fragrance of contrasts. Energetic black coffee beans and sweet orange blossom collide in a creamy base of vanilla, patchouli, and white musk.',
        price: 4800,
        compareAtPrice: 5800,
        imageUrls: JSON.stringify(['/images/epice_noire.jpg', '/images/trio.png']),
        stock: 35,
        isFeatured: 0,
        topNotes: 'Pink Pepper, Pear, Orange Blossom',
        heartNotes: 'Coffee, Jasmine, Bitter Almond',
        baseNotes: 'Vanilla, Patchouli, Cedarwood, Cashmere Wood',
        tags: 'Gourmand, Floral, Coffee, Unisex',
      },
      {
        id: 'prod-fleur-doranger',
        name: 'Fleur d\'Oranger',
        slug: 'fleur-doranger',
        tagline: 'Neroli, sun-kissed orange blossom, and clean musk.',
        description: 'A bright, radiant floral that captures the warmth of a Mediterranean summer. Sparkling neroli and sweet orange blossom are anchored by a clean base of musk and white honey.',
        price: 4500,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/epice_noire.jpg', '/images/trio.png']),
        stock: 40,
        isFeatured: 0,
        topNotes: 'Neroli, Bergamot, Petitgrain',
        heartNotes: 'Orange Blossom, Jasmine, Tuberose',
        baseNotes: 'Musk, White Honey, Cedarwood',
        tags: 'Floral, Citrus, Clean, Unisex',
      },
      {
        id: 'prod-discovery-trio',
        name: 'VN Aroma Discovery Trio',
        slug: 'discovery-trio',
        tagline: 'Three iconic signatures in one luxury gift set.',
        description: 'The ultimate olfactory journey. Experience our entire launch collection featuring Lune Bleue, Épice Noire, and Inhale in individual 50ml bottles, presented in a minimal black-and-cream display box.',
        price: 11900,
        compareAtPrice: 13900,
        imageUrls: JSON.stringify(['/images/trio.png']),
        stock: 30,
        isFeatured: 1,
        topNotes: 'Citrus, Spices, Florals',
        heartNotes: 'Sea Salt, Cardamom, Rose',
        baseNotes: 'Woods, Amber, Musk',
        tags: 'Set, Unisex, Bestseller, Gift',
      }
    ];

    // Seed Products and Variants
    for (const prod of perfumesData) {
      await db.insert(products).values({
        id: prod.id,
        name: prod.name,
        slug: prod.slug,
        tagline: prod.tagline,
        description: prod.description,
        price: prod.price,
        compareAtPrice: prod.compareAtPrice,
        imageUrls: prod.imageUrls,
        stock: prod.stock,
        isFeatured: prod.isFeatured,
        topNotes: prod.topNotes,
        heartNotes: prod.heartNotes,
        baseNotes: prod.baseNotes,
        tags: prod.tags,
        createdAt: Math.floor(Date.now() / 1000),
      });

      // Seeding variants for each individual perfume (except the trio bundle itself which is fixed at 3x50ml)
      if (prod.id !== 'prod-discovery-trio') {
        // 30ml variant
        await db.insert(variants).values({
          id: `var-${prod.slug}-30`,
          productId: prod.id,
          size: '30ml',
          price: Math.floor(prod.price * 0.75), // 25% discount for smaller size
          stock: Math.floor(prod.stock * 0.6),
        });

        // 50ml variant (Default size matching product base price)
        await db.insert(variants).values({
          id: `var-${prod.slug}-50`,
          productId: prod.id,
          size: '50ml',
          price: prod.price,
          stock: prod.stock,
        });

        // 100ml variant
        await db.insert(variants).values({
          id: `var-${prod.slug}-100`,
          productId: prod.id,
          size: '100ml',
          price: Math.floor(prod.price * 1.65), // cheaper per ml
          stock: Math.floor(prod.stock * 0.4),
        });
      } else {
        // Trio Bundle variant
        await db.insert(variants).values({
          id: 'var-discovery-trio-3x50ml',
          productId: prod.id,
          size: '3 x 50ml',
          price: prod.price,
          stock: prod.stock,
        });
      }
    }

    return NextResponse.json({ success: true, message: 'Database seeded successfully with 10 luxury perfumes, variants, and admin user.' });
  } catch (e: any) {
    console.error('Seeding failed:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
