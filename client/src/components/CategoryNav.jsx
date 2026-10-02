import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Baby,
  BookOpen,
  Car,
  ChevronDown,
  Dumbbell,
  Flower2,
  Gamepad2,
  Grid3X3,
  Home,
  Laptop,
  Music,
  Heart,
  Pill,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  Tv,
  Utensils,
  Watch,
  Zap,
} from 'lucide-react';
import { api } from '../lib/api';
import { useLang } from '../context/LangContext';
import CmsLink from './CmsLink';

const ICON_MAP = {
  'phone-tablet': Smartphone,
  'computers-laptop': Laptop,
  fashion: Shirt,
  'home-office': Home,
  'beauty-health': Sparkles,
  'food-drinks': Utensils,
  groceries: ShoppingBasket,
  appliances: Tv,
  'tvs-electronics': Tv,
  household: ShoppingBasket,
  gaming: Gamepad2,
  'jewelry-watches': Watch,
  'books-stationery': BookOpen,
  'toys-games': Gamepad2,
  'sports-outdoors': Dumbbell,
  'baby-kids': Baby,
  automobile: Car,
  'pet-care': Heart,
  'garden-diy': Flower2,
  'musical-instruments': Music,
  'power-solar': Zap,
  furniture: Home,
  'wine-spirits': Utensils,
  pharmacy: Pill,
};

const MAIN_LINKS = [
  ['/shop', 'shop'],
  ['/about', 'about'],
  ['/blog', 'blog'],
  ['/contact', 'contact'],
];

function CatIcon({ slug }) {
  const Icon = ICON_MAP[slug] || Grid3X3;
  return <Icon size={16} />;
}

export default function CategoryNav({ pageLinks }) {
  const [categories, setCategories] = useState([]);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const { t } = useLang();

  useEffect(() => {
    api
      .get('/categories')
      .then((d) => setCategories(d.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="bd-cat-nav" ref={dropdownRef}>
      <div className="max-w-7xl mx-auto px-4 flex items-center h-10 gap-1">
        <div
          className="relative"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-800 hover:text-[#015837] transition-colors uppercase tracking-wide"
            aria-expanded={open}
          >
            {t('allCategories')}
            <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && categories.length > 0 && (
            <div className="absolute top-full left-0 bg-white border shadow-lg rounded-b-lg z-50 min-w-[220px] py-2 max-h-[70vh] overflow-y-auto">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  onClick={() => setOpen(false)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-[#015837] transition-colors flex items-center gap-2"
                >
                  <CatIcon slug={cat.slug} />
                  {t(`cat.${cat.slug}`) === `cat.${cat.slug}` ? cat.name : t(`cat.${cat.slug}`)}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-6 bg-gray-300" />

        {(pageLinks?.length
          ? pageLinks.map((item) => ({ to: item.href, label: item.label, key: item.id || item.href }))
          : MAIN_LINKS.map(([to, label]) => ({ to, label: t(label), key: to }))
        ).map((item) => {
          const active = location.pathname === item.to || (item.to !== '/' && String(item.to).startsWith('/') && location.pathname.startsWith(item.to.split('#')[0]));
          return (
            <CmsLink
              key={item.key}
              href={item.to}
              className={`px-3 py-1.5 text-sm font-semibold uppercase tracking-wide whitespace-nowrap transition-colors ${
                active ? 'text-[#015837]' : 'text-gray-800 hover:text-[#015837]'
              }`}
            >
              {item.label}
            </CmsLink>
          );
        })}
      </div>
    </div>
  );
}
