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
  const confirmed = confirmStk(id);
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
  const confirmed = confirmStk(stk.checkoutRequestId);
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

test('a released payment still cannot fund two orders at once', async () => {
  const reference = await paidCard(8000);
  assert.equal(reservePayment({ method: 'card', reference, amount: 8000, orderId: 'ord_a' }).ok, true);
  releasePayment(reference, 'ord_a');
  assert.equal(reservePayment({ method: 'card', reference, amount: 8000, orderId: 'ord_b' }).ok, true);
  const second = reservePayment({ method: 'card', reference, amount: 8000, orderId: 'ord_c' });
  assert.equal(second.status, 402);
  assert.match(second.error, /already used for another order/);
});
