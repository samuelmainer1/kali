/**
 * Place today's photo listings on Homepage Featured (15) and BigDrop's Choice (the rest).
 *
 *   node server/scripts/featureTodayUploads.js
 * Then: touch server/src/index.js
 */
import { updateDb } from '../src/db.js';

/** 15 Featured products — remaining source=manual rows go to BigDrop's Choice. */
const FEATURED_SKUS = [
  'BD-30SVYKF5', // Acure night cream
  'BD-DPEUQJVV', // CeraVe Daily
  'BD-UPJBQZCD', // Dove Deep Moisture
  'BD-M0BVAPXY', // Dove Sensitive
  'BD-MH2VNOUZ', // Dove 3-pack
  'BD-K9ODY4D1', // Lubriderm
  'BD-5Y7GBSKU', // No7 Future Renew
  'BD-7YAQ5VUY', // INKEY Fulvic Acid
  'BD-GZFWBXXM', // COSRX snail mask
  'BD-WQTD4RF7', // OGX shampoo
  'BD-FG6MVBNV', // Skin Aqua
  'BD-MWDDPM24', // Too Faced
  'BD-T1C9GPQP', // Hair Apology
  'BD-RXMP1BTU', // L'Oreal Red Cream
  'BD-71S1LEBY', // Age Perfect Day
];

const featuredSet = new Set(FEATURED_SKUS);

const result = updateDb(
  (db) => {
    let featuredOn = 0;
    let choiceOn = 0;
    let unhidden = 0;
    for (const p of db.products || []) {
      const todayUpload = p.source === 'manual';
      if (todayUpload && p.hidden) {
        p.hidden = false;
        unhidden += 1;
      }
      if (todayUpload && featuredSet.has(p.sku)) {
        p.featured = true;
        featuredOn += 1;
      } else {
        if (p.featured) p.featured = false;
        if (todayUpload) choiceOn += 1;
      }
    }

    db.site = db.site || {};
    db.site.homeBlocks = {
      ...(db.site.homeBlocks || {}),
      featured: true,
      choice: true,
      healthBeauty: true,
    };

    return {
      unhidden,
      featured: featuredOn,
      choice: choiceOn,
      featuredTotal: (db.products || []).filter((p) => p.featured).length,
    };
  },
  {
    actor: 'system',
    action: 'catalogue.featureToday',
    detail: 'Feature 15 today uploads; remaining 8 on BigDrop Choice',
  }
);

console.log(result);
