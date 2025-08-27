// API endpoint per l'autenticazione sicura con JWT
import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// Simulazione di un database con password hashate
// In produzione, questi dati dovrebbero essere recuperati dal database MongoDB
let users: any[] = [
  {
    id: 'admin-1',
    email: 'admin@example.com',
    // Password placeholder - CHANGE IN PRODUCTION
    password: '$2a$10$PLACEHOLDER_HASH_CHANGE_IN_PRODUCTION',
    name: 'Amministratore',
    role: 'admin'
  }
];

// Funzione per inizializzare l'admin con password hashata
const initializeAdmin = async () => {
  const hashedPassword = await bcrypt.hash('CHANGE_IN_PRODUCTION', 10);
  users[0].password = hashedPassword;
};

// Promise per tracciare l'inizializzazione
let initPromise: Promise<void> | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Assicurati che l'inizializzazione sia completata
  if (!initPromise) {
    initPromise = initializeAdmin();
  }
  await initPromise;
  // Abilita CORS con configurazioni più sicure
  const allowedOrigins = [
    'http://localhost:5173',
    'https://kw8-fitness.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean);
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'CORS preflight successful' });
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Trova l'utente
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verifica la password usando bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Genera JWT token
    const jwtSecret = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      jwtSecret,
      { 
        expiresIn: '24h',
        issuer: 'kw8-fitness',
        audience: 'kw8-users'
      }
    );

    // Rimuovi la password dalla risposta
    const { password: _, ...userWithoutPassword } = user;

    return res.status(200).json({
      user: userWithoutPassword,
      token,
      message: 'Login successful',
      expiresIn: '24h'
    });

  } catch (error) {
    console.error('Login API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}