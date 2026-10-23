const FALLBACK_PREFIX = '/categories/';

export function categoryTileFallback(slug) {
  const clean = String(slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');
  return clean ? `${FALLBACK_PREFIX}${clean}.webp` : '';
}

/** Prefer the category's own photo; if it is missing, use the built-in tile. */
export function resolveCategoryImage(category) {
  const custom = String(category?.image || '').trim();
  return custom || categoryTileFallback(category?.slug);
}

/**
 * If the current photo 404s (common after a product used as the tile was deleted),
 * switch to the built-in tile. Returns null when there is nothing left to try.
 */
export function nextCategoryImageOnError(currentSrc, category) {
  const fallback = categoryTileFallback(category?.slug);
  if (!fallback) return null;
  const current = String(currentSrc || '');
  if (current.endsWith(fallback) || current.includes(`${FALLBACK_PREFIX}${category?.slug}.webp`)) {
    return null;
  }
  return fallback;
}
