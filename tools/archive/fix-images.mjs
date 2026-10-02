// Removes dead image URLs (404-verified by scan-images.mjs) from products,
// categories and heroes. Products left with no images fall back to the local
// placeholder so the storefront never shows broken tiles.
// Run ONLY while the API is stopped (db.json is cached in server memory).
import fs from 'fs';
import path from 'path';

const root = 'c:/Users/Sam/Downloads/New Bigdrop';
const dbPath = path.join(root, 'server', 'data', 'db.json');
const audit = JSON.parse(fs.readFileSync(path.join(root, 'image-audit.json'), 'utf8'));

const deadIds = new Set(
  audit.deadExternal
    .map((d) => (d.url.match(/photo-[\w-]+/) || [])[0])
    .filter(Boolean)
);
console.log('unique dead photo IDs:', deadIds.size);

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const affectedProducts = new Set();
let removedImages = 0;
let catFixes = 0;
let heroFixes = 0;
let placeholderProducts = 0;

for (const p of db.products || []) {
  if (!Array.isArray(p.images) || !p.images.length) continue;
  const before = p.images.length;
  p.images = p.images.filter((img) => {
    if (typeof img !== 'string') return true;
    const m = img.match(/photo-[\w-]+/);
    if (m && deadIds.has(m[0])) {
      affectedProducts.add(p.id + ' ' + p.name);
      return false;
    }
    return true;
  });
  const removed = before - p.images.length;
  if (removed > 0) {
    removedImages += removed;
    if (!p.images.length) {
      p.images = ['/placeholder-product.svg'];
      placeholderProducts += 1;
    }
  }
}

for (const c of db.categories || []) {
  if (typeof c.image === 'string') {
    const m = c.image.match(/photo-[\w-]+/);
    if (m && deadIds.has(m[0])) {
      c.image = '/placeholder-product.svg';
      catFixes += 1;
    }
  }
}
for (const h of db.site?.heroes || []) {
  if (typeof h.image === 'string') {
    const m = h.image.match(/photo-[\w-]+/);
    if (m && deadIds.has(m[0])) {
      h.image = '/placeholder-product.svg';
      heroFixes += 1;
    }
  }
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log('dead product image URLs removed:', removedImages);
console.log('products affected:', affectedProducts.size);
console.log('products now on placeholder:', placeholderProducts);
console.log('category images fixed:', catFixes, '| hero images fixed:', heroFixes);
console.log('examples:', [...affectedProducts].slice(0, 8));