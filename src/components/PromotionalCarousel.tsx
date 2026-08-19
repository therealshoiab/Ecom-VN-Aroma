'use client';

import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface Slide {
  imageUrl: string;
  title: string;
  subtitle: string;
}

const slides: Slide[] = [
  {
    imageUrl: '/images/promo_model_1.jpg',
    title: 'The Signature Silhouette',
    subtitle: 'Sandalwood and white jasmine, crafted for emotional resonance.',
  },
  {
    imageUrl: '/images/promo_model_2.jpg',
    title: 'Pure Sophistication',
    subtitle: 'Unisex equations that blur the line between art and skin.',
  },
  {
    imageUrl: '/images/lune_bleue_inhale.jpg',
    title: 'A Contrast of Duos',
    subtitle: 'Lune Bleue & Inhale: Cool marine mist meets warm velvety petals.',
  },
  {
    imageUrl: '/images/silver_birch.jpg',
    title: 'Silver Birch',
    subtitle: 'Crisp birch bark, wet earth, and early morning fog.',
  },
  {
    imageUrl: '/images/rose_gold_oud_1.jpg',
    title: 'Rose Gold Oud',
    subtitle: 'A dramatic union of Turkish rose and smoky golden incense.',
  },
  {
    imageUrl: '/images/citrus_zest.jpg',
    title: 'Citrus Zest',
    subtitle: 'Sun-drenched Amalfi lemon, bergamot, and verbena dew.',
  },
  {
    imageUrl: '/images/lune_bleue.jpg',
    title: 'Lune Bleue',
    subtitle: 'Fresh grapefruit, mineral sea salt, and whispers of moonlight.',
  },
  {
    imageUrl: '/images/epice_noire.jpg',
    title: 'Épice Noire',
    subtitle: 'Warm black pepper, cardamom, clove, and rich amber woods.',
  },
  {
    imageUrl: '/images/inhale.jpg',
    title: 'Inhale',
    subtitle: 'Soft lychee, blooming damask rose, and clean white linen.',
  },
  {
    imageUrl: '/images/rose_gold_oud_2.jpg',
    title: 'The Oud Trail',
    subtitle: 'A meditative warmth designed to linger for hours.',
  },
];

export default function PromotionalCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 3000); // Cycle every 3 seconds

    return () => clearInterval(timer);
  }, []);

  const handlePrev = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
  };

  return (
    <div className="relative w-full h-[80vh] bg-[#FAF9F6] overflow-hidden border-b border-[#E6E3DB]">
      {/* Slide Container */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-95 pointer-events-auto scale-100' : 'opacity-0 pointer-events-none scale-105'
          } transform duration-1000`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={slide.imageUrl}
            alt={slide.title}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      {/* Gentle Soft Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/20 pointer-events-none" />

      {/* Glassmorphic Promotion Banner - CENTERED */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] sm:w-[85%] max-w-lg z-10 p-6 md:p-8 bg-black/45 backdrop-blur-md border border-white/10 shadow-2xl flex flex-col justify-between text-center items-center rounded-lg">
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#C5A880] font-semibold block">
            Seasonal Exhibition
          </span>
          <h2 className="text-2xl md:text-4xl font-serif font-light text-white tracking-tight leading-none">
            {slides[currentIndex].title}
          </h2>
          <p className="text-xs md:text-sm text-gray-200 font-light leading-relaxed mt-3">
            {slides[currentIndex].subtitle}
          </p>
        </div>

        {/* Indicators and buttons */}
        <div className="flex flex-col items-center gap-4 w-full pt-5 mt-4 border-t border-white/10">
          <div className="flex gap-1.5">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-6 bg-[#C5A880]' : 'w-1.5 bg-white/30'
                }`}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              className="p-2 rounded-full bg-white/5 border border-white/15 text-white hover:bg-white/20 hover:text-[#C5A880] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNext}
              className="p-2 rounded-full bg-white/5 border border-white/15 text-white hover:bg-white/20 hover:text-[#C5A880] transition-colors"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


