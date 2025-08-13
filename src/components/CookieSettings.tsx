import React, { useState, useEffect } from 'react';
import DB, { User } from '../utils/database';

interface CookieSettingsProps {
  onClose: () => void;
  currentUser: User | null;
}

const CookieSettings: React.FC<CookieSettingsProps> = ({ onClose, currentUser }) => {
  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true, // Sempre attivo e non modificabile
    marketing: false,
    statistics: false
  });

  // Carica le preferenze salvate quando il componente viene montato
  useEffect(() => {
    if (currentUser) {
      const savedPreferences = DB.getCookiePreferences(currentUser.id);
      if (savedPreferences) {
        setCookiePreferences({
          ...cookiePreferences,
          ...savedPreferences
        });
      }
    }
  }, [currentUser]);

  const handleToggle = (type: 'marketing' | 'statistics') => {
    setCookiePreferences({
      ...cookiePreferences,
      [type]: !cookiePreferences[type]
    });
  };

  const handleSavePreferences = () => {
    if (currentUser) {
      DB.saveCookiePreferences(currentUser.id, cookiePreferences);
    }
    onClose();
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      marketing: true,
      statistics: true
    };
    
    setCookiePreferences(allAccepted);
    
    if (currentUser) {
      DB.saveCookiePreferences(currentUser.id, allAccepted);
    }
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-navy-900">Impostazioni Cookie</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Cookie Essenziali */}
          <div className="border-b pb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-navy-900">Cookie Essenziali</h3>
              <div className="relative inline-block w-12 h-6 bg-green-500 rounded-full cursor-not-allowed">
                <span className="absolute inset-y-1 right-1 w-4 h-4 bg-white rounded-full transition-transform"></span>
              </div>
            </div>
            <p className="text-sm text-gray-600">
              Questi cookie sono necessari per il funzionamento del sito e non possono essere disattivati.
            </p>
          </div>

          {/* Cookie Marketing */}
          <div className="border-b pb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-navy-900">Cookie Marketing</h3>
              <button 
                onClick={() => handleToggle('marketing')}
                className={`relative inline-block w-12 h-6 ${cookiePreferences.marketing ? 'bg-green-500' : 'bg-gray-300'} rounded-full transition-colors duration-300`}
              >
                <span 
                  className={`absolute inset-y-1 ${cookiePreferences.marketing ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full transition-transform duration-300`}
                ></span>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Questi cookie vengono utilizzati per fornire pubblicità più rilevante per te e i tuoi interessi.
            </p>
          </div>

          {/* Cookie Statistici */}
          <div className="pb-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-navy-900">Cookie Statistici</h3>
              <button 
                onClick={() => handleToggle('statistics')}
                className={`relative inline-block w-12 h-6 ${cookiePreferences.statistics ? 'bg-green-500' : 'bg-gray-300'} rounded-full transition-colors duration-300`}
              >
                <span 
                  className={`absolute inset-y-1 ${cookiePreferences.statistics ? 'right-1' : 'left-1'} w-4 h-4 bg-white rounded-full transition-transform duration-300`}
                ></span>
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Questi cookie ci aiutano a capire come i visitatori interagiscono con il sito, raccogliendo e riportando informazioni in forma anonima.
            </p>
          </div>
        </div>

        <div className="flex justify-between mt-8">
          <button
            onClick={handleSavePreferences}
            className="bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2 px-4 rounded transition-colors duration-300"
          >
            Salva preferenze
          </button>
          <button
            onClick={handleAcceptAll}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded transition-colors duration-300"
          >
            Accetta tutti
          </button>
        </div>

        {!currentUser && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-700">
              <strong>Nota:</strong> Le preferenze dei cookie verranno salvate solo se hai effettuato l'accesso.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CookieSettings;