/**
 * List Acure Radically Rejuvenating Whipped Night Cream on BigDrop Kenya.
 *
 * Run from the repo root:
 *   node server/scripts/addAcureNightCream.js
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
const SOURCE = path.join(
  __dirname,
  '../data/product-photos/acure-radically-rejuvenating-whipped-night-cream.png'
);
const VENDOR_ID = 'usr_vendor7';
const PRODUCT_NAME = 'Acure Radically Rejuvenating Whipped Night Cream 50ml';

const DESCRIPTION = `Wake up to skin that looks rested, plump, and quietly confident.

Acure Radically Rejuvenating Whipped Night Cream is a 50 ml overnight treatment with a light, whipped texture that melts in while you sleep. Multi-peptides and ferulic acid nourish the skin and support its age-performance, so morning skin feels softer, smoother, and more revived — never greasy or overworked.

This is clean, unfussy skincare. The formula is 100% vegan and 0% pretentious: sulfate free, mineral oil free, petroleum free, formaldehyde free, and cruelty free. The aluminium tube is recyclable.

How to use:
- After cleansing at night, warm a pearl-sized amount between your fingertips.
- Smooth over face and neck, pressing in until absorbed.
- Use nightly. Follow with SPF in the morning.

Night Cream / Crème de Nuit. 1.7 fl oz (50 ml).`;

function specs(sku) {
  return [
    { name: 'Brand', value: 'Acure' },
    { name: 'Product', value: 'Radically Rejuvenating Whipped Night Cream' },
    { name: 'Type', value: 'Night cream / Crème de nuit' },
    { name: 'Size', value: '50 ml (1.7 fl oz)' },
    { name: 'Key ingredients', value: 'Multi-peptides, ferulic acid' },
    { name: 'Skin benefit', value: 'Overnight nourishment and age performance' },
    { name: 'Texture', value: 'Whipped cream' },
    { name: 'When to use', value: 'Night' },
    { name: 'Ethics', value: '100% vegan, cruelty free' },
    { name: 'Free from', value: 'Sulfates, mineral oil, petroleum, formaldehyde' },
    { name: 'Packaging', value: 'Recyclable aluminium tube' },
    { name: 'Category', value: 'Beauty & Health' },
    { name: 'SKU', value: sku },
    { name: 'Condition', value: 'New' },
    { name: 'Sold by', value: 'BigDrop Kenya' },
  ];
}

async function savePhoto() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing source photo: ${SOURCE}`);
  }
  const webp = await compressProductImage(fs.readFileSync(SOURCE));
  const dir = path.join(uploadsRoot, 'products');
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${nanoid(8)}.webp`;
  fs.writeFileSync(path.join(dir, name), webp);
  if (webp.length > 150 * 1024) {
    throw new Error(`Compressed photo is ${webp.length} bytes — over 150KB`);
  }
  return { url: `/uploads/products/${name}`, bytes: webp.length };
}

const photo = await savePhoto();

const product = updateDb(
  (db) => {
    const beauty = (db.categories || []).find((c) => c.id === 'cat_beauty');
    if (beauty) {
      const brands = Array.isArray(beauty.brands) ? beauty.brands : [];
      if (!brands.some((b) => String(b).toLowerCase() === 'acure')) {
        beauty.brands = [...brands, 'Acure'];
      }
    }

    const existing = (db.products || []).find(
      (p) => p.vendorId === VENDOR_ID && String(p.name || '').toLowerCase() === PRODUCT_NAME.toLowerCase()
    );
    if (existing) {
      existing.price = 3784;
      existing.compareAt = null;
      existing.description = DESCRIPTION;
      existing.brand = 'Acure';
      existing.categoryId = 'cat_beauty';
      existing.images = [photo.url];
      existing.hidden = false;
      existing.status = 'approved';
      existing.specifications = specs(existing.sku);
      existing.stock = Number(existing.stock || 0) > 0 ? existing.stock : 10;
      return existing;
    }

    const sku = generateProductSku(skuTakenSet(db.products));
    const created = {
      id: 'prd_' + nanoid(10),
      vendorId: VENDOR_ID,
      categoryId: 'cat_beauty',
      name: PRODUCT_NAME,
      slug:
        PRODUCT_NAME.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') +
        '-' +
        nanoid(4),
      description: DESCRIPTION,
      specifications: specs(sku),
      variants: [],
      brand: 'Acure',
      price: 3784,
      compareAt: null,
      stock: 10,
      sku,
      images: [photo.url],
      featured: false,
      rating: 0,
      reviews: 0,
      reviewList: [],
      soldCount: 0,
      tags: ['skincare', 'night-cream'],
      hidden: false,
      status: 'approved',
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    db.products.push(created);
    return created;
  },
  { actor: 'system', action: 'product.add', detail: PRODUCT_NAME }
);

console.log(`Listed ${product.name}`);
console.log(`SKU ${product.sku} · slug ${product.slug} · ${photo.bytes} bytes WebP`);
console.log(`Photo ${photo.url}`);
console.log(`Price KSh ${product.price} · vendor ${product.vendorId}`);
