/**
 * BigDrop catalogue maintenance script.
 *
 * Two fixes for the product table:
 *
 *   1. De-duplicate the Celine toilet-tissue listings. Two rows are provably the
 *      same product (identical SKU once spacing/case is ignored), and three more
 *      are the same product imported twice under a terse uppercase name and a
 *      descriptive title-case name. One row per pack size is kept — the
 *      title-case row, which is the naming the storefront and the reported
 *      product use — and the five redundant rows are removed.
 *
 *      NOTE: the two batches carry different prices (the uppercase batch is
 *      internally consistent at 114/228/565 for 2s/4s/10s, the title-case batch
 *      is not). Prices were NOT changed here — that is a separate decision.
 *
 *   2. Move every product whose name contains "Tissue" onto Chandaria Supermarket
 *      (usr_vendor6), which already owns 38 tissue listings.
 *
 * Safety: every deletion is an explicit id + name pair that is re-verified at
 * run time, and a product referenced by an order, cart, wishlist, Q&A,
 * notification or return request is never removed. The script aborts before
 * writing if the Chandaria account cannot be confirmed or if any assertion
 * fails.
 *
 * Run from the repo root:  node server/scripts/productCleanup.js [--dry-run]
 *
 * NOTE: the API server caches db.json in memory. After applying, restart the
 * server on port 5001 (touch server/src/index.js) or the old data keeps serving.
 */
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('server/data/db.json');
const seedPath = path.resolve('server/data/seed.json');
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

const CHANDARIA_ID = 'usr_vendor6';

// Explicit allow-list. id is the primary key; name is re-checked so a stale list
// can never delete a different product that later reused an id.
const DELETE = [
  { id: 'prd_RRsf7ucsFr', name: 'CELINE LUXURY TOILET TISSUE TWIN PACK' },
  { id: 'prd_-ive_BQxVo', name: 'CELINE LUXURY TOILET FOUR PACK' },
  { id: 'prd_OMnxLZCrmu', name: 'CELINE LUXURY TOILET TISSUE 10PACK' },
  { id: 'prd_yY7hrsWQK4', name: 'CELINE SIGNATURE COLLECTION TOILET TISSUE' },
  { id: 'prd_cjZV31Nzr-', name: 'CELINE ROLL POA' },
];

const TISSUE_RE = /\btissue\b/i;
const problems = [];
const fail = (m) => problems.push(m);

let db;
try {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
} catch (e) {
  console.error(`Cannot read ${dbPath}: ${e.message}`);
  process.exit(1);
}
// Captured before any mutation below, so the backup is a real restore point.
const dbBefore = JSON.stringify(db, null, 2);
const users = new Map((db.users || []).map((u) => [u.id, u]));
const deleteIds = new Set(DELETE.map((d) => d.id));

// ---------------------------------------------------- references that block deletion ---
function referencesTo(ids) {
  const hits = [];
  const push = (where, id) => hits.push(`${where}:${id}`);
  for (const o of db.orders || []) for (const it of o.items || []) if (ids.has(it.productId)) push('order', it.productId);
  for (const c of db.carts || []) for (const it of c.items || []) if (ids.has(it.productId)) push('cart', it.productId);
  for (const w of db.wishlists || []) if (ids.has(w.productId)) push('wishlist', w.productId);
  for (const r of db.reviews || []) if (ids.has(r.productId)) push('review', r.productId);
  for (const q of db.questions || []) if (ids.has(q.productId)) push('question', q.productId);
  for (const n of db.notifications || []) if (ids.has(n.productId)) push('notification', n.productId);
  for (const rr of db.returnRequests || []) if (ids.has(rr.productId)) push('return', rr.productId);
  for (const p of db.products || []) for (const r of p.reviewList || []) if (ids.has(r.productId)) push('product.reviewList', r.productId);
  return hits;
}

// ---------------------------------------------------------------- 1. de-duplicate ---
console.log('--- 1. Celine de-duplication ---');
let removed = 0;
const removals = [];
for (const want of DELETE) {
  const p = db.products.find((x) => x.id === want.id);
  if (!p) { console.log(`  already removed  ${want.name}`); continue; } // idempotent re-run
  if (p.name !== want.name) {
    fail(`id ${want.id} now holds ${JSON.stringify(p.name)}, expected ${JSON.stringify(want.name)} — refusing to delete`);
    continue;
  }
  removals.push(p);
}
const refHits = referencesTo(new Set(removals.map((p) => p.id)));
for (const h of refHits) fail(`product is referenced elsewhere (${h}) — refusing to delete`);

if (!refHits.length) {
  for (const p of removals) {
    db.products = db.products.filter((x) => x.id !== p.id);
    removed++;
    console.log(`  remove  ${p.name}  (id=${p.id}, sku=${JSON.stringify(p.sku)}, price=${p.price})`);
  }
  if (!removals.length) console.log('  nothing to remove');
}

// ------------------------------------------------------- 2. tissue -> Chandaria ---
console.log('\n--- 2. Tissue products -> Chandaria Supermarket ---');
const target = users.get(CHANDARIA_ID);
if (!target) fail(`vendor ${CHANDARIA_ID} not found in db.users`);
else {
  if (target.role !== 'vendor') fail(`${target.name} (id=${CHANDARIA_ID}) has role=${target.role}, expected "vendor"`);
  if (target.status !== 'approved') fail(`${target.name} (id=${CHANDARIA_ID}) has status=${target.status}, expected "approved"`);
}
const tissue = db.products.filter((p) => TISSUE_RE.test(p.name || ''));
let moved = 0;
const movedFrom = {};
for (const p of tissue) {
  if (p.vendorId === CHANDARIA_ID) continue;
  const from = users.get(p.vendorId);
  movedFrom[from?.storeName || from?.name || p.vendorId] = (movedFrom[from?.storeName || from?.name || p.vendorId] || 0) + 1;
  p.vendorId = CHANDARIA_ID;
  moved++;
}
console.log(`  tissue listings found : ${tissue.length}`);
console.log(`  already with Chandaria: ${tissue.length - moved}`);
console.log(`  moved                 : ${moved}`);
for (const [from, n] of Object.entries(movedFrom)) console.log(`      from ${from}: ${n}`);
console.log(`  target                : ${target ? `${target.name} (${target.storeName})` : 'MISSING'}`);

// ------------------------------------------------------------------ seed.json ---
let seed = null;
let seedBefore = null;
if (fs.existsSync(seedPath)) {
  seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  seedBefore = JSON.stringify(seed, null, 2); // before mutation
  const before = (seed.products || []).length;
  seed.products = (seed.products || []).filter((p) => !deleteIds.has(p.id));
  let seedMoved = 0;
  for (const p of seed.products || []) {
    if (TISSUE_RE.test(p.name || '') && p.vendorId !== CHANDARIA_ID) { p.vendorId = CHANDARIA_ID; seedMoved++; }
  }
  console.log(`\n  seed.json: ${(seed.products || []).length - before} removed, ${seedMoved} reassigned`);
}

// -------------------------------------------------------------- post-assertions ---
const stillThere = DELETE.filter((d) => db.products.some((p) => p.id === d.id));
if (stillThere.length) fail(`${stillThere.length} deletion(s) did not take effect: ${stillThere.map((d) => d.id).join(', ')}`);

const strayTissue = (db.products || []).filter((p) => TISSUE_RE.test(p.name || '') && p.vendorId !== CHANDARIA_ID);
if (strayTissue.length) fail(`${strayTissue.length} tissue product(s) still on another vendor: ${strayTissue.slice(0, 3).map((p) => p.name).join(' | ')}`);

const ids = new Set((db.products || []).map((p) => p.id));
if (ids.size !== db.products.length) fail('duplicate product ids after cleanup');

// ---------------------------------------------------------------------- report ---
console.log('');
if (problems.length) {
  console.error(`ABORT — ${problems.length} safety check(s) failed, nothing was written:`);
  for (const p of problems.slice(0, 10)) console.error(`  - ${p}`);
  process.exit(1);
}
if (DRY_RUN) {
  console.log('*** DRY RUN — no backups written, no files modified ***');
  process.exit(0);
}
if (!removed && !moved) {
  console.log('Nothing to change.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve('server/data/backups');
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, `db-before-product-cleanup-${Date.now()}.json`), dbBefore, 'utf8');
fs.writeFileSync(path.resolve(`server/data/db.json.pre-product-cleanup-${stamp}`), dbBefore, 'utf8');
if (seed && seedBefore) {
  fs.writeFileSync(path.resolve(`server/data/seed.json.pre-product-cleanup-${stamp}`), seedBefore, 'utf8');
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
if (seed) fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');

console.log(`Wrote ${dbPath}${seed ? ' and ' + seedPath : ''} (backups in server/data/backups).`);
console.log('Restart the API server (port 5001) — it caches db.json in memory.');
console.log('Then run: node tools/verify-catalogue.mjs');

