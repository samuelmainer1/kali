import { Link } from 'react-router-dom';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { formatKES } from '../lib/api';
import StarRating from './StarRating';

export default function RecentlyViewed({ excludeId }) {
  const { items } = useRecentlyViewed();
  const visible = excludeId ? items.filter((p) => p.id !== excludeId) : items;

  if (visible.length === 0) return null;

  return (
    <section className="bd-recently-viewed">
      <div className="section-title">
        <h2>Recently viewed</h2>
      </div>
      <div className="bd-recently-strip">
        {visible.map((p) => (
          <Link key={p.id} to={`/product/${p.slug}`} className="bd-recently-card">
            <div className="bd-recently-img">
              <img
                src={p.images?.[0]}
                alt={p.name}
                loading="lazy"
                                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.svg';
                  e.currentTarget.onerror = null;
                }}
              />
            </div>
            <div className="bd-recently-info">
              {p.brand && <span className="bd-recently-brand">{p.brand}</span>}
              <p className="bd-recently-name">{p.name}</p>
              <p className="bd-recently-price">{formatKES(p.price)}</p>
              <StarRating rating={p.rating || 0} size={11} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
