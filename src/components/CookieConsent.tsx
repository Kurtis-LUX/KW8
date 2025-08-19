import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
  onShowPrivacyModal?: () => void;
  onShowCookiePolicyModal?: () => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onDecline, onShowPrivacyModal, onShowCookiePolicyModal }) => {
  const { t } = useLanguageContext();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Controlla se l'utente ha già dato il consenso
    const hasConsent = localStorage.getItem('cookieConsent');
    if (!hasConsent) {
      // Mostra il popup dopo un breve ritardo per una migliore esperienza utente
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted');
    setIsVisible(false);
    setTimeout(() => onAccept(), 300);
  };

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined');
    setIsVisible(false);
    setTimeout(() => onDecline(), 300);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onDecline(), 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[200] p-4 bg-white shadow-lg border-t border-gray-200 transition-all duration-300 transform ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-navy-900 mb-2">{t.weUseCookies}</h3>
            <p className="text-sm text-gray-600">
              {t.cookieConsentText}
            </p>
            <div className="mt-2">
            <button onClick={onShowPrivacyModal} className="text-red-600 hover:underline mr-4 text-sm bg-transparent border-none cursor-pointer">{t.privacyPolicy}</button>
            <button onClick={onShowCookiePolicyModal} className="text-red-600 hover:underline text-sm bg-transparent border-none cursor-pointer">{t.cookiePolicy}</button>
          </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-2 md:mt-0">
            <button
              onClick={handleDecline}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-all duration-300 transform hover:scale-105"
            >
              {t.decline}
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-all duration-300 transform hover:scale-105"
            >
              {t.acceptAll}
            </button>
          </div>
          <button 
            onClick={handleClose} 
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-all duration-300 transform hover:rotate-90"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;