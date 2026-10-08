// ─── Payment security regression suite ─────────────────────────────────────
// Covers the hardened payment layer: server-side verification, single-use
// references (no double-spend), underpayment rejection, and the demo STK/card
// paths. Everything runs offline — no Daraja or Paystack keys are set, so the
// code takes its `simulated` branch and never calls a live gateway.
//
// The real store is never touched: DATA_DIR and UPLOADS_DIR are pointed at a
// throwaway temp folder BEFORE ./db.js is imported (db.js resolves both at
// import time), so server/data/db.json is not read or written.
//
// Run everything with `npm test` (the root script), or one file directly:
//   node --test server/src/payments.test.js
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import os from 'os';
import path from 'path';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'bigdrop-payments-'));
process.env.DATA_DIR = tmp;
process.env.UPLOADS_DIR = path.join(tmp, 'uploads');
process.env.MPESA_CONSUMER_KEY = '';
process.env.MPESA_CONSUMER_SECRET = '';
process.env.MPESA_PASSKEY = '';
delete process.env.MPESA_SHORTCODE;
delete process.env.PAYSTACK_SECRET_KEY;

const {
  startStk,
  confirmStk,
  recordStkCallback,
  startCard,
  confirmCard,
  reservePayment,
  releasePayment,
  paymentStatus,
  mpesaStoreNumber,
  mpesaTillNumber,
} = await import('./payments.js');

const EMAIL = 'shopper@example.com';

// The throwaway data store never outlives the run.
after(() => fs.rmSync(tmp, { recursive: true, force: true }));

/** Run a full demo card payment and hand back its reference. */
async function paidCard(amount) {
  const init = await startCard({ amount, email: EMAIL });
  assert.equal(init.mode, 'simulated', 'card gateway should be in demo mode');
  const done = await confirmCard(init.reference);
  assert.equal(done.ok, true, 'demo card payment should confirm');
  return init.reference;
}

/** Run a demo STK push and mark it paid through the callback, as Safaricom would. */
function paidStk(amount, phone = '0712345678') {
  return startStk({ phone, amount }).then((stk) => {
    recordStkCallback({
      Body: {
        stkCallback: {
          CheckoutRequestID: stk.checkoutRequestId,
          ResultCode: 0,
          ResultDesc: 'The service request is processed successfully.',
          CallbackMetadata: { Item: [{ Name: 'MpesaReceiptNumber', Value: 'TST1234567' }] },
        },
      },
    });
    return stk.checkoutRequestId;
  });
}

test('gateway status reports simulated when no live keys are configured', () => {
  const status = paymentStatus();
  assert.equal(status.mpesa, 'simulated');
  assert.equal(status.card, 'simulated');
  assert.equal(status.paybill, '862294');
});

test('card checkout rejects an invalid amount and a missing email', async () => {
  await assert.rejects(() => startCard({ amount: 0, email: EMAIL }), /Invalid amount/);
  await assert.rejects(() => startCard({ amount: 500, email: 'not-an-email' }), /Email is required/);
});

test('M-Pesa checkout rejects a phone number that is too short', async () => {
  await assert.rejects(() => startStk({ phone: '123', amount: 500 }), /valid M-Pesa number/);
});

test('M-Pesa normalises a local number to 2547xxxxxxxx', async () => {
  const id = await paidStk(1500, '0712345678');
  const confirmed = await confirmStk(id);
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.phone, '254712345678');
  assert.equal(confirmed.amount, 1500);
});

test('a failed M-Pesa result can never be reserved for an order', async () => {
  const stk = await startStk({ phone: '0722000111', amount: 900 });
  recordStkCallback({
    Body: {
      stkCallback: {
        CheckoutRequestID: stk.checkoutRequestId,
        ResultCode: 1032,
        ResultDesc: 'Request cancelled by user',
      },
    },
  });
  const confirmed = await confirmStk(stk.checkoutRequestId);
  assert.equal(confirmed.ok, false);
  assert.equal(confirmed.pending, false);

  const reserved = reservePayment({
    method: 'mpesa',
    reference: stk.checkoutRequestId,
    amount: 900,
    orderId: 'ord_failed',
  });
  assert.equal(reserved.status, 402);
  assert.match(reserved.error, /cancelled/i);
});

test('an unconfirmed payment cannot be reserved', async () => {
  const init = await startCard({ amount: 4000, email: EMAIL });
  const reserved = reservePayment({
    method: 'card',
    reference: init.reference,
    amount: 4000,
    orderId: 'ord_pending',
  });
  assert.equal(reserved.status, 402);
  assert.match(reserved.error, /has not been confirmed yet/);
});

test('a confirmed payment is reserved once and cannot be replayed', async () => {
  const reference = await paidCard(5000);
  const first = reservePayment({ method: 'card', reference, amount: 5000, orderId: 'ord_first' });
  assert.equal(first.ok, true);
  assert.equal(first.record.consumedByOrderId, 'ord_first');

  const replay = reservePayment({ method: 'card', reference, amount: 5000, orderId: 'ord_second' });
  assert.equal(replay.status, 402);
  assert.match(replay.error, /already used for another order/);
});

test('re-reserving for the same order is idempotent (retry-safe)', async () => {
  const reference = await paidCard(3000);
  assert.equal(reservePayment({ method: 'card', reference, amount: 3000, orderId: 'ord_same' }).ok, true);
  assert.equal(reservePayment({ method: 'card', reference, amount: 3000, orderId: 'ord_same' }).ok, true);
});

test('an underpayment is rejected even when confirmed', async () => {
  const reference = await paidCard(1000);
  const reserved = reservePayment({ method: 'card', reference, amount: 6000, orderId: 'ord_under' });
  assert.equal(reserved.status, 402);
  assert.match(reserved.error, /less than the order total/);
});

test('an unknown, missing or wrong-method reference is rejected', async () => {
  const unknown = reservePayment({ method: 'card', reference: 'card_sim_does-not-exist', amount: 10, orderId: 'o1' });
  assert.equal(unknown.status, 402);
  assert.match(unknown.error, /No matching payment found/);

  const missing = reservePayment({ method: 'card', reference: '   ', amount: 10, orderId: 'o2' });
  assert.equal(missing.status, 402);
  assert.match(missing.error, /no payment reference was provided/);

  const unsupported = reservePayment({ method: 'cash', reference: 'x', amount: 10, orderId: 'o3' });
  assert.equal(unsupported.status, 400);
  assert.match(unsupported.error, /Unsupported payment method/);

  const card = await paidCard(2500);
  const crossMethod = reservePayment({ method: 'mpesa', reference: card, amount: 2500, orderId: 'o4' });
  assert.equal(crossMethod.status, 402);
  assert.match(crossMethod.error, /No matching payment found/);
});

test('releasing a reservation frees the reference for a new order', async () => {
  // Mirrors the order route's oversell path: the atomic write aborts, so the
  // payment must stop counting as spent or the shopper loses their money.
  const reference = await paidStk(1200, '0733111222');
  assert.equal(reservePayment({ method: 'mpesa', reference, amount: 1200, orderId: 'ord_abort' }).ok, true);

  const blocked = reservePayment({ method: 'mpesa', reference, amount: 1200, orderId: 'ord_retry' });
  assert.equal(blocked.status, 402);

  releasePayment(reference, 'ord_abort');

  const retried = reservePayment({ method: 'mpesa', reference, amount: 1200, orderId: 'ord_retry' });
  assert.equal(retried.ok, true);
  assert.equal(retried.record.consumedByOrderId, 'ord_retry');
});

function withLiveMpesaEnv(t) {
  const prev = {
    MPESA_CONSUMER_KEY: process.env.MPESA_CONSUMER_KEY,
    MPESA_CONSUMER_SECRET: process.env.MPESA_CONSUMER_SECRET,
    MPESA_PASSKEY: process.env.MPESA_PASSKEY,
    MPESA_SHORTCODE: process.env.MPESA_SHORTCODE,
    MPESA_STORE_NUMBER: process.env.MPESA_STORE_NUMBER,
    MPESA_CALLBACK_URL: process.env.MPESA_CALLBACK_URL,
    MPESA_ENV: process.env.MPESA_ENV,
    MPESA_STK_QUERY_INTERVAL_MS: process.env.MPESA_STK_QUERY_INTERVAL_MS,
  };
  process.env.MPESA_CONSUMER_KEY = 'key';
  process.env.MPESA_CONSUMER_SECRET = 'secret';
  process.env.MPESA_PASSKEY = 'pass';
  process.env.MPESA_SHORTCODE = '862294';
  process.env.MPESA_CALLBACK_URL = 'https://www.bigdrop.co.ke/api/payments/mpesa/callback';
  process.env.MPESA_ENV = 'production';
  process.env.MPESA_STK_QUERY_INTERVAL_MS = '0';
  t.after(() => {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });
}

function mockDaraja({ queryBodies, checkoutRequestId = 'ws_CO_QUERY_1' }) {
  const originalFetch = globalThis.fetch;
  const queryCalls = [];
  globalThis.fetch = async (url, opts) => {
    const u = String(url);
    if (u.includes('/oauth/')) return { json: async () => ({ access_token: 'tok' }) };
    if (u.includes('/stkpush/v1/processrequest')) {
      return {
        json: async () => ({
          CheckoutRequestID: checkoutRequestId,
          CustomerMessage: 'Success. Request accepted for processing',
        }),
      };
    }
    if (u.includes('/stkpushquery/v1/query')) {
      queryCalls.push(opts?.body);
      const body = queryBodies[Math.min(queryCalls.length - 1, queryBodies.length - 1)];
      return { json: async () => body };
    }
    throw new Error('unexpected fetch ' + u);
  };
  return {
    queryCalls,
    restore() {
      globalThis.fetch = originalFetch;
    },
  };
}

test('live STK confirm queries Daraja when the callback never arrives', async (t) => {
  withLiveMpesaEnv(t);
  const daraja = mockDaraja({
    queryBodies: [
      { errorCode: '500.001.1001', errorMessage: 'The transaction is being processed' },
      { ResultCode: '0', ResultDesc: 'The service request is processed successfully.' },
    ],
  });
  t.after(() => daraja.restore());

  const stk = await startStk({ phone: '0712345678', amount: 750 });
  assert.equal(stk.mode, 'live');
  assert.equal(stk.checkoutRequestId, 'ws_CO_QUERY_1');

  const waiting = await confirmStk(stk.checkoutRequestId);
  assert.equal(waiting.ok, false);
  assert.equal(waiting.pending, true);
  assert.equal(daraja.queryCalls.length, 1);

  const paid = await confirmStk(stk.checkoutRequestId);
  assert.equal(paid.ok, true);
  assert.equal(paid.receipt, 'ws_CO_QUERY_1');
  assert.equal(paid.amount, 750);
  assert.equal(daraja.queryCalls.length, 2);

  const reserved = reservePayment({
    method: 'mpesa',
    reference: stk.checkoutRequestId,
    amount: 750,
    orderId: 'ord_query',
  });
  assert.equal(reserved.ok, true);
});

test('live STK confirm surfaces a cancelled PIN from Daraja query', async (t) => {
  withLiveMpesaEnv(t);
  const daraja = mockDaraja({
    checkoutRequestId: 'ws_CO_CANCEL_1',
    queryBodies: [{ ResultCode: 1032, ResultDesc: 'Request cancelled by user' }],
  });
  t.after(() => daraja.restore());

  const stk = await startStk({ phone: '0722000111', amount: 400 });
  const confirmed = await confirmStk(stk.checkoutRequestId);
  assert.equal(confirmed.ok, false);
  assert.equal(confirmed.pending, false);
  assert.match(confirmed.message, /cancelled/i);

  const reserved = reservePayment({
    method: 'mpesa',
    reference: stk.checkoutRequestId,
    amount: 400,
    orderId: 'ord_query_cancel',
  });
  assert.equal(reserved.status, 402);
});

test('store number falls back to the till when MPESA_STORE_NUMBER is unset', () => {
  const prevStore = process.env.MPESA_STORE_NUMBER;
  const prevTill = process.env.MPESA_SHORTCODE;
  process.env.MPESA_SHORTCODE = '862294';
  delete process.env.MPESA_STORE_NUMBER;
  assert.equal(mpesaStoreNumber(), '862294');
  assert.equal(mpesaTillNumber(), '862294');
  process.env.MPESA_STORE_NUMBER = '5533221';
  assert.equal(mpesaStoreNumber(), '5533221');
  assert.equal(mpesaTillNumber(), '862294');
  if (prevStore === undefined) delete process.env.MPESA_STORE_NUMBER;
  else process.env.MPESA_STORE_NUMBER = prevStore;
  if (prevTill === undefined) delete process.env.MPESA_SHORTCODE;
  else process.env.MPESA_SHORTCODE = prevTill;
});

test('Buy Goods STK uses the store number as BusinessShortCode and the till as PartyB', async (t) => {
  withLiveMpesaEnv(t);
  process.env.MPESA_STORE_NUMBER = '5533221';
  let stkBody;
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, opts) => {
    const u = String(url);
    if (u.includes('/oauth/')) return { json: async () => ({ access_token: 'tok' }) };
    if (u.includes('/stkpush/v1/processrequest')) {
      stkBody = JSON.parse(opts.body);
      return { json: async () => ({ CheckoutRequestID: 'ws_CO_TILL_1', CustomerMessage: 'Success' }) };
    }
    throw new Error('unexpected fetch ' + u);
  };
  t.after(() => {
    globalThis.fetch = originalFetch;
  });

  const stk = await startStk({ phone: '0712345678', amount: 100 });
  assert.equal(stk.checkoutRequestId, 'ws_CO_TILL_1');
  assert.equal(stkBody.TransactionType, 'CustomerBuyGoodsOnline');
  assert.equal(stkBody.BusinessShortCode, '5533221');
  assert.equal(stkBody.PartyB, '862294');
  const decoded = Buffer.from(stkBody.Password, 'base64').toString();
  assert.ok(decoded.startsWith('5533221'), decoded);
  assert.equal(decoded.includes('862294'), false);
});

test('a released payment still cannot fund two orders at once', async () => {
  const reference = await paidCard(8000);
  assert.equal(reservePayment({ method: 'card', reference, amount: 8000, orderId: 'ord_a' }).ok, true);
  releasePayment(reference, 'ord_a');
  assert.equal(reservePayment({ method: 'card', reference, amount: 8000, orderId: 'ord_b' }).ok, true);
  const second = reservePayment({ method: 'card', reference, amount: 8000, orderId: 'ord_c' });
  assert.equal(second.status, 402);
  assert.match(second.error, /already used for another order/);
});
