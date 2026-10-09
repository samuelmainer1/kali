import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Store,
  PackageSearch,
  Search,
  ShoppingBag,
  MessageSquare,
  Users,
  Wallet,
  Clock,
  CheckCircle2,
  X,
  XCircle,
  Mail,
  Phone,
  BarChart3,
  AlertTriangle,
  Image,
  Newspaper,
  Briefcase,
  Pencil,
  Tag,
  Settings,
  Star,
  HelpCircle,
  Trash2,
  EyeOff,
  PlusCircle,
  FolderOpen,
  WalletCards,
  Upload,
  RotateCcw,
  MessagesSquare,
  DatabaseBackup,
  History,
} from 'lucide-react';
import { api, formatKES } from '../lib/api';
import { fileToHeroDataUrl } from '../lib/imageUpload';
import { useAuth } from '../context/AuthContext';
import OrderDocuments, { nextOrderStatuses } from '../components/OrderDocuments';
import OrderTimeline from '../components/OrderTimeline';
import PackingSlip from '../components/PackingSlip';
import ProductEditForm from '../components/ProductEditForm';
import DeliveredOrderCard from '../components/DeliveredOrderCard';
import ChangePasswordForm from '../components/ChangePasswordForm';
import { Link } from 'react-router-dom';
import {
  AdminAddProduct,
  AddVendorForm,
  NewsletterTab,
  CustomersTab,
  CategoriesTab,
  SettingsTab,
  TestimonialsTab,
  FaqsTab,
  PayoutsTab,
  WooCommerceImportTab,
  ReturnsTab,
  QnATab,
  BackupTab,
  AuditTab,
} from '../components/AdminOps';
import BlogEditor from '../components/BlogEditor';
import NewOrdersBadge from '../components/NewOrdersBadge';

const HOME_BLOCK_LABELS = {
  shopByCategory: 'Shop by category',
  featuredFour: 'New on BigDrop',
  flashDeals: 'Flash deals',
  featured: 'Featured products',
  appBanner: 'App download banner',
  bestSellers: 'Best sellers',
  topSelling: 'Top selling items',
  choice: "BigDrop's Choice",
  food: 'Food',
  healthBeauty: 'Health & Beauty',
  tvsElectronics: 'TVs & Electronics',
  household: 'Household',
  phoneTablets: 'Phone & Tablets',
  newsletter: 'Newsletter',
  recentlyViewed: 'Recently viewed',
  promoBanners: 'Extra banners',
  testimonials: 'Testimonials',
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'vendors', label: 'Vendors', icon: Store },
  { id: 'products', label: 'Products', icon: PackageSearch },
  { id: 'reviews', label: 'Reviews', icon: CheckCircle2 },
  { id: 'import', label: 'Woo import', icon: Upload },
  { id: 'customers', label: 'Customers', icon: Users },
  { id: 'categories', label: 'Categories', icon: FolderOpen },
  { id: 'heroes', label: 'Homepage', icon: Image },
  { id: 'coupons', label: 'Coupons', icon: Tag },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'payouts', label: 'Payouts', icon: WalletCards },
  { id: 'newsletter', label: 'Newsletter', icon: Mail },
  { id: 'blog', label: 'Blog', icon: Newspaper },
  { id: 'jobs', label: 'Careers', icon: Briefcase },
  { id: 'testimonials', label: 'Testimonials', icon: Star },
  { id: 'faqs', label: 'Help FAQs', icon: HelpCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'orders', label: 'Orders', icon: ShoppingBag },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'returns', label: 'Returns', icon: RotateCcw },
  { id: 'qna', label: 'Q&A', icon: MessagesSquare },
  { id: 'backup', label: 'Backup', icon: DatabaseBackup },
  { id: 'audit', label: 'Audit log', icon: History },
];

const PRODUCT_STATUS_FILTERS = ['pending', 'approved', 'rejected', 'featured', 'all'];

function downloadOrdersCsv(orders) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const rows = [
    ['Order number', 'Tracking', 'Customer', 'Email', 'Phone', 'Status', 'Total (KES)', 'Placed'],
    ...orders.map((o) => [
      o.orderNumber,
      o.trackingNumber,
      o.customerName,
      o.customerEmail,
      o.customerPhone,
      o.status,
      o.total,
      o.createdAt,
    ]),
  ];
  const csv = `\uFEFF${rows.map((r) => r.map(esc).join(',')).join('\n')}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `bigdrop-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

function StatusBadge({ status }) {
  const styles = {
    pending: 'bg-amber-100 text-amber-700',
    approved: 'bg-leaf-pale text-leaf',
    rejected: 'bg-red-100 text-red-700',
    suspended: 'bg-ink/10 text-ink-mute',
  };
  return (
    <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] || 'bg-mist text-ink-mute'}`}>
      {status}
    </span>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [vendorFilter, setVendorFilter] = useState('pending');
  const [products, setProducts] = useState([]);
  const [productFilter, setProductFilter] = useState('all');
  const [productQuery, setProductQuery] = useState('');
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [stockAlerts, setStockAlerts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [heroes, setHeroes] = useState([]);
  const [promoBanners, setPromoBanners] = useState([]);
  const [posts, setPosts] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [jobForm, setJobForm] = useState({ title: '', location: 'Nairobi', type: 'Full-time', summary: '', description: '' });
  const [homeBlocks, setHomeBlocks] = useState({});
  const [coupons, setCoupons] = useState([]);
  const [couponForm, setCouponForm] = useState({ code: '', type: 'percent', value: '10', label: '' });
  const [report, setReport] = useState(null);
  const [flashEndsAt, setFlashEndsAt] = useState('');
  const [subscribers, setSubscribers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [allVendors, setAllVendors] = useState([]);
  const [siteSettings, setSiteSettings] = useState(null);
  const [featuredSlugs, setFeaturedSlugs] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [payoutData, setPayoutData] = useState({ payouts: [], summary: {}, rate: 0.15 });
  const [returnsList, setReturnsList] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Admin product search. Matches the fields an operator actually has in hand when
  // chasing a listing down — name, brand, SKU, vendor, category, slug and id — not the
  // name alone, so "BD-PHO-002" or "TechHub" find the product too. Whitespace splits the
  // query into words that must *all* match somewhere, so "samsung 55 tv" still finds
  // "Samsung 55\" Smart TV 4K" no matter what order they appear in.
  //
  // Runs over the already-loaded list, so it is instant and needs no request per
  // keystroke. The status chips decide what is loaded — and the default is "all", so a
  // plain search covers the whole catalogue without touching them.
  const visibleProducts = useMemo(() => {
    const terms = productQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (!terms.length) return products;
    return products.filter((p) => {
      const haystack = [p.name, p.brand, p.sku, p.vendorName, p.categoryName, p.categorySlug, p.slug, p.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return terms.every((term) => haystack.includes(term));
    });
  }, [products, productQuery]);

  async function loadOverview() {
    const s = await api.get('/dashboard/stats');
    setStats(s.stats);
  }

  async function loadAnalytics() {
    const a = await api.get('/admin/analytics');
    setAnalytics(a.analytics);
  }

  async function loadStockAlerts() {
    const s = await api.get('/admin/stock-alerts');
    setStockAlerts(s.alerts || []);
  }

  async function loadVendors(status = vendorFilter) {
    const q = status && status !== 'all' ? `?status=${status}` : '';
    const v = await api.get(`/admin/vendors${q}`);
    setVendors(v.vendors);
  }

  async function loadProducts(status = productFilter) {
    if (status === 'all') {
      const results = await Promise.all(
        ['pending', 'approved', 'rejected'].map((s) => api.get(`/products?status=${s}`))
      );
      setProducts(results.flatMap((r) => r.products));
      return;
    }
    if (status === 'featured') {
      const results = await Promise.all(
        ['pending', 'approved', 'rejected'].map((s) => api.get(`/products?status=${s}`))
      );
      const all = results.flatMap((r) => r.products);
      setProducts(all.filter((p) => p.featured));
      return;
    }
    const p = await api.get(`/products?status=${status}`);
    setProducts(p.products);
  }

  async function loadOrders() {
    const o = await api.get('/orders');
    setOrders(o.orders);
  }

  async function loadReturns() {
    const d = await api.get('/admin/returns');
    setReturnsList(d.returns || []);
  }

  async function loadQuestions() {
    const d = await api.get('/admin/questions');
    setQuestions(d.questions || []);
  }

  async function loadAudit() {
    const d = await api.get('/admin/audit');
    setAuditLog(d.audit || []);
  }

  async function loadMessages() {
    const m = await api.get('/admin/messages');
    setMessages(m.messages);
  }

  async function loadNotifications() {
    try {
      const d = await api.get('/admin/notifications');
      setAdminNotifications(d.notifications || []);
    } catch { /* ignore */ }
  }

  async function loadCms() {
    const [site, blog, jobData, cats] = await Promise.all([
      api.get('/site'),
      api.get('/admin/blog'),
      api.get('/admin/jobs'),
      api.get('/admin/categories').catch(() => api.get('/categories')),
    ]);
    setHeroes(site.site?.heroes || []);
    setPromoBanners(site.site?.promoBanners || []);
    setHomeBlocks(site.site?.homeBlocks || {});
    setFlashEndsAt(site.site?.flashEndsAt ? String(site.site.flashEndsAt).slice(0, 16) : '');
    setPosts(blog.posts || []);
    setJobs(jobData.jobs || []);
    setCategories(cats.categories || []);
    setSiteSettings(site.site || null);
    setFeaturedSlugs(site.site?.featuredCategorySlugs || []);
    setTestimonials(site.testimonials || []);
    setFaqs(site.site?.faqs || []);
  }

  async function loadReviews() {
    const d = await api.get('/admin/reviews');
    setPendingReviews(d.reviews || []);
  }

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      await Promise.all([
        loadOverview(),
        loadAnalytics(),
        loadStockAlerts(),
        loadVendors(),
        loadProducts(),
        loadReviews(),
        loadOrders(),
        loadMessages(),
        loadCms(),
        api.get('/admin/coupons').then((d) => setCoupons(d.coupons || [])).catch(() => {}),
        api.get('/admin/reports').then((d) => setReport(d.report)).catch(() => {}),
        api.get('/admin/newsletter').then((d) => setSubscribers(d.subscribers || [])).catch(() => {}),
        api.get('/admin/customers').then((d) => setCustomers(d.customers || [])).catch(() => {}),
        api.get('/admin/vendors').then((d) => setAllVendors(d.vendors || [])).catch(() => {}),
        api.get('/admin/faqs').then((d) => setFaqs(d.faqs || [])).catch(() => {}),
        api.get('/admin/payouts').then((d) => setPayoutData(d)).catch(() => {}),
        api.get('/admin/returns').then((d) => setReturnsList(d.returns || [])).catch(() => {}),
        api.get('/admin/questions').then((d) => setQuestions(d.questions || [])).catch(() => {}),
        api.get('/admin/audit').then((d) => setAuditLog(d.audit || [])).catch(() => {}),
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadVendors(vendorFilter).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorFilter]);

  useEffect(() => {
    loadProducts(productFilter).catch((e) => setError(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productFilter]);

  function flash(msg) {
    setError('');
    setNotice(msg);
    setTimeout(() => setNotice(''), 5000);
  }

  useEffect(() => {
    if (tab !== 'newsletter') return;
    api
      .post('/admin/newsletter/ack')
      .then(() => loadOverview())
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tab !== 'returns') return;
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  async function reviewVendor(id, status) {
    try {
      await api.patch(`/admin/vendors/${id}`, { status });
      flash(`Vendor ${status}`);
      await Promise.all([loadVendors(), loadOverview()]);
    } catch (e) {
      setError(e.message);
    }
  }

  async function reviewProduct(id, status) {
    try {
      await api.patch(`/products/${id}/review`, { status });
      flash(`Product ${status}`);
      await Promise.all([loadProducts(), loadOverview()]);
    } catch (e) {
      setError(e.message);
    }
  }

  async function toggleFeaturedProduct(p) {
    try {
      const next = !p.featured;
      await api.patch(`/products/${p.id}`, { featured: next });
      flash(next ? 'Product marked as featured' : 'Product removed from featured');
      await loadProducts();
    } catch (e) {
      setError(e.message);
    }
  }

  async function hideProduct(p) {
    try {
      await api.patch(`/products/${p.id}/stock-action`, { action: p.hidden ? 'unhide' : 'hide' });
      flash(p.hidden ? 'Product published on shop' : 'Product unpublished');
      await loadProducts();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Delete this product permanently?')) return;
    try {
      await api.delete(`/products/${id}`);
      flash('Product deleted');
      await Promise.all([loadProducts(), loadOverview()]);
    } catch (e) {
      setError(e.message);
    }
  }

  async function markMessage(id, read) {
    try {
      await api.patch(`/admin/messages/${id}`, { read });
      await loadMessages();
      await loadOverview();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteMessage(id) {
    if (!window.confirm('Delete this message?')) return;
    try {
      await api.delete(`/admin/messages/${id}`);
      flash('Message deleted');
      await loadMessages();
      await loadOverview();
    } catch (e) {
      setError(e.message);
    }
  }

  async function updateOrderStatus(id, status) {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      flash('Order updated');
      await Promise.all([loadOrders(), loadOverview()]);
    } catch (e) {
      setError(e.message);
    }
  }

  async function markNotificationsRead(ids) {
    try {
      await api.patch('/admin/notifications/read', { ids });
      await loadNotifications();
      await loadOverview();
    } catch { /* ignore */ }
  }

  async function notifyLowStock() {
    try {
      const res = await api.post('/admin/stock-alerts/notify', {});
      flash(`Low-stock emails sent to vendors (${res.sent})`);
      await loadStockAlerts();
    } catch (e) {
      setError(e.message);
    }
  }

  async function saveHeroes(e) {
    e.preventDefault();
    try {
      const res = await api.patch('/admin/site', { heroes });
      setHeroes(res.site.heroes);
      flash('Homepage banners saved');
    } catch (err) {
      setError(err.message);
    }
  }

  function updateHero(i, field, value) {
    setHeroes((list) => list.map((h, idx) => (idx === i ? { ...h, [field]: value } : h)));
  }

  function removeHero(i) {
    if (!window.confirm('Remove this homepage slide? It is deleted from the site when you save banners.')) return;
    setHeroes((list) => list.filter((_, idx) => idx !== i));
  }

  async function onHeroFile(i, file) {
    if (!file) return;
    try {
      const data = await fileToHeroDataUrl(file);
      updateHero(i, 'image', data);
    } catch (err) {
      setError(err.message);
    }
  }

  function updatePromo(i, field, value) {
    setPromoBanners((list) => list.map((h, idx) => (idx === i ? { ...h, [field]: value } : h)));
  }

  async function onPromoFile(i, file) {
    if (!file) return;
    try {
      const data = await fileToHeroDataUrl(file);
      updatePromo(i, 'image', data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function savePromoBanners(e) {
    e.preventDefault();
    try {
      const res = await api.patch('/admin/site', { promoBanners });
      setPromoBanners(res.site.promoBanners || []);
      flash('Extra homepage banners saved');
    } catch (err) {
      setError(err.message);
    }
  }

  async function createJob(e) {
    e.preventDefault();
    try {
      await api.post('/admin/jobs', jobForm);
      setJobForm({ title: '', location: 'Nairobi', type: 'Full-time', summary: '', description: '' });
      const j = await api.get('/admin/jobs');
      setJobs(j.jobs || []);
      flash('Job posted');
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeJob(id) {
    if (!confirm('Remove this opening?')) return;
    try {
      await api.delete(`/admin/jobs/${id}`);
      setJobs((list) => list.filter((j) => j.id !== id));
      flash('Job removed');
    } catch (err) {
      setError(err.message);
    }
  }

  const cards = useMemo(
    () => [
      { label: 'Pending vendors', value: stats?.vendorsPending ?? '—', icon: Store, accent: 'text-amber-600 bg-amber-100' },
      { label: 'Pending products', value: stats?.productsPending ?? '—', icon: PackageSearch, accent: 'text-amber-600 bg-amber-100' },
      { label: 'Revenue', value: stats ? formatKES(stats.revenue) : '—', icon: Wallet, accent: 'text-leaf bg-leaf-pale' },
      { label: 'Orders', value: stats?.orders ?? '—', icon: ShoppingBag, accent: 'text-ink bg-mist' },
    ],
    [stats]
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold">Dashboard</h1>
          <p className="mt-1 text-sm text-ink-mute">Signed in as {user?.name} · BigDrop operations</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition ${
              tab === t.id ? 'bg-ink text-white border-ink' : 'bg-white border-ink/10 hover:border-ink/20'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.id === 'vendors' && stats?.vendorsPending > 0 && (
              <span className="ml-1 rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
                {stats.vendorsPending}
              </span>
            )}
            {t.id === 'products' && stats?.productsPending > 0 && (
              <span className="ml-1 rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
                {stats.productsPending}
              </span>
            )}
            {t.id === 'reviews' && (stats?.reviewsPending > 0 || pendingReviews.length > 0) && (
              <span className="ml-1 rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
                {stats?.reviewsPending || pendingReviews.length}
              </span>
            )}
            {t.id === 'orders' && stats?.newOrders > 0 && (
              <span className="ml-1 rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
                {stats.newOrders}
              </span>
            )}
            {t.id === 'messages' && stats?.messages > 0 && (
              <span className="ml-1 rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
                {stats.messages}
              </span>
            )}
            {t.id === 'newsletter' && stats?.newsletterNew > 0 && (
              <span className="ml-1 rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
                {stats.newsletterNew}
              </span>
            )}
            {t.id === 'returns' && stats?.returnsPending > 0 && (
              <span className="ml-1 rounded-full bg-ember px-1.5 text-[10px] font-bold text-white">
                {stats.returnsPending}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="fixed top-4 right-4 z-[80] space-y-2 max-w-sm">
        {notice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-leaf text-white px-4 py-3 shadow-lg"
            role="status"
          >
            <p className="text-sm font-bold">Saved</p>
            <p className="text-sm text-white/90">{notice}</p>
          </motion.div>
        )}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-600 text-white px-4 py-3 shadow-lg"
            role="alert"
          >
            <p className="text-sm font-bold">Not saved</p>
            <p className="text-sm text-white/90">{error}</p>
            <button type="button" onClick={() => setError('')} className="mt-1 text-xs font-semibold underline">
              Dismiss
            </button>
          </motion.div>
        )}
      </div>

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

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                  <p className="text-sm text-ink-mute">Vendors</p>
                  <p className="mt-1 font-display text-2xl font-bold">{stats?.vendors ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                  <p className="text-sm text-ink-mute">Customers</p>
                  <p className="mt-1 font-display text-2xl font-bold">{stats?.customers ?? 0}</p>
                </div>
                <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                  <p className="text-sm text-ink-mute">Live products</p>
                  <p className="mt-1 font-display text-2xl font-bold">{stats?.productsLive ?? 0}</p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <p className="font-semibold text-sm">Low stock alerts ({stockAlerts.length})</p>
                  </div>
                  <button
                    type="button"
                    onClick={notifyLowStock}
                    className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Email vendors now
                  </button>
                </div>
                <ul className="mt-3 space-y-2 max-h-48 overflow-auto">
                  {stockAlerts.slice(0, 8).map((a) => (
                    <li key={a.productId} className="text-sm text-amber-900 flex justify-between gap-3">
                      <span>
                        {a.name} · <span className="text-amber-700">{a.vendorName}</span>
                      </span>
                      <strong>{a.stock} left</strong>
                    </li>
                  ))}
                  {stockAlerts.length === 0 && (
                    <li className="text-sm text-amber-800/70">All approved products are above threshold.</li>
                  )}
                </ul>
              </div>

              <div className="rounded-2xl border border-ember/20 bg-ember-pale/40 p-5">
                <div className="flex items-center gap-2 text-ember-deep">
                  <Clock className="h-4 w-4" />
                  <p className="font-semibold text-sm">Fulfillment in progress</p>
                </div>
                <p className="mt-1 font-display text-3xl font-bold">{stats?.pending ?? 0}</p>
                <p className="text-sm text-ink-mute">Orders awaiting delivery completion</p>
              </div>
            </div>
          )}

          {tab === 'analytics' && (
            <div className="mt-8 space-y-6">
              {!analytics ? (
                <p className="text-sm text-ink-mute">Loading analytics…</p>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                      <p className="text-sm text-ink-mute">Gross Merchandise Value</p>
                      <p className="mt-1 font-display text-2xl font-bold">{formatKES(analytics.gmv)}</p>
                    </div>
                    <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                      <p className="text-sm text-ink-mute">Orders</p>
                      <p className="mt-1 font-display text-2xl font-bold">{analytics.orderCount}</p>
                    </div>
                    <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                      <p className="text-sm text-ink-mute">Site conversion</p>
                      <p className="mt-1 font-display text-2xl font-bold">{analytics.conversionRate}%</p>
                      <p className="text-xs text-ink-mute">{analytics.visits.toLocaleString()} visits</p>
                    </div>
                    <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                      <p className="text-sm text-ink-mute">Checkout conversion</p>
                      <p className="mt-1 font-display text-2xl font-bold">{analytics.checkoutConversion}%</p>
                      <p className="text-xs text-ink-mute">{analytics.checkoutsStarted} checkouts started</p>
                    </div>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                      <h3 className="font-display text-lg font-bold">Sales by category</h3>
                      <ul className="mt-4 space-y-3">
                        {analytics.salesByCategory.map((c) => {
                          const max = analytics.salesByCategory[0]?.revenue || 1;
                          return (
                            <li key={c.name}>
                              <div className="flex justify-between text-sm mb-1">
                                <span>{c.name}</span>
                                <strong>{formatKES(c.revenue)}</strong>
                              </div>
                              <div className="h-2 rounded-full bg-mist overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-ember"
                                  style={{ width: `${Math.max(8, (c.revenue / max) * 100)}%` }}
                                />
                              </div>
                            </li>
                          );
                        })}
                        {analytics.salesByCategory.length === 0 && (
                          <li className="text-sm text-ink-mute">No paid sales yet.</li>
                        )}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                      <h3 className="font-display text-lg font-bold">Top vendors</h3>
                      <ul className="mt-4 space-y-3">
                        {analytics.topVendors.map((v, i) => (
                          <li key={v.vendorId} className="flex items-center justify-between gap-3 text-sm">
                            <span>
                              <span className="text-ink-mute mr-2">{i + 1}.</span>
                              {v.name}
                              <span className="block text-xs text-ink-mute">
                                {v.orders} orders · {v.units} units
                              </span>
                            </span>
                            <strong>{formatKES(v.revenue)}</strong>
                          </li>
                        ))}
                        {analytics.topVendors.length === 0 && (
                          <li className="text-sm text-ink-mute">No vendor sales yet.</li>
                        )}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                    <h3 className="font-display text-lg font-bold">COD vs M-Pesa vs Card</h3>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {[
                        { key: 'mpesa', label: 'M-Pesa', color: 'bg-leaf' },
                        { key: 'cod', label: 'Cash on delivery', color: 'bg-ember' },
                        { key: 'card', label: 'Card', color: 'bg-ink' },
                      ].map((p) => {
                        const share = analytics.paymentShare[p.key] || { count: 0, pct: 0 };
                        return (
                          <div key={p.key} className="rounded-xl border border-ink/10 p-4">
                            <p className="text-sm text-ink-mute">{p.label}</p>
                            <p className="mt-1 font-display text-2xl font-bold">{share.pct}%</p>
                            <p className="text-xs text-ink-mute">{share.count} orders</p>
                            <div className="mt-3 h-2 rounded-full bg-mist overflow-hidden">
                              <div className={`h-full rounded-full ${p.color}`} style={{ width: `${share.pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'vendors' && (
            <div className="mt-8">
              <AddVendorForm
                onSaved={(vendor) => {
                  flash(`Vendor "${vendor.storeName || vendor.name}" created`);
                  Promise.all([loadVendors(), loadOverview()]);
                }}
                onError={setError}
              />
              <div className="flex flex-wrap gap-2">
                {['pending', 'approved', 'rejected', 'suspended', 'all'].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setVendorFilter(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize border ${
                      vendorFilter === s ? 'bg-ink text-white border-ink' : 'bg-white border-ink/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-lift">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-ink/10 text-ink-mute">
                    <tr>
                      <th className="p-4">Store</th>
                      <th className="p-4">Contact</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((v) => (
                      <tr key={v.id} className="border-b border-ink/5 last:border-0">
                        <td className="p-4">
                          <p className="font-medium">{v.storeName || v.name}</p>
                          <p className="text-xs text-ink-mute">{v.name}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-xs inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {v.email}</p>
                          <p className="text-xs inline-flex items-center gap-1 mt-1"><Phone className="h-3 w-3" /> {v.phone || '—'}</p>
                        </td>
                        <td className="p-4">
                          <StatusBadge status={v.status} />
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {v.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => reviewVendor(v.id, 'approved')}
                                className="inline-flex items-center gap-1 rounded-lg bg-leaf px-3 py-1.5 text-xs font-semibold text-white hover:bg-leaf/90"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                              </button>
                            )}
                            {v.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => reviewVendor(v.id, 'rejected')}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {vendors.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-sm text-ink-mute">
                          No vendors in this view.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'reviews' && (
            <div className="mt-8 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
              <h2 className="font-display text-xl font-bold">Pending reviews</h2>
              <p className="mt-1 text-sm text-ink-mute">Approve a review before it shows on the product page.</p>
              {pendingReviews.length === 0 ? (
                <p className="mt-6 text-sm text-ink-mute">No reviews waiting.</p>
              ) : (
                <ul className="mt-6 space-y-4">
                  {pendingReviews.map((r) => (
                    <li key={r.id} className="rounded-xl border border-ink/10 p-4">
                      <p className="text-xs text-ink-mute">
                        {r.productName} · {r.author} · {r.rating}★ · {r.date}
                      </p>
                      {r.title ? <p className="mt-1 font-semibold text-sm">{r.title}</p> : null}
                      <p className="mt-1 text-sm text-gray-700">{r.comment}</p>
                      {r.image ? <img src={r.image} alt="" className="mt-2 h-16 rounded object-cover" /> : null}
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg bg-[#015837] px-3 py-1.5 text-xs font-semibold text-white"
                          onClick={async () => {
                            try {
                              await api.patch(`/admin/reviews/${r.productId}/${r.id}`, { status: 'approved' });
                              flash('Review approved');
                              await Promise.all([loadReviews(), loadOverview()]);
                            } catch (err) {
                              setError(err.message);
                            }
                          }}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold"
                          onClick={async () => {
                            try {
                              await api.patch(`/admin/reviews/${r.productId}/${r.id}`, { status: 'rejected' });
                              flash('Review rejected');
                              await Promise.all([loadReviews(), loadOverview()]);
                            } catch (err) {
                              setError(err.message);
                            }
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === 'products' && (
            <div className="mt-8">
              <div className="max-w-md">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
                  <input
                    type="search"
                    value={productQuery}
                    onChange={(e) => setProductQuery(e.target.value)}
                    placeholder="Search products by name, brand, SKU or vendor…"
                    aria-label="Search products"
                    className="w-full rounded-xl border border-ink/10 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-ink/30 [&::-webkit-search-cancel-button]:hidden"
                  />
                  {productQuery && (
                    <button
                      type="button"
                      onClick={() => setProductQuery('')}
                      aria-label="Clear product search"
                      title="Clear search"
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-ink-mute hover:bg-mist hover:text-ink"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {productQuery.trim() && (
                  <p className="mt-2 text-xs text-ink-mute">
                    {visibleProducts.length} of {products.length} {products.length === 1 ? 'product' : 'products'} match
                    {productFilter !== 'all' && ` in “${productFilter}”`}
                  </p>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {PRODUCT_STATUS_FILTERS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setProductFilter(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize border ${
                      productFilter === s ? 'bg-ink text-white border-ink' : 'bg-white border-ink/10'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setShowAddProduct((v) => !v)}
                  className="ml-auto inline-flex items-center gap-1 rounded-lg bg-ember px-3 py-1.5 text-xs font-semibold text-white"
                >
                  <PlusCircle className="h-3.5 w-3.5" /> Add product
                </button>
              </div>

              {showAddProduct && (
                <AdminAddProduct
                  categories={categories}
                  vendors={allVendors.filter((v) => v.status === 'approved')}
                  onSaved={() => {
                    flash('Product published');
                    setShowAddProduct(false);
                    loadProducts();
                    loadOverview();
                  }}
                  onError={setError}
                />
              )}

              <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-lift">
                <table className="w-full text-sm text-left">
                  <thead className="border-b border-ink/10 text-ink-mute">
                    <tr>
                      <th className="p-4">Product</th>
                      <th className="p-4">Vendor</th>
                      <th className="p-4">Price</th>
                      <th className="p-4">Stock</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleProducts.map((p) => (
                      <tr key={p.id} className="border-b border-ink/5 last:border-0">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={p.images?.[0]} alt="" className="h-10 w-10 rounded-lg object-cover" />
                            <div className="min-w-0">
                              <span className="font-medium max-w-[220px] truncate block">{p.name}</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                {p.featured && (
                                  <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800">
                                    <Star className="h-2.5 w-2.5 fill-current" /> Featured
                                  </span>
                                )}
                                {p.hidden && <span className="text-[10px] uppercase text-ink-mute">Unpublished</span>}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-xs text-ink-mute">{p.vendorName}</td>
                        <td className="p-4">{formatKES(p.price)}</td>
                        <td className="p-4">{p.stock}</td>
                        <td className="p-4">
                          <StatusBadge status={p.status} />
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => toggleFeaturedProduct(p)}
                              title={p.featured ? 'Remove from Featured' : 'Mark as Featured'}
                              className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                                p.featured
                                  ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                  : 'border-ink/10 hover:bg-mist text-ink-mute hover:text-ink'
                              }`}
                            >
                              <Star className={`h-3.5 w-3.5 ${p.featured ? 'fill-amber-500 text-amber-500' : ''}`} />
                              {p.featured ? 'Featured' : 'Feature'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingProduct(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold hover:bg-mist"
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </button>
                            {p.status !== 'approved' && (
                              <button
                                type="button"
                                onClick={() => reviewProduct(p.id, 'approved')}
                                className="inline-flex items-center gap-1 rounded-lg bg-leaf px-3 py-1.5 text-xs font-semibold text-white hover:bg-leaf/90"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                              </button>
                            )}
                            {p.status !== 'rejected' && (
                              <button
                                type="button"
                                onClick={() => reviewProduct(p.id, 'rejected')}
                                className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => hideProduct(p)}
                              className="inline-flex items-center gap-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold hover:bg-mist"
                            >
                              <EyeOff className="h-3.5 w-3.5" /> {p.hidden ? 'Publish' : 'Unpublish'}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(p.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {visibleProducts.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-sm text-ink-mute">
                          {products.length > 0 ? (
                            <>
                              No product matches “{productQuery.trim()}”
                              {productFilter !== 'all' && ` in “${productFilter}”`}.{' '}
                              <button
                                type="button"
                                onClick={() => setProductQuery('')}
                                className="font-semibold text-ember underline underline-offset-2"
                              >
                                Clear the search
                              </button>
                              .
                            </>
                          ) : (
                            'No products in this view.'
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'import' && (
            <WooCommerceImportTab
              flash={flash}
              onError={setError}
              onDone={() => {
                loadProducts();
                loadOverview();
              }}
            />
          )}

          {tab === 'heroes' && (
            <form onSubmit={saveHeroes} className="mt-8 space-y-4">
              <p className="text-sm text-ink-mute">
                These slides appear on the homepage hero. Leave title and subtitle blank to show the image only — we will not fill in “Slide 1”. Uploads stay at the original pixels and are capped at 2MB. Files over 20MB are refused. Replacing a banner deletes the old file.
              </p>
              {heroes.map((h, i) => (
                <div key={h.id || i} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="text-ink-mute">Title</span>
                    <input value={h.title} onChange={(e) => updateHero(i, 'title', e.target.value)} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2" />
                  </label>
                  <label className="text-sm">
                    <span className="text-ink-mute">Button text</span>
                    <input value={h.cta} onChange={(e) => updateHero(i, 'cta', e.target.value)} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2" />
                  </label>
                  <label className="text-sm md:col-span-2">
                    <span className="text-ink-mute">Subtitle</span>
                    <input value={h.text} onChange={(e) => updateHero(i, 'text', e.target.value)} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2" />
                  </label>
                  <label className="text-sm">
                    <span className="text-ink-mute">Link</span>
                    <input value={h.href} onChange={(e) => updateHero(i, 'href', e.target.value)} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2" />
                  </label>
                  <label className="text-sm">
                    <span className="text-ink-mute">Gradient (used when there is no image)</span>
                    <input
                      value={h.gradient || ''}
                      onChange={(e) => updateHero(i, 'gradient', e.target.value)}
                      placeholder="linear-gradient(to right, #f97316, #fbbf24)"
                      className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="text-ink-mute">Banner image</span>
                    <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => onHeroFile(i, e.target.files?.[0])} />
                    <input
                      value={h.image?.startsWith('data:') ? '' : h.image || ''}
                      onChange={(e) => updateHero(i, 'image', e.target.value)}
                      placeholder="or image URL"
                      className="mt-2 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="text-sm md:col-span-2 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={h.fullBleed === true}
                      onChange={(e) => updateHero(i, 'fullBleed', e.target.checked)}
                    />
                    <span className="text-ink-mute">Full banner artwork — hide title overlay (the image already has the text)</span>
                  </label>
                  {h.image && <img src={h.image} alt="" className="md:col-span-2 h-28 w-full rounded-xl object-cover" />}
                  <div className="md:col-span-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeHero(i)}
                      className="text-xs font-semibold text-red-600"
                    >
                      Remove slide
                    </button>
                  </div>
                </div>
              ))}
              <button type="submit" className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white">
                Save homepage banners
              </button>
            </form>
          )}

          {tab === 'heroes' && (
            <form onSubmit={savePromoBanners} className="mt-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold">Extra homepage banners</h2>
                  <p className="text-sm text-ink-mute">These sit under the hero carousel. Leave empty to hide the row.</p>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold"
                  onClick={() =>
                    setPromoBanners((list) => [
                      ...list,
                      { id: '', title: '', text: '', href: '/shop', cta: 'Shop Now', image: '' },
                    ])
                  }
                >
                  Add banner
                </button>
              </div>
              {promoBanners.map((h, i) => (
                <div key={h.id || i} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift grid gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="text-ink-mute">Title</span>
                    <input value={h.title} onChange={(e) => updatePromo(i, 'title', e.target.value)} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2" />
                  </label>
                  <label className="text-sm">
                    <span className="text-ink-mute">Button text</span>
                    <input value={h.cta || ''} onChange={(e) => updatePromo(i, 'cta', e.target.value)} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2" />
                  </label>
                  <label className="text-sm md:col-span-2">
                    <span className="text-ink-mute">Subtitle</span>
                    <input value={h.text || ''} onChange={(e) => updatePromo(i, 'text', e.target.value)} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2" />
                  </label>
                  <label className="text-sm">
                    <span className="text-ink-mute">Link</span>
                    <input value={h.href || ''} onChange={(e) => updatePromo(i, 'href', e.target.value)} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2" />
                  </label>
                  <label className="text-sm">
                    <span className="text-ink-mute">Banner image</span>
                    <input type="file" accept="image/*" className="mt-1 block w-full text-sm" onChange={(e) => onPromoFile(i, e.target.files?.[0])} />
                  </label>
                  {h.image ? <img src={h.image} alt="" className="md:col-span-2 h-28 w-full rounded-xl object-cover" /> : null}
                  <button
                    type="button"
                    className="text-xs font-semibold text-red-600"
                    onClick={() => setPromoBanners((list) => list.filter((_, idx) => idx !== i))}
                  >
                    Remove banner
                  </button>
                </div>
              ))}
              <button type="submit" className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white">
                Save extra banners
              </button>
            </form>
          )}

          {tab === 'heroes' && (
            <div className="mt-6 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift space-y-4">
              <h2 className="font-display text-xl font-bold">Homepage sections</h2>
              <p className="text-sm text-ink-mute">Turn blocks on or off. Flash countdown uses the end time below.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {Object.keys(homeBlocks).map((key) => (
                  <label key={key} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={homeBlocks[key] !== false}
                      onChange={(e) => setHomeBlocks((b) => ({ ...b, [key]: e.target.checked }))}
                    />
                    {HOME_BLOCK_LABELS[key] || key}
                  </label>
                ))}
              </div>
              <label className="block text-sm">
                <span className="text-ink-mute">Flash sale ends</span>
                <input
                  type="datetime-local"
                  value={flashEndsAt}
                  onChange={(e) => setFlashEndsAt(e.target.value)}
                  className="mt-1 rounded-xl border border-ink/10 px-3 py-2"
                />
              </label>
              <button
                type="button"
                className="rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white"
                onClick={async () => {
                  try {
                    await api.patch('/admin/site/settings', {
                      homeBlocks,
                      flashEndsAt: flashEndsAt ? new Date(flashEndsAt).toISOString() : null,
                    });
                    flash('Homepage sections saved');
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                Save sections
              </button>
            </div>
          )}

          {tab === 'coupons' && (
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <form
                className="space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await api.post('/admin/coupons', {
                      code: couponForm.code,
                      type: couponForm.type,
                      value: Number(couponForm.value),
                      label: couponForm.label || couponForm.code,
                    });
                    const d = await api.get('/admin/coupons');
                    setCoupons(d.coupons || []);
                    flash('Coupon added');
                  } catch (err) {
                    setError(err.message);
                  }
                }}
              >
                <h2 className="font-display text-xl font-bold">New coupon</h2>
                <input required placeholder="CODE" value={couponForm.code} onChange={(e) => setCouponForm((f) => ({ ...f, code: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                <select value={couponForm.type} onChange={(e) => setCouponForm((f) => ({ ...f, type: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5">
                  <option value="percent">Percent off</option>
                  <option value="flat">Flat KSh off</option>
                  <option value="freeship">Free delivery</option>
                </select>
                <input type="number" value={couponForm.value} onChange={(e) => setCouponForm((f) => ({ ...f, value: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                <input placeholder="Label" value={couponForm.label} onChange={(e) => setCouponForm((f) => ({ ...f, label: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                <button type="submit" className="w-full rounded-xl bg-ember py-2.5 text-sm font-semibold text-white">
                  Add coupon
                </button>
              </form>
              <ul className="space-y-2">
                {coupons.map((c) => (
                  <li key={c.code} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-lift flex justify-between gap-3">
                    <div>
                      <p className="font-semibold">{c.code}</p>
                      <p className="text-xs text-ink-mute">{c.label} · {c.type} {c.value}</p>
                    </div>
                    <button
                      type="button"
                      className="text-xs font-semibold text-red-600"
                      onClick={async () => {
                        if (!window.confirm(`Delete coupon ${c.code}? This cannot be undone.`)) return;
                        await api.delete(`/admin/coupons/${c.code}`);
                        setCoupons((list) => list.filter((x) => x.code !== c.code));
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'reports' && (
            <div className="mt-8 space-y-6">
              {!report ? (
                <p className="text-sm text-ink-mute">Loading reports…</p>
              ) : (
                <>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                      <p className="text-sm text-ink-mute">Orders</p>
                      <p className="font-display text-2xl font-bold">{report.orderCount}</p>
                    </div>
                    <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                      <p className="text-sm text-ink-mute">Gross Merchandise Value</p>
                      <p className="font-display text-2xl font-bold">{formatKES(report.gmv)}</p>
                    </div>
                  </div>
                  {[
                    ['Sales by category', report.salesByCategory],
                    ['Sales by vendor', report.salesByVendor],
                    ['Sales by county', report.salesByCounty],
                  ].map(([title, rows]) => (
                    <div key={title} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                      <h3 className="font-display text-lg font-bold">{title}</h3>
                      <ul className="mt-3 space-y-2">
                        {(rows || []).map((r) => (
                          <li key={r.name} className="flex justify-between text-sm">
                            <span>{r.name}</span>
                            <strong>{formatKES(r.revenue)}</strong>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}

          {tab === 'blog' && (
            <BlogEditor
              posts={posts}
              flash={flash}
              onError={setError}
              onChanged={async () => {
                const b = await api.get('/admin/blog');
                setPosts(b.posts || []);
              }}
            />
          )}

          {tab === 'jobs' && (
            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <form onSubmit={createJob} className="space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
                <h2 className="font-display text-xl font-bold">Post a job</h2>
                <input required placeholder="Role title" value={jobForm.title} onChange={(e) => setJobForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Location" value={jobForm.location} onChange={(e) => setJobForm((f) => ({ ...f, location: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                  <input placeholder="Type" value={jobForm.type} onChange={(e) => setJobForm((f) => ({ ...f, type: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                </div>
                <textarea required rows={4} placeholder="Summary" value={jobForm.summary} onChange={(e) => setJobForm((f) => ({ ...f, summary: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                <textarea rows={6} placeholder="Full job description (shown after Read more)" value={jobForm.description} onChange={(e) => setJobForm((f) => ({ ...f, description: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                <button type="submit" className="w-full rounded-xl bg-ember py-2.5 text-sm font-semibold text-white">
                  Post opening
                </button>
              </form>
              <div className="space-y-3">
                {jobs.map((j) => (
                  <div key={j.id} className="rounded-2xl border border-ink/5 bg-white p-4 shadow-lift">
                    <p className="font-semibold">{j.title}</p>
                    <p className="text-xs text-ink-mute">{j.location} · {j.type}</p>
                    <p className="mt-2 text-sm text-ink-mute">{j.summary}</p>
                    <button type="button" onClick={() => removeJob(j.id)} className="mt-2 text-xs font-semibold text-red-600">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'orders' && (
            <div className="mt-8 space-y-8">
              <NewOrdersBadge orders={orders} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-ink-mute">
                  Tracking advances one step at a time. You cannot skip ahead or go back.
                </p>
                <button
                  type="button"
                  onClick={() => downloadOrdersCsv(orders)}
                  disabled={!orders.length}
                  className="rounded-xl border border-ink/10 px-3 py-1.5 text-xs font-semibold hover:bg-mist disabled:opacity-50"
                >
                  Download orders CSV
                </button>
              </div>
              {(() => {
                const active = orders.filter((o) => o.status !== 'delivered');
                const delivered = orders.filter((o) => o.status === 'delivered');
                return (
                  <>
                    {active.length > 0 && (
                      <section className="space-y-4">
                        <h2 className="font-display text-2xl font-bold">Orders in progress</h2>
                        {active.map((o) => {
                          const next = nextOrderStatuses(o.status);
                          return (
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
                                {o.items.map((i) => (
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
                              {next.length > 0 ? (
                                <label className="mt-3 block text-xs text-ink-mute">
                                  Advance status (forward only)
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (e.target.value) updateOrderStatus(o.id, e.target.value);
                                    }}
                                    className="mt-1 w-full max-w-xs rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink"
                                  >
                                    <option value="">Select next step…</option>
                                    {next.map((s) => (
                                      <option key={s} value={s}>
                                        → {s.replace(/_/g, ' ')}
                                      </option>
                                    ))}
                                  </select>
                                </label>
                              ) : (
                                <p className="mt-3 text-xs text-ink-mute">Tracking complete — no further changes.</p>
                              )}
                            </div>
                          );
                        })}
                      </section>
                    )}
                    {delivered.length > 0 && (
                      <section>
                        <h2 className="font-display text-2xl font-bold">Delivered orders</h2>
                        <p className="mt-1 text-sm text-ink-mute">Invoices, receipts and packing slips.</p>
                        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {delivered.map((o) => (
                            <DeliveredOrderCard key={o.id} o={o} subtitle={o.customerName}>
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

          {tab === 'messages' && (
            <div className="mt-8 space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={`rounded-2xl border bg-white p-5 shadow-lift ${m.read ? 'border-ink/5' : 'border-ember/30'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">
                        {m.subject} {!m.read && <span className="ml-2 text-[10px] uppercase text-ember">New</span>}
                      </p>
                      <p className="text-xs text-ink-mute">
                        {m.name} · <a className="text-leaf" href={`mailto:${m.email}`}>{m.email}</a> {m.phone && `· ${m.phone}`}
                      </p>
                    </div>
                    <span className="text-xs text-ink-mute">
                      {new Date(m.createdAt).toLocaleString('en-KE')}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-ink-soft leading-relaxed">{m.message}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: ' + (m.subject || 'BigDrop'))}`} className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold">
                      Reply by email
                    </a>
                    <button type="button" onClick={() => markMessage(m.id, !m.read)} className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold">
                      {m.read ? 'Mark unread' : 'Mark read'}
                    </button>
                    <button type="button" onClick={() => deleteMessage(m.id)} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600">
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-2xl border border-ink/5 bg-white p-10 text-center shadow-lift">
                  <Users className="h-8 w-8 text-ink-mute" />
                  <p className="text-sm text-ink-mute">No contact messages yet.</p>
                </div>
              )}
            </div>
          )}

          {tab === 'newsletter' && <NewsletterTab subscribers={subscribers} flash={flash} onError={setError} />}
          {tab === 'customers' && (
            <CustomersTab
              customers={customers}
              onChanged={() => api.get('/admin/customers').then((d) => setCustomers(d.customers || []))}
              onError={setError}
            />
          )}
          {tab === 'categories' && (
            <CategoriesTab
              categories={categories}
              featuredSlugs={featuredSlugs}
              flash={flash}
              onChanged={loadCms}
              onError={setError}
            />
          )}
          {tab === 'returns' && (
            <ReturnsTab
              returns={returnsList}
              notifications={adminNotifications}
              markRead={markNotificationsRead}
              onChanged={() => {
                loadReturns();
                loadOverview();
              }}
              onError={(e) => setError(e.message)}
              flash={flash}
            />
          )}

          {tab === 'qna' && (
            <QnATab
              questions={questions}
              onChanged={loadQuestions}
              onError={(e) => setError(e.message)}
              flash={flash}
            />
          )}

          {tab === 'backup' && (
            <BackupTab flash={flash} onError={(e) => setError(e.message)} onChanged={loadOverview} />
          )}

          {tab === 'audit' && <AuditTab audit={auditLog} />}

          {tab === 'settings' && (
            <div>
              <SettingsTab
                site={siteSettings || {}}
                flash={flash}
                onSaved={loadCms}
                onError={setError}
              />
              <div className="mt-8">
                <ChangePasswordForm />
              </div>
            </div>
          )}
          {tab === 'testimonials' && (
            <TestimonialsTab
              testimonials={testimonials}
              flash={flash}
              onChanged={loadCms}
              onError={setError}
            />
          )}
          {tab === 'faqs' && (
            <FaqsTab faqs={faqs} flash={flash} onChanged={() => api.get('/admin/faqs').then((d) => setFaqs(d.faqs || []))} onError={setError} />
          )}
          {tab === 'payouts' && (
            <PayoutsTab
              payouts={payoutData.payouts}
              summary={payoutData.summary}
              rate={payoutData.rate}
              flash={flash}
              onChanged={() => api.get('/admin/payouts').then(setPayoutData)}
              onError={setError}
            />
          )}
        </>
      )}

      {editingProduct && (
        <ProductEditForm
          product={editingProduct}
          categories={categories}
          vendors={allVendors}
          onClose={() => setEditingProduct(null)}
          onSaved={() => {
            setEditingProduct(null);
            flash('Product updated');
            loadProducts();
            loadOverview();
          }}
        />
      )}
    </div>
  );
}
