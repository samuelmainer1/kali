// Compares the shape of two db JSON files (counts + byte sizes) so a localization
// pass can be proven lossless.
import fs from 'fs';

function shape(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const db = JSON.parse(raw);
  const out = { file, bytes: Buffer.byteLength(raw), pretty: raw.length };
  for (const [k, v] of Object.entries(db)) {
    if (Array.isArray(v)) out[k] = `array(${v.length})`;
    else if (v && typeof v === 'object') out[k] = `object(${Object.keys(v).length} keys)`;
    else out[k] = JSON.stringify(v);
  }
  const dataUrls = (raw.match(/data:image/g) || []).length;
  out.dataUrlImages = dataUrls;
  return out;
}

for (const f of process.argv.slice(2)) {
  console.log(JSON.stringify(shape(f), null, 2));
}
