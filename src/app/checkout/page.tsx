'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ShoppingBag, CreditCard, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface ShippingAddress {
  name: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export default function CheckoutPage() {
  const { cart, cartTotal, cartCount, clearCart, isLoggedIn, setIsLoggedIn, syncCartWithDb } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    phone: '',
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);

  // Authentication Fields (for inline checkout auth overlay)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Pre-fill profile info if logged in
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const user = (await res.json()) as any;
          setEmail(user.email);
          setAddress((prev) => ({
            ...prev,
            name: user.name || '',
          }));
          setIsLoggedIn(true);
        } else {
          setIsLoggedIn(false);
        }
      } catch (e) {
        console.error('Failed to prefill user info:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [setIsLoggedIn]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    const endpoint = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = authMode === 'register' 
      ? { name: authName, email: authEmail, password: authPassword } 
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = (await res.json()) as any;

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setIsLoggedIn(true);
      setEmail(data.user.email);
      setAddress((prev) => ({
        ...prev,
        name: data.user.name || '',
      }));
      await syncCartWithDb(); // Merges local storage items into user's DB cart on login
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const validateForm = () => {
    if (!email || !address.name || !address.addressLine1 || !address.city || !address.state || !address.postalCode || !address.phone) {
      return 'Please fill in all required fields.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (address.phone.length < 10) {
      return 'Please enter a valid contact phone number.';
    }
    return null;
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      // 1. Create order on backend (returns Razorpay order details)
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });

      if (!res.ok) {
        const err = (await res.json()) as any;
        throw new Error(err.error || 'Failed to create payment order');
      }

      const orderData = (await res.json()) as any;
      setIsMockMode(orderData.isMock);

      if (orderData.isMock) {
        // MOCK PAYMENTS BYPASS FLOW
        await handlePaymentVerify({
          razorpay_order_id: orderData.id,
          razorpay_payment_id: `pay_mock_${Math.random().toString(36).substring(2, 11)}`,
          razorpay_signature: 'mock_signature',
          orderNumber: orderData.receipt,
          isMock: true,
        });
      } else {
        // REAL RAZORPAY MODAL POPUP
        launchRazorpay(orderData);
      }
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  const launchRazorpay = (orderData: any) => {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'VN Aroma',
      description: 'Fragrance order payment',
      image: '/images/trio.png',
      order_id: orderData.id,
      handler: async function (response: any) {
        await handlePaymentVerify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          orderNumber: orderData.receipt,
          isMock: false,
        });
      },
      prefill: {
        name: address.name,
        email: email,
        contact: address.phone,
      },
      theme: {
        color: '#111111',
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.on('payment.failed', function (response: any) {
      setError(response.error.description || 'Payment Transaction Failed.');
      setSubmitting(false);
    });
    rzp.open();
  };

  const handlePaymentVerify = async (paymentDetails: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    orderNumber: string;
    isMock: boolean;
  }) => {
    try {
      const res = await fetch('/api/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...paymentDetails,
          shippingAddress: address,
          email,
          items: cart,
        }),
      });

      if (!res.ok) {
        const err = (await res.json()) as any;
        throw new Error(err.error || 'Failed to verify payment and process order');
      }

      const verifyData = (await res.json()) as any;

      // Clear cart context
      await clearCart();

      // Redirect to success page
      router.push(`/checkout-success?orderNumber=${verifyData.orderNumber}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 text-[#C5A880] animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-16 font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/cart" className="inline-flex items-center gap-1 text-xs uppercase tracking-wider text-gray-500 hover:text-black transition-colors font-semibold">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Bag</span>
          </Link>
        </div>

        <h1 className="text-3xl font-serif font-light text-[#111111] mb-12 tracking-tight">Checkout</h1>

        {cart.length === 0 && !submitting ? (
          <div className="bg-white border border-[#E6E3DB] p-8 text-center max-w-md mx-auto">
            <p className="font-serif text-lg mb-4">No items to checkout.</p>
            <Link href="/" className="px-6 py-2.5 bg-[#111111] text-white uppercase text-xs tracking-widest hover:bg-[#C5A880] transition-colors">
              Go to Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* LEFT COLUMN: AUTHENTICATION OR SHIPPING FORM */}
            {!isLoggedIn ? (
              <div className="lg:col-span-7 p-8 bg-white/40 backdrop-blur-md border border-white/20 shadow-xl space-y-6">
                <div className="flex border-b border-[#E6E3DB] pb-4">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setAuthError(null); }}
                    className={`flex-1 text-center text-xs uppercase tracking-wider font-semibold pb-2 border-b-2 transition-all ${
                      authMode === 'login' ? 'border-[#C5A880] text-black font-bold' : 'border-transparent text-gray-400'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setAuthError(null); }}
                    className={`flex-1 text-center text-xs uppercase tracking-wider font-semibold pb-2 border-b-2 transition-all ${
                      authMode === 'register' ? 'border-[#C5A880] text-black font-bold' : 'border-transparent text-gray-400'
                    }`}
                  >
                    Create Account
                  </button>
                </div>

                <h2 className="text-lg font-serif font-light text-center text-[#111111] tracking-tight">
                  {authMode === 'login' ? 'Welcome Back to VN Aroma' : 'Become a Connoisseur'}
                </h2>

                <p className="text-[11px] text-center text-gray-500 font-light max-w-sm mx-auto">
                  Please sign in or create an account to secure your purchase and view your olfactory order tracking.
                </p>

                {authError && (
                  <div className="p-3 bg-red-50 border-l-2 border-red-500 text-xs text-red-700 uppercase tracking-widest font-semibold">
                    {authError}
                  </div>
                )}

                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  {authMode === 'register' && (
                    <div>
                      <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-700 block mb-1">Full Name</label>
                      <input
                        type="text"
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                        placeholder="e.g. Jean Patou"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-700 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                      placeholder="connoisseur@vnaroma.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] uppercase tracking-wider font-semibold text-gray-700 block mb-1">Password</label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-4 bg-[#111111] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#C5A880] transition-colors flex items-center justify-center gap-2"
                  >
                    {authLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {authMode === 'login' ? 'Authenticate' : 'Register & Unveil'}
                  </button>
                </form>
              </div>
            ) : (
              /* Delivery Form - Left Column */
              <form onSubmit={handleCheckoutSubmit} className="lg:col-span-7 bg-white border border-[#E6E3DB] p-8 space-y-6">
                <h2 className="text-lg font-serif font-semibold text-[#111111] uppercase tracking-wider pb-4 border-b border-[#E6E3DB]">
                  Delivery Information
                </h2>

                {error && (
                  <div className="p-4 bg-red-50 border-l-2 border-red-600 text-xs text-red-700 uppercase tracking-widest font-semibold">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={address.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +91 9876543210"
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">Recipient Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={address.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">Street Address *</label>
                    <input
                      type="text"
                      name="addressLine1"
                      value={address.addressLine1}
                      onChange={handleInputChange}
                      placeholder="House / Apartment number, street name"
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">Apartment, Suite, Unit, etc. (Optional)</label>
                    <input
                      type="text"
                      name="addressLine2"
                      value={address.addressLine2}
                      onChange={handleInputChange}
                      placeholder="Suite, unit, building, floor, etc."
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={address.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">State / Province *</label>
                    <input
                      type="text"
                      name="state"
                      value={address.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">PIN / Postal Code *</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={address.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                      required
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 bg-[#111111] text-white uppercase text-xs font-bold tracking-widest hover:bg-[#C5A880] transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing Checkout...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4" />
                        Pay with Razorpay (Test Mode)
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Order Review - Right Column */}
            <div className="lg:col-span-5 bg-white border border-[#E6E3DB] p-8 space-y-6">
              <h2 className="text-lg font-serif font-semibold text-[#111111] uppercase tracking-wider pb-4 border-b border-[#E6E3DB]">
                Bag Summary
              </h2>

              <div className="divide-y divide-[#E6E3DB]/60 overflow-y-auto max-h-96 pr-2">
                {cart.map((item) => (
                  <div key={item.variantId} className="py-4 flex gap-4 first:pt-0">
                    <div className="w-12 h-16 bg-[#FAF9F6] border border-[#E6E3DB] flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.imageUrl} alt={item.name} className="object-contain h-full w-full" />
                    </div>
                    <div className="flex-grow flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif text-sm font-semibold text-[#111111] leading-tight">{item.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{item.size} x {item.quantity}</p>
                      </div>
                      <p className="text-xs font-semibold text-gray-900">₹{(item.price * item.quantity).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#E6E3DB] pt-6 space-y-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
                <div className="flex justify-between">
                  <span>Bag Count</span>
                  <span className="text-black font-semibold">{cartCount} items</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 uppercase font-semibold">Complimentary</span>
                </div>
                <div className="border-t border-[#E6E3DB] pt-4 flex justify-between text-sm text-black font-bold">
                  <span className="font-serif">Order Total</span>
                  <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
