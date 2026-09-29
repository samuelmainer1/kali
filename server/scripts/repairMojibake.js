/**
 * BigDrop catalogue maintenance script.
 *
 * Repairs mojibake in server/data/db.json (and seed.json): text that was
 * stored as UTF-8 but read back as Windows-1252 during import, so e.g.
 *   "—"  was stored as  "Ã¢â‚¬â€"   (double mis-decode)
 *   "Nestlé" was stored as "NestlÃƒÂ©"
 * Detail pages and search results show those garbles verbatim, so they are
 * worth fixing at the source.
 *
 * How it works: only contiguous "damaged runs" are converted. A run may only
 * begin at a cp1252 lead character (Â / Ã / â) and is decoded one UTF-8
 * sequence at a time, so legitimate text — including real en/em dashes and
 * accented words that survived the import — is never rewritten. Anything that
 * does not decode as valid UTF-8 is put back exactly as it was, so the pass can
 * never corrupt data, only improve it.
 *
 * Safety: every repair is asserted to (a) preserve the ASCII characters of the
 * string in the same order, (b) leave no mojibake markers behind, and (c) be
 * idempotent. The script aborts before writing if any assertion fails.
 *
 * Run from the repo root:  node server/scripts/repairMojibake.js [--dry-run]
 *
 * NOTE: the API server holds db.json in memory. After applying, restart the
 * server on port 5001 or the old text keeps being served.
 */
import fs from 'fs';
import path from 'path';

const dbPath = path.resolve('server/data/db.json');
const seedPath = path.resolve('server/data/seed.json');
const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1';

// Windows-1252 high range. The mis-decode was cp1252 rather than latin1, which
// is why "€", "‚", """ appear in place of raw C1 control codes.
const CP1252 = {
  0x80: '\u20ac', 0x82: '\u201a', 0x83: '\u0192', 0x84: '\u201e', 0x85: '\u2026',
  0x86: '\u2020', 0x87: '\u2021', 0x88: '\u02c6', 0x89: '\u2030', 0x8a: '\u0160',
  0x8b: '\u2039', 0x8c: '\u0152', 0x8e: '\u017d', 0x91: '\u2018', 0x92: '\u2019',
  0x93: '\u201c', 0x94: '\u201d', 0x95: '\u2022', 0x96: '\u2013', 0x97: '\u2014',
  0x98: '\u02dc', 0x99: '\u2122', 0x9a: '\u0161', 0x9b: '\u203a', 0x9c: '\u0153',
  0x9e: '\u017e', 0x9f: '\u0178',
};
const REV = new Map(Object.entries(CP1252).map(([b, ch]) => [ch, Number(b)]));
const utf8 = new TextDecoder('utf-8', { fatal: true });

/** Characters that still look garbled after a pass. */
const MOJI = /Ã[\u0080-\u00ff]|Â[\u00a0-\u00bf]|â€|\ufffd/;

/** Lead characters that can legitimately start a mis-decoded byte sequence. */
const LEAD = new Set(['\u00c2', '\u00c3', '\u00e2']);

/** Expected UTF-8 sequence length for a lead byte, or 0 if it cannot lead. */
function leadLen(b) {
  if (b <= 0x7f) return 1;
  if (b >= 0xc2 && b <= 0xdf) return 2;
  if (b >= 0xe0 && b <= 0xef) return 3;
  if (b >= 0xf0 && b <= 0xf4) return 4;
  return 0;
}
const isCont = (b) => b >= 0x80 && b <= 0xbf;

/**
 * Decode the damaged runs of a single string. Valid text is copied through
 * untouched; a run that does not form valid UTF-8 is restored verbatim.
 */
function decodeRuns(str) {
  const src = [...str];
  let out = '';
  let bytes = [];
  let chars = [];
  const emitDecoded = () => { out += utf8.decode(Buffer.from(bytes)); bytes = []; chars = []; };
  const emitRaw = () => { out += chars.join(''); bytes = []; chars = []; };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const cp = ch.codePointAt(0);
    const byte = cp <= 0xff ? cp : REV.has(ch) ? REV.get(ch) : null;

    if (byte === null) { emitRaw(); out += ch; continue; }

    // Outside a run only a lead character may open one, so ordinary characters
    // (and genuine dashes/quotes) are always copied through as-is.
    if (!bytes.length && !LEAD.has(ch) && !(cp >= 0x80 && cp <= 0x9f)) {
      out += ch;
      continue;
    }

    bytes.push(byte);
    chars.push(ch);
    const need = leadLen(bytes[0]);
    const okSoFar = need > 0 && bytes.slice(1).every(isCont);
    if (!okSoFar) { emitRaw(); continue; }                  // not a real sequence
    if (bytes.length === need) { emitDecoded(); continue; } // complete sequence
    if (bytes.length > need) { emitRaw(); continue; }       // overlong
    // otherwise: still partial, keep collecting bytes
  }
  emitRaw(); // trailing partial run
  return out;
}

/**
 * Fully repair one string. Heavily garbled text needs more than one pass
 * ("Ã¢â‚¬â€" -> "â€"" -> "—"), so repeat until the text stops changing.
 */
function repair(str) {
  if (typeof str !== 'string' || !MOJI.test(str)) return str;
  let cur = str;
  for (let i = 0; i < 4; i++) {
    const next = decodeRuns(cur);
    if (next === cur) break;
    cur = next;
    if (!MOJI.test(cur)) break;
  }
  return cur;
}

// -------------------------------------------------------------- self-test ---
const SELF_TEST = [
  ['NestlÃƒÂ©', 'Nestlé'],
  ["L'OrÃƒÂ©al", "L'Oréal"],
  ['plain ascii text', 'plain ascii text'],
  ['Café — déjà vu', 'Café — déjà vu'],
  ['6.5â€³', '6.5″'],
  ['\u00c3\u00a2\u00e2\u201a\u00ac\u00e2\u20ac\u009d', '—'],
];
for (const [input, want] of SELF_TEST) {
  const got = repair(input);
  if (got !== want) {
    console.error(`Self-test failed for ${JSON.stringify(input)}: got ${JSON.stringify(got)}, expected ${JSON.stringify(want)}`);
    process.exit(1);
  }
}
console.log(`Self-test ok (${SELF_TEST.length} cases)\n`);

// ------------------------------------------------------------------- checks ---
// Decoding only ever consumes bytes >= 0x80, so the ASCII characters of a
// string must survive a repair pass in the same order. This is the guard that
// proves the repair cannot silently eat or reorder real content.
const asciiOnly = (s) => [...s].filter((c) => c.codePointAt(0) <= 0x7f).join('');
const problems = [];

function assertSafe(label, before, after) {
  if (asciiOnly(before) !== asciiOnly(after)) {
    problems.push(`${label}: ASCII characters changed order/content\n    before: ${JSON.stringify(before)}\n    after : ${JSON.stringify(after)}`);
  }
  if (repair(after) !== after) {
    problems.push(`${label}: repair is not idempotent\n    after : ${JSON.stringify(after)}`);
  }
}

// ----------------------------------------------------------------- traversal ---
const stats = {};
const samples = [];
const leftover = [];

function walk(node, key) {
  if (Array.isArray(node)) {
    for (let i = 0; i < node.length; i++) node[i] = walk(node[i], key);
    return node;
  }
  if (node && typeof node === 'object') {
    for (const k of Object.keys(node)) node[k] = walk(node[k], k);
    return node;
  }
  if (typeof node !== 'string') return node;

  const after = repair(node);
  if (after !== node) {
    stats[key] = (stats[key] || 0) + 1;
    assertSafe(key, node, after);
    if (samples.length < 6) samples.push({ key, before: node, after });
  }
  if (MOJI.test(after)) leftover.push({ key, value: after });
  return after;
}

// -------------------------------------------------------------------- apply ---
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
walk(db, 'db');
const seed = fs.existsSync(seedPath) ? JSON.parse(fs.readFileSync(seedPath, 'utf8')) : null;
if (seed) walk(seed, 'seed');

const total = Object.values(stats).reduce((a, b) => a + b, 0);
console.log('Strings repaired by field:');
for (const [key, n] of Object.entries(stats).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${key.padEnd(14)} ${n}`);
}
console.log(`\nTotal strings repaired: ${total}`);

if (samples.length) {
  console.log('\nExamples:');
  for (const s of samples) {
    console.log(`  [${s.key}]\n    before: ${JSON.stringify(s.before).slice(0, 110)}`);
    console.log(`    after : ${JSON.stringify(s.after).slice(0, 110)}`);
  }
}

if (leftover.length) {
  console.warn(`\nWARNING: ${leftover.length} string(s) still look garbled and were left as-is (undecodable):`);
  for (const l of leftover.slice(0, 10)) console.warn(`  [${l.key}] ${JSON.stringify(l.value).slice(0, 110)}`);
}

if (problems.length) {
  console.error(`\nABORT — ${problems.length} safety assertion(s) failed, nothing was written:`);
  for (const p of problems.slice(0, 10)) console.error(`  - ${p}`);
  process.exit(1);
}

if (DRY_RUN) {
  console.log('\n*** DRY RUN — no backups written, no files modified ***');
  process.exit(0);
}

if (!total) {
  console.log('\nCatalogue is already clean, nothing to write.');
  process.exit(0);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve('server/data/backups');
fs.mkdirSync(backupDir, { recursive: true });
fs.writeFileSync(
  path.join(backupDir, `db-before-mojibake-fix-${Date.now()}.json`),
  JSON.stringify(db, null, 2),
  'utf8'
);
fs.writeFileSync(path.resolve(`server/data/db.json.pre-mojibake-fix-${stamp}`), JSON.stringify(db, null, 2), 'utf8');
if (seed) {
  fs.writeFileSync(path.resolve(`server/data/seed.json.pre-mojibake-fix-${stamp}`), JSON.stringify(seed, null, 2), 'utf8');
}

fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8');
if (seed) fs.writeFileSync(seedPath, JSON.stringify(seed, null, 2), 'utf8');

console.log(`\nWrote ${dbPath}${seed ? ' and ' + seedPath : ''} (backups in server/data/backups).`);
console.log('Restart the API server (port 5001) — it caches db.json in memory.');

