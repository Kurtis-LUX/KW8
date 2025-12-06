// Database integrato con Firestore
import firestoreService from '../services/firestoreService';
import { db } from '../config/firebase';

// Controlla se Firebase è disabilitato controllando se db è un mock
const checkFirebaseStatus = () => {
  try {
    // Se db.collection restituisce un mock, Firebase è disabilitato
    const testCollection = db.collection('test');
    return testCollection && typeof testCollection.get === 'function';
  } catch (error) {
    return false;
  }
};

// Tipi di dati per il sistema di workout

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  coach: string;
  startDate: string;
  endDate?: string; // Data di fine per calcolo durata
  duration: number; // in giorni
  exercises: Exercise[];
  // Supporto per giorni G1–G10; chiave es. "G1"
  days?: { [key: string]: Exercise[] };
  // Nomi personalizzati per i giorni (chiavi corrispondono a days: es. "G1")
  dayNames?: { [key: string]: string };
  // Elenco delle settimane (es. ["W1", "W2", ...])
  weeks?: string[];
  // Mappa settimana -> mappa giornate per quella settimana
  // Esempio: { W1: { G1: [...], G2: [...] }, W2: { G1: [...]} }
  weeksStore?: { [weekKey: string]: { [dayKey: string]: Exercise[] } };
  category?: string;
  status: 'draft' | 'published' | 'archived';
  mediaFiles?: {
    images?: string[];
    videos?: string[];
    audio?: string[];
  };
  tags?: string[];
  order: number;
  createdAt: string;
  updatedAt: string;
  difficulty?: number; // 1-5 stelle
  targetMuscles?: string[];
  folderId?: string; // ID della cartella contenitore
  color?: string;
  variants?: WorkoutVariant[];
  originalWorkoutTitle?: string; // Titolo originale per le varianti
  // Variante attiva corrente ("original" oppure id variante)
  activeVariantId?: string;
  // Durata in settimane (derivata o esplicita)
  durationWeeks?: number;
  // Elenco degli ID degli atleti associati alla scheda
  associatedAthletes?: string[];
}

export interface WorkoutVariant {
  id: string;
  name: string;
  description?: string;
  parentWorkoutId: string;
  exercises?: Exercise[]; // Esercizi specifici della variante
  // Supporto per giorni G1–G10; chiave es. "G1"
  days?: { [key: string]: Exercise[] };
  // Nomi personalizzati per i giorni di questa variante
  dayNames?: { [key: string]: string };
  // Mappa settimana -> mappa giornate per questa variante
  weeksStore?: { [weekKey: string]: { [dayKey: string]: Exercise[] } };
  modifications: {
    exerciseId: string;
    changes: {
      sets?: number;
      reps?: number;
      weight?: number;
      duration?: number;
      rest?: number;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutFolder {
  id: string;
  name: string;
  icon: string; // Nome dell'icona Lucide React
  color: string; // Colore personalizzabile (hex, rgb, o nome colore)
  parentId?: string; // ID della cartella padre (per sotto-cartelle)
  order: number;
  createdAt: string;
  updatedAt: string;
  isExpanded?: boolean; // Stato di espansione nell'UI
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  rest: number; // in secondi
  description?: string;
  imageUrl?: string;
}

export interface Subscription {
  id: string;
  type: string;
  price: number;
  duration: number; // in mesi
  features: string[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'coach' | 'atleta';
  subscriptionType?: string;
  subscriptionEndDate?: string;
  workoutPlans: string[];
  birthDate?: string;
}

export interface GymArea {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  iconName: string;
  description: string;
  image: string;
  overlayColor: string;
  overlayOpacity: number;
  iconColor: string;
  textColor: string;
  createdAt: string;
  updatedAt: string;
}



// Flag per controllare se usare Firestore o localStorage
let useFirestore = false; // Disabilitato per usare localStorage in sviluppo (Firebase è disabilitato)

// Funzione per abilitare/disabilitare Firestore
export const setFirestoreEnabled = (enabled: boolean) => {
  useFirestore = enabled;
  console.log(`🔥 Firestore ${enabled ? 'enabled' : 'disabled'}`);
};

// Funzione per disabilitare Firestore in caso di errori
const disableFirestoreOnError = (error: any) => {
  if (error?.code === 'auth/api-key-not-valid' || 
      error?.message?.includes('api-key-not-valid') ||
      error?.message?.includes('Firebase: Error (auth/api-key-not-valid')) {
    console.warn('⚠️ Disabling Firestore due to invalid API key, using localStorage fallback');
    useFirestore = false;
    return true;
  }
  return false;
};

// Funzione per verificare se Firestore è abilitato
export const isFirestoreEnabled = () => useFirestore;

// Funzioni per interagire con il database con fallback per mobile
const DB = {
  // Controllo compatibilità storage
  isStorageAvailable: (): boolean => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      console.warn('⚠️ localStorage not available:', e);
      return false;
    }
  },
  
  // Fallback storage in memoria per dispositivi con problemi
  memoryStorage: new Map<string, string>(),
  
  // Metodi storage unificati
  getItem: (key: string): string | null => {
    if (DB.isStorageAvailable()) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        console.warn('⚠️ localStorage.getItem failed:', e);
      }
    }
    return DB.memoryStorage.get(key) || null;
  },
  
  setItem: (key: string, value: string): void => {
    if (DB.isStorageAvailable()) {
      try {
        localStorage.setItem(key, value);
        return;
      } catch (e) {
        console.warn('⚠️ localStorage.setItem failed, using memory storage:', e);
      }
    }
    DB.memoryStorage.set(key, value);
  },
  
  removeItem: (key: string): void => {
    if (DB.isStorageAvailable()) {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn('⚠️ localStorage.removeItem failed:', e);
      }
    }
    DB.memoryStorage.delete(key);
  },
  

  
  // Piani di allenamento con Firestore
  getWorkoutPlans: async (): Promise<WorkoutPlan[]> => {
    // Se Firestore è abilitato, prova a leggere e normalizza i campi;
    // se vuoto, effettua fallback ai dati locali.
    if (useFirestore) {
      try {
        const remotePlans = await firestoreService.getWorkoutPlans();
        const now = new Date().toISOString();
        const normalizedRemote = (remotePlans || []).map((plan: any, index: number) => ({
          ...plan,
          category: plan.category || 'strength',
          status: plan.status || 'published',
          mediaFiles: plan.mediaFiles || { images: [], videos: [], audio: [] },
          tags: plan.tags || [],
          order: plan.order !== undefined ? plan.order : index,
          createdAt: plan.createdAt || now,
          updatedAt: plan.updatedAt || now,
          difficulty: plan.difficulty || 'beginner',
          targetMuscles: plan.targetMuscles || [],
          days: plan.days || {},
          activeVariantId: plan.activeVariantId || 'original',
          durationWeeks: plan.durationWeeks || (plan.duration ? Math.max(1, Math.ceil(plan.duration / 7)) : 1),
          associatedAthletes: Array.isArray(plan.associatedAthletes) ? plan.associatedAthletes : []
        }));

        // Se Firestore ha dati, restituisci quelli normalizzati
        if (normalizedRemote.length > 0) {
          return normalizedRemote as WorkoutPlan[];
        }
        // Altrimenti prosegui con il fallback locale
      } catch (error) {
        console.error('Error fetching from Firestore, falling back to localStorage:', error);
        disableFirestoreOnError(error);
        // Fallback a localStorage in caso di errore
      }
    }
    
    // Fallback localStorage
    try {
      const plans = DB.getItem('kw8_workoutPlans');
      const workoutPlans = plans ? JSON.parse(plans) : [];
      
      // Aggiorna le schede esistenti con le nuove proprietà se mancanti
      const updatedPlans = workoutPlans.map((plan: any, index: number) => {
        const now = new Date().toISOString();
        return {
          ...plan,
          category: plan.category || 'strength',
          status: plan.status || 'published',
          mediaFiles: plan.mediaFiles || { images: [], videos: [], audio: [] },
          tags: plan.tags || [],
          order: plan.order !== undefined ? plan.order : index,
          createdAt: plan.createdAt || now,
          updatedAt: plan.updatedAt || now,
          difficulty: plan.difficulty || 'beginner',
          targetMuscles: plan.targetMuscles || [],
          // Inizializza nuove proprietà se mancanti
          days: plan.days || {},
          activeVariantId: plan.activeVariantId || 'original',
          durationWeeks: plan.durationWeeks || (plan.duration ? Math.max(1, Math.ceil(plan.duration / 7)) : 1),
          associatedAthletes: Array.isArray(plan.associatedAthletes) ? plan.associatedAthletes : []
        };
      });
      
      // Salva le schede aggiornate se sono state modificate
      if (updatedPlans.length > 0 && JSON.stringify(updatedPlans) !== JSON.stringify(workoutPlans)) {
        DB.setItem('kw8_workoutPlans', JSON.stringify(updatedPlans));
      }
      
      return updatedPlans;
    } catch (e) {
      console.error('❌ Error parsing workout plans data:', e);
      return [];
    }
  },
  
  getWorkoutPlanById: async (id: string): Promise<WorkoutPlan | null> => {
    if (useFirestore) {
      try {
        return await firestoreService.getWorkoutPlanById(id);
      } catch (error) {
        console.error('Error fetching from Firestore, falling back to localStorage:', error);
      }
    }
    
    // Fallback localStorage
    const plans = await DB.getWorkoutPlans();
    return plans.find(plan => plan.id === id) || null;
  },
  

  
  saveWorkoutPlan: async (plan: WorkoutPlan): Promise<void> => {
    if (useFirestore) {
      try {
        const now = new Date().toISOString();
        const normalizedPlan: WorkoutPlan = {
          ...plan,
          updatedAt: now,
          associatedAthletes: Array.isArray(plan.associatedAthletes)
            ? Array.from(new Set(plan.associatedAthletes.map(a => String(a).trim()).filter(Boolean)))
            : []
        } as WorkoutPlan;
        const existingPlan = await firestoreService.getWorkoutPlanById(normalizedPlan.id);
        if (existingPlan) {
          await firestoreService.updateWorkoutPlan(normalizedPlan.id, normalizedPlan);
        } else {
          const { id, ...planData } = normalizedPlan;
          await firestoreService.createWorkoutPlan(planData);
        }
        console.log('✅ Workout plan saved successfully to Firestore:', plan.name);
        return;
      } catch (error) {
        console.error('Error saving to Firestore, falling back to localStorage:', error);
        disableFirestoreOnError(error);
      }
    }
    
    // Fallback localStorage
    try {
      const now = new Date().toISOString();
      const normalizedPlan: WorkoutPlan = {
        ...plan,
        updatedAt: now,
        associatedAthletes: Array.isArray(plan.associatedAthletes)
          ? Array.from(new Set(plan.associatedAthletes.map(a => String(a).trim()).filter(Boolean)))
          : []
      } as WorkoutPlan;
      const plans = await DB.getWorkoutPlans();
      const existingPlanIndex = plans.findIndex(p => p.id === normalizedPlan.id);
      
      if (existingPlanIndex >= 0) {
        plans[existingPlanIndex] = normalizedPlan;
      } else {
        plans.push(normalizedPlan);
      }
      
      DB.setItem('kw8_workoutPlans', JSON.stringify(plans));
      console.log('✅ Workout plan saved successfully:', normalizedPlan.name);
    } catch (e) {
      console.error('❌ Error saving workout plan:', e);
    }
  },
  
  deleteWorkoutPlan: async (planId: string): Promise<void> => {
    if (useFirestore) {
      try {
        await firestoreService.deleteWorkoutPlan(planId);
        console.log('✅ Workout plan deleted successfully from Firestore:', planId);
        return;
      } catch (error) {
        console.error('Error deleting from Firestore, falling back to localStorage:', error);
        disableFirestoreOnError(error);
      }
    }
    
    // Fallback localStorage
    try {
      const plans = await DB.getWorkoutPlans();
      const filteredPlans = plans.filter(plan => plan.id !== planId);
      DB.setItem('kw8_workoutPlans', JSON.stringify(filteredPlans));
      console.log('✅ Workout plan deleted successfully:', planId);
    } catch (e) {
      console.error('❌ Error deleting workout plan:', e);
    }
  },

  // Cartelle con Firestore
  getWorkoutFolders: async (): Promise<WorkoutFolder[]> => {
    if (useFirestore) {
      try {
        return await firestoreService.getWorkoutFolders();
      } catch (error) {
        console.error('Error fetching folders from Firestore, falling back to localStorage:', error);
        disableFirestoreOnError(error);
      }
    }
    
    // Fallback localStorage
    try {
      const folders = DB.getItem('kw8_workoutFolders');
      return folders ? JSON.parse(folders) : [];
    } catch (e) {
      console.error('❌ Error parsing workout folders data:', e);
      return [];
    }
  },

  getWorkoutFolderById: async (id: string): Promise<WorkoutFolder | null> => {
    if (useFirestore) {
      try {
        return await firestoreService.getWorkoutFolderById(id);
      } catch (error) {
        console.error('Error fetching folder from Firestore, falling back to localStorage:', error);
        disableFirestoreOnError(error);
      }
    }
    
    // Fallback localStorage
    const folders = await DB.getWorkoutFolders();
    return folders.find(folder => folder.id === id) || null;
  },

  saveWorkoutFolder: async (folder: WorkoutFolder): Promise<void> => {
    if (useFirestore) {
      try {
        const existingFolder = await firestoreService.getWorkoutFolderById(folder.id);
        if (existingFolder) {
          await firestoreService.updateWorkoutFolder(folder.id, folder);
        } else {
          const { id, ...folderData } = folder;
          await firestoreService.createWorkoutFolder(folderData);
        }
        console.log('✅ Workout folder saved successfully to Firestore:', folder.name);
        return;
      } catch (error) {
        console.error('Error saving folder to Firestore, falling back to localStorage:', error);
        disableFirestoreOnError(error);
      }
    }
    
    // Fallback localStorage
    try {
      const folders = await DB.getWorkoutFolders();
      const existingFolderIndex = folders.findIndex(f => f.id === folder.id);
      
      if (existingFolderIndex >= 0) {
        folders[existingFolderIndex] = { ...folder, updatedAt: new Date().toISOString() };
      } else {
        folders.push({ ...folder, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
      
      DB.setItem('kw8_workoutFolders', JSON.stringify(folders));
      console.log('✅ Workout folder saved successfully:', folder.name);
    } catch (e) {
      console.error('❌ Error saving workout folder:', e);
    }
  },

  deleteWorkoutFolder: async (folderId: string): Promise<void> => {
    if (useFirestore) {
      try {
        await firestoreService.deleteWorkoutFolder(folderId);
        console.log('✅ Workout folder deleted successfully from Firestore:', folderId);
        return;
      } catch (error) {
        console.error('Error deleting folder from Firestore, falling back to localStorage:', error);
        disableFirestoreOnError(error);
      }
    }
    
    // Fallback localStorage
    try {
      const folders = await DB.getWorkoutFolders();
      const plans = await DB.getWorkoutPlans();
      
      // Rimuovi la cartella
      const filteredFolders = folders.filter(folder => folder.id !== folderId);
      
      // Sposta le schede della cartella eliminata nella root
      const updatedPlans = plans.map(plan => 
        plan.folderId === folderId ? { ...plan, folderId: undefined } : plan
      );
      
      // Sposta le sotto-cartelle nella cartella padre o root
      const parentFolder = folders.find(f => f.id === folderId);
      const updatedFolders = filteredFolders.map(folder => 
        folder.parentId === folderId 
          ? { ...folder, parentId: parentFolder?.parentId }
          : folder
      );
      
      DB.setItem('kw8_workoutFolders', JSON.stringify(updatedFolders));
      DB.setItem('kw8_workoutPlans', JSON.stringify(updatedPlans));
      console.log('✅ Workout folder deleted successfully:', folderId);
    } catch (e) {
      console.error('❌ Error deleting workout folder:', e);
    }
  },

  getWorkoutPlansByFolderId: async (folderId?: string): Promise<WorkoutPlan[]> => {
    const plans = await DB.getWorkoutPlans();
    return plans.filter(plan => plan.folderId === folderId);
  },

  getSubfolders: async (parentId?: string): Promise<WorkoutFolder[]> => {
    const folders = await DB.getWorkoutFolders();
    return folders.filter(folder => folder.parentId === parentId);
  },

  // ==================== SUBSCRIPTIONS ====================
  
  getSubscriptions: (): Subscription[] => {
    try {
      const data = DB.getItem('kw8_subscriptions');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('❌ Error parsing subscriptions data:', e);
      return [];
    }
  },

  saveSubscription: (subscription: Subscription): void => {
    try {
      const subscriptions = DB.getSubscriptions();
      const existingIndex = subscriptions.findIndex(s => s.id === subscription.id);
      
      if (existingIndex >= 0) {
        subscriptions[existingIndex] = subscription;
      } else {
        subscriptions.push(subscription);
      }
      
      DB.setItem('kw8_subscriptions', JSON.stringify(subscriptions));
      console.log('✅ Subscription saved successfully:', subscription.type);
    } catch (e) {
      console.error('❌ Error saving subscription:', e);
    }
  },

  // ==================== USERS ====================
  
  getUsers: (): User[] => {
    try {
      const data = DB.getItem('kw8_users');
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('❌ Error parsing users data:', e);
      return [];
    }
  },

  saveUser: (user: User): void => {
    try {
      const users = DB.getUsers();
      const normalizedUser: User = {
        ...user,
        name: (user.name || '').trim(),
        role: ((): User['role'] => {
          const r = String(user.role || '').toLowerCase();
          if (r === 'atleta' || r === 'athlete') return 'athlete';
          if (r === 'coach') return 'coach';
          return 'admin';
        })(),
        workoutPlans: Array.isArray(user.workoutPlans)
          ? Array.from(new Set(user.workoutPlans.map(id => String(id).trim()).filter(Boolean)))
          : []
      } as User;
      const existingIndex = users.findIndex(u => u.id === normalizedUser.id);
      
      if (existingIndex >= 0) {
        users[existingIndex] = normalizedUser;
      } else {
        users.push(normalizedUser);
      }
      
      DB.setItem('kw8_users', JSON.stringify(users));
      console.log('✅ User saved successfully:', normalizedUser.name);
    } catch (e) {
      console.error('❌ Error saving user:', e);
    }
  },
  






  
  // Funzioni per gestire le aree della palestra
  getGymAreas: async (): Promise<GymArea[]> => {
    if (useFirestore) {
      try {
        return await firestoreService.getGymAreas();
      } catch (error) {
        console.error('Error fetching gym areas from Firestore, falling back to localStorage:', error);
        disableFirestoreOnError(error);
      }
    }
    
    // Fallback localStorage
    try {
      const areas = DB.getItem('kw8_gymAreas');
      return areas ? JSON.parse(areas) : [];
    } catch (error) {
      console.error('Error getting gym areas:', error);
      return [];
    }
  },

  saveGymAreas: async (areas: GymArea[]): Promise<void> => {
    const areasWithTimestamps = areas.map(area => ({
      ...area,
      createdAt: area.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    if (useFirestore) {
      try {
        await firestoreService.saveGymAreas(areasWithTimestamps);
        console.log('🔥 Gym areas saved successfully to Firestore');
        return;
      } catch (error) {
        console.error('Error saving gym areas to Firestore, falling back to localStorage:', error);
        disableFirestoreOnError(error);
      }
    }
    
    // Fallback localStorage
    try {
      DB.setItem('kw8_gymAreas', JSON.stringify(areasWithTimestamps));
      console.log('💾 Gym areas saved successfully to localStorage');
    } catch (error) {
      console.error('Error saving gym areas:', error);
    }
  },

  subscribeToGymAreas: (callback: (areas: GymArea[]) => void): (() => void) => {
    // Se Firestore è disponibile, usa la subscription di Firestore
    const setupFirestoreSubscription = async () => {
      if (await isFirestoreEnabled()) {
        try {
          return firestoreService.subscribeToGymAreas(callback);
        } catch (error) {
          console.error('Error subscribing to gym areas via Firestore:', error);
          // Fallback a localStorage
        }
      }

      // Fallback per localStorage: carica i dati una volta e chiama il callback
      try {
        const areas = await DB.getGymAreas();
        callback(areas);
      } catch (error) {
        console.error('Error loading gym areas for subscription:', error);
        callback([]);
      }

      // Ritorna una funzione vuota per l'unsubscribe (localStorage non ha subscription reale)
      return () => {};
    };

    // Esegui la configurazione e ritorna una funzione di cleanup
    let unsubscribe: (() => void) | undefined;
    setupFirestoreSubscription().then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  },

  // Inizializzazione del database con controlli di compatibilità
  initializeDatabase: async (): Promise<void> => {
    console.log('🔧 Initializing database...');
    
    // Verifica compatibilità storage
    const storageAvailable = DB.isStorageAvailable();
    console.log('💾 Storage available:', storageAvailable);
    
    if (!storageAvailable) {
      console.warn('⚠️ localStorage not available, using memory storage fallback');
      console.warn('⚠️ Data will be lost on page refresh');
    }
    
    // Test di scrittura/lettura
    try {
      const testKey = '__db_test__';
      const testValue = 'test_value_' + Date.now();
      
      DB.setItem(testKey, testValue);
      const retrievedValue = DB.getItem(testKey);
      DB.removeItem(testKey);
      
      if (retrievedValue === testValue) {
        console.log('✅ Database read/write test passed');
      } else {
        console.error('❌ Database read/write test failed');
      }
    } catch (e) {
      console.error('❌ Database test failed:', e);
    }
    
    // Informazioni di debug per mobile
    console.log('📱 Mobile Debug Info:', {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      onLine: navigator.onLine,
      cookieEnabled: navigator.cookieEnabled,
      memoryStorageEntries: DB.memoryStorage.size,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio
      },
      connection: (navigator as any).connection ? {
        effectiveType: (navigator as any).connection.effectiveType,
        downlink: (navigator as any).connection.downlink,
        rtt: (navigator as any).connection.rtt
      } : 'not available'
    });
    
    // Verifica dati esistenti
    const plans = DB.getWorkoutPlans();
    const folders = DB.getWorkoutFolders();
    console.log('💾 Database Statistics:', {
      workoutPlans: plans.length,
      workoutFolders: folders.length
    });
    
    // Test di performance per dispositivi lenti
    const performanceStart = performance.now();
    try {
      // Test di lettura/scrittura multipla
      for (let i = 0; i < 5; i++) {
        DB.setItem(`perf_test_${i}`, `test_data_${i}`);
        DB.getItem(`perf_test_${i}`);
        DB.removeItem(`perf_test_${i}`);
      }
      const performanceEnd = performance.now();
      console.log(`⚡ Storage performance test: ${(performanceEnd - performanceStart).toFixed(2)}ms`);
    } catch (e) {
      console.warn('⚠️ Storage performance test failed:', e);
    }
    
    console.log('✅ Database initialization completed');
  }
};

// Funzioni per la gestione della sezione staff
export const getStaffSection = async () => {
  try {
    return await firestoreService.getDocument('staff', 'staff-section');
  } catch (error) {
    console.error('Error getting staff section:', error);
    return null;
  }
};

export const saveStaffSection = async (staffData: any) => {
  try {
    await firestoreService.setDocument('staff', 'staff-section', staffData);
    return true;
  } catch (error) {
    console.error('Error saving staff section:', error);
    throw error;
  }
};

export const subscribeToStaffSection = (callback: (data: any) => void) => {
  try {
    return firestoreService.subscribeToDocument('staff', 'staff-section', callback);
  } catch (error) {
    console.error('Error subscribing to staff section:', error);
    return () => {};
  }
};

// Funzioni per la gestione dei casi di miglioramento
export const getTransformationCases = async () => {
  try {
    return await firestoreService.getDocument('transformations', 'transformation-cases');
  } catch (error) {
    console.error('Error getting transformation cases:', error);
    return null;
  }
};

export const saveTransformationCases = async (casesData: any) => {
  try {
    await firestoreService.setDocument('transformations', 'transformation-cases', { cases: casesData });
    return true;
  } catch (error) {
    console.error('Error saving transformation cases:', error);
    throw error;
  }
};

export const loadTransformationCases = async () => {
  try {
    const data = await firestoreService.getDocument('transformations', 'transformation-cases');
    return data?.cases || null;
  } catch (error) {
    console.error('Error loading transformation cases:', error);
    return null;
  }
};

export const subscribeToTransformationCases = (callback: (data: any) => void) => {
  try {
    return firestoreService.subscribeToDocument('transformations', 'transformation-cases', callback);
  } catch (error) {
    console.error('Error subscribing to transformation cases:', error);
    return () => {};
  }
};

// Funzioni per la gestione della sezione Avvisi
export const getAnnouncementsSection = async () => {
  // Usa Firestore se abilitato, altrimenti fallback a localStorage
  try {
    if (isFirestoreEnabled()) {
      const doc = await firestoreService.getDocument('announcements', 'announcements-section');
      if (doc) return doc;
    }
  } catch (error) {
    console.error('Error getting announcements section from Firestore:', error);
  }

  // Fallback locale
  try {
    const raw = DB.getItem('kw8_announcementsSection');
    if (raw) {
      return JSON.parse(raw);
    }
    const now = new Date().toISOString();
    const initial = {
      id: 'announcements-section',
      title: 'Avvisi',
      subtitle: '',
      announcements: [],
      createdAt: now,
      updatedAt: now
    };
    // Non scriviamo subito su storage per evitare effetti collaterali
    return initial;
  } catch (error) {
    console.error('Error getting announcements section (local):', error);
    return null;
  }
};

export const saveAnnouncementsSection = async (announcementsData: any) => {
  // Prova a salvare su Firestore se abilitato
  try {
    if (isFirestoreEnabled()) {
      await firestoreService.setDocument('announcements', 'announcements-section', announcementsData);
      return true;
    }
  } catch (error) {
    console.error('Error saving announcements section to Firestore:', error);
  }

  // Fallback locale
  try {
    const safe = {
      ...announcementsData,
      id: announcementsData?.id || 'announcements-section',
      updatedAt: new Date().toISOString(),
      createdAt: announcementsData?.createdAt || new Date().toISOString()
    };
    DB.setItem('kw8_announcementsSection', JSON.stringify(safe));
    return true;
  } catch (error) {
    console.error('Error saving announcements section (local):', error);
    throw error;
  }
};

export const subscribeToAnnouncementsSection = (callback: (data: any) => void) => {
  // Subscription Firestore se disponibile
  try {
    if (isFirestoreEnabled()) {
      return firestoreService.subscribeToDocument('announcements', 'announcements-section', callback);
    }
  } catch (error) {
    console.error('Error subscribing to announcements section via Firestore:', error);
  }

  // Fallback: chiamata immediata con i dati locali, senza vera subscription
  try {
    (async () => {
      const data = await getAnnouncementsSection();
      callback(data);
    })();
  } catch (error) {
    console.error('Error loading announcements section for subscription (local):', error);
    callback(null);
  }
  return () => {};
};

export default DB;
