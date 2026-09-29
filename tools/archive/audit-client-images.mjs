// Finds images the storefront requests that do not actually load.
//  - every http(s) image URL hardcoded in client/src (ignoring comments/our own notes)
//  - every /xxx.png style public asset referenced from client/src
// Probes the remote ones and checks the public ones exist on disk, then prints a
// verdict list. Run with the dev server up if you also want the local ones checked
// over HTTP.
import fs from 'fs';
import path from 'path';

const root = 'c:/Users/Sam/Downloads/New Bigdrop';
const clientSrc = path.join(root, 'client', 'src');
const clientPublic = path.join(root, 'client', 'public');

function walkDir(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walkDir(p, out);
    else if (/\.(jsx?|tsx?)$/.test(e.name)) out.push(p);
  }
  return out;
}

const files = walkDir(clientSrc);
const external = new Map(); // url -> [file:line]
const publicRefs = new Map(); // /path -> [file:line]

const URL_RE = /https?:\/\/[^\s"'`)<>]+/g;
const PUBLIC_RE = /["'`](\/[A-Za-z0-9._/-]+\.(?:png|jpe?g|svg|webp|gif|ico))["'`]/g;

for (const f of files) {
  const lines = fs.readFileSync(f, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    const where = `${path.relative(root, f)}:${i + 1}`;
    if (/^\s*(\/\/|\*|\/\*)/.test(line)) return; // skip comments
    for (const m of line.match(URL_RE) || []) {
      if (!/\.(png|jpe?g|svg|webp|gif|avif|ico)(\?|$)/i.test(m) && !/unsplash|wp-content/.test(m)) continue;
      if (!external.has(m)) external.set(m, []);
      external.get(m).push(where);
    }
    for (const m of line.match(PUBLIC_RE) || []) {
      if (!publicRefs.has(m)) publicRefs.set(m, []);
      publicRefs.get(m).push(where);
    }
  });
}

console.log(`scanned ${files.length} client source files`);
console.log(`hardcoded remote image URLs: ${external.size}`);
console.log(`public-folder refs: ${publicRefs.size}\n`);

async function probe(url) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: 'image/*', 'User-Agent': 'Mozilla/5.0 (BigDrop image audit)' },
    });
    clearTimeout(t);
    const ctype = (res.headers.get('content-type') || '').toLowerCase();
    return { status: res.status, ok: res.ok && ctype.startsWith('image/'), ctype };
  } catch (e) {
    return { status: 0, ok: false, ctype: String(e.message).slice(0, 40) };
  }
}

console.log('--- REMOTE IMAGE URLS (client code) ---');
const brokenRemote = [];
for (const [url, where] of external) {
  const r = await probe(url);
  const verdict = r.ok ? 'OK  ' : 'BROKEN';
  console.log(`${verdict} ${r.status || '-'} ${r.ctype.padEnd(12)} ${url.slice(0, 88)}`);
  console.log(`         used at: ${where.join(', ')}`);
  if (!r.ok) brokenRemote.push({ url, where });
}

console.log('\n--- CLIENT/PUBLIC ASSETS ---');
const missingPublic = [];
for (const [ref, where] of publicRefs) {
  const disk = path.join(clientPublic, ref.replace(/^\//, ''));
  const exists = fs.existsSync(disk);
  console.log(`${exists ? 'OK  ' : 'MISSING'} ${ref}   used at: ${where.join(', ')}`);
  if (!exists) missingPublic.push({ ref, where });
}

console.log('\n=== SUMMARY ===');
console.log(`broken remote images : ${brokenRemote.length}`);
console.log(`missing public files : ${missingPublic.length}`);
if (brokenRemote.length) console.log(JSON.stringify(brokenRemote, null, 2));
if (missingPublic.length) console.log(JSON.stringify(missingPublic, null, 2));
