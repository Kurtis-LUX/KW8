import { setGlobalOptions } from "firebase-functions/v2";

// Importa le funzioni API
import { googleSignin } from "./api/auth/google-signin-simple";

// Imposta opzioni globali
setGlobalOptions({ maxInstances: 10 });

// Esporta le funzioni
export { googleSignin };

// Funzione di test
export const hello = require('firebase-functions').https.onRequest((request: any, response: any) => {
  response.json({ message: "Hello from Firebase!" });
});
