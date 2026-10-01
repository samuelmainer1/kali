/**
 * List five L'Oreal Revitalift and Age Perfect creams on BigDrop Kenya.
 *
 * Run from the repo root:
 *   node server/scripts/addLorealCreams.js
 *
 * Then restart the API (touch server/src/index.js).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { updateDb } from '../src/db.js';
import { compressProductImage, uploadsRoot } from '../src/uploads.js';
import { generateProductSku, skuTakenSet } from '../src/commerce.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PHOTO_DIR = path.join(__dirname, '../data/product-photos');
const VENDOR_ID = 'usr_vendor7';
const BRAND = "L'Oreal";

function hay(p) {
  return `${p.name || ''} ${p.brand || ''}`;
}

const LISTINGS = [
  {
    key: 'red',
    name: "L'Oreal Revitalift Energising Red Cream Day",
    brand: BRAND,
    price: 3503,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'day-cream', 'revitalift'],
    photos: ['loreal-revitalift-energising-red-cream.png'],
    replaceIds: [],
    match: (p) => /revitalift/i.test(hay(p)) && /energising|energizing|red cream|red ginseng/i.test(p.name || ''),
    description: `A red jar for mornings that need a lift.

L'Oreal Paris Revitalift Energising Red Cream Day is an anti-wrinkle, extra-firming day cream with a healthy glow. New formula with red ginseng, plus advanced Pro-Retinol. Deep action in a rich red cream that belongs in the daylight routine.

How to use:
- After cleansing in the morning, warm a pearl of cream between your fingertips.
- Smooth over face and neck, upward.
- Follow with SPF if you are heading into the sun.

Revitalift. Day. Red ginseng.`,
    extraSpecs: [
      { name: 'Product', value: 'Revitalift Energising Red Cream Day' },
      { name: 'Type', value: 'Day cream' },
      { name: 'Line', value: 'Revitalift' },
      { name: 'When to use', value: 'Morning' },
      { name: 'Key ingredients', value: 'Advanced Pro-Retinol, red ginseng' },
      { name: 'Benefit', value: 'Anti-wrinkle, extra firming, healthy glow' },
    ],
  },
  {
    key: 'moisturizer',
    name: "L'Oreal Revitalift Anti-Wrinkle Firming Moisturizer 48g",
    brand: BRAND,
    price: 2888,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'moisturizer', 'revitalift'],
    photos: ['loreal-revitalift-moisturizer.png'],
    replaceIds: ['prd_woo_MUfLENrFtv'],
    match: (p) =>
      /revitalift/i.test(hay(p)) &&
      /anti-wrinkle|firming/i.test(p.name || '') &&
      /moistur/i.test(p.name || '') &&
      !/night/i.test(p.name || '') &&
      !/energising|energizing|red cream|multi-lift/i.test(p.name || ''),
    description: `The white-and-red Revitalift jar — soften, smooth, and resist the look of lines.

L'Oreal Paris Revitalift Anti-Wrinkle + Firming Moisturizer is a day hydrator with Pro-Retinol and Centella Asiatica. It helps resist signs of aging and leaves skin feeling softer and smoother. 1.7 oz (48 g).

How to use:
- Apply to a clean face and neck every morning.
- Smooth until absorbed.
- Use SPF on top in the daytime.

Pro-Retinol + Centella Asiatica.`,
    extraSpecs: [
      { name: 'Product', value: 'Revitalift Anti-Wrinkle + Firming Moisturizer' },
      { name: 'Type', value: 'Day moisturizer' },
      { name: 'Size', value: '1.7 oz (48 g)' },
      { name: 'Line', value: 'Revitalift' },
      { name: 'When to use', value: 'Day' },
      { name: 'Key ingredients', value: 'Pro-Retinol, Centella Asiatica' },
      { name: 'Benefit', value: 'Resist signs of aging; soften and smooth skin' },
    ],
  },
  {
    key: 'night',
    name: "L'Oreal Revitalift Anti-Wrinkle Firming Night Moisturizer 48g",
    brand: BRAND,
    price: 4680,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'night-cream', 'revitalift'],
    photos: ['loreal-revitalift-night-moisturizer.png'],
    replaceIds: ['prd_woo_VFNStjbqDj'],
    match: (p) =>
      /revitalift/i.test(hay(p)) &&
      /night/i.test(p.name || '') &&
      /moistur/i.test(p.name || ''),
    description: `Revitalift after lights-out.

L'Oreal Paris Revitalift Anti-Wrinkle + Firming Night Moisturizer works while you sleep. Pro-Retinol and Centella Asiatica help resist signs of aging and leave skin feeling softer and smoother by morning. 1.7 oz (48 g).

How to use:
- After evening cleansing, smooth over face and neck.
- Leave on overnight. Do not rinse.
- Use the day moisturizer in the morning.

Night. Pro-Retinol + Centella Asiatica.`,
    extraSpecs: [
      { name: 'Product', value: 'Revitalift Anti-Wrinkle + Firming Night Moisturizer' },
      { name: 'Type', value: 'Night moisturizer' },
      { name: 'Size', value: '1.7 oz (48 g)' },
      { name: 'Line', value: 'Revitalift' },
      { name: 'When to use', value: 'Night' },
      { name: 'Key ingredients', value: 'Pro-Retinol, Centella Asiatica' },
      { name: 'Benefit', value: 'Resist signs of aging; soften and smooth skin' },
    ],
  },
  {
    key: 'age-day',
    name: "L'Oreal Paris Age Perfect Cell Renew Day Cream",
    brand: BRAND,
    price: 3400,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'day-cream', 'age-perfect'],
    photos: ['loreal-age-perfect-cell-renew-day.png'],
    replaceIds: [],
    match: (p) =>
      /age perfect/i.test(hay(p)) &&
      /cell renew|revitalising care/i.test(p.name || '') &&
      !/night/i.test(p.name || ''),
    description: `Day cream for skin that wants wrinkle care, firmness, and vitality in one jar.

L'Oreal Paris Age Perfect Cell Renew Revitalising Care is a new-formula day cream. Antioxidant recovery complex, inspired by mother cells science, to help reveal new cells — wrinkle, firmness, vitality.

The dark jar with the gold collar is the morning Age Perfect step.

How to use:
- Apply to face and neck every morning after cleansing.
- Smooth in upward strokes.
- Follow with SPF.

Age Perfect Cell Renew. Day.`,
    extraSpecs: [
      { name: 'Product', value: 'Age Perfect Cell Renew Revitalising Care Day' },
      { name: 'Type', value: 'Day cream' },
      { name: 'Line', value: 'Age Perfect Cell Renew' },
      { name: 'When to use', value: 'Day' },
      { name: 'Complex', value: 'Antioxidant recovery complex' },
      { name: 'Benefit', value: 'Wrinkle, firmness, vitality' },
    ],
  },
  {
    key: 'age-night',
    name: "L'Oreal Paris Age Perfect Collagen Expert Night Cream",
    brand: BRAND,
    price: 5320,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'night-cream', 'age-perfect'],
    photos: ['loreal-age-perfect-collagen-expert-night.png'],
    replaceIds: [],
    match: (p) =>
      /age perfect/i.test(hay(p)) &&
      /collagen expert|anti-sagging|retightening/i.test(p.name || '') &&
      /night/i.test(p.name || ''),
    description: `Night cream for mature skin — anti-sagging and anti-age spots while you sleep.

L'Oreal Paris Age Perfect Collagen Expert Retightening Cream is a new-formula night cream with collagen AA fractions. Made for mature skin. The white jar with the rose-gold cap is the evening Age Perfect step.

How to use:
- After cleansing at night, smooth over face and neck.
- Leave on until morning.
- Use Age Perfect day cream in the daytime.

Collagen Expert. Night. Mature skin.`,
    extraSpecs: [
      { name: 'Product', value: 'Age Perfect Collagen Expert Retightening Cream Night' },
      { name: 'Type', value: 'Night cream' },
      { name: 'Line', value: 'Age Perfect Collagen Expert' },
      { name: 'When to use', value: 'Night' },
      { name: 'Skin type', value: 'Mature skin' },
      { name: 'Key ingredients', value: 'Collagen AA fractions' },
      { name: 'Benefit', value: 'Anti-sagging, anti-age spots' },
    ],
  },
];

async function savePhotos(files) {
  const dir = path.join(uploadsRoot, 'products');
  fs.mkdirSync(dir, { recursive: true });
  const urls = [];
  for (const file of files) {
    const source = path.join(PHOTO_DIR, file);
    if (!fs.existsSync(source)) throw new Error(`Missing source photo: ${source}`);
    const webp = await compressProductImage(fs.readFileSync(source));
    if (webp.length > 150 * 1024) throw new Error(`${file} compressed to ${webp.length} bytes — over 150KB`);
    const name = `${Date.now()}-${nanoid(8)}.webp`;
    fs.writeFileSync(path.join(dir, name), webp);
    urls.push(`/uploads/products/${name}`);
    console.log(`  ${file} → ${name} (${webp.length} bytes)`);
  }
  return urls;
}

function uniqueSlug(db, name, excludeId) {
  const base =
    String(name || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'product';
  let slug = `${base}-${nanoid(4)}`;
  const taken = (s) => (db.products || []).some((p) => p.slug === s && p.id !== excludeId);
  while (taken(slug)) slug = `${base}-${nanoid(4)}`;
  return slug;
}

function addBrand(db, categoryId, brand) {
  const cat = (db.categories || []).find((c) => c.id === categoryId);
  if (!cat) return;
  const brands = Array.isArray(cat.brands) ? cat.brands : [];
  if (!brands.some((b) => String(b).toLowerCase() === brand.toLowerCase())) {
    cat.brands = [...brands, brand];
  }
}

function specsFor(listing, sku) {
  return [
    { name: 'Brand', value: listing.brand },
    ...listing.extraSpecs,
    { name: 'Category', value: 'Beauty & Health' },
    { name: 'SKU', value: sku },
    { name: 'Condition', value: 'New' },
    { name: 'Sold by', value: 'BigDrop Kenya' },
  ];
}

function applyListing(db, listing, images) {
  const found =
    (db.products || []).find((p) => listing.replaceIds.includes(p.id)) ||
    (db.products || []).find((p) => listing.match(p) && !p.hidden);

  if (found) {
    found.vendorId = VENDOR_ID;
    found.categoryId = listing.categoryId;
    found.name = listing.name;
    found.slug = uniqueSlug(db, listing.name, found.id);
    found.description = listing.description;
    found.specifications = specsFor(listing, found.sku);
    found.brand = listing.brand;
    found.price = listing.price;
    found.compareAt = null;
    found.images = images;
    found.tags = listing.tags;
    found.hidden = false;
    found.status = 'approved';
    found.source = 'manual';
    found.stock = Number(found.stock || 0) > 0 ? found.stock : 10;
    found.variants = found.variants || [];
    return { product: found, created: false };
  }

  const sku = generateProductSku(skuTakenSet(db.products));
  const created = {
    id: 'prd_' + nanoid(10),
    vendorId: VENDOR_ID,
    categoryId: listing.categoryId,
    name: listing.name,
    slug: uniqueSlug(db, listing.name),
    description: listing.description,
    specifications: specsFor(listing, sku),
    variants: [],
    brand: listing.brand,
    price: listing.price,
    compareAt: null,
    stock: 10,
    sku,
    images,
    featured: false,
    rating: 0,
    reviews: 0,
    reviewList: [],
    soldCount: 0,
    tags: listing.tags,
    hidden: false,
    status: 'approved',
    source: 'manual',
    createdAt: new Date().toISOString(),
  };
  db.products.push(created);
  return { product: created, created: true };
}

const imageMap = {};
for (const listing of LISTINGS) {
  console.log(`Photos for ${listing.name}`);
  imageMap[listing.key] = await savePhotos(listing.photos);
}

const result = updateDb(
  (db) => {
    addBrand(db, 'cat_beauty', "L'Oreal");
    addBrand(db, 'cat_beauty', "L'Oréal");

    const keepIds = new Set();
    const rows = [];
    for (const listing of LISTINGS) {
      const { product, created } = applyListing(db, listing, imageMap[listing.key]);
      keepIds.add(product.id);
      rows.push({ created, product });
    }

    const hidden = [];
    for (const listing of LISTINGS) {
      for (const p of db.products || []) {
        if (keepIds.has(p.id)) continue;
        if (!listing.match(p)) continue;
        p.hidden = true;
        hidden.push({ id: p.id, name: p.name, sku: p.sku });
      }
    }

    return { rows, hidden };
  },
  { actor: 'system', action: 'product.replace', detail: "L'Oreal Revitalift Age Perfect" }
);

for (const row of result.rows) {
  const p = row.product;
  console.log(`${row.created ? 'CREATED' : 'UPDATED'} ${p.name} · KSh ${p.price} · ${p.sku} · ${p.slug}`);
}
console.log(`Hidden duplicates: ${result.hidden.length}`);
for (const h of result.hidden) console.log(`  HID ${h.sku} ${h.name}`);
