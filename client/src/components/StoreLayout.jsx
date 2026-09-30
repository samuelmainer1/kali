import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Search,
  ShoppingCart,
  User,
  Heart,
  Menu,
  X,
  Package,
  LogOut,
  Truck,
  Moon,
  Sun,
  MapPin,
  Globe,
  HelpCircle,
  Facebook,
  Twitter,
  Linkedin,
  Youtube,
  Instagram,
  Phone,
  Mail,
  Store,
  GitCompareArrows,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCompare } from '../context/CompareContext';
import { useUI } from '../context/UIContext';
import { useLang } from '../context/LangContext';
import { api } from '../lib/api';
import MiniCart from './MiniCart';
import QuickView from './QuickView';
import CookieNotice from './CookieNotice';
import BackToTop from './BackToTop';
import CategoryNav from './CategoryNav';
import AuthDialog from './AuthDialog';
import SearchSuggest from './SearchSuggest';
import WhatsAppWidget from './WhatsAppWidget';
import TrackingScripts, { SITE_TITLE } from './TrackingScripts';
import CmsLink from './CmsLink';
import ChangePasswordForm from './ChangePasswordForm';

function TikTokIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.13 1.78 2.89 2.89 0 0 1 2.26-4.67c.28 0 .54.04.79.12V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 1 0 6.34 6.34V8.77a8.28 8.28 0 0 0 4.75 1.55V6.87a4.84 4.84 0 0 1-1.19-.18Z" />
    </svg>
  );
}

export default function StoreLayout() {
  const { user, logout, updateUser } = useAuth();
  const { count } = useCart();
  const { count: compareCount, items: compareItems, removeItem: removeCompareItem } = useCompare();
  const { openMiniCart, openAuth } = useUI();
  const { t, toggleLang, label: langLabel } = useLang();
  const [q, setQ] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [wishCount, setWishCount] = useState(0);
  const [nlEmail, setNlEmail] = useState('');
  const [nlMsg, setNlMsg] = useState('');
  const [nlLoading, setNlLoading] = useState(false);
  const [site, setSite] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const dashboardHref =
    user?.role === 'admin' || user?.role === 'vendor' ? '/dashboard' : '/account';

  const sitePhone = site?.phone || '+254 722 359 298';
  const sitePhoneHref = `tel:${String(sitePhone).replace(/\s/g, '')}`;
  const siteEmails = site?.emails?.length ? site.emails : ['info@bigdrop.co.ke', 'orders@bigdrop.co.ke'];
  const siteAddress = site?.address || 'NextGen Mall, Mombasa Road, 3rd Floor, Suite 40, Nairobi';
  const siteLogo = site?.logo || '/logo-header.png';
  const socials = site?.socials || {};
  const bfEnabled = site?.blackFriday?.enabled !== false;
  const bfTitle = site?.blackFriday?.title || t('blackFriday');
  const announcement = site?.announcement;
  const headerLinks = site?.menus?.header?.length
    ? site.menus.header
    : [
        { id: 'h_sell', label: t('sellOnBigDrop'), href: '/sell', topbar: true },
        { id: 'h_help', label: t('helpCenter'), href: '/help', topbar: true },
        { id: 'h_shop', label: t('shop'), href: '/shop', topbar: false },
        { id: 'h_about', label: t('about'), href: '/about', topbar: false },
        { id: 'h_blog', label: t('blog'), href: '/blog', topbar: false },
        { id: 'h_contact', label: t('contact'), href: '/contact', topbar: false },
      ];
  const topbarLinks = headerLinks.filter((l) => l.topbar);
  const footerColumns = site?.menus?.footer;
  const footerLegal = site?.menus?.footerLegal;

  function menuHref(href) {
    if (href === '/sell' && user && (user.role === 'vendor' || user.role === 'admin')) return '/dashboard';
    return href;
  }

  function menuLabel(href, label) {
    if (href === '/sell' && user && (user.role === 'vendor' || user.role === 'admin')) return t('vendorDashboard');
    return label;
  }

  useEffect(() => {
    function loadSite() {
      api.get('/site').then((d) => setSite(d.site || null)).catch(() => {});
    }
    loadSite();
    window.addEventListener('bd-site-updated', loadSite);
    return () => window.removeEventListener('bd-site-updated', loadSite);
  }, [location.pathname]);

  useEffect(() => {
    if (!site?.favicon) return;
    let link = document.querySelector("link[rel='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = site.favicon;
  }, [site?.favicon]);

  useEffect(() => {
    const saved = localStorage.getItem('bd-dark-mode') === '1';
    setDark(saved);
    document.documentElement.classList.toggle('dark-mode', saved);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setMobileSearchOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (!user) {
      setWishCount(0);
      return;
    }
    api
      .get('/wishlist')
      .then((d) => setWishCount((d.products || d.items || []).length))
      .catch(() => setWishCount(0));
  }, [user, location.pathname]);

  function toggleDark() {
    setDark((prev) => {
      const next = !prev;
      document.documentElement.classList.toggle('dark-mode', next);
      localStorage.setItem('bd-dark-mode', next ? '1' : '0');
      return next;
    });
  }

  function onSearch(e) {
    e.preventDefault();
    navigate(q.trim() ? `/shop?q=${encodeURIComponent(q.trim())}` : '/shop');
    setMenuOpen(false);
    setMobileSearchOpen(false);
  }

  async function onFooterNewsletter(e) {
    e.preventDefault();
    if (!nlEmail.trim()) return;
    setNlLoading(true);
    setNlMsg('');
    try {
      await api.post('/newsletter', { email: nlEmail.trim() });
      setNlMsg(t('subscribed'));
      setNlEmail('');
    } catch {
      setNlMsg(t('newsletterThanks'));
      setNlEmail('');
    } finally {
      setNlLoading(false);
    }
  }

  return (
    <div className="bd-site">
      {user?.mustChangePassword ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg">
            <ChangePasswordForm
              required
              onSuccess={(next) => updateUser(next || { mustChangePassword: false })}
            />
            <button type="button" onClick={logout} className="mt-3 w-full text-sm text-white/80 hover:text-white">
              Sign out
            </button>
          </div>
        </div>
      ) : null}
      {announcement?.enabled && announcement.text ? (
        <div className="bd-announce">
          {announcement.href ? (
            <CmsLink href={announcement.href}>{announcement.text}</CmsLink>
          ) : (
            announcement.text
          )}
        </div>
      ) : null}
      <div className="bg-gray-800 text-white text-xs">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between min-h-8 py-1 gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-wrap">
            <a href={sitePhoneHref} className="bd-topbar-phone">
              <Phone size={12} />
              {sitePhone}
            </a>
            <a href="mailto:orders@bigdrop.co.ke" className="bd-topbar-email">
              <Mail size={12} />
              orders@bigdrop.co.ke
            </a>
            <span className="bd-topbar-address">
              <MapPin size={12} />
              Nextgen Mall, 3rd Floor, Suite 40.
            </span>
          </div>
          <div className="flex items-center gap-3 md:gap-4 overflow-x-auto scrollbar-hide">
            {topbarLinks.map((item) => (
              <CmsLink
                key={item.id || item.href}
                href={menuHref(item.href)}
                className="flex items-center gap-1 hover:text-orange-300 transition-colors whitespace-nowrap"
              >
                {item.href === '/help' ? <HelpCircle size={12} /> : null}
                {menuLabel(item.href, item.label)}
              </CmsLink>
            ))}
            {bfEnabled && (
              <Link to="/black-friday" className="flex items-center gap-1 hover:text-orange-300 transition-colors whitespace-nowrap font-semibold text-orange-300">
                {bfTitle}
              </Link>
            )}
            <button
              type="button"
              onClick={toggleDark}
              className="flex items-center hover:text-orange-300"
              title={dark ? t('lightMode') : t('darkMode')}
              aria-label={dark ? t('switchLight') : t('switchDark')}
            >
              {dark ? <Sun size={12} /> : <Moon size={12} />}
            </button>
            <button
              type="button"
              onClick={toggleLang}
              className="flex items-center gap-1 hover:text-orange-300 transition-colors shrink-0"
            >
              <Globe size={12} />
              {langLabel}
            </button>
          </div>
        </div>
      </div>

      <header className="bd-orange-header">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-14 md:h-16 gap-3">
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              className="bd-mobile-menu-btn text-white p-1"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <Link to="/" className="flex items-center shrink-0 bg-white rounded-md px-2 py-1 h-9 md:h-10" title={SITE_TITLE} aria-label={SITE_TITLE}>
              <img src={siteLogo} alt="BigDrop Kenya" className="h-7 md:h-8 w-auto object-contain" />
            </Link>
          </div>

          <form onSubmit={onSearch} className="bd-desktop-search relative">
            <div className="flex w-full relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('searchPlaceholder')}
                aria-label={t('search')}
                className="flex-1 rounded-l-md rounded-r-none border-0 h-10 bg-white/95 px-3 text-sm text-gray-800 outline-none"
                autoComplete="off"
              />
              <button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 rounded-r-md h-10 px-5 text-white"
                aria-label="Search"
              >
                <Search size={16} />
              </button>
              <SearchSuggest q={q} onPick={() => setQ('')} />
            </div>
          </form>

          <button
            type="button"
            className="bd-mobile-search-btn text-white p-1 ml-auto"
            onClick={() => setMobileSearchOpen((v) => !v)}
            aria-label="Search"
          >
            {mobileSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          <div className="flex items-center gap-1 md:gap-2 shrink-0">
            <Link
              to="/track"
              className="bd-header-action-label text-white hover:text-orange-100 transition-colors px-1.5 py-1"
              aria-label={t('trackOrder')}
            >
              <Truck size={20} />
              <span className="text-[10px]">{t('track')}</span>
            </Link>

            {compareCount > 0 && (
              <Link
                to="/compare"
                className="bd-header-action-label text-white hover:text-orange-100 transition-colors px-1.5 py-1 relative"
                aria-label="Compare"
              >
                <GitCompareArrows size={20} />
                <span className="absolute -top-0.5 -right-0.5 h-3.5 w-3.5 flex items-center justify-center bg-blue-500 text-[9px] rounded-full">
                  {compareCount}
                </span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => openAuth(user ? 'login' : 'login')}
              className="bd-header-action-label text-white hover:text-orange-100 transition-colors px-1.5 py-1"
              aria-label={user ? t('account') : t('loginRegister')}
            >
              <User size={20} />
              <span className="text-[10px]">{user ? user.name?.split(' ')[0] || t('account') : t('account')}</span>
            </button>

            <Link
              to={user ? '/wishlist' : '#'}
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  openAuth();
                }
              }}
              className="relative text-white hover:text-orange-100 transition-colors p-1"
              aria-label="Wishlist"
            >
              <Heart size={20} />
              {wishCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-red-500 text-[10px] rounded-full">
                  {wishCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={openMiniCart}
              className="relative text-white hover:text-orange-100 transition-colors p-1"
              aria-label="Cart"
            >
              <ShoppingCart size={20} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center bg-red-500 text-[10px] rounded-full">
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3">
            <form onSubmit={onSearch} className="flex relative">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t('searchProducts')}
                className="flex-1 rounded-l-md border-0 h-9 bg-white/95 px-3 text-sm text-gray-800 outline-none"
                autoFocus
                autoComplete="off"
              />
              <button type="submit" className="bg-amber-600 hover:bg-amber-700 rounded-r-md h-9 px-4 text-white">
                <Search size={16} />
              </button>
              <SearchSuggest
                q={q}
                onPick={() => {
                  setQ('');
                  setMobileSearchOpen(false);
                }}
              />
            </form>
          </div>
        )}

        {menuOpen && (
          <div className="md:hidden bg-[#015837] border-t border-[#01472c]">
            <div className="px-4 py-3 space-y-1">
              {user ? (
                <>
                  <button type="button" onClick={() => { setMenuOpen(false); openAuth(); }} className="flex items-center gap-3 text-white w-full py-2">
                    <User size={20} />
                    <span>{user.name}</span>
                  </button>
                  <Link to={dashboardHref} className="flex items-center gap-3 text-white w-full py-2">
                    <Package size={20} />
                    <span>{user.role === 'vendor' || user.role === 'admin' ? t('dashboard') : t('myOrders')}</span>
                  </Link>
                </>
              ) : (
                <button type="button" onClick={() => { setMenuOpen(false); openAuth(); }} className="flex items-center gap-3 text-white w-full py-2">
                  <User size={20} />
                  <span>{t('loginRegister')}</span>
                </button>
              )}
              <Link to="/track" className="flex items-center gap-3 text-white w-full py-2">
                <Truck size={20} />
                <span>{t('trackOrder')}</span>
              </Link>
              <Link
                to={user ? '/wishlist' : '#'}
                onClick={(e) => {
                  if (!user) {
                    e.preventDefault();
                    setMenuOpen(false);
                    openAuth();
                  }
                }} className="flex items-center gap-3 text-white w-full py-2">
                <Heart size={20} />
                <span>{t('wishlist')}{wishCount ? ` (${wishCount})` : ''}</span>
              </Link>
              {compareCount > 0 && (
                <Link to="/compare" className="flex items-center gap-3 text-white w-full py-2">
                  <GitCompareArrows size={20} />
                  <span>{t('compare')} ({compareCount})</span>
                </Link>
              )}
              {headerLinks.map((item) => (
                <CmsLink key={`m-${item.id || item.href}`} href={menuHref(item.href)} className="flex items-center gap-3 text-white w-full py-2">
                  {item.href === '/sell' ? <Store size={20} /> : null}
                  {menuLabel(item.href, item.label)}
                </CmsLink>
              ))}
              {bfEnabled && (
                <Link to="/black-friday" className="flex items-center gap-3 text-white w-full py-2">{bfTitle}</Link>
              )}
              <a href={sitePhoneHref} className="flex items-center gap-3 text-white w-full py-2">
                <Phone size={20} />
                {sitePhone}
              </a>
              {user && (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  className="flex items-center gap-3 text-white w-full py-2"
                >
                  <LogOut size={20} />
                  <span>{t('logOut')}</span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <CategoryNav pageLinks={headerLinks.filter((l) => !l.topbar)} />

      <div className="flex-1">
        <Outlet context={{ site }} />
      </div>

      <MiniCart />
      <QuickView />
      <AuthDialog />

      {compareCount > 0 && (
        <div className="bd-compare-bar">
          <div className="bd-compare-bar-inner">
            <div className="bd-compare-bar-items">
              {compareItems.map((p) => (
                <div key={p.id} className="bd-compare-bar-item">
                  <img src={p.images?.[0]} alt={p.name} />
                  <button type="button" onClick={() => removeCompareItem(p.id)} aria-label={`Remove ${p.name}`}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
            <Link to="/compare" className="bd-compare-bar-link">
              Compare ({compareCount})
            </Link>
          </div>
        </div>
      )}

      <CookieNotice text={site?.cookieText} />
      <BackToTop />
      <TrackingScripts site={site} />

      <footer className="bg-gray-900 text-gray-300 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
            <div>
              <Link to="/" className="inline-flex items-center bg-white rounded-md px-2 py-1 mb-3" title={SITE_TITLE} aria-label={SITE_TITLE}>
                <img src={siteLogo} alt="BigDrop Kenya" className="h-8 w-auto object-contain" />
              </Link>
              <p className="text-sm text-gray-400 mb-4">
                {site?.footerBlurb || t('footerBlurb')}
              </p>
              <p className="text-sm text-gray-400 mb-4">
                {siteAddress}
                <br />
                <a href={sitePhoneHref} className="hover:text-orange-400">{sitePhone}</a>
                <br />
                {siteEmails.map((em) => (
                  <span key={em}>
                    <a href={`mailto:${em}`} className="hover:text-orange-400">{em}</a>
                    <br />
                  </span>
                ))}
              </p>
              <div className="flex gap-3">
                {[
                  socials.facebook && { href: socials.facebook, label: 'Facebook', Icon: Facebook },
                  socials.instagram && { href: socials.instagram, label: 'Instagram', Icon: Instagram },
                  socials.twitter && { href: socials.twitter, label: 'X', Icon: Twitter },
                  socials.linkedin && { href: socials.linkedin, label: 'LinkedIn', Icon: Linkedin },
                  socials.youtube && { href: socials.youtube, label: 'YouTube', Icon: Youtube },
                  socials.tiktok && { href: socials.tiktok, label: 'TikTok', Icon: TikTokIcon },
                ]
                  .filter(Boolean)
                  .map(({ href, label, Icon }) => (
                    <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-400" aria-label={label}>
                      <Icon size={20} />
                    </a>
                  ))}
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">{footerColumns?.[0]?.title || t('company')}</h3>
              <ul className="space-y-2 text-sm">
                {(footerColumns?.[0]?.links || [
                  { href: '/about', label: t('aboutUs') },
                  { href: '/contact', label: t('contactUs') },
                  { href: '/careers', label: t('careers') },
                  { href: '/blog', label: t('blog') },
                  { href: '/track', label: t('trackOrder') },
                  { href: '/help', label: t('helpCenter') },
                ]).map((item) => (
                  <li key={item.id || item.href}>
                    <CmsLink href={menuHref(item.href)} className="hover:text-orange-400">
                      {menuLabel(item.href, item.label)}
                    </CmsLink>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-3">{footerColumns?.[1]?.title || t('customerService')}</h3>
              <ul className="space-y-2 text-sm">
                {(footerColumns?.[1]?.links || [
                  { href: '/help', label: t('helpCenter') },
                  { href: '/returns', label: t('returnsRefunds') },
                  { href: '/fulfillment', label: t('shippingInfo') },
                  { href: '/privacy', label: t('privacyPolicy') },
                  { href: '/terms', label: t('terms') },
                  { href: '/shop', label: t('shop') },
                  { href: '/deals', label: t('deals') },
                  { href: '/brands', label: t('brands') },
                  { href: '/wishlist', label: t('wishlist') },
                  { href: '/compare', label: t('compare') },
                ]).map((item) => (
                  <li key={item.id || item.href}>
                    <CmsLink href={item.href} className="hover:text-orange-400">
                      {item.label}
                    </CmsLink>
                  </li>
                ))}
                {bfEnabled && !(footerColumns?.[1]?.links || []).some((l) => l.href === '/black-friday') && (
                  <li><Link to="/black-friday" className="hover:text-orange-400">{bfTitle}</Link></li>
                )}
              </ul>
            </div>

            <div className="sm:col-span-2 lg:col-span-2">
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-white font-semibold mb-3">{footerColumns?.[2]?.title || t('sellOnBigDrop')}</h3>
                  <ul className="space-y-2 text-sm">
                    {(footerColumns?.[2]?.links || [
                      { href: '/vendors', label: t('vendorShops') },
                      { href: '/sell', label: user && (user.role === 'vendor' || user.role === 'admin') ? t('vendorDashboard') : t('becomeVendor') },
                      { href: '/sell#benefits', label: t('vendorBenefits') },
                      { href: '/sell#commission', label: t('commission') },
                      { href: '/sell#guidelines', label: t('sellerGuidelines') },
                    ]).map((item) => (
                      <li key={item.id || item.href}>
                        <CmsLink href={menuHref(item.href)} className="flex items-center gap-2 hover:text-orange-400">
                          {item.href === '/sell' ? <Store size={16} /> : null}
                          {menuLabel(item.href, item.label)}
                        </CmsLink>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="text-white font-semibold mb-3">{t('contact')}</h3>
                  <ul className="space-y-3 text-sm">
                    <li className="flex items-start gap-2">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-orange-400" />
                      <span>{siteAddress.replace(', Kenya', '').split(',').slice(0, 2).join(',') || 'NextGen Mall, Suite 40'}<br />Nairobi, Kenya</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Phone size={16} className="shrink-0 text-orange-400" />
                      <a href={sitePhoneHref}>{sitePhone}</a>
                    </li>
                    {siteEmails.map((em) => (
                      <li key={em} className="flex items-center gap-2">
                        <Mail size={16} className="shrink-0 text-orange-400" />
                        <a href={`mailto:${em}`}>{em}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="mt-6">
                <h3 className="text-white font-semibold mb-2">{t('newsletter')}</h3>
                <p className="text-sm text-gray-400 mb-3">{t('newsletterHint')}</p>
                <form onSubmit={onFooterNewsletter} className="flex flex-col sm:flex-row gap-2 max-w-md">
                  <input
                    type="email"
                    required
                    placeholder={t('enterEmail')}
                    value={nlEmail}
                    onChange={(e) => setNlEmail(e.target.value)}
                    className="flex-1 border border-gray-600 bg-gray-800 text-white rounded-md px-3 h-10 text-sm outline-none focus:border-orange-500"
                    aria-label="Newsletter email"
                  />
                  <button
                    type="submit"
                    disabled={nlLoading}
                    className="bg-orange-500 hover:bg-orange-600 text-white shrink-0 rounded-md px-4 h-10 text-sm font-semibold"
                  >
                    {t('subscribe')}
                  </button>
                </form>
                {nlMsg && <p className="text-orange-400 text-sm mt-2">{nlMsg}</p>}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 my-8" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>
              {site?.copyright || (
                <>
                  &copy; {new Date().getFullYear()} BigDrop Kenya. {t('rights')} {t('poweredBy')}{' '}
                  <a
                    href="https://www.globeflight.co.ke"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-orange-400 underline-offset-2 hover:underline"
                  >
                    Globeflight Kenya
                  </a>
                  .
                </>
              )}
            </p>
            <div className="flex items-center gap-3 flex-wrap justify-center">
              {(footerLegal || [
                { href: '/privacy', label: t('privacy') },
                { href: '/terms', label: t('terms') },
                { href: '/returns', label: t('returns') },
              ]).map((item, i, arr) => (
                <span key={item.id || item.href} className="contents">
                  <CmsLink href={item.href} className="hover:text-orange-400">
                    {item.label}
                  </CmsLink>
                  {i < arr.length - 1 ? <span>|</span> : null}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="px-2 py-1 bg-green-600 text-white rounded text-xs font-semibold">M-Pesa</span>
              <span className="px-2 py-1 bg-white text-[#015837] rounded text-xs font-semibold">
                Till {site?.payments?.paybill || site?.paybill || '862294'}
              </span>
              <span className="px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold">Visa</span>
              <span className="px-2 py-1 bg-red-600 text-white rounded text-xs font-semibold">Mastercard</span>
            </div>
          </div>
        </div>
      </footer>
      <WhatsAppWidget number={site?.whatsapp} />
    </div>
  );
}
