import { Resend } from 'resend';

function fromAddress() {
  return process.env.MAIL_FROM || 'Globeflight Kenya <cs@globeflight.co.ke>';
}

export function notifyAddress() {
  return process.env.MAIL_NOTIFY_TO || 'cs@globeflight.co.ke';
}

export function chatAlertAddresses() {
  const list = ['sam.maina@globeflight.co.ke', notifyAddress()];
  const seen = new Set();
  const addresses = [];
  for (const item of list) {
    const email = String(item || '').trim();
    const key = email.toLowerCase();
    if (!key.includes('@') || seen.has(key)) continue;
    seen.add(key);
    addresses.push(email);
  }
  return addresses;
}

export function liveChatAlertText(chat, message) {
  const lines = [
    'Someone is in the live chat now.',
    'Sign in to the admin dashboard and open Live chat. The assistant keeps replying until you are signed in.',
    '',
    `Name: ${oneLine(chat.visitorName, 'Not given')}`,
    `Email: ${oneLine(chat.visitorEmail, 'Not given')}`,
    `Phone: ${oneLine(chat.visitorPhone, 'Not given')}`,
  ];
  const wrote = String(message || '').trim();
  if (wrote) {
    lines.push('', 'They wrote:', wrote);
  }
  return lines.join('\n');
}

function oneLine(value, fallback) {
  const text = String(value || '').replace(/[\r\n]+/g, ' ').trim();
  return (text || fallback).slice(0, 140);
}

export function mailIsConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY || '').trim());
}

export async function sendMail({ to, subject, text }) {
  const addresses = (Array.isArray(to) ? to : [to])
    .map((item) => String(item || '').trim())
    .filter((item) => item.includes('@'));
  if (!addresses.length) return { sent: false, reason: 'no-address' };
  if (!mailIsConfigured()) return { sent: false, reason: 'not-configured' };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: addresses,
    subject: oneLine(subject, 'Globeflight Kenya'),
    text: String(text || ''),
  });
  if (error) return { sent: false, reason: error.message || 'send-failed' };
  return { sent: true };
}

export function replyEmailText(contact, replyMessage) {
  const name = oneLine(contact.name, 'there');
  return `Hello ${name},\n\n${replyMessage}\n\nGlobeflight Kenya\ncs@globeflight.co.ke\n+254 729 341 277\n`;
}

export function newMessageEmailText(contact) {
  return [
    'A new message arrived on the Globeflight Kenya website.',
    '',
    `From: ${oneLine(contact.name, 'Website visitor')}`,
    `Email: ${oneLine(contact.email, 'Not given')}`,
    `Phone: ${oneLine(contact.phone, 'Not given')}`,
    `Subject: ${oneLine(contact.subject, 'Website message')}`,
    '',
    String(contact.message || '').trim(),
    '',
    'Open Messages in the admin dashboard to reply.',
  ].join('\n');
}

