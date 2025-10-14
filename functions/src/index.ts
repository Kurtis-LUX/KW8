import { setGlobalOptions } from "firebase-functions/v2";

// Load environment variables
require('dotenv').config();

// Importa le funzioni API
import { apiAuthGoogleSignin } from "./api/auth/google-signin";
import { authVerify } from "./api/auth/verify";
import { apiAuthGoogleSignup } from "./api/auth/google-signup";
import { apiAuthFirebaseExchange } from "./api/auth/firebase-exchange";
import { apiAuthDevCreateUser } from "./api/auth/dev-create-user";

// Imposta opzioni globali per Functions Gen2
setGlobalOptions({ 
  maxInstances: 10,
  region: 'us-central1' // Regione predefinita Firebase
});

// Esporta le funzioni
export { apiAuthGoogleSignin, authVerify, apiAuthGoogleSignup, apiAuthFirebaseExchange, apiAuthDevCreateUser };

// Funzione di test usando v2 API
import { onRequest } from "firebase-functions/v2/https";

export const hello = onRequest((request, response) => {
  response.json({ message: "Hello from Firebase Functions Gen2!" });
});
