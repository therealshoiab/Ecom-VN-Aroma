import { NextResponse } from 'next/server';
import { getDb } from '@/db';
import { users, products, variants, orders, orderItems, cartItems } from '@/db/schema';
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
      );`,
      `CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );`
    ];

    for (const query of createTableQueries) {
      await db.run(query);
    }

    // Initialize settings
    await db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('banner_message', '✨ DISCOVER OUR HANDCRAFTED BOUTIQUE PERFUME COLLECTION | FREE SHIPPING PAN-INDIA ✨')`);

    // 2. Clear existing seed data to ensure fresh seed
    await db.delete(cartItems);
    await db.delete(orderItems);
    await db.delete(orders);
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

    // 4. 30 Luxury Perfumes Dataset
    const perfumesData = [
      {
        id: 'prod-silver-birch',
        name: 'Silver Birch',
        slug: 'silver-birch',
        tagline: '50ml EDT',
        description: 'Crisp, clean woody scent, fresh like birch bark in the cold.',
        price: 4700,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/silver_birch.jpg']),
        stock: 45,
        isFeatured: 1,
        topNotes: 'Pine Needles, White Iris',
        heartNotes: 'Birch Wood, Cedarwood, Juniper',
        baseNotes: 'Earthy Vetiver, Oakmoss, Patchouli',
        tags: 'Woody, Fresh, Unisex, New Arrival',
      },
      {
        id: 'prod-rose-gold-oud',
        name: 'Rose Gold Oud',
        slug: 'rose-gold-oud',
        tagline: '30ml EDT',
        description: 'Warm rose paired with smoky, luxurious oud.',
        price: 5400,
        compareAtPrice: 6500,
        imageUrls: JSON.stringify(['/images/rose_gold_oud_1.jpg', '/images/rose_gold_oud_2.jpg', '/images/rose_gold_oud_3.jpg']),
        stock: 30,
        isFeatured: 1,
        topNotes: 'Saffron, Pink Pepper, Red Berries',
        heartNotes: 'Damask Rose, Jasmine, Praline',
        baseNotes: 'Oud Wood, Frankincense, Vanilla, Amber',
        tags: 'Floral, Oud, Spicy, Unisex, Bestseller',
      },
      {
        id: 'prod-pure-jasmine',
        name: 'Pure Jasmine',
        slug: 'pure-jasmine',
        tagline: '50ml EDP',
        description: 'Soft, delicate white floral, pure and romantic.',
        price: 4500,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/pure_jasmine.jpg']),
        stock: 40,
        isFeatured: 0,
        topNotes: 'Jasmine Sambac, Bergamot, Green Leaves',
        heartNotes: 'Star Jasmine, Orange Blossom, Lily',
        baseNotes: 'Clean White Musk, Soft Sandalwood',
        tags: 'Floral, Clean, Unisex',
      },
      {
        id: 'prod-morning-dew',
        name: 'Morning Dew',
        slug: 'morning-dew',
        tagline: '30ml EDT',
        description: 'Light, green, dewy freshness — like an early morning walk.',
        price: 4600,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/morning_dew.jpg']),
        stock: 40,
        isFeatured: 0,
        topNotes: 'Bergamot, Lime Peel, Morning Dew Accord',
        heartNotes: 'Wet Moss, Lichen, Green Ivy',
        baseNotes: 'Sandalwood, White Musk, Patchouli',
        tags: 'Fresh, Green, Unisex',
      },
      {
        id: 'prod-white-freesia',
        name: 'White Freesia',
        slug: 'white-freesia',
        tagline: '50ml EDT',
        description: 'Clean, soft, powdery floral scent.',
        price: 5500,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/white_freesia.jpg']),
        stock: 25,
        isFeatured: 0,
        topNotes: 'White Freesia, Pear Blossom, Aldehydes',
        heartNotes: 'Lily of the Valley, Jasmine, Peony',
        baseNotes: 'White Musk, Sandalwood, Cashmere Wood',
        tags: 'Floral, Fresh, Powdery, Unisex',
      },
      {
        id: 'prod-bergamot-breeze',
        name: 'Bergamot Breeze',
        slug: 'bergamot-breeze',
        tagline: '30ml EDT',
        description: 'Zesty citrus bergamot, bright and airy.',
        price: 4400,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/bergamot_breeze.jpg']),
        stock: 45,
        isFeatured: 0,
        topNotes: 'Bergamot Peel, Lime Leaf, Grapefruit',
        heartNotes: 'Neroli, Green Tea, Jasmine',
        baseNotes: 'White Musk, Cedarwood, Vetiver',
        tags: 'Citrus, Fresh, Clean, Unisex',
      },
      {
        id: 'prod-sparkling-citrus',
        name: 'Sparkling Citrus',
        slug: 'sparkling-citrus',
        tagline: '30ml EDT',
        description: 'Juicy orange burst, energizing and fresh.',
        price: 4300,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/sparkling_citrus.jpg']),
        stock: 55,
        isFeatured: 0,
        topNotes: 'Juicy Orange, Mandarin Peel, Tangerine',
        heartNotes: 'Grapefruit, Orange Blossom, Verbena',
        baseNotes: 'White Honey, Cedarwood, Musk',
        tags: 'Citrus, Fresh, Unisex',
      },
      {
        id: 'prod-honey-blossom',
        name: 'Honey Blossom',
        slug: 'honey-blossom',
        tagline: '30ml EDT',
        description: 'Sweet golden honey with a soft floral touch.',
        price: 5300,
        compareAtPrice: 6300,
        imageUrls: JSON.stringify(['/images/honey_blossom.jpg']),
        stock: 30,
        isFeatured: 0,
        topNotes: 'Orange Blossom, Lemon Nectar',
        heartNotes: 'Raw Honeycomb, White Rose, Beeswax',
        baseNotes: 'Golden Amber, Vanilla Pod, Cedarwood',
        tags: 'Floral, Amber, Sweet, Unisex',
      },
      {
        id: 'prod-sweet-lychee',
        name: 'Sweet Lychee',
        slug: 'sweet-lychee',
        tagline: 'EDT',
        description: 'Playful, sweet, fruity lychee aroma.',
        price: 5200,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/sweet_lychee.jpg']),
        stock: 25,
        isFeatured: 0,
        topNotes: 'Sweet Lychee, Red Currant, Pear',
        heartNotes: 'Pink Rose, Freesia, Lily of the Valley',
        baseNotes: 'Clean Linen Accord, White Musk, Sandalwood',
        tags: 'Floral, Fresh, Unisex',
      },
      {
        id: 'prod-white-tea-thyme',
        name: 'White Tea & Thyme',
        slug: 'white-tea-thyme',
        tagline: '30ml EDT',
        description: 'Calm herbal-green blend of tea leaves and thyme.',
        price: 4300,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/white_tea_thyme.jpg']),
        stock: 50,
        isFeatured: 0,
        topNotes: 'White Tea, Bergamot, Coriander',
        heartNotes: 'Thyme, Sage, White Rose',
        baseNotes: 'White Musk, Cedarwood, Amber',
        tags: 'Fresh, Green, Tea, Unisex',
      },
      {
        id: 'prod-alpine-air',
        name: 'Alpine Air',
        slug: 'alpine-air',
        tagline: '50ml EDT',
        description: 'Cool, crisp mountain freshness.',
        price: 5200,
        compareAtPrice: 6200,
        imageUrls: JSON.stringify(['/images/alpine_air.jpg']),
        stock: 25,
        isFeatured: 0,
        topNotes: 'Glacial Accord, Crisp Oxygen, Mint Leaf',
        heartNotes: 'Snow Blossom, Juniper, Pine needles',
        baseNotes: 'Frozen Cedar, Oakmoss, Clean Musk',
        tags: 'Fresh, Marine, Unisex',
      },
      {
        id: 'prod-clean-cotton',
        name: 'Clean Cotton',
        slug: 'clean-cotton',
        tagline: '50ml EDT',
        description: 'Soft, freshly-laundered linen scent.',
        price: 5100,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/clean_cotton.jpg']),
        stock: 35,
        isFeatured: 0,
        topNotes: 'Powdery Aldehydes, White Lily, Clean Air',
        heartNotes: 'Cotton Blossom, Violet Leaf, White Rose',
        baseNotes: 'Pure White Musk, Sandalwood, Soft Amber',
        tags: 'Clean, Powdery, Unisex',
      },
      {
        id: 'prod-bamboo-mist',
        name: 'Bamboo Mist',
        slug: 'bamboo-mist',
        tagline: '50ml EDT',
        description: 'Light, spa-like green bamboo freshness.',
        price: 4500,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/bamboo_mist.jpg']),
        stock: 40,
        isFeatured: 0,
        topNotes: 'Green Bamboo, Cucumber Water, Dewy Grass',
        heartNotes: 'Green Tea, Lotus Petals, White Lily',
        baseNotes: 'Soft Woods, Clean Musk, Vetiver',
        tags: 'Fresh, Green, Unisex',
      },
      {
        id: 'prod-hibiscus-sky',
        name: 'Hibiscus Sky',
        slug: 'hibiscus-sky',
        tagline: '30ml EDT',
        description: 'Warm tropical floral with a sunset glow.',
        price: 4600,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/hibiscus_sky.jpg']),
        stock: 40,
        isFeatured: 0,
        topNotes: 'Hibiscus, Mandarin, Red Berries',
        heartNotes: 'Plumeria, Coconut Water, White Rose',
        baseNotes: 'Solar Amber, Vanilla Pod, Soft Musk',
        tags: 'Floral, Amber, Unisex',
      },
      {
        id: 'prod-pear-sorbet',
        name: 'Pear Sorbet',
        slug: 'pear-sorbet',
        tagline: '30ml EDT',
        description: 'Cool, sweet, fruity pear freshness.',
        price: 5100,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/pear_sorbet.jpg']),
        stock: 20,
        isFeatured: 0,
        topNotes: 'Frosted Pear, Lime Zest, Mint Leaf',
        heartNotes: 'Green Apple, Melon, Freesia',
        baseNotes: 'White Musk, Cedarwood, Ice Accord',
        tags: 'Fresh, Fruit, Unisex',
      },
      {
        id: 'prod-wild-bluebell',
        name: 'Wild Bluebell',
        slug: 'wild-bluebell',
        tagline: '50ml EDP',
        description: 'Soft wildflower floral, gentle and sweet.',
        price: 4800,
        compareAtPrice: 5800,
        imageUrls: JSON.stringify(['/images/wild_bluebell.jpg']),
        stock: 35,
        isFeatured: 0,
        topNotes: 'Bluebell, Clove, Dewy Green Accord',
        heartNotes: 'Lily of the Valley, Jasmine, Persimmon',
        baseNotes: 'Powdery Musk, White Amber, Light Wood',
        tags: 'Floral, Fresh, Unisex',
      },
      {
        id: 'prod-apricot-nectar',
        name: 'Apricot Nectar',
        slug: 'apricot-nectar',
        tagline: '50ml EDT',
        description: 'Juicy, sun-ripened apricot warmth.',
        price: 5800,
        compareAtPrice: 6800,
        imageUrls: JSON.stringify(['/images/apricot_nectar.jpg']),
        stock: 30,
        isFeatured: 0,
        topNotes: 'Ripe Apricot, Mandarin Nectar, Peach',
        heartNotes: 'Apricot Blossom, Freesia, Rosewater',
        baseNotes: 'Bourbon Vanilla, Cashmere Wood, Soft Musk',
        tags: 'Gourmand, Fruit, Unisex',
      },
      {
        id: 'prod-sunny-mimosa',
        name: 'Sunny Mimosa',
        slug: 'sunny-mimosa',
        tagline: '50ml EDT',
        description: 'Bright, sunny golden mimosa florals.',
        price: 5100,
        compareAtPrice: 6200,
        imageUrls: JSON.stringify(['/images/sunny_mimosa.jpg']),
        stock: 30,
        isFeatured: 0,
        topNotes: 'Yellow Mimosa, Cardamom, Bergamot',
        heartNotes: 'Black Tea, Honey Blossom, Violet Leaf',
        baseNotes: 'Flaky Pastry Accord, White Musk, Sandalwood',
        tags: 'Floral, Gourmand, Unisex',
      },
      {
        id: 'prod-cherry-blossom',
        name: 'Cherry Blossom',
        slug: 'cherry-blossom',
        tagline: '30ml EDT',
        description: 'Delicate, romantic pink floral.',
        price: 5200,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/cherry_blossom.jpg']),
        stock: 30,
        isFeatured: 0,
        topNotes: 'Cherry Blossom, Sakura Petals, Bergamot',
        heartNotes: 'White Jasmine, Rosewater, Sweet Pear',
        baseNotes: 'White Musk, Sandalwood, Cashmere Wood',
        tags: 'Floral, Powdery, Unisex',
      },
      {
        id: 'prod-citrus-zest',
        name: 'Citrus Zest',
        slug: 'citrus-zest',
        tagline: '30ml EDT',
        description: 'Bright, zesty bergamot and lemon, a true citrus burst.',
        price: 4200,
        compareAtPrice: 5200,
        imageUrls: JSON.stringify(['/images/citrus_zest.jpg']),
        stock: 45,
        isFeatured: 1,
        topNotes: 'Amalfi Lemon, Bergamot, Grapefruit',
        heartNotes: 'Orange Blossom, Lime Leaf, Mint',
        baseNotes: 'White Honey, Cedarwood, Musk',
        tags: 'Citrus, Fresh, Unisex, Bestseller',
      },
      {
        id: 'prod-midnight-jasmine',
        name: 'Midnight Jasmine',
        slug: 'midnight-jasmine',
        tagline: 'EDT',
        description: 'Deep, sensual jasmine that blooms at night.',
        price: 4700,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/midnight_jasmine.jpg']),
        stock: 40,
        isFeatured: 0,
        topNotes: 'Black Pepper, Clove, Morning Dew',
        heartNotes: 'Night-Blooming Jasmine, White Lily, Ylang-Ylang',
        baseNotes: 'Balsamic Incense, Madagascar Vanilla, Sandalwood',
        tags: 'Floral, Warm, Incense, Unisex',
      },
      {
        id: 'prod-sandalwood-sun',
        name: 'Sandalwood Sun',
        slug: 'sandalwood-sun',
        tagline: '50ml EDT',
        description: 'Warm, creamy sandalwood with a sun-baked glow.',
        price: 4900,
        compareAtPrice: 5900,
        imageUrls: JSON.stringify(['/images/sandalwood_sun.jpg']),
        stock: 35,
        isFeatured: 0,
        topNotes: 'Cardamom, Saffron, Bergamot',
        heartNotes: 'Mysore Sandalwood, Cashmere Wood, Warm Sand',
        baseNotes: 'Golden Amber, Cedarwood, Vanilla',
        tags: 'Woody, Amber, Spicy, Unisex',
      },
      {
        id: 'prod-golden-patchouli',
        name: 'Golden Patchouli',
        slug: 'golden-patchouli',
        tagline: '50ml EDT',
        description: 'Rich, earthy patchouli with a warm amber depth.',
        price: 5000,
        compareAtPrice: 6000,
        imageUrls: JSON.stringify(['/images/golden_patchouli.jpg']),
        stock: 35,
        isFeatured: 0,
        topNotes: 'Cardamom, Clove, Orange Peel',
        heartNotes: 'Golden Patchouli, Warm Wax, Dry Leaves',
        baseNotes: 'Oak Wood, Amber, Vetiver',
        tags: 'Woody, Earthy, Amber, Unisex',
      },
      {
        id: 'prod-lavender-fields',
        name: 'Lavender Fields',
        slug: 'lavender-fields',
        tagline: '50ml EDP',
        description: 'Calming, herbal lavender straight from the field.',
        price: 4400,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/lavender_fields.jpg']),
        stock: 45,
        isFeatured: 0,
        topNotes: 'Wild Lavender, Bergamot, Sage',
        heartNotes: 'Iris, Violet, White Honey',
        baseNotes: 'Cashmere Wood, Powdery Musk, Amber',
        tags: 'Floral, Clean, Powdery, Unisex',
      },
      {
        id: 'prod-oceanic-breeze',
        name: 'Oceanic Breeze',
        slug: 'oceanic-breeze',
        tagline: '50ml EDT',
        description: 'Fresh, salty sea-air scent, cool and invigorating.',
        price: 4500,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/oceanic_breeze.jpg']),
        stock: 45,
        isFeatured: 0,
        topNotes: 'Sea Salt, Ozone, Bergamot',
        heartNotes: 'Water Lily, Kelp, Rosemary',
        baseNotes: 'Wet Stones, Oakmoss, Ambergris',
        tags: 'Fresh, Marine, Unisex',
      },
      {
        id: 'prod-emerald-vetiver',
        name: 'Emerald Vetiver',
        slug: 'emerald-vetiver',
        tagline: 'EDT',
        description: 'Deep, earthy green vetiver, grounded and woody.',
        price: 4800,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/emerald_vetiver.jpg']),
        stock: 35,
        isFeatured: 0,
        topNotes: 'Forest Mist Accord, Grapefruit, Galbanum',
        heartNotes: 'Green Fern, Juniper, Coriander',
        baseNotes: 'Smoked Vetiver, Oakmoss, Patchouli',
        tags: 'Woody, Earthy, Unisex',
      },
      {
        id: 'prod-velvet-orchid',
        name: 'Velvet Orchid',
        slug: 'velvet-orchid',
        tagline: '30ml EDP',
        description: 'Rich, plush floral with a dark, luxurious edge.',
        price: 5200,
        compareAtPrice: 6500,
        imageUrls: JSON.stringify(['/images/velvet_orchid.jpg']),
        stock: 25,
        isFeatured: 0,
        topNotes: 'Black Cherry, Pink Pepper, Rum Accord',
        heartNotes: 'Velvet Orchid, White Jasmine, Gardenia',
        baseNotes: 'Madagascar Vanilla, Amber, Sandalwood',
        tags: 'Floral, Amber, Sweet, Unisex',
      },
      {
        id: 'prod-sapphire-mint',
        name: 'Sapphire Mint',
        slug: 'sapphire-mint',
        tagline: '50ml EDT',
        description: 'Icy-cool mint with a crisp, refreshing chill.',
        price: 4100,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/sapphire_mint.jpg']),
        stock: 55,
        isFeatured: 0,
        topNotes: 'Wild Peppermint, Spearmint, Icy Ozone',
        heartNotes: 'Green Tea, Eucalyptus, Sage',
        baseNotes: 'Cedarwood, Frost Accord, White Musk',
        tags: 'Fresh, Green, Unisex',
      },
      {
        id: 'prod-cedarwood-peak',
        name: 'Cedarwood Peak',
        slug: 'cedarwood-peak',
        tagline: '30ml EDT',
        description: 'Rugged, dry cedarwood with mountain-air freshness.',
        price: 4900,
        compareAtPrice: 6200,
        imageUrls: JSON.stringify(['/images/cedarwood_peak.jpg']),
        stock: 30,
        isFeatured: 0,
        topNotes: 'Alpine Accord, Pine Needles, Bergamot',
        heartNotes: 'Atlas Cedarwood, Cypress, Juniper',
        baseNotes: 'Oakmoss, Patchouli, Dry Wood',
        tags: 'Woody, Fresh, Unisex',
      },
      {
        id: 'prod-peony-silk',
        name: 'Peony Silk',
        slug: 'peony-silk',
        tagline: 'EDT',
        description: 'Soft, silky peony floral, light and elegant.',
        price: 4950,
        compareAtPrice: null,
        imageUrls: JSON.stringify(['/images/peony_silk.jpg']),
        stock: 35,
        isFeatured: 0,
        topNotes: 'Pink Peony, Morning Dew, Mandora',
        heartNotes: 'White Rose, Powdery Iris, Silk Accord',
        baseNotes: 'White Honey, Cashmere Wood, Soft Musk',
        tags: 'Floral, Powdery, Unisex',
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

    return NextResponse.json({ success: true, message: 'Database successfully re-seeded with 35 luxury perfumes, variants, and admin user.' });
  } catch (e: any) {
    console.error('Seeding failed:', e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
