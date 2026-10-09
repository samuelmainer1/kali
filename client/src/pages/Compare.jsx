import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import PageHero from '../components/PageHero';
import StarRating from '../components/StarRating';
import { useCompare } from '../context/CompareContext';
import { formatKES } from '../lib/api';

export default function Compare() {
  const { items, removeItem, clearAll } = useCompare();

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Compare' }]}
        title="Compare products"
        subtitle="Side-by-side comparison of up to 3 products. Add items from any product page."
      />

      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        {items.length === 0 ? (
          <div className="bd-compare-empty">
            <p>No products selected for comparison yet.</p>
            <Link to="/shop" className="btn btn-primary">
              Browse shop
            </Link>
          </div>
        ) : (
          <>
            <div className="bd-compare-actions">
              <p>{items.length} of 3 products selected</p>
              <button type="button" className="btn btn-sm btn-outline" onClick={clearAll}>
                Clear all
              </button>
            </div>

            <div className="bd-compare-table-wrap">
              <table className="bd-compare-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    {items.map((p) => (
                      <th key={p.id}>
                        <button
                          type="button"
                          className="bd-compare-remove"
                          onClick={() => removeItem(p.id)}
                          aria-label={`Remove ${p.name}`}
                        >
                          <X size={16} />
                        </button>
                        <Link to={`/product/${p.slug}`}>
                          <img src={p.images?.[0]} alt={p.name} />
                          <span>{p.name}</span>
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Brand</td>
                    {items.map((p) => (
                      <td key={p.id}>{p.brand || '—'}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Price</td>
                    {items.map((p) => (
                      <td key={p.id}>{formatKES(p.price)}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Rating</td>
                    {items.map((p) => (
                      <td key={p.id}>
                        <StarRating rating={p.rating || 0} size={14} showValue />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td>Image</td>
                    {items.map((p) => (
                      <td key={p.id}>
                        <img
                          className="bd-compare-cell-img"
                          src={p.images?.[0]}
                          alt={p.name}
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
