'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#FAF9F6] text-gray-600 font-sans border-t border-[#E6E3DB] py-16 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand Info */}
          <div className="space-y-4">
            <h2 className="text-xl font-serif text-[#111111] tracking-widest uppercase font-semibold">VN Aroma</h2>
            <p className="text-xs uppercase tracking-wider text-[#C5A880]">For Men & Women</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              A boutique fragrance house creating modern, sensory-rich perfumes that blur the boundaries between art and emotion.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">Families</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#categories" className="hover:text-[#C5A880] transition-colors">Citrus & Fresh</Link></li>
              <li><Link href="/#categories" className="hover:text-[#C5A880] transition-colors">Spicy & Amber</Link></li>
              <li><Link href="/#categories" className="hover:text-[#C5A880] transition-colors">Floral & Delicate</Link></li>
              <li><Link href="/#categories" className="hover:text-[#C5A880] transition-colors">Woody & Incense</Link></li>
            </ul>
          </div>

          {/* Corporate Links */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">Services</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/#about" className="hover:text-[#C5A880] transition-colors">Our Philosophy</Link></li>
              <li><Link href="/account" className="hover:text-[#C5A880] transition-colors">Order Tracking</Link></li>
              <li><span className="text-gray-400">Razorpay Test Checkout</span></li>
              <li><span className="text-gray-400">Cloudflare D1 Database</span></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[#111111]">Newsletter</h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Subscribe to receive olfactory inspiration, private event invitations, and new collection launches.
            </p>
            <form onSubmit={(e) => e.preventDefault()} className="flex">
              <input
                type="email"
                placeholder="Email Address"
                className="bg-transparent border border-gray-300 px-3 py-2 text-xs w-full focus:outline-none focus:border-[#C5A880] text-[#111111]"
                required
              />
              <button
                type="submit"
                className="bg-[#C5A880] text-white px-4 text-xs font-semibold hover:bg-[#111111] transition-colors uppercase tracking-widest"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-[#E6E3DB] mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center text-[10px] uppercase tracking-widest text-gray-400">
          <p>© {new Date().getFullYear()} VN Aroma. All Rights Reserved.</p>
          <div className="flex space-x-6 mt-4 sm:mt-0">
            <span>Boutique Perfumery</span>
            <span>Unisex Fragrances</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
