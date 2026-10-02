// Final safety check: every /uploads/... path referenced ANYWHERE in db.json
// (products, categories, heroes, blog, reviews, orders, invoices, cart) must
// resolve to a real file on disk, and nothing may still be the placeholder.
import fs from 'fs';
import path from 'path';

const root = 'c:/Users/Sam/Downloads/New Bigdrop';
const uploads = path.join(root, 'server', 'uploads');

const db = JSON.parse(fs.readFileSync(path.join(root, 'server', 'data', 'db.json'), 'utf8'));
const found = new Set();
(function walk(n) {
  if (typeof n === 'string') {
    if (n.startsWith('/uploads/')) found.add(n);
    return;
  }
  if (Array.isArray(n)) return n.forEach(walk);
  if (n && typeof n === 'object') for (const v of Object.values(n)) walk(v);
})(db);

const all = [...found];
const missing = all.filter((u) => !fs.existsSync(path.join(uploads, ...u.replace('/uploads/', '').split('/'))));
const placeholders = all.filter((u) => u.includes('placeholder'));

console.log('unique /uploads/ paths in db.json :', all.length);
console.log('missing files on disk             :', missing.length);
console.log('placeholder refs left             :', placeholders.length);
missing.slice(0, 10).forEach((m) => console.log('   MISSING', m));
console.log(missing.length === 0 && placeholders.length === 0 ? '\nRESULT: every image the site can ask for exists. Nothing broken.' : '\nRESULT: problems above.');