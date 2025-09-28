// Componente per animazioni di caricamento tra le pagine
import React, { useEffect, useState } from 'react';

interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  duration?: number; // durata in millisecondi
}

const LoadingTransition: React.FC<LoadingTransitionProps> = ({ 
  isLoading, 
  children, 
  duration = 300 
}) => {
  const [showContent, setShowContent] = useState(!isLoading);
  const [fadeClass, setFadeClass] = useState(isLoading ? 'opacity-0' : 'opacity-100');

  useEffect(() => {
    if (isLoading) {
      setFadeClass('opacity-0');
      setShowContent(false);
    } else {
      // Breve delay per permettere il fade out
      const timer = setTimeout(() => {
        setShowContent(true);
        setFadeClass('opacity-100');
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-navy-900 mx-auto mb-2"></div>
          <p className="text-gray-500 text-sm animate-pulse">Caricamento...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`transition-opacity duration-${duration} ${fadeClass}`}
      style={{ transitionDuration: `${duration}ms` }}
    >
      {showContent && children}
    </div>
  );
};

export default LoadingTransition;