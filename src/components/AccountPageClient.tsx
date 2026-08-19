'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { User, ShoppingBag, Eye, Calendar, MapPin, Loader2, KeyRound } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  quantity: number;
  priceAtPurchase: number;
  size: string;
  name: string;
  imageUrl: string;
}

interface Order {
  id: string;
  orderNumber: string;
  totalAmount: number;
  shippingAddress: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
  status: string;
  paymentStatus: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  createdAt: number;
  items: OrderItem[];
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
}

export default function AccountPageClient() {
  const { isLoggedIn, setIsLoggedIn, syncCartWithDb } = useCart();
  const [loading, setLoading] = useState(true);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    const loadProfileAndOrders = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const profile = (await res.json()) as any;
          setUser(profile);
          setIsLoggedIn(true);
          
          // Fetch order history
          const ordersRes = await fetch('/api/account/orders');
          if (ordersRes.ok) {
            const data = (await ordersRes.json()) as any;
            setOrders(data);
          }
        } else {
          setIsLoggedIn(false);
        }
      } catch (err) {
        console.error('Failed to load user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfileAndOrders();
  }, [isLoggedIn, setIsLoggedIn]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormLoading(true);

    const endpoint = isRegisterMode ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegisterMode ? { name, email, password } : { email, password };

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

      setUser(data.user);
      setIsLoggedIn(true);
      await syncCartWithDb(); // Merge local storage items into user cart
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {!isLoggedIn ? (
          /* Authentication Forms */
          <div className="max-w-md mx-auto bg-white border border-[#E6E3DB] p-8 shadow-md">
            <div className="flex border-b border-[#E6E3DB] mb-8 text-xs uppercase tracking-widest font-semibold text-gray-400">
              <button
                onClick={() => {
                  setIsRegisterMode(false);
                  setFormError(null);
                }}
                className={`flex-1 pb-3 text-center border-b-2 ${
                  !isRegisterMode ? 'border-[#C5A880] text-black font-bold' : 'border-transparent hover:text-black'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsRegisterMode(true);
                  setFormError(null);
                }}
                className={`flex-1 pb-3 text-center border-b-2 ${
                  isRegisterMode ? 'border-[#C5A880] text-black font-bold' : 'border-transparent hover:text-black'
                }`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-6">
              {formError && (
                <div className="p-3.5 bg-red-50 border-l-2 border-red-600 text-xs text-red-700 uppercase tracking-wider font-semibold">
                  {formError}
                </div>
              )}

              {isRegisterMode && (
                <div>
                  <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                    required
                  />
                </div>
              )}

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider font-semibold text-gray-700 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-[#FAF9F6] border border-[#E6E3DB] text-sm focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="w-full py-4 bg-[#111111] text-white uppercase text-xs font-bold tracking-widest hover:bg-[#C5A880] transition-colors flex items-center justify-center gap-2"
                >
                  {formLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isRegisterMode ? 'Create Account' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* Logged In Dashboard */
          <div className="space-y-12">
            {/* Welcoming header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#E6E3DB] pb-6 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold">My Account</span>
                <h1 className="text-3xl font-serif font-light text-[#111111]">Welcome back, {user?.name}</h1>
              </div>
              <div className="flex items-center gap-4">
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="px-5 py-2.5 bg-[#C5A880] text-black text-xs uppercase tracking-widest font-semibold hover:bg-black hover:text-[#FAF9F6] transition-colors flex items-center gap-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    Admin Panel
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
              {/* Profile Details Card - Left Column */}
              <div className="bg-white border border-[#E6E3DB] p-6 space-y-6">
                <h2 className="text-sm font-serif font-semibold text-[#111111] uppercase tracking-wider pb-3 border-b border-[#E6E3DB] flex items-center gap-2">
                  <User className="w-4 h-4 text-[#C5A880]" />
                  <span>Profile Information</span>
                </h2>
                <div className="space-y-4 text-xs font-semibold text-gray-500">
                  <div>
                    <span className="text-gray-400 block mb-0.5 uppercase tracking-wider">Full Name</span>
                    <span className="text-black text-sm">{user?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5 uppercase tracking-wider">Email Address</span>
                    <span className="text-black text-sm">{user?.email}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block mb-0.5 uppercase tracking-wider">Account Role</span>
                    <span className="text-[#C5A880] uppercase tracking-widest font-bold text-xs">{user?.role}</span>
                  </div>
                </div>
              </div>

              {/* Order History Card - Right Columns */}
              <div className="lg:col-span-2 space-y-6">
                <h2 className="text-sm font-serif font-semibold text-[#111111] uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-[#C5A880]" />
                  <span>Order History ({orders.length})</span>
                </h2>

                {orders.length === 0 ? (
                  <div className="bg-white border border-[#E6E3DB] p-12 text-center text-gray-500 font-light text-sm">
                    You have not placed any orders with VN Aroma yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const isExpanded = selectedOrder?.id === order.id;
                      const orderDate = new Date(order.createdAt * 1000).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      });

                      return (
                        <div key={order.id} className="bg-white border border-[#E6E3DB] overflow-hidden">
                          {/* Order Brief Row */}
                          <div className="p-5 flex flex-wrap justify-between items-center gap-4 bg-white hover:bg-gray-50/50 transition-colors">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-gray-400 font-bold block">{order.orderNumber}</span>
                              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                  {orderDate}
                                </span>
                                <span className="text-black">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-xs">
                              <span className={`px-2.5 py-1 uppercase text-[9px] font-bold tracking-widest ${
                                order.status === 'Delivered'
                                  ? 'bg-green-50 text-green-700'
                                  : order.status === 'Shipped'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}>
                                {order.status}
                              </span>
                              <button
                                onClick={() => setSelectedOrder(isExpanded ? null : order)}
                                className="px-3.5 py-1.5 border border-gray-300 text-xs font-semibold uppercase tracking-wider hover:bg-[#111111] hover:text-white transition-all flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>{isExpanded ? 'Collapse' : 'Details'}</span>
                              </button>
                            </div>
                          </div>

                          {/* Order Expanded Details */}
                          {isExpanded && (
                            <div className="border-t border-[#E6E3DB]/60 bg-[#FAF9F6]/40 p-6 space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-500 font-medium">
                                {/* Shipping details */}
                                <div className="space-y-2">
                                  <h4 className="text-black uppercase tracking-wider font-bold border-b border-[#E6E3DB] pb-1.5 flex items-center gap-1">
                                    <MapPin className="w-3.5 h-3.5 text-[#C5A880]" />
                                    <span>Delivery Address</span>
                                  </h4>
                                  <p className="leading-relaxed">
                                    <strong className="text-black">{order.shippingAddress.name}</strong><br />
                                    {order.shippingAddress.addressLine1}<br />
                                    {order.shippingAddress.addressLine2 && `${order.shippingAddress.addressLine2}\n`}
                                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}<br />
                                    Phone: {order.shippingAddress.phone}
                                  </p>
                                </div>

                                {/* Payment Info */}
                                <div className="space-y-2">
                                  <h4 className="text-black uppercase tracking-wider font-bold border-b border-[#E6E3DB] pb-1.5">
                                    Payment Details
                                  </h4>
                                  <p className="leading-relaxed font-mono">
                                    Gateway: Razorpay Checkout<br />
                                    Order ID: {order.razorpayOrderId}<br />
                                    Payment ID: {order.razorpayPaymentId}<br />
                                    Status: <span className="text-green-600 font-bold uppercase">{order.paymentStatus}</span>
                                  </p>
                                </div>
                              </div>

                              {/* Order Items Table */}
                              <div className="space-y-3">
                                <h4 className="text-xs text-black uppercase tracking-wider font-bold border-b border-[#E6E3DB] pb-1.5">
                                  Items Purchased
                                </h4>
                                <div className="divide-y divide-[#E6E3DB]/60 bg-white border border-[#E6E3DB]">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="p-4 flex justify-between items-center gap-4 text-xs">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-12 bg-[#FAF9F6] border border-[#E6E3DB] flex items-center justify-center p-1 overflow-hidden flex-shrink-0">
                                          {/* eslint-disable-next-line @next/next/no-img-element */}
                                          <img src={item.imageUrl} alt={item.name} className="object-contain h-full w-full" />
                                        </div>
                                        <div>
                                          <h5 className="font-serif font-semibold text-black leading-tight">{item.name}</h5>
                                          <p className="text-[10px] text-gray-400 mt-0.5">{item.size} x {item.quantity}</p>
                                        </div>
                                      </div>
                                      <span className="font-semibold text-gray-900">
                                        ₹{(item.priceAtPurchase * item.quantity).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
