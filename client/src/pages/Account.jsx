import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api, formatKES } from '../lib/api';
import OrderDocuments from '../components/OrderDocuments';
import OrderTimeline from '../components/OrderTimeline';
import DeliveredOrderCard from '../components/DeliveredOrderCard';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { ProfileCard, AddressBook, MyReturns } from '../components/AccountPanels';

const statusLabel = {
  placed: 'Placed',
  confirmed: 'Confirmed',
  picking: 'Picking',
  packed: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

function ActiveOrderCard({ o }) {
  return (
    <article className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold">{o.orderNumber}</p>
          <p className="text-xs text-ink-mute">
            {new Date(o.createdAt).toLocaleString('en-KE')} · Track {o.trackingNumber}
          </p>
        </div>
        <span className="rounded-md bg-mist px-2.5 py-1 text-xs font-semibold">
          {statusLabel[o.status] || o.status}
        </span>
      </div>
      <ul className="mt-3 space-y-1 text-sm text-ink-mute">
        {o.items.map((i) => (
          <li key={i.productId + (i.variant || '')}>
            {i.qty}× {i.name}
          </li>
        ))}
      </ul>
      {(o.notifications || []).filter((n) => n.channel === 'sms' || n.channel === 'whatsapp').slice(0, 3).length > 0 && (
        <div className="mt-3 rounded-lg bg-mist p-3 text-xs text-ink-soft space-y-1">
          {(o.notifications || [])
            .filter((n) => n.channel === 'sms' || n.channel === 'whatsapp')
            .slice(0, 3)
            .map((n) => (
              <p key={n.id}>{n.message}</p>
            ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="font-bold">{formatKES(o.total)}</p>
        <Link
          to={`/track?code=${encodeURIComponent(o.trackingNumber)}`}
          className="text-sm font-semibold text-leaf"
        >
          Track shipment →
        </Link>
      </div>
      <OrderTimeline order={o} />
      <OrderDocuments order={o} />
    </article>
  );
}

export default function Account() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [params] = useSearchParams();
  const ordered = params.get('ordered');
  const track = params.get('track');

  useEffect(() => {
    api.get('/orders').then((d) => setOrders(d.orders));
  }, []);

  const { active, finished } = useMemo(() => {
    const activeOrders = [];
    const finishedOrders = [];
    for (const o of orders) {
      if (o.status === 'delivered') finishedOrders.push(o);
      else activeOrders.push(o);
    }
    return { active: activeOrders, finished: finishedOrders };
  }, [orders]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
      <h1 className="font-display text-4xl font-bold">Dashboard</h1>
      <p className="mt-1 text-sm text-ink-mute">
        Hello, {user?.name?.split(' ')[0]} · {user?.email} · {user?.role}
      </p>

      {ordered && (
        <div className="mt-6 rounded-2xl border border-leaf/30 bg-leaf-pale/50 px-5 py-4">
          <p className="font-semibold text-leaf">Order placed successfully</p>
          <p className="text-sm mt-1">
            Order <strong>{ordered}</strong>
            {track && (
              <>
                {' '}
                · Track with{' '}
                <Link to={`/track?code=${encodeURIComponent(track)}`} className="font-semibold underline">
                  {track}
                </Link>
              </>
            )}
          </p>
        </div>
      )}

      {!orders.length ? (
        <p className="mt-10 text-sm text-ink-mute">
          No orders yet.{' '}
          <Link to="/shop" className="text-leaf font-semibold">
            Start shopping
          </Link>
        </p>
      ) : (
        <>
          {active.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold">Orders in progress</h2>
              <p className="mt-1 text-sm text-ink-mute">Live tracking until delivery is complete.</p>
              <div className="mt-4 space-y-4">
                {active.map((o) => (
                  <ActiveOrderCard key={o.id} o={o} />
                ))}
              </div>
            </section>
          )}

          {finished.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-2xl font-bold">Delivered orders</h2>
              <p className="mt-1 text-sm text-ink-mute">
                Invoices &amp; receipts — use Track shipment to review past progress.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {finished.map((o) => (
                  <DeliveredOrderCard key={o.id} o={o} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <ProfileCard />
        <AddressBook />
      </div>

      <MyReturns orders={orders} />

      <div className="mt-10">
        <ChangePasswordForm />
      </div>
    </div>
  );
}
