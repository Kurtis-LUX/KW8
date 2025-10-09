import React, { useState, useEffect } from 'react';
import Modal from './Modal';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [logoVisible, setLogoVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [shouldShowLoading, setShouldShowLoading] = useState(false);

  const handleLoadingComplete = () => {
    setFadeOut(true);
    setTimeout(() => {
      setIsVisible(false);
      onLoadingComplete();
    }, 300); // Transizione veloce di dissolvenza
  };

  useEffect(() => {
    // Only show loading screen in PWA/app mode, not in browser
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    
    setShouldShowLoading(isPWA);

    // If not PWA/app, skip loading screen
    if (!isPWA) {
      onLoadingComplete();
      return;
    }

    // Show logo immediately with fade in
    setTimeout(() => {
      setLogoVisible(true);
    }, 100);

    // Complete loading after 2 seconds
    const loadingTimer = setTimeout(() => {
      handleLoadingComplete();
    }, 2000);

    return () => {
      clearTimeout(loadingTimer);
    };
  }, [onLoadingComplete]);

  // Don't show loading screen if not visible or not mobile/PWA
  if (!isVisible || !shouldShowLoading) {
    return null;
  }

  return (
    <Modal 
      isOpen={true} 
      onClose={() => { /* Nessuna chiusura manuale durante il loading */ }} 
      title="" 
      hideHeader 
      variant="fullscreen"
    >
      <div className={`flex flex-col items-center justify-center transition-all duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`} style={{ backgroundColor: 'white', minHeight: '100vh' }}>
        {/* Logo */}
        <div className={`transition-all duration-500 transform mb-8 ${
          logoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="text-center">
            <div className="relative">
              <img 
                src="/images/logo.png" 
                alt="KW8 Logo" 
                className="h-24 md:h-32 w-auto mx-auto filter drop-shadow-lg"
              />
            </div>
          </div>
        </div>

        {/* Red loading spinner */}
        <div className={`transition-all duration-500 ${
          logoVisible ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
        </div>
      </div>
    </Modal>
  );
};

export default LoadingScreen;