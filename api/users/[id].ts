// API endpoint per operazioni su singoli utenti
import { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCoachAuth } from '../middleware/rbac';

// Simulazione di un database (in produzione usare MongoDB, PostgreSQL, etc.)
let users: any[] = [];

async function handler(req: VercelRequest & { user?: any }, res: VercelResponse) {
  // CORS gestito dal middleware RBAC

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const user = users.find(u => u.id === id);
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        return res.status(200).json(user);

      case 'PUT':
        const userIndex = users.findIndex(u => u.id === id);
        if (userIndex === -1) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        const updatedUser = {
          ...users[userIndex],
          ...req.body,
          id, // Mantieni l'ID originale
          updatedAt: new Date().toISOString()
        };
        
        users[userIndex] = updatedUser;
        return res.status(200).json(updatedUser);

      case 'DELETE':
        const deleteIndex = users.findIndex(u => u.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        users.splice(deleteIndex, 1);
        return res.status(200).json({ message: 'User deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

// Proteggi l'endpoint con autenticazione coach
export default requireCoachAuth(handler);