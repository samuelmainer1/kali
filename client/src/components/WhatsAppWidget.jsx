import { MessageCircle } from 'lucide-react';
import { waLink } from '../lib/whatsapp';

export default function WhatsAppWidget({ number }) {
  return (
    <a
      href={waLink('Hi BigDrop, I need help with an order.', number)}
      target="_blank"
      rel="noreferrer"
      className="bd-whatsapp-widget"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={22} />
      <span className="bd-whatsapp-widget-label">WhatsApp help</span>
    </a>
  );
}
