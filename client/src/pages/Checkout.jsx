import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api, formatKES } from '../lib/api';
import { useLang } from '../context/LangContext';
import RequiredMark from '../components/RequiredMark';

const FREE_MIN = 10000;

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    line1: '',
    city: 'Nairobi',
    county: 'Nairobi',
    estate: 'Westlands',
    phone: user?.phone || '',
    notes: '',
    paymentMethod: 'mpesa',
    mpesaPhone: user?.phone || '',
    cardEmail: user?.email || '',
  });
  const [deliveryMode, setDeliveryMode] = useState('delivery');
  const [diaspora, setDiaspora] = useState(false);
  const [fromCountry, setFromCountry] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');
  const [addresses, setAddresses] = useState([]);
  const [options, setOptions] = useState({ counties: ['Nairobi'], nairobiEstates: {}, slots: [], pickupPoints: [] });
  const [quote, setQuote] = useState({ shipping: 280 });
  const [loading, setLoading] = useState(false);
  const [stkMsg, setStkMsg] = useState('');
  const [error, setError] = useState('');
  const [searchParams] = useSearchParams();
  const [payStatus, setPayStatus] = useState({
    mpesa: 'simulated',
    card: 'simulated',
    mpesaEnabled: true,
    cardEnabled: true,
    codEnabled: false,
    paybill: '862294',
  });
  const [cardReceipt, setCardReceipt] = useState('');
  const [cardRef, setCardRef] = useState('');
  const [site, setSite] = useState(null);

  const isGuest = !user;
  const deliveryForced = form.paymentMethod === 'cod';
  const pickup = deliveryMode === 'pickup' && !deliveryForced;

  useEffect(() => {
    if (user) {
      api.get('/addresses').then((d) => setAddresses(d.addresses || [])).catch(() => {});
    }
    api.get('/delivery/options').then(setOptions).catch(() => {});
    api.get('/site').then((d) => {
      setSite(d.site || null);
      if (d.site?.payments) setPayStatus((s) => ({ ...s, ...d.site.payments }));
    }).catch(() => {});
    api.get('/payments/status').then((s) => setPayStatus((p) => ({ ...p, ...s }))).catch(() => {});
  }, [user]);

  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref');
    if (!ref) return;
    api
      .post('/payments/card/confirm', { reference: ref })
      .then((conf) => {
        if (conf.ok) {
          setCardReceipt(conf.receipt || ref);
          setCardRef(ref);
          setForm((f) => ({ ...f, paymentMethod: 'card' }));
          setStkMsg(`Card paid. Receipt ${conf.receipt || ref}. Place your order to finish.`);
        }
      })
      .catch(() => {});
  }, [searchParams]);

  useEffect(() => {
    if (deliveryForced) setDeliveryMode('delivery');
  }, [deliveryForced]);

  useEffect(() => {
    const enabled = [payStatus.mpesaEnabled !== false && 'mpesa', payStatus.codEnabled === true && 'cod'].filter(Boolean);
    if (form.paymentMethod === 'card' || (enabled.length && !enabled.includes(form.paymentMethod))) {
      setForm((f) => ({ ...f, paymentMethod: enabled[0] || 'mpesa' }));
    }
  }, [payStatus.mpesaEnabled, payStatus.codEnabled, form.paymentMethod]);

  const discount = useMemo(() => {
    if (!coupon) return 0;
    if (coupon.type === 'percent') return Math.round(subtotal * (coupon.value / 100));
    if (coupon.type === 'flat') return Math.min(subtotal, coupon.value);
    return 0;
  }, [coupon, subtotal]);

  const afterDiscount = Math.max(0, subtotal - discount);

  useEffect(() => {
    api
      .post('/delivery/quote', {
        county: form.county,
        estate: form.estate,
        subtotal: afterDiscount,
        paymentMethod: form.paymentMethod,
        couponCode: coupon?.code,
        deliveryMode: pickup ? 'pickup' : 'delivery',
      })
      .then((d) => setQuote(d.quote || { shipping: 280 }))
      .catch(() => {});
  }, [form.county, afterDiscount, form.paymentMethod, coupon?.code, pickup]);

  const shipping = quote.shipping || 0;
  const total = afterDiscount + shipping;

  if (!items.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-ink-mute">Nothing to checkout.</p>
        <Link to="/shop" className="mt-4 inline-block text-leaf font-semibold">
          Go shopping
        </Link>
      </div>
    );
  }

  async function applyCoupon(e) {
    e.preventDefault();
    setCouponError('');
    try {
      const data = await api.post('/coupons/validate', { code: couponCode, subtotal });
      setCoupon({ code: data.coupon.code, ...data.coupon });
    } catch (err) {
      setCoupon(null);
      setCouponError(err.message);
    }
  }

  function useAddress(a) {
    setForm((f) => ({
      ...f,
      line1: a.line1 || '',
      city: a.city || '',
      county: a.county || '',
      phone: a.phone || f.phone,
      notes: a.notes || '',
      name: a.name || f.name,
    }));
  }

  async function confirmMpesa() {
    setStkMsg('Sending M-Pesa STK push…');
    const stk = await api.post('/payments/mpesa/stk', {
      phone: form.mpesaPhone || form.phone,
      amount: total,
    });
    setStkMsg(stk.message || 'Check your phone and enter your PIN.');
    const started = Date.now();
    const waitMs = stk.mode === 'live' ? 90000 : 8000;
    while (Date.now() - started < waitMs) {
      await new Promise((r) => setTimeout(r, 1500));
      const conf = await api.post('/payments/mpesa/confirm', { checkoutRequestId: stk.checkoutRequestId });
      if (conf.ok) {
        setStkMsg(`Paid. Receipt ${conf.receipt}`);
        return { receipt: conf.receipt, reference: stk.checkoutRequestId };
      }
      setStkMsg(conf.message || 'Waiting for PIN…');
    }
    throw new Error('M-Pesa confirmation timed out. Try again.');
  }

  async function confirmCard() {
    setStkMsg('Starting card payment…');
    const init = await api.post('/payments/card/init', {
      amount: total,
      email: form.cardEmail || form.email || user?.email,
    });
    if (init.authorizationUrl) {
      sessionStorage.setItem(
        'bd_card_checkout',
        JSON.stringify({ reference: init.reference, at: Date.now() })
      );
      window.location.href = init.authorizationUrl;
      throw new Error('Continue on the card page, then you will return here.');
    }
    const conf = await api.post('/payments/card/confirm', { reference: init.reference });
    if (!conf.ok) throw new Error(conf.message || 'Card payment failed');
    setStkMsg(`Paid. Receipt ${conf.receipt}`);
    return { receipt: conf.receipt, reference: init.reference };
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let mpesaReceipt = '';
      let paymentReference = '';
      if (form.paymentMethod === 'mpesa') {
        const paid = await confirmMpesa();
        mpesaReceipt = paid.receipt;
        paymentReference = paid.reference;
      }
      if (form.paymentMethod === 'card') {
        if (cardReceipt && cardRef) {
          mpesaReceipt = cardReceipt;
          paymentReference = cardRef;
        } else {
          const paid = await confirmCard();
          mpesaReceipt = paid.receipt;
          paymentReference = paid.reference;
        }
      }
      if (!paymentReference) {
        throw new Error('Payment could not be verified — please complete the payment again.');
      }
      const data = await api.post('/orders', {
        items: items.map((i) => ({ productId: i.productId, qty: i.qty, variant: i.variant || '' })),
        shippingAddress: {
          line1: pickup ? 'Pickup' : form.line1,
          city: form.city,
          county: form.county,
          phone: form.phone,
          notes: form.notes,
          estate: form.estate,
        },
        paymentMethod: form.paymentMethod,
        wantDelivery: !pickup,
        deliveryMode: pickup ? 'pickup' : 'delivery',
        pickupPointId: 'nextgen',
        estate: form.estate,
        couponCode: coupon?.code || '',
        mpesaReceipt,
        paymentReference,
        diaspora: diaspora ? { fromCountry, payerEmail: form.email } : null,
        guest: isGuest ? { name: form.name, email: form.email, phone: form.phone } : undefined,
      });
      clearCart();
      const q = new URLSearchParams({
        ordered: data.order.orderNumber,
        track: data.order.trackingNumber,
      });
      if (isGuest) {
        q.set('guest', '1');
        q.set('name', form.name);
        q.set('email', form.email);
        q.set('phone', form.phone);
      }
      if (data.confirmation) {
        q.set('emailTo', data.confirmation.emailTo || form.email);
        q.set('smsTo', data.confirmation.smsTo || form.phone);
      }
      navigate(`/order-success?${q}`, { state: { order: data.order, confirmation: data.confirmation } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  const estates = Object.keys(options.nairobiEstates || {});

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-6">
      <h1 className="font-display text-4xl font-bold mb-2">Checkout</h1>
      {isGuest ? (
        <p className="mb-8 text-sm text-ink-mute">
          No account needed — checkout as a guest.{' '}
          <Link to="/login?next=/checkout" className="text-ember font-semibold">
            Sign in
          </Link>{' '}
          or{' '}
          <Link to="/register?next=/checkout" className="text-ember font-semibold">
            create an account
          </Link>
          .
        </p>
      ) : (
        <p className="mb-8 text-sm text-ink-mute">
          Signed in as <strong>{user.name}</strong> ({user.email}) — your cart is saved to this account.
        </p>
      )}

      <form onSubmit={submit} className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {isGuest && (
            <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
              <h2 className="font-display text-xl font-bold">Your details</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm sm:col-span-2">
                  <span className="text-ink-mute">Full name</span>
                  <RequiredMark />
                  <input required value={form.name} onChange={set('name')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-mute">Email</span>
                  <RequiredMark />
                  <input required type="email" value={form.email} onChange={set('email')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-mute">Phone</span>
                  <RequiredMark />
                  <input required value={form.phone} onChange={set('phone')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" placeholder="07…" />
                </label>
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={diaspora} onChange={(e) => setDiaspora(e.target.checked)} className="mt-1" />
              <span>
                <span className="block font-semibold text-sm">I am ordering from abroad (diaspora)</span>
                <span className="text-xs text-ink-mute">You pay from overseas; we deliver to family or an address in Kenya.</span>
              </span>
            </label>
            {diaspora && (
              <label className="mt-3 block text-sm">
                <span className="text-ink-mute">Your country</span>
                <RequiredMark />
                <input
                  required={diaspora}
                  value={fromCountry}
                  onChange={(e) => setFromCountry(e.target.value)}
                  placeholder="e.g. United Kingdom"
                  className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
                />
              </label>
            )}
          </section>

          {!isGuest && addresses.length > 0 && !pickup && (
            <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
              <h2 className="font-display text-xl font-bold">Saved addresses</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {addresses.map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => useAddress(a)}
                    className="rounded-xl border border-ink/10 px-3 py-2 text-left text-xs hover:border-ember"
                  >
                    <strong className="block">{a.line1}</strong>
                    {a.city}
                    {a.county ? `, ${a.county}` : ''}
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
            <h2 className="font-display text-xl font-bold">How to receive</h2>
            <p className="mt-1 text-xs text-ink-mute">
              {form.paymentMethod === 'cod'
                ? 'Cash on delivery is home delivery only and always includes the delivery fee.'
                : 'Pay for delivery to your address, or collect free at NextGen Mall, 3rd Floor, Suite 40.'}
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className={`rounded-xl border p-4 cursor-pointer ${!pickup ? 'border-leaf bg-leaf-pale/40' : 'border-ink/10'}`}>
                <input type="radio" name="mode" checked={!pickup} onChange={() => setDeliveryMode('delivery')} />
                <span className="ml-2 font-semibold text-sm">Deliver to address</span>
                <span className="mt-1 block text-xs text-ink-mute">
                  Nairobi is KSh {options.deliveryFee || 280}. Other counties use the listed fee.
                </span>
              </label>
              <label className={`rounded-xl border p-4 ${deliveryForced ? 'opacity-50' : 'cursor-pointer'} ${pickup ? 'border-leaf bg-leaf-pale/40' : 'border-ink/10'}`}>
                <input type="radio" name="mode" disabled={deliveryForced} checked={pickup} onChange={() => setDeliveryMode('pickup')} />
                <span className="ml-2 font-semibold text-sm">Pick up at NextGen</span>
                <span className="mt-1 block text-xs text-ink-mute">
                  {site?.pickupText || '3rd Floor, Suite 40 — no delivery fee'}
                </span>
              </label>
            </div>

            {pickup ? (
              <div className="mt-4 rounded-xl border border-ink/10 bg-mist/50 p-4 text-sm">
                <p className="font-semibold whitespace-pre-line">{site?.pickupText || 'NextGen Mall, 3rd Floor, Suite 40'}</p>
                <p className="mt-1 text-ink-mute">Collection is free.</p>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2 block text-sm">
                  <span className="text-ink-mute">{diaspora ? 'Recipient street / landmark in Kenya' : 'Street / landmark'}</span>
                  <RequiredMark />
                  <input required={!pickup} value={form.line1} onChange={set('line1')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" placeholder="e.g. NextGen Mall, Mombasa Road" />
                </label>
                <label className="block text-sm">
                  <span className="text-ink-mute">County</span>
                  <RequiredMark />
                  <select required value={form.county} onChange={set('county')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5">
                    {(options.counties || ['Nairobi']).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                    <option value="Other">Other county</option>
                  </select>
                </label>
                <label className="block text-sm">
                  <span className="text-ink-mute">City</span>
                  <RequiredMark />
                  <input required={!pickup} value={form.city} onChange={set('city')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                </label>
                {/nairobi/i.test(form.county) && (
                  <label className="block text-sm">
                    <span className="text-ink-mute">Estate / area (optional)</span>
                    <select value={form.estate} onChange={set('estate')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5">
                      {estates.map((e) => (
                        <option key={e} value={e}>
                          {e}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                {!isGuest && (
                  <label className="block text-sm">
                    <span className="text-ink-mute">Phone</span>
                    <RequiredMark />
                    <input required value={form.phone} onChange={set('phone')} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                  </label>
                )}
                <label className="sm:col-span-2 block text-sm">
                  <span className="text-ink-mute">Delivery notes</span>
                  <textarea value={form.notes} onChange={set('notes')} rows={2} className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5" />
                </label>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift">
            <h2 className="font-display text-xl font-bold">Payment</h2>
            <div className="mt-4 space-y-3">
              {[
                payStatus.mpesaEnabled !== false && {
                  id: 'mpesa',
                  label: 'M-Pesa',
                  desc: payStatus.paybill
                    ? `STK push on your phone, or Lipa na M-Pesa Paybill ${payStatus.paybill}`
                    : 'Pay via M-Pesa STK push on your phone.',
                },
                {
                  id: 'card',
                  label: 'Card (Coming Soon)',
                  desc: 'Card (Coming Soon)',
                  disabled: true,
                },
                payStatus.codEnabled === true && {
                  id: 'cod',
                  label: 'Cash on delivery',
                  desc: 'Pay the rider — delivery fee is always included',
                },
              ]
                .filter(Boolean)
                .map((opt) => (
                <label
                  key={opt.id}
                  className={`flex gap-3 rounded-xl border p-4 ${
                    opt.disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                  } ${form.paymentMethod === opt.id ? 'border-leaf bg-leaf-pale/40' : 'border-ink/10'}`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.id}
                    checked={form.paymentMethod === opt.id}
                    onChange={set('paymentMethod')}
                    disabled={opt.disabled}
                    className="mt-1"
                  />
                  <span>
                    <span className="block font-semibold text-sm">{opt.label}</span>
                    <span className="text-xs text-ink-mute">{opt.desc}</span>
                  </span>
                </label>
              ))}
              {payStatus.mpesaEnabled === false && payStatus.cardEnabled === false && payStatus.codEnabled !== true && (
                <p className="text-sm text-ember">No payment methods are enabled. Please contact BigDrop.</p>
              )}
            </div>
            {form.paymentMethod === 'mpesa' && (
              <>
                <label className="mt-4 block text-sm">
                  <span className="text-ink-mute">M-Pesa number</span>
                  <RequiredMark />
                  <input
                    required
                    value={form.mpesaPhone}
                    onChange={set('mpesaPhone')}
                    placeholder="07xx or 2547xx"
                    className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
                  />
                </label>
                {(payStatus.paybill || site?.paybill) && (
                  <div className="mt-4 rounded-xl border border-[#015837]/20 bg-[#015837]/5 p-4 text-sm">
                    <p className="font-semibold text-[#015837]">Lipa na M-Pesa — Paybill {payStatus.paybill || site.paybill}</p>
                    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-ink">
                      <dt className="text-ink-mute">Paybill</dt>
                      <dd className="font-mono font-semibold">{payStatus.paybill || site.paybill}</dd>
                      <dt className="text-ink-mute">Account</dt>
                      <dd className="font-mono">{form.mpesaPhone || 'Your M-Pesa number'}</dd>
                      <dt className="text-ink-mute">Amount</dt>
                      <dd className="font-semibold">{formatKES(total)}</dd>
                    </dl>
                    <p className="mt-2 text-xs text-ink-mute">
                      If the STK prompt does not appear, open M-Pesa → Lipa na M-Pesa → Paybill, enter these details, then place your order.
                    </p>
                  </div>
                )}
              </>
            )}
            {form.paymentMethod === 'card' && (
              <label className="mt-4 block text-sm">
                <span className="text-ink-mute">Card receipt email</span>
                <input
                  required
                  type="email"
                  value={form.cardEmail || form.email}
                  onChange={set('cardEmail')}
                  className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5"
                />
              </label>
            )}
            {stkMsg && <p className="mt-3 text-sm text-[#015837]">{stkMsg}</p>}
          </section>
        </div>

        <aside className="rounded-2xl border border-ink/5 bg-white p-6 shadow-lift h-fit sticky top-24">
          <h2 className="font-display text-xl font-bold">Summary</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.key || i.productId} className="flex justify-between gap-2">
                <span className="text-ink-mute line-clamp-1">
                  {i.qty}× {i.name}
                </span>
                <span>{formatKES(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 rounded-xl border border-ink/10 p-4">
            <p className="text-sm font-bold mb-2">Promo code</p>
            <div className="flex gap-2">
              <input
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Coupon code"
                className="flex-1 min-w-0 rounded-lg border border-ink/10 px-3 py-2 text-sm"
              />
              <button type="button" onClick={applyCoupon} className="shrink-0 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white">
                Apply
              </button>
            </div>
            {coupon && (
              <p className="mt-2 text-xs font-semibold text-leaf">
                ✓ {coupon.code} — {coupon.label}
              </p>
            )}
            {couponError && <p className="mt-2 text-xs text-ember">{couponError}</p>}
          </div>

          <div className="mt-4 space-y-2 border-t border-ink/10 pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-mute">Subtotal</span>
              <span>{formatKES(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-leaf">
                <span>Discount</span>
                <span>-{formatKES(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-ink-mute">Delivery</span>
              <span>{shipping === 0 ? (pickup ? 'Pickup' : afterDiscount >= FREE_MIN ? 'Free' : formatKES(0)) : formatKES(shipping)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatKES(total)}</span>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-ember">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-xl bg-ember py-3.5 text-sm font-semibold text-white hover:bg-ember-deep disabled:opacity-60"
          >
            {loading ? 'Processing…' : form.paymentMethod === 'mpesa' ? 'Pay with M-Pesa' : isGuest ? 'Place order as guest' : 'Place order'}
          </button>
          <p className="mt-3 text-center text-xs text-ink-mute">{t('guestCheckout')}</p>
        </aside>
      </form>
    </div>
  );
}
