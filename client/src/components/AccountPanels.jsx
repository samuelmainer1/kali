import { useEffect, useState } from 'react';
import { api, formatKES } from '../lib/api';
import { useAuth } from '../context/AuthContext';

// ─── Profile (name + phone) ─────────────────────────────
export function ProfileCard() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({ name: user?.name || '', phone: user?.phone || '' });
  }, [user?.name, user?.phone]);

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setMsg('');
    setError('');
    try {
      const data = await api.patch('/account/profile', form);
      updateUser({ name: data.user.name, phone: data.user.phone });
      setMsg('Profile updated.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
      <h2 className="font-display text-xl font-bold">My profile</h2>
      <p className="mt-1 text-xs text-ink-mute">{user?.email}</p>
      <label className="mt-4 block text-sm">
        <span className="text-ink-mute">Full name</span>
        <input
          required
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
        />
      </label>
      <label className="mt-3 block text-sm">
        <span className="text-ink-mute">Phone (M-Pesa &amp; SMS updates)</span>
        <input
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="+254 7xx xxx xxx"
          className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
        />
      </label>
      {msg && <p className="mt-3 text-sm font-medium text-leaf">{msg}</p>}
      {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-4 rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-deep disabled:opacity-60"
      >
        {saving ? 'Saving…' : 'Save profile'}
      </button>
    </form>
  );
}

// ─── Address book ───────────────────────────────────────
const EMPTY_ADDRESS = { name: '', line1: '', city: '', county: '', phone: '', notes: '' };

export function AddressBook() {
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    try {
      const d = await api.get('/addresses');
      setAddresses(d.addresses || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/addresses', form);
      setForm(EMPTY_ADDRESS);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this address?')) return;
    setError('');
    try {
      await api.delete(`/addresses/${id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function makeDefault(id) {
    setError('');
    try {
      await api.patch(`/addresses/${id}`, { isDefault: true });
      await load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
      <h2 className="font-display text-xl font-bold">Delivery addresses</h2>
      {loading ? (
        <p className="mt-4 text-sm text-ink-mute">Loading…</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {addresses.map((a) => (
            <li key={a.id} className="rounded-xl border border-ink/10 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">
                    {a.name}
                    {a.isDefault && (
                      <span className="ml-2 rounded-md bg-leaf-pale px-2 py-0.5 text-xs font-semibold text-leaf">
                        Default
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-ink-mute">
                    {a.line1}, {a.city}
                    {a.county ? `, ${a.county}` : ''}
                    {a.phone ? ` · ${a.phone}` : ''}
                  </p>
                  {a.notes && <p className="mt-1 text-xs text-ink-mute">{a.notes}</p>}
                </div>
                <div className="flex gap-3">
                  {!a.isDefault && (
                    <button type="button" onClick={() => makeDefault(a.id)} className="text-xs font-semibold text-leaf">
                      Set default
                    </button>
                  )}
                  <button type="button" onClick={() => remove(a.id)} className="text-xs font-semibold text-red-600">
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
          {!addresses.length && (
            <li className="text-sm text-ink-mute">No saved addresses yet — add one below for faster checkout.</li>
          )}
        </ul>
      )}

      <form onSubmit={add} className="mt-4 space-y-3 border-t border-ink/10 pt-4">
        <p className="text-sm font-semibold">Add an address</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Recipient name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
          />
          <input
            required
            placeholder="Street / building (line 1)"
            value={form.line1}
            onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
            className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
          />
          <input
            required
            placeholder="City / town"
            value={form.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
            className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
          />
          <input
            placeholder="County"
            value={form.county}
            onChange={(e) => setForm((f) => ({ ...f, county: e.target.value }))}
            className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
          />
          <input
            placeholder="Phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
          />
          <input
            placeholder="Notes (optional)"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
          />
        </div>
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        <button
          type="submit"
          className="rounded-xl border border-ink/10 px-5 py-2.5 text-sm font-semibold hover:bg-mist"
        >
          Add address
        </button>
      </form>
    </div>
  );
}

// ─── Returns (request + history) ────────────────────────
const RETURN_STATUS_STYLES = {
  requested: 'bg-amber-100 text-amber-700',
  approved: 'bg-leaf-pale text-leaf',
  received: 'bg-leaf-pale text-leaf',
  refunded: 'bg-mist text-ink',
  rejected: 'bg-red-100 text-red-700',
};

export function MyReturns({ orders = [] }) {
  const [returns, setReturns] = useState([]);
  const [openOrderId, setOpenOrderId] = useState('');
  const [qty, setQty] = useState({});
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      const d = await api.get('/returns/mine');
      setReturns(d.returns || []);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const delivered = orders.filter((o) => o.status === 'delivered');

  async function submitReturn(order) {
    const items = (order.items || [])
      .map((i) => ({
        productId: i.productId,
        qty: Number(qty[`${order.id}:${i.productId}`] ?? 0),
      }))
      .filter((i) => i.qty > 0);
    if (!items.length) {
      setError('Set at least one quantity above 0 to return.');
      return;
    }
    setBusy(true);
    setError('');
    setMsg('');
    try {
      await api.post('/returns', { orderNumber: order.orderNumber, reason, items });
      setMsg(`Return requested for ${order.orderNumber}. We will review it shortly.`);
      setReason('');
      setQty({});
      setOpenOrderId('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="font-display text-2xl font-bold">Returns &amp; refunds</h2>
      <p className="mt-1 text-sm text-ink-mute">
        Delivered something wrong or damaged? Request a return below and BigDrop support will take it from there.
      </p>

      {msg && <p className="mt-4 rounded-xl bg-leaf-pale/60 px-4 py-3 text-sm font-medium text-leaf">{msg}</p>}
      {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

      {returns.length > 0 && (
        <div className="mt-4 space-y-3">
          {returns.map((r) => (
            <div key={r.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{r.orderNumber}</p>
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize ${
                    RETURN_STATUS_STYLES[r.status] || 'bg-mist text-ink-mute'
                  }`}
                >
                  {r.status}
                </span>
              </div>
              <ul className="mt-2 text-sm text-ink-mute">
                {(r.items || []).map((i) => (
                  <li key={i.productId}>
                    {i.qty}× {i.name}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-mute">Reason: {r.reason}</p>
              {r.adminNote && <p className="mt-1 text-xs text-ink-mute">BigDrop note: {r.adminNote}</p>}
              {r.status === 'refunded' && r.refundRef && (
                <p className="mt-1 text-xs text-ink-mute">Refund reference: {r.refundRef}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {delivered.length > 0 && (
        <div className="mt-4 space-y-3">
          {delivered.map((o) => (
            <div key={o.id} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{o.orderNumber}</p>
                  <p className="text-xs text-ink-mute">
                    {new Date(o.createdAt).toLocaleDateString('en-KE')} · {formatKES(o.total)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenOrderId(openOrderId === o.id ? '' : o.id)}
                  className="rounded-xl border border-ink/10 px-4 py-2 text-sm font-semibold hover:bg-mist"
                >
                  {openOrderId === o.id ? 'Cancel' : 'Request return'}
                </button>
              </div>

              {openOrderId === o.id && (
                <div className="mt-4 space-y-3 border-t border-ink/10 pt-4">
                  {(o.items || []).map((i) => {
                    const key = `${o.id}:${i.productId}`;
                    return (
                      <div key={key} className="flex items-center justify-between gap-3 text-sm">
                        <span>
                          {i.name} <span className="text-ink-mute">(bought {i.qty})</span>
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={i.qty}
                          value={qty[key] ?? 0}
                          onChange={(e) => setQty((q) => ({ ...q, [key]: Number(e.target.value) }))}
                          className="w-20 rounded-xl border border-ink/10 px-3 py-2 text-sm"
                        />
                      </div>
                    );
                  })}
                  <textarea
                    required
                    rows={2}
                    placeholder="What went wrong? (damaged, wrong item, changed your mind…)"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-ink/10 px-3 py-2.5 text-sm"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => submitReturn(o)}
                    className="rounded-xl bg-ember px-5 py-2.5 text-sm font-semibold text-white hover:bg-ember-deep disabled:opacity-60"
                  >
                    {busy ? 'Sending…' : 'Submit return request'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
