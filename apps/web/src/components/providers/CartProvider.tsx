'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { api } from '@/lib/api-client';
import type { Cart, CartLine } from '@/lib/types';

/** Panier recalculé localement pour l'affichage immédiat ; la réponse du serveur le remplace ensuite. */
function withItems(cart: Cart, items: CartLine[]): Cart {
  return {
    ...cart,
    items,
    subtotalCents: items.reduce((sum, i) => sum + i.lineTotalCents, 0),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    hasIssues: items.some((i) => i.issue),
  };
}

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
  const [cart, setCartState] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [pulse, setPulse] = useState(0);
  const cartRef = useRef<Cart | null>(null);

  const setCart = useCallback((next: Cart | null) => {
    cartRef.current = next;
    setCartState(next);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ cart: Cart }>('/api/cart');
      setCart(data.cart);
    } catch {
      setCart(null);
    } finally {
      setLoading(false);
    }
  }, [setCart]);

  /**
   * Interface optimiste : l'écran est mis à jour avant la réponse du serveur ; en cas de refus (stock, réseau),
   * il revient à l'état précédent puis se resynchronise, et l'erreur remonte à l'appelant pour l'afficher.
   * Les requêtes partent en keepalive : l'écran étant déjà à jour, un changement de page immédiat ne doit pas les interrompre.
   */
  const optimistic = useCallback(
    async (preview: (current: Cart) => Cart, request: () => Promise<{ cart: Cart }>): Promise<Cart> => {
      const previous = cartRef.current;
      if (previous) setCart(preview(previous));
      try {
        const data = await request();
        setCart(data.cart);
        return data.cart;
      } catch (err) {
        setCart(previous);
        void refresh();
        throw err;
      }
    },
    [refresh, setCart],
  );

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
      add: (variantId, quantity) => {
        setPulse((p) => p + 1);
        // Article déjà au panier : quantité et total mis à jour ; nouvel article : seul le compteur avance (détails fournis par le serveur).
        return optimistic(
          (current) => {
            const line = current.items.find((i) => i.variantId === variantId);
            if (!line) return { ...current, itemCount: current.itemCount + quantity };
            return withItems(current, current.items.map((i) => (i.variantId === variantId ? { ...i, quantity: i.quantity + quantity, lineTotalCents: i.unitPriceCents * (i.quantity + quantity) } : i)));
          },
          () => api<{ cart: Cart }>('/api/cart/items', { method: 'POST', json: { variantId, quantity }, keepalive: true }),
        );
      },
      update: (variantId, quantity) =>
        optimistic(
          (current) => withItems(current, current.items.map((i) => (i.variantId === variantId ? { ...i, quantity, lineTotalCents: i.unitPriceCents * quantity } : i))),
          () => api<{ cart: Cart }>(`/api/cart/items/${encodeURIComponent(variantId)}`, { method: 'PATCH', json: { quantity }, keepalive: true }),
        ),
      remove: (variantId) =>
        optimistic(
          (current) => withItems(current, current.items.filter((i) => i.variantId !== variantId)),
          () => api<{ cart: Cart }>(`/api/cart/items/${encodeURIComponent(variantId)}`, { method: 'DELETE', keepalive: true }),
        ),
    }),
    [cart, loading, pulse, refresh, setCart, optimistic],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans CartProvider');
  return ctx;
}
