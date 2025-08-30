import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Plus, Save, Copy, Users, Link, ChevronDown, ArrowLeft, Eye, X, Trash2 } from 'lucide-react';

interface Exercise {
  id: string;
  name: string;
  notes: string;
  sets: string;
  intensity: string;
  tut: string;
  recovery: string;
  videoLink: string;
}

interface WorkoutVariant {
  id: string;
  name: string;
  isActive: boolean;
}

interface WorkoutDetailPageProps {
  workoutId: string;
  onClose: () => void;
  folderPath?: string;
}

const WorkoutDetailPage: React.FC<WorkoutDetailPageProps> = ({ workoutId, onClose, folderPath }) => {
  const [workoutTitle, setWorkoutTitle] = useState('Scheda di Allenamento');
  const [workoutDescription, setWorkoutDescription] = useState('Descrizione della scheda di allenamento');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  
  // Gestione tempo scheda
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [workoutStatus, setWorkoutStatus] = useState<'published' | 'draft'>('draft');
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [variants, setVariants] = useState<WorkoutVariant[]>([
    { id: '1', name: 'Scheda di Allenamento', isActive: true }
  ]);
  const [activeVariantId, setActiveVariantId] = useState('1');
  
  // Athletes management
  const [associatedAthletes, setAssociatedAthletes] = useState<string[]>([]);
  const [showAthletesList, setShowAthletesList] = useState(false);
  
  // Confirmation dialogs
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [showDeleteWorkoutDialog, setShowDeleteWorkoutDialog] = useState(false);
  
  // Exercise editing
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  
  // Default exercises (non eliminabili)
  const defaultExercises = [
    'Squat',
    'Panca piana',
    'Stacco da terra',
    'Trazioni',
    'Military press',
    'Rematore',
    'Dips',
    'Curl bicipiti'
  ];
  
  // Custom exercises (eliminabili)
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  
  // Tutti gli esercizi (default + personalizzati)
  const predefinedExercises = [...defaultExercises, ...customExercises];
  
  // Current exercise form state
  const [currentExercise, setCurrentExercise] = useState({
    name: '',
    notes: '',
    sets: '',
    intensity: '',
    tut: '',
    recovery: '',
    videoLink: ''
  });
  
  const [newExerciseName, setNewExerciseName] = useState('');
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showAthleteDropdown, setShowAthleteDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Mock athletes data
  const athletes = [
    'Mario Rossi',
    'Luca Bianchi',
    'Anna Verdi',
    'Paolo Neri',
    'Giulia Romano'
  ];
  
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditingTitle]);
  
  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);
  
  const handleSaveTitle = () => {
    setIsEditingTitle(false);
  };
  
  const handleSaveDescription = () => {
    setIsEditingDescription(false);
  };
  
  const handleAddExercise = () => {
    if (editingExerciseId) {
      handleUpdateExercise();
    } else {
      if (currentExercise.name.trim()) {
        const newExercise: Exercise = {
          id: Date.now().toString(),
          ...currentExercise
        };
        setExercises([...exercises, newExercise]);
        setCurrentExercise({
          name: '',
          notes: '',
          sets: '',
          intensity: '',
          tut: '',
          recovery: '',
          videoLink: ''
        });
        setShowExerciseForm(false);
      }
    }
  };
  
  const handleSaveCustomExercise = () => {
    if (newExerciseName.trim() && !predefinedExercises.includes(newExerciseName)) {
      setCustomExercises([...customExercises, newExerciseName]);
      setCurrentExercise({ ...currentExercise, name: newExerciseName });
      setNewExerciseName('');
    }
  };
  
  const handleRemoveCustomExercise = (exerciseName: string) => {
    showConfirmation(
      'Vuoi davvero eliminare questo esercizio personalizzato?',
      () => {
        setCustomExercises(customExercises.filter(ex => ex !== exerciseName));
      }
    );
  };
  
  // Filtra gli esercizi in base alla query di ricerca
  const getFilteredExercises = () => {
    if (!exerciseSearchQuery.trim()) {
      return predefinedExercises;
    }
    
    const query = exerciseSearchQuery.toLowerCase();
    return predefinedExercises.filter(exercise => 
      exercise.toLowerCase().includes(query)
    );
  };
  
  // Calcola la durata tra le date
  const calculateDuration = () => {
    if (!startDate || !endDate) return null;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (end < start) return null;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    
    if (diffWeeks > 0) {
      const remainingDays = diffDays % 7;
      return remainingDays > 0 
        ? `${diffWeeks} settimana${diffWeeks > 1 ? 'e' : ''} e ${remainingDays} giorno${remainingDays > 1 ? 'i' : ''}`
        : `${diffWeeks} settimana${diffWeeks > 1 ? 'e' : ''}`;
    } else {
      return `${diffDays} giorno${diffDays > 1 ? 'i' : ''}`;
    }
  };
  
  // Gestisce l'eliminazione della scheda
  const handleDeleteWorkout = () => {
    setShowDeleteWorkoutDialog(true);
  };
  
  const confirmDeleteWorkout = () => {
    // Qui implementeresti la logica per eliminare effettivamente la scheda
    // Per ora simuliamo l'eliminazione chiudendo la pagina
    console.log('Scheda eliminata:', workoutTitle);
    setShowDeleteWorkoutDialog(false);
    onClose(); // Torna alla pagina precedente
  };
  
  const handleSelectPredefinedExercise = (exerciseName: string) => {
    setCurrentExercise({ ...currentExercise, name: exerciseName });
    setShowExerciseDropdown(false);
  };
  
  const handleGenerateLink = () => {
    const link = `${window.location.origin}/workout/${workoutId}`;
    setGeneratedLink(link);
    setShowLinkModal(true);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('Link copiato negli appunti!');
  };
  
  const handleCloneWorkout = () => {
    const newVariant: WorkoutVariant = {
      id: Date.now().toString(),
      name: `Variante di ${workoutTitle}`,
      isActive: false
    };
    setVariants([...variants, newVariant]);
  };
  
  const handleSwitchVariant = (variantId: string) => {
    setVariants(variants.map(v => ({ ...v, isActive: v.id === variantId })));
    setActiveVariantId(variantId);
    const activeVariant = variants.find(v => v.id === variantId);
    if (activeVariant) {
      setWorkoutTitle(activeVariant.name);
    }
  };
  
  const handleRemoveVariant = (variantId: string) => {
    showConfirmation(
      'Vuoi davvero chiudere questa variante della scheda?',
      () => {
        const updatedVariants = variants.filter(v => v.id !== variantId);
        setVariants(updatedVariants);
        if (activeVariantId === variantId && updatedVariants.length > 0) {
          handleSwitchVariant(updatedVariants[0].id);
        }
      }
    );
  };
  
  const showConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmDialog(true);
  };
  
  const handleConfirmAction = () => {
    confirmAction();
    setShowConfirmDialog(false);
  };
  
  const handleAssociateAthlete = (athlete: string) => {
    if (!associatedAthletes.includes(athlete)) {
      setAssociatedAthletes([...associatedAthletes, athlete]);
    }
    setSelectedAthlete(athlete);
    setShowAthleteDropdown(false);
  };
  
  const handleRemoveAthlete = (athlete: string) => {
    showConfirmation(
      'Vuoi davvero rimuovere questo atleta dalla scheda?',
      () => {
        setAssociatedAthletes(associatedAthletes.filter(a => a !== athlete));
        if (selectedAthlete === athlete) {
          setSelectedAthlete('');
        }
      }
    );
  };
  
  const handleEditExercise = (exercise: Exercise) => {
    setEditingExerciseId(exercise.id);
    setEditingExercise({ ...exercise });
    setShowExerciseForm(true);
  };
  
  const handleUpdateExercise = () => {
    if (editingExercise && editingExerciseId) {
      setExercises(exercises.map(ex => 
        ex.id === editingExerciseId ? editingExercise : ex
      ));
      setEditingExerciseId(null);
      setEditingExercise(null);
      setShowExerciseForm(false);
    }
  };
  
  const handleRemoveExercise = (exerciseId: string) => {
    showConfirmation(
      'Vuoi davvero rimuovere questo esercizio dalla scheda?',
      () => {
        setExercises(exercises.filter(ex => ex.id !== exerciseId));
      }
    );
  };
  
  const handleBackToFolder = () => {
    onClose();
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Workout Variants Tabs */}
      {variants.length > 1 && (
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            {variants.map((variant) => (
              <div key={variant.id} className="relative">
                <button
                  onClick={() => handleSwitchVariant(variant.id)}
                  className={`px-4 py-2 pr-8 text-sm font-medium rounded-t-lg transition-colors ${
                    variant.isActive
                      ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {variant.name}
                </button>
                {variants.length > 1 && (
                  <button
                    onClick={() => handleRemoveVariant(variant.id)}
                    className="absolute top-1 right-1 p-1 text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 relative">
        {/* Delete Workout Button - Top Right */}
        <button
          onClick={() => setShowDeleteWorkoutDialog(true)}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
          title="Elimina Scheda"
        >
          <Trash2 size={20} />
        </button>
        
        {/* Back to Folder Button */}
        <div className="mb-6">
          <button
            onClick={handleBackToFolder}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Torna alla Cartella</span>
          </button>
        </div>
        
        {/* Header with Title and Description */}
        <div 
          className="text-center mb-8 cursor-pointer" 
          onClick={(e) => {
            // Solo se il click è sullo sfondo (non sui pulsanti di edit)
            if (e.target === e.currentTarget) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          {/* Editable Title */}
          <div className="flex items-center justify-center mb-4">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="text-3xl font-bold text-center border-b-2 border-blue-500 bg-transparent outline-none"
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-bold text-gray-800">{workoutTitle}</h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <Edit3 size={20} />
                </button>
              </div>
            )}
          </div>
          
          {/* Editable Description */}
          <div className="flex items-center justify-center">
            {isEditingDescription ? (
              <div className="flex items-center space-x-2 w-full max-w-2xl">
                <textarea
                  ref={descriptionInputRef}
                  value={workoutDescription}
                  onChange={(e) => setWorkoutDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  className="w-full text-lg text-center border-b-2 border-blue-500 bg-transparent outline-none resize-none"
                  rows={2}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <p className="text-lg text-gray-600 max-w-2xl">{workoutDescription}</p>
                <button
                  onClick={() => setIsEditingDescription(true)}
                  className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <Edit3 size={16} />
                </button>
              </div>
            )}
          </div>
          

        </div>
        

        
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8 p-3 bg-gray-50 rounded-lg">
          {/* Duration Selector */}
          <div className="relative">
            <button
              onClick={() => setIsEditingDates(!isEditingDates)}
              className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
              title="Gestisci durata scheda"
            >
              <span>📅</span>
              <span>{calculateDuration() || 'Durata'}</span>
            </button>
            {isEditingDates && (
              <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-10 p-4">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Inizio</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Fine</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {startDate && endDate && new Date(endDate) < new Date(startDate) && (
                  <div className="text-xs text-red-600 mb-2">⚠️ Data fine precedente all'inizio</div>
                )}
                <button
                  onClick={() => setIsEditingDates(false)}
                  className="w-full px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
                >
                  Salva
                </button>
              </div>
            )}
          </div>
          
          {/* Create Exercise */}
          <button
            onClick={handleAddExercise}
            className="flex items-center space-x-2 px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Crea</span>
          </button>
          
          {/* Associate Athlete */}
          <div className="relative">
            <button
              onClick={() => setShowAthleteDropdown(!showAthleteDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <Users size={16} />
              <span>Associa</span>
              <ChevronDown size={16} />
            </button>
            {showAthleteDropdown && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <input
                    type="text"
                    placeholder="Cerca atleta..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {athletes.map((athlete) => (
                    <button
                      key={athlete}
                      onClick={() => handleAssociateAthlete(athlete)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      {athlete}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* View Associated Athletes */}
          <div className="relative">
            <button
              onClick={() => setShowAthletesList(!showAthletesList)}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <Eye size={16} />
              <span>Atleti ({associatedAthletes.length})</span>
            </button>
            {showAthletesList && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {associatedAthletes.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">
                    Nessun atleta associato
                  </div>
                ) : (
                  <div className="max-h-40 overflow-y-auto">
                    {associatedAthletes.map((athlete) => (
                      <div key={athlete} className="flex items-center justify-between px-4 py-2 hover:bg-gray-100">
                        <span>{athlete}</span>
                        <button
                          onClick={() => handleRemoveAthlete(athlete)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Generate Link */}
          <button
            onClick={handleGenerateLink}
            className="flex items-center space-x-2 px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
          >
            <Link size={16} />
            <span>Link</span>
          </button>
          
          {/* Clone Workout */}
          <button
            onClick={handleCloneWorkout}
            className="flex items-center space-x-2 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors text-sm"
          >
            <Copy size={16} />
            <span>Clona</span>
          </button>
          
          {/* Workout Status */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                workoutStatus === 'published'
                  ? 'bg-green-500 text-white hover:bg-green-600'
                  : 'bg-yellow-500 text-white hover:bg-yellow-600'
              }`}
            >
              <span>{workoutStatus === 'published' ? 'Pubblicata' : 'Bozza'}</span>
              <ChevronDown size={16} />
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full right-0 mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => {
                    setWorkoutStatus('published');
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                >
                  Pubblicata
                </button>
                <button
                  onClick={() => {
                    setWorkoutStatus('draft');
                    setShowStatusDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                >
                  Bozza
                </button>
              </div>
            )}
          </div>
        </div>
        

        
        {/* Exercise Form */}
        {showExerciseForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">{editingExerciseId ? 'Modifica Esercizio' : 'Aggiungi Esercizio'}</h3>
            
            {/* Exercise Name with Smart Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Esercizio</label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={editingExercise ? editingExercise.name : currentExercise.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (editingExercise) {
                        setEditingExercise({ ...editingExercise, name: value });
                      } else {
                        setCurrentExercise({ ...currentExercise, name: value });
                      }
                      setExerciseSearchQuery(value);
                      setShowSearchSuggestions(value.length > 0);
                    }}
                    onFocus={() => {
                      if ((editingExercise ? editingExercise.name : currentExercise.name).length > 0) {
                        setExerciseSearchQuery(editingExercise ? editingExercise.name : currentExercise.name);
                        setShowSearchSuggestions(true);
                      }
                    }}
                    onBlur={() => {
                      // Ritarda la chiusura per permettere il click sui suggerimenti
                      setTimeout(() => setShowSearchSuggestions(false), 200);
                    }}
                    placeholder="Cerca o digita nome esercizio..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  {/* Search Suggestions */}
                  {showSearchSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {getFilteredExercises().length > 0 ? (
                        getFilteredExercises().map((exercise) => {
                          const isCustomExercise = customExercises.includes(exercise);
                          const query = exerciseSearchQuery.toLowerCase();
                          const exerciseLower = exercise.toLowerCase();
                          const matchIndex = exerciseLower.indexOf(query);
                          
                          return (
                            <div
                              key={exercise}
                              className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => {
                                if (editingExercise) {
                                  setEditingExercise({ ...editingExercise, name: exercise });
                                } else {
                                  setCurrentExercise({ ...currentExercise, name: exercise });
                                }
                                setExerciseSearchQuery('');
                                setShowSearchSuggestions(false);
                              }}
                            >
                              <div className="flex-1">
                                {matchIndex >= 0 ? (
                                  <span>
                                    {exercise.substring(0, matchIndex)}
                                    <span className="bg-yellow-200 font-semibold">
                                      {exercise.substring(matchIndex, matchIndex + query.length)}
                                    </span>
                                    {exercise.substring(matchIndex + query.length)}
                                  </span>
                                ) : (
                                  exercise
                                )}
                              </div>
                              {isCustomExercise && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveCustomExercise(exercise);
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700 transition-colors ml-2"
                                  title="Elimina esercizio personalizzato"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          Nessun esercizio trovato per "{exerciseSearchQuery}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowExerciseDropdown(!showExerciseDropdown);
                      setShowSearchSuggestions(false);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    title="Mostra tutti gli esercizi"
                  >
                    <ChevronDown size={16} />
                  </button>
                  {showExerciseDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="max-h-40 overflow-y-auto">
                        {predefinedExercises.map((exercise) => {
                          const isCustomExercise = customExercises.includes(exercise);
                          return (
                            <div
                              key={exercise}
                              className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 transition-colors"
                            >
                              <button
                                onClick={() => {
                                  handleSelectPredefinedExercise(exercise);
                                  setShowExerciseDropdown(false);
                                }}
                                className="flex-1 text-left"
                              >
                                {exercise}
                              </button>
                              {isCustomExercise && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveCustomExercise(exercise);
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700 transition-colors ml-2"
                                  title="Elimina esercizio personalizzato"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Add Custom Exercise */}
              <div className="mt-2 flex space-x-2">
                <input
                  type="text"
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="Aggiungi nuovo esercizio personalizzato"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSaveCustomExercise}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  <Save size={16} />
                </button>
              </div>
            </div>
            
            {/* Exercise Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                <textarea
                  value={editingExercise ? editingExercise.notes : currentExercise.notes}
                  onChange={(e) => {
                    if (editingExercise) {
                      setEditingExercise({ ...editingExercise, notes: e.target.value });
                    } else {
                      setCurrentExercise({ ...currentExercise, notes: e.target.value });
                    }
                  }}
                  placeholder="Note sull'esercizio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serie x Ripetizioni</label>
                <input
                  type="text"
                  value={editingExercise ? editingExercise.sets : currentExercise.sets}
                  onChange={(e) => {
                    if (editingExercise) {
                      setEditingExercise({ ...editingExercise, sets: e.target.value });
                    } else {
                      setCurrentExercise({ ...currentExercise, sets: e.target.value });
                    }
                  }}
                  placeholder="es. 3x10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Intensità</label>
                <input
                  type="text"
                  value={editingExercise ? editingExercise.intensity : currentExercise.intensity}
                  onChange={(e) => {
                    if (editingExercise) {
                      setEditingExercise({ ...editingExercise, intensity: e.target.value });
                    } else {
                      setCurrentExercise({ ...currentExercise, intensity: e.target.value });
                    }
                  }}
                  placeholder="es. 70% 1RM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TUT</label>
                <input
                  type="text"
                  value={editingExercise ? editingExercise.tut : currentExercise.tut}
                  onChange={(e) => {
                    if (editingExercise) {
                      setEditingExercise({ ...editingExercise, tut: e.target.value });
                    } else {
                      setCurrentExercise({ ...currentExercise, tut: e.target.value });
                    }
                  }}
                  placeholder="es. 3-1-2-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recupero</label>
                <input
                  type="text"
                  value={editingExercise ? editingExercise.recovery : currentExercise.recovery}
                  onChange={(e) => {
                    if (editingExercise) {
                      setEditingExercise({ ...editingExercise, recovery: e.target.value });
                    } else {
                      setCurrentExercise({ ...currentExercise, recovery: e.target.value });
                    }
                  }}
                  placeholder="es. 90 secondi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link Video o Foto</label>
                <input
                  type="text"
                  value={editingExercise ? editingExercise.videoLink : currentExercise.videoLink}
                  onChange={(e) => {
                    if (editingExercise) {
                      setEditingExercise({ ...editingExercise, videoLink: e.target.value });
                    } else {
                      setCurrentExercise({ ...currentExercise, videoLink: e.target.value });
                    }
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddExercise}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {editingExerciseId ? 'Salva Modifiche' : 'Aggiungi Esercizio'}
              </button>
              <button
                onClick={() => {
                  setShowExerciseForm(false);
                  setEditingExerciseId(null);
                  setEditingExercise(null);
                  setCurrentExercise({
                    name: '',
                    notes: '',
                    sets: '',
                    intensity: '',
                    tut: '',
                    recovery: '',
                    videoLink: ''
                  });
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
        
        {/* Exercises List */}
        {exercises.length > 0 && (
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Esercizi</h3>
            <div className="space-y-4">
              {exercises.map((exercise) => (
                <div key={exercise.id} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-lg">{exercise.name}</h4>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditExercise(exercise)}
                        className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                        title="Modifica esercizio"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleRemoveExercise(exercise.id)}
                        className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        title="Rimuovi esercizio"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                    {exercise.notes && <p><strong>Note:</strong> {exercise.notes}</p>}
                    {exercise.sets && <p><strong>Serie x Ripetizioni:</strong> {exercise.sets}</p>}
                    {exercise.intensity && <p><strong>Intensità:</strong> {exercise.intensity}</p>}
                    {exercise.tut && <p><strong>TUT:</strong> {exercise.tut}</p>}
                    {exercise.recovery && <p><strong>Recupero:</strong> {exercise.recovery}</p>}
                    {exercise.videoLink && (
                      <p>
                        <strong>Link:</strong>{' '}
                        <a href={exercise.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                          Visualizza
                        </a>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Link Generation Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Link Scheda Generato</h3>
            <div className="mb-4">
              <input
                type="text"
                value={generatedLink}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
              />
            </div>
            <div className="flex space-x-4">
              <button
                onClick={handleCopyLink}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Copy size={16} />
                <span>Copia</span>
              </button>
              <button
                onClick={() => setShowLinkModal(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Conferma Azione</h3>
            <p className="text-gray-600 mb-6">{confirmMessage}</p>
            <div className="flex space-x-4">
              <button
                onClick={handleConfirmAction}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Conferma
              </button>
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Workout Confirmation Dialog */}
      {showDeleteWorkoutDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <Trash2 className="text-red-500 mr-3" size={24} />
              <h3 className="text-lg font-semibold text-gray-800">Elimina Scheda</h3>
            </div>
            <p className="text-gray-600 mb-2">
              Sei sicuro di voler eliminare la scheda <strong>"{workoutTitle}"</strong>?
            </p>
            <p className="text-sm text-red-600 mb-6">
              ⚠️ Questa azione non può essere annullata. Tutti gli esercizi e le configurazioni verranno persi definitivamente.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={confirmDeleteWorkout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Trash2 size={16} />
                <span>Elimina Definitivamente</span>
              </button>
              <button
                onClick={() => setShowDeleteWorkoutDialog(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutDetailPage;