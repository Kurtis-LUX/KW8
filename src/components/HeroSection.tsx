import React, { useState, useEffect } from 'react';

const HeroSection: React.FC = () => {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'CROSS YOUR LIMITS.';
  
  useEffect(() => {
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);
    
    return () => clearInterval(typingInterval);
  }, []);
  const scrollToStatistics = () => {
    const element = document.getElementById('statistiche');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section 
      className="relative h-screen flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'url(/images/heropalestra.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Navy Blue Overlay */}
      <div className="absolute inset-0 bg-blue-900 opacity-50 z-0"></div>
      
      {/* Content */}
      <div className="relative z-10 text-center text-white px-4">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 tracking-wider animate-fadeInSlideUp animate-bounce-subtle" style={{ fontFamily: 'Bebas Neue, cursive', minHeight: '1.2em' }}>
          <span style={{ fontFamily: 'Bebas Neue, cursive' }}>{displayText}</span><span className="animate-pulse" style={{ fontFamily: 'Bebas Neue, cursive' }}>|</span>
        </h1>
        
        <button
          onClick={scrollToStatistics}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl animate-pulse-subtle"
        >
          SCOPRI DI PIÙ
        </button>
      </div>
    </section>
  );
};

export default HeroSection;