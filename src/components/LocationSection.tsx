import React from 'react';
import { ExternalLink } from 'lucide-react';

const LocationSection: React.FC = () => {
  const openGoogleMaps = () => {
    window.open('https://maps.app.goo.gl/TkgDHdRp58FS4XbF6', '_blank');
  };

  return (
    <section id="posizione" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-16 animate-fadeInUp">POSIZIONE</h2>
        
        <div className="max-w-2xl mx-auto mb-12">
          <img 
            src="/images/posizione.PNG" 
            alt="Mappa posizione palestra KW8" 
            className="w-full h-auto rounded-xl shadow-2xl transition-transform duration-300 hover:scale-105"
          />
        </div>

        <button 
          onClick={openGoogleMaps}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
        >
          <span>APRIRE SU GOOGLE MAPS</span>
          <ExternalLink size={20} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
};

export default LocationSection;