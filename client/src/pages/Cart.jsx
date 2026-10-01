import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatKES, api } from '../lib/api';
import { useLang } from '../context/LangContext';

export default function Cart() {
  const { items, updateQty, removeItem, subtotal, count } = useCart();
  const { t } = useLang();
  const [deliveryOptions, setDeliveryOptions] = useState(null);

  useEffect(() => {
    api
      .get('/delivery/options')
      .then((data) => setDeliveryOptions(data))
      .catch(() => {});
  }, []);

  const deliveryFee = deliveryOptions?.deliveryFee ?? 280;
  const freeDeliveryMin = deliveryOptions?.freeDeliveryMin ?? 10000;
  const shipping = subtotal >= freeDeliveryMin || subtotal === 0 ? 0 : deliveryFee;

  if (!items.length) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-orange-500">Home</Link>
          <span>/</span>
          <span className="text-gray-800 font-medium">Cart</span>
        </nav>
        <div className="mx-auto max-w-3xl text-center py-14">
        <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
        <p className="mt-2 text-ink-mute">Browse the shop and add something you love.</p>
        <Link to="/shop" className="mt-6 inline-flex rounded-md bg-orange-500 hover:bg-orange-600 px-6 py-3 text-sm font-semibold text-white">
          Continue shopping
        </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-orange-500">Home</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">Cart</span>
      </nav>
      <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-8">Cart ({count})</h1>
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const key = item.key || item.productId;
            return (
            <div
              key={key}
              className="flex gap-4 rounded-2xl border border-ink/5 bg-white p-4 shadow-lift"
            >
              <img src={item.image} alt="" className="h-24 w-24 rounded-xl object-cover" />
              <div className="flex-1 min-w-0">
                <Link to={`/product/${item.slug}`} className="font-medium hover:text-leaf line-clamp-2">
                  {item.name}
                </Link>
                <p className="mt-1 font-semibold">{formatKES(item.price)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="inline-flex items-center rounded-lg border border-ink/10">
                    <button type="button" className="p-2" onClick={() => updateQty(key, item.qty - 1)}>
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm">{item.qty}</span>
                    <button type="button" className="p-2" onClick={() => updateQty(key, item.qty + 1)}>
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(key)}
                    className="text-ink-mute hover:text-ember"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="font-semibold whitespace-nowrap">{formatKES(item.price * item.qty)}</p>
            </div>
            );
          })}
        </div>

        <aside className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift h-fit">
          <h2 className="font-display text-xl font-bold">Order summary</h2>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-mute">Subtotal</span>
              <span>{formatKES(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-mute">Delivery</span>
              <span>{shipping === 0 ? 'Free' : formatKES(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-bold">
              <span>Total</span>
              <span>{formatKES(subtotal + shipping)}</span>
            </div>
          </div>
          <Link
            to="/checkout"
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-ember py-3.5 text-sm font-semibold text-white hover:bg-ember-deep"
          >
            Checkout
          </Link>
          <p className="mt-3 text-center text-xs text-ink-mute">
            {t('guestCheckout')}
          </p>
        </aside>
      </div>
    </div>
  );
}
