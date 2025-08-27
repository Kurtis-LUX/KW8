// Sistema di token temporanei per accesso utenti alle schede
import { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { requireCoachRole } from '../middleware/rbac';

interface TempTokenData {
  token: string;
  userId: string;
  userName: string;
  allowedResources: string[]; // ID delle schede/programmi accessibili
  expiresAt: number;
  createdAt: number;
  createdBy: string; // Email del coach che ha creato il token
  usageCount: number;
  maxUsage: number;
  isActive: boolean;
}

interface CreateTempTokenRequest {
  userId: string;
  userName: string;
  allowedResources: string[];
  expiryHours?: number; // Default 24 ore
  maxUsage?: number; // Default 10 utilizzi
}

// Storage temporaneo per i token (in produzione usare Redis o database)
const tempTokenStorage = new Map<string, TempTokenData>();

// Genera token temporaneo sicuro
const generateTempToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Genera ID utente univoco
const generateUserId = (): string => {
  return `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
};

// Pulisci token scaduti
const cleanupExpiredTokens = (): void => {
  const now = Date.now();
  for (const [token, data] of tempTokenStorage.entries()) {
    if (data.expiresAt < now || !data.isActive) {
      tempTokenStorage.delete(token);
    }
  }
};

// API per creare token temporaneo (solo coach)
export const createTempToken = requireCoachRole(async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const {
      userId,
      userName,
      allowedResources,
      expiryHours = 24,
      maxUsage = 10
    }: CreateTempTokenRequest = req.body;

    // Validazione input
    if (!userName || !allowedResources || !Array.isArray(allowedResources)) {
      return res.status(400).json({
        success: false,
        message: 'Nome utente e risorse consentite sono richiesti'
      });
    }

    if (allowedResources.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Almeno una risorsa deve essere specificata'
      });
    }

    if (expiryHours < 1 || expiryHours > 168) { // Max 7 giorni
      return res.status(400).json({
        success: false,
        message: 'Scadenza deve essere tra 1 e 168 ore (7 giorni)'
      });
    }

    if (maxUsage < 1 || maxUsage > 100) {
      return res.status(400).json({
        success: false,
        message: 'Utilizzi massimi devono essere tra 1 e 100'
      });
    }

    // Pulisci token scaduti
    cleanupExpiredTokens();

    // Genera token e dati
    const token = generateTempToken();
    const finalUserId = userId || generateUserId();
    const user = (req as any).user;
    
    const tokenData: TempTokenData = {
      token,
      userId: finalUserId,
      userName: userName.trim(),
      allowedResources: allowedResources.map(r => r.toString()),
      expiresAt: Date.now() + (expiryHours * 60 * 60 * 1000),
      createdAt: Date.now(),
      createdBy: user.email,
      usageCount: 0,
      maxUsage,
      isActive: true
    };

    // Salva token
    tempTokenStorage.set(token, tokenData);

    // Log per sviluppo
    console.log(`🎫 Token temporaneo creato per ${userName} da ${user.email}`);

    return res.status(201).json({
      success: true,
      message: 'Token temporaneo creato con successo',
      data: {
        token,
        userId: finalUserId,
        userName,
        allowedResources,
        expiresAt: new Date(tokenData.expiresAt).toISOString(),
        maxUsage,
        accessUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/user/${token}`
      }
    });

  } catch (error) {
    console.error('Create temp token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
});

// API per verificare token temporaneo
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Abilita CORS
  const allowedOrigins = [
    'http://localhost:5173',
    'https://kw8-fitness.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Temp-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'CORS preflight successful' });
  }

  if (req.method === 'POST') {
    return createTempToken(req, res);
  }

  if (req.method === 'GET') {
    return verifyTempToken(req, res);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
}

// Verifica token temporaneo
const verifyTempToken = async (req: VercelRequest, res: VercelResponse) => {
  try {
    const token = req.query.token as string || req.headers['x-temp-token'] as string;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token temporaneo richiesto'
      });
    }

    // Pulisci token scaduti
    cleanupExpiredTokens();

    // Trova token
    const tokenData = tempTokenStorage.get(token);

    if (!tokenData) {
      return res.status(404).json({
        success: false,
        message: 'Token temporaneo non trovato o scaduto'
      });
    }

    // Verifica scadenza
    const now = Date.now();
    if (tokenData.expiresAt < now) {
      tempTokenStorage.delete(token);
      return res.status(410).json({
        success: false,
        message: 'Token temporaneo scaduto'
      });
    }

    // Verifica se è attivo
    if (!tokenData.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Token temporaneo disattivato'
      });
    }

    // Verifica utilizzi massimi
    if (tokenData.usageCount >= tokenData.maxUsage) {
      tokenData.isActive = false;
      return res.status(429).json({
        success: false,
        message: 'Token temporaneo ha raggiunto il limite di utilizzi'
      });
    }

    // Incrementa contatore utilizzi
    tokenData.usageCount++;
    tempTokenStorage.set(token, tokenData);

    return res.status(200).json({
      success: true,
      message: 'Token temporaneo valido',
      data: {
        userId: tokenData.userId,
        userName: tokenData.userName,
        allowedResources: tokenData.allowedResources,
        expiresAt: new Date(tokenData.expiresAt).toISOString(),
        usageCount: tokenData.usageCount,
        maxUsage: tokenData.maxUsage,
        remainingUsage: tokenData.maxUsage - tokenData.usageCount
      }
    });

  } catch (error) {
    console.error('Verify temp token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
};

// API per elencare token temporanei (solo coach)
export const listTempTokens = requireCoachRole(async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // Pulisci token scaduti
    cleanupExpiredTokens();

    const user = (req as any).user;
    const tokens = Array.from(tempTokenStorage.values())
      .filter(token => token.createdBy === user.email)
      .map(token => ({
        token: token.token,
        userId: token.userId,
        userName: token.userName,
        allowedResources: token.allowedResources,
        expiresAt: new Date(token.expiresAt).toISOString(),
        createdAt: new Date(token.createdAt).toISOString(),
        usageCount: token.usageCount,
        maxUsage: token.maxUsage,
        isActive: token.isActive,
        remainingUsage: token.maxUsage - token.usageCount
      }));

    return res.status(200).json({
      success: true,
      message: `Trovati ${tokens.length} token temporanei`,
      data: tokens
    });

  } catch (error) {
    console.error('List temp tokens error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
});

// API per disattivare token temporaneo (solo coach)
export const deactivateTempToken = requireCoachRole(async (req: VercelRequest, res: VercelResponse) => {
  try {
    if (req.method !== 'DELETE') {
      res.setHeader('Allow', ['DELETE']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token richiesto'
      });
    }

    const tokenData = tempTokenStorage.get(token);

    if (!tokenData) {
      return res.status(404).json({
        success: false,
        message: 'Token non trovato'
      });
    }

    const user = (req as any).user;
    
    // Verifica che il coach possa disattivare questo token
    if (tokenData.createdBy !== user.email) {
      return res.status(403).json({
        success: false,
        message: 'Non autorizzato a disattivare questo token'
      });
    }

    // Disattiva token
    tokenData.isActive = false;
    tempTokenStorage.set(token, tokenData);

    return res.status(200).json({
      success: true,
      message: 'Token temporaneo disattivato con successo'
    });

  } catch (error) {
    console.error('Deactivate temp token error:', error);
    return res.status(500).json({
      success: false,
      message: 'Errore interno del server'
    });
  }
});

// Funzione helper per verificare token temporaneo (usata dal middleware)
export const verifyTempTokenHelper = async (token: string): Promise<TempTokenData | null> => {
  cleanupExpiredTokens();
  
  const tokenData = tempTokenStorage.get(token);
  
  if (!tokenData || !tokenData.isActive || tokenData.expiresAt < Date.now()) {
    return null;
  }
  
  if (tokenData.usageCount >= tokenData.maxUsage) {
    tokenData.isActive = false;
    return null;
  }
  
  return tokenData;
};

// Export dei tipi
export type { TempTokenData, CreateTempTokenRequest };