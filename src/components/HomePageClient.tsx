'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowDown, Sparkles, Flame, Droplets, Trees } from 'lucide-react';
import Link from 'next/link';
import PromotionalCarousel from '@/components/PromotionalCarousel';

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
  isFeatured: boolean;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  tags: string;
}

interface HomePageClientProps {
  products: Product[];
}

interface ToastState {
  show: boolean;
  message: string;
}

export default function HomePageClient({ products }: HomePageClientProps) {
  const { addToCart, setIsCartOpen } = useCart();
  const [activeFilter, setActiveFilter] = useState<'All' | 'Bestsellers' | 'New' | 'Woody' | 'Floral' | 'Spicy' | 'Fresh'>('All');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  // Scent family icons mapper
  const getFamilyIcon = (family: string) => {
    switch (family) {
      case 'Woody': return <Trees className="w-3 h-3" />;
      case 'Floral': return <Sparkles className="w-3 h-3" />;
      case 'Spicy': return <Flame className="w-3 h-3" />;
      case 'Fresh': return <Droplets className="w-3 h-3" />;
      default: return null;
    }
  };

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => {
      setToast({ show: false, message: '' });
    }, 3000);
  };

  const handleQuickAdd = async (product: Product, e: React.MouseEvent) => {
    e.preventDefault(); // Prevents navigating to product page
    e.stopPropagation();

    const isTrio = product.id === 'prod-discovery-trio';
    const variantId = isTrio ? 'var-discovery-trio-3x50ml' : `var-${product.slug}-50`;
    const size = isTrio ? '3 x 50ml' : '50ml';

    await addToCart({
      id: variantId,
      productId: product.id,
      variantId: variantId,
      name: product.name,
      size: size,
      price: product.price,
      imageUrl: product.imageUrls[0],
    }, 1);

    showToast(`Added ${product.name} (${size}) to your bag.`);
  };

  const filteredProducts = products.filter((p) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Bestsellers') return p.isFeatured;
    if (activeFilter === 'New') return p.tags.toLowerCase().includes('new arrival');
    return p.tags.toLowerCase().includes(activeFilter.toLowerCase());
  });

  return (
    <div className="bg-[#FAF9F6] pb-24 font-sans relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 bg-white/95 backdrop-blur-md text-[#111111] border border-[#C5A880] px-6 py-4 flex items-center justify-between shadow-2xl animate-fade-in-up rounded-lg">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
            <p className="text-xs uppercase tracking-widest font-semibold">{toast.message}</p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-6 text-xs text-[#C5A880] hover:text-[#111111] uppercase tracking-widest border-b border-[#C5A880] font-bold"
          >
            View Bag
          </button>
        </div>
      )}

      {/* Promotional Slideshow Header */}
      <PromotionalCarousel />

      {/* Scent Philosophy Callout */}
      <section id="about" className="py-24 bg-white border-b border-[#E6E3DB]">
        <div className="max-w-7xl mx-auto text-center px-6 space-y-6">
          <h3 className="font-serif text-2xl sm:text-3xl font-light italic text-[#C5A880]">"For Men & Women"</h3>
          <p className="text-base sm:text-lg font-serif text-[#111111] leading-relaxed max-w-2xl mx-auto font-light">
            We reject the industry's traditional gender divides. A fragrance is a personal landscape, not a gender label. VN Aroma creates olfactory portraits that belong to anyone who wears them.
          </p>
          <div className="w-12 h-[1px] bg-[#C5A880] mx-auto my-6" />
          <p className="text-xs text-gray-400 uppercase tracking-widest">
            Clear Square Glass / Heavy Bakelite Caps / Pure Colored Essences
          </p>

          {/* Three Glassmorphic Tabs/Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12 max-w-5xl mx-auto text-left">
            <div className="bg-[#FAF9F6]/80 backdrop-blur-md border border-[#E6E3DB] p-6 space-y-3 rounded-lg hover:border-[#C5A880]/40 hover:shadow-md transition-all duration-300">
              <div className="w-9 h-9 bg-[#C5A880]/15 rounded-full flex items-center justify-center text-[#C5A880]">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-serif text-xs font-bold text-[#111111] uppercase tracking-wider">100% Pure Essences</h4>
              <p className="text-[11px] text-gray-500 font-light leading-relaxed">
                Formulated with natural organic absolutes and concentrated oils for premium silage.
              </p>
            </div>

            <div className="bg-[#FAF9F6]/80 backdrop-blur-md border border-[#E6E3DB] p-6 space-y-3 rounded-lg hover:border-[#C5A880]/40 hover:shadow-md transition-all duration-300">
              <div className="w-9 h-9 bg-[#C5A880]/15 rounded-full flex items-center justify-center text-[#C5A880]">
                <Droplets className="w-4 h-4" />
              </div>
              <h4 className="font-serif text-xs font-bold text-[#111111] uppercase tracking-wider">Boutique Design</h4>
              <p className="text-[11px] text-gray-500 font-light leading-relaxed">
                Presented in premium heavy square glass bottles with sleek, tactile black caps.
              </p>
            </div>

            <div className="bg-[#FAF9F6]/80 backdrop-blur-md border border-[#E6E3DB] p-6 space-y-3 rounded-lg hover:border-[#C5A880]/40 hover:shadow-md transition-all duration-300">
              <div className="w-9 h-9 bg-[#C5A880]/15 rounded-full flex items-center justify-center text-[#C5A880]">
                <Trees className="w-4 h-4" />
              </div>
              <h4 className="font-serif text-xs font-bold text-[#111111] uppercase tracking-wider">Gender Fluid</h4>
              <p className="text-[11px] text-gray-500 font-light leading-relaxed">
                Olfactory portraits created to represent personal character rather than tags.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog Section */}
      <section id="catalog" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        {/* Navigation & Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-[#E6E3DB] pb-8 mb-12">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold">The Catalogue</span>
            <h2 className="text-3xl sm:text-4xl font-serif font-light text-[#111111]">Signature Perfumes</h2>
          </div>

          {/* Scent Family Filters */}
          <div className="flex flex-wrap gap-2 mt-6 md:mt-0 text-[10px] uppercase tracking-widest font-semibold">
            {(['All', 'Bestsellers', 'New', 'Woody', 'Floral', 'Spicy', 'Fresh'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 border transition-all rounded-md ${
                  activeFilter === filter
                    ? 'bg-[#C5A880] text-white border-[#C5A880]'
                    : 'bg-white/40 backdrop-blur-md text-gray-500 border-[#E6E3DB] hover:border-[#C5A880] hover:text-[#C5A880]'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
          {filteredProducts.map((product) => {
            const isSet = product.id === 'prod-discovery-trio';
            return (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group flex flex-col justify-between p-6 bg-white/30 backdrop-blur-md border border-white/20 shadow-sm hover:shadow-xl hover:bg-white/50 hover:border-[#C5A880]/30 transition-all duration-500"
              >
                <div className="relative">
                  {/* Image Holder with Quick Add hover */}
                  <div className="w-full aspect-square relative overflow-hidden flex items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="object-contain h-[90%] w-[90%] transition-transform duration-700 group-hover:scale-103"
                    />

                    {/* Featured/Bestseller badge */}
                    {product.isFeatured && (
                      <span className="absolute top-0 left-0 text-[8px] uppercase tracking-widest bg-[#C5A880] text-white px-2 py-1 z-10 font-bold rounded-br-md">
                        Bestseller
                      </span>
                    )}

                    {/* Scent Family Identifier */}
                    <div className="absolute top-0 right-0 flex items-center gap-1 bg-white/70 backdrop-blur-sm border border-white/30 px-2 py-0.5 text-[8px] uppercase tracking-widest text-[#C5A880] z-10 font-bold">
                      {product.tags.includes('Woody') && getFamilyIcon('Woody')}
                      {product.tags.includes('Floral') && getFamilyIcon('Floral')}
                      {product.tags.includes('Spicy') && getFamilyIcon('Spicy')}
                      {product.tags.includes('Fresh') && getFamilyIcon('Fresh')}
                      <span className="ml-1">{product.tags.split(',')[0]}</span>
                    </div>

                    {/* Quick Add Overlay */}
                    <div className="absolute inset-x-2 bottom-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-10">
                      <button
                        onClick={(e) => handleQuickAdd(product, e)}
                        className="w-full bg-[#C5A880] text-white py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-[#b0936b] transition-colors flex items-center justify-center gap-1.5 shadow-md rounded-md"
                      >
                        <ShoppingBag className="w-3 h-3" />
                        Quick Add ({isSet ? '3 x 50ml' : '50ml'})
                      </button>
                    </div>
                  </div>

                  {/* Scent Notes teaser */}
                  <p className="text-[9px] text-[#C5A880] uppercase tracking-[0.2em] font-semibold mt-4">
                    {product.topNotes.split(',')[0]} · {product.heartNotes.split(',')[0]} · {product.baseNotes.split(',')[0]}
                  </p>

                  <h3 className="font-serif text-lg font-light text-[#111111] mt-1.5 group-hover:text-[#C5A880] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[11px] text-gray-500 italic mt-0.5 leading-snug">
                    {product.tagline}
                  </p>
                </div>

                <div className="mt-4 flex items-baseline gap-2 border-t border-black/5 pt-3.5">
                  <span className="text-xs font-bold text-[#111111]">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-[10px] text-gray-400 line-through">
                      ₹{product.compareAtPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-[9px] uppercase tracking-wider text-gray-400 ml-auto font-semibold">
                    {isSet ? 'Set' : '50ml'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="categories" className="bg-[#FAF9F6] text-[#111111] border-y border-[#E6E3DB] py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-semibold">The Craft</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-[#111111]">
                Scent Families Inspired by the Natural & Unnatural World
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed font-light">
                We develop our fragrance equations using high concentrations of organic absolutes and pure synthetic modules. The clear glass showcases the natural tint of each scent — from the pale marine blue of Lune Bleue to the spicy golden amber of Épice Noire.
              </p>

              {/* Families Grid list */}
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="border-l-2 border-[#C5A880] pl-4 space-y-1">
                  <h4 className="font-serif text-sm font-semibold text-[#111111]">Woody & Sacred</h4>
                  <p className="text-xs text-gray-500">Incense, sandalwood, vetiver, and cedar.</p>
                </div>
                <div className="border-l-2 border-[#C5A880] pl-4 space-y-1">
                  <h4 className="font-serif text-sm font-semibold text-[#111111]">Floral & Velvety</h4>
                  <p className="text-xs text-gray-500">Damask rose, white honey, neroli, and peony.</p>
                </div>
                <div className="border-l-2 border-[#C5A880] pl-4 space-y-1">
                  <h4 className="font-serif text-sm font-semibold text-[#111111]">Spicy & Seductive</h4>
                  <p className="text-xs text-gray-500">Black pepper, cardamom, clove, and tobacco.</p>
                </div>
                <div className="border-l-2 border-[#C5A880] pl-4 space-y-1">
                  <h4 className="font-serif text-sm font-semibold text-[#111111]">Fresh & Marine</h4>
                  <p className="text-xs text-gray-500">Sea salt, grapefruit, verbena, and wild basil.</p>
                </div>
              </div>
            </div>

            {/* Aesthetic Showcase photo container */}
            <div className="aspect-[4/3] bg-white/75 border border-[#E6E3DB] shadow-md flex items-center justify-center p-8 relative overflow-hidden group rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/trio.png"
                alt="Boutique perfume aesthetic"
                className="object-contain h-[85%] w-[85%] opacity-100 group-hover:scale-105 transition-transform duration-700"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
