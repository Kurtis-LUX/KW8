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
    // Check if device is mobile
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      
      // If not mobile, complete loading immediately
      if (!isMobileDevice) {
        onLoadingComplete();
        return;
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // Only run loading animation on mobile
    if (!isMobile && window.innerWidth > 768) {
      return () => window.removeEventListener('resize', checkMobile);
    }

    // Show logo after 500ms
    const logoTimer = setTimeout(() => {
      setLogoVisible(true);
      // Play sound when logo appears with Supercell-like effect
      try {
        const audio = new Audio('/sounds/logo-sound.mp3');
        audio.volume = 0.8; // Volume più alto per effetto Supercell
        audio.preload = 'auto';
        
        // Tentativo di riproduzione con fallback
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            console.log('Audio played successfully');
          }).catch((error) => {
            console.log('Audio autoplay prevented:', error);
            // Fallback: prova a riprodurre con interazione utente
            document.addEventListener('click', () => {
              audio.play().catch(() => {});
            }, { once: true });
          });
        }
      } catch (error) {
        console.log('Audio creation failed:', error);
      }
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
              className="h-24 md:h-32 w-auto mx-auto mb-4 relative z-10 animate-pulse"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 60px rgba(147, 51, 234, 0.4))',
                animation: 'supercellGlow 2s ease-in-out infinite alternate'
              }}
            />
            {/* Glow effect background */}
            <div 
              className="absolute inset-0 rounded-full opacity-60"
              style={{
                background: 'radial-gradient(circle, rgba(59, 130, 246, 0.3) 0%, rgba(147, 51, 234, 0.2) 50%, transparent 70%)',
                animation: 'supercellPulse 2s ease-in-out infinite alternate',
                transform: 'scale(1.5)'
              }}
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

// Add Supercell-like glow animation styles
const style = document.createElement('style');
style.textContent = `
  @keyframes supercellGlow {
    0% {
      filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)) drop-shadow(0 0 40px rgba(59, 130, 246, 0.6)) drop-shadow(0 0 60px rgba(147, 51, 234, 0.4));
      transform: scale(1);
    }
    50% {
      filter: drop-shadow(0 0 30px rgba(255, 255, 255, 1)) drop-shadow(0 0 60px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 90px rgba(147, 51, 234, 0.6));
      transform: scale(1.05);
    }
    100% {
      filter: drop-shadow(0 0 40px rgba(255, 255, 255, 1.2)) drop-shadow(0 0 80px rgba(59, 130, 246, 1)) drop-shadow(0 0 120px rgba(147, 51, 234, 0.8));
      transform: scale(1.1);
    }
  }
  
  @keyframes supercellPulse {
    0% {
      opacity: 0.3;
      transform: scale(1.2);
    }
    50% {
      opacity: 0.6;
      transform: scale(1.5);
    }
    100% {
      opacity: 0.8;
      transform: scale(1.8);
    }
  }
`;
document.head.appendChild(style);