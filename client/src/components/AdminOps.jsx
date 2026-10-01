import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { api, formatKES } from '../lib/api';
import ProductImagesField from './ProductImagesField';
import { fileToHeroDataUrl, fileToSquareDataUrl, fileToReviewDataUrl } from '../lib/imageUpload';

export function AdminAddProduct({ categories, vendors, onSaved, onError }) {
  const [form, setForm] = useState({
    name: '',
    description: '',
    specifications: '',
    variants: '',
    price: '',
    compareAt: '',
    stock: '10',
    categoryId: categories[0]?.id || '',
    vendorId: vendors[0]?.id || '',
    sku: '',
    images: [],
    featured: false,
  });
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/products', {
        name: form.name,
        description: form.description,
        specifications: form.specifications,
        variants: form.variants,
        price: Number(form.price),
        compareAt: form.compareAt ? Number(form.compareAt) : null,
        stock: Number(form.stock),
        categoryId: form.categoryId,
        vendorId: form.vendorId || undefined,
        sku: form.sku || undefined,
        images: (form.images || []).slice(0, 3),
        featured: Boolean(form.featured),
      });
      setForm((f) => ({ ...f, name: '', description: '', specifications: '', variants: '', price: '', compareAt: '', sku: '', images: [], featured: false }));
      onSaved();
    } catch (err) {
      onError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
      <h2 className="font-display text-xl font-bold">Add product</h2>
      <p className="text-xs text-ink-mute">Goes live immediately. Assign it to a vendor store.</p>
      <label className="block text-sm">
        <span className="text-ink-mute">Name</span>
        <input required value={form.name} onChange={set('name')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
      </label>
      <label className="block text-sm">
        <span className="text-ink-mute">Description</span>
        <textarea required rows={3} value={form.description} onChange={set('description')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
      </label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-ink-mute">Vendor</span>
          <select value={form.vendorId} onChange={set('vendorId')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5">
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.storeName || v.name}
              </option>
            ))}
          </select>
        </label>
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
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-ink-mute">Price now (KES)</span>
          <input required type="number" min="1" value={form.price} onChange={set('price')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Was / offer compare-at</span>
          <input type="number" min="0" value={form.compareAt} onChange={set('compareAt')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
        </label>
      </div>
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
      <label className="flex items-center gap-3 rounded-xl border border-ink/10 p-3 bg-mist/50 cursor-pointer">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))}
          className="h-4 w-4 rounded border-ink/20 text-ember focus:ring-ember"
        />
        <div>
          <span className="text-sm font-semibold block text-ink">Feature on Homepage</span>
          <span className="text-xs text-ink-mute block">Show immediately in the "Featured Products" section on the front page.</span>
        </div>
      </label>
      <ProductImagesField images={form.images} onChange={(images) => setForm((f) => ({ ...f, images }))} />
      <button type="submit" disabled={saving} className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {saving ? 'Saving…' : 'Publish product'}
      </button>
    </form>
  );
}

// Admin creates a vendor directly — no application flow. The account is born approved.
export function AddVendorForm({ onSaved, onError }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', storeName: '', password: '' });
  const [saving, setSaving] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.post('/admin/vendors', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        storeName: form.storeName,
        password: form.password,
      });
      setForm({ name: '', email: '', phone: '', storeName: '', password: '' });
      onSaved?.(res.vendor);
    } catch (err) {
      onError?.(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
      <h2 className="font-display text-xl font-bold">Add vendor</h2>
      <p className="text-xs text-ink-mute">Creates an approved vendor account — they can start listing immediately. Share the password with them; they can change it later.</p>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-ink-mute">Store name</span>
          <input required value={form.storeName} onChange={set('storeName')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Contact name</span>
          <input required value={form.name} onChange={set('name')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
        </label>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-sm">
          <span className="text-ink-mute">Email (login)</span>
          <input required type="email" value={form.email} onChange={set('email')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Password (6+ characters)</span>
          <input required minLength={6} value={form.password} onChange={set('password')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
        </label>
      </div>
      <label className="block text-sm">
        <span className="text-ink-mute">Phone (optional)</span>
        <input value={form.phone} onChange={set('phone')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {saving ? 'Creating…' : 'Create vendor'}
      </button>
    </form>
  );
}

export function NewsletterTab({ subscribers, flash, onError }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);

  async function sendIssue(e) {
    e.preventDefault();
    setSending(true);
    try {
      const res = await api.post('/admin/newsletter/send', { subject, body });
      flash(
        res.simulated
          ? `Queued to ${res.sent} subscribers (SMTP not set — emails are logged until you add SMTP).`
          : `Sent to ${res.sent} of ${res.total} subscribers.`
      );
      setSubject('');
      setBody('');
    } catch (err) {
      onError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={sendIssue} className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift space-y-3">
        <h2 className="font-display text-xl font-bold">Send newsletter</h2>
        <p className="text-xs text-ink-mute">
          Sends a real email to every subscriber when SMTP is configured on the server.
        </p>
        <input
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full rounded-xl border border-ink/10 px-3 py-2.5"
        />
        <textarea
          required
          rows={5}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Message"
          className="w-full rounded-xl border border-ink/10 px-3 py-2.5"
        />
        <button
          type="submit"
          disabled={sending || !subscribers?.length}
          className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {sending ? 'Sending…' : `Send to ${subscribers?.length || 0} subscribers`}
        </button>
      </form>
    <div className="overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-lift">
      <table className="w-full text-sm text-left">
        <thead className="border-b border-ink/10 text-ink-mute">
          <tr>
            <th className="p-4">Email</th>
            <th className="p-4">Subscribed</th>
          </tr>
        </thead>
        <tbody>
          {(subscribers || []).map((s) => (
            <tr key={s.id || s.email} className="border-b border-ink/5 last:border-0">
              <td className="p-4">
                <a href={`mailto:${s.email}`} className="text-leaf font-medium">
                  {s.email}
                </a>
              </td>
              <td className="p-4 text-ink-mute">{s.createdAt ? new Date(s.createdAt).toLocaleString('en-KE') : '—'}</td>
            </tr>
          ))}
          {(!subscribers || !subscribers.length) && (
            <tr>
              <td colSpan={2} className="p-8 text-center text-ink-mute">
                No newsletter subscribers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
    </div>
  );
}

export function CustomersTab({ customers, onChanged, onError }) {
  async function setStatus(id, status) {
    try {
      await api.patch(`/admin/customers/${id}`, { status });
      onChanged();
    } catch (e) {
      onError(e.message);
    }
  }
  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-lift">
      <table className="w-full text-sm text-left">
        <thead className="border-b border-ink/10 text-ink-mute">
          <tr>
            <th className="p-4">Customer</th>
            <th className="p-4">Phone</th>
            <th className="p-4">Orders</th>
            <th className="p-4">Spent</th>
            <th className="p-4">Status</th>
            <th className="p-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {(customers || []).map((c) => (
            <tr key={c.id} className="border-b border-ink/5 last:border-0">
              <td className="p-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-xs text-ink-mute">{c.email}</p>
              </td>
              <td className="p-4 text-ink-mute">{c.phone || '—'}</td>
              <td className="p-4">{c.orderCount || 0}</td>
              <td className="p-4">{formatKES(c.spent || 0)}</td>
              <td className="p-4 capitalize">{c.status || 'approved'}</td>
              <td className="p-4 text-right">
                {c.status === 'suspended' ? (
                  <button type="button" onClick={() => setStatus(c.id, 'approved')} className="text-xs font-semibold text-leaf">
                    Restore
                  </button>
                ) : (
                  <button type="button" onClick={() => setStatus(c.id, 'suspended')} className="text-xs font-semibold text-red-600">
                    Suspend
                  </button>
                )}
              </td>
            </tr>
          ))}
          {(!customers || !customers.length) && (
            <tr>
              <td colSpan={6} className="p-8 text-center text-ink-mute">
                No customer accounts yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function CategoriesTab({ categories, featuredSlugs, onChanged, onError, flash }) {
  const [form, setForm] = useState({ name: '', description: '', image: '', brands: '' });
  const [featured, setFeatured] = useState(featuredSlugs || []);

  async function add(e) {
    e.preventDefault();
    try {
      await api.post('/admin/categories', form);
      setForm({ name: '', description: '', image: '', brands: '' });
      flash('Category added');
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  async function patch(id, body) {
    try {
      await api.patch(`/admin/categories/${id}`, body);
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this category? Only empty categories can be deleted.')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      flash('Category deleted');
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  async function saveFeatured() {
    try {
      await api.patch('/admin/site/settings', { featuredCategorySlugs: featured.slice(0, 4) });
      flash('Homepage four categories saved');
    } catch (err) {
      onError(err.message);
    }
  }

  function toggleFeat(slug) {
    setFeatured((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 4) return [...prev.slice(1), slug];
      return [...prev, slug];
    });
  }

  return (
    <div className="mt-8 space-y-6">
      <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">New on BigDrop (4 tiles)</h2>
        <p className="text-xs text-ink-mute mt-1">Pick up to four categories for the homepage row.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {(categories || []).filter((c) => !c.hidden).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleFeat(c.slug)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                featured.includes(c.slug) ? 'bg-ink text-white border-ink' : 'bg-white border-ink/10'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
        <button type="button" onClick={saveFeatured} className="mt-4 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-white">
          Save homepage four
        </button>
      </div>

      <form onSubmit={add} className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift space-y-3">
        <h2 className="font-display text-xl font-bold">Add category</h2>
        <input required placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm" />
        <input placeholder="Image URL" value={form.image} onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm" />
        <input placeholder="Brands (comma separated)" value={form.brands} onChange={(e) => setForm((f) => ({ ...f, brands: e.target.value }))} className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm" />
        <button type="submit" className="rounded-xl bg-ember px-4 py-2 text-sm font-semibold text-white">
          Add
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-lift">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-ink/10 text-ink-mute">
            <tr>
              <th className="p-4">Category</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Visibility</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {(categories || []).map((c) => (
              <tr key={c.id} className="border-b border-ink/5 last:border-0">
                <td className="p-4 font-medium">{c.name}</td>
                <td className="p-4 text-ink-mute">{c.slug}</td>
                <td className="p-4">{c.hidden ? 'Hidden' : 'Live'}</td>
                <td className="p-4 text-right space-x-2">
                  <button type="button" onClick={() => patch(c.id, { hidden: !c.hidden })} className="text-xs font-semibold">
                    {c.hidden ? 'Show' : 'Hide'}
                  </button>
                  <button type="button" onClick={() => remove(c.id)} className="text-xs font-semibold text-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SettingsTab({ site, onSaved, onError, flash }) {
  const [form, setForm] = useState({
    phone: site?.phone || '',
    emails: (site?.emails || []).join(', '),
    address: site?.address || '',
    hours: site?.hours || '',
    whatsapp: site?.whatsapp || '',
    deliveryFee: site?.deliveryFee ?? 280,
    freeDeliveryMin: site?.freeDeliveryMin ?? 10000,
    commissionRate: Math.round((site?.commissionRate ?? 0.15) * 100),
    pickupText: site?.pickupText || 'Nextgen Mall, 3rd Floor, Suite 40.',
    cookieText: site?.cookieText || '',
    footerBlurb: site?.footerBlurb || '',
    copyright: site?.copyright || '',
    logo: site?.logo || '',
    favicon: site?.favicon || '',
    gaId: site?.gaId || '',
    metaPixelId: site?.metaPixelId || '',
    gscVerification: site?.gscVerification || '',
    paybill: site?.paybill || site?.payments?.paybill || '862294',
  });
  const [payments, setPayments] = useState({
    mpesa: site?.payments?.mpesa !== false,
    card: site?.payments?.card === true,
    cod: site?.payments?.cod === true,
  });
  const [socials, setSocials] = useState({
    facebook: site?.socials?.facebook || '',
    instagram: site?.socials?.instagram || '',
    twitter: site?.socials?.twitter || '',
    linkedin: site?.socials?.linkedin || '',
    youtube: site?.socials?.youtube || '',
    tiktok: site?.socials?.tiktok || '',
  });
  const [blackFriday, setBlackFriday] = useState({
    enabled: site?.blackFriday?.enabled !== false,
    title: site?.blackFriday?.title || 'Black Friday',
  });
  const [notify, setNotify] = useState({
    emailSubject: site?.notifyTemplates?.emailSubject || '',
    emailBody: site?.notifyTemplates?.emailBody || '',
    smsBody: site?.notifyTemplates?.smsBody || '',
  });
  const [sellPage, setSellPage] = useState({
    title: site?.sellPage?.title || 'Sell on BigDrop',
    subtitle: site?.sellPage?.subtitle || '',
    benefitsIntro: site?.sellPage?.benefitsIntro || '',
    commissionIntro: site?.sellPage?.commissionIntro || '',
    steps: site?.sellPage?.steps || [
      { n: '1', t: '', d: '' },
      { n: '2', t: '', d: '' },
      { n: '3', t: '', d: '' },
      { n: '4', t: '', d: '' },
    ],
    benefits: site?.sellPage?.benefits || [
      { title: '', text: '' },
      { title: '', text: '' },
      { title: '', text: '' },
    ],
    commissionRows: site?.sellPage?.commissionRows || [{ category: '', rate: '' }],
    guidelines: (site?.sellPage?.guidelines || []).join('\n'),
  });
  const [countyText, setCountyText] = useState(
    Object.entries(site?.countyFees || { Nairobi: 280, Kiambu: 350, Mombasa: 450, Kisumu: 500, Nakuru: 480 })
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n')
  );
  const [deliveryCopy, setDeliveryCopy] = useState({
    title: site?.deliveryCopy?.title || 'Nationwide delivery by Globeflight',
    note: site?.deliveryCopy?.note || 'Usually the same business day within Nairobi; 2–5 days elsewhere',
  });
  const [letterhead, setLetterhead] = useState({
    companyName: site?.letterhead?.companyName || 'BigDrop Kenya',
    address: site?.letterhead?.address || 'Nextgen Mall, 3rd Floor, Suite 39/40',
    email: site?.letterhead?.email || 'orders@bigdrop.co.ke',
    phone: site?.letterhead?.phone || '+254 722 359 298',
    thankYou: site?.letterhead?.thankYou || 'THANK YOU FOR YOUR BUSINESS!',
    footerContact: site?.letterhead?.footerContact || 'www.bigdrop.co.ke · orders@bigdrop.co.ke · +254 722 359 298',
  });
  const [announcement, setAnnouncement] = useState({
    enabled: site?.announcement?.enabled === true,
    text: site?.announcement?.text || '',
    href: site?.announcement?.href || '',
  });
  const [menus, setMenus] = useState(
    site?.menus?.header?.length || site?.menus?.footer?.length
      ? site.menus
      : {
          header: [
            { id: 'h_sell', label: 'Sell on BigDrop', href: '/sell', topbar: true },
            { id: 'h_help', label: 'Help Center', href: '/help', topbar: true },
            { id: 'h_shop', label: 'Shop', href: '/shop', topbar: false },
            { id: 'h_about', label: 'About', href: '/about', topbar: false },
            { id: 'h_blog', label: 'Blog', href: '/blog', topbar: false },
            { id: 'h_contact', label: 'Contact', href: '/contact', topbar: false },
          ],
          footer: [
            {
              id: 'company',
              title: 'Company',
              links: [
                { id: 'c_about', label: 'About Us', href: '/about' },
                { id: 'c_contact', label: 'Contact Us', href: '/contact' },
                { id: 'c_careers', label: 'Careers', href: '/careers' },
                { id: 'c_blog', label: 'Blog', href: '/blog' },
                { id: 'c_track', label: 'Track Order', href: '/track' },
                { id: 'c_help', label: 'Help Center', href: '/help' },
              ],
            },
            {
              id: 'service',
              title: 'Customer Service',
              links: [
                { id: 's_help', label: 'Help Center', href: '/help' },
                { id: 's_returns', label: 'Returns & Refunds', href: '/returns' },
                { id: 's_shipping', label: 'Shipping Info', href: '/fulfillment' },
                { id: 's_privacy', label: 'Privacy Policy', href: '/privacy' },
                { id: 's_terms', label: 'Terms & Conditions', href: '/terms' },
                { id: 's_shop', label: 'Shop', href: '/shop' },
                { id: 's_deals', label: 'Deals', href: '/deals' },
                { id: 's_brands', label: 'Brands', href: '/brands' },
                { id: 's_wish', label: 'Wishlist', href: '/wishlist' },
                { id: 's_compare', label: 'Compare', href: '/compare' },
              ],
            },
            {
              id: 'sell',
              title: 'Sell on BigDrop',
              links: [
                { id: 'v_shops', label: 'Vendor shops', href: '/vendors' },
                { id: 'v_become', label: 'Become a vendor', href: '/sell' },
                { id: 'v_benefits', label: 'Vendor benefits', href: '/sell#benefits' },
                { id: 'v_commission', label: 'Commission', href: '/sell#commission' },
                { id: 'v_guidelines', label: 'Seller guidelines', href: '/sell#guidelines' },
              ],
            },
          ],
          footerLegal: [
            { id: 'l_privacy', label: 'Privacy', href: '/privacy' },
            { id: 'l_terms', label: 'Terms & Conditions', href: '/terms' },
            { id: 'l_returns', label: 'Returns', href: '/returns' },
          ],
        }
  );

  useEffect(() => {
    if (site?.menus) setMenus(site.menus);
    if (site?.letterhead) {
      setLetterhead((prev) => ({ ...prev, ...site.letterhead }));
    }
    if (site?.deliveryCopy) setDeliveryCopy(site.deliveryCopy);
    if (site?.announcement) {
      setAnnouncement({
        enabled: site.announcement.enabled === true,
        text: site.announcement.text || '',
        href: site.announcement.href || '',
      });
    }
  }, [site]);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onLogo(file) {
    if (!file) return;
    try {
      const data = await fileToHeroDataUrl(file);
      setForm((f) => ({ ...f, logo: data }));
    } catch (err) {
      onError(err.message);
    }
  }

  async function onFavicon(file) {
    if (!file) return;
    try {
      const data = await fileToSquareDataUrl(file, 128);
      setForm((f) => ({ ...f, favicon: data }));
    } catch (err) {
      onError(err.message);
    }
  }

  async function save(e) {
    e.preventDefault();
    const countyFees = {};
    for (const line of countyText.split(/\n/)) {
      const idx = line.indexOf(':');
      if (idx < 0) continue;
      const name = line.slice(0, idx).trim();
      const n = Number(line.slice(idx + 1).trim());
      if (name && Number.isFinite(n)) countyFees[name] = n;
    }
    try {
      await api.patch('/admin/site/settings', {
        phone: form.phone,
        emails: form.emails,
        address: form.address,
        hours: form.hours,
        whatsapp: form.whatsapp,
        deliveryFee: Number(form.deliveryFee),
        freeDeliveryMin: Number(form.freeDeliveryMin),
        commissionRate: Number(form.commissionRate),
        countyFees,
        payments,
        socials,
        pickupText: form.pickupText,
        cookieText: form.cookieText,
        footerBlurb: form.footerBlurb,
        copyright: form.copyright,
        blackFriday,
        notifyTemplates: notify,
        sellPage: {
          ...sellPage,
          guidelines: String(sellPage.guidelines || '')
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        logo: form.logo?.startsWith('data:') ? form.logo : undefined,
        favicon: form.favicon?.startsWith('data:') ? form.favicon : undefined,
        gaId: form.gaId,
        metaPixelId: form.metaPixelId,
        gscVerification: form.gscVerification,
        paybill: form.paybill,
        deliveryCopy,
        letterhead,
        announcement,
        menus,
      });
      flash('Settings saved');
      window.dispatchEvent(new Event('bd-site-updated'));
      onSaved();
    } catch (err) {
      onError(err.message);
    }
  }

  const field = 'mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5';

  return (
    <form onSubmit={save} className="mt-8 space-y-6 max-w-3xl">
      <section className="space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Company details</h2>
        <label className="block text-sm">
          <span className="text-ink-mute">Phone</span>
          <input value={form.phone} onChange={set('phone')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Emails (comma separated)</span>
          <input value={form.emails} onChange={set('emails')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Address</span>
          <input value={form.address} onChange={set('address')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Hours</span>
          <input value={form.hours} onChange={set('hours')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">WhatsApp (254…)</span>
          <input value={form.whatsapp} onChange={set('whatsapp')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Pickup text (checkout)</span>
          <textarea rows={2} value={form.pickupText} onChange={set('pickupText')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Cookie banner text (leave blank for default)</span>
          <textarea rows={2} value={form.cookieText} onChange={set('cookieText')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Footer blurb</span>
          <textarea rows={3} value={form.footerBlurb} onChange={set('footerBlurb')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Footer copyright</span>
          <input value={form.copyright} onChange={set('copyright')} className={field} placeholder="Leave blank for the default line" />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Logo &amp; favicon</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="text-ink-mute">Header / footer logo</span>
            <input type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0])} className="mt-1 block text-sm" />
            {form.logo ? <img src={form.logo} alt="Logo preview" className="mt-2 h-10 w-auto bg-white rounded border p-1" /> : null}
          </label>
          <label className="block text-sm">
            <span className="text-ink-mute">Favicon</span>
            <input type="file" accept="image/*" onChange={(e) => onFavicon(e.target.files?.[0])} className="mt-1 block text-sm" />
            {form.favicon ? <img src={form.favicon} alt="Favicon preview" className="mt-2 h-8 w-8 rounded border" /> : null}
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Analytics &amp; search</h2>
        <p className="text-xs text-ink-mute">
          Paste IDs when you have them. Leave blank until Google Analytics, Meta Pixel, or Search Console is ready.
        </p>
        <label className="block text-sm">
          <span className="text-ink-mute">Google Analytics 4 ID</span>
          <input value={form.gaId} onChange={set('gaId')} className={field} placeholder="G-XXXXXXXXXX" />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Meta Pixel ID</span>
          <input value={form.metaPixelId} onChange={set('metaPixelId')} className={field} placeholder="123456789012345" />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Google Search Console verification</span>
          <input value={form.gscVerification} onChange={set('gscVerification')} className={field} placeholder="google-site-verification token" />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Checkout payments</h2>
        <p className="text-xs text-ink-mute">Cash on delivery stays hidden until you turn it on. Card stays Coming Soon at checkout even if this box is ticked — do not turn it on until card payments are launched.</p>
        <label className="block text-sm">
          <span className="text-ink-mute">M-Pesa till (Buy Goods and Services)</span>
          <input value={form.paybill} onChange={set('paybill')} className={field} placeholder="862294" />
        </label>
        {[
          ['mpesa', 'M-Pesa'],
          ['card', 'Card (Coming Soon)'],
          ['cod', 'Cash on delivery'],
        ].map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={!!payments[key]}
              onChange={(e) => setPayments((p) => ({ ...p, [key]: e.target.checked }))}
            />
            {label}
          </label>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Social links</h2>
        {[
          ['facebook', 'Facebook'],
          ['instagram', 'Instagram'],
          ['twitter', 'X / Twitter'],
          ['linkedin', 'LinkedIn'],
          ['youtube', 'YouTube'],
          ['tiktok', 'TikTok'],
        ].map(([key, label]) => (
          <label key={key} className="block text-sm">
            <span className="text-ink-mute">{label}</span>
            <input
              value={socials[key] || ''}
              onChange={(e) => setSocials((s) => ({ ...s, [key]: e.target.value }))}
              className={field}
              placeholder="https://"
            />
          </label>
        ))}
      </section>

      <section className="space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Black Friday</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={blackFriday.enabled}
            onChange={(e) => setBlackFriday((b) => ({ ...b, enabled: e.target.checked }))}
          />
          Show Black Friday in the header and footer
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Title</span>
          <input
            value={blackFriday.title}
            onChange={(e) => setBlackFriday((b) => ({ ...b, title: e.target.value }))}
            className={field}
          />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Purchase email &amp; SMS</h2>
        <p className="text-xs text-ink-mute">
          Placeholders: {'{{name}}'} {'{{orderNumber}}'} {'{{trackingNumber}}'} {'{{total}}'}
        </p>
        <label className="block text-sm">
          <span className="text-ink-mute">Email subject</span>
          <input value={notify.emailSubject} onChange={(e) => setNotify((n) => ({ ...n, emailSubject: e.target.value }))} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Email body</span>
          <textarea rows={6} value={notify.emailBody} onChange={(e) => setNotify((n) => ({ ...n, emailBody: e.target.value }))} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">SMS text</span>
          <textarea rows={3} value={notify.smsBody} onChange={(e) => setNotify((n) => ({ ...n, smsBody: e.target.value }))} className={field} />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Sell on BigDrop page</h2>
        <label className="block text-sm">
          <span className="text-ink-mute">Title</span>
          <input value={sellPage.title} onChange={(e) => setSellPage((s) => ({ ...s, title: e.target.value }))} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Subtitle</span>
          <textarea rows={2} value={sellPage.subtitle} onChange={(e) => setSellPage((s) => ({ ...s, subtitle: e.target.value }))} className={field} />
        </label>
        <p className="text-sm font-semibold pt-2">How to start (4 steps)</p>
        {(sellPage.steps || []).map((step, i) => (
          <div key={step.n || i} className="grid sm:grid-cols-2 gap-2">
            <input
              value={step.t}
              onChange={(e) =>
                setSellPage((s) => {
                  const steps = [...s.steps];
                  steps[i] = { ...steps[i], t: e.target.value };
                  return { ...s, steps };
                })
              }
              className={field}
              placeholder={`Step ${i + 1} title`}
            />
            <input
              value={step.d}
              onChange={(e) =>
                setSellPage((s) => {
                  const steps = [...s.steps];
                  steps[i] = { ...steps[i], d: e.target.value };
                  return { ...s, steps };
                })
              }
              className={field}
              placeholder="Description"
            />
          </div>
        ))}
        <label className="block text-sm">
          <span className="text-ink-mute">Benefits intro</span>
          <textarea rows={2} value={sellPage.benefitsIntro} onChange={(e) => setSellPage((s) => ({ ...s, benefitsIntro: e.target.value }))} className={field} />
        </label>
        {(sellPage.benefits || []).map((b, i) => (
          <div key={i} className="grid sm:grid-cols-2 gap-2">
            <input
              value={b.title}
              onChange={(e) =>
                setSellPage((s) => {
                  const benefits = [...s.benefits];
                  benefits[i] = { ...benefits[i], title: e.target.value };
                  return { ...s, benefits };
                })
              }
              className={field}
              placeholder="Benefit title"
            />
            <input
              value={b.text}
              onChange={(e) =>
                setSellPage((s) => {
                  const benefits = [...s.benefits];
                  benefits[i] = { ...benefits[i], text: e.target.value };
                  return { ...s, benefits };
                })
              }
              className={field}
              placeholder="Benefit text"
            />
          </div>
        ))}
        <label className="block text-sm">
          <span className="text-ink-mute">Commission intro</span>
          <textarea rows={2} value={sellPage.commissionIntro} onChange={(e) => setSellPage((s) => ({ ...s, commissionIntro: e.target.value }))} className={field} />
        </label>
        {(sellPage.commissionRows || []).map((row, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input
              value={row.category}
              onChange={(e) =>
                setSellPage((s) => {
                  const commissionRows = [...s.commissionRows];
                  commissionRows[i] = { ...commissionRows[i], category: e.target.value };
                  return { ...s, commissionRows };
                })
              }
              className={field}
              placeholder="Category"
            />
            <input
              value={row.rate}
              onChange={(e) =>
                setSellPage((s) => {
                  const commissionRows = [...s.commissionRows];
                  commissionRows[i] = { ...commissionRows[i], rate: e.target.value };
                  return { ...s, commissionRows };
                })
              }
              className={field}
              placeholder="e.g. 10%"
            />
          </div>
        ))}
        <label className="block text-sm">
          <span className="text-ink-mute">Seller guidelines (one per line)</span>
          <textarea rows={5} value={sellPage.guidelines} onChange={(e) => setSellPage((s) => ({ ...s, guidelines: e.target.value }))} className={field} />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Delivery &amp; commission</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-ink-mute">Nairobi delivery (KES)</span>
            <input type="number" min="0" value={form.deliveryFee} onChange={set('deliveryFee')} className={field} />
          </label>
          <label className="block text-sm">
            <span className="text-ink-mute">Free delivery over (KES)</span>
            <input type="number" min="0" value={form.freeDeliveryMin} onChange={set('freeDeliveryMin')} className={field} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-ink-mute">Vendor commission %</span>
          <input type="number" min="0" max="100" value={form.commissionRate} onChange={set('commissionRate')} className={field} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">County fees (one per line: County: amount)</span>
          <textarea rows={6} value={countyText} onChange={(e) => setCountyText(e.target.value)} className={`${field} font-mono text-xs`} />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Product delivery line</h2>
        <p className="text-xs text-ink-mute">Shown on the product page under the truck icon.</p>
        <label className="block text-sm">
          <span className="text-ink-mute">Title</span>
          <input
            value={deliveryCopy.title}
            onChange={(e) => setDeliveryCopy((d) => ({ ...d, title: e.target.value }))}
            className={field}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Estimated delivery</span>
          <input
            value={deliveryCopy.note}
            onChange={(e) => setDeliveryCopy((d) => ({ ...d, note: e.target.value }))}
            className={field}
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Invoice &amp; waybill letterhead</h2>
        <label className="block text-sm">
          <span className="text-ink-mute">Company name</span>
          <input
            value={letterhead.companyName}
            onChange={(e) => setLetterhead((d) => ({ ...d, companyName: e.target.value }))}
            className={field}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Address (one line per row)</span>
          <textarea
            rows={3}
            value={letterhead.address}
            onChange={(e) => setLetterhead((d) => ({ ...d, address: e.target.value }))}
            className={field}
          />
        </label>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-ink-mute">Orders email</span>
            <input
              value={letterhead.email}
              onChange={(e) => setLetterhead((d) => ({ ...d, email: e.target.value }))}
              className={field}
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-mute">Phone</span>
            <input
              value={letterhead.phone}
              onChange={(e) => setLetterhead((d) => ({ ...d, phone: e.target.value }))}
              className={field}
            />
          </label>
        </div>
        <label className="block text-sm">
          <span className="text-ink-mute">Thank-you line</span>
          <textarea
            rows={2}
            value={letterhead.thankYou}
            onChange={(e) => setLetterhead((d) => ({ ...d, thankYou: e.target.value }))}
            className={field}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Footer contact line</span>
          <input
            value={letterhead.footerContact}
            onChange={(e) => setLetterhead((d) => ({ ...d, footerContact: e.target.value }))}
            className={field}
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Announcement bar</h2>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={announcement.enabled}
            onChange={(e) => setAnnouncement((a) => ({ ...a, enabled: e.target.checked }))}
          />
          Show announcement bar
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Text</span>
          <input
            value={announcement.text}
            onChange={(e) => setAnnouncement((a) => ({ ...a, text: e.target.value }))}
            className={field}
            placeholder="Free same-day Nairobi delivery this week"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-mute">Link (optional)</span>
          <input
            value={announcement.href}
            onChange={(e) => setAnnouncement((a) => ({ ...a, href: e.target.value }))}
            className={field}
            placeholder="/deals"
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Header menu</h2>
        <p className="text-xs text-ink-mute">Top bar shows items marked “Top bar”. Other items appear beside All Categories on desktop and in the mobile menu.</p>
        {(menus.header || []).map((row, i) => (
          <div key={row.id || i} className="grid sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-end">
            <input
              value={row.label}
              onChange={(e) =>
                setMenus((m) => {
                  const header = [...(m.header || [])];
                  header[i] = { ...header[i], label: e.target.value };
                  return { ...m, header };
                })
              }
              className={field}
              placeholder="Label"
            />
            <input
              value={row.href}
              onChange={(e) =>
                setMenus((m) => {
                  const header = [...(m.header || [])];
                  header[i] = { ...header[i], href: e.target.value };
                  return { ...m, header };
                })
              }
              className={field}
              placeholder="/shop"
            />
            <label className="flex items-center gap-1 text-xs pb-3 whitespace-nowrap">
              <input
                type="checkbox"
                checked={!!row.topbar}
                onChange={(e) =>
                  setMenus((m) => {
                    const header = [...(m.header || [])];
                    header[i] = { ...header[i], topbar: e.target.checked };
                    return { ...m, header };
                  })
                }
              />
              Top bar
            </label>
            <button
              type="button"
              className="text-xs font-semibold text-red-600 pb-3"
              onClick={() => setMenus((m) => ({ ...m, header: (m.header || []).filter((_, idx) => idx !== i) }))}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold"
          onClick={() =>
            setMenus((m) => ({ ...m, header: [...(m.header || []), { id: `h_${Date.now()}`, label: '', href: '/', topbar: false }] }))
          }
        >
          Add header link
        </button>
      </section>

      <section className="space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Footer menus</h2>
        {(menus.footer || []).map((col, ci) => (
          <div key={col.id || ci} className="rounded-xl border border-ink/10 p-4 space-y-2">
            <input
              value={col.title}
              onChange={(e) =>
                setMenus((m) => {
                  const footer = [...(m.footer || [])];
                  footer[ci] = { ...footer[ci], title: e.target.value };
                  return { ...m, footer };
                })
              }
              className={field}
              placeholder="Column title"
            />
            {(col.links || []).map((row, li) => (
              <div key={row.id || li} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
                <input
                  value={row.label}
                  onChange={(e) =>
                    setMenus((m) => {
                      const footer = [...(m.footer || [])];
                      const links = [...(footer[ci].links || [])];
                      links[li] = { ...links[li], label: e.target.value };
                      footer[ci] = { ...footer[ci], links };
                      return { ...m, footer };
                    })
                  }
                  className={field}
                  placeholder="Label"
                />
                <input
                  value={row.href}
                  onChange={(e) =>
                    setMenus((m) => {
                      const footer = [...(m.footer || [])];
                      const links = [...(footer[ci].links || [])];
                      links[li] = { ...links[li], href: e.target.value };
                      footer[ci] = { ...footer[ci], links };
                      return { ...m, footer };
                    })
                  }
                  className={field}
                  placeholder="/about"
                />
                <button
                  type="button"
                  className="text-xs font-semibold text-red-600"
                  onClick={() =>
                    setMenus((m) => {
                      const footer = [...(m.footer || [])];
                      footer[ci] = { ...footer[ci], links: (footer[ci].links || []).filter((_, idx) => idx !== li) };
                      return { ...m, footer };
                    })
                  }
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              type="button"
              className="text-xs font-semibold"
              onClick={() =>
                setMenus((m) => {
                  const footer = [...(m.footer || [])];
                  footer[ci] = {
                    ...footer[ci],
                    links: [...(footer[ci].links || []), { id: `f_${Date.now()}`, label: '', href: '/' }],
                  };
                  return { ...m, footer };
                })
              }
            >
              Add link
            </button>
          </div>
        ))}
        <p className="text-xs text-ink-mute pt-2">Bottom legal links</p>
        {(menus.footerLegal || []).map((row, i) => (
          <div key={row.id || i} className="grid sm:grid-cols-[1fr_1fr_auto] gap-2">
            <input
              value={row.label}
              onChange={(e) =>
                setMenus((m) => {
                  const footerLegal = [...(m.footerLegal || [])];
                  footerLegal[i] = { ...footerLegal[i], label: e.target.value };
                  return { ...m, footerLegal };
                })
              }
              className={field}
              placeholder="Label"
            />
            <input
              value={row.href}
              onChange={(e) =>
                setMenus((m) => {
                  const footerLegal = [...(m.footerLegal || [])];
                  footerLegal[i] = { ...footerLegal[i], href: e.target.value };
                  return { ...m, footerLegal };
                })
              }
              className={field}
              placeholder="/privacy"
            />
            <button
              type="button"
              className="text-xs font-semibold text-red-600"
              onClick={() => setMenus((m) => ({ ...m, footerLegal: (m.footerLegal || []).filter((_, idx) => idx !== i) }))}
            >
              Remove
            </button>
          </div>
        ))}
        <button
          type="button"
          className="rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-semibold"
          onClick={() =>
            setMenus((m) => ({
              ...m,
              footerLegal: [...(m.footerLegal || []), { id: `l_${Date.now()}`, label: '', href: '/' }],
            }))
          }
        >
          Add legal link
        </button>
      </section>

      <button type="submit" className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white">
        Save settings
      </button>
    </form>
  );
}

export function TestimonialsTab({ testimonials, onChanged, onError, flash }) {
  const empty = { id: '', name: '', role: 'Customer', quote: '', image: '' };
  const [form, setForm] = useState(empty);
  const editing = Boolean(form.id);

  async function onPhoto(file) {
    if (!file) return;
    try {
      const data = await fileToReviewDataUrl(file);
      setForm((f) => ({ ...f, image: data }));
    } catch (err) {
      onError(err.message);
    }
  }

  async function save(e) {
    e.preventDefault();
    try {
      if (editing) {
        await api.patch(`/admin/testimonials/${form.id}`, {
          name: form.name,
          role: form.role,
          quote: form.quote,
          image: form.image,
        });
        flash('Testimonial updated');
      } else {
        await api.post('/admin/testimonials', {
          name: form.name,
          role: form.role,
          quote: form.quote,
          image: form.image,
        });
        flash('Testimonial added');
      }
      setForm(empty);
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this testimonial? This cannot be undone.')) return;
    try {
      await api.delete(`/admin/testimonials/${id}`);
      if (form.id === id) setForm(empty);
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={save} className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift space-y-3 max-w-xl">
        <h2 className="font-display text-xl font-bold">{editing ? 'Edit testimonial' : 'Add testimonial'}</h2>
        <input
          required
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
        />
        <input
          placeholder="Role"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
        />
        <textarea
          required
          rows={3}
          placeholder="Quote"
          value={form.quote}
          onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
          className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
        />
        <label className="block text-sm">
          <span className="text-ink-mute">Photo (shrunk to 20KB, shown as a 64×64 circle)</span>
          <input type="file" accept="image/*" className="mt-1 block text-sm" onChange={(e) => onPhoto(e.target.files?.[0])} />
        </label>
        {form.image ? (
          <img src={form.image} alt="" className="h-16 w-16 rounded-full object-cover border" />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="rounded-xl bg-ember px-4 py-2 text-sm font-semibold text-white">
            {editing ? 'Save changes' : 'Add'}
          </button>
          {editing ? (
            <button
              type="button"
              onClick={() => setForm(empty)}
              className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>
      <div className="space-y-3">
        {(testimonials || []).map((t) => (
          <div key={t.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
            <div className="flex gap-3">
              {t.image ? (
                <img src={t.image} alt="" className="h-12 w-12 rounded-full object-cover shrink-0" />
              ) : (
                <div className="h-12 w-12 rounded-full bg-mist shrink-0" />
              )}
              <div className="min-w-0">
                <p className="font-semibold">{t.name}</p>
                <p className="text-xs text-ink-mute">{t.role}</p>
                <p className="mt-2 text-sm">{t.quote}</p>
              </div>
            </div>
            <div className="mt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setForm({ id: t.id, name: t.name, role: t.role || 'Customer', quote: t.quote, image: t.image || '' })}
                className="text-xs font-semibold text-leaf"
              >
                Edit
              </button>
              <button type="button" onClick={() => remove(t.id)} className="text-xs font-semibold text-red-600">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function FaqsTab({ faqs, onChanged, onError, flash }) {
  const [list, setList] = useState(faqs || []);

  useEffect(() => {
    if (Array.isArray(faqs) && faqs.length) setList(faqs);
  }, [faqs]);

  function updateGroup(i, field, value) {
    setList((g) => g.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }
  function updateItem(gi, ii, field, value) {
    setList((g) =>
      g.map((row, idx) =>
        idx === gi
          ? { ...row, items: row.items.map((it, j) => (j === ii ? { ...it, [field]: value } : it)) }
          : row
      )
    );
  }

  async function save() {
    try {
      await api.put('/admin/faqs', { faqs: list });
      flash('Help Centre FAQs saved');
      onChanged();
    } catch (err) {
      onError(err.message);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {list.map((g, i) => (
        <div key={g.id || i} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift space-y-3">
          <input value={g.title} onChange={(e) => updateGroup(i, 'title', e.target.value)} className="w-full rounded-xl border border-ink/10 px-3 py-2 font-semibold" />
          {(g.items || []).map((it, j) => (
            <div key={j} className="grid gap-2">
              <input value={it.q} onChange={(e) => updateItem(i, j, 'q', e.target.value)} className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm" />
              <textarea value={it.a} onChange={(e) => updateItem(i, j, 'a', e.target.value)} rows={2} className="w-full rounded-lg border border-ink/10 px-3 py-2 text-sm" />
            </div>
          ))}
        </div>
      ))}
      <button type="button" onClick={save} className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white">
        Save FAQs
      </button>
    </div>
  );
}

export function PayoutsTab({ payouts, summary, rate, onChanged, onError, flash }) {
  async function mark(vendorId, status) {
    try {
      await api.patch(`/admin/payouts/${vendorId}`, { status });
      flash(status === 'paid' ? 'Marked paid' : 'Marked pending');
      onChanged();
    } catch (e) {
      onError(e.message);
    }
  }
  return (
    <div className="mt-8 space-y-4">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
          <p className="text-sm text-ink-mute">Gross (delivered)</p>
          <p className="font-display text-2xl font-bold">{formatKES(summary?.totalGross || 0)}</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
          <p className="text-sm text-ink-mute">Commission ({Math.round((rate || 0.15) * 100)}%)</p>
          <p className="font-display text-2xl font-bold">{formatKES(summary?.totalCommission || 0)}</p>
        </div>
        <div className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
          <p className="text-sm text-ink-mute">Vendor net</p>
          <p className="font-display text-2xl font-bold">{formatKES(summary?.totalNet || 0)}</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-lift">
        <table className="w-full text-sm text-left">
          <thead className="border-b border-ink/10 text-ink-mute">
            <tr>
              <th className="p-4">Vendor</th>
              <th className="p-4">Gross</th>
              <th className="p-4">Commission</th>
              <th className="p-4">Net</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {(payouts || []).map((p) => (
              <tr key={p.vendorId} className="border-b border-ink/5 last:border-0">
                <td className="p-4 font-medium">{p.name}</td>
                <td className="p-4">{formatKES(p.gross)}</td>
                <td className="p-4">{formatKES(p.commission)}</td>
                <td className="p-4">{formatKES(p.net)}</td>
                <td className="p-4 capitalize">{p.status}</td>
                <td className="p-4 text-right">
                  {p.status === 'paid' ? (
                    <button type="button" onClick={() => mark(p.vendorId, 'pending')} className="text-xs font-semibold">
                      Undo
                    </button>
                  ) : (
                    <button type="button" onClick={() => mark(p.vendorId, 'paid')} className="text-xs font-semibold text-leaf">
                      Mark paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WooCommerceImportTab({ flash, onError, onDone }) {
  const [file, setFile] = useState(null);
  const [hideDemo, setHideDemo] = useState(true);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState('');
  const [log, setLog] = useState([]);

  async function run(e) {
    e.preventDefault();
    if (!file) {
      onError('Choose a WooCommerce products CSV first.');
      return;
    }
    setRunning(true);
    setLog([]);
    setProgress('Reading CSV…');
    try {
      const csv = await file.text();
      const batch = 15;
      let offset = 0;
      let created = 0;
      let skipped = 0;
      let total = null;
      const notes = [];
      while (true) {
        const res = await api.post('/admin/woocommerce/import', {
          csv,
          offset,
          limit: batch,
          hideDemo: hideDemo && offset === 0,
        });
        total = res.total;
        created += res.created || 0;
        skipped += res.skipped || 0;
        if (res.errors?.length) notes.push(...res.errors.map((x) => `${x.name}: ${x.error}`));
        offset += batch;
        setProgress(`Imported ${Math.min(offset, total)} of ${total} rows · ${created} new · ${skipped} skipped`);
        if (res.done || !total || offset >= total) break;
      }
      const summary = `Finished: ${created} products added, ${skipped} skipped${total != null ? ` from ${total} CSV rows` : ''}. Photos were downloaded into the uploads folder.`;
      setLog(notes.slice(0, 20));
      flash(summary);
      onDone?.();
    } catch (err) {
      onError(err.message || 'Import failed');
    } finally {
      setRunning(false);
    }
  }

  return (
    <form onSubmit={run} className="mt-8 max-w-3xl space-y-4 rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
      <h2 className="font-display text-xl font-bold">WooCommerce CSV import</h2>
      <p className="text-sm text-ink-mute">
        Export Products from WordPress (WooCommerce → Products → Export). This copies name, description, price, stock, SKU, and
        downloads up to 3 photos per product into the server uploads folder so links still work after WordPress is deleted. Run
        this while the old shop is still online. Import in small batches so cPanel does not time out.
      </p>
      <label className="block text-sm">
        <span className="text-ink-mute">Products CSV</span>
        <input
          type="file"
          accept=".csv,text/csv"
          className="mt-1 block w-full text-sm"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={hideDemo} onChange={(e) => setHideDemo(e.target.checked)} />
        Hide the demo catalogue after import
      </label>
      {progress ? <p className="text-sm font-medium text-[#015837]">{progress}</p> : null}
      {log.length > 0 && (
        <ul className="text-xs text-ink-mute list-disc pl-5 space-y-1">
          {log.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <button
        type="submit"
        disabled={running || !file}
        className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {running ? 'Importing…' : 'Import products'}
      </button>
    </form>
  );
}

export function ReturnsTab({ returns = [], notifications = [], markRead, onChanged, onError, flash }) {
  const returnNotifs = notifications.filter(
    (n) => !n.read && n.channel === 'in_dashboard' && n.message.startsWith('Return request:')
  );
  const unreadCount = returnNotifs.length;
  const [drafts, setDrafts] = useState({});

  function setDraft(id, field, value) {
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] || {}), [field]: value } }));
  }

  async function setStatus(id, payload, label) {
    try {
      await api.patch(`/admin/returns/${id}`, payload);
      flash(label);
      onChanged();
    } catch (e) {
      onError(e.message);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-ink/5 bg-white px-4 py-3 shadow-lift">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">{unreadCount} unread return{(unreadCount === 1 ? '' : 's')}</p>
              <p className="text-xs text-ink-mute">New return request(s) from customers</p>
            </div>
          </div>
          <button type="button" onClick={() => markRead(returnNotifs.map((n) => n.id))} className="rounded-xl bg-ink/5 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-ink/10">
            Mark read
          </button>
        </div>
      )}
      {!returns.length && (
        <p className="rounded-2xl border border-ink/5 bg-white p-8 text-center text-sm text-ink-mute shadow-lift">
          No return requests yet.
        </p>
      )}
      {returns.map((r) => {
        const draft = drafts[r.id] || {};
        const closed = r.status === 'refunded' || r.status === 'rejected';
        return (
          <div key={r.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{r.orderNumber} - {r.customerName}</p>
                <p className="text-xs text-ink-mute">{r.customerEmail} · requested {new Date(r.createdAt).toLocaleDateString('en-KE')} · refund via {r.refundMethod}</p>
              </div>
              <span className="rounded-md bg-mist px-2.5 py-1 text-xs font-semibold capitalize">{r.status}</span>
            </div>
            <ul className="mt-3 text-sm text-ink-mute">
              {(r.items || []).map((i) => (
                <li key={i.productId}>{i.qty}x {i.name} - {formatKES(i.price)}</li>
              ))}
            </ul>
            <p className="mt-2 rounded-xl bg-mist p-3 text-sm">Reason: {r.reason}</p>
            {r.adminNote && <p className="mt-2 text-xs text-ink-mute">Note: {r.adminNote}</p>}
            {r.refundRef && <p className="mt-1 text-xs text-ink-mute">Refund ref: {r.refundRef}</p>}

            {!closed && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/10 pt-4">
                {r.status === 'requested' && (
                  <>
                    <button type="button" onClick={() => setStatus(r.id, { status: 'approved' }, 'Return approved')} className="rounded-xl bg-[#015837] px-4 py-2 text-xs font-semibold text-white">Approve</button>
                    <button type="button" onClick={() => { if (window.confirm('Reject this return?')) setStatus(r.id, { status: 'rejected', adminNote: draft.note || '' }, 'Return rejected'); }} className="rounded-xl border border-ink/10 px-4 py-2 text-xs font-semibold text-red-600">Reject</button>
                  </>
                )}
                {r.status === 'approved' && (
                  <button type="button" onClick={() => setStatus(r.id, { status: 'received', adminNote: draft.note || '' }, 'Goods received, stock restocked')} className="rounded-xl bg-[#015837] px-4 py-2 text-xs font-semibold text-white">Mark received (+ restock)</button>
                )}
                {(r.status === 'approved' || r.status === 'received') && (
                  <>
                    <input value={draft.refundRef || ''} onChange={(e) => setDraft(r.id, 'refundRef', e.target.value)} placeholder="Refund reference (M-Pesa / Paystack)" className="rounded-xl border border-ink/10 px-3 py-2 text-xs" />
                    <button type="button" onClick={() => setStatus(r.id, { status: 'refunded', refundRef: draft.refundRef || '', adminNote: draft.note || '' }, 'Refund recorded')} className="rounded-xl bg-ink px-4 py-2 text-xs font-semibold text-white">Mark refunded</button>
                  </>
                )}
                <input value={draft.note || ''} onChange={(e) => setDraft(r.id, 'note', e.target.value)} placeholder="Internal note (optional)" className="rounded-xl border border-ink/10 px-3 py-2 text-xs" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function QnATab({ questions = [], onChanged, onError, flash }) {
  const [drafts, setDrafts] = useState({});

  function setDraft(id, value) {
    setDrafts((d) => ({ ...d, [id]: value }));
  }

  async function save(q) {
    try {
      await api.patch(`/admin/products/${q.productId}/questions/${q.id}`, { answer: drafts[q.id] ?? q.answer ?? '' });
      flash('Answer saved');
      onChanged();
    } catch (e) {
      onError(e.message);
    }
  }

  async function clearAnswer(q) {
    try {
      await api.patch(`/admin/products/${q.productId}/questions/${q.id}`, { answer: '' });
      flash('Answer cleared');
      onChanged();
    } catch (e) {
      onError(e.message);
    }
  }

  async function remove(q) {
    if (!window.confirm('Delete this question?')) return;
    try {
      await api.delete(`/admin/products/${q.productId}/questions/${q.id}`);
      flash('Question deleted');
      onChanged();
    } catch (e) {
      onError(e.message);
    }
  }

  return (
    <div className="mt-8 space-y-4">
      {!questions.length && (
        <p className="rounded-2xl border border-ink/5 bg-white p-8 text-center text-sm text-ink-mute shadow-lift">
          No product questions yet.
        </p>
      )}
      {questions.map((q) => (
        <div key={q.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{q.question}</p>
              <p className="text-xs text-ink-mute">{q.asker} · {new Date(q.createdAt).toLocaleDateString('en-KE')} · on {q.productName}</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => clearAnswer(q)} className="text-xs font-semibold text-ink-mute">Clear answer</button>
              <button type="button" onClick={() => remove(q)} className="text-xs font-semibold text-red-600">Delete</button>
            </div>
          </div>
          <textarea
            rows={2}
            placeholder="Write the official answer (leave empty to clear)"
            value={drafts[q.id] ?? q.answer ?? ''}
            onChange={(e) => setDraft(q.id, e.target.value)}
            className="mt-3 w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
          />
          <button type="button" onClick={() => save(q)} className="mt-2 rounded-xl bg-[#015837] px-4 py-2 text-xs font-semibold text-white">Save answer</button>
        </div>
      ))}
    </div>
  );
}

export function BackupTab({ flash, onError, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState(null);

  async function download() {
    setBusy(true);
    try {
      const token = localStorage.getItem('bd_token');
      const API_URL = import.meta.env.VITE_API_URL || '/api';
      const res = await fetch(`${API_URL}/admin/backup`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Backup download failed');
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition') || '';
      const m = cd.match(/filename="?([^"]+)"?/);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = m ? m[1] : 'bigdrop-db-backup.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      flash('Backup downloaded');
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  }

  function pick(e) {
    setFile(e.target.files && e.target.files[0] ? e.target.files[0] : null);
  }

  async function restore() {
    if (!file) return;
    if (!window.confirm('Restoring replaces the ENTIRE store with this file. The current data is saved as db.json.pre-restore first. Continue?')) return;
    setBusy(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await api.post('/admin/backup/restore', parsed);
      flash(`Restored: ${res.counts.users} users, ${res.counts.products} products, ${res.counts.orders} orders`);
      onChanged();
    } catch (e) {
      onError(e.message || 'Invalid backup file');
    } finally {
      setBusy(false);
      setFile(null);
    }
  }

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-2">
      <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Download backup</h2>
        <p className="mt-2 text-sm text-ink-mute">Saves the complete store (users, products, orders, settings) as one JSON file. Also schedule tools/snapshot-db.mjs from a cron for automatic snapshots.</p>
        <button type="button" onClick={download} disabled={busy} className="mt-4 rounded-xl bg-[#015837] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Preparing...' : 'Download backup'}</button>
      </div>
      <div className="rounded-2xl border border-red-200 bg-white p-6 shadow-lift">
        <h2 className="font-display text-xl font-bold">Restore from backup</h2>
        <p className="mt-2 text-sm text-ink-mute">Upload a previous backup JSON. The current data is kept as db.json.pre-restore before the restore is applied.</p>
        <input type="file" accept=".json,application/json" onChange={pick} className="mt-3 block w-full text-sm" />
        <button type="button" onClick={restore} disabled={busy || !file} className="mt-3 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60">{busy ? 'Restoring...' : 'Restore database'}</button>
      </div>
    </div>
  );
}

export function AuditTab({ audit = [] }) {
  return (
    <div className="mt-8 overflow-x-auto rounded-2xl border border-ink/5 bg-white shadow-lift">
      <table className="w-full text-sm text-left">
        <thead className="border-b border-ink/10 text-ink-mute">
          <tr>
            <th className="p-4">When</th>
            <th className="p-4">Who</th>
            <th className="p-4">Action</th>
            <th className="p-4">Detail</th>
          </tr>
        </thead>
        <tbody>
          {audit.map((a, i) => (
            <tr key={`${a.at}-${i}`} className="border-b border-ink/5 last:border-0">
              <td className="p-4 whitespace-nowrap text-ink-mute">{new Date(a.at).toLocaleString('en-KE')}</td>
              <td className="p-4">{a.actor}</td>
              <td className="p-4 font-medium">{a.action}</td>
              <td className="p-4 text-ink-mute">{a.detail}</td>
            </tr>
          ))}
          {!audit.length && (
            <tr>
              <td colSpan={4} className="p-8 text-center text-ink-mute">No activity recorded yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
