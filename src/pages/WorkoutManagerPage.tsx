import React from 'react';
import { User } from '../utils/database';
import FileExplorer from '../components/FileExplorer';
import Header from '../components/Header';
import { ArrowLeft } from 'lucide-react';

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
      />
      
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            {/* Header con tasto indietro, titolo e descrizione centralizzati */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => onNavigate('coach-dashboard')}
                className="flex items-center justify-center w-12 h-12 bg-white border-2 border-red-600 rounded-full text-red-600 hover:bg-red-50 transition-all duration-300 transform hover:scale-110 shadow-lg"
                title="Torna alla Dashboard Coach"
              >
                <ArrowLeft size={20} />
              </button>
              
              <div className="text-center flex-1">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-blue-900 bg-clip-text text-transparent mb-2">
                  Gestionale Schede di Allenamento
                </h1>
                <p className="text-gray-600">
                  Organizza e gestisci le tue schede di allenamento con cartelle personalizzate
                </p>
              </div>
              
              <div className="w-12"></div> {/* Spacer per bilanciare il layout */}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <FileExplorer />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkoutManagerPage;