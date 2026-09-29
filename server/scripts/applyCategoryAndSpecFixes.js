/**
 * BigDrop catalogue maintenance script.
 *
 * Runs two audited fixes against server/data/db.json (and mirrors the one
 * affected row into seed.json):
 *
 *   1. Category corrections — 15 products that sit on the wrong shelf, plus
 *      the 66 camping/outdoor rows that make Garden & DIY look like a camping
 *      section (Garden & DIY keeps its 10 genuinely garden/DIY rows).
 *   2. Specification back-fill — every product with no specifications at all
 *      gets a `Brand` row (from the product's own brand field) plus any
 *      Capacity / Size / Colour value that can be parsed reliably out of the
 *      product title.
 *
 * Run from the repo root:  node server/scripts/applyCategoryAndSpecFixes.js
 */
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('server/data/db.json');
const seedPath = path.resolve('server/data/seed.json');
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const stamp = new Date().toISOString().replace(/[:.]/g, '-');

// ---------------------------------------------------------------- backups ---
const backupDir = path.resolve('server/data/backups');
if (!DRY_RUN) {
  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(
    path.join(backupDir, `db-before-category-spec-fix-${Date.now()}.json`),
    JSON.stringify(db, null, 2),
    'utf8'
  );
  fs.writeFileSync(
    path.resolve(`server/data/db.json.pre-category-spec-fix-${stamp}`),
    JSON.stringify(db, null, 2),
    'utf8'
  );
  if (fs.existsSync(seedPath)) {
    fs.writeFileSync(
      path.resolve(`server/data/seed.json.pre-category-spec-fix-${stamp}`),
      fs.readFileSync(seedPath)
    );
  }
  console.log('Backups written (server/data/backups + db.json.pre-category-spec-fix-*)\n');
} else {
  console.log('*** DRY RUN — no backups written, no files modified ***\n');
}

const byId = new Map(db.products.map((p) => [p.id, p]));
const catById = new Map(db.categories.map((c) => [c.id, c]));
const catName = (id) => (catById.get(id) || {}).name || id;


// ------------------------------------------------------- category moves ----
// Each row is [productId, expectedExactName, targetCategoryId, why].
// The expected name is asserted so the script fails loudly if the catalogue
// shifts underneath it instead of silently moving the wrong product.
const EXPLICIT_MOVES = [
  // --- a shampoo on the food shelf
  ['prd_pAAl6cmT6_', 'Coffee Stimulating Hair & Scalp Shampoo 200ml', 'cat_beauty', 'hair care'],

  // --- kitchen appliances filed outside Appliances
  ['prd_E9v0b1sXPr', 'Silvercrest(R) 2,400W Steam Iron with LCD Display', 'cat_appliances', 'appliance, not consumer electronics'],
  ['prd_Bps9MlIXZC', '19pcs nonstick aluminium cookware set. Red', 'cat_appliances', 'cookware'],
  ['prd_A5-KZbYRPx', 'Hotchef 10pcs marble cookware set purple blue', 'cat_appliances', 'cookware'],
  ['prd_0xIantry4Q', '30pcs marwa Germany stainless Steel cookware set', 'cat_appliances', 'cookware'],
  ['prd_3W1PB841HJ', 'Stainless Alluminium Cookware Pot Sufuria Set 14pcs', 'cat_appliances', 'cookware'],
  ['prd_ZcXILUpZPi', 'Martha Stewart 6.7Qt ENAMELED Cast Iron', 'cat_appliances', 'cookware'],
  ['prd_3Jfmb8Nyfr', 'Jikokoa LARGE XTRA STOVE', 'cat_appliances', 'charcoal stove is a kitchen appliance'],
  ['prd_9gUUS2xkdJ', 'Jikokoa MEDIUM XTRA STOVE', 'cat_appliances', 'charcoal stove is a kitchen appliance'],
  ['prd_pOyeS7N35D', 'SILVERCREST NEW KITCHEN Mini Raclette Grill', 'cat_appliances', 'kitchen grill is an appliance'],
  ['prd_vgW-zvuEOS', 'Silvercrest Kitchen Vacuum Sealer Film Rolls, 300 X 20 CM Set', 'cat_appliances', 'sealer accessory, not a grocery'],
  ['prd_ASZUjElwr4', 'Silvercrest Vacuum Sealer Long Rolls 28cm', 'cat_appliances', 'sealer accessory, not a grocery'],

  // --- personal-care cotton on the home shelf
  ['prd_0QQaoUkGVx', 'Cotton Cosmetic Pads 80PK White', 'cat_beauty', 'personal care'],
  ['prd_X3dh-wEQV7', 'Cotton Tips 300PK White Only', 'cat_beauty', 'personal care'],
  ['prd_SiVEQHQKjM', 'Cotton Balls 200PK White', 'cat_beauty', 'personal care'],
  ['prd_lPwE2NJubC', 'Cotton Tips 200PK Eco Friendly Box', 'cat_beauty', 'personal care'],

  // --- Mayers bottled water is not wine or spirits
  ['prd_TIHJh51gB9', 'Mayers Spring Water Still Pet 250ml 24 PACK', 'cat_food', 'bottled water'],
  ['prd_qliI6QUOsq', 'MAYERS NATURAL SPRING WATER 500ML STILL 24 PACK', 'cat_food', 'bottled water'],
  ['prd_Ln4Rf-hmPA', 'Mayers 500Ml Sparkling WATER X 24 PACK', 'cat_food', 'bottled water'],
  ['prd_uW_xht5wLD', 'Mayers 1000Ml WATER X 12 PACK', 'cat_food', 'bottled water'],
  ['prd_n6VyCg9qlZ', 'Mayers 1000Ml Sparkling X 12 PACK', 'cat_food', 'bottled water'],
  ['prd_xlQIn9ekJ_', 'Mayers 10Ltrs Still', 'cat_food', 'bottled water'],
  ['prd_BOHVGcYc45', 'Mayers Best Natural Spring Water 18.9 Litres Still - Water Only', 'cat_food', 'bottled water'],
  ['prd_X4ZMfPjmQm', 'Mayers 1000Ml Still Gen.W/Ss X 12', 'cat_food', 'bottled water'],
  ['prd_ioEE_hKven', 'Mayers 1000Ml Sparkling X 12', 'cat_food', 'bottled water'],
  ['prd_jR435lVsQQ', 'Mayers 10Ltrs Still Gen. X 1', 'cat_food', 'bottled water'],
  ['prd_iLRyk2u3oS', 'Mayers 5G-18.9Ltrs Still Gen. X 1', 'cat_food', 'bottled water'],
  ['prd_RkpGYJzToJ', 'Mayers RGB 330ML Still Glass RIP CAP X 24', 'cat_food', 'bottled water'],
  ['prd_fZR6gi1VqE', '500ml create of Mayers Water (create and bottles incl) sparkling RGB.', 'cat_food', 'bottled water'],
  ['prd_m5jefTmJGq', 'Mayers Natural Still Spring Water – 750ml Glass Bottle', 'cat_food', 'bottled water'],
];

// The camping/outdoor cluster currently parked in Garden & DIY. Garden & DIY
// keeps the rows that are genuinely garden or DIY (10 of them).
const CAMPING_RE = /tent|sleeping bag|camping|gazebo|ground sheet|air mat|camp bed|tarpaulin|tarpoline|sun shelter|portable toilet|folding table|foldable c|folding chair|crazy seat|parasol|waste tank/i;
const EXPECTED_CAMPING_MOVES = 66;

const moves = [];
for (const [id, expectedName, to, why] of EXPLICIT_MOVES) {
  const p = byId.get(id);
  if (!p) {
    console.error(`ABORT: no product with id ${id} (${expectedName})`);
    process.exit(1);
  }
  if (p.name !== expectedName) {
    console.error(`ABORT: id ${id} is now "${p.name}", expected "${expectedName}"`);
    process.exit(1);
  }
  moves.push({ p, to, why });
}

const camping = db.products.filter((p) => p.categoryId === 'cat_garden' && CAMPING_RE.test(p.name));
if (camping.length !== EXPECTED_CAMPING_MOVES) {
  console.error(`ABORT: found ${camping.length} camping rows in garden-diy, expected ${EXPECTED_CAMPING_MOVES}`);
  process.exit(1);
}
for (const p of camping) moves.push({ p, to: 'cat_sports', why: 'camping / outdoor gear' });

const seenTargets = new Map();
for (const m of moves) {
  const prev = seenTargets.get(m.p.id);
  if (prev && prev !== m.to) {
    console.error(`ABORT: conflicting targets for ${m.p.name}`);
    process.exit(1);
  }
  seenTargets.set(m.p.id, m.to);
}

// Apply the moves, remembering which brands landed where so the faceted
// brand filters can be kept in step.
const moveLog = [];
const brandsToRegister = [];
for (const { p, to, why } of moves) {
  const from = p.categoryId;
  if (from === to) continue;
  p.categoryId = to;
  moveLog.push(`  ${catName(from).padEnd(20)} -> ${catName(to).padEnd(20)}  ${p.name}   (${why})`);
  if (p.brand) brandsToRegister.push([to, p.brand]);
}
console.log(`CATEGORY MOVES: ${moveLog.length} products re-filed`);
console.log(moveLog.join('\n'));
console.log('');

// Keep the per-category brand facet lists in step with the new placements,
// the same way server/scripts/applyBrandUpdates.js does.
let facetAdds = 0;
for (const [catId, brand] of brandsToRegister) {
  const cat = catById.get(catId);
  if (!cat) continue;
  cat.brands = Array.isArray(cat.brands) ? cat.brands : [];
  if (!cat.brands.includes(brand)) {
    cat.brands.push(brand);
    facetAdds++;
  }
}
console.log(`Brand facet lists updated: ${facetAdds} additions\n`);



// ------------------------------------------------- specification backfill ---
// Only products with NO specifications at all are touched. Values are only
// derived when the title gives an unambiguous answer, so nothing invented
// beyond what the merchant already wrote in the product name.
// Volumes: multi-character units are unambiguous, so a bare "l" is handled
// separately and only counts when it is not glued to a model code ("A4L").
const VOLUME_MULTI_RE = /(\d+(?:[.,]\d+)?)\s?(fl\s?oz|ml|litres?|liters?|ltrs?|oz)(?![A-Za-z0-9])/i;
const VOLUME_L_RE = /(?<![A-Za-z0-9])(\d+(?:[.,]\d+)?)\s?l(?![A-Za-z0-9])/i;
// Weights: "75gm" / "2kg" are safe, but "U7G" / "A4G" are TV model codes, so a
// bare "g" must not be preceded by a letter/digit or followed by a "-".
const WEIGHT_MULTI_RE = /(\d+(?:[.,]\d+)?)\s?(kgs?|grams?|gms?)(?![A-Za-z0-9])/i;
const WEIGHT_G_RE = /(?<![A-Za-z0-9])(\d+(?:[.,]\d+)?)\s?g(?![A-Za-z0-9-])/i;
// Sizes, most specific first: "23" to 50"", then "33CM X 33CM", then "12*20Cm",
// then a single inch / cm / mm measure. The leading (?<![A-Za-z0-9]) keeps a
// match from starting part-way through a code or a waterproof rating, so
// "PU1500mm" (a tent coating spec, not a size) is ignored entirely.
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
// Colour words that are really part of a product/brand name, not a colourway.
const COLOUR_BLOCK_RE = /green tea|green apple|red bull|blue band|black forest|white cap|grey goose|red wine|white wine|black tea|orange juice|golden|black pepper|white rice|red beans|green grams|black beans/i;
// Food shelves use these words as ingredients ("Green Tea Bags"), so skip them.
const SKIP_COLOUR_CATS = new Set(['cat_food', 'cat_groceries', 'cat_wine']);

const unitLabel = (u) => {
  const s = String(u).toLowerCase().replace(/\s+/g, ' ');
  if (s === 'fl oz') return 'fl oz';
  if (s === 'oz') return 'oz';
  if (s === 'l' || s === 'ltr' || s === 'ltrs' || s === 'litre' || s === 'litres' || s === 'liter' || s === 'liters') return 'L';
  if (s === 'ml') return 'ml';
  if (s === 'g' || s === 'gm' || s === 'gms' || s === 'gram' || s === 'grams') return 'g';
  if (s === 'kg' || s === 'kgs') return 'kg';
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

const specLess = db.products.filter((p) => !Array.isArray(p.specifications) || !p.specifications.length);
const specStats = { brand: 0, capacity: 0, size: 0, colour: 0, stillEmpty: [] };
for (const p of specLess) {
  const rows = deriveSpecs(p);
  if (!rows.length) {
    specStats.stillEmpty.push(p.name);
    continue;
  }
  p.specifications = [...(Array.isArray(p.specifications) ? p.specifications : []), ...rows];
  for (const r of rows) specStats[r.name.toLowerCase() === 'brand' ? 'brand' : r.name.toLowerCase()]++;
}
console.log(`SPEC BACK-FILL: ${specLess.length} products had no specifications`);
console.log(`  Brand rows added:    ${specStats.brand}`);
console.log(`  Capacity rows added: ${specStats.capacity}`);
console.log(`  Size rows added:     ${specStats.size}`);
console.log(`  Colour rows added:   ${specStats.colour}`);
console.log(`  still without specs: ${specStats.stillEmpty.length}`);
for (const n of specStats.stillEmpty.slice(0, 20)) console.log(`     ${n}`);
console.log('');

// ------------------------------------------------------------- persist -----
if (DRY_RUN) {
  console.log('*** DRY RUN — skipping all file writes ***');
  console.log('\nEvery derived row beyond a plain Brand row:');
  let shown = 0;
  for (const p of specLess) {
    const rows = Array.isArray(p.specifications) ? p.specifications.filter((s) => s.name !== 'Brand') : [];
    if (!rows.length) continue;
    console.log(`  [${(catById.get(p.categoryId) || {}).slug}]  ${p.name}`);
    console.log(`      ${rows.map((s) => `${s.name}: ${s.value}`).join('  |  ')}`);
    shown++;
  }
  console.log(`\n(${shown} products received a Capacity/Size/Colour row)`);
  process.exit(0);
}

db.auditLog = [
  {
    at: new Date().toISOString(),
    actor: 'system:catalogue-audit',
    action: 'category-and-spec-fix',
    detail: `Re-filed ${moveLog.length} products; back-filled specifications on ${specLess.length} products (${specStats.brand} Brand / ${specStats.capacity} Capacity / ${specStats.size} Size / ${specStats.colour} Colour rows).`,
  },
  ...(db.auditLog || []),
].slice(0, 500);

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
console.log(`Wrote ${dbPath}`);

// seed.json only holds the 226 demo rows, so just keep the one shared product
// (prd_pending_1) in step with the fixes above.
if (fs.existsSync(seedPath)) {
  const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
  let seedTouched = 0;
  for (const sp of seed.products || []) {
    const live = byId.get(sp.id);
    if (!live) continue;
    if (sp.categoryId !== live.categoryId) {
      sp.categoryId = live.categoryId;
      seedTouched++;
    }
    if ((!Array.isArray(sp.specifications) || !sp.specifications.length) && Array.isArray(live.specifications) && live.specifications.length) {
      sp.specifications = live.specifications;
      seedTouched++;
    }
  }
  if (seedTouched) {
    fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');
    console.log(`seed.json updated (${seedTouched} row/rows)`);
  } else {
    console.log('seed.json unchanged (no overlapping rows affected)');
  }
}

console.log('\nDone.');
