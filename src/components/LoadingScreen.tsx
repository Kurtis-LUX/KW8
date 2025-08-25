import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [logoVisible, setLogoVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [shouldShowLoading, setShouldShowLoading] = useState(false);



  const handleLoadingComplete = () => {
    setIsVisible(false);
    setTimeout(() => {
      onLoadingComplete();
    }, 800); // Transizione più fluida
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

    // Show logo immediately
    setLogoVisible(true);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          // Auto-complete loading when progress finishes
          setTimeout(() => {
            handleLoadingComplete();
          }, 1000);
          return 100;
        }
        return prev + 2;
      });
    }, 30); // Slightly faster progress

    // Minimum 3 seconds loading time
    const minLoadingTimer = setTimeout(() => {
      if (progress >= 100) {
        handleLoadingComplete();
      }
    }, 3000);

    return () => {
      clearTimeout(minLoadingTimer);
      clearInterval(progressInterval);
    };
  }, [onLoadingComplete]);

  // Don't show loading screen if not visible or not mobile/PWA
  if (!isVisible || !shouldShowLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-blue-900 z-50 flex flex-col items-center justify-center transition-all duration-500">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-br from-red-500 to-transparent"></div>
      </div>
      
      {/* Logo */}
      <div className={`mb-8 transition-all duration-1000 transform ${
        logoVisible ? 'opacity-100 animate-pulse' : 'opacity-0'
      }`}>
        <div className="text-white text-center">
          <div className="relative">
            <img 
              src="/images/logopagina" 
              alt="KW8 Logo" 
              className="h-24 md:h-32 w-auto mx-auto mb-4"
            />
          </div>
          <p className="text-xl md:text-2xl font-light tracking-wider" style={{ fontFamily: 'Bebas Neue, cursive' }}>
            SUPERA I TUOI LIMITI.
          </p>
        </div>
      </div>

      {/* Loading bar */}
      <div className="w-64 md:w-80 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden transition-all duration-500">
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Loading text */}
      <p className="text-white text-sm mt-4 opacity-70 animate-pulse">
        Caricamento in corso...
      </p>

    </div>
  );
};

export default LoadingScreen;