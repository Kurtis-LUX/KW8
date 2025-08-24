import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [logoVisible, setLogoVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [shouldShowLoading, setShouldShowLoading] = useState(false);

  useEffect(() => {
    // Always show loading screen on all devices
    setShouldShowLoading(true);

    // Play audio and show logo with simplified audio handling
    const playAudioAndShowLogo = async () => {
      // Show logo immediately
      setLogoVisible(true);
      
      try {
        // Create and configure audio
        const audio = new Audio('/sounds/logo-sound.mp3');
        audio.volume = 0.8;
        audio.preload = 'auto';
        
        // Simple audio play with muted trick
        try {
          // Start muted to bypass autoplay restrictions
          audio.muted = true;
          await audio.play();
          
          // Unmute after a short delay
          setTimeout(() => {
            audio.muted = false;
            console.log('Audio playing with muted trick');
          }, 200);
        } catch (error) {
          console.log('Audio autoplay failed:', error);
          
          // Fallback: play on first user interaction
          const playOnInteraction = async () => {
            try {
              audio.currentTime = 0;
              audio.muted = false;
              await audio.play();
              console.log('Audio played on user interaction');
            } catch (interactionError) {
              console.log('Audio play failed on interaction:', interactionError);
            }
          };
          
          // Add event listeners for user interaction
          document.addEventListener('touchstart', playOnInteraction, { once: true });
          document.addEventListener('click', playOnInteraction, { once: true });
        }
        
      } catch (error) {
        console.log('Audio setup failed:', error);
      }
    };
    
    // Execute immediately without any delay
    playAudioAndShowLogo();

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 30); // Slightly faster progress

    // Minimum 3 seconds loading time
    const minLoadingTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onLoadingComplete();
      }, 500); // Fade out duration
    }, 3000);

    return () => {
      clearTimeout(minLoadingTimer);
      clearInterval(progressInterval);
    };
  }, [onLoadingComplete]);

  // Don't show loading screen if not visible
  if (!isVisible) {
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