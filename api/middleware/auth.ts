import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

// Interfaccia per il payload JWT
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// Estende la Request per includere user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

// Middleware per verificare il token JWT
export const authenticateToken = (req: VercelRequest & { user?: JWTPayload }, res: VercelResponse, next?: () => void) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Token di accesso richiesto' 
    });
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Verifica scadenza token
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token scaduto' 
      });
    }

    req.user = decoded;
    
    if (next) {
      next();
    }
    
    return true;
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Token non valido' 
    });
  }
};

// Middleware per verificare i privilegi di amministratore
export const requireAdmin = (req: VercelRequest & { user?: JWTPayload }, res: VercelResponse, next?: () => void) => {
  // Prima verifica il token
  const tokenValid = authenticateToken(req, res);
  
  if (tokenValid !== true) {
    return; // authenticateToken ha già inviato la risposta di errore
  }

  // Verifica il ruolo admin
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Accesso negato: privilegi di amministratore richiesti' 
    });
  }

  if (next) {
    next();
  }
  
  return true;
};

// Utility per estrarre e verificare il token senza middleware
export const verifyTokenFromRequest = (req: VercelRequest): JWTPayload | null => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return null;
  }

  const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';

  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
    
    // Verifica scadenza
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return null;
    }

    return decoded;
  } catch (error) {
    return null;
  }
};

// Helper per controllare se l'utente è admin
export const isAdmin = (user: JWTPayload | null): boolean => {
  return user !== null && user.role === 'admin';
};

// Wrapper per API routes protette
export const withAuth = (handler: (req: VercelRequest & { user?: JWTPayload }, res: VercelResponse) => Promise<void> | void) => {
  return async (req: VercelRequest & { user?: JWTPayload }, res: VercelResponse) => {
    const tokenValid = authenticateToken(req, res);
    
    if (tokenValid === true) {
      return handler(req, res);
    }
    // Se tokenValid non è true, authenticateToken ha già inviato la risposta di errore
  };
};

// Wrapper per API routes che richiedono privilegi admin
export const withAdminAuth = (handler: (req: VercelRequest & { user?: JWTPayload }, res: VercelResponse) => Promise<void> | void) => {
  return async (req: VercelRequest & { user?: JWTPayload }, res: VercelResponse) => {
    const adminValid = requireAdmin(req, res);
    
    if (adminValid === true) {
      return handler(req, res);
    }
    // Se adminValid non è true, requireAdmin ha già inviato la risposta di errore
  };
};