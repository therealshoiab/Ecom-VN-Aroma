'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, User, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { cartCount, setIsCartOpen, isLoggedIn, setIsLoggedIn, clearCart } = useCart();
  const router = useRouter();
  const [bannerMessage, setBannerMessage] = useState<string>('✨ DISCOVER OUR HANDCRAFTED BOUTIQUE PERFUME COLLECTION | FREE SHIPPING PAN-INDIA ✨');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (res.ok) {
          const data = (await res.json()) as any;
          if (data && data.settings && data.settings.banner_message) {
            setBannerMessage(data.settings.banner_message);
          }
        }
      } catch (e) {
        console.error('Failed to load banner settings:', e);
      }
    };
    fetchSettings();
  }, []);

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        setIsLoggedIn(false);
        await clearCart();
        router.push('/');
      }
    } catch (e) {
      console.error('Failed to log out:', e);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F6]/80 backdrop-blur-md border-b border-[#E6E3DB] font-sans">
      {bannerMessage && (
        <div className="bg-[#111111] text-[#FAF9F6] text-[8px] sm:text-[9px] uppercase tracking-[0.25em] py-2 px-4 text-center font-medium border-b border-[#E6E3DB]/10 select-none">
          {bannerMessage}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Nav Links - Left (Hidden on small screens) */}
          <nav className="hidden md:flex space-x-6 text-[10px] uppercase tracking-widest text-[#111111]/80 font-medium">
            <Link href="/" className="hover:text-[#C5A880] transition-colors">
              Collection
            </Link>
            <Link href="/#categories" className="hover:text-[#C5A880] transition-colors">
              Families
            </Link>
            <Link href="/#about" className="hover:text-[#C5A880] transition-colors">
              About
            </Link>
          </nav>

          {/* Logo - Center */}
          <div className="flex-1 md:flex-none text-center">
            <Link href="/" className="inline-block">
              <h1 className="text-lg sm:text-xl font-serif text-[#111111] font-bold tracking-wider uppercase">
                VN Aroma
              </h1>
              <p className="text-[7.5px] text-[#C5A880] font-sans uppercase tracking-[0.25em] -mt-1 block text-center">
                For Men & Women
              </p>
            </Link>
          </div>

          <div className="flex items-center space-x-4 text-[#111111]">
            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <Link
                  href="/account"
                  className="p-1 hover:text-[#C5A880] transition-colors flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold"
                  title="My Account"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Account</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-1 hover:text-red-600 transition-colors flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold"
                  title="Log Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/account"
                className="p-1 hover:text-[#C5A880] transition-colors flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold"
                title="Log In / Sign Up"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="p-1 relative hover:text-[#C5A880] transition-colors flex items-center gap-1 text-[10px] uppercase tracking-widest font-semibold"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bag</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#111111] text-[#FAF9F6] text-[8px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
