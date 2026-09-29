// Removes CATALOG_PHOTO_FIXES / DEAD_UNSPLASH_IDS entries whose target photo
// ID was verified dead (404) by scan-images.mjs — otherwise remapDeadUnsplash
// re-injects broken image URLs into the catalogue on every server boot.
import fs from 'fs';

const root = 'c:/Users/Sam/Downloads/New Bigdrop';
const audit = JSON.parse(fs.readFileSync(root + '/image-audit.json', 'utf8'));
const deadIds = new Set(
  audit.deadExternal.map((d) => (d.url.match(/photo-[\w-]+/) || [])[0]).filter(Boolean)
);
console.log('dead photo IDs to purge from tables:', deadIds.size);

const file = root + '/server/src/commerce.js';
const lines = fs.readFileSync(file, 'utf8').split('\n');
const kept = [];
let removed = 0;

for (const line of lines) {
  const ids = (line.match(/photo-[\w-]+/g) || []);
  const isTableEntry = /'.*':\s*'photo-[\w-]+'/.test(line);
  if (isTableEntry && ids.length) {
    const targetId = ids[ids.length - 1]; // value: the photo the entry assigns
    if (deadIds.has(targetId)) {
      removed += 1;
      console.log('REMOVE:', line.trim());
      continue;
    }
  }
  kept.push(line);
}

fs.writeFileSync(file, kept.join('\n'));
console.log('entries removed:', removed);
console.log('commerce.js tables cleaned.');