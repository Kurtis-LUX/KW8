// API endpoint per operazioni su singole cartelle di allenamento
import { VercelRequest, VercelResponse } from '@vercel/node';

// Simulazione di un database (in produzione usare MongoDB, PostgreSQL, etc.)
let workoutFolders: any[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Abilita CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).json({ message: 'CORS preflight successful' });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Workout folder ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const folder = workoutFolders.find(f => f.id === id);
        if (!folder) {
          return res.status(404).json({ error: 'Workout folder not found' });
        }
        return res.status(200).json(folder);

      case 'PUT':
        const folderIndex = workoutFolders.findIndex(f => f.id === id);
        if (folderIndex === -1) {
          return res.status(404).json({ error: 'Workout folder not found' });
        }
        
        const updatedFolder = {
          ...workoutFolders[folderIndex],
          ...req.body,
          id, // Mantieni l'ID originale
          updatedAt: new Date().toISOString()
        };
        
        workoutFolders[folderIndex] = updatedFolder;
        return res.status(200).json(updatedFolder);

      case 'DELETE':
        const deleteIndex = workoutFolders.findIndex(f => f.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Workout folder not found' });
        }
        
        workoutFolders.splice(deleteIndex, 1);
        return res.status(200).json({ message: 'Workout folder deleted successfully' });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}