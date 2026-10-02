import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { applyShopMeta, defersOwnMeta, pageMetaOwns, SITE_TITLE, SITE_DESCRIPTION } from '../lib/pageMeta';

function setMeta(attr, key, value) {
  if (!value) return;
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

export default function TrackingScripts({ site }) {
  const location = useLocation();
  const ga = String(site?.gaId || '').trim();
  const pixel = String(site?.metaPixelId || '').replace(/\D/g, '');
  const gsc = String(site?.gscVerification || '').trim();

  useEffect(() => {
    // Only fall back to the shop-wide head when the current page hasn't claimed it via
    // applyPageMeta (which stamps its pathname). This effect re-runs whenever the site
    // config finishes loading (gsc changes) — without the ownership check, that late
    // re-run would wipe a product/article head the page just wrote back to the generic
    // shop title/description.
    if (!pageMetaOwns(location.pathname) && !defersOwnMeta(location.pathname)) applyShopMeta();
    if (gsc) setMeta('name', 'google-site-verification', gsc);
  }, [gsc, location.pathname]);

  useEffect(() => {
    if (!ga || !/^G-[A-Z0-9]+$/i.test(ga)) return undefined;
    if (!document.getElementById('bd-ga')) {
      const s = document.createElement('script');
      s.id = 'bd-ga';
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      function gtag() {
        window.dataLayer.push(arguments);
      }
      window.gtag = gtag;
      gtag('js', new Date());
    }
    if (typeof window.gtag === 'function') {
      window.gtag('config', ga, {
        page_path: `${location.pathname}${location.search}`,
        page_title: document.title,
      });
    }
    return undefined;
  }, [ga, location.pathname, location.search]);

  useEffect(() => {
    if (!pixel || document.getElementById('bd-pixel')) return undefined;
    const s = document.createElement('script');
    s.id = 'bd-pixel';
    s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');fbq('init','${pixel.replace(/'/g, '')}');fbq('track','PageView');`;
    document.head.appendChild(s);
    return undefined;
  }, [pixel]);

  return null;
}

export { SITE_TITLE, SITE_DESCRIPTION };
