// ─── Remote-image (SSRF) + upload guard regression suite ───────────────────
// Remote product photos are fetched BY THE SERVER during the Woo/product
// imports, so internal addresses must be refused — otherwise a vendor could
// probe the host network through an image URL.
//
// downloadRemoteImage swallows failures and returns '' (it never throws), so
// the assertions are "nothing was downloaded" plus "no file landed on disk".
// Every host below is rejected before a socket is opened, making the suite
// fully offline. UPLOADS_DIR points at a temp folder, so a guard leak would be
// caught (and could never touch server/uploads).
//
// This project has no `npm test` script yet — run a file directly:
//   node --test server/src/uploads.test.js
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import sharp from 'sharp';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bigdrop-uploads-'));
const uploadsDir = path.join(tmp, 'uploads');
process.env.UPLOADS_DIR = uploadsDir;

const { compressProductImage, downloadRemoteImage, PRODUCT_MAX_BYTES, saveDataUrl, uploadFolderOf, uploadsRoot } = await import('./uploads.js');

// The throwaway uploads folder never outlives the run.
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

function savedFiles() {
  if (!fs.existsSync(uploadsDir)) return [];
  const found = [];
  (function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else found.push(path.relative(uploadsDir, full));
    }
  })(uploadsDir);
  return found;
}

// Hosts that must never be fetched: loopback, RFC1918 private, link-local
// (cloud metadata), CGNAT, IPv6 loopback and internal-only names.
const BLOCKED_HOSTS = [
  'http://localhost/evil.jpg',
  'http://127.0.0.1/evil.jpg',
  'http://0.0.0.0/evil.jpg',
  'http://10.0.0.5/evil.jpg',
  'http://172.16.4.4/evil.jpg',
  'http://192.168.1.10/evil.jpg',
  'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
  'http://100.64.0.1/evil.jpg',
  'http://[::1]/evil.jpg',
  'http://metadata.internal/evil.jpg',
  'http://printer.local/evil.jpg',
  'http://shop.localhost/evil.jpg',
];

test('remote images on internal or loopback hosts are never downloaded', async () => {
  const before = savedFiles().length;
  for (const url of BLOCKED_HOSTS) {
    const saved = await downloadRemoteImage(url);
    assert.equal(saved, '', `should refuse ${url}`);
  }
  assert.equal(savedFiles().length, before, 'no file may be written for a blocked host');
});

test('non-http schemes and junk input are ignored', async () => {
  for (const input of ['ftp://example.com/a.jpg', 'file:///etc/passwd', 'javascript:alert(1)', 'not a url', '   ', '', null, undefined]) {
    assert.equal(await downloadRemoteImage(input), '', `should ignore ${String(input)}`);
  }
});

test('an already-local upload path is passed straight through', async () => {
  assert.equal(await downloadRemoteImage('/uploads/products/already-here.jpg'), '/uploads/products/already-here.jpg');
  assert.equal(savedFiles().length, 0);
});

test('a data URL is written locally and returned as an upload path', () => {
  const png = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8AARAA';
  const saved = saveDataUrl(png, 'products');
  assert.match(saved, /^\/uploads\/products\/[0-9]+-[A-Za-z0-9_-]+\.png$/);
  assert.equal(fs.existsSync(path.join(uploadsRoot, saved.replace('/uploads/', ''))), true);
});

test('an oversized image for its folder is refused', () => {
  // products are capped at 150KB; a blown-up payload must not reach the disk.
  const huge = 'data:image/png;base64,' + 'A'.repeat(300 * 1024);
  assert.throws(() => saveDataUrl(huge, 'products'), /too large/i);
});

test('product image compression emits WebP within 150KB', async () => {
  const pixels = crypto.randomBytes(600 * 600 * 3);
  const source = await sharp(pixels, { raw: { width: 600, height: 600, channels: 3 } })
    .jpeg({ quality: 92 })
    .toBuffer();
  const compressed = await compressProductImage(source);
  const metadata = await sharp(compressed).metadata();

  assert.ok(compressed.length <= PRODUCT_MAX_BYTES);
  assert.equal(metadata.format, 'webp');
});

test('a malformed data URL is refused', () => {
  assert.throws(() => saveDataUrl('data:image/png,not-base64', 'products'), /Invalid image data/);
});

test('only the whitelisted upload folders are accepted, and never via traversal', () => {
  assert.equal(uploadFolderOf('/uploads/products/photo.jpg'), 'products');
  assert.equal(uploadFolderOf('/uploads/reviews/photo.png'), 'reviews');
  assert.equal(uploadFolderOf('/uploads/blog/cover.webp'), 'blog');
  assert.equal(uploadFolderOf('/uploads/heroes/hero.jpg'), 'heroes');

  assert.equal(uploadFolderOf('/uploads/evil/photo.jpg'), null, 'unknown folder must be refused');
  assert.equal(uploadFolderOf('/uploads/products/../../server/data/db.json'), null, 'traversal must be refused');
  assert.equal(uploadFolderOf('/uploads/products/..%2f..%2fdb.json'), null, 'encoded traversal must be refused');
  assert.equal(uploadFolderOf('/uploads//photo.jpg'), null);
  assert.equal(uploadFolderOf('https://example.com/photo.jpg'), null);
  assert.equal(uploadFolderOf(''), null);
  assert.equal(uploadFolderOf(null), null);
});
