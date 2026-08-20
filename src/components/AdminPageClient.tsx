'use client';

import React, { useState } from 'react';
import { 
  ShoppingBag, Key, Edit, Plus, Trash2, Megaphone, Check, 
  ChevronDown, X, Tag, Sparkles, Droplets, Trees, HelpCircle 
} from 'lucide-react';

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
    houseFlatNo?: string;
    areaStreetNearby?: string;
    addressLine1?: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode?: string;
    postalCode?: string;
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

interface Product {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  imageUrls: string[];
  stock: number;
  isFeatured: number;
  topNotes: string;
  heartNotes: string;
  baseNotes: string;
  tags: string;
}

interface AdminPageClientProps {
  initialOrders: Order[];
  initialVariants: VariantInventory[];
  initialProducts: Product[];
  initialSettings: Record<string, string>;
}

export default function AdminPageClient({ 
  initialOrders, 
  initialVariants,
  initialProducts,
  initialSettings
}: AdminPageClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [variants, setVariants] = useState<VariantInventory[]>(initialVariants);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeTab, setActiveTab] = useState<'orders' | 'catalog' | 'banner'>('orders');
  
  // Banner Settings State
  const [bannerMessage, setBannerMessage] = useState<string>(
    initialSettings.banner_message || '✨ DISCOVER OUR HANDCRAFTED BOUTIQUE PERFUME COLLECTION | FREE SHIPPING PAN-INDIA ✨'
  );
  
  // Product Operations State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [productForm, setProductForm] = useState({
    name: '',
    slug: '',
    tagline: '',
    description: '',
    price: 3500,
    compareAtPrice: '',
    imageUrls: '/images/trio_luxury.jpg',
    stock: 50,
    isFeatured: false,
    topNotes: 'Bergamot, Lemon',
    heartNotes: 'Jasmine, Patchouli',
    baseNotes: 'Sandalwood, Musk',
    tags: 'Fresh, Woody',
  });

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

  const handleSaveBanner = async () => {
    setUpdatingId('banner');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'banner_message', value: bannerMessage }),
      });

      if (!res.ok) {
        throw new Error('Failed to save settings');
      }

      alert('Announcement banner updated successfully! It will show live on your site.');
    } catch (e) {
      console.error(e);
      alert('Error updating announcement banner');
    } finally {
      setUpdatingId(null);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      slug: '',
      tagline: '',
      description: '',
      price: 4500,
      compareAtPrice: '',
      imageUrls: '/images/trio_luxury.jpg',
      stock: 50,
      isFeatured: false,
      topNotes: 'Bergamot, Cardamom',
      heartNotes: 'Rose, Oud, Jasmine',
      baseNotes: 'Sandalwood, Vanilla, Amber',
      tags: 'Spicy, Floral',
    });
    setIsProductModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      slug: p.slug,
      tagline: p.tagline,
      description: p.description,
      price: p.price,
      compareAtPrice: p.compareAtPrice ? p.compareAtPrice.toString() : '',
      imageUrls: p.imageUrls.join(', '),
      stock: p.stock,
      isFeatured: p.isFeatured === 1,
      topNotes: p.topNotes,
      heartNotes: p.heartNotes,
      baseNotes: p.baseNotes,
      tags: p.tags,
    });
    setIsProductModalOpen(true);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingId('product-submit');
    
    const parsedImages = productForm.imageUrls
      .split(',')
      .map((img) => img.trim())
      .filter((img) => img.length > 0);

    const payload = {
      id: editingProduct?.id,
      name: productForm.name,
      slug: productForm.slug.toLowerCase().trim().replace(/\s+/g, '-'),
      tagline: productForm.tagline,
      description: productForm.description,
      price: productForm.price,
      compareAtPrice: productForm.compareAtPrice ? parseInt(productForm.compareAtPrice) : null,
      imageUrls: parsedImages,
      stock: productForm.stock,
      isFeatured: productForm.isFeatured,
      topNotes: productForm.topNotes,
      heartNotes: productForm.heartNotes,
      baseNotes: productForm.baseNotes,
      tags: productForm.tags,
    };

    try {
      const url = '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = (await res.json()) as any;
        throw new Error(errorData.error || 'Failed to save product');
      }

      // Refresh list client-side
      alert(editingProduct ? 'Product updated successfully!' : 'Product added successfully! Refreshing details.');
      setIsProductModalOpen(false);
      
      // Reload page to fetch updated database entities (including variants)
      window.location.reload();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you absolutely sure you want to delete ${name}? This will remove it and all its variants from the catalogue.`)) {
      return;
    }

    setUpdatingId(id);
    try {
      const res = await fetch(`/api/admin/products?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete product');
      }

      setProducts((prev) => prev.filter((p) => p.id !== id));
      setVariants((prev) => prev.filter((v) => v.productId !== id));
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen py-16 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Title Banner */}
        <div className="border-b border-[#E6E3DB] pb-6 mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
          <div className="flex items-center gap-3">
            <Key className="w-8 h-8 text-[#C5A880]" />
            <div>
              <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold">Administrative Access</span>
              <h1 className="text-3xl font-serif font-light text-[#111111] tracking-tight">Management Dashboard</h1>
            </div>
          </div>
          <button
            onClick={openAddModal}
            className="bg-[#C5A880] text-white hover:bg-black font-semibold text-xs uppercase tracking-widest px-5 py-3 transition-colors flex items-center gap-2 rounded-md shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Scent Product</span>
          </button>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
          {/* Revenue */}
          <div className="bg-white border border-[#E6E3DB] p-6 flex items-center justify-between shadow-sm rounded-lg">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Total Sales</span>
              <p className="text-2xl font-serif font-bold text-gray-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-[#C5A880]" />
          </div>

          {/* Orders */}
          <div className="bg-white border border-[#E6E3DB] p-6 flex items-center justify-between shadow-sm rounded-lg">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Total Orders</span>
              <p className="text-2xl font-serif font-bold text-gray-900">{totalOrderCount}</p>
            </div>
            <Key className="w-8 h-8 text-[#C5A880]" />
          </div>

          {/* Stock Issues */}
          <div className="bg-white border border-[#E6E3DB] p-6 flex items-center justify-between shadow-sm rounded-lg">
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Out of Stock Variants</span>
              <p className="text-2xl font-serif font-bold text-red-600">{outOfStockCount}</p>
            </div>
            <X className={`w-8 h-8 ${outOfStockCount > 0 ? 'text-red-500 animate-pulse' : 'text-gray-300'}`} />
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex border-b border-[#E6E3DB] mb-8 text-xs uppercase tracking-widest font-semibold text-gray-400">
          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 pr-8 border-b-2 ${
              activeTab === 'orders' ? 'border-[#C5A880] text-black font-bold' : 'border-transparent hover:text-black'
            }`}
          >
            Orders Fulfillment ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab('catalog')}
            className={`pb-3 pr-8 border-b-2 ${
              activeTab === 'catalog' ? 'border-[#C5A880] text-black font-bold' : 'border-transparent hover:text-black'
            }`}
          >
            Manage Catalogue ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('banner')}
            className={`pb-3 pr-8 border-b-2 ${
              activeTab === 'banner' ? 'border-[#C5A880] text-black font-bold' : 'border-transparent hover:text-black'
            }`}
          >
            Broadcast Banner
          </button>
        </div>

        {/* Tab Panel Render */}
        {activeTab === 'orders' && (
          <div className="bg-white border border-[#E6E3DB] overflow-hidden rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E3DB] bg-[#FAF9F6] text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="p-4">Order Ref</th>
                    <th className="p-4">Customer</th>
                    <th className="p-4">Amount</th>
                    <th className="p-4">Fulfillment Status</th>
                    <th className="p-4">Payment</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E3DB]/60">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400 italic">No orders received yet.</td>
                    </tr>
                  ) : (
                    orders.map((order) => {
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
                                  className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-1.5 rounded-md font-semibold text-xs text-gray-700 uppercase tracking-wider focus:outline-none focus:border-black disabled:opacity-50 appearance-none pr-8 cursor-pointer"
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
                                className="px-3.5 py-1.5 border border-gray-300 font-semibold uppercase tracking-wider text-[10px] hover:bg-black hover:text-white transition-all rounded-md"
                              >
                                {isExpanded ? 'Hide' : 'Expand'}
                              </button>
                            </td>
                          </tr>

                          {/* Detail dropdown drawer */}
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
                                      {order.shippingAddress.houseFlatNo || order.shippingAddress.addressLine1}<br />
                                      {(order.shippingAddress.areaStreetNearby || order.shippingAddress.addressLine2) && `${order.shippingAddress.areaStreetNearby || order.shippingAddress.addressLine2}`}<br />
                                      {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode || order.shippingAddress.postalCode}<br />
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
                                  <div className="divide-y divide-[#E6E3DB]/40 bg-white border border-[#E6E3DB] rounded-md overflow-hidden">
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
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="bg-white border border-[#E6E3DB] rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E6E3DB] bg-[#FAF9F6] text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="p-4">Showcase</th>
                    <th className="p-4">Scent Product</th>
                    <th className="p-4">Slug Reference</th>
                    <th className="p-4">Base Price</th>
                    <th className="p-4">Variants Stock</th>
                    <th className="p-4 text-center">Featured</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E6E3DB]/60">
                  {products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-gray-400 italic">No products found. Add one to begin.</td>
                    </tr>
                  ) : (
                    products.map((p) => {
                      const prodVariants = variants.filter(v => v.productId === p.id);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4">
                            <div className="w-10 h-12 bg-gray-100 border border-gray-200 overflow-hidden relative rounded">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={p.imageUrls[0]} alt="" className="object-cover w-full h-full" />
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="font-serif text-sm font-semibold text-[#111111]">{p.name}</div>
                            <div className="text-[10px] text-gray-400 font-sans mt-0.5 truncate max-w-xs">{p.tagline}</div>
                          </td>
                          <td className="p-4 font-mono text-gray-500">{p.slug}</td>
                          <td className="p-4 font-semibold text-gray-900">₹{p.price.toLocaleString('en-IN')}</td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              {prodVariants.length === 0 ? (
                                <span className="text-[10px] text-red-500 font-bold">No variants configured</span>
                              ) : (
                                prodVariants.map(v => (
                                  <span key={v.id} className="text-[9px] font-mono text-gray-600">
                                    {v.size}: <strong className={v.stock === 0 ? 'text-red-500' : 'text-gray-900'}>{v.stock} pcs</strong> (₹{v.price.toLocaleString('en-IN')})
                                  </span>
                                ))
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {p.isFeatured === 1 ? (
                              <span className="px-2 py-0.5 bg-[#C5A880]/15 text-[#C5A880] text-[9px] uppercase tracking-wider font-bold rounded">
                                Bestseller
                              </span>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => openEditModal(p)}
                                className="p-1.5 border border-gray-300 text-gray-500 hover:text-black hover:border-black transition-colors rounded"
                                title="Edit product details"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                disabled={updatingId === p.id}
                                className="p-1.5 border border-red-200 text-red-500 hover:bg-red-50 transition-colors rounded disabled:opacity-50"
                                title="Delete product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'banner' && (
          <div className="bg-white border border-[#E6E3DB] p-8 rounded-lg shadow-sm max-w-3xl">
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-[#C5A880]">
                <Megaphone className="w-6 h-6" />
                <h3 className="font-serif text-lg text-black font-light">Broadcasting Banner Announcements</h3>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed font-light">
                The text entered here is broadcasted live in a scrolling header banner on all pages of the storefront. Keep it concise, professional, and uppercase for luxury brand presentation.
              </p>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Banner Message Content</label>
                <textarea
                  value={bannerMessage}
                  onChange={(e) => setBannerMessage(e.target.value)}
                  placeholder="e.g. ✨ FREE SHIPPING ACROSS INDIA | 10% DISCOUNT ON ALL ONLINE PAYMENTS ✨"
                  className="w-full bg-[#FAF9F6] border border-[#E6E3DB] p-4 text-xs font-semibold tracking-wider text-black focus:outline-none focus:border-black h-24 rounded-md"
                />
              </div>

              <button
                onClick={handleSaveBanner}
                disabled={updatingId === 'banner'}
                className="bg-black hover:bg-[#C5A880] text-white font-semibold text-xs uppercase tracking-widest px-6 py-3.5 transition-colors disabled:opacity-50 rounded-md"
              >
                {updatingId === 'banner' ? 'Broadcasting...' : 'Broadcast Live'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Add/Edit Product Modal Dialog */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-[#E6E3DB] w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden font-sans my-8">
            <div className="bg-[#FAF9F6] border-b border-[#E6E3DB] p-5 flex justify-between items-center">
              <h3 className="font-serif text-lg font-light text-black">
                {editingProduct ? `Edit Catalog Scent: ${editingProduct.name}` : 'Add New Scent Creation'}
              </h3>
              <button 
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-black transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Product Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Scent Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Saffron Oud"
                    className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Url Slug</label>
                  <input
                    type="text"
                    required
                    value={productForm.slug}
                    onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                    placeholder="e.g. saffron-oud"
                    className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                  />
                </div>
              </div>

              {/* Tagline */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Short Scent Tagline</label>
                <input
                  type="text"
                  required
                  value={productForm.tagline}
                  onChange={(e) => setProductForm({ ...productForm, tagline: e.target.value })}
                  placeholder="e.g. Smoldering saffron merged with gold standard agarwood."
                  className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">The Story (Full Description)</label>
                <textarea
                  required
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="Full narrative describing the olfactory journey, ingredients, and inspiration."
                  className="w-full bg-[#FAF9F6] border border-[#E6E3DB] p-3 text-xs text-black focus:outline-none focus:border-black h-24 rounded-md"
                />
              </div>

              {/* Prices and Stock */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Price (50ml INR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Compare At (INR)</label>
                  <input
                    type="number"
                    value={productForm.compareAtPrice}
                    onChange={(e) => setProductForm({ ...productForm, compareAtPrice: e.target.value })}
                    placeholder="Discount comparison"
                    className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Stock Level (50ml)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })}
                    className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                  />
                </div>

                <div className="space-y-2 flex items-center justify-center pt-3">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={productForm.isFeatured}
                    onChange={(e) => setProductForm({ ...productForm, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-[#C5A880] border-[#E6E3DB] focus:ring-0 focus:outline-none cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="text-[10px] uppercase tracking-wider text-gray-500 font-bold ml-2 select-none cursor-pointer">
                    Bestseller
                  </label>
                </div>
              </div>

              {/* Image URL */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Product Image Paths (Comma Separated)</label>
                <input
                  type="text"
                  required
                  value={productForm.imageUrls}
                  onChange={(e) => setProductForm({ ...productForm, imageUrls: e.target.value })}
                  placeholder="e.g. /images/trio_luxury.jpg"
                  className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                />
              </div>

              {/* Scent Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Top Notes</label>
                  <input
                    type="text"
                    required
                    value={productForm.topNotes}
                    onChange={(e) => setProductForm({ ...productForm, topNotes: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Heart Notes</label>
                  <input
                    type="text"
                    required
                    value={productForm.heartNotes}
                    onChange={(e) => setProductForm({ ...productForm, heartNotes: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Base Notes</label>
                  <input
                    type="text"
                    required
                    value={productForm.baseNotes}
                    onChange={(e) => setProductForm({ ...productForm, baseNotes: e.target.value })}
                    className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                  />
                </div>
              </div>

              {/* Category tags */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-gray-400 font-bold block">Families & Tags (Comma Separated)</label>
                <input
                  type="text"
                  required
                  value={productForm.tags}
                  onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
                  placeholder="e.g. Woody, Spicy, Oriental, New Arrival"
                  className="w-full bg-[#FAF9F6] border border-[#E6E3DB] px-3 py-2 text-xs text-black focus:outline-none focus:border-black rounded-md"
                />
              </div>

              {!editingProduct && (
                <div className="bg-[#FAF9F6] border border-[#E6E3DB] p-3 text-[10px] text-gray-400 italic rounded-md">
                  💡 Note: Creating this product will automatically initialize its three variants (30ml, 50ml, and 100ml) relative to the default 50ml base price. You can view/adjust stock values immediately after creation.
                </div>
              )}

              {/* Submit CTAs */}
              <div className="flex gap-3 justify-end pt-4 border-t border-[#E6E3DB] mt-6">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-5 py-2.5 border border-gray-300 text-gray-500 hover:text-black font-semibold text-xs uppercase tracking-widest transition-colors rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingId === 'product-submit'}
                  className="px-6 py-2.5 bg-black hover:bg-[#C5A880] text-white font-semibold text-xs uppercase tracking-widest transition-colors disabled:opacity-50 rounded-md"
                >
                  {updatingId === 'product-submit' ? 'Saving...' : 'Save Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
