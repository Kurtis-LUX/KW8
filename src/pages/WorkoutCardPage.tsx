import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Clock, Dumbbell, Target, CheckCircle, User, Calendar, History, AlertCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import useIsStandaloneMobile from '../hooks/useIsStandaloneMobile';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string;
  weight?: number;
  rest: string;
  notes?: string;
  completed?: boolean;
  coachNotes?: string; // Non modificabile dall'atleta
}

interface WorkoutCard {
  id: string;
  title: string;
  athleteId: string;
  athleteName: string;
  coachId: string;
  coachName: string;
  createdDate: string;
  lastModified: string;
  exercises: Exercise[];
  notes?: string;
  coachInstructions?: string; // Non modificabile dall'atleta
  status: 'active' | 'completed' | 'paused';
}

interface MembershipCard {
  id: string;
  athleteName: string;
  membershipNumber: string;
  membershipType: string;
  startDate: string;
  expiryDate: string;
  status: string;
}

interface WorkoutHistory {
  id: string;
  title: string;
  completedDate: string;
  duration?: string;
  exercises: number;
}

const WorkoutCardPage: React.FC = () => {
  const { linkId } = useParams<{ linkId: string }>();
  const isStandaloneMobile = useIsStandaloneMobile();
  const [workoutCard, setWorkoutCard] = useState<WorkoutCard | null>(null);
  const [membershipCard, setMembershipCard] = useState<MembershipCard | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'workout' | 'membership' | 'history'>('workout');

  // Carica i dati della scheda tramite link
  useEffect(() => {
    const loadWorkoutCard = async () => {
      try {
        setLoading(true);
        // Simula caricamento dati (da sostituire con chiamata API reale)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Dati mock (da sostituire con dati reali da Firestore)
        const mockWorkoutCard: WorkoutCard = {
          id: '1',
          title: 'Allenamento Upper Body - Settimana 1',
          athleteId: 'athlete1',
          athleteName: 'Marco Rossi',
          coachId: 'coach1',
          coachName: 'Giuseppe Pandolfo',
          createdDate: '2025-01-20',
          lastModified: new Date().toISOString(),
          status: 'active',
          coachInstructions: 'Concentrati sulla forma corretta. Riposo di 2-3 minuti tra le serie.',
          exercises: [
            {
              id: '1',
              name: 'Panca Piana',
              sets: 4,
              reps: '8-10',
              weight: 80,
              rest: '2-3 min',
              coachNotes: 'Mantieni i gomiti a 45°',
              completed: false
            },
            {
              id: '2',
              name: 'Trazioni',
              sets: 3,
              reps: '6-8',
              rest: '2 min',
              coachNotes: 'Se necessario usa assistenza',
              completed: false
            },
            {
              id: '3',
              name: 'Shoulder Press',
              sets: 3,
              reps: '10-12',
              weight: 25,
              rest: '90 sec',
              completed: false
            }
          ]
        };

        const mockMembershipCard: MembershipCard = {
          id: '1',
          athleteName: 'Marco Rossi',
          membershipNumber: 'MB001',
          membershipType: 'Mensile',
          startDate: '2025-01-01',
          expiryDate: '2025-02-01',
          status: 'Attivo'
        };

        const mockHistory: WorkoutHistory[] = [
          {
            id: '1',
            title: 'Allenamento Lower Body - Settimana 4',
            completedDate: '2025-01-18',
            duration: '65 min',
            exercises: 5
          },
          {
            id: '2',
            title: 'Allenamento Upper Body - Settimana 4',
            completedDate: '2025-01-16',
            duration: '70 min',
            exercises: 6
          }
        ];

        setWorkoutCard(mockWorkoutCard);
        setMembershipCard(mockMembershipCard);
        setWorkoutHistory(mockHistory);
      } catch (err) {
        setError('Errore nel caricamento della scheda');
      } finally {
        setLoading(false);
      }
    };

    if (linkId) {
      loadWorkoutCard();
    }
  }, [linkId]);

  // Autosalvataggio ad ogni modifica
  const autoSave = async (updatedCard: WorkoutCard) => {
    try {
      setSaving(true);
      // Simula salvataggio (da sostituire con chiamata API reale)
      await new Promise(resolve => setTimeout(resolve, 500));
      setLastSaved(new Date());
    } catch (err) {
      console.error('Errore nel salvataggio:', err);
    } finally {
      setSaving(false);
    }
  };

  // Aggiorna un esercizio
  const updateExercise = (exerciseId: string, updates: Partial<Exercise>) => {
    if (!workoutCard) return;

    const updatedCard = {
      ...workoutCard,
      exercises: workoutCard.exercises.map(exercise =>
        exercise.id === exerciseId ? { ...exercise, ...updates } : exercise
      ),
      lastModified: new Date().toISOString()
    };

    setWorkoutCard(updatedCard);
    autoSave(updatedCard);
  };

  // Aggiorna le note generali
  const updateNotes = (notes: string) => {
    if (!workoutCard) return;

    const updatedCard = {
      ...workoutCard,
      notes,
      lastModified: new Date().toISOString()
    };

    setWorkoutCard(updatedCard);
    autoSave(updatedCard);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento scheda...</p>
        </div>
      </div>
    );
  }

  if (error || !workoutCard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={64} />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Scheda non trovata</h2>
          <p className="text-gray-600 mb-4">{error || 'Il link potrebbe essere scaduto o non valido'}</p>
          <button 
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Torna indietro
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - nascosto in modalità PWA standalone */}
      {!isStandaloneMobile && (
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => window.history.back()}
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ArrowLeft size={20} />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">{workoutCard.title}</h1>
                  <p className="text-sm text-gray-600">Coach: {workoutCard.coachName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {saving && (
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                    Salvataggio...
                  </div>
                )}
                {lastSaved && !saving && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle size={16} className="mr-1" />
                    Salvato {lastSaved.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('workout')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'workout'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Dumbbell className="inline mr-2" size={16} />
              Scheda Allenamento
            </button>
            <button
              onClick={() => setActiveTab('membership')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'membership'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <User className="inline mr-2" size={16} />
              Tesserino
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'history'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="inline mr-2" size={16} />
              Storico
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {activeTab === 'workout' && (
          <div className="space-y-6">
            {/* Istruzioni del Coach */}
            {workoutCard.coachInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Istruzioni del Coach</h3>
                <p className="text-blue-800">{workoutCard.coachInstructions}</p>
              </div>
            )}

            {/* Esercizi */}
            <div className="space-y-4">
              {workoutCard.exercises.map((exercise, index) => (
                <div key={exercise.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-red-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                        {index + 1}
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{exercise.name}</h3>
                    </div>
                    <button
                      onClick={() => updateExercise(exercise.id, { completed: !exercise.completed })}
                      className={`p-2 rounded-full transition-colors ${
                        exercise.completed
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400 hover:bg-green-100 hover:text-green-600'
                      }`}
                    >
                      <CheckCircle size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Serie</label>
                      <input
                        type="number"
                        value={exercise.sets}
                        onChange={(e) => updateExercise(exercise.id, { sets: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={!!exercise.coachNotes} // Disabilitato se ci sono note del coach
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ripetizioni</label>
                      <input
                        type="text"
                        value={exercise.reps}
                        onChange={(e) => updateExercise(exercise.id, { reps: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="es. 8-10"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
                      <input
                        type="number"
                        value={exercise.weight || ''}
                        onChange={(e) => updateExercise(exercise.id, { weight: parseFloat(e.target.value) || undefined })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Opzionale"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Riposo</label>
                      <input
                        type="text"
                        value={exercise.rest}
                        onChange={(e) => updateExercise(exercise.id, { rest: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        disabled={!!exercise.coachNotes} // Disabilitato se ci sono note del coach
                      />
                    </div>
                  </div>

                  {exercise.coachNotes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4">
                      <p className="text-sm text-yellow-800">
                        <strong>Note del Coach:</strong> {exercise.coachNotes}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Note personali</label>
                    <textarea
                      value={exercise.notes || ''}
                      onChange={(e) => updateExercise(exercise.id, { notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                      rows={2}
                      placeholder="Aggiungi note personali..."
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Note generali */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Note Allenamento</h3>
              <textarea
                value={workoutCard.notes || ''}
                onChange={(e) => updateNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={4}
                placeholder="Aggiungi note sull'allenamento..."
              />
            </div>
          </div>
        )}

        {activeTab === 'membership' && membershipCard && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Tesserino Atleta</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Informazioni Personali</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Nome:</span>
                    <p className="font-medium">{membershipCard.athleteName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Numero Tesserino:</span>
                    <p className="font-medium">{membershipCard.membershipNumber}</p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-3">Abbonamento</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-600">Tipo:</span>
                    <p className="font-medium">{membershipCard.membershipType}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Inizio:</span>
                    <p className="font-medium">{new Date(membershipCard.startDate).toLocaleDateString('it-IT')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Scadenza:</span>
                    <p className="font-medium">{new Date(membershipCard.expiryDate).toLocaleDateString('it-IT')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Stato:</span>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      membershipCard.status === 'Attivo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {membershipCard.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Storico Allenamenti</h2>
            {workoutHistory.length > 0 ? (
              <div className="space-y-4">
                {workoutHistory.map((workout) => (
                  <div key={workout.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{workout.title}</h3>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center">
                            <Calendar size={14} className="mr-1" />
                            {new Date(workout.completedDate).toLocaleDateString('it-IT')}
                          </span>
                          {workout.duration && (
                            <span className="flex items-center">
                              <Clock size={14} className="mr-1" />
                              {workout.duration}
                            </span>
                          )}
                          <span className="flex items-center">
                            <Target size={14} className="mr-1" />
                            {workout.exercises} esercizi
                          </span>
                        </div>
                      </div>
                      <CheckCircle className="text-green-500" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <History className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessuna scheda presente nello storico</h3>
                <p className="text-gray-600">Completa il tuo primo allenamento per vedere lo storico qui.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutCardPage;