// Probes every Unsplash (and other remote) image URL hardcoded anywhere in the
// server or client source. A dead URL here is a broken image the site renders at
// runtime (fallback avatars, default blog cover, hero slides, import defaults).
import fs from 'fs';
import path from 'path';

const root = 'c:/Users/Sam/Downloads/New Bigdrop';
const dirs = ['server/src', 'client/src', 'client/public'];
const files = [];
function walk(dir) {
  const full = path.join(root, dir);
  if (!fs.existsSync(full)) return;
  for (const e of fs.readdirSync(full, { withFileTypes: true })) {
    const p = path.join(full, e.name);
    if (e.isDirectory()) walk(path.join(dir, e.name));
    else if (/\.(jsx?|html|css|json)$/i.test(e.name)) files.push(p);
  }
}
dirs.forEach(walk);

const hits = new Map(); // url -> [{file,line}]
for (const file of files) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/https?:\/\/images\.unsplash\.com\/[\w-]+(?:\?[^'"`\s)]*)?/g)) {
      if (!hits.has(m[0])) hits.set(m[0], []);
      hits.get(m[0]).push(`${path.relative(root, file)}:${i + 1}`);
    }
  });
}

const list = [...hits.entries()];
console.log('unique hardcoded remote image URLs found:', list.length);

let dead = 0;
const results = [];
for (const [url, where] of list) {
  let status = 'ERR';
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'follow' });
    clearTimeout(t);
    status = res.status + ' ' + (res.headers.get('content-type') || '?');
  } catch (e) {
    status = 'FAIL ' + String(e.message).slice(0, 40);
  }
  const bad = !/^2\d\d/.test(status);
  if (bad) dead += 1;
  results.push({ url, where, status, bad });
  if (bad) console.log(`  DEAD  ${status.padEnd(18)} ${url.slice(0, 74)}\n        used at: ${where.join(', ')}`);
}

console.log(`\nsummary: ${list.length} hardcoded URLs, ${dead} DEAD/BROKEN, ${list.length - dead} alive`);
const byFile = {};
for (const r of results.filter((x) => x.bad)) for (const w of r.where) { const f = w.split(':')[0]; byFile[f] = (byFile[f] || 0) + 1; }
if (Object.keys(byFile).length) {
  console.log('\nDEAD URLs per file:');
  console.log(JSON.stringify(byFile, null, 2));
}
fs.writeFileSync(path.join(root, 'code-url-probe.json'), JSON.stringify(results, null, 2));
