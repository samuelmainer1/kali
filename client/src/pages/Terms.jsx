import PageHero from '../components/PageHero';

const sections = [
  {
    title: '1. Acceptance of terms',
    body: 'By accessing or using BigDrop Kenya, you agree to these Terms of Service. If you do not agree, please do not use our marketplace or fulfillment services.',
  },
  {
    title: '2. Marketplace services',
    body: 'BigDrop provides an online marketplace where vendors list products and customers place orders. Product descriptions, pricing, and availability are set by vendors and reviewed by BigDrop where applicable.',
  },
  {
    title: '3. Orders and payments',
    body: 'When you place an order, you agree to pay the listed price plus applicable delivery fees. We accept M-Pesa at checkout (Lipa na M-Pesa → Buy Goods and Services, till 862294). Card payments are coming soon. Cash on delivery is only available when BigDrop enables it. All payments are processed securely.',
  },
  {
    title: '4. Delivery and fulfillment',
    body: 'Orders are fulfilled through Globeflight Kenya warehousing and last-mile delivery. Delivery timelines vary by location. BigDrop and Globeflight will make reasonable efforts to deliver within the estimated timeframe.',
  },
  {
    title: '5. Returns and refunds',
    body: 'Returns follow our Returns & Refunds policy. Inspect your parcel on delivery. Report damage, missing items, or unused goods within 24 hours for a replacement or refund. Refunds go to the original payment method within 5–10 business days.',
  },
  {
    title: '6. Vendor obligations',
    body: 'Vendors must provide accurate product listings, maintain adequate stock, and comply with Kenyan consumer protection laws. BigDrop reserves the right to suspend vendors who violate these terms.',
  },
  {
    title: '7. BigDrop Pay Protection',
    body: 'Eligible orders are covered by BigDrop Pay Protection: secure payment handling, the 24-hour inspect-on-delivery return window, and Globeflight delivery assurance. Refunds follow the Returns & Refunds policy.',
  },
  {
    title: '8. Limitation of liability',
    body: 'BigDrop and Globeflight Worldwide Express Ltd are not liable for indirect, incidental, or consequential damages arising from use of the platform, except where prohibited by law.',
  },
  {
    title: '9. Changes to terms',
    body: 'We may update these terms from time to time. Continued use of BigDrop after changes are posted constitutes acceptance of the revised terms.',
  },
  {
    title: '10. Contact',
    body: 'Questions about these terms? Email orders@bigdrop.co.ke or call +254 722 359 298. Our office is at NextGen Mall, Mombasa Road, 3rd Floor Suite No. 39/40, Nairobi.',
  },
];

export default function Terms() {
  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Terms & Conditions' }]}
        title="Terms of Service"
        subtitle="Last updated: August 2026 · BigDrop Kenya, a Globeflight Worldwide Express Ltd product"
      />

      <div className="mx-auto max-w-4xl px-4 py-14 md:px-6">
        <div className="space-y-8 rounded-2xl border border-ink/5 bg-white p-6 md:p-10 shadow-lift">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-display text-lg font-bold">{s.title}</h2>
              <p className="mt-2 text-sm text-ink-mute leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
