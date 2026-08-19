'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItem {
  id: string; // matches variantId
  productId: string;
  variantId: string;
  name: string;
  size: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface CartContextType {
  cart: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => Promise<void>;
  removeFromCart: (variantId: string) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  syncCartWithDb: () => Promise<void>;
  isLoggedIn: boolean;
  setIsLoggedIn: (loggedIn: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load cart on init
  useEffect(() => {
    const checkLoginAndLoadCart = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          setIsLoggedIn(true);
          // Fetch DB-backed cart
          const cartRes = await fetch('/api/cart');
          if (cartRes.ok) {
            const dbCart = (await cartRes.json()) as any;
            setCart(dbCart);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error('Failed to verify session:', err);
      }

      // Guest cart fallback
      const localCart = localStorage.getItem('vn_aroma_cart');
      if (localCart) {
        try {
          setCart(JSON.parse(localCart));
        } catch (e) {
          setCart([]);
        }
      }
      setLoading(false);
    };

    checkLoginAndLoadCart();
  }, []);

  // Save guest cart changes
  useEffect(() => {
    if (!loading && !isLoggedIn) {
      localStorage.setItem('vn_aroma_cart', JSON.stringify(cart));
    }
  }, [cart, isLoggedIn, loading]);

  const syncCartWithDb = async () => {
    try {
      setIsLoggedIn(true);
      // Merge current local cart with database
      const localCart = localStorage.getItem('vn_aroma_cart');
      const itemsToMerge = localCart ? JSON.parse(localCart) : [];

      const res = await fetch('/api/cart/merge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToMerge }),
      });

      if (res.ok) {
        const mergedCart = (await res.json()) as any;
        setCart(mergedCart);
        localStorage.removeItem('vn_aroma_cart'); // Clear local storage after merging
      }
    } catch (err) {
      console.error('Error merging cart:', err);
    }
  };

  const addToCart = async (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    let updatedCart: CartItem[] = [];

    const existingIndex = cart.findIndex((i) => i.variantId === item.variantId);
    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
    } else {
      updatedCart = [...cart, { ...item, quantity }];
    }

    setCart(updatedCart);

    if (isLoggedIn) {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: item.productId,
            variantId: item.variantId,
            quantity: quantity,
            action: 'add',
          }),
        });
      } catch (e) {
        console.error('Failed to sync added item with DB:', e);
      }
    }
  };

  const removeFromCart = async (variantId: string) => {
    const updatedCart = cart.filter((item) => item.variantId !== variantId);
    setCart(updatedCart);

    if (isLoggedIn) {
      try {
        await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantId }),
        });
      } catch (e) {
        console.error('Failed to delete item from DB:', e);
      }
    }
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(variantId);
      return;
    }

    const updatedCart = cart.map((item) =>
      item.variantId === variantId ? { ...item, quantity } : item
    );
    setCart(updatedCart);

    if (isLoggedIn) {
      try {
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variantId,
            quantity,
            action: 'set',
          }),
        });
      } catch (e) {
        console.error('Failed to update item quantity in DB:', e);
      }
    }
  };

  const clearCart = async () => {
    setCart([]);
    if (!isLoggedIn) {
      localStorage.removeItem('vn_aroma_cart');
    } else {
      try {
        await fetch('/api/cart', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clearAll: true }),
        });
      } catch (e) {
        console.error('Failed to clear DB cart:', e);
      }
    }
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isCartOpen,
        setIsCartOpen,
        syncCartWithDb,
        isLoggedIn,
        setIsLoggedIn,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
