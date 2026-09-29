import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';
import PageHero from '../components/PageHero';
import { useLang } from '../context/LangContext';

const PAGE_SIZE = 60;
// Mirrors Shop.jsx: at most this many numbered buttons render at once, as a
// sliding window around the current page. A vendor with a large catalogue
// would otherwise emit a page number per 40 products.
const MAX_PAGE_BUTTONS = 10;

export default function VendorShop() {
  const { t } = useLang();
  const { slug } = useParams();
  const [vendor, setVendor] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const [minP, setMinP] = useState('');
  const [maxP, setMaxP] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [minR, setMinR] = useState('0');
  const [page, setPage] = useState(1);
  const [dealOnly, setDealOnly] = useState(false);

  useEffect(() => {
    setError('');
    setPage(1);
    setSelectedBrands([]);
    setMinR('0');
    setMinP('');
    setMaxP('');
    setDealOnly(false);
    api
      .get(`/stores/${slug}`)
      .then((d) => {
        setVendor(d.vendor);
        setProducts(d.products || []);
      })
      .catch((e) => setError(e.message));
  }, [slug]);

  const toggleBrand = (brand) => {
    setPage(1);
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const filtered = useMemo(() => {
    let list = [...products];
    const min = parseFloat(minP) || 0;
    const max = parseFloat(maxP) || Infinity;
    list = list.filter((p) => p.price >= min && p.price <= max);
    if (dealOnly) list = list.filter((p) => p.compareAt && p.compareAt > p.price);
    if (selectedBrands.length > 0) {
      list = list.filter((p) => p.brand && selectedBrands.includes(p.brand));
    }
    const rThreshold = Number(minR) || 0;
    if (rThreshold > 0) {
      list = list.filter((p) => Number(p.rating || 0) >= rThreshold);
    }
    return list;
  }, [products, minP, maxP, dealOnly, selectedBrands, minR]);

  const priceBounds = useMemo(() => {
    if (!products.length) return { lo: 0, hi: 100000 };
    const prices = products.map((p) => p.price);
    return { lo: Math.min(...prices), hi: Math.max(...prices) };
  }, [products]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const brands = [...new Set(products.map((p) => p.brand).filter(Boolean))];

  const goToPage = (n) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * At most MAX_PAGE_BUTTONS page numbers, as a window that follows the current
   * page and never runs off either end. First and last stay reachable, with an
   * ellipsis for the skipped run, so no page is more than one click away.
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

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-gray-500">{error}</p>
        <Link to="/vendors" className="mt-4 inline-block text-[#015837] font-semibold">
          Back to vendors
        </Link>
      </div>
    );
  }

  if (!vendor) {
    return <div className="mx-auto max-w-7xl px-4 py-20 animate-pulse h-40 bg-gray-100 rounded-xl m-6" />;
  }

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Vendors', to: '/vendors' }, { label: vendor.storeName || vendor.name }]}
        title={vendor.storeName || vendor.name}
        subtitle={`${vendor.openNow ? 'Open now' : 'Closed'} · ${filtered.length} products from this seller.`}
      />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <nav className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <Link to="/" className="hover:text-orange-500">Home</Link>
          <ChevronRight size={14} />
          <Link to="/vendors" className="hover:text-orange-500">Vendors</Link>
          <ChevronRight size={14} />
          <span className="text-gray-800 font-medium">{vendor.storeName || vendor.name}</span>
        </nav>
        <div className="flex gap-8">
          <aside className="bd-shop-filters">
            <FilterSidebar
              brands={brands}
              selectedBrands={selectedBrands}
              onBrandToggle={toggleBrand}
              minP={minP}
              maxP={maxP}
              onMinP={setMinP}
              onMaxP={setMaxP}
              priceLo={priceBounds.lo}
              priceHi={priceBounds.hi}
              minR={minR}
              onMinR={(r) => {
                setPage(1);
                setMinR(r);
              }}
              dealOnly={dealOnly}
              onDealOnly={(checked) => {
                setPage(1);
                setDealOnly(checked);
              }}
              onClear={() => {
                setMinP('');
                setMaxP('');
                setSelectedBrands([]);
                setMinR('0');
                setDealOnly(false);
                setPage(1);
              }}
              activeFilterCount={
                (minP || maxP ? 1 : 0) +
                (dealOnly ? 1 : 0) +
                selectedBrands.length +
                (minR !== '0' ? 1 : 0)
              }
            />
          </aside>
          <div className="flex-1 min-w-0">
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
                  onClick={() => goToPage(safePage - 1)}
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
                      onClick={() => goToPage(n)}
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
                  onClick={() => goToPage(safePage + 1)}
                  disabled={safePage === pageCount}
                  aria-label={t('nextPage')}
                  className="flex h-9 items-center gap-1 rounded-md border border-gray-200 px-3 text-sm font-semibold text-gray-700 transition hover:border-[#015837] hover:text-[#015837] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-gray-200 disabled:hover:text-gray-700"
                >
                  <span className="hidden sm:inline">Next</span>
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </nav>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
