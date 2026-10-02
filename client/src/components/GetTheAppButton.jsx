import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLang } from '../context/LangContext';

function downloadShortcut() {
  const origin = window.location.origin;
  const body = `[InternetShortcut]\r\nURL=${origin}/\r\n`;
  const blob = new Blob([body], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'BigDrop.url';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(a.href);
}

export default function GetTheAppButton({ className = '' }) {
  const [deferred, setDeferred] = useState(null);
  const [hint, setHint] = useState('');
  const { t } = useLang();

  useEffect(() => {
    function onBip(e) {
      e.preventDefault();
      setDeferred(e);
    }
    window.addEventListener('beforeinstallprompt', onBip);
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  async function onClick() {
    setHint('');
    if (deferred) {
      deferred.prompt();
      await deferred.userChoice;
      setDeferred(null);
      return;
    }
    const nav = window.navigator;
    if (nav?.standalone || window.matchMedia('(display-mode: standalone)').matches) {
      setHint('BigDrop is already on your home screen.');
      return;
    }
    downloadShortcut();
    setHint('Shortcut downloaded. Open it, or on a phone use the browser menu → Add to Home Screen.');
  }

  return (
    <div className="shrink-0 text-center md:text-right">
      <button
        type="button"
        onClick={onClick}
        className={
          className ||
          'inline-flex items-center bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg rounded-md px-5 py-3'
        }
      >
        {t('getTheApp')}
        <ArrowRight size={16} className="ml-2" />
      </button>
      {hint ? <p className="mt-2 text-xs text-white/90 max-w-xs md:ml-auto">{hint}</p> : null}
    </div>
  );
}
