import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Warehouse,
  PackageCheck,
  Truck,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Handshake,
  GraduationCap,
  PhoneCall,
  ClipboardList,
  ScanLine,
  Boxes,
  Bike,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../lib/api';
import TestimonialsCarousel from '../components/TestimonialsCarousel';
import PageHero from '../components/PageHero';
import { useLang } from '../context/LangContext';

const processStepMeta = [
  { n: '01', tKey: 'aboutStep1t', dKey: 'aboutStep1d', icon: ClipboardList },
  { n: '02', tKey: 'aboutStep2t', dKey: 'aboutStep2d', icon: PhoneCall },
  { n: '03', tKey: 'aboutStep3t', dKey: 'aboutStep3d', icon: ScanLine },
  { n: '04', tKey: 'aboutStep4t', dKey: 'aboutStep4d', icon: Boxes },
  { n: '05', tKey: 'aboutStep5t', dKey: 'aboutStep5d', icon: PackageCheck },
  { n: '06', tKey: 'aboutStep6t', dKey: 'aboutStep6d', icon: Phone },
  { n: '07', tKey: 'aboutStep7t', dKey: 'aboutStep7d', icon: Bike },
  { n: '08', tKey: 'aboutStep8t', dKey: 'aboutStep8d', icon: CheckCircle2 },
];

export default function About() {
  const [site, setSite] = useState(null);
  const { t } = useLang();

  useEffect(() => {
    api
      .get('/site')
      .then((d) => {
        setSite(d.site);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <PageHero
        crumbs={[{ label: t('aboutUs') }]}
        title={t('aboutHeroTitle')}
        subtitle={t('aboutHeroSub')}
        image="/about-hero.jpg"
      >
        <Link
          to="/register?role=vendor"
          className="inline-flex items-center gap-2 rounded-md bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg px-5 py-2.5 text-sm"
        >
          {t('becomeVendor')} <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/fulfillment"
          className="inline-flex items-center gap-2 rounded-md border border-white/40 px-5 py-2.5 text-sm font-semibold hover:bg-white/10"
        >
          {t('seeFulfillment')}
        </Link>
      </PageHero>

      {/* Who we are */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="grid gap-10 md:grid-cols-2 md:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-leaf">{t('aboutWhoEyebrow')}</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold">
              {t('aboutWhoTitle')}
            </h2>
            <p className="mt-4 text-sm md:text-base text-ink-mute leading-relaxed">{t('aboutWhoP1')}</p>
            <p className="mt-4 text-sm md:text-base text-ink-mute leading-relaxed">{t('aboutWhoP2')}</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: Warehouse, title: t('aboutSecureTitle'), text: t('aboutSecureText') },
              { icon: PackageCheck, title: t('aboutPickTitle'), text: t('aboutPickText') },
              { icon: Truck, title: t('aboutNationTitle'), text: t('aboutNationText') },
              { icon: ShieldCheck, title: t('aboutPayTitle'), text: t('aboutPayText') },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-ink/5 bg-white p-5 shadow-lift">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-pale text-leaf">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="mt-1 text-xs text-ink-mute leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Market section */}
      <section className="border-y border-ink/5 bg-white/70">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf">{t('aboutMarketEyebrow')}</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold max-w-2xl">
            {t('aboutMarketTitle')}
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-ink-mute leading-relaxed">{t('aboutMarketP')}</p>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: TrendingUp, title: t('aboutAcqTitle'), text: t('aboutAcqText') },
              { icon: Handshake, title: t('aboutRetTitle'), text: t('aboutRetText') },
              { icon: Users, title: t('aboutSellersTitle'), text: t('aboutSellersText') },
              { icon: GraduationCap, title: t('aboutOnboardTitle'), text: t('aboutOnboardText') },
            ].map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl bg-ink text-white p-6 shadow-lift">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-leaf-bright">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-white/65 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process steps */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-leaf">{t('aboutHowEyebrow')}</p>
        <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold max-w-xl">
          {t('aboutHowTitle')}
        </h2>
        <p className="mt-3 max-w-xl text-sm text-ink-mute leading-relaxed">{t('aboutHowP')}</p>

        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {processStepMeta.map((step, i) => (
            <motion.li
              key={step.n}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 4) * 0.06 }}
              className="relative rounded-2xl border border-ink/5 bg-white p-5 shadow-lift"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-3xl font-bold text-leaf/30">{step.n}</span>
                <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-leaf-pale text-leaf">
                  <step.icon className="h-4 w-4" />
                </div>
              </div>
              <h3 className="mt-3 font-semibold text-sm">{t(step.tKey)}</h3>
              <p className="mt-1 text-xs text-ink-mute leading-relaxed">{t(step.dKey)}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      {/* Team */}
      <section className="border-t border-ink/5 bg-white/70">
        <div className="mx-auto max-w-7xl px-4 py-16 md:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-leaf">{t('aboutTeamEyebrow')}</p>
          <h2 className="mt-2 font-display text-3xl md:text-4xl font-bold">
            {t('aboutTeamTitle')}
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-[280px_1fr] md:items-start">
            <div className="overflow-hidden rounded-2xl border border-ink/5 shadow-lift">
              <img
                src="/sam-maina.jpg"
                alt="Samuel Maina, Sales Manager at BigDrop Kenya"
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold">Samuel Maina</h3>
              <p className="mt-1 text-sm font-semibold text-[#f68b1e]">{t('aboutSamuelRole')}</p>
              <p className="mt-4 text-sm text-ink-mute leading-relaxed">{t('aboutSamuelBio')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials carousel */}
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <TestimonialsCarousel />
      </div>

      {/* Contact strip */}
      <section className="mx-auto max-w-7xl px-4 py-16 md:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-ink text-white px-8 py-10 md:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(20,184,166,0.25),transparent_50%)]" />
          <div className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-leaf-bright">
                <MapPin className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">{t('aboutVisit')}</p>
              <p className="mt-1 text-xs text-white/65 leading-relaxed">
                {site?.address || 'NextGen Mall, Mombasa Road, 3rd Floor Suite No. 39/40'}
              </p>
            </div>
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-leaf-bright">
                <Phone className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">{t('aboutCall')}</p>
              <a href={`tel:${site?.phone || '+254722359298'}`} className="mt-1 block text-xs text-white/65 hover:text-white">
                {site?.phone || '+254 722 359 298'}
              </a>
            </div>
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-leaf-bright">
                <Mail className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">{t('aboutEmail')}</p>
              {(site?.emails || ['info@bigdrop.co.ke', 'orders@bigdrop.co.ke']).map((e) => (
                <a key={e} href={`mailto:${e}`} className="mt-1 block text-xs text-white/65 hover:text-white">
                  {e}
                </a>
              ))}
            </div>
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-leaf-bright">
                <Clock className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold">{t('aboutHours')}</p>
              <p className="mt-1 text-xs text-white/65">{site?.hours || '24 Hours'}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
