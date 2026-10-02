// Checks the server-rendered <head> for every page type, because WhatsApp, Facebook and X
// read the HTML the server sends and never run our JavaScript. Two origins are exercised:
//   - plain localhost (what the dev server serves, where PUBLIC_CLIENT_URL is localhost)
//   - a proxied production host (X-Forwarded-Host/Proto, as cPanel forwards it)
// so we can prove share cards follow the domain the visitor actually used.
//
// Run the API first (`npm run dev` or `npm run start` in server/), then:
//   node tools/verify-seo.mjs
// Exits non-zero if any assertion fails, so it is usable as a deploy gate.
const readFileSync = (await import('node:fs')).readFileSync;
const BASE = process.env.SEO_BASE_URL || 'http://localhost:5001';
const PROD_HOST = process.env.SEO_PROD_HOST || 'www.bigdrop.co.ke';
// Set SEO_EXPECT_NOINDEX=true when gating a phase-1 host (PHASE_NOINDEX=true on the server),
// so the deploy gate asserts noindex instead of indexable.
const EXPECT_NOINDEX = process.env.SEO_EXPECT_NOINDEX === 'true';
const STATIC_PAGES = ['/shop', '/about', '/blog', '/contact', '/help', '/fulfillment'];
const HOMEPAGE_TITLE = 'BigDrop Kenya | Online Shopping Store in Kenya';

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures += 1;
};
const show = (label, value) => console.log(`       ${label.padEnd(14)}${value}`);

const prodHeaders = { Host: PROD_HOST, 'X-Forwarded-Host': PROD_HOST, 'X-Forwarded-Proto': 'https' };

// `Connection: close` avoids stale keep-alive sockets (a freshly restarted dev server
// drops them with ECONNRESET); the retry rides out the rest. A deploy gate must not flake.
async function fetchRetry(url, opts = {}, attempts = 3) {
  const headers = { connection: 'close', ...opts.headers };
  let lastErr;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const res = await fetch(url, { ...opts, headers });
      if ([502, 503, 504].includes(res.status) && i < attempts - 1) {
        await new Promise((r) => setTimeout(r, 300 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

async function getJson(path) {
  const res = await fetchRetry(`${BASE}${path}`);
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

// fetch() forbids setting Host, but undici honours X-Forwarded-Host — which is exactly the
// header the app prefers, so the production-host cases below still resolve as proxied.
async function fetchHtml(path, headers = {}) {
  const res = await fetchRetry(`${BASE}${path}`, { headers });
  return { status: res.status, html: await res.text() };
}

const meta = (html, re) => (html.match(re) || [])[1] || '';
// Server-side values are XML-escaped on the way out (Phone & Tablet -> Phone &amp; Tablet),
// which is correct HTML — browsers and crawlers decode entities when they read the tag.
const unescapeHtml = (s) =>
  String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0*39;|&apos;/g, "'").replace(/&amp;/g, '&');
const abs = (url) => /^https?:\/\//i.test(url);
const countOf = (html, re) => (html.match(re) || []).length;

/**
 * Pull a named JSON-LD block out of the served <head>. Returns null when absent so a
 * caller can report "missing" distinctly from "wrong" — both fail, but for different reasons.
 */
function jsonLd(html, id) {
  const raw = meta(html, new RegExp(`<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i'));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// The shop API only ever returns approved, non-hidden products, so the sitemap cannot be
// cross-checked against it alone: read the catalogue directly to learn which products are
// hidden and assert none of those leaked into the sitemap. Best-effort — a missing file
// (e.g. running the gate against a deployed host) just skips those two assertions.
let hiddenSlugs = null;
try {
  const db = JSON.parse(readFileSync(new URL('../server/data/db.json', import.meta.url), 'utf8'));
  hiddenSlugs = (db.products || []).filter((p) => p.hidden).map((p) => p.slug).filter(Boolean);
} catch {
  hiddenSlugs = null;
}

const HEAD = {
  title: (h) => unescapeHtml(meta(h, /<title>([^<]*)<\/title>/i)),
  ogTitle: (h) => unescapeHtml(meta(h, /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)),
  ogUrl: (h) => meta(h, /<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']*)["']/i),
  ogImage: (h) => meta(h, /<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i),
  ogType: (h) => meta(h, /<meta[^>]*property=["']og:type["'][^>]*content=["']([^"']*)["']/i),
  ogSiteName: (h) => unescapeHtml(meta(h, /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i)),
  ogLocale: (h) => meta(h, /<meta[^>]*property=["']og:locale["'][^>]*content=["']([^"']*)["']/i),
  twitterCard: (h) => meta(h, /<meta[^>]*name=["']twitter:card["'][^>]*content=["']([^"']*)["']/i),
  twitterTitle: (h) => unescapeHtml(meta(h, /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i)),
  twitterImage: (h) => meta(h, /<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']*)["']/i),
  description: (h) => unescapeHtml(meta(h, /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)),
  canonical: (h) => meta(h, /<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i),
  viewport: (h) => meta(h, /<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']*)["']/i),
};

/**
 * Invariants that hold on every page we serve. `expectOrigin` is the host the share card
 * must point at for the request being made (localhost while developing, the real shop once
 * proxied). Page-specific assertions stay with each case below.
 */
function assertHead(html, expectOrigin) {
  const title = HEAD.title(html);
  const ogTitle = HEAD.ogTitle(html);
  const ogUrl = HEAD.ogUrl(html);
  const ogImage = HEAD.ogImage(html);
  const canonical = HEAD.canonical(html);
  const dims = countOf(html, /og:image:(?:width|height)/g);
  const ldJson = countOf(html, /application\/ld\+json/g);

  show('title', title.slice(0, 70));
  show('og:title', ogTitle.slice(0, 70));
  show('og:type', HEAD.ogType(html));
  show('og:site_name', HEAD.ogSiteName(html));
  show('og:locale', HEAD.ogLocale(html));
  show('og:url', ogUrl);
  show('og:image', ogImage);
  show('twitter:image', HEAD.twitterImage(html));
  show('canonical', canonical);
  show('json-ld blocks', String(ldJson));
  show('og:image dims', dims ? String(dims) : '(none)');

  check('has a <title>', Boolean(title));
  check('og:title present', Boolean(ogTitle));
  check('og:site_name is the brand', HEAD.ogSiteName(html) === 'BigDrop Kenya', HEAD.ogSiteName(html));
  check('og:locale is en_KE', HEAD.ogLocale(html) === 'en_KE', HEAD.ogLocale(html));
  check('twitter:title mirrors og:title', HEAD.twitterTitle(html) === ogTitle);
  check('twitter:card is summary_large_image', HEAD.twitterCard(html) === 'summary_large_image');
  check('og:url is absolute', abs(ogUrl), ogUrl);
  check('og:url is this origin', ogUrl.startsWith(expectOrigin), ogUrl);
  check('og:image absolute (chat apps reject relative paths)', abs(ogImage), ogImage);
  const imageOnThisOrigin = ogImage.includes(expectOrigin);
  const imageIsRemoteHttps = /^https:\/\//i.test(ogImage) && !/localhost|127\.0\.0\.1/i.test(ogImage);
  check('og:image is this origin or a remote https host (never localhost)', imageOnThisOrigin || imageIsRemoteHttps, ogImage);
  check('twitter:image matches og:image', HEAD.twitterImage(html) === ogImage);
  check('exactly one canonical link', countOf(html, /rel=["']canonical["']/gi) === 1);
  check('canonical matches og:url', canonical === ogUrl, canonical);
  check('<title> does not repeat the brand twice', countOf(title, /BigDrop Kenya/gi) <= 1, title.slice(0, 70));
  check('robots tag present', /<meta[^>]*name=["']robots["'][^>]*content=/i.test(html));
  check('viewport tag survived the rewrite', /width=device-width/i.test(HEAD.viewport(html)), HEAD.viewport(html));
  check('og:image dimensions are 0 or 2 (never a lone hint)', dims === 0 || dims === 2, String(dims));
}

async function assertPage(label, path, { prod }) {
  const origin = `${prod ? 'https' : 'http'}://${prod ? PROD_HOST : 'localhost:5001'}`;
  const { status, html } = await fetchHtml(path, prod ? prodHeaders : {});
  console.log(`\n=== ${label}  ${path}  [${status}]  origin=${origin} ===`);
  check('responds 200', status === 200, String(status));
  assertHead(html, origin);
  return html;
}

console.log(`BigDrop social-meta verifier -> ${BASE}\n`);

// ---- preflight -----------------------------------------------------------------------
// Every assertion below needs a live server. Without this, a dev server restarting
// (node --watch drops port 5001 for a moment) or simply not running yet surfaces
// as an opaque `TypeError: fetch failed` from whichever fetch happened to lose the
// race — which reads like a broken assertion, not a missing prerequisite. Probe
// once, and exit with an actionable message instead.
try {
  const probe = await fetchRetry(`${BASE}/api/products?limit=1`, {}, 5);
  if (!probe.ok) throw new Error(`/api/products?limit=1 -> ${probe.status}`);
} catch (err) {
  console.error(`Cannot reach the API at ${BASE}: ${err.message || err}`);
  console.error('This verifier reads the server-rendered HTML, so the server must be up first:');
  console.error('    cd server && npm run dev      # then re-run this in another terminal');
  process.exit(1);
}

// ---- data the page-specific cases need -----------------------------------------------
let products, categories, posts, stores;
try {
  products = (await getJson('/api/products?limit=1')).products || [];
  categories = (await getJson('/api/categories')).categories || [];
  posts = (await getJson('/api/blog')).posts || [];
  stores = (await getJson('/api/stores')).vendors || [];
} catch (err) {
  console.error(`The API is up but the data the assertions need could not be read: ${err.message}`);
  console.error('Failing here rather than asserting against undefined products.');
  process.exit(1);
}

// Each page type has assertions keyed off a real record; a missing one would make
// the rest of the run silently vacuous, so stop and say which feed came back empty.
const missing = [
  ['products', products.length], ['categories', categories.length],
  ['posts', posts.length], ['vendors', stores.length],
].filter(([, n]) => !n).map(([k]) => k);
if (missing.length) {
  console.error(`The API returned no ${missing.join(', ')} — the page-type assertions cannot run.`);
  console.error('Is the catalogue seeded? (cd server && npm run seed)');
  process.exit(1);
}

const product = products[0];
const category = categories.find((c) => c.slug);
const post = posts[0];
const vendor = stores[0];



// ---- generic pages -------------------------------------------------------------------
const homeProd = await assertPage('HOME', '/', { prod: true });
const homeLocal = await assertPage('HOME (localhost)', '/', { prod: false });
check('the two hosts produce different origins', homeProd !== homeLocal);
check('homepage title is the brand title', HEAD.title(homeProd) === HOMEPAGE_TITLE, HEAD.title(homeProd));
check('homepage og:title is the brand title', HEAD.ogTitle(homeProd) === HOMEPAGE_TITLE, HEAD.ogTitle(homeProd));
check('homepage canonical is self-referencing', HEAD.canonical(homeProd) === `https://${PROD_HOST}/`, HEAD.canonical(homeProd));
check('homepage share card is the 1200x630 default', HEAD.ogImage(homeProd).endsWith('/share-default.jpg'), HEAD.ogImage(homeProd));
check('homepage keeps the 1200x630 hints', countOf(homeProd, /og:image:(?:width|height)/g) === 2);

for (const page of STATIC_PAGES) {
  const { html } = await fetchHtml(page, prodHeaders);
  console.log(`\n--- static page ${page} (prod host) ---`);
  check('canonical is self-referencing', HEAD.canonical(html) === `https://${PROD_HOST}${page}`, HEAD.canonical(html));
  check('og:url matches the page path', HEAD.ogUrl(html) === `https://${PROD_HOST}${page}`, HEAD.ogUrl(html));
  check('no localhost in og:url / og:image', !/localhost|127\.0\.0\.1/i.test(HEAD.ogUrl(html) + HEAD.ogImage(html)), `${HEAD.ogUrl(html)} ${HEAD.ogImage(html)}`);
}

// A path that is not a real page must not advertise itself as canonical (Google reads a
// canonical on a soft-404 as an instruction to index junk).
const unknown = await fetchHtml('/definitely-not-a-real-page', prodHeaders);
console.log('\n--- unknown path ---');
check('unknown path still serves the SPA', unknown.status === 200, String(unknown.status));
check('unknown path gets no canonical', countOf(unknown.html, /rel=["']canonical["']/gi) === 0);
check('unknown path og:url still re-anchored', HEAD.ogUrl(unknown.html) === `https://${PROD_HOST}/definitely-not-a-real-page`, HEAD.ogUrl(unknown.html));


// ---- page-specific cases -------------------------------------------------------------
if (product?.slug) {
  const html = await assertPage('PRODUCT', `/product/${product.slug}`, { prod: true });
  check('og:type is product', HEAD.ogType(html) === 'product', HEAD.ogType(html));
  check('og:title carries the product name', HEAD.ogTitle(html).startsWith(product.name.slice(0, 20)), HEAD.ogTitle(html).slice(0, 60));
  check('og:url is this product', HEAD.ogUrl(html) === `https://${PROD_HOST}/product/${product.slug}`, HEAD.ogUrl(html));
  check('Product JSON-LD present', /"@type"\s*:\s*"Product"/.test(html));
  check('BreadcrumbList JSON-LD present', /BreadcrumbList/.test(html));
  check('real photo drops the 1200x630 hints', countOf(html, /og:image:(?:width|height)/g) === 0);

  // Product.brand is the manufacturer. It once fell back to the store name on every page
  // (productJsonLd read product.vendorName, a field the API serializer adds but the raw db
  // object never has), so a phone's structured data claimed BigDrop made it.
  const ld = jsonLd(html, 'bd-product-jsonld');
  check('Product JSON-LD parses as an object', ld && ld['@type'] === 'Product', ld ? ld['@type'] : 'unparseable/missing');
  if (ld) {
    const declared = String(product.brand || '').trim();
    const ldBrand = String((ld.brand && ld.brand.name) || '').trim();
    show('ld brand', ldBrand || '(none)');
    if (declared && !/^(big\s*drop|unbranded)$/i.test(declared)) {
      check('Product.brand is the manufacturer, not the store', ldBrand === declared, `${ldBrand} vs ${declared}`);
    }
    check('Product.brand is never the store name', !/^big\s*drop$/i.test(ldBrand), ldBrand);
    check('Product.brand is never the "Unbranded" placeholder', !/^unbranded$/i.test(ldBrand), ldBrand);
  }
} else {
  check('a product exists to verify', false, 'no approved products returned by /api/products');
}

if (category?.slug) {
  const html = await assertPage('CATEGORY', `/category/${category.slug}`, { prod: true });
  check('og:type is website', HEAD.ogType(html) === 'website', HEAD.ogType(html));
  check('og:title carries the category name', HEAD.ogTitle(html).startsWith(category.name.slice(0, 12)), HEAD.ogTitle(html).slice(0, 60));
  check('og:url is this category', HEAD.ogUrl(html) === `https://${PROD_HOST}/category/${category.slug}`, HEAD.ogUrl(html));
  // A category tile is square, not a 1200x630 card, so the hints must go.
  check('category tile drops the 1200x630 hints', countOf(html, /og:image:(?:width|height)/g) === 0);
} else {
  check('a category exists to verify', false, 'no categories returned by /api/categories');
}

if (post?.slug) {
  const html = await assertPage('BLOG', `/blog/${post.slug}`, { prod: true });
  check('og:type is article', HEAD.ogType(html) === 'article', HEAD.ogType(html));
  check('og:title carries the post title', HEAD.ogTitle(html).startsWith(post.title.slice(0, 12)), HEAD.ogTitle(html).slice(0, 60));
  check('Article JSON-LD present', /"@type"\s*:\s*"Article"/.test(html));
} else {
  check('a published post exists to verify', false, 'no posts returned by /api/blog');
}

if (vendor?.slug) {
  const html = await assertPage('VENDOR SHOP', `/vendors/${vendor.slug}`, { prod: true });
  check('og:title carries the store name', HEAD.ogTitle(html).startsWith(vendor.storeName.slice(0, 10)), HEAD.ogTitle(html).slice(0, 60));
  check('og:url is this vendor shop', HEAD.ogUrl(html) === `https://${PROD_HOST}/vendors/${vendor.slug}`, HEAD.ogUrl(html));
  check('description mentions the stock count', /Shop \d+ products? from/.test(HEAD.description(html)), HEAD.description(html).slice(0, 80));
  check('share image is a product from this shop', HEAD.ogImage(html).includes('/uploads/products/'), HEAD.ogImage(html));
} else {
  check('a vendor shop exists to verify', false, 'no approved stores with stock returned by /api/stores');
}

// ---- soft 404s + trailing-slash variants ---------------------------------------------
// A content URL whose slug matches nothing must answer real 404 (never a 200 shell),
// and '/shop/' must carry the identical head to '/shop' instead of falling through to
// the anonymous unknown-path treatment.
console.log('\n=== soft-404 guard ===');
for (const path of ['/product/bogus-slug', '/category/nope', '/vendors/nope', '/blog/nope']) {
  const res = await fetch(`${BASE}${path}`, { headers: prodHeaders });
  check(`${path} answers 404`, res.status === 404, String(res.status));
}
if (product?.slug) {
  const real = await fetch(`${BASE}/product/${product.slug}`, { headers: prodHeaders });
  check('a real product still answers 200', real.status === 200, String(real.status));
}

const slash = await assertPage('TRAILING SLASH', '/shop/', { prod: true });
check('trailing-slash canonical matches /shop', HEAD.canonical(slash) === `https://${PROD_HOST}/shop`, HEAD.canonical(slash));
  if (EXPECT_NOINDEX) {
    check(
      'trailing-slash page is noindexed (phase hosting)',
      /name=["']robots["'][^>]*content=["']noindex/.test(slash)
    );
  } else {
    check('trailing-slash page is indexable', /name=["']robots["'][^>]*content=["']index, follow["']/.test(slash));
  }

// ---- sitemap + robots ----------------------------------------------------------------
console.log('\n=== sitemap.xml (prod host) ===');
const sitemap = await (await fetchRetry(`${BASE}/sitemap.xml`, { headers: prodHeaders })).text();
const locs = (sitemap.match(/<loc>([^<]+)<\/loc>/g) || []).map((s) => s.replace(/<\/?loc>/g, ''));
show('url count', String(locs.length));
show('first url', locs[0] || '');
check('sitemap is a complete urlset', sitemap.includes('<urlset') && sitemap.includes('</urlset>'));
check('no localhost leaked into the sitemap', !/localhost|127\.0\.0\.1/i.test(sitemap));
const stray = locs.find((u) => !u.startsWith(`https://${PROD_HOST}/`));
check('every url is on the production origin', !stray, stray || '');
check('no duplicate urls', new Set(locs).size === locs.length);
check('homepage is listed first with top priority', locs[0] === `https://${PROD_HOST}/`);
if (product?.slug) check('product url is listed', locs.includes(`https://${PROD_HOST}/product/${product.slug}`));

// A hidden product 404s, so listing one in the sitemap hands Google a dead URL and invites
// the "submitted URL not found" penalty. The product loop used to check only status.
if (hiddenSlugs) {
  show('hidden products', String(hiddenSlugs.length));
  const leaked = hiddenSlugs.filter((s) => locs.includes(`https://${PROD_HOST}/product/${s}`));
  check('no hidden product url is listed in the sitemap', leaked.length === 0, leaked.slice(0, 3).join(', '));
  const productLocs = locs.filter((u) => u.includes('/product/')).length;
  const shoppable = (await getJson('/api/products?limit=1')).count;
  show('sitemap product urls', String(productLocs));
  show('shoppable products', String(shoppable));
  check('sitemap lists no more products than the shop serves', productLocs <= shoppable, `${productLocs} > ${shoppable}`);
} else {
  console.log('       (db.json unavailable — skipped the hidden-product sitemap assertions)');
}
if (category?.slug) check('category url is listed', locs.includes(`https://${PROD_HOST}/category/${category.slug}`));
if (post?.slug) check('blog url is listed', locs.includes(`https://${PROD_HOST}/blog/${post.slug}`));
if (vendor?.slug) check('vendor shop url is listed', locs.includes(`https://${PROD_HOST}/vendors/${vendor.slug}`));

console.log('\n=== robots.txt ===');
const robots = await (await fetchRetry(`${BASE}/robots.txt`, { headers: prodHeaders })).text();
for (const line of robots.split('\n')) show('', line);
check('robots points at the production sitemap', robots.includes(`Sitemap: https://${PROD_HOST}/sitemap.xml`));
check('robots keeps accounts out of the index', /Disallow: \/dashboard/.test(robots));

// ---- 301 redirects & consolidations --------------------------------------------------
console.log('\n=== 301 redirects & consolidations ===');
for (const [from, target] of [
  ['/about-us', '/about'],
  ['/faq', '/help'],
  ['/contact-us', '/contact'],
  ['/help-center', '/help'],
  ['/offers', '/deals'],
  ['/shipping', '/fulfillment'],
  ['/sell-on-bigdrop', '/sell'],
]) {
  const res = await fetchRetry(`${BASE}${from}`, { headers: prodHeaders, redirect: 'manual' });
  check(`legacy alias ${from} 301s to ${target}`, res.status === 301 && res.headers.get('location') === target, `${res.status} -> ${res.headers.get('location')}`);
}

const shopCatRes = await fetchRetry(`${BASE}/shop?category=food-drinks`, { headers: prodHeaders, redirect: 'manual' });
check(
  '/shop?category=food-drinks 301s to /category/food-drinks',
  shopCatRes.status === 301 && shopCatRes.headers.get('location') === '/category/food-drinks',
  `${shopCatRes.status} -> ${shopCatRes.headers.get('location')}`
);

// ---- static page unique titles & utility noindex ------------------------------------
console.log('\n=== unique titles & utility noindex ===');
const aboutRes = await fetchHtml('/about', prodHeaders);
check(
  '/about has unique title (not homepage title)',
  HEAD.title(aboutRes.html) !== HOMEPAGE_TITLE && HEAD.title(aboutRes.html).includes('About Us'),
  HEAD.title(aboutRes.html)
);

for (const util of ['/cart', '/wishlist', '/compare', '/order-success', '/reset-password']) {
  const { html } = await fetchHtml(util, prodHeaders);
  check(`${util} carries noindex`, /name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html));
  check(`${util} has no canonical link`, countOf(html, /rel=["']canonical["']/gi) === 0);
}

const trackPage = await fetchHtml('/track', prodHeaders);
check(
  '/track has unique title (not homepage title)',
  HEAD.title(trackPage.html) !== HOMEPAGE_TITLE && /Track/i.test(HEAD.title(trackPage.html)),
  HEAD.title(trackPage.html)
);
check('/track is indexable', /name=["']robots["'][^>]*content=["']index, follow["']/.test(trackPage.html));
check('/track canonical is self-referencing', HEAD.canonical(trackPage.html) === `https://${PROD_HOST}/track`, HEAD.canonical(trackPage.html));

const homeOrg = jsonLd(homeProd, 'bd-org-jsonld');
const homeWeb = jsonLd(homeProd, 'bd-website-jsonld');
check('homepage Organization JSON-LD present', homeOrg && homeOrg['@type'] === 'Organization', homeOrg ? homeOrg['@type'] : 'missing');
check('homepage WebSite JSON-LD present', homeWeb && homeWeb['@type'] === 'WebSite', homeWeb ? homeWeb['@type'] : 'missing');
check('homepage has a crawler-visible H1', /<h1[\s>]/i.test(homeProd));
check(
  'homepage description does not advertise card payments',
  !/\bor card\b|& card|card accepted|card payment/i.test(HEAD.description(homeProd)),
  HEAD.description(homeProd).slice(0, 120)
);

console.log('\n=== share & icon assets ===');
const shareRes = await fetchRetry(`${BASE}/share-default.jpg`, { headers: prodHeaders });
check('share-default.jpg is served', shareRes.status === 200, String(shareRes.status));
check('share-default.jpg is a JPEG', /image\/jpeg/i.test(shareRes.headers.get('content-type') || ''), shareRes.headers.get('content-type') || '');
const iconRes = await fetchRetry(`${BASE}/icon-512.png`, { headers: prodHeaders });
check('icon-512.png is served', iconRes.status === 200, String(iconRes.status));

console.log(`\n${failures === 0 ? 'PASS — all assertions hold' : `FAIL — ${failures} assertion(s) failed`}`);
process.exitCode = failures === 0 ? 0 : 1;
