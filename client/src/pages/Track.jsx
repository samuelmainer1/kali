import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Package } from 'lucide-react';
import { api } from '../lib/api';
import PageHero from '../components/PageHero';
import TrackingStepper from '../components/TrackingStepper';
import { useSearchParams } from 'react-router-dom';

const statusCopy = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  picking: 'Picking',
  packed: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function Track() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(() => params.get('code') || '');
  const [tracking, setTracking] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function lookup(value) {
    const q = (value || '').trim();
    if (!q) return;
    setLoading(true);
    setError('');
    setTracking(null);
    try {
      const data = await api.get(`/track/${encodeURIComponent(q)}`);
      setTracking(data.tracking);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initial = params.get('code');
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function submit(e) {
    e.preventDefault();
    lookup(code);
  }

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Track Order' }]}
        title="Track your shipment"
        subtitle="Enter your Globeflight tracking number or BigDrop order number."
      >
        <form onSubmit={submit} className="mt-2 flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-mute" />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. GFXXXXXXXXX or BD…"
              className="w-full rounded-xl border-0 py-3.5 pl-11 pr-4 text-ink outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-ember px-8 py-3.5 text-sm font-semibold text-white hover:bg-ember-deep disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Track'}
          </button>
        </form>
      </PageHero>

      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6">
        {error && (
          <p className="rounded-xl border border-ember/30 bg-ember-pale px-4 py-3 text-sm text-ember-deep">
            {error}
          </p>
        )}
        {tracking && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift"
          >
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-leaf-pale p-3 text-leaf">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-xl font-bold">{tracking.trackingNumber}</p>
                <p className="text-sm text-ink-mute">
                  Order {tracking.orderNumber} · {tracking.itemCount} item(s) · {tracking.city}
                </p>
                <p className="mt-1 text-sm font-semibold text-leaf">
                  {statusCopy[tracking.status] || tracking.status} · {tracking.carrier}
                </p>
              </div>
            </div>
            {tracking.status === 'cancelled' ? (
              <p className="mt-6 text-sm text-ember-deep">This shipment was cancelled.</p>
            ) : (
              <TrackingStepper currentStatus={tracking.status} timeline={tracking.timeline || []} />
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
