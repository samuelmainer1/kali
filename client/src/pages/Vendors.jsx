import PageHero from '../components/PageHero';
import { Link } from 'react-router-dom';
import { ArrowRight, Store, Truck, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../lib/api';

const ICONS = [Store, Truck, BarChart3];

export default function Vendors() {
  const [page, setPage] = useState(null);

  useEffect(() => {
    const id = window.location.hash.replace('#', '');
    api.get('/site').then((d) => setPage(d.site?.sellPage || null)).catch(() => {});
    if (!id) return;
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }, []);

  const title = page?.title || 'Sell on BigDrop';
  const subtitle =
    page?.subtitle || "List products on Kenya's Globeflight-powered marketplace. We handle storage and delivery.";
  const steps = page?.steps?.length
    ? page.steps
    : [
        { n: '1', t: 'Create a vendor account', d: 'Register with your store name. Admin reviews applications within one business day.' },
        { n: '2', t: 'Get approved', d: 'We confirm your business details. You can log in anytime to check status.' },
        { n: '3', t: 'List products', d: 'Add photos, prices and stock from your vendor dashboard.' },
        { n: '4', t: 'We fulfill', d: 'Send inventory to NextGen Mall. Globeflight picks, packs and delivers.' },
      ];
  const benefits = page?.benefits?.length
    ? page.benefits
    : [
        { title: 'Your storefront', text: 'Reach customers without building your own ecommerce site.' },
        { title: 'Logistics included', text: 'Globeflight picks, packs, and delivers every order.' },
        { title: 'Simple dashboard', text: 'Manage products, stock, and order status in one place.' },
      ];
  const commissionRows = page?.commissionRows?.length
    ? page.commissionRows
    : [
        { category: 'Phones & electronics', rate: '8%' },
        { category: 'Fashion', rate: '12%' },
        { category: 'Beauty & health', rate: '10%' },
        { category: 'Home & office', rate: '10%' },
        { category: 'Groceries', rate: '6%' },
      ];
  const guidelines = page?.guidelines?.length
    ? page.guidelines
    : [
        'List only genuine products with accurate photos, prices, and stock.',
        'Send inventory to our NextGen Mall warehouse (or arrange collection) before going live.',
        'Respond to customer questions promptly. BigDrop handles pick, pack, and delivery.',
        'Admin reviews every listing. Counterfeit or prohibited items will be rejected.',
        'Keep stock levels updated so we never sell what we cannot ship.',
      ];

  return (
    <div>
      <PageHero crumbs={[{ label: title }]} title={title} subtitle={subtitle}>
        <Link
          to="/register?role=vendor"
          className="inline-flex items-center gap-2 rounded-md bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg px-5 py-2.5 text-sm"
        >
          Start selling <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
        >
          Vendor login
        </Link>
      </PageHero>

      <section id="how" className="mx-auto max-w-7xl px-4 py-16 md:px-6 scroll-mt-24">
        <h2 className="font-display text-3xl font-bold">How to start selling</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.n || i} className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-white text-sm font-bold">
                {s.n || i + 1}
              </span>
              <h3 className="mt-3 font-semibold">{s.t}</h3>
              <p className="mt-2 text-sm text-ink-mute">{s.d}</p>
            </li>
          ))}
        </ol>
        <Link
          to="/register?role=vendor"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 text-sm"
        >
          Create vendor account <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section id="benefits" className="mx-auto max-w-7xl px-4 py-16 md:px-6 scroll-mt-24">
        <h2 className="font-display text-3xl font-bold">Vendor benefits</h2>
        <p className="mt-2 text-sm text-ink-mute max-w-2xl">
          {page?.benefitsIntro ||
            'Reach shoppers across Kenya without building your own store. Globeflight picks, packs, and delivers every order.'}
        </p>
        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {benefits.map(({ title, text }, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div key={title || i} className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-pale text-leaf">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-lg">{title}</h3>
                <p className="mt-2 text-sm text-ink-mute leading-relaxed">{text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section id="commission" className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6 scroll-mt-24">
          <h2 className="font-display text-3xl font-bold">Commission structure</h2>
          <p className="mt-2 text-sm text-ink-mute max-w-2xl">
            {page?.commissionIntro || 'Simple, transparent fees. You keep the rest after fulfillment.'}
          </p>
          <div className="mt-8 overflow-hidden rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold">Category</th>
                  <th className="px-4 py-3 font-semibold">Commission</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                {commissionRows.map((row) => (
                  <tr key={row.category} className="border-t">
                    <td className="px-4 py-3">{row.category}</td>
                    <td className="px-4 py-3">{row.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="guidelines" className="mx-auto max-w-7xl px-4 py-16 md:px-6 scroll-mt-24">
        <h2 className="font-display text-3xl font-bold">Seller guidelines</h2>
        <ul className="mt-6 space-y-3 text-sm text-ink-mute max-w-2xl list-disc pl-5">
          {guidelines.map((g) => (
            <li key={g}>{g}</li>
          ))}
        </ul>
        <Link
          to="/register?role=vendor"
          className="mt-8 inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2.5 text-sm"
        >
          Apply to sell <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
