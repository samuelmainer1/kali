import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';
import PageHero from '../components/PageHero';
import RequiredMark from '../components/RequiredMark';

const initialForm = { name: '', email: '', phone: '', subject: '', message: '' };

export default function Contact() {
  const [site, setSite] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    api.get('/site').then((d) => setSite(d.site)).catch(() => {});
  }, []);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/contact', form);
      setSent(true);
      setForm(initialForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const details = [
    { icon: MapPin, label: 'Address', value: site?.address || 'NextGen Mall, Mombasa Road, 3rd Floor Suite No. 39/40' },
    { icon: Phone, label: 'Phone', value: site?.phone || '+254 722 359 298', href: `tel:${site?.phone || '+254722359298'}` },
    {
      icon: Mail,
      label: 'Email',
      value: (site?.emails || ['info@bigdrop.co.ke', 'orders@bigdrop.co.ke']).join('  ·  '),
    },
    { icon: Clock, label: 'Support hours', value: site?.hours || '24 Hours' },
  ];

  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Contact Us' }]}
        title="Contact Us"
        subtitle="We'd love to hear from you. Reach out anytime — NextGen Mall, Nairobi, 24 hours."
      />

      <div className="mx-auto max-w-7xl px-4 py-14 md:px-6">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-2xl border border-ink/5 bg-white p-6 md:p-8 shadow-lift">
            <h2 className="font-display text-2xl font-bold">Send us a message</h2>
            <p className="mt-1 text-sm text-ink-mute">We typically respond within a few hours.</p>

            {sent ? (
              <div className="mt-8 flex flex-col items-center justify-center gap-3 rounded-xl border border-leaf/30 bg-leaf-pale/50 px-6 py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-leaf" />
                <p className="font-semibold text-leaf">Message received</p>
                <p className="text-sm text-ink-mute max-w-sm">
                  Thank you for reaching out. Our team will get back to you shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-2 text-sm font-semibold text-leaf hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-ink-mute">Full name</span>
                    <RequiredMark />
                    <input
                      required
                      value={form.name}
                      onChange={set('name')}
                      className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-ink-mute">Email</span>
                    <RequiredMark />
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={set('email')}
                      className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                    />
                  </label>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block text-sm">
                    <span className="text-ink-mute">Phone (optional)</span>
                    <input
                      value={form.phone}
                      onChange={set('phone')}
                      className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="text-ink-mute">Subject</span>
                    <input
                      value={form.subject}
                      onChange={set('subject')}
                      placeholder="General enquiry"
                      className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                    />
                  </label>
                </div>
                <label className="block text-sm">
                  <span className="text-ink-mute">Message</span>
                  <RequiredMark />
                  <textarea
                    required
                    rows={5}
                    value={form.message}
                    onChange={set('message')}
                    className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2.5 outline-none focus:border-leaf focus:ring-2 focus:ring-leaf/20"
                  />
                </label>
                {error && <p className="text-sm text-ember">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-xl bg-ember px-6 py-3 text-sm font-semibold text-white hover:bg-ember-deep disabled:opacity-60"
                >
                  <Send className="h-4 w-4" />
                  {loading ? 'Sending…' : 'Send message'}
                </button>
              </form>
            )}
          </div>

          <div className="space-y-4">
            {details.map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-mute">{label}</p>
                    {href ? (
                      <a href={href} className="mt-1 block text-sm font-medium hover:text-leaf">
                        {value}
                      </a>
                    ) : (
                      <p className="mt-1 text-sm font-medium leading-relaxed">{value}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="overflow-hidden rounded-2xl border border-ink/5 shadow-lift">
              <p className="px-4 py-3 text-sm font-semibold">Visit us — NextGen Mall</p>
              <iframe
                title="Visit us — NextGen Mall"
                src="https://www.openstreetmap.org/export/embed.html?bbox=36.83366%2C-1.33377%2C36.85366%2C-1.31377&layer=mapnik&marker=-1.32377%2C36.84366"
                className="h-56 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
