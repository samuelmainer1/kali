// Take over /favicon.svg and /favicon-32x32.png / /favicon-16x16.png
// + /apple-touch-icon.png from the project's BigDrop assets, so the storefront
// has a real favicon without depending on anything at a remote host.
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const src = 'c:/Users/Sam/Downloads/New Bigdrop';
const dst = path.join(src, 'client', 'public');
const dstU = path.join(src, 'server', 'uploads');
fs.mkdirSync(dst, { recursive: true });
fs.mkdirSync(dstU, { recursive: true });

const logoHorizontal = path.join(src, 'BigDrop_Kenya_Logo_Horizontal.png');
const brand   = path.join(src, 'BigDrop_Kenya_Brand_Logo.png');

run()
  .then(() => console.log('FAVICON DONE'))
  .catch((e) => { console.error('FAVICON FAIL', e.message); process.exit(1); });

async function run() {
  // 1) favicon.svg — the project favicon.svg (the small BigDrop glyph) is not the
  //    right storefront icon. Replace it with the BigDrop_ brand SVG rendered at
  //    512x512 and trimmed to the logo's real content.
  const brandData = await sharp(brand).raw().toBuffer({ resolveWithObject: true });
  const { width, height } = brandData.metadata;
  const trimmed = await sharp(brand).trim().resize(512, 512, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } }).toFormat('svg').toBuffer();
  fs.writeFileSync(path.join(dst, 'favicon.svg'), trimmed);
  console.log('favicon.svg <- BigDrop brand SVG rendered at 512x512');

  // 2) favicon-32x32.png and favicon-16x16.png — use favicon.svg scaled down.
  await sharp(path.join(dst, 'favicon.svg')).resize(32, 32, { fit: 'contain' }).toFormat('png').toFile(path.join(dst, 'favicon-32x32.png'));
  await sharp(path.join(dst, 'favicon.svg')).resize(16, 16, { fit: 'contain' }).toFormat('png').toFile(path.join(dst, 'favicon-16x16.png'));
  console.log('favicon-32x32.png + favicon-16x16.png <- favicon.svg');

  // 3) apple-touch-icon.png — 180x180 from the same source.
  await sharp(path.join(dst, 'favicon.svg')).resize(180, 180, { fit: 'contain' }).toFormat('png').toFile(path.join(dst, 'apple-touch-icon.png'));
  console.log('apple-touch-icon.png <- favicon.svg @180');

  // 4) mirror the same to server/uploads so the API (if it ever serves static)
  //    can serve the same files.
  await sharp(path.join(dst, 'favicon.svg')).resize(32, 32, { fit: 'contain' }).toFormat('png').toFile(path.join(dstU, 'favicon-32x32.png'));
  await sharp(path.join(dst, 'favicon.svg')).resize(16, 16, { fit: 'contain' }).toFormat('png').toFile(path.join(dstU, 'favicon-16x16.png'));
  console.log('mirrored to server/uploads/: favicon-32x32.png, favicon-16x16.png');

  // 5) The project public/index.html already has <link> for /favicon.svg and the
  //    32x32 / 16x16 / apple-touch-icon; that is the file we edited.
}

function ensureDirSync(dir) { fs.mkdirSync(dir, { recursive: true }); }
