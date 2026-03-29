import React, { useCallback, useEffect, useState } from 'react';
import Header from '../components/Header';
import DB, { User, WorkoutPlan } from '../utils/database';
import { isFirestoreEnabled } from '../utils/database';
import firestoreService from '../services/firestoreService';
// Rileva modalità standalone PWA su mobile (senza dipendenze esterne)
import ProgramCard, { ProgramItem } from '../components/ProgramCard';
import { ChevronLeft } from 'lucide-react';
import useIsStandaloneMobile from '../hooks/useIsStandaloneMobile';

interface WorkoutsPageProps {
  onNavigate: (page: string, plan?: string, linkId?: string) => void;
  currentUser: User | null;
}

const WorkoutsPage: React.FC<WorkoutsPageProps> = ({ onNavigate, currentUser }) => {
  const isStandaloneMobile = useIsStandaloneMobile();
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
      let athleteProgressStore: Record<string, any> = {};

      // 1) Preferisci i token utente aggiornati dal profilo (Firestore/local)
      let userTokens: string[] = [];
      try {
        if (isFirestoreEnabled()) {
          const fsUser = await firestoreService.getUserByEmail(currentUser.email);
          userTokens = Array.isArray(fsUser?.workoutPlans) ? (fsUser!.workoutPlans as string[]) : [];
          athleteProgressStore = (fsUser as any)?.athleteProgress && typeof (fsUser as any).athleteProgress === 'object'
            ? (fsUser as any).athleteProgress
            : {};
        } else {
          const localUsers = DB.getUsers();
          const localUser = localUsers.find(u => u.id === currentUser.id || u.email === currentUser.email);
          userTokens = Array.isArray(localUser?.workoutPlans) ? (localUser!.workoutPlans as string[]) : [];
          athleteProgressStore = (localUser as any)?.athleteProgress && typeof (localUser as any).athleteProgress === 'object'
            ? (localUser as any).athleteProgress
            : {};
        }
      } catch (e) {
        console.warn('Impossibile recuperare i token utente aggiornati, uso quelli di sessione:', e);
        userTokens = Array.isArray((currentUser as any).workoutPlans) ? ((currentUser as any).workoutPlans as string[]) : [];
        athleteProgressStore = ((currentUser as any)?.athleteProgress && typeof (currentUser as any).athleteProgress === 'object')
          ? (currentUser as any).athleteProgress
          : {};
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

      const mapped: ProgramItem[] = userPlans.map(plan => mapPlanToProgramItem(plan, folderMap, athleteProgressStore, assignedByTokens));
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

  const mapPlanToProgramItem = (
    plan: WorkoutPlan,
    folderMap: Map<string, any>,
    athleteProgressStore: Record<string, any>,
    assignedByTokens: Map<string, string | undefined>
  ): ProgramItem => {
    const parseNumericKey = (value: string, prefix: string) => {
      const numeric = parseInt(String(value).replace(new RegExp(`^${prefix}`), ''), 10);
      return Number.isNaN(numeric) ? 0 : numeric;
    };
    const getWeekNumber = (weekKey: string) => parseNumericKey(weekKey, 'W');
    const getDayLabel = (dayKey: string, dayNames: Record<string, string>) => {
      const custom = dayNames?.[dayKey];
      if (custom && String(custom).trim().length > 0) return custom;
      const n = parseNumericKey(dayKey, 'G');
      return `Allenamento ${n || 1}`;
    };

    const resolvedVariantId = assignedByTokens.get(plan.id) || plan.activeVariantId || 'original';
    const variant = Array.isArray(plan.variants) ? plan.variants.find(v => v.id === resolvedVariantId) : undefined;
    const weeksStore = (
      resolvedVariantId !== 'original'
        ? (variant?.weeksStore || {})
        : (plan.weeksStore || {})
    ) as Record<string, Record<string, any[]>>;
    const dayNames = (resolvedVariantId !== 'original' ? (variant?.dayNames || {}) : (plan.dayNames || {})) as Record<string, string>;
    const fallbackDays = (resolvedVariantId !== 'original' ? (variant?.days || {}) : (plan.days || {})) as Record<string, any[]>;
    const fallbackWeeksStore = Object.keys(weeksStore).length > 0 ? weeksStore : { W1: fallbackDays };

    const weekKeysFromPlan = Array.isArray(plan.weeks) && plan.weeks.length > 0 ? [...plan.weeks] : Object.keys(fallbackWeeksStore);
    const sortedWeekKeys = (weekKeysFromPlan.length > 0 ? weekKeysFromPlan : ['W1'])
      .sort((a, b) => getWeekNumber(a) - getWeekNumber(b));

    const getProgressKey = (weekKey: string, dayKey: string, exerciseId: string) =>
      [plan.id, resolvedVariantId, weekKey, dayKey, String(exerciseId)].join('::');

    let totalWorkouts = 0;
    let completedWorkouts = 0;
    let nextWorkoutName = '';
    let nextWorkoutExercises = 0;
    let nextWorkoutWeek = 1;
    let nextWorkoutDayKey = 'G1';
    let isProgramComplete = false;

    sortedWeekKeys.forEach((weekKey) => {
      const daysMap = fallbackWeeksStore[weekKey] || {};
      const dayKeys = Object.keys(daysMap).sort((a, b) => parseNumericKey(a, 'G') - parseNumericKey(b, 'G'));
      dayKeys.forEach((dayKey) => {
        const dayExercises = Array.isArray(daysMap[dayKey]) ? daysMap[dayKey] : [];
        if (dayExercises.length === 0) return;
        totalWorkouts += 1;
        const dayCompleted = dayExercises.every((ex: any) => {
          const key = getProgressKey(weekKey, dayKey, ex?.id || '');
          return !!athleteProgressStore?.[key]?.completed;
        });
        if (dayCompleted) {
          completedWorkouts += 1;
        } else if (!nextWorkoutName) {
          nextWorkoutName = getDayLabel(dayKey, dayNames);
          nextWorkoutExercises = dayExercises.length;
          nextWorkoutWeek = getWeekNumber(weekKey) || 1;
          nextWorkoutDayKey = dayKey;
        }
      });
    });

    if (!nextWorkoutName) {
      const firstWeek = sortedWeekKeys[0] || 'W1';
      const firstDaysMap = fallbackWeeksStore[firstWeek] || {};
      const firstDayKey = Object.keys(firstDaysMap).sort((a, b) => parseNumericKey(a, 'G') - parseNumericKey(b, 'G'))[0] || 'G1';
      const firstExercises = Array.isArray(firstDaysMap[firstDayKey]) ? firstDaysMap[firstDayKey] : [];
      nextWorkoutName = getDayLabel(firstDayKey, dayNames);
      nextWorkoutExercises = firstExercises.length;
      nextWorkoutWeek = getWeekNumber(firstWeek) || 1;
      nextWorkoutDayKey = firstDayKey;
    }
    isProgramComplete = totalWorkouts > 0 && completedWorkouts >= totalWorkouts;

    return {
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
      durationWeeks: plan.durationWeeks || (plan.duration ? Math.max(1, Math.ceil(plan.duration / 7)) : undefined),
      trainingDays: totalWorkouts > 0 ? totalWorkouts : (plan.days ? Object.keys(plan.days).filter(k => (plan.days![k] || []).length > 0).length : undefined),
      color: plan.color || (plan.folderId ? folderMap.get(plan.folderId)?.color : undefined),
      icon: plan.folderId ? folderMap.get(plan.folderId)?.icon : undefined,
      completedWorkouts,
      totalWorkouts,
      nextWorkoutName,
      nextWorkoutExercises,
      nextWorkoutWeek,
      nextWorkoutDayKey,
      assignedVariantId: resolvedVariantId,
      isProgramComplete
    };
  };

  const handleOpenWorkout = (program: ProgramItem) => {
    onNavigate('workout-detail', program.id, program.assignedVariantId);
  };

  const handleOpenNextWorkout = (program: ProgramItem) => {
    onNavigate('workout-detail', program.id, program.assignedVariantId);
    const params = new URLSearchParams();
    params.set('id', program.id);
    if (program.assignedVariantId) params.set('variant', program.assignedVariantId);
    if (typeof program.nextWorkoutWeek === 'number') params.set('week', `W${program.nextWorkoutWeek}`);
    if (program.nextWorkoutDayKey) params.set('day', program.nextWorkoutDayKey);
    window.history.replaceState({}, '', `/workout-detail?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header 
        onNavigate={onNavigate}
        currentUser={currentUser}
        showAuthButtons={false}
        currentPage={'workouts'}
      />

      {/* Titolo pagina desktop + tasto indietro, identico a Gestione schede */}
      {!isStandaloneMobile && (
        <div style={{ paddingTop: (headerHeight || 80) + 10 }} className="mb-3">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-3xl rounded-[28px] bg-white/80 backdrop-blur-xl ring-1 ring-black/10 shadow-[0_10px_28px_rgba(0,0,0,0.10)] px-3 sm:px-4 py-2.5">
              <div className="relative flex items-center justify-center min-h-[40px]">
                <button
                  onClick={() => onNavigate('home')}
                  className="absolute left-0 inline-flex items-center justify-center transition-all duration-300 p-2 bg-white/85 backdrop-blur-xl ring-1 ring-black/10 rounded-full shadow-[0_6px_18px_rgba(0,0,0,0.08)] hover:bg-white active:scale-[0.98] shrink-0"
                  title="Torna alla Home"
                  aria-label="Torna alla Home"
                >
                  <ChevronLeft size={19} className="block text-gray-900" />
                </button>
                <h2 className="font-sfpro text-lg sm:text-xl font-semibold text-gray-900 tracking-[-0.01em] text-center">Le tue schede</h2>
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={{ paddingTop: isStandaloneMobile ? headerHeight : 0 }}>
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
                  onOpenNext={handleOpenNextWorkout}
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
