/**
 * Restore today's listings and make them the Featured row.
 *
 * Unhides source=manual products, features only those, unfeatures the rest,
 * and turns the homepage Featured block back on.
 *
 *   node server/scripts/featureTodayUploads.js
 * Then: node server/scripts/addHeroBanners.js && touch server/src/index.js
 */
import { updateDb } from '../src/db.js';

const result = updateDb(
  (db) => {
    let featuredOn = 0;
    let featuredOff = 0;
    let unhidden = 0;
    for (const p of db.products || []) {
      const todayUpload = p.source === 'manual';
      if (todayUpload && p.hidden) {
        p.hidden = false;
        unhidden += 1;
      }
      if (todayUpload) {
        if (!p.featured) featuredOn += 1;
        p.featured = true;
      } else if (p.featured) {
        p.featured = false;
        featuredOff += 1;
      }
    }

    db.site = db.site || {};
    db.site.homeBlocks = { ...(db.site.homeBlocks || {}), featured: true };

    return {
      unhidden,
      featuredToday: featuredOn,
      unfeaturedPrevious: featuredOff,
      featuredTotal: (db.products || []).filter((p) => p.featured).length,
    };
  },
  {
    actor: 'system',
    action: 'catalogue.featureToday',
    detail: 'Feature today uploads; unfeature previous featured set',
  }
);

console.log(result);
