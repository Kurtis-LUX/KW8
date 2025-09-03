import * as functions from 'firebase-functions';
import { Request, Response } from 'express';

export const health = functions.https.onRequest(async (req: Request, res: Response) => {
  try {
    // Test delle variabili d'ambiente critiche
    const envVars = {
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? '✅ Presente' : '❌ Mancante',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? '✅ Presente' : '❌ Mancante',
      JWT_SECRET: process.env.JWT_SECRET ? '✅ Presente' : '❌ Mancante',
      AUTHORIZED_EMAIL: process.env.AUTHORIZED_EMAIL ? '✅ Presente' : '❌ Mancante',
      NODE_ENV: process.env.NODE_ENV || 'non impostato',
      FIREBASE: process.env.FIREBASE_CONFIG ? '✅ Ambiente Firebase' : '❌ Non Firebase'
    };

    // Test delle dipendenze
    let dependenciesTest = {};
    try {
      const jwt = await import('jsonwebtoken');
      const { OAuth2Client } = await import('google-auth-library');
      dependenciesTest = {
        jsonwebtoken: '✅ Caricato',
        'google-auth-library': '✅ Caricato'
      };
    } catch (error: any) {
      dependenciesTest = {
        error: `❌ Errore caricamento dipendenze: ${error.message}`
      };
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json({
      success: true,
      message: 'Health check completato',
      timestamp: new Date().toISOString(),
      environment: envVars,
      dependencies: dependenciesTest,
      runtime: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      }
    });

  } catch (error: any) {
    console.error('Errore health check:', error);
    res.setHeader('Content-Type', 'application/json');
    return res.status(500).json({
      success: false,
      message: 'Errore durante health check',
      error: error.message,
      stack: error.stack
    });
  }
});