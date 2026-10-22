import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { api } from './adminApi';

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#88C300] focus:ring-2 focus:ring-[#88C300]/30';

const STATUSES = [
  ['created', 'Created'],
  ['collected', 'Collected'],
  ['departed', 'Departed'],
  ['in-transit', 'In transit'],
  ['arrived-at-destination', 'Arrived'],
  ['out-for-delivery', 'Out for delivery'],
  ['delivered', 'Delivered'],
];

const emptyShipment = {
  shipperCompanyName: '',
  shipperContactPerson: '',
  shipperCountry: 'Kenya',
  shipperCity: 'Nairobi',
  shipperAddress: '',
  shipperMobile: '',
  shipperEmail: '',
  receiverCompanyName: '',
  receiverContactPerson: '',
  receiverCountry: '',
  receiverCity: '',
  receiverAddress: '',
  receiverMobile: '',
  receiverEmail: '',
  parcelName: '',
  packageDescription: '',
  grossWeight: '',
  dimensions: '',
  chargeableWeight: '',
  declaredValue: '',
  currency: 'USD',
  numberOfPackages: 1,
  serviceType: 'Express Air',
  mode: 'air',
  origin: '',
  destination: '',
  note: '',
};

function statusLabel(status) {
  return STATUSES.find(([value]) => value === status)?.[1] || status || 'Created';
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
  );
}

export default function TrackingAdmin() {
  const [shipments, setShipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState(null);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await api(`/enhanced-tracking/shipments?limit=100&search=${encodeURIComponent(query)}`);
      setShipments(res.data.shipments || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [query]);

  async function updateStatus(shipment, status) {
    if (status === shipment.status) return;
    const label = statusLabel(status);
    const latest = shipment.updates?.[shipment.updates.length - 1];
    const location = latest?.location || shipment.destination || shipment.origin || 'In transit';
    setError('');
    try {
      await api(`/tracking/${shipment.id}/updates`, {
        method: 'POST',
        body: {
          status,
          location,
          description: `Status updated to ${label}.`,
        },
      });
      setMessage(`${shipment.trackingNumber} is now ${label}. The public track page shows this update.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Tracking</h1>
          <p className="mt-1 max-w-2xl text-sm text-gray-600">
            Add a shipment, then change its status in the list. Customers see that update at /track. Open a row to add a location note.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setSelected(null);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#88C300] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6ea000]"
        >
          <Plus className="h-4 w-4" /> New shipment
        </button>
      </div>

      {(error || message) && (
        <p className={`mb-4 rounded-lg px-3 py-2 text-sm ${error ? 'bg-red-50 text-red-700' : 'bg-[#88C300]/15 text-[#3d5a00]'}`}>
          {error || message}
        </p>
      )}

      {creating && (
        <ShipmentForm
          onCancel={() => setCreating(false)}
          onSaved={(shipment) => {
            setCreating(false);
            setMessage(`Shipment ${shipment.trackingNumber} created.`);
            setSelected(shipment);
            load();
          }}
        />
      )}

      {selected && !creating && (
        <ShipmentDetail
          shipment={selected}
          onBack={() => setSelected(null)}
          onChange={(shipment) => {
            setSelected(shipment);
            load();
          }}
          onDeleted={() => {
            setSelected(null);
            setMessage('Shipment deleted.');
            load();
          }}
        />
      )}

      {!creating && !selected && (
        <>
          <input
            className={`${inputClass} mb-4 max-w-sm`}
            placeholder="Search tracking number, sender, or receiver"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {loading ? (
            <p className="text-sm text-gray-500">Loading shipments...</p>
          ) : shipments.length === 0 ? (
            <p className="rounded-xl border bg-white px-4 py-8 text-center text-sm text-gray-500">
              No shipments yet. Create one to track it on the public site.
            </p>
          ) : (
            <div className="overflow-hidden rounded-xl border bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tracking number</th>
                    <th className="px-4 py-3 font-medium">Route</th>
                    <th className="px-4 py-3 font-medium">Parties</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shipments.map((shipment) => (
                    <tr
                      key={shipment.id}
                      className="cursor-pointer border-t hover:bg-gray-50"
                      onClick={() => setSelected(shipment)}
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{shipment.trackingNumber}</td>
                      <td className="px-4 py-3 text-gray-700">{shipment.origin} → {shipment.destination}</td>
                      <td className="px-4 py-3 text-gray-700">{shipment.senderName} → {shipment.receiverName}</td>
                      <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                        <select
                          className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs font-semibold text-gray-800"
                          value={shipment.status || 'created'}
                          aria-label={`Status for ${shipment.trackingNumber}`}
                          onChange={(event) => updateStatus(shipment, event.target.value)}
                        >
                          {STATUSES.map(([value, label]) => (
                            <option key={value} value={value}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ShipmentForm({ onCancel, onSaved }) {
  const [form, setForm] = useState(emptyShipment);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api('/enhanced-tracking/shipments', { method: 'POST', body: form });
      onSaved(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mb-6 max-w-4xl rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">New shipment</h2>
      {error && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Shipper company">
          <input className={inputClass} required value={form.shipperCompanyName} onChange={(e) => set('shipperCompanyName')(e.target.value)} />
        </Field>
        <Field label="Shipper contact">
          <input className={inputClass} value={form.shipperContactPerson} onChange={(e) => set('shipperContactPerson')(e.target.value)} />
        </Field>
        <Field label="Shipper city">
          <input className={inputClass} value={form.shipperCity} onChange={(e) => set('shipperCity')(e.target.value)} />
        </Field>
        <Field label="Shipper country">
          <input className={inputClass} value={form.shipperCountry} onChange={(e) => set('shipperCountry')(e.target.value)} />
        </Field>
        <Field label="Receiver company">
          <input className={inputClass} required value={form.receiverCompanyName} onChange={(e) => set('receiverCompanyName')(e.target.value)} />
        </Field>
        <Field label="Receiver contact">
          <input className={inputClass} value={form.receiverContactPerson} onChange={(e) => set('receiverContactPerson')(e.target.value)} />
        </Field>
        <Field label="Receiver city">
          <input className={inputClass} value={form.receiverCity} onChange={(e) => set('receiverCity')(e.target.value)} />
        </Field>
        <Field label="Receiver country">
          <input className={inputClass} value={form.receiverCountry} onChange={(e) => set('receiverCountry')(e.target.value)} />
        </Field>
        <Field label="Origin">
          <input className={inputClass} required value={form.origin} onChange={(e) => set('origin')(e.target.value)} />
        </Field>
        <Field label="Destination">
          <input className={inputClass} required value={form.destination} onChange={(e) => set('destination')(e.target.value)} />
        </Field>
        <Field label="Service type">
          <input className={inputClass} value={form.serviceType} onChange={(e) => set('serviceType')(e.target.value)} />
        </Field>
        <Field label="Transport mode">
          <select className={inputClass} value={form.mode} onChange={(e) => set('mode')(e.target.value)}>
            <option value="air">Air freight</option>
            <option value="sea">Sea freight</option>
            <option value="land">Land transport</option>
            <option value="courier">Courier</option>
          </select>
        </Field>
        <Field label="Gross weight (kg)">
          <input className={inputClass} type="number" min="0" step="0.01" value={form.grossWeight} onChange={(e) => set('grossWeight')(e.target.value)} />
        </Field>
        <Field label="Pieces">
          <input className={inputClass} type="number" min="1" value={form.numberOfPackages} onChange={(e) => set('numberOfPackages')(e.target.value)} />
        </Field>
        <Field label="Dimensions (L x W x H cm)">
          <input className={inputClass} placeholder="40 x 30 x 20" value={form.dimensions} onChange={(e) => set('dimensions')(e.target.value)} />
        </Field>
        <Field label="Declared value">
          <input className={inputClass} value={form.declaredValue} onChange={(e) => set('declaredValue')(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Package description">
          <textarea className={inputClass} rows={2} value={form.packageDescription} onChange={(e) => set('packageDescription')(e.target.value)} />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Note for the first tracking update">
          <textarea className={inputClass} rows={3} required value={form.note} onChange={(e) => set('note')(e.target.value)} />
        </Field>
      </div>
      <div className="mt-6 flex gap-3">
        <button type="submit" disabled={busy} className="rounded-lg bg-[#88C300] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6ea000] disabled:opacity-60">
          {busy ? 'Saving...' : 'Create shipment'}
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700">
          Cancel
        </button>
      </div>
    </form>
  );
}

function ShipmentDetail({ shipment, onBack, onChange, onDeleted }) {
  const [update, setUpdate] = useState({
    status: shipment.status || 'created',
    location: shipment.destination || '',
    description: '',
    latitude: '',
    longitude: '',
    recipientName: shipment.receiverName || '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setUpdate((current) => ({
      ...current,
      status: shipment.status || 'created',
      recipientName: shipment.receiverName || '',
    }));
  }, [shipment.id]);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api(`/tracking/${shipment.id}/updates`, { method: 'POST', body: update });
      onChange(res.data.shipment);
      setUpdate((current) => ({ ...current, description: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm(`Delete ${shipment.trackingNumber}?`)) return;
    try {
      await api(`/enhanced-tracking/shipments/${shipment.id}`, { method: 'DELETE' });
      onDeleted();
    } catch (err) {
      setError(err.message);
    }
  }

  const history = [...(shipment.updates || [])].reverse();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="rounded-2xl border bg-white p-5 shadow-sm">
        <button type="button" onClick={onBack} className="text-sm font-medium text-[#4f7300]">Back to shipments</button>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">{shipment.trackingNumber}</h2>
            <p className="mt-1 text-sm text-gray-600">{shipment.origin} → {shipment.destination}</p>
            <p className="text-sm text-gray-600">{shipment.senderName} → {shipment.receiverName}</p>
          </div>
          <span className="rounded-full bg-[#88C300]/15 px-3 py-1 text-sm font-semibold text-[#3d5a00]">
            {statusLabel(shipment.status)}
          </span>
        </div>
        <p className="mt-4 text-sm text-gray-600">
          {shipment.serviceType || 'Standard'} · {shipment.numberOfPackages || 1} piece(s) · {shipment.weight || '—'} kg
        </p>
        <a
          className="mt-3 inline-block text-sm font-medium text-[#4f7300] underline"
          href={`/track?trackingNumber=${encodeURIComponent(shipment.trackingNumber)}`}
          target="_blank"
          rel="noreferrer"
        >
          Open the public tracking page
        </a>

        <h3 className="mb-3 mt-8 text-lg font-semibold text-gray-900">History</h3>
        <div className="space-y-3">
          {history.map((item) => (
            <div key={item.id} className="rounded-lg border px-3 py-2">
              <p className="text-sm font-semibold text-gray-900">{statusLabel(item.status)} · {item.location}</p>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          ))}
        </div>
        <button type="button" onClick={remove} className="mt-6 text-sm font-medium text-red-600">Delete shipment</button>
      </div>

      <form onSubmit={submit} className="h-fit rounded-2xl border bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Add update</h3>
        {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="space-y-3">
          <Field label="Status">
            <select className={inputClass} value={update.status} onChange={(e) => setUpdate({ ...update, status: e.target.value })}>
              {STATUSES.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </Field>
          <Field label="Location">
            <input className={inputClass} required value={update.location} onChange={(e) => setUpdate({ ...update, location: e.target.value })} />
          </Field>
          <Field label="Note">
            <textarea className={inputClass} rows={4} required value={update.description} onChange={(e) => setUpdate({ ...update, description: e.target.value })} />
          </Field>
          <Field label="Latitude">
            <input className={inputClass} value={update.latitude} onChange={(e) => setUpdate({ ...update, latitude: e.target.value })} placeholder="-1.3195" />
          </Field>
          <Field label="Longitude">
            <input className={inputClass} value={update.longitude} onChange={(e) => setUpdate({ ...update, longitude: e.target.value })} placeholder="36.8970" />
          </Field>
          {update.status === 'delivered' && (
            <Field label="Recipient name">
              <input className={inputClass} value={update.recipientName} onChange={(e) => setUpdate({ ...update, recipientName: e.target.value })} />
            </Field>
          )}
        </div>
        <button type="submit" disabled={busy} className="mt-4 w-full rounded-lg bg-[#88C300] py-2 text-sm font-semibold text-white hover:bg-[#6ea000] disabled:opacity-60">
          {busy ? 'Saving...' : 'Save update'}
        </button>
      </form>
    </div>
  );
}
