import { nanoid } from 'nanoid';
import { downloadRemoteImage } from './uploads.js';

function stripHtml(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;
  const src = String(text || '').replace(/^\uFEFF/, '');
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    const next = src[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') inQuotes = false;
      else cell += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ',') {
      row.push(cell);
      cell = '';
    } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
      row.push(cell);
      cell = '';
      if (row.some((c) => String(c).trim())) rows.push(row);
      row = [];
      if (ch === '\r') i++;
    } else cell += ch;
  }
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((c) => String(c).trim())) rows.push(row);
  }
  return rows;
}

function col(header, aliases) {
  const lower = header.map((h) => String(h || '').trim().toLowerCase());
  for (const a of aliases) {
    const i = lower.indexOf(a);
    if (i >= 0) return i;
  }
  return -1;
}

export function parseWooCommerceCsv(csvText) {
  const table = parseCsv(csvText);
  if (table.length < 2) return [];
  const header = table[0];
  const iName = col(header, ['name', 'post_title', 'title']);
  const iDesc = col(header, ['description', 'post_content']);
  const iShort = col(header, ['short description', 'short_description', 'post_excerpt']);
  const iPrice = col(header, ['regular price', 'regular_price', 'price']);
  const iSale = col(header, ['sale price', 'sale_price']);
  const iSku = col(header, ['sku']);
  const iStock = col(header, ['stock', 'stock quantity', 'stock_quantity']);
  const iImages = col(header, ['images', 'image']);
  const iCats = col(header, ['categories', 'category']);
  const iType = col(header, ['type', 'tax:product_type']);
  const iPublished = col(header, ['published', 'post_status']);
  const iBrand = col(header, ['brands', 'brand', 'attribute:brand']);

  const out = [];
  for (let r = 1; r < table.length; r++) {
    const row = table[r];
    const type = iType >= 0 ? String(row[iType] || '').toLowerCase() : 'simple';
    if (type.includes('variable') && !type.includes('variation')) continue;
    const name = iName >= 0 ? String(row[iName] || '').trim() : '';
    if (!name) continue;
    const published = iPublished >= 0 ? String(row[iPublished] || '') : '1';
    if (/^-1$|draft|private|trash/i.test(published) && published !== '1') continue;
    const regular = iPrice >= 0 ? Number(String(row[iPrice] || '').replace(/,/g, '')) : 0;
    const sale = iSale >= 0 ? Number(String(row[iSale] || '').replace(/,/g, '')) : 0;
    const price = sale > 0 ? sale : regular;
    if (!price || price < 0) continue;
    const descRaw = (iDesc >= 0 ? row[iDesc] : '') || (iShort >= 0 ? row[iShort] : '') || name;
    const images = (iImages >= 0 ? String(row[iImages] || '') : '')
      .split(/[|,]/)
      .map((u) => u.trim())
      .filter((u) => /^https?:\/\//i.test(u))
      .slice(0, 3);
    const category = iCats >= 0 ? String(row[iCats] || '').split(/[>,]/)[0].trim() : '';
    out.push({
      name,
      description: stripHtml(descRaw) || name,
      price,
      compareAt: sale > 0 && regular > sale ? regular : null,
      sku: iSku >= 0 ? String(row[iSku] || '').trim() : '',
      stock: iStock >= 0 ? Number(row[iStock]) || 0 : 10,
      images,
      category,
      brand: iBrand >= 0 ? String(row[iBrand] || '').split(',')[0].trim() : '',
    });
  }
  return out;
}

export async function materializeImages(urls) {
  const saved = [];
  for (const url of (urls || []).slice(0, 3)) {
    try {
      const local = await downloadRemoteImage(url, 'products');
      if (local) saved.push(local);
    } catch {
      /* skip failed photo */
    }
  }
  return saved;
}

export function slugifyName(name) {
  return (
    String(name || 'product')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') +
    '-' +
    nanoid(4)
  );
}
