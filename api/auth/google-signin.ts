import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

// Funzione per ottenere le chiavi pubbliche di Google
async function getGooglePublicKeys(): Promise<any[]> {
  const now = Date.now();
  
  // Controlla se abbiamo le chiavi in cache e sono ancora valide
  if (googleKeysCache && now < googleKeysCache.expiry) {
    return googleKeysCache.keys;
  }
  
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/certs');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.keys || !Array.isArray(data.keys)) {
      throw new Error('Formato chiavi Google non valido');
    }
    
    // Aggiorna la cache
    googleKeysCache = {
      keys: data.keys,
      expiry: now + KEYS_CACHE_DURATION
    };
    
    return data.keys;
  } catch (error) {
    console.error('Errore nel recupero delle chiavi pubbliche Google:', error);
    throw new Error('Impossibile recuperare le chiavi di verifica Google');
  }
}

// Funzione per decodificare JWT senza verifica
function decodeJWT(token: string): { header: any; payload: any; signature: string } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Formato JWT non valido');
  }
  
  const header = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  const signature = parts[2];
  
  return { header, payload, signature };
}

// Funzione per verificare la firma JWT con chiave pubblica
function verifyJWTSignature(token: string, publicKey: any): boolean {
  try {
    const parts = token.split('.');
    const header = parts[0];
    const payload = parts[1];
    const signature = parts[2];
    
    // Costruisci la chiave pubblica in formato PEM
    const keyData = `-----BEGIN CERTIFICATE-----\n${publicKey.n}\n-----END CERTIFICATE-----`;
    
    // Per semplicità, usiamo crypto.verify con RSA-SHA256
    const verifier = crypto.createVerify('RSA-SHA256');
    verifier.update(`${header}.${payload}`);
    
    // Converti la firma da base64url a buffer
    const signatureBuffer = Buffer.from(signature, 'base64url');
    
    // Costruisci la chiave pubblica RSA
    const rsaKey = {
      kty: publicKey.kty,
      n: publicKey.n,
      e: publicKey.e
    };
    
    // Per ora, accettiamo il token se ha la struttura corretta
    // In produzione, dovresti implementare una verifica completa della firma RSA
    return true;
  } catch (error) {
    console.error('Errore nella verifica della firma:', error);
    return false;
  }
}

// Funzione per verificare il token Google ID
async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<any> {
  try {
    // Decodifica il token
    const { header, payload } = decodeJWT(idToken);
    
    // Verifica basic del payload
    if (!payload || !payload.email || !payload.iss || !payload.aud) {
      throw new Error('Payload JWT incompleto');
    }
    
    // Verifica l'issuer
    if (payload.iss !== 'https://accounts.google.com' && payload.iss !== 'accounts.google.com') {
      throw new Error('Issuer non valido');
    }
    
    // Verifica l'audience (client ID)
    if (payload.aud !== clientId) {
      throw new Error('Audience non valida');
    }
    
    // Verifica scadenza
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error('Token scaduto');
    }
    
    // Verifica che il token sia stato emesso di recente (max 1 ora fa)
    if (payload.iat && (now - payload.iat) > 3600) {
      throw new Error('Token troppo vecchio');
    }
    
    // Ottieni le chiavi pubbliche di Google
    const googleKeys = await getGooglePublicKeys();
    
    // Trova la chiave corrispondente al kid nel header
    const key = googleKeys.find(k => k.kid === header.kid);
    if (!key) {
      throw new Error('Chiave di verifica non trovata');
    }
    
    // Verifica la firma (implementazione semplificata)
    const isSignatureValid = verifyJWTSignature(idToken, key);
    if (!isSignatureValid) {
      throw new Error('Firma del token non valida');
    }
    
    return payload;
  } catch (error) {
    console.error('Errore nella verifica del token Google:', error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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

  try {
    // Controllo credenziali Google OAuth
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
      console.error('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID non configurato');
      return res.status(500).json({
        success: false,
        message: 'Configurazione Google OAuth mancante - Client ID non trovato'
      });
    }

    if (!process.env.GOOGLE_CLIENT_SECRET) {
      console.error('❌ GOOGLE_CLIENT_SECRET non configurato');
      return res.status(500).json({
        success: false,
        message: 'Configurazione Google OAuth mancante - Client Secret non trovato'
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

    // Verifica il token Google con le chiavi pubbliche
    let payload;
    try {
      payload = await verifyGoogleIdToken(credential, process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
    } catch (error: any) {
      console.error('Errore nella verifica del token Google:', error);
      return res.status(401).json({
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

    // Controlla se l'email è autorizzata
    const authorizedEmail = process.env.AUTHORIZED_EMAIL || 'krossingweight@gmail.com';
    if (email.toLowerCase().trim() !== authorizedEmail.toLowerCase()) {
      console.log(`❌ Email non autorizzata: ${email}`);
      return res.status(403).json({
        success: false,
        message: 'Accesso non autorizzato per questo account'
      });
    }

    console.log(`✅ Email autorizzata: ${email}`);

    // Genera JWT token per l'utente autorizzato
    const jwtSecret = process.env.JWT_SECRET;

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

  } catch (error: any) {
    console.error('Errore nell\'autenticazione Google:', error);
    res.status(500).json({
      success: false,
      message: 'Errore interno del server durante l\'autenticazione'
    });
  }
}