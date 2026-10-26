'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api-client';
import type { Cart } from '@/lib/types';

interface CartContextValue {
  cart: Cart | null;
  loading: boolean;
  /** Incrémenté à chaque ajout : déclenche l'animation du compteur. */
  pulse: number;
  refresh: () => Promise<void>;
  add: (variantId: string, quantity: number) => Promise<Cart>;
  update: (variantId: string, quantity: number) => Promise<Cart>;
  remove: (variantId: string) => Promise<Cart>;
  setCart: (cart: Cart) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ cart: Cart }>('/api/cart');
      setCart(data.cart);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      loading,
      pulse,
      refresh,
      setCart,
      add: async (variantId, quantity) => {
        const data = await api<{ cart: Cart }>('/api/cart/items', { method: 'POST', json: { variantId, quantity } });
        setCart(data.cart);
        setPulse((p) => p + 1);
        return data.cart;
      },
      update: async (variantId, quantity) => {
        const data = await api<{ cart: Cart }>(`/api/cart/items/${encodeURIComponent(variantId)}`, { method: 'PATCH', json: { quantity } });
        setCart(data.cart);
        return data.cart;
      },
      remove: async (variantId) => {
        const data = await api<{ cart: Cart }>(`/api/cart/items/${encodeURIComponent(variantId)}`, { method: 'DELETE' });
        setCart(data.cart);
        return data.cart;
      },
    }),
    [cart, loading, pulse, refresh],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans CartProvider');
  return ctx;
}
