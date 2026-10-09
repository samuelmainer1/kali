import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function parseEnvFile(contents) {
  const out = {};
  for (const raw of String(contents || '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

/** Fill empty process.env keys from a dotenv file. Existing values (DirectAdmin) win. */
export function applyEnvFile(file, env = process.env) {
  if (!file || !fs.existsSync(file)) return false;
  const parsed = parseEnvFile(fs.readFileSync(file, 'utf8'));
  for (const [key, val] of Object.entries(parsed)) {
    if (env[key] === undefined) env[key] = val;
  }
  return true;
}

export function loadLocalEnv(env = process.env) {
  const files = [path.join(appRoot, '.env'), path.join(appRoot, 'server', '.env')];
  return files.map((file) => applyEnvFile(file, env)).some(Boolean);
}
