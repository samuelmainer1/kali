// One-off product image audit: classifies every image, checks local upload
// files exist on disk, and probes every external URL for dead links.
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const serverDir = path.join(root, 'server');
const db = JSON.parse(fs.readFileSync(path.join(serverDir, 'data', 'db.json'), 'utf8'));

const buckets = {};
const external = new Set();
const localMissing = [];
const noImage = [];

function classify(img, ctx) {
  if (typeof img !== 'string' || !img) return 'empty';
  if (img.startsWith('/uploads/')) {
    const full = path.join(serverDir, img.replace(/^\//, ''));
    if (!fs.existsSync(full)) {
      localMissing.push(ctx + ' -> ' + img);
      return 'local-MISSING';
    }
    return 'local-ok';
  }
  if (img.startsWith('data:')) return 'data-url';
  if (img.includes('/placeholder')) return 'placeholder';
  if (img.includes('wp-content')) { external.add(img); return 'wp-content'; }
  if (img.includes('unsplash')) { external.add(img); return 'unsplash'; }
  if (/^https?:\/\//.test(img)) { external.add(img); return 'other-external'; }
  return 'other';
}

for (const p of db.products || []) {
  const imgs = Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []);
  if (!imgs.length) {
    noImage.push(p.id + ' ' + p.name);
    continue;
  }
  for (const img of imgs) {
    const b = classify(img, p.id);
    buckets[b] = (buckets[b] || 0) + 1;
  }
}
for (const c of db.categories || []) {
  if (c.image) {
    const b = classify(c.image, 'cat_' + c.id);
    buckets['category:' + b] = (buckets['category:' + b] || 0) + 1;
  }
}
for (const h of db.site?.heroes || []) {
  if (h.image) {
    const b = classify(h.image, 'hero_' + h.id);
    buckets['hero:' + b] = (buckets['hero:' + b] || 0) + 1;
  }
}

console.log('=== PRODUCT IMAGE AUDIT ===');
console.log('products:', (db.products || []).length, '| products with NO image:', noImage.length);
if (noImage.length) console.log('no-image list (first 10):', noImage.slice(0, 10));
console.log('image buckets:', JSON.stringify(buckets, null, 2));
console.log('local files missing on disk:', localMissing.length);
if (localMissing.length) console.log(localMissing.slice(0, 15));

const urls = [...external];
console.log('probing', urls.length, 'unique external image URLs (concurrency 10, 8s timeout)...');
const dead = [];
let idx = 0;
async function probe(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { method: 'GET', signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(t);
    if (!res.ok) dead.push({ url, status: res.status });
  } catch (e) {
    clearTimeout(t);
    dead.push({ url, status: 'ERR', err: String(e.message).slice(0, 80) });
  }
}
async function worker() {
  while (idx < urls.length) {
    const i = idx++;
    await probe(urls[i]);
  }
}
if (urls.length) {
  await Promise.all(Array.from({ length: Math.min(10, urls.length) }, worker));
}
console.log('EXTERNAL PROBE RESULT: dead/broken =', dead.length, 'of', urls.length);
if (dead.length) console.log(JSON.stringify(dead.slice(0, 30), null, 2));

fs.writeFileSync(
  path.join(root, 'image-audit.json'),
  JSON.stringify({ buckets, localMissing, noImage, deadExternal: dead, externalCount: urls.length }, null, 2)
);
console.log('full report saved -> image-audit.json');