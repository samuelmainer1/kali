import test from 'node:test';
import assert from 'node:assert/strict';
import { parseEnvFile, applyEnvFile } from './loadEnv.js';
import fs from 'fs';
import os from 'os';
import path from 'path';

test('parseEnvFile skips comments and keeps quoted values', () => {
  const parsed = parseEnvFile(`
# SMTP_HOST=ignored
SMTP_HOST=mail.bigdrop.co.ke
SMTP_FROM=orders@bigdrop.co.ke
SMTP_PASS="p@ss word"
export ADMIN_EMAIL=globeflightke21@gmail.com
`);
  assert.equal(parsed.SMTP_HOST, 'mail.bigdrop.co.ke');
  assert.equal(parsed.SMTP_FROM, 'orders@bigdrop.co.ke');
  assert.equal(parsed.SMTP_PASS, 'p@ss word');
  assert.equal(parsed.ADMIN_EMAIL, 'globeflightke21@gmail.com');
});

test('applyEnvFile does not overwrite env that DirectAdmin already set', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bigdrop-env-'));
  const file = path.join(dir, '.env');
  fs.writeFileSync(file, 'SMTP_HOST=from-file\nSMTP_FROM=from-file@bigdrop.co.ke\n');
  const env = { SMTP_HOST: 'mail.bigdrop.co.ke' };
  assert.equal(applyEnvFile(file, env), true);
  assert.equal(env.SMTP_HOST, 'mail.bigdrop.co.ke');
  assert.equal(env.SMTP_FROM, 'from-file@bigdrop.co.ke');
  fs.rmSync(dir, { recursive: true, force: true });
});
