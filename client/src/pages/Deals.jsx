import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Percent, Zap } from 'lucide-react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import PageHero from '../components/PageHero';

export default function Deals() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    api
      .get('/products')
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, []);

  const deals = useMemo(
    () =>
      products
        .filter((p) => p.compareAt && p.compareAt > p.price)
        .sort((a, b) => {
          const da = ((a.compareAt - a.price) / a.compareAt) * 100;
          const db = ((b.compareAt - b.price) / b.compareAt) * 100;
          return db - da;
        }),
    [products]
  );

  const flash = deals.slice(0, 8);
  const more = deals.slice(8, 24);

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Deals' }]}
        title="Deals & offers"
        subtitle="Discounted picks from BigDrop vendors — updated for shoppers across Kenya."
      >
        <Link
          to="/black-friday"
          className="inline-flex items-center gap-2 rounded-md bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg px-5 py-2.5 text-sm"
        >
          <Zap size={16} /> Black Friday
        </Link>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
        >
          Browse shop
        </Link>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
        <div className="mb-6 flex items-center gap-2 text-ember">
          <Percent size={18} />
          <h2 className="font-display text-2xl font-bold text-ink">Flash savings</h2>
        </div>
        {loading ? (
          <p className="text-sm text-ink-mute">Loading offers…</p>
        ) : flash.length === 0 ? (
          <p className="text-sm text-ink-mute">
            No discounted items right now.{' '}
            <Link to="/shop" className="font-semibold text-leaf">
              Explore the shop
            </Link>
          </p>
        ) : (
          <div className="product-grid">
            {flash.map((p) => (
              <ProductCard key={p.id} product={p} dealOfDay />
            ))}
          </div>
        )}

        {more.length > 0 && (
          <>
            <div className="mt-12 mb-6 section-title" style={{ margin: '48px 0 18px' }}>
              <h2>More deals</h2>
              <Link to="/shop">Shop all →</Link>
            </div>
            <div className="product-grid">
              {more.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
