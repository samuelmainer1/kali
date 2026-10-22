import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function jumpToTop() {
  const html = document.documentElement;
  const previous = html.style.scrollBehavior;
  html.style.scrollBehavior = 'auto';
  window.scrollTo(0, 0);
  html.scrollTop = 0;
  document.body.scrollTop = 0;
  html.style.scrollBehavior = previous;
}

function revealHash(hash) {
  if (!hash) return false;
  const target = document.getElementById(hash);
  if (!target) return false;
  target.scrollIntoView({ block: 'start' });
  return true;
}

export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const hash = location.hash ? decodeURIComponent(location.hash.slice(1)) : '';

    if (!revealHash(hash)) jumpToTop();

    const retries = [50, 250].map((delay) =>
      window.setTimeout(() => {
        if (!cancelled) revealHash(hash);
      }, delay)
    );

    return () => {
      cancelled = true;
      retries.forEach((id) => window.clearTimeout(id));
    };
  }, [location.pathname, location.search, location.hash, location.key]);

  return null;
}
