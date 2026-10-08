// ─── API security regression suite (integration) ───────────────────────────
// Boots the real Express app as a child process and exercises the guards that
// protect money and stock, because those live inside route handlers that are
// not exported for unit testing:
//   • per-account brute-force lockout (5 failures → 10 minute lock)
//   • vendor approval + product moderation gates
//   • single-use payment references end to end (pay → order → replay rejected)
//   • underpayment rejection, oversell rejection, COD flag enforcement
//
// It is fully isolated: DATA_DIR/UPLOADS_DIR point at a temp folder (the app
// seeds itself from server/data/seed.json — 226 demo products), the port is
// random, and M-Pesa/Paystack keys are blanked so every gateway stays in demo
// mode. server/data/db.json and server/uploads are never opened.
//
// This project has no `npm test` script yet — run the file directly:
//   node --test server/src/security.test.js
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const serverDir = path.resolve(here, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bigdrop-api-'));
const PORT = 3400 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
const DEMO_PASSWORD = 'password123';

let child = null;
let logs = '';
let customerToken = '';
let pendingVendorToken = '';
let approvedVendorToken = '';

async function api(pathname, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${BASE}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // non-JSON (e.g. an HTML error page) — keep the raw text for the assertion message
  }
  return { status: res.status, json, text };
}

async function login(email, password = DEMO_PASSWORD) {
  return api('/api/auth/login', { method: 'POST', body: { email, password } });
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`API exited during boot:\n${logs}`);
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      // not listening yet
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error(`API did not start within 30s:\n${logs}`);
}

/** Products the public storefront can see (approved + not hidden). */
async function visibleProducts(cacheBust = '') {
  const res = await api(`/api/products${cacheBust}`);
  assert.equal(res.status, 200);
  return res.json.products;
}

function orderBody(product, qty, paymentReference) {
  return {
    items: [{ productId: product.id, qty }],
    shippingAddress: { line1: 'NextGen Mall', city: 'Nairobi', county: 'Nairobi', phone: '0722000000' },
    wantDelivery: true,
    paymentMethod: 'card',
    paymentReference,
  };
}

before(async () => {
  child = spawn(process.execPath, ['src/index.js'], {
    cwd: serverDir,
    env: {
      ...process.env,
      PORT: String(PORT),
      DATA_DIR: tmp,
      UPLOADS_DIR: path.join(tmp, 'uploads'),
      NODE_ENV: 'development',
      JWT_SECRET: 'integration-test-secret-not-for-production',
      CLIENT_ORIGIN: 'http://localhost:5173',
      // Blank every gateway so nothing can reach Safaricom or Paystack.
      MPESA_CONSUMER_KEY: '',
      MPESA_CONSUMER_SECRET: '',
      MPESA_PASSKEY: '',
      MPESA_SHORTCODE: '',
      MPESA_CALLBACK_URL: '',
      PAYSTACK_SECRET_KEY: '',
      PAYSTACK_CALLBACK_URL: '',
      TRUST_PROXY: '',
      PHASE_NOINDEX: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', (chunk) => {
    logs += chunk;
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk;
  });
  await waitForServer();

  // Tokens are fetched once: /api/auth is rate limited to 20 requests/minute.
  const customer = await login('customer@bigdrop.co.ke');
  assert.equal(customer.status, 200, `customer login failed: ${customer.text}`);
  customerToken = customer.json.token;

  const pending = await login('pending@bigdrop.co.ke');
  assert.equal(pending.status, 200, `pending vendor login failed: ${pending.text}`);
  pendingVendorToken = pending.json.token;

  const approved = await login('beauty@bigdrop.co.ke');
  assert.equal(approved.status, 200, `vendor login failed: ${approved.text}`);
  approvedVendorToken = approved.json.token;
});

after(() => {
  if (child && child.exitCode === null) child.kill();
  fs.rmSync(tmp, { recursive: true, force: true });
});

test('the app boots with every gateway in demo mode', async () => {
  const health = await api('/health');
  assert.equal(health.status, 200);
  assert.equal(health.json.ok, true);

  const payments = await api('/api/payments/status');
  assert.equal(payments.json.mpesa, 'simulated', 'no live M-Pesa keys may be in play');
  assert.equal(payments.json.card, 'simulated', 'no live Paystack key may be in play');
});

test('security headers are present on API responses', async () => {
  const res = await fetch(`${BASE}/api/health`);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(res.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
});

test('signed-in session checks are not blocked by the login burst limit', async () => {
  for (let i = 0; i < 25; i += 1) {
    const res = await api('/api/auth/me', { token: customerToken });
    assert.equal(res.status, 200, `GET /auth/me #${i + 1} should not be rate-limited: ${res.text}`);
  }
});

test('an account is locked out after 5 failed logins', async () => {
  const target = 'chandaria@bigdrop.co.ke';
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const res = await login(target, 'definitely-the-wrong-password');
    assert.equal(res.status, 401, `attempt ${attempt} should be a plain rejection`);
    assert.match(res.json.error, /Invalid email or password/);
  }
  // The sixth attempt is refused even with the CORRECT password — that is the lockout.
  const locked = await login(target);
  assert.equal(locked.status, 429);
  assert.match(locked.json.error, /Too many failed attempts/);
});

test('a vendor awaiting approval cannot list products', async () => {
  const res = await api('/api/products', {
    method: 'POST',
    token: pendingVendorToken,
    body: { name: 'Sneaky Pending Item', description: 'Should never go live', price: 100, categoryId: 'cat_1' },
  });
  assert.equal(res.status, 403, res.text);
  assert.match(res.json.error, /pending admin approval/);
});

test('a shopper account cannot list products', async () => {
  const res = await api('/api/products', {
    method: 'POST',
    token: customerToken,
    body: { name: 'Shopper Item', description: 'Not allowed', price: 100, categoryId: 'cat_1' },
  });
  assert.equal(res.status, 403, res.text);
  assert.match(res.json.error, /Insufficient permissions/);
});

test('an approved vendor listing is moderated (pending, not publicly visible)', async () => {
  const name = `Moderation Test Item ${Date.now()}`;
  const created = await api('/api/products', {
    method: 'POST',
    token: approvedVendorToken,
    body: { name, description: 'Awaiting admin approval.', price: 1500, stock: 4, categoryId: 'cat_1' },
  });
  assert.equal(created.status, 201, created.text);
  assert.equal(created.json.product.status, 'pending', 'vendor listings must not auto-publish');

  const publicList = await api(`/api/products?q=${encodeURIComponent(name)}`);
  assert.equal(publicList.status, 200);
  assert.equal(publicList.json.count, 0, 'a pending listing must not reach shoppers');
});

test('a payment reference funds exactly one order', async () => {
  const products = await visibleProducts();
  const product = products.find((p) => p.stock >= 2);
  assert.ok(product, 'the demo catalogue should have a product with stock to sell');

  const init = await api('/api/payments/card/init', {
    method: 'POST',
    body: { amount: 250_000, email: 'integration@example.com' },
  });
  assert.equal(init.status, 200, init.text);
  assert.equal(init.json.mode, 'simulated');
  const reference = init.json.reference;

  const confirmed = await api('/api/payments/card/confirm', { method: 'POST', body: { reference } });
  assert.equal(confirmed.json.ok, true, confirmed.text);

  const order = await api('/api/orders', { method: 'POST', token: customerToken, body: orderBody(product, 1, reference) });
  assert.equal(order.status, 201, order.text);
  assert.equal(order.json.order.paymentMethod, 'card');
  assert.equal(order.json.order.paymentStatus, 'paid');
  assert.equal(order.json.order.paymentRef, reference);
  assert.ok(order.json.order.total <= 250_000);

  // Replaying the same reference for a second order must fail.
  const replay = await api('/api/orders', { method: 'POST', token: customerToken, body: orderBody(product, 1, reference) });
  assert.equal(replay.status, 402, replay.text);
  assert.match(replay.json.error, /already used for another order/);

  // …and exactly one unit left the shelf.
  const after = (await visibleProducts(`?after=${Date.now()}`)).find((p) => p.id === product.id);
  assert.equal(after.stock, product.stock - 1, 'only the first order may deduct stock');
});

test('an underpaid reference cannot create an order', async () => {
  const products = await visibleProducts();
  const product = products.find((p) => p.stock >= 1);

  const init = await api('/api/payments/card/init', { method: 'POST', body: { amount: 1, email: 'underpaid@example.com' } });
  const reference = init.json.reference;
  await api('/api/payments/card/confirm', { method: 'POST', body: { reference } });

  const order = await api('/api/orders', { method: 'POST', token: customerToken, body: orderBody(product, 1, reference) });
  assert.equal(order.status, 402, order.text);
  assert.match(order.json.error, /less than the order total/);
});

test('an order without a payment reference is refused', async () => {
  const products = await visibleProducts();
  const product = products.find((p) => p.stock >= 1);
  const order = await api('/api/orders', { method: 'POST', token: customerToken, body: orderBody(product, 1, '') });
  assert.equal(order.status, 402, order.text);
  assert.match(order.json.error, /no payment reference was provided/);
});

test('ordering more than the available stock is refused', async () => {
  const products = await visibleProducts();
  const scarce = products.find((p) => p.stock >= 1 && p.stock <= 10) || products.find((p) => p.stock >= 1);
  const order = await api('/api/orders', {
    method: 'POST',
    token: customerToken,
    body: { ...orderBody(scarce, scarce.stock + 1, ''), paymentMethod: 'mpesa' },
  });
  assert.equal(order.status, 400, order.text);
  assert.match(order.json.error, /Insufficient stock/);
});

test('cash on delivery follows the store setting', async () => {
  const site = await api('/api/site');
  const codEnabled = site.json.site?.payments?.codEnabled === true;
  const products = await visibleProducts();
  const product = products.find((p) => p.stock >= 1);
  const res = await api('/api/orders', {
    method: 'POST',
    token: customerToken,
    body: { ...orderBody(product, 1, ''), paymentMethod: 'cod' },
  });
  if (codEnabled) {
    assert.equal(res.status, 201, res.text);
  } else {
    assert.equal(res.status, 400, res.text);
    assert.match(res.json.error, /not offered/);
  }
});
