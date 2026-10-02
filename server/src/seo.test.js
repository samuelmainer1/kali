import assert from 'node:assert/strict';
import test from 'node:test';
import { STATIC_PAGE_META, organizationJsonLd, websiteJsonLd } from './seo.js';

test('static meta copy does not advertise card while card is coming soon', () => {
  for (const [path, meta] of Object.entries(STATIC_PAGE_META)) {
    if (!meta.description) continue;
    assert.doesNotMatch(
      meta.description,
      /\bor card\b|& card|card accepted|card payment/i,
      path
    );
  }
});

test('track is a unique indexable page kept in sync with the client', () => {
  const track = STATIC_PAGE_META['/track'];
  assert.ok(track);
  assert.equal(track.noindex, undefined);
  assert.match(track.title, /Track Your Order/);
  assert.match(track.description, /Globeflight tracking number/);
});

test('reset-password is noindexed', () => {
  assert.equal(STATIC_PAGE_META['/reset-password']?.noindex, true);
});

test('homepage structured data names the shop and search endpoint', () => {
  const origin = 'https://www.bigdrop.co.ke';
  const org = organizationJsonLd(origin);
  assert.equal(org['@type'], 'Organization');
  assert.equal(org.url, origin);
  assert.equal(org.logo, `${origin}/icon-512.png`);
  const web = websiteJsonLd(origin);
  assert.equal(web['@type'], 'WebSite');
  assert.equal(web.potentialAction.target.urlTemplate, `${origin}/shop?q={search_term_string}`);
});
