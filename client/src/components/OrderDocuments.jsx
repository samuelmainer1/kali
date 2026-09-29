import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, Receipt, X } from 'lucide-react';
import { formatKES } from '../lib/api';
import { downloadOrderDocumentPdf } from '../lib/downloadInvoicePdf';
import { useBrand } from '../lib/useBrand';
import { letterheadFromSite, formatInvoiceDate } from '../lib/invoiceLetterhead';

export const ORDER_FLOW = ['placed', 'confirmed', 'picking', 'packed', 'out_for_delivery', 'delivered'];

export function nextOrderStatuses(current) {
  if (!current || current === 'cancelled' || current === 'delivered') return [];
  const i = ORDER_FLOW.indexOf(current);
  if (i < 0) return ['confirmed'];
  const opts = [];
  if (ORDER_FLOW[i + 1]) opts.push(ORDER_FLOW[i + 1]);
  if (current === 'placed' || current === 'confirmed') opts.push('cancelled');
  return opts;
}

function DocumentViewer({ doc, order, onClose, brand }) {
  const items = doc.items || order?.items || [];
  const isReceipt = doc.type === 'receipt';
  const title = isReceipt ? 'Receipt' : 'Invoice';
  const [busy, setBusy] = useState(false);
  const logo = brand?.logo || '/logo-header.png';
  const letterhead = brand?.letterhead || letterheadFromSite(null);
  const companyLines = letterhead.companyLines || [];

  const issuedAt = doc.issuedAt || order?.createdAt || new Date().toISOString();
  const dueAt = (() => {
    const d = new Date(issuedAt);
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  })();
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
  const orderNumber = order?.orderNumber || doc.orderNumber || '';
  const tracking = order?.trackingNumber || '';

  async function handleDownload() {
    if (busy) return;
    setBusy(true);
    try {
      await downloadOrderDocumentPdf(doc, order, brand);
    } catch (err) {
      console.error(err);
      alert('Could not download the PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bd-doc-modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="bd-doc-modal-backdrop" onClick={onClose} />
      <div className="bd-doc-modal-panel">
        <div className="bd-doc-modal-toolbar">
          <strong>{isReceipt ? 'Delivery receipt' : 'Tax invoice'}</strong>
          <div className="bd-doc-modal-actions">
            <button type="button" className="bd-doc-btn" onClick={handleDownload} disabled={busy}>
              <Download size={14} /> {busy ? 'Preparing…' : 'Download PDF'}
            </button>
            <button type="button" className="bd-doc-modal-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={`bd-doc-sheet bd-invoice-pro${isReceipt ? ' is-receipt' : ''}`}>
          <div className="bd-invoice-pro-head">
            <div className="bd-invoice-pro-brand">
              <img src={logo} alt={letterhead.companyName} />
            </div>
            <div className="bd-invoice-pro-title">
              <h2>{isReceipt ? 'RECEIPT' : 'INVOICE'}</h2>
              <p># {orderNumber || doc.id || ''}</p>
            </div>
          </div>

          <div className="bd-invoice-pro-meta-row">
            <div className="bd-invoice-pro-company">
              <strong>{letterhead.companyName}</strong>
              {companyLines.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </div>
            <div className="bd-invoice-pro-dates">
              <div>
                <span>Date:</span>
                <strong>{formatInvoiceDate(issuedAt)}</strong>
              </div>
              {!paid ? (
                <div>
                  <span>Due Date:</span>
                  <strong>{formatInvoiceDate(dueAt)}</strong>
                </div>
              ) : null}
              <div>
                <span>Tracking:</span>
                <strong>{tracking || '—'}</strong>
              </div>
            </div>
          </div>

          <div className="bd-invoice-pro-balance">
            <span>Balance Due:</span>
            <strong>
              {paid ? <em className="bd-invoice-paid">PAID</em> : null}
              {formatKES(balanceDue)}
            </strong>
          </div>

          <div className="bd-invoice-pro-parties">
            <div>
              <p className="bd-invoice-pro-label">Bill To:</p>
              <strong>{doc.to?.name || order?.customerName || ''}</strong>
              <span>{doc.to?.email || order?.customerEmail || ''}</span>
              <span>{doc.to?.phone || order?.customerPhone || ''}</span>
              <span>Order {orderNumber}</span>
            </div>
            <div>
              <p className="bd-invoice-pro-label">Ship To:</p>
              {addr.line1 ? (
                <>
                  <strong>{addr.line1}</strong>
                  <span>{[addr.city, addr.county].filter(Boolean).join(', ')}</span>
                  {addr.notes ? <span>{addr.notes}</span> : null}
                </>
              ) : (
                <span>Same as billing</span>
              )}
            </div>
          </div>

          <table className="bd-invoice-pro-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantity</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.productId || i.name}>
                  <td>{i.name}</td>
                  <td>{i.qty}</td>
                  <td>{formatKES(i.price || 0)}</td>
                  <td>{formatKES((i.price || 0) * (i.qty || 1))}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bd-invoice-pro-totals">
            <div>
              <span>Subtotal:</span>
              <strong>{formatKES(subtotal)}</strong>
            </div>
            {discount > 0 && (
              <div>
                <span>Discount:</span>
                <strong>-{formatKES(discount)}</strong>
              </div>
            )}
            {shipping > 0 && (
              <div>
                <span>Delivery:</span>
                <strong>{formatKES(shipping)}</strong>
              </div>
            )}
            <div className="grand">
              <span>Total:</span>
              <strong>{formatKES(total)}</strong>
            </div>
          </div>

          <p className="bd-invoice-pro-note">
            {letterhead.thankYou}
            <br />
            {letterhead.footerContact}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderDocuments({ order, compact = false }) {
  const brand = useBrand();
  const docs = order?.documents || [];
  const invoice = docs.find((d) => d.type === 'invoice');
  const receipt = docs.find((d) => d.type === 'receipt');
  const [viewing, setViewing] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const effectiveInvoice = useMemo(() => {
    if (invoice) return invoice;
    if (!order) return null;
    return {
      id: `INV-${order.orderNumber || order.id}`,
      type: 'invoice',
      title: 'Tax invoice',
      issuedAt: order.createdAt || new Date().toISOString(),
      orderNumber: order.orderNumber,
      to: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      items: order.items,
      shipping: order.shipping,
      total: order.total,
      note: brand.letterhead?.thankYou || 'Thank you for shopping with BigDrop Kenya. We hope to see you again soon.',
    };
  }, [invoice, order, brand.letterhead?.thankYou]);

  useEffect(() => {
    if (!viewing) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setViewing(null);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [viewing]);

  async function handleQuickDownload(doc, key) {
    if (downloading) return;
    setDownloading(key);
    try {
      await downloadOrderDocumentPdf(doc, order, brand);
    } catch (err) {
      console.error(err);
      alert('Could not download the PDF. Please try again.');
    } finally {
      setDownloading(null);
    }
  }

  if (!effectiveInvoice && !receipt) return null;

  return (
    <>
      <div className={`bd-order-docs${compact ? ' compact' : ''}`}>
        {effectiveInvoice && (
          <>
            <button type="button" className="bd-doc-btn" onClick={() => setViewing(effectiveInvoice)}>
              <Eye size={14} /> View invoice
            </button>
            <button
              type="button"
              className="bd-doc-btn"
              onClick={() => handleQuickDownload(effectiveInvoice, 'invoice')}
              disabled={downloading === 'invoice'}
            >
              <Download size={14} /> {downloading === 'invoice' ? 'Downloading…' : 'Download invoice'}
            </button>
          </>
        )}
        {receipt && (
          <>
            <button type="button" className="bd-doc-btn receipt" onClick={() => setViewing(receipt)}>
              <Receipt size={14} /> View receipt
            </button>
            <button
              type="button"
              className="bd-doc-btn receipt"
              onClick={() => handleQuickDownload(receipt, 'receipt')}
              disabled={downloading === 'receipt'}
            >
              <Download size={14} /> {downloading === 'receipt' ? 'Downloading…' : 'Download receipt'}
            </button>
          </>
        )}
        {!receipt && order?.status !== 'delivered' && effectiveInvoice && !compact && (
          <span className="bd-doc-hint">
            <FileText size={12} /> Receipt when delivered
          </span>
        )}
      </div>
      {viewing && <DocumentViewer doc={viewing} order={order} brand={brand} onClose={() => setViewing(null)} />}
    </>
  );
}
