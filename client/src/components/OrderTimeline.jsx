import TrackingStepper from './TrackingStepper';

const STATUS_LABEL = {
  placed: 'Order placed',
  confirmed: 'Confirmed',
  picking: 'Picking',
  packed: 'Packed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

/**
 * Customer-style numbered tracking timeline.
 * Hidden once order is delivered/cancelled — use Track shipment instead.
 */
export default function OrderTimeline({ order }) {
  if (!order || order.status === 'delivered' || order.status === 'cancelled') {
    return null;
  }

  return (
    <div className="bd-order-timeline">
      <div className="bd-order-timeline-head">
        <span className="font-semibold text-sm text-ink">Tracking progress</span>
        <span className="text-xs font-semibold text-leaf capitalize">
          {STATUS_LABEL[order.status] || order.status}
          {order.carrier ? ` · ${order.carrier}` : ''}
        </span>
      </div>
      <TrackingStepper currentStatus={order.status} timeline={order.timeline || []} />
    </div>
  );
}
