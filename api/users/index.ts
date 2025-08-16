// API endpoint per gestire gli utenti
import { VercelRequest, VercelResponse } from '@vercel/node';
import { withAdminAuth } from '../middleware/auth';

// Simulazione di un database (in produzione usare MongoDB, PostgreSQL, etc.)
let users: any[] = [];

async function handler(req: VercelRequest & { user?: any }, res: VercelResponse) {
  // Abilita CORS
  const origin = process.env.FRONTEND_URL || 'http://localhost:5173';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'CORS preflight successful' });
  }

  try {
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

      case 'PUT':
        const { id } = req.query;
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Utente non trovato'
          });
        }
        users[userIndex] = {
          ...users[userIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        return res.status(200).json({
          success: true,
          data: users[userIndex],
          message: 'Utente aggiornato con successo'
        });

      case 'DELETE':
        const { id: deleteId } = req.query;
        const deleteIndex = users.findIndex(u => u.id === deleteId);
        if (deleteIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Utente non trovato'
          });
        }
        users.splice(deleteIndex, 1);
        return res.status(200).json({
          success: true,
          message: 'Utente eliminato con successo'
        });

      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({ 
          success: false,
          error: `Method ${req.method} Not Allowed` 
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Internal Server Error' 
    });
  }
}

// Proteggi l'endpoint con autenticazione admin
export default withAdminAuth(handler);