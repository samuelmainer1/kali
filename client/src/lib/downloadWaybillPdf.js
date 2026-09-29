import { jsPDF } from 'jspdf';
import { brandFromSite, loadImageDataUrl, pdfImageFormat, logoDrawSize } from './brand';
import { letterheadFromSite } from './invoiceLetterhead';

/**
 * Download a warehouse packing slip / waybill as a PDF (no pop-up).
 */
export async function downloadWaybillPdf(order, brandInput) {
  if (!order) return null;
  const brand = brandInput || brandFromSite(null);
  const letterhead = brand.letterhead || letterheadFromSite(null);

  const items = order.items || [];
  const addr = order.shippingAddress || {};
  const filename = `Waybill-${order.trackingNumber || order.orderNumber || 'document'}.pdf`;

  const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 18;
  let y = 20;

  const logo = await loadImageDataUrl(brand.logo);
  let logoH = 14;
  if (logo) {
    try {
      const box = await logoDrawSize(logo, 16, 48);
      logoH = box.h;
      pdf.addImage(logo, pdfImageFormat(logo), margin, y - 8, box.w, box.h);
    } catch {
      /* text brand is enough */
    }
  }

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(17, 17, 17);
  pdf.text(letterhead.companyName || 'BigDrop Kenya', pageWidth - margin, y - 2, { align: 'right' });
  pdf.setFontSize(11);
  pdf.text('Packing Slip / Waybill', pageWidth - margin, y + 5, { align: 'right' });
  y += Math.max(12, logoH + 4);

  // Tracking block
  pdf.setFillColor(26, 26, 26);
  pdf.roundedRect(margin, y, pageWidth - margin * 2, 14, 2, 2, 'F');
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(255, 255, 255);
  pdf.text(
    `Tracking ${order.trackingNumber || '—'}  ·  Order ${order.orderNumber || '—'}`,
    margin + 4,
    y + 9
  );
  y += 22;

  // Ship to / From
  const col2 = pageWidth / 2 + 4;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(34, 34, 34);
  pdf.text('Ship to', margin, y);
  pdf.text('From warehouse', col2, y);
  y += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(68, 68, 68);
  const left = [order.customerName, order.customerPhone, addr.line1, addr.city].filter(Boolean);
  const right = [letterhead.companyName, ...(letterhead.addressLines || []), letterhead.email, letterhead.phone].filter(
    Boolean
  );
  const rows = Math.max(left.length, right.length);
  for (let i = 0; i < rows; i += 1) {
    if (left[i]) pdf.text(String(left[i]), margin, y);
    if (right[i]) pdf.text(String(right[i]), col2, y);
    y += 4.5;
  }
  y += 8;

  // Items table
  pdf.setFillColor(248, 248, 248);
  pdf.rect(margin, y - 4, pageWidth - margin * 2, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(102, 102, 102);
  pdf.text('ITEM', margin + 1, y);
  pdf.text('QTY', pageWidth - margin - 40, y, { align: 'center' });
  pdf.text('PICK', pageWidth - margin, y, { align: 'right' });
  y += 8;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(34, 34, 34);

  items.forEach((item) => {
    if (y > 260) {
      pdf.addPage();
      y = 20;
    }
    const label = item.sku ? `${item.name} · ${item.sku}` : String(item.name || 'Item');
    const wrapped = pdf.splitTextToSize(label, pageWidth - margin * 2 - 55);
    pdf.text(wrapped, margin + 1, y);
    pdf.text(String(item.qty || 1), pageWidth - margin - 40, y, { align: 'center' });
    pdf.text('[  ]', pageWidth - margin, y, { align: 'right' });
    y += Math.max(6, wrapped.length * 4.5) + 2;
    pdf.setDrawColor(238, 238, 238);
    pdf.line(margin, y - 2, pageWidth - margin, y - 2);
  });

  y += 10;
  pdf.setFontSize(9);
  pdf.setTextColor(85, 85, 85);
  pdf.text(
    `Status: ${String(order.status || '').replace(/_/g, ' ')} · Carrier: ${letterhead.companyName || 'BigDrop Kenya'}`,
    margin,
    y
  );
  y += 10;
  pdf.setTextColor(34, 34, 34);
  pdf.text('Picker _____________    Packer _____________    Date _____________', margin, y);

  pdf.save(filename);
  return filename;
}
