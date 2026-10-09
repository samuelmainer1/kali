// Item 18 — orphan sweep: reports files in server/uploads/* that NO record any longer
// references (products, categories, heroes, blog posts, testimonials, users' carts,
// order items and order documents) in db.json OR seed.json.
//
// Read-only by default so you can see the list first:
//   node tools/sweep-orphans.mjs            -> report only
//   node tools/sweep-orphans.mjs --delete   -> delete the reported orphans
//
// Deletion is limited to server/uploads/**; nothing outside that tree is touched.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DELETE = process.argv.includes('--delete');
const uploadsRoot = path.join(root, 'server', 'uploads');

// 1. every path referenced anywhere in db.json or seed.json (any string starting with /uploads/)
//
// seed.json must be counted: db.js copies it over db.json on a first boot, so a
// picture the bundled catalogue references is live even when the current live
// store no longer does. Sweeping those files away broke three seeded hero
// banners (photo-1607082348824/1601584115197/1503676260728_w1600.jpg) — they are
// referenced by seed.json only, and db.json's own heroes had since been replaced
// with uploaded banners.
const referenced = new Set();
for (const name of ['db.json', 'seed.json']) {
  const file = path.join(root, 'server', 'data', name);
  if (!fs.existsSync(file)) continue;
  (function walk(node) {
    if (typeof node === 'string') {
      if (node.startsWith('/uploads/')) referenced.add(node);
      return;
    }
    if (Array.isArray(node)) return node.forEach(walk);
    if (node && typeof node === 'object') for (const v of Object.values(node)) walk(v);
  })(JSON.parse(fs.readFileSync(file, 'utf8')));
}

// 2. every file actually on disk under server/uploads
const onDisk = [];
for (const folder of fs.readdirSync(uploadsRoot, { withFileTypes: true })) {
  if (!folder.isDirectory()) continue;
  for (const f of fs.readdirSync(path.join(uploadsRoot, folder.name))) {
    onDisk.push({ rel: `/uploads/${folder.name}/${f}`, abs: path.join(uploadsRoot, folder.name, f) });
  }
}

// 3. report
const orphans = onDisk.filter((f) => !referenced.has(f.rel));
const groups = {};
for (const o of orphans) {
  const g = o.rel.replace('/uploads/', '').split('/')[0];
  groups[g] = groups[g] || { count: 0, bytes: 0 };
  groups[g].count += 1;
  groups[g].bytes += fs.statSync(o.abs).size;
}

console.log(`referenced paths (db + seed): ${referenced.size}`);
console.log(`files under server/uploads  : ${onDisk.length}`);
console.log(`ORPHANS (unreferenced)      : ${orphans.length}`);
for (const [g, s] of Object.entries(groups)) {
  console.log(`  ${g.padEnd(12)} ${String(s.count).padStart(5)} files  ${(s.bytes / 1024 / 1024).toFixed(1)} MB`);
}

// safety: a referenced path with no file on disk is a broken tile, not an orphan
const missing = [...referenced].filter((r) => !onDisk.some((f) => f.rel === r));
console.log(`\nreferenced but MISSING on disk: ${missing.length}`);
missing.slice(0, 10).forEach((m) => console.log('  !', m));

if (!orphans.length) {
  console.log('\nNothing to clean.');
} else if (!DELETE) {
  console.log('\nDRY RUN — nothing deleted. First 25 orphans:');
  orphans.slice(0, 25).forEach((o) => console.log('  ', o.rel));
  console.log('\nre-run with --delete to remove them.');
} else {
  let bytes = 0;
  for (const o of orphans) {
    bytes += fs.statSync(o.abs).size;
    fs.unlinkSync(o.abs);
  }
  console.log(`\nDELETED ${orphans.length} orphans (${(bytes / 1024 / 1024).toFixed(1)} MB freed).`);
}