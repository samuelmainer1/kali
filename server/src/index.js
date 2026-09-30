import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import routes from './routes.js';
import extraRoutes from './extraRoutes.js';
import { initDb, readDb, writeDb } from './db.js';
import { uploadsRoot } from './uploads.js';
import { hydratePaymentsFromDb } from './payments.js';
import { remapDeadUnsplash, remapInvoiceThankYou, remapGoLiveCustomerCopy, hideProductsWithoutImages, DEFAULT_FAQS } from './commerce.js';
import { buildRobotsTxt, buildSitemapXml, injectIndexHtml, contentPathMissing } from './seo.js';
import { validateRuntimeConfig } from './runtimeConfig.js';
import { mailConfigured } from './mailer.js';

const runtimeConfig = validateRuntimeConfig();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const LIVE_ADMIN_EMAIL = 'info@bigdrop.co.ke';
const DEMO_ADMIN_EMAIL = 'admin@bigdrop.co.ke';
const REQUEST_LIMITS = new Map();

function corsOrigins() {
  const listed = [process.env.CLIENT_ORIGIN, process.env.PUBLIC_CLIENT_URL]
    .filter(Boolean)
    .flatMap((s) => String(s).split(','))
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
  return [...new Set([
    ...listed,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://shop.bigdrop.co.ke',
    'https://bigdrop.co.ke',
    'https://www.bigdrop.co.ke',
  ])];
}

// Behind a reverse proxy (cPanel/Oracom) the socket IP is the proxy itself, so the
// real client IP arrives in X-Forwarded-For. Only honour that header when TRUST_PROXY
// is explicitly set — otherwise anyone could spoof a fresh IP per request and bypass
// the rate limiter.
const TRUST_PROXY = String(process.env.TRUST_PROXY || '').trim().toLowerCase() === 'true';

function getClientIp(req) {
  if (TRUST_PROXY) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

function rateLimit(maxRequests = 120, windowMs = 60_000) {
  return (req, res, next) => {
    const ip = getClientIp(req);
    const now = Date.now();
    const current = REQUEST_LIMITS.get(ip) || { count: 0, resetAt: now + windowMs };

    if (now > current.resetAt) {
      current.count = 0;
      current.resetAt = now + windowMs;
    }

    current.count += 1;
    REQUEST_LIMITS.set(ip, current);

    if (current.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests. Please wait a moment and try again.' });
    }

    next();
  };
}

// Evict stale entries so the limiter map cannot grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of REQUEST_LIMITS) {
    if (now > entry.resetAt + 5 * 60_000) REQUEST_LIMITS.delete(ip);
  }
}, 60_000).unref();

function remapAdminLoginEmail(db) {
  const users = db.users || [];
  const admin =
    users.find((u) => u.role === 'admin' && (u.email === DEMO_ADMIN_EMAIL || u.id === 'usr_admin')) ||
    users.find((u) => u.role === 'admin');
  if (!admin || admin.email === LIVE_ADMIN_EMAIL) return false;
  const occupied = users.find((u) => u.email === LIVE_ADMIN_EMAIL && u.id !== admin.id);
  if (occupied) occupied.email = `shopper-${occupied.email}`;
  admin.email = LIVE_ADMIN_EMAIL;
  return true;
}

await initDb();

// Seed only a brand-new empty database. Never overwrite live products, blogs, or banners.
const db = readDb();
const isFresh =
  !db.products?.length &&
  !(db.users || []).some((u) => u.role === 'admin') &&
  !(db.blogPosts || []).length;
if (isFresh) {
  await import('./seed.js');
}

const liveDb = readDb();
let patched = remapDeadUnsplash(liveDb);
if (!liveDb.faqs?.length) {
  liveDb.faqs = DEFAULT_FAQS;
  patched = true;
}
liveDb.site = liveDb.site || {};
if (!liveDb.site.payments) {
  liveDb.site.payments = { mpesa: true, card: true, cod: false };
  patched = true;
}
if (remapAdminLoginEmail(liveDb)) patched = true;
if (remapInvoiceThankYou(liveDb)) patched = true;
if (remapGoLiveCustomerCopy(liveDb)) patched = true;
if (hideProductsWithoutImages(liveDb)) patched = true;
if (patched) writeDb(liveDb);

// In-flight payment records must survive restarts (M-Pesa callbacks, confirm polling).
hydratePaymentsFromDb();

// Go-live guard: shout if the admin still uses the well-known demo password.
if (runtimeConfig.isProduction) {
  const admin = (liveDb.users || []).find((u) => u.role === 'admin');
  if (admin?.password && (await bcrypt.compare('password123', admin.password))) {
    console.error(
      'SECURITY WARNING: the admin account still uses the demo password "password123". ' +
        'Sign in and change it before going live — the shop will require a new password.'
    );
  }
  if (!mailConfigured()) {
    console.error(
      'OPS WARNING: SMTP is not configured. Welcome mail, invoices, password resets, and order emails will only log to the console until SMTP_HOST and SMTP_FROM are set.'
    );
  }
}

const app = express();
app.disable('x-powered-by');

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (corsOrigins().includes(origin)) return callback(null, true);
    if (runtimeConfig.isProduction) {
      return callback(new Error(`Origin not allowed by CORS: ${origin}`));
    }
    return callback(null, true);
  },
  credentials: true,
}));

// 8MB covers hero images sent as base64 data URLs (2MB limit per image);
// the old 32MB limit was an easy memory-amplification DoS vector.
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
// Gracefully handle malformed request bodies (bad JSON, wrong content-type)
// instead of crashing the process.
app.use((err, req, res, next) => {
  if (err && (err.type === 'entity.parse.failed' || (err.status === 400 && err instanceof SyntaxError))) {
    return res.status(400).json({ error: 'Invalid request body' });
  }
  next(err);
});

// Baseline security headers (no CSP on purpose: the storefront injects inline SEO tags).
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  if (runtimeConfig.isProduction) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});
// Phase-1 hosting toggle (e.g. shop.bigdrop.co.ke before the real domain): when
// PHASE_NOINDEX=true the whole storefront is kept out of search indexes via
// X-Robots-Tag plus a noindex meta tag, so Google only ever learns the final domain.
if (String(process.env.PHASE_NOINDEX || '').trim().toLowerCase() === 'true') {
  app.use((_req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    next();
  });
}
app.use('/api/auth', rateLimit(20, 60_000));
// Scoped to the API: page loads pull a dozen+ static files each, and those must
// never eat into a shopper's request budget.
app.use('/api', rateLimit(180, 60_000));

const uploadsDir = uploadsRoot;
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir, { maxAge: '1h', etag: true, lastModified: true }));

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    mode: runtimeConfig.isProduction ? 'production' : 'development',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', extraRoutes);
app.use('/api', routes);

app.get('/sitemap.xml', (req, res) => {
  res.type('application/xml').send(buildSitemapXml(req));
});
app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(buildRobotsTxt(req));
});

// ---------------------------------------------------------------------------
// 301 consolidations. Two groups:
//  1. Legacy/alias paths (old WordPress URLs + client-side <Navigate> routes) so
//     link equity lands on the one true URL instead of a JS-only redirect.
//  2. /shop?category=slug — the same content as /category/slug, which is what the
//     sitemap and the JSON-LD breadcrumbs point at. Old bookmarks, homepage banner
//     hrefs stored in the DB and any stray links all consolidate there. Other query
//     params (brand, minRating, q, page) survive the redirect.
// Registered before the SPA catch-all; Express route matching ignores the query
// string, so app.get('/shop') only ever fires for the query form we handle here.
const PAGE_ALIASES = {
  '/faq': '/help',
  '/about-us': '/about',
  '/contact-us': '/contact',
  '/help-center': '/help',
  '/offers': '/deals',
  '/shipping': '/fulfillment',
  '/sell-on-bigdrop': '/sell',
};
for (const [from, to] of Object.entries(PAGE_ALIASES)) {
  app.get(from, (_req, res) => res.redirect(301, to));
}
app.get('/shop', (req, res, next) => {
  const cat = typeof req.query.category === 'string' ? req.query.category.trim() : '';
  if (!cat) return next();
  const rest = new URLSearchParams(req.query);
  rest.delete('category');
  const qs = rest.toString();
  res.redirect(301, `/category/${encodeURIComponent(cat)}${qs ? `?${qs}` : ''}`);
});

const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist, { index: false }));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const htmlPath = path.join(clientDist, 'index.html');
    try {
      const html = fs.readFileSync(htmlPath, 'utf8');
      // The SPA shell still renders (its not-found view runs client-side), but a content
      // URL whose slug matches nothing answers 404 so crawlers never log a soft 404.
      res.status(contentPathMissing(req.path) ? 404 : 200).type('html').send(injectIndexHtml(html, req.path, req));
    } catch (err) {
      next(err);
    }
  });
}

app.use((err, _req, res, _next) => {
  if (err && typeof err.message === 'string' && err.message.startsWith('Origin not allowed by CORS')) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
  process.exitCode = 1;
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exitCode = 1;
});

app.listen(PORT, () => {
  console.log(`BigDrop API running on http://localhost:${PORT}`);
});
