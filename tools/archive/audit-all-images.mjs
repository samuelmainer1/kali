// Complete image audit: finds EVERY image reference in server/data/db.json (any
// field, not just product/category/hero) plus every hardcoded asset path in the
// client code, and reports the ones that cannot be served — i.e. the broken
// images a visitor would see as a missing tile.
import fs from 'fs';
import path from 'path';

const root = 'c:/Users/Sam/Downloads/New Bigdrop';
const publicDir = path.join(root, 'client', 'public');
const uploadsDir = path.join(root, 'server', 'uploads');

const IMAGE_KEY = /(image|images|avatar|logo|photo|thumbnail|thumb|cover|banner|icon|picture|img|favicon|hero)/i;
const LOCAL_IMG = /^\/(?:uploads\/)?[^\s]+\.(jpe?g|png|gif|webp|avif|svg|ico)$/i;

const db = JSON.parse(fs.readFileSync(path.join(root, 'server', 'data', 'db.json'), 'utf8'));

const missing = [];
const external = [];
const inline = [];
const emptyKeys = [];
const ok = [];

function checkString(value, jsonPath) {
  if (typeof value !== 'string') return;
  const v = value.trim();
  if (!v) return;

  if (v.startsWith('data:image')) {
    inline.push(jsonPath);
    return;
  }
  if (/^https?:\/\//i.test(v)) {
    if (/(unsplash|wp-content|\.(jpe?g|png|gif|webp|avif))(\/|\?|$)/i.test(v)) external.push({ jsonPath, v });
    return;
  }
  if (!LOCAL_IMG.test(v)) return;

  // Where must this file live?
  let file;
  if (v.startsWith('/uploads/')) file = path.join(uploadsDir, v.slice('/uploads/'.length));
  else file = path.join(publicDir, v.replace(/^\//, ''));
  if (fs.existsSync(file)) ok.push(jsonPath);
  else missing.push({ jsonPath, ref: v, expected: path.relative(root, file) });
}

function walk(node, jsonPath, keyName) {
  if (typeof node === 'string') {
    // An image-ish key holding an empty/blank value is also a broken tile.
    if (IMAGE_KEY.test(keyName || '') && !node.trim()) emptyKeys.push({ jsonPath, key: keyName });
    checkString(node, jsonPath);
    return;
  }
  if (Array.isArray(node)) {
    node.forEach((v, i) => walk(v, `${jsonPath}[${i}]`, keyName));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) walk(v, jsonPath ? `${jsonPath}.${k}` : k, k);
  }
}
walk(db, '', '');

// Hardcoded asset paths in client source (e.g. '/logo-header.png').
const clientSrc = path.join(root, 'client', 'src');
const codeMissing = [];
function scanDir(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) scanDir(full);
    else if (/\.(jsx?|css|html)$/i.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      for (const m of text.matchAll(/['"`](\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|svg|ico|webp|gif))['"`]/gi)) {
        const ref = m[1];
        if (ref.startsWith('/uploads/')) continue; // served by the API, checked above
        const file = path.join(publicDir, ref.replace(/^\//, ''));
        if (!fs.existsSync(file)) codeMissing.push({ file: path.relative(root, full), ref });
      }
    }
  }
}
scanDir(clientSrc);
// index.html too
const indexHtml = path.join(root, 'client', 'index.html');
if (fs.existsSync(indexHtml)) {
  const text = fs.readFileSync(indexHtml, 'utf8');
  for (const m of text.matchAll(/['"`](\/[A-Za-z0-9_./-]+\.(?:png|jpe?g|svg|ico|webp|gif))['"`]/gi)) {
    const file = path.join(publicDir, m[1].replace(/^\//, ''));
    if (!fs.existsSync(file)) codeMissing.push({ file: 'client/index.html', ref: m[1] });
  }
}

const group = (arr, keyOf) => {
  const g = {};
  for (const item of arr) {
    const key = keyOf(item);
    g[key] = (g[key] || 0) + 1;
  }
  return g;
};
const pathKeyOf = (p) => (p || '').replace(/\[\d+\]/g, '[]');

console.log('=== SUMMARY ===');
console.log('resolvable image refs in db.json :', ok.length);
console.log('MISSING files in db.json         :', missing.length);
console.log('external (remote) refs in db.json:', external.length);
console.log('inline data: URIs                :', inline.length);
console.log('empty image-ish fields           :', emptyKeys.length);
console.log('missing hardcoded assets in code :', codeMissing.length);

if (missing.length) {
  console.log('\n=== MISSING — db.json points at files that do not exist ===');
  console.log(JSON.stringify(group(missing, (m) => pathKeyOf(m.jsonPath)), null, 2));
  missing.slice(0, 25).forEach((m) => console.log(' -', m.jsonPath, '->', m.ref, '\n     expected:', m.expected));
}
if (codeMissing.length) {
  console.log('\n=== MISSING — hardcoded in client code ===');
  codeMissing.forEach((m) => console.log(' -', m.file, '->', m.ref));
}
if (external.length) {
  console.log('\n=== EXTERNAL (remote host) ===');
  console.log(JSON.stringify(group(external, (m) => pathKeyOf(m.jsonPath)), null, 2));
  external.slice(0, 15).forEach((m) => console.log(' -', m.jsonPath, '->', m.v.slice(0, 100)));
}
if (emptyKeys.length) {
  console.log('\n=== EMPTY image-ish fields, by key name ===');
  console.log(JSON.stringify(group(emptyKeys, (e) => e.key), null, 2));
  emptyKeys.slice(0, 15).forEach((k) => console.log(' -', k.jsonPath, '(key: ' + k.key + ')'));
}
