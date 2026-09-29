/** Shared marketplace rules: delivery, coupons, hours, variants, specs. */

export const COUNTY_FEES = {
  Nairobi: 280,
  Kiambu: 350,
  Machakos: 380,
  Kajiado: 400,
  Mombasa: 450,
  Kisumu: 500,
  Nakuru: 480,
  UasinGishu: 550,
  Eldoret: 550,
  'Uasin Gishu': 550,
};

export const NAIROBI_ESTATES = {
  CBD: 250,
  Westlands: 280,
  Kilimani: 280,
  Eastlands: 300,
  SouthB: 300,
  'South B': 300,
  Karen: 420,
  Runda: 450,
  Embakasi: 320,
  Kasarani: 330,
};

export const SAME_DAY_SLOTS = [
  { id: 'morning', label: 'Morning 8am – 12pm', extra: 150 },
  { id: 'afternoon', label: 'Afternoon 12pm – 5pm', extra: 80 },
  { id: 'evening', label: 'Evening 5pm – 8pm', extra: 120 },
];

export const PICKUP_POINTS = [
  {
    id: 'nextgen',
    name: 'NextGen Mall, 3rd Floor, Suite 40',
    city: 'Nairobi',
    address: 'Mombasa Road, NextGen Mall, 3rd Floor, Suite 40',
  },
];

export const DEFAULT_FAQS = [
  {
    id: 'fulfillment',
    title: 'Fulfillment & storage',
    items: [
      {
        q: 'What does BigDrop actually do for vendors?',
        a: 'BigDrop, powered by Globeflight Kenya, stores your inventory at our NextGen Mall warehouse, picks and packs every order, and delivers it nationwide — so you can focus on selling instead of logistics.',
      },
      {
        q: 'How do I send stock to your warehouse?',
        a: 'Drop off inventory at our NextGen Mall hub on Mombasa Road, or arrange a collection with our team. Once received, your stock is logged into our system with SKU-level visibility.',
      },
      {
        q: 'Can I check my stock levels at any time?',
        a: 'Yes. Your vendor dashboard shows live stock counts, low-stock alerts, and order history for every product you list.',
      },
    ],
  },
  {
    id: 'selling',
    title: 'Selling on BigDrop',
    items: [
      {
        q: 'Who can sell on BigDrop?',
        a: 'Individual Facebook, Instagram and TikTok sellers, small businesses, and large enterprises are all welcome. Every vendor account requires admin approval before products can go live.',
      },
      {
        q: 'How long does vendor approval take?',
        a: 'Our team reviews new vendor applications promptly — usually within one business day. You will be notified once your store is approved and you can start listing products.',
      },
      {
        q: 'Do I need my own website to sell on BigDrop?',
        a: 'No. BigDrop gives you a marketplace storefront immediately. You can also link your existing social media pages to drive traffic to your BigDrop listings.',
      },
      {
        q: 'What onboarding support is available?',
        a: 'New vendors get hands-on training on our backend ERP dashboard, with a dedicated onboarding expert to guide your first listings and orders.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery & tracking',
    items: [
      {
        q: 'How is my order delivered?',
        a: 'Once picked and packed, orders are handed to Globeflight riders for nationwide door-to-door delivery. A rider will call you ahead of drop-off.',
      },
      {
        q: 'How do I track my order?',
        a: 'Use your order number or Globeflight tracking number on our Track page to see live status — from picking to out-for-delivery to confirmed delivery.',
      },
      {
        q: 'Is delivery free?',
        a: 'Delivery fees are shown at checkout. Pickup at NextGen Mall, 3rd Floor, Suite 40 is free.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'Pay with M-Pesa at checkout. Card is coming soon. Cash on delivery is only available if BigDrop turns it on.',
      },
      {
        q: 'When do vendors get paid?',
        a: 'Vendor payouts are processed on a regular schedule once orders are marked delivered, minus applicable BigDrop fulfillment fees.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. All transactions are processed through secured, encrypted payment channels with fraud checks on every order.',
      },
    ],
  },
  {
    id: 'diaspora',
    title: 'Diaspora shopping',
    items: [
      {
        q: 'Can I shop on BigDrop for family in Kenya from abroad?',
        a: 'Yes. BigDrop is built for exactly this — order online from anywhere in the world and have it delivered to your family or friends anywhere in Kenya, with tracking every step of the way.',
      },
      {
        q: 'Can I pay from outside Kenya?',
        a: 'Pay with M-Pesa if you have a Kenyan line. Card checkout is coming soon.',
      },
      {
        q: 'Will the recipient be updated on delivery?',
        a: 'Yes — the recipient’s phone number can be added to shipping details so our rider can call ahead and confirm the delivery in person.',
      },
    ],
  },
];

export const DEFAULT_HOME_BLOCKS = {
  shopByCategory: true,
  featuredFour: true,
  flashDeals: true,
  featured: true,
  appBanner: true,
  bestSellers: true,
  topSelling: true,
  choice: true,
  food: true,
  healthBeauty: true,
  tvsElectronics: true,
  household: true,
  phoneTablets: true,
  newsletter: true,
  recentlyViewed: true,
  promoBanners: true,
  // Customer quotes live on the About page; the homepage carousel is opt-in.
  testimonials: false,
};

export const FEATURED_CATEGORY_SLUGS = ['power-solar', 'furniture', 'wine-spirits', 'pharmacy'];

export const DEFAULT_DELIVERY_COPY = {
  title: 'Nationwide delivery by Globeflight',
  note: 'Usually the same business day within Nairobi; 2–5 days elsewhere',
};

export const DEFAULT_LETTERHEAD = {
  companyName: 'BigDrop Kenya',
  address: 'NextGen Mall,\n3rd Floor, Suite 40,\nNairobi, Kenya.',
  email: 'orders@bigdrop.co.ke',
  phone: '+254 722 359 298',
  thankYou: 'Thank you for shopping with BigDrop Kenya. We hope to see you again soon.',
  footerContact: 'www.bigdrop.co.ke · orders@bigdrop.co.ke · +254 722 359 298',
};

export const DEFAULT_ANNOUNCEMENT = {
  enabled: false,
  text: '',
  href: '',
};

export function sanitizeHref(href) {
  const s = String(href || '').trim();
  if (!s) return '/';
  if (
    s.startsWith('/') ||
    s.startsWith('#') ||
    /^https?:\/\//i.test(s) ||
    s.startsWith('mailto:') ||
    s.startsWith('tel:')
  ) {
    return s;
  }
  return '/';
}

function cleanMenuLink(row, i, extra = {}) {
  return {
    id: String(row?.id || `m_${i}`),
    label: String(row?.label || '').trim(),
    href: sanitizeHref(row?.href),
    ...extra,
  };
}

export const DEFAULT_NAV_MENUS = {
  header: [
    { id: 'h_sell', label: 'Sell on BigDrop', href: '/sell', topbar: true },
    { id: 'h_help', label: 'Help Center', href: '/help', topbar: true },
    { id: 'h_shop', label: 'Shop', href: '/shop', topbar: false },
    { id: 'h_about', label: 'About', href: '/about', topbar: false },
    { id: 'h_blog', label: 'Blog', href: '/blog', topbar: false },
    { id: 'h_contact', label: 'Contact', href: '/contact', topbar: false },
  ],
  footer: [
    {
      id: 'company',
      title: 'Company',
      links: [
        { id: 'c_about', label: 'About Us', href: '/about' },
        { id: 'c_contact', label: 'Contact Us', href: '/contact' },
        { id: 'c_careers', label: 'Careers', href: '/careers' },
        { id: 'c_blog', label: 'Blog', href: '/blog' },
        { id: 'c_track', label: 'Track Order', href: '/track' },
        { id: 'c_help', label: 'Help Center', href: '/help' },
      ],
    },
    {
      id: 'service',
      title: 'Customer Service',
      links: [
        { id: 's_help', label: 'Help Center', href: '/help' },
        { id: 's_returns', label: 'Returns & Refunds', href: '/returns' },
        { id: 's_shipping', label: 'Shipping Info', href: '/fulfillment' },
        { id: 's_privacy', label: 'Privacy Policy', href: '/privacy' },
        { id: 's_terms', label: 'Terms & Conditions', href: '/terms' },
        { id: 's_shop', label: 'Shop', href: '/shop' },
        { id: 's_deals', label: 'Deals', href: '/deals' },
        { id: 's_brands', label: 'Brands', href: '/brands' },
        { id: 's_wish', label: 'Wishlist', href: '/wishlist' },
        { id: 's_compare', label: 'Compare', href: '/compare' },
      ],
    },
    {
      id: 'sell',
      title: 'Sell on BigDrop',
      links: [
        { id: 'v_shops', label: 'Vendor shops', href: '/vendors' },
        { id: 'v_become', label: 'Become a vendor', href: '/sell' },
        { id: 'v_benefits', label: 'Vendor benefits', href: '/sell#benefits' },
        { id: 'v_commission', label: 'Commission', href: '/sell#commission' },
        { id: 'v_guidelines', label: 'Seller guidelines', href: '/sell#guidelines' },
      ],
    },
  ],
  footerLegal: [
    { id: 'l_privacy', label: 'Privacy', href: '/privacy' },
    { id: 'l_terms', label: 'Terms & Conditions', href: '/terms' },
    { id: 'l_returns', label: 'Returns', href: '/returns' },
  ],
};

export function normalizeNavMenus(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const headerSrc = Array.isArray(src.header) ? src.header : DEFAULT_NAV_MENUS.header;
  const footerSrc = Array.isArray(src.footer) ? src.footer : DEFAULT_NAV_MENUS.footer;
  const legalSrc = Array.isArray(src.footerLegal) ? src.footerLegal : DEFAULT_NAV_MENUS.footerLegal;
  return {
    header: headerSrc
      .map((row, i) => cleanMenuLink(row, i, { topbar: row?.topbar === true }))
      .filter((row) => row.label),
    footer: footerSrc.map((col, i) => ({
      id: String(col?.id || `col_${i}`),
      title: String(col?.title || '').trim() || `Column ${i + 1}`,
      links: (Array.isArray(col?.links) ? col.links : [])
        .map((row, j) => cleanMenuLink(row, j))
        .filter((row) => row.label),
    })),
    footerLegal: legalSrc.map((row, i) => cleanMenuLink(row, i)).filter((row) => row.label),
  };
}

export function normalizeLetterhead(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    companyName: String(src.companyName || DEFAULT_LETTERHEAD.companyName).trim() || DEFAULT_LETTERHEAD.companyName,
    address: String(src.address || DEFAULT_LETTERHEAD.address),
    email: String(src.email || DEFAULT_LETTERHEAD.email).trim() || DEFAULT_LETTERHEAD.email,
    phone: String(src.phone || DEFAULT_LETTERHEAD.phone).trim() || DEFAULT_LETTERHEAD.phone,
    thankYou: String(src.thankYou || DEFAULT_LETTERHEAD.thankYou).trim() || DEFAULT_LETTERHEAD.thankYou,
    footerContact: String(src.footerContact || DEFAULT_LETTERHEAD.footerContact).trim() || DEFAULT_LETTERHEAD.footerContact,
  };
}

export function normalizeDeliveryCopy(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    title: String(src.title || DEFAULT_DELIVERY_COPY.title).trim() || DEFAULT_DELIVERY_COPY.title,
    note: String(src.note || DEFAULT_DELIVERY_COPY.note).trim() || DEFAULT_DELIVERY_COPY.note,
  };
}

export function normalizeAnnouncement(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  return {
    enabled: src.enabled === true,
    text: String(src.text || '').trim(),
    href: src.href ? sanitizeHref(src.href) : '',
  };
}

export const DEFAULT_SOCIALS = {
  facebook: 'https://www.facebook.com/globeflightke/',
  instagram: '',
  twitter: 'https://twitter.com/globeflight_ke',
  linkedin: 'https://www.linkedin.com/company/globeflight-kenya',
  youtube: 'https://www.youtube.com/channel/UC7QQ6SCXjUAhmhZDhSPPqpg',
  tiktok: '',
};

export const DEFAULT_NOTIFY_TEMPLATES = {
  emailSubject: 'BigDrop order {{orderNumber}} confirmed',
  emailBody:
    'Hi {{name}},\n\nThank you for shopping with BigDrop. Your order {{orderNumber}} is confirmed.\nTotal: {{total}}\nTrack: {{trackingNumber}}\n\nBigDrop Kenya\nNextgen Mall, 3rd Floor, Suite 40.\norders@bigdrop.co.ke',
  smsBody: 'BigDrop: Order {{orderNumber}} confirmed. Track {{trackingNumber}}.',
};

export const DEFAULT_SELL_PAGE = {
  title: 'Sell on BigDrop',
  subtitle: "List products on Kenya's Globeflight-powered marketplace. We handle storage and delivery.",
  steps: [
    { n: '1', t: 'Create a vendor account', d: 'Register with your store name. Admin reviews applications within one business day.' },
    { n: '2', t: 'Get approved', d: 'We confirm your business details. You can log in anytime to check status.' },
    { n: '3', t: 'List products', d: 'Add photos, prices and stock from your vendor dashboard.' },
    { n: '4', t: 'We fulfill', d: 'Send inventory to NextGen Mall. Globeflight picks, packs, and delivers.' },
  ],
  benefitsIntro: 'Reach shoppers across Kenya without building your own store. Globeflight picks, packs, and delivers every order.',
  benefits: [
    { title: 'Your storefront', text: 'Reach customers without building your own ecommerce site.' },
    { title: 'Logistics included', text: 'Globeflight picks, packs, and delivers every order.' },
    { title: 'Simple dashboard', text: 'Manage products, stock, and order status in one place.' },
  ],
  commissionIntro: 'Simple, transparent fees. You keep the rest after fulfillment.',
  commissionRows: [
    { category: 'Phones & electronics', rate: '8%' },
    { category: 'Fashion', rate: '12%' },
    { category: 'Beauty & health', rate: '10%' },
    { category: 'Home & office', rate: '10%' },
    { category: 'Groceries', rate: '6%' },
  ],
  guidelines: [
    'List only genuine products with accurate photos, prices, and stock.',
    'Send inventory to our NextGen Mall warehouse (or arrange collection) before going live.',
    'Respond to customer questions promptly. BigDrop handles pick, pack, and delivery.',
    'Admin reviews every listing. Counterfeit or prohibited items will be rejected.',
    'Keep stock levels updated so we never sell what we cannot ship.',
  ],
};

export function fillTemplate(str, vars = {}) {
  return String(str || '').replace(/\{\{(\w+)\}\}/g, (_, key) => (vars[key] != null ? String(vars[key]) : ''));
}

export const DEFAULT_COUPONS = [
  { code: 'BIGDROP10', type: 'percent', value: 10, label: '10% off', active: true },
  { code: 'WELCOME50', type: 'flat', value: 50, label: 'KSh 50 off', active: true },
  { code: 'FREESHIP', type: 'freeship', value: 0, label: 'Free delivery', active: true },
];

export const COMMISSION_RATE = 0.15;

export function countyFeesFrom(db) {
  const custom = db?.site?.countyFees;
  const merged = { ...COUNTY_FEES };
  if (custom && typeof custom === 'object') {
    for (const [k, v] of Object.entries(custom)) {
      const n = Number(v);
      if (k && Number.isFinite(n) && n >= 0) merged[k] = n;
    }
  }
  const nairobi = Number(db?.site?.deliveryFee);
  if (Number.isFinite(nairobi) && nairobi >= 0) merged.Nairobi = nairobi;
  return merged;
}

export function commissionRateFrom(db) {
  const n = Number(db?.site?.commissionRate);
  if (Number.isFinite(n) && n >= 0 && n < 1) return n;
  if (Number.isFinite(n) && n >= 1 && n <= 100) return n / 100;
  return COMMISSION_RATE;
}

export function listCoupons(db) {
  const list = Array.isArray(db.coupons) && db.coupons.length ? db.coupons : DEFAULT_COUPONS;
  return list.filter((c) => c && c.code && c.active !== false);
}

export function findCoupon(db, code) {
  const key = String(code || '').trim().toUpperCase();
  if (!key) return null;
  return listCoupons(db).find((c) => String(c.code).toUpperCase() === key) || null;
}

export function quoteDelivery({
  county,
  subtotal = 0,
  paymentMethod = 'mpesa',
  coupon = null,
  deliveryMode = 'delivery',
  freeMin = 10000,
  countyFees = null,
} = {}) {
  if (deliveryMode === 'pickup') {
    return { shipping: 0, base: 0, slotExtra: 0, label: 'Pickup' };
  }

  const fees = countyFees && typeof countyFees === 'object' ? countyFees : COUNTY_FEES;
  const countyName = String(county || 'Nairobi').trim();
  let base = fees[countyName];
  if (base == null) {
    const match = Object.keys(fees).find((k) => k.toLowerCase() === countyName.toLowerCase());
    base = match ? fees[match] : 650;
  }

  if (coupon?.type === 'freeship' && paymentMethod !== 'cod') {
    return { shipping: 0, base: 0, slotExtra: 0, label: 'Free delivery coupon' };
  }
  if (subtotal >= freeMin && paymentMethod !== 'cod') {
    return { shipping: 0, base: 0, slotExtra: 0, label: 'Free over threshold' };
  }
  return { shipping: base, base, slotExtra: 0, label: 'Standard' };
}

export function parseSpecifications(raw) {
  if (raw == null || raw === '') return [];
  if (Array.isArray(raw)) {
    return raw
      .map((s) => {
        if (typeof s === 'string') {
          const idx = s.search(/[:\-–—]/);
          if (idx < 0) return { name: 'Detail', value: s.trim() };
          return { name: s.slice(0, idx).trim(), value: s.slice(idx + 1).replace(/^[\s:\-–—]+/, '').trim() };
        }
        return {
          name: String(s?.name ?? '').trim(),
          value: String(s?.value ?? '').trim(),
        };
      })
      .filter((s) => s.name && s.value);
  }
  return String(raw)
    .split(/\r?\n/)
    .map((line) => line.replace(/^[\s•\-\*]+/, '').trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.search(/[:\-–—=]/);
      if (idx < 0) return { name: 'Detail', value: line };
      const name = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).replace(/^[\s:\-–—=]+/, '').trim();
      if (!name || !value) return null;
      return { name, value };
    })
    .filter(Boolean);
}

export function parseVariants(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((v) => ({
        name: String(v?.name || '').trim(),
        options: Array.isArray(v?.options)
          ? v.options.map((o) => String(o).trim()).filter(Boolean)
          : String(v?.options || '')
              .split(',')
              .map((o) => o.trim())
              .filter(Boolean),
      }))
      .filter((v) => v.name && v.options.length);
  }
  return String(raw)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(':');
      if (idx < 0) return null;
      const name = line.slice(0, idx).trim();
      const options = line
        .slice(idx + 1)
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
      if (!name || !options.length) return null;
      return { name, options };
    })
    .filter(Boolean);
}

export function variantsToText(variants) {
  if (!Array.isArray(variants) || !variants.length) return '';
  return variants.map((v) => `${v.name}: ${(v.options || []).join(', ')}`).join('\n');
}

export function vendorIsOpen(hours, now = new Date()) {
  if (!hours) return true;
  if (hours.open24) return true;
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const day = days[now.getDay()];
  const spec = hours[day] || hours.default;
  if (!spec) return true;
  if (spec === 'closed') return false;
  const [start, end] = String(spec).split('-').map((s) => s.trim());
  if (!start || !end) return true;
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const mins = now.getHours() * 60 + now.getMinutes();
  return mins >= toMin(start) && mins <= toMin(end);
}

export function defaultVendorHours() {
  return {
    open24: false,
    mon: '08:00-20:00',
    tue: '08:00-20:00',
    wed: '08:00-20:00',
    thu: '08:00-20:00',
    fri: '08:00-20:00',
    sat: '08:00-20:00',
    sun: '09:00-18:00',
  };
}

/**
 * Public URL segment of a vendor shop (/vendors/<slug>).
 *
 * One implementation on purpose: the API uses it to build `/api/stores/:slug` links and
 * the SSR renderer uses it to find the shop behind an incoming `/vendors/:slug` request,
 * so a divergence here would break share cards for shops that exist.
 */
export function vendorStoreSlug(vendor) {
  return String(vendor?.storeName || vendor?.name || vendor?.id || 'vendor')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Known-dead Unsplash photo IDs → working replacements (category tiles and product photos). */
export const DEAD_UNSPLASH_IDS = {
  'photo-1584308666744-24d37de98916': 'photo-1471864190281-a93a3070b6de',
  'photo-1576602976047-174e57a70ce0': 'photo-1587854692152-cbe660dbde88',
  'photo-1584483766114-2cea6facdf32': 'photo-1585435557343-3b092031a831',
};

export function unsplashPhoto(id) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;
}

/** Demo catalogue photos that were the wrong subject or reused across unrelated SKUs. */
export const CATALOG_PHOTO_FIXES = {
  'Car Phone Mount Magnetic': 'photo-1605559424843-9e4c228bf1c2',
  'Toilet Air Freshener Block': 'photo-1600566753190-17f0baa2a6c3',
  'Organic Baby Wipes (12 packs)': 'photo-1544367567-0f2fcb009e0b',
  'Jump Starter Power Bank': 'photo-1593941707882-a5bba14938c7',
  'Cooking Oil 2L': 'photo-1472220625704-91e1462799b2',
  'Kitchen Towel Roll Pack': 'photo-1556911220-bff31c812dba',
  'Mini Fridge 90L': 'photo-1556912173-46c336c7fd55',
  'Guitar Capo & Picks Pack': 'photo-1564186763535-ebb21ef5277f',
  'Mustek 650VA UPS': 'photo-1513828583688-c52646db42da',
  'Classic Canvas Tote Bag': 'photo-1590874103328-eac38a683ce7',
  'Pearl Stud Earrings': 'photo-1599643478518-a784e5dc4c8f',
  'Highlighter Set (8)': 'photo-1513542789411-b6a5d4f31634',
  'Outdoor Bubble Machine': 'photo-1530103862676-de8c9debad1d',
  'Bar Soap Multipack': 'photo-1612817288484-6f916006741a',
  'All-Purpose Cleaner 1L': 'photo-1581578731548-c64695cc6952',
  'Vitamin C Face Wash': 'photo-1620916566398-39f1143ab7be',
  'Outdoor String Lights 10m': 'photo-1513475382585-d06e58bcb0e0',
  'Studio Headphones Closed': 'photo-1484704849700-f032a568e944',
  'Solar Charge Controller 40A': 'photo-1621905252507-b35492cc74b4',
};

export function remapUnsplashUrl(url) {
  if (!url || typeof url !== 'string') return url;
  let next = url;
  for (const [dead, live] of Object.entries(DEAD_UNSPLASH_IDS)) {
    if (next.includes(dead)) next = next.replaceAll(dead, live);
  }
  return next;
}

export function remapDeadUnsplash(db) {
  let changed = false;
  const apply = (url) => {
    const next = remapUnsplashUrl(url);
    if (next !== url) changed = true;
    return next;
  };
  for (const c of db.categories || []) {
    c.image = apply(c.image);
  }
  for (const p of db.products || []) {
    if (Array.isArray(p.images)) p.images = p.images.map(apply);
    const photoId = CATALOG_PHOTO_FIXES[p.name];
    if (!photoId) continue;
    const current = p.images?.[0] || '';
    if (current.includes(photoId)) continue;
    const next = unsplashPhoto(photoId);
    p.images = [next, next.replace('w=800', 'w=1200')];
    changed = true;
  }
  return changed;
}

export const INVOICE_THANK_YOU = 'Thank you for shopping with BigDrop Kenya. We hope to see you again soon.';

export function remapInvoiceThankYou(db) {
  let changed = false;
  for (const o of db.orders || []) {
    for (const doc of o.documents || []) {
      if ((doc.type === 'invoice' || doc.type === 'receipt') && doc.note !== INVOICE_THANK_YOU) {
        doc.note = INVOICE_THANK_YOU;
        changed = true;
      }
    }
  }
  return changed;
}

const HERO_NATIONWIDE_TITLE = 'Nationwide delivery by Globeflight';
const HERO_NATIONWIDE_TEXT = 'Usually the same business day within Nairobi; 2–5 days elsewhere';

export function remapGoLiveCustomerCopy(db) {
  let changed = false;
  const heroes = db.site?.heroes || [];
  for (const h of heroes) {
    const title = String(h.title || '');
    if (/10[\s,]*000/.test(title) && /free/i.test(title)) {
      h.title = HERO_NATIONWIDE_TITLE;
      h.text = HERO_NATIONWIDE_TEXT;
      h.subtitle = HERO_NATIONWIDE_TEXT;
      changed = true;
    }
  }
  const faqs = db.faqs || [];
  for (const group of faqs) {
    for (const item of group.items || []) {
      const a = String(item.a || '');
      if (/10[\s,]*000/.test(a) && /free/i.test(a)) {
        item.a = 'Delivery fees are shown at checkout. Pickup at NextGen Mall, 3rd Floor, Suite 40 is free.';
        changed = true;
      }
      if (/major cards at checkout/i.test(a)) {
        item.a = 'Pay with M-Pesa at checkout. Card is coming soon. Cash on delivery is only available if BigDrop turns it on.';
        changed = true;
      }
      if (/card checkout is the recommended option/i.test(a)) {
        item.a = 'Pay with M-Pesa if you have a Kenyan line. Card checkout is coming soon.';
        changed = true;
      }
    }
  }
  return changed;
}

export function statusNotifyCopy(status, order) {
  const track = order.trackingNumber || order.orderNumber;
  const map = {
    confirmed: `BigDrop: Order ${order.orderNumber} is confirmed. Track ${track}.`,
    picking: `BigDrop: We are picking order ${order.orderNumber} at the warehouse.`,
    packed: `BigDrop: Order ${order.orderNumber} is packed and ready.`,
    out_for_delivery: `BigDrop: Order ${order.orderNumber} is out for delivery with Globeflight. Track ${track}.`,
    delivered: `BigDrop: Order ${order.orderNumber} was delivered. Asante!`,
    cancelled: `BigDrop: Order ${order.orderNumber} was cancelled.`,
  };
  return map[status] || `BigDrop: Order ${order.orderNumber} updated to ${status}.`;
}
