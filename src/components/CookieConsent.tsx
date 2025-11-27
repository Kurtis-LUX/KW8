import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

interface CookieConsentProps {
  onAccept: () => void;
  onDecline: () => void;
  onShowPrivacyModal?: () => void;
  onShowCookiePolicyModal?: () => void;
  onManageSettings?: () => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onAccept, onDecline, onShowPrivacyModal, onShowCookiePolicyModal, onManageSettings }) => {
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
    <div className="fixed inset-0 z-[1000]">
      {/* Overlay scuro con blur */}
      <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`} />

      {/* Modal centrale stile Apple */}
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <div className={`w-full max-w-lg mx-auto rounded-[28px] bg-white/80 backdrop-blur-lg ring-1 ring-black/10 shadow-[0_24px_48px_rgba(0,0,0,0.20)] transition-transform duration-300 ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
          {/* Header minimal */}
          <div className="flex items-center justify-between px-5 pt-5">
            <div className="h-1 w-12 bg-gray-300 rounded-full mx-auto" />
            <button 
              onClick={handleClose} 
              className="absolute right-5 top-5 text-gray-500 hover:text-gray-700 transition-transform duration-300 hover:rotate-90"
              aria-label="Chiudi"
            >
              <X size={20} />
            </button>
          </div>

          {/* Contenuto */}
          <div className="px-6 pb-6 pt-3">
            <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">{t.weUseCookies}</h3>
            <p className="text-sm text-gray-600 text-center">
              {t.cookieConsentText}
            </p>

            <div className="mt-4 text-center">
              <button onClick={onShowPrivacyModal} className="text-red-600 hover:underline mr-4 text-sm bg-transparent border-none cursor-pointer">{t.privacyPolicy}</button>
              <button onClick={onShowCookiePolicyModal} className="text-red-600 hover:underline text-sm bg-transparent border-none cursor-pointer">{t.cookiePolicy}</button>
            </div>

            {/* Azioni */}
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={handleDecline}
                className="px-4 py-3 text-sm font-medium text-gray-800 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all duration-300"
              >
                {t.decline}
              </button>
              <button
                onClick={() => onManageSettings && onManageSettings()}
                className="px-4 py-3 text-sm font-medium text-gray-800 bg-white rounded-2xl ring-1 ring-gray-200 hover:bg-gray-50 transition-all duration-300"
              >
                {t.cookieSettings}
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-3 text-sm font-semibold text-white bg-red-600 rounded-2xl hover:bg-red-700 transition-all duration-300"
              >
                {t.acceptAll}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
