import { getDb } from '@/db';
import { products, variants } from '@/db/schema';
import { eq, ne } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import ProductPageClient from '@/components/ProductPageClient';
import { staticProducts, getStaticVariants } from '@/lib/staticData';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  let formattedProduct;
  let productVariants = [];
  let formattedRelated = [];

  try {
    const db = getDb();

    // 1. Fetch Product
    const product = await db.select().from(products).where(eq(products.slug, slug)).get();
    if (!product) {
      notFound();
    }

    // 2. Fetch Product Variants
    productVariants = await db.select().from(variants).where(eq(variants.productId, product.id)).all();

    // 3. Fetch Related Products (exclude current product)
    const dbRelated = await db.select().from(products).where(ne(products.id, product.id)).limit(3).all();

    // Format product image URLs from JSON
    const formatImages = (imageUrlsStr: string) => {
      try {
        const parsed = JSON.parse(imageUrlsStr);
        return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['/images/trio.png'];
      } catch (e) {
        return ['/images/trio.png'];
      }
    };

    formattedProduct = {
      ...product,
      imageUrls: formatImages(product.imageUrls),
    };

    formattedRelated = dbRelated.map((p) => ({
      ...p,
      imageUrls: formatImages(p.imageUrls),
    }));
  } catch (e) {
    // Database binding not found or empty (e.g. during static export build)
    const product = staticProducts.find((p) => p.slug === slug);
    if (!product) {
      notFound();
    }

    formattedProduct = {
      ...product,
    };
    productVariants = getStaticVariants(product.id);
    formattedRelated = staticProducts
      .filter((p) => p.id !== product.id)
      .slice(0, 3);
  }

  return (
    <ProductPageClient
      product={formattedProduct}
      variants={productVariants}
      related={formattedRelated}
    />
  );
}
