import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { OAuth2Client } from "google-auth-library";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";
import * as admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";

// Load environment variables
dotenv.config();

// Try to get config from Firebase Functions v1 config (legacy)
let firebaseConfig: any = {};
try {
  const { config } = require('firebase-functions');
  firebaseConfig = config();
} catch (error) {
  logger.warn('Could not load Firebase Functions config, using environment variables only');
}

// Get configuration with fallback to environment variables
const GOOGLE_CLIENT_ID = firebaseConfig.google?.client_id || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = firebaseConfig.google?.client_secret || process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = firebaseConfig.jwt?.secret || process.env.JWT_SECRET;

if (!GOOGLE_CLIENT_ID) {
  logger.error("Configurazione Google OAuth mancante. Verifica le variabili d'ambiente su Firebase.");
  logger.error("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
  logger.error("Firebase config:", JSON.stringify(firebaseConfig, null, 2));
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Origini consentite (incluso 5173 e 5174 per sviluppo)
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://palestra-kw8.web.app"
];

export const apiAuthGoogleSignup = onRequest({ cors: false, invoker: "public" }, async (req, res) => {
  // Imposta header CORS immediatamente per tutte le richieste
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.set("Access-Control-Max-Age", "86400");
  }

  // Gestione preflight esplicita
  if (req.method === "OPTIONS") {
    logger.info("Handling CORS preflight for google-signup");
    res.status(200).end();
    return;
  }

  logger.info("Google Signup request received", {
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers["user-agent"],
  });

  if (req.method !== "POST") {
    logger.warn(`Method ${req.method} not allowed`);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { token, credential } = req.body;
    const idToken = token || credential;

    if (!idToken) {
      logger.warn("No token provided");
      res.status(400).json({ error: "Missing Google ID token" });
      return;
    }

    // Verify the Google ID token
    logger.info("Verifying Google ID token (signup)");
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      logger.error("Invalid token payload");
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    const { email, name, picture, email_verified } = payload;
    logger.info("Token verified successfully (signup)", { email, name, email_verified });

    if (!email || !email_verified) {
      res.status(403).json({ error: "Email non verificata" });
      return;
    }

    // Provisioning utente su Firebase Authentication (create se non esiste)
    let userRecord: admin.auth.UserRecord | null = null;
    try {
      try {
        userRecord = await admin.auth().getUserByEmail(email);
        logger.info("Utente già presente in Firebase Auth", { uid: userRecord.uid, email });
      } catch (err: any) {
        if (err?.code === "auth/user-not-found") {
          userRecord = await admin.auth().createUser({
            email,
            displayName: name || email,
            photoURL: picture,
            emailVerified: !!email_verified,
            disabled: false,
          });
          logger.info("Utente creato in Firebase Auth", { uid: userRecord.uid, email });
        } else {
          logger.error("Errore ottenendo utente Firebase Auth", err);
          res.status(500).json({ error: "Errore Firebase Authentication" });
          return;
        }
      }

      // Salva l'utente nel database Firestore
      const db = getFirestore();
      const now = new Date().toISOString();
      
      // Controlla se l'utente esiste già nel database Firestore
      const userDocRef = db.collection('users').doc(userRecord.uid);
      const userDoc = await userDocRef.get();
      
      if (!userDoc.exists) {
        // Crea nuovo utente nel database Firestore
        await userDocRef.set({
          name: name || email,
          email,
          phone: '',
          birthDate: '',
          address: '',
          certificatoMedicoStato: 'non_presente',
          dataCertificato: '',
          emergencyContactName: '',
          emergencyContactPhone: '',
          emergencyContactRelationship: '',
          notes: '',
          role: 'athlete',
          createdAt: now,
          updatedAt: now
        });
        logger.info("Utente salvato nel database Firestore", { uid: userRecord.uid, email });
      } else {
        // Aggiorna la data di ultimo accesso
        await userDocRef.update({
          updatedAt: now
        });
        logger.info("Data ultimo accesso aggiornata per utente esistente", { uid: userRecord.uid, email });
      }

    } catch (e) {
      logger.error("Errore creazione/verifica utente Firebase Auth", e);
      res.status(500).json({ error: "Errore nel provisioning utente" });
      return;
    }

    // Generate JWT session token
    const sessionToken = jwt.sign(
      {
        email,
        name,
        picture,
        role: 'athlete',
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET!,
      { expiresIn: "7d" }
    );

    logger.info("JWT session token generated (signup)", { email });

    // Set secure cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: true, // Sempre true per HTTPS e SameSite=None
      sameSite: "none", // Necessario per cross-origin
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: isProduction ? ".palestra-kw8.web.app" : undefined,
    });

    logger.info("Session cookie set successfully (signup)", { email, isProduction });

    // Risposta con ruolo atleta
    res.status(200).json({
      success: true,
      data: {
        token: sessionToken,
        user: {
          email,
          name,
          picture,
          role: 'athlete'
        },
      },
      message: 'Registrazione con Google completata'
    });
  } catch (error) {
    logger.error("Google Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Inizializza Firebase Admin SDK una sola volta
if (!admin.apps.length) {
  admin.initializeApp();
}