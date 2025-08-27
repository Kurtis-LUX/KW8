// API endpoint per operazioni su singole schede di allenamento
// Supporta accesso coach (gestione completa) e token temporaneo (solo lettura)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCoachOrTempToken } from '../middleware/rbac';

// Simulazione di un database (in produzione usare MongoDB, PostgreSQL, etc.)
let workoutCards: any[] = [];

async function handler(req: VercelRequest & { user?: any; tempToken?: any }, res: VercelResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ 
      success: false,
      error: 'ID scheda di allenamento richiesto' 
    });
  }

  try {
    const isCoach = req.user && req.user.role === 'coach';
    const isTempToken = req.tempToken;

    // Verifica se il token temporaneo ha accesso a questa scheda
    if (isTempToken && !isCoach && !req.tempToken.allowedResources.includes(id)) {
      return res.status(403).json({
        success: false,
        message: 'Accesso negato: token non autorizzato per questa scheda'
      });
    }

    switch (req.method) {
      case 'GET':
        // Entrambi coach e token temporaneo possono leggere (se autorizzati)
        const card = workoutCards.find(c => c.id === id);
        if (!card) {
          return res.status(404).json({ 
            success: false,
            error: 'Scheda di allenamento non trovata' 
          });
        }
        
        return res.status(200).json({
          success: true,
          data: card,
          message: 'Scheda di allenamento recuperata con successo'
        });

      case 'PUT':
        // Solo coach può modificare
        if (!isCoach) {
          return res.status(403).json({
            success: false,
            message: 'Accesso negato: solo i coach possono modificare schede'
          });
        }
        
        const cardIndex = workoutCards.findIndex(c => c.id === id);
        if (cardIndex === -1) {
          return res.status(404).json({ 
            success: false,
            error: 'Scheda di allenamento non trovata' 
          });
        }
        
        const updatedCard = {
          ...workoutCards[cardIndex],
          ...req.body,
          id, // Mantieni l'ID originale
          updatedAt: new Date().toISOString(),
          updatedBy: req.user.email
        };
        
        workoutCards[cardIndex] = updatedCard;
        return res.status(200).json({
          success: true,
          data: updatedCard,
          message: 'Scheda di allenamento aggiornata con successo'
        });

      case 'DELETE':
        // Solo coach può eliminare
        if (!isCoach) {
          return res.status(403).json({
            success: false,
            message: 'Accesso negato: solo i coach possono eliminare schede'
          });
        }
        
        const deleteIndex = workoutCards.findIndex(c => c.id === id);
        if (deleteIndex === -1) {
          return res.status(404).json({ 
            success: false,
            error: 'Scheda di allenamento non trovata' 
          });
        }
        
        workoutCards.splice(deleteIndex, 1);
        return res.status(200).json({ 
          success: true,
          message: 'Scheda di allenamento eliminata con successo' 
        });

      default:
        res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
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

// Proteggi l'endpoint con accesso misto (coach o token temporaneo)
export default requireCoachOrTempToken(handler);