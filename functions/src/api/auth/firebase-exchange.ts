import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

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
const JWT_SECRET = firebaseConfig.jwt?.secret || process.env.JWT_SECRET;
const AUTHORIZED_EMAILS = firebaseConfig.authorized?.email || process.env.AUTHORIZED_EMAIL;

if (!JWT_SECRET) {
  logger.error("JWT Secret mancante. Verifica le variabili d'ambiente su Firebase.");
  logger.error("JWT_SECRET:", JWT_SECRET);
  logger.error("Firebase config:", JSON.stringify(firebaseConfig, null, 2));
}

// Origini consentite
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://palestra-kw8.web.app"
];

export const apiAuthFirebaseExchange = onRequest({ cors: false }, async (req, res) => {
  // Imposta header CORS immediatamente per tutte le richieste
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  // Gestione preflight esplicita
  if (req.method === "OPTIONS") {
    logger.info("Handling CORS preflight for firebase-exchange");
    res.status(204).end();
    return;
  }

  logger.info("Firebase ID token exchange request received", {
    method: req.method,
    origin: req.headers.origin,
  });

  if (req.method !== "POST") {
    logger.warn(`Method ${req.method} not allowed`);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Estrai l'ID token Firebase dal body o dall'Authorization header
    let idToken: string | undefined = req.body?.idToken;

    if (!idToken && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        idToken = authHeader.substring(7);
      }
    }

    if (!idToken) {
      logger.warn("No Firebase ID token provided");
      res.status(400).json({ error: "Missing Firebase ID token" });
      return;
    }

    // Verifica ID token con Admin SDK
    logger.info("Verifying Firebase ID token");
    const decoded = await admin.auth().verifyIdToken(idToken);

    if (!decoded || !decoded.uid) {
      logger.error("Invalid Firebase ID token payload");
      res.status(401).json({ error: "Invalid Firebase ID token" });
      return;
    }

    // Recupera dati utente da Firebase Auth
    const userRecord = await admin.auth().getUser(decoded.uid);

    const email = decoded.email || userRecord.email;
    const name = userRecord.displayName || decoded.name || email;
    const picture = userRecord.photoURL || decoded.picture;

    if (!email) {
      logger.error("Firebase user without email");
      res.status(403).json({ error: "Email non disponibile" });
      return;
    }

    // Determina ruolo: admin se email autorizzata, altrimenti athlete
    let role: 'admin' | 'athlete' = 'athlete';
    if (AUTHORIZED_EMAILS && typeof AUTHORIZED_EMAILS === 'string') {
      const normalized = email.toLowerCase().trim();
      const allowed = AUTHORIZED_EMAILS.split(',')
        .map(e => e.toLowerCase().trim())
        .filter(e => e.length > 0);
      if (allowed.includes(normalized)) {
        role = 'admin';
      }
    }

    // Genera JWT della tua applicazione con ruolo determinato
    const sessionToken = jwt.sign(
      {
        email,
        name,
        picture,
        role,
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET!,
      { expiresIn: "7d" }
    );

    logger.info("App JWT generated from Firebase ID token", { email });

    // Imposta cookie di sessione
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      domain: isProduction ? ".palestra-kw8.web.app" : undefined,
    });

    res.status(200).json({
      success: true,
      data: {
        token: sessionToken,
        user: {
          email,
          role,
          name,
          picture,
        },
      },
      message: 'Autenticazione Firebase completata',
    });
  } catch (error) {
    logger.error("Firebase token exchange error:", error);
    res.status(401).json({ error: "Invalid or expired Firebase ID token" });
  }
});

// Inizializza Firebase Admin SDK una sola volta
if (!admin.apps.length) {
  admin.initializeApp();
}