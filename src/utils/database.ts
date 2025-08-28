// Database semplice utilizzando localStorage

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
  

  
  // Piani di allenamento
  getWorkoutPlans: (): WorkoutPlan[] => {
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
  
  getWorkoutPlanById: (id: string): WorkoutPlan | null => {
    const plans = DB.getWorkoutPlans();
    return plans.find(plan => plan.id === id) || null;
  },
  

  
  saveWorkoutPlan: (plan: WorkoutPlan): void => {
    try {
      const plans = DB.getWorkoutPlans();
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
  
  deleteWorkoutPlan: (planId: string): void => {
    try {
      const plans = DB.getWorkoutPlans();
      const filteredPlans = plans.filter(plan => plan.id !== planId);
      DB.setItem('kw8_workoutPlans', JSON.stringify(filteredPlans));
      console.log('✅ Workout plan deleted successfully:', planId);
    } catch (e) {
      console.error('❌ Error deleting workout plan:', e);
    }
  },

  // Cartelle
  getWorkoutFolders: (): WorkoutFolder[] => {
    try {
      const folders = DB.getItem('kw8_workoutFolders');
      return folders ? JSON.parse(folders) : [];
    } catch (e) {
      console.error('❌ Error parsing workout folders data:', e);
      return [];
    }
  },

  getWorkoutFolderById: (id: string): WorkoutFolder | null => {
    const folders = DB.getWorkoutFolders();
    return folders.find(folder => folder.id === id) || null;
  },

  saveWorkoutFolder: (folder: WorkoutFolder): void => {
    try {
      const folders = DB.getWorkoutFolders();
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

  deleteWorkoutFolder: (folderId: string): void => {
    try {
      const folders = DB.getWorkoutFolders();
      const plans = DB.getWorkoutPlans();
      
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

  getWorkoutPlansByFolderId: (folderId?: string): WorkoutPlan[] => {
    const plans = DB.getWorkoutPlans();
    return plans.filter(plan => plan.folderId === folderId);
  },

  getSubfolders: (parentId?: string): WorkoutFolder[] => {
    const folders = DB.getWorkoutFolders();
    return folders.filter(folder => folder.parentId === parentId);
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