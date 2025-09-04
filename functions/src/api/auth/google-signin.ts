import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import { OAuth2Client } from "google-auth-library";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Origini consentite
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://palestra-kw8.web.app"
];

// Middleware CORS personalizzato
function setCorsHeaders(req: any, res: any) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }
}

export const apiAuthGoogleSignin = onRequest({ cors: false }, async (req, res) => {
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
    logger.info("Handling CORS preflight manually");
    res.status(204).end();
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
      audience: process.env.GOOGLE_CLIENT_ID,
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
    const authorizedEmails = process.env.AUTHORIZED_EMAIL?.split(",").map(e => e.trim()) || [];
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
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET!,
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