// Server di sviluppo per servire le API routes localmente
require('dotenv').config({ path: '.env.local' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Origini consentite per CORS in sviluppo
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5177',
  'http://localhost:5178',
  'http://localhost:5181',
  'http://localhost:3000'
];

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true
}));
app.use(express.json({ limit: '1mb' })); // Limita la dimensione del payload

// Middleware specifico per limitare payload su Google Sign-In
app.use(['/api/auth/google-signin', '/apiAuthGoogleSignin'], (req, res, next) => {
  if (req.method === 'POST') {
    const contentLength = parseInt(req.headers['content-length'] || '0');
    if (contentLength > 5000) { // 5KB limit per Google Sign-In
      return res.status(413).json({
        success: false,
        message: 'Payload troppo grande'
      });
    }
  }
  next();
});

// Middleware di sicurezza per metodi HTTP
app.use((req, res, next) => {
  // Lista dei metodi consentiti per ogni endpoint
  const allowedMethods = {
    '/api/auth/login': ['POST', 'OPTIONS'],
    '/api/auth/verify': ['POST', 'OPTIONS'],
    '/api/auth/google-signin': ['POST', 'OPTIONS'],
    '/apiAuthGoogleSignin': ['POST', 'OPTIONS'],
    '/apiAuthFirebaseExchange': ['POST', 'OPTIONS'],
    '/api/users': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    '/api/health': ['GET', 'OPTIONS']
  };
  
  const path = req.path;
  const method = req.method;
  
  // Controlla se il path ha metodi specifici definiti
  if (allowedMethods[path] && !allowedMethods[path].includes(method)) {
    return res.status(405).json({ 
      success: false, 
      message: 'Metodo non consentito',
      allowedMethods: allowedMethods[path].filter(m => m !== 'OPTIONS')
    });
  }
  
  next();
});

// Simulazione database condiviso per tutte le API
let users = [];
let workoutPlans = [];
let workoutFolders = [];
let adminUsers = [
  {
    id: '1',
    email: 'admin@example.com',
    password: '$2a$10$PLACEHOLDER_HASH_CHANGE_IN_PRODUCTION', // Change in production
    role: 'admin',
    nome: 'Admin',
    cognome: 'User'
  }
];



// Utility per generare JWT (semplificato per sviluppo)
const generateToken = (user) => {
  return Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 ore
  })).toString('base64');
};

// Utility per verificare password (semplificato)
const verifyPassword = (password, hash) => {
  // Per sviluppo, accetta sia la password in chiaro che l'hash
  return password === 'CHANGE_IN_PRODUCTION' || password === hash;
};

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono richiesti' });
    }
    
    const user = adminUsers.find(u => u.email === email);
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    const token = generateToken(user);
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nome: user.nome,
        cognome: user.cognome
      },
      token,
      message: 'Login effettuato con successo',
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ valid: false, message: 'Token mancante' });
    }
    
    const token = authHeader.substring(7);
    
    // Prova prima a decodificare come JWT
    try {
      const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
      const decoded = jwt.verify(token, jwtSecret);
      
      return res.status(200).json({
        valid: true,
        user: {
          id: decoded.userId || decoded.email,
          email: decoded.email,
          role: decoded.role
        },
        message: 'Token valido'
      });
    } catch (jwtError) {
      // Se fallisce come JWT, prova come base64 (per compatibilità)
      try {
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        
        if (decoded.exp < Date.now()) {
          return res.status(200).json({ valid: false, message: 'Token scaduto' });
        }
        
        return res.status(200).json({
          valid: true,
          user: {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role
          },
          message: 'Token valido'
        });
      } catch (base64Error) {
        return res.status(200).json({ valid: false, message: 'Token non valido' });
      }
    }
  } catch (error) {
    res.status(200).json({ valid: false, message: 'Token non valido' });
  }
});

// Importa e configura le API routes di Firebase
const fs = require('fs');

// Google Sign-In inline implementation
const jwt = require('jsonwebtoken');

// Rate limiting per Google Sign-In
const googleRateLimitMap = new Map();
const GOOGLE_RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minuti
const GOOGLE_MAX_ATTEMPTS = 5;

// Email autorizzate (supporta più email separate da virgola)
const AUTHORIZED_COACH_EMAILS = process.env.AUTHORIZED_EMAIL || 'krossingweight@gmail.com,simeoneluca44@gmail.com';
const authorizedEmailsList = AUTHORIZED_COACH_EMAILS.split(',').map(email => email.trim().toLowerCase());

console.log('🔧 Configurazione email autorizzate:');
console.log('📧 AUTHORIZED_EMAIL da env:', process.env.AUTHORIZED_EMAIL);
console.log('📋 Lista email processate:', authorizedEmailsList);

// Funzione per validare token Google (simulata per sviluppo)
function validateGoogleToken(credential) {
  return new Promise((resolve, reject) => {
    if (!credential || typeof credential !== 'string') {
      return reject(new Error('Token non valido'));
    }
    
    const parts = credential.split('.');
    if (parts.length !== 3) {
      return reject(new Error('Formato JWT non valido'));
    }
    
    try {
      // Verifica che le parti non siano vuote
      if (parts.some(part => !part || part.length === 0)) {
        return reject(new Error('Formato JWT non valido'));
      }
      
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Validazioni obbligatorie
      if (!payload.email || !payload.email_verified) {
        return reject(new Error('Email non verificata'));
      }
      
      if (!payload.aud || payload.aud !== process.env.VITE_GOOGLE_CLIENT_ID) {
        return reject(new Error('Audience non valida'));
      }
      
      const now = Math.floor(Date.now() / 1000);
      
      // Controllo scadenza più rigoroso
      if (!payload.exp) {
        return reject(new Error('Token senza scadenza'));
      }
      
      if (payload.exp < now) {
        return reject(new Error('Token scaduto'));
      }
      
      // Controllo che il token non sia troppo vecchio
      if (!payload.iat) {
        return reject(new Error('Token senza timestamp di emissione'));
      }
      
      if ((now - payload.iat) > 3600) { // 1 ora
        return reject(new Error('Token troppo vecchio'));
      }
      
      // Controllo che il token non sia del futuro
      if (payload.iat > now + 300) { // 5 minuti di tolleranza
        return reject(new Error('Token emesso nel futuro'));
      }
      
      resolve(payload);
    } catch (error) {
      reject(new Error('Errore nella decodifica del token: ' + error.message));
    }
  });
}

// Funzione per controllare rate limiting Google
function checkGoogleRateLimit(ip) {
  const now = Date.now();
  const userLimit = googleRateLimitMap.get(ip);
  
  if (!userLimit || now > userLimit.resetTime) {
    googleRateLimitMap.set(ip, { count: 1, resetTime: now + GOOGLE_RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= GOOGLE_MAX_ATTEMPTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Route per Google Sign-In (compatibile con Firebase Functions)
app.post('/apiAuthGoogleSignin', (req, res) => {
  // CORS headers
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Aggiungi header Cross-Origin-Opener-Policy per risolvere l'errore COOP
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');

  try {
    console.log('🔍 Richiesta Google Sign-In ricevuta');
    
    // Prima validazione: controllo parametri richiesti
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Credential Google richiesto'
      });
    }
    
    if (typeof credential !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Credential deve essere una stringa'
      });
    }
    
    // Validazione formato token JWT (deve avere 3 parti separate da punti)
    const tokenParts = credential.split('.');
    if (tokenParts.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Formato credential non valido'
      });
    }
    
    // Validazione lunghezza token (più rigorosa)
    if (credential.length < 200 || credential.length > 2048) {
      return res.status(400).json({
        success: false,
        message: 'Formato credential non valido'
      });
    }
    
    // Validazione che ogni parte del JWT non sia vuota
    if (tokenParts.some(part => !part || part.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Formato credential non valido'
      });
    }
    
    // Rate limiting (dopo validazione formato)
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
    const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;
    
    if (!checkGoogleRateLimit(ip)) {
      console.log(`🚫 Rate limit superato per IP: ${ip}`);
      return res.status(429).json({
        success: false,
        message: 'Troppi tentativi di accesso. Riprova tra 15 minuti.'
      });
    }

    // Verifica il token Google
    validateGoogleToken(credential)
      .then(payload => {
        if (!payload || !payload.email) {
          return res.status(400).json({
            success: false,
            message: 'Impossibile ottenere informazioni dall\'account Google'
          });
        }

        const email = payload.email;
        
        // Validazioni email
        if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
          return res.status(400).json({
            success: false,
            message: 'Formato email non valido'
          });
        }
        
        if (!payload.email_verified) {
          console.log(`❌ Email non verificata: ${email}`);
          return res.status(403).json({
            success: false,
            message: 'Account Google non verificato'
          });
        }
        
        console.log(`🔐 Tentativo di accesso Google: ${email}`);
        console.log(`📋 Email autorizzate: ${authorizedEmailsList.join(', ')}`);

        // Controlla autorizzazione (supporta più email)
        if (!authorizedEmailsList.includes(email.toLowerCase().trim())) {
          console.log(`❌ Email non autorizzata: ${email}`);
          return res.status(403).json({
            success: false,
            message: 'Accesso non autorizzato per questo account'
          });
        }

        console.log(`✅ Email autorizzata: ${email}`);

        // Genera JWT token
        const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
        
        const user = {
          userId: email,
          email: email,
          role: 'coach',
          name: payload.name || 'Coach',
          picture: payload.picture
        };

        const token = jwt.sign(
          user,
          jwtSecret,
          { 
            expiresIn: '24h',
            issuer: 'kw8-fitness',
            audience: 'kw8-app'
          }
        );

        // Risposta di successo
        res.status(200).json({
          success: true,
          message: 'Autenticazione Google completata con successo',
          data: {
            token,
            user: {
              id: user.userId,
              email: user.email,
              role: user.role,
              name: user.name,
              picture: user.picture
            },
            expiresIn: '24h'
          }
        });
      })
      .catch(error => {
        console.error('Errore nella verifica del token Google:', error);
        return res.status(401).json({
          success: false,
          message: 'Token Google non valido o scaduto'
        });
      });
  } catch (error) {
    console.error('Errore durante l\'autenticazione Google:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server durante l\'autenticazione'
    });
  }
});

// CORS preflight per Google Sign-In
// Alias route per mantenere coerenza con il frontend (/api/auth/*)
app.post('/api/auth/google-signin', (req, res) => {
  // CORS headers
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Aggiungi header Cross-Origin-Opener-Policy per risolvere l'errore COOP
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');

  try {
    console.log('🔍 Richiesta Google Sign-In ricevuta [alias /api/auth/google-signin]');

    // Prima validazione: controllo parametri richiesti
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Credential Google richiesto'
      });
    }

    if (typeof credential !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Credential deve essere una stringa'
      });
    }

    // Validazione formato token JWT (deve avere 3 parti separate da punti)
    const tokenParts = credential.split('.');
    if (tokenParts.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Formato credential non valido'
      });
    }

    // Validazione lunghezza token (più rigorosa)
    if (credential.length < 200 || credential.length > 2048) {
      return res.status(400).json({
        success: false,
        message: 'Formato credential non valido'
      });
    }

    // Validazione che ogni parte del JWT non sia vuota
    if (tokenParts.some(part => !part || part.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Formato credential non valido'
      });
    }

    // Rate limiting (dopo validazione formato)
    const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
    const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;

    if (!checkGoogleRateLimit(ip)) {
      console.log(`🚫 Rate limit superato per IP: ${ip}`);
      return res.status(429).json({
        success: false,
        message: 'Troppi tentativi di accesso. Riprova tra 15 minuti.'
      });
    }

    // Verifica il token Google
    validateGoogleToken(credential)
      .then(payload => {
        if (!payload || !payload.email) {
          return res.status(400).json({
            success: false,
            message: 'Impossibile ottenere informazioni dall\'account Google'
          });
        }

        const email = payload.email;

        // Validazioni email
        if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
          return res.status(400).json({
            success: false,
            message: 'Formato email non valido'
          });
        }

        if (!payload.email_verified) {
          console.log(`❌ Email non verificata: ${email}`);
          return res.status(403).json({
            success: false,
            message: 'Account Google non verificato'
          });
        }

        console.log(`🔐 Tentativo di accesso Google: ${email}`);
        console.log(`📋 Email autorizzate: ${authorizedEmailsList.join(', ')}`);

        // Controlla autorizzazione (supporta più email)
        if (!authorizedEmailsList.includes(email.toLowerCase().trim())) {
          console.log(`❌ Email non autorizzata: ${email}`);
          return res.status(403).json({
            success: false,
            message: 'Accesso non autorizzato per questo account'
          });
        }

        console.log(`✅ Email autorizzata: ${email}`);

        // Genera JWT token
        const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';

        const user = {
          userId: email,
          email: email,
          role: 'coach',
          name: payload.name || 'Coach',
          picture: payload.picture
        };

        const token = jwt.sign(
          user,
          jwtSecret,
          {
            expiresIn: '24h',
            issuer: 'kw8-fitness',
            audience: 'kw8-app'
          }
        );

        // Risposta di successo
        res.status(200).json({
          success: true,
          message: 'Autenticazione Google completata con successo',
          data: {
            token,
            user: {
              id: user.userId,
              email: user.email,
              role: user.role,
              name: user.name,
              picture: user.picture
            },
            expiresIn: '24h'
          }
        });
      })
      .catch(error => {
        console.error('Errore nella verifica del token Google:', error);
        return res.status(401).json({
          success: false,
          message: 'Token Google non valido o scaduto'
        });
      });
  } catch (error) {
    console.error('Errore durante l\'autenticazione Google:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server durante l\'autenticazione'
    });
  }
});
app.options('/api/auth/google-signin', (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// CORS preflight per apiAuthGoogleSignin (compatibile con Firebase Functions)
app.options('/apiAuthGoogleSignin', (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Aggiungi header Cross-Origin-Opener-Policy anche per preflight
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  
  res.status(200).end();
});

// Users endpoints
app.all('/api/users', (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'CORS preflight successful' });
  }
  
  switch (req.method) {
    case 'GET':
      return res.status(200).json({
        success: true,
        data: users,
        message: 'Utenti recuperati con successo'
      });
    case 'POST':
      const newUser = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      users.push(newUser);
      return res.status(201).json({
        success: true,
        data: newUser,
        message: 'Utente creato con successo'
      });
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'development'
  });
});

// Auth verify endpoint
app.post('/authVerify', (req, res) => {
  // Imposta header CORS
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');
  
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
      console.log('❌ No token provided for verification');
      return res.status(401).json({ 
        valid: false,
        error: "No token provided" 
      });
    }

    // Verifica il JWT
    console.log('🔐 Verifying JWT token');
    
    if (!process.env.JWT_SECRET) {
      console.log('❌ Token verification error: JWT_SECRET is not defined');
      return res.status(500).json({ 
        valid: false,
        error: "JWT_SECRET not configured" 
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded || !decoded.email) {
      console.log('❌ Invalid token payload');
      return res.status(401).json({ 
        valid: false,
        error: "Invalid token" 
      });
    }

    console.log('✅ Token verified successfully for:', decoded.email);

    res.status(200).json({
      valid: true,
      user: {
        id: decoded.email,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role || 'user'
      },
      message: 'Token verified successfully'
    });
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    res.status(401).json({ 
      valid: false,
      error: "Invalid or expired token" 
    });
  }
});

// Compat: endpoint per sviluppo allineato a Hosting rewrite
app.post('/api/auth/verify', (req, res) => {
  // Imposta header CORS
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Content-Type', 'application/json');
  
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
      console.log('❌ No token provided for verification');
      return res.status(401).json({ 
        valid: false,
        error: "No token provided" 
      });
    }

    // Verifica il JWT
    console.log('🔐 Verifying JWT token');
    
    if (!process.env.JWT_SECRET) {
      console.log('❌ Token verification error: JWT_SECRET is not defined');
      return res.status(500).json({ 
        valid: false,
        error: "Server configuration error" 
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      if (!decoded || !decoded.email) {
        return res.status(401).json({ valid: false, error: 'Invalid token' });
      }

      return res.status(200).json({
        valid: true,
        user: {
          id: decoded.email,
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          role: decoded.role || 'user'
        },
        message: 'Token verified successfully'
      });
    } catch (e) {
      return res.status(401).json({ valid: false, error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('❌ Verify endpoint error:', error);
    return res.status(500).json({ valid: false, error: 'Internal server error' });
  }
});

// Preflight per verify
app.options('/api/auth/verify', (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Catch all per altre API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 API Development Server running on http://localhost:${PORT}`);
  console.log(`📡 Serving API routes for frontend at http://localhost:5173`);
  console.log(`🔐 Admin login: admin@example.com / CHANGE_IN_PRODUCTION`);
});

module.exports = app;

// CORS preflight per apiAuthFirebaseExchange (compatibile con Firebase Functions)
app.options('/apiAuthFirebaseExchange', (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', req.headers['access-control-request-headers'] || 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.status(200).end();
});

// Proxy locale per apiAuthFirebaseExchange -> Firebase Functions
app.post('/apiAuthFirebaseExchange', async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  try {
    const { idToken } = req.body || {};
    if (!idToken || typeof idToken !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing Firebase ID token' });
    }

    const url = 'https://us-central1-palestra-kw8.cloudfunctions.net/apiAuthFirebaseExchange';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': process.env.CORS_ORIGIN || 'http://localhost:5173'
      },
      body: JSON.stringify({ idToken })
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    console.log('🔁 [proxy] apiAuthFirebaseExchange upstream:', {
      status: response.status,
      contentType,
      preview: text.slice(0, 200)
    });

    if (contentType.includes('application/json')) {
      try {
        const data = JSON.parse(text);
        return res.status(response.status).json(data);
      } catch (parseErr) {
        console.error('Errore parse JSON upstream:', parseErr);
        return res.status(502).json({ success: false, message: 'JSON parse error from auth exchange', raw: text });
      }
    }

    // Upstream non ha restituito JSON: incapsula in JSON per il client
    return res.status(response.status).json({
      success: false,
      message: 'Upstream did not return JSON',
      status: response.status,
      contentType,
      raw: text
    });
  } catch (err) {
    console.error('Errore proxy apiAuthFirebaseExchange:', err);
    return res.status(500).json({ success: false, message: 'Errore interno proxy auth exchange' });
  }
});
