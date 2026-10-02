/**
 * Prepend the two designed BigDrop hero banners to the homepage carousel.
 *
 *   node server/scripts/addHeroBanners.js
 * Then: touch server/src/index.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateDb } from '../src/db.js';
import { uploadsRoot } from '../src/uploads.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(__dirname, '../data/hero-banners');

const BANNERS = [
  {
    id: 'hero_flash_sale',
    file: 'flash-sale.png',
    title: 'Flash Sale',
    text: 'Special offer — up to 50% off',
    href: '/deals',
    cta: 'Shop deals',
  },
  {
    id: 'hero_brand',
    file: 'bigdrop-kenya.png',
    title: 'BigDrop Kenya',
    text: "Kenya's premier e-commerce platform for online shopping",
    href: '/shop',
    cta: 'Shop now',
  },
];

function copyBanner(file) {
  const from = path.join(SRC, file);
  if (!fs.existsSync(from)) throw new Error(`Missing banner: ${from}`);
  const dir = path.join(uploadsRoot, 'heroes');
  fs.mkdirSync(dir, { recursive: true });
  const destName = file.replace(/\.png$/i, '.png');
  const dest = path.join(dir, destName);
  fs.copyFileSync(from, dest);
  return `/uploads/heroes/${destName}`;
}

const urls = Object.fromEntries(BANNERS.map((b) => [b.id, copyBanner(b.file)]));

const heroes = updateDb((db) => {
  db.site = db.site || {};
  const current = Array.isArray(db.site.heroes) ? db.site.heroes : [];
  const without = current.filter((h) => !BANNERS.some((b) => b.id === h.id));
  const next = BANNERS.map((b) => ({
    id: b.id,
    title: b.title,
    text: b.text,
    href: b.href,
    cta: b.cta,
    gradient: '',
    image: urls[b.id],
    fullBleed: true,
  }));
  db.site.heroes = [...next, ...without];
  return db.site.heroes;
}, { actor: 'system', action: 'site.heroes', detail: 'Add Flash Sale and BigDrop Kenya banners' });

for (const h of heroes) {
  console.log(`${h.id} · ${h.title} · ${h.image} · fullBleed=${h.fullBleed === true}`);
}
