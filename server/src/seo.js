import { readDb } from './db.js';
import { vendorStoreSlug } from './commerce.js';

const SITE_DESCRIPTION =
  'BigDrop Kenya — groceries, electronics, fashion, home & more, delivered by Globeflight across Kenya. Pay via M-Pesa.';

const LOCAL_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)(:\d+)?$/i;
// Phase-1 hosting: PHASE_NOINDEX=true swaps every injected robots meta to noindex
// so a temporary domain (shop.bigdrop.co.ke) never enters the search index.
const PHASE_NOINDEX = String(process.env.PHASE_NOINDEX || '').trim().toLowerCase() === 'true';

/**
 * Titles like "BigDrop Kenya: Smart E-commerce Fulfillment" must not become
 * "... | BigDrop Kenya" — a duplicated brand name looks spammy in search results and
 * wastes the ~60 characters Google shows. Only append when it is not already there.
 */
function pageTitle(title, siteName) {
  const name = String(title || '').trim();
  const site = String(siteName || 'BigDrop Kenya').trim();
  if (!name) return site;
  if (site && new RegExp(site.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(name)) return name;
  return `${name} | ${site}`;
}

/**
 * The origin a browser or crawler actually used to reach us.
 *
 * sitemap.xml and robots.txt stay on the configured PUBLIC_CLIENT_URL, but social meta
 * must not: a localhost value there produces share cards pointing at the developer's
 * machine, and WhatsApp/Facebook then show no image at all. So an explicit real domain
 * wins, and otherwise the incoming request does — X-Forwarded-* first, because the app
 * runs behind a reverse proxy on cPanel.
 */
export function originFromRequest(req) {
  const configured = String(process.env.PUBLIC_CLIENT_URL || process.env.CLIENT_ORIGIN || '')
    .split(',')[0]
    .trim()
    .replace(/\/$/, '');
  if (configured && !LOCAL_ORIGIN.test(configured)) return configured;
  const header = (name) => String(req?.headers?.[name] || '').split(',')[0].trim();
  const host = header('x-forwarded-host') || header('host');
  if (!host) return configured || 'https://www.bigdrop.co.ke';
  const proto = header('x-forwarded-proto') || (req?.secure ? 'https' : 'http');
  return `${proto}://${host}`.replace(/\/$/, '');
}

export function absoluteUrl(origin, src) {
  if (!src || typeof src !== 'string') return '';
  if (src.startsWith('data:')) return '';
  if (/^https?:\/\//i.test(src)) return src;
  const path = src.startsWith('/') ? src : `/${src}`;
  return `${origin}${path}`;
}

function xmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const STATIC_PATHS = [
  '/',
  '/shop',
  '/about',
  '/blog',
  '/contact',
  '/help',
  '/fulfillment',
  '/sell',
  '/vendors',
  '/careers',
  '/returns',
  '/privacy',
  '/terms',
  '/deals',
  '/black-friday',
  '/brands',
  '/track',
];

/**
 * Unique <title> + meta description per static page, plus noindex flags for utility
 * pages that should never enter the index. Without this every static path ships the
 * homepage's title (the index.html shell), which reads as duplicate content to Google
 * and gives every result the same snippet. NOINDEX entries are not in STATIC_PATHS,
 * so they never get a canonical or a sitemap URL.
 *
 * KEEP IN SYNC with the mirror map in client/src/lib/pageMeta.js — the server renders
 * the first paint, the client re-applies these values after hydration (applyShopMeta),
 * and any drift between the two would make the head flip after JavaScript loads.
 */
export const STATIC_PAGE_META = {
  '/': {
    title: 'BigDrop Kenya | Online Shopping Store in Kenya',
    description:
      'BigDrop Kenya — groceries, electronics, fashion, home & more, delivered by Globeflight across Kenya. Pay via M-Pesa.',
  },
  '/shop': {
    title: 'Shop Online in Kenya | BigDrop Kenya',
    description:
      'Shop 2000+ products online in Kenya — fashion, electronics, groceries, home & more. Pay with M-Pesa, nationwide delivery by Globeflight.',
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
  // Utility pages: unique title for the browser tab, but noindexed and excluded
  // from the sitemap (they are not in STATIC_PATHS and carry no canonical).
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

export function buildSitemapXml(req) {
  const origin = originFromRequest(req);
  const db = readDb();
  const urls = STATIC_PATHS.map((loc) => ({ loc: `${origin}${loc}`, changefreq: 'weekly', priority: loc === '/' ? '1.0' : '0.7' }));

  for (const post of db.blogPosts || []) {
    if (post.published === false || !post.slug) continue;
    urls.push({
      loc: `${origin}/blog/${post.slug}`,
      lastmod: post.publishedAt || post.updatedAt,
      changefreq: 'monthly',
      priority: '0.8',
    });
  }

  for (const product of db.products || []) {
    // Hidden products 404 (see contentPathMissing), so listing one here only hands a
    // crawler a dead URL. The vendor and category loops below both filter on hidden;
    // this one had been the lone omission.
    if (product.status !== 'approved' || product.hidden || !product.slug) continue;
    urls.push({
      loc: `${origin}/product/${product.slug}`,
      lastmod: product.updatedAt || product.createdAt,
      changefreq: 'weekly',
      priority: '0.6',
    });
  }

  // Vendor shops: real, crawlable pages. An approved seller with nothing in stock is
  // skipped — an empty shop is not worth a crawler's (or a shopper's) time.
  for (const vendor of db.users || []) {
    if (vendor.role !== 'vendor' || vendor.status !== 'approved') continue;
    const stocked = (db.products || []).some(
      (p) => p.vendorId === vendor.id && p.status === 'approved' && !p.hidden
    );
    if (!stocked) continue;
    urls.push({
      loc: `${origin}/vendors/${vendorStoreSlug(vendor)}`,
      changefreq: 'weekly',
      priority: '0.5',
    });
  }

  // Category listing pages: real, crawlable pages the shop links to from its nav, so a
  // crawler has to be able to find them without guessing every slug. Same rule as vendor
  // shops — a category nobody stocks any more is skipped, an empty shelf is not content.
  for (const cat of db.categories || []) {
    if (!cat.slug) continue;
    const stocked = (db.products || []).some(
      (p) => p.status === 'approved' && !p.hidden && (p.categoryId === cat.id || p.categorySlug === cat.slug)
    );
    if (!stocked) continue;
    urls.push({
      loc: `${origin}/category/${cat.slug}`,
      changefreq: 'weekly',
      priority: '0.6',
    });
  }

  const body = urls
    .map((u) => {
      const d = u.lastmod ? new Date(u.lastmod) : null;
      const last =
        d && !Number.isNaN(d.getTime()) ? `\n    <lastmod>${xmlEscape(d.toISOString())}</lastmod>` : '';
      return `  <url>\n    <loc>${xmlEscape(u.loc)}</loc>${last}\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

export function buildRobotsTxt(req) {
  const origin = originFromRequest(req);
  return [
    'User-agent: *',
    'Allow: /',
    'Disallow: /dashboard',
    'Disallow: /account',
    'Disallow: /login',
    'Disallow: /register',
    'Disallow: /checkout',
    'Disallow: /admin',
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');
}

export function organizationJsonLd(origin, siteName = 'BigDrop Kenya') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteName,
    url: origin,
    logo: `${origin}/icon-512.png`,
    email: 'info@bigdrop.co.ke',
    telephone: '+254 722 359 298',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'NextGen Mall, Mombasa Road, 3rd Floor, Suite 40',
      addressLocality: 'Nairobi',
      addressCountry: 'KE',
    },
  };
}

export function websiteJsonLd(origin, siteName = 'BigDrop Kenya') {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: `${origin}/`,
    publisher: { '@type': 'Organization', name: siteName, url: origin },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${origin}/shop?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

function insertJsonLd(html, id, data) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  const ld = `<script type="application/ld+json" id="${id}">${json}</script>`;
  if (new RegExp(`id=["']${id}["']`).test(html)) return html;
  return html.replace(/<\/head>/i, `  ${ld}\n</head>`);
}

const HOMEPAGE_H1 = 'BigDrop Kenya — Online shopping in Kenya';
const HOMEPAGE_H1_STYLE =
  'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0';

function injectHomepageH1(html) {
  if (/<h1[\s>]/i.test(html)) return html;
  return html.replace(
    /<div id=["']root["']>\s*<\/div>/i,
    `<div id="root"><h1 style="${HOMEPAGE_H1_STYLE}">${xmlEscape(HOMEPAGE_H1)}</h1></div>`
  );
}

export function articleJsonLd(post, origin) {
  const url = `${origin}/blog/${post.slug}`;
  const image = absoluteUrl(origin, post.image);
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: metaText(post.metaDescription || post.excerpt || ''),
    image: image || undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: { '@type': 'Person', name: post.author || 'BigDrop Team' },
    publisher: {
      '@type': 'Organization',
      name: 'BigDrop Kenya',
      url: origin,
    },
    mainEntityOfPage: url,
    url,
  };
}

function replaceOrInsertMeta(html, attr, key, value) {
  const re = new RegExp(`<meta[^>]*${attr}=["']${key}["'][^>]*>`, 'i');
  const tag = `<meta ${attr}="${key}" content="${xmlEscape(value)}" />`;
  if (re.test(html)) return html.replace(re, tag);
  return html.replace(/<\/head>/i, `  ${tag}\n</head>`);
}

function removeMeta(html, attr, key) {
  const re = new RegExp(`\\s*<meta[^>]*${attr}=["']${key}["'][^>]*>`, 'i');
  return html.replace(re, '');
}

const DEFAULT_SHARE_PATH = '/share-default.jpg';

/** The 1200x630 fallback share card, always absolute (chat apps reject relative image URLs). */
export function defaultShareImage(origin) {
  return `${origin}${DEFAULT_SHARE_PATH}`;
}

/**
 * Sets every tag a link preview reads. WhatsApp, Facebook and X do not run
 * JavaScript, so these have to be correct in the HTML the server sends — which is
 * why product/category/blog pages get their own title, description, URL and photo.
 * `dropImageDims` removes the 1200x630 hints when the image is a real page photo
 * (a square product shot is not 1200x630, and wrong dimensions letterbox the card).
 */
// Kenya-facing shop: the OG locale keeps Facebook's renderer from falling back to en_US.
const OG_LOCALE = 'en_KE';

/**
 * A meta description is one flat line of text. Google, WhatsApp and Facebook render no
 * line breaks, and descriptions lifted from a WooCommerce import often still carry
 * literal "\n" escapes, bullet markers and stray markup — which read as garbage in a
 * search result. Collapse all of that into a single clean string and cut on a word
 * boundary so the snippet never ends mid-word.
 */
function metaText(raw, max = 300) {
  const s = String(raw || '')
    .replace(/\\r\\n|\\n|\\r/g, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;|&apos;/gi, "'")
    .replace(/[•·▪▫◦‣]+/g, ' ')
    .replace(/[ \t\u00A0]+/g, ' ')
    .trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const lastStop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '));
  if (lastStop > max * 0.6) return cut.slice(0, lastStop + 1).trim();
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}

function applySocialMeta(html, { title, description, url, image, type, dropImageDims, siteName }) {
  const desc = metaText(description);
  let next = html;
  next = replaceOrInsertMeta(next, 'property', 'og:title', title);
  next = replaceOrInsertMeta(next, 'property', 'og:description', desc);
  next = replaceOrInsertMeta(next, 'property', 'og:type', type);
  // og:site_name is what Facebook shows beside the title on a card; without it the card
  // reads as an anonymous domain. og:locale keeps the card's language/region explicit.
  if (siteName) next = replaceOrInsertMeta(next, 'property', 'og:site_name', siteName);
  next = replaceOrInsertMeta(next, 'property', 'og:locale', OG_LOCALE);
  if (url) next = replaceOrInsertMeta(next, 'property', 'og:url', url);
  if (image) next = replaceOrInsertMeta(next, 'property', 'og:image', image);
  next = replaceOrInsertMeta(next, 'name', 'twitter:card', 'summary_large_image');
  next = replaceOrInsertMeta(next, 'name', 'twitter:title', title);
  next = replaceOrInsertMeta(next, 'name', 'twitter:description', desc);
  if (image) next = replaceOrInsertMeta(next, 'name', 'twitter:image', image);
  if (dropImageDims) {
    next = removeMeta(next, 'property', 'og:image:width');
    next = removeMeta(next, 'property', 'og:image:height');
  }
  return next;
}

const HREFLANG = 'en-KE';

const HREFLANG_LINK_RE = /<link\b(?=[^>]*rel=["']alternate["'])(?=[^>]*hreflang=)[^>]*>\s*/gi;

/** Remove any hreflang alternates (e.g. the shell's homepage pair) before re-issuing. */
function stripAlternateLinks(html) {
  return html.replace(HREFLANG_LINK_RE, '');
}

/**
 * Self-referencing hreflang pair. The shop is single-locale (Kenya English), so both
 * links point at the canonical URL itself: harmless for crawlers, and it keeps locale
 * audits and validators from flagging the site. The pair always travels with the
 * canonical — replace-any-existing keeps it idempotent — so a page can never canonicalise
 * to one URL while claiming another as its language twin.
 */
function applyAlternateLinks(html, canonical) {
  const tags =
    `  <link rel="alternate" hreflang="${HREFLANG}" href="${xmlEscape(canonical)}" />\n` +
    `  <link rel="alternate" hreflang="x-default" href="${xmlEscape(canonical)}" />\n`;
  return stripAlternateLinks(html).replace(/<\/head>/i, `${tags}</head>`);
}

/**
 * Canonical link, inserted once, matching the URL the page is really served at.
 * The hreflang pair is rewritten in the same pass so the two can never drift apart.
 */
function applyCanonical(html, canonical) {
  const tag = `<link rel="canonical" href="${xmlEscape(canonical)}" />`;
  let next = html;
  if (/rel=["']canonical["']/i.test(next)) {
    next = next.replace(/<link[^>]*rel=["']canonical["'][^>]*>/i, tag);
  } else {
    next = next.replace(/<\/head>/i, `  ${tag}\n</head>`);
  }
  return applyAlternateLinks(next, canonical);
}

/**
 * The Product schema's `brand` is the MANUFACTURER, not the shop. These are
 * different things and confusing them is a Google structured-data guideline
 * violation — an iPhone must not claim "BigDrop" as its brand.
 *
 * Precedence:
 *   1. product.brand        — the real manufacturer, set by fixBrands.js
 *   2. the vendor's store   — resolved from db.users via vendorId, because the
 *                             raw db product has only vendorId (vendorName is
 *                             added later by the API serializer, so it is
 *                             `undefined` here and used to fall through to
 *                             SITE_NAME on every product)
 *   3. the site name        — only when the product is genuinely unbranded
 *
 * The old 'BigDrop' placeholder brand is treated as "no brand" so it can never
 * resurface here.
 */
const BRAND_PLACEHOLDERS = /^(big\s*drop|unbranded|bigdrop vendor)$/i;

function resolveProductBrand(product, db) {
  const own = String(product?.brand || '').trim();
  if (own && !BRAND_PLACEHOLDERS.test(own)) {
    return { name: own, isVendor: false };
  }
  const vendor = (db?.users || []).find((u) => u.id === product?.vendorId);
  const store = String(vendor?.storeName || vendor?.name || '').trim();
  if (store) return { name: store, isVendor: true };
  return { name: db?.site?.name || 'BigDrop Kenya', isVendor: true };
}

export function productJsonLd(product, origin, db) {
  const url = `${origin}/product/${product.slug}`;
  const image = absoluteUrl(origin, Array.isArray(product.images) ? product.images[0] : product.image);
  const offers = {
    '@type': 'Offer',
    priceCurrency: product.currency || 'KES',
    price: Number(product.price || 0),
    availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    url,
  };
  const brand = resolveProductBrand(product, db);
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: image || undefined,
    description: metaText(product.excerpt || product.description || ''),
    brand: { '@type': 'Brand', name: brand.name },
    sku: product.sku || undefined,
    offers,
  };
  // When the product carries no manufacturer of its own the brand falls back to
  // the selling shop. Say so explicitly as `seller` too, so the page never
  // implies BigDrop is the maker of an unbranded generic good.
  if (brand.isVendor) {
    ld.seller = { '@type': 'Organization', name: brand.name };
  }
  return ld;
}

// Breadcrumbs give Google a clean hierarchy to show under the result
// (BigDrop Kenya › Household › Air Freshener) instead of a bare URL.
export function breadcrumbJsonLd(product, origin, db) {
  const cat = (db.categories || []).find((c) => c.id === product.categoryId || c.slug === product.categorySlug);
  const items = [{ '@type': 'ListItem', position: 1, name: 'Home', item: origin }];
  if (cat) {
    items.push({
      '@type': 'ListItem',
      position: 2,
      name: cat.name,
      item: `${origin}/category/${cat.slug}`,
    });
  }
  items.push({
    '@type': 'ListItem',
    position: items.length + 1,
    name: product.name,
    item: `${origin}/product/${product.slug}`,
  });
  return { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: items };
}

function injectBlogHtml(html, post, origin, siteName) {
  const published = post.published !== false;
  const base = published ? post.title : `Draft: ${post.title}`;
  const title = pageTitle(base, siteName);
  const description = post.metaDescription || post.excerpt || SITE_DESCRIPTION;
  const canonical = `${origin}/blog/${post.slug}`;
  const image = absoluteUrl(origin, post.image);

  let next = html.replace(/<title>[^<]*<\/title>/i, `<title>${xmlEscape(title)}</title>`);
  next = replaceOrInsertMeta(next, 'name', 'description', metaText(description));
  next = replaceOrInsertMeta(next, 'name', 'robots', published ? 'index, follow' : 'noindex, nofollow');
  next = applySocialMeta(next, {
    title,
    description,
    url: canonical,
    image: image || defaultShareImage(origin),
    type: 'article',
    dropImageDims: Boolean(image),
    siteName,
  });
  if (published) {
    next = applyCanonical(next, canonical);
    const json = JSON.stringify(articleJsonLd(post, origin)).replace(/</g, '\\u003c');
    const ld = `<script type="application/ld+json" id="bd-article-jsonld">${json}</script>`;
    if (!/id="bd-article-jsonld"/.test(next)) {
      next = next.replace(/<\/head>/i, `  ${ld}\n</head>`);
    }
  } else {
    // Draft: noindex and no language twins pointing at a URL that must not exist yet.
    next = stripAlternateLinks(next);
  }
  return next;
}

function injectProductHtml(html, product, origin, db) {
  const siteName = db.site?.name || 'BigDrop Kenya';
  const title = pageTitle(product.name, siteName);
  const description = product.metaDescription || product.excerpt || product.description || SITE_DESCRIPTION;
  const canonical = `${origin}/product/${product.slug}`;
  const image = absoluteUrl(origin, Array.isArray(product.images) ? product.images[0] : product.image) || absoluteUrl(origin, db.site?.logo);

  let next = html.replace(/<title>[^<]*<\/title>/i, `<title>${xmlEscape(title)}</title>`);
  next = replaceOrInsertMeta(next, 'name', 'description', metaText(description));
  next = replaceOrInsertMeta(next, 'name', 'robots', PHASE_NOINDEX ? 'noindex, nofollow' : 'index, follow');
  next = applySocialMeta(next, {
    title,
    description,
    url: canonical,
    image: image || defaultShareImage(origin),
    type: 'product',
    dropImageDims: Boolean(image),
    siteName,
  });
  next = applyCanonical(next, canonical);
  const json = JSON.stringify(productJsonLd(product, origin, db)).replace(/</g, '\\u003c');
  const ld = `<script type="application/ld+json" id="bd-product-jsonld">${json}</script>`;
  if (!/id="bd-product-jsonld"/.test(next)) {
    next = next.replace(/<\/head>/i, `  ${ld}\n</head>`);
  }
  const crumbJson = JSON.stringify(breadcrumbJsonLd(product, origin, db)).replace(/</g, '\\u003c');
  const crumbLd = `<script type="application/ld+json" id="bd-breadcrumb-jsonld">${crumbJson}</script>`;
  if (!/id="bd-breadcrumb-jsonld"/.test(next)) {
    next = next.replace(/<\/head>/i, `  ${crumbLd}\n</head>`);
  }
  return next;
}

function injectCategoryHtml(html, cat, origin, db) {
  const siteName = db.site?.name || 'BigDrop Kenya';
  const title = pageTitle(cat.name, siteName);
  const description = cat.description || `Shop ${cat.name} online at ${siteName}. Genuine products, pay with M-Pesa, same-day delivery in Nairobi.`;
  const canonical = `${origin}/category/${cat.slug}`;
  const image = absoluteUrl(origin, cat.image);

  let next = html.replace(/<title>[^<]*<\/title>/i, `<title>${xmlEscape(title)}</title>`);
  next = replaceOrInsertMeta(next, 'name', 'description', metaText(description));
  next = replaceOrInsertMeta(next, 'name', 'robots', PHASE_NOINDEX ? 'noindex, nofollow' : 'index, follow');
  next = applySocialMeta(next, {
    title,
    description,
    url: canonical,
    image: image || defaultShareImage(origin),
    type: 'website',
    dropImageDims: Boolean(image),
    siteName,
  });
  next = applyCanonical(next, canonical);
  return next;
}

/**
 * Vendor shop (/vendors/:slug). Same reasoning as categories: when a seller shares their
 * own shop link on WhatsApp or Facebook, the preview should carry their name, a photo and
 * how much they stock — the homepage card tells a buyer nothing about the shop.
 */
function injectVendorHtml(html, vendor, origin, db) {
  const siteName = db.site?.name || 'BigDrop Kenya';
  const storeName = vendor.storeName || vendor.name || 'BigDrop Vendor';
  const products = (db.products || []).filter(
    (p) => p.vendorId === vendor.id && p.status === 'approved' && !p.hidden
  );
  const title = pageTitle(storeName, siteName);
  const description =
    `Shop ${products.length} ${products.length === 1 ? 'product' : 'products'} from ${storeName} ` +
    `on ${siteName}. Pay with M-Pesa, delivered nationwide by Globeflight.`;
  const canonical = `${origin}/vendors/${vendorStoreSlug(vendor)}`;
  const photo = products.map((p) => (Array.isArray(p.images) ? p.images[0] : p.image)).find(Boolean);
  const image = absoluteUrl(origin, photo);

  let next = html.replace(/<title>[^<]*<\/title>/i, `<title>${xmlEscape(title)}</title>`);
  next = replaceOrInsertMeta(next, 'name', 'description', metaText(description));
  next = replaceOrInsertMeta(next, 'name', 'robots', PHASE_NOINDEX ? 'noindex, nofollow' : 'index, follow');
  next = applySocialMeta(next, {
    title,
    description,
    url: canonical,
    image: image || defaultShareImage(origin),
    type: 'website',
    dropImageDims: Boolean(image),
    siteName,
  });
  next = applyCanonical(next, canonical);
  return next;
}

/**
 * Every page that has no per-page data of its own (homepage, /shop, /about, /help …)
 * still needs ABSOLUTE share URLs, and `client/index.html` can only carry a build-time
 * guess at them. Rewriting the origin here keeps those tags correct on whatever domain
 * the site is served from — localhost, a staging subdomain, or the live shop — so the
 * homepage card is never pointing at a hardcoded host. Page-specific values stay exact;
 * only the origin (and the og:url path) is recomputed.
 */
function applyGenericOrigin(html, origin, pathOnly, siteName) {
  const isRoot = !pathOnly || pathOnly === '/';
  const canonicalPath = isRoot ? '/' : pathOnly;
  const share = defaultShareImage(origin);
  const url = `${origin}${canonicalPath}`;
  const pageMeta = STATIC_PAGE_META[canonicalPath];
  let next = html;
  // Same identity tags the per-page injectors set — otherwise home, /shop and /about
  // produce share cards that read as an anonymous domain.
  next = replaceOrInsertMeta(next, 'property', 'og:site_name', siteName || 'BigDrop Kenya');
  next = replaceOrInsertMeta(next, 'property', 'og:locale', OG_LOCALE);

  // Unique title/description per known static page (the shell only carries the
  // homepage's values). Mirrors what the per-page injectors do for products/blog.
  if (pageMeta) {
    // pageTitle() must receive the raw string — replaceOrInsertMeta escapes on the way
    // out; only the raw <title> replacement below applies xmlEscape itself.
    const rawTitle = pageTitle(pageMeta.title, siteName);
    next = next.replace(/<title>[^<]*<\/title>/i, `<title>${xmlEscape(rawTitle)}</title>`);
    if (pageMeta.description) {
      const desc = metaText(pageMeta.description);
      next = replaceOrInsertMeta(next, 'name', 'description', desc);
      next = replaceOrInsertMeta(next, 'property', 'og:description', desc);
      next = replaceOrInsertMeta(next, 'name', 'twitter:description', desc);
    }
    // og:title / twitter:title should mirror <title> — the shell's are homepage-only.
    next = replaceOrInsertMeta(next, 'property', 'og:title', rawTitle);
    next = replaceOrInsertMeta(next, 'name', 'twitter:title', rawTitle);
  }

  // Rewrite the content="…" of the first tag matching `re`. Callers must pass a tag-level
  // pattern (e.g. /<meta[^>]*property=["']og:url["'][^>]*>/i) — passing no pattern at all
  // would make String.replace treat the whole document as the search string.
  const setContent = (re, value) =>
    next.replace(re, (m) => m.replace(/content=["'][^"']*["']/i, `content="${value}"`));

  // og:image / twitter:image are build-time absolute; re-anchor them to the real origin.
  next = setContent(/<meta[^>]*property=["']og:image["'][^>]*>/i, share);
  next = setContent(/<meta[^>]*name=["']twitter:image["'][^>]*>/i, share);

  // The page's own URL (“/” on the homepage, the path on any other page).
  next = setContent(/<meta[^>]*property=["']og:url["'][^>]*>/i, url);

  if (pageMeta?.noindex) {
    // Utility pages (cart, wishlist, …): unique tab title, but explicitly kept out of
    // the index. No canonical and no hreflang — there is no URL worth pointing at.
    next = replaceOrInsertMeta(next, 'name', 'robots', 'noindex, nofollow');
    next = stripAlternateLinks(next);
    return next;
  }

  // A self-referencing canonical keeps /shop, /about and friends from being read as
  // duplicates of the homepage. Only real pages get one: an unknown path, or a
  // redirect-only one (/login, /checkout), must not declare itself canonical indexable.
  if (STATIC_PATHS.includes(canonicalPath)) {
    next = applyCanonical(next, url);
    // Matching the page-specific injectors: real pages are indexable. Anything else says
    // nothing here — an unknown path gets its verdict from robots.txt and the crawler's
    // own 404 heuristics, not from a tag this generic renderer has no business writing.
    next = replaceOrInsertMeta(next, 'name', 'robots', PHASE_NOINDEX ? 'noindex, nofollow' : 'index, follow');
  } else {
    // No canonical → no language twins either: an unknown path must not keep the
    // homepage hreflang pair the shell ships with.
    next = stripAlternateLinks(next);
  }

  if (isRoot) {
    next = insertJsonLd(next, 'bd-org-jsonld', organizationJsonLd(origin, siteName || 'BigDrop Kenya'));
    next = insertJsonLd(next, 'bd-website-jsonld', websiteJsonLd(origin, siteName || 'BigDrop Kenya'));
    next = injectHomepageH1(next);
  }
  return next;
}

export function injectIndexHtml(html, reqPath, req) {
  const db = readDb();
  const origin = originFromRequest(req);
  const siteName = db.site?.name || 'BigDrop Kenya';
  const rawPath = String(reqPath || '').split('?')[0];
  // '/shop/' must get the same head treatment — and the same canonical — as '/shop'.
  // The sitemap lists the slash-less form, so letting the trailing variant fall through
  // to the "unknown path" branch would serve duplicate content with no canonical at all.
  const pathOnly = rawPath.length > 1 && rawPath.endsWith('/') ? rawPath.slice(0, -1) : rawPath;

  const blogMatch = pathOnly.match(/^\/blog\/([^/]+)\/?$/);
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[1]);
    const post = (db.blogPosts || []).find((p) => p.slug === slug || p.id === slug);
    if (post) return injectBlogHtml(html, post, origin, siteName);
  }

  const productMatch = pathOnly.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) {
    const slug = decodeURIComponent(productMatch[1]);
    const product = (db.products || []).find((p) => (p.slug === slug || p.id === slug) && p.status === 'approved' && !p.hidden);
    if (product) return injectProductHtml(html, product, origin, db);
  }

  const catMatch = pathOnly.match(/^\/category\/([^/]+)\/?$/);
  if (catMatch) {
    const slug = decodeURIComponent(catMatch[1]);
    const cat = (db.categories || []).find((c) => c.slug === slug || c.id === slug);
    if (cat) return injectCategoryHtml(html, cat, origin, db);
  }

  const vendorMatch = pathOnly.match(/^\/vendors\/([^/]+)\/?$/);
  if (vendorMatch) {
    const slug = decodeURIComponent(vendorMatch[1]);
    const vendor = (db.users || []).find(
      (u) => u.role === 'vendor' && u.status === 'approved' && vendorStoreSlug(u) === slug
    );
    if (vendor) return injectVendorHtml(html, vendor, origin, db);
  }

  return applyGenericOrigin(html, origin, pathOnly, siteName);
}

/**
 * Soft-404 guard for the SPA catch-all: a URL shaped like a content page whose slug
 * matches nothing (/product/bogus …) must answer 404, because a 200 homepage shell makes
 * Google log a soft 404 and quietly drags sitewide quality down. Plain unknown paths are
 * deliberately NOT covered — the SPA owns those, and its not-found view decides what
 * they mean. The lookups mirror the injectors above on purpose: a page that gets full
 * meta never 404s, and a page that 404s never gets full meta.
 */
const CONTENT_PATH_RE = /^\/(product|category|vendors|blog)\/([^/]+)\/?$/;
export function contentPathMissing(reqPath) {
  const m = String(reqPath || '').split('?')[0].match(CONTENT_PATH_RE);
  if (!m) return false;
  const slug = decodeURIComponent(m[2]);
  const db = readDb();
  if (m[1] === 'product') {
    return !((db.products || []).some((p) => (p.slug === slug || p.id === slug) && p.status === 'approved' && !p.hidden));
  }
  if (m[1] === 'category') {
    return !((db.categories || []).some((c) => c.slug === slug || c.id === slug));
  }
  if (m[1] === 'vendors') {
    return !((db.users || []).some((u) => u.role === 'vendor' && u.status === 'approved' && vendorStoreSlug(u) === slug));
  }
  return !((db.blogPosts || []).some((p) => p.slug === slug || p.id === slug));
}
