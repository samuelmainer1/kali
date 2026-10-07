/**
 * Save the Google Search Console HTML-tag token onto site config.
 *
 *   node server/scripts/setGscVerification.js
 *   touch server/src/index.js
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateDb } from '../src/db.js';
import { gscVerificationToken } from '../src/seo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKEN = gscVerificationToken('google-site-verification=cr_IIhCzEktaOY0ilDBo1SzLAS2r9xQ7IIMbkLINhrs');

if (!TOKEN) {
  console.error('Invalid GSC token');
  process.exit(1);
}

const live = updateDb(
  (db) => {
    db.site = db.site || {};
    db.site.gscVerification = TOKEN;
    return { gscVerification: db.site.gscVerification };
  },
  { actor: 'system', action: 'site.gscVerification', detail: 'Set Google Search Console verification token' }
);

const seedPath = path.join(__dirname, '../data/seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
seed.site = seed.site || {};
seed.site.gscVerification = TOKEN;
fs.writeFileSync(seedPath, `${JSON.stringify(seed, null, 2)}\n`);

console.log({ live, seed: seed.site.gscVerification });
