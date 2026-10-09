import fs from 'fs';
import path from 'path';

/**
 * DirectAdmin Let's Encrypt writes HTTP-01 tokens under the domain public_html.
 * The Node/Passenger app is bound to the whole hostname, so those URLs never
 * reach public_html unless we serve them here. Without this, AutoSSL keeps the
 * shared server cert (e.g. da40.host-ww.net) and the shop stays "Not Secure".
 */
export function acmeWebroots(env = process.env, cwd = process.cwd()) {
  const roots = [];
  const extra = String(env.ACME_WEBROOT || '').trim();
  if (extra) roots.push(extra);
  roots.push(path.join(cwd, 'public'));
  roots.push(path.join(cwd, 'client', 'dist'));
  const home = String(env.HOME || '').trim();
  const domain = String(env.ACME_DOMAIN || 'bigdrop.co.ke').trim() || 'bigdrop.co.ke';
  if (home) {
    roots.push(path.join(home, 'domains', domain, 'public_html'));
    roots.push(path.join(home, 'public_html'));
  }
  return roots;
}

export function readAcmeChallenge(token, env = process.env, cwd = process.cwd()) {
  if (!/^[A-Za-z0-9_-]+$/.test(String(token || ''))) return null;
  for (const root of acmeWebroots(env, cwd)) {
    const file = path.join(root, '.well-known', 'acme-challenge', token);
    try {
      if (fs.existsSync(file) && fs.statSync(file).isFile()) {
        return fs.readFileSync(file, 'utf8');
      }
    } catch {
      // Unreadable webroot — try the next one.
    }
  }
  return null;
}
