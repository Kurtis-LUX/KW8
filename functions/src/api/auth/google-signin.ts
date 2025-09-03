import { onRequest } from 'firebase-functions/v2/https';
import { Request, Response } from 'express';
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

// Load environment variables
require('dotenv').config();

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || 'https://palestra-kw8.web.app',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Credentials': 'true'
};

// Funzione per verificare il token Google
async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<any> {
  try {
    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: clientId,
    });
    
    const payload = ticket.getPayload();
    if (!payload || !payload.email || !payload.email_verified) {
      throw new Error('Token non valido');
    }
    
    return payload;
  } catch (error: any) {
    throw new Error(`Verifica token fallita: ${error.message}`);
  }
}

// Funzione per validare l'email autorizzata
function validateAuthorizedEmail(email: string): boolean {
  const authorizedEmail = process.env.AUTHORIZED_EMAIL;
  
  if (!authorizedEmail) {
    console.error('AUTHORIZED_EMAIL non configurato');
    return false;
  }
  
  const normalizedEmail = email.toLowerCase().trim();
  const authorizedEmails = authorizedEmail
    .split(',')
    .map((email: string) => email.toLowerCase().trim())
    .filter((email: string) => email.length > 0);
  
  console.log('Verifica autorizzazione:', {
    email: normalizedEmail,
    authorizedEmails: authorizedEmails,
    isAuthorized: authorizedEmails.includes(normalizedEmail)
  });
  
  return authorizedEmails.includes(normalizedEmail);
}

// Firebase Functions Gen2 HTTPS endpoint
export const apiAuthGoogleSignin = onRequest(
  {
    cors: [process.env.CORS_ORIGIN || 'https://palestra-kw8.web.app'],
    maxInstances: 5,
    timeoutSeconds: 30,
    memory: '256MiB'
  },
  async (req: Request, res: Response): Promise<void> => {
    const requestId = Math.random().toString(36).substring(7);
    console.log(`[${requestId}] Google Sign-In request:`, {
      method: req.method,
      origin: req.headers.origin,
      userAgent: req.headers['user-agent']
    });

    res.setHeader('Content-Type', 'application/json');
    
    try {
      // Gestione CORS preflight
      if (req.method === 'OPTIONS') {
        console.log(`[${requestId}] Gestione preflight CORS`);
        res.status(200)
          .setHeader('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin'])
          .setHeader('Access-Control-Allow-Methods', corsHeaders['Access-Control-Allow-Methods'])
          .setHeader('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers'])
          .setHeader('Access-Control-Allow-Credentials', corsHeaders['Access-Control-Allow-Credentials'])
          .json({ success: true, message: 'CORS preflight successful' });
        return;
      }

      // Imposta headers CORS per tutte le risposte
      Object.entries(corsHeaders).forEach(([key, value]) => {
        res.setHeader(key, value);
      });

      if (req.method !== 'POST') {
        console.log(`[${requestId}] Metodo non consentito: ${req.method}`);
        res.status(405).json({ 
          success: false, 
          message: 'Metodo non consentito',
          error: 'METHOD_NOT_ALLOWED'
        });
        return;
      }

      const { credential } = req.body;
      if (!credential) {
        console.log(`[${requestId}] Credential mancante`);
        res.status(400).json({
          success: false,
          message: 'Credential mancante',
          error: 'MISSING_CREDENTIAL'
        });
        return;
      }

      // Ottieni configurazione dalle variabili d'ambiente
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const jwtSecret = process.env.JWT_SECRET;
      
      if (!clientId || !jwtSecret) {
        console.error(`[${requestId}] Configurazione mancante:`, { 
          hasClientId: !!clientId, 
          hasJwtSecret: !!jwtSecret 
        });
        res.status(500).json({
          success: false,
          message: 'Configurazione server incompleta',
          error: 'MISSING_CONFIG'
        });
        return;
      }

      // Verifica token Google
      console.log(`[${requestId}] Verifica token Google...`);
      const payload = await verifyGoogleIdToken(credential, clientId);
      const email = payload.email;
      
      console.log(`[${requestId}] Token verificato per email: ${email}`);

      // Verifica email autorizzata
      if (!validateAuthorizedEmail(email)) {
        console.log(`[${requestId}] Email non autorizzata: ${email}`);
        res.status(403).json({
          success: false,
          message: 'Email non autorizzata',
          error: 'UNAUTHORIZED_EMAIL'
        });
        return;
      }

      // Genera JWT
      const user = {
        userId: payload.sub,
        email: payload.email,
        name: payload.name,
        role: 'coach'
      };

      const token = jwt.sign(
        { 
          userId: user.userId,
          email: user.email,
          role: user.role,
          name: user.name
        },
        jwtSecret,
        {
          expiresIn: '24h',
          issuer: 'kw8-fitness',
          audience: 'kw8-app'
        }
      );

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      console.log(`[${requestId}] Autenticazione completata con successo per: ${email}`);
      
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
          expiresAt: expiresAt.toISOString(),
          tokenType: 'Bearer'
        }
      });

    } catch (error: any) {
      console.error(`[${requestId}] Errore Google Sign-In:`, error);
      
      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json');
      }
      
      res.status(500).json({
        success: false,
        message: 'Errore interno del server durante l\'autenticazione',
        error: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);