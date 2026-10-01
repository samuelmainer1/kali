import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ArrowRight } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import ProductCard from '../components/ProductCard';
import PageHero from '../components/PageHero';

export default function Wishlist() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(!!user);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setProducts([]);
      setLoading(false);
      return;
    }
    api
      .get('/wishlist')
      .then((d) => setProducts(d.products || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Wishlist' }]}
        title="My Wishlist"
        subtitle={user ? `${user.name?.split(' ')[0] || 'Your'} saved products` : 'Sign in to save items you love.'}
      />

      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      {loading && <p className="text-sm text-ink-mute">Loading your wishlist…</p>}
      {error && <p className="text-sm text-ember">{error}</p>}

      {!user && (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-ink/5 bg-white px-6 py-16 text-center shadow-lift">
          <Heart className="h-10 w-10 text-orange-400" />
          <p className="font-semibold">Login to view your wishlist</p>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-600 px-6 py-3 text-sm font-semibold text-white">
            Login / Register
          </Link>
        </div>
      )}

      {user && !loading && !error && products.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-ink/5 bg-white px-6 py-20 text-center shadow-lift"
        >
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-mist text-ink-mute">
            <Heart className="h-7 w-7" />
          </div>
          <p className="font-semibold">Your wishlist is empty</p>
          <p className="max-w-sm text-sm text-ink-mute">
            Save products you love while browsing and they&apos;ll show up here for later.
          </p>
          <Link
            to="/shop"
            className="mt-2 inline-flex items-center gap-2 rounded-md bg-orange-500 hover:bg-orange-600 px-6 py-3 text-sm font-semibold text-white"
          >
            Browse products <ArrowRight className="h-4 w-4" />
          </Link>
        </motion.div>
      )}

      {user && !loading && products.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
