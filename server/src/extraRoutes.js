import fs from 'fs';
import { Router } from 'express';
import { nanoid } from 'nanoid';
import { readDb, updateDb, writeDb, dbPath, actorFrom } from './db.js';
import { authRequired, requireRole, authOptional } from './auth.js';
import { persistImages, saveDataUrl, deleteLocalUpload } from './uploads.js';
import { gscVerificationToken } from './seo.js';
import { parseWooCommerceCsv, materializeImages, slugifyName } from './wooCommerce.js';
import { startStk, confirmStk, recordStkCallback, startCard, confirmCard, paymentStatus } from './payments.js';
import { sendNewsletterIssue, mailConfigured } from './mailer.js';
import {
  NAIROBI_ESTATES,
  PICKUP_POINTS,
  DEFAULT_HOME_BLOCKS,
  DEFAULT_FAQS,
  COMMISSION_RATE,
  listCoupons,
  findCoupon,
  quoteDelivery,
  parseSpecifications,
  parseVariants,
  vendorIsOpen,
  defaultVendorHours,
  countyFeesFrom,
  commissionRateFrom,
  DEFAULT_SOCIALS,
  DEFAULT_NOTIFY_TEMPLATES,
  DEFAULT_SELL_PAGE,
  normalizeNavMenus,
  normalizeLetterhead,
  normalizeDeliveryCopy,
  normalizeAnnouncement,
  vendorStoreSlug,
  resolveProductSku,
  skuTakenSet,
} from './commerce.js';

const router = Router();

function persistBrand(next, prev, folder) {
  if (next === undefined) return prev || '';
  if (!next) {
    if (prev) deleteLocalUpload(prev);
    return '';
  }
  if (typeof next === 'string' && next.startsWith('data:')) {
    const url = saveDataUrl(next, folder);
    if (prev && prev !== url) deleteLocalUpload(prev);
    return url;
  }
  return String(next);
}

function publicUser(user) {
  const { password, ...safe } = user;
  return safe;
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

router.get('/search/suggest', (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ products: [], categories: [], brands: [] });
  const db = readDb();
  const products = (db.products || [])
    .filter((p) => p.status === 'approved' && !p.hidden)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && String(p.brand).toLowerCase().includes(q)) ||
        (p.tags || []).some((t) => String(t).toLowerCase().includes(q))
    )
    .slice(0, 6)
    .map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image: p.images?.[0],
      price: p.price,
    }));
  const categories = (db.categories || [])
    .filter((c) => c.name.toLowerCase().includes(q) || c.slug.includes(q))
    .slice(0, 4)
    .map((c) => ({ id: c.id, name: c.name, slug: c.slug }));
  const brands = [
    ...new Set(
      (db.products || [])
        .filter((p) => p.status === 'approved' && p.brand && String(p.brand).toLowerCase().includes(q))
        .map((p) => p.brand)
    ),
  ].slice(0, 4);
  res.json({ products, categories, brands });
});

router.get('/delivery/options', (_req, res) => {
  const db = readDb();
  const fees = countyFeesFrom(db);
  res.json({
    counties: Object.keys(fees),
    countyFees: fees,
    nairobiEstates: NAIROBI_ESTATES,
    slots: [],
    pickupPoints: PICKUP_POINTS,
    pickupAddress: PICKUP_POINTS[0],
    deliveryFee: fees.Nairobi ?? 280,
    freeDeliveryMin: db.site?.freeDeliveryMin || 10000,
  });
});

router.post('/delivery/quote', (req, res) => {
  const db = readDb();
  const { county, subtotal, paymentMethod, couponCode, deliveryMode } = req.body || {};
  const coupon = findCoupon(db, couponCode);
  const quote = quoteDelivery({
    county,
    subtotal: Number(subtotal) || 0,
    paymentMethod: paymentMethod || 'mpesa',
    coupon,
    deliveryMode: deliveryMode || 'delivery',
    freeMin: db.site?.freeDeliveryMin || 10000,
    countyFees: countyFeesFrom(db),
  });
  res.json({ quote, coupon: coupon ? { code: coupon.code, ...coupon } : null });
});

router.get('/payments/status', (_req, res) => {
  res.json(paymentStatus());
});

router.post('/payments/mpesa/stk', async (req, res) => {
  try {
    const result = await startStk({ phone: req.body?.phone, amount: req.body?.amount });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Could not start M-Pesa' });
  }
});

router.post('/payments/mpesa/confirm', (req, res) => {
  const result = confirmStk(req.body?.checkoutRequestId);
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.json(result);
});

router.post('/payments/mpesa/callback', (req, res) => {
  recordStkCallback(req.body || {});
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
});

router.post('/payments/card/init', async (req, res) => {
  try {
    const result = await startCard({ amount: req.body?.amount, email: req.body?.email });
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message || 'Could not start card payment' });
  }
});

router.post('/payments/card/confirm', async (req, res) => {
  const result = await confirmCard(req.body?.reference);
  if (result.error) return res.status(result.status || 400).json({ error: result.error });
  res.json(result);
});

router.get('/cart', authRequired, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.user.id);
  res.json({ items: user?.cart || [] });
});

router.put('/cart', authRequired, (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : [];
  let saved = [];
  updateDb((d) => {
    const u = d.users.find((x) => x.id === req.user.id);
    if (!u) return;
    u.cart = items.slice(0, 50);
    saved = u.cart;
  });
  res.json({ items: saved });
});

router.get('/admin/coupons', authRequired, requireRole('admin'), (_req, res) => {
  res.json({ coupons: listCoupons(readDb()) });
});

router.post('/admin/coupons', authRequired, requireRole('admin'), (req, res) => {
  const code = String(req.body?.code || '').trim().toUpperCase();
  const type = req.body?.type || 'percent';
  const value = Number(req.body?.value) || 0;
  const label = String(req.body?.label || code).trim();
  if (!code) return res.status(400).json({ error: 'Code is required' });
  if (!['percent', 'flat', 'freeship'].includes(type)) {
    return res.status(400).json({ error: 'Type must be percent, flat, or freeship' });
  }
  const db = readDb();
  const existing = listCoupons(db);
  if (existing.some((c) => c.code === code)) {
    return res.status(409).json({ error: 'Coupon already exists' });
  }
  const coupon = { code, type, value, label, active: true };
  updateDb((d) => {
    d.coupons = [...listCoupons(d), coupon];
  }, { actor: actorFrom(req), action: 'coupon.create', detail: `${code} (${type} ${value})` });
  res.status(201).json({ coupon });
});

router.patch('/admin/coupons/:code', authRequired, requireRole('admin'), (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  const db = readDb();
  const list = listCoupons(db);
  const idx = list.findIndex((c) => c.code === code);
  if (idx < 0) return res.status(404).json({ error: 'Coupon not found' });
  const coupon = { ...list[idx], ...req.body, code };
  if (req.body.active !== undefined) coupon.active = Boolean(req.body.active);
  updateDb((d) => {
    const next = listCoupons(d);
    const i = next.findIndex((c) => c.code === code);
    if (i >= 0) next[i] = coupon;
    d.coupons = next;
  }, { actor: actorFrom(req), action: 'coupon.update', detail: code });
  res.json({ coupon });
});

router.delete('/admin/coupons/:code', authRequired, requireRole('admin'), (req, res) => {
  const code = String(req.params.code || '').toUpperCase();
  updateDb((d) => {
    d.coupons = listCoupons(d).filter((c) => c.code !== code);
  }, { actor: actorFrom(req), action: 'coupon.delete', detail: code });
  res.json({ ok: true });
});

router.patch('/admin/site/settings', authRequired, requireRole('admin'), (req, res) => {
  const body = req.body || {};
  let site;
  updateDb((d) => {
    d.site = d.site || {};
    if (body.homeBlocks && typeof body.homeBlocks === 'object') {
      d.site.homeBlocks = { ...DEFAULT_HOME_BLOCKS, ...d.site.homeBlocks, ...body.homeBlocks };
    }
    if (body.flashEndsAt !== undefined) d.site.flashEndsAt = body.flashEndsAt;
    if (body.whatsapp !== undefined) d.site.whatsapp = String(body.whatsapp);
    if (body.paybill !== undefined) d.site.paybill = String(body.paybill || '').replace(/\D/g, '') || d.site.paybill;
    if (body.featuredCategorySlugs) d.site.featuredCategorySlugs = body.featuredCategorySlugs;
    if (body.phone !== undefined) d.site.phone = String(body.phone);
    if (body.emails !== undefined) {
      d.site.emails = Array.isArray(body.emails)
        ? body.emails.map((e) => String(e).trim()).filter(Boolean)
        : String(body.emails)
            .split(/[,;\n]+/)
            .map((e) => e.trim())
            .filter(Boolean);
    }
    if (body.address !== undefined) d.site.address = String(body.address);
    if (body.hours !== undefined) d.site.hours = String(body.hours);
    if (body.deliveryFee !== undefined) d.site.deliveryFee = Number(body.deliveryFee) || 0;
    if (body.freeDeliveryMin !== undefined) d.site.freeDeliveryMin = Number(body.freeDeliveryMin) || 0;
    if (body.commissionRate !== undefined) {
      let n = Number(body.commissionRate);
      if (n > 1) n = n / 100;
      d.site.commissionRate = Number.isFinite(n) ? n : COMMISSION_RATE;
    }
    if (body.countyFees && typeof body.countyFees === 'object') d.site.countyFees = body.countyFees;
    if (body.payments && typeof body.payments === 'object') {
      d.site.payments = {
        mpesa: body.payments.mpesa !== false,
        card: body.payments.card !== false,
        cod: body.payments.cod === true,
      };
    }
    if (body.socials && typeof body.socials === 'object') {
      d.site.socials = { ...DEFAULT_SOCIALS, ...(d.site.socials || {}) };
      for (const key of Object.keys(DEFAULT_SOCIALS)) {
        if (body.socials[key] !== undefined) d.site.socials[key] = String(body.socials[key] || '').trim();
      }
    }
    if (body.logo !== undefined) d.site.logo = persistBrand(body.logo, d.site.logo, 'brand');
    if (body.favicon !== undefined) d.site.favicon = persistBrand(body.favicon, d.site.favicon, 'brand');
    if (body.pickupText !== undefined) d.site.pickupText = String(body.pickupText);
    if (body.cookieText !== undefined) d.site.cookieText = String(body.cookieText);
    if (body.footerBlurb !== undefined) d.site.footerBlurb = String(body.footerBlurb);
    if (body.copyright !== undefined) d.site.copyright = String(body.copyright);
    if (body.blackFriday && typeof body.blackFriday === 'object') {
      d.site.blackFriday = {
        enabled: body.blackFriday.enabled !== false,
        title: String(body.blackFriday.title || 'Black Friday'),
      };
    }
    if (body.sellPage && typeof body.sellPage === 'object') {
      const prev = { ...DEFAULT_SELL_PAGE, ...(d.site.sellPage || {}) };
      d.site.sellPage = {
        ...prev,
        ...body.sellPage,
        steps: Array.isArray(body.sellPage.steps) ? body.sellPage.steps : prev.steps,
        benefits: Array.isArray(body.sellPage.benefits) ? body.sellPage.benefits : prev.benefits,
        commissionRows: Array.isArray(body.sellPage.commissionRows)
          ? body.sellPage.commissionRows
          : prev.commissionRows,
        guidelines: Array.isArray(body.sellPage.guidelines) ? body.sellPage.guidelines : prev.guidelines,
      };
    }
    if (body.notifyTemplates && typeof body.notifyTemplates === 'object') {
      d.site.notifyTemplates = {
        ...DEFAULT_NOTIFY_TEMPLATES,
        ...(d.site.notifyTemplates || {}),
        ...body.notifyTemplates,
      };
    }
    if (body.gaId !== undefined) d.site.gaId = String(body.gaId || '').trim();
    if (body.metaPixelId !== undefined) d.site.metaPixelId = String(body.metaPixelId || '').trim();
    if (body.gscVerification !== undefined) d.site.gscVerification = gscVerificationToken(body.gscVerification);
    if (body.deliveryCopy && typeof body.deliveryCopy === 'object') {
      d.site.deliveryCopy = normalizeDeliveryCopy(body.deliveryCopy);
    }
    if (body.letterhead && typeof body.letterhead === 'object') {
      d.site.letterhead = normalizeLetterhead(body.letterhead);
    }
    if (body.announcement && typeof body.announcement === 'object') {
      d.site.announcement = normalizeAnnouncement(body.announcement);
    }
    if (body.menus && typeof body.menus === 'object') {
      d.site.menus = normalizeNavMenus(body.menus);
    }
    site = d.site;
  }, { actor: actorFrom(req), action: 'settings.update' });
  res.json({ site });
});

// ─── Audit log (admin) ──────────────────────────────────────
router.get('/admin/audit', authRequired, requireRole('admin'), (_req, res) => {
  res.json({ audit: readDb().auditLog || [] });
});

// ─── Returns / refunds (admin) ──────────────────────────────
router.get('/admin/returns', authRequired, requireRole('admin'), (_req, res) => {
  const list = [...(readDb().returnRequests || [])].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  res.json({ returns: list });
});

router.patch('/admin/returns/:id', authRequired, requireRole('admin'), (req, res) => {
  const { status, refundRef, adminNote, restock } = req.body || {};
  const allowed = ['requested', 'approved', 'rejected', 'received', 'refunded'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid return status' });
  }
  const db = readDb();
  const entry = (db.returnRequests || []).find((r) => r.id === req.params.id);
  if (!entry) return res.status(404).json({ error: 'Return request not found' });
  if (['refunded', 'rejected'].includes(entry.status)) {
    return res.status(400).json({ error: 'This return is already closed' });
  }

  const ts = new Date().toISOString();
  let restocked = 0;
  const updated = updateDb((d) => {
    const row = (d.returnRequests || []).find((r) => r.id === entry.id);
    if (!row) return;
    row.status = status;
    row.updatedAt = ts;
    if (adminNote !== undefined) row.adminNote = String(adminNote || '').slice(0, 500);
    if (refundRef !== undefined) row.refundRef = String(refundRef || '').slice(0, 120);
    row.timeline = [...(row.timeline || []), { status, at: ts, by: actorFrom(req) }];
    // Restock when the goods physically come back (default: on 'received').
    if (status === 'received' && restock !== false) {
      for (const item of row.items || []) {
        const product = (d.products || []).find((p) => p.id === item.productId);
        if (product) {
          product.stock = (Number(product.stock) || 0) + Number(item.qty || 0);
          restocked += Number(item.qty || 0);
        }
      }
    }
    return row;
  }, { actor: actorFrom(req), action: `return.${status}`, detail: `${entry.orderNumber} - ${entry.customerName}` });

  res.json({ return: { ...(updated || entry), restocked } });
});

// ─── Product Q&A moderation (admin) ─────────────────────────
router.get('/admin/questions', authRequired, requireRole('admin'), (_req, res) => {
  const db = readDb();
  const questions = [];
  for (const p of db.products || []) {
    for (const q of p.questions || []) {
      questions.push({
        ...q,
        productId: p.id,
        productName: p.name,
        productSlug: p.slug,
      });
    }
  }
  questions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  res.json({ questions });
});

router.patch('/admin/products/:id/questions/:qid', authRequired, requireRole('admin'), (req, res) => {
  const answer = String(req.body?.answer ?? '').trim();
  const db = readDb();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const question = (product.questions || []).find((q) => q.id === req.params.qid);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  updateDb((d) => {
    const p = d.products.find((x) => x.id === product.id);
    const q = (p.questions || []).find((x) => x.id === question.id);
    if (!q) return;
    if (answer) {
      q.answer = answer;
      q.answeredBy = req.user.name || 'BigDrop Admin';
      q.answeredAt = new Date().toISOString();
    } else {
      q.answer = null;
      q.answeredBy = null;
      q.answeredAt = null;
    }
  }, { actor: actorFrom(req), action: 'question.answer', detail: `${product.name} · ${question.id}` });

  res.json({ ok: true });
});

router.delete('/admin/products/:id/questions/:qid', authRequired, requireRole('admin'), (req, res) => {
  const db = readDb();
  const product = db.products.find((p) => p.id === req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  const question = (product.questions || []).find((q) => q.id === req.params.qid);
  if (!question) return res.status(404).json({ error: 'Question not found' });

  updateDb((d) => {
    const p = d.products.find((x) => x.id === product.id);
    p.questions = (p.questions || []).filter((x) => x.id !== question.id);
  }, { actor: actorFrom(req), action: 'question.delete', detail: `${product.name} · ${question.question.slice(0, 80)}` });

  res.json({ ok: true });
});

// ─── Backup / restore (admin) ───────────────────────────────
router.get('/admin/backup', authRequired, requireRole('admin'), (_req, res) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  res.download(dbPath, `bigdrop-db-backup-${stamp}.json`);
});

router.post('/admin/backup/restore', authRequired, requireRole('admin'), (req, res) => {
  const incoming = req.body;
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming)) {
    return res.status(400).json({ error: 'Backup must be a JSON object' });
  }
  for (const key of ['users', 'products', 'orders']) {
    if (!Array.isArray(incoming[key])) {
      return res.status(400).json({ error: `Backup is missing the "${key}" array - refusing to restore` });
    }
  }
  try {
    if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, `${dbPath}.pre-restore`);
    writeDb(incoming);
    res.json({
      ok: true,
      counts: {
        users: incoming.users.length,
        products: incoming.products.length,
        orders: incoming.orders.length,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/admin/reports', authRequired, requireRole('admin'), (_req, res) => {
  const db = readDb();
  const orders = (db.orders || []).filter((o) => o.status !== 'cancelled');
  const byCategory = {};
  const byVendor = {};
  const byCounty = {};
  for (const o of orders) {
    const county = o.shippingAddress?.county || o.pickupPoint?.city || 'Unknown';
    byCounty[county] = (byCounty[county] || 0) + (o.total || 0);
    for (const item of o.items || []) {
      const product = (db.products || []).find((p) => p.id === item.productId);
      const cat = (db.categories || []).find((c) => c.id === product?.categoryId);
      const catName = cat?.name || 'Other';
      byCategory[catName] = (byCategory[catName] || 0) + item.price * item.qty;
      const vendor = (db.users || []).find((u) => u.id === item.vendorId);
      const vName = vendor?.storeName || vendor?.name || item.vendorId;
      byVendor[vName] = (byVendor[vName] || 0) + item.price * item.qty;
    }
  }
  res.json({
    report: {
      salesByCategory: Object.entries(byCategory)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      salesByVendor: Object.entries(byVendor)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      salesByCounty: Object.entries(byCounty)
        .map(([name, revenue]) => ({ name, revenue }))
        .sort((a, b) => b.revenue - a.revenue),
      orderCount: orders.length,
      gmv: orders.reduce((s, o) => s + (o.total || 0), 0),
    },
  });
});

router.post('/products/bulk', authRequired, requireRole('vendor', 'admin'), async (req, res) => {
  if (req.user.role === 'vendor' && req.user.status !== 'approved') {
    return res.status(403).json({ error: 'Vendor account is pending approval.' });
  }
  const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
  if (!rows.length) return res.status(400).json({ error: 'No rows to import' });
  const db = readDb();
  const created = [];
  const errors = [];
  const productImages = await Promise.all(rows.map(async (row) => {
    try {
      return await persistImages(
        (row?.images || (row?.image ? [row.image] : [])).slice(0, 3),
        'products'
      );
    } catch {
      return [];
    }
  }));
  updateDb((d) => {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] || {};
      const name = String(row.name || '').trim();
      const price = Number(row.price);
      if (!name || !price) {
        errors.push({ row: i + 1, error: 'Name and price required' });
        continue;
      }
      const cat =
        d.categories.find(
          (c) =>
            c.id === row.categoryId ||
            c.slug === row.categorySlug ||
            String(c.name).toLowerCase() === String(row.category || '').toLowerCase()
        ) || d.categories[0];
      let images = productImages[i] || [];
      if (!images.length) {
        images = ['/placeholder-product.svg'];
      }
      const product = {
        id: 'prd_' + nanoid(10),
        vendorId: req.user.role === 'admin' && row.vendorId ? row.vendorId : req.user.id,
        categoryId: cat.id,
        name,
        slug: slugify(name),
        description: String(row.description || name),
        specifications: parseSpecifications(row.specifications || row.specs || ''),
        variants: parseVariants(row.variants || ''),
        brand: row.brand || cat.brands?.[0] || 'BigDrop',
        price,
        compareAt: row.compareAt ? Number(row.compareAt) : null,
        stock: Number(row.stock ?? 10),
        sku: resolveProductSku(row.sku, skuTakenSet(d.products)),
        images,
        featured: false,
        rating: 0,
        reviews: 0,
        reviewList: [],
        soldCount: 0,
        tags: [],
        hidden: false,
        status: req.user.role === 'admin' ? 'approved' : 'pending',
        createdAt: new Date().toISOString(),
      };
      d.products.push(product);
      created.push({ id: product.id, name: product.name, status: product.status });
    }
  });
  res.status(201).json({ created, errors, count: created.length });
});

router.patch('/products/:id/stock-action', authRequired, requireRole('vendor', 'admin'), (req, res) => {
  const { action, stock } = req.body || {};
  const db = readDb();
  const idx = db.products.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Product not found' });
  const product = db.products[idx];
  if (req.user.role === 'vendor' && product.vendorId !== req.user.id) {
    return res.status(403).json({ error: 'Not your product' });
  }
  const updated = { ...product };
  if (action === 'hide') updated.hidden = true;
  else if (action === 'unhide') updated.hidden = false;
  else if (action === 'restock') updated.stock = Number(stock ?? Math.max(20, product.stock + 20));
  else return res.status(400).json({ error: 'action must be hide, unhide, or restock' });
  updateDb((d) => {
    d.products[idx] = updated;
  });
  res.json({ product: updated });
});

router.get('/dashboard/payouts', authRequired, requireRole('vendor', 'admin'), (req, res) => {
  const db = readDb();
  const vendorId = req.user.role === 'vendor' ? req.user.id : req.query.vendorId;
  const orders = (db.orders || []).filter(
    (o) => o.status === 'delivered' && o.items.some((i) => (vendorId ? i.vendorId === vendorId : true))
  );
  const lines = [];
  for (const o of orders) {
    const items = o.items.filter((i) => (vendorId ? i.vendorId === vendorId : true));
    const gross = items.reduce((s, i) => s + i.price * i.qty, 0);
    if (!gross) continue;
    const commission = Math.round(gross * commissionRateFrom(db));
    lines.push({
      id: `pay_${o.id}`,
      orderNumber: o.orderNumber,
      deliveredAt: o.updatedAt || o.createdAt,
      gross,
      commission,
      net: gross - commission,
      status: 'paid',
    });
  }
  const totalNet = lines.reduce((s, l) => s + l.net, 0);
  const totalGross = lines.reduce((s, l) => s + l.gross, 0);
  res.json({
    payouts: lines,
    summary: {
      totalGross,
      totalCommission: totalGross - totalNet,
      totalNet,
      rate: commissionRateFrom(db),
    },
  });
});

router.get('/admin/newsletter', authRequired, requireRole('admin'), (_req, res) => {
  const list = [...(readDb().newsletter || [])].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
  res.json({ subscribers: list, count: list.length, mailConfigured: mailConfigured() });
});

router.post('/admin/newsletter/ack', authRequired, requireRole('admin'), (_req, res) => {
  updateDb((d) => {
    (d.newsletter || []).forEach((n) => {
      n.seen = true;
    });
  });
  res.json({ ok: true });
});

router.post('/admin/newsletter/send', authRequired, requireRole('admin'), async (req, res) => {
  const subject = String(req.body?.subject || '').trim();
  const body = String(req.body?.body || '').trim();
  if (!subject || !body) return res.status(400).json({ error: 'Subject and message are required' });
  const emails = (readDb().newsletter || []).map((n) => n.email).filter(Boolean);
  if (!emails.length) return res.status(400).json({ error: 'No subscribers yet' });
  const results = await sendNewsletterIssue({ emails, subject, body });
  const sent = results.filter((r) => r.ok).length;
  res.json({
    ok: true,
    sent,
    total: emails.length,
    simulated: results.some((r) => r.simulated),
    mailConfigured: mailConfigured(),
  });
});

router.get('/admin/customers', authRequired, requireRole('admin'), (_req, res) => {
  const db = readDb();
  const customers = (db.users || [])
    .filter((u) => u.role === 'customer')
    .map((u) => {
      const orders = (db.orders || []).filter((o) => o.customerId === u.id || o.customerEmail === u.email);
      return {
        ...publicUser(u),
        orderCount: orders.length,
        spent: orders.filter((o) => o.status !== 'cancelled').reduce((s, o) => s + (o.total || 0), 0),
      };
    });
  res.json({ customers });
});

router.patch('/admin/customers/:id', authRequired, requireRole('admin'), (req, res) => {
  const { status } = req.body || {};
  if (!['approved', 'suspended'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved or suspended' });
  }
  const db = readDb();
  const idx = db.users.findIndex((u) => u.id === req.params.id && u.role === 'customer');
  if (idx < 0) return res.status(404).json({ error: 'Customer not found' });
  const updated = { ...db.users[idx], status };
  updateDb((d) => {
    d.users[idx] = updated;
  }, { actor: actorFrom(req), action: `customer.${status}`, detail: updated.email || updated.id });
  res.json({ customer: publicUser(updated) });
});

router.patch('/admin/messages/:id', authRequired, requireRole('admin'), (req, res) => {
  const db = readDb();
  const list = db.contactMessages || [];
  const idx = list.findIndex((m) => m.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Message not found' });
  const updated = { ...list[idx] };
  if (req.body?.read !== undefined) updated.read = Boolean(req.body.read);
  if (req.body?.note !== undefined) updated.note = String(req.body.note);
  updateDb((d) => {
    d.contactMessages[idx] = updated;
  });
  res.json({ message: updated });
});

router.delete('/admin/messages/:id', authRequired, requireRole('admin'), (req, res) => {
  updateDb((d) => {
    d.contactMessages = (d.contactMessages || []).filter((m) => m.id !== req.params.id);
  });
  res.json({ ok: true });
});

router.get('/admin/categories', authRequired, requireRole('admin'), (_req, res) => {
  res.json({ categories: readDb().categories || [] });
});

router.post('/admin/categories', authRequired, requireRole('admin'), (req, res) => {
  const { name, description, image, brands } = req.body || {};
  if (!name) return res.status(400).json({ error: 'Name is required' });
  const slug =
    String(req.body.slug || name)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `cat-${nanoid(4)}`;
  const db = readDb();
  if ((db.categories || []).some((c) => c.slug === slug)) {
    return res.status(409).json({ error: 'A category with that slug already exists' });
  }
  const category = {
    id: 'cat_' + nanoid(8),
    name: String(name).trim(),
    slug,
    image: image || '',
    description: String(description || '').trim(),
    brands: Array.isArray(brands)
      ? brands
      : String(brands || '')
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean),
    hidden: false,
  };
  updateDb((d) => {
    d.categories = d.categories || [];
    d.categories.push(category);
  });
  res.status(201).json({ category });
});

router.patch('/admin/categories/:id', authRequired, requireRole('admin'), (req, res) => {
  const db = readDb();
  const idx = (db.categories || []).findIndex((c) => c.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Category not found' });
  const body = req.body || {};
  const updated = { ...db.categories[idx] };
  if (body.name !== undefined) updated.name = String(body.name).trim();
  if (body.description !== undefined) updated.description = String(body.description);
  if (body.image !== undefined) updated.image = body.image;
  if (body.hidden !== undefined) updated.hidden = Boolean(body.hidden);
  if (body.slug !== undefined) {
    updated.slug = String(body.slug)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  if (body.brands !== undefined) {
    updated.brands = Array.isArray(body.brands)
      ? body.brands
      : String(body.brands)
          .split(',')
          .map((b) => b.trim())
          .filter(Boolean);
  }
  updateDb((d) => {
    d.categories[idx] = updated;
  });
  res.json({ category: updated });
});

router.delete('/admin/categories/:id', authRequired, requireRole('admin'), (req, res) => {
  const db = readDb();
  const cat = (db.categories || []).find((c) => c.id === req.params.id);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const inUse = (db.products || []).some((p) => p.categoryId === cat.id);
  if (inUse) {
    return res.status(400).json({ error: 'Hide this category instead — products are still assigned to it.' });
  }
  updateDb((d) => {
    d.categories = d.categories.filter((c) => c.id !== req.params.id);
  });
  res.json({ ok: true });
});

router.get('/admin/testimonials', authRequired, requireRole('admin'), (_req, res) => {
  res.json({ testimonials: readDb().testimonials || [] });
});

router.post('/admin/testimonials', authRequired, requireRole('admin'), (req, res) => {
  const { name, role, quote, image } = req.body || {};
  if (!name || !quote) return res.status(400).json({ error: 'Name and quote are required' });
  let photo = '';
  try {
    photo = persistBrand(image || '', '', 'testimonials');
  } catch (e) {
    return res.status(400).json({ error: e.message || 'Could not save photo' });
  }
  const row = {
    id: 't_' + nanoid(6),
    name: String(name).trim(),
    role: String(role || 'Customer').trim(),
    quote: String(quote).trim(),
    image: photo,
  };
  updateDb((d) => {
    d.testimonials = d.testimonials || [];
    d.testimonials.unshift(row);
  });
  res.status(201).json({ testimonial: row });
});

router.patch('/admin/testimonials/:id', authRequired, requireRole('admin'), (req, res) => {
  const db = readDb();
  const idx = (db.testimonials || []).findIndex((t) => t.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Testimonial not found' });
  const body = req.body || {};
  const updated = { ...db.testimonials[idx] };
  for (const k of ['name', 'role', 'quote']) {
    if (body[k] !== undefined) updated[k] = String(body[k]);
  }
  if (body.image !== undefined) {
    try {
      updated.image = persistBrand(body.image, updated.image, 'testimonials');
    } catch (e) {
      return res.status(400).json({ error: e.message || 'Could not save photo' });
    }
  }
  updateDb((d) => {
    d.testimonials[idx] = updated;
  });
  res.json({ testimonial: updated });
});

router.delete('/admin/testimonials/:id', authRequired, requireRole('admin'), (req, res) => {
  const row = (readDb().testimonials || []).find((t) => t.id === req.params.id);
  if (row?.image) deleteLocalUpload(row.image);
  updateDb((d) => {
    d.testimonials = (d.testimonials || []).filter((t) => t.id !== req.params.id);
  });
  res.json({ ok: true });
});

router.get('/admin/faqs', authRequired, requireRole('admin'), (_req, res) => {
  const db = readDb();
  res.json({ faqs: Array.isArray(db.faqs) && db.faqs.length ? db.faqs : DEFAULT_FAQS });
});

router.put('/admin/faqs', authRequired, requireRole('admin'), (req, res) => {
  const faqs = Array.isArray(req.body?.faqs) ? req.body.faqs : null;
  if (!faqs) return res.status(400).json({ error: 'faqs array is required' });
  const cleaned = faqs
    .map((g) => ({
      id: g.id || 'faq_' + nanoid(4),
      title: String(g.title || '').trim(),
      items: (g.items || [])
        .map((it) => ({ q: String(it.q || '').trim(), a: String(it.a || '').trim() }))
        .filter((it) => it.q && it.a),
    }))
    .filter((g) => g.title);
  updateDb((d) => {
    d.faqs = cleaned;
  });
  res.json({ faqs: cleaned });
});

router.get('/admin/payouts', authRequired, requireRole('admin'), (_req, res) => {
  const db = readDb();
  const rate = commissionRateFrom(db);
  const stored = db.payouts || [];
  const byVendor = {};
  for (const o of db.orders || []) {
    if (o.status !== 'delivered') continue;
    for (const item of o.items || []) {
      const vid = item.vendorId || 'unknown';
      if (!byVendor[vid]) {
        const vendor = (db.users || []).find((u) => u.id === vid);
        byVendor[vid] = {
          vendorId: vid,
          name: vendor?.storeName || vendor?.name || vid,
          gross: 0,
          orders: 0,
        };
      }
      byVendor[vid].gross += item.price * item.qty;
      byVendor[vid].orders += 1;
    }
  }
  const rows = Object.values(byVendor).map((v) => {
    const override = stored.find((p) => p.vendorId === v.vendorId);
    const commission = Math.round(v.gross * rate);
    return {
      vendorId: v.vendorId,
      name: v.name,
      gross: v.gross,
      commission,
      net: v.gross - commission,
      orders: v.orders,
      status: override?.status || 'pending',
      paidAt: override?.paidAt || null,
      note: override?.note || '',
    };
  });
  res.json({
    payouts: rows.sort((a, b) => b.gross - a.gross),
    rate,
    summary: {
      totalGross: rows.reduce((s, r) => s + r.gross, 0),
      totalCommission: rows.reduce((s, r) => s + r.commission, 0),
      totalNet: rows.reduce((s, r) => s + r.net, 0),
    },
  });
});

router.patch('/admin/payouts/:vendorId', authRequired, requireRole('admin'), (req, res) => {
  const { status, note } = req.body || {};
  if (!['pending', 'paid'].includes(status)) {
    return res.status(400).json({ error: 'Status must be pending or paid' });
  }
  let row;
  updateDb((d) => {
    d.payouts = d.payouts || [];
    const idx = d.payouts.findIndex((p) => p.vendorId === req.params.vendorId);
    const next = {
      vendorId: req.params.vendorId,
      status,
      note: note || '',
      paidAt: status === 'paid' ? new Date().toISOString() : null,
    };
    if (idx >= 0) d.payouts[idx] = { ...d.payouts[idx], ...next };
    else d.payouts.push(next);
    row = next;
  });
  res.json({ payout: row });
});

function isDemoCatalogueId(id) {
  return /^prd_\d+$/.test(String(id || '')) || String(id || '') === 'prd_pending_1';
}

function findOrCreateCategory(d, name) {
  const label = String(name || '').trim();
  if (!label) return d.categories[0];
  const lower = label.toLowerCase();
  const found = d.categories.find(
    (c) => c.name.toLowerCase() === lower || c.slug === label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  );
  if (found) return found;
  const cat = {
    id: 'cat_woo_' + nanoid(6),
    name: label,
    slug: label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${nanoid(4)}`,
    image: '',
    description: '',
    brands: ['BigDrop'],
    hidden: false,
  };
  d.categories.push(cat);
  return cat;
}

router.post('/admin/woocommerce/import', authRequired, requireRole('admin'), async (req, res) => {
  req.setTimeout?.(180000);
  res.setTimeout?.(180000);
  const csv = String(req.body?.csv || '');
  if (!csv.trim()) return res.status(400).json({ error: 'CSV is required' });
  const offset = Math.max(0, Number(req.body?.offset) || 0);
  const limit = Math.min(40, Math.max(1, Number(req.body?.limit) || 15));
  const hideDemo = Boolean(req.body?.hideDemo);
  let parsed;
  try {
    parsed = parseWooCommerceCsv(csv);
  } catch {
    return res.status(400).json({ error: 'Could not read that CSV. Export Products from WooCommerce and upload the file.' });
  }
  const total = parsed.length;
  const slice = parsed.slice(offset, offset + limit);
  const prepared = [];
  for (const row of slice) {
    const images = await materializeImages(row.images);
    prepared.push({ ...row, images });
  }
  const created = [];
  const skipped = [];
  const errors = [];
  updateDb((d) => {
    d.categories = d.categories || [];
    d.products = d.products || [];
    if (hideDemo) {
      for (const p of d.products || []) {
        if (isDemoCatalogueId(p.id)) p.hidden = true;
      }
    }
    for (const row of prepared) {
      try {
        if (row.sku && (d.products || []).some((p) => p.sku && p.sku === row.sku)) {
          skipped.push({ sku: row.sku, name: row.name, reason: 'SKU already in the shop' });
          continue;
        }
        const cat = findOrCreateCategory(d, row.category);
        if (!cat) {
          errors.push({ name: row.name, error: 'No category to attach' });
          continue;
        }
        const product = {
          id: 'prd_' + nanoid(10),
          vendorId: req.user.id,
          categoryId: cat.id,
          name: row.name,
          slug: slugifyName(row.name),
          description: row.description,
          specifications: row.sku ? [{ name: 'SKU', value: row.sku }] : [],
          variants: [],
          brand: row.brand || cat.brands?.[0] || 'BigDrop',
          price: row.price,
          compareAt: row.compareAt,
          stock: Number.isFinite(row.stock) ? row.stock : 10,
          sku: resolveProductSku(row.sku, skuTakenSet(d.products)),
          images: row.images,
          featured: false,
          rating: 0,
          reviews: 0,
          reviewList: [],
          soldCount: 0,
          tags: ['woocommerce'],
          hidden: false,
          status: 'approved',
          source: 'woocommerce',
          createdAt: new Date().toISOString(),
        };
        d.products.push(product);
        created.push({ id: product.id, name: product.name, sku: product.sku, photos: product.images.length });
      } catch (err) {
        errors.push({ name: row.name, error: err.message || 'Could not save product' });
      }
    }
  });
  res.json({
    total,
    offset,
    limit,
    created: created.length,
    skipped: skipped.length,
    errors,
    items: created,
    skippedItems: skipped,
    done: offset + limit >= total,
  });
});

router.patch('/vendor/shop', authRequired, requireRole('vendor', 'admin'), (req, res) => {
  const { hours, storeName } = req.body || {};
  let vendor;
  updateDb((d) => {
    const u = d.users.find((x) => x.id === req.user.id);
    if (!u) return;
    if (hours && typeof hours === 'object') u.hours = { ...defaultVendorHours(), ...hours };
    if (storeName && req.user.role === 'vendor') u.storeName = String(storeName).trim();
    vendor = publicUser(u);
  });
  res.json({ vendor });
});

export function enrichStoreVendor(vendor) {
  const hours = vendor.hours || defaultVendorHours();
  return {
    hours,
    openNow: vendorIsOpen(hours),
    slug: vendorStoreSlug(vendor),
  };
}

export { DEFAULT_HOME_BLOCKS, PICKUP_POINTS, findCoupon, quoteDelivery, parseVariants, parseSpecifications };


export default router;
