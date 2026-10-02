import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCcw, Package, Clock, ShieldCheck, AlertCircle } from 'lucide-react';
import PageHero from '../components/PageHero';

const sections = [
  {
    icon: Clock,
    title: 'Return window',
    body: 'You may request a return within 24 hours of delivery for unused items in original packaging, with tags and seals intact. Inspect the parcel on delivery and report damage or missing items within the same 24 hours.',
  },
  {
    icon: Package,
    title: 'Eligible items',
    body: 'Electronics, fashion, home goods and most marketplace items can be returned if defective or not as described. Perishable groceries, opened beauty products, and personal-care items are generally non-returnable for hygiene reasons.',
  },
  {
    icon: RefreshCcw,
    title: 'How to start a return',
    body: 'Contact us at orders@bigdrop.co.ke or +254 722 359 298 with your order number, reason, and photos if the item arrived damaged. Our team will confirm eligibility and arrange pickup or drop-off at NextGen Mall.',
  },
  {
    icon: ShieldCheck,
    title: 'Refunds',
    body: 'Once we receive and inspect the item, refunds are processed to the original payment method (M-Pesa or card) within 5–10 business days. Cash-on-delivery orders are refunded via M-Pesa to the phone used at checkout.',
  },
  {
    icon: AlertCircle,
    title: 'Exchanges & damaged goods',
    body: 'If your parcel arrived damaged or incomplete, report it within 24 hours of delivery. We will arrange a free replacement or full refund — you should not be charged return shipping for our error.',
  },
];

export default function Returns() {
  const [open, setOpen] = useState(0);

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Returns & Refunds' }]}
        title="Returns & refunds"
        subtitle="Clear policies so you can shop with confidence. Fulfilled by Globeflight Kenya with nationwide support."
      />

      <div className="mx-auto max-w-4xl px-4 py-14 md:px-6">
        <div className="space-y-4">
          {sections.map((s, i) => (
            <button
              key={s.title}
              type="button"
              onClick={() => setOpen(open === i ? -1 : i)}
              className="w-full text-left rounded-2xl border border-ink/5 bg-white p-5 shadow-lift"
            >
              <div className="flex items-start gap-4">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-leaf-pale text-leaf">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-lg font-bold">{s.title}</h2>
                  {open === i && (
                    <p className="mt-2 text-sm text-ink-mute leading-relaxed">{s.body}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-10 rounded-2xl bg-[#1a1a1a] text-white p-6 md:p-8 text-center">
          <p className="font-display text-xl font-bold">Need help with a return?</p>
          <p className="mt-2 text-sm text-white/75">
            Email orders@bigdrop.co.ke or call +254 722 359 298 — we are available 24 hours.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link to="/contact" className="rounded-xl bg-ember px-6 py-3 text-sm font-semibold hover:bg-ember-deep">
              Contact us
            </Link>
            <Link to="/track" className="rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold hover:bg-white/10">
              Track order
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
