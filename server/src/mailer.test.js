import test from 'node:test';
import assert from 'node:assert/strict';

const prev = {
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_FROM: process.env.SMTP_FROM,
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
};
delete process.env.SMTP_HOST;
delete process.env.SMTP_FROM;
delete process.env.ADMIN_EMAIL;

const { mailConfigured, sendMail, adminRecipients, notifyAdmin, sendWelcomeEmail, sendPurchaseNotifications } =
  await import('./mailer.js');

test('mail is simulated when SMTP is not configured', () => {
  assert.equal(mailConfigured(), false);
});

test('adminRecipients uses ADMIN_EMAIL, then letterhead, then shop inboxes', () => {
  assert.deepEqual(adminRecipients({}), ['orders@bigdrop.co.ke', 'info@bigdrop.co.ke']);
  assert.deepEqual(adminRecipients({ letterhead: { email: 'ops@bigdrop.co.ke' } }), [
    'ops@bigdrop.co.ke',
    'orders@bigdrop.co.ke',
    'info@bigdrop.co.ke',
  ]);
  process.env.ADMIN_EMAIL = 'globeflightke21@gmail.com, orders@bigdrop.co.ke';
  assert.deepEqual(adminRecipients({}), ['globeflightke21@gmail.com', 'orders@bigdrop.co.ke']);
  delete process.env.ADMIN_EMAIL;
});

test('notifyAdmin sends to the admin inbox in demo mode', async () => {
  process.env.ADMIN_EMAIL = 'owner@bigdrop.co.ke';
  const sent = await notifyAdmin({ subject: 'Vendor application: Test Store', text: 'A vendor applied.' });
  assert.equal(sent.ok, true);
  assert.equal(sent.simulated, true);
  assert.equal(sent.to, 'owner@bigdrop.co.ke');
  assert.match(sent.subject, /Vendor application/);
  delete process.env.ADMIN_EMAIL;
});

test('welcome mail goes to the new account', async () => {
  const sent = await sendWelcomeEmail({ name: 'Amina', email: 'amina@example.com', role: 'customer' });
  assert.equal(sent.ok, true);
  assert.equal(sent.to, 'amina@example.com');
  assert.match(sent.subject, /Welcome/);
});

test('a purchase emails the customer and the admin', async () => {
  process.env.ADMIN_EMAIL = 'orders@bigdrop.co.ke';
  const results = await sendPurchaseNotifications({
    customerName: 'Amina',
    customerEmail: 'amina@example.com',
    customerPhone: '',
    orderNumber: 'BD1001',
    trackingNumber: 'GFTEST',
    total: 1500,
    paymentMethod: 'mpesa',
    items: [{ qty: 1, name: 'Dove Body Wash' }],
  });
  assert.equal(results.email.ok, true);
  assert.equal(results.email.to, 'amina@example.com');
  assert.equal(results.admin.ok, true);
  assert.equal(results.admin.to, 'orders@bigdrop.co.ke');
  assert.match(results.admin.subject, /BD1001/);
  delete process.env.ADMIN_EMAIL;
});

test.after(() => {
  for (const [k, v] of Object.entries(prev)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});
