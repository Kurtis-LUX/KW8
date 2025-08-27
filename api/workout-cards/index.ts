// API endpoint per gestire le schede di allenamento
// Supporta accesso coach (gestione completa) e token temporaneo (solo lettura)
import { VercelRequest, VercelResponse } from '@vercel/node';
import { requireCoachOrTempToken } from '../middleware/rbac';

// Simulazione di un database (in produzione usare MongoDB, PostgreSQL, etc.)
let workoutCards: any[] = [];

async function handler(req: VercelRequest & { user?: any; tempToken?: any }, res: VercelResponse) {
  try {
    const isCoach = req.user && req.user.role === 'coach';
    const isTempToken = req.tempToken;

    switch (req.method) {
      case 'GET':
        // Entrambi coach e token temporaneo possono leggere
        let filteredCards = workoutCards;
        
        // Se è un token temporaneo, filtra solo le schede autorizzate
        if (isTempToken && !isCoach) {
          filteredCards = workoutCards.filter(card => 
            req.tempToken.allowedResources.includes(card.id)
          );
        }
        
        return res.status(200).json({
          success: true,
          data: filteredCards,
          message: 'Schede di allenamento recuperate con successo'
        });

      case 'POST':
        // Solo coach può creare nuove schede
        if (!isCoach) {
          return res.status(403).json({
            success: false,
            message: 'Accesso negato: solo i coach possono creare schede'
          });
        }
        
        const newCard = {
          id: Date.now().toString(),
          ...req.body,
          createdBy: req.user.email,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        workoutCards.push(newCard);
        
        return res.status(201).json({
          success: true,
          data: newCard,
          message: 'Scheda di allenamento creata con successo'
        });

      case 'PUT':
        // Solo coach può modificare schede
        if (!isCoach) {
          return res.status(403).json({
            success: false,
            message: 'Accesso negato: solo i coach possono modificare schede'
          });
        }
        
        const { id } = req.query;
        const cardIndex = workoutCards.findIndex(c => c.id === id);
        if (cardIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Scheda di allenamento non trovata'
          });
        }
        
        workoutCards[cardIndex] = {
          ...workoutCards[cardIndex],
          ...req.body,
          updatedAt: new Date().toISOString(),
          updatedBy: req.user.email
        };
        
        return res.status(200).json({
          success: true,
          data: workoutCards[cardIndex],
          message: 'Scheda di allenamento aggiornata con successo'
        });

      case 'DELETE':
        // Solo coach può eliminare schede
        if (!isCoach) {
          return res.status(403).json({
            success: false,
            message: 'Accesso negato: solo i coach possono eliminare schede'
          });
        }
        
        const { id: deleteId } = req.query;
        const deleteIndex = workoutCards.findIndex(c => c.id === deleteId);
        if (deleteIndex === -1) {
          return res.status(404).json({
            success: false,
            message: 'Scheda di allenamento non trovata'
          });
        }
        
        workoutCards.splice(deleteIndex, 1);
        return res.status(200).json({
          success: true,
          message: 'Scheda di allenamento eliminata con successo'
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

// Proteggi l'endpoint con accesso misto (coach o token temporaneo)
export default requireCoachOrTempToken(handler);