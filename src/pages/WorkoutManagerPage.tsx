import React from 'react';
import { User } from '../utils/database';
import FileExplorer from '../components/FileExplorer';
import Header from '../components/Header';

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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Gestionale Schede di Allenamento
            </h1>
            <p className="text-gray-600">
              Organizza e gestisci le tue schede di allenamento con cartelle personalizzate
            </p>
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