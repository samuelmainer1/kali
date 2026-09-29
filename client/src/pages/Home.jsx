import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, Mail, ShieldCheck, Smartphone, Star, Truck, Zap, Headphones } from 'lucide-react';
import { api, formatKES } from '../lib/api';
import ProductCard from '../components/ProductCard';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import { preventBrokenProductImage, resolveProductImage } from '../lib/productImage';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import GetTheAppButton from '../components/GetTheAppButton';
import { useLang } from '../context/LangContext';
import CmsLink from '../components/CmsLink';

const SLIDES = [
  {
    title: 'Mega Deals Week',
    subtitle: 'Up to 70% off on electronics, fashion & more',
    cta: 'Shop Now',
        href: '/deals',
    gradient: 'linear-gradient(to right, #f9a, #fa8)',
    image: '/uploads/products/photo-1607082348824-0a96f2a4b9da_w1600.jpg',
  },
  {
    title: 'Nationwide delivery by Globeflight',
    subtitle: 'Usually the same business day within Nairobi; 2–5 days elsewhere',
    cta: 'Start Shopping',
    href: '/shop',
    gradient: 'linear-gradient(to right, #0ea5e9, #60a5fa)',
    image: '/uploads/products/photo-1601584115197-04ecc0da31d7_w1600.jpg',
  },
  {
    title: 'New Arrivals in Tech',
    subtitle: 'Latest smartphones, laptops & gadgets',
    cta: 'Explore Tech',
    href: '/category/phone-tablet',
    gradient: 'linear-gradient(to right, #059669, #34d399)',
    image: '/uploads/products/photo-1511707171634-5f897ff02aa9_w1200.jpg',
  },
  {
    title: 'Back to School Sale',
    subtitle: 'Everything your child needs at great prices',
    cta: 'View Deals',
    href: '/deals',
    gradient: 'linear-gradient(to right, #7c3aed, #a78bfa)',
    image: '/uploads/products/photo-1503676260728-1c00da094a0b_w1600.jpg',
  },
];

const TILE_GRADIENTS = [
  'from-orange-400 to-orange-600',
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-pink-400 to-pink-600',
  'from-teal-400 to-teal-600',
  'from-amber-400 to-amber-600',
  'from-rose-400 to-rose-600',
  'from-cyan-400 to-cyan-600',
  'from-indigo-400 to-indigo-600',
  'from-lime-400 to-lime-600',
  'from-red-400 to-red-600',
];

function displayHero(item, t) {
  const rawTitle = item.title || '';
  const looksLikeFreeMin = /10[\s,]*000/.test(rawTitle) && /free/i.test(rawTitle);
  return {
    ...item,
    title: looksLikeFreeMin ? t('heroFree') : rawTitle,
    subtitle: looksLikeFreeMin ? t('heroFreeText') : item.subtitle || item.text || '',
    cta: item.cta || t('shopNow'),
  };
}

function catLabel(slug, name, t) {
  const key = `cat.${slug}`;
  const translated = t(key);
  return translated === key ? name : translated;
}

function CategoryTile({ category, index, tall, t }) {
  const [imgOk, setImgOk] = useState(Boolean(category.image));
  const gradient = TILE_GRADIENTS[index % TILE_GRADIENTS.length];
  return (
    <Link
      to={`/category/${category.slug}`}
      className={`group relative rounded-xl overflow-hidden ${tall ? 'h-40 md:h-48' : 'rounded-lg h-28 md:h-32'}`}
    >
      {imgOk && category.image ? (
        <>
          <img
            src={category.image}
            alt={category.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            onError={() => setImgOk(false)}
          />
          <div className={`absolute inset-0 ${tall ? 'bg-black/45 group-hover:bg-black/55' : 'bg-black/40 group-hover:bg-black/50'} transition-colors`} />
        </>
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
      )}
      <div className={`absolute inset-0 flex ${tall ? 'flex-col justify-end p-4' : 'items-end p-3'}`}>
        <span className={`text-white drop-shadow-md ${tall ? 'font-bold text-lg' : 'font-semibold text-sm md:text-base'}`}>
          {catLabel(category.slug, category.name, t)}
        </span>
        {tall && <span className="text-white/80 text-xs mt-1">{t('shopNow')}</span>}
      </div>
    </Link>
  );
}
// De-duplicates on BOTH id and a normalised product name. The catalogue
// legitimately contains rows that share a name (e.g. re-imported WooCommerce
// items), and showing the same title twice in one shelf looks broken to a
// shopper, so a shelf only counts a product once per distinct name.
function nameKey(p) {
  return String(p?.name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function padToAtLeast(primary = [], pool = [], count = 10) {
  const result = [];
  const seenIds = new Set();
  const seenNames = new Set();
  const accept = (p) => {
    if (!p || seenIds.has(p.id)) return false;
    const key = nameKey(p);
    if (key && seenNames.has(key)) return false;
    seenIds.add(p.id);
    if (key) seenNames.add(key);
    return true;
  };
  for (const p of primary) {
    if (!accept(p)) continue;
    result.push(p);
    if (result.length >= count) return result;
  }
  for (const p of pool) {
    if (!accept(p)) continue;
    result.push(p);
    if (result.length >= count) return result;
  }
  return result;
}

function GridSection({ title, to, products, cols = 5 }) {
  const { t } = useLang();
  if (!products.length) return null;
  const colClass =
    cols === 5
      ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4'
      : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4';
  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
        {to && (
          <Link to={to} className="text-sm font-semibold text-orange-600 hover:text-orange-700">
            {t('seeAll')}
          </Link>
        )}
      </div>
      <div className={colClass}>
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroes, setHeroes] = useState(SLIDES);
  const [promoBanners, setPromoBanners] = useState([]);
  const [homeBlocks, setHomeBlocks] = useState({});
  const [featuredSlugs, setFeaturedSlugs] = useState([
    'household',
    'beauty-health',
    'phone-tablet',
    'home-office',
    'baby-kids',
  ]);
  const [flashEndsAt, setFlashEndsAt] = useState(null);
  const [slide, setSlide] = useState(0);
  const [seconds, setSeconds] = useState(8 * 3600);
  const [email, setEmail] = useState('');
  const [newsletterMsg, setNewsletterMsg] = useState('');
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const flashRef = useRef(null);
  const { addItem } = useCart();
  const { openMiniCart } = useUI();
  const { items: recent } = useRecentlyViewed();
  const { t } = useLang();

  useEffect(() => {
    api.get('/products').then((d) => setProducts(d.products || [])).catch(() => {});
    api.get('/categories').then((d) => setCategories(d.categories || [])).catch(() => {});
    api
      .get('/site')
      .then((d) => {
        const list = d.site?.heroes || [];
        if (list.length) {
          setHeroes(
            list.map((h) => ({
              id: h.id,
              title: h.title,
              subtitle: h.text || h.subtitle,
              cta: h.cta,
              href: h.href || '/shop',
              gradient: h.gradient,
              image: h.image,
            }))
          );
        }
        if (d.site?.homeBlocks) setHomeBlocks(d.site.homeBlocks);
        if (d.site?.featuredCategorySlugs?.length) setFeaturedSlugs(d.site.featuredCategorySlugs);
        if (Array.isArray(d.site?.promoBanners)) setPromoBanners(d.site.promoBanners.filter((b) => b.title || b.image));
        if (d.site?.flashEndsAt) {
          setFlashEndsAt(d.site.flashEndsAt);
          const left = Math.max(0, Math.floor((Date.parse(d.site.flashEndsAt) - Date.now()) / 1000));
          setSeconds(left || 8 * 3600);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!heroes.length) return undefined;
    setSlide((s) => s % heroes.length);
    const t = setInterval(() => setSlide((n) => (n + 1) % heroes.length), 5000);
    return () => clearInterval(t);
  }, [heroes.length]);

  useEffect(() => {
    const t = setInterval(() => {
      if (flashEndsAt) {
        const left = Math.max(0, Math.floor((Date.parse(flashEndsAt) - Date.now()) / 1000));
        setSeconds(left);
        return;
      }
      setSeconds((s) => (s <= 0 ? 8 * 3600 : s - 1));
    }, 1000);
    return () => clearInterval(t);
  }, [flashEndsAt]);

  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');

  const flash = products.filter((p) => p.compareAt && p.compareAt > p.price).slice(0, 20);
  const bestPool = [...products].sort(
    (a, b) => (b.soldCount || b.reviews || 0) - (a.soldCount || a.reviews || 0)
  );
  const ratingPool = [...products].sort(
    (a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0)
  );
  const featured = products.filter((p) => p.featured);
  const featuredFallback = padToAtLeast(featured, bestPool, 10);
  const bestSellers = padToAtLeast(bestPool.slice(0, 10), bestPool, 10);
  const topSelling = padToAtLeast(
    [...products].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(10, 20),
    bestPool,
    10
  );
  const choicePrimary = [...products]
    .filter((p) => (p.rating || 0) >= 4.5)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0));
  const choice = padToAtLeast(choicePrimary, ratingPool, 10);
  const bySlug = (slug) => {
    const cat = categories.find((c) => c.slug === slug);
    const inCategory = products.filter(
      (p) => p.categorySlug === slug || (cat && p.categoryId === cat.id)
    );
    const sortedInCategory = [...inCategory].sort(
      (a, b) => (b.soldCount || b.reviews || 0) - (a.soldCount || a.reviews || 0)
    );
    return padToAtLeast(sortedInCategory, bestPool, 10);
  };
  const featuredFour = featuredSlugs
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean);
  const show = (key) => homeBlocks[key] !== false;

  async function onNewsletter(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setNewsletterLoading(true);
    setNewsletterMsg('');
    try {
      await api.post('/newsletter', { email: email.trim() });
      setNewsletterMsg(t('subscribed'));
      setEmail('');
    } catch {
      setNewsletterMsg(t('newsletterThanks'));
      setEmail('');
    } finally {
      setNewsletterLoading(false);
    }
  }

  function scrollFlash(dir) {
    if (!flashRef.current) return;
    flashRef.current.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  }

  return (
    <div>
      <section className="hero-carousel bd-drive-hero">
        <div className="carousel-track" style={{ transform: `translateX(-${slide * 100}%)` }}>
          {heroes.map((item) => {
            const slideItem = displayHero(item, t);
            return (
            <div
              key={item.id || item.title}
              className={`carousel-slide${item.image ? ' has-image' : ''}`}
              style={
                item.image
                  ? { backgroundImage: `url('${item.image}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                  : { background: item.gradient || 'linear-gradient(to right, #f97316, #fbbf24)' }
              }
            >
              <div>
                <h2>{slideItem.title}</h2>
                <p>{slideItem.subtitle || slideItem.text}</p>
                <Link
                  to={item.href || '/shop'}
                  className="inline-flex items-center gap-2 bg-white text-gray-800 hover:bg-gray-100 font-semibold shadow-lg rounded-md px-5 py-2.5"
                >
                  {slideItem.cta}
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
            );
          })}
        </div>
        <button
          type="button"
          className="carousel-btn prev"
          onClick={() => setSlide((n) => (n - 1 + heroes.length) % heroes.length)}
          aria-label="Previous slide"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          className="carousel-btn next"
          onClick={() => setSlide((n) => (n + 1) % heroes.length)}
          aria-label="Next slide"
        >
          <ChevronRight size={20} />
        </button>
        <div className="carousel-dots">
          {heroes.map((item, i) => (
            <button
              key={item.id || i}
              type="button"
              className={i === slide ? 'active' : ''}
              onClick={() => setSlide(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4">
        {show('promoBanners') && promoBanners.length > 0 && (
          <section className="py-6 grid gap-4 sm:grid-cols-2">
            {promoBanners.map((b) => (
              <CmsLink
                key={b.id || b.title}
                href={b.href || '/shop'}
                className="relative rounded-xl overflow-hidden min-h-[160px] block group"
              >
                {b.image ? (
                  <img src={b.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#015837] to-[#01472c]" />
                )}
                <div className="relative min-h-[160px] flex flex-col justify-end p-5 bg-gradient-to-t from-black/60 to-black/10 text-white">
                  {b.title ? <h3 className="font-bold text-xl">{b.title}</h3> : null}
                  {b.text ? <p className="text-sm text-white/90 mt-1">{b.text}</p> : null}
                  {b.cta ? <span className="mt-2 text-sm font-semibold">{b.cta}</span> : null}
                </div>
              </CmsLink>
            ))}
          </section>
        )}
        {show('featuredFour') && !show('shopByCategory') && featuredFour.length > 0 && (
          <section className="py-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{t('newCategories')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {featuredFour.map((c, i) => (
                <CategoryTile key={c.id} category={c} index={i} tall t={t} />
              ))}
            </div>
          </section>
        )}

        {show('shopByCategory') && categories.length > 0 && (
          <section className="py-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{t('shopByCategory')}</h2>
            {featuredFour.length > 0 ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {featuredFour.map((c, i) => (
                    <CategoryTile key={c.id} category={c} index={i} tall t={t} />
                  ))}
                </div>
                {categories.filter((c) => !featuredSlugs.includes(c.slug)).length > 0 && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {categories
                      .filter((c) => !featuredSlugs.includes(c.slug))
                      .map((c, i) => (
                        <CategoryTile key={c.id} category={c} index={i + featuredFour.length} t={t} />
                      ))}
                  </div>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {categories.map((c, i) => (
                  <CategoryTile key={c.id} category={c} index={i} t={t} />
                ))}
              </div>
            )}
          </section>
        )}

        {show('flashDeals') && flash.length > 0 && (
          <section className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <Zap size={24} className="text-orange-500 fill-orange-500" />
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900">{t('flashDeals')}</h2>
                </div>
                <div className="flex items-center gap-1">
                  <span className="bg-gray-900 text-white px-2 py-1 rounded text-sm font-bold">{h}</span>
                  <span className="text-gray-900 font-bold">:</span>
                  <span className="bg-gray-900 text-white px-2 py-1 rounded text-sm font-bold">{m}</span>
                  <span className="text-gray-900 font-bold">:</span>
                  <span className="bg-gray-900 text-white px-2 py-1 rounded text-sm font-bold">{s}</span>
                </div>
              </div>
              <Link
                to="/deals"
                className="border border-orange-500 text-orange-500 hover:bg-orange-50 text-sm font-semibold rounded-md px-3 py-1.5"
              >
                {t('seeAll')}
              </Link>
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => scrollFlash('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-1.5 hover:bg-gray-50 hidden md:block"
                aria-label="Scroll left"
              >
                <ChevronLeft size={20} />
              </button>
              <div ref={flashRef} className="bd-flash-strip scrollbar-hide">
                {flash.map((p) => {
                  const discount = Math.round(((p.compareAt - p.price) / p.compareAt) * 100);
                  const sold = p.soldCount || p.reviews || 12;
                  const stock = p.stock || 20;
                  const soldPct = Math.min(99, Math.round((sold / (sold + stock)) * 100));
                  return (
                    <div key={p.id} className="bd-flash-card">
                      <Link to={`/product/${p.slug}`}>
                        <div className="bd-flash-card-img">
                          <img
                            src={resolveProductImage(p)}
                            alt={p.name}
                            loading="lazy"
                            onError={(e) => preventBrokenProductImage(e)}
                          />
                          {discount > 0 && (
                            <span className="absolute top-1 left-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                              -{discount}%
                            </span>
                          )}
                        </div>
                        <div className="p-2 pb-0">
                          <h3 className="text-xs text-gray-700 line-clamp-2 min-h-[2rem]">{p.name}</h3>
                          <p className="text-sm font-bold text-red-600 mt-1">{formatKES(p.price)}</p>
                          <p className="text-[10px] text-gray-400 line-through">{formatKES(p.compareAt)}</p>
                          <div className="mt-2">
                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                              <span>{soldPct}% sold</span>
                            </div>
                            <div className="bd-sold-bar">
                              <span style={{ width: `${soldPct}%` }} />
                            </div>
                          </div>
                        </div>
                      </Link>
                      <div className="px-2 pb-2">
                        <button
                          type="button"
                          className="w-full mt-2 bg-orange-500 hover:bg-orange-600 text-white h-7 text-xs rounded font-semibold"
                          onClick={() => {
                            addItem(p);
                            openMiniCart();
                          }}
                        >
                          {t('addToCart')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => scrollFlash('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-1.5 hover:bg-gray-50 hidden md:block"
                aria-label="Scroll right"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </section>
        )}

        {show('featured') && <GridSection title={t('featured')} to="/shop" products={featuredFallback} />}

        {show('appBanner') && (
        <section className="py-4">
          <div className="bd-app-banner rounded-xl p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Smartphone size={32} />
                <h3 className="text-2xl md:text-3xl font-bold">{t('downloadApp')}</h3>
              </div>
              <p className="text-white/90 text-sm md:text-base">
                {t('downloadAppText')}
              </p>
            </div>
            <GetTheAppButton />
          </div>
        </section>
        )}

        <section className="py-6">
          <div className="bd-trust-strip">
            <div className="bd-trust-item">
              <div className="bd-trust-badge"><Truck size={18} /></div>
              <div>
                <strong>Nationwide delivery</strong>
                <span>Fast fulfillment across Kenya</span>
              </div>
            </div>
            <div className="bd-trust-item">
              <div className="bd-trust-badge"><ShieldCheck size={18} /></div>
              <div>
                <strong>Secure shopping</strong>
                <span>Trusted checkout and protected orders</span>
              </div>
            </div>
            <div className="bd-trust-item">
              <div className="bd-trust-badge"><Star size={18} /></div>
              <div>
                <strong>Verified quality</strong>
                <span>Curated brands and genuine products</span>
              </div>
            </div>
            <div className="bd-trust-item">
              <div className="bd-trust-badge"><Headphones size={18} /></div>
              <div>
                <strong>Support you can rely on</strong>
                <span>Responsive customer care</span>
              </div>
            </div>
          </div>
        </section>

        {show('bestSellers') && <GridSection title={t('bestSellers')} to="/shop" products={bestSellers} />}
        {show('topSelling') && <GridSection title={t('topSelling')} to="/shop" products={topSelling} />}

        <section className="py-6">
          <div className="bd-premium-banner">
            <div>
              <p className="bd-premium-tag">Why shoppers choose BigDrop</p>
              <h3>Everything you need for smarter, faster online shopping.</h3>
            </div>
            <div className="bd-premium-actions">
              <Link to="/shop" className="bd-btn-primary">Shop now</Link>
              <Link to="/about" className="bd-btn-secondary">Learn more</Link>
            </div>
          </div>
        </section>

        {show('choice') && <GridSection title={t('choice')} to="/shop" products={choice} />}
        {show('food') && <GridSection title={t('food')} to="/category/food-drinks" products={bySlug('food-drinks')} />}
        {show('healthBeauty') && <GridSection title={t('healthBeauty')} to="/category/beauty-health" products={bySlug('beauty-health')} />}
        {show('tvsElectronics') && <GridSection title={t('tvsElectronics')} to="/category/tvs-electronics" products={bySlug('tvs-electronics')} />}
        {show('household') && <GridSection title={t('household')} to="/category/household" products={bySlug('household')} />}
        {show('phoneTablets') && <GridSection title={t('phoneTablets')} to="/category/phone-tablet" products={bySlug('phone-tablet')} />}

        {show('testimonials') && <TestimonialsCarousel />}

        {/* Pre-footer block — promo banners + newsletter, sitting right above
            "Recently Viewed". Gated by the admin's newsletter toggle (Home blocks),
            since both rows share this slot. The banner cards are decorative; ONLY
            their "Shop Now" buttons are links (to /deals and /brands). */}
        {show('newsletter') && (
        <section className="py-6" aria-label="Featured promotions and newsletter">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Summer Sale — mint card with palm-frond artwork; the button links to deals */}
            <div className="relative flex items-center overflow-hidden rounded-2xl bg-[#d4f0de] p-6 md:p-7 min-h-[150px]">
              <div className="relative z-10">
                <h3 className="text-xl md:text-2xl font-extrabold text-emerald-950">{t('promoSummer')}</h3>
                <p className="mt-0.5 text-lg md:text-xl font-extrabold text-[#22a55e]">{t('promoSummerOff')}</p>
                <Link
                  to="/deals"
                  className="mt-4 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
                >
                  {t('shopNow')}
                </Link>
              </div>
              {/* Palm fronds sweeping in from the right edge, like the reference layout */}
              <svg
                className="pointer-events-none absolute -right-4 top-0 h-full w-40 md:w-52"
                viewBox="0 0 200 150"
                fill="none"
                aria-hidden="true"
              >
                <path d="M204 62C170 34 122 26 84 36c36 14 84 26 122 32v-6Z" fill="#2fbf6f" opacity="0.55" />
                <path d="M204 78C156 56 104 54 62 66c40 16 96 24 142 18v-6Z" fill="#23a45c" opacity="0.65" />
                <path d="M208 76C158 68 112 70 76 80c34 10 84 12 132 6v-10Z" fill="#0f7a44" opacity="0.5" />
                <path d="M206 92c-40 8-72 24-92 46 34-8 66-24 92-38V92Z" fill="#178a4c" opacity="0.6" />
                <path d="M210 40c-22-4-44-2-62 6 20 2 42 4 62 2v-8Z" fill="#0f7a44" opacity="0.45" />
                <path d="M208 78c-52-4-96-2-128 6 40 10 88 12 128 4" stroke="#0b5c33" strokeWidth="1.5" opacity="0.35" />
              </svg>
            </div>

            {/* Top Brands — peach card with shopping-bag artwork; the button links to brands */}
            <div className="relative flex items-center overflow-hidden rounded-2xl bg-[#fdeada] p-6 md:p-7 min-h-[150px]">
              <div className="relative z-10">
                <h3 className="text-xl md:text-2xl font-extrabold text-gray-900">{t('promoTopBrands')}</h3>
                <p className="mt-0.5 text-lg md:text-xl font-extrabold text-gray-900">{t('promoTopBrandsSub')}</p>
                <Link
                  to="/brands"
                  className="mt-4 inline-block rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-900 shadow-md transition-all hover:bg-gray-50 hover:shadow-lg"
                >
                  {t('shopNow')}
                </Link>
              </div>
              {/* Two shopping bags (tan behind, blue in front) resting bottom-right */}
              <svg
                className="pointer-events-none absolute right-1 bottom-0 h-28 w-32 md:h-36 md:w-40"
                viewBox="0 0 150 132"
                aria-hidden="true"
              >
                <ellipse cx="76" cy="128" rx="72" ry="4" fill="#000" opacity="0.08" />
                <path
                  d="M31 46c0-17 7-28 17-28s17 11 17 28"
                  stroke="#8a5a28"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
                <rect x="16" y="44" width="64" height="82" rx="6" fill="#e8a94e" />
                <rect x="16" y="52" width="64" height="8" fill="#c9822f" opacity="0.45" />
                <path
                  d="M84 64c0-13 6-22 16-22s16 9 16 22"
                  stroke="#16408a"
                  strokeWidth="5"
                  strokeLinecap="round"
                  fill="none"
                />
                <rect x="70" y="62" width="60" height="64" rx="6" fill="#2f6fdd" />
                <rect x="70" y="70" width="60" height="8" fill="#1c4fa9" opacity="0.55" />
              </svg>
            </div>
          </div>

          {/* Stay Updated — newsletter bar, reusing the homepage subscribe handler */}
          <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-[#dcebfc] px-5 py-5 md:flex-row md:items-center md:gap-6 md:px-8">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#8cb8f0]">
              <Mail size={24} strokeWidth={1.8} className="text-white" fill="currentColor" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-lg font-extrabold text-gray-900">{t('stayUpdated')}</h3>
              <p className="text-sm text-gray-500">{t('stayUpdatedText')}</p>
            </div>
            <div className="w-full md:w-auto">
              <form onSubmit={onNewsletter} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  required
                  placeholder={t('enterEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 flex-1 rounded-lg border border-blue-100 bg-white px-4 text-sm outline-none focus:border-blue-400 sm:w-64 sm:flex-none"
                  aria-label="Newsletter email"
                />
                <button
                  type="submit"
                  disabled={newsletterLoading}
                  className="h-11 shrink-0 rounded-lg bg-blue-600 px-7 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {t('subscribe')}
                </button>
              </form>
              {newsletterMsg && <p className="mt-2 text-sm text-blue-700">{newsletterMsg}</p>}
            </div>
          </div>
        </section>
        )}

        {show('recentlyViewed') && recent.length > 0 && (
          <section className="py-6 pb-10">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">{t('recentlyViewed')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {recent.slice(0, 5).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
