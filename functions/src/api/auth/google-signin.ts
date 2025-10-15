import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { OAuth2Client } from "google-auth-library";
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
const GOOGLE_CLIENT_ID = firebaseConfig.google?.client_id || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = firebaseConfig.google?.client_secret || process.env.GOOGLE_CLIENT_SECRET;
const JWT_SECRET = firebaseConfig.jwt?.secret || process.env.JWT_SECRET;
const AUTHORIZED_EMAILS = firebaseConfig.authorized?.email || process.env.AUTHORIZED_EMAIL;

if (!GOOGLE_CLIENT_ID) {
  logger.error("Configurazione Google OAuth mancante. Verifica le variabili d'ambiente su Firebase.");
  logger.error("GOOGLE_CLIENT_ID:", GOOGLE_CLIENT_ID);
  logger.error("Firebase config:", JSON.stringify(firebaseConfig, null, 2));
}

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

// Origini consentite
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://palestra-kw8.web.app"
];

  // Middleware CORS personalizzato
  function setCorsHeaders(req: any, res: any) {
    const origin = req.headers.origin;
    logger.info(`CORS Debug - Origin ricevuta: ${origin}`);
    
    if (ALLOWED_ORIGINS.includes(origin)) {
      logger.info(`CORS Debug - Origin consentita: ${origin}`);
      res.set("Access-Control-Allow-Origin", origin);
      res.set("Access-Control-Allow-Credentials", "true");
      res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
      res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
      res.set("Access-Control-Max-Age", "86400");
    } else {
      logger.warn(`CORS Debug - Origin NON consentita: ${origin}`);
      logger.warn(`CORS Debug - Origini consentite: ${JSON.stringify(ALLOWED_ORIGINS)}`);
    }
  }

export const apiAuthGoogleSignin = onRequest({ 
  cors: false,
  invoker: "public" // Permette invocazioni pubbliche non autenticate
}, async (req, res) => {
  // Imposta header CORS immediatamente per tutte le richieste
  const origin = req.headers.origin;
  
  // Log per debug
  logger.info("Request received", { 
    method: req.method, 
    origin: origin,
    allowedOrigins: ALLOWED_ORIGINS 
  });
  
  // Imposta sempre gli header CORS per le origini consentite
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");
    res.set("Access-Control-Max-Age", "86400"); // Cache preflight per 24 ore
  } else {
    logger.warn("Origin not allowed", { origin, allowedOrigins: ALLOWED_ORIGINS });
  }

  // Gestione preflight esplicita
  if (req.method === "OPTIONS") {
    logger.info("Handling CORS preflight request", { origin });
    res.status(200).end(); // Cambiato da 204 a 200
    return;
  }

  logger.info("Google Sign-In request received", {
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
    logger.info("Verifying Google ID token");
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

    const { email, name, picture } = payload;
    logger.info("Token verified successfully", { email, name });

    // Check if email is authorized
    const authorizedEmails = AUTHORIZED_EMAILS?.split(",").map(e => e.trim()) || [];
    if (!email || !authorizedEmails.includes(email)) {
      logger.warn(`Unauthorized email: ${email}`);
      res.status(403).json({ error: "Unauthorized email" });
      return;
    }

    // Generate JWT session token
    const sessionToken = jwt.sign(
      {
        email,
        name,
        picture,
        role: 'coach',
        iat: Math.floor(Date.now() / 1000),
      },
      JWT_SECRET!,
      { expiresIn: "7d" }
    );

    logger.info("JWT session token generated", { email });

    // Set secure cookie
    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: true, // Sempre true per HTTPS e SameSite=None
      sameSite: "none", // Necessario per cross-origin
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      domain: isProduction ? ".palestra-kw8.web.app" : undefined,
    });

    logger.info("Session cookie set successfully", { email, isProduction });

    res.status(200).json({
      success: true,
      data: {
        token: sessionToken,
        user: {
          email,
          name,
          picture,
          role: 'coach'
        },
      },
    });
  } catch (error) {
    logger.error("Google Sign-In error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});