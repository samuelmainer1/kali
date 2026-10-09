/**
 * Exact-name duplicate CLASSIFICATION report. Read-only: it never deletes.
 *
 * An earlier audit reported 61 groups / "143 removable". That was wrong. Every
 * one of those groups holds rows with DIFFERENT SKUs, and 41 of them have
 * different prices — e.g. 15 rows called "Velvex Aluminium Foil" span
 * 620 to 6340 KES. Those are a product line the import flattened onto one name,
 * not 15 copies of one product. Deleting them would destroy real inventory.
 *
 * So this classifies each group and stops:
 *   SAME-SKU   -> genuinely the same product twice; the extra copy is the
 *                 only thing that may ever be removed.
 *   DIFF-SKU   -> real distinct products. The fault is the NAME, not the
 *                 count. Needs disambiguating, not deleting.
 *
 * Run from the repo root: node server/scripts/auditDuplicateNames.js
 */
import fs from 'fs';
import path from 'path';

const db = JSON.parse(fs.readFileSync(path.resolve('server/data/db.json'), 'utf8'));
const products = db.products || [];

// What references a product, so the report can say whether a removal is even safe.
const refs = new Map();
for (const key of Object.keys(db)) {
  if (!Array.isArray(db[key]) || key === 'products') continue;
  for (const row of db[key]) {
    for (const id of [row?.productId, row?.productID, ...(row?.items || []).map((i) => i?.productId || i?.productID)]) {
      if (!id) continue;
      if (!refs.has(id)) refs.set(id, []);
      refs.get(id).push(key);
    }
  }
}

const norm = (s) => String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
const groups = new Map();
for (const p of products) {
  const k = norm(p.name);
  if (!k) continue;
  if (!groups.has(k)) groups.set(k, []);
  groups.get(k).push(p);
}

const dupes = [...groups.entries()].filter(([, rows]) => rows.length > 1);
const sameSku = [];
const diffSku = [];
for (const [name, rows] of dupes) {
  const skus = new Map();
  for (const p of rows) {
    const s = String(p.sku || '').trim();
    if (!skus.has(s)) skus.set(s, []);
    skus.get(s).push(p);
  }
  const entry = {
    name: rows[0].name,
    rows,
    skus,
    sameSkuOnly: skus.size === 1,
    prices: [...new Set(rows.map((p) => Number(p.price) || 0))].sort((a, b) => a - b),
    referenced: rows.some((p) => refs.has(p.id)),
  };
  (entry.sameSkuOnly ? sameSku : diffSku).push(entry);
}

diffSku.sort((a, b) => b.rows.length - a.rows.length);

console.log('Exact-name duplicate classification (read-only — nothing is deleted)');
console.log('='.repeat(78));
console.log(`  catalogue            : ${products.length} products`);
console.log(`  duplicate name groups: ${dupes.length}  (${dupes.reduce((n, [, r]) => n + r.length, 0)} products involved)`);
console.log('');
console.log(`  SAME SKU  -> real duplicate copies, the only removal-safe class : ${sameSku.length} groups`);
console.log(`  DIFF SKU  -> distinct products sharing a bad name, must NOT be deleted: ${diffSku.length} groups`);
console.log('');

if (sameSku.length) {
  console.log('--- SAME SKU: genuinely the same product listed twice ---');
  for (const e of sameSku) {
    console.log(`  x${e.rows.length}  ${e.name}`);
    console.log(`        sku: ${[...e.skus.keys()][0] || '(none)'}   price: ${e.prices.join(', ')}${e.referenced ? '   [REFERENCED]' : ''}`);
    for (const p of e.rows) console.log(`          ${p.id}  ${p.hidden ? 'hidden ' : ''}${p.slug}`);
  }
  console.log('');
}

console.log('--- DIFF SKU: a product line flattened onto one name (disambiguate, do not delete) ---');
const shown = diffSku.slice(0, 15);
for (const e of shown) {
  const lo = e.prices[0];
  const hi = e.prices[e.prices.length - 1];
  console.log(`  x${String(e.rows.length).padStart(2)}  ${e.name}`);
  console.log(`        ${e.skus.size} distinct SKUs | ${e.prices.length} distinct prices | KES ${lo} - ${hi}${e.referenced ? '  [REFERENCED]' : ''}`);
}
if (diffSku.length > shown.length) console.log(`  ... and ${diffSku.length - shown.length} more groups`);
console.log('');

const worst = diffSku[0];
if (worst) {
  console.log(`Largest group in full: "${worst.name}" (${worst.rows.length} rows, ${worst.skus.size} SKUs)`);
  for (const p of worst.rows) {
    const row = (p.specifications || []).find((r) => /^size|length|width/i.test(r.name));
    console.log(`  KES ${String(p.price).padStart(6)}  sku=${String(p.sku).padEnd(16)} ${row ? `${row.name}: ${row.value}` : '(no size spec)'}`);
  }
  console.log('');
}

// The underlying cause, so the fix is aimed at the import and not the catalogue.
const desc = new Map();
for (const e of diffSku) {
  const d = e.rows[0].description || '';
  desc.set(d, (desc.get(d) || 0) + 1);
}
console.log('Diagnosis: rows sharing a name also share a description — the import');
console.log('carried one copy of the upstream text onto every variant.');
let same = 0;
for (const e of diffSku) if (e.rows.every((p) => (p.description || '') === (e.rows[0].description || ''))) same++;
console.log(`  ${same} of ${diffSku.length} DIFF-SKU groups have an identical description on every row.`);
console.log('');
console.log('Recommended next step: disambiguate the names using the attributes that');
console.log('already differ (size/capacity spec, price, SKU), then re-run this report.');
console.log('Do not delete rows from a DIFF-SKU group.');
