import { jsPDF } from 'jspdf';
import { formatKES } from './api';
import { brandFromSite, loadImageDataUrl, pdfImageFormat, logoDrawSize } from './brand';
import { letterheadFromSite, formatInvoiceDate } from './invoiceLetterhead';

const BRAND = {
  orange: [246, 139, 30],
  ink: [26, 26, 26],
  muted: [120, 120, 120],
  soft: [245, 245, 245],
  line: [230, 230, 230],
  white: [255, 255, 255],
};

function addDays(iso, days) {
  const d = new Date(iso || Date.now());
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

async function loadLogoDataUrl(src) {
  return loadImageDataUrl(src || '/logo-header.png');
}

/**
 * Premium invoice / receipt PDF inspired by professional invoice layouts.
 * Downloads as a real file — no print pop-up.
 */
export async function downloadOrderDocumentPdf(doc, order, brandInput) {
  const brand = brandInput || brandFromSite(null);
  const letterhead = brand.letterhead || letterheadFromSite(null);
  const items = doc.items || order?.items || [];
  const isReceipt = doc.type === 'receipt';
  const orderNumber = order?.orderNumber || doc.orderNumber || '';
  const kind = isReceipt ? 'Receipt' : 'Invoice';
  const filename = `${kind}-${orderNumber || doc.id || 'document'}.pdf`;

  const issuedAt = doc.issuedAt || order?.createdAt || new Date().toISOString();
  const dueAt = addDays(issuedAt, 1);
  const shipping = Number(doc.shipping ?? order?.shipping ?? 0);
  const discount = Number(order?.discount || doc.discount || 0);
  const subtotal =
    doc.subtotal ??
    order?.subtotal ??
    items.reduce((sum, i) => sum + (i.price || 0) * (i.qty || 1), 0);
  const total = Number(doc.total ?? order?.total ?? subtotal + shipping - discount);
  const paid = order?.paymentStatus === 'paid' || isReceipt;
  const balanceDue = paid ? 0 : total;
  const addr = order?.shippingAddress || {};
  const tracking = order?.trackingNumber || '';

  const pdf = new jsPDF({ unit: 'mm', format: 'letter' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 18;
  const right = pageWidth - margin;
  let y = 16;

  // —— Header: logo only | INVOICE + #
  const logo = await loadLogoDataUrl(brand.logo);
  let logoH = 16;
  if (logo) {
    const box = await logoDrawSize(logo);
    logoH = box.h;
    try {
      pdf.addImage(logo, pdfImageFormat(logo), margin, y - 2, box.w, box.h);
    } catch {
      try {
        pdf.addImage(logo, 'PNG', margin, y - 2, box.w, box.h);
      } catch {
        /* continue without logo */
      }
    }
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...BRAND.ink);
  pdf.text(isReceipt ? 'RECEIPT' : 'INVOICE', right, y + 4, { align: 'right' });

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...BRAND.muted);
  pdf.text(`# ${orderNumber || doc.id || ''}`, right, y + 11, { align: 'right' });

  y += Math.max(18, logoH + 4);
  // Accent rule
  pdf.setDrawColor(...BRAND.orange);
  pdf.setLineWidth(0.6);
  pdf.line(margin, y, right, y);
  y += 10;

  // —— Company (left) | Date meta (right)
  const leftX = margin;
  const metaX = right - 52;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(...BRAND.ink);
  pdf.text(letterhead.companyName, leftX, y);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...BRAND.ink);
  const companyLines = letterhead.companyLines || [];
  companyLines.forEach((line, i) => {
    pdf.text(line, leftX, y + 5 + i * 4.5);
  });

  const metaRows = [['Date:', formatInvoiceDate(issuedAt)]];
  if (!paid) metaRows.push(['Due Date:', formatInvoiceDate(dueAt)]);
  metaRows.push(['Tracking:', tracking || '—']);
  metaRows.forEach(([label, value], i) => {
    const rowY = y + i * 5.5;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...BRAND.muted);
    pdf.text(label, metaX, rowY);
    pdf.setTextColor(...BRAND.ink);
    pdf.text(String(value), right, rowY, { align: 'right' });
  });

  y += Math.max(28, 10 + companyLines.length * 4.5);

  // —— Balance Due banner
  pdf.setFillColor(...BRAND.soft);
  pdf.roundedRect(margin, y, pageWidth - margin * 2, 11, 1.5, 1.5, 'F');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...BRAND.muted);
  pdf.text('Balance Due:', margin + 4, y + 7);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(12);
  pdf.setTextColor(...BRAND.ink);
  pdf.text(formatKES(balanceDue), right - 4, y + 7, { align: 'right' });
  if (paid) {
    pdf.setFontSize(8);
    pdf.setTextColor(...BRAND.orange);
    pdf.text('PAID', right - 42, y + 7, { align: 'right' });
  }
  y += 18;

  // —— Bill To | Ship To
  const colGap = 8;
  const colW = (pageWidth - margin * 2 - colGap) / 2;
  const shipX = margin + colW + colGap;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...BRAND.muted);
  pdf.text('Bill To:', margin, y);
  pdf.text('Ship To:', shipX, y);
  y += 5;

  const billLines = [
    doc.to?.name || order?.customerName || '',
    doc.to?.email || order?.customerEmail || '',
    doc.to?.phone || order?.customerPhone || '',
    `Order ${orderNumber}`,
  ].filter(Boolean);

  const shipLines = [
    addr.line1 || '',
    [addr.city, addr.county].filter(Boolean).join(', '),
    addr.notes || '',
  ].filter(Boolean);
  if (!shipLines.length) shipLines.push('Same as billing');

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...BRAND.ink);
  const maxAddrRows = Math.max(billLines.length, shipLines.length);
  for (let i = 0; i < maxAddrRows; i += 1) {
    if (billLines[i]) {
      const wrapped = pdf.splitTextToSize(String(billLines[i]), colW - 2);
      pdf.text(wrapped[0], margin, y);
    }
    if (shipLines[i]) {
      const wrapped = pdf.splitTextToSize(String(shipLines[i]), colW - 2);
      pdf.text(wrapped[0], shipX, y);
    }
    y += 4.8;
  }
  y += 8;

  // —— Items table
  const colItem = margin + 2;
  const colQty = right - 78;
  const colRate = right - 42;
  const colAmt = right - 2;
  const tableW = pageWidth - margin * 2;

  pdf.setFillColor(...BRAND.ink);
  pdf.roundedRect(margin, y, tableW, 8, 1, 1, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(...BRAND.white);
  pdf.text('Item', colItem, y + 5.5);
  pdf.text('Quantity', colQty, y + 5.5, { align: 'right' });
  pdf.text('Rate', colRate, y + 5.5, { align: 'right' });
  pdf.text('Amount', colAmt, y + 5.5, { align: 'right' });
  y += 12;

  items.forEach((item, idx) => {
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }
    const name = String(item.name || 'Item');
    const qty = Number(item.qty || 1);
    const rate = Number(item.price || 0);
    const amount = rate * qty;
    const nameLines = pdf.splitTextToSize(name, colQty - colItem - 8);
    const rowH = Math.max(7, nameLines.length * 4.5 + 2);

    if (idx % 2 === 1) {
      pdf.setFillColor(252, 252, 252);
      pdf.rect(margin, y - 4, tableW, rowH, 'F');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...BRAND.ink);
    pdf.text(nameLines, colItem, y);

    pdf.setFont('helvetica', 'normal');
    pdf.text(String(qty), colQty, y, { align: 'right' });
    pdf.text(formatKES(rate), colRate, y, { align: 'right' });
    pdf.text(formatKES(amount), colAmt, y, { align: 'right' });

    y += rowH;
    pdf.setDrawColor(...BRAND.line);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y - 2, right, y - 2);
  });

  y += 8;

  // —— Totals
  const totalsX = right - 70;
  const addTotal = (label, value, { bold = false, accent = false } = {}) => {
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(bold ? 11 : 10);
    pdf.setTextColor(...(accent ? BRAND.orange : BRAND.muted));
    pdf.text(label, totalsX, y);
    pdf.setTextColor(...BRAND.ink);
    pdf.text(value, right, y, { align: 'right' });
    y += 6;
  };

  addTotal('Subtotal:', formatKES(subtotal));
  if (discount > 0) addTotal('Discount:', `-${formatKES(discount)}`);
  if (shipping > 0) addTotal('Delivery:', formatKES(shipping));
  pdf.setDrawColor(...BRAND.line);
  pdf.line(totalsX, y - 2, right, y - 2);
  y += 3;
  addTotal('Total:', formatKES(total), { bold: true, accent: true });

  // —— Footer
  y = Math.max(y + 12, 260);
  pdf.setDrawColor(...BRAND.orange);
  pdf.setLineWidth(0.4);
  pdf.line(margin, y, right, y);
  y += 6;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...BRAND.muted);
  const note = letterhead.thankYou;
  pdf.text(pdf.splitTextToSize(note, pageWidth - margin * 2), margin, y);
  y += 8;
  pdf.setTextColor(...BRAND.orange);
  pdf.text(letterhead.footerContact, margin, y);

  pdf.save(filename);
  return filename;
}
