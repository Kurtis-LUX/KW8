import React, { useState, useEffect } from 'react';
import DB from '../utils/database';
import { ArrowLeft, Calendar, Clock, Dumbbell, Target, CheckCircle, Play, Download, User as UserIcon, Settings } from 'lucide-react';
import FileExplorer from '../components/FileExplorer';



interface WorkoutsPageProps {
  onNavigate: (page: string) => void;
  currentUser: User | null;
  defaultTab?: string;
}

const WorkoutsPage: React.FC<WorkoutsPageProps> = ({ onNavigate, currentUser, defaultTab = 'current' }) => {
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [assignedWorkouts, setAssignedWorkouts] = useState([]);
  const [selectedWorkout, setSelectedWorkout] = useState(null);
  const [workoutHistory, setWorkoutHistory] = useState([
    {
      date: '2025-01-20',
      name: 'Upper Body Strength',
      duration: '75 min',
      exercises: 8,
      completed: true
    },
    {
      date: '2025-01-18',
      name: 'Lower Body Power',
      duration: '60 min',
      exercises: 6,
      completed: true
    },
    {
      date: '2025-01-16',
      name: 'Full Body Circuit',
      duration: '45 min',
      exercises: 10,
      completed: true
    }
  ]);
  const [availablePrograms, setAvailablePrograms] = useState([
    {
      name: 'Programma Massa',
      coach: 'Giuseppe Pandolfo',
      duration: '12 settimane',
      level: 'Intermedio',
      focus: 'Ipertrofia',
      image: '/images/programma-massa.jpg'
    },
    {
      name: 'Cross training Beginner',
      coach: 'Saverio Di Maria',
      duration: '6 settimane',
      level: 'Principiante',
      focus: 'Condizionamento',
      image: '/images/crossfit.jpg'
    },
    {
      name: 'Functional Training',
      coach: 'Giuseppe Pandolfo',
      duration: '8 settimane',
      level: 'Avanzato',
      focus: 'Funzionale',
      image: '/images/functional.jpg'
    }
  ]);

  useEffect(() => {
    // Verifica se l'utente è autenticato
    if (!currentUser) {
      onNavigate('home');
      return;
    }
    
    // Carica le schede assegnate all'atleta
    loadAssignedWorkouts();
  }, [currentUser]);

  const loadAssignedWorkouts = () => {
    if (!currentUser || !currentUser.workoutPlans || currentUser.workoutPlans.length === 0) {
      setAssignedWorkouts([]);
      return;
    }

    const allWorkoutPlans = DB.getWorkoutPlans();
    const userWorkoutPlans = allWorkoutPlans.filter(plan => 
      currentUser.workoutPlans.includes(plan.id)
    );
    
    setAssignedWorkouts(userWorkoutPlans);
    if (userWorkoutPlans.length > 0 && !selectedWorkout) {
      setSelectedWorkout(userWorkoutPlans[0]);
    }
  };

  const calculateProgress = (workout) => {
    if (!workout.exercises || workout.exercises.length === 0) return 0;
    const completedExercises = workout.exercises.filter(ex => ex.completed).length;
    return Math.round((completedExercises / workout.exercises.length) * 100);
  };

  const toggleExerciseCompletion = (exerciseIndex) => {
    if (!selectedWorkout) return;
    
    const updatedWorkout = { ...selectedWorkout };
    updatedWorkout.exercises[exerciseIndex].completed = !updatedWorkout.exercises[exerciseIndex].completed;
    
    DB.saveWorkoutPlan(updatedWorkout);
    setSelectedWorkout(updatedWorkout);
    loadAssignedWorkouts();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-navy-900 hover:text-red-600 transition-colors duration-300"
          >
            <ArrowLeft size={24} />
            <span className="font-semibold">Torna alla home</span>
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Le Tue Schede</h1>
          
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'current'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            Scheda Attuale
          </button>
          <button
            onClick={() => setActiveTab('manager')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'manager'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            <Settings className="inline mr-1" size={16} />
            Gestionale
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'history'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            Storico
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'programs'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            Programmi
          </button>
        </div>

        {/* Current Workout Tab */}
        {activeTab === 'current' && (
          <div className="max-w-4xl mx-auto">
            {assignedWorkouts.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8 text-center">
                <div className="mb-6">
                  <Dumbbell className="mx-auto mb-4 text-gray-400" size={64} />
                  <h2 className="text-2xl font-bold text-navy-900 mb-2">Nessuna Scheda Assegnata</h2>
                  <p className="text-navy-700 mb-4">Al momento non hai schede di allenamento assegnate.</p>
                  <p className="text-navy-600">Il tuo coach ti assegnerà presto una scheda personalizzata!</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="font-semibold text-navy-900 mb-2">Nel frattempo...</h3>
                  <p className="text-navy-700 text-sm">Puoi contattare il tuo coach per ricevere consigli personalizzati o esplorare i programmi disponibili nella sezione "Programmi".</p>
                </div>
              </div>
            ) : (
              <div>
                {/* Lista delle schede assegnate */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {assignedWorkouts.map((workout, index) => (
                    <div 
                      key={workout.id} 
                      className={`bg-white rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-xl ${
                        selectedWorkout?.id === workout.id ? 'ring-2 ring-red-500' : ''
                      }`}
                      onClick={() => setSelectedWorkout(workout)}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-navy-900">{workout.name}</h3>
                        <div className="bg-red-100 text-red-600 px-2 py-1 rounded-full text-xs font-medium">
                          Nuova
                        </div>
                      </div>
                      <div className="space-y-2 text-sm text-navy-700">
                        <div className="flex items-center space-x-2">
                          <UserIcon size={16} />
                          <span>Coach: {workout.coach}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar size={16} />
                          <span>Inizio: {new Date(workout.startDate).toLocaleDateString('it-IT')}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock size={16} />
                          <span>Durata: {workout.duration} giorni</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Target size={16} />
                          <span>Esercizi: {workout.exercises?.length || 0}</span>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progresso</span>
                          <span>{calculateProgress(workout)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${calculateProgress(workout)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Dettagli della scheda selezionata */}
                {selectedWorkout && (
                  <div className="bg-white rounded-xl shadow-lg p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold text-navy-900">{selectedWorkout.name}</h2>
                      <div className="flex items-center space-x-4">
                        <span className="text-navy-700">Coach: {selectedWorkout.coach}</span>
                        <div className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-sm font-medium">
                          Attiva
                        </div>
                      </div>
                    </div>

                    {selectedWorkout.description && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold text-navy-900 mb-2">Descrizione</h3>
                        <p className="text-navy-700">{selectedWorkout.description}</p>
                      </div>
                    )}

                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-navy-900 mb-4">Esercizi</h3>
                      {selectedWorkout.exercises && selectedWorkout.exercises.length > 0 ? (
                        <div className="space-y-4">
                          {selectedWorkout.exercises.map((exercise, index) => (
                            <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                              <div className="flex-1">
                                <h4 className="font-medium text-navy-900">{exercise.name}</h4>
                                <div className="text-sm text-navy-700 mt-1">
                                  <span className="mr-4">Serie: {exercise.sets}</span>
                                  <span className="mr-4">Ripetizioni: {exercise.reps}</span>
                                  <span>Riposo: {exercise.rest}s</span>
                                </div>
                                {exercise.description && (
                                  <p className="text-sm text-navy-600 mt-2">{exercise.description}</p>
                                )}
                              </div>
                              <button
                                onClick={() => toggleExerciseCompletion(index)}
                                className={`ml-4 p-2 rounded-full transition-colors ${
                                  exercise.completed 
                                    ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                                }`}
                              >
                                <CheckCircle size={20} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-navy-600">Nessun esercizio definito per questa scheda.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-6">Storico Allenamenti</h2>
              <div className="space-y-4">
                {workoutHistory.map((workout, index) => (
                  <div key={index} className="flex items-center justify-between p-6 border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-300">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="text-green-600" size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-navy-900">{workout.name}</h3>
                        <p className="text-navy-700 text-sm">{workout.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-navy-900">{workout.duration}</p>
                      <p className="text-navy-700 text-sm">{workout.exercises} esercizi</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Manager Tab - File Explorer */}
        {activeTab === 'manager' && (
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden" style={{ height: '85vh' }}>
              <FileExplorer currentUser={currentUser} />
            </div>
          </div>
        )}

        {/* Programs Tab */}
        {activeTab === 'programs' && (
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-navy-900 mb-4">Programmi Disponibili</h2>
              <p className="text-navy-700">Scegli un nuovo programma di allenamento personalizzato</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {availablePrograms.map((program, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300">
                  <img 
                    src={program.image} 
                    alt={program.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-navy-900 mb-2">{program.name}</h3>
                    <p className="text-navy-700 mb-4">Coach: {program.coach}</p>
                    
                    <div className="space-y-2 mb-6">
                      <div className="flex justify-between">
                        <span className="text-navy-700">Durata:</span>
                        <span className="font-medium text-navy-900">{program.duration}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-navy-700">Livello:</span>
                        <span className="font-medium text-navy-900">{program.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-navy-700">Focus:</span>
                        <span className="font-medium text-navy-900">{program.focus}</span>
                      </div>
                    </div>
                    
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105">
                      Inizia Programma
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutsPage;