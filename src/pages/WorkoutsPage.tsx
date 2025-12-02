import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import DB, { User, WorkoutPlan } from '../utils/database';
// Rileva modalità standalone PWA su mobile (senza dipendenze esterne)
import ProgramCard, { ProgramItem } from '../components/ProgramCard';
import WorkoutDetailPage from '../components/WorkoutDetailPage';

interface WorkoutsPageProps {
  onNavigate: (page: string) => void;
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
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [initialActiveVariantId, setInitialActiveVariantId] = useState<string | undefined>(undefined);

  // Aggiorna altezza header per padding top coerente con Gestione schede
  useEffect(() => {
    const updateHeaderHeight = () => {
      const headerEl = document.querySelector('header');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
    };
    updateHeaderHeight();
    window.addEventListener('scroll', updateHeaderHeight, { passive: true });
    window.addEventListener('resize', updateHeaderHeight);
    return () => {
      window.removeEventListener('scroll', updateHeaderHeight as EventListener);
      window.removeEventListener('resize', updateHeaderHeight as EventListener);
    };
  }, []);

  // Carica le schede assegnate al corrente atleta e le mappa a ProgramItem
  useEffect(() => {
    const loadAssigned = async () => {
      if (!currentUser) {
        onNavigate('home');
        return;
      }
      if (!currentUser.workoutPlans || currentUser.workoutPlans.length === 0) {
        setAssignedPrograms([]);
        return;
      }
      try {
        const allPlans = await DB.getWorkoutPlans();
        const userPlans = allPlans.filter(p => currentUser.workoutPlans.includes(p.id));
        const mapped: ProgramItem[] = userPlans.map(mapPlanToProgramItem);
        setAssignedPrograms(mapped);
      } catch (e) {
        console.error('Errore caricando le schede assegnate:', e);
        setAssignedPrograms([]);
      }
    };
    loadAssigned();
  }, [currentUser, onNavigate]);

  // Mappa WorkoutPlan -> ProgramItem (coerenza visiva con Gestione schede)
  const mapPlanToProgramItem = (plan: WorkoutPlan): ProgramItem => ({
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
  });

  const handleOpenWorkout = (program: ProgramItem) => {
    setSelectedWorkoutId(program.id);
    // Trova la variante attiva iniziale dal piano
    // Nota: recuperiamo i piani per trovare la variante attiva associata
    (async () => {
      try {
        const plans = await DB.getWorkoutPlans();
        const plan = plans.find(p => p.id === program.id);
        setInitialActiveVariantId(plan?.activeVariantId || undefined);
      } catch {}
    })();
    try { window.dispatchEvent(new Event('kw8:workout-detail:open')); } catch {}
  };

  const handleCloseWorkout = () => {
    setSelectedWorkoutId(null);
    setInitialActiveVariantId(undefined);
    try { window.dispatchEvent(new Event('kw8:workout-detail:close')); } catch {}
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

      {selectedWorkoutId && (
        <WorkoutDetailPage
          workoutId={selectedWorkoutId}
          initialActiveVariantId={initialActiveVariantId}
          onClose={handleCloseWorkout}
        />
      )}
    </div>
  );
};

export default WorkoutsPage;
