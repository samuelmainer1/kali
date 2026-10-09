/** Compress images in the browser before upload. */

export const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
export const PRODUCT_MAX_BYTES = 150 * 1024;
export const HERO_MAX_BYTES = 2 * 1024 * 1024;
export const BLOG_MAX_BYTES = 500 * 1024;
export const REVIEW_MAX_BYTES = 20 * 1024;

function assertFileSize(file) {
  if (!file) throw new Error('Choose an image file.');
  if (!file.type?.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, or WebP).');
  }
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('Image must be 20MB or smaller.');
  }
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    assertFileSize(file);
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image file.'));
    };
    img.src = url;
  });
}

function dataUrlBytes(dataUrl) {
  const b64 = (dataUrl.split(',')[1] || '').replace(/=+$/, '');
  return Math.floor((b64.length * 3) / 4);
}

function canvasToMaxBytes(canvas, maxBytes, startQuality = 0.92) {
  let q = startQuality;
  let url = canvas.toDataURL('image/jpeg', q);
  while (dataUrlBytes(url) > maxBytes && q > 0.32) {
    q = Math.max(0.32, q - 0.08);
    url = canvas.toDataURL('image/jpeg', q);
  }
  return url;
}

/** Product photos: centre-crop to 800×800, JPEG ≤ 150KB. */
export function fileToSquareDataUrl(file, size = 800) {
  return loadImage(file).then(({ img, url }) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      const min = Math.min(img.width, img.height) || 1;
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      return canvasToMaxBytes(canvas, PRODUCT_MAX_BYTES, 0.82);
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  });
}

/** Keep original pixel size; compress JPEG until under maxBytes. */
function fileToSameSizeJpeg(file, maxBytes) {
  return loadImage(file).then(({ img, url }) => {
    try {
      const w = Math.max(1, img.width || 1);
      const h = Math.max(1, img.height || 1);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      return canvasToMaxBytes(canvas, maxBytes, 0.9);
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  });
}

/** Review photos: 400×400 JPEG ≤ 20KB. */
export function fileToReviewDataUrl(file) {
  return loadImage(file).then(({ img, url }) => {
    try {
      const drawSquare = (size) => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        const min = Math.min(img.width, img.height) || 1;
        const sx = (img.width - min) / 2;
        const sy = (img.height - min) / 2;
        ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
        let q = 0.72;
        let out = canvas.toDataURL('image/jpeg', q);
        while (dataUrlBytes(out) > REVIEW_MAX_BYTES && q > 0.1) {
          q = Math.max(0.1, q - 0.08);
          out = canvas.toDataURL('image/jpeg', q);
        }
        return out;
      };
      let urlOut = drawSquare(400);
      if (dataUrlBytes(urlOut) > REVIEW_MAX_BYTES) urlOut = drawSquare(320);
      if (dataUrlBytes(urlOut) > REVIEW_MAX_BYTES) urlOut = drawSquare(240);
      URL.revokeObjectURL(url);
      return urlOut;
    } catch (err) {
      URL.revokeObjectURL(url);
      throw err;
    }
  });
}

/** Hero banners: same pixels, ≤ 2MB. */
export function fileToHeroDataUrl(file) {
  return fileToSameSizeJpeg(file, HERO_MAX_BYTES);
}

/** Blog images: same pixels, ≤ 500KB. */
export function fileToBlogDataUrl(file) {
  return fileToSameSizeJpeg(file, BLOG_MAX_BYTES);
}

/** @deprecated use fileToHeroDataUrl or fileToBlogDataUrl */
export function fileToBannerDataUrl(file) {
  return fileToHeroDataUrl(file);
}
