// Generates the brand assets the 21-item pass called for:
//   #4  a real raster share image (1200x630 JPEG) — WhatsApp/Facebook cannot render the SVG
//   #8  compresses the three oversized images (about-hero, logo-header, sam-maina)
//   #9  real PWA icons at the sizes the manifest advertises (192/512, favicons, apple-touch)
//
// Run: node tools/gen-assets.mjs   (needs sharp, installed as a build-time dev tool)
// The client build must be re-run afterwards so client/dist picks the new files up.
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const pub = path.join(root, 'client', 'public');
const p = (f) => path.join(pub, f);

const kb = (f) => (fs.existsSync(f) ? (fs.statSync(f).size / 1024).toFixed(0) + ' KB' : '-');
const before = {};
for (const f of ['about-hero.png', 'logo-header.png', 'sam-maina.jpg', 'logo.png']) before[f] = kb(p(f));

async function report(name, file, note) {
  const b = before[name] || '-';
  console.log(`  ${name.padEnd(20)} ${String(b).padStart(9)} -> ${kb(file).padStart(9)}   ${note}`);
}

// --- #9 PWA icons -------------------------------------------------------------
// logo.png is the square brand mark (400x400), so it is the right source for icons.
const logo = p('logo.png');
await sharp(logo).resize(16, 16).png().toFile(p('favicon-16x16.png'));
await sharp(logo).resize(32, 32).png().toFile(p('favicon-32x32.png'));
await sharp(logo).resize(180, 180).png().toFile(p('apple-touch-icon.png'));
await sharp(logo).resize(192, 192).png().toFile(p('icon-192.png'));
await sharp(logo).resize(512, 512).png().toFile(p('icon-512.png'));
console.log('#9 PWA icons generated at their advertised sizes (16/32/180/192/512)');

// --- #4 share image -----------------------------------------------------------
// Green brand canvas + the logo + a wordmark, flattened to JPEG so every social
// scraper can read it.
const W = 1200;
const H = 630;
const mark = await sharp(logo).resize(300, 300).png().toBuffer();
const overlay = Buffer.from(
  `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
     <text x="${W / 2}" y="520" font-family="Arial, Helvetica, sans-serif" font-size="64"
           font-weight="700" fill="#ffffff" text-anchor="middle">BigDrop Kenya</text>
     <text x="${W / 2}" y="570" font-family="Arial, Helvetica, sans-serif" font-size="26"
           fill="#14b8a8" text-anchor="middle">Shop online. Delivered by Globeflight.</text>
   </svg>`
);
await sharp({ create: { width: W, height: H, channels: 3, background: '#015837' } })
  .composite([
    { input: mark, top: 110, left: Math.round((W - 300) / 2) },
    { input: overlay, top: 0, left: 0 },
  ])
  .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
  .toFile(p('share-default.jpg'));
console.log(`#4 share-default.jpg = ${kb(p('share-default.jpg'))} (1200x630, JPEG)`);

// --- #8 compression -----------------------------------------------------------
// about-hero is a photo with no transparency -> JPEG is far smaller than PNG.
// (About.jsx is updated to point at .jpg.)
await sharp(p('about-hero.png')).resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(p('about-hero.jpg'));
await report('about-hero.png', p('about-hero.jpg'), '-> about-hero.jpg (1600w, q82)');

// sam-maina.jpg is really a PNG-with-alpha named .jpg -> normalise to real JPEG.
await sharp(p('sam-maina.jpg')).flatten({ background: '#ffffff' }).resize({ width: 700, withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true }).toFile(p('sam-maina.tmp.jpg'));
fs.rmSync(p('sam-maina.jpg'));
fs.renameSync(p('sam-maina.tmp.jpg'), p('sam-maina.jpg'));
await report('sam-maina.jpg', p('sam-maina.jpg'), 'real JPEG now, 700w (name kept)');

// Header logo renders at ~40-56px tall, so 512w is already 2x+.
await sharp(p('logo-header.png')).resize({ width: 512, withoutEnlargement: true }).png({ compressionLevel: 9, palette: true }).toFile(p('logo-header.tmp.png'));
fs.rmSync(p('logo-header.png'));
fs.renameSync(p('logo-header.tmp.png'), p('logo-header.png'));
await report('logo-header.png', p('logo-header.png'), '512w palette PNG (was 1536x1024)');

const saved =
  Number(before['about-hero.png'].split(' ')[0]) +
  Number(before['logo-header.png'].split(' ')[0]) +
  Number(before['sam-maina.jpg'].split(' ')[0]) -
  (fs.statSync(p('about-hero.jpg')).size + fs.statSync(p('logo-header.png')).size + fs.statSync(p('sam-maina.jpg')).size) / 1024;
console.log(`#8 total saved: ~${saved.toFixed(0)} KB`);
