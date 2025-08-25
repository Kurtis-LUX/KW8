import React, { useState, useEffect } from 'react';

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

    // Complete loading after maximum 1.5 seconds
    const loadingTimer = setTimeout(() => {
      handleLoadingComplete();
    }, 1500);

    return () => {
      clearTimeout(loadingTimer);
    };
  }, [onLoadingComplete]);

  // Don't show loading screen if not visible or not mobile/PWA
  if (!isVisible || !shouldShowLoading) {
    return null;
  }

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-300 ${
      fadeOut ? 'opacity-0' : 'opacity-100'
    }`} style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      
      {/* Logo */}
      <div className={`mb-8 transition-all duration-500 transform ${
        logoVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        <div className="text-white text-center">
          <div className="relative">
            <img 
              src="/images/logo.png" 
              alt="KW8 Logo" 
              className="h-24 md:h-32 w-auto mx-auto mb-4 filter drop-shadow-lg"
            />
          </div>
          <p className="text-xl md:text-2xl font-light tracking-wider" style={{ fontFamily: 'Bebas Neue, cursive' }}>
            CROSS YOUR LIMITS.
          </p>
        </div>
      </div>

      {/* Three dots loading animation */}
      <div className={`flex space-x-2 transition-all duration-500 ${
        logoVisible ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>

    </div>
  );
};

export default LoadingScreen;