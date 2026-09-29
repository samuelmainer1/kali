import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';

export default function NotFound() {
  return (
    <div>
      <PageHero
        title="Page not found"
        subtitle="The page you are looking for does not exist or may have moved."
      >
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/" className="inline-flex items-center rounded-md bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg px-5 py-2.5 text-sm">
            Go home
          </Link>
          <Link
            to="/shop"
            className="inline-flex items-center rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
          >
            Browse shop
          </Link>
        </div>
      </PageHero>
    </div>
  );
}
