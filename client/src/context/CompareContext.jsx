import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CompareContext = createContext(null);
const STORAGE_KEY = 'bd_compare';
const MAX_ITEMS = 3;

function pickProduct(product) {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    images: product.images,
    brand: product.brand,
    rating: product.rating,
  };
}

export function CompareProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product) {
    if (!product?.id) return false;
    const entry = pickProduct(product);
    setItems((prev) => {
      if (prev.some((p) => p.id === entry.id)) return prev;
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, entry];
    });
    return true;
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((p) => p.id !== productId));
  }

  function toggleItem(product) {
    if (!product?.id) return;
    setItems((prev) => {
      if (prev.some((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= MAX_ITEMS) return prev;
      return [...prev, pickProduct(product)];
    });
  }

  function isInCompare(productId) {
    return items.some((p) => p.id === productId);
  }

  function clearAll() {
    setItems([]);
  }

  const count = useMemo(() => items.length, [items]);

  return (
    <CompareContext.Provider
      value={{ items, count, addItem, removeItem, toggleItem, isInCompare, clearAll }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
