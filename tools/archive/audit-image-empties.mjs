// Per-collection report of image-ish fields that are EMPTY (a blank/broken tile in
// the UI) vs filled, so we can see exactly which parts of the site render no image.
import fs from 'fs';

const db = JSON.parse(fs.readFileSync('c:/Users/Sam/Downloads/New Bigdrop/server/data/db.json', 'utf8'));
const IMAGE_KEY = /^(image|images|avatar|logo|photo|thumbnail|thumb|cover|banner|icon|picture|img|favicon|hero|heroImage)$/i;

const rows = [];
function scan(label, node, jsonPath) {
  if (Array.isArray(node)) {
    node.forEach((v, i) => scan(label, v, `${jsonPath}[${i}]`));
    return;
  }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string' && IMAGE_KEY.test(k)) {
        rows.push({ collection: label, key: k, empty: !v.trim(), path: `${jsonPath}.${k}` });
      }
      scan(label, v, `${jsonPath}.${k}`);
    }
  }
}

for (const [k, v] of Object.entries(db)) {
  if (Array.isArray(v)) scan(k, v, k);
  else if (v && typeof v === 'object') scan(k, v, k);
}

const byCollection = {};
for (const r of rows) {
  byCollection[r.collection] ||= { empty: 0, filled: 0, keys: {} };
  const c = byCollection[r.collection];
  if (r.empty) c.empty += 1;
  else c.filled += 1;
  c.keys[r.key] ||= { empty: 0, filled: 0 };
  if (r.empty) c.keys[r.key].empty += 1;
  else c.keys[r.key].filled += 1;
}

console.log('collection'.padEnd(18), 'empty'.padStart(7), 'filled'.padStart(7), ' breakdown');
for (const [name, c] of Object.entries(byCollection)) {
  const detail = Object.entries(c.keys).map(([k, v]) => `${k}: ${v.empty} empty / ${v.filled} ok`).join('; ');
  console.log(name.padEnd(18), String(c.empty).padStart(7), String(c.filled).padStart(7), ' ' + detail);
}

console.log('\n--- site.* sub-objects with image fields ---');
for (const [k, v] of Object.entries(db.site || {})) {
  if (Array.isArray(v)) {
    const withImg = v.filter((x) => x && typeof x === 'object' && Object.keys(x).some((kk) => IMAGE_KEY.test(kk)));
    if (withImg.length) {
      console.log(`site.${k}: ${v.length} items`);
      withImg.slice(0, 6).forEach((x) => {
        const keys = Object.keys(x).filter((kk) => IMAGE_KEY.test(kk));
        console.log('   ', JSON.stringify(Object.fromEntries(keys.map((kk) => [kk, x[kk] || '(EMPTY)']))).slice(0, 130));
      });
    }
  } else if (v && typeof v === 'object') {
    const keys = Object.keys(v).filter((kk) => IMAGE_KEY.test(kk));
    if (keys.length) console.log(`site.${k}:`, JSON.stringify(Object.fromEntries(keys.map((kk) => [kk, v[kk] || '(EMPTY)']))).slice(0, 160));
  }
}
