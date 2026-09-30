/**
 * List No7, The INKEY List, Himalayan salt, Ziploc freezer gallon, OGX,
 * Sazón Goya, COSRX snail masks, Skin Aqua, and Too Faced on BigDrop Kenya.
 *
 * Run from the repo root:
 *   node server/scripts/addNo7InkeyZiplocBatch.js
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

const CAT_LABEL = {
  cat_beauty: 'Beauty & Health',
  cat_food: 'Food & Drinks',
  cat_household: 'Household',
};

const LISTINGS = [
  {
    key: 'no7',
    name: 'No7 Future Renew Damage Reversal Day Cream SPF 25 50ml',
    brand: 'No7',
    price: 2760,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'day-cream', 'spf'],
    photos: ['no7-future-renew-day-cream.png'],
    replaceIds: ['prd_woo_B0BUKskFa7'],
    match: (p) => /no\s*\.?7|n°7/i.test(`${p.name} ${p.brand}`) && /future renew/i.test(p.name || ''),
    description: `Day cream that works while the sun is out.

No7 Future Renew Damage Reversal Day Cream is a broad-spectrum SPF 25 moisturiser that targets and helps prevent visible signs of skin damage. Suitable for sensitive skin. The 50 ml jar is the morning step: nourish, then protect.

SPF 25 sunscreen actives on the pack include avobenzone, octinoxate, octisalate, and octocrylene. Apply before you step outside, and reapply when you are in the sun.

How to use:
- Smooth over face and neck every morning after cleansing.
- Apply generously 15 minutes before sun exposure.
- Reapply at least every 2 hours, and after swimming or sweating.

50 ml / 1.69 fl oz.`,
    extraSpecs: [
      { name: 'Product', value: 'Future Renew Damage Reversal Day Cream' },
      { name: 'Type', value: 'Day cream with SPF' },
      { name: 'Size', value: '50 ml (1.69 fl oz)' },
      { name: 'SPF', value: 'Broad spectrum SPF 25' },
      { name: 'Skin type', value: 'Suitable for sensitive skin' },
      { name: 'Benefit', value: 'Targets and helps prevent visible signs of skin damage' },
      { name: 'When to use', value: 'Morning' },
    ],
  },
  {
    key: 'inkey',
    name: 'The INKEY List Fulvic Acid Brightening Cleanser 150ml',
    brand: 'The INKEY List',
    price: 2888,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'cleanser'],
    photos: ['the-inkey-list-fulvic-acid-brightening-cleanser.png'],
    replaceIds: [],
    match: (p) => /inkey/i.test(`${p.name} ${p.brand}`) && /fulvic/i.test(p.name || ''),
    description: `A cleanse that actually earns the word brightening.

The INKEY List Fulvic Acid Brightening Cleanser is formulated for all skin types, and best for dull skin. Fulvic acid helps brighten and gently lift makeup, without stripping. It sits on the CLEAN step of the INKEY routine — morning or night.

The gel-cream texture rinses clean. Hair stays out of it; skin does not feel tight.

How to use:
- Massage onto damp skin, morning and/or evening.
- Rinse. Follow with treat and moisturise.
- Use as the first step to take off light makeup; double-cleanse after heavier makeup.

5.0 US fl oz / 150 ml.`,
    extraSpecs: [
      { name: 'Product', value: 'Fulvic Acid Brightening Cleanser' },
      { name: 'Type', value: 'Facial cleanser' },
      { name: 'Size', value: '150 ml (5.0 US fl oz)' },
      { name: 'Skin type', value: 'All, especially dull skin' },
      { name: 'Key ingredient', value: 'Fulvic acid' },
      { name: 'Benefit', value: 'Brightens skin and gently removes makeup' },
      { name: 'Routine step', value: 'Cleanse' },
      { name: 'When to use', value: 'Morning and night' },
    ],
  },
  {
    key: 'himalayan',
    name: 'The Spice Lab Pink Himalayan Salt Grinder + Refill 850g',
    brand: 'The Spice Lab',
    price: 2632,
    categoryId: 'cat_food',
    tags: ['seasoning', 'salt'],
    photos: ['spice-lab-pink-himalayan-salt.png'],
    replaceIds: ['prd_woo_jXUHpvStmc'],
    match: (p) => /himalayan/i.test(p.name || '') && /salt/i.test(p.name || ''),
    description: `Pink salt, ready for the table — mill plus a refill in one pack.

The Spice Lab Pink Himalayan Salt comes with a premium ceramic grinder and a refill. All natural. Kosher. Coarse crystals for finishing steaks, roasted vegetables, and the rim of a glass.

This salt does not contain iodide. Net weight 30 oz (850 g) across the set.

How to use:
- Twist the ceramic mill over food at the table or in the pan.
- Refill from the second jar when the mill runs low.
- Store sealed, away from steam.`,
    extraSpecs: [
      { name: 'Product', value: 'Pink Himalayan Salt — ceramic grinder + refill' },
      { name: 'Type', value: 'Finishing salt' },
      { name: 'Net weight', value: '30 oz (850 g)' },
      { name: 'Includes', value: 'Premium ceramic grinder and refill' },
      { name: 'Diet', value: 'All natural, kosher' },
      { name: 'Note', value: 'Does not contain iodide' },
    ],
  },
  {
    key: 'ziploc',
    name: 'Ziploc Freezer Gallon Bags 34 Count',
    brand: 'Ziploc',
    price: 2120,
    categoryId: 'cat_household',
    tags: ['storage', 'freezer'],
    photos: ['ziploc-freezer-gallon-34.png'],
    replaceIds: ['prd_woo_sVWdskZUTI'],
    match: (p) => /ziploc/i.test(`${p.name} ${p.brand}`) && /freezer/i.test(p.name || '') && /gallon/i.test(p.name || ''),
    description: `Gallon bags that stay open while you fill them — then seal for the freezer.

Ziploc Freezer Gallon Bags, 34 count. StayOpen design for easy filling. Grip ’n Seal technology to close with a press. Built for freezer burn protection on meat, soup, and leftovers.

Bag size 10 9/16 in W × 10 3/4 in H (26.8 cm × 27.3 cm).

How to use:
- Pull the top open — it stays that way while you spoon or pour.
- Press the seal closed. Lay flat in the freezer.
- Label the write-on panel if you like.`,
    extraSpecs: [
      { name: 'Product', value: 'Freezer Gallon Seal Top Bags' },
      { name: 'Type', value: 'Freezer bags' },
      { name: 'Count', value: '34 bags' },
      { name: 'Size', value: 'Gallon — 10 9/16 × 10 3/4 in (26.8 × 27.3 cm)' },
      { name: 'Features', value: 'StayOpen filling, Grip ’n Seal' },
    ],
  },
  {
    key: 'ogx',
    name: 'OGX Apple Cider Vinegar Shampoo 385ml',
    brand: 'OGX',
    price: 3144,
    categoryId: 'cat_beauty',
    tags: ['hair', 'shampoo'],
    photos: ['ogx-apple-cider-vinegar-shampoo.png'],
    replaceIds: [],
    match: (p) => /ogx/i.test(`${p.name} ${p.brand}`) && /apple cider/i.test(p.name || ''),
    description: `A clarifying wash inspired by the apple cider vinegar rinse — without the kitchen sink.

OGX Clarify & Shine Apple Cider Vinegar Shampoo is a sulfate-free surfactant blend that helps gently cleanse, balance, and boost shine. Hair feels freshly clean, not stripped. The gold bottle is 385 ml / 13 US fl oz.

How to use:
- Massage into wet hair. Rinse.
- Follow with conditioner if you like extra softness.
- Use when hair needs a reset from product build-up.

Sulfate-free surfactants. Salon-quality bottle.`,
    extraSpecs: [
      { name: 'Product', value: 'Apple Cider Vinegar Shampoo' },
      { name: 'Type', value: 'Clarifying shampoo' },
      { name: 'Size', value: '385 ml (13 US fl oz)' },
      { name: 'Key ingredient', value: 'Apple cider vinegar' },
      { name: 'Benefit', value: 'Gently cleanses, balances, and boosts shine' },
      { name: 'Formula', value: 'Sulfate-free surfactants' },
    ],
  },
  {
    key: 'sazon',
    name: 'Sazón Goya con Culantro y Achiote 36 Packets',
    brand: 'Goya',
    price: 1480,
    categoryId: 'cat_food',
    tags: ['seasoning', 'spice'],
    photos: ['sazon-goya-culantro-achiote.png'],
    replaceIds: ['prd_woo_WKldRBSBbH'],
    match: (p) => /saz[oó]n/i.test(p.name || '') && /goya/i.test(`${p.name} ${p.brand}`),
    description: `The orange box that makes rice smell like home.

Sazón Goya con Culantro y Achiote (with coriander and annatto) is El Original — 36 packets in a jumbo super-saver box. One sachet colours and seasons rice, stews, soups, sauces, and beans. Especial para arroces, salsas, guisos, sopas.

Net weight 6.33 oz (180 g).

How to use:
- Tear one packet into the pot with the rice, stew, or sauce.
- Stir through as it cooks.
- Use more for a bigger pot.`,
    extraSpecs: [
      { name: 'Product', value: 'Sazón con Culantro y Achiote' },
      { name: 'Type', value: 'Seasoning packets' },
      { name: 'Count', value: '36 packets' },
      { name: 'Net weight', value: '6.33 oz (180 g)' },
      { name: 'Flavour', value: 'Coriander and annatto (culantro y achiote)' },
      { name: 'Use', value: 'Rice, sauces, stews, soups' },
    ],
  },
  {
    key: 'cosrx',
    name: 'COSRX Advanced Snail Mucin Power Sheet Mask 10 Sheets',
    brand: 'COSRX',
    price: 550,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'sheet-mask'],
    photos: ['cosrx-advanced-snail-mucin-sheet-mask.png'],
    replaceIds: ['prd_woo_LBuy_54M-v'],
    match: (p) => /snail mucin/i.test(p.name || '') && /sheet mask/i.test(p.name || ''),
    description: `Ten sheet masks, each soaked in snail mucin filtrate.

COSRX Advanced Snail Mucin Power Sheet Mask is formulated with 35,000 ppm of snail mucin filtrate — the same ingredient COSRX is known for — to help support skin elasticity. One box, ten masks. Each sheet holds 25 ml / 0.84 fl oz of essence.

A quiet evening step when skin feels tight or tired.

How to use:
- After cleansing, unfold a mask and smooth onto the face.
- Leave on 10–20 minutes. Remove. Pat leftover essence in.
- Use two to three times a week, or whenever skin needs a drink.

10 sheets per box.`,
    extraSpecs: [
      { name: 'Product', value: 'Advanced Snail Mucin Power Sheet Mask' },
      { name: 'Type', value: 'Sheet mask' },
      { name: 'Count', value: '10 sheets' },
      { name: 'Essence', value: '25 ml / 0.84 fl oz per sheet' },
      { name: 'Key ingredient', value: 'Snail mucin filtrate 35,000 ppm' },
      { name: 'Benefit', value: 'Helps support skin elasticity' },
    ],
  },
  {
    key: 'skinaqua',
    name: 'Rohto Skin Aqua Super Moisture Gel SPF50+ PA++++ 110g',
    brand: 'Rohto Skin Aqua',
    price: 2632,
    categoryId: 'cat_beauty',
    tags: ['skincare', 'sunscreen', 'spf'],
    photos: ['rohto-skin-aqua-spf50.png'],
    replaceIds: [],
    match: (p) => /skin aqua|rohto/i.test(`${p.name} ${p.brand}`) && /spf/i.test(p.name || ''),
    description: `A watery UV gel that sits light on Kenyan skin.

Rohto Skin Aqua Super Moisture Gel is SPF50+ PA++++ with a water-film veil — 110 g in a travel-friendly pouch. Made for face and body. Super waterproof. Hyaluronic acid helps keep skin comfortable under the sun.

The gel spreads easily, so a little covers more than a thick cream.

How to use:
- Shake, then smooth evenly over face and exposed skin as the last morning step.
- Reapply after swimming, sweating, or towel-drying.
- Reapply at least every 2 hours in strong sun.

110 g. SPF50+ PA++++.`,
    extraSpecs: [
      { name: 'Product', value: 'Super Moisture Gel UV' },
      { name: 'Type', value: 'Sunscreen gel' },
      { name: 'Size', value: '110 g' },
      { name: 'SPF', value: 'SPF50+ PA++++' },
      { name: 'Use', value: 'Face and body' },
      { name: 'Finish', value: 'Water-film veil, super waterproof' },
      { name: 'Key extra', value: 'Hyaluronic acid' },
    ],
  },
  {
    key: 'toofaced',
    name: 'Too Faced Maple Syrup Pancakes Eyeshadow Palette',
    brand: 'Too Faced',
    price: 3016,
    categoryId: 'cat_beauty',
    tags: ['makeup', 'eyeshadow'],
    photos: ['too-faced-maple-syrup-pancakes.png'],
    replaceIds: [],
    match: (p) => /too faced/i.test(`${p.name} ${p.brand}`) && /maple|pancake/i.test(p.name || ''),
    description: `Breakfast for your eyelids.

Too Faced Maple Syrup Pancakes is a collectible eyeshadow palette in the pancake-box tin: warm maple, butter, and golden-brown shades for everyday lids or a full brunch look. Too Faced quality, packed to look like a diner box of pancakes.

Tap a matte in the crease, a shimmer on the lid, a deeper brown to smoke the outer corner.

How to use:
- Prime the lid if you like extra wear.
- Build from light to deep. Blend the edges.
- Finish with mascara.

Palette. Too Faced.`,
    extraSpecs: [
      { name: 'Product', value: 'Maple Syrup Pancakes Eyeshadow Palette' },
      { name: 'Type', value: 'Eyeshadow palette' },
      { name: 'Finish', value: 'Warm mattes and shimmers' },
      { name: 'Look', value: 'Maple, butter, golden brown' },
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
  return [
    { name: 'Brand', value: listing.brand },
    ...listing.extraSpecs,
    { name: 'Category', value: CAT_LABEL[listing.categoryId] || 'Shop' },
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
    addBrand(db, 'cat_beauty', 'No7');
    addBrand(db, 'cat_beauty', 'The INKEY List');
    addBrand(db, 'cat_beauty', 'OGX');
    addBrand(db, 'cat_beauty', 'COSRX');
    addBrand(db, 'cat_beauty', 'Rohto Skin Aqua');
    addBrand(db, 'cat_beauty', 'Too Faced');
    addBrand(db, 'cat_food', 'The Spice Lab');
    addBrand(db, 'cat_food', 'Goya');
    addBrand(db, 'cat_household', 'Ziploc');

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
  { actor: 'system', action: 'product.replace', detail: 'No7 INKEY Ziploc OGX Goya COSRX SkinAqua TooFaced' }
);

for (const row of result.rows) {
  const p = row.product;
  console.log(`${row.created ? 'CREATED' : 'UPDATED'} ${p.name} · KSh ${p.price} · ${p.sku} · ${p.slug}`);
}
console.log(`Hidden duplicates: ${result.hidden.length}`);
for (const h of result.hidden) console.log(`  HID ${h.sku} ${h.name}`);
