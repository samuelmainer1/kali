import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const STORAGE_KEY = 'bd_cart';

function lineKey(productId, variant = '') {
  return variant ? `${productId}::${variant}` : productId;
}

function mergeCarts(local, remote) {
  const map = new Map();
  for (const item of [...remote, ...local]) {
    const key = item.key || lineKey(item.productId, item.variant);
    const prev = map.get(key);
    if (!prev || item.qty > prev.qty) {
      map.set(key, { ...item, key });
    }
  }
  return [...map.values()];
}

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });
  const skipSave = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    api
      .get('/cart')
      .then((d) => {
        if (cancelled) return;
        const remote = d.items || [];
        skipSave.current = true;
        setItems((prev) => mergeCarts(prev, remote));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user) return undefined;
    if (skipSave.current) {
      skipSave.current = false;
      return undefined;
    }
    const t = setTimeout(() => {
      api.put('/cart', { items }).catch(() => {});
    }, 500);
    return () => clearTimeout(t);
  }, [items, user?.id]);

  function addItem(product, qty = 1, variant = '') {
    const key = lineKey(product.id, variant);
    setItems((prev) => {
      const existing = prev.find((i) => (i.key || lineKey(i.productId, i.variant)) === key);
      if (existing) {
        return prev.map((i) =>
          (i.key || lineKey(i.productId, i.variant)) === key ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: variant ? `${product.name} (${variant})` : product.name,
          price: product.price,
          image: product.images?.[0],
          slug: product.slug,
          variant,
          qty,
        },
      ];
    });
  }

  function updateQty(idOrKey, qty) {
    setItems((prev) =>
      prev
        .map((i) => {
          const key = i.key || lineKey(i.productId, i.variant);
          if (key === idOrKey || i.productId === idOrKey) return { ...i, qty };
          return i;
        })
        .filter((i) => i.qty > 0)
    );
  }

  function removeItem(idOrKey) {
    setItems((prev) =>
      prev.filter((i) => {
        const key = i.key || lineKey(i.productId, i.variant);
        return key !== idOrKey && i.productId !== idOrKey;
      })
    );
  }

  function clearCart() {
    setItems([]);
    if (user) api.put('/cart', { items: [] }).catch(() => {});
  }

  const count = useMemo(() => items.reduce((n, i) => n + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((n, i) => n + i.price * i.qty, 0), [items]);

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clearCart, count, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
