import PageHero from '../components/PageHero';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Fulfillment() {
  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Shipping Info' }]}
        title="End-to-end e-fulfillment for Kenyan sellers"
        subtitle="Store with us. We pick, pack, and deliver through Globeflight — you focus on selling."
      >
          <Link
            to="/sell"
            className="inline-flex w-fit items-center gap-2 rounded-md bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg px-5 py-2.5 text-sm"
          >
            Become a vendor <ArrowRight className="h-4 w-4" />
          </Link>
      </PageHero>

      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <h2 className="font-display text-3xl font-bold">How fulfillment works</h2>
        <p className="mt-2 text-sm text-ink-mute max-w-xl">One flow from inventory intake to customer doorstep.</p>
        <ol className="mt-10 grid gap-8 md:grid-cols-4">
          {[
            { n: '01', t: 'Send stock', d: 'Drop inventory at our NextGen Mall hub or arrange collection.' },
            { n: '02', t: 'We store', d: 'Secure warehousing with SKU-level inventory visibility.' },
            { n: '03', t: 'Orders flow in', d: 'Marketplace or your own channels — we pick and pack.' },
            { n: '04', t: 'Globeflight delivers', d: 'Nationwide last-mile with tracking for every parcel.' },
          ].map((step) => (
            <li key={step.n}>
              <p className="font-display text-4xl font-bold text-leaf/40">{step.n}</p>
              <h3 className="mt-2 font-semibold text-lg">{step.t}</h3>
              <p className="mt-1 text-sm text-ink-mute leading-relaxed">{step.d}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
