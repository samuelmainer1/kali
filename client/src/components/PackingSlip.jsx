import { useEffect, useState } from 'react';
import { Download, Truck, X } from 'lucide-react';
import { downloadWaybillPdf } from '../lib/downloadWaybillPdf';
import { useBrand } from '../lib/useBrand';

/**
 * Warehouse packing slip / waybill for Globeflight ops.
 */
export default function PackingSlip({ order }) {
  const brand = useBrand();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!order) return null;

  const items = order.items || [];
  const addr = order.shippingAddress || {};

  async function handleDownload() {
    if (busy) return;
    setBusy(true);
    try {
      await downloadWaybillPdf(order, brand);
    } catch (err) {
      console.error(err);
      alert('Could not download the waybill PDF. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button type="button" className="bd-doc-btn" onClick={() => setOpen(true)}>
        <Truck size={14} /> Packing slip / waybill
      </button>

      {open && (
        <div className="bd-doc-modal" role="dialog" aria-modal="true" aria-label="Packing slip">
          <div className="bd-doc-modal-backdrop" onClick={() => setOpen(false)} />
          <div className="bd-doc-modal-panel">
            <div className="bd-doc-modal-toolbar">
              <strong>Warehouse packing slip</strong>
              <div className="bd-doc-modal-actions">
                <button type="button" className="bd-doc-btn" onClick={handleDownload} disabled={busy}>
                  <Download size={14} /> {busy ? 'Preparing…' : 'Download PDF'}
                </button>
                <button type="button" className="bd-doc-modal-close" onClick={() => setOpen(false)} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="bd-doc-sheet bd-waybill-sheet">
              <div className="bd-doc-sheet-head">
                <img src={brand.logo} alt={brand.letterhead?.companyName || brand.name} />
                <div className="bd-doc-sheet-meta bd-waybill-letterhead">
                  <strong>{brand.letterhead?.companyName || brand.name}</strong>
                  <h2>Packing Slip / Waybill</h2>
                </div>
              </div>

              <div className="bd-waybill-code">
                <span>Tracking</span>
                <strong>{order.trackingNumber}</strong>
                <span>Order {order.orderNumber}</span>
              </div>

              <div className="bd-waybill-grid">
                <div>
                  <p className="bd-waybill-label">Ship to</p>
                  <p>
                    <strong>{order.customerName}</strong>
                    <br />
                    {order.customerPhone}
                    <br />
                    {addr.line1}
                    <br />
                    {addr.city}
                    {addr.county ? `, ${addr.county}` : ''}
                  </p>
                </div>
                <div>
                  <p className="bd-waybill-label">From warehouse</p>
                  <p>
                    <strong>{brand.letterhead?.companyName || brand.name}</strong>
                    <br />
                    {(brand.letterhead?.addressLines || []).map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                    {brand.phone}
                    <br />
                    {brand.ordersEmail}
                  </p>
                </div>
              </div>

              <table className="bd-doc-sheet-table">
                <thead>
                  <tr>
                    <th>SKU / Item</th>
                    <th>Qty</th>
                    <th>Pick</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.productId || i.name}>
                      <td>
                        {i.name}
                        {i.sku ? <span className="bd-doc-hint"> · {i.sku}</span> : null}
                      </td>
                      <td>{i.qty}</td>
                      <td>☐ Pack</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="bd-waybill-footer">
                <p>
                  Status:{' '}
                  <strong className="capitalize">{String(order.status || '').replace(/_/g, ' ')}</strong>
                </p>
                <p>Carrier: BigDrop Kenya · Fulfilled via Globeflight</p>
                <p>Picker _____________ &nbsp;&nbsp; Packer _____________ &nbsp;&nbsp; Date _____________</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
