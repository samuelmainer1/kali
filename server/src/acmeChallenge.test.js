import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { acmeWebroots, readAcmeChallenge } from './acmeChallenge.js';

test('DirectAdmin public_html is one of the ACME webroots', () => {
  const roots = acmeWebroots({ HOME: '/home/bigdropc' }, '/home/bigdropc/app');
  assert.ok(roots.some((r) => r.endsWith(path.join('domains', 'bigdrop.co.ke', 'public_html'))));
  assert.ok(roots.includes(path.join('/home/bigdropc/app', 'public')));
});

test('an ACME token file is read from the DirectAdmin webroot', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bigdrop-acme-'));
  const webroot = path.join(tmp, 'domains', 'bigdrop.co.ke', 'public_html');
  const dir = path.join(webroot, '.well-known', 'acme-challenge');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'token-abc_123'), 'token-abc_123.thumbprint\n');

  const body = readAcmeChallenge('token-abc_123', { HOME: tmp }, path.join(tmp, 'app'));
  assert.equal(body.trim(), 'token-abc_123.thumbprint');

  assert.equal(readAcmeChallenge('../etc/passwd', { HOME: tmp }, path.join(tmp, 'app')), null);
  assert.equal(readAcmeChallenge('missing', { HOME: tmp }, path.join(tmp, 'app')), null);

  fs.rmSync(tmp, { recursive: true, force: true });
});
