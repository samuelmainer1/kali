/**
 * Unfeature every product, hide today's manual listings, and drop today's hero banners.
 *
 *   node server/scripts/removeFeaturedAndTodayUploads.js
 * Then: touch server/src/index.js
 */
import { updateDb } from '../src/db.js';

const result = updateDb(
  (db) => {
    let unfeatured = 0;
    let hidden = 0;
    for (const p of db.products || []) {
      if (p.featured) {
        p.featured = false;
        unfeatured += 1;
      }
      if (p.source === 'manual' && !p.hidden) {
        p.hidden = true;
        hidden += 1;
      }
    }

    db.site = db.site || {};
    db.site.homeBlocks = { ...(db.site.homeBlocks || {}), featured: false };

    const before = (db.site.heroes || []).length;
    db.site.heroes = (db.site.heroes || []).filter(
      (h) => h.id !== 'hero_flash_sale' && h.id !== 'hero_brand'
    );
    const heroesRemoved = before - db.site.heroes.length;

    return { unfeatured, hidden, heroesRemoved, heroesLeft: db.site.heroes.length };
  },
  { actor: 'system', action: 'catalogue.cleanup', detail: 'Unfeature all; hide today uploads; remove hero banners' }
);

console.log(result);
