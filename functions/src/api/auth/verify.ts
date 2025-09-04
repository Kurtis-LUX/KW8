import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import * as jwt from "jsonwebtoken";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Origini consentite
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "https://palestra-kw8.web.app"
];

export const authVerify = onRequest({ cors: false }, async (req, res) => {
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
    logger.info("Handling CORS preflight for auth/verify");
    res.status(204).end();
    return;
  }

  logger.info("Token verification request received", {
    method: req.method,
    origin: req.headers.origin,
  });

  if (req.method !== "POST") {
    logger.warn(`Method ${req.method} not allowed`);
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    // Estrai il token dal cookie, dal body o dall'header Authorization
    let token = req.cookies?.session || req.body?.token;
    
    // Se non trovato, controlla l'header Authorization
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      logger.warn("No token provided");
      res.status(401).json({ error: "No token provided" });
      return;
    }

    // Verifica il JWT
    logger.info("Verifying JWT token");
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    if (!decoded || !decoded.email) {
      logger.error("Invalid token payload");
      res.status(401).json({ error: "Invalid token" });
      return;
    }

    logger.info("Token verified successfully", { email: decoded.email });

    res.status(200).json({
      valid: true,
      user: {
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
        role: 'coach'
      },
      message: 'Token verified successfully'
    });
  } catch (error) {
    logger.error("Token verification error:", error);
    res.status(401).json({ error: "Invalid or expired token" });
  }
});