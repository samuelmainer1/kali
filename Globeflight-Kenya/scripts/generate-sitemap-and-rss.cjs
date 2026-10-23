const fs = require('fs');
const path = require('path');
const { DEFAULT_ORIGIN, cleanOrigin, buildFeeds } = require('./feed-builder.cjs');

const site = cleanOrigin(process.env.SITE_URL || DEFAULT_ORIGIN);

function writeFeeds() {
  const db = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'server', 'data', 'db.json'), 'utf8'));
  const feeds = buildFeeds(db, site);
  const sitemapPath = path.join(__dirname, '..', 'public', 'sitemap.xml');
  const rssPath = path.join(__dirname, '..', 'public', 'rss.xml');
  fs.writeFileSync(sitemapPath, feeds.sitemap);
  fs.writeFileSync(rssPath, feeds.rss);
  console.log(`Sitemap generated at ${sitemapPath}`);
  console.log(`RSS feed generated at ${rssPath}`);
  console.log(`Total sitemap URLs: ${feeds.count}`);
}

try {
  console.log('Starting SEO feeds generation...\n');
  writeFeeds();
  console.log('\nAll SEO feeds generated successfully!');
  process.exit(0);
} catch (error) {
  console.error('\nFailed to generate SEO feeds:', error.message);
  process.exit(1);
}
