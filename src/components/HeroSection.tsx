import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

interface HeroSectionProps {
  currentUser?: any;
  onNavigate?: (page: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ currentUser, onNavigate }) => {
  const { t } = useLanguageContext();
  const [displayText, setDisplayText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const fullText = t.heroTitle;
  
  useEffect(() => {
    setDisplayText(''); // Reset text when language changes
    setIsTypingComplete(false);
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
      }
    }, 100);
    
    return () => clearInterval(typingInterval);
  }, [fullText]);
  const scrollToStatistics = async () => {
    // Play audio when 'Scopri di più' button is clicked
    try {
      const audio = new Audio('/sounds/logo-sound.mp3');
      audio.volume = 0.8;
      await audio.play();
      console.log('Audio played on Scopri di più button click');
    } catch (error) {
      console.log('Audio play failed on Scopri di più click:', error);
    }
    
    const element = document.getElementById('statistiche');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback: prova a cercare la sezione in modo alternativo
      const sections = document.querySelectorAll('section');
      // Cerca la seconda sezione (dovrebbe essere StatisticsSection)
      if (sections.length >= 2) {
        const statisticsSection = sections[1];
        statisticsSection.scrollIntoView({ behavior: 'smooth' });
      }
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
        <h1 className={`text-4xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-wider animate-fadeInSlideUp ${isTypingComplete ? 'animate-pulse' : ''}`} style={{ fontFamily: 'Bebas Neue, cursive', minHeight: '1.2em' }}>
          <span style={{ fontFamily: 'Bebas Neue, cursive' }}>
            {displayText.split(' ').map((word, index) => {
              if (word === 'CROSS' || word === 'YOUR') {
                return <span key={index} className="text-white">{word}</span>;
              } else if (word === 'LIMITS.') {
                return <span key={index} className="text-red-500">{word}</span>;
              }
              return <span key={index}>{word}</span>;
            }).reduce((prev, curr, index) => [prev, ' ', curr])}
          </span>
          {!isTypingComplete && <span className="animate-pulse" style={{ fontFamily: 'Bebas Neue, cursive' }}>|</span>}
        </h1>
        
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button
            onClick={scrollToStatistics}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl animate-pulse-subtle"
          >
            {t.discoverMore}
          </button>
          

         </div>
       </div>
     </section>
  );
};

export default HeroSection;