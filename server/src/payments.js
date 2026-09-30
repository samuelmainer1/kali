import { nanoid } from 'nanoid';
import { readDb, updateDb } from './db.js';
import { mpesaCallbackURL, isPubliclyReachableCallback } from './runtimeConfig.js';

const stkPending = new Map();
const cardPending = new Map();
const MAX_TRACKED_PAYMENTS = 2000;

// ─── Payment record persistence ──────────────────────────
// Every payment attempt is mirrored into db.payments so in-flight payments
// survive a server restart: a live M-Pesa callback or the final order
// confirmation can still find its record after a redeploy.

function persistPaymentRecord(record) {
  try {
    updateDb((d) => {
      d.payments = d.payments || [];
      const idx = d.payments.findIndex((p) => p.id === record.id);
      if (idx >= 0) d.payments[idx] = { ...d.payments[idx], ...record };
      else d.payments.unshift(record);
      if (d.payments.length > MAX_TRACKED_PAYMENTS) d.payments.length = MAX_TRACKED_PAYMENTS;
    });
  } catch (err) {
    console.error('Payment record save failed:', err.message);
  }
}

function restoreRecord(id) {
  const dbRow = (readDb().payments || []).find((p) => p.id === id);
  if (!dbRow) return null;
  const row = { ...dbRow, fromDb: true };
  (dbRow.method === 'mpesa' ? stkPending : cardPending).set(id, row);
  return row;
}

/** Re-load unconsumed payment records after a restart. */
export function hydratePaymentsFromDb() {
  try {
    for (const p of readDb().payments || []) {
      if (p.consumedByOrderId) continue;
      const map = p.method === 'mpesa' ? stkPending : cardPending;
      if (!map.has(p.id)) map.set(p.id, { ...p, fromDb: true });
    }
    const total = stkPending.size + cardPending.size;
    if (total) console.log(`Payments: restored ${total} in-flight payment record(s) from db`);
  } catch (err) {
    console.error('Payment hydrate failed:', err.message);
  }
}

export function mpesaConfigured() {
  return Boolean(
    process.env.MPESA_CONSUMER_KEY &&
      process.env.MPESA_CONSUMER_SECRET &&
      process.env.MPESA_SHORTCODE &&
      process.env.MPESA_PASSKEY
  );
}

export function cardConfigured() {
  return Boolean(process.env.PAYSTACK_SECRET_KEY);
}

/** Buy Goods and Services till shown at checkout when Daraja keys are not set. */
export const DEFAULT_PAYBILL = '862294';

export function resolvePaybill() {
  const fromEnv = String(process.env.MPESA_SHORTCODE || '').trim();
  if (fromEnv) return fromEnv;
  try {
    const fromSite = String(readDb().site?.paybill || '').trim();
    if (fromSite) return fromSite;
  } catch {
    // Tests and first boot may not have a store yet.
  }
  return DEFAULT_PAYBILL;
}

export function paymentStatus() {
  return {
    mpesa: mpesaConfigured() ? 'live' : 'simulated',
    card: cardConfigured() ? 'live' : 'simulated',
    paybill: resolvePaybill(),
  };
}

function mpesaBase() {
  return process.env.MPESA_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length >= 12) return digits.slice(0, 12);
  if (digits.startsWith('0') && digits.length >= 10) return `254${digits.slice(1, 10)}`;
  if (digits.length === 9) return `254${digits}`;
  return digits;
}

async function mpesaToken() {
  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${key}:${secret}`).toString('base64');
  const res = await fetch(`${mpesaBase()}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(data.errorMessage || 'Could not get M-Pesa token');
  return data.access_token;
}

export async function startStk({ phone, amount }) {
  const msisdn = normalizePhone(phone);
  if (msisdn.length < 12) throw new Error('Enter a valid M-Pesa number');
  const kes = Math.round(Number(amount) || 0);
  if (kes < 1) throw new Error('Invalid amount');

  if (!mpesaConfigured()) {
    const checkoutRequestId = 'ws_SIM_' + nanoid(12);
    const record = {
      id: checkoutRequestId,
      method: 'mpesa',
      amount: kes,
      phone: msisdn,
      simulated: true,
      status: 'pending',
      receipt: 'MP' + nanoid(8).toUpperCase(),
      resultDesc: '',
      createdAt: Date.now(),
      confirmedAt: null,
      consumedByOrderId: null,
    };
    stkPending.set(checkoutRequestId, record);
    persistPaymentRecord(record);
    return {
      ok: true,
      checkoutRequestId,
      mode: 'simulated',
      message: 'Pay via M-Pesa STK push on your phone.',
    };
  }

  const timestamp = new Date()
    .toISOString()
    .replace(/[-:TZ.]/g, '')
    .slice(0, 14);
  const shortcode = process.env.MPESA_SHORTCODE;
  const password = Buffer.from(`${shortcode}${process.env.MPESA_PASSKEY}${timestamp}`).toString('base64');

  // Resolve and check the callback BEFORE spending a Daraja token on the request. An
  // unreachable CallBackURL still returns a CheckoutRequestID, so Safaricom would show
  // the customer a successful STK push, take their money and never confirm it here.
  // (This used to fall back to http://localhost:5000 — a port nothing listens on — which
  // made every live M-Pesa payment fail silently.) The boot-time guard in
  // runtimeConfig.js catches the misconfigured deploy; this catches a changed env.
  const callbackURL = mpesaCallbackURL();
  if (!isPubliclyReachableCallback(callbackURL)) {
    throw new Error(
      `M-Pesa callback URL is not publicly reachable over https (${callbackURL}). ` +
        'Set MPESA_CALLBACK_URL and PUBLIC_API_URL to your public https origin.'
    );
  }

  const token = await mpesaToken();

  const res = await fetch(`${mpesaBase()}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: kes,
      PartyA: msisdn,
      PartyB: shortcode,
      PhoneNumber: msisdn,
      CallBackURL: callbackURL,
      AccountReference: 'BIGDROP',
      TransactionDesc: 'BigDrop order',
    }),
  });
  const data = await res.json();
  const checkoutRequestId = data.CheckoutRequestID;
  if (!checkoutRequestId) {
    throw new Error(data.errorMessage || data.CustomerMessage || 'M-Pesa STK failed');
  }
  const record = {
    id: checkoutRequestId,
    method: 'mpesa',
    amount: kes,
    phone: msisdn,
    simulated: false,
    status: 'pending',
    receipt: '',
    resultDesc: '',
    createdAt: Date.now(),
    confirmedAt: null,
    consumedByOrderId: null,
  };
  stkPending.set(checkoutRequestId, record);
  persistPaymentRecord(record);
  return {
    ok: true,
    checkoutRequestId,
    mode: 'live',
    message: data.CustomerMessage || 'Check your phone and enter your M-Pesa PIN.',
  };
}

export function recordStkCallback(body) {
  const callback = body?.Body?.stkCallback || body?.stkCallback || {};
  const id = callback.CheckoutRequestID;
  if (!id || typeof callback.ResultCode !== 'number') {
    console.error('M-Pesa callback rejected: missing CheckoutRequestID or ResultCode');
    return;
  }
  const row = stkPending.get(id) || restoreRecord(id);
  if (!row) {
    console.error(`M-Pesa callback for unknown STK request ${id}`);
    return;
  }
  const ok = Number(callback.ResultCode) === 0;
  const items = callback.CallbackMetadata?.Item || [];
  const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;
  const next = {
    ...row,
    status: ok ? 'paid' : 'failed',
    receipt: receipt ? String(receipt) : row.receipt,
    resultDesc: String(callback.ResultDesc || ''),
    confirmedAt: ok ? Date.now() : row.confirmedAt,
  };
  stkPending.set(id, next);
  persistPaymentRecord(next);
}

export function confirmStk(checkoutRequestId) {
  const id = String(checkoutRequestId || '');
  const row = stkPending.get(id) || restoreRecord(id);
  if (!row) return { error: 'STK request not found. Send the prompt again.', status: 404 };
  if (row.status === 'failed') {
    return { ok: false, pending: false, message: row.resultDesc || 'Payment was cancelled.' };
  }
  if (row.status === 'pending') {
    if (row.simulated && Date.now() - row.createdAt >= 1200) {
      // Demo mode: auto-confirm after a short pause so the flow feels real.
      const next = { ...row, status: 'paid', confirmedAt: Date.now() };
      stkPending.set(id, next);
      persistPaymentRecord(next);
      return { ok: true, receipt: next.receipt, phone: next.phone, amount: next.amount, message: 'M-Pesa payment confirmed.' };
    }
    return { ok: false, pending: true, message: row.simulated ? 'Waiting for PIN confirmation…' : 'Waiting for M-Pesa PIN…' };
  }
  // status 'paid' — the record stays resolvable until an order consumes it.
  return { ok: true, receipt: row.receipt, phone: row.phone, amount: row.amount, message: 'M-Pesa payment confirmed.' };
}

export async function startCard({ amount, email }) {
  const kes = Math.round(Number(amount) || 0);
  const to = String(email || '').trim().toLowerCase();
  if (kes < 1) throw new Error('Invalid amount');
  if (!to.includes('@')) throw new Error('Email is required for card payment');

  if (!cardConfigured()) {
    const reference = 'card_sim_' + nanoid(10);
    const record = {
      id: reference,
      method: 'card',
      amount: kes,
      email: to,
      simulated: true,
      status: 'pending',
      receipt: 'CD' + nanoid(8).toUpperCase(),
      resultDesc: '',
      createdAt: Date.now(),
      confirmedAt: null,
      consumedByOrderId: null,
    };
    cardPending.set(reference, record);
    persistPaymentRecord(record);
    return {
      ok: true,
      reference,
      mode: 'simulated',
      message: 'Card payment recorded (demo). Add PAYSTACK_SECRET_KEY to charge live cards.',
    };
  }

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: to,
      amount: kes * 100,
      currency: 'KES',
      callback_url: process.env.PAYSTACK_CALLBACK_URL || undefined,
    }),
  });
  const data = await res.json();
  if (!data.status || !data.data?.reference) {
    throw new Error(data.message || 'Could not start card payment');
  }
  const record = {
    id: data.data.reference,
    method: 'card',
    amount: kes,
    email: to,
    simulated: false,
    status: 'pending',
    receipt: '',
    resultDesc: '',
    createdAt: Date.now(),
    confirmedAt: null,
    consumedByOrderId: null,
  };
  cardPending.set(record.id, record);
  persistPaymentRecord(record);
  return {
    ok: true,
    reference: data.data.reference,
    authorizationUrl: data.data.authorization_url,
    mode: 'live',
    message: 'Continue to the secure card page.',
  };
}

export async function confirmCard(reference) {
  const id = String(reference || '');
  const row = cardPending.get(id) || restoreRecord(id);
  if (row?.simulated) {
    if (row.status !== 'paid') {
      const next = { ...row, status: 'paid', confirmedAt: Date.now() };
      cardPending.set(id, next);
      persistPaymentRecord(next);
    }
    return { ok: true, receipt: cardPending.get(id).receipt, message: 'Card payment confirmed.' };
  }
  if (!cardConfigured()) {
    return { error: 'Card payment is not configured.', status: 400 };
  }
  if (!row) {
    return { error: 'Card payment session not found. Start the payment again.', status: 404 };
  }
  if (row.status === 'paid') {
    return { ok: true, receipt: row.receipt, message: 'Card payment confirmed.' };
  }
  const res = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` },
  });
  const data = await res.json();
  if (!data.status || data.data?.status !== 'success') {
    return { ok: false, pending: true, message: data.data?.gateway_response || 'Waiting for card payment…' };
  }
  const next = { ...row, status: 'paid', receipt: String(data.data.reference || id), confirmedAt: Date.now() };
  cardPending.set(id, next);
  persistPaymentRecord(next);
  return {
    ok: true,
    receipt: next.receipt,
    message: 'Card payment confirmed.',
  };
}

/**
 * Verify a completed payment and atomically reserve it for exactly one order.
 * Rejects unknown references, unconfirmed payments, underpayments and replays.
 * Runs synchronously inside POST /orders, so check-then-reserve is atomic
 * within the Node process.
 */
export function reservePayment({ method, reference, amount, orderId }) {
  const id = String(reference || '').trim();
  if (!id) {
    return { error: 'Complete the payment first — no payment reference was provided.', status: 402 };
  }
  if (method !== 'mpesa' && method !== 'card') {
    return { error: 'Unsupported payment method.', status: 400 };
  }
  const row = (method === 'mpesa' ? stkPending : cardPending).get(id) || restoreRecord(id);
  if (!row || row.method !== method) {
    return { error: 'No matching payment found for this checkout. Start the payment again.', status: 402 };
  }
  if (row.status === 'failed') {
    return { error: row.resultDesc || 'The payment failed or was cancelled.', status: 402 };
  }
  if (row.status !== 'paid') {
    return {
      error: 'Payment has not been confirmed yet. Approve the prompt on your phone, or start the payment again.',
      status: 402,
    };
  }
  if (row.consumedByOrderId && row.consumedByOrderId !== orderId) {
    return { error: 'This payment was already used for another order.', status: 402 };
  }
  const payable = Math.round(Number(amount) || 0);
  if (Number(row.amount) < payable) {
    return {
      error: `The confirmed payment (KES ${row.amount}) is less than the order total (KES ${payable}). Complete a payment for the full amount.`,
      status: 402,
    };
  }
  // Mark the payment as spent for this order (double-spend guard).
  let doubleConsumed = false;
  updateDb((d) => {
    d.payments = d.payments || [];
    const p = d.payments.find((x) => x.id === id);
    if (p?.consumedByOrderId && p.consumedByOrderId !== orderId) {
      doubleConsumed = true;
      return;
    }
    if (p) p.consumedByOrderId = orderId;
    else d.payments.unshift({ ...row, consumedByOrderId: orderId });
  });
  if (doubleConsumed) {
    return { error: 'This payment was already used for another order.', status: 402 };
  }
  row.consumedByOrderId = orderId;
  (method === 'mpesa' ? stkPending : cardPending).set(id, row);
  return { ok: true, record: { ...row } };
}

/** Give a reserved payment back if the order itself could not be created. */
export function releasePayment(reference, orderId) {
  const id = String(reference || '').trim();
  if (!id || !orderId) return;
  const row = stkPending.get(id) || cardPending.get(id);
  if (row && row.consumedByOrderId === orderId) {
    delete row.consumedByOrderId;
    (row.method === 'mpesa' ? stkPending : cardPending).set(id, row);
  }
  try {
    updateDb((d) => {
      d.payments = d.payments || [];
      const p = d.payments.find((x) => x.id === id);
      if (p && p.consumedByOrderId === orderId) p.consumedByOrderId = null;
    });
  } catch {
    // best effort
  }
}
