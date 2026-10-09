// Gives a REAL photo to every product that is currently showing the grey
// /placeholder-product.svg — i.e. the tiles that visibly "do not show" on the storefront.
//
// Their original Unsplash photo ids are deleted (HTTP 404), so instead of downloading
// (impossible) this maps each product to a suitable photo that is ALREADY on this server,
// picked from the same category and preferring photos used by the fewest other products so
// the grid stays varied. The placeholder remains only as the emergency fallback in code.
//
// Run ONLY while the API is stopped — db.json lives in server memory and the next API save
// would overwrite this change.
import fs from 'fs';
import path from 'path';

const root = 'c:/Users/Sam/Downloads/New Bigdrop';
const PLACEHOLDER = '/placeholder-product.svg';
const APPLY = process.argv.includes('--apply');

const uploadDir = path.join(root, 'server', 'uploads', 'products');
const onDisk = new Set(fs.readdirSync(uploadDir));
const isLocalOk = (u) =>
  typeof u === 'string' && u.startsWith('/uploads/products/') && onDisk.has(u.replace('/uploads/products/', ''));

const files = [
  { label: 'db', file: path.join(root, 'server', 'data', 'db.json') },
  { label: 'seed', file: path.join(root, 'server', 'data', 'seed.json') },
];

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const report = {};

for (const t of files) {
  const db = JSON.parse(fs.readFileSync(t.file, 'utf8'));
  const products = db.products || [];

  // How often is each local photo already used, per category? Prefer the least used.
  const usage = new Map(); // image -> count
  for (const p of products) {
    for (const img of p.images || []) {
      if (isLocalOk(img)) usage.set(img, (usage.get(img) || 0) + 1);
    }
  }

  const poolByCat = new Map(); // categoryId -> [images] least-used first
  const poolFor = (categoryId) => {
    if (!poolByCat.has(categoryId)) {
      const imgs = [
        ...new Set(
          products
            .filter((p) => p.categoryId === categoryId && !(p.images || []).includes(PLACEHOLDER))
            .flatMap((p) => (p.images || []).filter(isLocalOk))
        ),
      ].sort((a, b) => (usage.get(a) || 0) - (usage.get(b) || 0) || a.localeCompare(b));
      poolByCat.set(categoryId, imgs);
    }
    return poolByCat.get(categoryId);
  };

  const chosen = [];
  const cursor = new Map(); // categoryId -> next index into its pool
  for (const p of products) {
    const images = Array.isArray(p.images) ? p.images : [];
    const onlyPlaceholder = images.length > 0 && images.every((i) => i === PLACEHOLDER);
    if (!onlyPlaceholder) continue;

    const pool = poolFor(p.categoryId);
    if (!pool.length) {
      chosen.push({ sku: p.sku, name: p.name, categoryId: p.categoryId, image: null, note: 'no local image in category' });
      continue;
    }
    const i = (cursor.get(p.categoryId) || 0) % pool.length;
    cursor.set(p.categoryId, i + 1);
    const image = pool[i];
    p.images = [image];
    usage.set(image, (usage.get(image) || 0) + 1);
    chosen.push({ sku: p.sku, name: p.name, categoryId: p.categoryId, image });
  }

  const fixed = chosen.filter((c) => c.image).length;
  report[t.label] = { fixed, unfixable: chosen.length - fixed, assignments: chosen };

  console.log(`\n=== ${t.label} (${APPLY ? 'APPLYING' : 'DRY RUN'}) — ${chosen.length} products were on placeholder ===`);
  for (const c of chosen) console.log(`  ${(c.sku || '').padEnd(11)} ${String(c.name).slice(0, 32).padEnd(33)} -> ${c.image || '*** ' + c.note}`);

  if (APPLY && fixed) {
    const backup = `${t.file}.pre-image-fix-${stamp}`;
    fs.copyFileSync(t.file, backup);
    const tmp = `${t.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
    fs.copyFileSync(t.file, `${t.file}.bak`);
    fs.renameSync(tmp, t.file);
    console.log(`  saved (backup ${path.basename(backup)})`);
  }
}

fs.writeFileSync(path.join(root, 'image-fix-report.json'), JSON.stringify(report, null, 2));
const total = Object.values(report).reduce((n, r) => n + r.fixed, 0);
console.log(`\n${APPLY ? 'APPLIED' : 'PLANNED'}: ${total} products given a real local photo.`);
if (!APPLY) console.log('nothing was written — re-run with --apply to save.');