import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

// Logger utility per debugging strutturato
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error?.message || error);
    if (error?.stack) console.error(error.stack);
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
};

// Rate limiting semplice (in memoria)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minuti
const MAX_ATTEMPTS = 5; // Massimo 5 tentativi per IP

// Cache per le chiavi pubbliche di Google
let googleKeysCache: { keys: any[], expiry: number } | null = null;
const KEYS_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ore

// Funzione per controllare rate limiting
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= MAX_ATTEMPTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Funzione per verificare il token Google usando la libreria ufficiale
async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<any> {
  try {
    logger.info('Iniziando verifica token Google', { clientId: clientId.substring(0, 10) + '...' });
    
    // Usa la libreria ufficiale Google per la verifica
    const client = new OAuth2Client(clientId);
    
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    
    if (!payload) {
      throw new Error('Payload token vuoto');
    }
    
    // Validazioni aggiuntive
    if (!payload.email) {
      throw new Error('Email mancante nel token');
    }
    
    if (!payload.email_verified) {
      throw new Error('Email non verificata da Google');
    }
    
    // Verifica che il token sia recente (max 1 ora)
    const now = Math.floor(Date.now() / 1000);
    if (payload.iat && (now - payload.iat) > 3600) {
      throw new Error('Token troppo vecchio');
    }
    
    logger.info('Token Google verificato con successo', { 
      email: payload.email,
      name: payload.name,
      verified: payload.email_verified 
    });
    
    return payload;
    
  } catch (error: any) {
    logger.error('Errore nella verifica del token Google', error);
    throw new Error(`Verifica token fallita: ${error.message}`);
  }
}

// Funzione per validare le variabili d'ambiente critiche
function validateEnvironmentVariables(): { isValid: boolean; missingVars: string[] } {
  const requiredVars = [
    'NEXT_PUBLIC_GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET', 
    'JWT_SECRET',
    'AUTHORIZED_EMAIL'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error('Variabili d\'ambiente mancanti', { missingVars });
    return { isValid: false, missingVars };
  }
  
  logger.info('Tutte le variabili d\'ambiente richieste sono presenti');
  return { isValid: true, missingVars: [] };
}

// Funzione per validare l'email autorizzata
function validateAuthorizedEmail(email: string): boolean {
  try {
    const authorizedEmail = process.env.AUTHORIZED_EMAIL;
    
    if (!authorizedEmail) {
      logger.error('AUTHORIZED_EMAIL non configurata');
      return false;
    }
    
    // Normalizza le email per il confronto
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedAuthorized = authorizedEmail.toLowerCase().trim();
    
    const isAuthorized = normalizedEmail === normalizedAuthorized;
    
    if (!isAuthorized) {
      logger.warn('Tentativo di accesso con email non autorizzata', { 
        attempted: normalizedEmail,
        authorized: normalizedAuthorized.substring(0, 3) + '***'
      });
    }
    
    return isAuthorized;
    
  } catch (error: any) {
    logger.error('Errore nella validazione email autorizzata', error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = Math.random().toString(36).substring(7);
  logger.info(`[${requestId}] Nuova richiesta Google Sign-In`, { 
    method: req.method, 
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50)
  });

  try {
    // Gestione CORS
    if (req.method === 'OPTIONS') {
      logger.info(`[${requestId}] Gestione preflight CORS`);
      return res.status(200)
        .setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
        .setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods'])
        .setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers'])
        .setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials'])
        .setHeader('Content-Type', 'application/json')
        .json({ success: true, message: 'CORS preflight successful' });
    }

    // Imposta headers CORS per tutte le risposte
    Object.entries(corsHeaders).forEach(([key, value]) => {
      res.setHeader(key, value);
    });

    if (req.method !== 'POST') {
      logger.warn(`[${requestId}] Metodo non consentito: ${req.method}`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(405).json({ 
        success: false, 
        message: 'Metodo non consentito',
        error: 'METHOD_NOT_ALLOWED'
      });
    }

    // Validazione variabili d'ambiente
    const envValidation = validateEnvironmentVariables();
    if (!envValidation.isValid) {
      logger.error(`[${requestId}] Configurazione server incompleta`, { missingVars: envValidation.missingVars });
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        message: 'Configurazione server incompleta',
        error: 'MISSING_ENVIRONMENT_VARIABLES'
      });
    }

    // Rate limiting con logging migliorato
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
    const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;
    
    logger.info(`[${requestId}] Controllo rate limit per IP: ${ip}`);
    
    if (!checkRateLimit(ip)) {
      logger.warn(`[${requestId}] Rate limit superato`, { ip });
      res.setHeader('Content-Type', 'application/json');
      return res.status(429).json({
        success: false,
        message: 'Troppi tentativi di accesso. Riprova tra 15 minuti.',
        error: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // Validazione input richiesta
    if (!req.body || typeof req.body !== 'object') {
      logger.error(`[${requestId}] Body della richiesta non valido`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        success: false,
        message: 'Dati della richiesta non validi',
        error: 'INVALID_REQUEST_BODY'
      });
    }

    const { credential } = req.body;

    if (!credential) {
      logger.error(`[${requestId}] Credential mancante`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        success: false,
        message: 'Credential Google richiesto',
        error: 'MISSING_CREDENTIAL'
      });
    }

    if (typeof credential !== 'string') {
      logger.error(`[${requestId}] Credential non è una stringa`, { type: typeof credential });
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        success: false,
        message: 'Credential deve essere una stringa',
        error: 'INVALID_CREDENTIAL_TYPE'
      });
    }

    // Validazione lunghezza token (i token JWT Google sono tipicamente lunghi)
    if (credential.length < 100 || credential.length > 2048) {
      logger.error(`[${requestId}] Lunghezza credential non valida`, { length: credential.length });
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        success: false,
        message: 'Formato credential non valido',
        error: 'INVALID_CREDENTIAL_LENGTH'
      });
    }

    // Verifica il token Google con la libreria ufficiale
    let payload;
    try {
      logger.info(`[${requestId}] Iniziando verifica token Google`);
      payload = await verifyGoogleIdToken(credential, process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!);
    } catch (error: any) {
      logger.error(`[${requestId}] Errore nella verifica del token Google`, error);
      res.setHeader('Content-Type', 'application/json');
      return res.status(401).json({
        success: false,
        message: 'Token Google non valido o scaduto',
        error: 'INVALID_GOOGLE_TOKEN'
      });
    }

    if (!payload || !payload.email) {
      logger.error(`[${requestId}] Payload token vuoto o email mancante`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        success: false,
        message: 'Impossibile ottenere informazioni dall\'account Google',
        error: 'EMPTY_TOKEN_PAYLOAD'
      });
    }

    const email = payload.email;
    
    // Validazioni aggiuntive dell'email
    if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
      logger.error(`[${requestId}] Formato email non valido`, { email: email?.substring(0, 10) + '...' });
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).json({
        success: false,
        message: 'Formato email non valido',
        error: 'INVALID_EMAIL_FORMAT'
      });
    }
    
    logger.info(`[${requestId}] Tentativo di accesso Google`, { email });

    // Controlla se l'email è autorizzata usando la funzione dedicata
    if (!validateAuthorizedEmail(email)) {
      logger.warn(`[${requestId}] Email non autorizzata`, { email });
      res.setHeader('Content-Type', 'application/json');
      return res.status(403).json({
        success: false,
        message: 'Accesso non autorizzato per questo account',
        error: 'UNAUTHORIZED_EMAIL'
      });
    }

    logger.info(`[${requestId}] Email autorizzata confermata`, { email });

    // Genera JWT token per l'utente autorizzato
    try {
      const jwtSecret = process.env.JWT_SECRET!;

      const user = {
        userId: email,
        email: email,
        role: 'coach',
        name: payload.name || 'Coach',
        picture: payload.picture
      };

      logger.info(`[${requestId}] Generazione JWT token`, { userId: user.userId });

      const token = jwt.sign(
        user,
        jwtSecret,
        { 
          expiresIn: '24h',
          issuer: 'kw8-fitness',
          audience: 'kw8-app'
        }
      );

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      logger.info(`[${requestId}] Autenticazione Google completata con successo`, { 
        email,
        expiresAt: expiresAt.toISOString()
      });

      // Risposta di successo
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({
        success: true,
        message: 'Autenticazione Google completata con successo',
        data: {
          token,
          user: {
            id: user.userId,
            email: user.email,
            role: user.role,
            name: user.name
          },
          expiresAt: expiresAt.toISOString(),
          tokenType: 'Bearer'
        }
      });

    } catch (jwtError: any) {
      logger.error(`[${requestId}] Errore nella generazione JWT`, jwtError);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        success: false,
        message: 'Errore nella generazione del token di autenticazione',
        error: 'JWT_GENERATION_FAILED'
      });
    }

  } catch (error: any) {
    logger.error(`[${requestId}] Errore generale nell'autenticazione Google`, error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server durante l\'autenticazione',
      error: 'INTERNAL_SERVER_ERROR'
    });
  }
}