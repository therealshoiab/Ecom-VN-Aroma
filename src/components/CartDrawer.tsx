'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { X, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CartDrawer() {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        {/* Drawer Panel */}
        <div className="w-screen max-w-md bg-[#FAF9F6] border-l border-[#E6E3DB] shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-6 border-b border-[#E6E3DB] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#111111]" />
              <h2 className="text-xl font-serif text-[#111111] tracking-tight">Shopping Bag ({cartCount})</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 text-gray-500 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto py-6 px-6 space-y-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                <ShoppingBag className="w-12 h-12 text-[#C5A880] stroke-1" />
                <div>
                  <p className="font-serif text-lg text-gray-800">Your bag is empty</p>
                  <p className="text-sm text-gray-500 mt-1">Explore our fragrance lineup and find your signature scent.</p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-6 py-2.5 bg-[#111111] text-white text-sm uppercase tracking-wider hover:bg-[#C5A880] transition-colors"
                >
                  Continue Browsing
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.variantId} className="flex gap-4 pb-6 border-b border-[#E6E3DB]/60 last:border-0 last:pb-0">
                  {/* Image */}
                  <div className="w-20 h-24 bg-white border border-[#E6E3DB] relative overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="object-contain h-full w-full p-2"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between">
                        <h3 className="font-serif text-[#111111] leading-tight tracking-tight text-base font-semibold">{item.name}</h3>
                        <p className="text-sm font-semibold text-gray-900">₹{item.price.toLocaleString('en-IN')}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{item.size}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-[#E6E3DB] bg-white">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-2 py-1 text-gray-500 hover:text-black transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-2 py-1 text-gray-500 hover:text-black transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-xs text-gray-400 hover:text-red-600 transition-colors uppercase tracking-wider"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {cart.length > 0 && (
            <div className="border-t border-[#E6E3DB] bg-white px-6 py-6 space-y-4">
              <div className="flex justify-between text-base font-medium text-gray-900">
                <span className="font-serif text-[#111111] tracking-tight">Subtotal</span>
                <span className="font-semibold">₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-xs text-gray-400">Shipping and taxes calculated at checkout.</p>
              <div className="grid grid-cols-1 gap-2 pt-2">
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-[#111111] text-white uppercase text-sm font-semibold tracking-widest hover:bg-[#C5A880] transition-colors"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="w-full text-center py-2 text-xs uppercase tracking-wider text-gray-500 hover:text-black transition-colors"
                >
                  View Full Bag
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
