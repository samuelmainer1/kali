import { useMemo } from 'react';

const SEEN_KEY = 'bd_lastSeenOrders';

export function newOrdersCount(orders) {
  const seen = Number(localStorage.getItem(SEEN_KEY) || 0);
  if (!seen) return 0; // first visit after this feature shipped: do not shout
  return (orders || []).filter((o) => new Date(o.createdAt || 0).getTime() > seen).length;
}

export function markOrdersSeen() {
  localStorage.setItem(SEEN_KEY, String(Date.now()));
}

export default function NewOrdersBadge({ orders }) {
  const count = useMemo(() => newOrdersCount(orders), [orders]);
  if (!count) return null;
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ember/30 bg-ember/10 px-5 py-3">
      <p className="text-sm font-semibold text-ember">
        {count} new order{count === 1 ? '' : 's'} since your last visit
      </p>
      <button
        type="button"
        onClick={() => {
          markOrdersSeen();
          window.dispatchEvent(new CustomEvent('bd_orders_seen'));
        }}
        className="rounded-xl border border-ink/10 bg-white px-3 py-1.5 text-xs font-semibold hover:bg-mist"
      >
        Mark seen
      </button>
    </div>
  );
}
