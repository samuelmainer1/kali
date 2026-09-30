import { letterheadFromSite } from './invoiceLetterhead';

export const INVOICE_BLUE = [47, 83, 149];
export const INVOICE_NAVY = [31, 56, 99];
export const INVOICE_HEADER_GRAY = [241, 242, 241];
export const INVOICE_LINE = [190, 196, 204];
export const INVOICE_INK = [28, 28, 28];

export const INVOICE_TERMS = [
  '1. Inspect your parcel on delivery. Report damage or missing items within 24 hours for a replacement or refund.',
  '2. Unused items in original packaging may be returned within 24 hours. Refunds take 5–10 business days to M-Pesa or the original payment method.',
];

export const INVOICE_THANKS = 'THANK YOU FOR YOUR BUSINESS!';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatTemplateDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${MONTHS[d.getMonth()]}-${yy}`;
}

export function formatInvoiceMoney(amount) {
  return Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function paymentMethodLabel(method) {
  const m = String(method || '').toLowerCase();
  if (m === 'cod' || m === 'cash') return 'CASH';
  if (m === 'mpesa' || m === 'm-pesa') return 'M-PESA';
  if (m === 'card') return 'CARD';
  return m ? String(method).toUpperCase() : '—';
}

function billingAddress(order) {
  const addr = order?.shippingAddress || {};
  return [addr.line1, addr.city, addr.county, addr.notes].filter(Boolean).join(', ') || '—';
}

export function invoiceTransactionId(order, doc) {
  const existing = [
    order?.mpesaReceipt,
    order?.paymentRef,
    order?.transactionNumber,
    doc?.transactionNumber,
    doc?.paymentRef,
    doc?.mpesaReceipt,
  ]
    .map((v) => String(v || '').trim())
    .find((v) => v && v !== '—');
  if (existing) return existing;
  const num = order?.orderNumber || doc?.orderNumber || order?.trackingNumber || doc?.id || order?.id || '';
  if (!num) return '—';
  return `TXN-${String(num).replace(/^BD/i, '')}`;
}

function transactionRef(order, doc) {
  return invoiceTransactionId(order, doc);
}

export function buildInvoiceModel(doc, order, brandInput) {
  const brand = brandInput || {};
  const letterhead = brand.letterhead || letterheadFromSite(null);
  const items = doc?.items || order?.items || [];
  const isReceipt = doc?.type === 'receipt';
  const orderNumber = order?.orderNumber || doc?.orderNumber || doc?.id || '';
  const issuedAt = doc?.issuedAt || order?.createdAt || new Date().toISOString();
  const shipping = Number(doc?.shipping ?? order?.shipping ?? 0);
  const discount = Number(order?.discount || doc?.discount || 0);
  const paid = order?.paymentStatus === 'paid' || isReceipt;
  const paymentDate = paid ? issuedAt : '';
  const dateLabel = formatTemplateDate(issuedAt);

  const orderItems = order?.items || [];
  const skuFor = (item) => {
    const direct = String(item?.sku || item?.code || '').trim();
    if (direct) return direct;
    const match = orderItems.find(
      (other) =>
        (item?.productId && other.productId === item.productId) ||
        (item?.name && other.name === item.name)
    );
    return String(match?.sku || match?.code || '').trim();
  };

  const rows = items.map((item) => {
    const qty = Number(item.qty || 1);
    const rate = Number(item.price || 0);
    const sku = skuFor(item);
    return {
      date: dateLabel,
      sku,
      code: sku,
      description: item.name || 'Item',
      qty,
      unitPrice: rate,
      rate,
      amount: rate * qty,
      fare: rate * qty,
    };
  });

  if (shipping > 0) {
    rows.push({
      date: dateLabel,
      sku: 'DELIVERY',
      description: 'Delivery',
      qty: 1,
      unitPrice: shipping,
      amount: shipping,
    });
  }

  if (discount > 0) {
    rows.push({
      date: dateLabel,
      sku: '',
      description: 'Discount',
      qty: 1,
      unitPrice: -discount,
      amount: -discount,
    });
  }

  const subtotal = rows.reduce((sum, row) => sum + row.amount, 0);
  const grandTotal = Number(doc?.total ?? order?.total ?? subtotal);
  const addressLine =
    (letterhead.addressLines || []).join(', ').replace(/,\s*,/g, ', ') ||
    'Nextgen Mall, 3rd Floor, Suite 39/40';

  return {
    isReceipt,
    title: isReceipt ? 'RECEIPT' : 'INVOICE',
    companyName: letterhead.companyName || 'BigDrop Kenya',
    addressLine,
    contactLine: `${letterhead.email || 'orders@bigdrop.co.ke'} | ${letterhead.phone || '+254 722 359 298'}`,
    logo: '/logo.png',
    orderNumber,
    issuedAt,
    dateLabel,
    billTo: {
      name: doc?.to?.name || order?.customerName || '',
      email: doc?.to?.email || order?.customerEmail || '',
      phone: doc?.to?.phone || order?.customerPhone || '',
      address: billingAddress(order),
    },
    payment: {
      method: paymentMethodLabel(doc?.paymentMethod || order?.paymentMethod),
      transaction: transactionRef(order, doc),
      cardNumber: doc?.cardNumber || order?.cardLast4 || '',
      date: paymentDate ? formatTemplateDate(paymentDate) : '—',
    },
    rows,
    subtotal,
    taxPct: 0,
    grandTotal,
    terms: INVOICE_TERMS,
    thanks: letterhead.thankYou && /thank you for your business/i.test(letterhead.thankYou)
      ? letterhead.thankYou
      : INVOICE_THANKS,
    minRows: 6,
  };
}
