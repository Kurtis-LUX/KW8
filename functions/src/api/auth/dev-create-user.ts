import { onRequest } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import * as admin from "firebase-admin";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Allowed origins for local dev
const ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
  "https://palestra-kw8.web.app"
];

// Initialize Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp();
}

export const apiAuthDevCreateUser = onRequest({ cors: false }, async (req, res) => {
  // CORS headers
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  // Handle preflight
  if (req.method === "OPTIONS") {
    logger.info("Handling CORS preflight for dev-create-user");
    res.status(204).end();
    return;
  }

  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    logger.warn("Dev create user attempted in non-development environment");
    res.status(403).json({ error: "Not allowed in this environment" });
    return;
  }

  // Auth via API secret key
  const authHeader = req.headers.authorization || "";
  const expected = process.env.API_SECRET_KEY;
  if (!expected) {
    logger.error("API_SECRET_KEY not configured");
    res.status(500).json({ error: "Server misconfiguration" });
    return;
  }

  if (!authHeader.startsWith("Bearer ") || authHeader.substring(7) !== expected) {
    logger.warn("Unauthorized dev-create-user attempt");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { email, password, displayName, photoURL, emailVerified } = req.body || {};

    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user exists
    let userRecord: admin.auth.UserRecord | null = null;
    try {
      userRecord = await admin.auth().getUserByEmail(normalizedEmail);
      logger.info("User already exists in Firebase Auth", { uid: userRecord.uid, email: normalizedEmail });
    } catch (err: any) {
      if (err?.code === "auth/user-not-found") {
        userRecord = await admin.auth().createUser({
          email: normalizedEmail,
          password,
          displayName: displayName || normalizedEmail,
          photoURL,
          emailVerified: !!emailVerified,
          disabled: false,
        });
        logger.info("User created in Firebase Auth", { uid: userRecord.uid, email: normalizedEmail });
      } else {
        logger.error("Error fetching user in Firebase Auth", err);
        res.status(500).json({ error: "Firebase Auth error" });
        return;
      }
    }

    res.status(200).json({
      success: true,
      message: "User provisioned for local development",
      data: {
        uid: userRecord!.uid,
        email: normalizedEmail,
        displayName: userRecord!.displayName,
      }
    });
  } catch (error) {
    logger.error("Dev create user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});