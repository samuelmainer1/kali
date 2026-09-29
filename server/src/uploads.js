import fs from 'fs';
import path from 'path';
import dns from 'dns';
import net from 'net';
import { fileURLToPath } from 'url';
import { nanoid } from 'nanoid';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Set UPLOADS_DIR on the live server to a folder the zip never overwrites. */
export const uploadsRoot = process.env.UPLOADS_DIR || path.join(__dirname, '../uploads');
export const PRODUCT_MAX_BYTES = 150 * 1024;

const MAX_BYTES_BY_FOLDER = {
  products: PRODUCT_MAX_BYTES,
  heroes: 2 * 1024 * 1024,
  blog: 500 * 1024,
  reviews: 20 * 1024,
};

function dataUrlBytes(dataUrl) {
  const b64 = (String(dataUrl || '').split(',')[1] || '').replace(/=+$/, '');
  return Math.floor((b64.length * 3) / 4);
}

function validateDataUrl(dataUrl, folder = 'products') {
  if (!dataUrl || typeof dataUrl !== 'string') return;
  if (!dataUrl.startsWith('data:')) return;
  const maxBytes = MAX_BYTES_BY_FOLDER[folder] || MAX_BYTES_BY_FOLDER.products;
  const size = dataUrlBytes(dataUrl);
  if (size > maxBytes) {
    throw new Error(`Image too large for ${folder}. Maximum allowed size is ${Math.round(maxBytes / 1024)}KB.`);
  }
}

export function saveDataUrl(dataUrl, folder = 'products') {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  if (!dataUrl.startsWith('data:')) return dataUrl;
  validateDataUrl(dataUrl, folder);
  const m = dataUrl.match(/^data:(image\/[\w+.-]+);base64,(.+)$/);
  if (!m) throw new Error('Invalid image data');
  const mime = m[1].toLowerCase();
  const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('gif') ? 'gif' : 'jpg';
  const dir = path.join(uploadsRoot, folder);
  fs.mkdirSync(dir, { recursive: true });
  const name = `${Date.now()}-${nanoid(8)}.${ext}`;
  fs.writeFileSync(path.join(dir, name), Buffer.from(m[2], 'base64'));
  return `/uploads/${folder}/${name}`;
}

export function persistImages(images = [], folder = 'products') {
  return Promise.all(
    (Array.isArray(images) ? images : [images]).map((img) =>
      folder === 'products' && typeof img === 'string' && /^https?:\/\//i.test(img)
        ? downloadRemoteImage(img, folder)
        : saveDataUrl(img, folder)
    )
  ).then((saved) => saved.filter(Boolean));
}

export async function compressProductImage(input) {
  for (let width = 1200; width >= 400; width -= 100) {
    for (let quality = 82; quality >= 46; quality -= 6) {
      const output = await sharp(input)
        .rotate()
        .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
        .webp({ quality, effort: 5 })
        .toBuffer();
      if (output.length <= PRODUCT_MAX_BYTES) return output;
    }
  }
  throw new Error('Could not compress product image below 150KB');
}

function extFromMimeOrUrl(ctype, url, buf) {
  const type = String(ctype || '').toLowerCase();
  if (type.includes('png') || buf?.[0] === 0x89) return 'png';
  if (type.includes('webp') || (buf?.[0] === 0x52 && buf?.[1] === 0x49)) return 'webp';
  if (type.includes('gif') || (buf?.[0] === 0x47 && buf?.[1] === 0x49)) return 'gif';
  const m = String(url || '').match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i);
  if (m) return m[1].toLowerCase().replace('jpeg', 'jpg');
  return 'jpg';
}

// ─── SSRF protection ─────────────────────────────────────
// Remote image URLs are fetched by the server, so they must never point at
// internal/loopback addresses — otherwise an approved vendor could probe the
// host network through the product-import feature.

function isPrivateAddress(addr) {
  const a = String(addr || '');
  if (net.isIPv4(a)) {
    const [o1, o2] = a.split('.').map(Number);
    if (o1 === 0 || o1 === 10 || o1 === 127) return true;
    if (o1 === 169 && o2 === 254) return true; // link-local
    if (o1 === 172 && o2 >= 16 && o2 <= 31) return true; // private
    if (o1 === 192 && o2 === 168) return true; // private
    if (o1 === 100 && o2 >= 64 && o2 <= 127) return true; // CGNAT
    if (o1 === 192 && o2 === 0) return true; // reserved
    if (o1 === 198 && (o2 === 18 || o2 === 19)) return true; // benchmark
    if (o1 >= 224) return true; // multicast / reserved
    return false;
  }
  if (net.isIPv6(a)) {
    const low = a.toLowerCase();
    if (low === '::' || low === '::1') return true;
    if (low.startsWith('fc') || low.startsWith('fd')) return true; // ULA fc00::/7
    if (['fe8', 'fe9', 'fea', 'feb'].some((p) => low.startsWith(p))) return true; // link-local
    const mapped = low.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]); // IPv4-mapped
    return false;
  }
  return false;
}

async function assertPublicImageUrl(rawUrl) {
  const parsed = new URL(rawUrl);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Only http(s) image URLs are allowed');
  }
  const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Internal hostnames are not allowed');
  }
  if (net.isIP(host)) {
    if (isPrivateAddress(host)) throw new Error('Private addresses are not allowed');
    return;
  }
  const resolved = await dns.promises.lookup(host, { all: true, verbatim: true });
  if (!resolved.length || resolved.some((r) => isPrivateAddress(r.address))) {
    throw new Error('Image host resolves to a private address');
  }
}

/** Download a remote product photo into UPLOADS_DIR so WordPress URLs are not left in the catalogue. */
export async function downloadRemoteImage(url, folder = 'products') {
  if (!url || typeof url !== 'string') return '';
  let target = url.trim();
  if (target.startsWith('/uploads/')) return target;
  if (target.startsWith('data:')) return saveDataUrl(target, folder);
  if (!/^https?:\/\//i.test(target)) return '';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    // Follow redirects manually so every hop is re-checked against the SSRF guard.
    for (let hop = 0; hop < 3; hop += 1) {
      await assertPublicImageUrl(target);
      const res = await fetch(target, {
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'BigDropKenya/1.0 (product-import)', Accept: 'image/*' },
      });
      if ([301, 302, 303, 307, 308].includes(res.status)) {
        const location = res.headers.get('location');
        if (!location) return '';
        target = new URL(location, target).href;
        continue;
      }
      if (!res.ok) return '';
      const ctype = (res.headers.get('content-type') || '').toLowerCase();
      if (ctype && !ctype.startsWith('image/') && !ctype.includes('octet-stream')) return '';
      const buf = Buffer.from(await res.arrayBuffer());
      if (!buf.length || buf.length > 8 * 1024 * 1024) return '';
      const isProduct = folder === 'products';
      const savedBuffer = isProduct ? await compressProductImage(buf) : buf;
      const ext = isProduct ? 'webp' : extFromMimeOrUrl(ctype, target, buf);
      const dir = path.join(uploadsRoot, folder);
      fs.mkdirSync(dir, { recursive: true });
      const name = `${Date.now()}-${nanoid(8)}.${ext}`;
      fs.writeFileSync(path.join(dir, name), savedBuffer);
      return `/uploads/${folder}/${name}`;
    }
    return '';
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}

// Every folder the uploader is allowed to write to.
const UPLOAD_FOLDERS = new Set(['products', 'blog', 'heroes', 'brand', 'testimonials', 'reviews']);

// Which upload folder a stored /uploads/... URL actually lives in. Read from the URL
// rather than trusted from the caller: records legitimately change folder (the whole
// catalogue now lives in uploads/products), and a caller passing a stale folder used to
// make every delete silently no-op. Anything outside the allow-list, or containing a
// traversal segment, is rejected.
export function uploadFolderOf(url) {
  if (!url || typeof url !== 'string' || url.includes('..')) return null;
  const m = /^\/uploads\/([A-Za-z0-9_-]+)\/([^/]+)$/.exec(url);
  if (!m) return null;
  return UPLOAD_FOLDERS.has(m[1]) ? m[1] : null;
}

// `folder` is an optional restriction (string or array of strings) — omit it to accept
// any allow-listed folder, which is what the URL itself already guarantees.
export function isLocalUpload(url, folder) {
  const found = uploadFolderOf(url);
  if (!found) return false;
  if (folder === undefined || folder === null || folder === '') return true;
  return Array.isArray(folder) ? folder.includes(found) : found === folder;
}

// Deletes a stored file and returns true only when something was actually removed.
// `isStillReferenced(url)` lets the caller protect photos other records still point at —
// many products legitimately share one image, so deleting a product must not blank out
// its siblings.
export function deleteLocalUpload(url, isStillReferenced) {
  const folder = uploadFolderOf(url);
  if (!folder) return false;
  if (typeof isStillReferenced === 'function' && isStillReferenced(url)) return false;
  const name = path.basename(url);
  if (!name || name === '.' || name === '..') return false;
  const full = path.join(uploadsRoot, folder, name);
  try {
    if (!fs.existsSync(full)) return false;
    fs.unlinkSync(full);
    return true;
  } catch {
    return false;
  }
}

export function deleteLocalUploads(urls, isStillReferenced) {
  return (Array.isArray(urls) ? urls : [urls]).filter((url) => deleteLocalUpload(url, isStillReferenced)).length;
}

export const DEFAULT_HEROES = [
  {
    id: 'hero_1',
    title: 'Mega Deals Week',
    text: 'Up to 70% off on electronics, fashion & more',
    href: '/deals',
    cta: 'Shop Now',
    gradient: 'linear-gradient(to right, #f97316, #fbbf24)',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'hero_2',
    title: 'Nationwide delivery by Globeflight',
    text: 'Usually the same business day within Nairobi; 2–5 days elsewhere',
    href: '/shop',
    cta: 'Start Shopping',
    gradient: 'linear-gradient(to right, #0ea5e9, #60a5fa)',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'hero_3',
    title: 'New Arrivals in Tech',
    text: 'Latest smartphones, laptops & gadgets',
    href: '/shop?category=phone-tablet',
    cta: 'Explore Tech',
    gradient: 'linear-gradient(to right, #059669, #34d399)',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1600&q=80',
  },
  {
    id: 'hero_4',
    title: 'Back to School Sale',
    text: 'Everything your child needs at great prices',
    href: '/deals',
    cta: 'View Deals',
    gradient: 'linear-gradient(to right, #7c3aed, #a78bfa)',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1600&q=80',
  },
];

export const DEFAULT_JOBS = [
  {
    id: 'job_1',
    title: 'Warehouse Operations Associate',
    location: 'NextGen Mall, Nairobi',
    type: 'Full-time',
    summary: 'Support pick, pack, and dispatch operations at our Globeflight-powered fulfillment hub.',
    description:
      'You will pick and pack orders, zone parcels for Globeflight riders, and keep warehouse bays accurate. The role suits someone who enjoys physical work, checklists, and a busy Nairobi hub. Training is provided on our WMS, safety, and packing standards.\n\nTypical day: receive pick lists, locate SKUs, pack to quality rules, and hand over to dispatch. You will also help with cycle counts and low-stock flags.\n\nWe look for reliability, basic computer literacy, and a customer-first attitude. Night and weekend rotations may apply.',
    active: true,
  },
  {
    id: 'job_2',
    title: 'Vendor Success Manager',
    location: 'Nairobi (hybrid)',
    type: 'Full-time',
    summary: 'Onboard and support marketplace vendors — from first listing to sustained sales growth.',
    description:
      'Own the vendor journey from application to first live SKUs. You will train sellers on the dashboard, listing quality, stock alerts, and payouts, and escalate issues with operations.\n\nYou will run onboarding calls, review listing photos and descriptions, and help vendors grow through promotions and category advice.\n\nIdeal background: account management, retail, or marketplace ops in Kenya. Clear written English and comfort with CRM tools required.',
    active: true,
  },
  {
    id: 'job_3',
    title: 'Customer Support Specialist',
    location: 'Remote / Nairobi',
    type: 'Full-time',
    summary: 'Help shoppers and vendors with orders, tracking, and account questions — 24/7 rotation.',
    description:
      'Answer shopper and vendor questions on orders, tracking, returns, and accounts across email, chat, and phone. You will update tickets, coordinate with Globeflight on delays, and keep a calm, accurate tone.\n\nShifts cover evenings and weekends. We measure first-response time, resolution quality, and CSAT.\n\nApply if you have contact-centre experience, excellent Kiswahili and English, and enjoy solving delivery puzzles.',
    active: true,
  },
];
