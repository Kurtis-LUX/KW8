// Configurazione Firebase per il frontend
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

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

// Usa la configurazione di fallback se le variabili d'ambiente non sono disponibili
const config = firebaseConfig.projectId ? firebaseConfig : fallbackConfig;

// Inizializza Firebase
const app = initializeApp(config);

// Inizializza Firestore
export const db = getFirestore(app);

// Inizializza Auth
export const auth = getAuth(app);

// Nota: L'emulatore Firestore richiede Java. Per ora usiamo il servizio cloud.
// Se vuoi usare l'emulatore locale, installa Java e decomenta il codice seguente:
/*
if (import.meta.env.DEV) {
  try {
    connectFirestoreEmulator(db, 'localhost', 8080);
    console.log('🔧 Connected to Firestore emulator on localhost:8080');
  } catch (error) {
    console.log('⚠️ Firestore emulator connection failed:', error);
  }
}
*/

console.log('🔥 Using Firebase Firestore cloud service for data persistence');

export default app;