// Measures the three image groups a visitor actually downloads — hero banners, blog
// covers and product photos: file count, total MB, average/largest size and the pixel
// dimensions read straight from the file headers (no dependencies).
import fs from 'fs';
import path from 'path';

const root = 'c:/Users/Sam/Downloads/New Bigdrop';
const uploadDir = path.join(root, 'server', 'uploads', 'products');
const db = JSON.parse(fs.readFileSync(path.join(root, 'server', 'data', 'db.json'), 'utf8'));

// ── minimal header readers ────────────────────────────────────────────────
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1];
    // SOF markers carry the frame size (skip DHT/DAC/DRI which are not SOF)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2;
      continue;
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

function pngSize(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function webpSize(buf) {
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') return null;
  const fmt = buf.toString('ascii', 12, 16);
  if (fmt === 'VP8X') return { w: (buf.readUIntLE(24, 3) & 0xffffff) + 1, h: (buf.readUIntLE(27, 3) & 0xffffff) + 1 };
  if (fmt === 'VP8 ') return { w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
  if (fmt === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return { w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function measure(abs) {
  const st = fs.statSync(abs);
  const head = Buffer.alloc(Math.min(st.size, 65536));
  const fd = fs.openSync(abs, 'r');
  fs.readSync(fd, head, 0, head.length, 0);
  fs.closeSync(fd);
  const ext = path.extname(abs).toLowerCase();
  let dim = null;
  if (ext === '.png') dim = pngSize(head);
  else if (ext === '.webp') dim = webpSize(head);
  else dim = jpegSize(head);
  return { bytes: st.size, w: dim?.w || 0, h: dim?.h || 0 };
}

// ── collect each group ────────────────────────────────────────────────────
const groups = {
  'Hero banners (homepage slider)': (db.site?.heroes || []).map((h) => h.image),
  'Blog covers': (db.blogPosts || []).map((p) => p.image),
  'Product photos (all gallery images)': (db.products || []).flatMap((p) => p.images || []),
};

const out = { generatedAt: new Date().toISOString(), groups: {}, publicAssets: [], overlaps: {} };

for (const [label, refs] of Object.entries(groups)) {
  const unique = [...new Set(refs.filter((r) => typeof r === 'string' && r.startsWith('/uploads/')))];
  const rows = [];
  for (const ref of unique) {
    const abs = path.join(uploadDir, ref.replace('/uploads/products/', ''));
    if (!fs.existsSync(abs)) {
      rows.push({ file: ref, missing: true });
      continue;
    }
    const m = measure(abs);
    rows.push({ file: path.basename(ref), bytes: m.bytes, kb: +(m.bytes / 1024).toFixed(0), w: m.w, h: m.h });
  }
  const ok = rows.filter((r) => !r.missing);
  const total = ok.reduce((n, r) => n + r.bytes, 0);
  const dims = {};
  for (const r of ok) dims[`${r.w}x${r.h}`] = (dims[`${r.w}x${r.h}`] || 0) + 1;
  out.groups[label] = {
    references: refs.length,
    uniqueFiles: unique.length,
    missingFiles: rows.length - ok.length,
    totalMB: +(total / 1048576).toFixed(2),
    averageKB: ok.length ? Math.round(total / ok.length / 1024) : 0,
    smallest: ok.length ? [...ok].sort((a, b) => a.bytes - b.bytes)[0] : null,
    largest: ok.length ? [...ok].sort((a, b) => b.bytes - a.bytes)[0] : null,
    dimensions: dims,
    files: [...ok].sort((a, b) => b.bytes - a.bytes),
  };
}

// hero/blog files that are ALSO product photos (no extra download if cached)
const heroSet = new Set((db.site?.heroes || []).map((h) => h.image));
const productSet = new Set((db.products || []).flatMap((p) => p.images || []));
const blogSet = new Set((db.blogPosts || []).map((p) => p.image));
out.overlaps = {
  'hero images also used by products': [...heroSet].filter((x) => productSet.has(x)).length,
  'blog covers also used by products': [...blogSet].filter((x) => productSet.has(x)).length,
  'hero images also used by blog': [...heroSet].filter((x) => blogSet.has(x)).length,
};

// the large static assets shipped in client/public
const pubDir = path.join(root, 'client', 'public');
for (const name of fs.readdirSync(pubDir)) {
  const abs = path.join(pubDir, name);
  if (!fs.statSync(abs).isFile()) continue;
  if (!/\.(png|jpe?g|svg|webp|ico)$/i.test(name)) continue;
  const m = measure(abs);
  out.publicAssets.push({ file: name, mb: +(m.bytes / 1048576).toFixed(2), kb: Math.round(m.bytes / 1024), w: m.w, h: m.h });
}
out.publicAssets.sort((a, b) => b.kb - a.kb);

fs.writeFileSync(path.join(root, 'image-sizes-report.json'), JSON.stringify(out, null, 2));

const fmt = (g) => {
  const dims = Object.entries(g.dimensions).map(([d, n]) => `${d} x${n}`).join(', ');
  return `${g.references} refs / ${g.uniqueFiles} files | ${g.totalMB} MB total | avg ${g.averageKB} KB | ${dims}`;
};
for (const [k, v] of Object.entries(out.groups)) console.log(`\n${k}\n  ${fmt(v)}\n  largest: ${v.largest?.file} ${v.largest?.kb} KB (${v.largest?.w}x${v.largest?.h})`);
console.log('\noverlaps:', JSON.stringify(out.overlaps, null, 2));
console.log('\nclient/public assets (top 8):');
for (const a of out.publicAssets.slice(0, 8)) console.log(`  ${a.file.padEnd(26)} ${String(a.kb).padStart(6)} KB  ${a.mb} MB  ${a.w}x${a.h}`);