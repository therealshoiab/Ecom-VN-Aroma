'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState<string | null>(null);

  useEffect(() => {
    setOrderNumber(searchParams.get('orderNumber'));
  }, [searchParams]);

  return (
    <div className="bg-[#FAF9F6] min-h-[75vh] flex items-center justify-center py-16 font-sans">
      <div className="max-w-md w-full bg-white border border-[#E6E3DB] p-8 text-center space-y-6 shadow-md">
        <CheckCircle className="w-16 h-16 text-[#C5A880] mx-auto stroke-1" />
        
        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-[#C5A880] font-semibold">Payment Confirmed</span>
          <h1 className="text-2xl sm:text-3xl font-serif font-light text-[#111111] tracking-tight">
            Order Placed Successfully
          </h1>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed font-light">
          Your order has been recorded and is being prepared by our boutique fragrance curators. A confirmation receipt has been sent to your email address.
        </p>

        {orderNumber && (
          <div className="bg-[#FAF9F6] border border-[#E6E3DB] py-3.5 px-4 font-mono text-xs text-[#111111]">
            Order Ref: <span className="font-bold">{orderNumber}</span>
          </div>
        )}

        <div className="pt-4 space-y-2">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-[#111111] text-white uppercase text-xs font-bold tracking-widest hover:bg-[#C5A880] transition-colors"
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

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-[#FAF9F6] min-h-[75vh] flex items-center justify-center font-sans">
          <Loader2 className="w-8 h-8 text-[#C5A880] animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
