import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { CheckCircle2, Package, UserPlus, Mail, Smartphone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import PageHero from '../components/PageHero';
import OrderDocuments from '../components/OrderDocuments';

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const location = useLocation();
  const { user, register } = useAuth();
  const orderNumber = params.get('ordered') || '';
  const track = params.get('track') || '';
  const name = params.get('name') || '';
  const email = params.get('email') || params.get('emailTo') || '';
  const phone = params.get('phone') || params.get('smsTo') || '';
  const isGuest = params.get('guest') === '1';
  const order = location.state?.order;
  const confirmation = location.state?.confirmation;
  const [fetchedOrder, setFetchedOrder] = useState(null);

  const [wantAccount, setWantAccount] = useState(false);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    if (!orderNumber) return undefined;
    let cancelled = false;
    (async () => {
      try {
        if (user) {
          const data = await api.get(`/orders/${encodeURIComponent(orderNumber)}`);
          if (!cancelled) setFetchedOrder(data.order || null);
          return;
        }
        if (!email) return;
        const data = await api.get(
          `/orders/${encodeURIComponent(orderNumber)}/documents?email=${encodeURIComponent(email)}`
        );
        const invoice = (data.documents || []).find((d) => d.type === 'invoice');
        if (!cancelled) {
          setFetchedOrder({
            orderNumber: invoice?.orderNumber || orderNumber,
            trackingNumber: track,
            customerName: name || invoice?.to?.name,
            customerEmail: email || invoice?.to?.email,
            customerPhone: phone || invoice?.to?.phone,
            items: invoice?.items || [],
            shipping: invoice?.shipping ?? 0,
            discount: invoice?.discount ?? 0,
            total: invoice?.total ?? 0,
            createdAt: invoice?.issuedAt,
            status: 'confirmed',
            paymentMethod: invoice?.paymentMethod,
            paymentRef: invoice?.paymentRef,
            mpesaReceipt: invoice?.mpesaReceipt,
            transactionNumber: invoice?.transactionNumber,
            documents: data.documents || [],
          });
        }
      } catch {
        if (!cancelled) setFetchedOrder(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderNumber, user, email, name, phone, track]);

  const viewOrder = useMemo(() => {
    if (fetchedOrder) return fetchedOrder;
    if (order) return order;
    const invoice = confirmation?.invoice;
    if (!invoice && !orderNumber) return null;
    return {
      orderNumber: orderNumber || invoice?.orderNumber,
      trackingNumber: track,
      customerName: name || invoice?.to?.name,
      customerEmail: email || invoice?.to?.email,
      customerPhone: phone || invoice?.to?.phone,
      items: invoice?.items || [],
      shipping: invoice?.shipping ?? 0,
      discount: invoice?.discount ?? 0,
      total: invoice?.total ?? 0,
      createdAt: invoice?.issuedAt,
      status: 'confirmed',
      documents: invoice ? [invoice] : [],
    };
  }, [order, fetchedOrder, confirmation, orderNumber, track, name, email, phone]);

  async function createAccount(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register({
        name: name || 'BigDrop Customer',
        email,
        phone,
        password,
        role: 'customer',
      });
      setMsg('Account created — you can track orders from Dashboard anytime.');
      setWantAccount(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Order confirmed' }]}
        title="Order placed successfully"
        subtitle="Confirmation sent by email and SMS. Keep your order and tracking numbers handy."
      />

      <div className="mx-auto max-w-2xl px-4 py-12 md:px-6">
        <div className="rounded-2xl border border-ink/5 bg-white p-6 md:p-8 shadow-lift text-center">
          <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-leaf-pale text-leaf">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="font-display text-2xl font-bold">We have received your order</h2>
          {orderNumber && (
            <p className="mt-3 text-sm">
              Order number: <strong>{orderNumber}</strong>
            </p>
          )}
          {track && (
            <p className="mt-1 text-sm">
              Tracking number: <strong>{track}</strong>
            </p>
          )}

          <div className="mt-5 grid gap-2 text-left text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-mist px-3 py-3 flex gap-2 items-start">
              <Mail className="h-4 w-4 text-ember mt-0.5 shrink-0" />
              <span>
                Email confirmation &amp; invoice sent to{' '}
                <strong>{confirmation?.emailTo || email || 'your email'}</strong>
              </span>
            </div>
            <div className="rounded-xl bg-mist px-3 py-3 flex gap-2 items-start">
              <Smartphone className="h-4 w-4 text-ember mt-0.5 shrink-0" />
              <span>
                SMS sent to <strong>{confirmation?.smsTo || phone || 'your phone'}</strong>
              </span>
            </div>
          </div>

          {viewOrder && (
            <div className="mt-6 text-left">
              <p className="text-xs text-ink-mute mb-2">
                Invoice is available to you, BigDrop admin, and the vendor(s) who sold the items.
                Open it below to view, print, or save as PDF.
              </p>
              <OrderDocuments order={viewOrder} />
            </div>
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              to={track ? `/track?code=${encodeURIComponent(track)}` : '/track'}
              className="inline-flex items-center gap-2 rounded-xl bg-ember px-6 py-3 text-sm font-semibold text-white hover:bg-ember-deep"
            >
              <Package size={16} /> Track shipment
            </Link>
            <Link
              to="/shop"
              className="inline-flex items-center rounded-xl border border-ink/15 px-6 py-3 text-sm font-semibold hover:bg-mist"
            >
              Continue shopping
            </Link>
          </div>
        </div>

        {isGuest && !user && !msg && (
          <div className="mt-8 rounded-2xl border border-primary-border bg-primary-soft p-6 shadow-lift">
            <div className="flex items-start gap-3">
              <UserPlus className="h-6 w-6 text-ember shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold">Want an account for next time?</h3>
                <p className="mt-1 text-sm text-ink-mute">
                  Optional — create a free BigDrop account to save addresses, track faster, and use a wishlist.
                </p>
                {!wantAccount ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setWantAccount(true)}
                      className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-white"
                    >
                      Create account
                    </button>
                    <Link to="/shop" className="rounded-xl border border-ink/15 px-5 py-2.5 text-sm font-semibold">
                      No thanks
                    </Link>
                  </div>
                ) : (
                  <form onSubmit={createAccount} className="mt-4 space-y-3 text-left">
                    <label className="block text-sm">
                      <span className="text-ink-mute">Email</span>
                      <input required type="email" defaultValue={email} readOnly className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5 bg-mist" />
                    </label>
                    <label className="block text-sm">
                      <span className="text-ink-mute">Choose a password</span>
                      <input
                        required
                        type="password"
                        minLength={6}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
                      />
                    </label>
                    {error && <p className="text-sm text-ember">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full rounded-xl bg-ember py-3 text-sm font-semibold text-white disabled:opacity-60">
                      {loading ? 'Creating…' : 'Create my account'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

        {msg && (
          <p className="mt-6 rounded-xl border border-leaf/30 bg-leaf-pale px-4 py-3 text-sm text-leaf text-center">
            {msg}{' '}
            <Link to="/account" className="font-semibold underline">
              Open Dashboard
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
