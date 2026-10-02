// DRY RUN — plans a real, category-appropriate photo for every product that currently
// shows /placeholder-product.svg, using only images already on this server.
// Prints the proposed mapping; changes nothing.
import fs from 'fs';

const root = 'c:/Users/Sam/Downloads/New Bigdrop';
const db = JSON.parse(fs.readFileSync(`${root}/server/data/db.json`, 'utf8'));
const dir = `${root}/server/uploads/products`;
const onDisk = new Set(fs.readdirSync(dir));

const PLACEHOLDER = '/placeholder-product.svg';
const localOk = (u) =>
  typeof u === 'string' && u.startsWith('/uploads/products/') && onDisk.has(u.replace('/uploads/products/', ''));

const withPlaceholder = db.products.filter((p) => Array.isArray(p.images) && p.images.includes(PLACEHOLDER));
console.log(`products on placeholder: ${withPlaceholder.length}`);
console.log('product fields:', Object.keys(withPlaceholder[0] || db.products[0]).join(', '));
console.log('');

// group the placeholder products by their category, resolving categoryId -> category
const catById = new Map((db.categories || []).map((c) => [c.id, c]));
const catOf = (p) => catById.get(p.categoryId) || { name: '(unknown)', slug: p.categoryId };
const byCat = {};
for (const p of withPlaceholder) {
  const cat = p.categoryId || '(none)';
  (byCat[cat] = byCat[cat] || []).push(p);
}

// what real images does each category already have?
for (const [catId, list] of Object.entries(byCat)) {
  const c = catById.get(catId);
  const pool = [
    ...new Set(
      db.products
        .filter((p) => p.categoryId === catId && !(p.images || []).includes(PLACEHOLDER))
        .flatMap((p) => (p.images || []).filter(localOk))
    ),
  ];
  console.log(`=== ${c ? c.name : catId} (${c ? c.slug : '?'}) — ${list.length} to fix | ${pool.length} usable local images in category`);
  for (const p of list) console.log(`    ${p.sku}  ${p.name}`);
  for (const u of pool.slice(0, 8)) console.log(`      pool: ${u}`);
  console.log('');
}
