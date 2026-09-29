import { createContext, useContext, useState } from 'react';

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [miniCartOpen, setMiniCartOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');

  function openMiniCart() {
    setMiniCartOpen(true);
  }

  function closeMiniCart() {
    setMiniCartOpen(false);
  }

  function openQuickView(product) {
    setQuickViewProduct(product);
  }

  function closeQuickView() {
    setQuickViewProduct(null);
  }

  function openAuth(tab = 'login') {
    setAuthTab(tab === 'register' ? 'register' : 'login');
    setAuthOpen(true);
  }

  function closeAuth() {
    setAuthOpen(false);
  }

  return (
    <UIContext.Provider
      value={{
        miniCartOpen,
        openMiniCart,
        closeMiniCart,
        quickViewProduct,
        openQuickView,
        closeQuickView,
        authOpen,
        authTab,
        setAuthTab,
        openAuth,
        closeAuth,
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  return useContext(UIContext);
}
