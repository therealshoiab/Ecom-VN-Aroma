'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ChevronRight, Sparkles, Flame, Droplets, Trees, ArrowRight, Heart } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  imageUrls: string[];
  stock: number;
  isFeatured: number;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  tags: string;
}

interface Variant {
  id: string;
  productId: string;
  size: string;
  price: number;
  stock: number;
}

interface ProductPageClientProps {
  product: Omit<Product, 'imageUrls'> & { imageUrls: string[] };
  variants: Variant[];
  related: Array<Omit<Product, 'imageUrls'> & { imageUrls: string[] }>;
}

export default function ProductPageClient({ product, variants, related }: ProductPageClientProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const router = useRouter();

  // Find default variant (prefer 50ml, otherwise take the first one available)
  const defaultVar = variants.find((v) => v.size === '50ml') || variants[0];
  const [selectedVariant, setSelectedVariant] = useState<Variant>(defaultVar);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(product.imageUrls[0]);
  const [activeTab, setActiveTab] = useState<'top' | 'heart' | 'base'>('top');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOutOfStock = selectedVariant.stock === 0;
  const isLowStock = selectedVariant.stock > 0 && selectedVariant.stock <= 10;

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddToBag = async () => {
    if (isOutOfStock) return;

    await addToCart({
      id: selectedVariant.id,
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      size: selectedVariant.size,
      price: selectedVariant.price,
      imageUrl: product.imageUrls[0],
    }, quantity);

    triggerToast(`Added ${quantity} x ${product.name} (${selectedVariant.size}) to bag.`);
  };

  const handleBuyNow = async () => {
    if (isOutOfStock) return;

    await addToCart({
      id: selectedVariant.id,
      productId: product.id,
      variantId: selectedVariant.id,
      name: product.name,
      size: selectedVariant.size,
      price: selectedVariant.price,
      imageUrl: product.imageUrls[0],
    }, quantity);

    router.push('/checkout');
  };

  return (
    <div className="bg-[#FAF9F6] pb-24 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-white/95 backdrop-blur-md text-[#111111] border border-[#C5A880] px-6 py-4 flex items-center justify-between shadow-2xl animate-fade-in-up rounded-lg">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
            <p className="text-xs uppercase tracking-widest font-semibold">{toastMessage}</p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-6 text-xs text-[#C5A880] hover:text-[#111111] uppercase tracking-widest border-b border-[#C5A880] font-bold"
          >
            View Bag
          </button>
        </div>
      )}

      {/* Breadcrumb Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-xs uppercase tracking-wider text-gray-400 flex items-center gap-2">
        <Link href="/" className="hover:text-black transition-colors">Home</Link>
        <ChevronRight className="w-3 h-3" />
        <Link href="/#catalog" className="hover:text-black transition-colors">Perfumes</Link>
        <ChevronRight className="w-3 h-3" />
        <span className="text-[#111111] font-semibold">{product.name}</span>
      </div>

      {/* Main Details Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left Column: Image Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Main Frame */}
          <div className="w-full aspect-[4/5] bg-white border border-[#E6E3DB] flex items-center justify-center overflow-hidden relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage}
              alt={product.name}
              className="object-cover w-full h-full transition-all duration-500"
            />
          </div>

          {/* Thumbnail list */}
          {product.imageUrls.length > 1 && (
            <div className="flex gap-4">
              {product.imageUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(url)}
                  className={`w-20 h-24 bg-white border flex items-center justify-center transition-all overflow-hidden ${
                    activeImage === url ? 'border-[#111111] scale-[0.98] shadow-sm' : 'border-[#E6E3DB] hover:border-gray-500'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Thumbnail ${idx + 1}`} className="object-cover h-full w-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Information & Actions */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-8">
          <div>
            {/* Tag / Category */}
            <span className="text-[10px] uppercase tracking-[0.30em] text-[#C5A880] font-semibold block mb-2">
              {product.tags.split(',')[0]} · Unisex
            </span>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-serif font-light text-[#111111] tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Tagline */}
            <p className="text-sm text-gray-500 italic mt-2 leading-relaxed">
              {product.tagline}
            </p>

            {/* Price section */}
            <div className="flex items-baseline gap-3 mt-6 pb-6 border-b border-[#E6E3DB]">
              <span className="text-2xl font-semibold text-gray-900">
                ₹{selectedVariant.price.toLocaleString('en-IN')}
              </span>
              {product.compareAtPrice && selectedVariant.size === '50ml' && (
                <span className="text-base text-gray-400 line-through">
                  ₹{product.compareAtPrice.toLocaleString('en-IN')}
                </span>
              )}
            </div>
          </div>

          {/* Size Selector */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs uppercase tracking-wider font-semibold text-[#111111]">
              <span>Select Size</span>
              <span className="text-[#C5A880]">{selectedVariant.size}</span>
            </div>
            <div className="flex gap-3">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => {
                    setSelectedVariant(v);
                    setQuantity(1); // reset quantity selector to 1 on size swap
                  }}
                  className={`flex-1 py-3 text-xs uppercase tracking-widest font-semibold border transition-all rounded-md ${
                    selectedVariant.id === v.id
                      ? 'bg-[#C5A880] text-white border-[#C5A880]'
                      : 'bg-transparent text-gray-500 border-[#E6E3DB] hover:border-[#C5A880] hover:text-[#C5A880]'
                  }`}
                >
                  {v.size}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity and Stock Status */}
          <div className="flex items-center gap-6">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#111111] block">Quantity</span>
              <div className="flex items-center border border-[#E6E3DB] bg-white h-12">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock}
                  className="px-4 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  -
                </button>
                <span className="px-6 text-sm text-gray-800 font-semibold">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(selectedVariant.stock, quantity + 1))}
                  disabled={isOutOfStock || quantity >= selectedVariant.stock}
                  className="px-4 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock Level Indicator */}
            <div className="pt-6">
              {isOutOfStock ? (
                <span className="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-red-600">
                  ● Out of Stock
                </span>
              ) : isLowStock ? (
                <span className="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-amber-500">
                  ● Low Stock (Only {selectedVariant.stock} left)
                </span>
              ) : (
                <span className="inline-flex items-center text-xs uppercase tracking-wider font-semibold text-green-600">
                  ● In Stock
                </span>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={handleAddToBag}
              disabled={isOutOfStock}
              className="w-full py-4 border border-[#C5A880] text-[#C5A880] uppercase text-xs tracking-widest font-bold transition-all hover:bg-[#C5A880] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
            >
              Add to Bag
            </button>
            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="w-full py-4 bg-[#C5A880] text-white uppercase text-xs tracking-widest font-bold transition-all hover:bg-[#b0936b] disabled:opacity-50 disabled:cursor-not-allowed rounded-md"
            >
              Buy Now
            </button>
          </div>

          {/* Scent Notes breakdowns */}
          <div className="border border-[#E6E3DB] bg-white p-6 space-y-4">
            <h3 className="font-serif text-sm font-semibold uppercase tracking-wider text-[#111111]">
              Scent Composition
            </h3>

            {/* Notes Tabs */}
            <div className="flex border-b border-[#E6E3DB] text-[10px] uppercase tracking-widest font-semibold text-gray-400">
              <button
                onClick={() => setActiveTab('top')}
                className={`flex-1 pb-2 border-b-2 text-center transition-colors ${
                  activeTab === 'top' ? 'border-[#C5A880] text-black' : 'border-transparent hover:text-black'
                }`}
              >
                Top Notes
              </button>
              <button
                onClick={() => setActiveTab('heart')}
                className={`flex-1 pb-2 border-b-2 text-center transition-colors ${
                  activeTab === 'heart' ? 'border-[#C5A880] text-black' : 'border-transparent hover:text-black'
                }`}
              >
                Heart Notes
              </button>
              <button
                onClick={() => setActiveTab('base')}
                className={`flex-1 pb-2 border-b-2 text-center transition-colors ${
                  activeTab === 'base' ? 'border-[#C5A880] text-black' : 'border-transparent hover:text-black'
                }`}
              >
                Base Notes
              </button>
            </div>

            {/* Active Notes description */}
            <div className="min-h-12 py-2">
              {activeTab === 'top' && (
                <div>
                  <span className="text-[10px] text-[#C5A880] uppercase tracking-wider font-bold block mb-1">First impression</span>
                  <p className="text-xs text-gray-600 leading-relaxed font-light">{product.topNotes}</p>
                </div>
              )}
              {activeTab === 'heart' && (
                <div>
                  <span className="text-[10px] text-[#C5A880] uppercase tracking-wider font-bold block mb-1">The core identity</span>
                  <p className="text-xs text-gray-600 leading-relaxed font-light">{product.heartNotes}</p>
                </div>
              )}
              {activeTab === 'base' && (
                <div>
                  <span className="text-[10px] text-[#C5A880] uppercase tracking-wider font-bold block mb-1">The lasting trail</span>
                  <p className="text-xs text-gray-600 leading-relaxed font-light">{product.baseNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Full Description & Philosophy */}
      <section className="max-w-3xl mx-auto px-6 py-20 text-center border-t border-[#E6E3DB] mt-16 space-y-6">
        <h3 className="font-serif text-2xl font-light italic text-[#C5A880]">The Story</h3>
        <p className="text-sm text-gray-600 leading-relaxed font-light">
          {product.description}
        </p>
        <div className="w-12 h-[1px] bg-[#C5A880] mx-auto pt-2" />
        <p className="text-[10px] uppercase tracking-widest text-gray-400">
          All our formulations are vegan, cruelty-free, and carefully blended by hand.
        </p>
      </section>

      {/* Related Products Carousel */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-[#E6E3DB]">
          <h2 className="text-2xl font-serif font-light text-[#111111] mb-10 tracking-tight">
            You May Also Experience
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {related.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.slug}`}
                className="group flex flex-col justify-between"
              >
                <div>
                  <div className="w-full aspect-[4/5] bg-white border border-[#E6E3DB] flex items-center justify-center overflow-hidden transition-colors duration-500 group-hover:border-gray-800 relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrls[0]}
                      alt={item.name}
                      className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-103"
                    />
                  </div>
                  <p className="text-[9px] text-[#C5A880] uppercase tracking-[0.2em] font-semibold mt-4">
                    {item.topNotes.split(',')[0]} · {item.baseNotes.split(',')[0]}
                  </p>
                  <h3 className="font-serif text-lg text-[#111111] mt-1 group-hover:text-[#C5A880] transition-colors leading-tight">
                    {item.name}
                  </h3>
                </div>
                <div className="mt-3 flex items-baseline gap-2 pt-2 border-t border-[#E6E3DB]/40 text-xs">
                  <span className="font-semibold text-gray-900">₹{item.price.toLocaleString('en-IN')}</span>
                  <span className="text-[9px] text-gray-400 uppercase tracking-widest ml-auto">50ml</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
