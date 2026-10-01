import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Flame, Clock, ShoppingBag, Tag } from 'lucide-react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';

/** Next Black Friday (4th Friday of November) — demo countdown target */
function nextBlackFriday() {
  const year = new Date().getFullYear();
  const nov1 = new Date(year, 10, 1);
  const firstFriday = 1 + ((5 - nov1.getDay() + 7) % 7);
  let bf = new Date(year, 10, firstFriday + 21, 0, 0, 0);
  if (bf.getTime() < Date.now()) {
    const y = year + 1;
    const n = new Date(y, 10, 1);
    const ff = 1 + ((5 - n.getDay() + 7) % 7);
    bf = new Date(y, 10, ff + 21, 0, 0, 0);
  }
  return bf;
}

function useCountdown(target) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, target.getTime() - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, ended: diff <= 0 };
}

export default function BlackFriday() {
  const target = useMemo(() => nextBlackFriday(), []);
  const cd = useCountdown(target);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState({ enabled: true, title: 'Black Friday' });

  useEffect(() => {
    window.scrollTo(0, 0);
    api.get('/site').then((d) => {
      if (d.site?.blackFriday) setCampaign(d.site.blackFriday);
    }).catch(() => {});
    api
      .get('/products')
      .then((d) => {
        const list = (d.products || [])
          .filter((p) => p.compareAt && p.compareAt > p.price)
          .sort((a, b) => {
            const da = ((a.compareAt - a.price) / a.compareAt) * 100;
            const db = ((b.compareAt - b.price) / b.compareAt) * 100;
            return db - da;
          });
        setProducts(list.length ? list : (d.products || []).slice(0, 16));
      })
      .finally(() => setLoading(false));
  }, []);

  const units = [
    { label: 'Days', value: cd.days },
    { label: 'Hours', value: cd.hours },
    { label: 'Mins', value: cd.mins },
    { label: 'Secs', value: cd.secs },
  ];

  if (campaign.enabled === false) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h1 className="font-display text-3xl font-bold">{campaign.title || 'Black Friday'}</h1>
        <p className="mt-3 text-ink-mute">This campaign is not running right now. Browse current deals in the shop.</p>
        <Link to="/deals" className="mt-6 inline-flex rounded-md bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white">
          View deals
        </Link>
      </div>
    );
  }

  return (
    <div className="bd-bf-page">
      <section className="bd-bf-hero">
        <div className="bd-bf-hero-inner">
          <p className="bd-bf-kicker">
            <Flame size={16} /> BigDrop Kenya campaign
          </p>
          <h1>{campaign.title || 'Black Friday'}</h1>
          <p className="bd-bf-sub">
            Massive marketplace deals across phones, fashion, beauty, home and more — fulfilled nationwide
            by Globeflight.
          </p>

          <div className="bd-bf-countdown" aria-label="Countdown to Black Friday">
            {units.map((u) => (
              <div key={u.label} className="bd-bf-count-unit">
                <strong>{String(u.value).padStart(2, '0')}</strong>
                <span>{u.label}</span>
              </div>
            ))}
          </div>

          <div className="bd-bf-cta-row">
            <a href="#bf-deals" className="bd-bf-cta">
              <ShoppingBag size={18} /> Shop {campaign.title || 'Black Friday'} deals
            </a>
            <Link to="/deals" className="bd-bf-cta-secondary">
              <Tag size={16} /> All deals
            </Link>
          </div>

          <p className="bd-bf-note">
            <Clock size={14} /> {cd.ended ? 'Deals are live — shop now' : 'Countdown to Black Friday · prices while stocks last'}
          </p>
        </div>
      </section>

      <section id="bf-deals" className="bd-bf-grid-wrap">
        <div className="section-title">
          <h2>{campaign.title || 'Black Friday'} picks</h2>
          <Link to="/shop">View all →</Link>
        </div>
        {loading ? (
          <p className="text-center text-ink-mute py-10">Loading deals…</p>
        ) : (
          <div className="product-grid">
            {products.slice(0, 16).map((p) => (
              <ProductCard key={p.id} product={p} dealOfDay />
            ))}
          </div>
        )}
        {!loading && products.length === 0 && (
          <p className="text-center text-ink-mute py-10">
            Deals are being loaded. Check the{' '}
            <Link to="/shop" className="text-ember font-semibold">
              shop
            </Link>
            .
          </p>
        )}
      </section>

      <section className="bd-bf-strip">
        <div className="bd-bf-strip-inner">
          <div>
            <h3>Pay Protection · Secure checkout</h3>
            <p>Shop with M-Pesa, card, or COD. Invoice on every order.</p>
          </div>
          <Link to="/shop" className="bd-bf-cta">
            Continue shopping
          </Link>
        </div>
      </section>
    </div>
  );
}
