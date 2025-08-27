// Middleware RBAC (Role-Based Access Control) per proteggere gli endpoint API
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  email: string;
  role: 'coach' | 'user';
  iat: number;
  exp: number;
}

interface AuthenticatedRequest extends VercelRequest {
  user?: JWTPayload;
}

// Configurazione JWT
const JWT_SECRET = process.env.JWT_SECRET || 'kw8-fitness-secret-key-2025';

// Lista email coach autorizzate
const getAuthorizedCoaches = (): string[] => {
  return [
    'admin@kw8fitness.com',
    'coach@kw8fitness.com',
    'giuseppe@kw8fitness.com',
    'saverio@kw8fitness.com',
    process.env.ADMIN_EMAIL
  ].filter(Boolean).map(email => email.toLowerCase());
};

// Verifica e decodifica JWT
export const verifyJWT = (token: string): JWTPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'kw8-fitness',
      audience: 'kw8-app'
    }) as JWTPayload;
    
    return decoded;
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

// Middleware di autenticazione base
export const requireAuth = (handler: Function) => {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    try {
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
      
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        return res.status(200).json({ message: 'CORS preflight successful' });
      }

      // Estrai token dall'header Authorization
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token di autenticazione richiesto',
          code: 'AUTH_TOKEN_MISSING'
        });
      }
      
      const token = authHeader.substring(7); // Rimuovi "Bearer "
      const decoded = verifyJWT(token);
      
      if (!decoded) {
        return res.status(401).json({
          success: false,
          message: 'Token non valido o scaduto',
          code: 'AUTH_TOKEN_INVALID'
        });
      }
      
      // Aggiungi informazioni utente alla request
      req.user = decoded;
      
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore di autenticazione interno',
        code: 'AUTH_INTERNAL_ERROR'
      });
    }
  };
};

// Middleware per richiedere ruolo coach
export const requireCoachRole = (handler: Function) => {
  return requireAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato',
          code: 'AUTH_USER_MISSING'
        });
      }
      
      // Verifica ruolo coach
      if (user.role !== 'coach') {
        return res.status(403).json({
          success: false,
          message: 'Accesso negato. Ruolo coach richiesto.',
          code: 'AUTH_INSUFFICIENT_ROLE',
          userRole: user.role,
          requiredRole: 'coach'
        });
      }
      
      // Verifica che l'email sia nella lista coach autorizzate
      const authorizedCoaches = getAuthorizedCoaches();
      if (!authorizedCoaches.includes(user.email.toLowerCase())) {
        return res.status(403).json({
          success: false,
          message: 'Email non autorizzata per l\'accesso coach',
          code: 'AUTH_EMAIL_NOT_AUTHORIZED'
        });
      }
      
      return handler(req, res);
    } catch (error) {
      console.error('Coach role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore di autorizzazione interno',
        code: 'AUTH_ROLE_INTERNAL_ERROR'
      });
    }
  });
};

// Middleware per richiedere ruolo admin (se necessario)
export const requireAdminRole = (handler: Function) => {
  return requireAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    try {
      const user = req.user;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Utente non autenticato',
          code: 'AUTH_USER_MISSING'
        });
      }
      
      // Verifica ruolo admin o coach con privilegi elevati
      const adminEmails = [
        'admin@kw8fitness.com',
        process.env.ADMIN_EMAIL
      ].filter(Boolean).map(email => email.toLowerCase());
      
      const isAdmin = user.role === 'coach' && adminEmails.includes(user.email.toLowerCase());
      
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          message: 'Accesso negato. Privilegi amministratore richiesti.',
          code: 'AUTH_INSUFFICIENT_PRIVILEGES',
          userRole: user.role,
          requiredRole: 'admin'
        });
      }
      
      return handler(req, res);
    } catch (error) {
      console.error('Admin role middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore di autorizzazione interno',
        code: 'AUTH_ADMIN_INTERNAL_ERROR'
      });
    }
  });
};

// Middleware per accesso misto (coach o token temporaneo)
export const requireCoachOrTempToken = (handler: Function) => {
  return async (req: AuthenticatedRequest, res: VercelResponse) => {
    try {
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
      
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Temp-Token');
      res.setHeader('Access-Control-Allow-Credentials', 'true');

      if (req.method === 'OPTIONS') {
        return res.status(200).json({ message: 'CORS preflight successful' });
      }

      // Controlla prima se c'è un token coach valido
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const decoded = verifyJWT(token);
        
        if (decoded && decoded.role === 'coach') {
          req.user = decoded;
          return handler(req, res);
        }
      }
      
      // Se non c'è token coach, controlla token temporaneo
      const tempToken = req.headers['x-temp-token'] as string;
      
      if (tempToken) {
        // Verifica token temporaneo (implementazione da completare)
        // Per ora, accetta qualsiasi token temporaneo valido
        const isValidTempToken = await verifyTempToken(tempToken);
        
        if (isValidTempToken) {
          // Aggiungi informazioni token temporaneo
          (req as any).tempToken = tempToken;
          return handler(req, res);
        }
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token di autenticazione o token temporaneo richiesto',
        code: 'AUTH_TOKEN_REQUIRED'
      });
      
    } catch (error) {
      console.error('Mixed auth middleware error:', error);
      return res.status(500).json({
        success: false,
        message: 'Errore di autenticazione interno',
        code: 'AUTH_MIXED_INTERNAL_ERROR'
      });
    }
  };
};

// Funzione helper per verificare token temporanei
const verifyTempToken = async (token: string): Promise<boolean> => {
  try {
    // Token temporanei non più supportati
    console.warn('Temp tokens are no longer supported');
    return false;
  } catch (error) {
    console.error('Temp token verification error:', error);
    return false;
  }
};

// Utility per estrarre informazioni utente dalla request
export const getUserFromRequest = (req: AuthenticatedRequest): JWTPayload | null => {
  return req.user || null;
};

// Utility per verificare se l'utente ha un ruolo specifico
export const hasRole = (req: AuthenticatedRequest, role: 'coach' | 'user'): boolean => {
  const user = getUserFromRequest(req);
  return user?.role === role;
};

// Utility per verificare se l'utente è coach
export const isCoach = (req: AuthenticatedRequest): boolean => {
  return hasRole(req, 'coach');
};

// Export dei tipi
export type { JWTPayload, AuthenticatedRequest };