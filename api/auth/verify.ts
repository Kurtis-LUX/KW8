// API endpoint per la verifica del token JWT
import { VercelRequest, VercelResponse } from '@vercel/node';
const jwt = require('jsonwebtoken');

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

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
  iss: string;
  aud: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Imposta immediatamente il Content-Type per evitare text/plain di default
  res.setHeader('Content-Type', 'application/json');
  
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    logger.info(`[${requestId}] Nuova richiesta verifica token`, { 
      method: req.method, 
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']?.substring(0, 50)
    });

    // Verifica immediata delle dipendenze critiche
    if (!jwt) {
      logger.error(`[${requestId}] Dipendenze mancanti`, { jwt: !!jwt });
      return res.status(500).json({
        success: false,
        valid: false,
        message: 'Errore di configurazione server - dipendenze mancanti',
        error: 'MISSING_DEPENDENCIES'
      });
    }
    // Abilita CORS con logging
    const allowedOrigins = [
      'http://localhost:5173',
      'https://kw8-fitness.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      logger.info(`[${requestId}] CORS origin consentita`, { origin });
    } else {
      logger.warn(`[${requestId}] CORS origin non consentita`, { origin, allowedOrigins });
    }
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      logger.info(`[${requestId}] Gestione preflight CORS`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ 
        success: true, 
        message: 'CORS preflight successful' 
      });
    }

    if (req.method !== 'POST' && req.method !== 'GET') {
      logger.warn(`[${requestId}] Metodo non consentito`, { method: req.method });
      res.setHeader('Allow', ['POST', 'GET']);
      res.setHeader('Content-Type', 'application/json');
      return res.status(405).json({ 
        success: false,
        error: `Method ${req.method} Not Allowed`,
        message: 'Metodo non consentito'
      });
    }

    // Validazione variabili d'ambiente
    if (!process.env.JWT_SECRET) {
      logger.error(`[${requestId}] JWT_SECRET non configurato`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({ 
        success: false,
        valid: false, 
        message: 'Configurazione server mancante',
        error: 'MISSING_JWT_SECRET'
      });
    }

    // Estrai il token dall'header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      logger.warn(`[${requestId}] Header Authorization mancante`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ 
        success: false,
        valid: false, 
        message: 'Header Authorization mancante',
        error: 'MISSING_AUTH_HEADER'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      logger.warn(`[${requestId}] Formato Authorization header non valido`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ 
        success: false,
        valid: false, 
        message: 'Formato Authorization header non valido',
        error: 'INVALID_AUTH_FORMAT'
      });
    }

    const token = authHeader.substring(7); // Rimuovi 'Bearer '
    
    if (!token || token.trim() === '') {
      logger.warn(`[${requestId}] Token vuoto`);
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ 
        success: false,
        valid: false, 
        message: 'Token non fornito',
        error: 'EMPTY_TOKEN'
      });
    }

    // Validazione lunghezza token
    if (token.length < 10 || token.length > 2048) {
      logger.warn(`[${requestId}] Lunghezza token non valida`, { length: token.length });
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ 
        success: false,
        valid: false, 
        message: 'Formato token non valido',
        error: 'INVALID_TOKEN_LENGTH'
      });
    }

    logger.info(`[${requestId}] Iniziando verifica JWT token`);

    // Verifica il token JWT
    const jwtSecret = process.env.JWT_SECRET;
    
    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(token, jwtSecret, {
        issuer: 'kw8-fitness',
        audience: 'kw8-app'
      }) as JWTPayload;
    } catch (jwtError: any) {
      logger.error(`[${requestId}] Errore nella verifica JWT`, jwtError);
      
      if (jwtError instanceof jwt.JsonWebTokenError) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ 
          success: false,
          valid: false, 
          message: 'Token non valido',
          error: 'INVALID_JWT_TOKEN'
        });
      }
      
      if (jwtError instanceof jwt.TokenExpiredError) {
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ 
          success: false,
          valid: false, 
          message: 'Token scaduto',
          error: 'EXPIRED_JWT_TOKEN'
        });
      }
      
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ 
        success: false,
        valid: false, 
        message: 'Errore nella verifica del token',
        error: 'JWT_VERIFICATION_FAILED'
      });
    }

    // Validazione payload
    if (!decoded || !decoded.userId || !decoded.email) {
      logger.error(`[${requestId}] Payload JWT incompleto`, { decoded });
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ 
        success: false,
        valid: false, 
        message: 'Token non valido - payload incompleto',
        error: 'INCOMPLETE_JWT_PAYLOAD'
      });
    }

    // Controlla se il token è scaduto (doppio controllo)
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTime) {
      logger.warn(`[${requestId}] Token scaduto`, { exp: decoded.exp, current: currentTime });
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).json({ 
        success: false,
        valid: false, 
        message: 'Token scaduto',
        error: 'TOKEN_EXPIRED'
      });
    }

    // Verifica che l'email sia autorizzata
    const authorizedEmail = process.env.AUTHORIZED_EMAIL;
    if (authorizedEmail) {
      // Supporta multiple email separate da virgola
      const authorizedEmails = authorizedEmail
        .split(',')
        .map(email => email.toLowerCase().trim())
        .filter(email => email.length > 0);
      
      if (!authorizedEmails.includes(decoded.email.toLowerCase().trim())) {
        logger.warn(`[${requestId}] Email non autorizzata nel token`, { email: decoded.email });
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({ 
          success: false,
          valid: false, 
          message: 'Token non autorizzato',
          error: 'UNAUTHORIZED_TOKEN'
        });
      }
    }

    logger.info(`[${requestId}] Token verificato con successo`, { 
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role
    });

    // Token valido - restituisci le informazioni dell'utente
    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      },
      message: 'Token valido'
    });

  } catch (error: any) {
    // Assicurati sempre che il Content-Type sia impostato
    res.setHeader('Content-Type', 'application/json');
    
    logger.error(`[${requestId}] Errore generale nella verifica token`, error);
    
    // Gestione specifica per diversi tipi di errore
    let errorType = 'INTERNAL_SERVER_ERROR';
    let statusCode = 500;
    let message = 'Errore interno del server';
    
    if (error?.code === 'MODULE_NOT_FOUND') {
      errorType = 'MODULE_NOT_FOUND';
      message = 'Errore di configurazione server - modulo mancante';
    } else if (error?.name === 'JsonWebTokenError') {
      errorType = 'JWT_LIBRARY_ERROR';
      message = 'Errore nella libreria JWT';
    } else if (error?.message?.includes('jwt')) {
      errorType = 'JWT_PROCESSING_ERROR';
      message = 'Errore nel processamento JWT';
    }
    
    return res.status(statusCode).json({ 
      success: false,
      valid: false, 
      message,
      error: errorType,
      requestId
    });
  }
}

// Funzione helper per verificare i token (utilizzabile in altri endpoint)
export const verifyToken = (token: string): Promise<JWTPayload> => {
  return new Promise((resolve, reject) => {
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    
    jwt.verify(token, jwtSecret, {
      issuer: 'kw8-fitness',
      audience: 'kw8-app'
    }, (error, decoded) => {
      if (error) {
        reject(error);
      } else {
        resolve(decoded as JWTPayload);
      }
    });
  });
};

// Middleware per proteggere le rotte API
export const requireAuth = async (req: VercelRequest): Promise<JWTPayload> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token mancante o formato non valido');
  }

  const token = authHeader.substring(7);
  
  if (!token) {
    throw new Error('Token non fornito');
  }

  try {
    const decoded = await verifyToken(token);
    return decoded;
  } catch (error) {
    throw new Error('Token non valido o scaduto');
  }
};

// Middleware per verificare il ruolo admin
export const requireAdmin = async (req: VercelRequest): Promise<JWTPayload> => {
  const user = await requireAuth(req);
  
  if (user.role !== 'admin') {
    throw new Error('Accesso negato: privilegi di amministratore richiesti');
  }
  
  return user;
};