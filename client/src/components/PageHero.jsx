import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

/**
 * Drive-matching orange page banner used on inner pages.
 */
export default function PageHero({
  title,
  subtitle,
  children,
  crumbs = [],
  image,
}) {
  return (
    <div>
      {crumbs.length > 0 && (
        <div className="bg-white border-b">
          <nav className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-1 text-sm text-gray-500 flex-wrap">
            <Link to="/" className="hover:text-orange-500">
              Home
            </Link>
            {crumbs.map((c) => (
              <span key={c.label} className="flex items-center gap-1">
                <ChevronRight size={14} />
                {c.to ? (
                  <Link to={c.to} className="hover:text-orange-500">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-gray-800 font-medium">{c.label}</span>
                )}
              </span>
            ))}
          </nav>
        </div>
      )}
      <section
        className="text-white py-12 md:py-16 relative overflow-hidden"
        style={
          image
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(1,88,55,0.55) 0%, rgba(1,71,44,0.72) 100%), url('${image}')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '16rem',
              }
            : { background: 'linear-gradient(to bottom right, #015837, #01472c)' }
        }
      >
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">{title}</h1>
          {subtitle && <p className="text-lg text-white/90 max-w-2xl mx-auto">{subtitle}</p>}
          {children && <div className="mt-6 flex flex-wrap justify-center gap-3">{children}</div>}
        </div>
      </section>
    </div>
  );
}
