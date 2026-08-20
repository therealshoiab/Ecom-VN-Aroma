'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ArrowRight, MessageSquare } from 'lucide-react';

interface StoredOrder {
  orderNumber: string;
  items: Array<{
    name: string;
    size: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  paymentMethod: string;
  address: {
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
}

export default function CheckoutSuccessPage() {
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [whatsAppLink, setWhatsAppLink] = useState<string>('https://wa.me/917780938743');
  const [paymentMethodText, setPaymentMethodText] = useState<string>('Online Payment');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlOrderNum = params.get('orderNumber');
      setOrderNumber(urlOrderNum);

      try {
        const stored = localStorage.getItem('lastOrder');
        if (stored) {
          const orderData = JSON.parse(stored) as StoredOrder;
          
          if (orderData.orderNumber === urlOrderNum) {
            // Display payment method status on UI
            const payMethod = orderData.paymentMethod || 'Paid Online (Razorpay)';
            setPaymentMethodText(payMethod);

            // Format items list for WhatsApp
            const itemsText = orderData.items
              .map(item => `• ${item.name} (${item.size}) x ${item.quantity} - ₹${(item.price * item.quantity).toLocaleString('en-IN')}`)
              .join('\n');

            // Format address with fallback to older keys
            const addr = orderData.address;
            const line1 = addr.houseFlatNo || addr.addressLine1 || '';
            const line2 = addr.areaStreetNearby || addr.addressLine2 || '';
            const zip = addr.pincode || addr.postalCode || '';
            const addressText = `${line1}${line2 ? ', ' + line2 : ''}, ${addr.city}, ${addr.state} - ${zip}`;

            // Build full message
            const message = `Hello VN Aroma,\n\nI have just placed an order!\n\n*Order Ref:* ${orderData.orderNumber}\n*Payment Method:* ${payMethod}\n*Total Amount:* ₹${orderData.totalAmount.toLocaleString('en-IN')}\n\n*Selections:*\n${itemsText}\n\n*Delivery Address:*\nName: ${addr.name}\nPhone: ${addr.phone}\nAddress: ${addressText}`;

            // URL encode message
            const encodedMessage = encodeURIComponent(message);
            setWhatsAppLink(`https://wa.me/917780938743?text=${encodedMessage}`);
          }
        }
      } catch (e) {
        console.error('Failed to parse lastOrder for WhatsApp redirect:', e);
      }
    }
  }, []);

  return (
    <div className="bg-[#FAF9F6] min-h-[85vh] flex items-center justify-center py-16 font-sans">
      <div className="max-w-md w-full bg-white border border-[#E6E3DB] p-8 text-center space-y-6 shadow-md rounded-lg">
        <CheckCircle className="w-16 h-16 text-[#C5A880] mx-auto stroke-1" />
        
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold">Payment Confirmed</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-light text-[#111111] tracking-tight">
            Order Placed Successfully
          </h1>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed font-light">
          Your order has been recorded and is being prepared by our boutique fragrance curators.
        </p>

        {orderNumber && (
          <div className="bg-[#FAF9F6] border border-[#E6E3DB] py-3.5 px-4 font-mono text-xs text-[#111111] rounded-md space-y-1">
            <div>Order Ref: <span className="font-bold">{orderNumber}</span></div>
            <div className="text-[10px] text-gray-500">Method: <span className="font-semibold text-gray-700">{paymentMethodText}</span></div>
          </div>
        )}

        {/* WhatsApp Call to Action Section */}
        <div className="bg-green-50 border border-green-200/80 p-5 rounded-lg text-left space-y-3">
          <div className="flex items-center gap-2 text-green-700">
            <MessageSquare className="w-4 h-4 fill-green-700 text-green-700" />
            <span className="text-[10px] uppercase tracking-widest font-bold">WhatsApp Order Dispatch</span>
          </div>
          <p className="text-[11px] text-green-800 leading-relaxed font-medium">
            Please click the button below to confirm your order and send shipment details directly to the VN Aroma team on WhatsApp at <strong>+91 7780938743</strong>. This initiates instant package tracking.
          </p>
          <a
            href={whatsAppLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-[#25D366] hover:bg-[#20ba5a] text-white uppercase text-xs font-bold tracking-widest transition-colors rounded-md shadow-sm"
          >
            💬 Confirm Order on WhatsApp
          </a>
        </div>

        <div className="pt-4 space-y-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#111111] text-white hover:bg-[#C5A880] uppercase text-xs font-bold tracking-widest transition-colors rounded-md shadow-sm"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/account"
            className="w-full inline-block py-2 text-xs uppercase tracking-wider text-[#C5A880] hover:text-black transition-colors font-semibold"
          >
            View Order History
          </Link>
        </div>
      </div>
    </div>
  );
}
