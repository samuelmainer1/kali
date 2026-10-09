import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { api } from '../lib/api';
import PageHero from '../components/PageHero';

export default function Brands() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    api
      .get('/categories')
      .then((d) => setCategories(d.categories || []))
      .finally(() => setLoading(false));
  }, []);

  const brands = [
    ...new Set(categories.flatMap((c) => c.brands || [])),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Brands' }]}
        title="Brands on BigDrop"
        subtitle="Shop trusted brands stocked by verified vendors — phones, fashion, beauty, home and more."
      />

      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        <div className="mb-6 flex items-center gap-2">
          <Store className="h-5 w-5 text-ember" />
          <h2 className="font-display text-2xl font-bold">Browse by brand</h2>
        </div>

        {loading ? (
          <p className="text-sm text-ink-mute">Loading brands…</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {brands.map((b) => (
              <Link
                key={b}
                to={`/shop?brand=${encodeURIComponent(b)}`}
                className="rounded-xl border border-ink/10 bg-white px-4 py-4 text-sm font-semibold shadow-lift hover:border-ember/40 hover:text-ember transition"
              >
                {b}
              </Link>
            ))}
          </div>
        )}

        <p className="mt-10 text-sm text-ink-mute">
          Want to list your brand on BigDrop?{' '}
          <Link to="/sell" className="font-semibold text-leaf">
            Sell on BigDrop
          </Link>
        </p>
      </div>
    </div>
  );
}
