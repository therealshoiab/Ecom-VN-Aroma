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
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-white/10 pointer-events-none" />
    </div>
  );
}


