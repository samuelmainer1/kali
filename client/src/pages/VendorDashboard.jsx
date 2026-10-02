import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  PackageSearch,
  ShoppingBag,
  PlusCircle,
  Wallet,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Pencil,
  Trash2,
} from 'lucide-react';
import { api, formatKES } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import OrderDocuments from '../components/OrderDocuments';
import OrderTimeline from '../components/OrderTimeline';
import PackingSlip from '../components/PackingSlip';
import ProductEditForm from '../components/ProductEditForm';
import ProductImagesField from '../components/ProductImagesField';
import DeliveredOrderCard from '../components/DeliveredOrderCard';
import ChangePasswordForm from '../components/ChangePasswordForm';
import NewOrdersBadge from '../components/NewOrdersBadge';
import { Link } from 'react-router-dom';
import { defaultVendorHours } from '../lib/hours';

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'products', label: 'Products', icon: PackageSearch },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'add', label: 'Add product', icon: PlusCircle },
  { id: 'import', label: 'Bulk upload', icon: PlusCircle },
  { id: 'payouts', label: 'Payouts', icon: Wallet },
  { id: 'shop', label: 'Shop hours', icon: Clock },
];

const emptyForm = {
  name: '',
  description: '',
  specifications: '',
  price: '',
  compareAt: '',
  stock: '10',
  categoryId: '',
  sku: '',
  images: [],
  variants: '',
};

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-leaf-pale text-leaf',
    rejected: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] || 'bg-mist text-ink-mute'}`}>
      {status}
    </span>
  );
}

export default function VendorDashboard() {
  const { user } = useAuth();
  const isApproved = user?.status === 'approved';
  const isPending = user?.status === 'pending';
  const isRejected = user?.status === 'rejected';

  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingProduct, setEditingProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [payouts, setPayouts] = useState({ payouts: [], summary: {} });
  const [hours, setHours] = useState(defaultVendorHours());
  const [csvText, setCsvText] = useState('name,price,stock,categorySlug,description,brand\n');
  const [notice, setNotice] = useState('');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const [s, p, o, c, alerts, pay] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/products?mine=true'),
        api.get('/orders'),
        api.get('/categories'),
        api.get('/admin/stock-alerts').catch(() => ({ alerts: [] })),
        api.get('/dashboard/payouts').catch(() => ({ payouts: [], summary: {} })),
      ]);
      setStats(s.stats);
      setProducts(p.products);
      setOrders(o.orders);
      setCategories(c.categories);
      setStockAlerts(alerts.alerts || []);
      setPayouts({ payouts: pay.payouts || [], summary: pay.summary || {} });
      setForm((f) => (f.categoryId ? f : { ...f, categoryId: c.categories[0]?.id || '' }));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function flash(msg) {
    setNotice(msg);
    setTimeout(() => setNotice(''), 3000);
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function addProduct(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const images = (form.images || []).slice(0, 3);

      await api.post('/products', {
        name: form.name,
        description: form.description,
        specifications: form.specifications,
        variants: form.variants,
        price: Number(form.price),
        compareAt: form.compareAt ? Number(form.compareAt) : null,
        stock: Number(form.stock),
        categoryId: form.categoryId,
        sku: form.sku || undefined,
        images: images.length ? images : undefined,
      });
      flash('Product submitted for admin approval');
      setForm((f) => ({ ...emptyForm, categoryId: f.categoryId }));
      await refresh();
      setTab('products');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function stockAction(id, action) {
    try {
      await api.patch(`/products/${id}/stock-action`, { action, stock: action === 'restock' ? 40 : undefined });
      flash(action === 'hide' ? 'Listing hidden' : 'Stock updated');
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  async function importCsv(e) {
    e.preventDefault();
    const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      setError('Add a header row and at least one product');
      return;
    }
    const headers = lines[0].split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const cols = line.split(',').map((c) => c.trim());
      const row = {};
      headers.forEach((h, i) => {
        row[h] = cols[i];
      });
      return row;
    });
    try {
      const res = await api.post('/products/bulk', { rows });
      flash(`Imported ${res.count} products`);
      await refresh();
      setTab('products');
    } catch (err) {
      setError(err.message);
    }
  }

  async function saveHours(e) {
    e.preventDefault();
    try {
      await api.patch('/vendor/shop', { hours });
      flash('Shop hours saved');
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeProduct(id) {
    if (!confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      flash('Product removed');
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  }

  const cards = useMemo(
    () => [
      { label: 'Products', value: stats?.products ?? '—', icon: PackageSearch, accent: 'text-ink bg-mist' },
      { label: 'Orders', value: stats?.orders ?? '—', icon: ShoppingBag, accent: 'text-ink bg-mist' },
      { label: 'Revenue', value: stats ? formatKES(stats.revenue) : '—', icon: Wallet, accent: 'text-leaf bg-leaf-pale' },
      { label: 'Low stock', value: stats?.lowStock ?? '—', icon: AlertTriangle, accent: 'text-amber-600 bg-amber-100' },
    ],
    [stats]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-mute">{user?.storeName || user?.name} · BigDrop marketplace</p>
        </div>
      </div>

      {isPending && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4"
        >
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-800">Awaiting admin approval</p>
            <p className="mt-1 text-sm text-amber-700">
              Your vendor application is under review. You&apos;ll be able to list products as soon as
              a BigDrop admin approves your store. This usually happens within one business day.
            </p>
          </div>
        </motion.div>
      )}

      {isRejected && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 flex items-start gap-3 rounded-2xl border border-red-300 bg-red-50 px-5 py-4"
        >
          <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Vendor application rejected</p>
            <p className="mt-1 text-sm text-red-700">
              Your store was not approved. Contact BigDrop support at info@bigdrop.co.ke for details.
            </p>
          </div>
        </motion.div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            disabled={t.id === 'add' && !isApproved}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition disabled:cursor-not-allowed disabled:opacity-40 ${
              tab === t.id ? 'bg-ink text-white border-ink' : 'bg-white border-ink/10 hover:border-ink/20'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-ember">{error}</p>}
      {notice && (
        <motion.p
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-leaf-pale px-4 py-2 text-sm font-semibold text-leaf"
        >
          {notice}
        </motion.p>
      )}

      {loading ? (
        <p className="mt-10 text-sm text-ink-mute">Loading dashboard…</p>
      ) : (
        <>
          {tab === 'overview' && (
            <div className="mt-8 space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map(({ label, value, icon: Icon, accent }) => (
                  <div key={label} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-ink-mute">{label}</p>
                      <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                    </div>
                    <p className="mt-2 font-display text-2xl font-bold">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                <p className="font-semibold">Pending fulfillment</p>
                <p className="mt-1 text-3xl font-display font-bold text-ember">{stats?.pending ?? 0}</p>
                <p className="text-sm text-ink-mute">Orders awaiting delivery completion</p>
              </div>
              <ChangePasswordForm />
              {stockAlerts.length > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <p className="font-semibold text-sm text-amber-800">Low stock — email alerts sent</p>
                  <ul className="mt-3 space-y-2">
                    {stockAlerts.map((a) => (
                      <li key={a.productId} className="text-sm text-amber-900 flex flex-wrap justify-between gap-3 items-center">
                        <span>
                          {a.name} · <strong>{a.stock} left</strong>
                        </span>
                        <span className="flex gap-2">
                          <button type="button" className="text-xs font-semibold underline" onClick={() => stockAction(a.productId, 'restock')}>
                            Restock
                          </button>
                          <button type="button" className="text-xs font-semibold underline" onClick={() => stockAction(a.productId, 'hide')}>
                            Hide
                          </button>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                  <p className="text-sm text-ink-mute">Products pending approval</p>
                  <p className="mt-1 font-display text-2xl font-bold">{stats?.productsPending ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                  <p className="text-sm text-ink-mute">Live products</p>
                  <p className="mt-1 font-display text-2xl font-bold">{stats?.productsLive ?? 0}</p>
                </div>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-lift">
              <table className="w-full text-sm text-left">
                <thead className="border-b border-ink/10 text-ink-mute">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Status</th>
                    <th className="p-4"></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-b border-ink/5 last:border-0">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img src={p.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          <span className="font-medium max-w-[220px] truncate">{p.name}</span>
                        </div>
                      </td>
                      <td className="p-4">{formatKES(p.price)}</td>
                      <td className="p-4">{p.stock}</td>
                      <td className="p-4">
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            className="inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProduct(p.id)}
                            className="inline-flex items-center gap-1 text-ember text-xs font-semibold hover:underline"
                          >
                            <Trash2 className="h-3.5 w-3.5" /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-sm text-ink-mute">
                        No products listed yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'orders' && (
            <div className="mt-8 space-y-8">
              <NewOrdersBadge orders={orders} />
              <p className="text-sm text-ink-mute">
                Same tracking timeline as the customer. Status changes are managed by BigDrop admin only.
              </p>
              {(() => {
                const vendorItems = (o) => (o.items || []).filter((i) => i.vendorId === user.id);
                const active = orders.filter((o) => o.status !== 'delivered');
                const delivered = orders.filter((o) => o.status === 'delivered');
                return (
                  <>
                    {active.length > 0 && (
                      <section className="space-y-4">
                        <h2 className="font-display text-2xl font-bold">Orders in progress</h2>
                        {active.map((o) => (
                          <div key={o.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold">{o.orderNumber}</p>
                                <p className="text-xs text-ink-mute">
                                  {o.customerName} · {o.trackingNumber} · {formatKES(o.total)}
                                </p>
                              </div>
                              <span className="rounded-lg bg-mist px-3 py-1.5 text-xs font-semibold capitalize">
                                {o.status.replace(/_/g, ' ')}
                              </span>
                            </div>
                            <ul className="mt-3 text-sm text-ink-mute">
                              {vendorItems(o).map((i) => (
                                <li key={i.productId}>
                                  {i.qty}× {i.name}
                                </li>
                              ))}
                            </ul>
                            <OrderTimeline order={o} />
                            <div className="mt-3 flex flex-wrap gap-2">
                              <OrderDocuments order={o} />
                              <PackingSlip order={o} />
                            </div>
                          </div>
                        ))}
                      </section>
                    )}
                    {delivered.length > 0 && (
                      <section>
                        <h2 className="font-display text-2xl font-bold">Delivered orders</h2>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {delivered.map((o) => (
                            <DeliveredOrderCard key={o.id} o={{ ...o, items: vendorItems(o) }} subtitle={o.customerName}>
                              <OrderDocuments order={o} compact />
                              <PackingSlip order={o} />
                              <Link
                                to={`/track?code=${encodeURIComponent(o.trackingNumber)}`}
                                className="block text-xs font-semibold text-leaf"
                              >
                                Track shipment →
                              </Link>
                            </DeliveredOrderCard>
                          ))}
                        </div>
                      </section>
                    )}
                    {orders.length === 0 && <p className="text-sm text-ink-mute">No orders yet.</p>}
                  </>
                );
              })()}
            </div>
          )}

          {tab === 'add' && (
            <div className="mt-8 max-w-xl">
              {!isApproved ? (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 text-center">
                  <Clock className="mx-auto h-8 w-8 text-amber-600" />
                  <p className="mt-3 font-semibold text-amber-800">Store approval required</p>
                  <p className="mt-1 text-sm text-amber-700">
                    You can list products once BigDrop admin approves your vendor account.
                  </p>
                </div>
              ) : (
                <form onSubmit={addProduct} className="space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
                  <h2 className="font-display text-xl font-bold">List a product</h2>
                  <label className="block text-sm">
                    <span className="text-ink-mute">Name</span>
                    <input required value={form.name} onChange={set('name')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                  </label>
                  <label className="block text-sm">
                    <span className="text-ink-mute">Description</span>
                    <textarea required rows={3} value={form.description} onChange={set('description')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                  </label>
                  <label className="block text-sm">
                    <span className="text-ink-mute">Specifications</span>
                    <textarea
                      rows={4}
                      value={form.specifications}
                      onChange={set('specifications')}
                      placeholder={'Brand: Samsung\nScreen: 43 inch\nWarranty: 12 months'}
                      className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
                    />
                    <span className="mt-1 block text-xs text-ink-mute">One per line as Label: Value</span>
                  </label>
                  <label className="block text-sm">
                    <span className="text-ink-mute">Variants (optional)</span>
                    <textarea
                      rows={3}
                      value={form.variants}
                      onChange={set('variants')}
                      placeholder={'Size: S, M, L\nColour: Black, White'}
                      className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="text-ink-mute">Price (KES)</span>
                      <input required type="number" min="1" value={form.price} onChange={set('price')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                    </label>
                    <label className="block text-sm">
                      <span className="text-ink-mute">Compare-at (optional)</span>
                      <input type="number" min="1" value={form.compareAt} onChange={set('compareAt')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                    </label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="block text-sm">
                      <span className="text-ink-mute">Stock</span>
                      <input required type="number" min="0" value={form.stock} onChange={set('stock')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                    </label>
                    <label className="block text-sm">
                      <span className="text-ink-mute">SKU (optional)</span>
                      <input
                        value={form.sku}
                        onChange={set('sku')}
                        placeholder="Leave blank — we generate one"
                        className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
                      />
                    </label>
                  </div>
                  <label className="block text-sm">
                    <span className="text-ink-mute">Category</span>
                    <select required value={form.categoryId} onChange={set('categoryId')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5">
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <ProductImagesField
                    images={form.images}
                    onChange={(images) => setForm((f) => ({ ...f, images }))}
                    hint="Upload a file or paste a photo link. Square 800×800, max 150KB for uploads, up to 3 photos."
                  />

                  <p className="text-xs text-ink-mute">
                    New listings are reviewed by a BigDrop admin before appearing in the shop.
                  </p>
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full rounded-xl bg-ember py-3 text-sm font-semibold text-white hover:bg-ember-deep disabled:opacity-60"
                  >
                    {saving ? 'Submitting…' : 'Submit for approval'}
                  </button>
                </form>
              )}
            </div>
          )}

          {tab === 'import' && (
            <form onSubmit={importCsv} className="mt-8 max-w-2xl space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
              <h2 className="font-display text-xl font-bold">Bulk upload (CSV)</h2>
              <p className="text-sm text-ink-mute">
                Header row required. Columns: name, price, stock, categorySlug, description, brand, sku, image.
              </p>
              <textarea
                rows={10}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full rounded-xl border border-ink/10 px-3 py-2 font-mono text-xs"
              />
              <button type="submit" className="rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white">
                Import products
              </button>
            </form>
          )}

          {tab === 'payouts' && (
            <div className="mt-8 space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                  <p className="text-sm text-ink-mute">Gross (delivered)</p>
                  <p className="mt-1 font-display text-2xl font-bold">{formatKES(payouts.summary.totalGross || 0)}</p>
                </div>
                <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                  <p className="text-sm text-ink-mute">Commission (15%)</p>
                  <p className="mt-1 font-display text-2xl font-bold">{formatKES(payouts.summary.totalCommission || 0)}</p>
                </div>
                <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                  <p className="text-sm text-ink-mute">Your payout</p>
                  <p className="mt-1 font-display text-2xl font-bold text-leaf">{formatKES(payouts.summary.totalNet || 0)}</p>
                </div>
              </div>
              <div className="overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-lift">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-ink/10 text-ink-mute">
                    <tr>
                      <th className="p-4">Order</th>
                      <th className="p-4">Gross</th>
                      <th className="p-4">Net</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(payouts.payouts || []).map((row) => (
                      <tr key={row.id} className="border-b border-ink/5">
                        <td className="p-4">{row.orderNumber}</td>
                        <td className="p-4">{formatKES(row.gross)}</td>
                        <td className="p-4">{formatKES(row.net)}</td>
                        <td className="p-4 capitalize">{row.status}</td>
                      </tr>
                    ))}
                    {(payouts.payouts || []).length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-ink-mute">
                          Payouts appear after orders are delivered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'shop' && (
            <form onSubmit={saveHours} className="mt-8 max-w-xl space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
              <h2 className="font-display text-xl font-bold">Shop hours</h2>
              <p className="text-sm text-ink-mute">Shown as Open now / Closed on your public vendor shop.</p>
              {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map((day) => (
                <label key={day} className="flex items-center gap-3 text-sm">
                  <span className="w-10 uppercase text-ink-mute">{day}</span>
                  <input
                    value={hours[day] || ''}
                    onChange={(e) => setHours((h) => ({ ...h, [day]: e.target.value }))}
                    placeholder="08:00-20:00"
                    className="flex-1 rounded-xl border border-ink/10 px-3 py-2"
                  />
                </label>
              ))}
              <button type="submit" className="rounded-xl bg-ember px-4 py-2.5 text-sm font-semibold text-white">
                Save hours
              </button>
            </form>
          )}
        </>
      )}

      {editingProduct && (
        <ProductEditForm
          product={editingProduct}
          categories={categories}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null);
            flash('Product updated');
            refresh();
          }}
        />
      )}
    </div>
  );
}
