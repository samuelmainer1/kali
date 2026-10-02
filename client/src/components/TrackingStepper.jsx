export const TRACK_STEPS = [
  { id: 'placed', label: 'Order placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'picking', label: 'Picking' },
  { id: 'packed', label: 'Packed' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
];

export default function TrackingStepper({ currentStatus, timeline = [] }) {
  const currentIdx = TRACK_STEPS.findIndex((s) => s.id === currentStatus);
  const activeIdx = currentIdx < 0 ? 0 : currentIdx;
  const byStatus = Object.fromEntries((timeline || []).map((t) => [t.status, t]));

  return (
    <ol className="mt-8 flex gap-1 overflow-x-auto pb-2">
      {TRACK_STEPS.map((step, i) => {
        const done = i < activeIdx;
        const current = i === activeIdx;
        const upcoming = i > activeIdx;
        const stamp = byStatus[step.id]?.at;
        return (
          <li key={step.id} className="flex-1 min-w-[7rem]">
            <div className="flex items-center">
              <span
                className={`h-3 w-3 rounded-full shrink-0 ${
                  upcoming ? 'bg-gray-300' : current ? 'bg-[#015837] ring-4 ring-green-100' : 'bg-[#015837]'
                }`}
              />
              {i < TRACK_STEPS.length - 1 && (
                <span className={`h-0.5 flex-1 mx-1 ${i < activeIdx ? 'bg-[#015837]' : 'bg-gray-200'}`} />
              )}
            </div>
            <p
              className={`mt-2 text-xs font-semibold ${
                upcoming ? 'text-gray-400' : current ? 'text-[#015837]' : 'text-gray-800'
              }`}
            >
              {i + 1}. {step.label}
            </p>
            {stamp && !upcoming ? (
              <p className="text-[10px] text-gray-500 mt-0.5">{new Date(stamp).toLocaleString('en-KE')}</p>
            ) : upcoming ? (
              <p className="text-[10px] text-gray-400 mt-0.5">Upcoming</p>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
