import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

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
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minuti
const MAX_ATTEMPTS = 5; // Massimo 5 tentativi per IP

// Inizializza Google OAuth2 Client
const client = new OAuth2Client(process.env.VITE_GOOGLE_CLIENT_ID);

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Gestione CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
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

  // Controllo credenziali Google OAuth
  if (!process.env.VITE_GOOGLE_CLIENT_ID) {
    console.error('❌ VITE_GOOGLE_CLIENT_ID non configurato');
    return res.status(500).json({
      success: false,
      message: 'Configurazione Google OAuth mancante - Client ID non trovato'
    });
  }

  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET non configurato');
    return res.status(500).json({
      success: false,
      message: 'Configurazione server mancante - JWT Secret non trovato'
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
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.VITE_GOOGLE_CLIENT_ID
      });
      payload = ticket.getPayload();
      
      // Validazioni aggiuntive del payload
      if (!payload) {
        throw new Error('Payload vuoto');
      }
      
      // Verifica che il token non sia scaduto (controllo aggiuntivo)
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp && payload.exp < now) {
        throw new Error('Token scaduto');
      }
      
      // Verifica che il token sia stato emesso di recente (max 1 ora fa)
      if (payload.iat && (now - payload.iat) > 3600) {
        throw new Error('Token troppo vecchio');
      }
      
    } catch (error) {
      console.error('Errore nella verifica del token Google:', error);
      return res.status(400).json({
        success: false,
        message: 'Token Google non valido o scaduto'
      });
    }

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
    const jwtSecret = process.env.JWT_SECRET!; // Già verificato all'inizio

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
          name: user.name
        },
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        tokenType: 'Bearer'
      }
    });

  } catch (error) {
    console.error('Errore nell\'autenticazione Google:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
}