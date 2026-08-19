import { getDb } from '@/db';
import { products } from '@/db/schema';
import HomePageClient from '@/components/HomePageClient';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const db = getDb();
  
  // Fetch all products from D1
  const dbProducts = await db.select().from(products).all();

  // Format product image URLs from JSON
  const formattedProducts = dbProducts.map((p) => {
    let images: string[] = ['/images/trio.png'];
    try {
      const parsed = JSON.parse(p.imageUrls);
      if (Array.isArray(parsed) && parsed.length > 0) {
        images = parsed;
      }
    } catch (e) {}

    return {
      ...p,
      imageUrls: images,
      isFeatured: p.isFeatured === 1,
    };
  });

  return <HomePageClient products={formattedProducts} />;
}
