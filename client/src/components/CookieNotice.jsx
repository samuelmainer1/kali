import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLang } from '../context/LangContext';

const STORAGE_KEY = 'bd_cookies';

export default function CookieNotice({ text }) {
  const [visible, setVisible] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) !== '1') {
      setVisible(true);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="bd-cookie-notice" role="dialog" aria-label="Cookie notice">
      <p>
        {text || t('cookies')}{' '}
        <Link to="/privacy">{t('learnMore')}</Link>
      </p>
      <button type="button" onClick={accept}>
        {t('accept')}
      </button>
    </div>
  );
}
