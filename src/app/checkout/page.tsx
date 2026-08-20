'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import Script from 'next/script';
import { ShoppingBag, CreditCard, ArrowLeft, Loader2, Landmark, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface ShippingAddress {
  name: string;
  houseFlatNo: string;
  areaStreetNearby: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

export default function CheckoutPage() {
  const { cart, cartTotal, cartCount, clearCart, isLoggedIn, setIsLoggedIn, syncCartWithDb } = useCart();
  const router = useRouter();

  const [address, setAddress] = useState<ShippingAddress>({
    name: '',
    houseFlatNo: '',
    areaStreetNearby: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
  });
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMockMode, setIsMockMode] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

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

    const endpoint = authMode === 'register' ? '/api/auth/[action]' : '/api/auth/[action]';
    const actionPath = authMode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = authMode === 'register' 
      ? { name: authName, email: authEmail, password: authPassword } 
      : { email: authEmail, password: authPassword };

    try {
      const res = await fetch(actionPath, {
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
    if (!email || !address.name || !address.houseFlatNo || !address.areaStreetNearby || !address.city || !address.state || !address.pincode || !address.phone) {
      return 'Please fill in all required fields.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address.';
    }
    if (address.phone.length < 10) {
      return 'Please enter a valid contact phone number.';
    }
    if (address.pincode.length < 6) {
      return 'Please enter a valid 6-digit Pincode.';
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
      if (paymentMethod === 'cod') {
        // Cash on Delivery direct checkout flow
        const orderNumber = `VN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
        await handlePaymentVerify({
          razorpay_order_id: 'cod_order',
          razorpay_payment_id: 'cod_payment',
          razorpay_signature: 'cod_signature',
          orderNumber,
          isMock: true,
          isCOD: true,
        });
      } else {
        // Online Payment via Razorpay
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
            isCOD: false,
          });
        } else {
          // REAL RAZORPAY MODAL POPUP
          launchRazorpay(orderData);
        }
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
      image: '/images/trio_luxury.jpg',
      order_id: orderData.id,
      handler: async function (response: any) {
        await handlePaymentVerify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
          orderNumber: orderData.receipt,
          isMock: false,
          isCOD: false,
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
    isCOD: boolean;
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

      // Save order details to localStorage for WhatsApp confirmation
      try {
        const orderDetails = {
          orderNumber: verifyData.orderNumber,
          items: cart,
          totalAmount: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
          address: address,
          paymentMethod: paymentDetails.isCOD ? 'Cash on Delivery (COD)' : 'Paid Online (Razorpay)',
        };
        localStorage.setItem('lastOrder', JSON.stringify(orderDetails));
      } catch (storageErr) {
        console.error('Failed to save lastOrder in localStorage:', storageErr);
      }

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
      <div className="bg-[#FAF9F6] min-h-[75vh] flex items-center justify-center font-sans">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#C5A880] stroke-1" />
          <span className="text-xs uppercase tracking-widest text-[#C5A880] font-semibold">Securing Checkout Portal...</span>
        </div>
      </div>
    );
  }

  // If cart is empty, redirect back
  if (cart.length === 0) {
    return (
      <div className="bg-[#FAF9F6] min-h-[75vh] flex items-center justify-center py-16 font-sans">
        <div className="max-w-md w-full bg-white border border-[#E6E3DB] p-8 text-center space-y-6 shadow-md rounded-lg">
          <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto stroke-1" />
          <h1 className="text-xl font-serif text-[#111111]">Your Shopping Bag is Empty</h1>
          <p className="text-xs text-gray-500 font-light">Add luxury scents to your bag before proceeding to checkout.</p>
          <Link href="/" className="inline-block px-6 py-3.5 bg-black hover:bg-[#C5A880] text-white uppercase text-xs font-bold tracking-widest transition-colors rounded-md shadow-sm">
            Discover Fragrances
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-12 font-sans">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-gray-500 hover:text-black font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bag
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form or Auth Overlay */}
          {!isLoggedIn ? (
            <div className="lg:col-span-7 bg-white border border-[#E6E3DB] p-8 space-y-6 rounded-lg shadow-sm">
              <div className="flex gap-4 border-b border-[#E6E3DB] pb-4">
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
                      className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
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
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
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
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
                    placeholder="••••••••"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 bg-[#111111] text-white text-xs uppercase tracking-widest font-bold hover:bg-[#C5A880] transition-colors flex items-center justify-center gap-2 rounded"
                >
                  {authLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {authMode === 'login' ? 'Authenticate' : 'Register & Unveil'}
                </button>
              </form>
            </div>
          ) : (
            /* Delivery Form - Left Column */
            <form onSubmit={handleCheckoutSubmit} className="lg:col-span-7 bg-white border border-[#E6E3DB] p-8 space-y-6 rounded-lg shadow-sm">
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
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
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
                    placeholder="e.g. 9876543210"
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
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
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">House / Flat No. *</label>
                  <input
                    type="text"
                    name="houseFlatNo"
                    value={address.houseFlatNo}
                    onChange={handleInputChange}
                    placeholder="e.g. Flat 302, 3rd Floor, Luxury Heights"
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">Area / Street Name / Nearby *</label>
                  <input
                    type="text"
                    name="areaStreetNearby"
                    value={address.areaStreetNearby}
                    onChange={handleInputChange}
                    placeholder="e.g. Scented Boulevard, near Royal Circle"
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
                    required
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
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">State *</label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">Pincode *</label>
                  <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleInputChange}
                    placeholder="6 digits"
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black rounded"
                    required
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-6 border-t border-[#E6E3DB] space-y-4">
                <h3 className="text-xs uppercase tracking-wider font-bold text-gray-700 block">Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    onClick={() => setPaymentMethod('online')}
                    className={`border p-4 flex items-center justify-between cursor-pointer rounded transition-all ${
                      paymentMethod === 'online' ? 'border-[#C5A880] bg-[#C5A880]/5' : 'border-[#E6E3DB] hover:border-gray-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold block text-[#111111]">Pay Online</span>
                      <span className="text-[10px] text-gray-500 font-light block">Razorpay (Cards, UPI, NetBanking)</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'online' ? 'border-[#C5A880] bg-[#C5A880]' : 'border-gray-300'}`}>
                      {paymentMethod === 'online' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </div>

                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`border p-4 flex items-center justify-between cursor-pointer rounded transition-all ${
                      paymentMethod === 'cod' ? 'border-[#C5A880] bg-[#C5A880]/5' : 'border-[#E6E3DB] hover:border-gray-400'
                    }`}
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-bold block text-[#111111]">Cash on Delivery</span>
                      <span className="text-[10px] text-gray-500 font-light block">Pay when your order is delivered (COD)</span>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === 'cod' ? 'border-[#C5A880] bg-[#C5A880]' : 'border-gray-300'}`}>
                      {paymentMethod === 'cod' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#111111] text-white uppercase text-xs font-bold tracking-widest hover:bg-[#C5A880] transition-colors flex items-center justify-center gap-2 rounded shadow-sm"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Checkout...
                    </>
                  ) : paymentMethod === 'cod' ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Order (Cash on Delivery)
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
          <div className="lg:col-span-5 bg-white border border-[#E6E3DB] p-8 space-y-6 rounded-lg shadow-sm">
            <h2 className="text-sm font-serif font-bold text-[#111111] uppercase tracking-wider pb-4 border-b border-[#E6E3DB]">
              Order Summary
            </h2>
            <div className="divide-y divide-[#E6E3DB]">
              {cart.map((item) => (
                <div key={item.id} className="py-4 flex gap-4 text-xs">
                  <div className="w-12 h-12 bg-[#F5F2EB] flex-shrink-0 relative overflow-hidden rounded">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-[#111111] truncate">{item.name}</h4>
                    <p className="text-[10px] text-gray-500 font-light mt-0.5">Size: {item.size} | Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-[#111111]">₹{(item.price * item.quantity).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E6E3DB] pt-4 space-y-2">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal ({cartCount} items)</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>Shipping</span>
                <span className="text-green-600 uppercase font-semibold">Complimentary</span>
              </div>
              <div className="flex justify-between text-sm font-bold border-t border-[#E6E3DB] pt-4 text-[#111111]">
                <span>Total Amount</span>
                <span>₹{cartTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
