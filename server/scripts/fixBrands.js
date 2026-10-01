/**
 * BigDrop catalogue maintenance script — brand repair.
 *
 * 1083 products carry brand = "BigDrop". BigDrop is the storefront, not a
 * manufacturer, so those rows advertise the shop as the maker of its own
 * goods. This script replaces the placeholder with the real brand wherever the
 * catalogue itself provides evidence, in three tiers of decreasing strength:
 *
 *   T1  explicit prefix rules — the product title begins with a known brand
 *       name. Curated by hand from the leading-token clusters in the data
 *       ("Nev's Baby …", "LIVELLE TOILET TISSUE …", "Mayers 1000Ml …").
 *   T2  the product's own spec sheet already names a brand that is not the
 *       placeholder (e.g. spec Brand = "Axglove" while product.brand = BigDrop).
 *   T3  the title mentions a brand that is genuinely in use elsewhere in the
 *       catalogue, and exactly one such brand matches (no ambiguity).
 *
 * Deliberately NOT done: guessing. Ingredient/line words ("Manuka Honey",
 * "Aloe Vera", "Moroccan Argan", "Royal Jelly"), product types ("MTB", "LED",
 * "Plastic Lunch Box") and unbranded goods are reported as UNRESOLVED and left
 * untouched — turning a wrong brand into an invented one is not a fix. What to
 * do with those (clear the field, or label "Unbranded") is a separate call.
 *
 * Neither SKU nor productName helps here: 1010 of the 1083 SKUs are "WOO…"
 * WooCommerce import placeholders, and productName never differs from name.
 *
 * Run from the repo root:
 *   node server/scripts/productCleanup.js … sibling, same conventions:
 *   node server/scripts/fixBrands.js --dry-run      # audit only (default)
 *   node server/scripts/fixBrands.js --apply        # write db.json + seed.json
 *
 * NOTE: the API caches db.json in memory. After --apply, restart the server on
 * port 5001 (touch server/src/index.js) or the old data keeps serving.
 */
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('server/data/db.json');
const seedPath = path.resolve('server/data/seed.json');
const APPLY = process.argv.includes('--apply');
// Second gate: clearing the placeholder is destructive enough to require saying
// so, rather than being implied by --apply.
const CLEAR_UNRESOLVED = process.argv.includes('--clear-unresolved');

const PLACEHOLDER = (b) => /^(big\s*drop|bigdrop)$/i.test(String(b || '').trim());

/**
 * The label this script writes onto a spec row when a product has no brand.
 * A row carrying it is "not yet known", not a real brand claim, so a later pass
 * that does resolve the brand is free to overwrite it. Kept as a predicate so
 * the reader does not have to remember it mirrors UNBRANDED_LABEL below.
 */
const UNBRANDED_LABEL = 'Unbranded';
const UNBRANDABLE = (b) => String(b || '').trim().toLowerCase() === UNBRANDED_LABEL.toLowerCase();

/**
 * Brand values are compared byte-for-byte by the shop filter
 * (routes.js: `brands.includes(String(p.brand).toLowerCase())`), so a stray
 * space or a decomposed accent silently drops a product off its own brand page.
 * "L'Oréal " was stored with a trailing space and was therefore unfindable.
 * Every brand value this script touches goes through cleanBrand() so that
 * cannot happen again.
 */
const BRAND_ALIASES = new Map([
  // Loreal / L'Oreal / LOREAL / L’Oréal are all the same house. Only the base
  // form is aliased — sub-labels such as "L'Oréal Professionnel" are left alone.
  ['loreal', "L'Or\u00e9al"],
]);

function cleanBrand(b) {
  // NFC first, so "é" is one code point rather than "e" + U+0301.
  const t = String(b ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  const alias = BRAND_ALIASES.get(t.toLowerCase().replace(/[\u2018\u2019']/g, ''));
  return alias || t;
}

/**
 * T1 — titles that begin with the manufacturer's name.
 * Each rule is anchored (^) so a brand word appearing mid-title in some other
 * sense cannot trigger it. Brand values reuse the catalogue's existing casing
 * where that brand is already spelled correctly elsewhere (see BRAND_CANON).
 */
const PREFIX_RULES = [
  { brand: "Nev's", re: /^nev'?s\b/i },
  { brand: 'Green World', re: /^green\s+world\b/i },
  { brand: 'Dear', re: /^dear\s+[a-z]/i },
  { brand: 'BIO1', re: /^bio1\b/i },
  { brand: 'BIO2', re: /^bio2\b/i },
  { brand: 'Livelle', re: /^livelle\b/i },
  { brand: 'Celine', re: /^celine\b/i },
  { brand: 'Dr. Rashel', re: /^dr\.?\s*rashel/i },
  { brand: 'Bila Shaka', re: /^bila\s*shaka/i },
  { brand: 'Mayers', re: /^mayers\b/i },
  { brand: 'Mountain Fresh', re: /^mountain\s+fresh\b/i },
  { brand: 'Pendo', re: /^pendo\b/i },
  { brand: 'Petals', re: /^petals\b/i },
  { brand: 'Callista', re: /^callista\b/i },
  { brand: 'My Men', re: /^my\s+men\b/i },
  { brand: 'Synolin', re: /^synolin\b/i },
  { brand: 'QIK', re: /^qik\b/i },
  { brand: 'Jaguar', re: /^jaguar\b/i },
  { brand: 'Glinter', re: /^glinter\b/i },
  { brand: 'Bivy', re: /^bivy\b/i },
  { brand: 'Huffy', re: /^huffy\b/i },
  { brand: 'Axglove', re: /^ax(?:glove)?\s+(?:non\s+)?sterile/i },
  { brand: 'Converse', re: /^converse\b/i },
  // The title names the house outright ("Tease by Victoria's Secrets").
  // Accent-insensitive: the catalogue titles it "L'oreal" with a plain "e".
  { brand: "L'Or\u00e9al", re: /^l['\u2019]?oreal\b/i },
  { brand: "Victoria's Secret", re: /^tease by victoria/i },
  // "Down Pekee" is a misspelling of Dawn Pekee, which 10 correctly-branded
  // products already carry — correct the typo rather than add a near-duplicate.
  { brand: 'Dawn Pekee', re: /^down\s+pekee\b/i },
  // "Fruit of the Wokali" is a real house, not an ingredient — the other 4
  // products in this cluster all carry it, and the vendor (Nairobi Beauty Co.)
  // is a cosmetics reseller rather than the maker.
  { brand: 'Fruit of the Wokali', re: /^fruit\s+of\s+the\s+wokali\b/i },
];

/**
 * Curated brand lists on categories feed the /brands page (Brands.jsx reads
 * `category.brands`, not product data) and act as the fallback for
 * GET /categories/:slug/brands. "BigDrop" is the storefront, so it must not be
 * offered as a brand a shopper can browse, whatever the product field says.
 */
const CURATED_PLACEHOLDER = (b) => /^(big\s*drop|bigdrop)$/i.test(String(b || '').trim());

/**
 * T3 guard — vocabulary brands excluded from the mid-title mention match,
 * because the brand word is also used in this catalogue as a flavour or colour
 * ("Apple & Cinnamon" air freshener is not an Apple product). Kept short on
 * purpose: distinctive names like Nike or Adidas are legitimate matches and are
 * deliberately NOT blocked. Verified against the --dry-run output.
 */
const T3_BLOCKLIST = new Set(['Apple', 'Orange', 'Lemon', 'Mango']);

let db;
try {
  db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
} catch (e) {
  console.error(`Cannot read ${dbPath}: ${e.message}`);
  process.exit(1);
}
const seed = fs.existsSync(seedPath) ? JSON.parse(fs.readFileSync(seedPath, 'utf8')) : null;

// Captured before any mutation below, so the backup is a real restore point.
const dbBefore = JSON.stringify(db, null, 2);
const seedBefore = seed ? JSON.stringify(seed, null, 2) : null;

const products = db.products || [];

// Canonicalise EVERY brand in the catalogue, not just the placeholder ones, and
// do it before the early-exit below: a product whose brand is "L'Oréal " is
// already off its own brand page even though nothing is left to de-placeholder.
let brandsCleaned = 0;
let specBrandsCleaned = 0;
for (const p of products) {
  const want = cleanBrand(p.brand);
  if (want !== p.brand) {
    p.brand = want;
    brandsCleaned += 1;
  }
  for (const s of p.specifications || []) {
    if (s.name !== 'Brand') continue;
    const v = cleanBrand(s.value);
    if (v !== s.value) {
      s.value = v;
      specBrandsCleaned += 1;
    }
  }
}

const affected = products.filter((p) => PLACEHOLDER(p.brand));
const trusted = products.filter((p) => p.brand && !PLACEHOLDER(p.brand));

// A Brand spec row that contradicts product.brand is damage this script can
// repair, so it must not let the run short-circuit: otherwise the pass that
// finally resolves a brand leaves the catalogue permanently "nothing to change"
// and the stale row can never be corrected.
//
// This test must mirror the reconciliation loop below, or the two disagree and
// the script exits while real damage is still on disk. The loop repairs ANY
// disagreement, so the guard has to count ANY disagreement — an earlier version
// only counted placeholder/"Unbranded" rows and therefore ignored the
// description-in-a-Brand-row case ("Toilex 2-ply tissue" vs "Toilex"), leaving
// verify-catalogue failing on a row this script was already able to fix.
const staleRows = products.filter((p) => {
  const brand = cleanBrand(p.brand);
  if (!brand) return false; // genuinely unbranded: the row legitimately says so
  return (p.specifications || []).some((s) => s.name === 'Brand' && cleanBrand(s.value) !== brand);
});

if (!affected.length && !brandsCleaned && !specBrandsCleaned && !staleRows.length) {
  console.log('No products carry the "BigDrop" placeholder brand and every brand value is already canonical — nothing to change.');
  process.exit(0);
}
if (!affected.length) {
  console.log(`No products carry the "BigDrop" placeholder brand.`);
  console.log(`Canonicalising ${brandsCleaned} brand value(s) and ${specBrandsCleaned} Brand spec row(s) instead.`);
  if (staleRows.length) console.log(`Re-syncing ${staleRows.length} Brand spec row(s) that contradict product.brand.`);
}

// T3 vocabulary: brands genuinely in use elsewhere in the catalogue.
const vocabCount = new Map();
for (const p of trusted) {
  const b = String(p.brand).trim();
  vocabCount.set(b, (vocabCount.get(b) || 0) + 1);
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const vocab = [...vocabCount.keys()]
  .filter((b) => b.length >= 3 && !T3_BLOCKLIST.has(b))
  .map((b) => ({ brand: b, esc: esc(b) }))
  .sort((a, b) => b.brand.length - a.brand.length);

const tally = new Map(); // brand -> { n, tier, examples[] }
const assignments = new Map(); // product id -> { brand, tier, rule }

for (const p of affected) {
  const name = String(p.name || '');

  // T1 — title begins with a known manufacturer.
  let hit = null;
  for (const rule of PREFIX_RULES) {
    if (rule.re.test(name)) {
      hit = { brand: rule.brand, tier: 'T1 prefix', rule: rule.re.source };
      break;
    }
  }

  // T2 — the product's own spec sheet names a different, real brand.
  if (!hit) {
    for (const s of p.specifications || []) {
      if (s.name === 'Brand' && s.value && !PLACEHOLDER(s.value)) {
        const v = String(s.value).trim();
        if (vocabCount.has(v) || v.length >= 3) {
          // Keep the spec's spelling when that brand is already used verbatim
          // elsewhere; otherwise normalise shout-casing ("MAYERS" -> "Mayers").
          const canon = vocabCount.has(v) ? v : v.toLowerCase().replace(/(^|\s|-)([a-z])/g, (_, s, c) => s + c.toUpperCase());
          hit = { brand: canon, tier: 'T2 own spec sheet', rule: `spec Brand="${s.value}"` };
          break;
        }
      }
    }
  }

  // T3 — exactly one catalogue brand is mentioned, as the leading word of the
  // title. Anchoring matters: "INDOOR ARIEL" is an appliance model, not the
  // Ariel detergent brand, and an unanchored match would have mislabelled it.
  if (!hit) {
    const lead = name.replace(/^[^a-z0-9]+/i, '');
    const matches = vocab
      .filter((v) => new RegExp(`^${v.esc}([^a-z0-9]|$)`, 'i').test(lead))
      .map((v) => v.brand);
    if (matches.length === 1) hit = { brand: matches[0], tier: 'T3 leading mention', rule: `starts with "${matches[0]}"` };
    else if (matches.length > 1) hit = { brand: null, tier: 'ambiguous', rule: matches.join(' | ') };
  }

  if (hit && hit.brand) {
    assignments.set(p.id, hit);
    const t = tally.get(hit.brand) || { n: 0, tier: hit.tier, examples: [] };
    t.n += 1;
    if (t.examples.length < 2) t.examples.push(name);
    tally.set(hit.brand, t);
  }
}

const ambiguous = affected.filter((p) => (assignments.get(p.id)?.tier || '') === 'ambiguous');
for (const p of ambiguous) assignments.delete(p.id);
const unresolved = affected.filter((p) => !assignments.has(p.id));

// ---- apply ---------------------------------------------------------------
let specRowsFixed = 0;
for (const [id, hit] of assignments) {
  const p = products.find((x) => x.id === id);
  if (!p) continue;
  p.brand = cleanBrand(hit.brand);
  for (const s of p.specifications || []) {
    // The row must follow the field. Matching PLACEHOLDER alone is not enough:
    // an earlier --clear-unresolved pass rewrote it to UNBRANDED_LABEL, so a
    // later pass that finally resolved the brand would skip the row and leave
    // "Brand: Unbranded" contradicting "Brand: L'Oreal" on the same page.
    if (s.name === 'Brand' && (PLACEHOLDER(s.value) || UNBRANDABLE(s.value))) {
      s.value = p.brand;
      specRowsFixed += 1;
    }
  }
}

// Reconciliation, over EVERY product rather than just `affected`. A product
// already holding a real brand is never re-examined by the tier ladder above
// (it filters on PLACEHOLDER), so its spec row is invisible to that ladder.
// That is how a row got stranded on UNBRANDED_LABEL: pass 1 relabelled it
// while the field was still the placeholder, pass 2 resolved the field to
// "L'Oreal" and never looked at the row again — leaving the page to render
// "Brand: L'Oreal" in the header and "Brand: Unbranded" in the spec table.
// The row must never contradict the field it restates.
let specRowsResynced = 0;
const specRowConflicts = [];
for (const p of products) {
  const brand = cleanBrand(p.brand);
  if (!brand) continue; // genuinely unbranded: the row is the only place to say so
  for (const s of p.specifications || []) {
    if (s.name !== 'Brand') continue;
    if (cleanBrand(s.value) === brand) continue;
    // product.brand is authoritative — routes.js builds the shop filter and the
    // brand facet from it, so a row that names anything else renders a value a
    // shopper cannot click through to. Two shapes reached here:
    //   "MAYERS"               -> same brand, shout-cased by the import
    //   "Toilex 2-ply tissue"  -> a description stuffed into a Brand row
    // Both are fixed by mirroring the field. The description is not lost to the
    // catalogue: it is re-derived from the title by normalizeSpecs.js.
    specRowConflicts.push({ name: p.name, was: s.value, now: brand });
    console.log(`  re-synced Brand spec row: "${s.value}" -> "${brand}"   ${p.name.slice(0, 56)}`);
    s.value = brand;
    specRowsResynced += 1;
  }
}

// ---- report --------------------------------------------------------------
console.log(`\nBigDrop placeholder brand repair\n${'-'.repeat(58)}`);
console.log(`  products total            : ${products.length}`);
console.log(`  carried brand="BigDrop"   : ${affected.length}`);
console.log(`  resolved to a real brand  : ${assignments.size}`);
console.log(`  ambiguous (skipped)       : ${ambiguous.length}`);
console.log(`  UNRESOLVED (left alone)   : ${unresolved.length}`);
console.log(`  redundant spec Brand rows updated: ${specRowsFixed}`);
console.log(`\n  ${String('n').padStart(4)}  brand`);
for (const [b, t] of [...tally].sort((a, b) => b[1].n - a[1].n)) {
  console.log(`  ${String(t.n).padStart(4)}  ${b}   [${t.tier}]`);
  for (const ex of t.examples) console.log(`          e.g. ${ex.slice(0, 70)}`);
}

if (ambiguous.length) {
  console.log('\n  ambiguous — more than one catalogue brand matches the title:');
  for (const p of ambiguous) console.log(`    ${p.name.slice(0, 70)}  ->  ${assignments.get(p.id)?.rule || ''}`);
}

if (unresolved.length) {
  console.log(`\n  UNRESOLVED sample (brand left as-is, needs a decision):`);
  for (const p of unresolved.slice(0, 15)) console.log(`    - ${p.name.slice(0, 74)}`);
}

// ---- residual placeholder cleanup -----------------------------------------
// "BigDrop" on a curated category list is a bug regardless of the product
// field, so this always runs. Removing it from `category.brands` also removes
// the tile from /brands, which Brands.jsx builds from these lists.
let curatedTrimmed = 0;
for (const c of db.categories || []) {
  if (!Array.isArray(c.brands)) continue;
  const before = c.brands.length;
  c.brands = c.brands.filter((b) => !CURATED_PLACEHOLDER(b));
  if (c.brands.length !== before) {
    curatedTrimmed += 1;
    console.log(`  curated brands trimmed: ${c.name || c.slug} (${before} -> ${c.brands.length})`);
  }
}

// Opt-in: blank the placeholder on products with no evidence of a real brand.
// The product page already guards with `product.brand && (...)`, so an empty
// field hides the line rather than rendering "Brand:" with nothing after it.
// Labelling these "Unbranded" instead was rejected: routes.js builds the shop
// brand facet from product.brand, so that would publish a phantom brand with
// 743 products competing against real manufacturers.
//
// The matching spec row is RELABELLED, not deleted. For 301 of these products
// the placeholder row was the only row they had, so dropping it emptied the
// spec table and broke the "every product has specifications" gate. Relabelling
// to "Unbranded" keeps the table populated and reads correctly on the page,
// and it is not a facet value, so it introduces no phantom brand.
let cleared = 0;
let specRowsRelabelled = 0;
if (CLEAR_UNRESOLVED) {
  for (const p of unresolved) {
    p.brand = '';
    cleared += 1;
    for (const s of p.specifications || []) {
      if (s.name === 'Brand' && PLACEHOLDER(s.value)) {
        s.value = UNBRANDED_LABEL;
        specRowsRelabelled += 1;
      }
    }
  }
}

// Safety: the whole point of the gate is that a product always has a spec row.
// Re-check after the mutation and abort before writing rather than ship a
// catalogue that fails verification.
const nowEmpty = products.filter((p) => !Array.isArray(p.specifications) || !p.specifications.length);
if (nowEmpty.length) {
  console.error(`\nABORT: ${nowEmpty.length} product(s) would be left without specifications, e.g. ${nowEmpty.slice(0, 3).map((p) => p.name).join(' / ')}`);
  console.error('Nothing written. Re-run normalizeSpecs.js to back-fill, or restore from a backup.');
  process.exit(1);
}

const verb = APPLY ? 'cleared' : 'would clear';
console.log(`  categories with BigDrop removed from curated brands: ${curatedTrimmed}${APPLY ? '' : ' (preview)'}`);
console.log(`  brand values canonicalised (trimmed/NFC/aliased): ${brandsCleaned} product field(s), ${specBrandsCleaned} spec row(s)`);
console.log(`  products ${verb} to an empty brand : ${cleared}${CLEAR_UNRESOLVED ? '' : '  (pass --clear-unresolved to enable)'}`);
console.log(`  placeholder Brand spec rows ${APPLY ? 'relabelled' : 'to relabel'} "${UNBRANDED_LABEL}": ${specRowsRelabelled}`);
console.log(`  stale Brand spec rows re-synced to product.brand: ${specRowsResynced}`);

if (!APPLY) {
  console.log('\n*** DRY RUN — nothing written. Re-run with --apply to write. ***');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve('server/data/backups');
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(path.join(backupDir, `db-before-brand-repair-${Date.now()}.json`), dbBefore, 'utf8');
fs.writeFileSync(path.resolve(`server/data/db.json.pre-brand-repair-${stamp}`), dbBefore, 'utf8');
if (seed) fs.writeFileSync(path.resolve(`server/data/seed.json.pre-brand-repair-${stamp}`), seedBefore, 'utf8');

// Keep seed.json in step with db.json for the same product ids.
if (seed) {
  // Match on id first; fall back to name so a row that changed id still syncs.
  const byName = new Map((db.products || []).map((p) => [p.name, p]));
  const clearedIds = new Set(unresolved.map((p) => p.id));
  for (const sp of seed.products || []) {
    // Canonicalise the seed too, or a reseed would restore the dirty value.
    sp.brand = cleanBrand(sp.brand);
    for (const s of sp.specifications || []) if (s.name === 'Brand') s.value = cleanBrand(s.value);
    // Same re-sync as the db pass above, so a reseed cannot resurrect the
    // "Brand: Unbranded" row against a resolved brand field.
    if (sp.brand) {
      for (const s of sp.specifications || []) {
        if (s.name === 'Brand' && cleanBrand(s.value) !== sp.brand) s.value = sp.brand;
      }
    }
    const hit = assignments.get(sp.id);
    if (hit) {
      sp.brand = cleanBrand(hit.brand);
      for (const s of sp.specifications || []) if (s.name === 'Brand' && cleanBrand(s.value) !== sp.brand) s.value = sp.brand;
      continue;
    }
    if (CLEAR_UNRESOLVED && (clearedIds.has(sp.id) || (byName.get(sp.name)?.brand === '' && PLACEHOLDER(sp.brand)))) {
      sp.brand = '';
      for (const s of sp.specifications || []) {
        if (s.name === 'Brand' && PLACEHOLDER(s.value)) s.value = UNBRANDED_LABEL;
      }
    }
  }
  // Categories are copied wholesale into the seed, so the curated brand lists
  // trimmed above must be mirrored or a reseed would resurrect the BigDrop tile.
  if (Array.isArray(seed.categories)) {
    for (const sc of seed.categories) {
      const dc = (db.categories || []).find((c) => c.id === sc.id || c.slug === sc.slug);
      if (dc && Array.isArray(dc.brands)) sc.brands = [...dc.brands];
    }
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
if (seed) fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
console.log(`\nWrote ${dbPath}${seed ? ' and ' + seedPath : ''} (backups in server/data/backups).`);

