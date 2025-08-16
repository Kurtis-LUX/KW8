// Server di sviluppo per servire le API routes localmente
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Simulazione database condiviso per tutte le API
let users = [];
let workoutPlans = [];
let workoutFolders = [];
let adminUsers = [
  {
    id: '1',
    email: 'kw8@gmail.com',
    password: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // kw8@182
    role: 'admin',
    nome: 'Admin',
    cognome: 'KW8'
  }
];

// Utility per generare JWT (semplificato per sviluppo)
const generateToken = (user) => {
  return Buffer.from(JSON.stringify({
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 ore
  })).toString('base64');
};

// Utility per verificare password (semplificato)
const verifyPassword = (password, hash) => {
  // Per sviluppo, accetta sia la password in chiaro che l'hash
  return password === 'kw8@182' || password === hash;
};

// Auth endpoints
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password sono richiesti' });
    }
    
    const user = adminUsers.find(u => u.email === email);
    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }
    
    const token = generateToken(user);
    
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        nome: user.nome,
        cognome: user.cognome
      },
      token,
      message: 'Login effettuato con successo',
      expiresIn: '24h'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Errore interno del server' });
  }
});

app.post('/api/auth/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false, message: 'Token mancante' });
    }
    
    const token = authHeader.substring(7);
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    
    if (decoded.exp < Date.now()) {
      return res.status(401).json({ valid: false, message: 'Token scaduto' });
    }
    
    res.status(200).json({
      valid: true,
      user: {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role
      },
      message: 'Token valido'
    });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Token non valido' });
  }
});

// Users endpoints
app.all('/api/users', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'CORS preflight successful' });
  }
  
  switch (req.method) {
    case 'GET':
      return res.status(200).json({
        success: true,
        data: users,
        message: 'Utenti recuperati con successo'
      });
    case 'POST':
      const newUser = {
        id: Date.now().toString(),
        ...req.body,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      users.push(newUser);
      return res.status(201).json({
        success: true,
        data: newUser,
        message: 'Utente creato con successo'
      });
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'development'
  });
});

// Catch all per altre API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Avvia il server
app.listen(PORT, () => {
  console.log(`🚀 API Development Server running on http://localhost:${PORT}`);
  console.log(`📡 Serving API routes for frontend at http://localhost:5173`);
  console.log(`🔐 Admin login: kw8@gmail.com / kw8@182`);
});

module.exports = app;