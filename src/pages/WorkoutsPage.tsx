import React, { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import DB, { User, WorkoutPlan } from '../utils/database';
import { isFirestoreEnabled } from '../utils/database';
import firestoreService from '../services/firestoreService';
// Rileva modalità standalone PWA su mobile (senza dipendenze esterne)
import ProgramCard, { ProgramItem } from '../components/ProgramCard';

interface WorkoutsPageProps {
  onNavigate: (page: string, plan?: string) => void;
  currentUser: User | null;
}

const detectStandaloneMobile = (): boolean => {
  try {
    // iOS Safari
    // @ts-ignore
    if (typeof navigator !== 'undefined' && navigator.standalone) return true;
    // Standard PWA
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(display-mode: standalone)').matches;
    }
    return false;
  } catch {
    return false;
  }
};

const WorkoutsPage: React.FC<WorkoutsPageProps> = ({ onNavigate, currentUser }) => {
  const isStandaloneMobile = detectStandaloneMobile();
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const [assignedPrograms, setAssignedPrograms] = useState<ProgramItem[]>([]);

  useEffect(() => {
    const headerEl = document.querySelector('header');
    if (!headerEl) return;
    const update = () => setHeaderHeight(headerEl.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(headerEl);
    const mo = new MutationObserver(() => update());
    mo.observe(headerEl, { childList: true, subtree: true });
    const onOrientation = () => update();
    window.addEventListener('orientationchange', onOrientation);
    return () => {
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('orientationchange', onOrientation);
    };
  }, []);

  // Carica/aggiorna le schede assegnate al corrente atleta e le mappa a ProgramItem
  const refreshAssigned = useCallback(async () => {
    if (!currentUser) {
      onNavigate('home');
      return;
    }
    try {
      const allPlans = await DB.getWorkoutPlans();

      // 1) Preferisci i token utente aggiornati dal profilo (Firestore/local)
      let userTokens: string[] = [];
      try {
        if (isFirestoreEnabled()) {
          const fsUser = await firestoreService.getUserByEmail(currentUser.email);
          userTokens = Array.isArray(fsUser?.workoutPlans) ? (fsUser!.workoutPlans as string[]) : [];
        } else {
          const localUsers = DB.getUsers();
          const localUser = localUsers.find(u => u.id === currentUser.id || u.email === currentUser.email);
          userTokens = Array.isArray(localUser?.workoutPlans) ? (localUser!.workoutPlans as string[]) : [];
        }
      } catch (e) {
        console.warn('Impossibile recuperare i token utente aggiornati, uso quelli di sessione:', e);
        userTokens = Array.isArray((currentUser as any).workoutPlans) ? ((currentUser as any).workoutPlans as string[]) : [];
      }

      // Supporta token "<planId>|variant:<variantId>"
      const assignedByTokens = new Map<string, string | undefined>();
      userTokens.forEach((entry) => {
        if (typeof entry !== 'string' || entry.trim() === '') return;
        const idx = entry.indexOf('|variant:');
        const planId = idx >= 0 ? entry.substring(0, idx) : entry;
        const variantId = idx >= 0 ? entry.substring(idx + 9) : undefined;
        assignedByTokens.set(planId, variantId && variantId.length > 0 ? variantId : undefined);
      });

      let userPlans: WorkoutPlan[] = [];
      // Combina assegnazioni da token e fallback su associatedAthletes per evitare inconsistenti sessione
      const tokenIds = new Set(assignedByTokens.keys());
      const byTokens = tokenIds.size > 0 ? allPlans.filter(p => tokenIds.has(p.id)) : [];
      const byAssociation = allPlans
        .filter(p => Array.isArray((p as any).associatedAthletes))
        .filter(p => ((p as any).associatedAthletes || []).some((val: string) => val === currentUser?.id || val === currentUser?.email));
      const mergedMap = new Map<string, WorkoutPlan>();
      [...byTokens, ...byAssociation].forEach(p => mergedMap.set(p.id, p));
      userPlans = Array.from(mergedMap.values());

      // Recupera dettagli cartella per icona/colore corretti
      const folderIds = Array.from(new Set(userPlans.map(p => p.folderId).filter(Boolean))) as string[];
      const folderMap = new Map<string, any>();
      if (folderIds.length > 0) {
        const folders = await Promise.all(
          folderIds.map(async (id) => ({ id, folder: await DB.getWorkoutFolderById(id) }))
        );
        folders.forEach(({ id, folder }) => { if (folder) folderMap.set(id, folder); });
      }

      const mapped: ProgramItem[] = userPlans.map(plan => mapPlanToProgramItem(plan, folderMap));
      setAssignedPrograms(mapped);
    } catch (e) {
      console.error('Errore caricando le schede assegnate:', e);
      setAssignedPrograms([]);
    }
  }, [currentUser, onNavigate]);

  // Aggiorna all'avvio e quando cambia l'utente corrente
  useEffect(() => {
    refreshAssigned();
  }, [refreshAssigned]);

  // Ascolta eventi globali per aggiornare la pagina "Le tue schede" in tempo reale
  useEffect(() => {
    const handler = () => { refreshAssigned(); };
    window.addEventListener('kw8:user-workouts:update', handler as EventListener);
    return () => {
      window.removeEventListener('kw8:user-workouts:update', handler as EventListener);
    };
  }, [refreshAssigned]);

  // Mappa WorkoutPlan -> ProgramItem (coerenza visiva con Gestione schede)
  const mapPlanToProgramItem = (plan: WorkoutPlan, folderMap: Map<string, any>): ProgramItem => ({
    id: plan.id,
    title: plan.name,
    type: 'program',
    parentFolderId: plan.folderId,
    order: plan.order ?? 0,
    coach: plan.coach,
    difficulty: plan.difficulty,
    status: plan.status,
    description: plan.description,
    tags: plan.tags,
    createdAt: plan.createdAt,
    updatedAt: plan.updatedAt,
    targetMuscles: plan.targetMuscles,
    exercises: plan.exercises,
    userId: undefined,
    category: plan.category,
    // UI extra per anteprima lato atleta
    durationWeeks: plan.durationWeeks || (plan.duration ? Math.max(1, Math.ceil(plan.duration / 7)) : undefined),
    trainingDays: plan.days ? Object.keys(plan.days).filter(k => (plan.days![k] || []).length > 0).length : undefined,
    color: plan.color || (plan.folderId ? folderMap.get(plan.folderId)?.color : undefined),
    icon: plan.folderId ? folderMap.get(plan.folderId)?.icon : undefined,
  });

  const handleOpenWorkout = (program: ProgramItem) => {
    onNavigate('workout-detail', program.id);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        onNavigate={onNavigate}
        currentUser={currentUser}
        showAuthButtons={false}
        currentPage={'workouts'}
      />

      <div style={{ paddingTop: isStandaloneMobile ? headerHeight : 80 }}>
        <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
          {assignedPrograms.length === 0 ? (
            <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm ring-1 ring-black/10 p-6 text-center">
              <h2 className="text-xl font-semibold text-navy-900 mb-2">Nessuna scheda assegnata</h2>
              <p className="text-navy-700">Il tuo coach ti assegnerà presto una scheda di allenamento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedPrograms.map((program) => (
                <ProgramCard
                  key={program.id}
                  program={program}
                  role="athlete"
                  onOpen={handleOpenWorkout}
                  // Handlers non usati in modalità atleta (no-op)
                  onEdit={() => {}}
                  onDelete={() => {}}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                  dragOverZone={null}
                  canDrop={false}
                  showDetails={true}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Apertura dettagliata spostata su pagina dedicata */}
    </div>
  );
};

export default WorkoutsPage;
