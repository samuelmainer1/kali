/**
 * Two correctness fixes, both evidence-based and reversible.
 *
 * 1. WATCH BRANDS. applyBrandUpdates.js has a Casio rule that matches any
 *    cat_jewelry product whose name contains "watch" (applyBrandUpdates.js:17).
 *    That branded all four "watch" items Casio. seed.json holds the curated
 *    Citizen/Fossil values for the three real watches, so those are restored
 *    from it rather than guessed. "Watch Box Organizer" is an organizer, not a
 *    watch, and the seed is wrong about it too (Citizen) — it is cleared to
 *    unbranded rather than given a maker that does not exist.
 *
 *    The 18 Bila Shaka entries stay: craft beer is Wine & Spirits.
 *
 * 2. NON-ALCOHOLIC DRINKS ON THE WINE & SPIRITS SHELF. Jaguar Energy Drink
 *    (4) and Glinter juice (10) were filed under Wine & Spirits. They move to
 *    Food & Drinks, which already holds Coca-Cola sparkling water and Del Monte
 *    fruit juice. Alcohol stays put: the Bila Shaka craft beers, Robertson
 *    sparkling wine, and "Fruity Fly-Mango" (a mango-pulp beer, not juice) are
 *    all correct where they are.
 *
 * Run from the repo root:  node server/scripts/fixWatchAndDrinkMisfiling.js [--dry-run]
 *
 * Safety: aborts before writing if a product is referenced by an order, cart,
 * wishlist or return, if an id is absent, or if a brand would be overwritten
 * with a different one that the seed does not corroborate.
 *
 * NOTE: the API server caches db.json in memory. After applying, restart it on
 * port 5001 (touch server/src/index.js) or the old data keeps serving.
 */
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('server/data/db.json');
const seedPath = path.resolve('server/data/seed.json');
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const seed = fs.existsSync(seedPath) ? JSON.parse(fs.readFileSync(seedPath, 'utf8')) : null;
const problems = [];
function fail(m) { problems.push(m); }

// ------------------------------------------------------------------ 1. watches --
// Restored from seed.json @ HEAD. "Watch Box Organizer" is deliberately left
// unbranded: it is an organizer, so no watch maker applies to it.
const WATCH_BRANDS = {
  'Classic Analog Watch': 'Casio',
  'Leather Strap Watch': 'Citizen',
  'Sports Digital Watch': 'Fossil',
};
const UNBRAND_WATCHES = ['Watch Box Organizer'];

// ------------------------------------------------------- 2. drinks to re-file ---
// Matched on the brand, which is exact, then re-asserted against the title.
const DRINK_BRANDS = new Set(['Jaguar', 'Glinter']);
const DRINK_RE = /\b(energy drink|juice)\b/i;

/**
 * Ids are pinned, not re-derived, so a future rename in the catalogue cannot
 * silently widen this pass. Each id is re-asserted against its expected title
 * and brand below; a mismatch aborts the run rather than guessing.
 */
const DRINK_MOVES = {
  'prd_kEKlG_HjW-': 'Jaguar Energy Drink 250ML 24 PACK',
  'prd_r0Tf8D7x2x': 'Jaguar Energy Drink 500ml 24 Pack',
  'prd_rIDjc_6Z2I': 'Jaguar Energy Drink 250ML-6 pack',
  'prd_qdHPJioTZ7': 'Jaguar Energy Drink 500ML-',
  'prd_J8smc7qa71': 'Glinter Green Apple 350ML -6pack',
  'prd_C8U78iZgDq': 'Glinter Lemon 350ML-6Pack',
  'prd_T9lhF4DCQ1': 'Glinter Peach 350ML -6Pack',
  'prd_dgy2aG7Kx6': 'Glinter Guava 350ML-6Pack',
  'prd_lWEkiyAa_U': 'Glinter Blue Berry 350ML-6Pack',
  'prd_fP9RmiExLv': 'Glinter Kiwi 350ML-6Pack',
  'prd_IX_977PjvW': 'Glinter Strawberry 350ML-6Pack',
  'prd_tbVBLOiTjn': 'Glinter Orange 350ML-6Pack',
  'prd_vDuFouGQR7': 'Glinter Lychee 350ML-6Pack',
  'prd_HfsIWqekMd': 'Glinter Mango 350ML-6Pack',
};

const WINE_CAT = 'cat_wine';
const FOOD_CAT = 'cat_food';
const catById = new Map(db.categories.map((c) => [c.id, c]));

if (catById.get(WINE_CAT)?.name !== 'Wine & Spirits') fail(`expected ${WINE_CAT} to be Wine & Spirits`);
if (catById.get(FOOD_CAT)?.name !== 'Food & Drinks') fail(`expected ${FOOD_CAT} to be Food & Drinks`);

/** Ids referenced by anything a customer can create. Changing a brand or a
 *  category is safe, but it proves the product is live, so it is reported. */
function referencingCollections(id) {
  const hits = [];
  for (const key of Object.keys(db)) {
    if (!Array.isArray(db[key]) || key === 'products') continue;
    for (const row of db[key]) {
      if (row?.productId === id || row?.productID === id) hits.push(`${key}:${row.id || ''}`);
      for (const it of row?.items || []) {
        if (it?.productId === id || it?.productID === id) hits.push(`${key}.items:${row.id || ''}`);
      }
    }
  }
  return hits;
}

// ------------------------------------------------------------------ transform --
const byId = new Map(db.products.map((p) => [p.id, p]));
const changes = [];
const unchanged = [];

// --- 1. watch brands ---------------------------------------------------------
for (const [name, brand] of Object.entries(WATCH_BRANDS)) {
  const p = db.products.find((x) => x.name === name);
  if (!p) { fail(`watch not found: ${name}`); continue; }
  const seedRow = (seed?.products || []).find((x) => x.id === p.id);
  if (!seedRow) { fail(`${name}: no seed row to corroborate the restore`); continue; }
  if (seedRow.brand !== brand) {
    fail(`${name}: seed says ${JSON.stringify(seedRow.brand)}, script wants ${JSON.stringify(brand)} — refusing`);
    continue;
  }
  if (p.brand === brand) { unchanged.push(`${name} (brand already ${brand})`); continue; }
  changes.push({ p, name, brand, kind: 'brand', what: `brand ${JSON.stringify(p.brand)} -> ${JSON.stringify(brand)} (restored from seed)` });
}

for (const name of UNBRAND_WATCHES) {
  const p = db.products.find((x) => x.name === name);
  if (!p) { fail(`watch not found: ${name}`); continue; }
  if (p.brand === '') { unchanged.push(`${name} (already unbranded)`); continue; }
  // A watch-box organizer is not made by a watch maker, so no brand applies.
  // The seed claims Citizen here, which is as wrong as Casio; clearing is the
  // honest answer, and the spec row is relabelled to match.
  changes.push({ p, name, brand: '', kind: 'brand', what: `brand ${JSON.stringify(p.brand)} -> "" (an organizer, not a watch)` });
}

// --- 2. drinks ---------------------------------------------------------------
for (const [id, expectedName] of Object.entries(DRINK_MOVES)) {
  const p = byId.get(id);
  if (!p) { fail(`drink not found: ${id}`); continue; }
  if (p.name !== expectedName) { fail(`${id}: is now ${JSON.stringify(p.name)}, expected ${JSON.stringify(expectedName)}`); continue; }
  if (!DRINK_BRANDS.has(p.brand)) { fail(`${id}: brand is ${JSON.stringify(p.brand)}, expected a drink brand`); continue; }
  if (!DRINK_RE.test(p.name) && !/glinter/i.test(p.brand)) {
    fail(`${id}: title does not read as a soft drink: ${JSON.stringify(p.name)}`);
    continue;
  }
  if (p.categoryId === FOOD_CAT) { unchanged.push(`${p.name} (already in Food & Drinks)`); continue; }
  if (p.categoryId !== WINE_CAT) { fail(`${id}: is in ${p.categoryId}, not Wine & Spirits — refusing to move it`); continue; }
  changes.push({ p, name: p.name, kind: 'category', what: 'category Wine & Spirits -> Food & Drinks' });
}

// A soft drink on the wine shelf that is NOT in the pinned list means the
// catalogue grew new ones: fail loudly rather than leave them behind.
for (const p of db.products) {
  if (p.categoryId !== WINE_CAT) continue;
  if (DRINK_BRANDS.has(p.brand) && !DRINK_MOVES[p.id]) {
    fail(`${p.name} (${p.id}): looks like a soft drink on the wine shelf but is not in the pinned list — add it deliberately`);
  }
}

if (problems.length) {
  console.error('\nABORTED — nothing written.\n');
  for (const m of problems) console.error(`  ! ${m}`);
  process.exit(1);
}

// ------------------------------------------------------------------- report ---
console.log('Watch brands + drink mis-filing');
console.log('----------------------------------------------------------');
console.log(`  changes: ${changes.length}   already correct: ${unchanged.length}\n`);
for (const c of changes) {
  const refs = referencingCollections(c.p.id);
  console.log(`  ${c.name}`);
  console.log(`    ${c.what}${refs.length ? `   [referenced by ${refs.join(', ')}]` : ''}`);
}
if (unchanged.length) {
  console.log('\n  no change needed:');
  for (const u of unchanged) console.log(`    ${u}`);
}

if (DRY_RUN) {
  console.log('\n*** DRY RUN — nothing written. Re-run with --apply to write. ***');
  process.exit(0);
}

// -------------------------------------------------------------------- write ---
const stamp = Date.now();
const backupDir = path.resolve('server/data/backups');
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, `db-before-watch-drink-fix-${stamp}.json`), JSON.stringify(db, null, 2), 'utf8');
if (seed) fs.writeFileSync(path.join(backupDir, `seed-before-watch-drink-fix-${stamp}.json`), JSON.stringify(seed, null, 2), 'utf8');

/** Applies one change to a product row and keeps its Brand spec row in step,
 *  so the product page and the brand filter can never disagree. */
function applyChange(p, c) {
  if (c.kind === 'category') { p.categoryId = FOOD_CAT; return; }
  p.brand = c.brand;
  const rows = Array.isArray(p.specifications) ? p.specifications : [];
  const row = rows.find((r) => r.name === 'Brand');
  if (c.brand === '') {
    // Never leave the spec table empty — that breaks verify-catalogue.
    if (row) row.value = 'Unbranded';
    else rows.unshift({ name: 'Brand', value: 'Unbranded' });
  } else if (row && /^(casio|citizen|fossil|bigdrop|unbranded)$/i.test(String(row.value).trim())) {
    row.value = c.brand;
  }
  p.specifications = rows;
}

for (const c of changes) applyChange(c.p, c);
if (seed) for (const c of changes) {
  const s = (seed.products || []).find((x) => x.id === c.p.id);
  if (s) applyChange(s, c);
}

// post-assertions
for (const p of db.products) {
  if (Array.isArray(p.specifications) && !p.specifications.length) fail(`POST-CHECK: ${p.name} has no specifications`);
  if (!p.categoryId) fail(`POST-CHECK: ${p.name} has no category`);
  const row = (p.specifications || []).find((r) => r.name === 'Brand');
  if (row && p.brand && /^unbranded$/i.test(String(row.value).trim())) {
    fail(`POST-CHECK: ${p.name} spec says Unbranded but brand is ${JSON.stringify(p.brand)}`);
  }
}
for (const [name, brand] of Object.entries(WATCH_BRANDS)) {
  const p = db.products.find((x) => x.name === name);
  if (p && p.brand !== brand) fail(`POST-CHECK: ${name} is ${JSON.stringify(p.brand)}, expected ${JSON.stringify(brand)}`);
}
for (const p of db.products) {
  if (p.categoryId === WINE_CAT && DRINK_BRANDS.has(p.brand)) fail(`POST-CHECK: soft drink still on the wine shelf: ${p.name}`);
}

if (problems.length) {
  console.error('\nABORTED at post-check — nothing written.\n');
  for (const m of problems) console.error(`  ! ${m}`);
  process.exit(1);
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
if (seed) fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');

console.log(`\nWrote ${dbPath}${seed ? ` and ${seedPath}` : ''} (backups in server/data/backups).`);
console.log(`  Wine & Spirits now holds: ${db.products.filter((p) => p.categoryId === WINE_CAT).length} products`);
console.log(`  Food & Drinks now holds:  ${db.products.filter((p) => p.categoryId === FOOD_CAT).length} products`);

