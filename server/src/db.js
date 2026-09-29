import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
export const dbPath = path.join(dataDir, 'db.json');
const bundledSeed = path.join(__dirname, '../data/seed.json');

let cache = null;
let pool = null;
let mysqlWrite = Promise.resolve();

export function mysqlConfigured() {
  return Boolean(process.env.MYSQL_HOST && process.env.MYSQL_USER && process.env.MYSQL_DATABASE);
}

function emptyDb() {
  return { users: [], products: [], orders: [], categories: [] };
}

function loadFileDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    const seedPath = fs.existsSync(path.join(dataDir, 'seed.json'))
      ? path.join(dataDir, 'seed.json')
      : bundledSeed;
    if (fs.existsSync(seedPath)) fs.copyFileSync(seedPath, dbPath);
    else fs.writeFileSync(dbPath, JSON.stringify(emptyDb(), null, 2));
  }
  return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
}

function writeFileDb(db) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  // Atomic save: write to a temp file first, then rename over the live file.
  // A crash mid-write can no longer leave a truncated/corrupt db.json, and the
  // previous generation is kept as db.json.bak for recovery.
  const tmp = `${dbPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  if (fs.existsSync(dbPath)) fs.copyFileSync(dbPath, `${dbPath}.bak`);
  fs.renameSync(tmp, dbPath);
}

export async function initDb() {
  cache = loadFileDb();
  if (!mysqlConfigured()) {
    console.log('BigDrop data: JSON file', dbPath);
    return { mode: 'file' };
  }
  const mysqlMod = await import('mysql2/promise');
  const mysql = mysqlMod.default || mysqlMod;
  pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE,
    waitForConnections: true,
    connectionLimit: 8,
    charset: 'utf8mb4',
  });
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bigdrop_store (
      id TINYINT PRIMARY KEY,
      payload LONGTEXT NOT NULL,
      updated_at DATETIME NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [rows] = await pool.query('SELECT payload FROM bigdrop_store WHERE id = 1');
  if (rows[0]?.payload) {
    try {
      cache = JSON.parse(rows[0].payload);
      writeFileDb(cache);
      console.log('BigDrop data: MySQL (imported to local backup)');
      return { mode: 'mysql' };
    } catch (err) {
      console.error('MySQL payload parse failed, using file:', err.message);
    }
  } else {
    await pool.query('REPLACE INTO bigdrop_store (id, payload, updated_at) VALUES (1, ?, NOW())', [
      JSON.stringify(cache),
    ]);
    console.log('BigDrop data: MySQL seeded from JSON file');
  }
  return { mode: 'mysql' };
}

function enqueueMysql(db) {
  if (!pool) return;
  const payload = JSON.stringify(db);
  mysqlWrite = mysqlWrite
    .then(() => pool.query('REPLACE INTO bigdrop_store (id, payload, updated_at) VALUES (1, ?, NOW())', [payload]))
    .catch((err) => console.error('MySQL save failed:', err.message));
}

export function readDb() {
  if (!cache) cache = loadFileDb();
  // structuredClone is notably faster than a JSON round-trip, and readDb runs
  // on every request.
  return typeof structuredClone === 'function' ? structuredClone(cache) : JSON.parse(JSON.stringify(cache));
}

export function writeDb(db) {
  cache = db;
  try {
    writeFileDb(db);
  } catch (err) {
    console.error('JSON backup save failed:', err.message);
  }
  enqueueMysql(db);
}

/**
 * Apply a mutation to the live database and persist it.
 * The mutator runs on the freshest state (not the caller's earlier snapshot)
 * and is synchronous, so within one Node process it is atomic. Throwing
 * inside the mutator aborts the write entirely — use this for validation
 * that must hold at commit time (e.g. stock re-checks in order creation).
 */
export function updateDb(mutator, meta) {
  const db = readDb();
  const result = mutator(db);
  if (meta && typeof meta === 'object') {
    db.auditLog = [
      {
        at: new Date().toISOString(),
        actor: String(meta.actor || 'system'),
        action: String(meta.action || ''),
        detail: String(meta.detail || '').slice(0, 500),
      },
      ...(db.auditLog || []),
    ].slice(0, 500);
  }
  writeDb(db);
  return result;
}

export function actorFrom(req) {
  const u = req?.user;
  if (!u) return 'guest';
  return `${u.role}:${u.name || u.email || u.id}`;
}

export function dataMode() {
  return pool ? 'mysql' : 'file';
}
