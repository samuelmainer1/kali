import nodemailer from 'nodemailer';
import { sendSms } from './sms.js';
import { fillTemplate, DEFAULT_NOTIFY_TEMPLATES } from './commerce.js';

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function smtpPort() {
  return Number(process.env.SMTP_PORT || 465);
}

function smtpSecure() {
  if (process.env.SMTP_SECURE === 'true') return true;
  if (process.env.SMTP_SECURE === 'false') return false;
  return smtpPort() === 465;
}

function transporter() {
  if (!mailConfigured()) return null;
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = smtpPort();
  const secure = smtpSecure();
  const local = /^(localhost|127\.0\.0\.1)$/i.test(host);
  return nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS: !secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    tls: local
      ? { rejectUnauthorized: false }
      : { minVersion: 'TLSv1.2', servername: host },
  });
}

export async function sendMail({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM || 'orders@bigdrop.co.ke';
  const tx = transporter();
  if (!tx) {
    console.log(`[mail:simulated] to=${to} subject=${subject}`);
    return { ok: true, simulated: true, to, subject };
  }
  try {
    await tx.sendMail({ from, to, subject, text, html: html || `<p>${String(text || '').replace(/\n/g, '<br/>')}</p>` });
    return { ok: true, simulated: false, to, subject };
  } catch (err) {
    console.error(`Mail send failed (${err.code || 'SMTP'}): ${err.message}`);
    throw err;
  }
}

/** Who gets "something happened on the shop" mail. Comma-separate ADMIN_EMAIL. */
export function adminRecipients(site = {}) {
  const fromEnv = String(process.env.ADMIN_EMAIL || '')
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.includes('@'));
  if (fromEnv.length) return [...new Set(fromEnv)];
  const fallbacks = [site?.letterhead?.email, site?.notifyEmail, 'orders@bigdrop.co.ke', 'info@bigdrop.co.ke'];
  return [...new Set(fallbacks.map((s) => String(s || '').trim()).filter((s) => s.includes('@')))];
}

export async function notifyAdmin({ subject, text, site } = {}) {
  const recipients = adminRecipients(site);
  if (!recipients.length) return { ok: false, error: 'No admin email configured' };
  try {
    return await sendMail({ to: recipients.join(', '), subject, text });
  } catch (err) {
    console.error('Admin email failed:', err.message);
    return { ok: false, error: err.message };
  }
}

export async function sendWelcomeEmail(user) {
  const isVendor = user.role === 'vendor';
  const subject = isVendor
    ? 'We received your BigDrop vendor application'
    : 'Welcome to BigDrop Kenya';
  const text = isVendor
    ? `Hi ${user.name},\n\nThank you for applying to sell on BigDrop. Our team will review ${user.storeName || 'your store'} and email you when it is approved.\n\nBigDrop Kenya\nNextgen Mall, 3rd Floor, Suite 40.\norders@bigdrop.co.ke`
    : `Hi ${user.name},\n\nYour BigDrop account is ready. You can shop with M-Pesa.\n\nBigDrop Kenya\nNextgen Mall, 3rd Floor, Suite 40.\norders@bigdrop.co.ke`;
  try {
    return await sendMail({ to: user.email, subject, text });
  } catch (err) {
    console.error('Welcome email failed:', err.message);
    return { ok: false, error: err.message };
  }
}

export async function sendNewsletterIssue({ emails, subject, body }) {
  const results = [];
  for (const to of emails) {
    try {
      results.push({ to, ...(await sendMail({ to, subject, text: body })) });
    } catch (err) {
      results.push({ to, ok: false, error: err.message });
    }
  }
  return results;
}

function kes(n) {
  return `KSh ${Number(n || 0).toLocaleString('en-KE')}`;
}

export async function sendPurchaseNotifications(order, site = {}) {
  const templates = { ...DEFAULT_NOTIFY_TEMPLATES, ...(site.notifyTemplates || {}) };
  const vars = {
    name: order.customerName || 'Customer',
    orderNumber: order.orderNumber || '',
    trackingNumber: order.trackingNumber || '',
    total: kes(order.total),
  };
  const subject = fillTemplate(templates.emailSubject, vars);
  const emailBody = fillTemplate(templates.emailBody, vars);
  const smsBody = fillTemplate(templates.smsBody, vars);
  const results = { email: null, sms: null, admin: null };
  if (order.customerEmail) {
    try {
      results.email = await sendMail({ to: order.customerEmail, subject, text: emailBody });
    } catch (err) {
      console.error('Purchase email failed:', err.message);
      results.email = { ok: false, error: err.message };
    }
  }
  const itemLines = (order.items || [])
    .map((i) => `${i.qty || 1}× ${i.name || 'Item'}`)
    .join('\n');
  const adminText = [
    `New BigDrop order ${order.orderNumber || ''}`,
    `Customer: ${order.customerName || '—'}`,
    `Email: ${order.customerEmail || '—'}`,
    `Phone: ${order.customerPhone || '—'}`,
    `Total: ${kes(order.total)}`,
    `Payment: ${order.paymentMethod || '—'}`,
    `Tracking: ${order.trackingNumber || '—'}`,
    '',
    itemLines,
  ].join('\n');
  results.admin = await notifyAdmin({
    subject: `New BigDrop order ${order.orderNumber || ''}`.trim(),
    text: adminText,
    site,
  });
  if (order.customerPhone) {
    try {
      results.sms = await sendSms({ to: order.customerPhone, message: smsBody });
    } catch (err) {
      console.error('Purchase SMS failed:', err.message);
      results.sms = { ok: false, error: err.message };
    }
  }
  return results;
}

export async function sendVendorDecisionEmail(user, status) {
  if (!user?.email) return { ok: false, error: 'No vendor email' };
  const approved = status === 'approved';
  const subject = approved ? 'Your BigDrop store is approved' : 'Update on your BigDrop vendor application';
  const text = approved
    ? `Hi ${user.name},\n\n${user.storeName || 'Your store'} is approved. You can log in and list products.\n\nhttps://www.bigdrop.co.ke/login\n\nBigDrop Kenya`
    : `Hi ${user.name},\n\nYour vendor application for ${user.storeName || 'your store'} was not approved${user.reviewNote ? `: ${user.reviewNote}` : '.'}\n\nReply to this email if you have questions.\n\nBigDrop Kenya`;
  try {
    return await sendMail({ to: user.email, subject, text });
  } catch (err) {
    console.error('Vendor decision email failed:', err.message);
    return { ok: false, error: err.message };
  }
}
