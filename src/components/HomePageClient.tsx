'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, ArrowDown, Sparkles, Flame, Droplets, Trees } from 'lucide-react';
import Link from 'next/link';

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
      case 'Woody': return <Trees className="w-4 h-4" />;
      case 'Floral': return <Sparkles className="w-4 h-4" />;
      case 'Spicy': return <Flame className="w-4 h-4" />;
      case 'Fresh': return <Droplets className="w-4 h-4" />;
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
        <div className="fixed bottom-6 right-6 z-50 bg-[#111111] text-[#FAF9F6] border border-[#C5A880] px-6 py-4 flex items-center justify-between shadow-2xl animate-fade-in-up">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
            <p className="text-xs uppercase tracking-widest font-semibold">{toast.message}</p>
          </div>
          <button
            onClick={() => setIsCartOpen(true)}
            className="ml-6 text-xs text-[#C5A880] hover:text-white uppercase tracking-widest border-b border-[#C5A880] font-bold"
          >
            View Bag
          </button>
        </div>
      )}

      {/* Hero Banner */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden border-b border-[#E6E3DB]">
        {/* Parallax Background */}
        <div className="absolute inset-0 bg-[#FAF9F6]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/trio.png"
            alt="VN Aroma Premium Scent Trio"
            className="w-full h-full object-cover opacity-15 mix-blend-darken scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-transparent" />
        </div>

        <div className="relative text-center max-w-4xl px-4 space-y-8 animate-fade-in-up">
          <span className="text-[10px] uppercase tracking-[0.4em] text-[#C5A880] font-semibold block">
            Boutique Fragrance House
          </span>
          <h2 className="text-4xl sm:text-7xl font-serif font-light text-[#111111] tracking-tight leading-none">
            The Poetry of <br />
            <span className="font-serif italic text-[#C5A880]">Sensory Silence</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
            Minimalist design. Complex formulations. Pure emotional resonance. Unisex fragrances crafted in small batches.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="#catalog"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-[#111111] text-white uppercase text-xs tracking-widest hover:bg-[#C5A880] transition-colors"
            >
              Explore Collection
            </Link>
            <Link
              href="/#about"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-[#111111] text-[#111111] uppercase text-xs tracking-widest hover:bg-[#111111]/5 transition-colors"
            >
              Our Heritage
            </Link>
          </div>
          <div className="absolute bottom-[-10vh] left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
            <span className="text-[9px] uppercase tracking-widest text-gray-400">Scroll Down</span>
            <ArrowDown className="w-3.5 h-3.5 text-gray-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* Scent Philosophy Callout */}
      <section id="about" className="py-24 bg-white border-b border-[#E6E3DB]">
        <div className="max-w-4xl mx-auto text-center px-6 space-y-6">
          <h3 className="font-serif text-2xl sm:text-3xl font-light italic text-[#C5A880]">"For Men & Women"</h3>
          <p className="text-base sm:text-lg font-serif text-[#111111] leading-relaxed max-w-2xl mx-auto font-light">
            We reject the industry's traditional gender divides. A fragrance is a personal landscape, not a gender label. VN Aroma creates olfactory portraits that belong to anyone who wears them.
          </p>
          <div className="w-12 h-[1px] bg-[#C5A880] mx-auto my-6" />
          <p className="text-xs text-gray-400 uppercase tracking-widest">
            Clear Square Glass / Heavy Bakelite Caps / Pure Colored Essences
          </p>
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
                className={`px-4 py-2 border transition-all ${
                  activeFilter === filter
                    ? 'bg-[#111111] text-white border-[#111111]'
                    : 'bg-transparent text-gray-500 border-[#E6E3DB] hover:border-gray-800 hover:text-black'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {filteredProducts.map((product) => {
            const isSet = product.id === 'prod-discovery-trio';
            return (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group flex flex-col justify-between"
              >
                <div>
                  {/* Image Holder with Quick Add hover */}
                  <div className="w-full aspect-[4/5] bg-white border border-[#E6E3DB] relative overflow-hidden flex items-center justify-center p-8 transition-colors duration-500 group-hover:border-gray-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.imageUrls[0]}
                      alt={product.name}
                      className="object-contain h-[75%] w-[75%] transition-transform duration-700 group-hover:scale-105"
                    />

                    {/* Featured/Bestseller badge */}
                    {product.isFeatured && (
                      <span className="absolute top-4 left-4 text-[9px] uppercase tracking-widest bg-[#111111] text-white px-2 py-1">
                        Bestseller
                      </span>
                    )}

                    {/* Scent Family Identifier */}
                    <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#FAF9F6] border border-[#E6E3DB] px-2 py-1 text-[9px] uppercase tracking-widest text-[#C5A880]">
                      {product.tags.includes('Woody') && getFamilyIcon('Woody')}
                      {product.tags.includes('Floral') && getFamilyIcon('Floral')}
                      {product.tags.includes('Spicy') && getFamilyIcon('Spicy')}
                      {product.tags.includes('Fresh') && getFamilyIcon('Fresh')}
                      <span>{product.tags.split(',')[0]}</span>
                    </div>

                    {/* Quick Add Overlay */}
                    <div className="absolute inset-x-4 bottom-4 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      <button
                        onClick={(e) => handleQuickAdd(product, e)}
                        className="w-full bg-[#111111] text-white py-3 text-xs uppercase tracking-widest font-semibold hover:bg-[#C5A880] transition-colors flex items-center justify-center gap-2 shadow-lg"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Quick Add ({isSet ? '3 x 50ml' : '50ml'})
                      </button>
                    </div>
                  </div>

                  {/* Scent Notes teaser */}
                  <p className="text-[10px] text-[#C5A880] uppercase tracking-[0.2em] font-semibold mt-6">
                    {product.topNotes.split(',')[0]} · {product.heartNotes.split(',')[0]} · {product.baseNotes.split(',')[0]}
                  </p>

                  <h3 className="font-serif text-xl font-light text-[#111111] mt-2 group-hover:text-[#C5A880] transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-xs text-gray-500 italic mt-1 leading-normal">
                    {product.tagline}
                  </p>
                </div>

                <div className="mt-4 flex items-baseline gap-2 border-t border-[#E6E3DB]/40 pt-4">
                  <span className="text-sm font-semibold text-[#111111]">
                    ₹{product.price.toLocaleString('en-IN')}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-xs text-gray-400 line-through">
                      ₹{product.compareAtPrice.toLocaleString('en-IN')}
                    </span>
                  )}
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 ml-auto">
                    {isSet ? 'Set' : '50ml'}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Philosophy Section */}
      <section id="categories" className="bg-[#111111] text-[#FAF9F6] border-y border-[#E6E3DB]/20 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-semibold">The Craft</span>
              <h2 className="text-3xl sm:text-4xl font-serif font-light tracking-tight text-white">
                Scent Families Inspired by the Natural & Unnatural World
              </h2>
              <p className="text-sm text-[#FAF9F6]/60 leading-relaxed font-light">
                We develop our fragrance equations using high concentrations of organic absolutes and pure synthetic modules. The clear glass showcases the natural tint of each scent — from the pale marine blue of Lune Bleue to the spicy golden amber of Épice Noire.
              </p>

              {/* Families Grid list */}
              <div className="grid grid-cols-2 gap-6 pt-4">
                <div className="border-l-2 border-[#C5A880] pl-4 space-y-1">
                  <h4 className="font-serif text-sm font-semibold text-white">Woody & Sacred</h4>
                  <p className="text-xs text-[#FAF9F6]/50">Incense, sandalwood, vetiver, and cedar.</p>
                </div>
                <div className="border-l-2 border-[#C5A880] pl-4 space-y-1">
                  <h4 className="font-serif text-sm font-semibold text-white">Floral & Velvety</h4>
                  <p className="text-xs text-[#FAF9F6]/50">Damask rose, white honey, neroli, and peony.</p>
                </div>
                <div className="border-l-2 border-[#C5A880] pl-4 space-y-1">
                  <h4 className="font-serif text-sm font-semibold text-white">Spicy & Seductive</h4>
                  <p className="text-xs text-[#FAF9F6]/50">Black pepper, cardamom, clove, and tobacco.</p>
                </div>
                <div className="border-l-2 border-[#C5A880] pl-4 space-y-1">
                  <h4 className="font-serif text-sm font-semibold text-white">Fresh & Marine</h4>
                  <p className="text-xs text-[#FAF9F6]/50">Sea salt, grapefruit, verbena, and wild basil.</p>
                </div>
              </div>
            </div>

            {/* Aesthetic Showcase photo container */}
            <div className="aspect-[4/3] bg-white/5 border border-[#FAF9F6]/10 flex items-center justify-center p-8 relative overflow-hidden group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/trio.png"
                alt="Boutique perfume aesthetic"
                className="object-contain h-[85%] w-[85%] opacity-70 group-hover:opacity-100 transition-opacity duration-700"
              />
              <div className="absolute inset-0 bg-[#111111]/30 group-hover:bg-transparent transition-colors duration-700" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
