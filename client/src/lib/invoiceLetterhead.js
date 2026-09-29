export const INVOICE_COMPANY_NAME = 'BigDrop Kenya';

export const INVOICE_ADDRESS_LINES = ['NextGen Mall,', '3rd Floor, Suite 40,', 'Nairobi, Kenya.'];

export const INVOICE_ORDERS_EMAIL = 'orders@bigdrop.co.ke';
export const INVOICE_PHONE = '+254 722 359 298';

export const INVOICE_THANK_YOU = 'Thank you for shopping with BigDrop Kenya. We hope to see you again soon.';
export const INVOICE_FOOTER_CONTACT = 'www.bigdrop.co.ke · orders@bigdrop.co.ke · +254 722 359 298';

export function letterheadFromSite(site) {
  const raw = site?.letterhead || {};
  const companyName = String(raw.companyName || INVOICE_COMPANY_NAME).trim() || INVOICE_COMPANY_NAME;
  const address = String(raw.address || INVOICE_ADDRESS_LINES.join('\n'));
  const addressLines = address
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const lines = addressLines.length ? addressLines : INVOICE_ADDRESS_LINES;
  const email = String(raw.email || INVOICE_ORDERS_EMAIL).trim() || INVOICE_ORDERS_EMAIL;
  const phone = String(raw.phone || INVOICE_PHONE).trim() || INVOICE_PHONE;
  const thankYou = String(raw.thankYou || INVOICE_THANK_YOU).trim() || INVOICE_THANK_YOU;
  const footerContact = String(raw.footerContact || INVOICE_FOOTER_CONTACT).trim() || INVOICE_FOOTER_CONTACT;
  return {
    companyName,
    address,
    addressLines: lines,
    email,
    phone,
    thankYou,
    footerContact,
    companyLines: [...lines, email, phone],
  };
}

export function invoiceCompanyLines(site) {
  return letterheadFromSite(site).companyLines;
}

export function formatInvoiceDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
