// Servizio Firebase per l'applicazione
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { collection as fsCollection, doc as fsDoc, getDocs as fsGetDocs, getDoc as fsGetDoc, addDoc as fsAddDoc, updateDoc as fsUpdateDoc, deleteDoc as fsDeleteDoc, setDoc as fsSetDoc, query as fsQuery, where as fsWhere, orderBy as fsOrderBy, limit as fsLimit, startAfter as fsStartAfter, writeBatch as fsWriteBatch, serverTimestamp as fsServerTimestamp, onSnapshot as fsOnSnapshot } from 'firebase/firestore';

// Disabilita Firebase per lo sviluppo locale per evitare errori di connessione
const DISABLE_FIREBASE = false; // Abilitato per usare Firebase Auth in login

// Configurazione Firebase dalle variabili d'ambiente
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Configurazione di fallback per lo sviluppo
const fallbackConfig = {
  apiKey: "demo-api-key",
  authDomain: "palestra-kw8.firebaseapp.com",
  projectId: "palestra-kw8",
  storageBucket: "palestra-kw8.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Mock per le collezioni Firestore
const createMockCollection = () => ({
  doc: (id?: string) => ({
    id: id || 'mock-doc-id',
    get: () => Promise.resolve({ 
      exists: false, 
      data: () => ({}),
      id: id || 'mock-doc-id'
    }),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve()
  }),
  add: () => Promise.resolve({ id: 'mock-id' }),
  get: () => Promise.resolve({ docs: [], empty: true }),
  where: () => createMockCollection(),
  orderBy: () => createMockCollection(),
  limit: () => createMockCollection(),
  startAfter: () => createMockCollection()
});

// Mock completo per Firestore
const createMockFirestore = () => ({
  collection: (path: string) => createMockCollection(),
  doc: (path: string) => ({
    id: 'mock-doc-id',
    get: () => Promise.resolve({ 
      exists: false, 
      data: () => ({}),
      id: 'mock-doc-id'
    }),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve()
  }),
  // Aggiungi altri metodi necessari
  batch: () => ({
    set: () => {},
    update: () => {},
    delete: () => {},
    commit: () => Promise.resolve()
  })
});

const mockAuth = {
  currentUser: null,
  onAuthStateChanged: () => () => {},
  signInAnonymously: () => Promise.resolve({ user: { uid: 'mock-user' } })
} as any;

let app: any;
let db: any;
let auth: any;

if (DISABLE_FIREBASE) {
  console.log('🔧 Firebase disabled for local development');
  db = createMockFirestore();
  auth = mockAuth;
} else {
  // Usa la configurazione di fallback se le variabili d'ambiente non sono disponibili o non valide
  const hasValidConfig = firebaseConfig.projectId && 
                        firebaseConfig.apiKey && 
                        !firebaseConfig.apiKey.includes('XXXXX') &&
                        firebaseConfig.apiKey !== 'AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
  
  const config = hasValidConfig ? firebaseConfig : fallbackConfig;
  
  if (!hasValidConfig) {
    console.log('⚠️ Using fallback Firebase config - API key not valid or missing');
  }
  
  // Inizializza Firebase
  app = initializeApp(config);
  
  // Inizializza Firestore
  db = getFirestore(app);
  
  // Inizializza Auth
  auth = getAuth(app);
}

// Mock delle funzioni Firebase per quando è disabilitato
export const collection = DISABLE_FIREBASE 
  ? (db: any, path: string) => createMockCollection()
  : fsCollection;

export const doc = DISABLE_FIREBASE
  ? (db: any, path: string, id?: string) => ({
      id: id || 'mock-doc-id',
      get: () => Promise.resolve({ 
        exists: false, 
        data: () => ({}),
        id: id || 'mock-doc-id'
      }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      delete: () => Promise.resolve()
    })
  : fsDoc;

export const getDocs = DISABLE_FIREBASE
  ? (collection: any) => Promise.resolve({ docs: [], empty: true })
  : fsGetDocs;

export const getDoc = DISABLE_FIREBASE
  ? (docRef: any) => Promise.resolve({ 
      exists: false, 
      data: () => ({}),
      id: 'mock-doc-id'
    })
  : fsGetDoc;

export const addDoc = DISABLE_FIREBASE
  ? (collection: any, data: any) => Promise.resolve({ id: 'mock-doc-id' })
  : fsAddDoc;

export const updateDoc = DISABLE_FIREBASE
  ? (docRef: any, data: any) => Promise.resolve()
  : fsUpdateDoc;

export const deleteDoc = DISABLE_FIREBASE
  ? (docRef: any) => Promise.resolve()
  : fsDeleteDoc;

export const setDoc = DISABLE_FIREBASE
  ? (docRef: any, data: any) => Promise.resolve()
  : fsSetDoc;

export const query = DISABLE_FIREBASE
  ? (...args: any[]) => ({ get: () => Promise.resolve({ docs: [], empty: true }) })
  : fsQuery;

export const where = DISABLE_FIREBASE
  ? (...args: any[]) => ({})
  : fsWhere;

export const orderBy = DISABLE_FIREBASE
  ? (...args: any[]) => ({})
  : fsOrderBy;

export const limit = DISABLE_FIREBASE
  ? (limitCount: number) => ({})
  : fsLimit;

export const startAfter = DISABLE_FIREBASE
  ? (snapshot: any) => ({})
  : fsStartAfter;

export const writeBatch = DISABLE_FIREBASE
  ? (db: any) => ({
      set: () => {},
      update: () => {},
      delete: () => {},
      commit: () => Promise.resolve()
    })
  : fsWriteBatch;

export const serverTimestamp = DISABLE_FIREBASE
  ? () => new Date().toISOString()
  : fsServerTimestamp;

export const onSnapshot = DISABLE_FIREBASE
  ? (query: any, callback: any) => () => {}
  : fsOnSnapshot;

export { db, auth };

// Nota: L'emulatore Firestore richiede Java. Per ora usiamo il servizio cloud.
// L'autenticazione anonima è gestita automaticamente dal firestoreService.
// Se vuoi usare l'emulatore locale, installa Java e decomenta il codice seguente:
/*
if (import.meta.env.DEV) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firestore emulator on localhost:8080');
  } catch (error) {
    console.log('⚠️ Firestore emulator connection failed, using cloud Firestore:', error);
  }
}
*/

console.log('🔥 Using Firebase Firestore cloud service for data persistence');

export default app;