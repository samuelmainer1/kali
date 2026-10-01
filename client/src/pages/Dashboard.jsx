import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, formatKES } from '../lib/api';
import { Package, ShoppingBag, Wallet, AlertTriangle } from 'lucide-react';

const STATUS_OPTIONS = [
  'confirmed',
  'picking',
  'packed',
  'out_for_delivery',
  'delivered',
  'cancelled',
];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('overview');
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    stock: '10',
    categoryId: '',
    compareAt: '',
  });
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function refresh() {
    const [s, p, o, c] = await Promise.all([
      api.get('/dashboard/stats'),
      api.get(user.role === 'admin' ? '/products' : `/products?vendorId=${user.id}`),
      api.get('/orders'),
      api.get('/categories'),
    ]);
    setStats(s.stats);
    setProducts(p.products);
    setOrders(o.orders);
    setCategories(c.categories);
    if (!form.categoryId && c.categories[0]) {
      setForm((f) => ({ ...f, categoryId: c.categories[0].id }));
    }
  }

  useEffect(() => {
    refresh().catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  async function addProduct(e) {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.post('/products', {
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
        compareAt: form.compareAt ? Number(form.compareAt) : null,
        featured: true,
      });
      setMessage('Product listed');
      setForm((f) => ({ ...f, name: '', description: '', price: '', stock: '10', compareAt: '' }));
      await refresh();
      setTab('products');
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(orderId, status) {
    await api.patch(`/orders/${orderId}/status`, { status });
    await refresh();
  }

  async function removeProduct(id) {
    if (!confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    await refresh();
  }

  const cards = [
    { label: 'Products', value: stats?.products ?? '—', icon: Package },
    { label: 'Orders', value: stats?.orders ?? '—', icon: ShoppingBag },
    { label: 'Revenue', value: stats ? formatKES(stats.revenue) : '—', icon: Wallet },
    { label: 'Low stock', value: stats?.lowStock ?? '—', icon: AlertTriangle },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-mute">
            {user.role === 'admin' ? 'Admin' : user.storeName || user.name} · BigDrop ops
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {['overview', 'products', 'orders', 'add'].map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold capitalize border ${
              tab === t ? 'bg-ink text-white border-ink' : 'bg-white border-ink/10'
            }`}
          >
            {t === 'add' ? 'Add product' : t}
          </button>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-ember">{error}</p>}
      {message && <p className="mt-4 text-sm text-leaf">{message}</p>}

      {tab === 'overview' && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
              <div className="flex items-center justify-between">
                <p className="text-sm text-ink-mute">{label}</p>
                <Icon className="h-4 w-4 text-leaf" />
              </div>
              <p className="mt-2 font-display text-2xl font-bold">{value}</p>
            </div>
          ))}
          <div className="sm:col-span-2 lg:col-span-4 rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
            <p className="font-semibold">Pending fulfillment</p>
            <p className="mt-1 text-3xl font-display font-bold text-ember">{stats?.pending ?? 0}</p>
            <p className="text-sm text-ink-mute">Orders awaiting Globeflight delivery completion</p>
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
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-ink/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      <span className="font-medium">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4">{formatKES(p.price)}</td>
                  <td className="p-4">{p.stock}</td>
                  <td className="p-4 text-right">
                    <button type="button" onClick={() => removeProduct(p.id)} className="text-ember text-xs font-semibold">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'orders' && (
        <div className="mt-8 space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-ink-mute">
                    {o.customerName} · {o.trackingNumber} · {formatKES(o.total)}
                  </p>
                </div>
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="rounded-xl border border-ink/10 px-3 py-2 text-sm"
                >
                  {[o.status, ...STATUS_OPTIONS.filter((s) => s !== o.status)].map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>
              <ul className="mt-3 text-sm text-ink-mute">
                {o.items.map((i) => (
                  <li key={i.productId}>
                    {i.qty}× {i.name}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'add' && (
        <form onSubmit={addProduct} className="mt-8 max-w-xl space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
          <h2 className="font-display text-xl font-bold">List a product</h2>
          <label className="block text-sm">
            <span className="text-ink-mute">Name</span>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
          </label>
          <label className="block text-sm">
            <span className="text-ink-mute">Description</span>
            <textarea required rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="text-ink-mute">Price (KES)</span>
              <input required type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
            </label>
            <label className="block text-sm">
              <span className="text-ink-mute">Stock</span>
              <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
            </label>
          </div>
          <label className="block text-sm">
            <span className="text-ink-mute">Category</span>
            <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5">
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="w-full rounded-xl bg-ember py-3 text-sm font-semibold text-white hover:bg-ember-deep">
            Publish product
          </button>
        </form>
      )}
    </div>
  );
}
