import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, TrendingUp, Calendar, BarChart3, LineChart, Activity, ChevronLeft } from 'lucide-react';
import Header from '../components/Header';
import { useUsers } from '../hooks/useFirestore';
import { User as FirestoreUser } from '../services/firestoreService';
import useIsStandaloneMobile from '../hooks/useIsStandaloneMobile';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'athlete' | 'coach';
}

interface AthleteStatisticsPageProps {
  onNavigate: (page: string) => void;
  currentUser: User | null;
  onLogout?: () => void;
}

interface AthleteData {
  id: string;
  name: string;
  email: string;
  joinDate: string;
  activeWorkouts: number;
  completedSessions: number;
  progressData: {
    exercise: string;
    sessions: { date: string; weight: number; reps: number; sets: number }[];
  }[];
}

const AthleteStatisticsPage: React.FC<AthleteStatisticsPageProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [selectedAthlete, setSelectedAthlete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'history'>('overview');
  const { users: firestoreUsers, loading, error } = useUsers();
  const [athletes, setAthletes] = useState<AthleteData[]>([]);
  const [showCompactTitle, setShowCompactTitle] = useState(false);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const isStandaloneMobile = useIsStandaloneMobile();

  // Converti utenti Firestore in atleti
  useEffect(() => {
    if (firestoreUsers) {
      const athleteData: AthleteData[] = firestoreUsers
        .filter(user => user.role === 'athlete') // Solo atleti reali
        .map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          joinDate: user.createdAt || new Date().toISOString(),
          activeWorkouts: 0, // Da implementare con dati reali
          completedSessions: 0, // Da implementare con dati reali
          progressData: [] // Da implementare con dati reali
        }));
      setAthletes(athleteData);
    }
  }, [firestoreUsers]);

  // Gestione titolo compatto sticky e altezza header: gli hook devono essere sempre chiamati
  useEffect(() => {
    const onScroll = () => {
      setShowCompactTitle(window.scrollY > 60);
      const headerEl = document.querySelector('header');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
    };
    const onResize = () => {
      const headerEl = document.querySelector('header');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
    };
    const initHeader = () => {
      const headerEl = document.querySelector('header');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
    };
    initHeader();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Gestione loading e errori
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento atleti...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Errore nel caricamento: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }


  // Dati mock per il progresso (da sostituire con dati reali quando disponibili)
  const mockProgressData = [
    {
      exercise: 'Squat',
      sessions: [
        { date: '2024-01-15', weight: 80, reps: 8, sets: 3 },
        { date: '2024-01-22', weight: 85, reps: 8, sets: 3 },
        { date: '2024-01-29', weight: 90, reps: 8, sets: 3 },
        { date: '2024-02-05', weight: 95, reps: 8, sets: 3 },
      ]
    },
    {
      exercise: 'Panca piana',
      sessions: [
        { date: '2024-01-15', weight: 60, reps: 10, sets: 3 },
        { date: '2024-01-22', weight: 65, reps: 10, sets: 3 },
        { date: '2024-01-29', weight: 70, reps: 10, sets: 3 },
        { date: '2024-02-05', weight: 75, reps: 10, sets: 3 },
      ]
    }
  ];

  const selectedAthleteData = athletes.find(a => a.id === selectedAthlete);
  
  // Aggiungi dati mock di progresso all'atleta selezionato se disponibile
  if (selectedAthleteData && mockProgressData) {
    selectedAthleteData.progressData = mockProgressData;
  }

  const renderProgressChart = (exerciseData: AthleteData['progressData'][0]) => {
    const maxWeight = Math.max(...exerciseData.sessions.map(s => s.weight));
    const minWeight = Math.min(...exerciseData.sessions.map(s => s.weight));
    const range = maxWeight - minWeight || 1;

    return (
      <div className="bg-white/70 backdrop-blur-md ring-1 ring-black/10 p-6 rounded-lg shadow-sm mb-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <BarChart3 className="mr-2" size={20} />
          {exerciseData.exercise}
        </h4>
        <div className="relative h-40 bg-gray-50 rounded-lg p-4">
          <div className="flex items-end justify-between h-full">
            {exerciseData.sessions.map((session, index) => {
              const height = range > 0 ? ((session.weight - minWeight) / range) * 100 : 50;
              return (
                <div key={index} className="flex flex-col items-center">
                  <div className="text-xs text-gray-600 mb-1">{session.weight}kg</div>
                  <div 
                    className="bg-blue-500 rounded-t w-8 transition-all duration-300 hover:bg-blue-600"
                    style={{ height: `${Math.max(height, 10)}%` }}
                    title={`${session.weight}kg - ${session.reps}x${session.sets}`}
                  ></div>
                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(session.date).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <span className="font-medium">Progresso:</span> {minWeight}kg → {maxWeight}kg 
          <span className="text-green-600 font-medium">(+{maxWeight - minWeight}kg)</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onNavigate={onNavigate} 
        currentUser={currentUser}
        onLogout={onLogout}
        showAuthButtons={false}
        isDashboard={true}
      />
      {/* Titolo a comparsa rimosso su richiesta */}
      
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          {/* Header con tasto indietro */}
          {!isStandaloneMobile && (
            <div className="flex items-center justify-between bg-white/60 backdrop-blur-md rounded-2xl ring-1 ring-black/10 shadow-sm px-6 py-3 mb-6">
              <button
                onClick={() => onNavigate('coach-dashboard')}
                className="inline-flex items-center justify-center transition-all duration-300 transform hover:scale-110 p-2 text-red-600 bg-white/60 backdrop-blur-sm rounded-2xl ring-1 ring-black/10 hover:bg-white/80 hover:shadow-sm active:scale-[0.98]"
                title="Torna alla Dashboard Coach"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="text-center flex-1">
                <h1 className="font-sfpro text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-navy-900 tracking-tight drop-shadow-sm mb-0.5">
                  Statistiche Atleti
                </h1>
                <p className="font-sfpro text-[#001f3f]/80 font-medium text-xs sm:text-sm">
                  Monitora i progressi e le performance dei tuoi atleti
                </p>
              </div>
              
              <div className="w-12"></div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Lista Atleti */}
            <div className="lg:col-span-1">
              <div className="bg-white/70 backdrop-blur-md ring-1 ring-black/10 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Users className="mr-2" size={20} />
                  I Tuoi Atleti
                </h3>
                <div className="space-y-3">
                  {athletes.map((athlete) => (
                    <button
                      key={athlete.id}
                      onClick={() => setSelectedAthlete(athlete.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedAthlete === athlete.id
                          ? 'bg-blue-100 border-2 border-blue-500'
                          : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                      }`}
                    >
                      <div className="font-medium text-gray-800">{athlete.name}</div>
                      <div className="text-sm text-gray-600">{athlete.email}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {athlete.completedSessions} sessioni completate
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Dettagli Atleta */}
            <div className="lg:col-span-3">
              {selectedAthleteData ? (
                <div>
                  {/* Header Atleta */}
                  <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-800">{selectedAthleteData.name}</h2>
                        <p className="text-gray-600">{selectedAthleteData.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Iscritto dal</div>
                        <div className="font-medium text-gray-800">
                          {new Date(selectedAthleteData.joinDate).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>
                    
                    {/* Statistiche rapide */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Activity className="text-blue-600 mr-2" size={20} />
                          <div>
                            <div className="text-sm text-gray-600">Schede Attive</div>
                            <div className="text-xl font-bold text-blue-600">{selectedAthleteData.activeWorkouts}</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <TrendingUp className="text-green-600 mr-2" size={20} />
                          <div>
                            <div className="text-sm text-gray-600">Sessioni Completate</div>
                            <div className="text-xl font-bold text-green-600">{selectedAthleteData.completedSessions}</div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Calendar className="text-orange-600 mr-2" size={20} />
                          <div>
                            <div className="text-sm text-gray-600">Giorni di Attività</div>
                            <div className="text-xl font-bold text-orange-600">
                              {Math.floor((new Date().getTime() - new Date(selectedAthleteData.joinDate).getTime()) / (1000 * 60 * 60 * 24))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tab Navigation */}
                  <div className="bg-white rounded-lg shadow mb-6">
                    <div className="flex border-b">
                      <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-3 font-medium transition-colors ${
                          activeTab === 'overview'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Panoramica
                      </button>
                      <button
                        onClick={() => setActiveTab('progress')}
                        className={`px-6 py-3 font-medium transition-colors ${
                          activeTab === 'progress'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Progressi Esercizi
                      </button>
                      <button
                        onClick={() => setActiveTab('history')}
                        className={`px-6 py-3 font-medium transition-colors ${
                          activeTab === 'history'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        Storico Modifiche
                      </button>
                    </div>
                  </div>

                  {/* Tab Content */}
                  {activeTab === 'overview' && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Panoramica Generale</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Schede Assegnate</h4>
                          <div className="space-y-2">
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium">Scheda Forza - Livello Intermedio</div>
                              <div className="text-sm text-gray-600">Assegnata il 15/01/2024</div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium">Scheda Ipertrofia - Upper Body</div>
                              <div className="text-sm text-gray-600">Assegnata il 22/01/2024</div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-700 mb-3">Ultime Attività</h4>
                          <div className="space-y-2">
                            <div className="p-3 bg-green-50 rounded-lg">
                              <div className="font-medium text-green-800">Sessione completata</div>
                              <div className="text-sm text-green-600">Squat - 95kg x 8 reps</div>
                              <div className="text-xs text-gray-500">2 ore fa</div>
                            </div>
                            <div className="p-3 bg-blue-50 rounded-lg">
                              <div className="font-medium text-blue-800">Nuova scheda assegnata</div>
                              <div className="text-sm text-blue-600">Scheda Cardio - HIIT</div>
                              <div className="text-xs text-gray-500">1 giorno fa</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'progress' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800 mb-6">Progressi per Esercizio</h3>
                      {selectedAthleteData.progressData.map((exerciseData, index) => (
                        <div key={index}>
                          {renderProgressChart(exerciseData)}
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'history' && (
                    <div className="bg-white rounded-lg shadow p-6">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Storico Modifiche</h3>
                      <div className="space-y-4">
                        <div className="border-l-4 border-blue-500 pl-4">
                          <div className="font-medium text-gray-800">Scheda modificata</div>
                          <div className="text-sm text-gray-600">Aggiunto esercizio "Military Press" alla scheda Upper Body</div>
                          <div className="text-xs text-gray-500">05/02/2024 - 14:30</div>
                        </div>
                        <div className="border-l-4 border-green-500 pl-4">
                          <div className="font-medium text-gray-800">Nuova scheda assegnata</div>
                          <div className="text-sm text-gray-600">Assegnata "Scheda Ipertrofia - Upper Body"</div>
                          <div className="text-xs text-gray-500">22/01/2024 - 10:15</div>
                        </div>
                        <div className="border-l-4 border-orange-500 pl-4">
                          <div className="font-medium text-gray-800">Parametri aggiornati</div>
                          <div className="text-sm text-gray-600">Aumentato peso Squat da 90kg a 95kg</div>
                          <div className="text-xs text-gray-500">15/01/2024 - 16:45</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                  <Users className="mx-auto mb-4 text-gray-400" size={64} />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Seleziona un Atleta</h3>
                  <p className="text-gray-600">
                    Scegli un atleta dalla lista a sinistra per visualizzare le sue statistiche e progressi.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteStatisticsPage;
