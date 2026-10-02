import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, formatKES } from '../lib/api';

export default function SearchSuggest({ q, onPick }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState({ products: [], categories: [], brands: [] });
  const box = useRef(null);

  useEffect(() => {
    if (!q || q.trim().length < 2) {
      setData({ products: [], categories: [], brands: [] });
      setOpen(false);
      return undefined;
    }
    const t = setTimeout(() => {
      api
        .get(`/search/suggest?q=${encodeURIComponent(q.trim())}`)
        .then((d) => {
          setData({
            products: d.products || [],
            categories: d.categories || [],
            brands: d.brands || [],
          });
          setOpen(true);
        })
        .catch(() => setOpen(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    function onDoc(e) {
      if (box.current && !box.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const empty = !data.products.length && !data.categories.length && !data.brands.length;
  if (!open || empty) return null;

  return (
    <div
      ref={box}
      className="absolute left-0 right-0 top-full z-[80] mt-1 overflow-hidden rounded-md border border-gray-200 bg-white text-gray-800 shadow-xl"
    >
      {data.products.map((p) => (
        <Link
          key={p.id}
          to={`/product/${p.slug}`}
          className="flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => {
            setOpen(false);
            onPick?.();
          }}
        >
          <img src={p.image} alt="" className="h-9 w-9 rounded object-cover bg-gray-100" />
          <span className="flex-1 line-clamp-1">{p.name}</span>
          <span className="text-xs font-semibold text-orange-600">{formatKES(p.price)}</span>
        </Link>
      ))}
      {data.categories.map((c) => (
        <Link
          key={c.id}
          to={`/category/${c.slug}`}
          className="block px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => {
            setOpen(false);
            onPick?.();
          }}
        >
          Category · {c.name}
        </Link>
      ))}
      {data.brands.map((b) => (
        <Link
          key={b}
          to={`/shop?brand=${encodeURIComponent(b)}`}
          className="block px-3 py-2 text-sm hover:bg-gray-50"
          onClick={() => {
            setOpen(false);
            onPick?.();
          }}
        >
          Brand · {b}
        </Link>
      ))}
    </div>
  );
}
