export function resolveProductImage(product, fallback = '/placeholder-product.svg') {
  const candidates = [
    Array.isArray(product?.images) ? product.images.find((item) => Boolean(item && String(item).trim())) : null,
    product?.image,
    Array.isArray(product?.images) ? product.images[0] : null,
    product?.gallery?.[0],
    fallback,
  ];

  const next = candidates.find((item) => typeof item === 'string' && item.trim().length > 0);
  return next || fallback;
}

export function preventBrokenProductImage(event, fallback = '/placeholder-product.svg') {
  const target = event?.currentTarget;
  if (!target) return;
  target.src = fallback;
  target.onerror = null;
}
