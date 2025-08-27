// API endpoint per gestire le cartelle di allenamento
import { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCoachRole } from '../middleware/rbac';

// Simulazione di un database (in produzione usare MongoDB, PostgreSQL, etc.)
let workoutFolders: any[] = [];

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
          data: workoutFolders,
          message: 'Cartelle di allenamento recuperate con successo'
        });

      case 'POST':
        const newFolder = {
          id: Date.now().toString(),
          ...req.body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        workoutFolders.push(newFolder);
        return res.status(201).json({
          success: true,
          data: newFolder,
          message: 'Cartella di allenamento creata con successo'
        });

      case 'PUT':
        const { id } = req.query;
        const folderIndex = workoutFolders.findIndex(f => f.id === id);
        if (folderIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Cartella di allenamento non trovata'
          });
        }
        workoutFolders[folderIndex] = {
          ...workoutFolders[folderIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        return res.status(200).json({
          success: true,
          data: workoutFolders[folderIndex],
          message: 'Cartella di allenamento aggiornata con successo'
        });

      case 'DELETE':
        const { id: deleteId } = req.query;
        const deleteIndex = workoutFolders.findIndex(f => f.id === deleteId);
        if (deleteIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Cartella di allenamento non trovata'
          });
        }
        workoutFolders.splice(deleteIndex, 1);
        return res.status(200).json({
          success: true,
          message: 'Cartella di allenamento eliminata con successo'
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

// Proteggi l'endpoint con autenticazione coach
export default requireCoachRole(handler);