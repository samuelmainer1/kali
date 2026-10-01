import PageHero from '../components/PageHero';

const sections = [
  {
    title: '1. Introduction',
    body: `BigDrop Kenya ("BigDrop", "we", "us") is a marketplace and fulfillment service operated by Globeflight Worldwide Express Ltd. This Privacy Policy explains how we collect, use, and protect information belonging to shoppers, vendors, and website visitors.`,
  },
  {
    title: '2. Information we collect',
    body: `We collect information you provide directly — such as your name, email, phone number, delivery address, and payment details — when you create an account, place an order (including guest checkout), apply as a vendor, or contact us. We also collect order history, wishlist activity, and basic usage data to improve the platform.`,
  },
  {
    title: '3. How we use your information',
    body: `We use your information to process orders, manage vendor applications and approvals, coordinate Globeflight pick, pack, and delivery, provide customer support, send order and account notifications, and improve our products and services.`,
  },
  {
    title: '4. Sharing of information',
    body: `We share order details with the vendor fulfilling your order and with Globeflight logistics teams for delivery purposes only. We do not sell your personal information to third parties. Limited data may be shared with payment processors to complete transactions securely.`,
  },
  {
    title: '5. Vendor data',
    body: `Vendors provide business information such as store name, contact details, and product listings. This information is reviewed by BigDrop admins as part of the approval process and is used to display your storefront to shoppers once approved.`,
  },
  {
    title: '6. Data security',
    body: `We apply reasonable technical and organizational measures — including encrypted payment channels and access-controlled systems — to protect your information from unauthorized access, loss, or misuse.`,
  },
  {
    title: '7. Data retention',
    body: `We retain account, order, and transaction records for as long as necessary to provide our services, comply with legal obligations, resolve disputes, and enforce our agreements.`,
  },
  {
    title: '8. Your rights',
    body: `You may access, update, or request deletion of your personal information by contacting our support team. You may also close your account at any time; some order records may be retained as required by law.`,
  },
  {
    title: '9. Cookies',
    body: `Our website may use cookies and similar technologies to keep you signed in, remember your cart, and understand how the site is used, so we can improve your experience.`,
  },
  {
    title: '10. Changes to this policy',
    body: `We may update this Privacy Policy from time to time. Continued use of BigDrop after changes are posted constitutes acceptance of the revised policy.`,
  },
  {
    title: '11. Contact us',
    body: `For any privacy-related questions, reach out to us at info@bigdrop.co.ke or orders@bigdrop.co.ke, or call +254 722 359 298. Our office is at NextGen Mall, Mombasa Road, 3rd Floor Suite No. 39/40, Nairobi.`,
  },
];

export default function Privacy() {
  return (
    <div>
      <PageHero
        crumbs={[{ label: 'Privacy Policy' }]}
        title="Privacy Policy"
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
