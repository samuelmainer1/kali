/**
 * Save Google Search Console HTML-tag token(s) onto site config.
 * Merges with tokens already stored. Pass extra tokens as arguments:
 *
 *   node server/scripts/setGscVerification.js
 *   node server/scripts/setGscVerification.js 'google-site-verification=TOKEN'
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { updateDb } from '../src/db.js';
import { gscVerificationTokens } from '../src/seo.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const KNOWN = [
  'google-site-verification=cr_IIhCzEktaOY0ilDBo1SzLAS2r9xQ7IIMbkLINhrs',
  'google-site-verification=A50yV5JLsKETOGqSAelgDRzQ9MJ5_dxgWqkcgplWfMY',
  ...process.argv.slice(2),
];

const live = updateDb(
  (db) => {
    db.site = db.site || {};
    db.site.gscVerification = gscVerificationTokens([db.site.gscVerification, ...KNOWN]).join(',');
    return { gscVerification: db.site.gscVerification };
  },
  { actor: 'system', action: 'site.gscVerification', detail: 'Set Google Search Console verification token(s)' }
);

const seedPath = path.join(__dirname, '../data/seed.json');
const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
seed.site = seed.site || {};
seed.site.gscVerification = gscVerificationTokens([seed.site.gscVerification, ...KNOWN]).join(',');
fs.writeFileSync(seedPath, `${JSON.stringify(seed, null, 2)}\n`);

console.log({ live, seed: seed.site.gscVerification });
