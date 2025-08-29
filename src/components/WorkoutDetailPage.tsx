import React, { useState, useRef, useEffect } from 'react';
import { Edit3, Plus, Save, Copy, Users, Link, ChevronDown } from 'lucide-react';

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
}

const WorkoutDetailPage: React.FC<WorkoutDetailPageProps> = ({ workoutId, onClose }) => {
  const [workoutTitle, setWorkoutTitle] = useState('Scheda di Allenamento');
  const [workoutDescription, setWorkoutDescription] = useState('Descrizione della scheda di allenamento');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
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
  
  // Predefined exercises
  const [predefinedExercises, setPredefinedExercises] = useState([
    'Squat',
    'Panca piana',
    'Stacco da terra',
    'Trazioni',
    'Military press',
    'Rematore',
    'Dips',
    'Curl bicipiti'
  ]);
  
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
  };
  
  const handleSaveCustomExercise = () => {
    if (newExerciseName.trim() && !predefinedExercises.includes(newExerciseName)) {
      setPredefinedExercises([...predefinedExercises, newExerciseName]);
      setCurrentExercise({ ...currentExercise, name: newExerciseName });
      setNewExerciseName('');
    }
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
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Workout Variants Tabs */}
      {variants.length > 1 && (
        <div className="mb-6">
          <div className="flex space-x-2 border-b border-gray-200">
            {variants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => handleSwitchVariant(variant.id)}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  variant.isActive
                    ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
        {/* Header with Title and Description */}
        <div className="text-center mb-8">
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
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8 p-4 bg-gray-50 rounded-lg">
          {/* Associate Athlete */}
          <div className="relative">
            <button
              onClick={() => setShowAthleteDropdown(!showAthleteDropdown)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Users size={16} />
              <span>{selectedAthlete || 'Associa Atleta'}</span>
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
                      onClick={() => {
                        setSelectedAthlete(athlete);
                        setShowAthleteDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      {athlete}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Generate Link */}
          <button
            onClick={handleGenerateLink}
            className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <Link size={16} />
            <span>Genera Link</span>
          </button>
          
          {/* Clone Workout */}
          <button
            onClick={handleCloneWorkout}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Copy size={16} />
            <span>Clona Scheda</span>
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
        
        {/* Create Exercise Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowExerciseForm(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors mx-auto"
          >
            <Plus size={20} />
            <span>Crea Esercizio</span>
          </button>
        </div>
        
        {/* Exercise Form */}
        {showExerciseForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">Nuovo Esercizio</h3>
            
            {/* Exercise Name with Dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Esercizio</label>
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={currentExercise.name}
                    onChange={(e) => setCurrentExercise({ ...currentExercise, name: e.target.value })}
                    placeholder="Nome esercizio"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowExerciseDropdown(!showExerciseDropdown)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                  >
                    <ChevronDown size={16} />
                  </button>
                  {showExerciseDropdown && (
                    <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                      <div className="max-h-40 overflow-y-auto">
                        {predefinedExercises.map((exercise) => (
                          <button
                            key={exercise}
                            onClick={() => handleSelectPredefinedExercise(exercise)}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                          >
                            {exercise}
                          </button>
                        ))}
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
                  value={currentExercise.notes}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, notes: e.target.value })}
                  placeholder="Note sull'esercizio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Serie x Ripetizioni</label>
                <input
                  type="text"
                  value={currentExercise.sets}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, sets: e.target.value })}
                  placeholder="es. 3x10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Intensità</label>
                <input
                  type="text"
                  value={currentExercise.intensity}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, intensity: e.target.value })}
                  placeholder="es. 70% 1RM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TUT</label>
                <input
                  type="text"
                  value={currentExercise.tut}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, tut: e.target.value })}
                  placeholder="es. 3-1-2-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Recupero</label>
                <input
                  type="text"
                  value={currentExercise.recovery}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, recovery: e.target.value })}
                  placeholder="es. 90 secondi"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link Video o Foto</label>
                <input
                  type="text"
                  value={currentExercise.videoLink}
                  onChange={(e) => setCurrentExercise({ ...currentExercise, videoLink: e.target.value })}
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
                Aggiungi Esercizio
              </button>
              <button
                onClick={() => setShowExerciseForm(false)}
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
                  <h4 className="font-semibold text-lg mb-2">{exercise.name}</h4>
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
    </div>
  );
};

export default WorkoutDetailPage;