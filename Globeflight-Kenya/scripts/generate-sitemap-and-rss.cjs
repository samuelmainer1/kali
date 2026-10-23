const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// API configuration
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';

// Function to fetch data from API
function fetchFromAPI(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    protocol.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

const SITE_URL = 'https://globeflight.co.ke';

// Static pages configuration
const servicesFile = fs.readFileSync(path.join(__dirname, '..', 'src', 'data', 'services.js'), 'utf8');
const servicePages = [...servicesFile.matchAll(/"slug": "([^"]+)"/g)].map((match) => ({
  url: `/services/${match[1]}`,
  changefreq: 'monthly',
  priority: '0.7',
}));

const staticPages = [
  { url: '/', changefreq: 'weekly', priority: '1.0' },
  { url: '/home', changefreq: 'weekly', priority: '0.8' },
  { url: '/about-us', changefreq: 'monthly', priority: '0.8' },
  { url: '/services', changefreq: 'monthly', priority: '0.9' },
  ...servicePages,
  { url: '/blog', changefreq: 'daily', priority: '0.9' },
  { url: '/contact-us', changefreq: 'monthly', priority: '0.8' },
  { url: '/track', changefreq: 'weekly', priority: '0.6' },
  { url: '/jobs', changefreq: 'weekly', priority: '0.6' },
];

function formatDate(date) {
  if (!date) return new Date().toISOString().split('T')[0];
  return new Date(date).toISOString().split('T')[0];
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function generateSitemap() {
  try {
    console.log('📚 Fetching published blog posts from API...');

    const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), 'utf8'));
    const blogs = (db.blogs || []).filter((blog) => blog.isPublished !== false && blog.slug);
    console.log(`Found ${blogs.length} published blog posts`);

    const now = new Date();
    const jobs = (db.jobs || []).filter((job) => {
      if (!job.slug || job.isPublished === false || job.isClosed) return false;
      if (job.applicationDeadline && new Date(job.applicationDeadline) < now) return false;
      return true;
    });
    const activeCategorySlugs = new Set(
      (db.categories || []).filter((category) => category.isActive !== false && category.slug).map((category) => category.slug)
    );
    const categories = [...activeCategorySlugs]
      .filter((slug) => blogs.some((blog) => blog.category && blog.category.slug === slug))
      .sort();

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    const addUrl = (loc, lastmod, changefreq, priority) => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${SITE_URL}${loc}</loc>\n`;
      sitemap += `    <lastmod>${formatDate(lastmod)}</lastmod>\n`;
      sitemap += `    <changefreq>${changefreq}</changefreq>\n`;
      sitemap += `    <priority>${priority}</priority>\n`;
      sitemap += '  </url>\n';
    };

    staticPages.forEach(page => {
      addUrl(page.url, null, page.changefreq, page.priority);
    });

    jobs.forEach(job => {
      addUrl(`/jobs/${job.slug}`, job.updatedAt || job.createdAt, 'weekly', '0.5');
    });

    categories.forEach(slug => {
      const latest = blogs
        .filter((blog) => blog.category && blog.category.slug === slug)
        .map((blog) => blog.updatedAt || blog.publishedAt)
        .filter(Boolean)
        .sort()
        .pop();
      addUrl(`/blog/category/${slug}`, latest, 'weekly', '0.5');
    });

    blogs.forEach(blog => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${SITE_URL}/blog/${blog.slug}</loc>\n`;
      sitemap += `    <lastmod>${formatDate(blog.updatedAt || blog.publishedAt)}</lastmod>\n`;
      sitemap += `    <changefreq>monthly</changefreq>\n`;
      sitemap += `    <priority>0.8</priority>\n`;
      sitemap += '  </url>\n';
    });

    sitemap += '</urlset>';

    // Write sitemap to public folder
    const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
    fs.writeFileSync(sitemapPath, sitemap);
    console.log(`✅ Sitemap generated successfully at ${sitemapPath}`);
    console.log(`📊 Total URLs: ${staticPages.length + jobs.length + categories.length + blogs.length}`);

    return blogs;
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    throw error;
  }
}


async function generateRSS() {
  try {
    console.log('📰 Generating RSS feed...');

    const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), 'utf8'));
    const blogs = (db.blogs || []).filter((blog) => blog.isPublished !== false && blog.slug).slice(0, 50);

    let rss = '<?xml version="1.0" encoding="UTF-8"?>\n';
    rss += '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n';
    rss += '  <channel>\n';
    rss += '    <title>Globeflight Kenya Blog</title>\n';
    rss += '    <link>https://globeflight.co.ke/blog</link>\n';
    rss += '    <description>Latest news, updates, and insights from Globeflight Kenya - Your trusted international logistics partner</description>\n';
    rss += '    <language>en-ke</language>\n';
    rss += `    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n`;
    rss += '    <atom:link href="https://globeflight.co.ke/rss.xml" rel="self" type="application/rss+xml" />\n';
    rss += '    <image>\n';
    rss += '      <url>https://globeflight.co.ke/logo.png</url>\n';
    rss += '      <title>Globeflight Kenya</title>\n';
    rss += '      <link>https://globeflight.co.ke</link>\n';
    rss += '    </image>\n';

    blogs.forEach(blog => {
      rss += '    <item>\n';
      rss += `      <title>${escapeXml(blog.title)}</title>\n`;
      rss += `      <link>${SITE_URL}/blog/${blog.slug}</link>\n`;
      rss += `      <guid isPermaLink="true">${SITE_URL}/blog/${blog.slug}</guid>\n`;
      rss += `      <description>${escapeXml(blog.shortDescription || '')}</description>\n`;
      rss += `      <pubDate>${new Date(blog.publishedAt || blog.createdAt || Date.now()).toUTCString()}</pubDate>\n`;
      rss += '    </item>\n';
    });

    rss += '  </channel>\n';
    rss += '</rss>';

    const rssPath = path.join(__dirname, '..', 'public', 'rss.xml');
    fs.writeFileSync(rssPath, rss);
    console.log(`RSS feed generated successfully at ${rssPath}`);
    console.log(`Total items: ${blogs.length}`);
  } catch (error) {
    console.error(' Error generating RSS feed:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('Starting SEO feeds generation...\n');

    await generateSitemap();
    console.log('');
    await generateRSS();

    console.log('\n All SEO feeds generated successfully!');
    console.log('Files created:');
    console.log('   - public/sitemap.xml');
    console.log('   - public/rss.xml');

    process.exit(0);
  } catch (error) {
    console.error('\nFailed to generate SEO feeds:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
