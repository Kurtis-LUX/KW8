import React, { useState } from 'react';
import { X, Sun, Moon, Palette } from 'lucide-react';
import { useThemeContext } from '../contexts/ThemeContext';

interface ThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ThemeModal: React.FC<ThemeModalProps> = ({ isOpen, onClose }) => {
  const { theme, setTheme } = useThemeContext();
  const [selectedLogo, setSelectedLogo] = useState(() => {
    return localStorage.getItem('kw8-selected-logo') || 'default';
  });

  const logos = [
    {
      id: 'default',
      name: 'Logo Classico',
      lightPath: '/images/logo.png',
      darkPath: '/images/logopaginadark.PNG',
      preview: '/images/logo.png'
    },
    {
      id: 'alternative',
      name: 'Logo Alternativo',
      lightPath: '/images/logopagina.PNG',
      darkPath: '/images/logopaginadark.PNG',
      preview: '/images/logopagina.PNG'
    }
  ];

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
  };

  const handleLogoChange = (logoId: string) => {
    setSelectedLogo(logoId);
    localStorage.setItem('kw8-selected-logo', logoId);
    
    // Aggiorna il logo nell'header
    const headerLogo = document.querySelector('header img[alt="KW8 Logo"]') as HTMLImageElement;
    const mobileMenuLogo = document.querySelector('.fixed.inset-0 img[alt="KW8 Logo"]') as HTMLImageElement;
    
    const selectedLogoData = logos.find(logo => logo.id === logoId);
    if (selectedLogoData && headerLogo) {
      const logoPath = theme === 'dark' ? selectedLogoData.darkPath : selectedLogoData.lightPath;
      headerLogo.src = logoPath;
      if (mobileMenuLogo) {
        mobileMenuLogo.src = logoPath;
      }
    }
  };

  const handleSave = () => {
    // Le modifiche sono già salvate in tempo reale
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Palette className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-900">Personalizza Tema</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Theme Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleziona Tema</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleThemeChange('light')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === 'light'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Sun className={`${theme === 'light' ? 'text-blue-600' : 'text-gray-600'}`} size={24} />
                  <span className={`font-medium ${theme === 'light' ? 'text-blue-600' : 'text-gray-600'}`}>
                    Tema Chiaro
                  </span>
                </div>
              </button>
              
              <button
                onClick={() => handleThemeChange('dark')}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  theme === 'dark'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex flex-col items-center space-y-2">
                  <Moon className={`${theme === 'dark' ? 'text-blue-600' : 'text-gray-600'}`} size={24} />
                  <span className={`font-medium ${theme === 'dark' ? 'text-blue-600' : 'text-gray-600'}`}>
                    Tema Scuro
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Logo Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleziona Logo</h3>
            <div className="space-y-3">
              {logos.map((logo) => (
                <button
                  key={logo.id}
                  onClick={() => handleLogoChange(logo.id)}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-300 ${
                    selectedLogo === logo.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={logo.preview}
                      alt={logo.name}
                      className="w-12 h-12 object-contain rounded-lg bg-white border border-gray-200"
                    />
                    <div className="flex-1 text-left">
                      <span className={`font-medium ${
                        selectedLogo === logo.id ? 'text-blue-600' : 'text-gray-700'
                      }`}>
                        {logo.name}
                      </span>
                    </div>
                    {selectedLogo === logo.id && (
                      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Annulla
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Salva Modifiche
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeModal;