import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail } from 'lucide-react';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <footer className="bg-gradient-to-t from-gray-50 to-white border-t border-gray-200">
      <div className="container mx-auto px-4 py-8">
        {/* Legal Section */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('legal')}
            className="flex items-center justify-between w-full py-4 text-left text-navy-900 font-semibold hover:text-red-600 transition-all duration-300 rounded-lg hover:bg-gray-50 px-2"
          >
            <span>Legale</span>
            {openSection === 'legal' ? 
              <ChevronUp size={20} className="transition-transform duration-300" /> : 
              <ChevronDown size={20} className="transition-transform duration-300" />
            }
          </button>
          
          {openSection === 'legal' && (
            <div className="mt-3 space-y-3 pl-6 animate-fadeIn">
              <button 
                onClick={() => onNavigate?.('privacy-policy')}
                className="block text-navy-700 hover:text-red-600 transition-all duration-300 py-1 hover:translate-x-2 text-left"
              >
                Privacy Policy
              </button>
              <button 
                onClick={() => onNavigate?.('terms')}
                className="block text-navy-700 hover:text-red-600 transition-all duration-300 py-1 hover:translate-x-2 text-left"
              >
                Termini e condizioni
              </button>
            </div>
          )}
        </div>

        {/* Cookie Section */}
        <div className="mb-6">
          <button
            onClick={() => toggleSection('cookie')}
            className="flex items-center justify-between w-full py-4 text-left text-navy-900 font-semibold hover:text-red-600 transition-all duration-300 rounded-lg hover:bg-gray-50 px-2"
          >
            <span>Cookie</span>
            {openSection === 'cookie' ? 
              <ChevronUp size={20} className="transition-transform duration-300" /> : 
              <ChevronDown size={20} className="transition-transform duration-300" />
            }
          </button>
          
          {openSection === 'cookie' && (
            <div className="mt-3 space-y-3 pl-6 animate-fadeIn">
              <button 
                onClick={() => onNavigate?.('cookie-policy')}
                className="block text-navy-700 hover:text-red-600 transition-all duration-300 py-1 hover:translate-x-2 text-left"
              >
                Informativa sui cookie
              </button>
              <button 
                onClick={() => onNavigate?.('cookie-settings')}
                className="block text-navy-700 hover:text-red-600 transition-all duration-300 py-1 hover:translate-x-2 text-left"
              >
                Gestisci preferenze
              </button>
            </div>
          )}
        </div>

        {/* Contacts Section */}
        <div className="mb-8">
          <button
            onClick={() => toggleSection('contacts')}
            className="flex items-center justify-between w-full py-4 text-left text-navy-900 font-semibold hover:text-red-600 transition-all duration-300 rounded-lg hover:bg-gray-50 px-2"
          >
            <span>Contatti</span>
            {openSection === 'contacts' ? 
              <ChevronUp size={20} className="transition-transform duration-300" /> : 
              <ChevronDown size={20} className="transition-transform duration-300" />
            }
          </button>
          
          {openSection === 'contacts' && (
            <div className="mt-3 space-y-4 pl-6 animate-fadeIn">
              <a 
                href="tel:+1234567890" 
                className="flex items-center space-x-3 text-navy-700 hover:text-red-600 transition-all duration-300 py-1 hover:translate-x-2"
              >
                <Phone size={18} />
                <span>+39 123 456 7890</span>
              </a>
              <a 
                href="mailto:info@kw8palestra.it" 
                className="flex items-center space-x-3 text-navy-700 hover:text-red-600 transition-all duration-300 py-1 hover:translate-x-2"
              >
                <Mail size={18} />
                <span>info@kw8palestra.it</span>
              </a>
            </div>
          )}
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-200 pt-8 mt-6">
          <div className="text-center text-navy-700 text-sm font-medium flex flex-col items-center justify-center">
            <div className="flex items-center justify-center space-x-6 mb-8 flex-wrap">
              <img src="/images/logo.png" alt="KW8 Logo" className="h-10 w-auto" />
              <img src="/images/coni.svg.png" alt="CONI Logo" className="h-10 w-auto" />
              <img src="/images/fiam.png" alt="FIAM Logo" className="h-10 w-auto" />
              <img src="/images/acsi.png" alt="ACSI Logo" className="h-10 w-auto" />
              <img src="/images/karatelogo.JPG" alt="Karate Logo" className="h-10 w-auto" />
              <img src="/images/opes.png" alt="OPES Logo" className="h-10 w-auto" />
              <img src="/images/nonsolofitness.webp" alt="Non Solo Fitness Logo" className="h-10 w-auto" />
            </div>
            <div className="mt-4">© KW8 2025</div>
            <div className="mt-2 text-gray-400 text-xs">
              <div>Powered by: Simeone Luca</div>
              <div>For info: simeoneluca13@gmail.com</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;