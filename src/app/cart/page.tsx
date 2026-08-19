'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl sm:text-4xl font-serif font-light text-[#111111] mb-12 tracking-tight">
          Shopping Bag
        </h1>

        {cart.length === 0 ? (
          <div className="bg-white border border-[#E6E3DB] py-20 px-6 text-center space-y-6 max-w-2xl mx-auto">
            <ShoppingBag className="w-16 h-16 text-[#C5A880] stroke-1 mx-auto" />
            <h2 className="text-2xl font-serif font-light text-[#111111]">Your bag is currently empty</h2>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              Before you can check out, you must add some perfumes to your shopping bag. Explore our unisex collections to find your fragrance.
            </p>
            <Link
              href="/"
              className="inline-block px-8 py-3.5 bg-[#111111] text-white uppercase text-xs tracking-widest hover:bg-[#C5A880] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Bag Items - Left Column */}
            <div className="lg:col-span-8 bg-white border border-[#E6E3DB] divide-y divide-[#E6E3DB]">
              {cart.map((item) => (
                <div key={item.variantId} className="p-6 flex flex-col sm:flex-row gap-6">
                  {/* Image */}
                  <div className="w-24 h-28 bg-[#FAF9F6] border border-[#E6E3DB] flex items-center justify-center p-3 relative overflow-hidden flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="object-contain h-full w-full"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-grow flex flex-col justify-between">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-serif text-lg font-semibold text-[#111111]">
                          <Link href={`/product/${item.variantId.split('-')[1] || ''}`} className="hover:text-[#C5A880] transition-colors">
                            {item.name}
                          </Link>
                        </h3>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">Size: {item.size}</p>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="flex justify-between items-center mt-6">
                      {/* Quantity Selector */}
                      <div className="flex items-center border border-[#E6E3DB]">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-3 py-1.5 text-gray-500 hover:text-black transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-4 text-xs font-semibold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-3 py-1.5 text-gray-500 hover:text-black transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        onClick={() => removeFromCart(item.variantId)}
                        className="text-gray-400 hover:text-red-600 transition-colors flex items-center gap-1 text-xs uppercase tracking-widest font-semibold"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary - Right Column */}
            <div className="lg:col-span-4 bg-white border border-[#E6E3DB] p-6 space-y-6">
              <h2 className="text-lg font-serif font-semibold text-[#111111] uppercase tracking-wider pb-4 border-b border-[#E6E3DB]">
                Order Summary
              </h2>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal ({cartCount} items)</span>
                  <span className="font-semibold text-gray-900">₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping Estimate</span>
                  <span className="text-green-600 uppercase text-xs font-semibold tracking-wider">Complimentary</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tax</span>
                  <span className="text-gray-400 text-xs italic">Included</span>
                </div>

                <div className="border-t border-[#E6E3DB] pt-4 flex justify-between text-base font-bold text-gray-900">
                  <span className="font-serif">Estimated Total</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href="/checkout"
                  className="w-full flex items-center justify-center gap-2 py-4 bg-[#111111] text-white uppercase text-xs font-bold tracking-widest hover:bg-[#C5A880] transition-colors"
                >
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <div className="text-center mt-4">
                  <Link href="/" className="text-xs uppercase tracking-wider text-[#C5A880] hover:text-black transition-colors">
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
