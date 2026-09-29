/**
 * Import a WooCommerce products CSV as the live BigDrop catalogue
 * and remove the sample/demo products.
 *
 * Usage: node server/scripts/importWooCsv.js [path-to.csv]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { parseWooCommerceCsv, slugifyName } from '../src/wooCommerce.js';
import { downloadRemoteImage, uploadsRoot } from '../src/uploads.js';
import { dataDir, dbPath } from '../src/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CATEGORY_MAP = {
  'home essentials(fmcg)': 'cat_household',
  'health & beauty': 'cat_beauty',
  uncategorized: 'cat_home',
  'home and office': 'cat_home',
  'baby products': 'cat_baby',
  electronics: 'cat_tv',
  'phones & tablets': 'cat_phones',
  'garden & outdoors': 'cat_garden',
  'sporting goods': 'cat_sports',
  fashion: 'cat_fashion',
  'liquor store': 'cat_wine',
  grocery: 'cat_groceries',
  'lights & lighting accessories': 'cat_home',
  'pet items': 'cat_pets',
  'kitchen appliances': 'cat_appliances',
  automobile: 'cat_auto',
  'industrial & scientific': 'cat_home',
  computing: 'cat_computers',
  'household supplies': 'cat_household',
  beauty: 'cat_beauty',
  gaming: 'cat_gaming',
  'sanitary paper products': 'cat_household',
  stationery: 'cat_books',
  drinks: 'cat_food',
  instrument: 'cat_music',
  alcohol: 'cat_wine',
  households: 'cat_household',
};

function isDemoProductId(id) {
  return /^prd_\d+$/.test(String(id || '')) || String(id || '') === 'prd_pending_1';
}

function localUploadExists(url) {
  if (!url || !url.startsWith('/uploads/')) return false;
  const full = path.join(uploadsRoot, url.replace(/^\/uploads\//, ''));
  return fs.existsSync(full);
}

async function mapPool(items, limit, fn) {
  const ret = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      ret[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return ret;
}

const csvPath = path.resolve(process.argv[2] || path.join(dataDir, 'wc-product-export.csv'));
if (!fs.existsSync(csvPath)) {
  console.error('CSV not found:', csvPath);
  process.exit(1);
}

const cachePath = path.join(dataDir, 'woo-image-cache.json');
const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, 'utf8')) : {};

const csv = fs.readFileSync(csvPath, 'utf8');
const parsed = parseWooCommerceCsv(csv);
console.log(`Parsed ${parsed.length} importable products from ${path.basename(csvPath)}`);

const uniqueUrls = [...new Set(parsed.flatMap((p) => p.images || []))];
console.log(`Downloading ${uniqueUrls.length} unique product photos…`);

let done = 0;
let failed = 0;
await mapPool(uniqueUrls, 8, async (url) => {
  if (cache[url] && localUploadExists(cache[url])) {
    done += 1;
    return cache[url];
  }
  const saved = await downloadRemoteImage(url, 'products');
  if (saved) cache[url] = saved;
  else failed += 1;
  done += 1;
  if (done % 50 === 0 || done === uniqueUrls.length) {
    fs.writeFileSync(cachePath, JSON.stringify(cache));
    console.log(`  photos ${done}/${uniqueUrls.length} (${failed} missing)`);
  }
  return saved || '';
});
fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
const categories = db.categories || [];
const catById = new Map(categories.map((c) => [c.id, c]));

function resolveCategory(wooName) {
  const key = String(wooName || '')
    .trim()
    .toLowerCase();
  const mapped = CATEGORY_MAP[key] || (key ? null : 'cat_home');
  if (mapped && catById.has(mapped)) return catById.get(mapped);
  if (!wooName) return catById.get('cat_home') || categories[0];
  const lower = String(wooName).trim().toLowerCase();
  const found = categories.find(
    (c) => c.name.toLowerCase() === lower || c.slug === lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  );
  if (found) return found;
  const cat = {
    id: 'cat_woo_' + nanoid(6),
    name: String(wooName).trim(),
    slug: lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${nanoid(4)}`,
    image: '',
    description: '',
    brands: ['BigDrop'],
    hidden: false,
  };
  categories.push(cat);
  catById.set(cat.id, cat);
  return cat;
}

const vendorId = db.users?.find((u) => u.role === 'admin')?.id || 'usr_admin';
const now = new Date().toISOString();
const products = [];

for (const row of parsed) {
  const cat = resolveCategory(row.category);
  const images = (row.images || []).map((url) => cache[url]).filter((u) => u && localUploadExists(u));
  const sku = row.sku || `WOO-${nanoid(6).toUpperCase()}`;
  products.push({
    id: 'prd_woo_' + nanoid(10),
    vendorId,
    categoryId: cat.id,
    name: row.name,
    slug: slugifyName(row.name),
    description: row.description,
    specifications: [
      row.brand ? { name: 'Brand', value: row.brand } : null,
      { name: 'Category', value: cat.name },
      { name: 'SKU', value: sku },
      { name: 'Condition', value: 'New' },
    ].filter(Boolean),
    variants: [],
    brand: row.brand || cat.brands?.[0] || 'BigDrop',
    price: row.price,
    compareAt: row.compareAt,
        stock: Math.max(10, Number.isFinite(row.stock) ? row.stock : 10),
    sku,
    images,
    featured: false,
    rating: 0,
    reviews: 0,
    reviewList: [],
    soldCount: 0,
    tags: ['woocommerce'],
    hidden: false,
    status: 'approved',
    source: 'woocommerce',
    createdAt: now,
  });
}

const featuredByCat = {};
for (const p of products) {
  if (!p.images.length) continue;
  featuredByCat[p.categoryId] = featuredByCat[p.categoryId] || 0;
  if (featuredByCat[p.categoryId] < 8) {
    p.featured = true;
    featuredByCat[p.categoryId] += 1;
  }
}

for (const cat of categories) {
  const first = products.find((p) => p.categoryId === cat.id && p.images[0]);
  if (first?.images[0]) cat.image = first.images[0];
  const count = products.filter((p) => p.categoryId === cat.id).length;
  cat.hidden = count === 0;
  const brands = [...new Set(products.filter((p) => p.categoryId === cat.id).map((p) => p.brand).filter(Boolean))];
  if (brands.length) cat.brands = brands.slice(0, 12);
}

const keptExisting = (db.products || []).filter((p) => !isDemoProductId(p.id) && p.source === 'woocommerce');
const nextProducts = [...products];

db.products = nextProducts;
db.categories = categories;
db.site = db.site || {};
db.site.featuredCategorySlugs = ['household', 'beauty-health', 'phone-tablet', 'home-office'];

for (const u of db.users || []) {
  if (Array.isArray(u.cart)) {
    u.cart = u.cart.filter((line) => nextProducts.some((p) => p.id === line.productId));
  }
  if (Array.isArray(u.wishlist)) {
    u.wishlist = u.wishlist.filter((id) => nextProducts.some((p) => p.id === id));
  }
}

const tmp = `${dbPath}.tmp`;
fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, `${dbPath}.bak`);
fs.renameSync(tmp, dbPath);

const catalogue = {
  importedAt: now,
  source: path.basename(csvPath),
  categories,
  products,
};
fs.writeFileSync(path.join(dataDir, 'woo-catalogue.json'), JSON.stringify(catalogue));

const withPhotos = products.filter((p) => p.images.length).length;
console.log(
  `Imported ${products.length} live products (${withPhotos} with photos). Removed ${keptExisting.length ? 'previous Woo rows and ' : ''}sample catalogue.`
);
console.log(
  'Categories with stock:',
  categories
    .filter((c) => !c.hidden)
    .map((c) => `${c.name} (${products.filter((p) => p.categoryId === c.id).length})`)
    .join(' | ')
);
