/**
 * Catalogue data-quality gate — run from the repo root:
 *
 *   node tools/verify-catalogue.mjs
 *
 * Checks the invariants the storefront depends on, so a data-maintenance pass
 * (server/scripts/*.js) can be verified afterwards in one command:
 *
 *   1. no mojibake left anywhere in the catalogue
 *   2. no product shipped without specifications
 *   3. category integrity (orphaned products, bad slugs)
 *   4. unique product ids/slugs
 *   5. every homepage shelf can fill 10 unique tiles — replicating the
 *      de-duplication rules in client/src/pages/Home.jsx
 *
 * Exits non-zero when an invariant fails, so it can be used in CI.
 */
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('server/data/db.json');
const MOJI = /Ã[\u0080-\u00ff]|Â[\u00a0-\u00bf]|â€|\ufffd/;
const results = [];
const check = (ok, label, detail = '') => results.push({ ok, label, detail });

// ---------------------------------------------------------------- 1. encoding ---
let db;
try {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  check(true, 'db.json parses');
} catch (e) {
  check(false, 'db.json parses', e.message);
  console.error('Cannot continue without a readable db.json');
  process.exit(1);
}

const damaged = [];
(function walk(node, where) {
  if (Array.isArray(node)) return node.forEach((x, i) => walk(x, `${where}[${i}]`));
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) walk(node[k], `${where}.${k}`);
    return;
  }
  if (typeof node === 'string' && MOJI.test(node)) {
    damaged.push(`${where} = ${JSON.stringify(node.slice(0, 90))}`);
  }
})(db, 'db');
check(damaged.length === 0, 'no mojibake anywhere in the catalogue',
  damaged.length ? `${damaged.length} damaged string(s): ${damaged.slice(0, 3).join(' | ')}` : '');

// --------------------------------------------------------------- 2. specifications ---
const products = db.products || [];
const categories = db.categories || [];
const noSpecs = products.filter((p) => !(p.specifications || []).length);
check(noSpecs.length === 0, 'every product has specifications',
  noSpecs.length ? `${noSpecs.length} product(s) without specs, e.g. ${noSpecs.slice(0, 3).map((p) => p.name).join(', ')}` : '');

// Keys must use the canonical spelling, and rows that only duplicate a field
// already stored elsewhere must stay gone — server/scripts/normalizeSpecs.js
// enforces this, this gate stops it regressing.
const ALIAS = {
  Color: 'Colour', Sizes: 'Size', OS: 'Operating System',
  MATERIAL: 'Material', SIZES: 'Size', 'Package Content': 'Package Contents',
};
const REDUNDANT = ['SKU', 'Category', 'Condition'];
const strayAlias = [];
const strayRedundant = [];
const dupKeys = [];
for (const p of products) {
  const seen = new Set();
  for (const r of p.specifications || []) {
    const n = String(r.name);
    if (ALIAS[n]) strayAlias.push(`${p.name}: ${n}`);
    if (REDUNDANT.includes(n)) strayRedundant.push(`${p.name}: ${n}`);
    if (seen.has(n)) dupKeys.push(`${p.name}: duplicate "${n}"`);
    seen.add(n);
  }
}
check(strayAlias.length === 0, 'spec keys use canonical spelling (no Color/Sizes/OS/MATERIAL/SIZES)',
  strayAlias.length ? `${strayAlias.length}, e.g. ${strayAlias.slice(0, 3).join(' | ')}` : '');
check(strayRedundant.length === 0, 'no redundant spec rows (SKU/Category/Condition)',
  strayRedundant.length ? `${strayRedundant.length}, e.g. ${strayRedundant.slice(0, 3).join(' | ')}` : '');
check(dupKeys.length === 0, 'no duplicate spec keys within a product',
  dupKeys.length ? `${dupKeys.length}, e.g. ${dupKeys.slice(0, 3).join(' | ')}` : '');

// A Brand spec row must agree with product.brand — the field is what
// routes.js filters and builds the brand facet from, so a row naming anything
// else shows a value with nothing behind it ("Toilex 2-ply tissue"). Compared
// exactly, not case-insensitively: the shop facet is built from product.brand
// verbatim, so a row reading "MAYERS" where the field says "Mayers" renders a
// value the shopper cannot click through to, and fixBrands.js canonicalises it.
const brandRowConflicts = [];
const PLACEHOLDER_B = /^(big\s*drop|unbranded)$/i;
const squash = (v) => String(v || '').trim().replace(/\s+/g, ' ').normalize('NFC');
for (const p of products) {
  if (!squash(p.brand)) continue; // unbranded: the row legitimately says "Unbranded"
  for (const r of p.specifications || []) {
    if (r.name !== 'Brand') continue;
    if (PLACEHOLDER_B.test(squash(r.value))) continue; // re-sync target, not a conflict
    if (squash(r.value) !== squash(p.brand)) {
      brandRowConflicts.push(`${p.name}: "${r.value}" vs "${p.brand}"`);
    }
  }
}
check(brandRowConflicts.length === 0, 'spec Brand row agrees with the brand field',
  brandRowConflicts.length ? `${brandRowConflicts.length}, e.g. ${brandRowConflicts.slice(0, 3).join(' | ')}` : '');

// ------------------------------------------------------------- 3. categories ---
const catById = new Map(categories.map((c) => [c.id, c]));
const unknownCat = products.filter((p) => p.categoryId && !catById.has(p.categoryId));
check(unknownCat.length === 0, 'every product points at a real category',
  unknownCat.length ? `${unknownCat.length} orphaned product(s), e.g. ${unknownCat.slice(0, 3).map((p) => p.name).join(', ')}` : '');

const badSlugs = categories.filter((c) => !c.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.slug));
check(badSlugs.length === 0, 'all category slugs are kebab-case',
  badSlugs.length ? badSlugs.map((c) => JSON.stringify(c.slug)).join(', ') : '');

// ------------------------------------------------------------- 4. uniqueness ---
const ids = new Set(); const dupIds = [];
const slugs = new Set(); const dupSlugs = [];
for (const p of products) {
  if (ids.has(p.id)) dupIds.push(p.id);
  ids.add(p.id);
  if (p.slug) {
    if (slugs.has(p.slug)) dupSlugs.push(p.slug);
    slugs.add(p.slug);
  }
}
check(dupIds.length === 0, 'product ids are unique', dupIds.length ? dupIds.slice(0, 5).join(', ') : '');
check(dupSlugs.length === 0, 'product slugs are unique', dupSlugs.length ? dupSlugs.slice(0, 5).join(', ') : '');

// ---------------------------------------------------------------- 5. shelves ---
// Mirrors client/src/pages/Home.jsx: shelves de-duplicate on BOTH id and a
// normalised name, because the catalogue legitimately contains rows that share
// a name (re-imported WooCommerce items), and a repeated title in one shelf
// looks broken to a shopper.
const nameKey = (p) => String(p?.name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

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

// The public catalogue is listApproved() in server/src/routes.js — approved and
// not hidden — which is exactly the array Home.jsx renders.
const live = products.filter((p) => p.status === 'approved' && !p.hidden);
const bestPool = [...live].sort((a, b) => (b.soldCount || b.reviews || 0) - (a.soldCount || a.reviews || 0));
const ratingPool = [...live].sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviews || 0) - (a.reviews || 0));

const shelves = [
  ['featured', padToAtLeast(live.filter((p) => p.featured), bestPool, 10)],
  ['best sellers', padToAtLeast(bestPool.slice(0, 10), bestPool, 10)],
  ['top selling', padToAtLeast([...live].sort((a, b) => (b.soldCount || 0) - (a.soldCount || 0)).slice(10, 20), bestPool, 10)],
  ['customer choice', padToAtLeast([...live].filter((p) => (p.rating || 0) >= 4.5).sort((a, b) => (b.rating || 0) - (a.rating || 0)), ratingPool, 10)],
];

for (const cat of categories) {
  const inCategory = live.filter((p) => p.categorySlug === cat.slug || p.categoryId === cat.id);
  const sorted = [...inCategory].sort((a, b) => (b.soldCount || b.reviews || 0) - (a.soldCount || a.reviews || 0));
  shelves.push([`category ${cat.slug}`, padToAtLeast(sorted, bestPool, 10)]);
}

const shortShelves = shelves.filter(([, list]) => list.length < 10);
check(shortShelves.length === 0, `all ${shelves.length} homepage shelves fill 10 unique tiles`,
  shortShelves.length ? shortShelves.map(([label, list]) => `${label}=${list.length}`).join(', ') : '');

// ------------------------------------------------- 6. images exist on disk ---
// The storefront renders /uploads/... paths straight from both catalogues, so a
// file that was never downloaded (or was swept as an orphan) is a broken tile.
// Seed-only references count too: db.js copies seed.json over db.json on a first
// boot, and tools/sweep-orphans.mjs used to delete seed-only files, which broke
// three seeded hero banners.
const uploadsDir = path.resolve('server/uploads');
const refs = new Set();
const refWhere = new Map();
function collectImages(node, where) {
  if (typeof node === 'string') {
    if (node.startsWith('/uploads/') && !refs.has(node)) {
      refs.add(node);
      refWhere.set(node, where);
    }
    return;
  }
  if (Array.isArray(node)) return node.forEach((x, i) => collectImages(x, `${where}[${i}]`));
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) collectImages(node[k], `${where}.${k}`);
  }
}

let seed = null;
try {
  seed = JSON.parse(fs.readFileSync(path.resolve('server/data/seed.json'), 'utf8'));
} catch { /* seed.json is optional for this gate */ }
collectImages(db, 'db');
if (seed) collectImages(seed, 'seed');

const missingImages = [...refs].filter((r) => !fs.existsSync(path.join(uploadsDir, r.replace('/uploads/', ''))));
if (!fs.existsSync(uploadsDir)) {
  check(true, 'image files not checked — this checkout has no server/uploads folder');
} else {
  check(missingImages.length === 0, `every upload reference exists on disk (${refs.size} checked, db + seed)`,
    missingImages.length
      ? `${missingImages.length} missing, e.g. ${missingImages.slice(0, 3).map((r) => `${r} (${refWhere.get(r)})`).join(' | ')}`
      : '');
}

// ------------------------------------------------ 7. product payload ≤ 150KB ---
// Product galleries are capped end to end: the browser crops to 800×800 JPEG at
// ≤150KB (client/src/lib/imageUpload.js), the API refuses a bigger data URL
// (server/src/uploads.js), and a remote photo is re-encoded to WebP at ≤150KB.
// server/scripts/optimize-product-images.mjs is the pass that brings older
// pictures inside the cap, so a regression here means it must be re-run.
const PRODUCT_MAX_BYTES = 150 * 1024; // mirrors server/src/uploads.js
const oversized = [];
let galleryRefs = 0;
for (const [label, data] of [['db', db], ['seed', seed]]) {
  if (!data) continue;
  for (const p of data.products || []) {
    for (const img of Array.isArray(p.images) ? p.images : []) {
      if (typeof img !== 'string' || !img.startsWith('/uploads/')) continue;
      const abs = path.join(uploadsDir, img.replace('/uploads/', ''));
      if (!fs.existsSync(abs)) continue; // already reported as missing above
      galleryRefs++;
      const bytes = fs.statSync(abs).size;
      if (bytes > PRODUCT_MAX_BYTES) oversized.push(`${label} ${p.name}: ${img} = ${Math.round(bytes / 1024)}KB`);
    }
  }
}
check(oversized.length === 0, `no product gallery image is over 150KB (${galleryRefs} checked)`,
  oversized.length
    ? `${oversized.length} over the cap, e.g. ${oversized.slice(0, 3).join(' | ')} — run node server/scripts/optimize-product-images.mjs --write`
    : '');

// -------------------------------------------------------------------- report ---
console.log(`Catalogue: ${products.length} products (${live.length} approved), ${categories.length} categories\n`);
let failed = 0;
for (const { ok, label, detail } of results) {
  if (!ok) failed++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `\n        ${detail}` : ''}`);
}
console.log(`\n${failed ? `${failed} check(s) FAILED` : 'All checks passed'}`);
if (failed) process.exit(1);

