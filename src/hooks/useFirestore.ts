// Hook personalizzato per gestire Firestore e localStorage
import { useState, useEffect, useCallback } from 'react';
import firestoreService from '../services/firestoreService';
import DB, { isFirestoreEnabled } from '../utils/database';
import type {
  User,
  Ranking,
  Link,
  MembershipCard
} from '../services/firestoreService';
import type {
  WorkoutPlan,
  WorkoutFolder
} from '../utils/database';

// Hook per gestire gli utenti
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedUsers = await firestoreService.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento utenti');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const userId = await firestoreService.createUser(userData);
      await fetchUsers(); // Ricarica la lista
      return userId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione utente');
      throw err;
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (id: string, userData: Partial<User>) => {
    try {
      setError(null);
      await firestoreService.updateUser(id, userData);
      await fetchUsers(); // Ricarica la lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento utente');
      throw err;
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      setError(null);
      await firestoreService.deleteUser(id);
      await fetchUsers(); // Ricarica la lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione utente');
      throw err;
    }
  }, [fetchUsers]);

  const batchCreateUsers = useCallback(async (usersData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      setError(null);
      await firestoreService.batchCreateUsers(usersData);
      await fetchUsers(); // Ricarica la lista
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione batch utenti');
      throw err;
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    batchCreateUsers
  };
};

// Hook per gestire i piani di allenamento
export const useWorkoutPlans = () => {
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    try {
      console.log('🔄 useWorkoutPlans: Starting fetchPlans...');
      setLoading(true);
      setError(null);
      
      // Usa localStorage se Firestore è disabilitato
      const firestoreEnabled = isFirestoreEnabled();
      console.log('🔧 useWorkoutPlans: Firestore enabled:', firestoreEnabled);
      
      const fetchedPlans = firestoreEnabled 
        ? await firestoreService.getWorkoutPlans()
        : await DB.getWorkoutPlans();
      
      console.log('📊 useWorkoutPlans: Fetched plans:', fetchedPlans.length, 'plans');
      console.log('📋 useWorkoutPlans: Plans data:', fetchedPlans);
        
      setPlans(fetchedPlans);
    } catch (err) {
      console.error('❌ useWorkoutPlans: Error in fetchPlans:', err);
      setError(err instanceof Error ? err.message : 'Errore nel caricamento piani');
      console.error('Error fetching workout plans:', err);
    } finally {
      console.log('✅ useWorkoutPlans: fetchPlans completed, setting loading to false');
      setLoading(false);
    }
  }, []);

  const createPlan = useCallback(async (planData: Omit<WorkoutPlan, 'createdAt' | 'updatedAt'> | WorkoutPlan) => {
    try {
      setError(null);
      
      // Usa localStorage se Firestore è disabilitato
      const firestoreEnabled = isFirestoreEnabled();
      
      // Se l'ID è già presente nei dati, usalo; altrimenti generane uno nuovo
      const planWithId = 'id' in planData && planData.id 
        ? planData as WorkoutPlan
        : { 
            ...planData, 
            id: Date.now().toString(), 
            createdAt: new Date().toISOString(), 
            updatedAt: new Date().toISOString() 
          };
      
      const planId = firestoreEnabled
        ? await firestoreService.createWorkoutPlan(planWithId)
        : await DB.saveWorkoutPlan(planWithId);
        
      await fetchPlans();
      return planId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione piano');
      throw err;
    }
  }, [fetchPlans]);

  const updatePlan = useCallback(async (id: string, planData: Partial<WorkoutPlan>) => {
    try {
      setError(null);
      
      // Usa localStorage se Firestore è disabilitato
      const firestoreEnabled = isFirestoreEnabled();
      if (firestoreEnabled) {
        await firestoreService.updateWorkoutPlan(id, planData);
      } else {
        const existingPlan = await DB.getWorkoutPlanById(id);
        if (existingPlan) {
          // Aggiorna scheda esistente
          await DB.saveWorkoutPlan({ ...existingPlan, ...planData, updatedAt: new Date().toISOString() });
        } else {
          // Crea nuova scheda se non esiste
          console.log('🆕 Creating new workout plan with ID:', id);
          const now = new Date().toISOString();
          const newWorkoutPlan = {
            id,
            name: 'Nuova scheda',
            description: '',
            coach: 'Coach',
            startDate: now,
            duration: 30,
            exercises: [],
            category: 'strength' as const,
            status: 'draft' as const,
            mediaFiles: { images: [], videos: [], audio: [] },
            tags: [],
            order: 0,
            difficulty: 1,
            targetMuscles: [],
            folderId: null,
            color: '#10B981',
            variants: [],
            createdAt: now,
            updatedAt: now,
            ...planData // Sovrascrivi con i dati forniti
          };
          await DB.saveWorkoutPlan(newWorkoutPlan);
          console.log('✅ New workout plan created successfully');
        }
      }
      
      await fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento piano');
      throw err;
    }
  }, [fetchPlans]);

  const deletePlan = useCallback(async (id: string) => {
    try {
      setError(null);
      
      // Usa localStorage se Firestore è disabilitato
      const firestoreEnabled = isFirestoreEnabled();
      if (firestoreEnabled) {
        await firestoreService.deleteWorkoutPlan(id);
      } else {
        await DB.deleteWorkoutPlan(id);
      }
      
      await fetchPlans();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione piano');
      throw err;
    }
  }, [fetchPlans]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return {
    workoutPlans: plans,
    loading,
    error,
    refetch: fetchPlans,
    createWorkoutPlan: createPlan,
    updateWorkoutPlan: updatePlan,
    deleteWorkoutPlan: deletePlan
  };
};

// Hook per gestire le classifiche
export const useRankings = () => {
  const [rankings, setRankings] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRankings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRankings = await firestoreService.getRankings();
      setRankings(fetchedRankings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento classifiche');
      console.error('Error fetching rankings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createRanking = useCallback(async (rankingData: Omit<Ranking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const rankingId = await firestoreService.createRanking(rankingData);
      await fetchRankings();
      return rankingId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione classifica');
      throw err;
    }
  }, [fetchRankings]);

  const updateRanking = useCallback(async (id: string, rankingData: Partial<Ranking>) => {
    try {
      setError(null);
      await firestoreService.updateRanking(id, rankingData);
      await fetchRankings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento classifica');
      throw err;
    }
  }, [fetchRankings]);

  const deleteRanking = useCallback(async (id: string) => {
    try {
      setError(null);
      await firestoreService.deleteRanking(id);
      await fetchRankings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione classifica');
      throw err;
    }
  }, [fetchRankings]);

  useEffect(() => {
    fetchRankings();
  }, [fetchRankings]);

  return {
    rankings,
    loading,
    error,
    refetch: fetchRankings,
    createRanking,
    updateRanking,
    deleteRanking
  };
};

// Hook per gestire i link
export const useLinks = () => {
  const [links, setLinks] = useState<Link[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedLinks = await firestoreService.getLinks();
      setLinks(fetchedLinks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento link');
      console.error('Error fetching links:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createLink = useCallback(async (linkData: Omit<Link, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const linkId = await firestoreService.createLink(linkData);
      await fetchLinks();
      return linkId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione link');
      throw err;
    }
  }, [fetchLinks]);

  const updateLink = useCallback(async (id: string, linkData: Partial<Link>) => {
    try {
      setError(null);
      await firestoreService.updateLink(id, linkData);
      await fetchLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento link');
      throw err;
    }
  }, [fetchLinks]);

  const deleteLink = useCallback(async (id: string) => {
    try {
      setError(null);
      await firestoreService.deleteLink(id);
      await fetchLinks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione link');
      throw err;
    }
  }, [fetchLinks]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  return {
    links,
    loading,
    error,
    refetch: fetchLinks,
    createLink,
    updateLink,
    deleteLink
  };
};

// Hook per gestire i tesserini
export const useMembershipCards = () => {
  const [cards, setCards] = useState<MembershipCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCards = await firestoreService.getMembershipCards();
      setCards(fetchedCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento tesserini');
      console.error('Error fetching membership cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCardsByUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const fetchedCards = await firestoreService.getMembershipCardsByUser(userId);
      setCards(fetchedCards);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento tesserini utente');
      console.error('Error fetching user membership cards:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createCard = useCallback(async (cardData: Omit<MembershipCard, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null);
      const cardId = await firestoreService.createMembershipCard(cardData);
      await fetchCards();
      return cardId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione tesserino');
      throw err;
    }
  }, [fetchCards]);

  const updateCard = useCallback(async (id: string, cardData: Partial<MembershipCard>) => {
    try {
      setError(null);
      await firestoreService.updateMembershipCard(id, cardData);
      await fetchCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'aggiornamento tesserino');
      throw err;
    }
  }, [fetchCards]);

  const deleteCard = useCallback(async (id: string) => {
    try {
      setError(null);
      await firestoreService.deleteMembershipCard(id);
      await fetchCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione tesserino');
      throw err;
    }
  }, [fetchCards]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  return {
    cards,
    loading,
    error,
    refetch: fetchCards,
    fetchCardsByUser,
    createCard,
    updateCard,
    deleteCard
  };
};

// Hook per la migrazione dei dati
export const useDataMigration = () => {
  const [migrating, setMigrating] = useState(false);
  const [migrationError, setMigrationError] = useState<string | null>(null);
  const [migrationSuccess, setMigrationSuccess] = useState(false);

  const migrateData = useCallback(async () => {
    try {
      setMigrating(true);
      setMigrationError(null);
      setMigrationSuccess(false);
      
      await firestoreService.migrateFromLocalStorage();
      
      setMigrationSuccess(true);
      console.log('✅ Data migration completed successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore durante la migrazione';
      setMigrationError(errorMessage);
      console.error('❌ Migration failed:', err);
    } finally {
      setMigrating(false);
    }
  }, []);

  return {
    migrating,
    migrationError,
    migrationSuccess,
    migrateData
  };
};