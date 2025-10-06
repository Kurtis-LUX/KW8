import React from 'react';
import { User } from '../utils/database';
import FileExplorer from '../components/FileExplorer';
import Header from '../components/Header';
import { ArrowLeft, ChevronLeft } from 'lucide-react';

interface WorkoutManagerPageProps {
  onNavigate: (page: string) => void;
  currentUser: User | null;
}

const WorkoutManagerPage: React.FC<WorkoutManagerPageProps> = ({ onNavigate, currentUser }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onNavigate={onNavigate} 
        currentUser={currentUser}
        showAuthButtons={false}
        isDashboard={true}
      />
      
      <div className="pt-20">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            {/* Header con tasto indietro e titolo centralizzato (stile Apple) */}
            <div className="flex items-center justify-between bg-white/60 backdrop-blur-md rounded-2xl ring-1 ring-black/10 shadow-sm px-4 py-3">
              <button
              onClick={() => onNavigate('coach-dashboard')}
              className="inline-flex items-center justify-center transition-all duration-300 transform hover:scale-110 p-2 text-red-600 bg-white/60 backdrop-blur-sm rounded-2xl ring-1 ring-black/10 hover:bg-white/80 hover:shadow-sm active:scale-[0.98]"
              title="Torna alla Dashboard Coach"
            >
              <ChevronLeft size={24} className="block" />
            </button>
              
              <div className="text-center flex-1">
                <h1 className="font-sfpro text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-navy-900 tracking-tight drop-shadow-sm mb-1">Gestione schede</h1>
                <p className="font-sfpro text-[#001f3f]/90 font-medium text-sm sm:text-base">Crea e gestisci le schede di allenamento</p>
              </div>
              
              <div className="w-10"></div> {/* Spacer per bilanciare il layout */}
            </div>
          </div>
          
          {/* Rimosso il contenitore inferiore (div sotto) */}
          <FileExplorer currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
};

export default WorkoutManagerPage;