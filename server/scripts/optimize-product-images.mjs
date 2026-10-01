/**
 * BigDrop catalogue maintenance script — product image payload.
 *
 * Product galleries are capped at 150KB per photo end to end (the browser crops
 * to 800×800 JPEG ≤150KB, the API refuses a bigger upload, and every downloaded
 * photo is re-encoded to WebP ≤150KB — see server/src/uploads.js). This pass
 * brings the pictures that predate that cap inside it: every image a product
 * references that is over 150KB is re-encoded to WebP and the product's images
 * array is repointed at the new file.
 *
 * Run from the repo root (or server/):
 *   node server/scripts/optimize-product-images.mjs                 # dry run
 *   node server/scripts/optimize-product-images.mjs --write         # apply
 *   node server/scripts/optimize-product-images.mjs --write --limit 50
 *
 * The originals are never deleted, so a re-run is cheap and a bad encode can be
 * undone; `node tools/sweep-orphans.mjs` lists them afterwards and --delete
 * reclaims the space. Both JSON files get a .pre-image-150kb-<timestamp> backup
 * and an atomic rename. The API caches db.json in memory, so restart the server
 * after --write (or the old refs keep serving).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { compressProductImage, PRODUCT_MAX_BYTES, uploadsRoot } from '../src/uploads.js';

const serverDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// uploadsRoot honours UPLOADS_DIR — the folder photos actually live in on the live
// server. Measuring the bundled server/uploads copy there would rewrite nothing.
const uploadDir = path.join(uploadsRoot, 'products');
const targets = [
  path.join(serverDir, 'data', 'db.json'),
  path.join(serverDir, 'data', 'seed.json'),
].filter((file) => fs.existsSync(file));
const write = process.argv.includes('--write');
const limitIndex = process.argv.indexOf('--limit');
const limit = limitIndex >= 0 ? Number(process.argv[limitIndex + 1]) : Infinity;

function productRefs(file) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  return (data.products || [])
    .flatMap((product) => product.images || [])
    .filter((ref) => typeof ref === 'string' && ref.startsWith('/uploads/products/'));
}

function replaceRefs(value, replacements) {
  if (typeof value === 'string') return replacements.get(value) || value;
  if (Array.isArray(value)) return value.map((item) => replaceRefs(item, replacements));
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) value[key] = replaceRefs(value[key], replacements);
  }
  return value;
}

const refs = [...new Set(targets.flatMap(productRefs))];
const candidates = [];
for (const ref of refs) {
  const name = path.basename(ref);
  const source = path.join(uploadDir, name);
  if (!fs.existsSync(source)) continue;
  const stat = fs.statSync(source);
  if (stat.size <= PRODUCT_MAX_BYTES) continue;
  candidates.push({ ref, name, source, bytes: stat.size });
}

const selected = candidates.slice(0, limit);
const replacements = new Map();
let beforeBytes = 0;
let afterBytes = 0;
for (const item of selected) {
  const outputName = `${item.name}.150kb.webp`;
  const outputPath = path.join(uploadDir, outputName);
  let output;
  if (write && fs.existsSync(outputPath) && fs.statSync(outputPath).size <= PRODUCT_MAX_BYTES) {
    output = fs.readFileSync(outputPath);
  } else {
    output = await compressProductImage(fs.readFileSync(item.source));
  }
  if (output.length > PRODUCT_MAX_BYTES) throw new Error(`${item.name} exceeds the 150KB limit after optimization`);
  if (write && !(fs.existsSync(outputPath) && fs.statSync(outputPath).size === output.length)) {
    const tempPath = `${outputPath}.tmp`;
    fs.writeFileSync(tempPath, output);
    fs.renameSync(tempPath, outputPath);
  }
  replacements.set(item.ref, `/uploads/products/${outputName}`);
  beforeBytes += item.bytes;
  afterBytes += output.length;
}

if (write && replacements.size) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  for (const file of targets) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    const updated = replaceRefs(data, replacements);
    const tempPath = `${file}.tmp`;
    fs.writeFileSync(tempPath, JSON.stringify(updated, null, 2));
    fs.copyFileSync(file, `${file}.pre-image-150kb-${stamp}`);
    fs.renameSync(tempPath, file);
  }
}

console.log(`Upload folder: ${uploadDir}`);
console.log(`Mode: ${write ? 'write (original image files are preserved)' : 'dry run'}`);
console.log(`Referenced product images over 150KB: ${candidates.length}`);
console.log(`Images processed: ${replacements.size}${Number.isFinite(limit) ? ` (limit ${limit})` : ''}`);
console.log(`Optimized payload: ${(beforeBytes / 1048576).toFixed(2)} MB -> ${(afterBytes / 1048576).toFixed(2)} MB`);
console.log(`Estimated transfer reduction: ${beforeBytes ? ((1 - afterBytes / beforeBytes) * 100).toFixed(1) : '0.0'}%`);
if (write) console.log('Updated db.json and seed.json with backups; source image files were not deleted.');
