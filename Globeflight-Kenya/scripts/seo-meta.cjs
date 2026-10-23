const fs = require('fs');
const path = require('path');

const SITE = 'https://globeflight.co.ke';
const IMAGE = `${SITE}/logo-og.png`;
const root = path.join(__dirname, '..');

const STATIC = {
  '/': {
    title: 'Importer of Record (IOR) Services Kenya | Globeflight Worldwide Express',
    description: 'Professional Importer of Record (IOR) services in Kenya. Expert customs clearance, KRA compliance, and import documentation. Trusted by multinationals and tech companies across Africa.',
  },
  '/home': {
    title: 'Globeflight Kenya - Shipping, Tracking and Logistics from Nairobi',
    description: 'Globeflight Kenya ships air freight, sea freight, and parcels from Nairobi, with warehousing in Mlolongo and customs clearance through Union Green Logistics Ltd.',
  },
  '/about-us': {
    title: 'About Us | Globeflight Kenya',
    description: 'Learn about Globeflight Kenya, our mission, vision, and the team behind our logistics excellence.',
  },
  '/services': {
    title: 'International Logistics Services | Global Air & Sea Freight - Globeflight Kenya',
    description: 'Globeflight Kenya\'s international logistics services: air freight, sea freight, road transport, warehousing, and customs clearance. Global shipping from Kenya to Europe, Asia, the Americas, and across Africa.',
  },
  '/contact-us': {
    title: 'Contact Us | Frequently Asked Questions | Globeflight Kenya',
    description: 'Contact Globeflight Kenya for logistics, shipping, and courier quotes. The same page answers common questions on safety, logistics, importer of record, freight, and customs.',
  },
  '/track': {
    title: 'Track Shipment | Globeflight Kenya',
    description: 'Track your shipment in real time with Globeflight Kenya. Enter your tracking number to get the latest status and updates.',
  },
  '/blog': {
    title: 'Blog | Latest News & Industry Updates | Globeflight Kenya',
    description: 'Stay updated with Globeflight Kenya\'s latest news, shipping industry insights, logistics tips, and company announcements.',
    rss: true,
  },
  '/jobs': {
    title: 'Careers at Globeflight Kenya | Join Our Team',
    description: 'Explore career opportunities at Globeflight Kenya. Join our team and grow your career in logistics and express delivery.',
  },
  '/unsubscribe': {
    title: 'Unsubscribe | Globeflight Kenya',
    description: 'Unsubscribe from the Globeflight Kenya newsletter.',
    robots: 'noindex, nofollow',
  },
};

let cache = null;

function load() {
  const dbPath = path.join(root, 'server', 'data', 'db.json');
  const servicesPath = path.join(root, 'src', 'data', 'services.js');
  const dbMtime = fs.statSync(dbPath).mtimeMs;
  const servicesMtime = fs.statSync(servicesPath).mtimeMs;
  if (cache && cache.dbMtime === dbMtime && cache.servicesMtime === servicesMtime) return cache;
  const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  const servicesFile = fs.readFileSync(servicesPath, 'utf8');
  const start = servicesFile.indexOf('[');
  const end = servicesFile.lastIndexOf(']');
  const services = JSON.parse(servicesFile.slice(start, end + 1));
  cache = { dbMtime, servicesMtime, db, services };
  return cache;
}

function normalize(pathname) {
  if (!pathname) return '/';
  let value = String(pathname).split('?')[0].split('#')[0];
  try {
    value = decodeURIComponent(value);
  } catch {
    value = String(pathname).split('?')[0];
  }
  if (value.length > 1 && value.endsWith('/')) value = value.slice(0, -1);
  return value || '/';
}

function absoluteImage(url) {
  if (!url) return IMAGE;
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/')) return `${SITE}${url}`;
  return IMAGE;
}

function page(title, description, pathname, extra = {}) {
  const canonical = pathname === '/' ? `${SITE}/` : `${SITE}${pathname}`;
  return {
    title,
    description,
    canonical,
    robots: extra.robots || 'index, follow',
    image: extra.image || IMAGE,
    type: extra.type || 'website',
    rss: Boolean(extra.rss),
  };
}

function notFound() {
  return page(
    'Page not found | Globeflight Kenya',
    'This page is not available. Go back to Globeflight Kenya services, tracking, or contact.',
    '/',
    { robots: 'noindex, follow' }
  );
}

function isKnownAppPath(pathname) {
  const value = normalize(pathname);
  if (Object.prototype.hasOwnProperty.call(STATIC, value)) return true;
  const { db, services } = load();
  const serviceSlug = value.match(/^\/services\/([^/]+)$/);
  if (serviceSlug) return services.some((item) => item.slug === serviceSlug[1]);
  const categorySlug = value.match(/^\/blog\/category\/([^/]+)$/);
  if (categorySlug) {
    return (db.categories || []).some((item) => item.slug === categorySlug[1] && item.isActive !== false);
  }
  const blogSlug = value.match(/^\/blog\/([^/]+)$/);
  if (blogSlug) {
    return (db.blogs || []).some((item) => item.slug === blogSlug[1] && item.isPublished !== false);
  }
  const jobSlug = value.match(/^\/jobs\/([^/]+)$/);
  if (jobSlug) {
    return (db.jobs || []).some((item) => item.slug === jobSlug[1] && item.isPublished !== false);
  }
  return false;
}

function getSeo(pathname) {
  const value = normalize(pathname);
  if (STATIC[value]) {
    const entry = STATIC[value];
    return page(entry.title, entry.description, value, entry);
  }

  const { db, services } = load();
  const serviceSlug = value.match(/^\/services\/([^/]+)$/);
  if (serviceSlug) {
    const service = services.find((item) => item.slug === serviceSlug[1]);
    if (!service) {
      return page('Service not found | Globeflight Kenya', 'This service page is not available.', '/services', { robots: 'noindex, follow' });
    }
    return page(
      service.metaTitle || `${service.title} | International Logistics Services - Globeflight Kenya`,
      service.metaDescription || service.shortDescription || service.title,
      value,
      { image: absoluteImage(service.imageUrl), type: 'article' }
    );
  }

  const categorySlug = value.match(/^\/blog\/category\/([^/]+)$/);
  if (categorySlug) {
    const category = (db.categories || []).find((item) => item.slug === categorySlug[1] && item.isActive !== false);
    if (!category) {
      return page('Category not found | Globeflight Kenya', 'This blog category is not available.', '/blog', { robots: 'noindex, follow' });
    }
    return page(
      `${category.name} | Blog | Globeflight Kenya`,
      category.description || `Read the latest updates about ${category.name} from Globeflight Kenya.`,
      value
    );
  }

  const blogSlug = value.match(/^\/blog\/([^/]+)$/);
  if (blogSlug) {
    const post = (db.blogs || []).find((item) => item.slug === blogSlug[1] && item.isPublished !== false);
    if (!post) {
      return page('Article not found | Globeflight Kenya', 'This article is not available.', '/blog', { robots: 'noindex, follow' });
    }
    return page(
      post.metaTitle || `${post.title} | Globeflight Kenya Blog`,
      post.metaDescription || post.shortDescription || post.title,
      value,
      { image: absoluteImage(post.featuredImage), type: 'article' }
    );
  }

  const jobSlug = value.match(/^\/jobs\/([^/]+)$/);
  if (jobSlug) {
    const job = (db.jobs || []).find((item) => item.slug === jobSlug[1] && item.isPublished !== false);
    if (!job) {
      return page('Job not found | Globeflight Kenya', 'This job is not available.', '/jobs', { robots: 'noindex, follow' });
    }
    const description = String(job.summary || job.description || `Apply for ${job.title} at Globeflight Kenya.`).replace(/\s+/g, ' ').trim();
    return page(`${job.title} | Careers | Globeflight Kenya`, description.slice(0, 300), value);
  }

  return notFound();
}

function prerenderPaths() {
  const { db, services } = load();
  const paths = Object.keys(STATIC);
  services.forEach((service) => {
    if (service.slug) paths.push(`/services/${service.slug}`);
  });
  (db.categories || []).forEach((category) => {
    if (category.slug && category.isActive !== false) paths.push(`/blog/category/${category.slug}`);
  });
  (db.blogs || []).forEach((post) => {
    if (post.slug && post.isPublished !== false) paths.push(`/blog/${post.slug}`);
  });
  (db.jobs || []).forEach((job) => {
    if (job.slug && job.isPublished !== false) paths.push(`/jobs/${job.slug}`);
  });
  return [...new Set(paths)];
}

function esc(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setTitle(html, title) {
  const tag = `<title data-rh="true">${esc(title)}</title>`;
  if (/<title\b[\s\S]*?<\/title>/.test(html)) return html.replace(/<title\b[\s\S]*?<\/title>/, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function setMeta(html, attr, key, content) {
  const tag = `<meta ${attr}="${key}" content="${esc(content)}" data-rh="true" />`;
  const pattern = new RegExp(`<meta\\s+${attr}=["']${key}["'][^>]*>`, 'i');
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function setCanonical(html, href) {
  const tag = `<link rel="canonical" href="${esc(href)}" data-rh="true" />`;
  const pattern = /<link\s+rel=["']canonical["'][^>]*>/i;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function applySeo(html, seo) {
  let next = setTitle(html, seo.title);
  next = setMeta(next, 'name', 'title', seo.title);
  next = setMeta(next, 'name', 'description', seo.description);
  next = setMeta(next, 'name', 'robots', seo.robots);
  next = setMeta(next, 'property', 'og:title', seo.title);
  next = setMeta(next, 'property', 'og:description', seo.description);
  next = setMeta(next, 'property', 'og:url', seo.canonical);
  next = setMeta(next, 'property', 'og:image', seo.image);
  next = setMeta(next, 'property', 'og:type', seo.type);
  next = setMeta(next, 'property', 'og:locale', 'en_KE');
  next = setMeta(next, 'name', 'twitter:title', seo.title);
  next = setMeta(next, 'name', 'twitter:description', seo.description);
  next = setMeta(next, 'name', 'twitter:url', seo.canonical);
  next = setMeta(next, 'name', 'twitter:image', seo.image);
  next = setCanonical(next, seo.canonical);
  if (seo.rss && !next.includes('/rss.xml')) {
    next = next.replace('</head>', '    <link rel="alternate" type="application/rss+xml" title="Globeflight Kenya Blog" href="https://globeflight.co.ke/rss.xml" />\n  </head>');
  }
  const summary = `<noscript id="gf-seo-summary"><h1>${esc(seo.title)}</h1><p>${esc(seo.description)}</p></noscript>`;
  if (next.includes('id="gf-seo-summary"')) {
    next = next.replace(/<noscript id="gf-seo-summary">[\s\S]*?<\/noscript>/, summary);
  } else {
    next = next.replace('<div id="root">', `${summary}\n    <div id="root">`);
  }
  return next;
}

module.exports = {
  SITE,
  normalize,
  isKnownAppPath,
  getSeo,
  notFound,
  prerenderPaths,
  applySeo,
};
