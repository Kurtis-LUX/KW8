import React, { useEffect, useState } from 'react';
import { User } from '../utils/database';
import FileExplorer from '../components/FileExplorer';
import Header from '../components/Header';
import { ChevronLeft, Plus, Menu } from 'lucide-react';
import useIsStandaloneMobile from '../hooks/useIsStandaloneMobile';

interface WorkoutManagerPageProps {
  onNavigate: (page: string) => void;
  currentUser: User | null;
}

const WorkoutManagerPage: React.FC<WorkoutManagerPageProps> = ({ onNavigate, currentUser }) => {
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const isStandaloneMobile = useIsStandaloneMobile();
  const PWA_BAR_HEIGHT = 52; // legacy: non più usato, titolo spostato in Header

  useEffect(() => {
    const onScroll = () => {
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
      {/* Titolo PWA e contenuti correlati spostati in Header */}
      
      <div style={{ paddingTop: isStandaloneMobile ? headerHeight : 80 }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          {/* Contenitore superfluo sopra cartelle/schede rimosso */}
          <FileExplorer currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

export default WorkoutManagerPage;
