import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Always start at the top when navigating to a new page */
export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search]);

  return null;
}
