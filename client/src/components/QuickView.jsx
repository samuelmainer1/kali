import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Minus, Plus, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { formatKES } from '../lib/api';
import StarRating from './StarRating';
import { preventBrokenProductImage, resolveProductImage } from '../lib/productImage';

export default function QuickView() {
  const { quickViewProduct: product, closeQuickView, openMiniCart } = useUI();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const discount =
    product.compareAt && product.compareAt > product.price
      ? Math.round(((product.compareAt - product.price) / product.compareAt) * 100)
      : 0;

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    closeQuickView();
    openMiniCart();
    setTimeout(() => setAdded(false), 500);
  }

  return (
    <div className="bd-overlay" role="dialog" aria-modal="true" aria-label="Product preview">
      <button type="button" className="bd-overlay-backdrop" onClick={closeQuickView} aria-label="Close preview" />
      <div className="bd-quickview">
        <button type="button" className="bd-icon-close bd-qv-close" onClick={closeQuickView} aria-label="Close">
          <X size={20} />
        </button>
        <div className="bd-qv-grid">
          <div className="bd-qv-media">
            <img
              src={resolveProductImage(product)}
              alt={product.name}
              onError={(e) => preventBrokenProductImage(e)}
            />
            {discount > 0 && <span className="discount-badge">-{discount}%</span>}
          </div>
          <div className="bd-qv-body">
            {product.brand && <p className="bd-qv-brand">{product.brand}</p>}
            <h2>{product.name}</h2>
            <div className="bd-qv-rating">
              <StarRating rating={product.rating || 0} showValue />
              <span>({product.reviews || 0} reviews)</span>
            </div>
            <div className="bd-qv-price">
              <strong>{formatKES(product.price)}</strong>
              {product.compareAt > product.price && (
                <span className="old">{formatKES(product.compareAt)}</span>
              )}
            </div>
            <p className="bd-qv-desc">{product.description}</p>
            {product.categorySlug && (
              <p className="bd-qv-meta">
                Category:{' '}
                <Link to={`/category/${product.categorySlug}`} onClick={closeQuickView}>
                  {product.categoryName}
                </Link>
              </p>
            )}
            <p className="bd-qv-meta">Sold by {product.vendorName}</p>
            <div className="bd-qv-actions">
              <div className="bd-qty">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                  <Minus size={14} />
                </button>
                <span>{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                  aria-label="Increase"
                >
                  <Plus size={14} />
                </button>
              </div>
              <button type="button" className="bd-btn-primary" disabled={!product.stock} onClick={handleAdd}>
                {added ? (
                  <>
                    <Check size={16} /> Added
                  </>
                ) : (
                  'Add to cart'
                )}
              </button>
            </div>
            <Link to={`/product/${product.slug}`} className="bd-qv-full" onClick={closeQuickView}>
              See full details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
