/**
 * Reset expired flash countdown and keep Card off until launch.
 *
 *   node server/scripts/fixGoLiveLeftovers.js
 *   touch server/src/index.js
 */
import { updateDb } from '../src/db.js';

const result = updateDb((db) => {
  db.site = db.site || {};
  db.site.flashEndsAt = new Date(Date.now() + 8 * 3600 * 1000).toISOString();
  db.site.payments = { ...(db.site.payments || {}), mpesa: true, card: false, cod: false };
  return { flashEndsAt: db.site.flashEndsAt, payments: db.site.payments };
}, { actor: 'system', action: 'site.goliveLeftovers', detail: 'Reset flash timer; Card off' });

console.log(result);
