// Database semplice utilizzando localStorage

// Tipi di dati
export type UserRole = 'atleta' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: 'admin' | 'atleta';
  paymentStatus?: 'paid' | 'pending';
  membershipStatus?: 'active' | 'pending';
  subscriptionType?: string;
  subscriptionEndDate?: string;
  workoutPlans: string[];
  birthDate: string;
  gender: 'M' | 'F';
  fiscalCode: string;
  birthPlace: string;
  address: string;
  notes?: string;
  membershipFilePath?: string;
  lastPaymentDate?: string;
  membershipDate?: string;
  invoiceFilePath?: string;
  ipAddress?: string;
  certificatoMedico?: boolean; // Manteniamo per compatibilità
  certificatoMedicoStato?: 'Valido' | 'Mancante' | 'Scaduto';
  certificatoMedicoFile?: string;
  dataCertificato?: string;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description?: string;
  coach: string;
  startDate: string;
  duration: number; // in giorni
  exercises: Exercise[];
  userId: string;
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
}

export interface WorkoutFolder {
  id: string;
  name: string;
  icon: string; // Nome dell'icona Lucide React
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
  
  // Utenti
  getUsers: (): User[] => {
    try {
      const users = DB.getItem('kw8_users');
      return users ? JSON.parse(users) : [];
    } catch (e) {
      console.error('❌ Error parsing users data:', e);
      return [];
    }
  },
  
  getUserById: (id: string): User | null => {
    const users = DB.getUsers();
    return users.find(user => user.id === id) || null;
  },
  
  getUserByEmail: (email: string): User | null => {
    const users = DB.getUsers();
    return users.find(user => user.email === email) || null;
  },
  
  saveUser: (user: User): void => {
    try {
      const users = DB.getUsers();
      const existingUserIndex = users.findIndex(u => u.id === user.id);
      
      if (existingUserIndex >= 0) {
        users[existingUserIndex] = user;
      } else {
        users.push(user);
      }
      
      DB.setItem('kw8_users', JSON.stringify(users));
      console.log('✅ User saved successfully:', user.email);
    } catch (e) {
      console.error('❌ Error saving user:', e);
    }
  },
  
  deleteUser: (userId: string): void => {
    try {
      const users = DB.getUsers();
      const filteredUsers = users.filter(u => u.id !== userId);
      DB.setItem('kw8_users', JSON.stringify(filteredUsers));
      console.log('✅ User deleted successfully:', userId);
    } catch (e) {
      console.error('❌ Error deleting user:', e);
    }
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
  
  getWorkoutPlansByUserId: (userId: string): WorkoutPlan[] => {
    const plans = DB.getWorkoutPlans();
    return plans.filter(plan => plan.userId === userId);
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
  
  // Abbonamenti
  getSubscriptions: (): Subscription[] => {
    try {
      const subscriptions = DB.getItem('kw8_subscriptions');
      return subscriptions ? JSON.parse(subscriptions) : [];
    } catch (e) {
      console.error('❌ Error parsing subscriptions data:', e);
      return [];
    }
  },
  
  getSubscriptionById: (id: string): Subscription | null => {
    const subscriptions = DB.getSubscriptions();
    return subscriptions.find(sub => sub.id === id) || null;
  },
  
  saveSubscription: (subscription: Subscription): void => {
    try {
      const subscriptions = DB.getSubscriptions();
      const existingSubIndex = subscriptions.findIndex(s => s.id === subscription.id);
      
      if (existingSubIndex >= 0) {
        subscriptions[existingSubIndex] = subscription;
      } else {
        subscriptions.push(subscription);
      }
      
      DB.setItem('kw8_subscriptions', JSON.stringify(subscriptions));
      console.log('✅ Subscription saved successfully:', subscription.type);
    } catch (e) {
      console.error('❌ Error saving subscription:', e);
    }
  },
  
  // Nota: initializeDatabase è definito più avanti nel file
  
  // Verifica le credenziali dell'utente
  verifyCredentials: (email: string, password: string): { user: User | null, success: boolean, message: string } => {
    const user = DB.getUserByEmail(email);
    
    if (!user) {
      return { user: null, success: false, message: 'Utente non trovato' };
    }
    
    // Per l'admin, verifica la password
    if (user.role === 'admin') {
      if (user.password === password) {
        return { user, success: true, message: 'Login effettuato con successo' };
      } else {
        return { user: null, success: false, message: 'Password non valida' };
      }
    }
    
    // Per gli atleti, in questa versione semplificata, accettiamo qualsiasi password
    // In un'app reale, verificheremmo la password hashata
    return { user, success: true, message: 'Login effettuato con successo' };
  },
  
  // Salva le preferenze dei cookie (solo per utenti loggati)
  saveCookiePreferences: (userId: string, preferences: any): void => {
    if (!userId) return;
    
    DB.setItem(`kw8_cookie_preferences_${userId}`, JSON.stringify(preferences));
  },
  
  // Ottieni le preferenze dei cookie (solo per utenti loggati)
  getCookiePreferences: (userId: string): any => {
    if (!userId) return null;
    
    const preferences = DB.getItem(`kw8_cookie_preferences_${userId}`);
    return preferences ? JSON.parse(preferences) : null;
  },

  // Email validation function
  validateEmail: (email: string): boolean => {
    if (!email || email.trim() === '') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Password validation function
  validatePassword: (password: string): boolean => {
    return password && password.trim() !== '' && password.length >= 6;
  },

  // Validate birth date
  validateBirthDate: (birthDate: string): { isValid: boolean, error?: string } => {
    if (!birthDate) {
      return { isValid: false, error: 'Data di nascita obbligatoria' };
    }
    
    const today = new Date();
    const birth = new Date(birthDate);
    
    if (birth > today) {
      return { isValid: false, error: 'La data di nascita non può essere futura' };
    }
    
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      const actualAge = age - 1;
      if (actualAge < 14) {
        return { isValid: false, error: 'Età minima richiesta: 14 anni' };
      }
    } else if (age < 14) {
      return { isValid: false, error: 'Età minima richiesta: 14 anni' };
    }
    
    return { isValid: true };
  },

  // Validate fiscal code
  validateFiscalCode: (fiscalCode: string): { isValid: boolean, error?: string } => {
    if (!fiscalCode) {
      return { isValid: false, error: 'Codice fiscale obbligatorio' };
    }
    
    const cleanCode = fiscalCode.trim().toUpperCase();
    
    if (cleanCode.length !== 16) {
      return { isValid: false, error: 'Il codice fiscale deve essere di 16 caratteri' };
    }
    
    const fiscalCodeRegex = /^[A-Z]{6}[0-9]{2}[A-Z][0-9]{2}[A-Z][0-9]{3}[A-Z]$/;
    if (!fiscalCodeRegex.test(cleanCode)) {
      return { isValid: false, error: 'Formato codice fiscale non valido' };
    }
    
    return { isValid: true };
  },

  // Validate birth place
  validateBirthPlace: (birthPlace: string): { isValid: boolean, error?: string } => {
    if (!birthPlace) {
      return { isValid: false, error: 'Luogo di nascita obbligatorio' };
    }
    
    const cleanPlace = birthPlace.trim();
    
    // Verifica formato: Città (XX) dove XX è la sigla provincia
    const placeRegex = /^[A-Za-zÀ-ÿ\s']+\s*\([A-Z]{2}\)$/;
    if (!placeRegex.test(cleanPlace)) {
      return { isValid: false, error: 'Formato richiesto: Città (XX) - es. Roma (RM)' };
    }
    
    return { isValid: true };
  },

  // Validate address
  validateAddress: (address: string): { isValid: boolean, error?: string } => {
    if (!address) {
      return { isValid: false, error: 'Indirizzo obbligatorio' };
    }
    
    const cleanAddress = address.trim();
    
    // Verifica formato: Città, Via/Piazza Nome Numero, CAP Città (XX)
    const addressRegex = /^[A-Za-zÀ-ÿ\s']+,\s*[A-Za-zÀ-ÿ\s']+\s+\d+[A-Za-z]?,\s*\d{5}\s+[A-Za-zÀ-ÿ\s']+\s*\([A-Z]{2}\)$/;
    if (!addressRegex.test(cleanAddress)) {
      return { isValid: false, error: 'Formato richiesto: Città, Via Nome 123, 00100 Città (XX)' };
    }
    
    return { isValid: true };
  },

  // Validate required fields for registration
  validateRegistrationFields: (formData: any): { isValid: boolean, errors: {[key: string]: string} } => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.email || !DB.validateEmail(formData.email)) {
      errors.email = 'Email obbligatoria e valida';
    }
    
    if (!formData.password || !DB.validatePassword(formData.password)) {
      errors.password = 'Password obbligatoria (minimo 6 caratteri)';
    }
    
    if (!formData.firstName || formData.firstName.trim() === '') {
      errors.firstName = 'Nome obbligatorio';
    }
    
    if (!formData.lastName || formData.lastName.trim() === '') {
      errors.lastName = 'Cognome obbligatorio';
    }
    
    // Validazione data di nascita
    const birthDateValidation = DB.validateBirthDate(formData.birthDate);
    if (!birthDateValidation.isValid) {
      errors.birthDate = birthDateValidation.error!;
    }
    
    if (!formData.gender) {
      errors.gender = 'Sesso obbligatorio';
    }
    
    // Validazione codice fiscale
    const fiscalCodeValidation = DB.validateFiscalCode(formData.fiscalCode);
    if (!fiscalCodeValidation.isValid) {
      errors.fiscalCode = fiscalCodeValidation.error!;
    }
    
    // Validazione luogo di nascita
    const birthPlaceValidation = DB.validateBirthPlace(formData.birthPlace);
    if (!birthPlaceValidation.isValid) {
      errors.birthPlace = birthPlaceValidation.error!;
    }
    
    // Validazione indirizzo
    const addressValidation = DB.validateAddress(formData.address);
    if (!addressValidation.isValid) {
      errors.address = addressValidation.error!;
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Le password non coincidono';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  // Password recovery function
  requestPasswordReset: (email: string): boolean => {
    const users = DB.getUsers();
    const user = users.find(u => u.email === email);
    if (user) {
      // In a real app, this would send an email
      // Password reset requested
      return true;
    }
    return false;
  },

  // IP-based session management
  getCurrentIP: (): string => {
    // Simula un IP basato su caratteristiche del browser
    const userAgent = navigator.userAgent;
    const language = navigator.language;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fingerprint = btoa(userAgent + language + timezone).substring(0, 15);
    return fingerprint;
  },

  setUserIP: (ip: string): void => {
    DB.setItem('userIP', ip);
    DB.setItem('sessionTimestamp', Date.now().toString());
  },

  checkIPSession: (): boolean => {
    const storedIP = DB.getItem('userIP');
    const currentIP = DB.getCurrentIP();
    const sessionTimestamp = DB.getItem('sessionTimestamp');
    
    // Verifica se l'IP è cambiato o se la sessione è scaduta (24 ore)
    if (!storedIP || !sessionTimestamp) return false;
    
    const now = Date.now();
    const sessionAge = now - parseInt(sessionTimestamp);
    const maxSessionAge = 24 * 60 * 60 * 1000; // 24 ore
    
    return storedIP === currentIP && sessionAge < maxSessionAge;
  },

  clearSessionOnIPChange: (): void => {
    if (!DB.checkIPSession()) {
      DB.removeItem('currentUser');
      DB.removeItem('userIP');
      DB.removeItem('sessionTimestamp');
      DB.removeItem('autoLogin');
    }
  },

  // Auto-login functions
  setAutoLogin: (email: string, password: string): void => {
    const currentIP = DB.getCurrentIP();
    const loginData = {
      email,
      password,
      ip: currentIP,
      timestamp: Date.now()
    };
    DB.setItem('autoLogin', JSON.stringify(loginData));
    DB.setUserIP(currentIP);
  },

  getAutoLogin: (): { email: string, password: string } | null => {
    const autoLoginData = DB.getItem('autoLogin');
    if (!autoLoginData) return null;
    
    try {
      const data = JSON.parse(autoLoginData);
      const currentIP = DB.getCurrentIP();
      
      // Verifica se l'IP è cambiato
      if (data.ip !== currentIP) {
        DB.clearAutoLogin();
        return null;
      }
      
      // Verifica se la sessione è scaduta (7 giorni per auto-login)
      const now = Date.now();
      const sessionAge = now - data.timestamp;
      const maxAutoLoginAge = 7 * 24 * 60 * 60 * 1000; // 7 giorni
      
      if (sessionAge > maxAutoLoginAge) {
        DB.clearAutoLogin();
        return null;
      }
      
      return { email: data.email, password: data.password };
    } catch {
      return null;
    }
  },

  clearAutoLogin: (): void => {
    DB.removeItem('autoLogin');
    DB.removeItem('userIP');
    DB.removeItem('sessionTimestamp');
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
    const users = DB.getUsers();
    const plans = DB.getWorkoutPlans();
    console.log('💾 Database Statistics:', {
      users: users.length,
      workoutPlans: plans.length
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