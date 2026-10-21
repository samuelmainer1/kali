import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Cookie, Settings } from 'lucide-react';
import Cookies from 'js-cookie';

const CookieConsent = () => {
  const [showConsent, setShowConsent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false
  });

  useEffect(() => {
    const consent = Cookies.get('cookie-consent');
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleAcceptAll = () => {
    Cookies.set('cookie-consent', 'accepted', { expires: 365 });
    Cookies.set('cookie-preferences', JSON.stringify({
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true
    }), { expires: 365 });
    setShowConsent(false);
  };

  const handleDecline = () => {
    Cookies.set('cookie-consent', 'declined', { expires: 365 });
    Cookies.set('cookie-preferences', JSON.stringify({
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false
    }), { expires: 365 });
    setShowConsent(false);
  };

  const handleSavePreferences = () => {
    Cookies.set('cookie-consent', 'custom', { expires: 365 });
    Cookies.set('cookie-preferences', JSON.stringify(cookiePreferences), { expires: 365 });
    setShowConsent(false);
    setShowSettings(false);
  };

  const handlePreferenceChange = (type) => {
    if (type === 'necessary') return; // Necessary cookies cannot be disabled
    setCookiePreferences(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  if (!showConsent) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl"
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          {!showSettings ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#88C300]/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Cookie className="w-5 h-5 text-[#88C300]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">We use cookies</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We use cookies to enhance your experience, analyze site traffic, and personalize content. 
                    By continuing to use our site, you consent to our use of cookies.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 flex-shrink-0 flex-wrap sm:flex-nowrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(true)}
                  className="text-gray-600 hover:text-gray-800 border-gray-300"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecline}
                  className="text-gray-600 hover:text-gray-800 border-gray-300"
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-[#88C300] hover:bg-[#6ea000] text-white"
                >
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-lg">Cookie Preferences</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ← Back
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <h4 className="font-medium text-gray-900">Necessary Cookies</h4>
                    <p className="text-sm text-gray-600 mt-0.5">Required for the website to function properly</p>
                  </div>
                  <div className="w-12 h-6 bg-[#88C300] rounded-full flex items-center justify-end px-1">
                    <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                  </div>
                </div>
                
                {[
                  { key: 'analytics', title: 'Analytics Cookies', desc: 'Help us understand how visitors interact with our website' },
                  { key: 'marketing', title: 'Marketing Cookies', desc: 'Used to deliver personalized advertisements' },
                  { key: 'functional', title: 'Functional Cookies', desc: 'Enable enhanced functionality and personalization' }
                ].map(({ key, title, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{title}</h4>
                      <p className="text-sm text-gray-600 mt-0.5">{desc}</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange(key)}
                      className={`w-12 h-6 rounded-full flex items-center transition-colors duration-300 flex-shrink-0 ml-4 ${
                        cookiePreferences[key] ? 'bg-[#88C300] justify-end' : 'bg-gray-300 justify-start'
                      }`}
                      aria-label={`Toggle ${title}`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full mx-1 shadow-sm"></div>
                    </button>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDecline}
                  className="flex-1 border-gray-300"
                >
                  Decline All
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePreferences}
                  className="flex-1 bg-[#88C300] hover:bg-[#6ea000] text-white"
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsent;