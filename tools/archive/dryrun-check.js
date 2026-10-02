// Diagnostic: check actual state of slugs, product route, SEO meta in routes.js
const fs = require('fs');

const db = JSON.parse(fs.readFileSync('server/data/db.json', 'utf8'));
const products = db.products || [];

const bad = products.filter(p => p.slug && p.slug.length <= 2);
const empty = products.filter(p => !p.slug || p.slug === '');
const slugCounts = {};
products.forEach(p => { if (p.slug) slugCounts[p.slug] = (slugCounts[p.slug] || 0) + 1; });
const dups = Object.entries(slugCounts).filter(([s, c]) => c > 1);

console.log('=== SLUG STATE ===');
console.log('products:', products.length);
console.log('bad slugs (<=2 chars):', bad.length);
bad.slice(0, 8).forEach(p => console.log('  ', JSON.stringify(p.slug), p.name));
console.log('empty/undefined slugs:', empty.length);
console.log('duplicate slugs:', dups.length, '(first 5', dups.slice(0,5).map(([s,c]) => s+'x'+c).join(', '), ')');

const routes = fs.readFileSync('server/src/routes.js', 'utf8').toString();
console.log('\n=== ROUTES.JS ===');
console.log('has product route?', /product/i.test(routes));
console.log('has renderMeta/buildMeta/metaTag?', /renderMeta|buildMeta|metaTag|pageMeta|seoMeta|generateMeta/i.test(routes));
console.log('size:', routes.length, 'chars /', routes.split('\n').length, 'lines');

// Check what route handles /product/:slug
const routeLines = routes.split('\n')
  .map((l, i) => ({ line: i+1, text: l }))
  .filter(l => l.text.includes('/product') || l.text.match(/app\.(get|post)\(.*product/i));
console.log('\n=== product-related route lines ===');
routeLines.slice(0, 12).forEach(l => console.log('  L' + l.line + ': ' + l.text.trim().slice(0, 90)));
