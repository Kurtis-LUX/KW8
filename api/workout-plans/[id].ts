// API endpoint per operazioni su singoli piani di allenamento
import { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCoachAuth } from '../middleware/rbac';

// Simulazione di un database (in produzione usare MongoDB, PostgreSQL, etc.)
let workoutPlans: any[] = [];

async function handler(req: VercelRequest & { user?: any }, res: VercelResponse) {
  // CORS gestito dal middleware RBAC

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Workout plan ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const plan = workoutPlans.find(p => p.id === id);
        if (!plan) {
          return res.status(404).json({ error: 'Workout plan not found' });
        }
        return res.status(200).json(plan);

      case 'PUT':
        const planIndex = workoutPlans.findIndex(p => p.id === id);
        if (planIndex === -1) {
          return res.status(404).json({ error: 'Workout plan not found' });
        }
        
        const updatedPlan = {
          ...workoutPlans[planIndex],
          ...req.body,
          id, // Mantieni l'ID originale
          updatedAt: new Date().toISOString()
        };
        
        workoutPlans[planIndex] = updatedPlan;
        return res.status(200).json(updatedPlan);

      case 'DELETE':
        const deleteIndex = workoutPlans.findIndex(p => p.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ error: 'Workout plan not found' });
        }
        
        workoutPlans.splice(deleteIndex, 1);
        return res.status(200).json({ message: 'Workout plan deleted successfully' });

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