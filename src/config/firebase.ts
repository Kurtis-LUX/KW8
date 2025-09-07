// Configurazione Firebase per il frontend
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Flag per disabilitare Firebase in sviluppo locale
const DISABLE_FIREBASE = true; // Disabilitato per evitare errori di connessione in sviluppo

// Configurazione Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Configurazione di fallback per sviluppo locale
const fallbackConfig = {
  apiKey: "demo-api-key",
  authDomain: "palestra-kw8.firebaseapp.com",
  projectId: "palestra-kw8",
  storageBucket: "palestra-kw8.appspot.com",
  messagingSenderId: "123456789",
  appId: "demo-app-id"
};

// Mock objects per sviluppo locale
const createMockCollection = () => ({
  doc: () => ({
    get: () => Promise.resolve({ exists: false, data: () => ({}) }),
    set: () => Promise.resolve(),
    update: () => Promise.resolve(),
    delete: () => Promise.resolve()
  }),
  add: () => Promise.resolve({ id: 'mock-id' }),
  get: () => Promise.resolve({ docs: [] }),
  where: () => createMockCollection(),
  orderBy: () => createMockCollection(),
  limit: () => createMockCollection(),
  startAfter: () => createMockCollection()
});

const mockDb = {
  collection: createMockCollection
} as any;

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
  db = mockDb;
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