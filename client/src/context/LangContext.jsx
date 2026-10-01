import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { translate } from '../lib/i18n';

const LangContext = createContext(null);

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => (localStorage.getItem('bd-lang') === 'sw' ? 'sw' : 'en'));

  useEffect(() => {
    document.documentElement.lang = lang === 'sw' ? 'sw' : 'en';
  }, [lang]);

  function toggleLang() {
    setLang((prev) => {
      const next = prev === 'en' ? 'sw' : 'en';
      localStorage.setItem('bd-lang', next);
      return next;
    });
  }

  const t = useCallback((key, vars) => translate(lang, key, vars), [lang]);

  return (
    <LangContext.Provider value={{ lang, toggleLang, t, label: lang === 'sw' ? 'KI' : 'EN' }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
