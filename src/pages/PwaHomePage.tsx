import React, { useEffect, useState } from 'react';
import AnnouncementsSection from '../components/AnnouncementsSection';
import { useLanguageContext } from '../contexts/LanguageContext';

interface PwaHomePageProps {
  onNavigate: (page: string) => void;
  currentUser?: any | null;
  lastAuthEvent?: 'register' | 'login' | null;
}

const PwaHomePage: React.FC<PwaHomePageProps> = ({ onNavigate, currentUser, lastAuthEvent }) => {
  const { t } = useLanguageContext();
  const [displayText, setDisplayText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const fullText = t.heroTitle;

  useEffect(() => {
    setDisplayText('');
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
  const deriveNameFromEmail = (email?: string): string => {
    if (!email) return '';
    const local = email.split('@')[0];
    return local
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const displayName = (currentUser?.name || '').trim() || deriveNameFromEmail(currentUser?.email);
  const greeting = lastAuthEvent === 'register' ? 'Benvenuto' : 'Bentornato';
  return (
    <>
    <section
      className="relative min-h-[100svh] flex items-center justify-center overflow-hidden"
      style={{
        backgroundImage: 'url(/images/heropalestra.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Overlay identico alla Hero */}
      <div className="absolute inset-0 bg-blue-900 opacity-50 z-0"></div>

      {/* Titolo "CROSS YOUR LIMITS." sotto la header (top della pagina) */}
      <div className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-6 pt-3 pb-2">
          <h1
            className={`text-4xl md:text-7xl lg:text-8xl font-bold mb-2 tracking-wider animate-fadeInSlideUp ${isTypingComplete ? 'animate-pulse' : ''}`}
            style={{ fontFamily: 'Bebas Neue, cursive', minHeight: '1.2em' }}
          >
            <span style={{ fontFamily: 'Bebas Neue, cursive' }}>
              {displayText.split(' ').map((word, index) => {
                if (word === 'CROSS' || word === 'YOUR') {
                  return <span key={index} className="text-white">{word}</span>;
                } else if (word === 'LIMITS.') {
                  return <span key={index} className="text-red-500">{word}</span>;
                }
                return <span key={index}>{word}</span>;
              }).reduce((prev, curr) => (Array.isArray(prev) ? [...prev, ' ', curr] : [prev, ' ', curr]))}
            </span>
            {!isTypingComplete && <span className="animate-pulse" style={{ fontFamily: 'Bebas Neue, cursive' }}>|</span>}
          </h1>
        </div>
      </div>

      {/* Contenuto centrale */}
      <div className="relative z-10 w-full max-w-md px-6 text-center">
        {!currentUser ? (
          <div className="space-y-4">
            <button
              onClick={() => onNavigate('athlete-register')}
              className="w-3/4 mx-auto bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-3xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              Registrati
            </button>
            <button
              onClick={() => onNavigate('athlete-auth')}
              className="w-3/4 mx-auto bg-white/90 hover:bg-white text-red-600 font-bold py-4 px-6 rounded-3xl text-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl"
            >
              Accedi
            </button>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center">
            <h2 className="font-semibold tracking-tight whitespace-nowrap overflow-hidden text-ellipsis"
                style={{ fontFamily: 'SF Pro Display, system-ui, -apple-system', fontSize: 'clamp(24px, 7vw, 36px)' }}>
              <span className="text-white">Ciao</span>
              <span className="text-red-600 font-bold"> {displayName}</span>
            </h2>
          </div>
        )}
      </div>
    </section>
    {/* Sezione Avvisi - sotto la hero */}
    <AnnouncementsSection />
    </>
  );
};

export default PwaHomePage;
