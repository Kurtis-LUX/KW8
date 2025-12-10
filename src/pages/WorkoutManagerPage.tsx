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
    const headerEl = document.querySelector('header');
    if (!headerEl) return;
    const update = () => setHeaderHeight(headerEl.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(headerEl);
    const mo = new MutationObserver(() => update());
    mo.observe(headerEl, { childList: true, subtree: true });
    const onOrientation = () => update();
    window.addEventListener('orientationchange', onOrientation);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('orientationchange', onOrientation);
    };
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

      {/* Titolo pagina desktop + tasto indietro, identico a Gestione atleti */}
      {!isStandaloneMobile && (
        <div style={{ paddingTop: headerHeight || 80 }} className="mb-2">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => onNavigate('coach-dashboard')}
                className="absolute left-0 inline-flex items-center justify-center transition-all duration-300 transform hover:scale-110 p-2 bg-white ring-1 ring-black/10 rounded-2xl shadow-sm hover:bg-white active:scale-[0.98] shrink-0"
                title="Torna alla Dashboard Coach"
                aria-label="Torna alla Dashboard Coach"
              >
                <ChevronLeft size={20} className="block text-black" />
              </button>
              <h2 className="font-sfpro text-base sm:text-lg font-bold text-gray-900 tracking-tight text-center">Gestione schede</h2>
            </div>
          </div>
        </div>
      )}

      <div style={{ paddingTop: isStandaloneMobile ? headerHeight : 0 }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-5">
          {/* Contenitore superfluo sopra cartelle/schede rimosso */}
          <FileExplorer currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

export default WorkoutManagerPage;
