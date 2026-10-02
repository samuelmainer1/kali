import { Link } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { formatKES } from '../lib/api';

export default function MiniCart() {
  const { items, updateQty, removeItem, subtotal, count } = useCart();
  const { miniCartOpen, closeMiniCart } = useUI();

  if (!miniCartOpen) return null;

  return (
    <div className="bd-overlay" role="dialog" aria-modal="true" aria-label="Cart preview">
      <button type="button" className="bd-overlay-backdrop" onClick={closeMiniCart} aria-label="Close cart" />
      <aside className="bd-minicart">
        <header className="bd-minicart-head">
          <div>
            <h2>Cart preview</h2>
            <p>{count} item{count === 1 ? '' : 's'}</p>
          </div>
          <button type="button" className="bd-icon-close" onClick={closeMiniCart} aria-label="Close">
            <X size={20} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="bd-minicart-empty">
            <ShoppingBag size={40} strokeWidth={1.5} />
            <p>Your cart is empty</p>
            <Link to="/shop" className="bd-btn-primary" onClick={closeMiniCart}>
              Continue shopping
            </Link>
          </div>
        ) : (
          <>
            <ul className="bd-minicart-list">
              {items.map((item) => {
                const key = item.key || item.productId;
                return (
                <li key={key} className="bd-minicart-item">
                  <Link to={`/product/${item.slug}`} onClick={closeMiniCart}>
                    <img src={item.image} alt="" />
                  </Link>
                  <div className="bd-minicart-info">
                    <Link to={`/product/${item.slug}`} onClick={closeMiniCart}>
                      {item.name}
                    </Link>
                    <p className="bd-minicart-price">{formatKES(item.price)}</p>
                    <div className="bd-minicart-qty">
                      <button type="button" onClick={() => updateQty(key, item.qty - 1)} aria-label="Decrease">
                        <Minus size={14} />
                      </button>
                      <span>{item.qty}</span>
                      <button type="button" onClick={() => updateQty(key, item.qty + 1)} aria-label="Increase">
                        <Plus size={14} />
                      </button>
                      <button type="button" className="bd-minicart-remove" onClick={() => removeItem(key)}>
                        Remove
                      </button>
                    </div>
                  </div>
                  <p className="bd-minicart-line">{formatKES(item.price * item.qty)}</p>
                </li>
                );
              })}
            </ul>
            <footer className="bd-minicart-foot">
              <div className="bd-minicart-sub">
                <span>Subtotal</span>
                <strong>{formatKES(subtotal)}</strong>
              </div>
              <p className="bd-minicart-note">Pay with M-Pesa · Nationwide delivery by Globeflight</p>
              <Link to="/cart" className="bd-btn-outline" onClick={closeMiniCart}>
                View cart
              </Link>
              <Link to="/checkout" className="bd-btn-primary" onClick={closeMiniCart}>
                Proceed to checkout
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
