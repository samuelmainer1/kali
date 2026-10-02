// Localizes EVERY externally-hosted image referenced anywhere in server/data/db.json
// and server/data/seed.json — products, categories, heroes, blog covers, review
// avatars, cart lines, order items and invoice/receipt documents — by downloading
// each file into server/uploads/products/ and rewriting the JSON to
// /uploads/products/... . After this the storefront no longer depends on
// images.unsplash.com (or any other remote host).
//
// Idempotent: a picture already downloaded for the same photo id + width + crop is
// reused instead of re-fetched, so re-running is cheap.
// Run ONLY while the API is stopped — db.json lives in server memory and the next
// API save would overwrite the rewrite.
import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const serverDir = path.join(root, 'server');
const outDir = path.join(serverDir, 'uploads', 'products');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  { label: 'db', file: path.join(serverDir, 'data', 'db.json') },
  { label: 'seed', file: path.join(serverDir, 'data', 'seed.json') },
];

// Only actual image URLs are touched; ordinary links (vendor sites, tracking
// pages, blog CTA links) are left exactly as they are.
const HTTP = /^https?:\/\//i;
const IMAGE_URL = /(unsplash\.com|wp-content|\/uploads\/|\.(jpe?g|png|gif|webp|avif))(\/|\?|$)/i;

// 1. collect every external image URL from both files
const parsed = targets.map((t) => ({ ...t, db: JSON.parse(fs.readFileSync(t.file, 'utf8')) }));
const urls = new Set();

function collect(node) {
  if (typeof node === 'string') {
    if (HTTP.test(node) && IMAGE_URL.test(node)) urls.add(node);
    return;
  }
  if (Array.isArray(node)) return node.forEach(collect);
  if (node && typeof node === 'object') {
    for (const v of Object.values(node)) collect(v);
  }
}
for (const t of parsed) collect(t.db);
const list = [...urls];
console.log('unique external image URLs across db.json + seed.json:', list.length);

// 2. index what is already on disk so repeat runs do not re-download
function keyFor(url) {
  const m = url.match(/(photo-[\w-]+)/);
  const base = m
    ? m[1]
    : 'img_' + Math.abs([...url].reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 7)).toString(36);
  const w = (url.match(/[?&]w=(\d+)/) || [])[1] || 'raw';
  const crop = /crop=/.test(url) ? '_c' : '';
  return `${base}_w${w}${crop}`;
}

const onDisk = new Map(); // key -> file name
for (const name of fs.readdirSync(outDir)) {
  const ext = path.extname(name);
  if (!/\.(jpe?g|png|gif|webp|avif)$/i.test(ext)) continue;
  onDisk.set(name.slice(0, -ext.length), name);
}

const urlToLocal = new Map();
const failed = [];
const pending = [];
for (const url of list) {
  const hit = onDisk.get(keyFor(url));
  if (hit) urlToLocal.set(url, `/uploads/products/${hit}`);
  else pending.push(url);
}
console.log(`already on disk (reused): ${urlToLocal.size} | to download: ${pending.length}`);

// 3. download the rest (concurrency 8, 20s timeout each, image content verified)
function extFrom(ctype, url) {
  if (ctype.includes('png')) return 'png';
  if (ctype.includes('webp')) return 'webp';
  if (ctype.includes('gif')) return 'gif';
  if (ctype.includes('avif')) return 'avif';
  const m = url.match(/\.(jpe?g|png|webp|gif|avif)(?:\?|$)/i);
  return m ? m[1].toLowerCase().replace('jpeg', 'jpg') : 'jpg';
}

let idx = 0;
let done = 0;
async function worker() {
  while (idx < pending.length) {
    const url = pending[idx++];
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 20000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        redirect: 'follow',
        headers: { Accept: 'image/jpeg,image/*;q=0.8', 'User-Agent': 'BigDropKenya/1.0 (image-localize)' },
      });
      clearTimeout(t);
      const ctype = (res.headers.get('content-type') || '').toLowerCase();
      if (!res.ok || !ctype.startsWith('image/')) throw new Error(`HTTP ${res.status} ${ctype || 'no-type'}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1024) throw new Error(`too small (${buf.length}B)`);
      const key = keyFor(url);
      const name = `${key}.${extFrom(ctype, url)}`;
      fs.writeFileSync(path.join(outDir, name), buf);
      onDisk.set(key, name);
      urlToLocal.set(url, `/uploads/products/${name}`);
    } catch (e) {
      failed.push({ url, err: String(e.message).slice(0, 70) });
    }
    done += 1;
    if (done % 50 === 0) console.log(`progress ${done}/${pending.length} (failed: ${failed.length})`);
  }
}
await Promise.all(Array.from({ length: Math.min(8, pending.length) }, worker));

// 4. rewrite every occurrence in each file (failures keep their original URL)
// A URL the host answers with 4xx is gone for good (dead Unsplash photo id), so it
// becomes the local placeholder instead of a guaranteed broken <img src>. Failures
// that are not 4xx (timeouts, 5xx) stay remote and are listed in the report to retry.
const deadUrls = new Set(failed.filter((f) => /HTTP 4\d\d/.test(f.err)).map((f) => f.url));
const PLACEHOLDER = '/placeholder-product.svg';

function rewrite(node, stats) {
  if (typeof node === 'string') {
    if (deadUrls.has(node)) {
      stats.placeholders += 1;
      return PLACEHOLDER;
    }
    const local = urlToLocal.get(node);
    if (local) {
      stats.replaced += 1;
      return local;
    }
    return node;
  }
  if (Array.isArray(node)) return node.map((v) => rewrite(v, stats));
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) node[k] = rewrite(node[k], stats);
  }
  return node;
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const report = { downloaded: 0, reused: list.length - pending.length, failed: [], files: {} };
for (const t of parsed) {
  const backup = `${t.file}.pre-localize-${stamp}`;
  fs.copyFileSync(t.file, backup);
  const stats = { replaced: 0, placeholders: 0 };
  rewrite(t.db, stats);
  // Atomic save, same convention as server/src/db.js: temp file, previous
  // generation kept as .bak, then rename over the live file.
  const tmp = `${t.file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(t.db, null, 2));
  fs.copyFileSync(t.file, `${t.file}.bak`);
  fs.renameSync(tmp, t.file);
  report.files[t.label] = { refsRewritten: stats.replaced, deadRefsReplaced: stats.placeholders, backup: path.basename(backup) };
  console.log(`${t.label}: refs rewritten = ${stats.replaced} | dead refs -> placeholder = ${stats.placeholders} (backup ${path.basename(backup)})`);
}
report.downloaded = pending.length - failed.length;
fs.writeFileSync(path.join(root, 'localize-report.json'), JSON.stringify(report, null, 2));
console.log(`DONE: downloaded=${report.downloaded} reused=${report.reused} failed=${failed.length}`);
if (failed.length) console.log('failed (first 10):', JSON.stringify(failed.slice(0, 10).map((f) => ({ url: f.url.slice(0, 110), err: f.err })), null, 2));