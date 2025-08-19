import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

const LocationSection: React.FC = () => {
  const { t } = useLanguageContext();
  
  const openGoogleMaps = () => {
    window.open('https://maps.app.goo.gl/TkgDHdRp58FS4XbF6', '_blank');
  };

  return (
    <section id="posizione" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-16 animate-fadeInUp">{t.whereAreWe}</h2>
        
        <div className="max-w-4xl mx-auto mb-12">
          <div className="relative w-full h-96 rounded-xl shadow-2xl overflow-hidden">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1589.7652217028144!2d15.036093729531373!3d37.16386317654497!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1313d73788499463%3A0x67fcc1e164114b7!2sPalestra%20Krossing%20Weight!5e0!3m2!1sit!2sit!4v1755553549586!5m2!1sit!2sit"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Mappa interattiva palestra KW8"
              className="transition-all duration-300 hover:brightness-110"
            ></iframe>
            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg">
              <p className="text-navy-900 font-semibold text-sm">📍 Palestra KW8</p>
              <p className="text-navy-700 text-xs">Via Pietro Nenni, 96010, Sortino SR</p>
            </div>
          </div>
        </div>

        <button 
          onClick={openGoogleMaps}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
        >
          <span>{t.openOnGoogleMaps}</span>
          <ExternalLink size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
};

export default LocationSection;