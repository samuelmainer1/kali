/**
 * Assign catalogue vendors/brands, rewrite WOO- SKUs, and drop true duplicates.
 *
 * Run from the repo root: node server/scripts/assignVendorsAndDedupe.js [--dry-run]
 */
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { defaultVendorHours, resolveProductSku, skuTakenSet } from '../src/commerce.js';

const ROOT = path.resolve('server/data');
const DRY = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

const CHANDARIA_ID = 'usr_vendor6';
const BIGDROP_ID = 'usr_vendor7';
const PHONES_ID = 'usr_vendor8';

const BRAND_RULES = [
  { re: /\bvelvex\b/i, brand: 'Velvex' },
  { re: /\brosy\b/i, brand: 'Rosy' },
  { re: /\bziploc\b/i, brand: 'Ziploc' },
  { re: /\bcerave\b/i, brand: 'CeraVe' },
  { re: /l['’]?or[eé]al/i, brand: "L'Oréal" },
  { re: /\btoilex\b/i, brand: 'Toilex' },
  { re: /\bceline\b/i, brand: 'Celine' },
  { re: /nice\s*&\s*soft/i, brand: 'Nice & Soft' },
  { re: /\blivelle\b/i, brand: 'Livelle' },
  { re: /\bposhy\b/i, brand: 'Poshy' },
  { re: /\bpendo\b/i, brand: 'Pendo' },
  { re: /\bpetals\b/i, brand: 'Petals' },
];

const PHONE_BRANDS = [
  'Samsung',
  'Apple',
  'Nokia',
  'Xiaomi',
  'Huawei',
  'Oppo',
  'Infinix',
  'Tecno',
  'Hisense',
  'Awei',
  'Telco',
];

const TISSUE_RE =
  /\btissues?\b|\btoilet\s*(roll|paper|tissue)s?\b|\bserviettes?\b|\bsurviettes?\b|\bhank(?:y|ies)\b|\bkitchen\s*towels?\b/i;

function isTissue(p) {
  return TISSUE_RE.test(p?.name || '');
}

function inferredBrand(p) {
  const name = p?.name || '';
  for (const rule of BRAND_RULES) {
    if (rule.re.test(name)) return rule.brand;
  }
  if (p.categoryId === 'cat_phones') {
    const lower = name.toLowerCase();
    const hit = PHONE_BRANDS.find((b) => lower.startsWith(b.toLowerCase()) || new RegExp(`\\b${b}\\b`, 'i').test(name));
    if (hit) return hit;
  }
  return p.brand || '';
}

function isChandariaProduct(p) {
  const name = p?.name || '';
  return /\bvelvex\b/i.test(name) || /\brosy\b/i.test(name) || isTissue(p);
}

function isBigDropBrandProduct(p) {
  const name = p?.name || '';
  return /\bziploc\b/i.test(name) || /\bcerave\b/i.test(name) || /l['’]?or[eé]al/i.test(name);
}

function referencedIds(db) {
  const ids = new Set();
  const push = (id) => {
    if (id) ids.add(id);
  };
  for (const o of db.orders || []) {
    for (const it of o.items || []) push(it.productId);
  }
  for (const c of db.carts || []) {
    for (const it of c.items || []) push(it.productId);
  }
  for (const w of db.wishlists || []) push(w.productId);
  for (const r of db.reviews || []) push(r.productId);
  for (const q of db.questions || []) push(q.productId);
  for (const n of db.notifications || []) push(n.productId);
  for (const rr of db.returnRequests || []) push(rr.productId);
  return ids;
}

function normName(s) {
  return String(s || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function firstImage(p) {
  return (p.images && p.images[0]) || '';
}

function keepScore(p, refs) {
  const titleCase = p.name && p.name !== p.name.toUpperCase() ? 1 : 0;
  return [
    refs.has(p.id) ? 1 : 0,
    (p.images || []).length,
    titleCase,
    String(p.description || '').length,
    p.id,
  ];
}

function better(a, b, refs) {
  const sa = keepScore(a, refs);
  const sb = keepScore(b, refs);
  for (let i = 0; i < sa.length - 1; i += 1) {
    if (sa[i] !== sb[i]) return sa[i] > sb[i] ? a : b;
  }
  return String(a.id) <= String(b.id) ? a : b;
}

function dedupeProducts(products, refs) {
  const remove = new Set();
  const groups = new Map();
  for (const p of products) {
    const key = `${normName(p.name)}|${Number(p.price) || 0}|${firstImage(p)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(p);
  }
  for (const rows of groups.values()) {
    if (rows.length < 2) continue;
    let keep = rows[0];
    for (const p of rows.slice(1)) keep = better(keep, p, refs);
    for (const p of rows) if (p.id !== keep.id && !refs.has(p.id)) remove.add(p.id);
  }

  const bySku = new Map();
  for (const p of products) {
    if (remove.has(p.id)) continue;
    const sku = String(p.sku || '')
      .replace(/\s+/g, '')
      .toLowerCase();
    if (!sku) continue;
    if (!bySku.has(sku)) bySku.set(sku, []);
    bySku.get(sku).push(p);
  }
  for (const rows of bySku.values()) {
    if (rows.length < 2) continue;
    let keep = rows[0];
    for (const p of rows.slice(1)) keep = better(keep, p, refs);
    for (const p of rows) if (p.id !== keep.id && !refs.has(p.id)) remove.add(p.id);
  }

  const kept = products.filter((p) => !remove.has(p.id));
  return { kept, removed: products.filter((p) => remove.has(p.id)) };
}

function rewriteSkus(products) {
  const taken = skuTakenSet(products.filter((p) => !/^WOO[-_]/i.test(String(p.sku || '').trim())));
  let rewritten = 0;
  for (const p of products) {
    const next = resolveProductSku(p.sku, taken);
    if (next !== p.sku) {
      p.sku = next;
      rewritten += 1;
      if (Array.isArray(p.specifications)) {
        for (const spec of p.specifications) {
          if (spec && /^sku$/i.test(spec.name)) spec.value = next;
        }
      }
    }
  }
  return rewritten;
}

function refreshCategoryBrands(categories, products) {
  for (const cat of categories || []) {
    const brands = [];
    const seen = new Set();
    for (const p of products) {
      if (p.categoryId !== cat.id || p.hidden) continue;
      const brand = String(p.brand || '').trim();
      if (!brand) continue;
      const key = brand.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      brands.push(brand);
    }
    if (brands.length) cat.brands = brands.slice(0, 14);
  }
}

function upsertVendor(users, spec, passwordHash) {
  const byEmail = users.find((u) => String(u.email || '').toLowerCase() === spec.email);
  const byId = users.find((u) => u.id === spec.id);
  const existing = byEmail || byId;
  if (existing) {
    existing.role = 'vendor';
    existing.status = 'approved';
    existing.storeName = spec.storeName;
    existing.name = spec.name;
    existing.phone = spec.phone;
    existing.email = spec.email;
    existing.hours = existing.hours || defaultVendorHours();
    return existing;
  }
  const vendor = {
    id: spec.id,
    name: spec.name,
    email: spec.email,
    password: passwordHash,
    role: 'vendor',
    phone: spec.phone,
    storeName: spec.storeName,
    status: 'approved',
    hours: defaultVendorHours(),
    cart: [],
    createdAt: new Date().toISOString(),
  };
  users.push(vendor);
  return vendor;
}

function assignProducts(products) {
  const counts = { chandaria: 0, bigdrop: 0, phones: 0, brands: 0 };
  for (const p of products) {
    const brand = inferredBrand(p);
    if (brand && brand !== p.brand) {
      p.brand = brand;
      counts.brands += 1;
    } else if (brand) {
      p.brand = brand;
    }

    if (isChandariaProduct(p)) {
      if (p.vendorId !== CHANDARIA_ID) counts.chandaria += 1;
      p.vendorId = CHANDARIA_ID;
    } else if (isBigDropBrandProduct(p)) {
      if (p.vendorId !== BIGDROP_ID) counts.bigdrop += 1;
      p.vendorId = BIGDROP_ID;
    } else if (p.categoryId === 'cat_phones') {
      if (p.vendorId !== PHONES_ID) counts.phones += 1;
      p.vendorId = PHONES_ID;
    }
  }
  return counts;
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function saveJson(file, data) {
  if (DRY) {
    console.log(`  dry-run: skip write ${file}`);
    return;
  }
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

const passwordHash = await bcrypt.hash('password123', 10);
const vendorSpecs = [
  {
    id: CHANDARIA_ID,
    name: 'Priya Shah',
    email: 'chandaria@bigdrop.co.ke',
    storeName: 'Chandaria Supermarket 🛒',
    phone: '+254712345006',
  },
  {
    id: BIGDROP_ID,
    name: 'BigDrop Kenya',
    email: 'orders@bigdrop.co.ke',
    storeName: 'BigDrop Kenya',
    phone: '+254722359298',
  },
  {
    id: PHONES_ID,
    name: 'James Kariuki',
    email: 'phones@bigdrop.co.ke',
    storeName: 'Phone & Tablet Hub',
    phone: '+254712345008',
  },
];

function runOnDb(label, db, { users = true } = {}) {
  console.log(`\n=== ${label} ===`);
  if (users && Array.isArray(db.users)) {
    for (const spec of vendorSpecs) upsertVendor(db.users, spec, passwordHash);
  }
  const refs = referencedIds(db);
  const before = (db.products || []).length;
  const { kept, removed } = dedupeProducts(db.products || [], refs);
  db.products = kept;
  const assigned = assignProducts(db.products);
  const rewritten = rewriteSkus(db.products);
  refreshCategoryBrands(db.categories || [], db.products);
  console.log(`  products ${before} → ${db.products.length}  (removed ${removed.length} duplicates)`);
  if (removed.length) {
    for (const p of removed.slice(0, 12)) console.log(`    - ${p.name} [${p.sku}]`);
    if (removed.length > 12) console.log(`    … ${removed.length - 12} more`);
  }
  console.log(`  assigned Chandaria ${assigned.chandaria}, BigDrop Kenya ${assigned.bigdrop}, phones ${assigned.phones}, brands set ${assigned.brands}`);
  console.log(`  SKUs rewritten off WOO- : ${rewritten}`);
  const wooLeft = db.products.filter((p) => /^WOO[-_]/i.test(String(p.sku || ''))).length;
  console.log(`  remaining WOO- SKUs    : ${wooLeft}`);
  if (users && db.users) {
    for (const spec of vendorSpecs) {
      const n = db.products.filter((p) => p.vendorId === spec.id).length;
      console.log(`  ${spec.storeName}: ${n} products`);
    }
  }
  return db;
}

const dbPath = path.join(ROOT, 'db.json');
const wooPath = path.join(ROOT, 'woo-catalogue.json');
const seedPath = path.join(ROOT, 'seed.json');

if (fs.existsSync(dbPath)) {
  const db = loadJson(dbPath);
  runOnDb('db.json', db);
  saveJson(dbPath, db);
}
if (fs.existsSync(wooPath)) {
  const woo = loadJson(wooPath);
  runOnDb('woo-catalogue.json', woo, { users: false });
  saveJson(wooPath, woo);
}
if (fs.existsSync(seedPath)) {
  const seed = loadJson(seedPath);
  if (Array.isArray(seed.users)) {
    for (const spec of vendorSpecs) upsertVendor(seed.users, spec, passwordHash);
    saveJson(seedPath, seed);
    console.log('\nseed.json: vendor accounts upserted');
  }
}

console.log(DRY ? '\nDry run complete.' : '\nDone.');
