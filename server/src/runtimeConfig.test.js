import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRuntimeConfig, mpesaCallbackURL, isPubliclyReachableCallback } from './runtimeConfig.js';

test('production requires a non-default JWT secret', () => {
  assert.throws(
    () => validateRuntimeConfig({ NODE_ENV: 'production', JWT_SECRET: 'change-me-in-production' }),
    /JWT_SECRET/
  );
});

test('development accepts the local default secret', () => {
  assert.doesNotThrow(() => validateRuntimeConfig({ NODE_ENV: 'development', JWT_SECRET: 'bigdrop-dev-secret-change-me' }));
});

// ─── M-Pesa callback reachability ─────────────────────────────────────────
// Safaricom POSTs the STK result to this URL from its own servers. If it cannot get
// there, the customer is charged and the order is never created — silently, because the
// STK push itself reports success. The bug these lock down: with neither MPESA_CALLBACK_URL
// nor PUBLIC_API_URL set, the old fallback handed Safaricom http://localhost:5000 while
// the API actually serves on PORT=5001, so every live payment silently failed.

const SECRET = 'f3a91c7d5e2b48a6b0d1c9e7a4f2b8d6c1a3e5f709b2d4c6a8e0f2b4d6c8a0e2f4';
const MPESA_READY = {
  MPESA_CONSUMER_KEY: 'key',
  MPESA_CONSUMER_SECRET: 'secret',
  MPESA_SHORTCODE: '862294',
  MPESA_PASSKEY: 'passkey',
};

test('the callback falls back to the port the API actually serves on, not 5000', () => {
  assert.equal(mpesaCallbackURL({ PORT: '5001' }), 'http://localhost:5001/api/payments/mpesa/callback');
  assert.equal(mpesaCallbackURL({}), 'http://localhost:5001/api/payments/mpesa/callback');
  assert.equal(mpesaCallbackURL({ PORT: '8080' }), 'http://localhost:8080/api/payments/mpesa/callback');
});

test('MPESA_CALLBACK_URL wins, and a trailing slash on PUBLIC_API_URL is trimmed', () => {
  assert.equal(
    mpesaCallbackURL({
      MPESA_CALLBACK_URL: 'https://www.bigdrop.co.ke/api/payments/mpesa/callback',
      PUBLIC_API_URL: 'https://ignored.example',
    }),
    'https://www.bigdrop.co.ke/api/payments/mpesa/callback'
  );
  assert.equal(mpesaCallbackURL({ PUBLIC_API_URL: 'https://www.bigdrop.co.ke/' }), 'https://www.bigdrop.co.ke/api/payments/mpesa/callback');
});

test('a configured M-Pesa integration with an unreachable callback refuses to boot', () => {
  const unreachable = /callback URL is not publicly reachable/;
  // No callback or public URL set at all — the exact regression.
  assert.throws(() => validateRuntimeConfig({ NODE_ENV: 'production', JWT_SECRET: SECRET, ...MPESA_READY }), unreachable);
  // And the value the old fallback used to build.
  assert.throws(
    () => validateRuntimeConfig({ NODE_ENV: 'production', JWT_SECRET: SECRET, ...MPESA_READY, PUBLIC_API_URL: 'http://localhost:5000' }),
    unreachable
  );
  assert.throws(
    () => validateRuntimeConfig({ NODE_ENV: 'production', JWT_SECRET: SECRET, ...MPESA_READY, MPESA_CALLBACK_URL: 'https://192.168.1.10/cb' }),
    unreachable
  );
});

test('a public https callback is accepted in production', () => {
  assert.doesNotThrow(() =>
    validateRuntimeConfig({
      NODE_ENV: 'production',
      JWT_SECRET: SECRET,
      ...MPESA_READY,
      MPESA_CALLBACK_URL: 'https://www.bigdrop.co.ke/api/payments/mpesa/callback',
    })
  );
});

test('the callback guard stays quiet in demo mode, where no callback is ever sent', () => {
  assert.doesNotThrow(() => validateRuntimeConfig({ NODE_ENV: 'production', JWT_SECRET: SECRET }));
});

test('only a public https host counts as reachable by Safaricom', () => {
  for (const ok of ['https://www.bigdrop.co.ke/api/payments/mpesa/callback', 'https://shop.bigdrop.co.ke/cb']) {
    assert.equal(isPubliclyReachableCallback(ok), true, ok);
  }
  for (const bad of [
    'http://www.bigdrop.co.ke/cb',      // plain http
    'https://localhost/cb',             // loopback by name
    'https://127.0.0.1/cb',             // loopback by address
    'https://10.0.0.5/cb',              // private A
    'https://192.168.1.10/cb',          // private C
    'https://172.20.0.4/cb',            // private B
    'https://169.254.169.254/cb',       // link-local / cloud metadata
    'https://0.0.0.0/cb',               // wildcard
    'https://[::1]/cb',                 // IPv6 loopback
    'ftp://example.com/cb',             // wrong scheme
    'not a url',
    '',
  ]) {
    assert.equal(isPubliclyReachableCallback(bad), false, bad);
  }
});

