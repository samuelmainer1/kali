// Verifies every file in server/uploads/products is a REAL image (magic-byte check).
// A download that silently saved an HTML/JSON error page as .jpg renders exactly like
// "this image is not showing" in the browser, so this catches those.
import fs from 'fs';
import path from 'path';

const dir = 'server/uploads/products';
const files = fs.readdirSync(dir).filter((f) => fs.statSync(path.join(dir, f)).isFile());
const bad = [];

for (const f of files) {
  const buf = fs.readFileSync(path.join(dir, f));
  const head = buf.subarray(0, 16);
  const ext = path.extname(f).slice(1).toLowerCase();
  let ok = false;
  if (ext === 'jpg' || ext === 'jpeg') ok = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  else if (ext === 'png') ok = head[0] === 0x89 && head[1] === 0x50 && head[2] === 0x4e && head[3] === 0x47;
  else if (ext === 'gif') ok = head[0] === 0x47 && head[1] === 0x49 && head[2] === 0x46;
  else if (ext === 'webp') ok = buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP';
  else if (ext === 'svg') ok = buf.toString('utf8', 0, 200).includes('<svg');
  else ok = true;

  if (!ok) {
    const isHtml = buf.toString('utf8', 0, 200).toLowerCase().includes('<!doctype') || buf.toString('utf8', 0, 200).toLowerCase().includes('<html');
    bad.push({
      file: f,
      bytes: buf.length,
      looksLike: isHtml ? 'HTML error page' : 'unknown',
      head: buf.toString('latin1', 0, 24).replace(/[^\x20-\x7e]/g, '.'),
    });
  }
}

console.log(`checked: ${files.length} files in ${dir}`);
console.log(`NOT real images: ${bad.length}`);
for (const b of bad) console.log(`  ${b.file} (${b.bytes}B, ${b.looksLike})  head="${b.head}"`);

// Also flag suspiciously small files (likely truncated downloads).
const small = files
  .map((f) => ({ f, s: fs.statSync(path.join(dir, f)).size }))
  .filter((x) => x.s < 3000)
  .sort((a, b) => a.s - b.s);
console.log(`\nsuspiciously small (<3KB): ${small.length}`);
for (const x of small.slice(0, 20)) console.log(`  ${x.f} = ${x.s}B`);