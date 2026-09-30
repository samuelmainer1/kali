import { useCallback, useEffect, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import {
  ChevronRight,
  GitCompareArrows,
  Heart,
  Share2,
  ShieldCheck,
  ShoppingCart,
  Truck,
} from 'lucide-react';
import { api, formatKES } from '../lib/api';
import { parseSpecs } from '../lib/specs';
import { waLink } from '../lib/whatsapp';
import { fileToReviewDataUrl } from '../lib/imageUpload';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { useCompare } from '../context/CompareContext';
import { useRecentlyViewed } from '../context/RecentlyViewedContext';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../context/LangContext';
import ProductCard from '../components/ProductCard';
import RecentlyViewed from '../components/RecentlyViewed';
import StarRating from '../components/StarRating';
import { preventBrokenProductImage, resolveProductImage } from '../lib/productImage';
import {
  applyPageMeta,
  applyShopMeta,
  absoluteUrl,
  brandTitle,
  productJsonLdBlocks,
  SITE_DESCRIPTION,
} from '../lib/pageMeta';

/**
 * Product copy arrives from WooCommerce as one long run of text. Split it back into
 * paragraphs, headings and bullet lists so the description tab is readable instead of
 * a wall of prose with stray "-" and "\n" showing through.
 */
function DescriptionBody({ text }) {
  const blocks = [];
  let list = null;
  const flush = () => {
    if (list && list.length) blocks.push({ type: 'list', items: list });
    list = null;
  };
  String(text || '')
    .split(/\r?\n/)
    .forEach((rawLine) => {
      const line = rawLine.replace(/\s+/g, ' ').trim();
      if (!line) { flush(); return; }
      const bullet = line.match(/^[•·▪▫◦‣*\-–—]\s+(.*)$/);
      if (bullet) {
        if (!list) list = [];
        list.push(bullet[1]);
        return;
      }
      flush();
      // A short line ending in ":" is a section label the merchant wrote ("Key Benefits:").
      if (line.length <= 60 && /:$/.test(line)) blocks.push({ type: 'heading', text: line.replace(/:$/, '') });
      else blocks.push({ type: 'para', text: line });
    });
  flush();
  if (!blocks.length) return <p className="text-gray-500">No description provided yet.</p>;
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        if (b.type === 'list') {
          return (
            <ul key={`l${i}`} className="list-disc pl-5 space-y-1.5">
              {b.items.map((it, j) => (
                <li key={`l${i}-${j}`}>{it}</li>
              ))}
            </ul>
          );
        }
        if (b.type === 'heading') {
          return (
            <p key={`h${i}`} className="font-semibold text-gray-900">
              {b.text}
            </p>
          );
        }
        return <p key={`p${i}`}>{b.text}</p>;
      })}
    </div>
  );
}

function ZoomableImage({ src, alt }) {
  const [zoomed, setZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });

  const onMove = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
    setZoomed(true);
  }, []);

  return (
    <div
      className={`relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-zoom-in ${zoomed ? 'cursor-zoom-out' : ''}`}
      onMouseMove={onMove}
      onMouseLeave={() => setZoomed(false)}
    >
      <div
        className="absolute inset-0 transition-transform duration-100 ease-out"
        style={zoomed ? { transform: 'scale(2)', transformOrigin: `${position.x}% ${position.y}%` } : undefined}
      >
        <img
          src={src || '/placeholder-product.svg'}
          alt={alt}
          className="h-full w-full object-cover"
          onError={(e) => preventBrokenProductImage(e)}
        />
      </div>
      {!zoomed && (
        <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded hidden md:block">
          Hover to zoom
        </div>
      )}
    </div>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [alsoBought, setAlsoBought] = useState([]);
  const [substitutes, setSubstitutes] = useState([]);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');
  const [reviewFilter, setReviewFilter] = useState(0);
  const [selectedImage, setSelectedImage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [tab, setTab] = useState('description');
  const [variantPick, setVariantPick] = useState({});
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '', image: '' });
  const [reviewMsg, setReviewMsg] = useState('');
  const [addHint, setAddHint] = useState('');
  const { addItem } = useCart();
  const { openMiniCart, openAuth } = useUI();
  const { toggleItem, isInCompare, items: compareItems } = useCompare();
  const { trackView } = useRecentlyViewed();
  const { user } = useAuth();
  const { t } = useLang();
  const { site } = useOutletContext() || {};

  useEffect(() => {
    setError('');
    setQty(1);
    setSelectedImage(0);
    window.scrollTo(0, 0);
    api
      .get(`/products/${slug}`)
      .then((d) => {
        setProduct(d.product);
        setRelated(d.related || []);
        setAlsoBought(d.alsoBought || []);
        setSubstitutes(d.substitutes || []);
        setVariantPick({});
        trackView(d.product);
      })
      .catch((e) => setError(e.message));
  }, [slug, trackView]);

  useEffect(() => {
    if (!product?.slug) return undefined;
    const origin = window.location.origin;
    const image = Array.isArray(product.images) ? product.images[0] : product.image;
    applyPageMeta({
      title: brandTitle(product.name),
      description: product.metaDescription || product.excerpt || product.description || SITE_DESCRIPTION,
      image: absoluteUrl(image, origin),
      canonical: `${origin}/product/${product.slug}`,
      type: 'product',
      jsonLd: productJsonLdBlocks(product, origin),
    });
    return () => applyShopMeta();
  }, [product]);

  const images = product?.images?.length ? product.images : product ? [resolveProductImage(product)] : [];
  const compareAt = product?.compareAt || product?.comparePrice;
  const hasDiscount = product && compareAt && compareAt > product.price;
  const discountPct = hasDiscount ? Math.round(((compareAt - product.price) / compareAt) * 100) : 0;
  const inCompare = product ? isInCompare(product.id) : false;
  const currentStock = product?.stock || 0;
  const stockLabel =
    currentStock <= 0 ? 'Out of Stock' : currentStock <= 10 ? `Low Stock (${currentStock} left)` : 'In Stock';
  const stockColor =
    currentStock <= 0 ? 'text-red-600' : currentStock <= 10 ? 'text-amber-600' : 'text-green-600';

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-gray-500">{error}</p>
        <Link to="/shop" className="mt-4 inline-block text-orange-600 font-semibold">
          Back to shop
        </Link>
      </div>
    );
  }

  if (!product) {
    return <div className="mx-auto max-w-7xl px-4 py-20 animate-pulse h-96 bg-gray-100 rounded-2xl m-6" />;
  }

  function handleAdd() {
    if (currentStock <= 0) return;
    const variants = product.variants || [];
    const missing = variants.find((v) => !variantPick[v.name]);
    if (missing) {
      setAddHint(`Choose ${missing.name}`);
      return;
    }
    const variant = variants.map((v) => `${v.name} ${variantPick[v.name]}`).join(', ');
    addItem(product, qty, variant);
    setAdded(true);
    setAddHint('');
    openMiniCart();
    setTimeout(() => setAdded(false), 1800);
  }

  async function submitReview(e) {
    e.preventDefault();
    setReviewMsg('');
    if (!user) {
      openAuth();
      return;
    }
    try {
      await api.post(`/products/${product.id}/reviews`, reviewForm);
      setReviewMsg('Thank you. Your review will show after Admin approval.');
      setReviewForm({ rating: 5, title: '', comment: '', image: '' });
      const d = await api.get(`/products/${product.slug}`);
      setProduct(d.product);
    } catch (err) {
      setReviewMsg(err.message);
    }
  }

  async function handleWishlist() {
    if (!user) {
      openAuth();
      return;
    }
    try {
      if (wishlisted) {
        await api.delete(`/wishlist/${product.id}`);
        setWishlisted(false);
      } else {
        await api.post(`/wishlist/${product.id}`);
        setWishlisted(true);
      }
    } catch {
      /* ignore */
    }
  }

  function handleCompare() {
    toggleItem(product);
  }

  function share(url) {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const reviews = (product.reviewList || []).filter((r) => !reviewFilter || r.rating >= reviewFilter);
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => {
    const list = product.reviewList || [];
    const count = list.filter((r) => r.rating === star).length;
    const pct = list.length ? Math.round((count / list.length) * 100) : 0;
    return { star, count, pct };
  });
  const questions = product.questions || [];
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const encodedText = encodeURIComponent(`Check out ${product.name} on BigDrop Kenya`);
  const encodedUrl = encodeURIComponent(shareUrl);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <nav className="flex items-center gap-1 text-sm text-gray-500 mb-6 flex-wrap">
        <Link to="/" className="hover:text-orange-500">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/shop" className="hover:text-orange-500">
          Shop
        </Link>
        {product.categorySlug && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link to={`/category/${product.categorySlug}`} className="hover:text-orange-500">
              {product.categoryName}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-gray-800 font-medium line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-3">
          <div className="relative">
            <ZoomableImage src={images[selectedImage]} alt={product.name} />
            {discountPct > 0 && (
              <span className="absolute top-3 left-3 bg-green-600 text-white text-sm font-bold px-2 py-1 rounded z-10">
                -{discountPct}% OFF
              </span>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {images.map((img, i) => (
                <button
                  key={`${img}-${i}`}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  className={`relative w-16 h-16 rounded-md overflow-hidden shrink-0 border-2 ${
                    i === selectedImage ? 'border-orange-500' : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
          <div className="flex items-center gap-3 mb-2">
            <StarRating rating={product.rating || 0} />
            <a href="#product-tabs" onClick={() => setTab('reviews')} className="text-sm text-gray-500 hover:text-orange-600">
              {product.reviews || 0} reviews
            </a>
            {product.soldCount ? <span className="text-sm text-green-600">{product.soldCount} sold</span> : null}
          </div>

          <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
            <Share2 className="h-4 w-4" />
            <span className="mr-1">Share:</span>
            <button
              type="button"
              className="h-8 px-3 text-xs font-medium rounded-full bg-green-600 hover:bg-green-700 text-white"
              onClick={() => share(`https://wa.me/?text=${encodedText}%20${encodedUrl}`)}
            >
              WhatsApp
            </button>
            <button
              type="button"
              className="h-8 px-3 text-xs font-medium rounded-full bg-sky-500 hover:bg-sky-600 text-white"
              onClick={() => share(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`)}
            >
              Twitter
            </button>
            <button
              type="button"
              className="h-8 px-3 text-xs font-medium rounded-full bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => share(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`)}
            >
              Facebook
            </button>
            <button type="button" className="h-8 px-3 text-xs font-medium rounded-full border text-gray-600" onClick={copyLink}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {product.brand && (
            <p className="text-sm text-gray-500 mb-3">
              Brand: <span className="font-medium text-gray-700">{product.brand}</span>
            </p>
          )}

          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-3xl font-bold text-gray-900">{formatKES(product.price)}</span>
            {hasDiscount && (
              <>
                <span className="text-lg text-gray-400 line-through">{formatKES(compareAt)}</span>
                <span className="bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded">Save {discountPct}%</span>
              </>
            )}
          </div>
          <p className={`text-sm font-medium mb-4 ${stockColor}`}>{stockLabel}</p>

          {(product.variants || []).map((v) => (
            <div key={v.name} className="mb-3">
              <p className="text-sm font-medium text-gray-700 mb-1">{v.name}</p>
              <div className="flex flex-wrap gap-2">
                {(v.options || []).map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setVariantPick((p) => ({ ...p, [v.name]: opt }))}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      variantPick[v.name] === opt
                        ? 'border-[#015837] bg-[#015837] text-white'
                        : 'border-gray-200 hover:border-orange-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {addHint && <p className="text-sm text-ember mb-2">{addHint}</p>}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border rounded-md">
              <button type="button" className="px-3 h-12" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold">{qty}</span>
              <button
                type="button"
                className="px-3 h-12"
                onClick={() => setQty((q) => Math.min(currentStock || 99, q + 1))}
                aria-label="Increase"
              >
                +
              </button>
            </div>
          </div>

          <div className="flex gap-3 mb-3">
            <button
              type="button"
              onClick={handleAdd}
              disabled={currentStock <= 0}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white h-12 text-base font-semibold rounded-md disabled:opacity-50 inline-flex items-center justify-center"
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              {currentStock <= 0 ? 'Out of Stock' : added ? 'Added' : t('addToCart')}
            </button>
            <button
              type="button"
              onClick={handleWishlist}
              className={`h-12 px-4 rounded-md border ${wishlisted ? 'border-red-300 text-red-500' : 'border-gray-200'}`}
              aria-label="Add to wishlist"
            >
              <Heart className={`h-5 w-5 ${wishlisted ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleCompare}
              disabled={compareItems.length >= 4 && !inCompare}
              className={`h-12 px-4 rounded-md border relative ${inCompare ? 'border-orange-400 text-orange-600' : 'border-gray-200'}`}
              aria-label="Add to compare"
            >
              <GitCompareArrows className={`h-5 w-5 ${inCompare ? 'text-orange-600' : ''}`} />
            </button>
          </div>
          <a
            href={waLink(`Hi BigDrop, I want to order: ${product.name} (${window.location.href})`, site?.whatsapp)}
            target="_blank"
            rel="noreferrer"
            className="mb-6 inline-flex h-11 w-full items-center justify-center rounded-md bg-[#25D366] text-sm font-semibold text-white hover:bg-[#1ebe5d]"
          >
            Order on WhatsApp
          </a>

          {product.vendorName && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-500">{t('soldBy')}</p>
              {product.vendorSlug ? (
                <Link to={`/vendors/${product.vendorSlug}`} className="font-semibold text-gray-800 hover:text-[#015837]">
                  {product.vendorName}
                </Link>
              ) : (
                <p className="font-semibold text-gray-800">{product.vendorName}</p>
              )}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
            <div className="flex items-start gap-3">
              <Truck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">{site?.deliveryCopy?.title || t('freeDeliveryOver')}</p>
                <p className="text-xs text-gray-500">
                  Estimated delivery: {site?.deliveryCopy?.note || t('estimatedDeliveryNote')}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-800">Genuine Product</p>
                <p className="text-xs text-gray-500">24-hour return policy · Fulfilled by Globeflight</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-800 mb-2">Payment Methods</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">M-Pesa</span>
              <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">Visa</span>
              <span className="bg-orange-100 text-orange-800 text-xs font-semibold px-2 py-1 rounded">Mastercard</span>
            </div>
          </div>
        </div>
      </div>

      <section id="product-tabs" className="mt-12">
        <div className="flex flex-wrap gap-1 border-b border-gray-200">
          {[
            ['description', t('description')],
            ['specifications', t('specifications')],
            ['reviews', t('reviews')],
            ['qna', t('qna')],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px ${
                tab === id ? 'border-[#015837] text-[#015837]' : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'description' && (
          <div className="py-6 text-sm text-gray-700 leading-relaxed max-w-3xl">
            <DescriptionBody text={product.description} />
          </div>
        )}

        {tab === 'specifications' && (
          <div className="py-6 max-w-3xl">
            {(() => {
              const specs = parseSpecs(product.specifications);
              if (!specs.length) {
                return <p className="text-gray-500">No specifications listed yet.</p>;
              }
              return (
                <table className="w-full text-sm">
                  <tbody>
                    {specs.map((row, i) => (
                      <tr key={`${row.name}-${i}`} className="border-b border-gray-100">
                        <th className="py-2 pr-4 text-left font-medium text-gray-500 w-40">{row.name}</th>
                        <td className="py-2 text-gray-800">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="py-6 grid md:grid-cols-[220px_1fr] gap-8">
            <div>
              <p className="text-4xl font-bold">{Number(product.rating || 0).toFixed(1)}</p>
              <StarRating rating={product.rating || 0} size={18} />
              <p className="text-sm text-gray-500 mt-1">{product.reviews || 0} global ratings</p>
              <div className="mt-4 space-y-2">
                {ratingBreakdown.map((row) => (
                  <button
                    type="button"
                    key={row.star}
                    className="flex items-center gap-2 w-full text-sm"
                    onClick={() => setReviewFilter(row.star === reviewFilter ? 0 : row.star)}
                  >
                    <span className="w-6">{row.star}★</span>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <i className="block h-full bg-amber-400" style={{ width: `${row.pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-gray-500">{row.pct}%</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {reviews.length === 0 ? (
                <p className="text-gray-500">No reviews match this filter yet.</p>
              ) : (
                reviews.map((r) => (
                  <article key={r.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <strong className="text-sm">{r.author}</strong>
                      {r.verified && <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">Verified</span>}
                    </div>
                    <StarRating rating={r.rating} size={13} />
                    <h4 className="font-semibold mt-1">{r.title}</h4>
                    <p className="text-sm text-gray-600">{r.comment}</p>
                    {r.image && <img src={r.image} alt="" className="mt-2 h-28 rounded-md object-cover" />}
                    <time className="text-xs text-gray-400">{r.date}</time>
                  </article>
                ))
              )}
              {user ? (
              <form onSubmit={submitReview} className="border rounded-lg p-4 space-y-2">
                <p className="font-semibold text-sm">Write a review</p>
                <select
                  value={reviewForm.rating}
                  onChange={(e) => setReviewForm((f) => ({ ...f, rating: Number(e.target.value) }))}
                  className="w-full rounded-md border px-3 py-2 text-sm"
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} stars
                    </option>
                  ))}
                </select>
                <input
                  value={reviewForm.title}
                  onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Title"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <textarea
                  required
                  rows={3}
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                  placeholder="Your review"
                  className="w-full rounded-md border px-3 py-2 text-sm"
                />
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    e.target.value = '';
                    if (!file) return;
                    try {
                      const data = await fileToReviewDataUrl(file);
                      setReviewForm((f) => ({ ...f, image: data }));
                    } catch (err) {
                      setReviewMsg(err.message || 'Could not use that photo.');
                    }
                  }}
                  className="block w-full text-sm"
                />
                {reviewForm.image && <img src={reviewForm.image} alt="" className="h-16 rounded object-cover" />}
                <button type="submit" className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white">
                  Submit review
                </button>
                {reviewMsg && <p className="text-sm text-[#015837]">{reviewMsg}</p>}
              </form>
              ) : (
                <div className="border rounded-lg p-4 space-y-2">
                  <p className="font-semibold text-sm">Write a review</p>
                  <p className="text-sm text-gray-500">Log in to write a review. Admin will approve it before it shows.</p>
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
                  >
                    Log in to review
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'qna' && (
          <div className="py-6 space-y-4 max-w-3xl">
            {questions.length ? (
              questions.map((q) => (
                <div key={q.id} className="border rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-800">{q.question}</p>
                  <p className="text-xs text-gray-400 mt-1">{q.asker || q.userName} asked</p>
                  {q.answer && (
                    <div className="mt-3 ml-4 pl-4 border-l-2 border-orange-300">
                      <p className="text-sm text-gray-600">{q.answer}</p>
                      <p className="text-xs text-gray-400 mt-1">— {q.answeredBy}</p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-gray-500">No questions yet.</p>
            )}
          </div>
        )}
      </section>

      {alsoBought.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently bought together</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {alsoBought.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {substitutes.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Similar alternatives</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {substitutes.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {related.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Related products</h2>
            {product.categorySlug && (
              <Link to={`/category/${product.categorySlug}`} className="text-sm font-semibold text-orange-600">
                See all in {product.categoryName}
              </Link>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {related.slice(0, 5).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={product.id} />
    </div>
  );
}
