/**
 * Save the live GA4 Measurement ID onto site config.
 *
 *   node server/scripts/setGoogleAnalytics.js
 *   touch server/src/index.js
 */
import { updateDb } from '../src/db.js';

const GA_ID = 'G-5GN03XTJM6';

const result = updateDb(
  (db) => {
    db.site = db.site || {};
    db.site.gaId = GA_ID;
    return { gaId: db.site.gaId };
  },
  { actor: 'system', action: 'site.gaId', detail: 'Set GA4 Measurement ID' }
);

console.log(result);
