import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Search, Filter, TrendingUp, Users, Target, Calendar, Medal, Edit, Plus, Settings, Dumbbell, BarChart3, Award, ChevronLeft } from 'lucide-react';
import { useRankings } from '../hooks/useFirestore';
import MuscleGroupForm from '../components/MuscleGroupForm';
import ExerciseForm from '../components/ExerciseForm';
import EditableRankings from '../components/EditableRankings';
import Header from '../components/Header';
import { User } from '../utils/database';
import useIsStandaloneMobile from '../hooks/useIsStandaloneMobile';

interface ExerciseRecord {
  id: string;
  athleteName: string;
  athleteId: string;
  exercise: string;
  weight: number;
  reps: number;
  date: string;
  oneRepMax: number;
}

interface ExerciseCategory {
  name: string;
  exercises: string[];
  icon: React.ReactNode;
  color: string;
}

interface RankingsPageProps {
  onNavigate: (page: string) => void;
  currentUser: User | null;
  onLogout?: () => void;
}

// Move exerciseCategories outside component to prevent recreation on every render
const exerciseCategories: ExerciseCategory[] = [
  {
    name: 'Petto',
    exercises: ['Panca Piana', 'Panca Inclinata', 'Panca Declinata', 'Dips', 'Croci'],
    icon: <Target className="w-5 h-5" />,
    color: 'bg-red-500'
  },
  {
    name: 'Schiena',
    exercises: ['Stacco da Terra', 'Trazioni', 'Rematore', 'Lat Machine', 'Pulley'],
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'bg-blue-500'
  },
  {
    name: 'Gambe',
    exercises: ['Squat', 'Leg Press', 'Affondi', 'Stacco Rumeno', 'Leg Extension'],
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'bg-green-500'
  },
  {
    name: 'Spalle',
    exercises: ['Military Press', 'Alzate Laterali', 'Alzate Posteriori', 'Arnold Press'],
    icon: <Award className="w-5 h-5" />,
    color: 'bg-yellow-500'
  },
  {
    name: 'Braccia',
    exercises: ['Curl Bilanciere', 'French Press', 'Hammer Curl', 'Dips Tricipiti'],
    icon: <Medal className="w-5 h-5" />,
    color: 'bg-purple-500'
  }
];

const RankingsPage: React.FC<RankingsPageProps> = ({ onNavigate, currentUser, onLogout }) => {
  const { rankings, loading, error, createRanking, updateRanking, deleteRanking } = useRankings();
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ExerciseRecord[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'weight' | 'oneRepMax' | 'date'>('oneRepMax');
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'quarter' | 'year'>('all');
  const [showCompactTitle, setShowCompactTitle] = useState(false);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  
  // Stati per i modali CRUD
  const [showMuscleGroupModal, setShowMuscleGroupModal] = useState(false);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [showEditableRankings, setShowEditableRankings] = useState(false);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<any>(null);
  const [selectedExerciseData, setSelectedExerciseData] = useState<any>(null);
  const [muscleGroups, setMuscleGroups] = useState<Array<{ name: string; color: string; exercises: string[]; description?: string }>>([]);
  const [exercises, setExercises] = useState<Array<{ name: string; muscleGroup: string; difficulty: string; instructions: string[]; equipment: string[] }>>([]);

  // Converti classifiche Firestore in record di esercizi
  useEffect(() => {
    if (rankings.length > 0) {
      const exerciseRecords: ExerciseRecord[] = [];
      
      rankings.forEach(ranking => {
        ranking.entries.forEach((entry, index) => {
          exerciseRecords.push({
            id: `${ranking.id}-${entry.userId}-${index}`,
            athleteName: entry.userName,
            athleteId: entry.userId,
            exercise: ranking.exercise,
            weight: entry.value,
            reps: 1, // Default, potrebbe essere esteso nel modello
            date: entry.date,
            oneRepMax: entry.value // Assumiamo che il valore sia già il 1RM
          });
        });
      });
      
      setRecords(exerciseRecords);
    }
  }, [rankings]);

  // Filtri e ordinamento
  useEffect(() => {
    let filtered = records.filter(record => {
      const matchesSearch = record.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.exercise.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesExercise = selectedExercise === 'all' || record.exercise === selectedExercise;
      
      const matchesCategory = selectedCategory === 'all' || 
        exerciseCategories.find(cat => cat.name === selectedCategory)?.exercises.includes(record.exercise);
      
      const matchesTime = timeFilter === 'all' || (() => {
        const recordDate = new Date(record.date);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - recordDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (timeFilter) {
          case 'month': return diffDays <= 30;
          case 'quarter': return diffDays <= 90;
          case 'year': return diffDays <= 365;
          default: return true;
        }
      })();
      
      return matchesSearch && matchesExercise && matchesCategory && matchesTime;
    });

    // Ordinamento
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'weight':
          return b.weight - a.weight;
        case 'oneRepMax':
          return b.oneRepMax - a.oneRepMax;
        case 'date':
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        default:
          return b.oneRepMax - a.oneRepMax;
      }
    });

    setFilteredRecords(filtered);
  }, [records, searchTerm, selectedExercise, selectedCategory, sortBy, timeFilter]);

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

  // Ottieni tutti gli esercizi unici
  const allExercises = Array.from(new Set(records.map(r => r.exercise))).sort();
  const allAthletes = Array.from(new Set(records.map(r => r.athleteName))).sort();
  const allCategories = exerciseCategories.map(cat => cat.name);

  // Ottieni i top 3 per ogni esercizio
  const getTopThreeForExercise = (exercise: string) => {
    return records
      .filter(r => r.exercise === exercise)
      .sort((a, b) => b.oneRepMax - a.oneRepMax)
      .slice(0, 3);
  };

  // Statistiche generali
  const totalRecords = records.length;
  const uniqueAthletes = new Set(records.map(r => r.athleteId)).size;
  const uniqueExercises = new Set(records.map(r => r.exercise)).size;
  const averageOneRepMax = records.reduce((sum, r) => sum + r.oneRepMax, 0) / records.length;

  // Funzioni CRUD per gruppi muscolari
  const handleCreateMuscleGroup = async (data: any) => {
    try {
      // Qui andrà l'integrazione con Firestore
      setMuscleGroups(prev => [...prev, { ...data, id: Date.now().toString() }]);
      setShowMuscleGroupModal(false);
      setSelectedMuscleGroup(null);
    } catch (error) {
      console.error('Errore nella creazione del gruppo muscolare:', error);
    }
  };

  const handleUpdateMuscleGroup = async (data: any) => {
    try {
      // Qui andrà l'integrazione con Firestore
      setMuscleGroups(prev => prev.map(mg => mg.name === selectedMuscleGroup?.name ? { ...mg, ...data } : mg));
      setShowMuscleGroupModal(false);
      setSelectedMuscleGroup(null);
    } catch (error) {
      console.error('Errore nell\'aggiornamento del gruppo muscolare:', error);
    }
  };

  // Funzioni CRUD per esercizi
  const handleCreateExercise = async (data: any) => {
    try {
      // Qui andrà l'integrazione con Firestore
      setExercises(prev => [...prev, { ...data, id: Date.now().toString() }]);
      setShowExerciseModal(false);
      setSelectedExerciseData(null);
    } catch (error) {
      console.error('Errore nella creazione dell\'esercizio:', error);
    }
  };

  const handleUpdateExercise = async (data: any) => {
    try {
      // Qui andrà l'integrazione con Firestore
      setExercises(prev => prev.map(ex => ex.name === selectedExerciseData?.name ? { ...ex, ...data } : ex));
      setShowExerciseModal(false);
      setSelectedExerciseData(null);
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'esercizio:', error);
    }
  };

  // Funzioni CRUD per record classifiche
  const handleUpdateRecord = async (id: string, data: Partial<ExerciseRecord>) => {
    try {
      // Qui andrà l'integrazione con Firestore
      setRecords(prev => prev.map(record => record.id === id ? { ...record, ...data } : record));
    } catch (error) {
      console.error('Errore nell\'aggiornamento del record:', error);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    try {
      // Qui andrà l'integrazione con Firestore
      setRecords(prev => prev.filter(record => record.id !== id));
    } catch (error) {
      console.error('Errore nell\'eliminazione del record:', error);
    }
  };

  const handleAddRecord = async (data: Omit<ExerciseRecord, 'id'>) => {
    try {
      // Qui andrà l'integrazione con Firestore
      const newRecord = { ...data, id: Date.now().toString() };
      setRecords(prev => [...prev, newRecord]);
    } catch (error) {
      console.error('Errore nell\'aggiunta del record:', error);
    }
  };

  const closeAllModals = () => {
    setShowMuscleGroupModal(false);
    setShowExerciseModal(false);
    setSelectedMuscleGroup(null);
    setSelectedExerciseData(null);
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <span className="w-6 h-6 flex items-center justify-center text-gray-600 font-bold">{index + 1}</span>;
    }
  };

  const getRankBg = (index: number) => {
    switch (index) {
      case 0: return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-300';
      case 1: return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-300';
      case 2: return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-300';
      default: return 'bg-white border-gray-200';
    }
  };

  // Gestione stati di caricamento ed errore
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento classifiche...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Errore nel caricamento</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isStandaloneMobile = useIsStandaloneMobile();

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Header onNavigate={onNavigate} currentUser={currentUser} onLogout={onLogout} isDashboard={true} />
      {/* Titolo a comparsa rimosso su richiesta */}
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header compatto - nascosto in PWA standalone */}
          {!isStandaloneMobile && (
            <div className="flex items-center justify-between bg-white/60 backdrop-blur-md rounded-2xl ring-1 ring-black/10 shadow-sm px-4 py-3 mb-6">
              <button
                onClick={() => onNavigate('coach-dashboard')}
                className="inline-flex items-center justify-center transition-all duration-300 transform hover:scale-110 p-2 text-red-600 bg-white/60 backdrop-blur-sm rounded-2xl ring-1 ring-black/10 hover:bg-white/80 hover:shadow-sm active:scale-[0.98]"
                title="Torna alla Dashboard Coach"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="text-center flex-1">
                <h1 className="font-sfpro text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-navy-900 tracking-tight drop-shadow-sm mb-0.5">
                  Classifiche
                </h1>
                <p className="font-sfpro text-[#001f3f]/80 font-medium text-xs sm:text-sm">
                  Visualizza i massimali e i record degli atleti per ogni esercizio
                </p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowMuscleGroupModal(true)}
                  className="flex items-center px-3 py-2 bg-white/70 backdrop-blur-md ring-1 ring-black/10 text-gray-900 rounded-full hover:bg-white hover:shadow-md transition-all text-sm"
                  title="Gestisci Gruppi Muscolari"
                >
                  <Dumbbell size={16} className="mr-1" />
                  Gruppi
                </button>
                <button
                  onClick={() => setShowExerciseModal(true)}
                  className="flex items-center px-3 py-2 bg-white/70 backdrop-blur-md ring-1 ring-black/10 text-gray-900 rounded-full hover:bg-white hover:shadow-md transition-all text-sm"
                  title="Gestisci Esercizi"
                >
                  <Target size={16} className="mr-1" />
                  Esercizi
                </button>
                <button
                  onClick={() => setShowEditableRankings(!showEditableRankings)}
                  className="flex items-center px-3 py-2 bg-white/70 backdrop-blur-md ring-1 ring-black/10 text-gray-900 rounded-full hover:bg-white hover:shadow-md transition-all text-sm"
                  title="Modifica Classifiche"
                >
                  <Settings size={16} className="mr-1" />
                  Modifica
                </button>
              </div>
            </div>
          )}



          {/* Filtri compatti */}
          <div className="bg-white/70 backdrop-blur-md ring-1 ring-black/10 rounded-lg shadow-sm p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Cerca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Tutte categorie</option>
                {exerciseCategories.map(category => (
                  <option key={category.name} value={category.name}>{category.name}</option>
                ))}
              </select>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Tutti esercizi</option>
                {allExercises.map(exercise => (
                  <option key={exercise} value={exercise}>{exercise}</option>
                ))}
              </select>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="all">Tutti periodi</option>
                <option value="month">Ultimo mese</option>
                <option value="quarter">3 mesi</option>
                <option value="year">Anno</option>
              </select>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="oneRepMax">Per 1RM</option>
                <option value="weight">Per Peso</option>
                <option value="date">Per Data</option>
              </select>
            </div>
          </div>

          {/* Classifiche editabili o categorie */}
          {showEditableRankings ? (
            <EditableRankings
              records={filteredRecords}
              onUpdateRecord={handleUpdateRecord}
              onDeleteRecord={handleDeleteRecord}
              onAddRecord={handleAddRecord}
              exercises={allExercises}
              athletes={allAthletes}
              categories={allCategories}
            />
          ) : (
            <>
              {/* Categorie di esercizi compatte */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                {exerciseCategories.map(category => (
                  <div key={category.name} className="bg-white/70 backdrop-blur-md ring-1 ring-black/10 rounded-lg shadow-sm p-4">
                    <div className="flex items-center mb-3">
                      <div className={`${category.color} text-white p-2 rounded-lg mr-2`}>
                        {React.cloneElement(category.icon as React.ReactElement, { size: 16 })}
                      </div>
                      <h3 className="text-sm font-semibold text-gray-900">{category.name}</h3>
                    </div>
                    <div className="space-y-1">
                      {category.exercises.slice(0, 2).map(exercise => {
                        const topRecord = records
                          .filter(r => r.exercise === exercise)
                          .sort((a, b) => b.oneRepMax - a.oneRepMax)[0];
                        
                        return (
                          <div key={exercise} className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 truncate">{exercise}</span>
                            {topRecord && (
                              <span className="font-semibold text-gray-900 ml-1">
                                {topRecord.oneRepMax}kg
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Classifica principale - solo se non in modalità editing */}
          {!showEditableRankings && (
            <div className="bg-white/70 backdrop-blur-md ring-1 ring-black/10 rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Classifica ({filteredRecords.length} record)
                </h3>
              </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Posizione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atleta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Esercizio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Peso × Reps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      1RM Stimato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRecords.map((record, index) => (
                    <tr key={record.id} className={`hover:bg-gray-50 transition-colors ${getRankBg(index)} border-l-4`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getRankIcon(index)}
                          <span className="ml-2 font-semibold text-gray-900">#{index + 1}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-blue-900 rounded-full flex items-center justify-center text-white font-bold">
                            {record.athleteName.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{record.athleteName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{record.exercise}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          <span className="font-bold">{record.weight}kg</span> × {record.reps}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-lg font-bold text-red-600">{record.oneRepMax}kg</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString('it-IT')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

              {filteredRecords.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="mx-auto mb-4 text-gray-400" size={64} />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun record trovato</h3>
                  <p className="text-gray-600">
                    {searchTerm || selectedExercise !== 'all' || selectedCategory !== 'all' || timeFilter !== 'all'
                      ? 'Prova a modificare i filtri di ricerca'
                      : 'I record degli atleti appariranno qui quando saranno disponibili'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modali */}
      {showMuscleGroupModal && (
        <MuscleGroupForm
          muscleGroup={selectedMuscleGroup}
          onSubmit={selectedMuscleGroup ? handleUpdateMuscleGroup : handleCreateMuscleGroup}
          onCancel={closeAllModals}
          title={selectedMuscleGroup ? 'Modifica Gruppo Muscolare' : 'Nuovo Gruppo Muscolare'}
        />
      )}

      {showExerciseModal && (
        <ExerciseForm
          exercise={selectedExerciseData}
          onSubmit={selectedExerciseData ? handleUpdateExercise : handleCreateExercise}
          onCancel={closeAllModals}
          title={selectedExerciseData ? 'Modifica Esercizio' : 'Nuovo Esercizio'}
          muscleGroups={muscleGroups.length > 0 ? muscleGroups : exerciseCategories.map(cat => ({ name: cat.name, color: cat.color }))}
        />
      )}
    </div>
  );
};

export default RankingsPage;
