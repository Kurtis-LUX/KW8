const jwt = require('jsonwebtoken');

// Simulazione di validazione Google per ambiente di sviluppo
// In produzione, usare google-auth-library
function validateGoogleToken(credential) {
  return new Promise((resolve, reject) => {
    // Validazione base del formato JWT
    if (!credential || typeof credential !== 'string') {
      return reject(new Error('Token non valido'));
    }
    
    // Controlla che sia un JWT (3 parti separate da punti)
    const parts = credential.split('.');
    if (parts.length !== 3) {
      return reject(new Error('Formato JWT non valido'));
    }
    
    try {
      // Decodifica il payload (senza verifica della firma per i test)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      
      // Validazioni di sicurezza
      if (!payload.email || !payload.email_verified) {
        return reject(new Error('Email non verificata'));
      }
      
      if (!payload.aud || payload.aud !== process.env.VITE_GOOGLE_CLIENT_ID) {
        return reject(new Error('Audience non valida'));
      }
      
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        return reject(new Error('Token scaduto'));
      }
      
      if (payload.iat && (now - payload.iat) > 3600) {
        return reject(new Error('Token troppo vecchio'));
      }
      
      resolve(payload);
    } catch (error) {
      reject(new Error('Errore nella decodifica del token: ' + error.message));
    }
  });
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'http://localhost:5173',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
};

// Email autorizzata per l'accesso coach
const AUTHORIZED_COACH_EMAIL = 'krossingweight@gmail.com';

// Rate limiting semplice (in memoria)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minuti
const MAX_ATTEMPTS = 5; // Massimo 5 tentativi per IP

// Il client OAuth2 viene inizializzato dinamicamente nella funzione initGoogleAuth

// Funzione per controllare rate limiting
function checkRateLimit(ip) {
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

module.exports = function handler(req, res) {
  // Gestione CORS
  if (req.method === 'OPTIONS') {
    return res.status(200)
      .setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
      .setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods'])
      .setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers'])
      .setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials'])
      .end();
  }

  // Imposta headers CORS per tutte le risposte
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      message: 'Metodo non consentito' 
    });
  }

  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.socket?.remoteAddress || 'unknown';
  const ip = Array.isArray(clientIP) ? clientIP[0] : clientIP;
  
  if (!checkRateLimit(ip)) {
    console.log(`🚫 Rate limit superato per IP: ${ip}`);
    return res.status(429).json({
      success: false,
      message: 'Troppi tentativi di accesso. Riprova tra 15 minuti.'
    });
  }

  try {
    const { credential } = req.body;

    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Credential Google richiesto e deve essere una stringa'
      });
    }

    // Validazione lunghezza token (i token JWT Google sono tipicamente lunghi)
    if (credential.length < 100 || credential.length > 2048) {
      return res.status(400).json({
        success: false,
        message: 'Formato credential non valido'
      });
    }

    // Verifica il token Google
    validateGoogleToken(credential)
      .then(payload => {
        handleTokenValidation(req, res, payload);
      })
      .catch(error => {
        console.error('Errore nella verifica del token Google:', error);
        return res.status(400).json({
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
};

function handleTokenValidation(req, res, payload) {
  try {
    if (!payload || !payload.email) {
      return res.status(400).json({
        success: false,
        message: 'Impossibile ottenere informazioni dall\'account Google'
      });
    }

    const email = payload.email;
    
    // Validazioni aggiuntive dell'email
    if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
      return res.status(400).json({
        success: false,
        message: 'Formato email non valido'
      });
    }
    
    // Verifica che l'email sia verificata da Google
    if (!payload.email_verified) {
      console.log(`❌ Email non verificata: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Account Google non verificato'
      });
    }
    
    console.log(`🔐 Tentativo di accesso Google: ${email}`);

    // Controlla se l'email è autorizzata (case-insensitive per sicurezza)
    if (email.toLowerCase().trim() !== AUTHORIZED_COACH_EMAIL.toLowerCase()) {
      console.log(`❌ Email non autorizzata: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Accesso non autorizzato per questo account'
      });
    }

    console.log(`✅ Email autorizzata: ${email}`);

    // Genera JWT token per l'utente autorizzato
    const jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
    
    const user = {
      id: email,
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
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
          picture: user.picture
        },
        expiresIn: '24h'
      }
    });
  } catch (error) {
    console.error('Errore durante l\'autenticazione Google:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server durante l\'autenticazione'
    });
  }
}