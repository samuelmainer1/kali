import { createContext, useContext, useEffect, useCallback, useState } from 'react';

const RecentlyViewedContext = createContext(null);
const STORAGE_KEY = 'bd_recent';
const MAX_ITEMS = 10;

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

export function RecentlyViewedProvider({ children }) {
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

  const trackView = useCallback((product) => {
    if (!product?.id) return;
    const entry = pickProduct(product);
    setItems((prev) => {
      const filtered = prev.filter((p) => p.id !== entry.id);
      return [entry, ...filtered].slice(0, MAX_ITEMS);
    });
  }, []);

  return (
    <RecentlyViewedContext.Provider value={{ items, trackView }}>
      {children}
    </RecentlyViewedContext.Provider>
  );
}

export function useRecentlyViewed() {
  return useContext(RecentlyViewedContext);
}
