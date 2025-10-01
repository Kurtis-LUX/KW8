import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Edit3, Plus, Save, Copy, Users, Link, ArrowLeft, Eye, X, Trash2 } from 'lucide-react';
import { useWorkoutPlans, useUsers } from '../hooks/useFirestore';
import DB from '../utils/database';

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
  const [workoutTitle, setWorkoutTitle] = useState('Nuova scheda');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  
  // Refs
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const exerciseDropdownRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  
  // Hook Firestore per gestire i piani di allenamento e gli utenti
  const { workoutPlans, loading, error, updateWorkoutPlan } = useWorkoutPlans();
  const { users: athletes, loading: athletesLoading } = useUsers();
  
  // Gestione tempo scheda
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [originalExercises, setOriginalExercises] = useState<Exercise[] | null>(null); // Esercizi originali - null indica che non sono ancora stati caricati
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [showAthleteDropdown, setShowAthleteDropdown] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [workoutStatus, setWorkoutStatus] = useState<'published' | 'draft'>('draft');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [variants, setVariants] = useState<WorkoutVariant[]>([]);
  const [activeVariantId, setActiveVariantId] = useState('original');
  const [originalWorkoutTitle, setOriginalWorkoutTitle] = useState('');
  
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
  
  // Exercise form states
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    id: '',
    name: '',
    notes: '',
    sets: '',
    intensity: '',
    tut: '',
    recovery: '',
    videoLink: ''
  });
  const [newExerciseName, setNewExerciseName] = useState('');
  
  // Separate sets and reps state
  const [currentSets, setCurrentSets] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [editingSets, setEditingSets] = useState('');
  const [editingReps, setEditingReps] = useState('');
  const [customExercises, setCustomExercises] = useState<string[]>([]);
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  
  // Predefined exercises list - Comprehensive list organized by muscle groups
  const predefinedExercises = [
    // PETTO
    'Panca Piana', 'Panca Inclinata', 'Panca Declinata', 'Panca con Manubri', 
    'Panca Inclinata con Manubri', 'Croci su Panca', 'Croci Inclinata', 'Croci ai Cavi',
    'Dips alle Parallele', 'Push-up', 'Push-up Inclinati', 'Push-up Declinati',
    'Chest Press', 'Pectoral Machine', 'Cable Crossover',
    
    // SCHIENA
    'Stacco da Terra', 'Stacco Rumeno', 'Stacco Sumo', 'Trazioni alla Sbarra',
    'Trazioni Presa Larga', 'Trazioni Presa Stretta', 'Lat Machine', 'Lat Machine Presa Stretta',
    'Rematore con Bilanciere', 'Rematore con Manubrio', 'Rematore ai Cavi', 'Pulley Basso',
    'T-Bar Row', 'Seal Row', 'Hyperextension', 'Good Morning', 'Shrug con Bilanciere',
    'Shrug con Manubri', 'Face Pull', 'Reverse Fly',
    
    // GAMBE - QUADRICIPITI
    'Squat', 'Squat Frontale', 'Squat Bulgaro', 'Squat Sumo', 'Hack Squat',
    'Leg Press', 'Leg Press 45°', 'Leg Extension', 'Affondi', 'Affondi Laterali',
    'Affondi Inversi', 'Step Up', 'Sissy Squat', 'Wall Sit',
    
    // GAMBE - FEMORALI E GLUTEI
    'Stacco Rumeno', 'Stacco a Gambe Tese', 'Leg Curl', 'Nordic Curl',
    'Hip Thrust', 'Hip Thrust con Bilanciere', 'Glute Bridge', 'Sumo Deadlift',
    'Good Morning', 'Hyperextension', 'Calf Raise in Piedi', 'Calf Raise Seduto',
    
    // SPALLE
    'Military Press', 'Shoulder Press con Manubri', 'Arnold Press', 'Push Press',
    'Alzate Laterali', 'Alzate Frontali', 'Alzate Posteriori', 'Alzate a 90°',
    'Upright Row', 'Handstand Push-up', 'Pike Push-up', 'Shoulder Press Machine',
    'Cable Lateral Raise', 'Reverse Pec Deck',
    
    // BICIPITI
    'Curl con Bilanciere', 'Curl con Manubri', 'Hammer Curl', 'Curl Concentrato',
    'Curl ai Cavi', 'Curl Scott', 'Curl 21', 'Curl a Martello ai Cavi',
    'Chin-up', 'Curl con Bilanciere EZ', 'Drag Curl', 'Zottman Curl',
    
    // TRICIPITI
    'French Press', 'French Press con Manubri', 'Dips ai Tricipiti', 'Push-down ai Cavi',
    'Kick Back', 'Overhead Extension', 'Close Grip Bench Press', 'Diamond Push-up',
    'Tricep Dips', 'Skull Crusher', 'JM Press',
    
    // ADDOMINALI E CORE
    'Plank', 'Plank Laterale', 'Crunch', 'Crunch Inverso', 'Bicycle Crunch',
    'Russian Twist', 'Mountain Climbers', 'Dead Bug', 'Bird Dog', 'Hollow Hold',
    'V-Up', 'Leg Raise', 'Hanging Leg Raise', 'Ab Wheel', 'Pallof Press',
    'Woodchop', 'Bear Crawl', 'Superman',
    
    // CARDIO E FUNZIONALE
    'Burpees', 'Jumping Jacks', 'High Knees', 'Butt Kicks', 'Jump Squats',
    'Jump Lunges', 'Box Jump', 'Broad Jump', 'Tuck Jump', 'Star Jump',
    'Battle Ropes', 'Kettlebell Swing', 'Turkish Get-up', 'Farmer Walk',
    'Sled Push', 'Sled Pull', 'Tire Flip', 'Medicine Ball Slam',
    
    // STRETCHING E MOBILITÀ
    'Cat-Cow Stretch', 'Child Pose', 'Downward Dog', 'Cobra Stretch',
    'Hip Flexor Stretch', 'Hamstring Stretch', 'Quad Stretch', 'Calf Stretch',
    'Shoulder Stretch', 'Chest Stretch', 'Spinal Twist', 'Pigeon Pose',
    
    // ESERCIZI ISOMETRICI
    'Wall Sit', 'Hollow Hold', 'L-Sit', 'Front Lever', 'Back Lever',
    'Human Flag', 'Handstand Hold', 'Single Leg Glute Bridge Hold',
    
    // ESERCIZI CON ATTREZZI SPECIFICI
    'Kettlebell Swing', 'Kettlebell Clean', 'Kettlebell Snatch', 'Kettlebell Press',
    'TRX Row', 'TRX Push-up', 'TRX Squat', 'TRX Pike', 'Resistance Band Pull Apart',
    'Resistance Band Squat', 'Bosu Ball Squat', 'Swiss Ball Crunch', 'Swiss Ball Pike',
    
    // MACCHINARI DA PALESTRA
    // Petto
    'Chest Press Machine', 'Pec Deck', 'Cable Crossover Machine', 'Incline Chest Press Machine',
    'Decline Chest Press Machine', 'Chest Fly Machine', 'Dip Machine',
    
    // Schiena
    'Lat Pulldown Machine', 'Cable Row Machine', 'T-Bar Row Machine', 'Hyperextension Machine',
    'Assisted Pull-up Machine', 'Low Row Machine', 'High Row Machine', 'Reverse Fly Machine',
    'Shrug Machine', 'Deadlift Machine',
    
    // Spalle
    'Shoulder Press Machine', 'Lateral Raise Machine', 'Rear Delt Machine', 'Upright Row Machine',
    'Cable Lateral Raise Machine', 'Multi-Station Shoulder Machine',
    
    // Braccia
    'Bicep Curl Machine', 'Tricep Extension Machine', 'Preacher Curl Machine', 'Cable Bicep Machine',
    'Cable Tricep Machine', 'Hammer Curl Machine', 'Tricep Dip Machine',
    
    // Gambe
    'Leg Press Machine', 'Leg Extension Machine', 'Leg Curl Machine', 'Hack Squat Machine',
    'Smith Machine Squat', 'Calf Raise Machine', 'Seated Calf Machine', 'Leg Abduction Machine',
    'Leg Adduction Machine', 'Glute Machine', 'Hip Thrust Machine', 'Bulgarian Split Squat Machine',
    
    // Core e Addominali
    'Ab Crunch Machine', 'Oblique Machine', 'Roman Chair', 'Captain\'s Chair', 'Ab Coaster',
    'Torso Rotation Machine', 'Cable Crunch Machine',
    
    // Cardio Machines
    'Treadmill', 'Elliptical', 'Stationary Bike', 'Rowing Machine', 'Stair Climber',
    'Arc Trainer', 'Spin Bike', 'Recumbent Bike', 'Air Bike', 'Ski Erg',
    
    // Macchine Funzionali
    'Cable Machine', 'Functional Trainer', 'Multi-Station Gym', 'Power Rack', 'Smith Machine',
    'Cable Crossover Station', 'Adjustable Cable Machine', 'Pulley System',
    
    // Macchine Specializzate
    'Inversion Table', 'Vibration Platform', 'Pneumatic Machines', 'Hydraulic Machines',
    'Isokinetic Machines', 'Multi-Hip Machine', 'Pendulum Squat Machine', 'Belt Squat Machine'
  ];
  
  // Auto-save functionality
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const autoSave = useCallback(async () => {
    if (workoutId) {
      try {
        console.log('🔄 AutoSave triggered for workout ID:', workoutId);
        console.log('📊 Current exercises in state:', exercises);
        console.log('📝 Current workout title:', workoutTitle);
        
        let workoutData = await DB.getWorkoutPlanById(workoutId);
        console.log('🔍 Workout data from DB:', workoutData);
        
        // Se il workout non esiste ancora, crealo con i dati di base
        if (!workoutData) {
          console.log('🆕 Workout not found, creating new workout with ID:', workoutId);
          console.log('💪 Creating with exercises:', exercises);
          const now = new Date().toISOString();
          const newWorkoutData = {
            id: workoutId,
            name: workoutTitle || 'Nuova scheda',
            description: workoutDescription || '',
            coach: 'Coach',
            duration: 30,
            exercises: exercises || [], // Include gli esercizi esistenti nella creazione iniziale
            category: 'strength' as const,
            status: workoutStatus || 'draft',
            mediaFiles: { images: [], videos: [], audio: [] },
            tags: [],
            order: 0,
            difficulty: 1,
            targetMuscles: [],
            folderId: null,
            color: '#10B981',
            variants: [],
            createdAt: now,
            updatedAt: now
          };
          // Usa updateWorkoutPlan per creare il nuovo workout (che gestisce sia creazione che aggiornamento)
          console.log('💾 Creating new workout via updateWorkoutPlan:', newWorkoutData);
          await updateWorkoutPlan(workoutId, newWorkoutData);
          console.log('✅ New workout created with', exercises.length, 'exercises');
          
          // Ricarica i dati dal database per assicurarsi che la scheda sia stata creata
          workoutData = await DB.getWorkoutPlanById(workoutId);
          if (!workoutData) {
            console.error('❌ Failed to create workout in database');
            return;
          }
        }

        // Calcola automaticamente la durata in giorni se sono presenti entrambe le date
        let calculatedDuration = workoutData.duration;

        // Aggiorna gli esercizi in base alla variante attiva
        let exercisesToSave = exercises;
        let updatedVariants = variants;
        
        if (activeVariantId === 'original' || !variants.length || !variants.find(v => v.id === activeVariantId)) {
          // Se siamo nell'originale o non ci sono varianti, salva gli esercizi nell'originale
          exercisesToSave = exercises;
        } else {
          // Se siamo in una variante esistente, salva gli esercizi nella variante
          updatedVariants = variants.map(v => 
            v.id === activeVariantId 
              ? { ...v, exercises: exercises, updatedAt: new Date().toISOString() }
              : v
          );
          // Per l'originale, mantieni gli esercizi originali
          exercisesToSave = originalExercises || [];
        }

        const updatedWorkout = { 
          ...workoutData, 
          name: workoutTitle, 
          description: workoutDescription,
          duration: calculatedDuration,
          durationWeeks,
          exercises: exercisesToSave,
          associatedAthletes,
          status: workoutStatus,
          variants: updatedVariants,
          activeVariantId,
          originalWorkoutTitle: originalWorkoutTitle || workoutData.originalWorkoutTitle || workoutData.name,
          updatedAt: new Date().toISOString() 
        };
        
        console.log('💾 Saving workout with exercises:', exercisesToSave.length, 'exercises');
        console.log('🔍 Exercises to save:', exercisesToSave);
        console.log('🔄 Updated workout object:', updatedWorkout);
        await updateWorkoutPlan(workoutId, updatedWorkout);
        console.log('✅ Workout updated successfully');
        
        // Verifica che il salvataggio sia andato a buon fine
        const verifyData = await DB.getWorkoutPlanById(workoutId);
        console.log('🔍 Verification: workout after save:', verifyData);
        console.log('💪 Verification: exercises after save:', verifyData?.exercises);
      } catch (error) {
        console.error('Error saving workout:', error);
      }
    }
  }, [workoutId, workoutTitle, workoutDescription, durationWeeks, exercises, associatedAthletes, workoutStatus, variants, activeVariantId, originalWorkoutTitle, updateWorkoutPlan]);
  
  // Trigger auto-save immediately
  const triggerAutoSave = useCallback(() => {
    // Salvataggio istantaneo senza timeout
    autoSave();
  }, [autoSave]);

  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    // Salva il titolo nel database e aggiorna la vista
    if (workoutId) {
      try {
        const workoutData = await DB.getWorkoutPlanById(workoutId);
        if (workoutData) {
          // Se non esiste originalWorkoutTitle, usa il nome corrente come originale
          // Se esiste già, mantienilo invariato
          const originalTitle = workoutData.originalWorkoutTitle || workoutData.name;
          
          const updatedWorkout = { 
            ...workoutData, 
            name: workoutTitle, 
            originalWorkoutTitle: originalTitle,
            updatedAt: new Date().toISOString() 
          };
          await updateWorkoutPlan(workoutId, updatedWorkout);
          
          // Aggiorna anche lo stato locale se non era già impostato
          if (!originalWorkoutTitle) {
            setOriginalWorkoutTitle(originalTitle);
          }
        }
      } catch (error) {
        console.error('Error saving title:', error);
      }
    }
  };

  const handleSaveDescription = async () => {
    setIsEditingDescription(false);
    // Salva la descrizione nel database e aggiorna la vista
    if (workoutId) {
      try {
        const workoutData = await DB.getWorkoutPlanById(workoutId);
        if (workoutData) {
          const updatedWorkout = { ...workoutData, description: workoutDescription, updatedAt: new Date().toISOString() };
          await updateWorkoutPlan(workoutId, updatedWorkout);
        }
      } catch (error) {
        console.error('Error saving description:', error);
      }
    }
  };
  
  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      descriptionInputRef.current.focus();
    }
  }, [isEditingDescription]);

  // Handle clicks outside exercise dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exerciseDropdownRef.current && !exerciseDropdownRef.current.contains(event.target as Node)) {
        setShowExerciseDropdown(false);
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Carica i dati della scheda dal database
  useEffect(() => {
    const loadWorkoutData = async () => {
      if (workoutId) {
        try {
          console.log('🔄 Loading workout data for ID:', workoutId);
          const workoutData = await DB.getWorkoutPlanById(workoutId);
          console.log('📊 Workout data loaded:', workoutData);
          
          if (workoutData) {
            setWorkoutTitle(workoutData.name);
            setOriginalWorkoutTitle(workoutData.originalWorkoutTitle || workoutData.name);
            setWorkoutDescription(workoutData.description || '');
            
            // Carica sempre gli esercizi della scheda corrente, resettando lo stato precedente
            console.log('💪 Loading exercises for workout:', workoutId, workoutData.exercises);
            console.log('🔍 Exercise IDs from database:', workoutData.exercises?.map(ex => ({ name: ex.name, id: ex.id, idType: typeof ex.id })));
            
            if (workoutData.exercises && workoutData.exercises.length > 0) {
              // Fix exercises with empty or missing IDs
              const exercisesWithValidIds = workoutData.exercises.map(exercise => {
                if (!exercise.id || exercise.id.trim() === '') {
                  const newId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
                  console.log('🔧 Fixing exercise with empty ID:', exercise.name, 'New ID:', newId);
                  return { ...exercise, id: newId };
                }
                return exercise;
              });
              
              // Check if we need to save the updated exercises back to the database
              const needsUpdate = exercisesWithValidIds.some((ex, index) => ex.id !== workoutData.exercises[index].id);
              if (needsUpdate) {
                console.log('💾 Updating exercises with new IDs in database');
                // Update the database with the fixed IDs
                const updatedWorkout = { ...workoutData, exercises: exercisesWithValidIds };
                updateWorkoutPlan(workoutId, updatedWorkout).catch(error => {
                  console.error('Error updating exercise IDs:', error);
                });
              }
              
              setOriginalExercises(exercisesWithValidIds); // Salva gli esercizi originali
              setExercises(exercisesWithValidIds); // Carica sempre gli esercizi della scheda corrente
              console.log('✅ Exercises loaded from database:', exercisesWithValidIds);
            } else {
              // Resetta sempre a array vuoto per nuove schede
              setOriginalExercises([]);
              setExercises([]);
              console.log('📝 No exercises found, setting empty array for workout:', workoutId);
            }
            
            // Carica gli atleti associati
            if (workoutData.associatedAthletes) {
              setAssociatedAthletes(workoutData.associatedAthletes);
            }
            
            // Carica lo status
            if (workoutData.status) {
              setWorkoutStatus(workoutData.status);
            }
            
            // Carica i dati della durata
            if (workoutData.durationWeeks) {
              setDurationWeeks(workoutData.durationWeeks);
            }
            
            // Carica le varianti se esistono
            if (workoutData.variants && workoutData.variants.length > 0) {
              setVariants(workoutData.variants);
              if (workoutData.activeVariantId) {
                setActiveVariantId(workoutData.activeVariantId);
                // Se c'è una variante attiva, carica i suoi esercizi
                const activeVariant = workoutData.variants.find(v => v.id === workoutData.activeVariantId);
                if (activeVariant && activeVariant.exercises) {
                  setExercises(activeVariant.exercises);
                }
              }
            } else {
              // Non inizializzare varianti di default - lascia l'array vuoto
              setVariants([]);
            }
          }
        } catch (error) {
          console.error('❌ Error loading workout data:', error);
        }
      }
    };
    
    loadWorkoutData();
  }, [workoutId]);
  
  // Auto-save function with debouncing is already defined above

  // Debounced auto-save effect - ora istantaneo
  useEffect(() => {
    // Solo salva se i dati sono stati caricati (evita di salvare durante il caricamento iniziale)
    if (workoutId && originalExercises !== null) {
      console.log('🔄 Auto-save effect triggered - data loaded, proceeding with save');
      autoSave();
    } else {
      console.log('⏳ Auto-save effect triggered - waiting for data to load');
    }
  }, [workoutTitle, workoutDescription, exercises, associatedAthletes, workoutStatus, variants, activeVariantId, autoSave, originalExercises]);

  
  const handleAddExercise = () => {
    console.log('➕ Adding new exercise to workout ID:', workoutId);
    console.log('📊 Current exercises before adding:', exercises);
    
    if (editingExerciseId) {
      handleUpdateExercise();
    } else {
      if (currentExercise.name.trim()) {
        // Combine sets and reps for the exercise object
        const setsValue = currentSets && currentReps ? `${currentSets} x ${currentReps}` : 
                         currentSets || currentReps || '';
        
        const newExercise: Exercise = {
          id: Date.now().toString(),
          ...currentExercise,
          sets: setsValue
        };
        console.log('🆕 New exercise created:', newExercise);
        
        const updatedExercises = [...exercises, newExercise];
        console.log('📊 Exercises after adding:', updatedExercises);
        
        setExercises(updatedExercises);
        setCurrentExercise({
          id: '',
          name: '',
          notes: '',
          sets: '',
          intensity: '',
          tut: '',
          recovery: '',
          videoLink: ''
        });
        // Clear separate sets/reps state
        setCurrentSets('');
        setCurrentReps('');
        setShowExerciseForm(false);
        
        // Trigger auto-save immediately for exercise changes
        console.log('🔄 Triggering auto-save after adding exercise');
        triggerAutoSave();
      }
    }
  };
  
  const handleSaveCustomExercise = (exerciseName?: string) => {
    const nameToSave = exerciseName || newExerciseName;
    if (nameToSave.trim() && !predefinedExercises.includes(nameToSave) && !customExercises.includes(nameToSave)) {
      setCustomExercises([...customExercises, nameToSave]);
      if (exerciseName) {
        // Se viene passato un nome, aggiorna il campo corrente
        if (editingExercise) {
          setEditingExercise({ ...editingExercise, name: nameToSave });
        } else {
          setCurrentExercise({ ...currentExercise, name: nameToSave });
        }
      } else {
        // Se non viene passato un nome, usa il comportamento originale
        setCurrentExercise({ ...currentExercise, name: nameToSave });
        setNewExerciseName('');
      }
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
    // Combina esercizi predefiniti e personalizzati, rimuovendo duplicati e stringhe vuote
    const allExercises = [...predefinedExercises, ...customExercises.filter(ex => ex.trim() !== '')];
    const uniqueExercises = Array.from(new Set(allExercises));
    
    if (!exerciseSearchQuery.trim()) {
      return uniqueExercises;
    }
    
    const query = exerciseSearchQuery.toLowerCase();
    return uniqueExercises.filter(exercise => 
      exercise.toLowerCase().includes(query)
    );
  };
  
  // Calcola la durata in settimane
  const calculateDuration = () => {
    return `${durationWeeks} settimana${durationWeeks > 1 ? 'e' : ''}`;
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
    if (editingExercise) {
      setEditingExercise({ ...editingExercise, name: exerciseName });
    } else {
      setCurrentExercise({ ...currentExercise, name: exerciseName });
    }
    setExerciseSearchQuery('');
    setShowExerciseDropdown(false);
    setShowSearchSuggestions(false);
  };
  
  const handleGenerateLink = () => {
    const link = `${window.location.origin}/workout/${workoutId}`;
    setGeneratedLink(link);
    setShowLinkModal(true);
    
    // Trigger auto-save to update link generation timestamp
    triggerAutoSave();
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('Link copiato negli appunti!');
  };
  
  const handleCloneWorkout = async () => {
    // Calcola il numero della prossima variante
    const existingVariantNumbers = variants
      .map(v => {
        const match = v.name.match(/Variante (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);
    
    const nextVariantNumber = existingVariantNumbers.length > 0 
      ? Math.max(...existingVariantNumbers) + 1 
      : 1;

    const newVariant: WorkoutVariant = {
      id: Date.now().toString(),
      name: `Variante ${nextVariantNumber}`,
      isActive: true, // La nuova variante diventa attiva
      exercises: [...originalExercises], // Inizia con una copia degli esercizi originali
      parentWorkoutId: workoutId,
      modifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Disattiva tutte le altre varianti e attiva la nuova
    const updatedVariants = [...variants.map(v => ({ ...v, isActive: false })), newVariant];
    setVariants(updatedVariants);
    setActiveVariantId(newVariant.id);
    
    // Carica gli esercizi della nuova variante
    setExercises([...originalExercises]);
    
    // NON modificare il titolo della scheda - mantieni quello originale
    // La variante avrà il suo nome ma la scheda mantiene il titolo originale
    
    // Salva immediatamente le modifiche nel database
    try {
      const workoutData = await DB.getWorkoutPlanById(workoutId);
      if (workoutData) {
        const updatedWorkout = { 
          ...workoutData, 
          variants: updatedVariants,
          activeVariantId: newVariant.id,
          updatedAt: new Date().toISOString() 
        };
        await updateWorkoutPlan(workoutId, updatedWorkout);
      }
    } catch (error) {
      console.error('Error saving new variant:', error);
    }
  };
  
  const handleSwitchVariant = (variantId: string) => {
    setVariants(variants.map(v => ({ ...v, isActive: v.id === variantId })));
    setActiveVariantId(variantId);
    
    // Carica gli esercizi della variante selezionata
    if (variantId === 'original') {
      // Torna agli esercizi originali
      setExercises(originalExercises);
    } else {
      // Carica gli esercizi della variante
      const selectedVariant = variants.find(v => v.id === variantId);
      if (selectedVariant && selectedVariant.exercises) {
        setExercises(selectedVariant.exercises);
      } else {
        // Se la variante non ha esercizi, inizia con una copia degli originali
        setExercises([...originalExercises]);
      }
    }
    
    // NON modificare il titolo della scheda quando si cambia variante
    // Il titolo della scheda rimane sempre quello originale
    // Solo il nome della variante cambia nei tab
  };
  
  const handleRemoveVariant = (variantId: string) => {
    showConfirmation(
      'Vuoi davvero chiudere questa variante della scheda?',
      async () => {
        const updatedVariants = variants.filter(v => v.id !== variantId);
        setVariants(updatedVariants);
        
        // Se stiamo eliminando la variante attiva
        if (activeVariantId === variantId) {
          if (updatedVariants.length > 0) {
            // Passa alla prima variante disponibile
            const nextVariant = updatedVariants[0];
            setActiveVariantId(nextVariant.id);
            // Aggiorna lo stato di attivazione delle varianti
            setVariants(updatedVariants.map(v => ({ 
              ...v, 
              isActive: v.id === nextVariant.id 
            })));
          } else {
            // Se non ci sono più varianti, torna alla scheda originale
            setActiveVariantId('original');
            setVariants([]);
          }
        }
        
        // Salva immediatamente le modifiche nel database
        try {
          const workoutData = await DB.getWorkoutPlanById(workoutId);
          if (workoutData) {
            const updatedWorkout = { 
              ...workoutData, 
              variants: updatedVariants,
              activeVariantId: activeVariantId === variantId ? (updatedVariants[0]?.id || null) : activeVariantId,
              updatedAt: new Date().toISOString() 
            };
            await updateWorkoutPlan(workoutId, updatedWorkout);
          }
        } catch (error) {
          console.error('Error saving variant deletion:', error);
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
      const updatedAthletes = [...associatedAthletes, athlete];
      setAssociatedAthletes(updatedAthletes);
      setShowAthleteDropdown(false);
      
      // Trigger auto-save immediately for athlete association
      triggerAutoSave();
    }
  };
  
  const handleRemoveAthlete = (athlete: string) => {
    const updatedAthletes = associatedAthletes.filter(a => a !== athlete);
    setAssociatedAthletes(updatedAthletes);
    
    // Trigger auto-save immediately for athlete removal
    triggerAutoSave();
  };
  
  const handleEditExercise = (exercise: Exercise) => {
    console.log('✏️ Editing exercise:', exercise);
    console.log('🆔 Exercise ID type:', typeof exercise.id);
    console.log('🆔 Exercise ID value:', exercise.id);
    console.log('🆔 Exercise ID length:', exercise.id?.length);
    console.log('🆔 Setting editingExerciseId to:', exercise.id);
    
    setEditingExerciseId(exercise.id);
    setEditingExercise({ ...exercise });
    
    // Parse existing sets format (e.g., "3 x 10" or "3x10") into separate values
    const setsString = exercise.sets || '';
    const setsMatch = setsString.match(/(\d+)\s*x\s*(\d+)/i);
    if (setsMatch) {
      setEditingSets(setsMatch[1]);
      setEditingReps(setsMatch[2]);
    } else {
      // If no 'x' format, try to parse as just sets or just reps
      const numMatch = setsString.match(/(\d+)/);
      if (numMatch) {
        setEditingSets(numMatch[1]);
        setEditingReps('');
      } else {
        setEditingSets('');
        setEditingReps('');
      }
    }
    
    setShowExerciseForm(true);
    setShowExerciseDropdown(false);
    
    console.log('✅ Edit state set - editingExerciseId should be:', exercise.id);
  };
  
  const handleUpdateExercise = () => {
    if (editingExercise && editingExerciseId) {
      // Ensure we have the most up-to-date data from the form
      const updatedExercise = {
        ...editingExercise,
        id: editingExerciseId
      };
      
      const updatedExercises = exercises.map(ex => 
        ex.id === editingExerciseId ? updatedExercise : ex
      );
      
      console.log('🔄 Updating exercise:', updatedExercise);
      console.log('📊 Updated exercises list:', updatedExercises);
      
      setExercises(updatedExercises);
      setEditingExerciseId(null);
      setEditingExercise(null);
      setShowExerciseForm(false);
      setShowExerciseDropdown(false);
      
      // Reset current exercise form
      setCurrentExercise({
        name: '',
        notes: '',
        sets: '',
        intensity: '',
        tut: '',
        recovery: '',
        videoLink: ''
      });
      
      // Trigger auto-save immediately for exercise updates
      console.log('🔄 Triggering auto-save after updating exercise');
      triggerAutoSave();
    }
  };
  
  const handleRemoveExercise = (exerciseId: string) => {
    showConfirmation(
      'Sei sicuro di voler rimuovere questo esercizio?',
      () => {
        const updatedExercises = exercises.filter(ex => ex.id !== exerciseId);
        setExercises(updatedExercises);
        
        // Trigger auto-save immediately for exercise removal
        triggerAutoSave();
      }
    );
  };
  
  const handleBackToFolder = () => {
    onClose();
  };
  
  return (
    <div>
      {/* Workout Variants Tabs */}
      {variants.length > 0 && (
        <div className="mb-6 bg-gray-50 p-6">
          <div className="flex space-x-2 border-b border-gray-200">
            {/* Tab per la scheda originale */}
            <div className="relative">
              <button
                onClick={() => {
                  setVariants(variants.map(v => ({ ...v, isActive: false })));
                  setActiveVariantId('original');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                  !variants.some(v => v.isActive)
                    ? 'bg-blue-500 text-white border-b-2 border-blue-500'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {originalWorkoutTitle || workoutTitle}
              </button>
            </div>
            
            {/* Tab per le varianti */}
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
                <button
                  onClick={() => handleRemoveVariant(variant.id)}
                  className="absolute top-1 right-1 p-1 text-gray-500 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="w-full max-w-none mx-auto bg-white rounded-lg shadow-lg p-6 relative">

        
        {/* Back to Folder Button */}
        <div className="flex justify-start mb-4">
          <button
            onClick={onClose}
            className="flex items-center justify-center p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Torna alla Cartella"
          >
            <ArrowLeft size={20} />
          </button>
        </div>

        {/* Centered Title and Description */}
        <div 
          className="text-center mb-6 cursor-pointer" 
          onClick={(e) => {
            // Solo se il click è sullo sfondo (non sui pulsanti di edit)
            if (e.target === e.currentTarget) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
            {/* Editable Title */}
            <div className="flex justify-center items-center mb-2">
            {isEditingTitle ? (
              <div className="flex items-center space-x-2">
                <input
                  ref={titleInputRef}
                  type="text"
                  value={workoutTitle}
                  onChange={(e) => setWorkoutTitle(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
                  className="text-2xl font-bold text-center border-b-2 border-blue-500 bg-transparent outline-none max-w-md"
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <h1 
                  className="text-2xl font-bold text-gray-800 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                  title="Clicca per modificare il titolo"
                >
                  {workoutTitle}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="p-1 text-gray-500 hover:text-blue-500 transition-colors"
                >
                  <Edit3 size={18} />
                </button>
              </div>
            )}
            </div>
          
            {/* Editable Description */}
            <div className="flex justify-center items-center">
            {isEditingDescription ? (
              <div className="flex items-center space-x-2 w-full max-w-md">
                <textarea
                  ref={descriptionInputRef}
                  value={workoutDescription}
                  onChange={(e) => setWorkoutDescription(e.target.value)}
                  onBlur={handleSaveDescription}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSaveDescription()}
                  placeholder="Aggiungi una descrizione..."
                  className="w-full border-b-2 border-blue-500 bg-transparent outline-none resize-none text-gray-600 text-center"
                  rows={2}
                />
              </div>
            ) : (
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setIsEditingDescription(true)}>
                {workoutDescription ? (
                  <p className="text-gray-600 max-w-md text-center">{workoutDescription}</p>
                ) : (
                  <p className="text-gray-400 italic text-center">Clicca per aggiungere una descrizione</p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingDescription(true);
                  }}
                  className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Toolbar - Moved below title */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap justify-center gap-2 max-w-4xl">
            {/* Duration Selector */}
            <button
              onClick={() => setIsEditingDates(!isEditingDates)}
              className="bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2"
            >
              <span>📅</span>
              <span className="font-semibold text-gray-900">Durata</span>
            </button>
            
            {/* Create Exercise */}
            <button
              onClick={() => setShowExerciseForm(true)}
              className="bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2"
            >
              <Plus size={16} className="text-green-600" />
              <span className="font-semibold text-gray-900">Crea</span>
            </button>
            
            {/* Associate Athlete */}
            <button
              onClick={() => setShowAthleteDropdown(!showAthleteDropdown)}
              className="bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2"
            >
              <Users size={16} className="text-purple-600" />
              <span className="font-semibold text-gray-900">Associa</span>
            </button>
            
            {/* View Associated Athletes */}
            <button
              onClick={() => setShowAthletesList(!showAthletesList)}
              className="bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2"
            >
              <Eye size={16} className="text-indigo-600" />
              <span className="font-semibold text-gray-900">Visualizza</span>
            </button>
            
            {/* Generate Link */}
            <button
              onClick={handleGenerateLink}
              className="bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2"
            >
              <Link size={16} className="text-orange-600" />
              <span className="font-semibold text-gray-900">Link</span>
            </button>
            
            {/* Clone Workout */}
            <button
              onClick={handleCloneWorkout}
              className="bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2"
            >
              <Copy size={16} className="text-teal-600" />
              <span className="font-semibold text-gray-900">Clona</span>
            </button>
            
            {/* Workout Status */}
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="bg-white rounded-lg shadow p-4 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl flex items-center space-x-2"
            >
              <div className={`w-3 h-3 rounded-full ${
                workoutStatus === 'published' ? 'bg-green-400' : 'bg-yellow-400'
              }`}></div>
              <span className="font-semibold text-gray-900">{workoutStatus === 'published' ? 'Pubblicata' : 'Bozza'}</span>
            </button>
          </div>
        </div>
        
        {/* Duration Modal */}
        {isEditingDates && (
          <div 
            className="fixed inset-0 z-50 flex items-start justify-center pt-20"
            onClick={() => setIsEditingDates(false)}
          >
            <div 
              className="w-80 bg-white border border-gray-200 rounded-lg shadow-lg p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">Durata scheda (settimane)</label>
                <input
                  type="number"
                  min="1"
                  max="52"
                  value={durationWeeks}
                  onChange={(e) => setDurationWeeks(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <div className="text-xs text-gray-500 mt-1">Inserisci un numero da 1 a 52 settimane</div>
              </div>

              <button
                onClick={() => setIsEditingDates(false)}
                className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
              >
                Salva
              </button>
            </div>
          </div>
        )}
        
        {/* Associate Athlete Modal */}
        {showAthleteDropdown && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowAthleteDropdown(false)}
          >
            <div 
              className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Cerca atleta..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="max-h-40 overflow-y-auto">
                {athletesLoading ? (
                  <div className="p-4 text-gray-500 text-center">Caricamento atleti...</div>
                ) : athletes.length === 0 ? (
                  <div className="p-4 text-gray-500 text-center">Nessun atleta disponibile</div>
                ) : (
                  athletes.map((athlete) => (
                    <button
                      key={athlete.id}
                      onClick={() => handleAssociateAthlete(athlete.name)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{athlete.name}</div>
                        <div className="text-sm text-gray-500">{athlete.email}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* View Athletes Modal */}
        {showAthletesList && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowAthletesList(false)}
          >
            <div 
              className="w-64 bg-white border border-gray-200 rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
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
          </div>
        )}
        
        {/* Status Modal */}
        {showStatusDropdown && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setShowStatusDropdown(false)}
          >
            <div 
              className="w-32 bg-white border border-gray-200 rounded-lg shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
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
          </div>
        )}
        

        
        {/* Exercise Form */}
        {showExerciseForm && (
          <div className="mb-8 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">{editingExerciseId ? 'Modifica Esercizio' : 'Aggiungi Esercizio'}</h3>
            
            {/* Exercise Name with Smart Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Esercizio</label>
              <div className="flex space-x-2">
                <div className="flex-1 relative" ref={exerciseDropdownRef}>
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
                      // Update search query for intelligent search
                      setExerciseSearchQuery(value);
                      // Show search suggestions only if there's text and we're not showing the full dropdown
                      if (value.length > 0 && !showExerciseDropdown) {
                        setShowSearchSuggestions(true);
                      } else {
                        setShowSearchSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      // Show suggestions if there's text in the field
                      const currentName = editingExercise ? editingExercise.name : currentExercise.name;
                      if (currentName.length > 0 && !showExerciseDropdown) {
                        setExerciseSearchQuery(currentName);
                        setShowSearchSuggestions(true);
                      }
                    }}
                    onBlur={(e) => {
                      console.log('🔍 Input blur event triggered');
                      
                      // Check if the related target is within our dropdown
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      const dropdownContainer = exerciseDropdownRef.current;
                      
                      // If there's no relatedTarget (like when clicking on scrollbar), don't close immediately
                      if (!relatedTarget) {
                        console.log('🔍 No related target (possibly scrollbar click) - delaying close');
                        setTimeout(() => {
                          // Only close if the dropdown is still not focused
                          if (!document.activeElement || !dropdownContainer?.contains(document.activeElement)) {
                            console.log('🔍 Closing dropdown after scrollbar interaction');
                            setShowSearchSuggestions(false);
                            if (!showExerciseDropdown) {
                              setShowSearchSuggestions(false);
                            }
                          }
                        }, 300);
                        return;
                      }
                      
                      if (dropdownContainer && relatedTarget && dropdownContainer.contains(relatedTarget)) {
                        console.log('🔍 Blur cancelled - click is within dropdown');
                        return; // Don't hide if clicking within dropdown
                      }
                      
                      // Delay hiding suggestions to allow clicking on them
                      setTimeout(() => {
                        console.log('🔍 Hiding suggestions after blur delay');
                        if (!showExerciseDropdown) {
                          setShowSearchSuggestions(false);
                        }
                      }, 200);
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
                              key={`search-${exercise}`}
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
                
                {/* Save New Exercise Button */}
                {(editingExercise ? editingExercise.name : currentExercise.name).trim() && 
                 !getFilteredExercises().includes(editingExercise ? editingExercise.name : currentExercise.name) && (
                  <button
                    onClick={() => {
                      const exerciseName = editingExercise ? editingExercise.name : currentExercise.name;
                      if (exerciseName.trim() && !predefinedExercises.includes(exerciseName) && !customExercises.includes(exerciseName)) {
                        handleSaveCustomExercise(exerciseName);
                      }
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors flex items-center"
                    title="Salva nuovo esercizio"
                  >
                    <Save size={16} />
                  </button>
                )}
                
                <div className="relative">
                  <button
                    onClick={() => {
                      console.log('🔽 Dropdown button clicked');
                      console.log('showExerciseDropdown before:', showExerciseDropdown);
                      
                      const isOpening = !showExerciseDropdown;
                      setShowExerciseDropdown(isOpening);
                      
                      console.log('isOpening:', isOpening);
                      
                      if (isOpening) {
                        // When opening dropdown, hide search suggestions and set search query
                        setShowSearchSuggestions(false);
                        const currentName = editingExercise ? editingExercise.name : currentExercise.name;
                        setExerciseSearchQuery(currentName);
                        console.log('Setting search query to:', currentName);
                      } else {
                        // When closing dropdown, clear search query
                        setExerciseSearchQuery('');
                        console.log('Clearing search query');
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                    title="Mostra tutti gli esercizi"
                  >
                    ▼
                  </button>
                  {showExerciseDropdown && (
                    <div 
                      className="absolute top-full right-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                      ref={exerciseDropdownRef}
                      onMouseDown={(e) => {
                        console.log('🖱️ Mouse down on dropdown container');
                        e.preventDefault(); // Prevent blur from input field
                        e.stopPropagation(); // Prevent event bubbling
                      }}
                      onClick={(e) => {
                        // Prevent clicks on the dropdown container (including scrollbar) from closing
                        e.stopPropagation();
                      }}
                    >
                      <div 
                        className="max-h-40 overflow-y-auto"
                        onMouseDown={(e) => {
                          // Prevent scrollbar clicks from triggering blur
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          // Prevent scrollbar clicks from closing dropdown
                          e.stopPropagation();
                        }}
                      >
                        {getFilteredExercises().map((exercise) => {
                          const isCustomExercise = customExercises.includes(exercise);
                          return (
                            <div
                              key={`dropdown-${exercise}`}
                              className="hover:bg-gray-100 transition-colors"
                            >
                              <button
                                onMouseDown={(e) => {
                                  console.log('🖱️ Mouse down on exercise button:', exercise);
                                  e.preventDefault(); // Prevent blur
                                  e.stopPropagation(); // Prevent event bubbling
                                  
                                  // Immediately handle the selection here instead of waiting for onClick
                                  console.log('🎯 Processing exercise selection:', exercise);
                                  console.log('📝 editingExercise before:', editingExercise);
                                  console.log('💪 currentExercise before:', currentExercise);
                                  
                                  if (editingExercise) {
                                    const updatedExercise = { ...editingExercise, name: exercise };
                                    console.log('✏️ Setting editingExercise to:', updatedExercise);
                                    setEditingExercise(updatedExercise);
                                    console.log('✏️ editingExercise after set:', updatedExercise);
                                  } else {
                                    const updatedExercise = { ...currentExercise, name: exercise };
                                    console.log('🔄 Setting currentExercise to:', updatedExercise);
                                    setCurrentExercise(updatedExercise);
                                    console.log('🔄 currentExercise after set:', updatedExercise);
                                  }
                                  
                                  console.log('🔄 Closing dropdowns...');
                                  setShowExerciseDropdown(false);
                                  setShowSearchSuggestions(false);
                                  setExerciseSearchQuery('');
                                  
                                  console.log('✅ Exercise selection completed in mouseDown');
                                }}
                                onClick={(e) => {
                                  console.log('🎯 onClick triggered for exercise:', exercise);
                                  // This is now just a fallback, the main logic is in mouseDown
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="w-full text-left px-4 py-2 flex items-center justify-between"
                              >
                                <span>{exercise}</span>
                                {isCustomExercise && (
                                  <button
                                    onClick={(e) => {
                                      console.log('🗑️ Removing custom exercise:', exercise);
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveCustomExercise(exercise);
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 transition-colors ml-2"
                                    title="Elimina esercizio personalizzato"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
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
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={editingExercise ? editingSets : currentSets}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (editingExercise) {
                        setEditingSets(value);
                        // Update the combined sets field for backward compatibility
                        const reps = editingReps || '';
                        setEditingExercise({ 
                          ...editingExercise, 
                          sets: reps ? `${value} x ${reps}` : value 
                        });
                      } else {
                        setCurrentSets(value);
                        // Update the combined sets field for backward compatibility
                        const reps = currentReps || '';
                        setCurrentExercise({ 
                          ...currentExercise, 
                          sets: reps ? `${value} x ${reps}` : value 
                        });
                      }
                    }}
                    placeholder="Serie"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <span className="text-gray-500 font-medium">x</span>
                  <input
                    type="number"
                    value={editingExercise ? editingReps : currentReps}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (editingExercise) {
                        setEditingReps(value);
                        // Update the combined sets field for backward compatibility
                        const sets = editingSets || '';
                        setEditingExercise({ 
                          ...editingExercise, 
                          sets: sets ? `${sets} x ${value}` : value 
                        });
                      } else {
                        setCurrentReps(value);
                        // Update the combined sets field for backward compatibility
                        const sets = currentSets || '';
                        setCurrentExercise({ 
                          ...currentExercise, 
                          sets: sets ? `${sets} x ${value}` : value 
                        });
                      }
                    }}
                    placeholder="Ripetizioni"
                    className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                </div>
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
                  placeholder="es. RPE 8 o RIR 2 o 70% 1RM"
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
                {(() => {
                  console.log('🔍 Button render - editingExerciseId:', editingExerciseId);
                  console.log('🔍 Button render - editingExercise:', editingExercise);
                  return editingExerciseId ? 'Salva Modifiche' : 'Aggiungi Esercizio';
                })()}
              </button>
              <button
                onClick={() => {
                  setShowExerciseForm(false);
                  setEditingExerciseId(null);
                  setEditingExercise(null);
                  setCurrentExercise({
                    id: '',
                    name: '',
                    notes: '',
                    sets: '',
                    intensity: '',
                    tut: '',
                    recovery: '',
                    videoLink: ''
                  });
                  // Clear separate sets/reps state
                  setCurrentSets('');
                  setCurrentReps('');
                  setEditingSets('');
                  setEditingReps('');
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        )}
        
        {/* Exercises List */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">Esercizi</h3>
          {exercises.length > 0 ? (
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
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>Nessun esercizio aggiunto ancora.</p>
              <p className="text-sm mt-2">Clicca su "Aggiungi Esercizio" per iniziare.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Link Generation Modal */}
      {showLinkModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowLinkModal(false)}
        >
          <div 
            className="bg-white p-6 rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowConfirmDialog(false)}
        >
          <div 
            className="bg-white p-6 rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
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
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowDeleteWorkoutDialog(false)}
        >
          <div 
            className="bg-white p-6 rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
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