import nodemailer from 'nodemailer';
import { sendSms } from './sms.js';
import { fillTemplate, DEFAULT_NOTIFY_TEMPLATES } from './commerce.js';

export function mailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

function transporter() {
  if (!mailConfigured()) return null;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS || '' }
      : undefined,
  });
}

export async function sendMail({ to, subject, text, html }) {
  const from = process.env.SMTP_FROM || 'orders@bigdrop.co.ke';
  const tx = transporter();
  if (!tx) {
    console.log(`[mail:simulated] to=${to} subject=${subject}`);
    return { ok: true, simulated: true };
  }
  await tx.sendMail({ from, to, subject, text, html: html || `<p>${text}</p>` });
  return { ok: true, simulated: false };
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
  const adminTo =
    (Array.isArray(site.emails) ? site.emails : []).find((e) => /orders@/i.test(String(e))) ||
    site?.letterhead?.email ||
    'orders@bigdrop.co.ke';
  const itemLines = (order.items || [])
    .map((i) => `${i.qty || 1}× ${i.name || 'Item'}`)
    .join('\n');
  const adminText = [
    `New BigDrop order ${order.orderNumber || ''}`,
    `Customer: ${order.customerName || '—'}`,
    `Email: ${order.customerEmail || '—'}`,
    `Phone: ${order.customerPhone || '—'}`,
    `Total: ${kes(order.total)}`,
    `Tracking: ${order.trackingNumber || '—'}`,
    '',
    itemLines,
  ].join('\n');
  try {
    results.admin = await sendMail({
      to: adminTo,
      subject: `New BigDrop order ${order.orderNumber || ''}`.trim(),
      text: adminText,
    });
  } catch (err) {
    console.error('Admin purchase email failed:', err.message);
    results.admin = { ok: false, error: err.message };
  }
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
