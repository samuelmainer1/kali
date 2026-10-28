/**
 * Local Globeflight admin API.
 * Login details are in server/LOCAL_LOGIN.txt. This password is for this
 * project only and is not the live site password.
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { chatAlertAddresses, liveChatAlertText, newMessageEmailText, notifyAddress, replyEmailText, sendMail } from './mail.js';
import {
  isStaffOnline,
  markStaffPresent,
  postVisitorMessage,
  startVisitorChat,
  readVisitorChat,
  staffInbox,
  staffReply,
  staffThread,
  listChatContacts,
} from './chat.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { DEFAULT_ORIGIN, cleanOrigin, buildFeeds } = require('../scripts/feed-builder.cjs');

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === '') process.env[key] = value;
  }
}

loadEnvFile(path.join(ROOT, '..', '.env'));
loadEnvFile(path.join(ROOT, '.env'));

const PORT = Number(process.env.PORT || 5000);
const DB_PATH = path.join(ROOT, 'data', 'db.json');
const AUTH_PATH = path.join(ROOT, 'data', 'auth.json');
const UPLOAD_DIR = path.join(ROOT, 'uploads');
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const sessions = new Map();
const chatHits = new Map();

function allowChatMessage(key) {
  const now = Date.now();
  const recent = (chatHits.get(key) || []).filter((time) => now - time < 5 * 60 * 1000);
  if (recent.length >= 12) return false;
  recent.push(now);
  chatHits.set(key, recent);
  return true;
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function loadDb() {
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  db.blogs ||= [];
  db.services ||= [];
  db.categories ||= [];
  db.jobs ||= [];
  db.testimonials ||= [];
  db.contacts ||= [];
  db.subscribers ||= [];
  db.notifications ||= [];
  db.chats ||= [];
  db.chatMessages ||= [];
  db.chatContacts ||= [];
  db.applications ||= [];
  db.shipments ||= [];
  return db;
}

let db = loadDb();

function saveDb() {
  const tmp = `${DB_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_PATH);
}

function clip(value, limit = 140) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  return `${text.slice(0, limit - 1)}…`;
}

function addNotification(entry) {
  db.notifications ||= [];
  db.notifications.unshift({
    id: nextId(db.notifications),
    type: entry.type,
    title: clip(entry.title, 80),
    detail: clip(entry.detail, 160),
    link: entry.link,
    refId: entry.refId ?? null,
    isRead: false,
    createdAt: entry.createdAt || new Date().toISOString(),
  });
  if (db.notifications.length > 80) db.notifications.length = 80;
}

function liveChatAlertDue(chat) {
  const last = chat.lastAlertAt ? new Date(chat.lastAlertAt).getTime() : 0;
  return !last || Date.now() - last > 10 * 60 * 1000;
}

async function emailLiveChat(chat, message) {
  const notice = await sendMail({
    to: chatAlertAddresses(),
    subject: 'Someone is waiting in the live chat',
    text: liveChatAlertText(chat, message),
  });
  if (notice.sent) chat.lastAlertAt = new Date().toISOString();
  else if (notice.reason === 'not-configured') {
    console.error('Live chat email was not sent. Set RESEND_API_KEY on the server.');
  } else {
    console.error('Live chat email failed:', notice.reason);
  }
}

function messageNotification(contact) {
  const presented = presentContact(contact);
  const name = clip(presented.name, 60) || 'a visitor';
  const about = clip(presented.subject, 80);
  const message = clip(presented.message, 120);
  return {
    type: 'message',
    title: `New message from ${name}`,
    detail: about && message ? `${about} — ${message}` : about || message || 'Open Messages to read it.',
    link: '/contacts',
    refId: contact.id,
    createdAt: contact.createdAt,
  };
}

function syncNotification(type, refId, isRead) {
  for (const note of db.notifications || []) {
    if (note.type === type && note.refId === refId) note.isRead = isRead;
  }
}

function removeNotifications(type, refId) {
  db.notifications = (db.notifications || []).filter(
    (note) => !(note.type === type && note.refId === refId)
  );
}

function ensureNotifications() {
  db.notifications ||= [];
  let changed = false;
  for (const contact of db.contacts) {
    if (db.notifications.some((note) => note.type === 'message' && note.refId === contact.id)) continue;
    const note = messageNotification(contact);
    db.notifications.push({ id: nextId(db.notifications), ...note, isRead: false });
    changed = true;
  }
  for (const subscriber of db.subscribers) {
    if (subscriber.isActive === false) continue;
    if (db.notifications.some((note) => note.type === 'subscriber' && note.refId === subscriber.id)) continue;
    db.notifications.push({
      id: nextId(db.notifications),
      type: 'subscriber',
      title: 'New newsletter subscriber',
      detail: subscriber.email,
      link: '/newsletter-subscribers',
      refId: subscriber.id,
      isRead: false,
      createdAt: subscriber.createdAt || new Date().toISOString(),
    });
    changed = true;
  }
  if (!changed) return;
  db.notifications.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  saveDb();
}

function presentSubscriber(item) {
  return {
    ...item,
    isActive: item.isActive !== false,
    unsubscribedAt: item.unsubscribedAt || null,
  };
}

function subscriberStats() {
  const items = db.subscribers.map(presentSubscriber);
  return {
    total: items.length,
    active: items.filter((item) => item.isActive).length,
    unsubscribed: items.filter((item) => !item.isActive).length,
    thisMonth: createdThisMonth(items),
  };
}

function requestOrigin(req, url) {
  const queryHost = String(url?.searchParams?.get('host') || '').split(',')[0].trim();
  const forwarded = String(req?.headers?.['x-forwarded-host'] || '').split(',')[0].trim();
  const headerHost = String(req?.headers?.host || '').split(',')[0].trim();
  const host = (queryHost || forwarded || headerHost).replace(/:\d+$/, '').toLowerCase();
  const local = !host || host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
  if (!local && /^[a-z0-9.-]+$/.test(host)) {
    const proto = String(req?.headers?.['x-forwarded-proto'] || 'https').split(',')[0].trim();
    return cleanOrigin(`${proto === 'http' ? 'http' : 'https'}://${host}`);
  }
  return cleanOrigin(process.env.SITE_URL || DEFAULT_ORIGIN);
}

function refreshPublicFeeds(req) {
  try {
    const origin = requestOrigin(req, req ? new URL(req.url || '/', 'http://127.0.0.1') : null);
    const feeds = buildFeeds(db, origin);
    const folders = [
      path.join(ROOT, '..', 'public'),
      path.join(ROOT, '..', 'dist'),
    ];
    if (process.env.WEB_ROOT) folders.push(process.env.WEB_ROOT);
    folders.forEach((folder) => {
      if (!fs.existsSync(folder)) return;
      fs.writeFileSync(path.join(folder, 'sitemap.xml'), feeds.sitemap);
      fs.writeFileSync(path.join(folder, 'rss.xml'), feeds.rss);
    });
  } catch (error) {
    console.error(error.message || 'Sitemap update failed.');
  }
}

function slugify(value) {
  const slug = String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140);
  return slug || 'item';
}

function uniqueSlug(list, slug, ignoreId) {
  let candidate = slug;
  let n = 2;
  while (list.some((item) => item.slug === candidate && item.id !== ignoreId)) {
    candidate = `${slug}-${n}`;
    n += 1;
  }
  return candidate;
}

function nextId(list) {
  return list.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
}

function asBool(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (value === 'false' || value === '0' || value === 0) return false;
  return true;
}

function asLines(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

function asTags(value) {
  if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function findById(list, id) {
  return list.find((item) => String(item.id) === String(id));
}

function categoryEmbed(categoryId) {
  const category = findById(db.categories, categoryId);
  if (!category) return null;
  return { id: category.id, name: category.name, slug: category.slug };
}

function presentBlog(blog) {
  return { ...blog, category: categoryEmbed(blog.categoryId) || blog.category || null };
}

const IMAGE_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function saveUploadedImage(file) {
  const ext = IMAGE_EXTENSIONS[String(file.type || '').split(';')[0].trim()];
  if (!ext) throw httpError(400, 'Upload a JPG, PNG, WEBP, or GIF image.');
  const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), file.data);
  return `/uploads/${filename}`;
}

function blogFromRequest(body, existing = {}) {
  const files = body._files || [];
  const fields = { ...body };
  delete fields._files;
  const image = files.find(
    (item) =>
      (item.field === 'featuredImage' || item.field === 'image') && item.data && item.data.length
  );
  if (image) fields.featuredImage = saveUploadedImage(image);
  return normalizeBlog(fields, existing);
}

function adminBlogList(url) {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 10)));
  const search = (url.searchParams.get('search') || '').trim().toLowerCase();
  const published = url.searchParams.get('published');
  const featured = url.searchParams.get('featured');
  let items = db.blogs.map(presentBlog);
  if (search) {
    items = items.filter((blog) =>
      [blog.title, blog.shortDescription, blog.content, ...(blog.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }
  if (published === 'true') items = items.filter((blog) => blog.isPublished !== false);
  if (published === 'false') items = items.filter((blog) => blog.isPublished === false);
  if (featured === 'true') items = items.filter((blog) => blog.isFeatured);
  items.sort((a, b) => Number(b.id) - Number(a.id));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit) || 1);
  const safePage = Math.min(page, pages);
  const blogs = items.slice((safePage - 1) * limit, safePage * limit);
  return { blogs, pagination: { total, page: safePage, pages, limit } };
}

function blogStats() {
  const totalViews = db.blogs.reduce((sum, blog) => sum + (Number(blog.viewsCount) || 0), 0);
  const totalLikes = db.blogs.reduce((sum, blog) => sum + (Number(blog.likesCount) || 0), 0);
  const published = db.blogs.filter((blog) => blog.isPublished !== false).length;
  return {
    blogs: { total: db.blogs.length, published, drafts: db.blogs.length - published },
    engagement: {
      totalViews,
      totalLikes,
      avgViews: db.blogs.length ? Math.round(totalViews / db.blogs.length) : 0,
    },
    comments: { total: 0, pending: 0 },
  };
}

function refreshBlogCategories() {
  for (const blog of db.blogs) {
    const embedded = categoryEmbed(blog.categoryId);
    if (embedded) blog.category = embedded;
  }
}

function blogListItem(blog) {
  const { content, ...rest } = blog;
  return rest;
}

function presentContact(item) {
  const inquiry = String(item.inquiryType || '').toLowerCase();
  const known = ['inquiry', 'business', 'complaint', 'feedback'];
  const type = known.includes(item.type)
    ? item.type
    : inquiry === 'feedback'
      ? 'feedback'
      : inquiry === 'quote'
        ? 'business'
        : 'inquiry';
  const subjects = {
    quote: 'Request a Quote',
    feedback: 'General Feedback',
    support: 'Customer Support',
    business: 'Business inquiry',
    inquiry: 'Website inquiry',
    complaint: 'Complaint',
  };
  return {
    ...item,
    name: item.name || 'Website visitor',
    email: item.email || '',
    phone: item.phone || item.mobileNumber || '',
    subject: item.subject || subjects[inquiry] || subjects[type] || 'Website message',
    message: item.message || '',
    type,
    isRead: item.isRead === true,
    isStarred: item.isStarred === true,
    isReplied: Boolean(item.replyMessage || item.isReplied),
    createdAt: item.createdAt,
  };
}

function contactList(url) {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 20)));
  const search = (url.searchParams.get('search') || '').trim().toLowerCase();
  const isRead = url.searchParams.get('isRead');
  let items = db.contacts.map(presentContact);
  if (isRead === 'false') items = items.filter((item) => !item.isRead);
  if (isRead === 'true') items = items.filter((item) => item.isRead);
  if (search) {
    items = items.filter((item) =>
      [item.name, item.email, item.phone, item.subject, item.message].join(' ').toLowerCase().includes(search)
    );
  }
  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit) || 1);
  return {
    contacts: items.slice((page - 1) * limit, page * limit),
    pagination: { total, page, pages, limit },
  };
}

function contactStats() {
  const items = db.contacts.map(presentContact);
  return {
    totals: {
      total: items.length,
      unread: items.filter((item) => !item.isRead).length,
      replied: items.filter((item) => item.isReplied).length,
    },
  };
}

function presentService(item) {
  return { ...item, isPublished: item.isPublished !== false };
}

function serviceList(url) {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 10)));
  const search = (url.searchParams.get('search') || '').trim().toLowerCase();
  let items = db.services.map(presentService);
  if (search) {
    items = items.filter((item) =>
      [item.title, item.shortDescription, item.slug, item.description].join(' ').toLowerCase().includes(search)
    );
  }
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit) || 1);
  return {
    services: items.slice((page - 1) * limit, page * limit),
    pagination: { total, page, pages, limit },
  };
}

function createdThisMonth(list) {
  const now = new Date();
  return list.filter((item) => {
    const date = new Date(item.createdAt || item.publishedAt || 0);
    return date.getUTCFullYear() === now.getUTCFullYear() && date.getUTCMonth() === now.getUTCMonth();
  }).length;
}

function dashboardStats() {
  const services = db.services.map(presentService);
  const contacts = db.contacts.map(presentContact);
  const activeShipments = db.shipments.filter((item) => !['delivered', 'cancelled'].includes(item.status)).length;
  const activeJobs = db.jobs.filter((item) => item.isPublished !== false && item.isClosed !== true).length;
  const monthCounts = {
    services: createdThisMonth(services),
    blogs: createdThisMonth(db.blogs),
    shipments: createdThisMonth(db.shipments),
    contacts: createdThisMonth(contacts),
    applications: createdThisMonth(db.applications),
  };
  const recentActivity = {};
  for (const [key, count] of Object.entries(monthCounts)) {
    if (count > 0) recentActivity[key] = count;
  }
  return {
    overview: {
      services: { total: services.length, published: services.filter((item) => item.isPublished).length },
      blogs: { total: db.blogs.length, published: db.blogs.filter((item) => item.isPublished !== false).length },
      shipments: { total: db.shipments.length, active: activeShipments },
      contacts: { total: contacts.length, unread: contacts.filter((item) => !item.isRead).length },
      users: { total: authStore.users.length },
      jobs: { total: db.jobs.length, active: activeJobs },
      applications: { total: db.applications.length },
      testimonials: { published: db.testimonials.filter((item) => item.isPublished !== false).length },
    },
    recentActivity,
    topContent: {
      blogs: [...db.blogs]
        .sort(
          (a, b) =>
            (Number(b.viewsCount) || 0) - (Number(a.viewsCount) || 0) ||
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        )
        .slice(0, 5)
        .map((blog) => ({
          id: blog.id,
          title: blog.title,
          viewsCount: Number(blog.viewsCount) || 0,
          likesCount: Number(blog.likesCount) || 0,
        })),
    },
  };
}

function recentActivity(limit) {
  const items = [];
  for (const blog of db.blogs) {
    items.push({
      type: 'blog',
      id: blog.id,
      title: blog.title,
      description: blog.shortDescription || 'Blog post',
      createdAt: blog.createdAt || blog.publishedAt || blog.updatedAt,
    });
  }
  for (const shipment of db.shipments) {
    const route = [shipment.origin, shipment.destination].filter(Boolean).join(' to ');
    items.push({
      type: 'shipment',
      id: shipment.id,
      title: shipment.trackingNumber || 'Shipment',
      description: route || shipment.note || 'Shipment',
      createdAt: shipment.createdAt,
      metadata: { status: shipment.status || '' },
    });
  }
  for (const contact of db.contacts) {
    const presented = presentContact(contact);
    items.push({
      type: 'contact',
      id: contact.id,
      title: presented.subject || presented.name,
      description: presented.message || presented.email,
      createdAt: contact.createdAt,
      metadata: { isRead: presented.isRead },
    });
  }
  for (const application of db.applications) {
    items.push({
      type: 'application',
      id: application.id,
      title: application.fullName || application.name || 'Application',
      description: application.email || 'Job application',
      createdAt: application.createdAt,
    });
  }
  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  return items.slice(0, limit);
}

function periodStart(period) {
  const days = period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start;
}

function dateKey(date, period) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return period === '1y' ? `${year}-${month}-01` : `${year}-${month}-${day}`;
}

function periodKeys(period) {
  const start = periodStart(period);
  const end = new Date();
  end.setUTCHours(0, 0, 0, 0);
  const cursor = new Date(start);
  if (period === '1y') cursor.setUTCDate(1);
  const keys = [];
  while (cursor <= end) {
    keys.push(dateKey(cursor, period));
    if (period === '1y') cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    else cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

function dashboardAnalytics(period) {
  const keys = periodKeys(period);
  const start = periodStart(period);
  const shipments = Object.fromEntries(keys.map((key) => [key, { date: key, shipments: 0, totalValue: 0, weightSum: 0 }]));
  const contacts = Object.fromEntries(keys.map((key) => [key, { date: key, contacts: 0, read: 0, unread: 0 }]));
  const blogs = Object.fromEntries(keys.map((key) => [key, { date: key, blogs: 0, totalViews: 0, totalLikes: 0 }]));
  const bucket = (map, value) => {
    const date = new Date(value || 0);
    if (Number.isNaN(date.getTime()) || date < start) return null;
    return map[dateKey(date, period)] || null;
  };
  for (const shipment of db.shipments) {
    const row = bucket(shipments, shipment.createdAt);
    if (!row) continue;
    row.shipments += 1;
    row.totalValue += Number(shipment.declaredValue) || 0;
    row.weightSum += Number(shipment.grossWeight || shipment.weight) || 0;
  }
  for (const contact of db.contacts.map(presentContact)) {
    const row = bucket(contacts, contact.createdAt);
    if (!row) continue;
    row.contacts += 1;
    if (contact.isRead) row.read += 1;
    else row.unread += 1;
  }
  for (const blog of db.blogs) {
    const row = bucket(blogs, blog.createdAt || blog.publishedAt);
    if (!row) continue;
    row.blogs += 1;
    row.totalViews += Number(blog.viewsCount) || 0;
    row.totalLikes += Number(blog.likesCount) || 0;
  }
  const destinations = new Map();
  for (const shipment of db.shipments) {
    const destination = String(shipment.destination || shipment.receiverCountry || '').trim();
    if (!destination) continue;
    destinations.set(destination, (destinations.get(destination) || 0) + 1);
  }
  return {
    analytics: {
      shipments: keys.map((key) => {
        const row = shipments[key];
        return {
          date: row.date,
          shipments: row.shipments,
          totalValue: row.totalValue,
          avgWeight: row.shipments ? Number((row.weightSum / row.shipments).toFixed(2)) : 0,
        };
      }),
      contacts: keys.map((key) => contacts[key]),
      blogs: keys.map((key) => blogs[key]),
    },
    performance: {
      categories: db.categories
        .map((category) => {
          const posts = db.blogs.filter((blog) => String(blog.categoryId) === String(category.id));
          return {
            name: category.name,
            blogCount: posts.length,
            totalViews: posts.reduce((sum, blog) => sum + (Number(blog.viewsCount) || 0), 0),
          };
        })
        .filter((item) => item.blogCount > 0)
        .sort((a, b) => b.blogCount - a.blogCount),
    },
    geographic: {
      topDestinations: [...destinations.entries()]
        .map(([destination, count]) => ({ destination, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
    },
  };
}

function requireUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const session = token ? sessions.get(token) : null;
  if (!session || session.exp < Date.now()) {
    if (token) sessions.delete(token);
    throw httpError(401, 'Please sign in again.');
  }
  return session.user;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (chunk) => {
      size += chunk.length;
      if (size > 8 * 1024 * 1024) {
        reject(httpError(413, 'Upload is too large.'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function parseMultipart(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || '');
  if (!match) return {};
  const boundary = match[1] || match[2];
  const parts = buffer.toString('latin1').split(`--${boundary}`);
  const fields = {};
  const files = [];
  for (const part of parts) {
    const splitAt = part.indexOf('\r\n\r\n');
    if (splitAt === -1) continue;
    const headers = part.slice(0, splitAt);
    let body = part.slice(splitAt + 4);
    if (body.endsWith('\r\n')) body = body.slice(0, -2);
    const name = /name="([^"]+)"/.exec(headers);
    if (!name) continue;
    const filename = /filename="([^"]*)"/.exec(headers);
    if (filename && filename[1]) {
      const typeMatch = /content-type:\s*([^\r\n]+)/i.exec(headers);
      files.push({
        field: name[1],
        filename: filename[1],
        type: typeMatch ? typeMatch[1].trim().toLowerCase() : '',
        data: Buffer.from(body, 'latin1'),
      });
    } else if (fields[name[1]] === undefined) {
      fields[name[1]] = Buffer.from(body, 'latin1').toString('utf8');
    }
  }
  fields._files = files;
  return fields;
}

async function readInput(req) {
  const raw = await readBody(req);
  const type = req.headers['content-type'] || '';
  if (!raw.length) return {};
  if (type.includes('multipart/form-data')) return parseMultipart(raw, type);
  const text = raw.toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw httpError(400, 'Request body must be JSON.');
  }
}

function send(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Chat-Token',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function publicBlogs(url) {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 10)));
  const search = (url.searchParams.get('search') || '').trim().toLowerCase();
  const category = url.searchParams.get('category');
  let items = db.blogs.filter((blog) => blog.isPublished !== false);
  if (search) {
    items = items.filter((blog) =>
      [blog.title, blog.shortDescription, blog.content, ...(blog.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(search)
    );
  }
  if (category) {
    items = items.filter(
      (blog) =>
        String(blog.categoryId) === String(category) ||
        blog.category?.slug === category
    );
  }
  items.sort(
    (a, b) =>
      new Date(b.publishedAt || b.createdAt || 0) - new Date(a.publishedAt || a.createdAt || 0)
  );
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit) || 1);
  const blogs = items.slice((page - 1) * limit, page * limit).map(blogListItem);
  return { success: true, data: { blogs, pagination: { total, page, pages, limit } } };
}

function normalizeBlog(body, existing = {}) {
  const title = String(body.title ?? existing.title ?? '').trim();
  if (!title) throw httpError(400, 'Title is required.');
  const now = new Date().toISOString();
  const categoryId =
    body.categoryId === '' || body.categoryId === undefined || body.categoryId === null
      ? existing.categoryId ?? null
      : Number(body.categoryId);
  const blog = {
    ...existing,
    title,
    slug: uniqueSlug(db.blogs, slugify(body.slug || existing.slug || title), existing.id),
    shortDescription: String(body.shortDescription ?? existing.shortDescription ?? ''),
    content: String(body.content ?? existing.content ?? ''),
    featuredImage: String(body.featuredImage ?? existing.featuredImage ?? ''),
    authorId: existing.authorId ?? 1,
    categoryId: Number.isFinite(categoryId) ? categoryId : null,
    readTime: Number(body.readTime ?? existing.readTime ?? 5) || 5,
    likesCount: existing.likesCount ?? 0,
    viewsCount: existing.viewsCount ?? 0,
    isPublished: asBool(body.isPublished, existing.isPublished ?? true),
    isFeatured: asBool(body.isFeatured, existing.isFeatured ?? false),
    metaTitle: String(body.metaTitle ?? existing.metaTitle ?? title),
    metaDescription: String(
      body.metaDescription ?? existing.metaDescription ?? body.shortDescription ?? ''
    ),
    tags: body.tags === undefined && existing.tags ? existing.tags : asTags(body.tags),
    publishedAt: existing.publishedAt || now,
    createdAt: existing.createdAt || now,
    updatedAt: now,
    author: existing.author || { fullName: 'Globeflight Kenya', avatarUrl: null },
  };
  blog.category = categoryEmbed(blog.categoryId);
  return blog;
}

function normalizeService(body, existing = {}) {
  const title = String(body.title ?? existing.title ?? '').trim();
  if (!title) throw httpError(400, 'Title is required.');
  const now = new Date().toISOString();
  const faq = Array.isArray(body.faq)
    ? body.faq
        .map((item) => ({
          question: String(item?.question || '').trim(),
          answer: String(item?.answer || '').trim(),
        }))
        .filter((item) => item.question || item.answer)
    : existing.faq || [];
  return {
    ...existing,
    title,
    slug: uniqueSlug(db.services, slugify(body.slug || existing.slug || title), existing.id),
    shortDescription: String(body.shortDescription ?? existing.shortDescription ?? ''),
    description: String(body.description ?? existing.description ?? ''),
    imageUrl: String(body.imageUrl ?? existing.imageUrl ?? ''),
    galleryUrls:
      body.galleryUrls === undefined && existing.galleryUrls
        ? existing.galleryUrls
        : asLines(body.galleryUrls),
    keyBenefits:
      body.keyBenefits === undefined && existing.keyBenefits
        ? existing.keyBenefits
        : asLines(body.keyBenefits),
    faq,
    metaTitle: String(body.metaTitle ?? existing.metaTitle ?? title),
    metaDescription: String(body.metaDescription ?? existing.metaDescription ?? ''),
    isPublished: asBool(body.isPublished, existing.isPublished !== false),
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };
}

function normalizeCategory(body, existing = {}) {
  const name = String(body.name ?? existing.name ?? '').trim();
  if (!name) throw httpError(400, 'Name is required.');
  const now = new Date().toISOString();
  return {
    ...existing,
    name,
    slug: uniqueSlug(db.categories, slugify(body.slug || existing.slug || name), existing.id),
    description: body.description === undefined ? existing.description ?? null : body.description || null,
    isActive: asBool(body.isActive, existing.isActive ?? true),
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };
}

function normalizeJob(body, existing = {}) {
  const title = String(body.title ?? existing.title ?? '').trim();
  if (!title) throw httpError(400, 'Title is required.');
  const now = new Date().toISOString();
  const deadline = body.applicationDeadline === undefined
    ? existing.applicationDeadline ?? null
    : body.applicationDeadline || null;
  return {
    ...existing,
    title,
    slug: uniqueSlug(db.jobs, slugify(body.slug || existing.slug || title), existing.id),
    department: String(body.department ?? existing.department ?? ''),
    location: String(body.location ?? existing.location ?? ''),
    jobType: String(body.jobType ?? existing.jobType ?? 'full-time'),
    description: String(body.description ?? existing.description ?? ''),
    requirements: String(body.requirements ?? existing.requirements ?? ''),
    responsibilities: String(body.responsibilities ?? existing.responsibilities ?? ''),
    applicationDeadline: deadline,
    isPublished: asBool(body.isPublished, existing.isPublished ?? true),
    isClosed: asBool(body.isClosed, existing.isClosed ?? false),
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };
}

function recentApplicants(jobId) {
  return db.applications
    .filter((item) => String(item.jobId) === String(jobId))
    .slice(0, 4)
    .map((item) => ({ id: item.id, name: item.name || 'Applicant' }));
}

function adminJobList(url) {
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 9)));
  const search = (url.searchParams.get('search') || '').trim().toLowerCase();
  const published = url.searchParams.get('published');
  const closed = url.searchParams.get('closed');
  let items = db.jobs.map((job) => ({ ...job, recentApplications: recentApplicants(job.id) }));
  if (published === 'true') items = items.filter((job) => job.isPublished !== false);
  if (published === 'false') items = items.filter((job) => job.isPublished === false);
  if (closed === 'true') items = items.filter((job) => job.isClosed === true);
  if (closed === 'false') items = items.filter((job) => job.isClosed !== true);
  if (search) {
    items = items.filter((job) =>
      [job.title, job.department, job.location, job.description].join(' ').toLowerCase().includes(search)
    );
  }
  items.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  const total = items.length;
  const pages = Math.max(1, Math.ceil(total / limit) || 1);
  return {
    jobs: items.slice((page - 1) * limit, page * limit),
    pagination: { total, page, pages, limit },
  };
}

function jobStats() {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const newThisWeek = db.applications.filter((item) => new Date(item.createdAt || 0).getTime() >= weekAgo).length;
  return {
    jobs: {
      published: db.jobs.filter((job) => job.isPublished !== false && job.isClosed !== true).length,
      total: db.jobs.length,
    },
    applications: { total: db.applications.length },
    applicationTrend: [{ count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }, { count: 0 }, { count: newThisWeek }],
  };
}

function adminTestimonialList(url) {
  const published = url.searchParams.get('published');
  let items = [...db.testimonials];
  if (published === 'true') items = items.filter((item) => item.isPublished !== false);
  if (published === 'false') items = items.filter((item) => item.isPublished === false);
  return { testimonials: items };
}

function testimonialStats() {
  const published = db.testimonials.filter((item) => item.isPublished !== false);
  const ratings = db.testimonials.map((item) => Number(item.rating)).filter((rating) => Number.isFinite(rating));
  const average = ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0;
  return {
    total: db.testimonials.length,
    published: published.length,
    drafts: db.testimonials.length - published.length,
    avgRating: Math.round(average * 10) / 10,
  };
}

function normalizeTestimonial(body, existing = {}) {
  const name = String(body.name ?? existing.name ?? '').trim();
  const content = String(body.content ?? existing.content ?? '').trim();
  if (!name || !content) throw httpError(400, 'Name and review are required.');
  const now = new Date().toISOString();
  const rating = Math.min(5, Math.max(1, Number(body.rating ?? existing.rating ?? 5) || 5));
  return {
    ...existing,
    name,
    position: String(body.position ?? existing.position ?? 'Client'),
    company: String(body.company ?? existing.company ?? ''),
    content,
    avatarUrl: existing.avatarUrl ?? null,
    rating,
    isPublished: asBool(body.isPublished, existing.isPublished ?? true),
    improvement: existing.improvement ?? null,
    consent: existing.consent ?? false,
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };
}

function verifyPassword(password, auth) {
  const actual = Buffer.from(auth.hash, 'hex');
  const given = crypto.scryptSync(String(password || ''), auth.salt, actual.length);
  return actual.length === given.length && crypto.timingSafeEqual(actual, given);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

function loadAuth() {
  const raw = JSON.parse(fs.readFileSync(AUTH_PATH, 'utf8'));
  if (Array.isArray(raw.users)) return raw;
  if (raw && raw.email) {
    return {
      users: [
        {
          id: 1,
          email: raw.email,
          fullName: raw.fullName || 'Globeflight Admin',
          phone: '',
          department: '',
          role: raw.role || 'superadmin',
          isActive: true,
          salt: raw.salt,
          hash: raw.hash,
          createdAt: new Date().toISOString(),
          lastLoginAt: null,
        },
      ],
    };
  }
  return { users: [] };
}

let authStore = loadAuth();

function saveAuth() {
  const tmp = `${AUTH_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(authStore, null, 2));
  fs.renameSync(tmp, AUTH_PATH);
}

function presentAccount(user) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone || '',
    department: user.department || '',
    role: user.role,
    isActive: user.isActive !== false,
    avatarUrl: user.avatarUrl || null,
    lastLoginAt: user.lastLoginAt || null,
    createdAt: user.createdAt || null,
  };
}

function findAccountByEmail(email) {
  const needle = String(email || '').trim().toLowerCase();
  return authStore.users.find((user) => String(user.email).toLowerCase() === needle);
}

function requireRole(user, roles) {
  if (!roles.includes(user.role)) throw httpError(403, 'You do not have permission to do that.');
}

const ACCOUNT_ROLES = ['user', 'admin', 'superadmin'];

function otherActiveSuperadmins(exceptId) {
  return authStore.users.filter(
    (user) =>
      user.role === 'superadmin' &&
      user.isActive !== false &&
      String(user.id) !== String(exceptId)
  ).length;
}

const SHIPMENT_STATUSES = [
  'created',
  'collected',
  'departed',
  'in-transit',
  'arrived-at-destination',
  'out-for-delivery',
  'delivered',
];

function shipmentNumber() {
  const year = new Date().getFullYear();
  const prefix = `GF${year}`;
  const highest = db.shipments.reduce((max, shipment) => {
    const match = String(shipment.trackingNumber || '').match(/(\d{4})$/);
    return Math.max(max, match ? Number(match[1]) : 0);
  }, 1000);
  return `${prefix}${String(highest + 1).padStart(4, '0')}`;
}

function dimensionMath(dimensions) {
  const parts = String(dimensions || '')
    .toLowerCase()
    .split('x')
    .map((part) => Number(part.trim()));
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part) || part <= 0)) {
    return { cbm: '', volumeWeight: '' };
  }
  const cbm = (parts[0] * parts[1] * parts[2]) / 1_000_000;
  return { cbm: cbm.toFixed(4), volumeWeight: (cbm * 167).toFixed(2) };
}

function normalizeShipment(body, existing = {}) {
  const origin = String(body.origin ?? existing.origin ?? '').trim();
  const destination = String(body.destination ?? existing.destination ?? '').trim();
  const shipperCompanyName = String(body.shipperCompanyName ?? existing.shipperCompanyName ?? '').trim();
  const receiverCompanyName = String(body.receiverCompanyName ?? existing.receiverCompanyName ?? '').trim();
  if (!shipperCompanyName || !receiverCompanyName) {
    throw httpError(400, 'Shipper and receiver are required.');
  }
  if (!origin || !destination) throw httpError(400, 'Origin and destination are required.');
  const note = String(body.note ?? existing.note ?? '').trim();
  const packageDescription = String(body.packageDescription ?? existing.packageDescription ?? '').trim();
  if (!existing.id) {
    const text = (value) => String(value || '').trim();
    const parcelMissing =
      (body.shipmentType || existing.shipmentType || 'parcel') === 'parcel' &&
      !text(body.parcelName ?? existing.parcelName);
    const missing = [
      shipperCompanyName,
      body.shipperContactPerson,
      body.shipperCountry,
      body.shipperCity,
      body.shipperAddress,
      receiverCompanyName,
      body.receiverContactPerson,
      body.receiverCountry,
      body.receiverCity,
      body.receiverAddress,
      origin,
      destination,
      packageDescription,
    ].some((value) => !text(value));
    if (missing || parcelMissing || note.length < 5) {
      throw httpError(400, 'Please fill in all the required fields marked with *.');
    }
  }
  const now = new Date().toISOString();
  const dimensions = String(body.dimensions ?? existing.dimensions ?? '');
  const math = dimensionMath(dimensions);
  const grossWeight = String(body.grossWeight ?? body.weight ?? existing.grossWeight ?? '');
  const volumeWeight = math.volumeWeight || existing.volumeWeight || '';
  const manualChargeable = body.chargeableWeight;
  const chargeableWeight =
    manualChargeable === undefined || manualChargeable === ''
      ? existing.chargeableWeight ||
        (Math.max(Number(grossWeight) || 0, Number(volumeWeight) || 0) || '')
      : String(manualChargeable);
  const shipperContactPerson = String(body.shipperContactPerson ?? existing.shipperContactPerson ?? '');
  const receiverContactPerson = String(body.receiverContactPerson ?? existing.receiverContactPerson ?? '');
  return {
    ...existing,
    trackingNumber: existing.trackingNumber || shipmentNumber(),
    shipperCompanyName,
    shipperContactPerson,
    shipperCountry: String(body.shipperCountry ?? existing.shipperCountry ?? ''),
    shipperCity: String(body.shipperCity ?? existing.shipperCity ?? ''),
    shipperAddress: String(body.shipperAddress ?? existing.shipperAddress ?? ''),
    shipperPostalCode: String(body.shipperPostalCode ?? existing.shipperPostalCode ?? ''),
    shipperMobile: String(body.shipperMobile ?? existing.shipperMobile ?? ''),
    shipperEmail: String(body.shipperEmail ?? existing.shipperEmail ?? ''),
    shipperAccountNo: String(body.shipperAccountNo ?? existing.shipperAccountNo ?? ''),
    shipperReference: String(body.shipperReference ?? existing.shipperReference ?? ''),
    receiverType: body.receiverType || existing.receiverType || 'individual',
    receiverCompanyName,
    receiverContactPerson,
    receiverCountry: String(body.receiverCountry ?? existing.receiverCountry ?? ''),
    receiverCity: String(body.receiverCity ?? existing.receiverCity ?? ''),
    receiverAddress: String(body.receiverAddress ?? existing.receiverAddress ?? ''),
    receiverPostalCode: String(body.receiverPostalCode ?? existing.receiverPostalCode ?? ''),
    receiverMobile: String(body.receiverMobile ?? existing.receiverMobile ?? ''),
    receiverEmail: String(body.receiverEmail ?? existing.receiverEmail ?? ''),
    receiverAccountNo: String(body.receiverAccountNo ?? existing.receiverAccountNo ?? ''),
    receiverReference: String(body.receiverReference ?? existing.receiverReference ?? ''),
    senderName: shipperContactPerson || shipperCompanyName,
    receiverName: receiverContactPerson || receiverCompanyName,
    shipmentType: body.shipmentType || existing.shipmentType || 'parcel',
    parcelName: String(body.parcelName ?? existing.parcelName ?? ''),
    packageDescription,
    grossWeight,
    weight: grossWeight,
    dimensions,
    cbm: math.cbm || existing.cbm || '',
    volumeWeight,
    chargeableWeight: chargeableWeight === '' ? '' : String(chargeableWeight),
    declaredValue: String(body.declaredValue ?? existing.declaredValue ?? ''),
    currency: body.currency || existing.currency || 'USD',
    thirdPartyTrackingNumber: String(
      body.thirdPartyTrackingNumber ?? existing.thirdPartyTrackingNumber ?? ''
    ),
    numberOfPackages: Number(body.numberOfPackages ?? existing.numberOfPackages ?? 1) || 1,
    serviceType: String(body.serviceType ?? existing.serviceType ?? ''),
    mode: body.mode || existing.mode || 'air',
    origin,
    destination,
    note,
    status: existing.status || 'created',
    updates: existing.updates || [],
    proofOfDelivery: existing.proofOfDelivery || [],
    exceptions: existing.exceptions || [],
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };
}

function publicShipment(shipment) {
  return {
    ...shipment,
    senderName: shipment.senderName || shipment.shipperContactPerson || shipment.shipperCompanyName,
    receiverName: shipment.receiverName || shipment.receiverContactPerson || shipment.receiverCompanyName,
    weight: shipment.weight || shipment.grossWeight,
    updates: shipment.updates || [],
    proofOfDelivery: shipment.proofOfDelivery || [],
    exceptions: shipment.exceptions || [],
  };
}

function findShipment(key) {
  let decoded = key;
  try {
    decoded = decodeURIComponent(key);
  } catch {
    decoded = key;
  }
  const value = String(decoded).trim().toLowerCase();
  return db.shipments.find(
    (shipment) =>
      String(shipment.trackingNumber).toLowerCase() === value || String(shipment.id) === value
  );
}

function addShipmentUpdate(shipment, body) {
  const status = String(body.status || '').trim();
  const location = String(body.location || '').trim();
  const description = String(body.description || body.note || '').trim();
  if (!SHIPMENT_STATUSES.includes(status)) throw httpError(400, 'Choose a valid status.');
  if (!location) throw httpError(400, 'Please specify where the shipment is located.');
  if (description.length < 5) throw httpError(400, 'Please provide a note with at least 5 characters.');
  const now = new Date().toISOString();
  const update = {
    id: nextId(shipment.updates || []),
    status,
    location,
    description,
    latitude: body.latitude === '' || body.latitude == null ? null : Number(body.latitude),
    longitude: body.longitude === '' || body.longitude == null ? null : Number(body.longitude),
    updateDateTime: now,
    createdAt: now,
  };
  shipment.updates = [...(shipment.updates || []), update];
  shipment.status = status;
  shipment.updatedAt = now;
  if (status === 'delivered') {
    shipment.proofOfDelivery = [
      {
        id: nextId(shipment.proofOfDelivery || []),
        recipientName: String(body.recipientName || shipment.receiverName || 'Recipient'),
        deliveryLocation: location,
        notes: description,
        createdAt: now,
      },
    ];
  }
  return update;
}

async function handle(req, res) {
  const url = new URL(req.url || '/', `http://127.0.0.1:${PORT}`);
  const pathname = url.pathname.replace(/\/+$/, '') || '/';
  const method = req.method || 'GET';

  if (method === 'GET' && pathname.startsWith('/uploads/')) {
    const name = path.basename(decodeURIComponent(pathname));
    if (!name || name === '.' || name === '..') throw httpError(404, 'File not found.');
    const filePath = path.join(UPLOAD_DIR, name);
    const types = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
    };
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, {
        'Content-Type': types[path.extname(name).toLowerCase()] || 'application/octet-stream',
        'Content-Length': data.length,
        'Cache-Control': 'public, max-age=86400',
      });
      res.end(data);
      return;
    }
    const upstream = await fetch(`https://globeflight.co.ke/uploads/${encodeURIComponent(name)}`);
    if (!upstream.ok) throw httpError(404, 'File not found.');
    const data = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(200, {
      'Content-Type': upstream.headers.get('content-type') || 'application/octet-stream',
      'Content-Length': data.length,
      'Cache-Control': 'public, max-age=3600',
    });
    res.end(data);
    return;
  }

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept, X-Chat-Token',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    });
    res.end();
    return;
  }

  if (method === 'GET' && (pathname === '/sitemap.xml' || pathname === '/rss.xml' || pathname === '/robots.txt')) {
    const origin = requestOrigin(req, url);
    const feeds = buildFeeds(db, origin);
    const body = pathname === '/sitemap.xml' ? feeds.sitemap : pathname === '/rss.xml' ? feeds.rss : feeds.robots;
    const type = pathname === '/robots.txt' ? 'text/plain; charset=utf-8' : 'application/xml; charset=utf-8';
    res.writeHead(200, {
      'Content-Type': type,
      'Content-Length': Buffer.byteLength(body),
      'Cache-Control': 'public, max-age=300',
    });
    res.end(body);
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/health') {
    send(res, 200, { success: true, data: { ok: true } });
    return;
  }

  if (method === 'POST' && pathname === '/admin/api/auth/login') {
    const body = await readInput(req);
    const account = findAccountByEmail(body.email);
    if (!account || !verifyPassword(body.password, account)) {
      throw httpError(401, 'Invalid email or password.');
    }
    if (account.isActive === false) throw httpError(403, 'This account is turned off.');
    account.lastLoginAt = new Date().toISOString();
    saveAuth();
    const token = crypto.randomBytes(32).toString('hex');
    const user = presentAccount(account);
    sessions.set(token, { user, exp: Date.now() + SESSION_MS });
    send(res, 200, { token, user, success: true });
    return;
  }

  if (method === 'GET' && (pathname === '/admin/api/auth/me' || pathname === '/admin/api/auth/profile')) {
    const user = requireUser(req);
    send(res, 200, { success: true, user, data: user });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/blogs/public') {
    send(res, 200, publicBlogs(url));
    return;
  }

  const publicBlog = pathname.match(/^\/admin\/api\/blogs\/public\/([^/]+)$/);
  if (method === 'GET' && publicBlog) {
    const slug = decodeURIComponent(publicBlog[1]);
    const blog = db.blogs.find((item) => item.slug === slug && item.isPublished !== false);
    if (!blog) throw httpError(404, 'Post not found.');
    const relatedPosts = db.blogs
      .filter(
        (item) =>
          item.id !== blog.id &&
          item.isPublished !== false &&
          item.categoryId === blog.categoryId
      )
      .slice(0, 3)
      .map(blogListItem);
    send(res, 200, { success: true, data: { ...blog, relatedPosts, comments: [] } });
    return;
  }

  if (method === 'POST' && pathname === '/admin/api/blogs/newsletter/subscribe') {
    const body = await readInput(req);
    const email = String(body.email || '').trim().toLowerCase();
    if (!email.includes('@')) throw httpError(400, 'Please enter a valid email address.');
    const existing = db.subscribers.find((item) => item.email === email);
    if (existing) {
      if (existing.isActive === false) {
        existing.isActive = true;
        existing.unsubscribedAt = null;
        addNotification({
          type: 'subscriber',
          title: 'New newsletter subscriber',
          detail: existing.email,
          link: '/newsletter-subscribers',
          refId: existing.id,
          createdAt: new Date().toISOString(),
        });
        saveDb();
      }
    } else {
      const subscriber = {
        id: nextId(db.subscribers),
        email,
        isActive: true,
        unsubscribedAt: null,
        createdAt: new Date().toISOString(),
      };
      db.subscribers.unshift(subscriber);
      addNotification({
        type: 'subscriber',
        title: 'New newsletter subscriber',
        detail: subscriber.email,
        link: '/newsletter-subscribers',
        refId: subscriber.id,
        createdAt: subscriber.createdAt,
      });
      saveDb();
    }
    send(res, 200, { success: true, message: 'Subscribed.' });
    return;
  }

  if (method === 'POST' && pathname === '/admin/api/blogs/newsletter/unsubscribe') {
    const body = await readInput(req);
    const email = String(body.email || '').trim().toLowerCase();
    const existing = db.subscribers.find((item) => item.email === email);
    if (existing && existing.isActive !== false) {
      existing.isActive = false;
      existing.unsubscribedAt = new Date().toISOString();
      saveDb();
    }
    send(res, 200, { success: true, message: 'Unsubscribed.' });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/services/public') {
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 100)));
    send(res, 200, { success: true, data: { services: db.services.slice(0, limit) } });
    return;
  }

  const publicService = pathname.match(/^\/admin\/api\/services\/public\/([^/]+)$/);
  if (method === 'GET' && publicService) {
    const key = decodeURIComponent(publicService[1]);
    const service =
      db.services.find((item) => item.slug === key) || findById(db.services, key);
    if (!service) throw httpError(404, 'Service not found.');
    send(res, 200, { success: true, data: service });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/categories') {
    send(res, 200, { success: true, data: db.categories });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/jobs/public') {
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 10)));
    const openJobs = db.jobs.filter((job) => job.isPublished !== false);
    const total = openJobs.length;
    const pages = total === 0 ? 0 : Math.ceil(total / limit);
    const jobs = openJobs.slice((page - 1) * limit, page * limit);
    send(res, 200, { success: true, data: { jobs, pagination: { total, page, pages, limit } } });
    return;
  }

  const publicJob = pathname.match(/^\/admin\/api\/jobs\/public\/([^/]+)$/);
  if (method === 'GET' && publicJob) {
    const key = decodeURIComponent(publicJob[1]);
    const job = db.jobs.find((item) => item.slug === key) || findById(db.jobs, key);
    if (!job || job.isPublished === false) throw httpError(404, 'Job not found.');
    send(res, 200, { success: true, data: job });
    return;
  }

  const apply = pathname.match(/^\/admin\/api\/jobs\/public\/(\d+)\/apply$/);
  if (method === 'POST' && apply) {
    const job = findById(db.jobs, apply[1]);
    if (!job) throw httpError(404, 'Job not found.');
    const deadline = job.applicationDeadline ? new Date(job.applicationDeadline) : null;
    if (job.isClosed || (deadline && deadline < new Date())) {
      throw httpError(400, 'This position is closed.');
    }
    const body = await readInput(req);
    if (!String(body.name || '').trim() || !String(body.email || '').includes('@')) {
      throw httpError(400, 'Name and email are required.');
    }
    db.applications.unshift({
      id: nextId(db.applications),
      jobId: job.id,
      jobTitle: job.title,
      name: String(body.name).trim(),
      email: String(body.email).trim(),
      phone: String(body.phone || ''),
      coverLetter: String(body.coverLetter || ''),
      portfolioUrl: String(body.portfolioUrl || ''),
      files: body._files || [],
      createdAt: new Date().toISOString(),
    });
    saveDb();
    send(res, 200, { success: true, message: 'Application received.' });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/testimonials/public') {
    const testimonials = db.testimonials.filter((item) => item.isPublished !== false);
    send(res, 200, { success: true, data: testimonials });
    return;
  }

  const publicTracking = pathname.match(/^\/admin\/api\/tracking\/public\/([^/]+)$/);
  if (method === 'GET' && publicTracking) {
    const shipment = findShipment(publicTracking[1]);
    if (!shipment) throw httpError(404, 'No shipment found for this consignment number.');
    send(res, 200, { success: true, data: publicShipment(shipment) });
    return;
  }

  if (method === 'POST' && pathname === '/admin/api/contacts/public') {
    const body = await readInput(req);
    const { _files, ...fields } = body;
    const contact = {
      id: nextId(db.contacts),
      ...fields,
      isRead: false,
      isStarred: false,
      createdAt: new Date().toISOString(),
    };
    db.contacts.unshift(contact);
    addNotification(messageNotification(contact));
    saveDb();
    const notice = await sendMail({
      to: notifyAddress(),
      subject: `New website message from ${contact.name || 'a visitor'}`,
      text: newMessageEmailText(presentContact(contact)),
    });
    if (!notice.sent && notice.reason !== 'not-configured') {
      console.error('New message email failed:', notice.reason);
    }
    send(res, 200, { success: true, message: 'Message sent.' });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/chat/status') {
    send(res, 200, { success: true, data: { staffOnline: isStaffOnline() } });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/chat') {
    send(res, 200, { success: true, data: readVisitorChat(db, req.headers['x-chat-token']) });
    return;
  }

  if (method === 'POST' && pathname === '/admin/api/chat/start') {
    const body = await readInput(req);
    const token = String(req.headers['x-chat-token'] || '');
    const started = startVisitorChat(db, {
      token,
      email: body.email,
      phone: body.phone,
      name: body.name,
    });
    if (started.captured) {
      const chat = started.chat;
      const contactLine = `${chat.visitorPhone} · ${chat.visitorEmail}`;
      const existing = (db.notifications || []).find((note) => note.type === 'chat' && note.refId === chat.id);
      if (existing) {
        existing.isRead = false;
        existing.title = clip(`Live chat from ${chat.visitorName || chat.visitorEmail}`, 80);
        existing.detail = clip(contactLine, 160);
        existing.createdAt = new Date().toISOString();
        db.notifications = [existing, ...(db.notifications || []).filter((note) => note !== existing)];
      } else {
        addNotification({
          type: 'chat',
          title: `Live chat from ${chat.visitorName || chat.visitorEmail}`,
          detail: contactLine,
          link: '/chat',
          refId: chat.id,
        });
      }
      await emailLiveChat(chat);
      saveDb();
    }
    send(res, 200, { success: true, data: started.thread });
    return;
  }

  if (method === 'POST' && pathname === '/admin/api/chat/messages') {
    const body = await readInput(req);
    const token = String(req.headers['x-chat-token'] || '');
    const limitKey = token || req.socket.remoteAddress || 'visitor';
    if (!allowChatMessage(limitKey)) {
      throw httpError(429, 'Please wait a moment before sending another message.');
    }
    const data = await postVisitorMessage(db, { token, text: body.text, name: body.name }, async (chat, text) => {
      const name = chat.visitorName || chat.visitorEmail || 'a visitor';
      const contact = [chat.visitorPhone, chat.visitorEmail].filter(Boolean).join(' · ');
      const detail = contact ? `${contact} — ${text}` : text;
      const existing = (db.notifications || []).find((note) => note.type === 'chat' && note.refId === chat.id);
      if (existing) {
        existing.isRead = false;
        existing.title = clip(`Live chat from ${name}`, 80);
        existing.detail = clip(detail, 160);
        existing.createdAt = new Date().toISOString();
        db.notifications = [existing, ...(db.notifications || []).filter((note) => note !== existing)];
      } else {
        addNotification({
          type: 'chat',
          title: `Live chat from ${name}`,
          detail,
          link: '/chat',
          refId: chat.id,
        });
      }
      if (!isStaffOnline() && liveChatAlertDue(chat)) await emailLiveChat(chat, text);
    });
    saveDb();
    send(res, 200, { success: true, data });
    return;
  }

  const sessionUser = requireUser(req);

  if (
    pathname.startsWith('/admin/api/enhanced-tracking') ||
    pathname.startsWith('/admin/api/tracking/')
  ) {
    requireRole(sessionUser, ['admin', 'superadmin']);
  }
  if (pathname.startsWith('/admin/api/jobs')) {
    requireRole(sessionUser, ['superadmin']);
  }

  if (method === 'POST' && pathname === '/admin/api/chat/presence') {
    requireRole(sessionUser, ['admin', 'superadmin']);
    markStaffPresent(sessionUser.id);
    send(res, 200, { success: true, data: { staffOnline: true } });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/chat/inbox') {
    requireRole(sessionUser, ['admin', 'superadmin']);
    markStaffPresent(sessionUser.id);
    send(res, 200, { success: true, data: staffInbox(db) });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/chat/contacts') {
    requireRole(sessionUser, ['admin', 'superadmin']);
    const listed = listChatContacts(db);
    if (listed.changed) saveDb();
    send(res, 200, { success: true, data: listed.contacts });
    return;
  }

  const chatThread = pathname.match(/^\/admin\/api\/chat\/inbox\/(\d+)$/);
  if (chatThread && method === 'GET') {
    requireRole(sessionUser, ['admin', 'superadmin']);
    markStaffPresent(sessionUser.id);
    const data = staffThread(db, chatThread[1]);
    for (const note of db.notifications || []) {
      if (note.type === 'chat' && String(note.refId) === String(chatThread[1])) note.isRead = true;
    }
    saveDb();
    send(res, 200, { success: true, data });
    return;
  }

  const chatReply = pathname.match(/^\/admin\/api\/chat\/inbox\/(\d+)\/reply$/);
  if (chatReply && method === 'POST') {
    requireRole(sessionUser, ['admin', 'superadmin']);
    const body = await readInput(req);
    const data = staffReply(db, chatReply[1], sessionUser, body.text);
    for (const note of db.notifications || []) {
      if (note.type === 'chat' && String(note.refId) === String(chatReply[1])) note.isRead = true;
    }
    saveDb();
    send(res, 200, { success: true, data });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/users/stats') {
    requireRole(sessionUser, ['admin', 'superadmin']);
    const roleDistribution = ACCOUNT_ROLES.map((role) => ({
      role,
      count: authStore.users.filter((user) => user.role === role).length,
    }));
    send(res, 200, { success: true, data: { roleDistribution } });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/users') {
    requireRole(sessionUser, ['admin', 'superadmin']);
    const users = [...authStore.users]
      .sort((a, b) => String(a.fullName).localeCompare(String(b.fullName)))
      .map(presentAccount);
    send(res, 200, { success: true, data: { users } });
    return;
  }
  if (method === 'POST' && pathname === '/admin/api/users') {
    requireRole(sessionUser, ['admin', 'superadmin']);
    const body = await readInput(req);
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim();
    const password = String(body.password || '');
    const role = String(body.role || 'user');
    if (!fullName || !email || !password) throw httpError(400, 'Name, email, and password are required.');
    if (!ACCOUNT_ROLES.includes(role)) throw httpError(400, 'Choose a valid role.');
    if (findAccountByEmail(email)) throw httpError(400, 'That email is already used.');
    const account = {
      id: nextId(authStore.users),
      email,
      fullName,
      phone: String(body.phone || '').trim(),
      department: String(body.department || '').trim(),
      role,
      isActive: true,
      ...hashPassword(password),
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    };
    authStore.users.push(account);
    saveAuth();
    send(res, 201, { success: true, data: presentAccount(account) });
    return;
  }
  const userActive = pathname.match(/^\/admin\/api\/users\/(\d+)\/toggle-active$/);
  if (method === 'PATCH' && userActive) {
    requireRole(sessionUser, ['admin', 'superadmin']);
    const account = findById(authStore.users, userActive[1]);
    if (!account) throw httpError(404, 'User not found.');
    const nextActive = account.isActive === false;
    if (account.role === 'superadmin' && account.isActive !== false && !nextActive && otherActiveSuperadmins(account.id) === 0) {
      throw httpError(400, 'Keep at least one superadmin signed in.');
    }
    account.isActive = nextActive;
    saveAuth();
    send(res, 200, { success: true, data: presentAccount(account) });
    return;
  }
  const userId = pathname.match(/^\/admin\/api\/users\/(\d+)$/);
  if (userId && method === 'PUT') {
    requireRole(sessionUser, ['admin', 'superadmin']);
    const account = findById(authStore.users, userId[1]);
    if (!account) throw httpError(404, 'User not found.');
    const body = await readInput(req);
    const fullName = String(body.fullName || '').trim();
    const email = String(body.email || '').trim();
    const role = String(body.role || account.role);
    if (!fullName || !email) throw httpError(400, 'Name and email are required.');
    if (!ACCOUNT_ROLES.includes(role)) throw httpError(400, 'Choose a valid role.');
    if (authStore.users.some((user) => user !== account && String(user.email).toLowerCase() === email.toLowerCase())) {
      throw httpError(400, 'That email is already used.');
    }
    const nextActive = asBool(body.isActive, account.isActive !== false);
    const losesSuperadmin = account.role === 'superadmin' && account.isActive !== false && (role !== 'superadmin' || !nextActive);
    if (losesSuperadmin && otherActiveSuperadmins(account.id) === 0) {
      throw httpError(400, 'Keep at least one superadmin.');
    }
    account.fullName = fullName;
    account.email = email;
    account.phone = String(body.phone || '').trim();
    account.department = String(body.department || '').trim();
    account.role = role;
    account.isActive = nextActive;
    saveAuth();
    send(res, 200, { success: true, data: presentAccount(account) });
    return;
  }
  if (userId && method === 'DELETE') {
    requireRole(sessionUser, ['admin', 'superadmin']);
    const account = findById(authStore.users, userId[1]);
    if (!account) throw httpError(404, 'User not found.');
    if (String(account.id) === String(sessionUser.id)) throw httpError(400, 'You cannot delete the account you are signed in with.');
    if (account.role === 'superadmin' && account.isActive !== false && otherActiveSuperadmins(account.id) === 0) {
      throw httpError(400, 'Keep at least one superadmin.');
    }
    authStore.users = authStore.users.filter((user) => user !== account);
    saveAuth();
    send(res, 200, { success: true });
    return;
  }

  if (method === 'POST' && pathname === '/admin/api/uploads') {
    const body = await readInput(req);
    const file = (body._files || []).find((item) => item.data && item.data.length);
    if (!file) throw httpError(400, 'Choose an image to upload.');
    const urlPath = saveUploadedImage(file);
    send(res, 201, { success: true, data: { url: urlPath } });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/dashboard/stats') {
    send(res, 200, { success: true, data: dashboardStats() });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/dashboard/recent-activity') {
    const limit = Math.max(1, Math.min(50, Number(url.searchParams.get('limit') || 10)));
    send(res, 200, { success: true, data: recentActivity(limit) });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/dashboard/analytics') {
    send(res, 200, { success: true, data: dashboardAnalytics(url.searchParams.get('period') || '30d') });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/dashboard/notifications') {
    send(res, 200, { success: true, data: (db.notifications || []).slice(0, 30) });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/stats') {
    send(res, 200, {
      success: true,
      data: {
        blogs: db.blogs.length,
        services: db.services.length,
        categories: db.categories.length,
        jobs: db.jobs.length,
        testimonials: db.testimonials.length,
        shipments: db.shipments.length,
        contacts: db.contacts.length,
        subscribers: db.subscribers.length,
        applications: db.applications.length,
      },
    });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/enhanced-tracking/stats') {
    const count = (status) => db.shipments.filter((shipment) => shipment.status === status).length;
    send(res, 200, {
      success: true,
      data: {
        shipments: {
          total: db.shipments.length,
          delivered: count('delivered'),
          cancelled: count('cancelled'),
          inTransit: db.shipments.filter((shipment) => !['delivered', 'created', 'cancelled'].includes(shipment.status)).length,
          created: count('created'),
        },
      },
    });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/enhanced-tracking/shipments') {
    const search = (url.searchParams.get('search') || '').trim().toLowerCase();
    const status = url.searchParams.get('status');
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 20)));
    let items = [...db.shipments];
    if (status) items = items.filter((shipment) => shipment.status === status);
    if (search) {
      items = items.filter((shipment) =>
        [
          shipment.trackingNumber,
          shipment.senderName,
          shipment.receiverName,
          shipment.shipperCompanyName,
          shipment.receiverCompanyName,
          shipment.origin,
          shipment.destination,
        ]
          .join(' ')
          .toLowerCase()
          .includes(search)
      );
    }
    items.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / limit) || 1);
    send(res, 200, {
      success: true,
      data: {
        shipments: items.slice((page - 1) * limit, page * limit).map(publicShipment),
        pagination: { total, page, pages, limit },
      },
    });
    return;
  }

  if (method === 'POST' && pathname === '/admin/api/enhanced-tracking/shipments') {
    const body = await readInput(req);
    const shipment = normalizeShipment(body);
    shipment.id = nextId(db.shipments);
    const now = shipment.createdAt;
    shipment.updates = [
      {
        id: 1,
        status: 'created',
        location: String(body.location || shipment.origin),
        description: shipment.note || 'Shipment created',
        latitude: body.latitude == null || body.latitude === '' ? null : Number(body.latitude),
        longitude: body.longitude == null || body.longitude === '' ? null : Number(body.longitude),
        updateDateTime: now,
        createdAt: now,
      },
    ];
    db.shipments.unshift(shipment);
    saveDb();
    send(res, 201, { success: true, data: publicShipment(shipment) });
    return;
  }

  const trackingItem = pathname.match(/^\/admin\/api\/tracking\/(\d+)$/);
  if (trackingItem && (method === 'GET' || method === 'PUT')) {
    const shipment = findById(db.shipments, trackingItem[1]);
    if (!shipment) throw httpError(404, 'Shipment not found.');
    if (method === 'GET') {
      send(res, 200, { success: true, data: publicShipment(shipment) });
      return;
    }
    const updated = normalizeShipment(await readInput(req), shipment);
    Object.assign(shipment, updated, { updates: shipment.updates, status: shipment.status });
    saveDb();
    send(res, 200, { success: true, data: publicShipment(shipment) });
    return;
  }

  const shipmentUpdate = pathname.match(/^\/admin\/api\/tracking\/(\d+)\/updates$/);
  if (method === 'POST' && shipmentUpdate) {
    const shipment = findById(db.shipments, shipmentUpdate[1]);
    if (!shipment) throw httpError(404, 'Shipment not found.');
    const update = addShipmentUpdate(shipment, await readInput(req));
    saveDb();
    send(res, 201, { success: true, data: { update, shipment: publicShipment(shipment) } });
    return;
  }

  const shipmentId = pathname.match(/^\/admin\/api\/enhanced-tracking\/shipments\/(\d+)$/);
  if (shipmentId) {
    const shipment = findById(db.shipments, shipmentId[1]);
    if (!shipment) throw httpError(404, 'Shipment not found.');
    if (method === 'GET') {
      send(res, 200, { success: true, data: publicShipment(shipment) });
      return;
    }
    if (method === 'PUT') {
      const updated = normalizeShipment(await readInput(req), shipment);
      Object.assign(shipment, updated, { updates: shipment.updates, status: shipment.status });
      saveDb();
      send(res, 200, { success: true, data: publicShipment(shipment) });
      return;
    }
    if (method === 'DELETE') {
      db.shipments = db.shipments.filter((item) => item !== shipment);
      saveDb();
      send(res, 200, { success: true });
      return;
    }
  }

  if (method === 'GET' && pathname === '/admin/api/blogs/stats') {
    send(res, 200, { success: true, data: blogStats() });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/blogs/comments') {
    send(res, 200, { success: true, data: { comments: [] } });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/blogs') {
    send(res, 200, { success: true, data: adminBlogList(url) });
    return;
  }
  if (method === 'POST' && pathname === '/admin/api/blogs') {
    const blog = blogFromRequest(await readInput(req));
    blog.id = nextId(db.blogs);
    db.blogs.unshift(blog);
    saveDb();
    refreshPublicFeeds(req);
    send(res, 201, { success: true, data: presentBlog(blog) });
    return;
  }
  const blogId = pathname.match(/^\/admin\/api\/blogs\/(\d+)$/);
  if (blogId) {
    const blog = findById(db.blogs, blogId[1]);
    if (!blog) throw httpError(404, 'Post not found.');
    if (method === 'GET') {
      send(res, 200, { success: true, data: presentBlog(blog) });
      return;
    }
    if (method === 'PUT') {
      const updated = blogFromRequest(await readInput(req), blog);
      Object.assign(blog, updated);
      saveDb();
      refreshPublicFeeds(req);
      send(res, 200, { success: true, data: presentBlog(blog) });
      return;
    }
    if (method === 'DELETE') {
      db.blogs = db.blogs.filter((item) => item !== blog);
      saveDb();
      refreshPublicFeeds(req);
      send(res, 200, { success: true });
      return;
    }
  }

  if (method === 'GET' && pathname === '/admin/api/services') {
    send(res, 200, { success: true, data: serviceList(url) });
    return;
  }
  if (method === 'POST' && pathname === '/admin/api/services') {
    const service = normalizeService(await readInput(req));
    service.id = nextId(db.services);
    db.services.unshift(service);
    saveDb();
    send(res, 201, { success: true, data: service });
    return;
  }
  const serviceId = pathname.match(/^\/admin\/api\/services\/(\d+)$/);
  if (serviceId) {
    const service = findById(db.services, serviceId[1]);
    if (!service) throw httpError(404, 'Service not found.');
    if (method === 'GET') {
      send(res, 200, { success: true, data: service });
      return;
    }
    if (method === 'PUT') {
      Object.assign(service, normalizeService(await readInput(req), service));
      saveDb();
      send(res, 200, { success: true, data: service });
      return;
    }
    if (method === 'DELETE') {
      db.services = db.services.filter((item) => item !== service);
      saveDb();
      send(res, 200, { success: true });
      return;
    }
  }

  if (method === 'POST' && pathname === '/admin/api/categories') {
    const category = normalizeCategory(await readInput(req));
    category.id = nextId(db.categories);
    db.categories.push(category);
    saveDb();
    send(res, 201, { success: true, data: category });
    return;
  }
  const categoryId = pathname.match(/^\/admin\/api\/categories\/(\d+)$/);
  if (categoryId && method !== 'GET') {
    const category = findById(db.categories, categoryId[1]);
    if (!category) throw httpError(404, 'Category not found.');
    if (method === 'PUT') {
      Object.assign(category, normalizeCategory(await readInput(req), category));
      refreshBlogCategories();
      saveDb();
      send(res, 200, { success: true, data: category });
      return;
    }
    if (method === 'DELETE') {
      if (db.blogs.some((blog) => String(blog.categoryId) === String(category.id))) {
        throw httpError(400, 'Move the posts in this category before deleting it.');
      }
      db.categories = db.categories.filter((item) => item !== category);
      saveDb();
      send(res, 200, { success: true });
      return;
    }
  }

  if (method === 'GET' && pathname === '/admin/api/jobs/stats') {
    send(res, 200, { success: true, data: jobStats() });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/jobs/applications') {
    const jobId = url.searchParams.get('jobId');
    const applications = db.applications.filter((item) => !jobId || String(item.jobId) === String(jobId));
    send(res, 200, { success: true, data: { applications } });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/jobs') {
    send(res, 200, { success: true, data: adminJobList(url) });
    return;
  }
  if (method === 'POST' && pathname === '/admin/api/jobs') {
    const job = normalizeJob(await readInput(req));
    job.id = nextId(db.jobs);
    db.jobs.unshift(job);
    saveDb();
    send(res, 201, { success: true, data: job });
    return;
  }
  const jobClose = pathname.match(/^\/admin\/api\/jobs\/(\d+)\/close$/);
  if (method === 'PATCH' && jobClose) {
    const job = findById(db.jobs, jobClose[1]);
    if (!job) throw httpError(404, 'Job not found.');
    job.isClosed = true;
    job.updatedAt = new Date().toISOString();
    saveDb();
    send(res, 200, { success: true, data: job });
    return;
  }
  const jobId = pathname.match(/^\/admin\/api\/jobs\/(\d+)$/);
  if (jobId) {
    const job = findById(db.jobs, jobId[1]);
    if (!job) throw httpError(404, 'Job not found.');
    if (method === 'GET') {
      send(res, 200, { success: true, data: job });
      return;
    }
    if (method === 'PUT') {
      Object.assign(job, normalizeJob(await readInput(req), job));
      saveDb();
      send(res, 200, { success: true, data: job });
      return;
    }
    if (method === 'DELETE') {
      db.jobs = db.jobs.filter((item) => item !== job);
      saveDb();
      send(res, 200, { success: true });
      return;
    }
  }

  if (method === 'GET' && pathname === '/admin/api/testimonials/stats') {
    send(res, 200, { success: true, data: testimonialStats() });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/testimonials') {
    send(res, 200, { success: true, data: adminTestimonialList(url) });
    return;
  }
  if (method === 'POST' && pathname === '/admin/api/testimonials') {
    const item = normalizeTestimonial(await readInput(req));
    item.id = nextId(db.testimonials);
    db.testimonials.unshift(item);
    saveDb();
    send(res, 201, { success: true, data: item });
    return;
  }
  const testimonialToggle = pathname.match(/^\/admin\/api\/testimonials\/(\d+)\/toggle-publish$/);
  if (method === 'PATCH' && testimonialToggle) {
    const item = findById(db.testimonials, testimonialToggle[1]);
    if (!item) throw httpError(404, 'Testimonial not found.');
    item.isPublished = item.isPublished === false;
    item.updatedAt = new Date().toISOString();
    saveDb();
    send(res, 200, { success: true, data: item });
    return;
  }
  const testimonialId = pathname.match(/^\/admin\/api\/testimonials\/(\d+)$/);
  if (testimonialId) {
    const item = findById(db.testimonials, testimonialId[1]);
    if (!item) throw httpError(404, 'Testimonial not found.');
    if (method === 'PUT') {
      Object.assign(item, normalizeTestimonial(await readInput(req), item));
      saveDb();
      send(res, 200, { success: true, data: item });
      return;
    }
    if (method === 'DELETE') {
      db.testimonials = db.testimonials.filter((row) => row !== item);
      saveDb();
      send(res, 200, { success: true });
      return;
    }
  }

  if (method === 'GET' && pathname === '/admin/api/contacts/stats') {
    send(res, 200, { success: true, data: contactStats() });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/contacts') {
    send(res, 200, { success: true, data: contactList(url) });
    return;
  }
  const contactRead = pathname.match(/^\/admin\/api\/contacts\/(\d+)\/toggle-read$/);
  if (method === 'PATCH' && contactRead) {
    const item = findById(db.contacts, contactRead[1]);
    if (!item) throw httpError(404, 'Message not found.');
    item.isRead = item.isRead !== true;
    syncNotification('message', item.id, item.isRead === true);
    saveDb();
    send(res, 200, { success: true, data: presentContact(item) });
    return;
  }
  const contactReply = pathname.match(/^\/admin\/api\/contacts\/(\d+)\/reply$/);
  if (method === 'POST' && contactReply) {
    const item = findById(db.contacts, contactReply[1]);
    if (!item) throw httpError(404, 'Message not found.');
    const body = await readInput(req);
    const replyMessage = String(body.replyMessage || '').trim();
    if (!replyMessage) throw httpError(400, 'Write a reply first.');
    item.replyMessage = replyMessage;
    item.repliedAt = new Date().toISOString();
    item.isReplied = true;
    item.isRead = true;
    syncNotification('message', item.id, true);
    saveDb();
    const presented = presentContact(item);
    const result = await sendMail({
      to: presented.email,
      subject: `Re: ${presented.subject || 'Your message to Globeflight Kenya'}`,
      text: replyEmailText(presented, replyMessage),
    });
    if (!result.sent && result.reason !== 'not-configured' && result.reason !== 'no-address') {
      console.error('Reply email failed:', result.reason);
    }
    const message = result.sent
      ? `Reply sent to ${presented.email}.`
      : result.reason === 'no-address'
        ? 'Reply saved. This message has no email address to send to.'
        : result.reason === 'not-configured'
          ? 'Reply saved. Email is not connected yet, so it was not sent.'
          : 'Reply saved, but the email could not be sent.';
    send(res, 200, { success: true, emailSent: result.sent, message, data: presented });
    return;
  }
  const contactId = pathname.match(/^\/admin\/api\/contacts\/(\d+)$/);
  if (method === 'DELETE' && contactId) {
    const item = findById(db.contacts, contactId[1]);
    if (!item) throw httpError(404, 'Message not found.');
    db.contacts = db.contacts.filter((row) => row !== item);
    removeNotifications('message', item.id);
    saveDb();
    send(res, 200, { success: true });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/notifications') {
    const notes = db.notifications || [];
    send(res, 200, {
      success: true,
      data: notes.slice(0, 30),
      unread: notes.filter((note) => !note.isRead).length,
    });
    return;
  }
  if (method === 'POST' && pathname === '/admin/api/notifications/read') {
    const body = await readInput(req);
    const notes = db.notifications || [];
    if (body.all) {
      for (const note of notes) note.isRead = true;
    } else {
      const item = findById(notes, body.id);
      if (!item) throw httpError(404, 'Notification not found.');
      item.isRead = true;
    }
    saveDb();
    send(res, 200, {
      success: true,
      unread: notes.filter((note) => !note.isRead).length,
    });
    return;
  }

  if (method === 'GET' && pathname === '/admin/api/blogs/newsletter/stats') {
    send(res, 200, { success: true, data: subscriberStats() });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/blogs/newsletter/subscribers') {
    const page = Math.max(1, Number(url.searchParams.get('page') || 1));
    const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 10)));
    const search = String(url.searchParams.get('search') || '').trim().toLowerCase();
    let items = db.subscribers.map(presentSubscriber);
    if (search) items = items.filter((item) => String(item.email).includes(search));
    items.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / limit) || 1);
    const safePage = Math.min(page, pages);
    const subscribers = items.slice((safePage - 1) * limit, safePage * limit);
    send(res, 200, {
      success: true,
      data: { subscribers, pagination: { total, page: safePage, pages, limit } },
    });
    return;
  }
  const subscriberItem = pathname.match(
    /^\/admin\/api\/blogs\/newsletter\/subscribers\/(\d+)(?:\/(unsubscribe|resubscribe))?$/
  );
  if (subscriberItem) {
    const item = findById(db.subscribers, subscriberItem[1]);
    if (!item) throw httpError(404, 'Subscriber not found.');
    const action = subscriberItem[2];
    if (method === 'DELETE' && !action) {
      db.subscribers = db.subscribers.filter((row) => row !== item);
      removeNotifications('subscriber', item.id);
      saveDb();
      send(res, 200, { success: true });
      return;
    }
    if (method === 'PATCH' && action === 'unsubscribe') {
      item.isActive = false;
      item.unsubscribedAt = new Date().toISOString();
      saveDb();
      send(res, 200, { success: true, data: presentSubscriber(item) });
      return;
    }
    if (method === 'PATCH' && action === 'resubscribe') {
      item.isActive = true;
      item.unsubscribedAt = null;
      saveDb();
      send(res, 200, { success: true, data: presentSubscriber(item) });
      return;
    }
  }

  if (method === 'GET' && pathname === '/admin/api/subscribers') {
    send(res, 200, { success: true, data: db.subscribers });
    return;
  }
  if (method === 'GET' && pathname === '/admin/api/applications') {
    send(res, 200, { success: true, data: db.applications });
    return;
  }

  throw httpError(404, 'Not found.');
}

const server = http.createServer((req, res) => {
  handle(req, res).catch((error) => {
    const status = error.status || 500;
    if (status >= 500) console.error(error);
    if (!res.headersSent) {
      send(res, status, { success: false, message: error.message || 'Server error.' });
    }
  });
});

ensureNotifications();

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Local admin API listening on http://127.0.0.1:${PORT}`);
});
