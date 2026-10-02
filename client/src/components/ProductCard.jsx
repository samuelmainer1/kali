import { Link } from 'react-router-dom';
import { Eye, Heart, ShoppingCart } from 'lucide-react';
import { formatKES, api } from '../lib/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useUI } from '../context/UIContext';
import { useLang } from '../context/LangContext';
import { useState } from 'react';
import StarRating from './StarRating';
import { preventBrokenProductImage, resolveProductImage } from '../lib/productImage';

export default function ProductCard({ product, dealOfDay = false }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const { openQuickView, openMiniCart, openAuth } = useUI();
  const { t } = useLang();
  const [saved, setSaved] = useState(false);

  const img = resolveProductImage(product);
  const compareAt = product.compareAt || product.comparePrice || product.originalPrice;
  const discount =
    compareAt && compareAt > product.price
      ? Math.round(((compareAt - product.price) / compareAt) * 100)
      : 0;

  async function toggleWish(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      openAuth();
      return;
    }
    try {
      if (saved) {
        await api.delete(`/wishlist/${product.id}`);
        setSaved(false);
      } else {
        await api.post(`/wishlist/${product.id}`);
        setSaved(true);
      }
    } catch {
      /* ignore */
    }
  }

  function onAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    openMiniCart();
  }

  function onQuick(e) {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product);
  }

  return (
    <div className="group bg-white border rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-200">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        <Link to={`/product/${product.slug}`} className="block h-full w-full">
          <img
            src={img}
            alt={product.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            onError={(e) => preventBrokenProductImage(e)}
          />
        </Link>
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded z-[3]">
            -{discount}%
          </span>
        )}
        {dealOfDay && (
          <span className="absolute top-2 left-2 mt-6 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded z-[3]">
            Deal of the Day
          </span>
        )}
        <button
          type="button"
          className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-full shadow-sm z-[3]"
          onClick={toggleWish}
          title="Add to wishlist"
          aria-label="Toggle wishlist"
        >
          <Heart size={16} className={saved ? 'fill-red-500 text-red-500' : 'text-gray-600'} />
        </button>
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none z-[2]">
          <button
            type="button"
            className="pointer-events-auto bg-white rounded-full p-2 shadow-lg"
            onClick={onQuick}
            aria-label="Quick view"
          >
            <Eye size={20} className="text-gray-700" />
          </button>
        </div>
      </div>
      <div className="p-3">
        <Link to={`/product/${product.slug}`} className="block">
          <h3 className="text-sm text-gray-800 line-clamp-2 mb-1 min-h-[2.5rem]">{product.name}</h3>
        </Link>
        <div className="flex items-center gap-1">
          <StarRating rating={product.rating || 4} size={14} />
          <span className="text-xs text-gray-500">({product.reviews || product.reviewCount || 0})</span>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-base font-bold text-gray-900">{formatKES(product.price)}</span>
          {compareAt > product.price && (
            <span className="text-xs text-gray-400 line-through">{formatKES(compareAt)}</span>
          )}
        </div>
        <button
          type="button"
          className="w-full mt-3 bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs rounded-md font-semibold"
          onClick={onAdd}
        >
          <ShoppingCart size={14} className="inline mr-1" />
          {t('addToCart')}
        </button>
      </div>
    </div>
  );
}
