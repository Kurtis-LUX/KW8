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
    // Check if it's a mobile app (PWA in standalone mode)
    const checkMobileApp = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                          (window.navigator as any).standalone === true;
      
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Only show loading screen if it's a PWA in standalone mode on mobile
      const showLoading = isStandalone && isMobileDevice;
      setShouldShowLoading(showLoading);
      
      // If not mobile app, complete loading immediately
      if (!showLoading) {
        setTimeout(() => onLoadingComplete(), 100);
        return;
      }
    };
    
    checkMobileApp();
    
    // If not showing loading, exit early
    if (!shouldShowLoading) {
      return;
    }

    // Play audio and show logo with improved audio handling
    const playAudioAndShowLogo = async () => {
      try {
        // Show logo immediately
        setLogoVisible(true);
        
        // Create and configure audio
        const audio = new Audio('/sounds/logo-sound.mp3');
        audio.volume = 0.8;
        audio.preload = 'auto';
        
        // Try multiple approaches for audio playback
        const attemptAudioPlay = async () => {
          try {
            // First attempt: direct play
            await audio.play();
            console.log('Audio played successfully');
          } catch (error) {
            console.log('Direct audio play failed, trying muted approach:', error);
            
            try {
              // Second attempt: muted then unmuted
              audio.muted = true;
              await audio.play();
              setTimeout(() => {
                audio.muted = false;
                console.log('Audio unmuted after muted play');
              }, 100);
            } catch (mutedError) {
              console.log('Muted audio play also failed:', mutedError);
              
              // Final fallback: wait for user interaction
              const playOnInteraction = async (event: Event) => {
                try {
                  audio.currentTime = 0;
                  audio.muted = false;
                  await audio.play();
                  console.log('Audio played on user interaction');
                } catch (interactionError) {
                  console.log('Audio play failed even on interaction:', interactionError);
                }
                
                // Remove all event listeners
                document.removeEventListener('touchstart', playOnInteraction);
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('keydown', playOnInteraction);
                document.removeEventListener('scroll', playOnInteraction);
              };
              
              // Add multiple event listeners for user interaction
              document.addEventListener('touchstart', playOnInteraction, { once: true });
              document.addEventListener('click', playOnInteraction, { once: true });
              document.addEventListener('keydown', playOnInteraction, { once: true });
              document.addEventListener('scroll', playOnInteraction, { once: true });
            }
          }
        };
        
        attemptAudioPlay();
        
      } catch (error) {
        console.log('Audio setup failed:', error);
        // Always show logo even if audio completely fails
        setLogoVisible(true);
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
  }, [onLoadingComplete, shouldShowLoading]);

  // Don't show loading screen if not mobile app or not visible
  if (!shouldShowLoading || !isVisible) {
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