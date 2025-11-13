// Servizio Firestore per gestire tutti i dati dell'applicazione
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  writeBatch,
  serverTimestamp,
  onSnapshot,
  Unsubscribe
} from '../config/firebase';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import type {
  WorkoutPlan,
  WorkoutFolder,
  Exercise,
  WorkoutVariant
} from '../utils/database';

// Interfacce per i dati Firestore
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  birthDate?: string;
  address?: string;
  certificatoMedicoStato: 'valido' | 'scaduto' | 'non_presente';
  dataCertificato?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  notes?: string;
  role: 'admin' | 'coach' | 'athlete';
  createdAt: string;
  updatedAt: string;
}

export interface Ranking {
  id: string;
  name: string;
  description?: string;
  muscleGroup: string;
  exercise: string;
  entries: RankingEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface RankingEntry {
  userId: string;
  userName: string;
  value: number;
  unit: string;
  date: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  category: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MembershipCard {
  id: string;
  userId: string;
  userName: string;
  month: string; // formato YYYY-MM
  year: number;
  status: 'active' | 'expired' | 'pending';
  paymentDate?: string;
  expiryDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface GymArea {
  id: string;
  title: string;
  icon: string;
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

export interface GymSchedule {
  id: string;
  lunedi: { open: string; close: string; isOpen: boolean };
  martedi: { open: string; close: string; isOpen: boolean };
  mercoledi: { open: string; close: string; isOpen: boolean };
  giovedi: { open: string; close: string; isOpen: boolean };
  venerdi: { open: string; close: string; isOpen: boolean };
  sabato: { open: string; close: string; isOpen: boolean };
  domenica: { open: string; close: string; isOpen: boolean };
  createdAt: string;
  updatedAt: string;
}

// Classe principale del servizio Firestore
class FirestoreService {
  // Collezioni Firestore
  private readonly collections = {
    users: 'users',
    workoutPlans: 'workoutPlans',
    workoutFolders: 'workoutFolders',
    rankings: 'rankings',
    links: 'links',
    membershipCards: 'membershipCards',
    schedule: 'gymSchedule',
    gymAreas: 'gymAreas'
  };

  private authPromise: Promise<void> | null = null;

  // Helper per importare dinamicamente isFirestoreEnabled
  private async isFirestoreEnabled(): Promise<boolean> {
    const { isFirestoreEnabled } = await import('../utils/database');
    return isFirestoreEnabled();
  }

  // Inizializza l'autenticazione Firebase se necessario
  private async ensureAuth(): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Firestore disabled: skipping authentication');
      return Promise.resolve();
    }

    if (this.authPromise) {
      return this.authPromise;
    }

    this.authPromise = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
          if (!user) {
            // Autentica anonimamente per soddisfare le regole di sicurezza
            await signInAnonymously(auth);
            console.log('✅ Firebase Auth: Authenticated anonymously');
          } else {
            console.log('✅ Firebase Auth: User already authenticated:', user.uid);
          }
          unsubscribe();
          resolve();
        } catch (error) {
          console.error('❌ Firebase Auth: Authentication failed:', error);
          
          // Se l'errore è dovuto a API key non valida, disabilita Firestore
          if (error.code === 'auth/api-key-not-valid') {
            console.warn('⚠️ Firebase API key not valid, disabling Firestore');
            // Importa dinamicamente la funzione per evitare dipendenze circolari
            const { disableFirestoreOnError } = await import('../utils/database');
            disableFirestoreOnError(error);
            // Dopo aver disabilitato Firestore, risolvi invece di rigettare
            unsubscribe();
            resolve();
            return;
          }
          
          unsubscribe();
          reject(error);
        }
      });
    });

    return this.authPromise;
  }

  // ==================== UTENTI ====================
  
  async getUsers(): Promise<User[]> {
    try {
      const q = query(
        collection(db, this.collections.users),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const docRef = doc(db, this.collections.users, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const q = query(collection(db, this.collections.users), where('email', '==', email), limit(1));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        return { id: d.id, ...d.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user by email:', error);
      return null;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, this.collections.users), {
        ...userData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: string, userData: Partial<User>): Promise<void> {
    try {
      const docRef = doc(db, this.collections.users, id);
      await updateDoc(docRef, {
        ...userData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collections.users, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // ==================== PIANI DI ALLENAMENTO ====================
  
  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Firestore disabled: getWorkoutPlans skipped');
      return [];
    }
    
    try {
      await this.ensureAuth();
      const q = query(
        collection(db, this.collections.workoutPlans),
        orderBy('order')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WorkoutPlan[];
    } catch (error) {
      console.error('Error fetching workout plans:', error);
      return [];
    }
  }

  async getWorkoutPlanById(id: string): Promise<WorkoutPlan | null> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Firestore disabled: getWorkoutPlanById skipped');
      return null;
    }
    
    try {
      await this.ensureAuth();
      const docRef = doc(db, this.collections.workoutPlans, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as WorkoutPlan;
      }
      return null;
    } catch (error) {
      console.error('Error fetching workout plan:', error);
      return null;
    }
  }

  async createWorkoutPlan(planData: Omit<WorkoutPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Firestore disabled: createWorkoutPlan skipped');
      throw new Error('Firestore is disabled');
    }
    
    try {
      await this.ensureAuth();
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, this.collections.workoutPlans), {
        ...planData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating workout plan:', error);
      throw error;
    }
  }

  async updateWorkoutPlan(id: string, planData: Partial<WorkoutPlan>): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Firestore disabled: updateWorkoutPlan skipped');
      return;
    }
    
    try {
      await this.ensureAuth();
      const docRef = doc(db, this.collections.workoutPlans, id);
      await updateDoc(docRef, {
        ...planData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating workout plan:', error);
      throw error;
    }
  }

  async deleteWorkoutPlan(id: string): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Firestore disabled: deleteWorkoutPlan skipped');
      return;
    }
    
    try {
      await this.ensureAuth();
      const docRef = doc(db, this.collections.workoutPlans, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      throw error;
    }
  }

  // ==================== CARTELLE WORKOUT ====================
  
  async getWorkoutFolders(): Promise<WorkoutFolder[]> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Firestore disabled: getWorkoutFolders skipped');
      return [];
    }
    
    try {
      await this.ensureAuth();
      const q = query(
        collection(db, this.collections.workoutFolders),
        orderBy('order')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WorkoutFolder[];
    } catch (error) {
      console.error('Error fetching workout folders:', error);
      return [];
    }
  }

  async getWorkoutFolderById(id: string): Promise<WorkoutFolder | null> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Firestore disabled: getWorkoutFolderById skipped');
      return null;
    }
    
    try {
      await this.ensureAuth();
      const docRef = doc(db, this.collections.workoutFolders, id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as WorkoutFolder;
      }
      return null;
    } catch (error) {
      console.error('Error getting workout folder by id:', error);
      throw error;
    }
  }

  async createWorkoutFolder(folderData: Omit<WorkoutFolder, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Firestore disabled: createWorkoutFolder skipped');
      throw new Error('Firestore is disabled');
    }
    
    try {
      await this.ensureAuth();
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, this.collections.workoutFolders), {
        ...folderData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating workout folder:', error);
      throw error;
    }
  }

  async updateWorkoutFolder(id: string, folderData: Partial<WorkoutFolder>): Promise<void> {
    try {
      await this.ensureAuth();
      const docRef = doc(db, this.collections.workoutFolders, id);
      await updateDoc(docRef, {
        ...folderData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating workout folder:', error);
      throw error;
    }
  }

  async deleteWorkoutFolder(id: string): Promise<void> {
    try {
      await this.ensureAuth();
      const docRef = doc(db, this.collections.workoutFolders, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting workout folder:', error);
      throw error;
    }
  }

  // ==================== CLASSIFICHE ====================
  
  async getRankings(): Promise<Ranking[]> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Rankings: Using mock data (Firebase disabled)');
      return [];
    }
    
    try {
      await this.ensureAuth();
      const q = query(
        collection(db, this.collections.rankings),
        orderBy('name')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Ranking[];
    } catch (error) {
      console.error('Error fetching rankings:', error);
      return [];
    }
  }

  async createRanking(rankingData: Omit<Ranking, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Rankings: Mock create (Firebase disabled)');
      return 'mock-ranking-id';
    }
    
    try {
      await this.ensureAuth();
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, this.collections.rankings), {
        ...rankingData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating ranking:', error);
      throw error;
    }
  }

  async updateRanking(id: string, rankingData: Partial<Ranking>): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Rankings: Mock update (Firebase disabled)');
      return;
    }
    
    try {
      await this.ensureAuth();
      const docRef = doc(db, this.collections.rankings, id);
      await updateDoc(docRef, {
        ...rankingData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating ranking:', error);
      throw error;
    }
  }

  async deleteRanking(id: string): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🔧 Rankings: Mock delete (Firebase disabled)');
      return;
    }
    
    try {
      await this.ensureAuth();
      const docRef = doc(db, this.collections.rankings, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting ranking:', error);
      throw error;
    }
  }

  // ==================== LINK ====================
  
  async getLinks(): Promise<Link[]> {
    try {
      const q = query(
        collection(db, this.collections.links),
        orderBy('order')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Link[];
    } catch (error) {
      console.error('Error fetching links:', error);
      return [];
    }
  }

  async createLink(linkData: Omit<Link, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, this.collections.links), {
        ...linkData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating link:', error);
      throw error;
    }
  }

  async updateLink(id: string, linkData: Partial<Link>): Promise<void> {
    try {
      const docRef = doc(db, this.collections.links, id);
      await updateDoc(docRef, {
        ...linkData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating link:', error);
      throw error;
    }
  }

  async deleteLink(id: string): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      return;
    }
    
    try {
      const docRef = doc(db, this.collections.links, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting link:', error);
      throw error;
    }
  }

  // ==================== TESSERINI ====================
  
  async getMembershipCards(): Promise<MembershipCard[]> {
    if (!(await this.isFirestoreEnabled())) {
      return [];
    }
    
    try {
      const q = query(
        collection(db, this.collections.membershipCards),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MembershipCard[];
    } catch (error) {
      console.error('Error fetching membership cards:', error);
      return [];
    }
  }

  async getMembershipCardsByUser(userId: string): Promise<MembershipCard[]> {
    if (!(await this.isFirestoreEnabled())) {
      return [];
    }
    
    try {
      const q = query(
        collection(db, this.collections.membershipCards),
        where('userId', '==', userId),
        orderBy('year', 'desc'),
        orderBy('month', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MembershipCard[];
    } catch (error) {
      console.error('Error fetching user membership cards:', error);
      return [];
    }
  }

  async createMembershipCard(cardData: Omit<MembershipCard, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!(await this.isFirestoreEnabled())) {
      return 'mock-card-id';
    }
    
    try {
      const now = new Date().toISOString();
      const docRef = await addDoc(collection(db, this.collections.membershipCards), {
        ...cardData,
        createdAt: now,
        updatedAt: now
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating membership card:', error);
      throw error;
    }
  }

  async updateMembershipCard(id: string, cardData: Partial<MembershipCard>): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      return;
    }
    
    try {
      const docRef = doc(db, this.collections.membershipCards, id);
      await updateDoc(docRef, {
        ...cardData,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating membership card:', error);
      throw error;
    }
  }

  async deleteMembershipCard(id: string): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      return;
    }
    
    try {
      const docRef = doc(db, this.collections.membershipCards, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting membership card:', error);
      throw error;
    }
  }

  // ==================== OPERAZIONI BATCH ====================
  
  async batchCreateUsers(users: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      return;
    }
    
    try {
      const batch = writeBatch(db);
      const now = new Date().toISOString();
      
      users.forEach(userData => {
        const docRef = doc(collection(db, this.collections.users));
        batch.set(docRef, {
          ...userData,
          createdAt: now,
          updatedAt: now
        });
      });
      
      await batch.commit();
    } catch (error) {
      console.error('Error batch creating users:', error);
      throw error;
    }
  }

  // ==================== LISTENER IN TEMPO REALE ====================
  
  async subscribeToUsers(callback: (users: User[]) => void): Promise<Unsubscribe> {
    if (!(await this.isFirestoreEnabled())) {
      callback([]);
      return () => {}; // Mock unsubscribe function
    }
    
    const q = query(
      collection(db, this.collections.users),
      orderBy('name')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const users = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      callback(users);
    });
  }

  async subscribeToWorkoutPlans(callback: (plans: WorkoutPlan[]) => void): Promise<Unsubscribe> {
    if (!(await this.isFirestoreEnabled())) {
      callback([]);
      return () => {}; // Mock unsubscribe function
    }
    
    const q = query(
      collection(db, this.collections.workoutPlans),
      orderBy('order')
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const plans = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WorkoutPlan[];
      callback(plans);
    });
  }

  // ==================== MIGRAZIONE DATI ====================
  
  async migrateFromLocalStorage(): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      console.log('🚫 Migration skipped: Firestore is disabled');
      return;
    }
    
    try {
      console.log('🔄 Starting data migration from localStorage to Firestore...');
      
      // Migra piani di allenamento
      const localPlans = localStorage.getItem('kw8_workoutPlans');
      if (localPlans) {
        const plans = JSON.parse(localPlans) as WorkoutPlan[];
        for (const plan of plans) {
          const { id, ...planData } = plan;
          await this.createWorkoutPlan(planData);
        }
        console.log(`✅ Migrated ${plans.length} workout plans`);
      }
      
      // Migra cartelle
      const localFolders = localStorage.getItem('kw8_workoutFolders');
      if (localFolders) {
        const folders = JSON.parse(localFolders) as WorkoutFolder[];
        for (const folder of folders) {
          const { id, ...folderData } = folder;
          await this.createWorkoutFolder(folderData);
        }
        console.log(`✅ Migrated ${folders.length} workout folders`);
      }
      
      console.log('✅ Data migration completed successfully!');
    } catch (error) {
      console.error('❌ Error during data migration:', error);
      throw error;
    }
  }

  // Metodi per gestire gli orari della palestra
  async getGymSchedule(): Promise<GymSchedule | null> {
    if (!(await this.isFirestoreEnabled())) {
      return null;
    }
    
    try {
      const scheduleCollection = collection(db, this.collections.schedule);
      const snapshot = await getDocs(scheduleCollection);
      
      if (snapshot.empty) {
        return null;
      }
      
      // Prende il primo documento (dovrebbe esserci solo un documento per gli orari)
      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data()
      } as GymSchedule;
    } catch (error) {
      console.error('Errore nel recupero degli orari:', error);
      throw error;
    }
  }

  async createOrUpdateGymSchedule(scheduleData: Omit<GymSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    if (!(await this.isFirestoreEnabled())) {
      return 'mock-schedule-id';
    }
    
    try {
      const scheduleCollection = collection(db, this.collections.schedule);
      const snapshot = await getDocs(scheduleCollection);
      
      const timestamp = new Date().toISOString();
      
      if (snapshot.empty) {
        // Crea nuovo documento se non esiste
        const docRef = await addDoc(scheduleCollection, {
          ...scheduleData,
          createdAt: timestamp,
          updatedAt: timestamp
        });
        return docRef.id;
      } else {
        // Aggiorna il documento esistente
        const existingDoc = snapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          ...scheduleData,
          updatedAt: timestamp
        });
        return existingDoc.id;
      }
    } catch (error) {
      console.error('Errore nel salvataggio degli orari:', error);
      throw error;
    }
  }

  async subscribeToGymSchedule(callback: (schedule: GymSchedule | null) => void): Promise<Unsubscribe> {
    if (!(await this.isFirestoreEnabled())) {
      callback(null);
      return () => {}; // Mock unsubscribe function
    }
    
    const scheduleCollection = collection(db, this.collections.schedule);
    
    return onSnapshot(scheduleCollection, (snapshot) => {
      try {
        if (snapshot.empty) {
          callback(null);
          return;
        }
        
        const doc = snapshot.docs[0];
        const schedule = {
          id: doc.id,
          ...doc.data()
        } as GymSchedule;
        
        callback(schedule);
      } catch (error) {
        console.error('Errore nella sottoscrizione agli orari:', error);
        callback(null);
      }
    });
  }

  // ==================== METODI GENERICI ====================
  
  async getDocument(collectionName: string, documentId: string): Promise<any | null> {
    if (!(await this.isFirestoreEnabled())) {
      console.log(`🔧 Firestore disabled: getDocument ${collectionName}/${documentId} skipped`);
      return null;
    }
    
    try {
      await this.ensureAuth();
      const docRef = doc(db, collectionName, documentId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        console.log(`📄 Document not found: ${collectionName}/${documentId}`);
        return null;
      }
    } catch (error) {
      console.error(`❌ Error getting document ${collectionName}/${documentId}:`, error);
      throw error;
    }
  }

  async setDocument(collectionName: string, documentId: string, data: any): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      console.log(`🔧 Firestore disabled: setDocument ${collectionName}/${documentId} skipped`);
      return;
    }
    
    try {
      await this.ensureAuth();
      const docRef = doc(db, collectionName, documentId);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString()
      });
      console.log(`✅ Document saved: ${collectionName}/${documentId}`);
    } catch (error) {
      // Se il documento non esiste, crealo
       if (error.code === 'not-found') {
          try {
            const docRef = doc(db, collectionName, documentId);
            await setDoc(docRef, {
              ...data,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            console.log(`✅ Document created: ${collectionName}/${documentId}`);
          } catch (createError) {
            console.error(`❌ Error creating document ${collectionName}/${documentId}:`, createError);
            throw createError;
          }
      } else {
        console.error(`❌ Error saving document ${collectionName}/${documentId}:`, error);
        throw error;
      }
    }
  }

  async subscribeToDocument(collectionName: string, documentId: string, callback: (data: any) => void): Promise<Unsubscribe> {
    if (!(await this.isFirestoreEnabled())) {
      callback(null);
      return () => {};
    }
    
    try {
      await this.ensureAuth();
      const docRef = doc(db, collectionName, documentId);
      
      return onSnapshot(docRef, (docSnap) => {
        try {
          if (docSnap.exists()) {
            callback({
              id: docSnap.id,
              ...docSnap.data()
            });
          } else {
            callback(null);
          }
        } catch (error) {
          console.error(`Error in document subscription ${collectionName}/${documentId}:`, error);
          callback(null);
        }
      });
    } catch (error) {
      console.error(`Error setting up document subscription ${collectionName}/${documentId}:`, error);
      callback(null);
      return () => {};
    }
  }

  // ==================== AREE PALESTRA ====================
  
  async getGymAreas(): Promise<GymArea[]> {
    if (!(await this.isFirestoreEnabled())) {
      return [];
    }
    
    try {
      await this.ensureAuth();
      const q = query(
        collection(db, this.collections.gymAreas),
        orderBy('createdAt')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GymArea[];
    } catch (error) {
      console.error('Error fetching gym areas:', error);
      return [];
    }
  }

  async saveGymAreas(areas: GymArea[]): Promise<void> {
    if (!(await this.isFirestoreEnabled())) {
      return;
    }
    
    try {
      await this.ensureAuth();
      const batch = writeBatch(db);
      
      // Prima elimina tutte le aree esistenti
      const existingAreas = await this.getGymAreas();
      existingAreas.forEach(area => {
        const docRef = doc(db, this.collections.gymAreas, area.id);
        batch.delete(docRef);
      });
      
      // Poi aggiunge le nuove aree
      areas.forEach(area => {
        const docRef = doc(collection(db, this.collections.gymAreas));
        batch.set(docRef, {
          ...area,
          id: docRef.id,
          updatedAt: new Date().toISOString()
        });
      });
      
      await batch.commit();
      console.log('✅ Gym areas saved to Firestore');
    } catch (error) {
      console.error('❌ Error saving gym areas:', error);
      throw error;
    }
  }

  async subscribeToGymAreas(callback: (areas: GymArea[]) => void): Promise<Unsubscribe> {
    if (!(await this.isFirestoreEnabled())) {
      callback([]);
      return () => {};
    }
    
    try {
      await this.ensureAuth();
      const q = query(
        collection(db, this.collections.gymAreas),
        orderBy('createdAt')
      );
      
      return onSnapshot(q, (snapshot) => {
        try {
          const areas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as GymArea[];
          callback(areas);
        } catch (error) {
          console.error('Error in gym areas subscription:', error);
          callback([]);
        }
      });
    } catch (error) {
      console.error('Error setting up gym areas subscription:', error);
      callback([]);
      return () => {};
    }
  }
}

// Esporta un'istanza singleton del servizio
const firestoreService = new FirestoreService();
export default firestoreService;