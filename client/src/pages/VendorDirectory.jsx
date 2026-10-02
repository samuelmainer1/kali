import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import { api } from '../lib/api';
import PageHero from '../components/PageHero';

export default function VendorDirectory() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/stores')
      .then((d) => setVendors(d.vendors || []))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Vendors' }]}
        title="Shop by vendor"
        subtitle="Open a seller’s shop and buy only from that store."
      />
      <div className="mx-auto max-w-7xl px-4 py-12 md:px-6">
        {loading ? <p className="text-sm text-gray-500">Loading shops…</p> : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => (
            <Link
              key={v.id}
              to={`/vendors/${v.slug}`}
              className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm hover:border-[#015837]/40 hover:shadow-md transition-shadow"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-[#015837]">
                <Store size={18} />
              </div>
              <h2 className="mt-3 font-semibold text-gray-900">{v.storeName || v.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{v.productCount} products</p>
              <p className="mt-3 text-sm font-semibold text-[#015837]">Visit shop →</p>
            </Link>
          ))}
        </div>
        {!loading && vendors.length === 0 ? (
          <p className="text-sm text-gray-500">No vendor shops are live yet.</p>
        ) : null}
      </div>
    </div>
  );
}
