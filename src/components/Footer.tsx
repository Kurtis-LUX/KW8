import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { t } = useLanguageContext();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [closingSection, setClosingSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    if (openSection === section) {
      setClosingSection(section);
      setTimeout(() => {
        setOpenSection(null);
        setClosingSection(null);
      }, 300);
    } else {
      setOpenSection(section);
      setClosingSection(null);
    }
  };

  return (
    <footer className="bg-navy-900/90 backdrop-blur-md text-white py-12 border-t border-white/10">
      <div className="container mx-auto px-6 font-sfpro">
        {/* Sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Legal Section */}
          <div>
            <button
              onClick={() => toggleSection('legal')}
              className="flex items-center justify-between w-full py-4 text-left text-white/90 font-semibold hover:text-white transition-all duration-300 rounded-xl hover:bg-white/5 px-3 border border-white/10"
            >
              <span>{t.legal}</span>
              {openSection === 'legal' ? (
                <ChevronUp size={20} className="transition-transform duration-300" />
              ) : (
                <ChevronDown size={20} className="transition-transform duration-300" />
              )}
            </button>
            {(openSection === 'legal' || closingSection === 'legal') && (
              <div
                className={`mt-3 space-y-3 pl-4 transition-all duration-300 ${
                  closingSection === 'legal' ? 'animate-fadeOut opacity-0 -translate-y-2' : 'animate-fadeIn'
                }`}
              >
                <button
                  onClick={() => onNavigate?.('privacy-policy')}
                  className="block text-white/80 hover:text-white transition-all duration-300 py-1 hover:translate-x-2 text-left"
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => onNavigate?.('terms')}
                  className="block text-white/80 hover:text-white transition-all duration-300 py-1 hover:translate-x-2 text-left"
                >
                  {t.termsAndConditions}
                </button>
              </div>
            )}
          </div>

          {/* Cookie Section */}
          <div>
            <button
              onClick={() => toggleSection('cookie')}
              className="flex items-center justify-between w-full py-4 text-left text-white/90 font-semibold hover:text-white transition-all duration-300 rounded-xl hover:bg-white/5 px-3 border border-white/10"
            >
              <span>{t.cookies}</span>
              {openSection === 'cookie' ? (
                <ChevronUp size={20} className="transition-transform duration-300" />
              ) : (
                <ChevronDown size={20} className="transition-transform duration-300" />
              )}
            </button>
            {(openSection === 'cookie' || closingSection === 'cookie') && (
              <div
                className={`mt-3 space-y-3 pl-4 transition-all duration-300 ${
                  closingSection === 'cookie' ? 'animate-fadeOut opacity-0 -translate-y-2' : 'animate-fadeIn'
                }`}
              >
                <button
                  onClick={() => onNavigate?.('cookie-policy')}
                  className="block text-white/80 hover:text-white transition-all duration-300 py-1 hover:translate-x-2 text-left"
                >
                  {t.cookiePolicy}
                </button>
                <button
                  onClick={() => onNavigate?.('cookie-settings')}
                  className="block text-white/80 hover:text-white transition-all duration-300 py-1 hover:translate-x-2 text-left"
                >
                  {t.managePreferences}
                </button>
              </div>
            )}
          </div>

          {/* Contacts Section */}
          <div id="contatti">
            <button
              onClick={() => toggleSection('contacts')}
              className="flex items-center justify-between w-full py-4 text-left text-white/90 font-semibold hover:text-white transition-all duration-300 rounded-xl hover:bg-white/5 px-3 border border-white/10"
            >
              <span>{t.contacts}</span>
              {openSection === 'contacts' ? (
                <ChevronUp size={20} className="transition-transform duration-300" />
              ) : (
                <ChevronDown size={20} className="transition-transform duration-300" />
              )}
            </button>
            {(openSection === 'contacts' || closingSection === 'contacts') && (
              <div
                className={`mt-3 space-y-4 pl-4 transition-all duration-300 ${
                  closingSection === 'contacts' ? 'animate-fadeOut opacity-0 -translate-y-2' : 'animate-fadeIn'
                }`}
              >
                <a
                  href="tel:+393338346546"
                  className="flex items-center space-x-3 text-white/80 hover:text-white transition-all duration-300 py-1 hover:translate-x-2"
                >
                  <Phone size={18} />
                  <span className="text-sm sm:text-base">3338346546 (Giuseppe)</span>
                </a>
                <a
                  href="tel:+393315374473"
                  className="flex items-center space-x-3 text-white/80 hover:text-white transition-all duration-300 py-1 hover:translate-x-2"
                >
                  <Phone size={18} />
                  <span className="text-sm sm:text-base">3315374473 (Saverio)</span>
                </a>
                <a
                  href="mailto:krossingweight@gmail.it"
                  className="flex items-center space-x-3 text-white/80 hover:text-white transition-all duration-300 py-1 hover:translate-x-2"
                >
                  <Mail size={18} />
                  <span>krossingweight@gmail.it</span>
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Logos & Copyright */}
        <div className="border-t border-white/10 pt-10 mt-10">
          <div className="text-center text-white/80 text-sm font-medium flex flex-col items-center justify-center">
            <div className="grid grid-cols-3 sm:grid-cols-4 md:flex md:items-center md:justify-center gap-4 sm:gap-6 mb-8">
              <img src="/images/logo.png" alt="KW8 Logo" className="h-8 sm:h-10 w-auto mx-auto" />
              <img src="/images/coni.svg.png" alt="CONI Logo" className="h-8 sm:h-10 w-auto mx-auto" />
              <img src="/images/fiam.png" alt="FIAM Logo" className="h-8 sm:h-10 w-auto mx-auto" />
              <img src="/images/acsi.png" alt="ACSI Logo" className="h-8 sm:h-10 w-auto mx-auto" />
              {/* Karate logo rimosso */}
              <img src="/images/opes.png" alt="OPES Logo" className="h-8 sm:h-10 w-auto mx-auto" />
              <img src="/images/nonsolofitness.webp" alt="Non Solo Fitness Logo" className="h-8 sm:h-10 w-auto mx-auto" />
            </div>
            <div className="mt-4">{t.copyright}</div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center text-white/70">
          <div className="mt-2 text-white/60 text-xs">
            <div>Powered by: Simeone Luca</div>
            <div>Info: simeoneluca13@gmail.com</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;