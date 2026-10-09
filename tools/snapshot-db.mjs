#!/usr/bin/env node
// Snapshot the BigDrop data store so a bad admin action (or a bad restore) can be
// rolled back. Runs entirely on disk - the server does not need to be running.
//
// Schedule it with a cPanel cron, e.g. every 6 hours:
//   0 */6 * * * cd /home/USER/app && node tools/snapshot-db.mjs >> tools/snapshot.log 2>&1
//
// Keeps the last 14 snapshots. Honours DATA_DIR (same resolution as server/src/db.js).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'server', 'data');
const source = path.join(dataDir, 'db.json');
const backupDir = path.join(dataDir, 'backups');
const KEEP = 14;

if (!fs.existsSync(source)) {
  console.error(`No database file at ${source} - nothing to snapshot`);
  process.exit(1);
}

fs.mkdirSync(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const target = path.join(backupDir, `db-${stamp}.json`);
fs.copyFileSync(source, target);

const snaps = fs
  .readdirSync(backupDir)
  .filter((f) => /^db-\d{4}-\d{2}-\d{2}T/.test(f))
  .sort();
while (snaps.length > KEEP) {
  fs.unlinkSync(path.join(backupDir, snaps.shift()));
}

console.log(`Snapshot saved: ${target} (${snaps.length} kept)`);
