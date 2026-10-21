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
const staticPages = [
  { url: '/', changefreq: 'weekly', priority: '1.0' },
  { url: '/about', changefreq: 'monthly', priority: '0.8' },
  { url: '/services', changefreq: 'monthly', priority: '0.9' },
  { url: '/services/warehousing-and-distribution-services', changefreq: 'monthly', priority: '0.7' },
  { url: '/services/sea-freight-services', changefreq: 'monthly', priority: '0.7' },
  { url: '/services/customs-clearance-and-brokerage', changefreq: 'monthly', priority: '0.7' },
  { url: '/services/international-import-and-export-express', changefreq: 'monthly', priority: '0.7' },
  { url: '/services/consolidation-services', changefreq: 'monthly', priority: '0.7' },
  { url: '/services/big-drop-kenya-e-commerce-marketplace-and-fulfillment', changefreq: 'monthly', priority: '0.7' },
  { url: '/services/air-freight-services', changefreq: 'monthly', priority: '0.7' },
  { url: '/services/importer-and-exporter-of-records', changefreq: 'monthly', priority: '0.7' },
  { url: '/blog', changefreq: 'daily', priority: '0.9' },
  { url: '/contact', changefreq: 'monthly', priority: '0.8' },
  { url: '/track', changefreq: 'weekly', priority: '0.6' },
  { url: '/quote', changefreq: 'monthly', priority: '0.8' }
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

    let blogs = [];
    try {
      const response = await fetchFromAPI(`${API_BASE_URL}/api/blogs?limit=1000`);
      blogs = response.data || [];
      console.log(`✅ Found ${blogs.length} published blog posts`);
    } catch (error) {
      console.warn('⚠️  Could not fetch blogs from API, generating sitemap with static pages only');
      console.warn(`   Error: ${error.message}`);
    }

    let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
    sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Add static pages
    staticPages.forEach(page => {
      sitemap += '  <url>\n';
      sitemap += `    <loc>${SITE_URL}${page.url}</loc>\n`;
      sitemap += `    <lastmod>${formatDate()}</lastmod>\n`;
      sitemap += `    <changefreq>${page.changefreq}</changefreq>\n`;
      sitemap += `    <priority>${page.priority}</priority>\n`;
      sitemap += '  </url>\n';
    });

    // Add blog posts
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
    console.log(`📊 Total URLs: ${staticPages.length + blogs.length}`);

    return blogs;
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    throw error;
  }
}


async function generateRSS() {
  try {
    console.log('📰 Generating RSS feed...');

    let blogs = [];
    try {
      const response = await fetchFromAPI(`${API_BASE_URL}/api/blogs?limit=50`);
      blogs = response.data || [];
    } catch (error) {
      console.warn('⚠️  Could not fetch blogs from API, generating empty RSS feed');
      console.warn(`   Error: ${error.message}`);
    }

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
      rss += `      <pubDate>${new Date(blog.publishedAt).toUTCString()}</pubDate>\n`;
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
