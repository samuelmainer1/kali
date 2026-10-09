import { Link } from 'react-router-dom';
import { formatKES } from '../lib/api';
import OrderDocuments from './OrderDocuments';

export default function DeliveredOrderCard({ o, subtitle, children }) {
  return (
    <article className="rounded-2xl border border-ink/5 bg-white p-4 shadow-lift flex flex-col h-full">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{o.orderNumber}</p>
          <p className="text-[11px] text-ink-mute mt-0.5">
            {new Date(o.createdAt).toLocaleDateString('en-KE')}
            {subtitle ? ` · ${subtitle}` : ''}
          </p>
        </div>
        <span className="shrink-0 rounded-md bg-leaf-pale px-2 py-0.5 text-[10px] font-semibold text-leaf">
          Delivered
        </span>
      </div>
      <p className="mt-2 text-xs text-ink-mute line-clamp-2">
        {(o.items || []).map((i) => `${i.qty}× ${i.name}`).join(', ')}
      </p>
      <p className="mt-2 font-bold text-sm">{formatKES(o.total)}</p>
      <div className="mt-auto pt-3 space-y-2">
        {children || (
          <>
            <OrderDocuments order={o} compact />
            <Link
              to={`/track?code=${encodeURIComponent(o.trackingNumber)}`}
              className="block text-xs font-semibold text-leaf"
            >
              Track shipment →
            </Link>
          </>
        )}
      </div>
    </article>
  );
}
