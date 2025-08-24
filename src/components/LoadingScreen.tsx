import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoVisible, setLogoVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if it's a mobile app (not just mobile browser)
    const checkMobileApp = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone || 
                          document.referrer.includes('android-app://') ||
                          /Android.*wv|iPhone.*Mobile.*Safari/i.test(navigator.userAgent);
      
      const isMobileDevice = window.innerWidth <= 768 && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Only show loading screen if it's a mobile app, not mobile browser
      const shouldShowLoading = isStandalone && isMobileDevice;
      setIsMobile(shouldShowLoading);
      
      // If not mobile app, complete loading immediately
      if (!shouldShowLoading) {
        onLoadingComplete();
        return;
      }
    };
    
    checkMobileApp();
    window.addEventListener('resize', checkMobileApp);
    
    // Only run loading animation on mobile app
    if (!isMobile) {
      return () => window.removeEventListener('resize', checkMobileApp);
    }

    // Play sound immediately when loading starts
    try {
      const audio = new Audio('/sounds/logo-sound.mp3');
      audio.volume = 0.8;
      audio.preload = 'auto';
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(() => {
          console.log('Audio played successfully');
        }).catch((error) => {
          console.log('Audio autoplay prevented:', error);
          document.addEventListener('click', () => {
            audio.play().catch(() => {});
          }, { once: true });
        });
      }
    } catch (error) {
      console.log('Audio creation failed:', error);
    }

    // Show logo after 500ms
    const logoTimer = setTimeout(() => {
      setLogoVisible(true);
    }, 500);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    // Minimum 3 seconds loading time
    const minLoadingTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onLoadingComplete();
      }, 500); // Fade out duration
    }, 3000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(minLoadingTimer);
      clearInterval(progressInterval);
      window.removeEventListener('resize', checkMobile);
    };
  }, [onLoadingComplete]);

  // Don't show loading screen on desktop
  if (!isMobile || !isVisible) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-blue-900 z-50 flex flex-col items-center justify-center transition-opacity duration-500">
      {/* Background pattern similar to hero section */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full bg-gradient-to-br from-red-500 to-transparent"></div>
      </div>
      
      {/* Logo */}
      <div className={`mb-8 transition-all duration-1000 transform ${
        logoVisible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-75 translate-y-4'
      }`}>
        <div className="text-white text-center">
          <div className="relative">
            <img 
              src="/images/logo.png" 
              alt="KW8 Logo" 
              className="h-24 md:h-32 w-auto mx-auto mb-4"
            />
          </div>
          <p className="text-xl md:text-2xl font-light tracking-wider" style={{ fontFamily: 'Bebas Neue, cursive' }}>
            CROSS YOUR LIMITS.
          </p>
        </div>
      </div>

      {/* Loading bar */}
      <div className="w-64 md:w-80 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden">
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