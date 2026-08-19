'use client';

import React, { useState } from 'react';
import { ShoppingBag, Key, Edit, RefreshCw, Layers, TrendingUp, AlertTriangle, ChevronDown, Check } from 'lucide-react';

interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  priceAtPurchase: number;
  size: string;
  name: string;
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
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  createdAt: number;
  items: OrderItem[];
}

interface VariantInventory {
  id: string;
  productId: string;
  size: string;
  price: number;
  stock: number;
  name: string;
}

interface AdminPageClientProps {
  initialOrders: Order[];
  initialVariants: VariantInventory[];
}

export default function AdminPageClient({ initialOrders, initialVariants }: AdminPageClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [variants, setVariants] = useState<VariantInventory[]>(initialVariants);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [editStockValue, setEditStockValue] = useState<number>(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Business Analytics Calculations
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalOrderCount = orders.length;
  const outOfStockCount = variants.filter((v) => v.stock === 0).length;

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (e) {
      console.error(e);
      alert('Error updating order status');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleStockUpdate = async (variantId: string) => {
    setUpdatingId(variantId);
    try {
      const res = await fetch('/api/admin/inventory/update-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId, stock: editStockValue }),
      });

      if (!res.ok) {
        throw new Error('Failed to update stock');
      }

      setVariants((prev) =>
        prev.map((v) => (v.id === variantId ? { ...v, stock: editStockValue } : v))
      );
      setEditingVariantId(null);
    } catch (e) {
      console.error(e);
      alert('Error updating inventory stock');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="border-b border-[#E6E3DB] pb-6 mb-8 flex items-center gap-3">
          <Key className="w-8 h-8 text-[#C5A880]" />
          <div>
            <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold">Administrative Access</span>
            <h1 className="text-3xl font-serif font-light text-[#111111] tracking-tight">Management Dashboard</h1>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {/* Revenue */}
          <div className="bg-white border border-[#E6E3DB] p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Total Revenue</span>
              <p className="text-2xl font-serif font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-[#C5A880]" />
          </div>

          {/* Orders */}
          <div className="bg-white border border-[#E6E3DB] p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Processed Orders</span>
              <p className="text-2xl font-serif font-bold text-gray-900">{totalOrderCount}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-[#C5A880]" />
          </div>

          {/* Stock issues */}
          <div className="bg-white border border-[#E6E3DB] p-6 flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Out of Stock Sizes</span>
              <p className="text-2xl font-serif font-bold text-red-600">{outOfStockCount}</p>
            </div>
            <AlertTriangle className={`w-8 h-8 ${outOfStockCount > 0 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`} />
          </div>
        </div>

        {/* Dashboard Tabs */}
        <div className="flex border-b border-[#E6E3DB] mb-8 text-xs uppercase tracking-widest font-semibold text-gray-400">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 pr-8 border-b-2 ${
              activeTab === 'orders' ? 'border-[#C5A880] text-black font-bold' : 'border-transparent hover:text-black'
            }`}
          >
            Manage Orders ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`pb-3 pr-8 border-b-2 ${
              activeTab === 'inventory' ? 'border-[#C5A880] text-black font-bold' : 'border-transparent hover:text-black'
            }`}
          >
            Manage Inventory ({variants.length})
          </button>
        </div>

        {/* Active Tab Panel */}
        {activeTab === 'orders' ? (
          /* ORDERS LOG */
          <div className="bg-white border border-[#E6E3DB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E3DB] bg-[#FAF9F6] text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Customer Details</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Fulfillment Status</th>
                    <th className="p-4">Payment Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E3DB]/60">
                  {orders.map((order) => {
                    const orderDate = new Date(order.createdAt * 1000).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    });
                    const isExpanded = expandedOrderId === order.id;

                    return (
                      <React.Fragment key={order.id}>
                        <tr className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-[#111111]">{order.orderNumber}</td>
                          <td className="p-4 font-medium text-gray-800">
                            <div>{order.shippingAddress.name}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{orderDate}</div>
                          </td>
                          <td className="p-4 font-semibold text-gray-900">₹{order.totalAmount.toLocaleString('en-IN')}</td>
                          <td className="p-4">
                            <div className="relative inline-block w-40">
                              <select
                                value={order.status}
                                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                disabled={updatingId === order.id}
                                className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-1.5 rounded-none font-semibold text-xs text-gray-700 uppercase tracking-wider focus:outline-none focus:border-black disabled:opacity-50 appearance-none pr-8 cursor-pointer"
                              >
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-2.5 pointer-events-none text-gray-500" />
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="px-2.5 py-0.5 bg-green-50 text-green-700 uppercase tracking-widest text-[9px] font-bold">
                              {order.paymentStatus}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                              className="px-3.5 py-1.5 border border-gray-300 font-semibold uppercase tracking-wider text-[10px] hover:bg-black hover:text-white transition-all"
                            >
                              {isExpanded ? 'Hide' : 'Expand'}
                            </button>
                          </td>
                        </tr>

                        {/* Order Items dropdown detail drawer */}
                        {isExpanded && (
                          <tr className="bg-[#FAF9F6]/50">
                            <td colSpan={6} className="p-6 border-b border-[#E6E3DB]/60">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs text-gray-500 font-medium">
                                <div className="space-y-1">
                                  <h4 className="text-black uppercase tracking-wider font-bold border-b border-[#E6E3DB] pb-1">
                                    Shipping Information
                                  </h4>
                                  <p className="leading-relaxed pt-1">
                                    <strong className="text-black">{order.shippingAddress.name}</strong><br />
                                    {order.shippingAddress.addressLine1}<br />
                                    {order.shippingAddress.addressLine2 && `${order.shippingAddress.addressLine2}\n`}
                                    {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.postalCode}<br />
                                    Phone: {order.shippingAddress.phone}
                                  </p>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-black uppercase tracking-wider font-bold border-b border-[#E6E3DB] pb-1">
                                    Transaction Audit
                                  </h4>
                                  <p className="leading-relaxed pt-1 font-mono">
                                    Receipt ID: {order.orderNumber}<br />
                                    Razorpay Order ID: {order.razorpayOrderId}<br />
                                    Razorpay Payment ID: {order.razorpayPaymentId}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-4 space-y-2">
                                <h4 className="text-xs text-black uppercase tracking-wider font-bold border-b border-[#E6E3DB] pb-1">
                                  Purchased Items ({order.items.length})
                                </h4>
                                <div className="divide-y divide-[#E6E3DB]/40 bg-white border border-[#E6E3DB]">
                                  {order.items.map((item) => (
                                    <div key={item.id} className="p-3.5 flex justify-between text-xs">
                                      <span className="font-semibold text-black">
                                        {item.name} ({item.size}) <span className="text-gray-400 font-normal">x {item.quantity}</span>
                                      </span>
                                      <span className="font-semibold text-gray-900">
                                        ₹{(item.priceAtPurchase * item.quantity).toLocaleString('en-IN')}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* PRODUCT INVENTORY */
          <div className="bg-white border border-[#E6E3DB] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E3DB] bg-[#FAF9F6] text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="p-4">Scent Product</th>
                    <th className="p-4">Scent Size</th>
                    <th className="p-4">Drizzle Variant ID</th>
                    <th className="p-4">Price (INR)</th>
                    <th className="p-4">Current Stock Level</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E3DB]/60">
                  {variants.map((v) => {
                    const isEditing = editingVariantId === v.id;

                    return (
                      <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-serif text-sm font-semibold text-[#111111]">{v.name}</td>
                        <td className="p-4 font-semibold text-gray-800 uppercase">{v.size}</td>
                        <td className="p-4 font-mono text-gray-400">{v.id}</td>
                        <td className="p-4 font-semibold text-gray-900">₹{v.price.toLocaleString('en-IN')}</td>
                        <td className="p-4">
                          {isEditing ? (
                            <input
                              type="number"
                              value={editStockValue}
                              onChange={(e) => setEditStockValue(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-20 px-2 py-1 bg-[#FAF9F6] border border-black focus:outline-none font-semibold text-xs text-center"
                              min="0"
                            />
                          ) : (
                            <span className={`px-2.5 py-1 text-[10px] font-bold ${
                              v.stock === 0
                                ? 'bg-red-50 text-red-700'
                                : v.stock <= 10
                                ? 'bg-amber-50 text-amber-700 font-bold'
                                : 'bg-green-50 text-green-700'
                            }`}>
                              {v.stock} units
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {isEditing ? (
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => handleStockUpdate(v.id)}
                                disabled={updatingId === v.id}
                                className="p-1.5 bg-[#111111] text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                                title="Save"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setEditingVariantId(null)}
                                className="p-1.5 border border-gray-300 text-gray-500 hover:text-black transition-colors"
                                title="Cancel"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingVariantId(v.id);
                                setEditStockValue(v.stock);
                              }}
                              className="px-3.5 py-1.5 border border-gray-300 font-semibold uppercase tracking-wider text-[10px] hover:bg-black hover:text-white transition-all inline-flex items-center gap-1.5"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Update Stock</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
