import { Resend } from 'resend';

function fromAddress() {
  return process.env.MAIL_FROM || 'Globeflight Kenya <cs@globeflight.co.ke>';
}

export function notifyAddress() {
  return process.env.MAIL_NOTIFY_TO || 'cs@globeflight.co.ke';
}

function oneLine(value, fallback) {
  const text = String(value || '').replace(/[\r\n]+/g, ' ').trim();
  return (text || fallback).slice(0, 140);
}

export function mailIsConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY || '').trim());
}

export async function sendMail({ to, subject, text }) {
  const address = String(to || '').trim();
  if (!address.includes('@')) return { sent: false, reason: 'no-address' };
  if (!mailIsConfigured()) return { sent: false, reason: 'not-configured' };

  const resend = new Resend(process.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: fromAddress(),
    to: [address],
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

