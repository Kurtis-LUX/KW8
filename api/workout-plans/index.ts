// API endpoint per gestire i piani di allenamento
import { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCoachRole } from '../middleware/rbac';

// Simulazione di un database (in produzione usare MongoDB, PostgreSQL, etc.)
let workoutPlans: any[] = [];

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
          data: workoutPlans,
          message: 'Piani di allenamento recuperati con successo'
        });

      case 'POST':
        const newPlan = {
          id: Date.now().toString(),
          ...req.body,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        workoutPlans.push(newPlan);
        return res.status(201).json({
          success: true,
          data: newPlan,
          message: 'Piano di allenamento creato con successo'
        });

      case 'PUT':
        const { id } = req.query;
        const planIndex = workoutPlans.findIndex(p => p.id === id);
        if (planIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Piano di allenamento non trovato'
          });
        }
        workoutPlans[planIndex] = {
          ...workoutPlans[planIndex],
          ...req.body,
          updatedAt: new Date().toISOString()
        };
        return res.status(200).json({
          success: true,
          data: workoutPlans[planIndex],
          message: 'Piano di allenamento aggiornato con successo'
        });

      case 'DELETE':
        const { id: deleteId } = req.query;
        const deleteIndex = workoutPlans.findIndex(p => p.id === deleteId);
        if (deleteIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Piano di allenamento non trovato'
          });
        }
        workoutPlans.splice(deleteIndex, 1);
        return res.status(200).json({
          success: true,
          message: 'Piano di allenamento eliminato con successo'
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