// Database integrato con Firestore
import { firestoreService } from '../services/firestoreService';

// Tipi di dati per il sistema di workout

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  coach: string;
  startDate: string;
  duration: number; // in giorni
  exercises: Exercise[];
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
}

export interface WorkoutVariant {
  id: string;
  name: string;
  description?: string;
  parentWorkoutId: string;
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



// Flag per controllare se usare Firestore o localStorage
let useFirestore = true; // Abilitato per usare Firebase in produzione

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
    if (useFirestore) {
      try {
        return await firestoreService.getWorkoutPlans();
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
          targetMuscles: plan.targetMuscles || []
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
        const existingPlan = await firestoreService.getWorkoutPlanById(plan.id);
        if (existingPlan) {
          await firestoreService.updateWorkoutPlan(plan.id, plan);
        } else {
          const { id, ...planData } = plan;
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
      const plans = await DB.getWorkoutPlans();
      const existingPlanIndex = plans.findIndex(p => p.id === plan.id);
      
      if (existingPlanIndex >= 0) {
        plans[existingPlanIndex] = plan;
      } else {
        plans.push(plan);
      }
      
      DB.setItem('kw8_workoutPlans', JSON.stringify(plans));
      console.log('✅ Workout plan saved successfully:', plan.name);
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
      const existingIndex = users.findIndex(u => u.id === user.id);
      
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }
      
      DB.setItem('kw8_users', JSON.stringify(users));
      console.log('✅ User saved successfully:', user.name);
    } catch (e) {
      console.error('❌ Error saving user:', e);
    }
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

export default DB;