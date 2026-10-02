/**
 * List Lee Stafford Hair Apology Intensive Care Conditioner on BigDrop Kenya.
 *
 *   node server/scripts/addHairApology.js
 * Then: touch server/src/index.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import { updateDb } from '../src/db.js';
import { compressProductImage, uploadsRoot } from '../src/uploads.js';
import { generateProductSku, skuTakenSet } from '../src/commerce.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE = path.join(__dirname, '../data/product-photos/lee-stafford-hair-apology-conditioner.png');
const VENDOR_ID = 'usr_vendor7';
const NAME = 'Lee Stafford Hair Apology Intensive Care Conditioner 250ml';

const DESCRIPTION = `Like a kiss of life for critically processed, damaged hair.

Lee Stafford Hair Apology Intensive Care Conditioner is a rich, pink-tube rescue for hair that has been coloured, relaxed, bleached, or heat-styled into trouble. New parfum. Vegan friendly and cruelty free. 250 ml / 8.4 fl oz.

How to use:
- After shampooing, squeeze through mid-lengths and ends.
- Leave on for 2–3 minutes. Rinse.
- Use whenever hair needs an apology.

Intensive care. Lee Stafford.`;

function specs(sku) {
  return [
    { name: 'Brand', value: 'Lee Stafford' },
    { name: 'Product', value: 'Hair Apology Intensive Care Conditioner' },
    { name: 'Type', value: 'Conditioner' },
    { name: 'Size', value: '250 ml (8.4 fl oz)' },
    { name: 'Hair type', value: 'Critically processed, damaged hair' },
    { name: 'Benefit', value: 'Intensive care for damaged hair' },
    { name: 'Ethics', value: 'Vegan friendly, cruelty free' },
    { name: 'Category', value: 'Beauty & Health' },
    { name: 'SKU', value: sku },
    { name: 'Condition', value: 'New' },
    { name: 'Sold by', value: 'BigDrop Kenya' },
  ];
}

if (!fs.existsSync(SOURCE)) throw new Error(`Missing source photo: ${SOURCE}`);
const webp = await compressProductImage(fs.readFileSync(SOURCE));
if (webp.length > 150 * 1024) throw new Error(`Compressed photo is ${webp.length} bytes — over 150KB`);
const dir = path.join(uploadsRoot, 'products');
fs.mkdirSync(dir, { recursive: true });
const file = `${Date.now()}-${nanoid(8)}.webp`;
fs.writeFileSync(path.join(dir, file), webp);
const photo = `/uploads/products/${file}`;
console.log(`Photo ${photo} (${webp.length} bytes)`);

const match = (p) => /hair apology/i.test(`${p.name} ${p.brand}`) || (/lee stafford/i.test(`${p.name} ${p.brand}`) && /conditioner/i.test(p.name || ''));

const product = updateDb(
  (db) => {
    const beauty = (db.categories || []).find((c) => c.id === 'cat_beauty');
    if (beauty) {
      const brands = Array.isArray(beauty.brands) ? beauty.brands : [];
      if (!brands.some((b) => String(b).toLowerCase() === 'lee stafford')) {
        beauty.brands = [...brands, 'Lee Stafford'];
      }
    }

    const keep = [];
    const existing = (db.products || []).find((p) => match(p) && !p.hidden);
    if (existing) {
      existing.vendorId = VENDOR_ID;
      existing.categoryId = 'cat_beauty';
      existing.name = NAME;
      existing.slug =
        'lee-stafford-hair-apology-intensive-care-conditioner-250ml-' + nanoid(4);
      existing.description = DESCRIPTION;
      existing.specifications = specs(existing.sku);
      existing.brand = 'Lee Stafford';
      existing.price = 2247;
      existing.compareAt = null;
      existing.images = [photo];
      existing.tags = ['hair', 'conditioner'];
      existing.hidden = false;
      existing.status = 'approved';
      existing.source = 'manual';
      existing.stock = Number(existing.stock || 0) > 0 ? existing.stock : 10;
      keep.push(existing.id);
      for (const p of db.products) {
        if (keep.includes(p.id)) continue;
        if (match(p)) p.hidden = true;
      }
      return existing;
    }

    const sku = generateProductSku(skuTakenSet(db.products));
    const created = {
      id: 'prd_' + nanoid(10),
      vendorId: VENDOR_ID,
      categoryId: 'cat_beauty',
      name: NAME,
      slug: 'lee-stafford-hair-apology-intensive-care-conditioner-250ml-' + nanoid(4),
      description: DESCRIPTION,
      specifications: specs(sku),
      variants: [],
      brand: 'Lee Stafford',
      price: 2247,
      compareAt: null,
      stock: 10,
      sku,
      images: [photo],
      featured: false,
      rating: 0,
      reviews: 0,
      reviewList: [],
      soldCount: 0,
      tags: ['hair', 'conditioner'],
      hidden: false,
      status: 'approved',
      source: 'manual',
      createdAt: new Date().toISOString(),
    };
    db.products.push(created);
    return created;
  },
  { actor: 'system', action: 'product.add', detail: NAME }
);

console.log(`Listed ${product.name} · KSh ${product.price} · ${product.sku} · ${product.slug}`);
