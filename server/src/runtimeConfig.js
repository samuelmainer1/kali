const DEV_DEFAULT_SECRET = 'bigdrop-dev-secret-change-me';
const DEFAULT_PORT = 5001;

/**
 * The URL Safaricom POSTs the STK result to, assembled from what the operator set.
 *
 * This must never invent a public host: it only combines MPESA_CALLBACK_URL, else
 * PUBLIC_API_URL, else the port this process actually listens on. The previous
 * fallback hard-coded `http://localhost:5000`, but the API runs on PORT=5001 — so on a
 * live server with neither variable set, Safaricom was told to call a port nothing is
 * listening on and every M-Pesa payment silently failed to confirm (the customer pays,
 * the STK push looks successful, and the order is never created).
 */
export function mpesaCallbackURL(env = process.env) {
  const explicit = String(env.MPESA_CALLBACK_URL || '').trim();
  if (explicit) return explicit;
  const port = String(env.PORT || '').trim() || String(DEFAULT_PORT);
  const base = String(env.PUBLIC_API_URL || '').trim() || `http://localhost:${port}`;
  return `${base.replace(/\/+$/, '')}/api/payments/mpesa/callback`;
}

/**
 * True when Safaricom's own servers could actually reach the URL: public https, not a
 * loopback, private-range, link-local or placeholder host. Sandbox callbacks travel over
 * the real internet too, so there is no dev-only exception to make here.
 */
export function isPubliclyReachableCallback(url) {
  let parsed;
  try {
    parsed = new URL(String(url || '').trim());
  } catch {
    return false;
  }
  if (parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host) return false;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return false;
  if (host === '0.0.0.0' || host === '::' || host === '::1') return false;
  if (/^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  if (host.startsWith('fe80:') || host.includes(':')) return false; // link-local / any raw IPv6
  return true;
}

export function validateRuntimeConfig(env = process.env) {
  const nodeEnv = String(env.NODE_ENV || 'development').toLowerCase();
  const isProduction = nodeEnv === 'production';
  const jwtSecret = String(env.JWT_SECRET || '').trim();

  if (isProduction && (!jwtSecret || jwtSecret === DEV_DEFAULT_SECRET || jwtSecret.includes('change-me'))) {
    throw new Error('JWT_SECRET must be set to a unique secret value in production.');
  }
  if (isProduction && jwtSecret.length < 32) {
    throw new Error(
      'JWT_SECRET must be at least 32 characters in production. Generate one with:\n' +
        `  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
    );
  }
  if (!isProduction && (!jwtSecret || jwtSecret === DEV_DEFAULT_SECRET)) {
    console.warn('[bigdrop] JWT_SECRET is unset or the default dev value — fine locally, never deploy this.');
  }

  const missingPaymentConfig = [];
  const mpesaReady = Boolean(
    env.MPESA_CONSUMER_KEY && env.MPESA_CONSUMER_SECRET && env.MPESA_SHORTCODE && env.MPESA_PASSKEY
  );
  if (!mpesaReady && (env.MPESA_CONSUMER_KEY || env.MPESA_CONSUMER_SECRET || env.MPESA_SHORTCODE || env.MPESA_PASSKEY)) {
    missingPaymentConfig.push('M-Pesa');
  }

  if (env.PAYSTACK_SECRET_KEY && !env.PAYSTACK_SECRET_KEY.startsWith('sk_')) {
    missingPaymentConfig.push('Paystack');
  }

  if (missingPaymentConfig.length && isProduction) {
    throw new Error(
      `Incomplete payment configuration for ${missingPaymentConfig.join(', ')} in production. Set the required environment variables before deploying.`
    );
  }

  // A configured M-Pesa integration with an unreachable callback is the worst possible
  // go-live state: the customer is charged, the STK push reports success, and the order
  // is never created because the confirmation has nowhere to arrive. Refuse to boot.
  if (mpesaReady) {
    const callback = mpesaCallbackURL(env);
    if (!isPubliclyReachableCallback(callback)) {
      throw new Error(
        `M-Pesa is configured but its callback URL is not publicly reachable over https, so Safaricom could never confirm a payment:\n  ${callback}\n` +
          'Set MPESA_CALLBACK_URL (and PUBLIC_API_URL) to your public https origin before deploying, e.g.\n' +
          '  MPESA_CALLBACK_URL=https://www.bigdrop.co.ke/api/payments/mpesa/callback'
      );
    }
  }

  return {
    isProduction,
    jwtSecret: jwtSecret || DEV_DEFAULT_SECRET,
  };
}
