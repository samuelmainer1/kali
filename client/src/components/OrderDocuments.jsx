import { useEffect, useMemo, useState } from 'react';
import { Download, Eye, FileText, Receipt, X } from 'lucide-react';
import { downloadOrderDocumentPdf } from '../lib/downloadInvoicePdf';
import { useBrand } from '../lib/useBrand';
import { buildInvoiceModel, formatInvoiceMoney } from '../lib/invoiceTemplate';

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

function MoneyCell({ value }) {
  return (
    <span className="bd-inv-money">
      <em>Ksh</em>
      <span>{formatInvoiceMoney(value)}</span>
    </span>
  );
}

function DocumentViewer({ doc, order, onClose, brand }) {
  const title = doc.type === 'receipt' ? 'Receipt' : 'Invoice';
  const [busy, setBusy] = useState(false);
  const model = useMemo(() => buildInvoiceModel(doc, order, brand), [doc, order, brand]);
  const displayRows = [
    ...model.rows,
    ...Array.from({ length: Math.max(0, model.minRows - model.rows.length) }, () => null),
  ];

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
      <div className="bd-doc-modal-panel bd-doc-modal-panel-wide">
        <div className="bd-doc-modal-toolbar">
          <strong>{model.isReceipt ? 'Delivery receipt' : 'Tax invoice'}</strong>
          <div className="bd-doc-modal-actions">
            <button type="button" className="bd-doc-btn" onClick={handleDownload} disabled={busy}>
              <Download size={14} /> {busy ? 'Preparing…' : 'Download PDF'}
            </button>
            <button type="button" className="bd-doc-modal-close" onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={`bd-doc-sheet bd-inv-tpl${model.isReceipt ? ' is-receipt' : ''}`}>
          <header className="bd-inv-tpl-head">
            <div className="bd-inv-tpl-brand">
              <div className="bd-inv-tpl-logo">
                <img src={model.logo} alt={model.companyName} />
              </div>
              <div className="bd-inv-tpl-company">
                <h1>{model.companyName}</h1>
                <p>{model.addressLine}</p>
                <p className="bd-inv-tpl-contact">{model.contactLine}</p>
              </div>
            </div>
            <h2>{model.title}</h2>
          </header>

          <div className="bd-inv-tpl-ids">
            <div className="bd-inv-tpl-id">
              <span>INVOICE NUMBER</span>
              <strong>{model.orderNumber}</strong>
            </div>
            <div className="bd-inv-tpl-id">
              <span>INVOICE DATE</span>
              <strong>{model.dateLabel}</strong>
            </div>
          </div>

          <div className="bd-inv-tpl-grid">
            <section>
              <h3>BILL TO</h3>
              <dl>
                <div>
                  <dt>NAME</dt>
                  <dd>{model.billTo.name || '—'}</dd>
                </div>
                <div>
                  <dt>EMAIL</dt>
                  <dd>{model.billTo.email || '—'}</dd>
                </div>
                <div>
                  <dt>PHONE</dt>
                  <dd>{model.billTo.phone || '—'}</dd>
                </div>
                <div>
                  <dt>BILLING ADDRESS</dt>
                  <dd>{model.billTo.address || '—'}</dd>
                </div>
              </dl>
            </section>
            <section>
              <h3>PAYMENT DETAILS</h3>
              <dl>
                <div>
                  <dt>PAYMENT METHOD</dt>
                  <dd>{model.payment.method}</dd>
                </div>
                <div>
                  <dt>TRANSACTION #</dt>
                  <dd>{model.payment.transaction}</dd>
                </div>
              {model.payment.cardNumber ? (
                <div>
                  <dt>CARD NUMBER</dt>
                  <dd>{model.payment.cardNumber}</dd>
                </div>
              ) : null}
                <div>
                  <dt>PAYMENT DATE</dt>
                  <dd>{model.payment.date}</dd>
                </div>
              </dl>
            </section>
          </div>

          <table className="bd-inv-tpl-table">
            <colgroup>
              <col className="bd-inv-col-date" />
              <col className="bd-inv-col-sku" />
              <col className="bd-inv-col-desc" />
              <col className="bd-inv-col-qty" />
              <col className="bd-inv-col-price" />
              <col className="bd-inv-col-amount" />
            </colgroup>
            <thead>
              <tr>
                <th>Date</th>
                <th>SKU</th>
                <th className="bd-inv-desc">Description</th>
                <th className="bd-inv-qty">Qty</th>
                <th>Unit Price</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, idx) =>
                row ? (
                  <tr key={`${row.description}-${idx}`}>
                    <td>{row.date}</td>
                    <td className="bd-inv-sku">{row.sku || '—'}</td>
                    <td className="bd-inv-desc">{row.description}</td>
                    <td className="bd-inv-qty">{row.qty}</td>
                    <td>
                      <MoneyCell value={row.unitPrice} />
                    </td>
                    <td>
                      <MoneyCell value={row.amount} />
                    </td>
                  </tr>
                ) : (
                  <tr key={`empty-${idx}`} className="bd-inv-empty">
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                    <td className="bd-inv-desc">&nbsp;</td>
                    <td className="bd-inv-qty">&nbsp;</td>
                    <td>&nbsp;</td>
                    <td>&nbsp;</td>
                  </tr>
                )
              )}
            </tbody>
          </table>

          <div className="bd-inv-tpl-bottom">
            <div className="bd-inv-tpl-terms">
              <h4>Terms &amp; Conditions</h4>
              {model.terms.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <div className="bd-inv-tpl-totals">
              <div>
                <span>SUB TOTAL</span>
                <MoneyCell value={model.subtotal} />
              </div>
              <div className="tax">
                <span>TAX {model.taxPct}%</span>
              </div>
              <div className="grand">
                <span>GRAND TOTAL</span>
                <MoneyCell value={model.grandTotal} />
              </div>
            </div>
          </div>

          <p className="bd-inv-tpl-thanks">{model.thanks}</p>
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
      paymentMethod: order.paymentMethod,
    };
  }, [invoice, order]);

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
