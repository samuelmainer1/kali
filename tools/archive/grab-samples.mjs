// Downloads a broad sample across categories to inspect image brightness.
import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/Sam/Downloads/New Bigdrop/img-check';
fs.mkdirSync(dir, { recursive: true });

const res = await fetch('http://localhost:5001/api/products');
const { products } = await res.json();

// pick the first 10 products from tvs-electronics plus 6 random others
const electronics = products.filter((p) => p.categorySlug === 'tvs-electronics').slice(0, 10);
const others = products.filter((p) => p.categorySlug !== 'tvs-electronics').slice(10, 16);
const picked = [...electronics, ...others];

for (const p of picked) {
  const img = p.images?.[0] || '';
  if (!img) continue;
  const name = (p.sku || p.id).replace(/[^\w-]/g, '_');
  try {
    const r = await fetch(img.startsWith('http') ? img : 'http://localhost:5173' + img);
    const buf = Buffer.from(await r.arrayBuffer());
    const ctype = (r.headers.get('content-type') || '').split(';')[0];
    if (ctype.includes('svg')) {
      fs.writeFileSync(path.join(dir, `${name}.svg`), buf);
      console.log(`${name}: SVG (placeholder) <- ${p.name}`);
      continue;
    }
    fs.writeFileSync(path.join(dir, `${name}.jpg`), buf);
    console.log(`${name}: JPEG ${Math.round(buf.length / 1024)}KB <- ${p.name}`);
  } catch (e) {
    console.log(`${name}: FAILED ${e.message}`);
  }
}
console.log('done');