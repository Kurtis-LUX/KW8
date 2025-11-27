import React, { useEffect, useState } from 'react';
import { User } from '../utils/database';
import FileExplorer from '../components/FileExplorer';
import Header from '../components/Header';
import { ArrowLeft, ChevronLeft } from 'lucide-react';
import useIsStandaloneMobile from '../hooks/useIsStandaloneMobile';

interface WorkoutManagerPageProps {
  onNavigate: (page: string) => void;
  currentUser: User | null;
}

const WorkoutManagerPage: React.FC<WorkoutManagerPageProps> = ({ onNavigate, currentUser }) => {
  const [showCompactTitle, setShowCompactTitle] = useState(false);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const isStandaloneMobile = useIsStandaloneMobile();

  useEffect(() => {
    const onScroll = () => {
      // Mostra il titolo compatto quando si supera una piccola soglia di scroll
      setShowCompactTitle(window.scrollY > 60);
      // Aggiorna l'altezza dell'header (può variare con lo scroll)
      const headerEl = document.querySelector('header');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
    };
    const onResize = () => {
      const headerEl = document.querySelector('header');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
    };
    // Inizializza altezza header
    const initHeader = () => {
      const headerEl = document.querySelector('header');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
    };
    initHeader();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        onNavigate={onNavigate} 
        currentUser={currentUser}
        showAuthButtons={false}
        isDashboard={true}
        currentPage={'workout-manager'}
      />
      {/* Titolo compatto sticky sotto l'header principale (stile iOS) - nascosto in PWA standalone */}
      {!isStandaloneMobile && (
      <div
        className={`fixed left-0 right-0 z-40 transition-all duration-300 ${showCompactTitle ? 'opacity-100 translate-y-0 backdrop-blur-sm' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
        aria-hidden={!showCompactTitle}
        style={{ top: headerHeight || undefined }}
      >
        <div className="container mx-auto px-6 py-2 flex items-center justify-between">
          <button
            onClick={() => onNavigate('coach-dashboard')}
            className="inline-flex items-center justify-center transition-all duration-300 transform hover:scale-110 p-1.5 text-red-600 bg-transparent hover:bg-transparent active:scale-[0.98]"
            title="Torna alla Dashboard Coach"
            aria-label="Torna alla Dashboard Coach"
          >
            <ChevronLeft size={20} className="block" />
          </button>

          <div className="text-center flex-1">
            <h2 className="font-sfpro text-base sm:text-lg font-semibold text-gray-900 tracking-tight">Gestione schede</h2>
          </div>

          <div className="w-8"></div>
        </div>
      </div>
      )}
      
      <div className="pt-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          {!isStandaloneMobile && (
          <div className="mb-4">
            {/* Header allineato alla Dashboard Coach */}
            <div className="flex items-center justify-between bg-white/60 backdrop-blur-md rounded-2xl ring-1 ring-black/10 shadow-sm px-3 py-2">
              <button
                onClick={() => onNavigate('coach-dashboard')}
                className="inline-flex items-center justify-center transition-all duration-300 transform hover:scale-110 p-1.5 text-red-600 bg-white/60 backdrop-blur-sm rounded-2xl ring-1 ring-black/10 hover:bg-white/80 hover:shadow-sm active:scale-[0.98]"
                title="Torna alla Dashboard Coach"
              >
                <ChevronLeft size={20} className="block" />
              </button>

              <div className="text-center flex-1">
                <h1 className="font-sfpro text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-navy-900 tracking-tight drop-shadow-sm mb-0.5">Gestione schede</h1>
                <p className="font-sfpro text-[#001f3f]/80 font-medium text-xs sm:text-sm">Crea e gestisci le schede di allenamento</p>
              </div>

              <div className="w-8"></div>
            </div>
          </div>
          )}
          
          {/* Rimosso il contenitore inferiore (div sotto) */}
          <FileExplorer currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

export default WorkoutManagerPage;