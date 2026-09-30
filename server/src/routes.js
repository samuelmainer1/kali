import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';
import { readDb, updateDb, actorFrom } from './db.js';
import { authRequired, requireRole, signToken, authOptional } from './auth.js';
import { persistImages, saveDataUrl, deleteLocalUpload, deleteLocalUploads, DEFAULT_HEROES, DEFAULT_JOBS } from './uploads.js';
import crypto from 'crypto';
import { sendWelcomeEmail, sendMail, sendPurchaseNotifications } from './mailer.js';
import { paymentStatus, reservePayment, releasePayment } from './payments.js';
import {
  parseSpecifications,
  parseVariants,
  findCoupon,
  quoteDelivery,
  PICKUP_POINTS,
  DEFAULT_HOME_BLOCKS,
  DEFAULT_FAQS,
  FEATURED_CATEGORY_SLUGS,
  SAME_DAY_SLOTS,
  statusNotifyCopy,
  defaultVendorHours,
  vendorIsOpen,
  countyFeesFrom,
  DEFAULT_SOCIALS,
  DEFAULT_NOTIFY_TEMPLATES,
  DEFAULT_SELL_PAGE,
  DEFAULT_NAV_MENUS,
  DEFAULT_DELIVERY_COPY,
  DEFAULT_LETTERHEAD,
  DEFAULT_ANNOUNCEMENT,
  normalizeNavMenus,
  normalizeLetterhead,
  normalizeDeliveryCopy,
  normalizeAnnouncement,
  vendorStoreSlug,
  resolveProductSku,
  skuTakenSet,
} from './commerce.js';

const router = Router();
const publicCache = new Map();
const PUBLIC_CACHE_TTL_MS = 60_000;

// Per-account brute-force lockout (in-memory; resets on server restart).
const LOGIN_MAX_FAILURES = 5;
const LOGIN_LOCK_MS = 10 * 60 * 1000;
const loginAttempts = new Map();

function getPublicCacheKey(req) {
  return `${req.method}:${req.originalUrl}`;
}

function withPublicCache(req, res, ttlMs, handler) {
  const key = getPublicCacheKey(req);
  const cached = publicCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.set('X-Cache', 'HIT');
    return res.json(cached.payload);
  }

  const sendJson = res.json.bind(res);
  res.json = (payload) => {
    publicCache.set(key, { payload, expiresAt: Date.now() + (ttlMs || PUBLIC_CACHE_TTL_MS) });
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.set('X-Cache', 'MISS');
    return sendJson(payload);
  };

  return handler();
}

function publicUser(user) {
  const { password, ...safe } = user;
  return safe;
}

async function publicUserWithFlags(user) {
  const safe = publicUser(user);
  if (!user?.password) return { ...safe, mustChangePassword: false };
  const demo = await bcrypt.compare('password123', user.password);
  return { ...safe, mustChangePassword: demo };
}

function generateTracking() {
  return 'GF' + nanoid(9).toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 9);
}

function generateOrderNumber() {
  return 'BD' + Date.now().toString().slice(-8) + nanoid(3).toUpperCase();
}

function slugify(name) {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    nanoid(4)
  );
}

function blogSlugBase(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 80) || 'article';
}

function formatKES(n) {
  return `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
}

function uniqueBlogSlug(desired, posts, excludeId) {
  let slug = blogSlugBase(desired);
  const taken = (s) => (posts || []).some((p) => p.slug === s && p.id !== excludeId);
  if (!taken(slug)) return slug;
  let i = 2;
  while (taken(`${slug}-${i}`)) i += 1;
  return `${slug}-${i}`;
}

function parseBlogTags(tags) {
  if (Array.isArray(tags)) return tags.map((t) => String(t).trim()).filter(Boolean);
  return String(tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function enrichProduct(product, db) {
  const vendor = db.users.find((u) => u.id === product.vendorId);
  const category = db.categories.find((c) => c.id === product.categoryId);
  const reviewList = (product.reviewList || []).filter((r) => !r.status || r.status === 'approved');
  return {
    ...product,
    reviewList,
    vendorName: vendor?.storeName || vendor?.name || 'BigDrop Vendor',
    vendorStatus: vendor?.status,
    vendorSlug: vendorStoreSlug(vendor),
    categoryName: category?.name,
    categorySlug: category?.slug,
  };
}

function stripReviewUrls(text) {
  return String(text || '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/\bwww\.\S+/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function approvedReviews(list) {
  return (list || []).filter((r) => !r.status || r.status === 'approved');
}

function pendingReviewCount(db) {
  let n = 0;
  for (const p of db.products || []) {
    n += (p.reviewList || []).filter((r) => r.status === 'pending').length;
  }
  return n;
}

function listApproved(db) {
  return db.products.filter((p) => p.status === 'approved' && !p.hidden);
}

function relatedProducts(product, db, limit = 8) {
  return listApproved(db)
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId)
    .sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0))
    .slice(0, limit)
    .map((p) => enrichProduct(p, db));
}

function alsoBoughtProducts(product, db, limit = 8) {
  const sameCat = listApproved(db).filter((p) => p.id !== product.id && p.categoryId === product.categoryId);
  const other = listApproved(db).filter((p) => p.id !== product.id && p.categoryId !== product.categoryId);
  const mix = [
    ...sameCat.sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 5),
    ...other.sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(0, 5),
  ];
  const seen = new Set();
  return mix
    .filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    })
    .slice(0, limit)
    .map((p) => enrichProduct(p, db));
}

// (Fabricated "recent purchase" social-proof notifications were removed —
// showing fake buyers is misleading and a consumer-protection risk.)

// ─── Auth ───────────────────────────────────────────────
router.post('/auth/register', async (req, res) => {
  const { name, email, password, phone, role = 'customer', storeName, businessNote } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password === 'password123') {
    return res.status(400).json({ error: 'Choose a password that is not the demo password.' });
  }
  const allowedRoles = ['customer', 'vendor'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  if (role === 'vendor' && !storeName) {
    return res.status(400).json({ error: 'Store name required for vendors' });
  }

  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const user = {
    id: 'usr_' + nanoid(10),
    name,
    email: email.toLowerCase(),
    password: await bcrypt.hash(password, 10),
    role,
    phone: phone || '',
    storeName: role === 'vendor' ? storeName : undefined,
    businessNote: role === 'vendor' ? businessNote || '' : undefined,
    // Customers are active immediately; vendors await admin approval
    status: role === 'vendor' ? 'pending' : 'approved',
    wishlist: [],
    createdAt: new Date().toISOString(),
  };

  updateDb((d) => {
    d.users.push(user);
  });

  sendWelcomeEmail(user).catch(() => {});

  const token = signToken(user);
  res.status(201).json({
    token,
    user: publicUser(user),
    message:
      role === 'vendor'
        ? 'Vendor application submitted. An admin will approve your store before you can list products.'
        : 'Account created successfully.',
  });
});

router.post('/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const emailKey = String(email).trim().toLowerCase();
  const now = Date.now();
  const attempt = loginAttempts.get(emailKey);
  if (attempt?.lockedUntil > now) {
    const mins = Math.max(1, Math.ceil((attempt.lockedUntil - now) / 60000));
    return res.status(429).json({ error: `Too many failed attempts. Try again in ${mins} minute(s).` });
  }
  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === emailKey);
  const failLogin = () => {
    const count = (loginAttempts.get(emailKey)?.count || 0) + 1;
    loginAttempts.set(emailKey, {
      count,
      lockedUntil: count >= LOGIN_MAX_FAILURES ? now + LOGIN_LOCK_MS : 0,
    });
    return res.status(401).json({ error: 'Invalid email or password' });
  };
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return failLogin();
  }
  loginAttempts.delete(emailKey);
  if (user.status === 'suspended') {
    return res.status(403).json({ error: 'This account is suspended. Contact BigDrop support.' });
  }
  if (user.role === 'vendor' && user.status === 'rejected') {
    return res.status(403).json({ error: 'Your vendor application was rejected. Contact BigDrop support.' });
  }
  res.json({ token: signToken(user), user: await publicUserWithFlags(user) });
});

router.get('/auth/me', authRequired, async (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(401).json({ error: 'User not found' });
  res.json({ user: await publicUserWithFlags(user) });
});

router.post('/auth/forgot', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email);
  const okMsg = { ok: true, message: 'If that email is registered, we sent a reset link.' };
  if (!user) return res.json(okMsg);
  const token = crypto.randomBytes(24).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  updateDb((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (!u) return;
    u.resetTokenHash = hash;
    u.resetTokenExpires = Date.now() + 60 * 60 * 1000;
  });
  const base = process.env.PUBLIC_CLIENT_URL || process.env.CLIENT_ORIGIN || 'http://localhost:5173';
  const link = `${base.replace(/\/$/, '')}/reset-password?token=${token}`;
  await sendMail({
    to: user.email,
    subject: 'Reset your BigDrop password',
    text: `Hi ${user.name},\n\nReset your password using this link (valid 1 hour):\n${link}\n\nIf you did not ask for this, ignore this email.\n\nBigDrop Kenya`,
  }).catch((err) => console.error('Reset email failed:', err.message));
  res.json(okMsg);
});

router.post('/auth/reset', async (req, res) => {
  const token = String(req.body?.token || '');
  const password = String(req.body?.password || '');
  if (!token || password.length < 6) {
    return res.status(400).json({ error: 'Token and a password of at least 6 characters are required' });
  }
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const db = readDb();
  const user = db.users.find((u) => u.resetTokenHash === hash && u.resetTokenExpires > Date.now());
  if (!user) return res.status(400).json({ error: 'This reset link is invalid or has expired' });
  const passwordHash = await bcrypt.hash(password, 10);
  updateDb((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (!u) return;
    u.password = passwordHash;
    delete u.resetTokenHash;
    delete u.resetTokenExpires;
  });
  res.json({ ok: true, message: 'Password updated. You can log in now.' });
});

router.post('/auth/password', authRequired, async (req, res) => {
  const current = String(req.body?.currentPassword || '');
  const next = String(req.body?.newPassword || '');
  if (next.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters' });
  }
  if (next === 'password123') {
    return res.status(400).json({ error: 'Choose a password that is not the demo password.' });
  }
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  if (!user || !(await bcrypt.compare(current, user.password))) {
    return res.status(401).json({ error: 'Current password is incorrect' });
  }
  const passwordHash = await bcrypt.hash(next, 10);
  updateDb((d) => {
    const u = d.users.find((x) => x.id === user.id);
    if (u) u.password = passwordHash;
  });
  const updated = { ...user, password: passwordHash };
  res.json({ ok: true, message: 'Password updated.', user: await publicUserWithFlags(updated) });
});

router.get('/site', (req, res) => {
  return withPublicCache(req, res, 60_000, () => {
    const db = readDb();
    const site = db.site || {};
    res.json({
      site: {
        ...site,
        heroes: site.heroes?.length ? site.heroes : DEFAULT_HEROES,
        homeBlocks: { ...DEFAULT_HOME_BLOCKS, ...(site.homeBlocks || {}) },
        featuredCategorySlugs: site.featuredCategorySlugs?.length
          ? site.featuredCategorySlugs
          : FEATURED_CATEGORY_SLUGS,
        flashEndsAt: site.flashEndsAt || null,
        whatsapp: site.whatsapp || '254722359298',
        paybill: site.paybill || paymentStatus().paybill,
        pickupPoints: PICKUP_POINTS,
        slots: [],
        faqs: Array.isArray(db.faqs) && db.faqs.length ? db.faqs : DEFAULT_FAQS,
        emails: site.emails?.length ? site.emails : ['info@bigdrop.co.ke', 'orders@bigdrop.co.ke'],
        phone: site.phone || '+254 722 359 298',
        address: site.address || 'NextGen Mall, 3rd Floor, Suite 40, Nairobi, Kenya',
        hours: site.hours || '24 Hours',
        deliveryFee: site.deliveryFee ?? 280,
        freeDeliveryMin: site.freeDeliveryMin || 10000,
        commissionRate: site.commissionRate ?? 0.15,
        payments: {
          ...paymentStatus(),
          mpesaEnabled: site.payments?.mpesa !== false,
          cardEnabled: site.payments?.card !== false,
          codEnabled: site.payments?.cod === true,
        },
        socials: { ...DEFAULT_SOCIALS, ...(site.socials || {}) },
        logo: site.logo || '/logo-header.png',
        favicon: site.favicon || '/favicon.ico',
        pickupText: site.pickupText || PICKUP_POINTS[0]?.address || 'Nextgen Mall, 3rd Floor, Suite 40.',
        cookieText: site.cookieText || '',
        blackFriday: {
          enabled: site.blackFriday?.enabled !== false,
          title: site.blackFriday?.title || 'Black Friday',
        },
        footerBlurb: site.footerBlurb || '',
        copyright: site.copyright || '',
        sellPage: { ...DEFAULT_SELL_PAGE, ...(site.sellPage || {}) },
        notifyTemplates: { ...DEFAULT_NOTIFY_TEMPLATES, ...(site.notifyTemplates || {}) },
        gaId: site.gaId || '',
        metaPixelId: site.metaPixelId || '',
        gscVerification: site.gscVerification || '',
        deliveryCopy: normalizeDeliveryCopy(site.deliveryCopy || DEFAULT_DELIVERY_COPY),
        letterhead: normalizeLetterhead(site.letterhead || DEFAULT_LETTERHEAD),
        announcement: normalizeAnnouncement(site.announcement || DEFAULT_ANNOUNCEMENT),
        menus: site.menus ? normalizeNavMenus(site.menus) : DEFAULT_NAV_MENUS,
        promoBanners: Array.isArray(site.promoBanners) ? site.promoBanners : [],
      },
      testimonials: db.testimonials || [],
    });
  });
});

router.get('/stores', (req, res) => {
  return withPublicCache(req, res, 60_000, () => {
    const db = readDb();
    const vendors = db.users
      .filter((u) => u.role === 'vendor' && u.status === 'approved')
      .map((v) => {
        const products = listApproved(db).filter((p) => p.vendorId === v.id);
        return {
          id: v.id,
          storeName: v.storeName || v.name,
          slug: vendorStoreSlug(v),
          productCount: products.length,
        };
      })
      .filter((v) => v.productCount > 0);
    res.json({ vendors });
  });
});

router.get('/stores/:slug', (req, res) => {
  const db = readDb();
  const vendor = db.users.find(
    (u) => u.role === 'vendor' && u.status === 'approved' && vendorStoreSlug(u) === req.params.slug
  );
  if (!vendor) return res.status(404).json({ error: 'Vendor shop not found' });
  const products = listApproved(db)
    .filter((p) => p.vendorId === vendor.id)
    .map((p) => enrichProduct(p, db));
  const hours = vendor.hours || defaultVendorHours();
  res.json({
    vendor: {
      id: vendor.id,
      storeName: vendor.storeName || vendor.name,
      name: vendor.name,
      slug: vendorStoreSlug(vendor),
      hours,
      openNow: vendorIsOpen(hours),
    },
    products,
  });
});

router.patch('/admin/site', authRequired, requireRole('admin'), (req, res) => {
  const { heroes, promoBanners } = req.body || {};
  if (!Array.isArray(heroes) && !Array.isArray(promoBanners)) {
    return res.status(400).json({ error: 'heroes or promoBanners is required' });
  }
  let savedHeroes;
  let savedPromos;
  try {
    if (Array.isArray(heroes)) {
      const previous = readDb().site?.heroes || [];
      savedHeroes = heroes.map((h, i) => ({
        id: h.id || `hero_${nanoid(6)}`,
        title: String(h.title || '').trim() || `Slide ${i + 1}`,
        text: String(h.text || '').trim(),
        href: String(h.href || '/shop').trim() || '/shop',
        cta: String(h.cta || 'Shop Now').trim() || 'Shop Now',
        gradient: String(h.gradient || '').trim(),
        image: saveDataUrl(h.image || '', 'heroes') || '',
        fullBleed: h.fullBleed === true,
      }));
      const nextImages = new Set(savedHeroes.map((h) => h.image));
      previous.forEach((h) => {
        if (h.image && !nextImages.has(h.image)) deleteLocalUpload(h.image);
      });
    }
    if (Array.isArray(promoBanners)) {
      const previous = readDb().site?.promoBanners || [];
      savedPromos = promoBanners.map((h, i) => ({
        id: h.id || `promo_${nanoid(6)}`,
        title: String(h.title || '').trim(),
        text: String(h.text || '').trim(),
        href: String(h.href || '/shop').trim() || '/shop',
        cta: String(h.cta || 'Shop Now').trim() || 'Shop Now',
        image: saveDataUrl(h.image || '', 'heroes') || '',
      }));
      const nextImages = new Set(savedPromos.map((h) => h.image));
      previous.forEach((h) => {
        if (h.image && !nextImages.has(h.image)) deleteLocalUpload(h.image);
      });
    }
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Could not save banner image' });
  }
  updateDb((d) => {
    d.site = d.site || {};
    if (savedHeroes) d.site.heroes = savedHeroes;
    if (savedPromos) d.site.promoBanners = savedPromos;
  });
  const site = readDb().site || {};
  res.json({ site: { ...site, heroes: site.heroes || savedHeroes, promoBanners: site.promoBanners || savedPromos || [] } });
});

router.get('/categories', authOptional, (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    return withPublicCache(req, res, 60_000, () => {
      let list = readDb().categories || [];
      list = list.filter((c) => !c.hidden);
      res.json({ categories: list });
    });
  }

  let list = readDb().categories || [];
  res.json({ categories: list });
});

router.get('/blog', (req, res) => {
  return withPublicCache(req, res, 60_000, () => {
    const posts = [...(readDb().blogPosts || [])]
      .filter((p) => p.published !== false)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    res.json({ posts });
  });
});

router.get('/admin/blog', authRequired, requireRole('admin'), (_req, res) => {
  const posts = [...(readDb().blogPosts || [])].sort(
    (a, b) => new Date(b.publishedAt || b.updatedAt || 0) - new Date(a.publishedAt || a.updatedAt || 0)
  );
  res.json({ posts });
});

router.get('/blog/:slug', authOptional, (req, res) => {
  const post = (readDb().blogPosts || []).find((p) => p.slug === req.params.slug || p.id === req.params.slug);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  if (post.published === false && req.user?.role !== 'admin') {
    return res.status(404).json({ error: 'Post not found' });
  }
  res.json({ post });
});

router.post('/admin/blog', authRequired, requireRole('admin'), (req, res) => {
  const { title, excerpt, content, image, author, tags, published, slug, metaDescription, imageAlt, ctaLabel, ctaUrl } =
    req.body || {};
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  let imageUrl = image || '';
  try {
    if (imageUrl) imageUrl = saveDataUrl(imageUrl, 'blog');
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Could not save image' });
  }
  const db = readDb();
  const isLive = published !== false;
  const post = {
    id: 'blog_' + nanoid(8),
    slug: uniqueBlogSlug(slug || title, db.blogPosts || []),
    title: String(title).trim(),
    excerpt: String(excerpt || content).trim().slice(0, 220),
    metaDescription: String(metaDescription || excerpt || '').trim().slice(0, 320),
    content: String(content).trim(),
    image: imageUrl || '/share-default.jpg',
    imageAlt: String(imageAlt || title).trim(),
    author: String(author || 'BigDrop Team').trim(),
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: parseBlogTags(tags),
    ctaLabel: String(ctaLabel || '').trim(),
    ctaUrl: String(ctaUrl || '').trim(),
    published: isLive,
  };
  updateDb((d) => {
    d.blogPosts = d.blogPosts || [];
    d.blogPosts.unshift(post);
  });
  res.status(201).json({ post });
});

router.patch('/admin/blog/:id', authRequired, requireRole('admin'), (req, res) => {
  const db = readDb();
  const idx = (db.blogPosts || []).findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Post not found' });
  const cur = db.blogPosts[idx];
  const updated = { ...cur, updatedAt: new Date().toISOString() };
  for (const field of ['title', 'excerpt', 'content', 'author', 'published', 'metaDescription', 'imageAlt', 'ctaLabel', 'ctaUrl']) {
    if (req.body[field] !== undefined) updated[field] = req.body[field];
  }
  if (updated.metaDescription != null) updated.metaDescription = String(updated.metaDescription).trim().slice(0, 320);
  if (updated.excerpt != null) updated.excerpt = String(updated.excerpt).trim().slice(0, 220);
  if (req.body.image !== undefined) {
    try {
      const nextImage = saveDataUrl(req.body.image, 'blog');
      if (cur.image && cur.image !== nextImage) deleteLocalUpload(cur.image);
      updated.image = nextImage;
    } catch (e) {
      return res.status(400).json({ error: e.message || 'Could not save image' });
    }
  }
  if (req.body.tags !== undefined) {
    updated.tags = parseBlogTags(req.body.tags);
  }
  if (req.body.slug !== undefined && String(req.body.slug).trim()) {
    updated.slug = uniqueBlogSlug(req.body.slug, db.blogPosts || [], cur.id);
  }
  if (req.body.published === true && cur.published === false && !updated.publishedAt) {
    updated.publishedAt = new Date().toISOString();
  }
  updateDb((d) => {
    d.blogPosts[idx] = updated;
  });
  res.json({ post: updated });
});

router.delete('/admin/blog/:id', authRequired, requireRole('admin'), (req, res) => {
  const post = (readDb().blogPosts || []).find((p) => p.id === req.params.id);
  if (post?.image) deleteLocalUpload(post.image);
  updateDb((d) => {
    d.blogPosts = (d.blogPosts || []).filter((p) => p.id !== req.params.id);
  });
  res.json({ ok: true });
});

router.get('/jobs', (req, res) => {
  return withPublicCache(req, res, 60_000, () => {
    const jobs = readDb().jobs;
    const list = (jobs?.length ? jobs : DEFAULT_JOBS).filter((j) => j.active !== false);
    res.json({ jobs: list });
  });
});

router.get('/admin/jobs', authRequired, requireRole('admin'), (_req, res) => {
  const jobs = readDb().jobs;
  res.json({ jobs: jobs?.length ? jobs : DEFAULT_JOBS });
});

router.post('/admin/jobs', authRequired, requireRole('admin'), (req, res) => {
  const { title, location, type, summary, description } = req.body || {};
  if (!title || !summary) {
    return res.status(400).json({ error: 'Title and summary are required' });
  }
  const job = {
    id: 'job_' + nanoid(8),
    title: String(title).trim(),
    location: String(location || 'Nairobi').trim(),
    type: String(type || 'Full-time').trim(),
    summary: String(summary).trim(),
    description: String(description || '').trim(),
    active: true,
    createdAt: new Date().toISOString(),
  };
  updateDb((d) => {
    d.jobs = d.jobs?.length ? d.jobs : [...DEFAULT_JOBS];
    d.jobs.unshift(job);
  });
  res.status(201).json({ job });
});

router.patch('/admin/jobs/:id', authRequired, requireRole('admin'), (req, res) => {
  updateDb((d) => {
    d.jobs = d.jobs?.length ? d.jobs : [...DEFAULT_JOBS];
  });
  const db = readDb();
  const idx = db.jobs.findIndex((j) => j.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Job not found' });
  const updated = { ...db.jobs[idx] };
  for (const field of ['title', 'location', 'type', 'summary', 'description', 'active']) {
    if (req.body[field] !== undefined) updated[field] = req.body[field];
  }
  updateDb((d) => {
    d.jobs[idx] = updated;
  });
  res.json({ job: updated });
});

router.delete('/admin/jobs/:id', authRequired, requireRole('admin'), (req, res) => {
  updateDb((d) => {
    d.jobs = (d.jobs?.length ? d.jobs : [...DEFAULT_JOBS]).filter((j) => j.id !== req.params.id);
  });
  res.json({ ok: true });
});

router.post('/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }
  const entry = {
    id: 'msg_' + nanoid(8),
    name,
    email,
    phone: phone || '',
    subject: subject || 'General enquiry',
    message,
    createdAt: new Date().toISOString(),
    read: false,
  };
  updateDb((d) => {
    d.contactMessages = d.contactMessages || [];
    d.contactMessages.unshift(entry);
  });
  res.status(201).json({ ok: true, message: 'Message received. We will get back to you shortly.' });
});

// ─── Catalog (public sees approved only) ────────────────
router.get('/products', authOptional, (req, res) => {
  const { category, q, featured, vendorId, status, mine, brand, minRating } = req.query;
  const shouldCachePublic = !req.user || (req.user.role !== 'admin' && req.user.role !== 'vendor');

  if (shouldCachePublic) {
    return withPublicCache(req, res, 30_000, () => {
      const db = readDb();
      let products = [...db.products];
      // Hidden products (e.g. the demo catalogue) never ship to shoppers.
      products = products.filter((p) => p.status === 'approved' && !p.hidden);

      if (category) {
        const cat = db.categories.find((c) => c.slug === category || c.id === category);
        if (cat) products = products.filter((p) => p.categoryId === cat.id);
      }
      if (brand) {
        const brands = String(brand)
          .split(',')
          .map((b) => b.trim().toLowerCase())
          .filter(Boolean);
        if (brands.length) {
          // Trim p.brand too, not just the query: the facet value is trimmed, so an
          // untrimmed stored value ("L'Oréal ") would never match and the product
          // would silently vanish from its own brand filter.
          products = products.filter((p) => p.brand && brands.includes(String(p.brand).trim().toLowerCase()));
        }
      }
      if (minRating) {
        const min = Number(minRating);
        if (!Number.isNaN(min) && min > 0) {
          products = products.filter((p) => (p.rating || 0) >= min);
        }
      }
      if (featured === 'true') products = products.filter((p) => p.featured);
      if (vendorId) products = products.filter((p) => p.vendorId === vendorId);
      if (q) {
        const term = String(q).toLowerCase();
        products = products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.description.toLowerCase().includes(term) ||
            (p.brand && p.brand.toLowerCase().includes(term)) ||
            (p.tags || []).some((t) => t.toLowerCase().includes(term))
        );
      }

      products.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
      res.json({
        products: products.map((p) => enrichProduct(p, db)),
        count: products.length,
      });
    });
  }

  const db = readDb();
  let products = [...db.products];

  const isStaff = req.user && (req.user.role === 'admin' || req.user.role === 'vendor');

  if (mine === 'true' && req.user?.role === 'vendor') {
    products = products.filter((p) => p.vendorId === req.user.id);
  } else if (req.user?.role === 'admin' && status) {
    products = products.filter((p) => p.status === status);
  } else if (!isStaff || !status) {
    // Public / default: approved and not hidden
    products = products.filter((p) => p.status === 'approved' && !p.hidden);
  } else if (status) {
    products = products.filter((p) => p.status === status);
  }

  if (category) {
    const cat = db.categories.find((c) => c.slug === category || c.id === category);
    if (cat) products = products.filter((p) => p.categoryId === cat.id);
  }
  if (brand) {
    const brands = String(brand)
      .split(',')
      .map((b) => b.trim().toLowerCase())
      .filter(Boolean);
    if (brands.length) {
      products = products.filter((p) => p.brand && brands.includes(String(p.brand).trim().toLowerCase()));
    }
  }
  if (minRating) {
    const min = Number(minRating);
    if (!Number.isNaN(min) && min > 0) {
      products = products.filter((p) => (p.rating || 0) >= min);
    }
  }
  if (featured === 'true') products = products.filter((p) => p.featured);
  if (vendorId) products = products.filter((p) => p.vendorId === vendorId);
  if (q) {
    const term = String(q).toLowerCase();
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        (p.brand && p.brand.toLowerCase().includes(term)) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(term))
    );
  }

  products.sort((a, b) => Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name));
  res.json({
    products: products.map((p) => enrichProduct(p, db)),
    count: products.length,
  });
});

router.get('/categories/:slug/brands', (req, res) => {
  const db = readDb();
  const cat = db.categories.find((c) => c.slug === req.params.slug || c.id === req.params.slug);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  // Trim here so the facet value equals the value the ?brand= filter compares
  // against; an untrimmed stored brand would produce a facet entry that matches
  // nothing. Empty strings are dropped rather than offered as a blank option.
  const fromProducts = [
    ...new Set(
      listApproved(db)
        .filter((p) => p.categoryId === cat.id && p.brand)
        .map((p) => String(p.brand).trim())
        .filter(Boolean)
    ),
  ].sort((a, b) => a.localeCompare(b));
  const brands = fromProducts.length ? fromProducts : cat.brands || [];
  res.json({ category: cat.slug, brands });
});

router.get('/products/:slug', authOptional, (req, res) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'vendor')) {
    return withPublicCache(req, res, 45_000, () => {
      const db = readDb();
      const product = db.products.find((p) => p.slug === req.params.slug || p.id === req.params.slug);
      if (!product) return res.status(404).json({ error: 'Product not found' });

      if ((product.status !== 'approved' || product.hidden)) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const substitutes = listApproved(db)
        .filter((p) => p.id !== product.id && p.categoryId === product.categoryId && p.price <= product.price)
        .sort((a, b) => a.price - b.price)
        .slice(0, 5)
        .map((p) => enrichProduct(p, db));

      const enriched = enrichProduct(product, db);
      res.json({
        product: enriched,
        related: relatedProducts(product, db),
        alsoBought: alsoBoughtProducts(product, db),
        substitutes,
      });
    });
  }

  const db = readDb();
  const product = db.products.find((p) => p.slug === req.params.slug || p.id === req.params.slug);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const isOwner = req.user && (req.user.role === 'admin' || req.user.id === product.vendorId);
  if ((product.status !== 'approved' || product.hidden) && !isOwner) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const substitutes = listApproved(db)
    .filter((p) => p.id !== product.id && p.categoryId === product.categoryId && p.price <= product.price)
    .sort((a, b) => a.price - b.price)
    .slice(0, 5)
    .map((p) => enrichProduct(p, db));

  const enriched = enrichProduct(product, db);
  res.json({
    product: enriched,
    related: relatedProducts(product, db),
    alsoBought: alsoBoughtProducts(product, db),
    substitutes,
  });
});

router.post('/products', authRequired, requireRole('vendor', 'admin'), async (req, res) => {
  if (req.user.role === 'vendor' && req.user.status !== 'approved') {
    return res.status(403).json({
      error: 'Your vendor account is pending admin approval. You cannot list products yet.',
    });
  }

  const { name, description, price, compareAt, stock, categoryId, images, tags, featured, sku, brand, specifications } = req.body || {};
  if (!name || !description || price == null || !categoryId) {
    return res.status(400).json({ error: 'Name, description, price, and category are required' });
  }

  const cat = readDb().categories.find((c) => c.id === categoryId);
  let imageList;
  try {
    imageList = await persistImages((images?.length ? images : []).slice(0, 3), 'products');
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Could not save images' });
  }
  if (!imageList.length) {
    imageList = ['/placeholder-product.svg'];
  }
  const product = {
    id: 'prd_' + nanoid(10),
    vendorId: req.user.role === 'admin' && req.body.vendorId ? req.body.vendorId : req.user.id,
    categoryId,
    name,
    slug: slugify(name),
    description,
    specifications: parseSpecifications(specifications) || [],
    variants: parseVariants(req.body?.variants || []),
    hidden: false,
    brand: brand || cat?.brands?.[0] || 'BigDrop',
    price: Number(price),
    compareAt: compareAt != null && compareAt !== '' ? Number(compareAt) : null,
    stock: Number(stock ?? 0),
    sku: resolveProductSku(sku, skuTakenSet(readDb().products)),
    images: imageList,
    featured: Boolean(featured),
    rating: 0,
    reviews: 0,
    reviewList: [],
    soldCount: 0,
    tags: tags || [],
    // Admin-created can go live immediately; vendor listings need approval
    status: req.user.role === 'admin' ? 'approved' : 'pending',
    createdAt: new Date().toISOString(),
  };

  updateDb((d) => d.products.push(product));
  res.status(201).json({
    product,
    message:
      product.status === 'pending'
        ? 'Product submitted for admin approval. It will go live once approved.'
        : 'Product published.',
  });
});

router.patch('/products/:id', authRequired, requireRole('vendor', 'admin'), async (req, res) => {
  const db = readDb();
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Product not found' });
  const product = db.products[idx];
  if (req.user.role === 'vendor' && product.vendorId !== req.user.id) {
    return res.status(403).json({ error: 'Not your product' });
  }

  const fields = ['name', 'description', 'price', 'compareAt', 'stock', 'categoryId', 'images', 'tags', 'featured', 'sku', 'brand', 'hidden'];
  const updated = { ...product };
  const changed = [];
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updated[field] = req.body[field];
      changed.push(field);
    }
  }
  if (req.body.specifications !== undefined) {
    updated.specifications = parseSpecifications(req.body.specifications) || [];
    changed.push('specifications');
  }
  if (req.body.variants !== undefined) {
    updated.variants = parseVariants(req.body.variants);
    changed.push('variants');
  }
  if (updated.price != null) updated.price = Number(updated.price);
  if (updated.stock != null) updated.stock = Number(updated.stock);
  if (updated.compareAt === '' || updated.compareAt == null) updated.compareAt = null;
  else if (updated.compareAt !== undefined) updated.compareAt = Number(updated.compareAt);
  // Admins may hand the product to a different vendor; validate the target exists.
  // Admin-owned products are legitimate (e.g. the Woo import), so reassigning back
  // to the admin account itself must stay allowed.
  if (req.user.role === 'admin' && req.body.vendorId !== undefined) {
    const nextVendor = readDb().users.find(
      (u) =>
        u.id === req.body.vendorId &&
        (u.role === 'admin' || (u.role === 'vendor' && u.status === 'approved'))
    );
    if (!nextVendor) return res.status(400).json({ error: 'Vendor not found or not approved' });
    updated.vendorId = nextVendor.id;
  }
  if (req.body.images !== undefined) {
    try {
      const prevImages = product.images || [];
      updated.images = await persistImages((updated.images || []).slice(0, 3), 'products');
      // A photo dropped from this product may still be used by another one.
      const usedElsewhere = new Set(
        readDb().products.filter((p) => p.id !== product.id).flatMap((p) => p.images || [])
      );
      prevImages.forEach((img) => {
        if (img && !updated.images.includes(img)) {
          deleteLocalUpload(img, (url) => usedElsewhere.has(url));
        }
      });
    } catch (e) {
      return res.status(400).json({ error: e.message || 'Could not save images' });
    }
  }

  if (req.body.sku !== undefined) {
    const taken = skuTakenSet(readDb().products.filter((p) => p.id !== product.id));
    updated.sku = resolveProductSku(updated.sku, taken);
  } else if (!String(updated.sku || '').trim()) {
    updated.sku = resolveProductSku('', skuTakenSet(readDb().products.filter((p) => p.id !== product.id)));
  }

  const promoOnly = changed.every((f) => ['price', 'compareAt', 'stock', 'images'].includes(f));
  if (req.user.role === 'vendor' && product.status === 'approved' && !promoOnly) {
    updated.status = 'pending';
  }

  updateDb((d) => {
    d.products[idx] = updated;
  });
  res.json({ product: updated });
});

router.patch('/products/:id/review', authRequired, requireRole('admin'), (req, res) => {
  const { status, note } = req.body || {};
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved, rejected, or pending' });
  }
  const db = readDb();
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Product not found' });

  const updated = {
    ...db.products[idx],
    status,
    reviewNote: note || '',
    reviewedAt: new Date().toISOString(),
    reviewedBy: req.user.id,
  };
  updateDb((d) => {
    d.products[idx] = updated;
  }, { actor: actorFrom(req), action: `product.${status}`, detail: updated.name });
  res.json({ product: updated });
});

router.delete('/products/:id', authRequired, requireRole('vendor', 'admin'), (req, res) => {
  const db = readDb();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (req.user.role === 'vendor' && product.vendorId !== req.user.id) {
    return res.status(403).json({ error: 'Not your product' });
  }
  // Many products legitimately share one photo, so only remove files that no
  // surviving product still points at (deleting BD-HOU-063 must not blank BD-HOU-064).
  const usedElsewhere = new Set(
    db.products.filter((p) => p.id !== product.id).flatMap((p) => p.images || [])
  );
  deleteLocalUploads(product.images || [], (url) => usedElsewhere.has(url));
  updateDb((d) => {
    d.products = d.products.filter((p) => p.id !== req.params.id);
  });
  res.json({ ok: true });
});

// ─── Vendor approvals (admin) ───────────────────────────
router.get('/admin/vendors', authRequired, requireRole('admin'), (req, res) => {
  const { status } = req.query;
  let vendors = readDb().users.filter((u) => u.role === 'vendor');
  if (status) vendors = vendors.filter((v) => v.status === status);
  res.json({ vendors: vendors.map(publicUser) });
});

// Create a vendor directly from the admin dashboard (no application flow).
router.post('/admin/vendors', authRequired, requireRole('admin'), async (req, res) => {
  const { name, email, phone, storeName, password } = req.body || {};
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!name || !cleanEmail.includes('@') || !password || String(password).length < 6) {
    return res.status(400).json({ error: 'Name, a valid email, and a password of at least 6 characters are required' });
  }
  const db = readDb();
  if (db.users.some((u) => String(u.email).toLowerCase() === cleanEmail)) {
    return res.status(400).json({ error: 'A user with that email already exists' });
  }
  const hash = await bcrypt.hash(String(password), 10);
  const vendor = {
    id: 'usr_' + nanoid(10),
    role: 'vendor',
    name: String(name).trim(),
    email: cleanEmail,
    phone: String(phone || '').trim(),
    storeName: String(storeName || name).trim(),
    status: 'approved', // admin-created vendors can sell immediately
    password: hash,
    createdAt: new Date().toISOString(),
  };
  updateDb((d) => {
    d.users.push(vendor);
  }, { actor: actorFrom(req), action: 'vendor.created', detail: vendor.storeName || vendor.email });
  res.json({ vendor: publicUser(vendor) });
});

router.patch('/admin/vendors/:id', authRequired, requireRole('admin'), (req, res) => {
  const { status, note } = req.body || {};
  if (!['approved', 'rejected', 'pending', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Invalid vendor status' });
  }
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === req.params.id && u.role === 'vendor');
  if (idx < 0) return res.status(404).json({ error: 'Vendor not found' });

  const updated = {
    ...db.users[idx],
    status,
    reviewNote: note || '',
    reviewedAt: new Date().toISOString(),
  };
  updateDb((d) => {
    d.users[idx] = updated;
  }, { actor: actorFrom(req), action: `vendor.${status}`, detail: updated.storeName || updated.email || updated.id });
  res.json({ vendor: publicUser(updated) });
});

router.get('/admin/messages', authRequired, requireRole('admin'), (_req, res) => {
  res.json({ messages: readDb().contactMessages || [] });
});

router.get('/admin/stats', authRequired, requireRole('admin'), (_req, res) => {
  const db = readDb();
  const vendors = db.users.filter((u) => u.role === 'vendor');
  const customers = db.users.filter((u) => u.role === 'customer');
  const revenue = db.orders
    .filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled')
    .reduce((s, o) => s + o.total, 0);

  res.json({
    stats: {
      customers: customers.length,
      vendors: vendors.length,
      vendorsPending: vendors.filter((v) => v.status === 'pending').length,
      products: db.products.length,
      productsPending: db.products.filter((p) => p.status === 'pending').length,
      productsLive: db.products.filter((p) => p.status === 'approved').length,
      orders: db.orders.length,
      newOrders: db.orders.filter((o) => ['placed', 'confirmed'].includes(o.status)).length,
      newsletterNew: (db.newsletter || []).filter((n) => !n.seen).length,
      revenue,
      messages: (db.contactMessages || []).filter((m) => !m.read).length,
    },
  });
});

// ─── Wishlist ───────────────────────────────────────────
router.get('/wishlist', authRequired, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  const ids = user?.wishlist || [];
  const products = db.products
    .filter((p) => ids.includes(p.id) && p.status === 'approved')
    .map((p) => enrichProduct(p, db));
  res.json({ products });
});

router.post('/wishlist/:productId', authRequired, (req, res) => {
  updateDb((d) => {
    const user = d.users.find((u) => u.id === req.user.id);
    if (!user) return;
    user.wishlist = user.wishlist || [];
    if (!user.wishlist.includes(req.params.productId)) {
      user.wishlist.push(req.params.productId);
    }
  });
  res.json({ ok: true });
});

router.delete('/wishlist/:productId', authRequired, (req, res) => {
  updateDb((d) => {
    const user = d.users.find((u) => u.id === req.user.id);
    if (!user) return;
    user.wishlist = (user.wishlist || []).filter((id) => id !== req.params.productId);
  });
  res.json({ ok: true });
});

// ─── Orders ─────────────────────────────────────────────
router.post('/orders', authOptional, async (req, res) => {
  const { items, shippingAddress, paymentMethod = 'mpesa', guest } = req.body || {};
  const { couponCode, wantDelivery, deliveryMode = 'delivery', slotId, pickupPointId, estate, diaspora, mpesaReceipt } =
    req.body || {};
  if (!items?.length) return res.status(400).json({ error: 'Cart is empty' });

  if (deliveryMode === 'pickup' && paymentMethod === 'cod') {
    return res.status(400).json({ error: 'Cash on delivery requires home delivery and includes the delivery fee.' });
  }

  const pickup = deliveryMode === 'pickup';
  const pickupPoint = pickup ? PICKUP_POINTS.find((p) => p.id === (pickupPointId || 'nextgen')) || PICKUP_POINTS[0] : null;
  if (pickup && !pickupPoint) {
    return res.status(400).json({ error: 'Pickup is only available at NextGen Mall, 3rd Floor, Suite 40.' });
  }
  const address = pickup
    ? {
        line1: pickupPoint.address,
        city: pickupPoint.city,
        county: pickupPoint.city === 'Mombasa' ? 'Mombasa' : 'Nairobi',
        phone: shippingAddress?.phone || guest?.phone || '',
        notes: shippingAddress?.notes || '',
      }
    : shippingAddress;
  if (!address?.line1 || !address?.city) {
    return res.status(400).json({ error: 'Shipping address is required' });
  }

  const isGuest = !req.user;
  if (isGuest) {
    if (!guest?.name || !guest?.email || !guest?.phone) {
      return res.status(400).json({ error: 'Name, email, and phone are required for guest checkout' });
    }
  }

  const db = readDb();
  const payFlags = db.site?.payments || {};
  if (paymentMethod === 'cod' && payFlags.cod !== true) {
    return res.status(400).json({ error: 'Cash on delivery is not offered at the moment.' });
  }
  if (paymentMethod === 'mpesa' && payFlags.mpesa === false) {
    return res.status(400).json({ error: 'M-Pesa is not available right now.' });
  }
  if (paymentMethod === 'card' && payFlags.card === false) {
    return res.status(400).json({ error: 'Card payment is not available right now.' });
  }
  const lineItems = [];
  let subtotal = 0;

  for (const item of items) {
    const product = db.products.find((p) => p.id === item.productId && p.status === 'approved' && !p.hidden);
    if (!product) return res.status(400).json({ error: `Product not found: ${item.productId}` });
    const qty = Math.max(1, Number(item.qty) || 1);
    if (product.stock < qty) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
    }
    const variant = item.variant ? String(item.variant) : '';
    lineItems.push({
      productId: product.id,
      name: variant ? `${product.name} (${variant})` : product.name,
      price: product.price,
      qty,
      sku: product.sku || '',
      image: product.images[0],
      vendorId: product.vendorId,
      variant,
    });
    subtotal += product.price * qty;
  }

  const DELIVERY_FEE = db.site?.deliveryFee ?? 280;
  const freeMin = db.site?.freeDeliveryMin || 10000;

  const pickupOrder = deliveryMode === 'pickup' && paymentMethod !== 'cod';
  let deliverySelected = paymentMethod === 'cod' ? true : pickupOrder ? false : wantDelivery !== false;
  if (paymentMethod === 'cod') deliverySelected = true;
  if (pickupOrder) deliverySelected = false;

  let discount = 0;
  let couponApplied = null;
  const code = String(couponCode || '').trim().toUpperCase();
  const found = findCoupon(db, code);
  if (code && found) {
    couponApplied = { code: found.code, type: found.type, value: found.value, label: found.label };
    if (couponApplied.type === 'percent') discount = Math.round(subtotal * (couponApplied.value / 100));
    if (couponApplied.type === 'flat') discount = Math.min(subtotal, couponApplied.value);
  }

  const afterDiscount = Math.max(0, subtotal - discount);
  const quote = quoteDelivery({
    county: address.county || address.city,
    subtotal: afterDiscount,
    paymentMethod,
    coupon: couponApplied,
    deliveryMode: pickupOrder ? 'pickup' : 'delivery',
    freeMin,
    countyFees: countyFeesFrom(db),
  });
  const shipping = deliverySelected || pickupOrder ? quote.shipping : 0;
  const slot = SAME_DAY_SLOTS.find((s) => s.id === slotId) || null;

  const ts = new Date().toISOString();
  const orderId = 'ord_' + nanoid(10);

  // ─── Server-side payment verification ───────────────────
  // M-Pesa/card orders are only accepted with a payment the SERVER confirmed
  // (STK callback result or Paystack verify) for at least the order total.
  // The reference is single-use: it cannot fund a second order.
  let verifiedPayment = null;
  let paymentReference = '';
  if (paymentMethod === 'mpesa' || paymentMethod === 'card') {
    paymentReference = String(req.body?.paymentReference || req.body?.checkoutRequestId || '').trim();
    const reserved = reservePayment({
      method: paymentMethod,
      reference: paymentReference,
      amount: afterDiscount + shipping,
      orderId,
    });
    if (reserved.error) {
      return res.status(reserved.status || 402).json({ error: reserved.error });
    }
    verifiedPayment = reserved.record;
  }

  const order = {
    id: orderId,
    orderNumber: generateOrderNumber(),
    trackingNumber: generateTracking(),
    customerId: req.user?.id || null,
    isGuest,
    customerName: req.user?.name || guest?.name,
    customerEmail: req.user?.email || String(guest?.email || '').toLowerCase(),
    customerPhone: req.user?.phone || guest?.phone || address.phone || '',
    items: lineItems,
    subtotal,
    discount,
    coupon: couponApplied,
    shipping,
    deliverySelected,
    deliveryFee: quote.base ?? DELIVERY_FEE,
    deliveryMode: pickupOrder ? 'pickup' : 'delivery',
    pickupPoint: pickupPoint || null,
    deliverySlot: slot,
    estate: estate || address.estate || '',
    diaspora: diaspora && diaspora.fromCountry ? diaspora : null,
    mpesaReceipt: verifiedPayment?.receipt || mpesaReceipt || '',
    paymentRef: verifiedPayment?.id || verifiedPayment?.receipt || mpesaReceipt || '',
    total: afterDiscount + shipping,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? 'pending' : 'paid',
    status: 'placed',
    shippingAddress: address,
    timeline: [{ status: 'placed', label: '1. Order placed', step: 1, at: ts }],
    documents: [],
    notifications: [],
    createdAt: ts,
    updatedAt: ts,
  };
  order.transactionNumber =
    order.mpesaReceipt ||
    order.paymentRef ||
    `TXN-${String(order.orderNumber).replace(/^BD/i, '')}`;

  // Numbered timeline after payment confirm
  if (paymentMethod !== 'cod') {
    order.timeline.push({
      status: 'confirmed',
      label: '2. ' + (paymentMethod === 'mpesa' ? 'M-Pesa payment confirmed' : 'Payment confirmed'),
      step: 2,
      at: ts,
    });
    order.status = 'confirmed';
  }

  const invoice = {
    id: 'inv_' + nanoid(8),
    type: 'invoice',
    title: 'Tax Invoice / Order Invoice',
    orderNumber: order.orderNumber,
    issuedAt: ts,
    to: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
    items: lineItems,
    subtotal,
    discount,
    shipping,
    total: order.total,
    paymentMethod,
    transactionNumber: order.transactionNumber,
    paymentRef: order.paymentRef,
    mpesaReceipt: order.mpesaReceipt,
    note: 'Thank you for shopping with BigDrop Kenya',
  };
  order.documents.push(invoice);

  const vendorIds = [...new Set(lineItems.map((i) => i.vendorId))];
  const notify = (role, userId, channel, message) => ({
    id: 'ntf_' + nanoid(8),
    role,
    userId: userId || null,
    channel,
    message,
    at: ts,
    read: false,
  });
  order.notifications.push(
    notify('customer', order.customerId, 'email', `Invoice ${invoice.id} emailed to ${order.customerEmail}`),
    notify('customer', order.customerId, 'sms', statusNotifyCopy(order.status, order) + ` SMS → ${order.customerPhone}`),
    notify('customer', order.customerId, 'whatsapp', statusNotifyCopy(order.status, order) + ` WhatsApp → ${order.customerPhone}`),
    notify('admin', 'usr_admin', 'email', `New order ${order.orderNumber} — invoice ${invoice.id}`),
  );
  for (const vid of vendorIds) {
    order.notifications.push(
      notify('vendor', vid, 'email', `Invoice for order ${order.orderNumber} — your items were sold`)
    );
  }

  // Persist the order and decrement stock. Stock is re-validated inside the
  // atomic update so two simultaneous checkouts can never oversell — a
  // conflict aborts the whole write and releases the reserved payment.
  try {
    updateDb((d) => {
      for (const item of lineItems) {
        const p = d.products.find((x) => x.id === item.productId);
        if (!p || p.status !== 'approved' || p.hidden) {
          throw Object.assign(new Error(`Product no longer available: ${item.name}`), { orderConflict: true });
        }
        if (p.stock < item.qty) {
          throw Object.assign(new Error(`Insufficient stock for ${p.name}`), { orderConflict: true });
        }
      }
      d.notifications = d.notifications || [];
      for (const item of lineItems) {
        const p = d.products.find((x) => x.id === item.productId);
        if (p) {
          p.stock = Math.max(0, p.stock - item.qty);
          p.soldCount = (p.soldCount || 0) + item.qty;
          if (p.stock < 10) {
            d.notifications.unshift({
              id: 'ntf_' + nanoid(8),
              role: 'vendor',
              userId: p.vendorId,
              channel: 'email',
              message: `Low stock email sent: "${p.name}" now has ${p.stock} units left. Please restock.`,
              at: ts,
              read: false,
              type: 'low_stock',
              productId: p.id,
            });
          }
        }
      }
      d.orders.unshift(order);
      if (req.user?.id) {
        const u = d.users.find((x) => x.id === req.user.id);
        if (u) {
          u.addresses = u.addresses || [];
          const key = `${shippingAddress.line1}|${shippingAddress.city}`.toLowerCase();
          const exists = u.addresses.some((a) => `${a.line1}|${a.city}`.toLowerCase() === key);
          if (!exists) {
            u.addresses.unshift({
              id: 'addr_' + nanoid(6),
              ...shippingAddress,
              name: order.customerName,
              isDefault: u.addresses.length === 0,
            });
          }
        }
      }
      d.notifications.unshift(...order.notifications);
    });
  } catch (err) {
    if (err?.orderConflict) {
      releasePayment(paymentReference, orderId);
      return res.status(409).json({ error: err.message });
    }
    throw err;
  }

  res.status(201).json({
    order,
    confirmation: {
      emailSent: true,
      smsSent: true,
      emailTo: order.customerEmail,
      smsTo: order.customerPhone,
      invoice,
      message: `We sent order confirmation to ${order.customerEmail} and SMS to ${order.customerPhone}.`,
    },
  });
  sendPurchaseNotifications(order, db.site).catch((err) => console.error(err));
});

router.get('/orders', authRequired, (req, res) => {
  const db = readDb();
  let orders = [...db.orders];
  if (req.user.role === 'customer') {
    orders = orders.filter((o) => o.customerId === req.user.id);
  } else if (req.user.role === 'vendor') {
    orders = orders.filter((o) => o.items.some((i) => i.vendorId === req.user.id));
  }
  res.json({ orders });
});

router.get('/orders/:id', authRequired, (req, res) => {
  const db = readDb();
  const order = db.orders.find(
    (o) => o.id === req.params.id || o.orderNumber === req.params.id || o.trackingNumber === req.params.id
  );
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const isOwner = order.customerId === req.user.id;
  const isVendor = req.user.role === 'vendor' && order.items.some((i) => i.vendorId === req.user.id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isVendor && !isAdmin) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json({ order });
});

router.patch('/orders/:id/status', authRequired, requireRole('admin'), (req, res) => {
  const { status, label } = req.body || {};
  const allowed = ['placed', 'confirmed', 'picking', 'packed', 'out_for_delivery', 'delivered', 'cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const db = readDb();
  const idx = db.orders.findIndex((o) => o.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Order not found' });
  const order = db.orders[idx];

  // Forward-only chain — cannot skip or go backwards
  const flow = ['placed', 'confirmed', 'picking', 'packed', 'out_for_delivery', 'delivered'];
  const cur = order.status;
  if (cur === 'cancelled' || cur === 'delivered') {
    return res.status(400).json({ error: 'This order can no longer change status' });
  }
  if (status === 'cancelled') {
    if (!['placed', 'confirmed'].includes(cur)) {
      return res.status(400).json({ error: 'Orders can only be cancelled before picking starts' });
    }
  } else {
    const curIdx = flow.indexOf(cur);
    const nextIdx = flow.indexOf(status);
    if (nextIdx !== curIdx + 1) {
      return res.status(400).json({
        error: `Invalid jump. Next allowed status after "${cur.replace(/_/g, ' ')}" is "${(flow[curIdx + 1] || 'none').replace(/_/g, ' ')}"`,
      });
    }
  }

  const statusLabels = {
    placed: 'Order placed',
    confirmed: 'Order confirmed',
    picking: 'Picked at BigDrop warehouse',
    packed: 'Packed and ready',
    out_for_delivery: 'Out for delivery with Globeflight',
    delivered: 'Delivered — goods received',
    cancelled: 'Order cancelled',
  };

  const nextStep = (order.timeline?.length || 0) + 1;
  const stepLabel = `${nextStep}. ${label || statusLabels[status]}`;
  const ts2 = new Date().toISOString();

  const updated = {
    ...order,
    status,
    updatedAt: ts2,
    timeline: [
      ...(order.timeline || []),
      { status, label: stepLabel, step: nextStep, at: ts2 },
    ],
    documents: [...(order.documents || [])],
    notifications: [...(order.notifications || [])],
  };

  const copy = statusNotifyCopy(status, order);
  updated.notifications.push(
    {
      id: 'ntf_' + nanoid(8),
      role: 'customer',
      userId: order.customerId,
      channel: 'sms',
      message: `${copy} SMS → ${order.customerPhone}`,
      at: ts2,
      read: false,
    },
    {
      id: 'ntf_' + nanoid(8),
      role: 'customer',
      userId: order.customerId,
      channel: 'whatsapp',
      message: `${copy} WhatsApp → ${order.customerPhone}`,
      at: ts2,
      read: false,
    }
  );

  if (status === 'delivered') {
    const receipt = {
      id: 'rcp_' + nanoid(8),
      type: 'receipt',
      title: 'Delivery Receipt — Goods Received',
      orderNumber: order.orderNumber,
      issuedAt: ts2,
      to: { name: order.customerName, email: order.customerEmail, phone: order.customerPhone },
      items: order.items,
      total: order.total,
      note: 'Thank you for shopping with BigDrop Kenya',
    };
    updated.documents.push(receipt);
    const ntf = (role, userId, channel, message) => ({
      id: 'ntf_' + nanoid(8), role, userId, channel, message, at: ts2, read: false,
    });
    const notes = [
      ntf('customer', order.customerId, 'email', `Delivery receipt ${receipt.id} emailed to ${order.customerEmail}`),
      ntf('customer', order.customerId, 'sms', `SMS: Order ${order.orderNumber} delivered. Receipt sent.`),
      ntf('admin', 'usr_admin', 'email', `Receipt for delivered order ${order.orderNumber}`),
    ];
    const vids = [...new Set(order.items.map((i) => i.vendorId))];
    for (const vid of vids) notes.push(ntf('vendor', vid, 'email', `Delivery receipt for ${order.orderNumber}`));
    updated.notifications.push(...notes);
  }

  updateDb((d) => {
    d.orders[idx] = updated;
    if (status === 'delivered') {
      d.notifications = d.notifications || [];
      d.notifications.unshift(...updated.notifications.slice(-(3 + order.items.length)));
    }
  }, { actor: actorFrom(req), action: `order.${status}`, detail: `${order.orderNumber} · ${order.customerName}` });
  res.json({ order: updated });
});

router.get('/track/:code', (req, res) => {
  const db = readDb();
  const code = req.params.code.trim().toUpperCase();
  const order = db.orders.find(
    (o) => o.trackingNumber.toUpperCase() === code || o.orderNumber.toUpperCase() === code
  );
  if (!order) return res.status(404).json({ error: 'Shipment not found' });

  res.json({
    tracking: {
      trackingNumber: order.trackingNumber,
      orderNumber: order.orderNumber,
      status: order.status,
      timeline: order.timeline,
      itemCount: order.items.reduce((n, i) => n + i.qty, 0),
      city: order.shippingAddress.city,
      carrier: 'BigDrop Kenya',
      updatedAt: order.updatedAt,
    },
  });
});

router.get('/dashboard/stats', authRequired, requireRole('vendor', 'admin'), (req, res) => {
  const db = readDb();

  if (req.user.role === 'admin') {
    const vendors = db.users.filter((u) => u.role === 'vendor');
    const customers = db.users.filter((u) => u.role === 'customer');
    const revenue = db.orders
      .filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled')
      .reduce((s, o) => s + o.total, 0);
    const lowStockItems = db.products.filter((p) => p.status === 'approved' && p.stock < 10);
    return res.json({
      stats: {
        customers: customers.length,
        vendors: vendors.length,
        vendorsPending: vendors.filter((v) => v.status === 'pending').length,
        products: db.products.length,
        productsPending: db.products.filter((p) => p.status === 'pending').length,
        productsLive: db.products.filter((p) => p.status === 'approved').length,
        orders: db.orders.length,
        newOrders: db.orders.filter((o) => ['placed', 'confirmed'].includes(o.status)).length,
        newsletterNew: (db.newsletter || []).filter((n) => !n.seen).length,
        revenue,
        messages: (db.contactMessages || []).filter((m) => !m.read).length,
        reviewsPending: pendingReviewCount(db),
        returnsPending: (db.notifications || []).filter(
          (n) => n.role === 'admin' && n.channel === 'in_dashboard' && !n.read
        ).length,
        pending: db.orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
        lowStock: lowStockItems.length,
      },
    });
  }

  const orders = db.orders.filter((o) => o.items.some((i) => i.vendorId === req.user.id));
  const products = db.products.filter((p) => p.vendorId === req.user.id);
  const revenue = orders
    .filter((o) => o.paymentStatus === 'paid' && o.status !== 'cancelled')
    .reduce(
      (sum, o) =>
        sum + o.items.filter((i) => i.vendorId === req.user.id).reduce((s, i) => s + i.price * i.qty, 0),
      0
    );

  res.json({
    stats: {
      products: products.length,
      productsPending: products.filter((p) => p.status === 'pending').length,
      productsLive: products.filter((p) => p.status === 'approved').length,
      orders: orders.length,
      revenue,
      pending: orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
      lowStock: products.filter((p) => p.stock < 10).length,
      vendorStatus: req.user.status,
    },
  });
});

/** Admin analytics for management presentations */
router.get('/admin/analytics', authRequired, requireRole('admin'), (_req, res) => {
  const db = readDb();
  const orders = (db.orders || []).filter((o) => o.status !== 'cancelled');
  const paid = orders.filter((o) => o.paymentStatus === 'paid' || o.paymentMethod === 'cod');
  const catMap = Object.fromEntries((db.categories || []).map((c) => [c.id, c.name]));
  const vendorMap = Object.fromEntries(
    (db.users || []).filter((u) => u.role === 'vendor').map((u) => [u.id, u.storeName || u.name])
  );
  const productMap = Object.fromEntries((db.products || []).map((p) => [p.id, p]));

  const byCategory = {};
  const byVendor = {};
  const byPayment = { mpesa: 0, card: 0, cod: 0 };

  for (const o of paid) {
    const method = o.paymentMethod || 'mpesa';
    byPayment[method] = (byPayment[method] || 0) + 1;
    for (const item of o.items || []) {
      const product = productMap[item.productId];
      const catName = catMap[product?.categoryId] || product?.category || 'Other';
      const line = (item.price || 0) * (item.qty || 1);
      byCategory[catName] = (byCategory[catName] || 0) + line;
      const vid = item.vendorId || product?.vendorId;
      if (vid) {
        byVendor[vid] = byVendor[vid] || { vendorId: vid, name: vendorMap[vid] || vid, revenue: 0, units: 0, orders: new Set() };
        byVendor[vid].revenue += line;
        byVendor[vid].units += item.qty || 1;
        byVendor[vid].orders.add(o.id);
      }
    }
  }

  const visits = db.siteMetrics?.visits || 12840;
  const checkoutsStarted = db.siteMetrics?.checkoutsStarted || Math.max(orders.length * 3, 420);
  const conversionRate = visits ? Number(((orders.length / visits) * 100).toFixed(2)) : 0;
  const checkoutConversion = checkoutsStarted
    ? Number(((orders.length / checkoutsStarted) * 100).toFixed(1))
    : 0;

  const paymentTotal = Object.values(byPayment).reduce((a, b) => a + b, 0) || 1;
  const salesByCategory = Object.entries(byCategory)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 8);
  const topVendors = Object.values(byVendor)
    .map((v) => ({
      vendorId: v.vendorId,
      name: v.name,
      revenue: v.revenue,
      units: v.units,
      orders: v.orders.size,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  res.json({
    analytics: {
      gmv: paid.reduce((s, o) => s + (o.total || 0), 0),
      orderCount: orders.length,
      visits,
      checkoutsStarted,
      conversionRate,
      checkoutConversion,
      salesByCategory,
      topVendors,
      paymentShare: {
        mpesa: { count: byPayment.mpesa || 0, pct: Number((((byPayment.mpesa || 0) / paymentTotal) * 100).toFixed(1)) },
        card: { count: byPayment.card || 0, pct: Number((((byPayment.card || 0) / paymentTotal) * 100).toFixed(1)) },
        cod: { count: byPayment.cod || 0, pct: Number((((byPayment.cod || 0) / paymentTotal) * 100).toFixed(1)) },
      },
    },
  });
});

/** Low-stock alerts + simulated vendor emails */
router.get('/admin/stock-alerts', authRequired, requireRole('admin', 'vendor'), (req, res) => {
  const db = readDb();
  let products = (db.products || []).filter((p) => p.status === 'approved' && p.stock < 10);
  if (req.user.role === 'vendor') {
    products = products.filter((p) => p.vendorId === req.user.id);
  }
  const vendorMap = Object.fromEntries(
    (db.users || []).filter((u) => u.role === 'vendor').map((u) => [u.id, u])
  );
  const alerts = products
    .sort((a, b) => a.stock - b.stock)
    .map((p) => {
      const vendor = vendorMap[p.vendorId];
      return {
        productId: p.id,
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        threshold: 10,
        vendorId: p.vendorId,
        vendorName: vendor?.storeName || vendor?.name || 'Vendor',
        vendorEmail: vendor?.email || '',
        emailStatus: 'sent',
        message: `Low stock alert: "${p.name}" has ${p.stock} left (threshold 10). Please restock.`,
      };
    });
  res.json({ alerts, count: alerts.length });
});

router.post('/admin/stock-alerts/notify', authRequired, requireRole('admin'), (_req, res) => {
  const db = readDb();
  const low = (db.products || []).filter((p) => p.status === 'approved' && p.stock < 10);
  const ts = new Date().toISOString();
  const notes = [];
  updateDb((d) => {
    d.notifications = d.notifications || [];
    for (const p of low) {
      const note = {
        id: 'ntf_' + nanoid(8),
        role: 'vendor',
        userId: p.vendorId,
        channel: 'email',
        message: `Low stock email: "${p.name}" — ${p.stock} units remaining. Restock recommended.`,
        at: ts,
        read: false,
        type: 'low_stock',
        productId: p.id,
      };
      d.notifications.unshift(note);
      notes.push(note);
    }
  });
  res.json({ ok: true, sent: notes.length, notifications: notes });
});

// ─── Admin notifications (returns badge) ──────────────────────────────

router.get('/admin/notifications', authRequired, requireRole('admin'), (_req, res) => {
  const db = readDb();
  const adminNotifs = (db.notifications || [])
    .filter((n) => n.role === 'admin')
    .sort((a, b) => (b.at > a.at ? 1 : b.at < a.at ? -1 : 0));
  res.json({ notifications: adminNotifs });
});

router.patch('/admin/notifications/read', authRequired, requireRole('admin'), (req, res) => {
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  updateDb((d) => {
    d.notifications = (d.notifications || []).map((n) =>
      ids.includes(n.id) ? { ...n, read: true } : n
    );
  }, { actor: actorFrom(req), action: 'notifications.read', detail: `${ids.length} notification(s) marked read` });
  res.json({ ok: true });
});

router.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'BigDrop API', company: 'BigDrop Kenya' });
});



// ─── Newsletter ─────────────────────────────────────────
router.post('/newsletter', async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });
  updateDb((d) => {
    d.newsletter = d.newsletter || [];
    if (!d.newsletter.some((n) => n.email === email)) {
      d.newsletter.unshift({ id: 'nl_' + nanoid(6), email, createdAt: new Date().toISOString(), seen: false });
    }
  });
  sendMail({
    to: email,
    subject: 'You are subscribed to BigDrop',
    text: 'Thank you for subscribing. We will send deals and new arrivals to this address.\n\nBigDrop Kenya\norders@bigdrop.co.ke',
  }).catch(() => {});
  res.json({ ok: true, message: 'Subscribed! You will get BigDrop deals and diaspora offers.' });
});

// ─── Coupons validate ───────────────────────────────────
router.post('/coupons/validate', (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const subtotal = Number(req.body?.subtotal) || 0;
  const c = findCoupon(readDb(), code);
  if (!c) return res.status(404).json({ error: 'Invalid coupon code' });
  let discount = 0;
  if (c.type === 'percent') discount = Math.round(subtotal * (c.value / 100));
  if (c.type === 'flat') discount = Math.min(subtotal, c.value);
  res.json({ coupon: { code: c.code, type: c.type, value: c.value, label: c.label }, discount });
});

// ─── Saved addresses ────────────────────────────────────
router.get('/addresses', authRequired, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  res.json({ addresses: user?.addresses || [] });
});

router.post('/addresses', authRequired, (req, res) => {
  const { line1, city, county, phone, name, notes } = req.body || {};
  if (!line1 || !city) return res.status(400).json({ error: 'Address line and city required' });
  let saved;
  updateDb((d) => {
    const u = d.users.find((x) => x.id === req.user.id);
    if (!u) return;
    u.addresses = u.addresses || [];
    saved = {
      id: 'addr_' + nanoid(6),
      line1, city, county: county || '', phone: phone || '', name: name || u.name, notes: notes || '',
      isDefault: u.addresses.length === 0,
    };
    u.addresses.unshift(saved);
  });
  res.status(201).json({ address: saved });
});

// ─── Saved addresses: set default / delete ──────────────
router.patch('/addresses/:id', authRequired, (req, res) => {
  const { isDefault } = req.body || {};
  let updated = null;
  updateDb((d) => {
    const u = d.users.find((x) => x.id === req.user.id);
    if (!u || !u.addresses) return;
    const addr = u.addresses.find((a) => a.id === req.params.id);
    if (!addr) return;
    if (isDefault === true) {
      u.addresses.forEach((a) => {
        a.isDefault = a.id === addr.id;
      });
    }
    updated = addr;
  });
  if (!updated) return res.status(404).json({ error: 'Address not found' });
  res.json({ address: updated });
});

router.delete('/addresses/:id', authRequired, (req, res) => {
  updateDb((d) => {
    const u = d.users.find((x) => x.id === req.user.id);
    if (!u || !u.addresses) return;
    const wasDefault = u.addresses.find((a) => a.id === req.params.id)?.isDefault;
    u.addresses = u.addresses.filter((a) => a.id !== req.params.id);
    if (wasDefault && u.addresses.length > 0) u.addresses[0].isDefault = true;
  });
  res.json({ ok: true });
});

// ─── Customer profile ───────────────────────────────────
router.patch('/account/profile', authRequired, (req, res) => {
  const { name, phone } = req.body || {};
  const cleanName = String(name ?? '').trim();
  const cleanPhone = String(phone ?? '').trim();
  if (!cleanName) return res.status(400).json({ error: 'Name is required' });
  if (cleanPhone && !/^[+0-9 ()-]{7,20}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'Phone number looks invalid' });
  }
  let safeUser = null;
  updateDb((d) => {
    const u = d.users.find((x) => x.id === req.user.id);
    if (!u) return;
    u.name = cleanName;
    if (phone !== undefined) u.phone = cleanPhone;
    const { passwordHash, ...rest } = u;
    safeUser = rest;
  }, { actor: actorFrom(req), action: 'profile.update', detail: cleanName });
  if (!safeUser) return res.status(404).json({ error: 'User not found' });
  res.json({ user: safeUser });
});

// ─── Returns (customer) ─────────────────────────────────
router.post('/returns', authOptional, (req, res) => {
  const { orderNumber, email, reason, items } = req.body || {};
  const cleanOrderNumber = String(orderNumber || '').trim();
  const cleanReason = String(reason || '').trim();
  if (!cleanOrderNumber) return res.status(400).json({ error: 'Order number is required' });
  if (!cleanReason || cleanReason.length < 5) {
    return res.status(400).json({ error: 'Please tell us what went wrong (at least 5 characters)' });
  }
  const db = readDb();
  const order = db.orders.find((o) => o.orderNumber.toUpperCase() === cleanOrderNumber.toUpperCase());
  if (!order) return res.status(404).json({ error: 'Order not found' });

  const isOwner =
    req.user &&
    (req.user.id === order.customerId ||
      (order.customerEmail && req.user.email === String(order.customerEmail).toLowerCase()));
  const isAdmin = req.user?.role === 'admin';
  const emailMatches =
    !req.user && String(email || '').toLowerCase() === String(order.customerEmail || '').toLowerCase();
  if (!isOwner && !isAdmin && !emailMatches) {
    return res.status(403).json({ error: 'Confirm the email used on the order to request a return' });
  }
  if (order.status !== 'delivered') {
    return res.status(400).json({ error: 'Returns can only be requested for delivered orders' });
  }
  if (
    (db.returnRequests || []).some(
      (r) => r.orderNumber === order.orderNumber && !['rejected', 'refunded'].includes(r.status)
    )
  ) {
    return res.status(409).json({ error: 'A return request for this order is already open' });
  }

  const requested = Array.isArray(items) && items.length
    ? items
    : (order.items || []).map((i) => ({ productId: i.productId, qty: i.qty }));
  const cleanItems = [];
  for (const item of requested) {
    const line = (order.items || []).find((i) => i.productId === item.productId);
    if (!line) return res.status(400).json({ error: `Item not in this order: ${item.productId}` });
    const qty = Math.max(1, Math.min(Number(item.qty) || 1, line.qty));
    cleanItems.push({ productId: line.productId, name: line.name, price: line.price, qty });
  }
  if (!cleanItems.length) return res.status(400).json({ error: 'Select at least one item to return' });

  const ts = new Date().toISOString();
  const entry = {
    id: 'ret_' + nanoid(8),
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId || null,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    items: cleanItems,
    reason: cleanReason.slice(0, 1000),
    status: 'requested',
    refundMethod: order.paymentMethod === 'card' ? 'paystack' : order.paymentMethod === 'mpesa' ? 'mpesa' : 'manual',
    refundRef: '',
    adminNote: '',
    timeline: [{ status: 'requested', at: ts }],
    createdAt: ts,
    updatedAt: ts,
  };
  const notify = (role, userId, channel, message) => ({
    id: 'ntf_' + nanoid(8),
    role,
    userId: userId || null,
    channel,
    message,
    at: new Date().toISOString(),
    read: false,
  });

  updateDb((d) => {
    d.returnRequests = d.returnRequests || [];
    d.returnRequests.unshift(entry);

    // ── Admin notification (same shape as order/product notifications) ──
    d.notifications = d.notifications || [];
    d.notifications.unshift(notify('admin', 'usr_admin', 'email',
      `New return request — Order ${entry.orderNumber} — ${entry.customerName} — ${cleanItems.length} item(s)`
    ));
    d.notifications.unshift(notify('admin', 'usr_admin', 'in_dashboard',
      `Return request: Order ${entry.orderNumber} — ${entry.customerName} — ${cleanItems.length} item(s)`
    ));
  }, { actor: actorFrom(req), action: 'return.request', detail: `${entry.orderNumber} · ${cleanItems.length} item(s)` });

  // ── Email admin about the new return request ──────────────────────────
  if (mailConfigured()) {
    const emailSubject = `New return request — Order ${entry.orderNumber}`;
    const emailText = [
      `Hi Admin,`,
      ``,
      `A customer has requested a return.`,
      ``,
      `Order:  ${entry.orderNumber}`,
      `Customer: ${entry.customerName}`,
      `Email: ${entry.customerEmail}`,
      `Phone: ${entry.customerPhone || '—'}`,
      `Refund method: ${entry.refundMethod}`,
      ``,
      `Items:`,
      ...cleanItems.map((i) => `  ${i.qty}x ${i.name} — ${formatKES(i.price)}`),
      ``,
      `Reason: ${cleanReason}`,
      ``,
      `Please review and action this return from the admin dashboard.`,
      ``,
      `— BigDrop Kenya`,
      `orders@bigdrop.co.ke`,
    ].join('\n');
    sendMail({ to: process.env.ADMIN_EMAIL || 'info@bigdrop.co.ke', subject: emailSubject, text: emailText }).catch((err) => console.error('Return email failed:', err.message));
  }

  res.status(201).json({ request: entry });
});

router.get('/returns/mine', authRequired, (req, res) => {
  const email = String(req.user.email || '').toLowerCase();
  const mine = (readDb().returnRequests || []).filter(
    (r) => r.customerId === req.user.id || String(r.customerEmail || '').toLowerCase() === email
  );
  res.json({ returns: mine });
});

// ─── Product reviews (submit) ───────────────────────────
router.post('/products/:id/reviews', authRequired, (req, res) => {
  const { rating, title, comment, image } = req.body || {};
  const r = Number(rating);
  const cleanComment = stripReviewUrls(comment);
  const cleanTitle = stripReviewUrls(title);
  if (!r || r < 1 || r > 5 || !cleanComment) {
    return res.status(400).json({ error: 'Rating (1-5) and comment are required' });
  }
  const db = readDb();
  const product = db.products.find((p) => p.id === req.params.id || p.slug === req.params.id);
  if (!product || product.status !== 'approved') return res.status(404).json({ error: 'Product not found' });

  let imageUrl = '';
  try {
    if (image) {
      if (typeof image !== 'string' || !image.startsWith('data:image/')) {
        return res.status(400).json({ error: 'Review photo must be an image file' });
      }
      const b64 = (image.split(',')[1] || '').replace(/=+$/, '');
      const bytes = Math.floor((b64.length * 3) / 4);
      if (bytes > 25 * 1024) {
        return res.status(400).json({ error: 'Review photo is too large' });
      }
      imageUrl = saveDataUrl(image, 'reviews') || '';
    }
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Could not save review photo' });
  }

  const review = {
    id: 'rev_' + nanoid(8),
    author: stripReviewUrls(req.user?.name) || 'BigDrop Shopper',
    rating: r,
    title: cleanTitle || (r >= 4 ? 'Great purchase' : 'My review'),
    comment: cleanComment,
    image: imageUrl || '',
    date: new Date().toISOString().slice(0, 10),
    verified: true,
    status: 'pending',
  };

  updateDb((d) => {
    const p = d.products.find((x) => x.id === product.id);
    p.reviewList = p.reviewList || [];
    p.reviewList.unshift(review);
  });

  res.status(201).json({ review, message: 'Thank you. Your review will show after Admin approval.' });
});

router.get('/admin/reviews', authRequired, requireRole('admin'), (_req, res) => {
  const db = readDb();
  const reviews = [];
  for (const p of db.products || []) {
    for (const r of p.reviewList || []) {
      if (r.status === 'pending') {
        reviews.push({
          ...r,
          productId: p.id,
          productName: p.name,
          productSlug: p.slug,
        });
      }
    }
  }
  res.json({ reviews, pending: reviews.length });
});

router.patch('/admin/reviews/:productId/:reviewId', authRequired, requireRole('admin'), (req, res) => {
  const status = String(req.body?.status || '');
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or rejected' });
  }
  const db = readDb();
  const product = db.products.find((p) => p.id === req.params.productId);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const review = (product.reviewList || []).find((r) => r.id === req.params.reviewId);
  if (!review) return res.status(404).json({ error: 'Review not found' });

  updateDb((d) => {
    const p = d.products.find((x) => x.id === product.id);
    const row = (p.reviewList || []).find((r) => r.id === review.id);
    if (!row) return;
    const wasPending = row.status === 'pending';
    row.status = status;
    if (status === 'approved' && wasPending) {
      p.reviews = (p.reviews || 0) + 1;
    }
    const list = approvedReviews(p.reviewList);
    if (list.length) {
      p.rating = Number((list.reduce((s, x) => s + x.rating, 0) / list.length).toFixed(1));
    }
  });

  res.json({ ok: true, status });
});

// ─── Product Q&A ────────────────────────────────────────
router.get('/products/:id/questions', (req, res) => {
  const db = readDb();
  const product = db.products.find((p) => p.id === req.params.id || p.slug === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  res.json({ questions: product.questions || [] });
});

router.post('/products/:id/questions', authOptional, (req, res) => {
  const question = String(req.body?.question || '').trim();
  if (!question) return res.status(400).json({ error: 'Question is required' });
  const db = readDb();
  const product = db.products.find((p) => p.id === req.params.id || p.slug === req.params.id);
  if (!product || product.status !== 'approved') return res.status(404).json({ error: 'Product not found' });

  const entry = {
    id: 'q_' + nanoid(8),
    question,
    asker: req.user?.name || req.body?.name || 'Customer',
    answer: null,
    answeredBy: null,
    createdAt: new Date().toISOString(),
  };

  // Auto-answer demo for presentation polish
  entry.answer = 'Thanks for asking! A BigDrop seller typically ships this within 24–48 hours via Globeflight. For stock or specs, WhatsApp +254 722 359 298.';
  entry.answeredBy = 'BigDrop Support';
  entry.answeredAt = new Date().toISOString();

  updateDb((d) => {
    const p = d.products.find((x) => x.id === product.id);
    p.questions = p.questions || [];
    p.questions.unshift(entry);
  });

  res.status(201).json({ question: entry });
});

// Public order documents (invoice/receipt) by order number + email (guest-friendly)
router.get('/orders/:id/documents', authOptional, (req, res) => {
  const db = readDb();
  const order = db.orders.find(
    (o) => o.id === req.params.id || o.orderNumber === req.params.id || o.trackingNumber === req.params.id
  );
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const email = String(req.query.email || '').toLowerCase();
  const allowed =
    (req.user && (req.user.role === 'admin' || req.user.id === order.customerId || order.items.some((i) => i.vendorId === req.user.id))) ||
    (email && email === String(order.customerEmail || '').toLowerCase());
  if (!allowed) return res.status(403).json({ error: 'Access denied' });
  res.json({ documents: order.documents || [], notifications: order.notifications || [] });
});

export default router;
