// Walks db.json (and seed.json) and reports EVERY external http(s) URL with its
// JSON path, so we can see which collections localize-images.mjs did not cover
// (blog covers, vendor logos, product.image, og images, ...).
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const files = ['server/data/db.json', 'server/data/seed.json'];

const IMG_RE = /^https?:\/\//i;
// Image hosts / extensions anywhere in the URL (query strings follow the path).
const LOOKS_LIKE_IMAGE = /(unsplash\.com|wp-content|\/uploads\/|\.(jpe?g|png|gif|webp|avif))(\/|\?|$)/i;

function walk(node, jsonPath, out) {
  if (typeof node === 'string') {
    if (IMG_RE.test(node)) out.push({ path: jsonPath, url: node });
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${jsonPath}[${i}]`, out));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, jsonPath ? `${jsonPath}.${k}` : k, out);
  }
}

for (const rel of files) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const db = JSON.parse(fs.readFileSync(file, 'utf8'));
  const found = [];
  walk(db, '', found);
  const images = found.filter((f) => LOOKS_LIKE_IMAGE.test(f.url));
  const nonImages = found.filter((f) => !LOOKS_LIKE_IMAGE.test(f.url));

  const collections = {};
  for (const f of images) {
    const key = f.path.replace(/\[\d+\]/g, '[]').split('.').slice(0, 2).join('.');
    collections[key] = (collections[key] || 0) + 1;
  }

  console.log(`\n=== ${rel} ===`);
  console.log(`total http(s) strings: ${found.length} | image-looking: ${images.length} | other links: ${nonImages.length}`);
  console.log('image refs by collection:', JSON.stringify(collections, null, 2));
  console.log('sample image paths:');
  for (const f of images.slice(0, 12)) console.log(' -', f.path, '->', f.url.slice(0, 95));
  if (nonImages.length) {
    console.log('non-image http strings (left alone):');
    for (const f of nonImages.slice(0, 8)) console.log(' -', f.path, '->', f.url.slice(0, 95));
  }
}
