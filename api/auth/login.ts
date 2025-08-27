// API endpoint per l'autenticazione sicura con JWT
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

// Simulazione di un database con password hashate
// In produzione, questi dati dovrebbero essere recuperati dal database MongoDB
let users: any[] = [
  {
    id: 'admin-1',
    email: 'admin@example.com',
    // Password placeholder - CHANGE IN PRODUCTION
    password: '$2a$10$PLACEHOLDER_HASH_CHANGE_IN_PRODUCTION',
    name: 'Amministratore',
    role: 'admin'
  }
];

// Funzione per inizializzare l'admin con password hashata
const initializeAdmin = async () => {
  const hashedPassword = await bcrypt.hash('CHANGE_IN_PRODUCTION', 10);
  users[0].password = hashedPassword;
};

// Promise per tracciare l'inizializzazione
let initPromise: Promise<void> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = Math.random().toString(36).substring(7);
  logger.info(`[${requestId}] Nuova richiesta login`, { 
    method: req.method, 
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']?.substring(0, 50)
  });

  try {
    // Assicurati che l'inizializzazione sia completata
    if (!initPromise) {
      initPromise = initializeAdmin();
    }
    await initPromise;
    
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
    
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
      logger.info(`[${requestId}] Gestione preflight CORS`);
      return res.status(200).json({ 
        success: true, 
        message: 'CORS preflight successful' 
      });
    }

    if (req.method !== 'POST') {
      logger.warn(`[${requestId}] Metodo non consentito`, { method: req.method });
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ 
        success: false,
        error: `Method ${req.method} Not Allowed`,
        message: 'Metodo non consentito'
      });
    }

    // Validazione variabili d'ambiente
    if (!process.env.JWT_SECRET) {
      logger.error(`[${requestId}] JWT_SECRET non configurato`);
      return res.status(500).json({ 
        success: false,
        message: 'Configurazione server mancante',
        error: 'MISSING_JWT_SECRET'
      });
    }

    // Validazione Content-Type
    const contentType = req.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn(`[${requestId}] Content-Type non valido`, { contentType });
      return res.status(400).json({ 
        success: false, 
        message: 'Content-Type deve essere application/json',
        error: 'INVALID_CONTENT_TYPE'
      });
    }

    // Validazione body
    if (!req.body || typeof req.body !== 'object') {
      logger.warn(`[${requestId}] Body della richiesta non valido`);
      return res.status(400).json({ 
        success: false, 
        message: 'Body della richiesta non valido',
        error: 'INVALID_REQUEST_BODY'
      });
    }

    const { email, password } = req.body;

    // Validazione input dettagliata
    if (!email || typeof email !== 'string' || email.trim() === '') {
      logger.warn(`[${requestId}] Email mancante o non valida`);
      return res.status(400).json({ 
        success: false, 
        message: 'Email è richiesta e deve essere una stringa valida',
        error: 'INVALID_EMAIL'
      });
    }

    if (!password || typeof password !== 'string' || password.trim() === '') {
      logger.warn(`[${requestId}] Password mancante o non valida`);
      return res.status(400).json({ 
        success: false, 
        message: 'Password è richiesta e deve essere una stringa valida',
        error: 'INVALID_PASSWORD'
      });
    }

    // Validazione formato email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      logger.warn(`[${requestId}] Formato email non valido`, { email: email.substring(0, 10) + '...' });
      return res.status(400).json({ 
        success: false, 
        message: 'Formato email non valido',
        error: 'INVALID_EMAIL_FORMAT'
      });
    }

    logger.info(`[${requestId}] Tentativo di login`, { email: email.substring(0, 10) + '...' });

    // Verifica che l'email sia autorizzata
    const authorizedEmail = process.env.AUTHORIZED_EMAIL;
    if (!authorizedEmail) {
      logger.error(`[${requestId}] AUTHORIZED_EMAIL non configurata`);
      return res.status(500).json({ 
        success: false,
        message: 'Configurazione server incompleta',
        error: 'MISSING_AUTHORIZED_EMAIL'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const normalizedAuthorized = authorizedEmail.toLowerCase().trim();
    
    if (normalizedEmail !== normalizedAuthorized) {
      logger.warn(`[${requestId}] Tentativo di accesso con email non autorizzata`, { 
        attempted: normalizedEmail.substring(0, 10) + '...',
        authorized: normalizedAuthorized.substring(0, 3) + '***'
      });
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized email',
        message: 'Accesso non autorizzato per questo account'
      });
    }

    // Trova l'utente
    const user = users.find(u => u.email === email.trim());
    
    if (!user) {
      logger.warn(`[${requestId}] Utente non trovato`, { email: email.substring(0, 10) + '...' });
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials',
        message: 'Credenziali non valide'
      });
    }

    // Verifica la password usando bcrypt con gestione errori
    let isPasswordValid: boolean;
    try {
      isPasswordValid = await bcrypt.compare(password, user.password);
    } catch (bcryptError: any) {
      logger.error(`[${requestId}] Errore durante la verifica password`, bcryptError);
      return res.status(500).json({ 
        success: false,
        error: 'Password verification error',
        message: 'Errore durante la verifica delle credenziali'
      });
    }
    
    if (!isPasswordValid) {
      logger.warn(`[${requestId}] Password non valida`, { email: email.substring(0, 10) + '...' });
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials',
        message: 'Credenziali non valide'
      });
    }

    logger.info(`[${requestId}] Generazione JWT token`);

    // Genera JWT token con gestione errori
    const jwtSecret = process.env.JWT_SECRET;
    let token: string;
    
    try {
      token = jwt.sign(
        { 
          userId: user.id, 
          email: user.email, 
          role: user.role 
        },
        jwtSecret,
        { 
          expiresIn: '24h',
          issuer: 'kw8-fitness',
          audience: 'kw8-users'
        }
      );
    } catch (jwtError: any) {
      logger.error(`[${requestId}] Errore nella generazione JWT`, jwtError);
      return res.status(500).json({ 
        success: false, 
        message: 'Errore nella generazione del token',
        error: 'JWT_GENERATION_ERROR'
      });
    }

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    logger.info(`[${requestId}] Login completato con successo`, { 
      email: email.substring(0, 10) + '...',
      tokenLength: token.length
    });

    return res.status(200).json({
      success: true,
      user: userWithoutPassword,
      token,
      message: 'Login successful',
      expiresIn: '24h'
    });

  } catch (error: any) {
    logger.error(`[${requestId}] Errore generale nel login`, error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal Server Error',
      message: 'Errore interno del server'
    });
  }
}