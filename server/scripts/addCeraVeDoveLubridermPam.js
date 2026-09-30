/**
 * List the CeraVe, Dove, Lubriderm, and PAM products on BigDrop Kenya,
 * then hide older duplicate listings of the same goods.
 *
 * Run from the repo root:
 *   node server/scripts/addCeraVeDoveLubridermPam.js
 *
 * Then restart the API (touch server/src/index.js) so the in-memory store reloads.
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

const LISTINGS = [
  {
    key: 'cerave',
    name: 'CeraVe Daily Moisturizing Lotion 16 fl oz (473ml)',
    brand: 'CeraVe',
    price: 4040,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'lotion'],
    photos: ['cerave-daily-moisturizing-lotion-front.png', 'cerave-daily-moisturizing-lotion-back.png'],
    replaceIds: ['prd_woo_QCW64zJXSo'],
    match: (p) => /cerave/i.test(`${p.name} ${p.brand}`) && /daily moistur/i.test(p.name || ''),
    description: `Light, all-day moisture for skin that feels comfortable — not coated.

CeraVe Daily Moisturizing Lotion is a dermatologist-developed lotion for normal to dry skin. Three essential ceramides and hyaluronic acid moisturise and help restore the protective skin barrier, with MVE Delivery Technology releasing hydration through the day.

The formula is lightweight, oil free, fragrance free, non-comedogenic, allergy tested, and gentle on skin. Accepted by the National Eczema Association.

How to use:
- Apply liberally as often as needed, or as directed by a physician.
- Smooth over face and body until absorbed.
- Avoid direct contact with the eyes.

Value size. 16 fl oz (473 ml).`,
    extraSpecs: [
      { name: 'Product', value: 'Daily Moisturizing Lotion' },
      { name: 'Type', value: 'Face and body lotion' },
      { name: 'Size', value: '16 fl oz (473 ml)' },
      { name: 'Skin type', value: 'Normal to dry' },
      { name: 'Key ingredients', value: '3 essential ceramides, hyaluronic acid' },
      { name: 'Technology', value: 'MVE controlled-release hydration' },
      { name: 'Finish', value: 'Lightweight, oil free, non-comedogenic' },
      { name: 'Fragrance', value: 'Fragrance free' },
      { name: 'Tested', value: 'Allergy tested, National Eczema Association accepted' },
    ],
  },
  {
    key: 'dove-sensitive',
    name: 'Dove Sensitive Skin Body Wash 680ml',
    brand: 'Dove',
    price: 2120,
    categoryId: 'cat_beauty',
    tags: ['body-wash', 'sensitive-skin'],
    photos: ['dove-sensitive-skin-body-wash.png'],
    replaceIds: ['prd_woo_pzNg7YU9KW'],
    match: (p) =>
      /dove/i.test(`${p.name} ${p.brand}`) &&
      /sensitive/i.test(p.name || '') &&
      /wash|gel/i.test(p.name || '') &&
      !/3[- ]?pack|3 in 1|3-pack|bundle/i.test(p.name || ''),
    description: `A gentle cleanse for skin that prefers a quieter formula.

Dove Sensitive Skin Body Wash is hypoallergenic and made with 24hr Renewing MicroMoisture. It washes without the extra fragrance or fuss, leaving skin feeling soft, calm, and comfortable.

Dermatologist recommended. Kind on sensitive skin, every shower.

How to use:
- Squeeze onto a wet pouf, cloth, or hands.
- Massage over the body, then rinse.
- Use daily.

23 US fl oz | 680 ml.`,
    extraSpecs: [
      { name: 'Product', value: 'Sensitive Skin Body Wash' },
      { name: 'Type', value: 'Hypoallergenic body wash' },
      { name: 'Size', value: '680 ml (23 US fl oz)' },
      { name: 'Skin type', value: 'Sensitive' },
      { name: 'Benefit', value: '24hr Renewing MicroMoisture' },
      { name: 'Fragrance', value: 'Sensitive / hypoallergenic' },
    ],
  },
  {
    key: 'dove-deep',
    name: 'Dove Deep Moisture Body Wash 23 fl oz',
    brand: 'Dove',
    price: 2120,
    categoryId: 'cat_beauty',
    tags: ['body-wash'],
    photos: ['dove-deep-moisture-body-wash.png'],
    replaceIds: ['prd_woo_JjdFKOpzuf'],
    match: (p) =>
      /dove/i.test(`${p.name} ${p.brand}`) &&
      /deep moisture/i.test(p.name || '') &&
      !/3[- ]?pack|3 in 1|3-pack|bundle/i.test(p.name || ''),
    description: `Shower like you just stepped out of a lotion.

Dove Deep Moisture Body Wash gives 24-hour lotion-soft skin, with 24hr Renewing MicroMoisture in a rich, creamy lather. Dermatologist recommended, and the kind of everyday wash you actually look forward to.

How to use:
- Squeeze onto a wet pouf, cloth, or hands.
- Work into a creamy lather, then rinse.
- Use daily.

23 fl oz body wash.`,
    extraSpecs: [
      { name: 'Product', value: 'Deep Moisture Body Wash' },
      { name: 'Type', value: 'Nourishing body wash' },
      { name: 'Size', value: '23 fl oz' },
      { name: 'Skin type', value: 'All skin types, especially dry' },
      { name: 'Benefit', value: '24hr lotion-soft skin, Renewing MicroMoisture' },
    ],
  },
  {
    key: 'dove-3pack',
    name: 'Dove Body Wash 3-Pack (2 Deep Moisture + Sensitive Skin)',
    brand: 'Dove',
    price: 6300,
    categoryId: 'cat_beauty',
    tags: ['body-wash', 'bundle'],
    photos: ['dove-body-wash-3-pack.png'],
    replaceIds: [],
    match: (p) =>
      /dove/i.test(`${p.name} ${p.brand}`) &&
      (/3[- ]?pack|3 in 1|bundle/i.test(p.name || '') || /2 deep moisture/i.test(p.name || '')),
    description: `Three Dove washes. One easy restock.

This 3-pack is two Dove Deep Moisture Body Washes plus one Dove Sensitive Skin Body Wash — the same bottles you can buy on their own, bundled for the household, the bathroom shelf, or a guest bath.

Deep Moisture leaves skin 24-hour lotion-soft. Sensitive Skin is hypoallergenic, with 24hr Renewing MicroMoisture. Mix them through the week, or keep one in each shower.

What's in the pack:
- 2 × Dove Deep Moisture Body Wash
- 1 × Dove Sensitive Skin Body Wash (680 ml)

Better value than buying three singles.`,
    extraSpecs: [
      { name: 'Product', value: 'Dove Body Wash 3-Pack' },
      { name: 'Type', value: 'Body wash bundle' },
      { name: 'Pack size', value: '3 bottles' },
      { name: 'Includes', value: '2 Deep Moisture + 1 Sensitive Skin' },
      { name: 'Sensitive Skin size', value: '680 ml (23 US fl oz)' },
      { name: 'Benefit', value: '24hr Renewing MicroMoisture' },
    ],
  },
  {
    key: 'lubriderm',
    name: 'Lubriderm Daily Moisture Lotion 177ml',
    brand: 'Lubriderm',
    price: 2760,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'lotion'],
    photos: ['lubriderm-daily-moisture-lotion.png'],
    replaceIds: ['prd_woo_A4piuhd7fT'],
    match: (p) => /lubriderm/i.test(`${p.name} ${p.brand}`),
    description: `Daily moisture that disappears into the skin — not onto your clothes.

Lubriderm Daily Moisture Lotion is dermatologist developed for all skin types. Fragrance free, with a clean, non-greasy feel. Pro-ceramide, shea butter, and glycerin help restore the moisture barrier, with 24-hour clinically proven hydration for healthier-looking skin.

How to use:
- Smooth over body after bathing, or whenever skin feels tight.
- Reapply as needed.

6 fl oz (177 ml).`,
    extraSpecs: [
      { name: 'Product', value: 'Daily Moisture Lotion' },
      { name: 'Type', value: 'Body lotion' },
      { name: 'Size', value: '6 fl oz (177 ml)' },
      { name: 'Skin type', value: 'All skin types' },
      { name: 'Key ingredients', value: 'Pro-ceramide, shea butter, glycerin' },
      { name: 'Benefit', value: '24-hour clinically proven hydration' },
      { name: 'Finish', value: 'Clean, non-greasy' },
      { name: 'Fragrance', value: 'Fragrance free' },
    ],
  },
  {
    key: 'pam',
    name: 'PAM Original Cooking Spray',
    brand: 'PAM',
    price: 1672,
    categoryId: 'cat_food',
    tags: ['cooking', 'kitchen'],
    photos: ['pam-original-cooking-spray.png'],
    replaceIds: ['prd_woo_yEjD6NwSnH'],
    match: (p) =>
      /\bpam\b/i.test(`${p.name} ${p.brand}`) &&
      /original/i.test(p.name || '') &&
      !/2[- ]?pack|two pack|2pk/i.test(p.name || ''),
    description: `A quick spray. A clean release. Breakfast, baking, or a weeknight pan.

PAM Original is a no-stick cooking spray with a canola oil blend. Easy cleanup, and no artificial preservatives, flavours, or colours. Coat the pan, the baking sheet, or the muffin tin before the heat goes on.

How to use:
- Point the nozzle away from you. Hold the can 6–8 inches from the unheated surface.
- Spray a light, even coat. Cook as usual.
- Do not spray near an open flame or heated surface.

Original canola oil blend. Easy cleanup.`,
    extraSpecs: [
      { name: 'Product', value: 'Original Cooking Spray' },
      { name: 'Type', value: 'No-stick cooking spray' },
      { name: 'Oil', value: 'Canola oil blend' },
      { name: 'Pack size', value: '1 can' },
      { name: 'Free from', value: 'No artificial preservatives, flavours, or colours' },
    ],
  },
  {
    key: 'pam-2pack',
    name: 'PAM Original Cooking Spray 2-Pack',
    brand: 'PAM',
    price: 3344,
    categoryId: 'cat_food',
    tags: ['cooking', 'kitchen', 'bundle'],
    photos: ['pam-original-cooking-spray-2-pack.png'],
    replaceIds: [],
    match: (p) =>
      /\bpam\b/i.test(`${p.name} ${p.brand}`) && /2[- ]?pack|two pack|2pk/i.test(p.name || ''),
    description: `Two cans of PAM Original — enough for the busy kitchen without another shop run.

Each can is Original canola oil blend no-stick cooking spray: easy cleanup, no artificial preservatives, flavours, or colours. Spray the pan, the tray, or the waffle iron, then cook.

What's in the pack:
- 2 × 12 oz (340 g) PAM Original cans
- Net weight 24 oz (680 g)

How to use:
- Hold 6–8 inches from an unheated surface and spray a light coat.
- Do not spray near an open flame or heated surface.`,
    extraSpecs: [
      { name: 'Product', value: 'Original Cooking Spray 2-Pack' },
      { name: 'Type', value: 'No-stick cooking spray' },
      { name: 'Oil', value: 'Canola oil blend' },
      { name: 'Pack size', value: '2 × 12 oz (340 g) cans' },
      { name: 'Net weight', value: '24 oz (680 g)' },
      { name: 'Free from', value: 'No artificial preservatives, flavours, or colours' },
    ],
  },
];

function photoPath(file) {
  return path.join(PHOTO_DIR, file);
}

async function savePhotos(files) {
  const dir = path.join(uploadsRoot, 'products');
  fs.mkdirSync(dir, { recursive: true });
  const urls = [];
  for (const file of files) {
    const source = photoPath(file);
    if (!fs.existsSync(source)) throw new Error(`Missing source photo: ${source}`);
    const webp = await compressProductImage(fs.readFileSync(source));
    if (webp.length > 150 * 1024) {
      throw new Error(`${file} compressed to ${webp.length} bytes — over 150KB`);
    }
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
  const catLabel = listing.categoryId === 'cat_food' ? 'Food & Drinks' : 'Beauty & Health';
  return [
    { name: 'Brand', value: listing.brand },
    ...listing.extraSpecs,
    { name: 'Category', value: catLabel },
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
    addBrand(db, 'cat_beauty', 'CeraVe');
    addBrand(db, 'cat_beauty', 'Dove');
    addBrand(db, 'cat_beauty', 'Lubriderm');
    addBrand(db, 'cat_food', 'PAM');

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
        if (p.hidden && p.status !== 'approved') continue;
        p.hidden = true;
        hidden.push({ id: p.id, name: p.name, sku: p.sku });
      }
    }

    return { rows, hidden };
  },
  { actor: 'system', action: 'product.replace', detail: 'CeraVe Dove Lubriderm PAM' }
);

for (const row of result.rows) {
  const p = row.product;
  console.log(`${row.created ? 'CREATED' : 'UPDATED'} ${p.name} · KSh ${p.price} · ${p.sku} · ${p.slug}`);
}
console.log(`Hidden duplicates: ${result.hidden.length}`);
for (const h of result.hidden) console.log(`  HID ${h.sku} ${h.name}`);
