export const SITE_NAME = 'BigDrop Kenya';
// Kept identical to client/index.html and server/src/seo.js so the head never flips
// between server HTML and the hydrated client state.
export const SITE_TITLE = 'BigDrop Kenya | Online Shopping Store in Kenya';
export const SITE_DESCRIPTION =
  'BigDrop Kenya — groceries, electronics, fashion, home & more, delivered by Globeflight across Kenya. Pay via M-Pesa or card.';
export const SITE_LOCALE = 'en_KE';
export const SITE_HREFLANG = 'en-KE';

/**
 * Browser-side twin of the server's STATIC_PAGE_META (server/src/seo.js) — KEEP IN SYNC.
 * The server renders the first paint with these values; after hydration applyShopMeta
 * re-applies them so the head doesn't flip back to generic shop defaults — which is what
 * it did before: every static page lost its unique title AND its canonical the moment
 * JavaScript ran, because applyShopMeta passed no canonical (upsertLink('') removes it).
 * noindex entries mirror the server: no canonical, no hreflang.
 */
export const STATIC_PAGE_META = {
  '/': {
    title: 'BigDrop Kenya | Online Shopping Store in Kenya',
    description:
      'BigDrop Kenya — groceries, electronics, fashion, home & more, delivered by Globeflight across Kenya. Pay via M-Pesa or card.',
  },
  '/shop': {
    title: 'Shop Online in Kenya | BigDrop Kenya',
    description:
      'Shop 2000+ products online in Kenya — fashion, electronics, groceries, home & more. M-Pesa & card accepted, nationwide delivery by Globeflight.',
  },
  '/about': {
    title: 'About Us | BigDrop Kenya',
    description:
      'BigDrop Kenya is a multi-vendor marketplace powered by Globeflight Kenya — storage, picking, packing and nationwide delivery for Kenyan sellers.',
  },
  '/blog': {
    title: 'Blog & Shopping Guides | BigDrop Kenya',
    description:
      'Shopping guides, product news and tips from BigDrop Kenya — learn how to shop, sell and get the most out of every order in Kenya.',
  },
  '/contact': {
    title: 'Contact Us | BigDrop Kenya',
    description:
      'Call +254 722 359 298, email info@bigdrop.co.ke or visit NextGen Mall, Mombasa Road. BigDrop Kenya support is available 24 hours.',
  },
  '/help': {
    title: 'Help Center & FAQ | BigDrop Kenya',
    description:
      'Answers about orders, delivery, returns, payments and selling on BigDrop Kenya. Find quick help for shopping and tracking your parcel.',
  },
  '/fulfillment': {
    title: 'Shipping & Fulfillment | BigDrop Kenya',
    description:
      'How BigDrop Kenya fulfills your order: storage, pick & pack and nationwide delivery by Globeflight — timelines, fees and tracking.',
  },
  '/sell': {
    title: 'Sell on BigDrop Kenya | Become a Vendor',
    description:
      'List your products on BigDrop Kenya and reach shoppers nationwide. We store, pick, pack and deliver — you focus on selling.',
  },
  '/vendors': {
    title: 'Vendors & Stores | BigDrop Kenya',
    description:
      'Browse approved vendors and stores on BigDrop Kenya — discover trusted Kenyan sellers and shop their full catalogue in one place.',
  },
  '/careers': {
    title: 'Careers | BigDrop Kenya',
    description:
      'Join the BigDrop Kenya and Globeflight team. See open roles in e-commerce, warehousing, delivery and customer support in Kenya.',
  },
  '/returns': {
    title: 'Returns & Refunds | BigDrop Kenya',
    description:
      'Changed your mind? Read the BigDrop Kenya returns and refunds policy — 24-hour returns, how to request a refund and what to expect.',
  },
  '/privacy': {
    title: 'Privacy Policy | BigDrop Kenya',
    description:
      'How BigDrop Kenya collects, uses and protects your personal data — read our full privacy policy for shoppers, vendors and visitors.',
  },
  '/terms': {
    title: 'Terms of Service | BigDrop Kenya',
    description:
      'The terms and conditions that govern your use of BigDrop Kenya, including orders, payments, deliveries, returns and vendor conduct.',
  },
  '/deals': {
    title: 'Deals & Offers | BigDrop Kenya',
    description:
      "Today's best discounts at BigDrop Kenya — limited-time offers across fashion, electronics, groceries and home, updated daily.",
  },
  '/black-friday': {
    title: 'Black Friday Deals | BigDrop Kenya',
    description:
      'BigDrop Kenya Black Friday: the biggest discounts of the year on electronics, fashion and home essentials — while stocks last.',
  },
  '/brands': {
    title: 'Shop Top Brands | BigDrop Kenya',
    description:
      'Shop your favourite brands at BigDrop Kenya — genuine products from trusted local and international brands, delivered nationwide.',
  },
  '/cart': { title: 'Cart | BigDrop Kenya', noindex: true },
  '/wishlist': { title: 'Wishlist | BigDrop Kenya', noindex: true },
  '/compare': { title: 'Compare Products | BigDrop Kenya', noindex: true },
  '/order-success': { title: 'Order Confirmation | BigDrop Kenya', noindex: true },
  '/track': {
    title: 'Track Your Order | BigDrop Kenya',
    description:
      'Enter your Globeflight tracking number to see where your BigDrop Kenya order is — live shipment status and delivery updates.',
  },
  '/reset-password': { title: 'Reset Password | BigDrop Kenya', noindex: true },
};

/**
 * A meta description is one flat line of text — mirrors the server's metaText():
 * collapse newlines/markup and cut on a word boundary so the hydrated value matches
 * what the server rendered in the first paint.
 */
export function metaText(raw, max = 300) {
  const s = String(raw || '')
    .replace(/\r\n|\n|\r/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/[ \t\u00A0]+/g, ' ')
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (lastStop > max * 0.6) return cut.slice(0, lastStop + 1).trim();
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

/** `${name} | BigDrop Kenya` unless the brand already appears (server pageTitle twin). */
export function brandTitle(name, site = SITE_NAME) {
  const n = String(name || '').trim();
  if (!n) return site;
  if (n.toLowerCase().includes(site.toLowerCase())) return n;
  return `${n} | ${site}`;
}

/** Absolute, data:-safe URL for og:image-style tags (server absoluteUrl twin). */
export function absoluteUrl(src, origin) {
  if (!src || typeof src !== 'string' || src.startsWith('data:')) return '';
  if (/^https?:\/\//i.test(src)) return src;
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '');
  if (!base) return '';
  const path = src.startsWith('/') ? src : `/${src}`;
  return `${base}${path}`;
}

function upsertMeta(attr, key, value) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function upsertLink(rel, href) {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * hreflang alternates need a compound selector — the head carries other <link> tags,
 * and only the pair below may be touched.
 */
function upsertAlternate(hreflang, href) {
  let el = document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'alternate');
    el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

const ARTICLE_LD_ID = 'bd-article-jsonld';

function upsertJsonLd(data, id = ARTICLE_LD_ID) {
  let el = document.getElementById(id);
  if (!data) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('script');
    el.id = id;
    el.type = 'application/ld+json';
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

/**
 * The server injects typed schema blocks (bd-product-jsonld, bd-breadcrumb-jsonld, …)
 * into the served HTML. Every client-side update therefore clears ALL managed blocks
 * first, so a page never leaves another page's Product/Breadcrumb schema behind in the
 * DOM. `jsonLd` stays backwards compatible: a plain object is the Article block
 * (bd-article-jsonld); an array of { id, data } entries writes any set of blocks
 * (e.g. product + breadcrumb, mirroring the server's ids).
 */
function clearManagedJsonLd() {
  document
    .querySelectorAll('script[type="application/ld+json"][id^="bd-"]')
    .forEach((el) => el.remove());
}

function applyJsonLd(jsonLd) {
  clearManagedJsonLd();
  if (!jsonLd) return;
  const items = Array.isArray(jsonLd) ? jsonLd : [{ id: ARTICLE_LD_ID, data: jsonLd }];
  for (const { id, data } of items) upsertJsonLd(data, id);
}

/**
 * Which pathname last claimed the head via applyPageMeta. TrackingScripts uses it to
 * skip its generic reset when the current page manages its own meta — without this, the
 * reset (which also re-runs whenever the site config finishes loading) would wipe a
 * product's or article's head back to the shop defaults.
 */
let metaOwnerPath = null;

export function pageMetaOwns(pathname) {
  return Boolean(metaOwnerPath) && metaOwnerPath === pathname;
}

function pageUrl() {
  if (typeof window === 'undefined') return '';
  // Mirror the server's pathOnly: '/shop/' must produce the same og:url as '/shop',
  // or the trailing-slash variant would publish a different URL than its canonical.
  const raw = window.location.pathname;
  const path = raw.length > 1 && raw.endsWith('/') ? raw.slice(0, -1) : raw;
  return `${window.location.origin}${path}`;
}

/** Browser-side twin of the server's defaultShareImage(): always absolute. */
function defaultShareImage() {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/share-default.jpg`;
}

export function applyPageMeta({
  title,
  description,
  image,
  canonical,
  type = 'website',
  noindex = false,
  jsonLd = null,
} = {}) {
  // Flatten to one clean line exactly like the server's injectors do, so the hydrated
  // head matches the first paint instead of carrying raw \n/markup into snippets.
  const desc = metaText(description || SITE_DESCRIPTION) || SITE_DESCRIPTION;
  document.title = title || SITE_TITLE;
  upsertMeta('name', 'description', desc);
  upsertMeta('property', 'og:title', title || SITE_TITLE);
  upsertMeta('property', 'og:description', desc);
  upsertMeta('property', 'og:site_name', SITE_NAME);
  upsertMeta('property', 'og:locale', SITE_LOCALE);
  upsertMeta('property', 'og:type', type);
  // og:url mirrors what the server injects: this page's own absolute URL. Query strings
  // are dropped so filter/pagination views don't publish a different og:url per variant.
  upsertMeta('property', 'og:url', pageUrl());
  upsertMeta('property', 'og:image', image || defaultShareImage());
  upsertMeta('name', 'twitter:card', 'summary_large_image');
  upsertMeta('name', 'twitter:title', title || SITE_TITLE);
  upsertMeta('name', 'twitter:description', desc);
  upsertMeta('name', 'twitter:image', image || defaultShareImage());
  upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
  upsertLink('canonical', canonical || '');
  // The hreflang pair mirrors the canonical (same lockstep the server keeps): a page
  // with no canonical declares no language twins either.
  upsertAlternate(SITE_HREFLANG, canonical || '');
  upsertAlternate('x-default', canonical || '');
  applyJsonLd(jsonLd);
  metaOwnerPath = typeof window === 'undefined' ? null : window.location.pathname;
}

/**
 * Generic reset for pages that don't manage their own head — but no longer
 * generic-blind: known static/utility paths re-apply their unique title/description
 * from STATIC_PAGE_META (mirroring the server), and indexable static pages re-assert
 * their self-canonical. Without this, hydration used to strip the canonical the server
 * had just injected (upsertLink('canonical','') removes the tag) and revert every
 * static page to the homepage title.
 *
 * Unknown paths keep the old behaviour: no canonical, no hreflang — matching the
 * server's applyGenericOrigin() "unknown path" branch exactly.
 */
export function applyShopMeta() {
  if (typeof window === 'undefined') return;
  // '/shop/' must resolve to the same meta as '/shop', exactly like the server's pathOnly.
  const rawPath = window.location.pathname;
  const path = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;
  const entry = STATIC_PAGE_META[path];
  applyPageMeta({
    title: entry?.title || SITE_TITLE,
    description: entry?.description || SITE_DESCRIPTION,
    canonical: entry && !entry.noindex ? `${window.location.origin}${path}` : '',
    noindex: Boolean(entry?.noindex),
  });
  // applyShopMeta is the generic reset — by definition no page owns the head now.
  metaOwnerPath = null;
}
