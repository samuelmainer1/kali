import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../lib/api';

const FALLBACK = [
  {
    id: 'f1',
    name: 'Amily Moalin',
    role: 'Customer',
    quote: 'Products are genuine, delivery was faster than expected, and the team kept me updated.',
    image: '/avatars/f1.svg',
  },
  {
    id: 'f2',
    name: 'Grace Wanjiku',
    role: 'Customer',
    quote: 'I shop from abroad and BigDrop makes sending gifts home effortless. M-Pesa checkout is smooth.',
    image: '/avatars/f2.svg',
  },
  {
    id: 'f3',
    name: 'Brian Otieno',
    role: 'Customer',
    quote: 'Great prices on phones and electronics. Globeflight delivered to Kisumu in two days.',
    image: '/avatars/f3.svg',
  },
  {
    id: 'f4',
    name: 'Enagol Ame',
    role: 'Vendor',
    quote: 'Partnering with BigDrop has been smooth and rewarding. Clear communication and professionalism.',
    image: '/avatars/f4.svg',
  },
  {
    id: 'f5',
    name: 'John Mwangi',
    role: 'Vendor',
    quote: 'Reliable warehousing and nationwide delivery — I focus on selling while Globeflight handles the rest.',
    image: '/avatars/f5.svg',
  },
];

function avatarFor(t) {
  if (t.image) return t.image;
  return '/placeholder-product.svg';
}

export default function TestimonialsCarousel() {
  const [apiItems, setApiItems] = useState([]);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    api
      .get('/site')
      .then((d) => setApiItems(d.testimonials || []))
      .catch(() => {});
  }, []);

  const items = useMemo(() => {
    if (apiItems.length) return apiItems;
    return FALLBACK;
  }, [apiItems]);

  useEffect(() => {
    if (items.length <= 3) return undefined;
    const t = setInterval(() => setSlide((s) => (s + 1) % items.length), 5500);
    return () => clearInterval(t);
  }, [items.length]);

  if (items.length === 0) return null;

  const visible = [0, 1, 2].map((offset) => items[(slide + offset) % items.length]);

  function prev() {
    setSlide((s) => (s - 1 + items.length) % items.length);
  }
  function next() {
    setSlide((s) => (s + 1) % items.length);
  }

  return (
    <section className="bd-testimonials">
      <div className="section-title">
        <h2>Loved by shoppers &amp; vendors alike</h2>
      </div>

      <div className="bd-testimonials-pro">
        <button type="button" className="bd-testimonials-arrow prev" onClick={prev} aria-label="Previous">
          <ChevronLeft size={22} />
        </button>

        <div className="bd-testimonials-track">
          {visible.map((t, i) => (
            <article key={`${t.id || t.name}-${slide}-${i}`} className="bd-testimonial-card">
              <img
                src={avatarFor(t)}
                alt={t.name}
                className="bd-testimonial-avatar"
                                onError={(e) => {
                  e.currentTarget.src = '/placeholder-product.svg';
                  e.currentTarget.onerror = null;
                }}
              />
              <p className="bd-testimonial-quote">&ldquo;{t.quote}&rdquo;</p>
              <footer>
                <strong>{t.name}</strong>
                <span>{t.role}</span>
              </footer>
            </article>
          ))}
        </div>

        <button type="button" className="bd-testimonials-arrow next" onClick={next} aria-label="Next">
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="bd-testimonials-dots">
        {items.map((t, i) => (
          <button
            key={t.id || t.name}
            type="button"
            className={i === slide ? 'active' : ''}
            onClick={() => setSlide(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
