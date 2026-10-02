/**
 * BigDrop catalogue maintenance script.
 *
 * Tidies the specification table so it reads consistently on the product page:
 *
 *   1. Key normalisation — unambiguous aliases only:
 *        Color -> Colour, Sizes -> Size, OS -> Operating System
 *      If a product already carries both spellings the rows are merged into one,
 *      keeping the canonical row and only copying a value across when the
 *      canonical row is empty.
 *   2. Removal of redundant rows:
 *        SKU       dropped when it equals product.sku (recovered onto
 *                  product.sku first if that field was empty). If the row holds
 *                  a different, upstream marketplace code it is kept and
 *                  relabelled "Supplier SKU" — that value exists nowhere else,
 *                  so it is never discarded.
 *        Category  duplicates product.categoryId, and had gone stale for the 96
 *                  products that were re-filed
 *        Condition always "New" across all 225 rows — carries no information
 *   3. Duplicate keys collapse into one row. Where the two values disagree the
 *      product's own title decides (e.g. "Silver Matte and Lime" beats a
 *      "Gray" row); genuinely ambiguous pairs keep the canonical value and are
 *      listed in the report rather than silently dropped.
 *   4. Re-back-fill — any product left with no specifications gets a real one
 *      parsed from its own title (Capacity / Size / Colour), falling back to
 *      Brand, so the page never shows an empty spec table.
 *
 * Deliberately NOT touched: the Brand row (956 products), and it is never
 * merged with "Battery Capacity" — a battery capacity is not a product capacity.
 *
 * Safety: aborts before writing if a Condition row is anything other than "New",
 * if duplicate keys remain, if a removed alias survives, or if any product would
 * be left without specifications. Values that exist nowhere else (an upstream
 * SKU) are preserved rather than dropped.
 *
 * Run from the repo root:  node server/scripts/normalizeSpecs.js [--dry-run]
 *
 * NOTE: the API server caches db.json in memory. After applying, restart the
 * server on port 5001 (touch server/src/index.js) or the old data keeps serving.
 */
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('server/data/db.json');
const seedPath = path.resolve('server/data/seed.json');
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

// SHOUT-CASED and singular/plural strays that survived the first pass, found by
// tools/verify-catalogue.mjs. MATERIAL/SIZES were upper-case title echoes;
// "Package Content" is the singular of the catalogue's "Package Contents".
// RAM is deliberately absent: it is a conventional acronym with no competing
// spelling, so renaming it would be churn.
const RENAME = {
  Color: 'Colour', Sizes: 'Size', OS: 'Operating System',
  MATERIAL: 'Material', SIZES: 'Size', 'Package Content': 'Package Contents',
};
const JUNK = ['SKU', 'Category', 'Condition'];
const JUNK_SET = new Set(JUNK);

// Values that make a redundant row safe to delete are checked per product.
const problems = [];
const fail = (msg) => problems.push(msg);

let db;
try {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
} catch (e) {
  console.error(`Cannot read ${dbPath}: ${e.message}`);
  process.exit(1);
}

// ---------------------------------------------------------------- deriveSpecs ---
// Mirrors applyCategoryAndSpecFixes.js so both passes derive the same values
// from the same title. Values are only derived when the title gives an
// unambiguous answer. Multi-character units are safe; a bare "l" is handled
// separately and only counts when it is not glued to a model code ("A4L").
const VOLUME_MULTI_RE = /(\d+(?:[.,]\d+)?)\s?(fl\s?oz|ml|litres?|liters?|ltrs?|oz)(?![A-Za-z0-9])/i;
const VOLUME_L_RE = /(?<![A-Za-z0-9])(\d+(?:[.,]\d+)?)\s?l(?![A-Za-z0-9])/i;
// "75gm" / "2kg" are safe, but "U7G" / "A4G" are TV model codes, so a bare "g"
// must not be preceded by a letter/digit or followed by a "-".
const WEIGHT_MULTI_RE = /(\d+(?:[.,]\d+)?)\s?(kgs?|grams?|gms?)(?![A-Za-z0-9])/i;
const WEIGHT_G_RE = /(?<![A-Za-z0-9])(\d+(?:[.,]\d+)?)\s?g(?![A-Za-z0-9-])/i;
// Most specific first; the leading lookbehind stops a match starting part-way
// through a code or a waterproof rating, so "PU1500mm" is ignored entirely.
const SIZE_RANGE_RE = /(?<![A-Za-z0-9])(\d+(?:\.\d+)?)\s*(?:"|inch(?:es)?)\s*(?:-|–|to)\s*(\d+(?:\.\d+)?)\s*(?:"|inch(?:es)?)/i;
const SIZE_PAIR_RE = /(?<![A-Za-z0-9])(\d+(?:\.\d+)?)\s*(cms?|mm|inch(?:es)?|")\s*[xX*]\s*(\d+(?:\.\d+)?)\s*(cms?|mm|inch(?:es)?|")/i;
const SIZE_STAR_RE = /(?<![A-Za-z0-9])(\d+(?:\.\d+)?)\s*\*\s*(\d+(?:\.\d+)?)\s*(cms?|mm|inch(?:es)?|")/i;
const SIZE_IN_RE = /(?<![A-Za-z0-9])(\d+(?:\.\d+)?)\s*(?:"|inch(?:es)?(?![a-z]))/i;
const SIZE_CM_RE = /(?<![A-Za-z0-9])(\d+(?:\.\d+)?)\s*cms?\b/i;
const SIZE_MM_RE = /(?<![A-Za-z0-9])(\d+(?:\.\d+)?(?:-\d+(?:\.\d+)?)?)\s*mm\b/i;

const COLOURS = [
  'Black', 'White', 'Blue', 'Red', 'Green', 'Grey', 'Gray', 'Pink', 'Purple', 'Orange',
  'Yellow', 'Brown', 'Silver', 'Gold', 'Beige', 'Navy', 'Maroon', 'Multicolor',
  'Multicolour', 'Rose Gold', 'Turquoise', 'Teal', 'Cream', 'Olive', 'Burgundy',
];
const COLOUR_BLOCK_RE = /green tea|green apple|red bull|blue band|black forest|white cap|grey goose|red wine|white wine|black tea|orange juice|golden|black pepper|white rice|red beans|green grams|black beans/i;
const SKIP_COLOUR_CATS = new Set(['cat_food', 'cat_groceries', 'cat_wine']);

const unitLabel = (u) => {
  const s = String(u).toLowerCase().replace(/\s+/g, ' ');
  if (s === 'fl oz') return 'fl oz';
  if (s === 'oz') return 'oz';
  if (['l', 'ltr', 'ltrs', 'litre', 'litres', 'liter', 'liters'].includes(s)) return 'L';
  if (s === 'ml') return 'ml';
  if (['g', 'gm', 'gms', 'gram', 'grams'].includes(s)) return 'g';
  if (['kg', 'kgs'].includes(s)) return 'kg';
  if (s === 'cm' || s === 'cms') return 'cm';
  if (s === 'mm') return 'mm';
  if (s === 'inch' || s === 'inches' || s === '"') return '"';
  return s;
};

function deriveSpecs(p) {
  const name = String(p.name || '');
  const rows = [];
  if (p.brand) rows.push({ name: 'Brand', value: String(p.brand) });

  const vol = VOLUME_MULTI_RE.exec(name) || VOLUME_L_RE.exec(name);
  const wt = WEIGHT_MULTI_RE.exec(name) || WEIGHT_G_RE.exec(name);
  if (vol) rows.push({ name: 'Capacity', value: `${vol[1]} ${unitLabel(vol[2])}` });
  else if (wt) rows.push({ name: 'Capacity', value: `${wt[1]} ${unitLabel(wt[2])}` });

  const range = SIZE_RANGE_RE.exec(name);
  const pair = SIZE_PAIR_RE.exec(name);
  const star = SIZE_STAR_RE.exec(name);
  const inch = SIZE_IN_RE.exec(name);
  const cm = SIZE_CM_RE.exec(name);
  const mm = SIZE_MM_RE.exec(name);
  if (range) rows.push({ name: 'Size', value: `${range[1]}" - ${range[2]}"` });
  else if (pair) rows.push({ name: 'Size', value: `${pair[1]} x ${pair[3]} ${unitLabel(pair[4])}` });
  else if (star) rows.push({ name: 'Size', value: `${star[1]} x ${star[2]} ${unitLabel(star[3])}` });
  else if (inch) rows.push({ name: 'Size', value: `${inch[1]}"` });
  else if (cm) rows.push({ name: 'Size', value: `${cm[1]} cm` });
  else if (mm) rows.push({ name: 'Size', value: `${mm[1]} mm` });

  const colour = COLOURS.find((c) => new RegExp(`\\b${c}\\b`, 'i').test(name));
  if (colour && !COLOUR_BLOCK_RE.test(name) && !SKIP_COLOUR_CATS.has(p.categoryId)) {
    rows.push({ name: 'Colour', value: colour });
  }
  return rows;
}

// ----------------------------------------------------------------- transform ---
const catById = new Map((db.categories || []).map((c) => [c.id, c]));
const newStats = () => ({
  renamed: 0, merged: 0, recoveredSku: 0, sourceSku: 0, staleCategory: 0,
  removed: { SKU: 0, Category: 0, Condition: 0 },
  backfilled: 0, backfillRows: {}, stillEmpty: [],
  titlePicked: 0, ambiguous: [],
});

/**
 * A redundant row may only be dropped when its value exists nowhere else. SKU
 * must match product.sku (recovered onto it when product.sku is empty) and
 * Condition must be the uninformative "New". Category is always safe because
 * product.categoryId is authoritative — mismatches are only counted, because
 * they are exactly the rows that went stale when products were re-filed.
 */
function checkJunkRow(key, value, p, stats) {
  if (key === 'Condition') {
    if (value.toLowerCase() !== 'new') {
      fail(`Condition spec is not "New" for ${JSON.stringify(p.name)}: ${JSON.stringify(value)} — refusing to drop it`);
      return false;
    }
    return true;
  }
  if (key === 'Category') {
    const real = (catById.get(p.categoryId) || {}).name;
    if (real && value && real !== value) stats.staleCategory++;
    return true;
  }
  return true;
}

/**
 * Two rows can end up sharing a key — either because an alias was renamed onto
 * a row that already existed, or because the import produced a duplicate. The
 * caller needs one row, so pick the value that the product's own title supports
 * (the same colour vocabulary deriveSpecs uses). Returns:
 *   'case'      values differ only in case/spacing — trivially the same value
 *   'title'     the discarded value was contradicted by the title
 *   'ambiguous' neither could be justified from the title; canonical kept
 */
function resolveConflict(a, b, name, stats) {
  if (String(a).trim().toLowerCase() === String(b).trim().toLowerCase()) return 'case';
  const mentioned = (v) => String(v).toLowerCase().split(/[^a-z]+/).filter(Boolean).some((w) => {
    const c = COLOURS.find((x) => x.toLowerCase() === w);
    return !!c && new RegExp(`\\b${c}\\b`, 'i').test(String(name || ''));
  });
  const aHit = mentioned(a);
  const bHit = mentioned(b);
  if (aHit && !bHit) return 'title';
  if (bHit && !aHit) { stats.titlePicked++; return 'title-replace'; }
  stats.ambiguous.push(`${JSON.stringify(name)}: kept "${a}" over "${b}"`);
  return 'ambiguous';
}

function normalizeRows(rows, p, stats) {
  const out = [];
  const byName = new Map();
  for (const raw of rows || []) {
    if (!raw || raw.name == null) continue;
    const name = String(raw.name);
    const value = raw.value == null ? '' : String(raw.value).trim();
    const canonical = RENAME[name] || name;
    if (canonical !== name) stats.renamed++;

    if (JUNK_SET.has(canonical)) {
      if (canonical === 'SKU') {
        const own = p.sku == null ? '' : String(p.sku).trim();
        if (own && own !== value) {
          // Two different SKU schemes: product.sku holds the internal code
          // while this row holds the upstream marketplace code (e.g.
          // "LU570EA05JZVFNAFAMZ" vs "WOO-_TTUSK"). Relabel instead of
          // discarding it — that value exists nowhere else, and it is not the
          // redundant row this pass set out to remove.
          stats.sourceSku++;
          if (!byName.has('Supplier SKU')) {
            const supplier = { name: 'Supplier SKU', value };
            byName.set(supplier.name, supplier);
            out.push(supplier);
          }
          continue;
        }
        if (!own && value) { p.sku = value; stats.recoveredSku++; }
        stats.removed.SKU++;
        continue;
      }
      if (checkJunkRow(canonical, value, p, stats)) stats.removed[canonical]++;
      else out.push(raw); // keep it — this run aborts anyway
      continue;
    }

    const existing = byName.get(canonical);
    if (existing) {
      // Collapse onto the canonical row instead of emitting a duplicate key.
      if (!existing.value && value) existing.value = value;
      else if (existing.value && value && existing.value !== value) {
        if (resolveConflict(existing.value, value, p.name, stats) === 'title-replace') {
          existing.value = value; // the product title supports the alias's value
        }
      }
      stats.merged++;
      continue;
    }
    const row = { name: canonical, value };
    byName.set(canonical, row);
    out.push(row);
  }
  return out;
}

function transform(products, stats) {
  for (const p of products) {
    const hadRows = Array.isArray(p.specifications) && p.specifications.length > 0;
    if (!hadRows) continue; // nothing to normalise; back-fill below leaves it as-is
    p.specifications = normalizeRows(p.specifications, p, stats);

    if (p.specifications.length) continue;
    const rows = deriveSpecs(p);
    if (!rows.length) { stats.stillEmpty.push(p.name); continue; }
    p.specifications = rows;
    stats.backfilled++;
    for (const r of rows) stats.backfillRows[r.name] = (stats.backfillRows[r.name] || 0) + 1;
  }
}

const dbStats = newStats();
transform(db.products || [], dbStats);
const seed = fs.existsSync(seedPath) ? JSON.parse(fs.readFileSync(seedPath, 'utf8')) : null;
const seedStats = newStats();
if (seed) transform(seed.products || [], seedStats);

// ------------------------------------------------------------- post-assertions ---
function audit(products, label) {
  const empty = [];
  const junkLeft = {};
  const aliasLeft = {};
  const dupes = [];
  for (const p of products) {
    const rows = Array.isArray(p.specifications) ? p.specifications : [];
    if (!rows.length) empty.push(p.name);
    const seen = new Set();
    for (const r of rows) {
      const n = String(r.name);
      if (JUNK_SET.has(n)) junkLeft[n] = (junkLeft[n] || 0) + 1;
      if (RENAME[n]) aliasLeft[n] = (aliasLeft[n] || 0) + 1;
      if (seen.has(n)) dupes.push(`${p.name}: duplicate key "${n}"`);
      seen.add(n);
    }
  }
  if (empty.length) fail(`${label}: ${empty.length} product(s) left without specifications, e.g. ${empty.slice(0, 5).map((n) => JSON.stringify(n)).join(', ')}`);
  for (const [k, n] of Object.entries(junkLeft)) fail(`${label}: ${n} "${k}" row(s) survived removal`);
  for (const [k, n] of Object.entries(aliasLeft)) fail(`${label}: ${n} "${k}" row(s) survived renaming`);
  if (dupes.length) fail(`${label}: ${dupes.length} duplicate key(s), e.g. ${dupes.slice(0, 3).join('; ')}`);
  return { empty, junkLeft, aliasLeft, dupes };
}
audit(db.products || [], 'db.json');
if (seed) audit(seed.products || [], 'seed.json');

// ---------------------------------------------------------------------- report ---
function report(label, s) {
  console.log(label);
  console.log(`  keys renamed (Color/Sizes/OS)     : ${s.renamed}`);
  console.log(`  rows merged after a rename        : ${s.merged}`);
  if (s.titlePicked) console.log(`      ...${s.titlePicked} resolved by matching the product title`);
  for (const a of s.ambiguous) console.log(`      AMBIGUOUS ${a}`);
  console.log(`  SKU rows removed (exact duplicates): ${s.removed.SKU}${s.recoveredSku ? ` (recovered ${s.recoveredSku} missing product.sku)` : ''}`);
  console.log(`  SKU rows kept as "Supplier SKU"   : ${s.sourceSku} (upstream code differs from product.sku)`);
  console.log(`  Category rows removed             : ${s.removed.Category}${s.staleCategory ? ` (${s.staleCategory} were stale vs the product's real category)` : ''}`);
  console.log(`  Condition rows removed            : ${s.removed.Condition} (all "New")`);
  console.log(`  products re-back-filled           : ${s.backfilled}`);
  for (const [k, n] of Object.entries(s.backfillRows)) console.log(`      ${k} added: ${n}`);
  if (s.stillEmpty.length) {
    console.log(`  STILL EMPTY: ${s.stillEmpty.length}`);
    for (const n of s.stillEmpty.slice(0, 10)) console.log(`      ${n}`);
  }
}
console.log('SPEC NORMALISATION');
report('  --- db.json ---', dbStats);
if (seed) report('  --- seed.json ---', seedStats);
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

const touched = (s) => s.renamed + s.merged + s.removed.SKU + s.removed.Category
  + s.removed.Condition + s.sourceSku + s.recoveredSku + s.backfilled;
const totalTouched = touched(dbStats) + touched(seedStats);
if (!totalTouched) {
  console.log('Specifications are already normalised, nothing to write.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve('server/data/backups');
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, `db-before-spec-normalise-${Date.now()}.json`), JSON.stringify(db, null, 2), 'utf8');
fs.writeFileSync(path.resolve(`server/data/db.json.pre-spec-normalise-${stamp}`), JSON.stringify(db, null, 2), 'utf8');
if (seed) {
  fs.writeFileSync(path.resolve(`server/data/seed.json.pre-spec-normalise-${stamp}`), JSON.stringify(seed, null, 2), 'utf8');
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
if (seed) fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');

console.log(`Wrote ${dbPath}${seed ? ' and ' + seedPath : ''} (backups in server/data/backups).`);
console.log('Restart the API server (port 5001) — it caches db.json in memory.');
console.log('Then run: node tools/verify-catalogue.mjs');



