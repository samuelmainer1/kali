import { jsPDF } from 'jspdf';
import { loadImageDataUrl, pdfImageFormat } from './brand';
import {
  INVOICE_BLUE,
  INVOICE_HEADER_GRAY,
  INVOICE_INK,
  INVOICE_LINE,
  buildInvoiceModel,
  formatInvoiceMoney,
} from './invoiceTemplate';

async function circularLogoDataUrl(src, size = 256) {
  const dataUrl = await loadImageDataUrl(src || '/logo.png');
  if (!dataUrl || typeof Image === 'undefined' || typeof document === 'undefined') return dataUrl;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0, size, size);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function drawBox(pdf, x, y, w, h, { fill, stroke, lineWidth = 0.25 } = {}) {
  if (fill) pdf.setFillColor(...fill);
  if (stroke) {
    pdf.setDrawColor(...stroke);
    pdf.setLineWidth(lineWidth);
  }
  const style = fill && stroke ? 'FD' : fill ? 'F' : 'S';
  pdf.rect(x, y, w, h, style);
}

function moneyParts(value) {
  return { symbol: 'Ksh', amount: formatInvoiceMoney(value) };
}

/**
 * Landscape invoice PDF matching Invoice_Template.pdf.
 */
export async function downloadOrderDocumentPdf(doc, order, brandInput) {
  const model = buildInvoiceModel(doc, order, brandInput);
  const filename = `${model.isReceipt ? 'Receipt' : 'Invoice'}-${model.orderNumber || 'document'}.pdf`;

  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const m = 10;
  const left = m;
  const right = pageW - m;
  const width = right - left;

  drawBox(pdf, left, m, width, pageH - m * 2, { stroke: [60, 60, 60], lineWidth: 0.4 });

  const pad = 6;
  const contentL = left + pad;
  const contentR = right - pad;
  let y = m + 8;

  const logo = await circularLogoDataUrl(model.logo || '/logo.png');
  const logoR = 11;
  const logoCx = contentL + logoR;
  const logoCy = y + 6;
  if (logo) {
    try {
      pdf.addImage(logo, pdfImageFormat(logo) === 'WEBP' ? 'PNG' : pdfImageFormat(logo), logoCx - logoR, logoCy - logoR, logoR * 2, logoR * 2);
    } catch {
      pdf.setFillColor(20, 20, 20);
      pdf.circle(logoCx, logoCy, logoR, 'F');
    }
  } else {
    pdf.setFillColor(20, 20, 20);
    pdf.circle(logoCx, logoCy, logoR, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.text('LOGO', logoCx, logoCy + 1, { align: 'center' });
  }

  const textX = contentL + logoR * 2 + 5;
  pdf.setTextColor(...INVOICE_INK);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text(model.companyName, textX, y + 2);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(model.addressLine, textX, y + 8);
  pdf.setTextColor(...INVOICE_BLUE);
  pdf.text(model.contactLine, textX, y + 13.5);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(22);
  pdf.setTextColor(...INVOICE_BLUE);
  pdf.text(model.title, contentR, y + 6, { align: 'right' });

  y += 24;

  const idH = 8;
  const numLabelW = 38;
  const numBoxW = 42;
  pdf.setFillColor(...INVOICE_HEADER_GRAY);
  pdf.rect(contentL, y, numLabelW, idH, 'F');
  pdf.setDrawColor(...INVOICE_LINE);
  pdf.setLineWidth(0.25);
  pdf.rect(contentL, y, numLabelW, idH, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.setTextColor(...INVOICE_INK);
  pdf.text('INVOICE NUMBER', contentL + numLabelW / 2, y + 5.3, { align: 'center' });
  pdf.setFillColor(255, 255, 255);
  pdf.rect(contentL + numLabelW, y, numBoxW, idH, 'FD');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(String(model.orderNumber || ''), contentL + numLabelW + numBoxW / 2, y + 5.5, { align: 'center' });

  const dateLabelW = 32;
  const dateBoxW = 32;
  const dateX = contentR - dateLabelW - dateBoxW;
  pdf.setFillColor(...INVOICE_HEADER_GRAY);
  pdf.rect(dateX, y, dateLabelW, idH, 'F');
  pdf.rect(dateX, y, dateLabelW, idH, 'S');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(7.5);
  pdf.text('INVOICE DATE', dateX + dateLabelW / 2, y + 5.3, { align: 'center' });
  pdf.setFillColor(255, 255, 255);
  pdf.rect(dateX + dateLabelW, y, dateBoxW, idH, 'FD');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text(model.dateLabel, dateX + dateLabelW + dateBoxW / 2, y + 5.5, { align: 'center' });

  y += 12;

  const gap = 4;
  const colW = (contentR - contentL - gap) / 2;
  const billX = contentL;
  const payX = contentL + colW + gap;
  const sectionH = 42;

  const drawSection = (x, title, rows) => {
    pdf.setFillColor(...INVOICE_HEADER_GRAY);
    pdf.rect(x, y, colW, 7, 'F');
    pdf.setDrawColor(...INVOICE_LINE);
    pdf.rect(x, y, colW, 7, 'S');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(...INVOICE_INK);
    pdf.text(title, x + colW / 2, y + 4.8, { align: 'center' });

    const rowH = (sectionH - 7) / rows.length;
    rows.forEach((row, i) => {
      const ry = y + 7 + i * rowH;
      pdf.setDrawColor(...INVOICE_LINE);
      pdf.rect(x, ry, colW, rowH, 'S');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...INVOICE_INK);
      pdf.text(row.label, x + 2.5, ry + rowH / 2 + 1.1);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      const value = pdf.splitTextToSize(String(row.value || '—'), colW - 40);
      pdf.text(value[0], x + 36, ry + rowH / 2 + 1.1);
    });
  };

  drawSection(billX, 'BILL TO', [
    { label: 'NAME', value: model.billTo.name },
    { label: 'EMAIL', value: model.billTo.email },
    { label: 'PHONE', value: model.billTo.phone },
    { label: 'BILLING ADDRESS', value: model.billTo.address },
  ]);
  drawSection(payX, 'PAYMENT DETAILS', [
    { label: 'PAYMENT METHOD', value: model.payment.method },
    { label: 'TRANSACTION #', value: model.payment.transaction },
    ...(model.payment.cardNumber ? [{ label: 'CARD NUMBER', value: model.payment.cardNumber }] : []),
    { label: 'PAYMENT DATE', value: model.payment.date },
  ]);

  y += sectionH + 5;

  const cols = [
    { key: 'date', label: 'Date', w: 22, align: 'center' },
    { key: 'sku', label: 'SKU', w: 32, align: 'center' },
    { key: 'description', label: 'Description', w: 132, align: 'left' },
    { key: 'qty', label: 'Qty', w: 10, align: 'center' },
    { key: 'unitPrice', label: 'Unit Price', w: 34, align: 'center' },
    { key: 'amount', label: 'Amount', w: 0, align: 'center' },
  ];
  const tableW = contentR - contentL;
  cols[cols.length - 1].w = tableW - cols.slice(0, -1).reduce((s, c) => s + c.w, 0);

  const headerH = 10;
  pdf.setFillColor(...INVOICE_BLUE);
  pdf.rect(contentL, y, tableW, headerH, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  let cx = contentL;
  cols.forEach((col) => {
    const lines = String(col.label).split('\n');
    const textY = lines.length > 1 ? y + 4 : y + 6.4;
    lines.forEach((line, i) => pdf.text(line, cx + col.w / 2, textY + i * 3.4, { align: 'center' }));
    cx += col.w;
  });

  y += headerH;
  const bodyTop = y;
  const rowH = 7;
  const padRows = Math.max(model.minRows, model.rows.length);
  const bodyH = padRows * rowH;

  pdf.setDrawColor(...INVOICE_LINE);
  pdf.setLineWidth(0.25);
  pdf.rect(contentL, bodyTop, tableW, bodyH, 'S');
  cx = contentL;
  cols.forEach((col, i) => {
    if (i > 0) pdf.line(cx, bodyTop, cx, bodyTop + bodyH);
    cx += col.w;
  });
  for (let i = 1; i < padRows; i += 1) {
    pdf.line(contentL, bodyTop + i * rowH, contentR, bodyTop + i * rowH);
  }

  pdf.setTextColor(...INVOICE_INK);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  const drawMoney = (x, w, value, ry) => {
    const { symbol, amount } = moneyParts(value);
    pdf.text(symbol, x + 2, ry);
    pdf.text(amount, x + w - 2, ry, { align: 'right' });
  };
  model.rows.forEach((row, idx) => {
    const ry = bodyTop + idx * rowH + 4.8;
    let x = contentL;
    const textCells = [
      { text: row.date, w: cols[0].w, align: 'center', size: 7.5 },
      { text: row.sku || '—', w: cols[1].w, align: 'center', size: 7.5 },
      { text: row.description, w: cols[2].w, align: 'left', size: 9 },
      { text: String(row.qty), w: cols[3].w, align: 'center', size: 8 },
    ];
    textCells.forEach((cell) => {
      pdf.setFontSize(cell.size);
      const inset = cell.align === 'left' ? 2.4 : 1.2;
      const wrapped = pdf.splitTextToSize(String(cell.text || ''), cell.w - inset * 2);
      const tx = cell.align === 'left' ? x + inset : x + cell.w / 2;
      pdf.text(wrapped[0] || '', tx, ry, { align: cell.align });
      x += cell.w;
    });
    pdf.setFontSize(8);
    drawMoney(x, cols[4].w, row.unitPrice, ry);
    x += cols[4].w;
    drawMoney(x, cols[5].w, row.amount, ry);
  });

  y = bodyTop + bodyH + 6;
  const totalsX = contentR - 86;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('SUB TOTAL', totalsX, y);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Ksh          ${formatInvoiceMoney(model.subtotal)}`, contentR, y, { align: 'right' });
  y += 6;
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(...INVOICE_BLUE);
  pdf.text(`TAX ${model.taxPct}%`, totalsX + 8, y);
  pdf.setTextColor(...INVOICE_INK);
  y += 7;

  pdf.setFillColor(...INVOICE_BLUE);
  pdf.rect(totalsX - 8, y - 5, contentR - (totalsX - 8), 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.text('GRAND TOTAL', totalsX - 5, y);
  pdf.text(`Ksh          ${formatInvoiceMoney(model.grandTotal)}`, contentR - 2, y, { align: 'right' });

  const termsY = bodyTop + bodyH + 6;
  pdf.setTextColor(...INVOICE_BLUE);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.text('Terms & Conditions', contentL, termsY);
  pdf.setTextColor(...INVOICE_INK);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  model.terms.forEach((line, i) => {
    pdf.text(pdf.splitTextToSize(line, 160), contentL, termsY + 6 + i * 6);
  });

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(9);
  pdf.setTextColor(130, 130, 130);
  pdf.text(model.thanks, (left + right) / 2, pageH - m - 5, { align: 'center' });

  pdf.save(filename);
  return filename;
}
