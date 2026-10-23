import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import test from 'node:test';
import { fileURLToPath } from 'url';
import {
  categoryTileFallback,
  nextCategoryImageOnError,
  resolveCategoryImage,
} from '../../client/src/lib/categoryImage.js';

const tilesDir = path.resolve(fileURLToPath(import.meta.url), '../../../client/public/categories');

const slugs = [
  'phone-tablet',
  'food-drinks',
  'computers-laptop',
  'beauty-health',
  'home-office',
  'groceries',
  'appliances',
  'tvs-electronics',
  'household',
  'gaming',
  'jewelry-watches',
  'books-stationery',
  'toys-games',
  'sports-outdoors',
  'fashion',
  'baby-kids',
  'automobile',
  'pet-care',
  'garden-diy',
  'musical-instruments',
  'power-solar',
  'furniture',
  'wine-spirits',
  'pharmacy',
];

test('every shop category has a local tile photo that is not a product upload', () => {
  for (const slug of slugs) {
    const file = path.join(tilesDir, `${slug}.webp`);
    assert.equal(fs.existsSync(file), true, `${slug} tile is missing`);
    assert.ok(fs.statSync(file).size > 2000, `${slug} tile is empty`);
  }
});

test('empty categories still get a tile photo', () => {
  assert.equal(resolveCategoryImage({ slug: 'pharmacy' }), '/categories/pharmacy.webp');
  assert.equal(
    resolveCategoryImage({ slug: 'pharmacy', image: '/uploads/products/gone.webp' }),
    '/uploads/products/gone.webp'
  );
});

test('a deleted product photo falls back to the built-in category tile', () => {
  assert.equal(
    nextCategoryImageOnError('/uploads/products/gone.webp', { slug: 'phone-tablet' }),
    '/categories/phone-tablet.webp'
  );
  assert.equal(nextCategoryImageOnError('/categories/phone-tablet.webp', { slug: 'phone-tablet' }), null);
});

test('tile fallbacks ignore junk slugs', () => {
  assert.equal(categoryTileFallback('../secret'), '/categories/secret.webp');
  assert.equal(categoryTileFallback(''), '');
});
