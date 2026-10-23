const fs = require('fs');
const path = require('path');

const DEFAULT_ORIGIN = 'https://globeflight.co.ke';
const root = path.join(__dirname, '..');

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0];
  return parsed.toISOString().split('T')[0];
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function servicePages() {
  const servicesFile = fs.readFileSync(path.join(root, 'src', 'data', 'services.js'), 'utf8');
  return [...servicesFile.matchAll(/"slug": "([^"]+)"/g)].map((match) => ({
    url: `/services/${match[1]}`,
    changefreq: 'monthly',
    priority: '0.7',
  }));
}

function staticPages() {
  return [
    { url: '/', changefreq: 'weekly', priority: '1.0' },
    { url: '/home', changefreq: 'weekly', priority: '0.8' },
    { url: '/about-us', changefreq: 'monthly', priority: '0.8' },
    { url: '/services', changefreq: 'monthly', priority: '0.9' },
    ...servicePages(),
    { url: '/blog', changefreq: 'daily', priority: '0.9' },
    { url: '/contact-us', changefreq: 'monthly', priority: '0.8' },
    { url: '/track', changefreq: 'weekly', priority: '0.6' },
    { url: '/jobs', changefreq: 'weekly', priority: '0.6' },
  ];
}

function publishedBlogs(db) {
  return (db.blogs || []).filter((blog) => blog.isPublished !== false && blog.slug);
}

function openJobs(db) {
  const now = new Date();
  return (db.jobs || []).filter((job) => {
    if (!job.slug || job.isPublished === false || job.isClosed) return false;
    if (job.applicationDeadline && new Date(job.applicationDeadline) < now) return false;
    return true;
  });
}

function categorySlugs(db, blogs) {
  const active = new Set(
    (db.categories || [])
      .filter((category) => category.isActive !== false && category.slug)
      .map((category) => category.slug)
  );
  return [...active].filter((slug) => blogs.some((blog) => blog.category && blog.category.slug === slug)).sort();
}

function cleanOrigin(value) {
  const raw = String(value || '').trim().replace(/\/$/, '');
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return DEFAULT_ORIGIN;
    if (!/^[a-z0-9.-]+$/i.test(url.hostname)) return DEFAULT_ORIGIN;
    return `${url.protocol}//${url.host}`;
  } catch {
    return DEFAULT_ORIGIN;
  }
}

function buildFeeds(db, origin) {
  const site = cleanOrigin(origin);
  const blogs = publishedBlogs(db);
  const jobs = openJobs(db);
  const categories = categorySlugs(db, blogs);
  const pages = staticPages();

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  const addUrl = (loc, lastmod, changefreq, priority) => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${site}${loc === '/' ? '/' : loc}</loc>\n`;
    sitemap += `    <lastmod>${formatDate(lastmod)}</lastmod>\n`;
    sitemap += `    <changefreq>${changefreq}</changefreq>\n`;
    sitemap += `    <priority>${priority}</priority>\n`;
    sitemap += '  </url>\n';
  };
  pages.forEach((page) => addUrl(page.url, null, page.changefreq, page.priority));
  jobs.forEach((job) => addUrl(`/jobs/${job.slug}`, job.updatedAt || job.createdAt, 'weekly', '0.5'));
  categories.forEach((slug) => {
    const latest = blogs
      .filter((blog) => blog.category && blog.category.slug === slug)
      .map((blog) => blog.updatedAt || blog.publishedAt)
      .filter(Boolean)
      .sort()
      .pop();
    addUrl(`/blog/category/${slug}`, latest, 'weekly', '0.5');
  });
  blogs.forEach((blog) => addUrl(`/blog/${blog.slug}`, blog.updatedAt || blog.publishedAt, 'monthly', '0.8'));
  sitemap += '</urlset>';

  let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
  rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
  rss += '  <channel>\n';
  rss += '    <title>Globeflight Kenya Blog</title>\n';
  rss += `    <link>${site}/blog</link>\n`;
  rss += '    <description>Latest news, updates, and insights from Globeflight Kenya - Your trusted international logistics partner</description>\n';
  rss += '    <language>en-ke</language>\n';
  rss += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
  rss += `    <atom:link href="${site}/rss.xml" rel="self" type="application/rss+xml" />\n`;
  rss += '    <image>\n';
  rss += `      <url>${site}/logo.png</url>\n`;
  rss += '      <title>Globeflight Kenya</title>\n';
  rss += `      <link>${site}</link>\n`;
  rss += '    </image>\n';
  blogs.slice(0, 50).forEach((blog) => {
    rss += '    <item>\n';
    rss += `      <title>${escapeXml(blog.title)}</title>\n`;
    rss += `      <link>${site}/blog/${blog.slug}</link>\n`;
    rss += `      <guid isPermaLink="true">${site}/blog/${blog.slug}</guid>\n`;
    rss += `      <description>${escapeXml(blog.shortDescription || '')}</description>\n`;
    rss += `      <pubDate>${new Date(blog.publishedAt || blog.createdAt || Date.now()).toUTCString()}</pubDate>\n`;
    rss += '    </item>\n';
  });
  rss += '  </channel>\n';
  rss += '</rss>';

  const robotsPath = path.join(root, 'public', 'robots.txt');
  const template = fs.existsSync(robotsPath)
    ? fs.readFileSync(robotsPath, 'utf8')
    : 'User-agent: *\nAllow: /\n';
  const sitemapLine = `Sitemap: ${site}/sitemap.xml`;
  const robots = /^Sitemap:.*$/m.test(template)
    ? template.replace(/^Sitemap:.*$/m, sitemapLine)
    : `${template.trim()}\n${sitemapLine}\n`;

  return { sitemap, rss, robots, count: pages.length + jobs.length + categories.length + blogs.length };
}

module.exports = { DEFAULT_ORIGIN, cleanOrigin, buildFeeds };
