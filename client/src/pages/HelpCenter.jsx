import { Link } from 'react-router-dom';
import { MessageCircle, Package, RotateCcw, Store, Truck } from 'lucide-react';
import PageHero from '../components/PageHero';
import Faq from './Faq';
import { useLang } from '../context/LangContext';

const LINKS = [
  { to: '/track', icon: Truck, title: 'Track an order', text: 'Follow your Globeflight shipment from pick-up to doorstep.' },
  { to: '/returns', icon: RotateCcw, title: 'Returns & refunds', text: 'Start a return or read our 24-hour return policy.' },
  { to: '/fulfillment', icon: Package, title: 'Shipping info', text: 'Delivery times, fees, and how fulfillment works.' },
  { to: '/sell', icon: Store, title: 'Sell on BigDrop', text: 'Open a vendor account and list products on the marketplace.' },
  { to: '/contact', icon: MessageCircle, title: 'Contact us', text: 'Call +254 722 359 298 or email orders@bigdrop.co.ke.' },
];

export default function HelpCenter() {
  const { t, lang } = useLang();
  const links = lang === 'sw'
    ? [
        { to: '/track', icon: Truck, title: 'Fuatilia oda', text: 'Fuata usafirishaji wa Globeflight kutoka kuchukua hadi mlangoni.' },
        { to: '/returns', icon: RotateCcw, title: 'Marejesho', text: 'Anza kurejesha au soma sera ya kurejesha ndani ya saa 24.' },
        { to: '/fulfillment', icon: Package, title: 'Usafirishaji', text: 'Muda, ada, na jinsi fulfillment inavyofanya kazi.' },
        { to: '/sell', icon: Store, title: 'Uza kwenye BigDrop', text: 'Fungua akaunti ya muuzaji na orodhesha bidhaa.' },
        { to: '/contact', icon: MessageCircle, title: 'Wasiliana', text: 'Piga +254 722 359 298 au barua pepe orders@bigdrop.co.ke.' },
      ]
    : LINKS;
  return (
    <div>
      <PageHero
        crumbs={[{ label: t('helpCenter') }]}
        title={t('helpTitle')}
        subtitle={t('helpSub')}
      />

      <div className="mx-auto max-w-7xl px-4 pt-10 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {links.map(({ to, icon: Icon, title, text }) => (
            <Link
              key={to}
              to={to}
              className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm hover:border-orange-200 hover:shadow-md transition-shadow"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                <Icon size={18} />
              </div>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="mt-1 text-sm text-gray-500">{text}</p>
            </Link>
          ))}
        </div>
      </div>

      <Faq hideHero />
    </div>
  );
}
