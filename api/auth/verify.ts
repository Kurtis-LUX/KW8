// API endpoint per la verifica del token JWT
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

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
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'CORS preflight successful' });
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', ['POST', 'GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    // Estrai il token dall'header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(200).json({ valid: false, message: 'Token mancante o formato non valido' });
    }

    const token = authHeader.substring(7); // Rimuovi 'Bearer '
    
    if (!token) {
      return res.status(200).json({ valid: false, message: 'Token non fornito' });
    }

    // Verifica il token JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    
    const decoded = jwt.verify(token, jwtSecret, {
      issuer: 'kw8-fitness',
      audience: 'kw8-app'
    }) as JWTPayload;

    // Controlla se il token è scaduto
    const currentTime = Math.floor(Date.now() / 1000);
    if (decoded.exp < currentTime) {
      return res.status(200).json({ valid: false, message: 'Token scaduto' });
    }

    // Token valido - restituisci le informazioni dell'utente
    return res.status(200).json({
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      },
      message: 'Token valido'
    });

  } catch (error) {
    console.error('Token verification error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(200).json({ valid: false, message: 'Token non valido' });
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(200).json({ valid: false, message: 'Token scaduto' });
    }
    
    return res.status(200).json({ valid: false, message: 'Errore nella verifica del token' });
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