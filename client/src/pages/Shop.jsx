import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from 'lucide-react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import { useLang } from '../context/LangContext';

const PAGE_SIZE = 60;
// At most this many numbered buttons are rendered at once. With ~1,800
// products a full row of every page number is unusable, so the list becomes a
// sliding window around the current page instead.
const MAX_PAGE_BUTTONS = 10;

export default function Shop() {
  const { t } = useLang();
  const [params, setParams] = useSearchParams();
  // /category/:slug is the indexable landing-page form (sitemap + JSON-LD breadcrumbs
  // point here); /shop?category= is the legacy query form still used by the dev server
  // and any client-side links. Path wins when both are present.
  const { slug: pathCategory } = useParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('newest');
  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const [minR, setMinR] = useState(params.get('minRating') || '0');
  const [dealOnly, setDealOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState(() => {
    const b = params.get('brand');
    return b ? b.split(',').filter(Boolean) : [];
  });

  const category = pathCategory || params.get('category') || '';
  const q = params.get('q') || '';

  useEffect(() => {
    api.get('/categories').then((d) => setCategories(d.categories || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!category) {
      api.get('/categories').then((d) => {
        const all = [...new Set((d.categories || []).flatMap((c) => c.brands || []))].sort();
        setBrands(all);
      });
      return;
    }
    api
      .get(`/categories/${category}/brands`)
      .then((d) => setBrands(d.brands || []))
      .catch(() => setBrands([]));
  }, [category]);

  useEffect(() => {
    setLoading(true);
    const query = new URLSearchParams();
    if (category) query.set('category', category);
    if (q) query.set('q', q);
    if (selectedBrands.length) query.set('brand', selectedBrands.join(','));
    if (Number(minR)) query.set('minRating', minR);
    api
      .get(`/products?${query}`)
      .then((d) => setProducts(d.products || []))
      .finally(() => setLoading(false));
  }, [category, q, selectedBrands, minR]);

  const filtered = useMemo(() => {
    let list = [...products];
    const min = parseFloat(minP) || 0;
    const max = parseFloat(maxP) || Infinity;
    list = list.filter((p) => p.price >= min && p.price <= max);
    if (dealOnly) list = list.filter((p) => p.compareAt && p.compareAt > p.price);
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    else if (sort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (sort === 'popular') list.sort((a, b) => (b.soldCount || b.reviews || 0) - (a.soldCount || a.reviews || 0));
    else if (sort === 'newest') list.reverse();
    return list;
  }, [products, sort, minP, maxP, dealOnly]);

  const priceBounds = useMemo(() => {
    if (!products.length) return { lo: 0, hi: 100000 };
    const prices = products.map((p) => p.price);
    return { lo: Math.min(...prices), hi: Math.max(...prices) };
  }, [products]);

  const page = Math.max(1, Number(params.get('page') || 1));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  function setPage(n) {
    const p = new URLSearchParams(params);
    if (n <= 1) p.delete('page');
    else p.set('page', String(n));
    setParams(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * At most MAX_PAGE_BUTTONS page numbers, as a window that follows the current
   * page and never runs off either end. The first and last page are always
   * reachable — they anchor the window, with an ellipsis standing in for the
   * skipped run — so a shopper is never more than one click from the end of the
   * catalogue no matter how deep they are.
   */
  const pageItems = useMemo(() => {
    if (pageCount <= MAX_PAGE_BUTTONS) {
      return Array.from({ length: pageCount }, (_, i) => i + 1);
    }
    const half = Math.floor((MAX_PAGE_BUTTONS - 2) / 2);
    let start = Math.max(2, safePage - half);
    let end = Math.min(pageCount - 1, start + MAX_PAGE_BUTTONS - 3);
    start = Math.max(2, Math.min(start, end - (MAX_PAGE_BUTTONS - 3)));

    const items = [1];
    if (start > 2) items.push('gap-start');
    for (let n = start; n <= end; n++) items.push(n);
    if (end < pageCount - 1) items.push('gap-end');
    items.push(pageCount);
    return items;
  }, [pageCount, safePage]);

  const categoryName = categories.find((c) => c.slug === category)?.name;
  const heading = q ? `Results for “${q}”` : categoryName || 'All Products';
  const crumbLabel = q ? 'Search Results' : categoryName || 'Shop';

  const activeFilterCount =
    (minP || maxP ? 1 : 0) + selectedBrands.length + (Number(minR) ? 1 : 0) + (dealOnly ? 1 : 0);

  function toggleBrand(b) {
    setSelectedBrands((prev) => {
      const next = prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b];
      const p = new URLSearchParams(params);
      if (next.length) p.set('brand', next.join(','));
      else p.delete('brand');
      setParams(p);
      return next;
    });
  }

  function clearFilters() {
    setMinP('');
    setMaxP('');
    setMinR('0');
    setDealOnly(false);
    setSelectedBrands([]);
    const p = new URLSearchParams(params);
    p.delete('brand');
    p.delete('minRating');
    setParams(p);
  }

  const filterProps = {
    brands,
    selectedBrands,
    onBrandToggle: toggleBrand,
    minP,
    maxP,
    onMinP: setMinP,
    onMaxP: setMaxP,
    minR,
    onMinR: (v) => {
      setMinR(v);
      const p = new URLSearchParams(params);
      if (Number(v)) p.set('minRating', v);
      else p.delete('minRating');
      setParams(p);
    },
    dealOnly,
    onDealOnly: setDealOnly,
    onClear: clearFilters,
    activeFilterCount,
    priceLo: priceBounds.lo,
    priceHi: priceBounds.hi,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4 flex-wrap">
        <Link to="/" className="hover:text-orange-500">
          Home
        </Link>
        <ChevronRight size={14} />
        {q ? (
          <span className="text-gray-800 font-medium">Search Results</span>
        ) : categoryName ? (
          <>
            <Link to="/shop" className="hover:text-orange-500">
              Shop
            </Link>
            <ChevronRight size={14} />
            <span className="text-gray-800 font-medium">{categoryName}</span>
          </>
        ) : (
          <span className="text-gray-800 font-medium">{crumbLabel}</span>
        )}
      </nav>

      <div className="bd-shop-toolbar flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          {q && <Search size={20} className="text-gray-400 shrink-0" />}
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 truncate">{heading}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="md:hidden inline-flex items-center gap-1 border border-gray-300 rounded-md px-3 h-9 text-sm"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal size={16} />
            {t('filters')}
            {activeFilterCount > 0 && (
              <span className="ml-1 h-5 w-5 flex items-center justify-center bg-orange-500 text-white rounded-full text-xs">
                {activeFilterCount}
              </span>
            )}
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-9 w-[160px] border border-gray-300 rounded-md px-2 text-sm bg-white outline-none focus:border-orange-500"
            aria-label="Sort by"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="rating">Top Rated</option>
            <option value="popular">Most Popular</option>
          </select>
        </div>
      </div>

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedBrands.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => toggleBrand(b)}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs rounded-full px-2.5 py-1"
            >
              {b}
              <X size={12} />
            </button>
          ))}
          {(minP || maxP) && (
            <button
              type="button"
              onClick={() => {
                setMinP('');
                setMaxP('');
              }}
              className="inline-flex items-center gap-1 bg-gray-100 text-gray-800 text-xs rounded-full px-2.5 py-1"
            >
              KSh {minP || 0} – {maxP || 'any'}
              <X size={12} />
            </button>
          )}
        </div>
      )}

      <div className="flex gap-6">
        <aside className="bd-shop-filters">
          <FilterSidebar {...filterProps} />
        </aside>

        {showFilters && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setShowFilters(false)}>
            <div
              className="absolute right-0 top-0 h-full w-72 bg-white p-4 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{t('filters')}</h3>
                <button type="button" onClick={() => setShowFilters(false)} aria-label="Close filters">
                  <X size={20} />
                </button>
              </div>
              <FilterSidebar {...filterProps} />
            </div>
          </div>
        )}

        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-4">
            {loading ? t('loading') : t('productsFound', { n: filtered.length })}
          </p>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white border rounded-lg overflow-hidden">
                  <div className="aspect-square bg-gray-100 animate-pulse" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse" />
                    <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
                    <div className="h-8 bg-gray-100 rounded animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">{t('noProducts')}</p>
              <Link to="/shop" className="text-orange-500 font-semibold text-sm mt-2 inline-block">
                {t('clearSearch')}
              </Link>
            </div>
          ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {paged.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {pageCount > 1 && (
              <nav
                aria-label={t('pageOf', { n: safePage, total: pageCount })}
                className="mt-8 flex flex-wrap items-center justify-center gap-1"
              >
                <button
                  type="button"
                  onClick={() => setPage(safePage - 1)}
                  disabled={safePage === 1}
                  aria-label={t('previousPage')}
                  className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:border-[#015837] hover:text-[#015837] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Prev</span>
                </button>

                {pageItems.map((n) =>
                  typeof n === 'string' ? (
                    <span
                      key={n}
                      aria-hidden="true"
                      className="min-w-[2rem] px-1 text-center text-sm text-gray-400 select-none"
                    >
                      &hellip;
                    </span>
                  ) : (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPage(n)}
                      aria-current={n === safePage ? 'page' : undefined}
                      className={`min-w-[2.25rem] h-9 px-2 rounded-md text-sm font-semibold transition ${
                        n === safePage
                          ? 'bg-[#015837] text-white'
                          : 'border border-gray-200 text-gray-700 hover:border-[#015837] hover:text-[#015837]'
                      }`}
                    >
                      {n}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() => setPage(safePage + 1)}
                  disabled={safePage === pageCount}
                  aria-label={t('nextPage')}
                  className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:border-[#015837] hover:text-[#015837] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </>
          )}
        </div>
      </div>
    </div>
  );
}
