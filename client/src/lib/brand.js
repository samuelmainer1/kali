import { letterheadFromSite } from './invoiceLetterhead';

const DEFAULT_WHATSAPP = '254722359298';

export function waDigits(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (!d) return DEFAULT_WHATSAPP;
  if (d.startsWith('254')) return d;
  if (d.startsWith('0')) return `254${d.replace(/^0+/, '')}`;
  if (d.length === 9) return `254${d}`;
  return d;
}

export function brandFromSite(site) {
  const emails = site?.emails?.length ? site.emails : ['info@bigdrop.co.ke', 'orders@bigdrop.co.ke'];
  const letterhead = letterheadFromSite(site);
  const ordersEmail = letterhead.email || emails.find((e) => /orders@/i.test(e)) || emails[emails.length - 1] || 'orders@bigdrop.co.ke';
  const address = letterhead.addressLines.join(' ') || site?.address || 'NextGen Mall, Mombasa Road, 3rd Floor, Suite 40, Nairobi, Kenya';
  return {
    name: letterhead.companyName || 'BigDrop Kenya',
    shortName: 'BigDrop',
    logo: site?.logo || '/logo-header.png',
    phone: letterhead.phone || site?.phone || '+254 722 359 298',
    emails,
    ordersEmail,
    address,
    addressLines: letterhead.addressLines,
    letterhead,
    whatsapp: waDigits(site?.whatsapp || DEFAULT_WHATSAPP),
  };
}

export function logoDrawSize(dataUrl, maxH = 16, maxW = 48) {
  return new Promise((resolve) => {
    if (typeof Image === 'undefined' || !dataUrl) {
      resolve({ w: maxH, h: maxH });
      return;
    }
    const img = new Image();
    img.onload = () => {
      const ratio = (img.naturalWidth || 1) / (img.naturalHeight || 1);
      let h = maxH;
      let w = h * ratio;
      if (w > maxW) {
        w = maxW;
        h = w / ratio;
      }
      resolve({ w, h });
    };
    img.onerror = () => resolve({ w: maxH, h: maxH });
    img.src = dataUrl;
  });
}

export async function loadImageDataUrl(src) {
  if (!src || typeof src !== 'string') return null;
  if (src.startsWith('data:')) return src;
  try {
    const res = await fetch(src, { cache: 'reload' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function pdfImageFormat(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return 'JPEG';
  if (dataUrl.includes('image/png')) return 'PNG';
  if (dataUrl.includes('image/webp')) return 'WEBP';
  return 'JPEG';
}
