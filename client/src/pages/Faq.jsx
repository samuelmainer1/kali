import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Truck, Store, CreditCard, Plane, Package } from 'lucide-react';
import PageHero from '../components/PageHero';
import { useLang } from '../context/LangContext';
import { api } from '../lib/api';

const groups = [
  {
    id: 'fulfillment',
    title: 'Fulfillment & storage',
    icon: Package,
    items: [
      {
        q: 'What does BigDrop actually do for vendors?',
        a: 'BigDrop, powered by Globeflight Kenya, stores your inventory at our NextGen Mall warehouse, picks and packs every order, and delivers it nationwide — so you can focus on selling instead of logistics.',
      },
      {
        q: 'How do I send stock to your warehouse?',
        a: 'Drop off inventory at our NextGen Mall hub on Mombasa Road, or arrange a collection with our team. Once received, your stock is logged into our system with SKU-level visibility.',
      },
      {
        q: 'Can I check my stock levels at any time?',
        a: 'Yes. Your vendor dashboard shows live stock counts, low-stock alerts, and order history for every product you list.',
      },
    ],
  },
  {
    id: 'selling',
    title: 'Selling on BigDrop',
    icon: Store,
    items: [
      {
        q: 'Who can sell on BigDrop?',
        a: 'Individual Facebook, Instagram and TikTok sellers, small businesses, and large enterprises are all welcome. Every vendor account requires admin approval before products can go live.',
      },
      {
        q: 'How long does vendor approval take?',
        a: 'Our team reviews new vendor applications promptly — usually within one business day. You will be notified once your store is approved and you can start listing products.',
      },
      {
        q: 'Do I need my own website to sell on BigDrop?',
        a: 'No. BigDrop gives you a marketplace storefront immediately. You can also link your existing social media pages to drive traffic to your BigDrop listings.',
      },
      {
        q: 'What onboarding support is available?',
        a: 'New vendors get hands-on training on our backend ERP dashboard, with a dedicated onboarding expert to guide your first listings and orders.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery & tracking',
    icon: Truck,
    items: [
      {
        q: 'How is my order delivered?',
        a: 'Once picked and packed, orders are handed to Globeflight riders for nationwide door-to-door delivery. A rider will call you ahead of drop-off.',
      },
      {
        q: 'How do I track my order?',
        a: 'Use your order number or Globeflight tracking number on our Track page to see live status — from picking to out-for-delivery to confirmed delivery.',
      },
      {
        q: 'Is delivery free?',
        a: 'Delivery fees are shown at checkout. Pickup at NextGen Mall, 3rd Floor, Suite 40 is free.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments',
    icon: CreditCard,
    items: [
      {
        q: 'What payment methods are accepted?',
        a: 'Pay with M-Pesa at checkout. Lipa na M-Pesa Paybill 862294. If the STK prompt does not appear, pay that till manually. Card is coming soon. Cash on delivery is only available if BigDrop turns it on.',
      },
      {
        q: 'When do vendors get paid?',
        a: 'Vendor payouts are processed on a regular schedule once orders are marked delivered, minus applicable BigDrop fulfillment fees.',
      },
      {
        q: 'Is my payment information secure?',
        a: 'Yes. All transactions are processed through secured, encrypted payment channels with fraud checks on every order.',
      },
      {
        q: 'How do returns and refunds work?',
        a: 'Inspect your parcel on delivery. Report damage, missing items, or unused goods within 24 hours for a replacement or refund. Refunds go to the original payment method within 5–10 business days.',
      },
    ],
  },
  {
    id: 'diaspora',
    title: 'Diaspora shopping',
    icon: Plane,
    items: [
      {
        q: 'Can I shop on BigDrop for family in Kenya from abroad?',
        a: 'Yes. BigDrop is built for exactly this — order online from anywhere in the world and have it delivered to your family or friends anywhere in Kenya, with tracking every step of the way.',
      },
      {
        q: 'Can I pay from outside Kenya?',
        a: 'Pay with M-Pesa if you have a Kenyan line (Paybill 862294). Card checkout is coming soon.',
      },
      {
        q: 'Will the recipient be updated on delivery?',
        a: 'Yes — the recipient\'s phone number can be added to shipping details so our rider can call ahead and confirm the delivery in person.',
      },
    ],
  },
];

const groupsSw = [
  {
    id: 'fulfillment',
    title: 'Fulfillment na ghala',
    icon: Package,
    items: [
      {
        q: 'BigDrop inafanya nini kwa wauzaji?',
        a: 'BigDrop, inayoendeshwa na Globeflight Kenya, huhifadhi stoki yako kwenye ghala la NextGen Mall, inachukua na kufunga kila oda, na kuitoa nchini kote — ili uuzie bila kujishughulisha na usafirishaji.',
      },
      {
        q: 'Ninawezaje kutuma stoki kwenye ghala?',
        a: 'Leta stoki kwenye kituo chetu cha NextGen Mall, Mombasa Road, au panga ukusanyaji na timu yetu. Baada ya kupokelewa, stoki yako inaingizwa kwenye mfumo kwa kiwango cha SKU.',
      },
      {
        q: 'Naweza kuona kiwango cha stoki wakati wowote?',
        a: 'Ndiyo. Dashibodi ya muuzaji inaonyesha hesabu hai, arifa za stoki kidogo, na historia ya oda kwa kila bidhaa.',
      },
    ],
  },
  {
    id: 'selling',
    title: 'Kuuza kwenye BigDrop',
    icon: Store,
    items: [
      {
        q: 'Nani anaweza kuuza kwenye BigDrop?',
        a: 'Wauzaji binafsi wa Facebook, Instagram na TikTok, biashara ndogo, na makampuni makubwa wanakaribishwa. Kila akaunti ya muuzaji inahitaji idhini ya msimamizi kabla bidhaa ziende moja kwa moja.',
      },
      {
        q: 'Idhini ya muuzaji inachukua muda gani?',
        a: 'Timu yetu hukagua maombi haraka — kwa kawaida ndani ya siku moja ya kazi. Utajulishwa duka lako likiidhinishwa ili uanze kuorodhesha bidhaa.',
      },
      {
        q: 'Je, nahitaji tovuti yangu ili kuuza?',
        a: 'Hapana. BigDrop inakupa duka la soko mara moja. Unaweza pia kuunganisha kurasa zako za kijamii kupeleka wateja kwenye orodha zako.',
      },
      {
        q: 'Kuna msaada gani wa kujiunga?',
        a: 'Wauzaji wapya hupata mafunzo ya dashibodi ya ERP, pamoja na mtaalamu anayeongoza orodha na oda zako za kwanza.',
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Usafirishaji na ufuatiliaji',
    icon: Truck,
    items: [
      {
        q: 'Oda yangu inatolewaje?',
        a: 'Baada ya kuchukuliwa na kufungwa, oda zinakabidhiwa wapanda farasi wa Globeflight kwa usafirishaji mlangoni nchini kote. Rider atakupigia kabla ya kutoa.',
      },
      {
        q: 'Ninafuatiliaje oda yangu?',
        a: 'Tumia nambari ya oda au nambari ya ufuatiliaji ya Globeflight kwenye ukurasa wa Fuatilia kuona hali — kutoka kuchukua hadi nje kwa uwasilishaji.',
      },
      {
        q: 'Je, usafirishaji ni bure?',
        a: 'Ada ya usafirishaji inaonyeshwa kwenye malipo. Kuchukua NextGen Mall, orofa ya 3, Suite 40 ni bure.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Malipo',
    icon: CreditCard,
    items: [
      {
        q: 'Njia gani za malipo zinakubaliwa?',
        a: 'Lipa kwa M-Pesa kwenye malipo. Lipa na M-Pesa Paybill 862294. Kama STK haionekani, lipa till hiyo mwenyewe. Kadi inakuja hivi karibuni. Cash on delivery inapatikana tu BigDrop ikiiwasha.',
      },
      {
        q: 'Wauzaji wanalipwa lini?',
        a: 'Malipo ya wauzaji hufanywa kwa ratiba baada ya oda kuwekwa kama zimetolewa, ukiondoa ada za fulfillment za BigDrop.',
      },
      {
        q: 'Je, taarifa yangu ya malipo ni salama?',
        a: 'Ndiyo. Shughuli zote hupitia njia salama zilizosimbwa, na ukaguzi wa udanganyifu kwenye kila oda.',
      },
    ],
  },
  {
    id: 'diaspora',
    title: 'Ununuzi wa diaspora',
    icon: Plane,
    items: [
      {
        q: 'Naweza kununua kwenye BigDrop kwa familia nchini Kenya nikiwa nje?',
        a: 'Ndiyo. BigDrop imejengwa kwa hilo — agiza mtandaoni kutoka popote duniani na itolewe kwa familia au marafiki popote Kenya, ukifuatilia kila hatua.',
      },
      {
        q: 'Naweza kulipa nikiwa nje ya Kenya?',
        a: 'Lipa kwa M-Pesa ukiwa na nambari ya Kenya (Paybill 862294). Malipo ya kadi yanakuja hivi karibuni.',
      },
      {
        q: 'Mpokeaji atasasishwa kuhusu uwasilishaji?',
        a: 'Ndiyo — nambari ya simu ya mpokeaji inaweza kuongezwa kwenye maelezo ya usafirishaji ili rider apigie simu na kuthibitisha uwasilishaji.',
      },
    ],
  },
];

function AccordionItem({ q, a, open, onToggle }) {
  return (
    <div className="border-b border-ink/5 last:border-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm md:text-base font-medium">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-leaf transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-4 text-sm text-ink-mute leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq({ hideHero = false }) {
  const [openKey, setOpenKey] = useState('fulfillment-0');
  const [cmsFaqs, setCmsFaqs] = useState(null);
  const { t, lang } = useLang();

  useEffect(() => {
    api
      .get('/site')
      .then((d) => {
        const list = d.site?.faqs;
        if (Array.isArray(list) && list.length) setCmsFaqs(list);
      })
      .catch(() => {});
  }, []);

  const iconMap = { fulfillment: Package, selling: Store, delivery: Truck, payments: CreditCard, diaspora: Plane };
  const hardcoded = lang === 'sw' ? groupsSw : groups;
  const activeGroups =
    cmsFaqs?.length && lang !== 'sw'
      ? cmsFaqs.map((g) => ({ ...g, icon: iconMap[g.id] || Package }))
      : hardcoded;

  return (
    <div>
      {!hideHero && (
      <PageHero
        crumbs={[{ label: t('helpCenter') }]}
        title={t('helpTitle')}
        subtitle={t('faqHeroSub')}
      />
      )}

      <div className="mx-auto max-w-4xl px-4 py-14 md:px-6">
        <div className="space-y-10">
          {activeGroups.map((group) => (
            <div key={group.id}>
              <div className="mb-4 flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-leaf-pale text-leaf">
                  <group.icon className="h-5 w-5" />
                </div>
                <h2 className="font-display text-xl font-bold">{group.title}</h2>
              </div>
              <div className="rounded-2xl border border-ink/5 bg-white px-5 shadow-lift">
                {group.items.map((item, idx) => {
                  const key = `${group.id}-${idx}`;
                  return (
                    <AccordionItem
                      key={key}
                      q={item.q}
                      a={item.a}
                      open={openKey === key}
                      onToggle={() => setOpenKey(openKey === key ? '' : key)}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-ink text-white p-6 md:p-8 shadow-lift text-center">
          <p className="font-display text-xl font-bold">{t('faqStillQ')}</p>
          <p className="mt-2 text-sm text-white/70">{t('faqStillA')}</p>
          <a
            href="mailto:orders@bigdrop.co.ke"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-ember px-6 py-3 text-sm font-semibold hover:bg-ember-deep"
          >
            {t('faqContact')}
          </a>
        </div>
      </div>
    </div>
  );
}
