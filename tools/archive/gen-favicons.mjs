// Generates missing static assets for items 3-4, 9, 12:
// - favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png (from logo.png)
// - share-default.svg (brand share image, 1200x630)
// - updates index.html references
import fs from 'fs';
import path from 'path';

const pubDir = path.join('client', 'public');
const logoPng = path.join(pubDir, 'logo.png');

if (fs.existsSync(logoPng)) {
  fs.copyFileSync(logoPng, path.join(pubDir, 'favicon-32x32.png'));
  fs.copyFileSync(logoPng, path.join(pubDir, 'favicon-16x16.png'));
  fs.copyFileSync(logoPng, path.join(pubDir, 'apple-touch-icon.png'));
  console.log('OK: favicon PNGs + apple-touch-icon ← logo.png');
} else {
  console.log('SKIP: logo.png not found');
}

const shareSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <rect width="1200" height="630" fill="#015837"/>
  <text x="600" y="330" font-family="system-ui, -apple-system, sans-serif" font-size="120" font-weight="700" fill="#ffffff" text-anchor="middle">BigDrop Kenya</text>
  <text x="600" y="430" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#14b8a8" text-anchor="middle">Delivering across Kenya</text>
</svg>`;
fs.writeFileSync(path.join(pubDir, 'share-default.svg'), shareSvg);
console.log('OK: share-default.svg created (1200x630)');

let html = fs.readFileSync(path.join(pubDir, 'index.html'), 'utf8');
// Point og:image at the local share image
html = html.replace(/content="https:\/\/bigdrop\.co\.ke\/og-default\.jpg"/g, 'content="/share-default.svg"');
html = html.replace(/content="https:\/\/bigdrop\.co\.ke\/"/g, 'content="https://shop.bigdrop.co.ke/"');
// Ensure both SVG and PNG favicon are declared
if (!html.includes('favicon-32x32.png')) {
  html = html.replace(/<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg" \/>/,
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n    <link rel="alternate icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />');
}
fs.writeFileSync(path.join(pubDir, 'index.html'), html);
console.log('OK: index.html updated (og:image, og:url, favicon refs)');

console.log('\n=== Final public image files ===');
fs.readdirSync(pubDir).filter(f => /\.(png|svg|jpg|ico)$/i.test(f)).forEach(f => {
  console.log('  ' + f + ' (' + fs.statSync(path.join(pubDir, f)).size + ' bytes)');
});
