import React, { useState, useEffect } from 'react';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoadingComplete }) => {
  const [logoVisible, setLogoVisible] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [shouldShowLoading, setShouldShowLoading] = useState(false);
  const [showEnterButton, setShowEnterButton] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);
  const [particles, setParticles] = useState<Array<{id: number, x: number, y: number, vx: number, vy: number}>>([]);

  const handleEnterClick = async () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    // Play audio when ENTER button is clicked
    try {
      const audio = new Audio('/sounds/logo-sound.mp3');
      audio.volume = 0.8;
      await audio.play();
      console.log('Audio played on ENTER button click');
    } catch (error) {
      console.log('Audio play failed on ENTER click:', error);
    }
    
    // Phase 1: Button explosion with particles
    setAnimationPhase(1);
    const newParticles = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: 50,
      y: 50,
      vx: (Math.random() - 0.5) * 20,
      vy: (Math.random() - 0.5) * 20
    }));
    setParticles(newParticles);
    
    setTimeout(() => {
      // Phase 2: Logo zoom and rotation
      setAnimationPhase(2);
      
      setTimeout(() => {
        // Phase 3: Screen ripple effect
        setAnimationPhase(3);
        
        setTimeout(() => {
          // Phase 4: Final fade out
          setAnimationPhase(4);
          setIsVisible(false);
          
          setTimeout(() => {
            onLoadingComplete();
          }, 800);
        }, 600);
      }, 800);
    }, 400);
  };

  useEffect(() => {
    // Only show loading screen on mobile devices or PWA
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true;
    
    setShouldShowLoading(isMobile || isPWA);

    // If not mobile/PWA, skip loading screen
    if (!isMobile && !isPWA) {
      onLoadingComplete();
      return;
    }

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
          // Show ENTER button when progress completes
          setTimeout(() => {
            setShowEnterButton(true);
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 30); // Slightly faster progress

    // Minimum 2 seconds loading time
    const minLoadingTimer = setTimeout(() => {
      if (progress >= 100) {
        setShowEnterButton(true);
      }
    }, 2000);

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
    <div className={`fixed inset-0 bg-blue-900 z-50 flex flex-col items-center justify-center transition-all duration-500 ${
      animationPhase === 3 ? 'animate-pulse' : ''
    } ${
      animationPhase === 4 ? 'scale-110 opacity-0' : ''
    }`}>
      {/* Background pattern with ripple effect */}
      <div className={`absolute inset-0 opacity-10 transition-all duration-1000 ${
        animationPhase === 3 ? 'animate-ping scale-150' : ''
      }`}>
        <div className="w-full h-full bg-gradient-to-br from-red-500 to-transparent"></div>
      </div>
      
      {/* Particles */}
      {animationPhase === 1 && particles.map(particle => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 bg-red-500 rounded-full animate-ping"
          style={{
            left: `calc(50% + ${particle.vx * 10}px)`,
            top: `calc(50% + ${particle.vy * 10}px)`,
            animation: `particleExplosion 0.4s ease-out forwards`
          }}
        />
      ))}
      
      {/* Logo */}
      <div className={`mb-8 transition-all duration-1000 transform ${
        logoVisible ? 'opacity-100' : 'opacity-0'
      } ${
        animationPhase === 2 ? 'scale-150 rotate-360 animate-spin' : animationPhase === 1 ? 'animate-pulse' : 'animate-pulse'
      }`}>
        <div className="text-white text-center">
          <div className="relative">
            <img 
              src="/images/logo.png" 
              alt="KW8 Logo" 
              className={`h-24 md:h-32 w-auto mx-auto mb-4 transition-all duration-800 ${
                animationPhase === 2 ? 'filter brightness-150 drop-shadow-2xl' : ''
              }`}
            />
          </div>
          <p className={`text-xl md:text-2xl font-light tracking-wider transition-all duration-800 ${
            animationPhase === 2 ? 'text-red-400 animate-bounce' : ''
          }`} style={{ fontFamily: 'Bebas Neue, cursive' }}>
            CROSS YOUR LIMITS.
          </p>
        </div>
      </div>

      {/* Loading bar */}
      <div className={`w-64 md:w-80 h-1 bg-white bg-opacity-20 rounded-full overflow-hidden transition-all duration-500 ${
        animationPhase >= 1 ? 'opacity-0 scale-0' : ''
      }`}>
        <div 
          className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-100 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      {/* Loading text */}
      {!showEnterButton && (
        <p className={`text-white text-sm mt-4 opacity-70 animate-pulse transition-all duration-500 ${
          animationPhase >= 1 ? 'opacity-0 scale-0' : ''
        }`}>
          Caricamento in corso...
        </p>
      )}
      
      {/* ENTER Button */}
      {showEnterButton && (
        <button
          onClick={handleEnterClick}
          disabled={isAnimating}
          className={`mt-6 px-8 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold text-lg rounded-full shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl relative overflow-hidden group ${
            !isAnimating ? 'animate-bounce' : ''
          } ${
            animationPhase === 1 ? 'scale-0 opacity-0 rotate-180' : ''
          } ${
            isAnimating ? 'cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <span className="relative z-10">ENTRA</span>
          {/* Light reflection animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-30 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-all duration-700 ease-out"></div>
        </button>
      )}
      
      {/* Custom CSS for particle animation */}
      <style jsx>{`
        @keyframes particleExplosion {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--particle-x, 0), var(--particle-y, 0)) scale(0);
            opacity: 0;
          }
        }
        
        @keyframes rotate-360 {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;