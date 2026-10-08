import assert from 'node:assert/strict';
import test from 'node:test';
import { isPlaceholderHeroTitle, publicHero } from './commerce.js';

test('placeholder hero titles are treated as empty copy', () => {
  assert.equal(isPlaceholderHeroTitle('Slide 1'), true);
  assert.equal(isPlaceholderHeroTitle('slide 12'), true);
  assert.equal(isPlaceholderHeroTitle('Mega Deals Week'), false);
  assert.equal(isPlaceholderHeroTitle(''), false);
});

test('image-only heroes hide the overlay instead of inventing Slide 1', () => {
  const hero = publicHero({
    id: 'hero_x',
    title: 'Slide 1',
    text: '',
    image: '/uploads/heroes/banner.webp',
    href: '/shop',
    cta: 'Shop Now',
  });
  assert.equal(hero.title, '');
  assert.equal(hero.fullBleed, true);
});

test('a real heading still shows on the slide', () => {
  const hero = publicHero({
    id: 'hero_y',
    title: 'Mega Deals Week',
    text: 'Up to 70% off',
    image: '/uploads/heroes/banner.webp',
  });
  assert.equal(hero.title, 'Mega Deals Week');
  assert.equal(hero.fullBleed, false);
});
