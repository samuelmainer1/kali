export function smsConfigured() {
  return Boolean(process.env.AT_API_KEY && process.env.AT_USERNAME);
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length >= 12) return '+' + digits.slice(0, 12);
  if (digits.startsWith('0') && digits.length >= 10) return '+254' + digits.slice(1, 10);
  if (digits.length === 9) return '+254' + digits;
  if (digits.startsWith('254')) return '+' + digits;
  return digits ? '+' + digits : '';
}

export async function sendSms({ to, message }) {
  const phone = normalizePhone(to);
  const text = String(message || '').slice(0, 320);
  if (!phone || !text) return { ok: false, error: 'Missing phone or message' };
  if (!smsConfigured()) {
    console.log(`[sms:simulated] to=${phone} ${text}`);
    return { ok: true, simulated: true };
  }
  const body = new URLSearchParams({
    username: process.env.AT_USERNAME,
    to: phone,
    message: text,
    from: process.env.AT_SENDER || '',
  });
  const res = await fetch('https://api.africastalking.com/version1/messaging', {
    method: 'POST',
    headers: {
      apiKey: process.env.AT_API_KEY,
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err.slice(0, 200) || 'SMS send failed');
  }
  return { ok: true, simulated: false };
}
