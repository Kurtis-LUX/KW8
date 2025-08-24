import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoVisible, setLogoVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Show logo after 500ms
    const logoTimer = setTimeout(() => {
      setLogoVisible(true);
      // Play sound when logo appears
      const audio = new Audio('/sounds/logo-sound.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Ignore audio play errors (user interaction required)
      });
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

    // Minimum 2 seconds loading time
    const minLoadingTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onLoadingComplete();
      }, 500); // Fade out duration
    }, 2000);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(minLoadingTimer);
      clearInterval(progressInterval);
    };
  }, [onLoadingComplete]);

  if (!isVisible) {
    return (
      <div className="fixed inset-0 bg-blue-900 z-50 flex items-center justify-center transition-opacity duration-500 opacity-0 pointer-events-none">
      </div>
    );
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
          <h1 className="text-6xl md:text-8xl font-bold mb-2" style={{ fontFamily: 'Bebas Neue, cursive' }}>
            <span className="text-white">KW</span>
            <span className="text-red-500">8</span>
          </h1>
          <p className="text-xl md:text-2xl font-light tracking-wider" style={{ fontFamily: 'Bebas Neue, cursive' }}>
            CROSS YOUR LIMITS
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