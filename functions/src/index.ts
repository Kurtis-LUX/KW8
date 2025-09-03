import { setGlobalOptions } from "firebase-functions/v2";

// Load environment variables
require('dotenv').config();

// Importa le funzioni API
import { apiAuthGoogleSignin } from "./api/auth/google-signin";

// Imposta opzioni globali per Functions Gen2
setGlobalOptions({ 
  maxInstances: 10,
  region: 'europe-west1' // Regione europea per GDPR compliance
});

// Esporta le funzioni
export { apiAuthGoogleSignin };

// Funzione di test
export const hello = require('firebase-functions').https.onRequest((request: any, response: any) => {
  response.json({ message: "Hello from Firebase Functions Gen2!" });
});
