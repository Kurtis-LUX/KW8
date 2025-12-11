import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Edit3, Plus, Save, Copy, Users, ArrowLeft, ChevronLeft, Eye, X, Trash2, Calendar, Star, CheckCircle, Folder, FileText, ChevronUp, ChevronDown, Tag, Search, Link2, Dumbbell, Zap, Timer, Clock, Video, Eraser } from 'lucide-react';
import { AVAILABLE_ICONS } from './FolderCustomizer';
import { useWorkoutPlans, useUsers } from '../hooks/useFirestore';
import DB from '../utils/database';
import Portal from './Portal';
import Modal from './Modal';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import useIsStandaloneMobile from '../hooks/useIsStandaloneMobile';
import { authService } from '../services/authService';
import SectionSeparator from './SectionSeparator';

interface Exercise {
  id: string;
  name: string;
  notes: string;
  sets: string;
  intensity: string;
  tut: string;
  recovery: string;
  videoLink: string;
  supersetGroupId?: string; // ID del gruppo superset (ancora)
  isSupersetLeader?: boolean; // true se è l'esercizio principale del gruppo
}

interface WorkoutVariant {
  id: string;
  name: string;
  isActive: boolean;
  description?: string;
  exercises?: Exercise[];
  days?: { [key: string]: Exercise[] };
  dayNames?: { [key: string]: string };
  parentWorkoutId?: string;
  modifications?: any[];
  createdAt?: string;
  updatedAt?: string;
}

interface WorkoutDetailPageProps {
  workoutId: string;
  onClose: () => void;
  folderPath?: string;
  initialActiveVariantId?: string;
}

const WorkoutDetailPage: React.FC<WorkoutDetailPageProps> = ({ workoutId, onClose, folderPath, initialActiveVariantId }) => {
  const [workoutTitle, setWorkoutTitle] = useState('Nuova scheda');
  const [workoutDescription, setWorkoutDescription] = useState('');
  const [originalWorkoutDescription, setOriginalWorkoutDescription] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  // Stato di caricamento per evitare auto-save durante l'inizializzazione
  const [isLoadingWorkout, setIsLoadingWorkout] = useState<boolean>(true);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  
  // Refs
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const exerciseDropdownRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isStandaloneMobile = useIsStandaloneMobile();

  // Ruoli utente per gestire permessi di modifica
  const currentUser = authService.getCurrentUser();
  const canEdit = currentUser?.role === 'coach' || currentUser?.role === 'admin';
  const isAthlete = (currentUser?.role === 'athlete' || currentUser?.role === 'atleta');
  // Hook Firestore per gestire i piani di allenamento e gli utenti (spostato sopra per calcolo permessi varianti)
  const { workoutPlans, loading, error, updateWorkoutPlan } = useWorkoutPlans();
  const { users: athletes, loading: athletesLoading, updateUser } = useUsers();
  // Varianti consentite per l'atleta corrente (solo quelle assegnate):
  // Usa i token più aggiornati disponibili: record utente da Firestore/local, sessione corrente e fallback su associatedAthletes del piano.
  const { allowedVariantIds, canSeeOriginal } = useMemo(() => {
    // Trova il record utente corrente nella lista utenti caricata
    const athleteRecord = (athletes || []).find(u => u.id === currentUser?.id || u.email === currentUser?.email);
    const tokens = ((athleteRecord?.workoutPlans ?? currentUser?.workoutPlans) ?? []) as string[];
    const set = new Set<string>();
    let originalAllowed = false;

    for (const t of tokens) {
      if (t === workoutId) {
        originalAllowed = true;
      } else if (typeof t === 'string' && t.startsWith(`${workoutId}|variant:`)) {
        const vid = t.split('|variant:')[1]?.trim();
        if (vid) set.add(vid);
      }
    }

    // Fallback: se il piano ha l'atleta tra gli associatedAthletes, consenti la scheda originale
    if (!originalAllowed) {
      const plan = (workoutPlans || []).find(p => p.id === workoutId);
      const assoc = (plan && Array.isArray((plan as any).associatedAthletes)) ? (plan as any).associatedAthletes as string[] : [];
      if (assoc.includes(currentUser?.id || '') || assoc.includes(currentUser?.email || '')) {
        originalAllowed = true;
      }
    }

    return { allowedVariantIds: set, canSeeOriginal: originalAllowed };
  }, [athletes, currentUser?.id, currentUser?.email, currentUser?.workoutPlans, workoutPlans, workoutId]);

  // Misura l'altezza dell'header per posizionare correttamente il titolo desktop
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
  
  
  // Durata scheda (sincronizzata automaticamente con il numero di settimane)
  const [durationWeeks, setDurationWeeks] = useState(1);
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [durationWeeksTemp, setDurationWeeksTemp] = useState<string>('');
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [originalExercises, setOriginalExercises] = useState<Exercise[] | null>(null); // Esercizi originali - null indica che non sono ancora stati caricati
// Gestione giorni (G1–G10)
const [activeDayKey, setActiveDayKey] = useState<string>('G1');
const [originalDays, setOriginalDays] = useState<{ [key: string]: Exercise[] }>({ G1: [] });
const [variantDaysById, setVariantDaysById] = useState<{ [variantId: string]: { [key: string]: Exercise[] } }>({});
// Nomi personalizzati dei giorni: se assente si mostra l'indice (1,2,3...)
const [originalDayNames, setOriginalDayNames] = useState<{ [key: string]: string }>({});
const [variantDayNamesById, setVariantDayNamesById] = useState<{ [variantId: string]: { [key: string]: string } }>({});
// Stato rinomina giorno
const [renamingDayKey, setRenamingDayKey] = useState<string | null>(null);
const [renamingDayName, setRenamingDayName] = useState<string>('');

// Gestione settimane (W1–W12) per ogni allenamento, indipendenti nei contenuti
const [activeWeekKey, setActiveWeekKey] = useState<string>('W1');
const [weeks, setWeeks] = useState<string[]>(['W1']);
// Store delle settimane: mappa settimana -> giorni per l'originale
const [originalWeeksStore, setOriginalWeeksStore] = useState<{ [weekKey: string]: { [dayKey: string]: Exercise[] } }>({ W1: { G1: [] } });
// Store delle settimane: mappa variante -> (mappa settimana -> giorni)
  const [variantWeeksStoreById, setVariantWeeksStoreById] = useState<{ [variantId: string]: { [weekKey: string]: { [dayKey: string]: Exercise[] } } }>({});
  // Menu e posizione per azioni sulle settimane
  const [openWeekKeyMenu, setOpenWeekKeyMenu] = useState<string | null>(null);
  const [weekActionsPosition, setWeekActionsPosition] = useState<{ x: number, y: number } | null>(null);

  // Sincronizza durata con numero di settimane
  useEffect(() => {
    setDurationWeeks(Math.max(1, weeks.length));
  }, [weeks]);

  // Sincronizza automaticamente i cambiamenti dei giorni con lo store della settimana corrente
  useEffect(() => {
    setOriginalWeeksStore(prev => ({ ...prev, [activeWeekKey]: originalDays }));
  }, [originalDays, activeWeekKey]);

useEffect(() => {
  setVariantWeeksStoreById(prev => {
    const updated = { ...prev };
    Object.keys(variantDaysById).forEach(vid => {
      const weeksForVid = updated[vid] || {};
      weeksForVid[activeWeekKey] = variantDaysById[vid];
      updated[vid] = weeksForVid;
    });
    return updated;
  });
}, [variantDaysById, activeWeekKey]);

// Aggiungi una nuova settimana fino a 12
const handleAddWeek = () => {
  if (weeks.length >= 12) {
    setSaveMessage('Limite massimo di settimane raggiunto (12)');
    return;
  }
  // Trova il primo numero libero tra 2 e 12
  const usedNums = weeks.map(w => parseInt(w.replace(/^W/, ''), 10)).filter(n => !isNaN(n));
  let candidate: number | null = null;
  for (let n = 2; n <= 12; n++) {
    if (!usedNums.includes(n)) { candidate = n; break; }
  }
  if (!candidate) {
    setSaveMessage('Limite massimo di settimane raggiunto (12)');
    return;
  }
  const nextWeekKey = `W${candidate}`;
  setWeeks(prev => [...prev, nextWeekKey]);
  // Inizializza store per originale e varianti
  setOriginalWeeksStore(prev => ({ ...prev, [nextWeekKey]: { G1: [] } }));
  setVariantWeeksStoreById(prev => {
    const updated = { ...prev };
    variants.forEach(v => {
      const w = updated[v.id] || {};
      w[nextWeekKey] = { G1: [] };
      updated[v.id] = w;
    });
    return updated;
  });
  setSaveMessage('Settimana aggiunta');
  // Seleziona automaticamente la nuova settimana
  setActiveWeekKey(nextWeekKey);
  handleSwitchWeek(nextWeekKey);
  // Scorri la barra settimane verso destra per mostrare la nuova settimana (post-render)
  window.setTimeout(() => {
    const container = weekTabsRef.current;
    if (!container) return;
    const newTab = container.querySelector<HTMLButtonElement>(`button[data-week-key="${nextWeekKey}"]`);
    if (newTab && newTab.scrollIntoView) {
      try {
        newTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
      } catch {
        newTab.scrollIntoView();
      }
    } else {
      try {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      } catch {
        container.scrollLeft = container.scrollWidth;
      }
    }
  }, 0);
};

// Copia/Incolla variante (tutta la variante: settimane e nomi giorni)
const handleCopyVariant = (variantId: string) => {
  // Supporta copia anche dalla scheda originale
  const sourceWeeksStore = variantId === 'original' ? (originalWeeksStore || {}) : (variantWeeksStoreById[variantId] || {});
  const clonedWeeksStore: { [weekKey: string]: { [dayKey: string]: Exercise[] } } = {};
  Object.keys(sourceWeeksStore).forEach((wk) => {
    const days = sourceWeeksStore[wk] || {};
    const clonedDays: { [dayKey: string]: Exercise[] } = {};
    Object.keys(days).forEach((dk) => {
      clonedDays[dk] = deepCloneExercises(days[dk] || []);
    });
    clonedWeeksStore[wk] = clonedDays;
  });

  const sourceDayNames = variantId === 'original' ? (originalDayNames || {}) : (variantDayNamesById[variantId] || {});
  setVariantClipboard({
    sourceVariantId: variantId,
    data: { weeksStore: clonedWeeksStore, dayNames: { ...sourceDayNames } },
  });
  setSaveMessage('Variante copiata');
};

const handlePasteVariant = (targetVariantId: string) => {
  if (!variantClipboard) {
    setSaveMessage('Nessuna variante copiata');
    return;
  }
  if (variantClipboard.sourceVariantId === targetVariantId) {
    setSaveMessage('Non puoi incollare nella stessa variante');
    return;
  }
  // Unisci i week keys del clipboard con i week tabs globali
  const clipboardWeekKeys = Object.keys(variantClipboard.data.weeksStore || {});
  if (clipboardWeekKeys.length) {
    const unionWeeks = Array.from(new Set([...(weeks || []), ...clipboardWeekKeys])).sort((a, b) => {
      const na = parseInt(String(a).replace(/^W/, ''), 10);
      const nb = parseInt(String(b).replace(/^W/, ''), 10);
      return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
    }).slice(0, 12); // Rispetta limite a 12 settimane
    setWeeks(unionWeeks);
  }

  // Applica settimane e nomi giorni alla destinazione (originale o variante)
  if (targetVariantId === 'original') {
    // Aggiorna store e dayNames dell'originale
    const newOriginalWeeksStore = { ...(originalWeeksStore || {}), ...variantClipboard.data.weeksStore };
    setOriginalWeeksStore(newOriginalWeeksStore);
    const newOriginalDayNames = { ...variantClipboard.data.dayNames };
    setOriginalDayNames(newOriginalDayNames);
    // Sincronizza anche i giorni per la settimana attiva
    const daysForActiveWeek = newOriginalWeeksStore[activeWeekKey] || {};
    setOriginalDays(daysForActiveWeek);
    // Carica esercizi del giorno attivo
    const activeList = (daysForActiveWeek[activeDayKey] || []).map(ex => ({ ...ex }));
    setExercises(activeList);
    if (activeDayKey === 'G1') setOriginalExercises(activeList);
    // Attiva l'originale
    setVariants(variants.map(v => ({ ...v, isActive: false })));
    setActiveVariantId('original');
    setSaveMessage('Variante incollata sull\'originale e attivata');
  } else {
    // Aggiorna store e dayNames della variante di destinazione
    const newWeeksStoreForVariant = { ...(variantWeeksStoreById[targetVariantId] || {}), ...variantClipboard.data.weeksStore };
    setVariantWeeksStoreById({ ...variantWeeksStoreById, [targetVariantId]: newWeeksStoreForVariant });

    const newDayNamesForVariant = { ...variantClipboard.data.dayNames };
    setVariantDayNamesById({ ...variantDayNamesById, [targetVariantId]: newDayNamesForVariant });

    // Sincronizza anche i giorni per la settimana attiva
    const daysForActiveWeek = newWeeksStoreForVariant[activeWeekKey] || {};
    setVariantDaysById({ ...variantDaysById, [targetVariantId]: daysForActiveWeek });

    // Aggiorna record variante nell'array varianti e attivala
    const updatedVariants = variants.map(v => {
      if (v.id !== targetVariantId) return { ...v, isActive: false };
      return {
        ...v,
        isActive: true,
        days: daysForActiveWeek,
        dayNames: newDayNamesForVariant,
        exercises: daysForActiveWeek[activeDayKey] || v.exercises || [],
        updatedAt: new Date().toISOString(),
      };
    });
    setVariants(updatedVariants);

    // Cambia variante attiva e carica esercizi
    setActiveVariantId(targetVariantId);
    const activeList = (daysForActiveWeek[activeDayKey] || []).map(ex => ({ ...ex }));
    setExercises(activeList);
    setSaveMessage('Variante incollata e attivata');
  }

  triggerAutoSave();
};

// Rimuovi una settimana (non consentito rimuovere l’ultima) con conferma stile Apple
const handleRemoveWeek = (weekKey: string) => {
  if (weekKey === 'W1') {
    setSaveMessage('La prima settimana non può essere eliminata');
    return;
  }
  if (weeks.length <= 1) {
    setSaveMessage('Deve esistere almeno una settimana');
    return;
  }
  const weekNumber = parseInt(String(weekKey).replace(/^W/, ''), 10);
  showConfirmation(
    `Vuoi davvero eliminare Settimana ${isNaN(weekNumber) ? '' : weekNumber}? Tutti i giorni e gli esercizi collegati verranno rimossi.`,
    () => {
      const newWeeks = weeks.filter(w => w !== weekKey);
      setWeeks(newWeeks);
      setOriginalWeeksStore(prev => {
        const { [weekKey]: _omit, ...rest } = prev;
        return rest;
      });
      setVariantWeeksStoreById(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(vid => {
          const weeksMap = { ...updated[vid] };
          delete weeksMap[weekKey];
          updated[vid] = weeksMap;
        });
        return updated;
      });
      // Se abbiamo rimosso la settimana attiva, passa alla più bassa
      if (weekKey === activeWeekKey) {
        const sorted = newWeeks.slice().sort((a, b) => parseInt(a.replace('W','')) - parseInt(b.replace('W','')));
        const next = sorted[0] || 'W1';
        // Carica giorni per la nuova settimana
        const newOriginal = originalWeeksStore[next] || { G1: [] };
        const newVariantById: { [variantId: string]: { [dayKey: string]: Exercise[] } } = {};
        variants.forEach(v => {
          const store = variantWeeksStoreById[v.id] || {};
          newVariantById[v.id] = store[next] || { G1: [] };
        });
        setActiveWeekKey(next);
        setOriginalDays(newOriginal);
        setVariantDaysById(newVariantById);
        // Imposta una giornata valida (di default G1) per la nuova settimana
        const availableKeys = activeVariantId === 'original'
          ? Object.keys(newOriginal)
          : Object.keys(newVariantById[activeVariantId] || {});
        const sortedDayKeys = (availableKeys.length ? availableKeys : ['G1']).slice().sort((a, b) => {
          const na = parseInt(String(a).replace(/^G/, ''), 10);
          const nb = parseInt(String(b).replace(/^G/, ''), 10);
          return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
        });
        const nextDayKey = sortedDayKeys.includes(activeDayKey) ? activeDayKey : sortedDayKeys[0];
        setActiveDayKey(nextDayKey);
        const list = activeVariantId === 'original' ? (newOriginal[nextDayKey] || []) : ((newVariantById[activeVariantId] || {})[nextDayKey] || []);
        setExercises([...list]);
        if (activeVariantId === 'original' && nextDayKey === 'G1') setOriginalExercises([...list]);
      }
      setSaveMessage('Settimana rimossa');
      // Persisti subito la rimozione della settimana
      triggerAutoSave();
    }
  );
};

// Svuota tutti i giorni della settimana selezionata (originale o variante attiva)
const handleClearWeek = (weekKey: string) => {
  const isOriginal = activeVariantId === 'original';
  if (isOriginal) {
    const existingDaysMap = originalWeeksStore[weekKey] || {};
    const clearedDaysMap = Object.keys(existingDaysMap).reduce((acc: { [dayKey: string]: Exercise[] }, dk) => {
      acc[dk] = [];
      return acc;
    }, {} as { [dayKey: string]: Exercise[] });
    setOriginalWeeksStore(prev => ({ ...prev, [weekKey]: clearedDaysMap }));
    if (weekKey === activeWeekKey) {
      setOriginalDays(clearedDaysMap);
      if (activeDayKey in clearedDaysMap) {
        setExercises([]);
        if (activeDayKey === 'G1') setOriginalExercises([]);
      }
    }
  } else {
    const variantStoreForId = variantWeeksStoreById[activeVariantId] || {};
    const existingDaysMap = variantStoreForId[weekKey] || {};
    const clearedDaysMap = Object.keys(existingDaysMap).reduce((acc: { [dayKey: string]: Exercise[] }, dk) => {
      acc[dk] = [];
      return acc;
    }, {} as { [dayKey: string]: Exercise[] });
    setVariantWeeksStoreById(prev => {
      const updated = { ...prev } as typeof prev;
      updated[activeVariantId] = { ...(updated[activeVariantId] || {}), [weekKey]: clearedDaysMap };
      return updated;
    });
    if (weekKey === activeWeekKey) {
      setVariantDaysById(prev => ({ ...prev, [activeVariantId]: clearedDaysMap }));
      if (activeDayKey in clearedDaysMap) setExercises([]);
    }
  }
  setSaveMessage('Settimana svuotata');
  triggerAutoSave();
};

// Switch settimana (carica giorni/esercizi della settimana selezionata)
const handleSwitchWeek = (weekKey: string) => {
  if (weekKey === activeWeekKey) return;
  // Carica giorni e varianti dal relativo store
  const newOriginal = originalWeeksStore[weekKey] || { G1: [] };
  const newVariantById: { [variantId: string]: { [dayKey: string]: Exercise[] } } = {};
  variants.forEach(v => {
    const store = variantWeeksStoreById[v.id] || {};
    newVariantById[v.id] = store[weekKey] || { G1: [] };
  });
  setActiveWeekKey(weekKey);
  setOriginalDays(newOriginal);
  setVariantDaysById(newVariantById);
  // Imposta una giornata valida (di default G1) per la settimana selezionata
  const availableKeys = activeVariantId === 'original'
    ? Object.keys(newOriginal)
    : Object.keys(newVariantById[activeVariantId] || {});
  const sortedDayKeys = (availableKeys.length ? availableKeys : ['G1']).slice().sort((a, b) => {
    const na = parseInt(String(a).replace(/^G/, ''), 10);
    const nb = parseInt(String(b).replace(/^G/, ''), 10);
    return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
  });
  const nextDayKey = sortedDayKeys.includes(activeDayKey) ? activeDayKey : sortedDayKeys[0];
  setActiveDayKey(nextDayKey);
  const list = activeVariantId === 'original' ? (newOriginal[nextDayKey] || []) : ((newVariantById[activeVariantId] || {})[nextDayKey] || []);
  setExercises([...list]);
  if (activeVariantId === 'original' && nextDayKey === 'G1') setOriginalExercises([...list]);
  // Persisti subito il cambio settimana
  triggerAutoSave();
};

// Aggiungi un nuovo giorno alla scheda corrente (indipendente dalle varianti), con limite massimo a 10
const handleAddDay = () => {
  const currentKeys = activeVariantId === 'original'
    ? Object.keys(originalDays)
    : Object.keys(variantDaysById[activeVariantId] || {});

  // Se già ci sono 10 giornate, non aggiungere oltre
  if (currentKeys.length >= 10) {
    setSaveMessage('Limite massimo di giornate raggiunto (10)');
    return;
  }

  // Trova il primo numero disponibile tra 2 e 10 (G1 è sempre riservato)
  const usedNums = currentKeys
    .map(d => parseInt(String(d).replace(/^G/, ''), 10))
    .filter(n => !isNaN(n));
  let candidateNum: number | null = null;
  for (let n = 2; n <= 10; n++) {
    if (!usedNums.includes(n)) { candidateNum = n; break; }
  }
  if (!candidateNum) {
    setSaveMessage('Limite massimo di giornate raggiunto (10)');
    return;
  }
  const nextKey = `G${candidateNum}`;

  if (activeVariantId === 'original') {
    const newOriginalDays = { ...originalDays, [nextKey]: [] };
    setOriginalDays(newOriginalDays);
    // Aggiorna subito lo store settimane -> giorni per riflettere la nuova giornata
    setOriginalWeeksStore({ ...originalWeeksStore, [activeWeekKey]: newOriginalDays });
    // Nessun nome personalizzato di default: fallback numerico
    // Seleziona automaticamente la nuova giornata e mostra lista vuota
    setActiveDayKey(nextKey);
    setExercises([]);
  } else {
    const prevVariantDays = variantDaysById[activeVariantId] || {};
    const newVariantDays = { ...prevVariantDays, [nextKey]: [] };
    setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVariantDays });
    // Aggiorna il modello variante per coerenza
    const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, days: newVariantDays, updatedAt: new Date().toISOString() } : v);
    setVariants(updatedVariants);
    // Aggiorna subito lo store settimane -> giorni della variante
    const prevWeeksStore = variantWeeksStoreById[activeVariantId] || {};
    const newWeeksStoreForVariant = { ...prevWeeksStore, [activeWeekKey]: newVariantDays };
    setVariantWeeksStoreById({ ...variantWeeksStoreById, [activeVariantId]: newWeeksStoreForVariant });
    // Seleziona automaticamente la nuova giornata e mostra lista vuota
    setActiveDayKey(nextKey);
    setExercises([]);
  }

  // Scorri la toolbar giorni verso destra per mostrare il nuovo giorno (post-render)
  // Pianifica dopo il render per assicurare che il bottone del nuovo giorno esista nel DOM
  window.setTimeout(() => {
    const container = dayTabsRef.current;
    if (!container) return;
    // Tenta di portare esplicitamente in vista il nuovo tab
    const newTab = container.querySelector<HTMLButtonElement>(`button[data-day-key="${nextKey}"]`);
    if (newTab && newTab.scrollIntoView) {
      try {
        newTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'end' });
      } catch {
        // Fallback per browser che non supportano opzioni avanzate
        newTab.scrollIntoView();
      }
    } else {
      // Fallback: scorri fino alla fine
      try {
        container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
      } catch {
        container.scrollLeft = container.scrollWidth;
      }
    }
  }, 0);

  triggerAutoSave();
};
  const [showExerciseForm, setShowExerciseForm] = useState(false);
  const [showExerciseDropdown, setShowExerciseDropdown] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isSupersetMode, setIsSupersetMode] = useState(false);
const [supersetAnchorExerciseId, setSupersetAnchorExerciseId] = useState<string | null>(null);
const [supersetSelection, setSupersetSelection] = useState<string[]>([]);
const [openSupersetActionsId, setOpenSupersetActionsId] = useState<string | null>(null);
const [openCloneActionsId, setOpenCloneActionsId] = useState<string | null>(null);
const [openExerciseContextId, setOpenExerciseContextId] = useState<string | null>(null);
const [actionsMenuPosition, setActionsMenuPosition] = useState<{ top: number; left: number } | null>(null);
const [actionsMenuType, setActionsMenuType] = useState<'clone' | 'superset' | 'exercise' | null>(null);
// Riferimenti e configurazioni per posizionamento dinamico e rifiniture UI
const actionsMenuAnchorElRef = useRef<HTMLElement | null>(null);
const actionsMenuRef = useRef<HTMLDivElement | null>(null);
const [actionsMenuPlacement, setActionsMenuPlacement] = useState<'bottom' | 'top'>('bottom');
const MENU_OFFSET_Y = 8;
const MENU_MARGIN = 8;
const CLONE_MENU_WIDTH = 176; // w-44
const SUPERSET_MENU_WIDTH = 160; // w-40
const EXERCISE_MENU_WIDTH = 192; // w-48

// Long‑press per aprire il menu azioni esercizio (mobile)
const exerciseLongPressTriggeredRef = useRef(false);
const exercisePressStartPosRef = useRef<{ x: number; y: number } | null>(null);
const exerciseLongPressTimeoutRef = useRef<number | null>(null);

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const closeActionsMenu = () => {
  setOpenCloneActionsId(null);
  setOpenSupersetActionsId(null);
  setOpenExerciseContextId(null);
  setActionsMenuPosition(null);
  setActionsMenuType(null);
  actionsMenuAnchorElRef.current = null;
};

const computeAndSetMenuPosition = (anchor: HTMLElement, type: 'clone' | 'superset' | 'exercise') => {
  actionsMenuAnchorElRef.current = anchor;
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const menuWidth = type === 'clone' ? CLONE_MENU_WIDTH : type === 'superset' ? SUPERSET_MENU_WIDTH : EXERCISE_MENU_WIDTH;
  const left = clamp(rect.left + rect.width / 2, MENU_MARGIN + menuWidth / 2, vw - MENU_MARGIN - menuWidth / 2);
  const top = rect.bottom + MENU_OFFSET_Y;
  setActionsMenuPlacement('bottom');
  setActionsMenuPosition({ top, left });
  setActionsMenuType(type);
};

const updateMenuPosition = useCallback(() => {
  const anchor = actionsMenuAnchorElRef.current;
  if (!anchor || !actionsMenuType) return;
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const menuWidth = actionsMenuType === 'clone' ? CLONE_MENU_WIDTH : actionsMenuType === 'superset' ? SUPERSET_MENU_WIDTH : EXERCISE_MENU_WIDTH;
  const left = clamp(rect.left + rect.width / 2, MENU_MARGIN + menuWidth / 2, vw - MENU_MARGIN - menuWidth / 2);
  let top = rect.bottom + MENU_OFFSET_Y;
  let placement: 'bottom' | 'top' = 'bottom';
  const menuEl = actionsMenuRef.current;
  if (menuEl) {
    const mh = menuEl.offsetHeight || 0;
    if (top + mh + MENU_MARGIN > window.innerHeight) {
      top = rect.top - MENU_OFFSET_Y - mh;
      placement = 'top';
    }
  }
  setActionsMenuPlacement(placement);
  setActionsMenuPosition({ top, left });
}, [actionsMenuType]);

useEffect(() => {
  if (!actionsMenuType) return;
  const handler = () => updateMenuPosition();
  window.addEventListener('scroll', handler, true);
  window.addEventListener('resize', handler);
  // aggiornamento iniziale
  setTimeout(handler, 0);
  return () => {
    window.removeEventListener('scroll', handler, true);
    window.removeEventListener('resize', handler);
  };
}, [actionsMenuType, updateMenuPosition]);
  // Stato bozza/pubblicata rimosso
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [variants, setVariants] = useState<WorkoutVariant[]>([]);
  const [activeVariantId, setActiveVariantId] = useState('original');
  // Varianti visibili nell'UI di selezione: per l'atleta mostriamo solo quelle assegnate
  const displayVariants = useMemo(() => {
    if (!isAthlete) return variants;
    return variants.filter(v => allowedVariantIds.has(v.id));
  }, [variants, isAthlete, allowedVariantIds]);

  // Tags
  const [tags, setTags] = useState<string[]>([]);
  const [showTagsDropdown, setShowTagsDropdown] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showGymTagsList, setShowGymTagsList] = useState(false);
  const [selectedTagUnderDesc, setSelectedTagUnderDesc] = useState<string | null>(null);
  const gymTagsGroupRef = useRef<HTMLDivElement>(null);
  const tagsUnderDescContainerRef = useRef<HTMLDivElement>(null);

  // Lista di tag predefiniti per suggerimenti nella palestra
  const PREDEFINED_GYM_TAGS: string[] = [
    'forza','massa','powerlifting','tonificazione','principianti','fitness','cardio','hiit','intenso',
    'resistenza','mobilità','stretching','funzionale','core','equilibrio','braccia','gambe','petto','spalle','schiena','glutei','addominali',
    'warm-up','defaticamento','tecnica','circuito','superset','ipertrofia','dimagrimento','riabilitazione'
  ];

  const handleAddTag = async (tagToAdd?: string) => {
    const trimmed = (tagToAdd ?? newTag).trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) { if (!tagToAdd) setNewTag(''); return; }
    if (tags.length >= 10) return;
    const updated = [...tags, trimmed];
    setTags(updated);
    if (!tagToAdd) setNewTag('');
    // Notifica aggiunta tag
    setSaveMessage('Tag aggiunto alla scheda');
    if (workoutId) {
      try {
        await updateWorkoutPlan(workoutId, { tags: updated, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.error('Errore nel salvataggio dei tag:', e);
      }
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updated = tags.filter(t => t !== tagToRemove);
    setTags(updated);
    // Notifica rimozione tag
    setSaveMessage('Tag rimosso dalla scheda');
    if (workoutId) {
      try {
        await updateWorkoutPlan(workoutId, { tags: updated, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.error('Errore nel salvataggio dei tag:', e);
      }
    }
  };

  // Toggle tag: se presente rimuove, altrimenti aggiunge (rispettando limite 10)
  const handleToggleTag = async (tagName: string) => {
    if (tags.includes(tagName)) {
      await handleRemoveTag(tagName);
    } else {
      if (tags.length >= 10) return;
      await handleAddTag(tagName);
    }
  };

  // Flag per applicare l'attivazione iniziale una sola volta
  const initialVariantAppliedRef = useRef(false);

  // Attiva la variante iniziale se fornita (apertura da ricerca intelligente) una sola volta
  useEffect(() => {
    if (!initialActiveVariantId || initialActiveVariantId === 'original') return;
    if (initialVariantAppliedRef.current) return;
    if (variants.length === 0) return;

    const selectedVariant = variants.find(v => v.id === initialActiveVariantId);
    if (selectedVariant) {
      // Evidenzia correttamente la variante attiva nei bottoni di navigazione
      setVariants(variants.map(v => ({ ...v, isActive: v.id === initialActiveVariantId })));
      setActiveVariantId(initialActiveVariantId);
      // Carica gli esercizi e la descrizione della variante (se presenti)
      if (selectedVariant.exercises && selectedVariant.exercises.length > 0) {
        setExercises([ ...(selectedVariant.exercises as Exercise[]) ]);
      } else {
        // Variante senza esercizi: lista vuota finché l’utente non aggiunge
        setExercises([]);
      }
      setWorkoutDescription(selectedVariant.description || '');
      initialVariantAppliedRef.current = true;
    }
  }, [initialActiveVariantId, variants.length]);
  const [originalWorkoutTitle, setOriginalWorkoutTitle] = useState('');
  const [folderIconName, setFolderIconName] = useState<string>('Folder');
const [draggedExerciseIndex, setDraggedExerciseIndex] = useState<number | null>(null);
const [dragOverExerciseIndex, setDragOverExerciseIndex] = useState<number | null>(null);
const [selectedSwapIndex, setSelectedSwapIndex] = useState<number | null>(null);
const dayPressTimerRef = useRef<number | null>(null);
const [draggedExerciseId, setDraggedExerciseId] = useState<string | null>(null);

  // Offset dinamico per far iniziare il contenitore sotto l'header (varianti in header)
  const [headerOffsetTop, setHeaderOffsetTop] = useState<number>(0);
  const updateHeaderOffsetTop = useCallback(() => {
    try {
      const headerEl = document.querySelector('header');
      // Se l'header è presente ed è fixed, usa la sua altezza totale
      const h = headerEl ? (headerEl as HTMLElement).getBoundingClientRect().height : 0;
      // Spazio minimo tra barra varianti e inizio contenitore
      setHeaderOffsetTop(Math.max(0, Math.round(h)));
    } catch {
      setHeaderOffsetTop(0);
    }
  }, []);
  useEffect(() => {
    updateHeaderOffsetTop();
    const handler = () => updateHeaderOffsetTop();
    window.addEventListener('resize', handler);
    // Alcuni overlay/portals possono cambiare layout al scroll (header trasparente): ricalcola
    window.addEventListener('scroll', handler, true);
    // Ricalcola anche dopo breve delay per attendere il rendering del Portal
    const t = window.setTimeout(updateHeaderOffsetTop, 50);
    return () => {
      window.removeEventListener('resize', handler);
      window.removeEventListener('scroll', handler, true);
      window.clearTimeout(t);
    };
  }, [updateHeaderOffsetTop, isStandaloneMobile, activeVariantId, variants.length]);

  // Se l'utente è atleta, garantisci che la variante attiva sia consentita
  useEffect(() => {
    if (!isAthlete) return;
    // Se l'originale non è consentito e attivo, passa alla prima variante consentita
    if (activeVariantId === 'original' && !canSeeOriginal) {
      const firstAllowed = displayVariants[0]?.id;
      if (firstAllowed && firstAllowed !== activeVariantId) {
        setActiveVariantId(firstAllowed);
      }
    }
    // Se è attiva una variante non consentita (cambio manuale), rientra in una consentita
    if (activeVariantId !== 'original' && !allowedVariantIds.has(activeVariantId)) {
      const firstAllowed = displayVariants[0]?.id || (canSeeOriginal ? 'original' : 'original');
      if (firstAllowed && firstAllowed !== activeVariantId) {
        setActiveVariantId(firstAllowed);
      }
    }
  }, [isAthlete, activeVariantId, canSeeOriginal, allowedVariantIds, displayVariants]);
  
  // Scorrimento orizzontale dei tab varianti via drag/swipe
const variantTabsRef = useRef<HTMLDivElement>(null);
const [isDragging, setIsDragging] = useState(false);
const dragStartXRef = useRef(0);
const scrollStartLeftRef = useRef(0);
const dragInitiatedRef = useRef(false);

// Ref per i tab per auto-scroll verso la variante attiva
const originalTabRef = useRef<HTMLDivElement | null>(null);
const variantTabRefs = useRef<Record<string, HTMLDivElement | null>>({});

// Scorrimento orizzontale dei tab giorni via drag/swipe (stile varianti)
const dayTabsRef = useRef<HTMLDivElement>(null);
const [isDraggingDays, setIsDraggingDays] = useState(false);
const dayDragStartXRef = useRef(0);
const dayScrollStartLeftRef = useRef(0);
const dayDragInitiatedRef = useRef(false);
const dayPointerIdRef = useRef<number | null>(null);

// Scorrimento orizzontale dei tab settimane via drag/swipe (stile giorni)
const weekTabsRef = useRef<HTMLDivElement>(null);
const [isDraggingWeeks, setIsDraggingWeeks] = useState(false);
const weekDragStartXRef = useRef(0);
const weekScrollStartLeftRef = useRef(0);
const weekDragInitiatedRef = useRef(false);
const weekPointerIdRef = useRef<number | null>(null);
// Long‑press context menu for day tabs
const DAY_LONG_PRESS_MS = 400;
const dayLongPressTriggeredRef = useRef(false);
const dayPressStartPosRef = useRef<{ x: number; y: number } | null>(null);
const [openDayKeyMenu, setOpenDayKeyMenu] = useState<string | null>(null);
const dayMenuAnchorElRef = useRef<HTMLElement | null>(null);
const dayMenuRef = useRef<HTMLDivElement | null>(null);
const [dayMenuPosition, setDayMenuPosition] = useState<{ top: number; left: number } | null>(null);
const [dayMenuPlacement, setDayMenuPlacement] = useState<'bottom' | 'top'>('bottom');
const DAY_MENU_WIDTH = 160; // w-40
// Timeout per long‑press giorni
const dayLongPressTimeoutRef = useRef<number | null>(null);
// Clipboard per copia/incolla giornate (tra giorni e settimane)
const [dayClipboard, setDayClipboard] = useState<{
  exercises: Exercise[];
  name?: string;
  sourceVariantId: string;
  sourceWeekKey: string;
  sourceDayKey: string;
} | null>(null);

// Clipboard per copia/incolla settimane
const [weekClipboard, setWeekClipboard] = useState<{
  sourceVariantId: string;
  sourceWeekKey: string;
  data: { [dayKey: string]: Exercise[] };
} | null>(null);

// Clipboard per copia/incolla varianti (tutta la variante: settimane e nomi giorni)
const [variantClipboard, setVariantClipboard] = useState<{
  sourceVariantId: string;
  data: {
    weeksStore: { [weekKey: string]: { [dayKey: string]: Exercise[] } };
    dayNames: { [key: string]: string };
  };
} | null>(null);

// Long‑press context menu for variant tabs
const VARIANT_LONG_PRESS_MS = 400;
const variantLongPressTriggeredRef = useRef(false);
const variantPressStartPosRef = useRef<{ x: number; y: number } | null>(null);
const [openVariantMenuId, setOpenVariantMenuId] = useState<string | null>(null);
const variantMenuAnchorElRef = useRef<HTMLElement | null>(null);
const variantMenuRef = useRef<HTMLDivElement | null>(null);
const [variantMenuPosition, setVariantMenuPosition] = useState<{ top: number; left: number } | null>(null);
const [variantMenuPlacement, setVariantMenuPlacement] = useState<'bottom' | 'top'>('bottom');
const VARIANT_MENU_WIDTH = 140; // w-36
// Timeout per long‑press varianti
const variantLongPressTimeoutRef = useRef<number | null>(null);

// Settimane: anchor/posizionamento per menu azioni
const weekMenuAnchorElRef = useRef<HTMLElement | null>(null);
const weekMenuRef = useRef<HTMLDivElement | null>(null);
const [weekMenuPosition, setWeekMenuPosition] = useState<{ top: number; left: number } | null>(null);
const [weekMenuPlacement, setWeekMenuPlacement] = useState<'bottom' | 'top'>('bottom');
const WEEK_MENU_WIDTH = 160; // w-40
// Long‑press context menu per settimane
const weekLongPressTriggeredRef = useRef(false);
const weekPressStartPosRef = useRef<{ x: number; y: number } | null>(null);
const weekLongPressTimeoutRef = useRef<number | null>(null);

const closeWeekMenu = () => {
  setOpenWeekKeyMenu(null);
  setWeekMenuPosition(null);
  weekMenuAnchorElRef.current = null;
};

const computeAndSetWeekMenuPosition = (anchor: HTMLElement) => {
  weekMenuAnchorElRef.current = anchor;
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const left = clamp(rect.left + rect.width / 2, MENU_MARGIN + WEEK_MENU_WIDTH / 2, vw - MENU_MARGIN - WEEK_MENU_WIDTH / 2);
  let top = rect.bottom + MENU_OFFSET_Y;
  setWeekMenuPlacement('bottom');
  setWeekMenuPosition({ top, left });
};

const updateWeekMenuPosition = useCallback(() => {
  const anchor = weekMenuAnchorElRef.current;
  if (!anchor || !openWeekKeyMenu) return;
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const left = clamp(rect.left + rect.width / 2, MENU_MARGIN + WEEK_MENU_WIDTH / 2, vw - MENU_MARGIN - WEEK_MENU_WIDTH / 2);
  let top = rect.bottom + MENU_OFFSET_Y;
  const menuEl = weekMenuRef.current;
  let placement: 'bottom' | 'top' = 'bottom';
  if (menuEl) {
    const mh = menuEl.offsetHeight || 0;
    if (top + mh + MENU_MARGIN > window.innerHeight) {
      top = rect.top - MENU_OFFSET_Y - mh;
      placement = 'top';
    }
  }
  setWeekMenuPlacement(placement);
  setWeekMenuPosition({ top, left });
}, [openWeekKeyMenu]);

useEffect(() => {
  if (!openWeekKeyMenu) return;
  const handler = () => updateWeekMenuPosition();
  window.addEventListener('resize', handler);
  window.addEventListener('scroll', handler, true);
  // aggiornamento iniziale
  setTimeout(handler, 0);
  return () => {
    window.removeEventListener('resize', handler);
    window.removeEventListener('scroll', handler, true);
  };
}, [openWeekKeyMenu, updateWeekMenuPosition]);

const closeDayMenu = () => {
  setOpenDayKeyMenu(null);
  setDayMenuPosition(null);
  dayMenuAnchorElRef.current = null;
};

const closeVariantMenu = () => {
  setOpenVariantMenuId(null);
  setVariantMenuPosition(null);
  variantMenuAnchorElRef.current = null;
};

const computeAndSetDayMenuPosition = (anchor: HTMLElement) => {
  dayMenuAnchorElRef.current = anchor;
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const left = clamp(rect.left + rect.width / 2, MENU_MARGIN + DAY_MENU_WIDTH / 2, vw - MENU_MARGIN - DAY_MENU_WIDTH / 2);
  let top = rect.bottom + MENU_OFFSET_Y;
  setDayMenuPlacement('bottom');
  setDayMenuPosition({ top, left });
};

const computeAndSetVariantMenuPosition = (anchor: HTMLElement) => {
  variantMenuAnchorElRef.current = anchor;
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const left = clamp(rect.left + rect.width / 2, MENU_MARGIN + VARIANT_MENU_WIDTH / 2, vw - MENU_MARGIN - VARIANT_MENU_WIDTH / 2);
  let top = rect.bottom + MENU_OFFSET_Y;
  setVariantMenuPlacement('bottom');
  setVariantMenuPosition({ top, left });
};

const updateDayMenuPosition = useCallback(() => {
  const anchor = dayMenuAnchorElRef.current;
  if (!anchor || !openDayKeyMenu) return;
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const left = clamp(rect.left + rect.width / 2, MENU_MARGIN + DAY_MENU_WIDTH / 2, vw - MENU_MARGIN - DAY_MENU_WIDTH / 2);
  let top = rect.bottom + MENU_OFFSET_Y;
  const menuEl = dayMenuRef.current;
  let placement: 'bottom' | 'top' = 'bottom';
  if (menuEl) {
    const mh = menuEl.offsetHeight || 0;
    if (top + mh + MENU_MARGIN > window.innerHeight) {
      top = rect.top - MENU_OFFSET_Y - mh;
      placement = 'top';
    }
  }
  setDayMenuPlacement(placement);
  setDayMenuPosition({ top, left });
}, [openDayKeyMenu]);

const updateVariantMenuPosition = useCallback(() => {
  const anchor = variantMenuAnchorElRef.current;
  if (!anchor || !openVariantMenuId) return;
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const left = clamp(rect.left + rect.width / 2, MENU_MARGIN + VARIANT_MENU_WIDTH / 2, vw - MENU_MARGIN - VARIANT_MENU_WIDTH / 2);
  let top = rect.bottom + MENU_OFFSET_Y;
  const menuEl = variantMenuRef.current;
  let placement: 'bottom' | 'top' = 'bottom';
  if (menuEl) {
    const mh = menuEl.offsetHeight || 0;
    if (top + mh + MENU_MARGIN > window.innerHeight) {
      top = rect.top - MENU_OFFSET_Y - mh;
      placement = 'top';
    }
  }
  setVariantMenuPlacement(placement);
  setVariantMenuPosition({ top, left });
}, [openVariantMenuId]);

useEffect(() => {
  if (!openDayKeyMenu) return;
  const handler = () => updateDayMenuPosition();
  window.addEventListener('resize', handler);
  window.addEventListener('scroll', handler, true);
  return () => {
    window.removeEventListener('resize', handler);
    window.removeEventListener('scroll', handler, true);
  };
}, [openDayKeyMenu, updateDayMenuPosition]);

useEffect(() => {
  if (!openVariantMenuId) return;
  const handler = () => updateVariantMenuPosition();
  window.addEventListener('resize', handler);
  window.addEventListener('scroll', handler, true);
  return () => {
    window.removeEventListener('resize', handler);
    window.removeEventListener('scroll', handler, true);
  };
}, [openVariantMenuId, updateVariantMenuPosition]);

// Chiusura automatica dei menu Varianti/Settimane/Giornate quando si clicca fuori
useEffect(() => {
  if (!openVariantMenuId && !openWeekKeyMenu && !openDayKeyMenu) return;

  const handlePointerDown = (e: PointerEvent) => {
    const target = e.target as Node | null;
    if (!target) return;

    // Se clicco dentro uno dei menu, non chiudo
    const isInsideVariantMenu = !!(variantMenuRef.current && variantMenuRef.current.contains(target));
    const isInsideWeekMenu = !!(weekMenuRef.current && weekMenuRef.current.contains(target));
    const isInsideDayMenu = !!(dayMenuRef.current && dayMenuRef.current.contains(target));

    if (isInsideVariantMenu || isInsideWeekMenu || isInsideDayMenu) return;

    // Clic ovunque fuori: chiudo tutti i menu aperti
    if (openVariantMenuId) closeVariantMenu();
    if (openWeekKeyMenu) closeWeekMenu();
    if (openDayKeyMenu) closeDayMenu();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (openVariantMenuId) closeVariantMenu();
      if (openWeekKeyMenu) closeWeekMenu();
      if (openDayKeyMenu) closeDayMenu();
    }
  };

  // Usa cattura per intercettare il click prima che altri handler lo consumino
  window.addEventListener('pointerdown', handlePointerDown, true);
  window.addEventListener('keydown', handleKeyDown);
  return () => {
    window.removeEventListener('pointerdown', handlePointerDown, true);
    window.removeEventListener('keydown', handleKeyDown);
  };
}, [openVariantMenuId, openWeekKeyMenu, openDayKeyMenu]);
// Fallback: rilascia lo scroll anche se il puntatore esce dal contenitore
const handleDayTabsWindowPointerUp = (_e: PointerEvent) => {
  setIsDraggingDays(false);
  dayDragInitiatedRef.current = false;
  try {
    const id = (_e as any).pointerId;
    if (dayTabsRef.current && typeof (dayTabsRef.current as any).releasePointerCapture === 'function') {
      (dayTabsRef.current as any).releasePointerCapture(id);
    }
  } catch {}
  window.removeEventListener('pointerup', handleDayTabsWindowPointerUp);
  window.removeEventListener('pointercancel', handleDayTabsWindowPointerUp);
};

// Fallback: rilascia lo scroll anche se il puntatore esce dal contenitore (settimane)
const handleWeekTabsWindowPointerUp = (_e: PointerEvent) => {
  setIsDraggingWeeks(false);
  weekDragInitiatedRef.current = false;
  try {
    const id = (_e as any).pointerId;
    if (weekTabsRef.current && typeof (weekTabsRef.current as any).releasePointerCapture === 'function') {
      (weekTabsRef.current as any).releasePointerCapture(id);
    }
  } catch {}
  window.removeEventListener('pointerup', handleWeekTabsWindowPointerUp);
  window.removeEventListener('pointercancel', handleWeekTabsWindowPointerUp);
};

const handleDayTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!dayTabsRef.current) return;
  setIsDraggingDays(false);
  dayDragInitiatedRef.current = true;
  dayPointerIdRef.current = (e as any).pointerId ?? null;
  dayDragStartXRef.current = e.clientX;
  dayScrollStartLeftRef.current = dayTabsRef.current.scrollLeft;
  // Non catturare subito: lascia passare click/long‑press al bottone.
  // Fallback globale per rilascio
  window.addEventListener('pointerup', handleDayTabsWindowPointerUp, { once: true });
  window.addEventListener('pointercancel', handleDayTabsWindowPointerUp, { once: true });
};

const handleWeekTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!weekTabsRef.current) return;
  setIsDraggingWeeks(false);
  weekDragInitiatedRef.current = true;
  weekPointerIdRef.current = (e as any).pointerId ?? null;
  weekDragStartXRef.current = e.clientX;
  weekScrollStartLeftRef.current = weekTabsRef.current.scrollLeft;
  window.addEventListener('pointerup', handleWeekTabsWindowPointerUp, { once: true });
  window.addEventListener('pointercancel', handleWeekTabsWindowPointerUp, { once: true });
};

const handleWeekTabsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!weekTabsRef.current || !weekDragInitiatedRef.current) return;
  const deltaX = e.clientX - weekDragStartXRef.current;
  if (Math.abs(deltaX) > 5) {
    if (!isDraggingWeeks) {
      setIsDraggingWeeks(true);
      try { (weekTabsRef.current as any).setPointerCapture?.(weekPointerIdRef.current as any); } catch {}
    }
    weekTabsRef.current.scrollLeft = weekScrollStartLeftRef.current - deltaX;
    e.preventDefault();
  }
};

const handleWeekTabsPointerUp = (_e: React.PointerEvent<HTMLDivElement>) => {
  setIsDraggingWeeks(false);
  weekDragInitiatedRef.current = false;
  try { (weekTabsRef.current as any).releasePointerCapture?.((_e as any).pointerId); } catch {}
  weekPointerIdRef.current = null;
  window.removeEventListener('pointerup', handleWeekTabsWindowPointerUp);
  window.removeEventListener('pointercancel', handleWeekTabsWindowPointerUp);
};

const handleWeekTabsPointerCancel = (_e: React.PointerEvent<HTMLDivElement>) => {
  setIsDraggingWeeks(false);
  weekDragInitiatedRef.current = false;
  try { (weekTabsRef.current as any).releasePointerCapture?.((_e as any).pointerId); } catch {}
  weekPointerIdRef.current = null;
  window.removeEventListener('pointerup', handleWeekTabsWindowPointerUp);
  window.removeEventListener('pointercancel', handleWeekTabsWindowPointerUp);
};

const handleWeekTabsPointerLeave = (_e: React.PointerEvent<HTMLDivElement>) => {
  setIsDraggingWeeks(false);
  weekDragInitiatedRef.current = false;
  try { (weekTabsRef.current as any).releasePointerCapture?.((_e as any).pointerId); } catch {}
  weekPointerIdRef.current = null;
  window.removeEventListener('pointerup', handleWeekTabsWindowPointerUp);
  window.removeEventListener('pointercancel', handleWeekTabsWindowPointerUp);
};

const handleDayTabsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!dayTabsRef.current || !dayDragInitiatedRef.current) return;
  const deltaX = e.clientX - dayDragStartXRef.current;
  if (Math.abs(deltaX) > 5) {
    if (!isDraggingDays) {
      setIsDraggingDays(true);
      // Avviato drag: cattura il puntatore e annulla il long‑press
      try { (dayTabsRef.current as any).setPointerCapture?.(dayPointerIdRef.current as any); } catch {}
      if (dayPressTimerRef.current) {
        window.clearTimeout(dayPressTimerRef.current);
        dayPressTimerRef.current = null;
      }
    }
    dayTabsRef.current.scrollLeft = dayScrollStartLeftRef.current - deltaX;
    e.preventDefault();
  }
};

const handleDayTabsPointerUp = (_e: React.PointerEvent<HTMLDivElement>) => {
  setIsDraggingDays(false);
  dayDragInitiatedRef.current = false;
  try { (dayTabsRef.current as any).releasePointerCapture?.((_e as any).pointerId); } catch {}
  dayPointerIdRef.current = null;
  window.removeEventListener('pointerup', handleDayTabsWindowPointerUp);
  window.removeEventListener('pointercancel', handleDayTabsWindowPointerUp);
};

const handleDayTabsPointerCancel = (_e: React.PointerEvent<HTMLDivElement>) => {
  setIsDraggingDays(false);
  dayDragInitiatedRef.current = false;
  try { (dayTabsRef.current as any).releasePointerCapture?.((_e as any).pointerId); } catch {}
  dayPointerIdRef.current = null;
  window.removeEventListener('pointerup', handleDayTabsWindowPointerUp);
  window.removeEventListener('pointercancel', handleDayTabsWindowPointerUp);
};

const handleDayTabsPointerLeave = (_e: React.PointerEvent<HTMLDivElement>) => {
  // In caso di uscita improvvisa, rilascia lo stato di drag
  setIsDraggingDays(false);
  dayDragInitiatedRef.current = false;
  try { (dayTabsRef.current as any).releasePointerCapture?.((_e as any).pointerId); } catch {}
  dayPointerIdRef.current = null;
  window.removeEventListener('pointerup', handleDayTabsWindowPointerUp);
  window.removeEventListener('pointercancel', handleDayTabsWindowPointerUp);
};

// Rename day modal handlers
const handleStartRenameDay = (dayKey: string) => {
  setRenamingDayKey(dayKey);
  setRenamingDayName(getDayDisplayName(dayKey));
  closeDayMenu();
};

const handleCancelRenameDay = () => {
  setRenamingDayKey(null);
  setRenamingDayName('');
};

const handleSaveDayName = () => {
  const dk = renamingDayKey;
  const newName = (renamingDayName || '').trim();
  if (!dk) return;
  if (activeVariantId === 'original') {
    const updatedNames = { ...originalDayNames };
    if (newName) updatedNames[dk] = newName; else delete updatedNames[dk];
    setOriginalDayNames(updatedNames);
  } else {
    const prev = variantDayNamesById[activeVariantId] || {};
    const updatedNames = { ...prev };
    if (newName) updatedNames[dk] = newName; else delete updatedNames[dk];
    setVariantDayNamesById({ ...variantDayNamesById, [activeVariantId]: updatedNames });
    const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, dayNames: updatedNames, updatedAt: new Date().toISOString() } : v);
    setVariants(updatedVariants);
  }
  setSaveMessage(`Nome allenamento aggiornato: ${newName || getDayDisplayName(dk)}`);
  triggerAutoSave();
  setRenamingDayKey(null);
  setRenamingDayName('');
};

// Copia/Incolla giornata
const handleCopyDay = (dayKey: string) => {
  const sourceDays = activeVariantId === 'original' ? originalDays : (variantDaysById[activeVariantId] || {});
  const copiedExercises: Exercise[] = [...(sourceDays[dayKey] || [])];
  const copiedName = activeVariantId === 'original' ? originalDayNames[dayKey] : (variantDayNamesById[activeVariantId] || {})[dayKey];
  setDayClipboard({
    exercises: copiedExercises,
    name: copiedName,
    sourceVariantId: activeVariantId,
    sourceWeekKey: activeWeekKey,
    sourceDayKey: dayKey,
  });
  setSaveMessage('Giornata copiata');
  closeDayMenu();
};

const handlePasteDay = (targetDayKey: string) => {
  if (!dayClipboard) {
    setSaveMessage('Nessuna giornata copiata');
    closeDayMenu();
    return;
  }
  // Impedisci incolla sulla stessa giornata (stessa variante, settimana e giorno)
  if (
    dayClipboard.sourceVariantId === activeVariantId &&
    dayClipboard.sourceWeekKey === activeWeekKey &&
    dayClipboard.sourceDayKey === targetDayKey
  ) {
    setSaveMessage('Non puoi incollare nella stessa giornata');
    closeDayMenu();
    return;
  }

  const cloned = deepCloneExercises(dayClipboard.exercises || []);
  if (activeVariantId === 'original') {
    const newDays = { ...originalDays, [targetDayKey]: cloned };
    setOriginalDays(newDays);
    setOriginalWeeksStore({ ...originalWeeksStore, [activeWeekKey]: newDays });
  } else {
    const prevVarDays = variantDaysById[activeVariantId] || {};
    const newVarDays = { ...prevVarDays, [targetDayKey]: cloned };
    setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVarDays });
    const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, days: newVarDays, updatedAt: new Date().toISOString() } : v);
    setVariants(updatedVariants);
    const prevWeeksStore = variantWeeksStoreById[activeVariantId] || {};
    const newWeeksStoreForVariant = { ...prevWeeksStore, [activeWeekKey]: newVarDays };
    setVariantWeeksStoreById({ ...variantWeeksStoreById, [activeVariantId]: newWeeksStoreForVariant });
  }
  // Seleziona la giornata incollata e applica gli esercizi
  setActiveDayKey(targetDayKey);
  applyExercisesUpdate(cloned);
  setSaveMessage('Giornata incollata');
  closeDayMenu();
};

// Copia/Incolla settimana
const handleCopyWeek = (weekKey: string) => {
  // Preleva i giorni della settimana dal relativo store (originale o variante)
  const sourceWeekDays = activeVariantId === 'original'
    ? (originalWeeksStore[weekKey] || {})
    : ((variantWeeksStoreById[activeVariantId] || {})[weekKey] || {});

  // Clona profondamente tutti gli esercizi di ogni giorno della settimana
  const clonedWeekData: { [dayKey: string]: Exercise[] } = {};
  Object.keys(sourceWeekDays).forEach((dk) => {
    const list = sourceWeekDays[dk] || [];
    clonedWeekData[dk] = deepCloneExercises(list);
  });

  setWeekClipboard({
    sourceVariantId: activeVariantId,
    sourceWeekKey: weekKey,
    data: clonedWeekData,
  });
  setSaveMessage('Settimana copiata');
};

const handlePasteWeek = (targetWeekKey: string) => {
  if (!weekClipboard) {
    setSaveMessage('Nessuna settimana copiata');
    return;
  }
  // Impedisci incolla sulla stessa settimana nel medesimo contesto
  if (weekClipboard.sourceVariantId === activeVariantId && weekClipboard.sourceWeekKey === targetWeekKey) {
    setSaveMessage('Non puoi incollare nella stessa settimana');
    return;
  }

  // Applica i giorni clonati alla settimana di destinazione
  if (activeVariantId === 'original') {
    const newOriginalWeeksStore = { ...originalWeeksStore, [targetWeekKey]: weekClipboard.data };
    setOriginalWeeksStore(newOriginalWeeksStore);
    // Se stiamo incollando sulla settimana attiva, sincronizza anche lo stato locale dei giorni
    if (targetWeekKey === activeWeekKey) {
      setOriginalDays(weekClipboard.data);
      // Mantieni gli esercizi attivi coerenti con la giornata attiva corrente
      const activeList = weekClipboard.data[activeDayKey] || [];
      applyExercisesUpdate(activeList);
    }
  } else {
    const prevWeeksStoreForVariant = variantWeeksStoreById[activeVariantId] || {};
    const newWeeksStoreForVariant = { ...prevWeeksStoreForVariant, [targetWeekKey]: weekClipboard.data };
    setVariantWeeksStoreById({ ...variantWeeksStoreById, [activeVariantId]: newWeeksStoreForVariant });
    // Aggiorna anche lo stato locale dei giorni se incolliamo sulla settimana attiva
    if (targetWeekKey === activeWeekKey) {
      setVariantDaysById({ ...variantDaysById, [activeVariantId]: weekClipboard.data });
      const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, days: weekClipboard.data, updatedAt: new Date().toISOString() } : v);
      setVariants(updatedVariants);
      const activeList = weekClipboard.data[activeDayKey] || [];
      applyExercisesUpdate(activeList);
    }
  }

  setSaveMessage('Settimana incollata');
  // Seleziona e porta in vista la settimana di destinazione
  try {
    handleSwitchWeek(targetWeekKey);
  } catch {}
  // Scroll: prova a portare il tab in vista
  window.setTimeout(() => {
    const container = weekTabsRef.current;
    if (!container) return;
    const tab = container.querySelector<HTMLButtonElement>(`button[data-week-key="${targetWeekKey}"]`);
    if (tab && tab.scrollIntoView) {
      try {
        tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      } catch {
        tab.scrollIntoView();
      }
    }
  }, 0);
};

// Drag & Drop intelligente per esercizi e superset
// Applica aggiornamento uniforme e salvataggio
const applyExercisesUpdate = (updated: Exercise[]) => {
  const normalized = normalizeSupersets(updated);
  setExercises(normalized);
  if (activeVariantId !== 'original') {
    const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, exercises: normalized, updatedAt: new Date().toISOString() } : v);
    setVariants(updatedVariants);
  } else {
    setOriginalExercises(normalized);
  }
  triggerAutoSave();
};

// Helpers: caratteristiche programmatiche degli esercizi e dei superset
const isSupersetLeaderEx = (ex: Exercise): boolean => ex.isSupersetLeader === true;
const isSupersetFollowerEx = (ex: Exercise): boolean => !!ex.supersetGroupId && ex.isSupersetLeader !== true;
const getExerciseKind = (ex: Exercise): 'normal' | 'superset_leader' | 'superset_follower' => isSupersetLeaderEx(ex) ? 'superset_leader' : (isSupersetFollowerEx(ex) ? 'superset_follower' : 'normal');
const getSupersetLeaderId = (ex: Exercise): string | null => isSupersetLeaderEx(ex) ? String(ex.id) : (ex.supersetGroupId != null ? String(ex.supersetGroupId) : null);
const getSupersetGroup = (list: Exercise[], leaderId: string): { leader: Exercise | undefined; followers: Exercise[] } => {
  const leader = list.find(e => String(e.id) === String(leaderId) && isSupersetLeaderEx(e));
  const followers = leader ? list.filter(e => String(e.supersetGroupId) === String(leaderId) && !isSupersetLeaderEx(e)) : [];
  return { leader, followers };
};
const isSameSuperset = (a: Exercise, b: Exercise): boolean => {
  const la = getSupersetLeaderId(a);
  const lb = getSupersetLeaderId(b);
  return la != null && lb != null && String(la) === String(lb);
};

// Info su posizione e tipo rispetto ai superset
type SupersetInfo = { type: 'normal' | 'leader' | 'follower'; start: number; end: number; leaderId?: string; leaderIndex?: number };

const getSupersetInfoAtIndex = (list: Exercise[], index: number): SupersetInfo => {
  const ex = list[index];
  if (!ex) return { type: 'normal', start: index, end: index };
  if (ex.isSupersetLeader) {
    let end = index;
    while (end + 1 < list.length && String(list[end + 1].supersetGroupId) === String(ex.id) && !list[end + 1].isSupersetLeader) end++;
    return { type: 'leader', start: index, end, leaderId: String(ex.id), leaderIndex: index };
  }
  if (ex.supersetGroupId) {
    const leaderIndex = list.findIndex(e => String(e.id) === String(ex.supersetGroupId) && e.isSupersetLeader);
    if (leaderIndex === -1) {
      // follower orfano: trattalo come normale
      return { type: 'normal', start: index, end: index };
    }
    let end = leaderIndex;
    while (end + 1 < list.length && String(list[end + 1].supersetGroupId) === String(ex.supersetGroupId) && !list[end + 1].isSupersetLeader) end++;
    return { type: 'follower', start: leaderIndex + 1, end, leaderId: String(ex.supersetGroupId), leaderIndex };
  }
  return { type: 'normal', start: index, end: index };
};

// Scambia due follower nello stesso gruppo
const swapFollowersWithinGroup = (list: Exercise[], leaderIndex: number, aFollowerGlobalIndex: number, bFollowerGlobalIndex: number): Exercise[] => {
  if (leaderIndex < 0) return list;
  const leaderId = String(list[leaderIndex].id);
  const followerIndices: number[] = [];
  let p = leaderIndex + 1;
  while (p < list.length && String(list[p].supersetGroupId) === leaderId && !list[p].isSupersetLeader) { followerIndices.push(p); p++; }
  const posA = followerIndices.indexOf(aFollowerGlobalIndex);
  const posB = followerIndices.indexOf(bFollowerGlobalIndex);
  if (posA === -1 || posB === -1) return list;
  const followers = followerIndices.map(i => list[i]);
  const newFollowers = [...followers];
  [newFollowers[posA], newFollowers[posB]] = [newFollowers[posB], newFollowers[posA]];
  const before = list.slice(0, leaderIndex + 1);
  const after = list.slice(leaderIndex + 1 + followers.length);
  return [...before, ...newFollowers, ...after];
};

// Scambia blocchi (normale 1 elemento, superset = leader+followers)
const swapBlocks = (list: Exercise[], aIndex: number, bIndex: number): Exercise[] => {
  const infoA = getSupersetInfoAtIndex(list, aIndex);
  const infoB = getSupersetInfoAtIndex(list, bIndex);
  const startA = infoA.start, endA = infoA.end;
  const startB = infoB.start, endB = infoB.end;
  if (startA === startB && endA === endB) return list;
  if (startA < startB) {
    return [
      ...list.slice(0, startA),
      ...list.slice(startB, endB + 1),
      ...list.slice(endA + 1, startB),
      ...list.slice(startA, endA + 1),
      ...list.slice(endB + 1)
    ];
  } else {
    return [
      ...list.slice(0, startB),
      ...list.slice(startA, endA + 1),
      ...list.slice(endB + 1, startA),
      ...list.slice(startB, endB + 1),
      ...list.slice(endA + 1)
    ];
  }
};

// Handlers drag & drop a livello di indice
const handleDragStartIndex = (index: number) => {
  setDraggedExerciseIndex(index);
  setDraggedExerciseId(exercises[index]?.id || null);
  setSelectedSwapIndex(null);
};

const handleDragEndIndex = () => {
  setDraggedExerciseIndex(null);
  setDragOverExerciseIndex(null);
  setSelectedSwapIndex(null);
  setDraggedExerciseId(null);
};

const handleDragOverIndex = (e: React.DragEvent, index: number) => {
  e.preventDefault();
  setDragOverExerciseIndex(index);
  if (draggedExerciseIndex != null) {
    const infoA = getSupersetInfoAtIndex(exercises, draggedExerciseIndex);
    const infoB = getSupersetInfoAtIndex(exercises, index);
    if (infoA.type === 'follower' && infoB.type === 'follower' && infoA.leaderId && infoB.leaderId && String(infoA.leaderId) === String(infoB.leaderId)) {
      e.dataTransfer.dropEffect = 'none';
    } else {
      e.dataTransfer.dropEffect = 'move';
    }
  }
};

const handleDropOnCard = (targetIndex: number) => {
  const aIndex = draggedExerciseIndex;
  if (aIndex == null) return;
  if (aIndex === targetIndex) { handleDragEndIndex(); return; }
  const infoA = getSupersetInfoAtIndex(exercises, aIndex);
  const infoB = getSupersetInfoAtIndex(exercises, targetIndex);
  let updated = exercises;
  if (infoA.type === 'follower') {
    if (infoB.type === 'follower' && infoA.leaderId && infoB.leaderId && String(infoA.leaderId) === String(infoB.leaderId)) {
      // Riordino interno tra follower dello stesso gruppo DISABILITATO: annullo il drop
      handleDragEndIndex();
      return;
    } else {
      // Trascinato fuori: diventa esercizio normale e viene inserito vicino al target
      const follower = exercises[aIndex];
      const withoutFollower = exercises.filter((_, idx) => idx !== aIndex);
      // Calcola posizione di inserimento considerando shift se l'elemento rimosso era prima del target
      const adjustedTarget = targetIndex > aIndex ? targetIndex - 1 : targetIndex;
      const targetInfo = getSupersetInfoAtIndex(withoutFollower, adjustedTarget);
      const insertPos = targetInfo.start;
      const detached: Exercise = { ...follower, supersetGroupId: undefined, isSupersetLeader: false };
      updated = [...withoutFollower.slice(0, insertPos), detached, ...withoutFollower.slice(insertPos)];
    }
  } else {
    if (infoB.type === 'leader' && infoA.type === 'normal') {
      // Swap tra blocco superset e esercizio normale
      updated = swapBlocks(exercises, aIndex, targetIndex);
    } else if (infoB.type === 'follower') {
      // Evita di spezzare un superset rilasciando su un follower di altro gruppo
      handleDragEndIndex();
      return;
    } else {
      // Swap tra blocchi (normale<->normale, leader<->normale, leader<->leader)
      updated = swapBlocks(exercises, aIndex, targetIndex);
    }
  }
  applyExercisesUpdate(updated);
  handleDragEndIndex();
};

const handleDropOnSupersetContainer = (leaderId: string, leaderIndex: number) => {
  const aIndex = draggedExerciseIndex; if (aIndex == null) return;
  const infoA = getSupersetInfoAtIndex(exercises, aIndex);
  if (aIndex === leaderIndex) { handleDragEndIndex(); return; }
  let updated = exercises;
  if (infoA.type === 'normal') {
    // Swap tra blocco superset e esercizio normale (nessuna conversione di ruoli)
    updated = swapBlocks(exercises, aIndex, leaderIndex);
    applyExercisesUpdate(updated);
    handleDragEndIndex();
  } else if (infoA.type === 'leader') {
    // Swap tra due contenitori di superset (blocchi interi)
    updated = swapBlocks(exercises, aIndex, leaderIndex);
    applyExercisesUpdate(updated);
    handleDragEndIndex();
  } else {
    // Non consentito rilasciare un follower su un contenitore
    handleDragEndIndex();
  }
};

// Effetto: quando cambia la variante attiva, porta il relativo tab in vista
useEffect(() => {
  const container = variantTabsRef.current;
  if (!container) return;
  const targetEl = activeVariantId === 'original' ? originalTabRef.current : (variantTabRefs.current[activeVariantId] || null);
  if (!targetEl) return;
  try {
    targetEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  } catch {
    const containerRect = container.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    const overflowLeft = targetRect.left - containerRect.left;
    const overflowRight = targetRect.right - containerRect.right;
    if (overflowLeft < 0) {
      container.scrollLeft += overflowLeft;
    } else if (overflowRight > 0) {
      container.scrollLeft += overflowRight;
    }
  }
}, [activeVariantId, variants.length]);

// Rimosso: editing manuale della durata. Ora la durata segue il numero di settimane.

// Recupera icona della cartella per la scheda corrente
useEffect(() => {
  let mounted = true;
  (async () => {
    try {
      const plan = await DB.getWorkoutPlanById(workoutId);
      const folderId = plan?.folderId;
      if (folderId) {
        const folder = await DB.getWorkoutFolderById(folderId);
        if (mounted) setFolderIconName(folder?.icon || 'Folder');
      }
    } catch (e) {
      console.error('Errore recuperando icona folder:', e);
    }
  })();
  return () => { mounted = false; };
}, [workoutId]);
  
  // Athletes management
  const [associatedAthletes, setAssociatedAthletes] = useState<string[]>([]);
  const [showAthletesList, setShowAthletesList] = useState(false);
  const [athleteSearchQuery, setAthleteSearchQuery] = useState('');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [selectedAssociationVariantIds, setSelectedAssociationVariantIds] = useState<string[]>(['original']);
  const [isAssociationVariantListOpen, setIsAssociationVariantListOpen] = useState<boolean>(false);
  const [isAthleteListOpen, setIsAthleteListOpen] = useState<boolean>(false);
  // Override locale dei piani utente per aggiornamenti ottimistici dell'UI
  const [localPlansOverrideByUserId, setLocalPlansOverrideByUserId] = useState<Record<string, string[]>>({});
  // Contatore complessivo degli atleti associati (conteggio unico per atleta)
  const associatedAthletesCount = athletes.filter(u => (
    (u.role === 'athlete' || u.role === 'atleta') &&
    ((localPlansOverrideByUserId[u.id] ?? (u.workoutPlans || [])).some(pid => (
      pid === workoutId || String(pid).startsWith(`${workoutId}|variant:`)
    )))
  )).length;
  // Filtra solo atleti, con ricerca per nome/email
  const filteredAthletes = athletes.filter(u => (
    (u.role === 'athlete' || u.role === 'atleta') &&
    (
      athleteSearchQuery.trim() === '' ||
      (u.name || '').toLowerCase().includes(athleteSearchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(athleteSearchQuery.toLowerCase())
    )
  ));
  
  // Confirmation dialogs
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [showDeleteWorkoutDialog, setShowDeleteWorkoutDialog] = useState(false);
  
  // Exercise editing
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  
  // Utility function for deep cloning exercises to ensure independence between variants
  const deepCloneExercises = (exercises: any[]): any[] => {
    // Primo passaggio: genera nuovi ID e mappa oldId->newId
    const idMap: Record<string, string> = {};
    exercises.forEach((ex: any) => {
      const oldId: string = (ex.id && String(ex.id).trim() !== '') ? String(ex.id) : '';
      const newId: string = `${oldId || 'ex'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (oldId) idMap[oldId] = newId;
      // Se non c'è oldId, non possiamo mappare follower verso leader: verrà gestito come non-superset
    });

    // Secondo passaggio: clona esercizi aggiornando supersetGroupId
    return exercises.map((ex: any) => {
      const oldId: string = (ex.id && String(ex.id).trim() !== '') ? String(ex.id) : '';
      const newId: string = oldId && idMap[oldId]
        ? idMap[oldId]
        : `${oldId || 'ex'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const isLeader: boolean = !!ex.isSupersetLeader;
      const oldGroupId: string | undefined = ex.supersetGroupId ? String(ex.supersetGroupId) : undefined;
      const mappedGroupId: string | undefined = oldGroupId && idMap[oldGroupId] ? idMap[oldGroupId] : undefined;
      // Il leader deve puntare a sé stesso. I follower devono puntare al nuovo leader.
      const finalGroupId: string | undefined = isLeader
        ? newId
        : (mappedGroupId ?? oldGroupId);

      return {
        ...ex,
        id: newId,
        supersetGroupId: finalGroupId,
        isSupersetLeader: isLeader,
        instructions: ex.instructions ? [...ex.instructions] : [],
        equipment: ex.equipment ? [...ex.equipment] : [],
        ...(ex.sets && typeof ex.sets === 'object' ? { sets: { ...ex.sets } } : {}),
        ...(ex.notes && typeof ex.notes === 'object' ? { notes: { ...ex.notes } } : {}),
      };
    });
  };
  
  // Exercise form states
  const [currentExercise, setCurrentExercise] = useState<Exercise>({
    id: '',
    name: '',
    notes: '',
    sets: '',
    intensity: '',
    tut: '',
    recovery: '',
    videoLink: ''
  });
  const [newExerciseName, setNewExerciseName] = useState('');
  
  // Separate sets and reps state
  const [currentSets, setCurrentSets] = useState('');
  const [currentReps, setCurrentReps] = useState('');
  const [editingSets, setEditingSets] = useState('');
  const [editingReps, setEditingReps] = useState('');
  const [customExercises, setCustomExercises] = useState<string[]>(() => {
    const key = 'kw8_customExercises';
    try {
      const saved = DB.getItem(key);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return Array.from(new Set(parsed.filter((ex: any) => typeof ex === 'string' && ex.trim() !== '')));
      }
    } catch (e) {
      console.warn('⚠️ Impossibile leggere libreria esercizi personalizzati:', e);
    }
    return [];
  });
  const [exerciseSearchQuery, setExerciseSearchQuery] = useState('');
  // Notifica salvataggio e debug libreria
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isToastExiting, setIsToastExiting] = useState(false);
  const [isToastEntering, setIsToastEntering] = useState(false);
  const [showLibraryDebug, setShowLibraryDebug] = useState(true);
  const [debugLocalCustomExercisesRaw, setDebugLocalCustomExercisesRaw] = useState<string>('null');
  const [debugLocalAvailable, setDebugLocalAvailable] = useState<boolean>(false);

  // Posizionamento e stato del menù tag (Apple-style) con chiusura on outside click
  const { 
    position: tagsMenuPosition,
    isOpen: isTagsMenuOpen, 
    triggerRef: tagsTriggerRef,
    dropdownRef: tagsDropdownRef,
    openDropdown: openTagsMenu, 
    closeDropdown: closeTagsMenu, 
    toggleDropdown: toggleTagsMenu 
  } = useDropdownPosition({ offset: 8, preferredPosition: 'bottom-left', autoAdjust: true });

  // Dropdown toolbar: Varianti, Settimane, Giorni (stile Apple)
  const {
    position: variantsDropdownPosition,
    isOpen: isVariantsDropdownOpen,
    triggerRef: variantsDropdownTriggerRef,
    dropdownRef: variantsDropdownRef,
    toggleDropdown: toggleVariantsDropdown,
    closeDropdown: closeVariantsDropdown
  } = useDropdownPosition({ offset: 8, preferredPosition: 'bottom-left', autoAdjust: true });

  const {
    position: weeksDropdownPosition,
    isOpen: isWeeksDropdownOpen,
    triggerRef: weeksDropdownTriggerRef,
    dropdownRef: weeksDropdownRef,
    toggleDropdown: toggleWeeksDropdown,
    closeDropdown: closeWeeksDropdown
  } = useDropdownPosition({ offset: 8, preferredPosition: 'bottom-left', autoAdjust: true });

  const {
    position: daysDropdownPosition,
    isOpen: isDaysDropdownOpen,
    triggerRef: daysDropdownTriggerRef,
    dropdownRef: daysDropdownRef,
    toggleDropdown: toggleDaysDropdown,
    closeDropdown: closeDaysDropdown
  } = useDropdownPosition({ offset: 8, preferredPosition: 'bottom-left', autoAdjust: true });

  // Dropdown Associa (coerente con altri menu)
  const {
    position: associateDropdownPosition,
    isOpen: isAssociateDropdownOpen,
    triggerRef: associateDropdownTriggerRef,
    dropdownRef: associateDropdownRef,
    toggleDropdown: toggleAssociateDropdown,
    closeDropdown: closeAssociateDropdown
  } = useDropdownPosition({ offset: 8, preferredPosition: 'bottom-left', autoAdjust: true });

  // Reset stato quando si apre il menu Associa: liste chiuse e nessuna selezione
  useEffect(() => {
    if (isAssociateDropdownOpen) {
      setIsAthleteListOpen(false);
      setIsAssociationVariantListOpen(false);
      setSelectedAthleteId(null);
      setSelectedAssociationVariantIds([]);
    }
  }, [isAssociateDropdownOpen]);

  // Blocca lo scroll della pagina quando un menu della toolbar è aperto
  useEffect(() => {
    const anyOpen = !!(isVariantsDropdownOpen || isWeeksDropdownOpen || isDaysDropdownOpen || isTagsMenuOpen || isAssociateDropdownOpen || openVariantMenuId || openWeekKeyMenu || openDayKeyMenu);
    const prev = document.body.style.overflow;
    const prevSelect = document.body.style.userSelect;
    const prevWebkitSelect = (document.body.style as any).webkitUserSelect;
    const prevTouchCallout = (document.body.style as any).webkitTouchCallout;
    if (anyOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.userSelect = 'none';
      (document.body.style as any).webkitUserSelect = 'none';
      (document.body.style as any).webkitTouchCallout = 'none';
    } else {
      document.body.style.overflow = '';
      document.body.style.userSelect = '';
      (document.body.style as any).webkitUserSelect = '';
      (document.body.style as any).webkitTouchCallout = '';
    }
    return () => {
      document.body.style.overflow = prev;
      document.body.style.userSelect = prevSelect;
      (document.body.style as any).webkitUserSelect = prevWebkitSelect;
      (document.body.style as any).webkitTouchCallout = prevTouchCallout;
    };
  }, [isVariantsDropdownOpen, isWeeksDropdownOpen, isDaysDropdownOpen, isTagsMenuOpen, isAssociateDropdownOpen, openVariantMenuId, openWeekKeyMenu, openDayKeyMenu]);

  // Menu azioni per i tag sotto descrizione (Modifica/Elimina)
  const [openTagActionsFor, setOpenTagActionsFor] = useState<string | null>(null);
  const [tagActionsPosition, setTagActionsPosition] = useState<{ top: number; left: number } | null>(null);
  const [tagRenameDraft, setTagRenameDraft] = useState<string>('');
  const [showTagRename, setShowTagRename] = useState<boolean>(false);
  const tagActionsDropdownRef = useRef<HTMLDivElement | null>(null);

  const handleRenameTag = (oldName: string, newName: string) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) return;
    setTags((prev) => {
      const withoutOld = prev.filter((t) => t !== oldName);
      // Evita duplicati
      return withoutOld.includes(trimmed) ? withoutOld : withoutOld.concat(trimmed);
    });
    try { autoSave(); } catch {}
  };

  // Persistenza libreria esercizi personalizzati - salvataggio su storage quando la libreria cambia
  useEffect(() => {
    try {
      DB.setItem('kw8_customExercises', JSON.stringify(Array.from(new Set(customExercises))));
    } catch (e) {
      console.warn('⚠️ Impossibile salvare libreria esercizi personalizzati:', e);
    }
  }, [customExercises]);

  useEffect(() => {
    try {
      setDebugLocalAvailable(DB.isStorageAvailable());
      const raw = DB.getItem('kw8_customExercises');
      setDebugLocalCustomExercisesRaw(raw ?? 'null');
    } catch (e) {
      console.warn('⚠️ Debug read error:', e);
    }
  }, [customExercises]);

  useEffect(() => {
    if (!saveMessage) return;
    setIsToastExiting(false);
    setIsToastEntering(true);
    const enterTimer = setTimeout(() => setIsToastEntering(false), 10);
    const exitTimer = setTimeout(() => setIsToastExiting(true), 2700);
    const hideTimer = setTimeout(() => setSaveMessage(null), 3000);
    return () => { clearTimeout(enterTimer); clearTimeout(exitTimer); clearTimeout(hideTimer); };
  }, [saveMessage]);

  // Chiudi sempre la sottolista dei tag palestra quando il menu tag si apre/chiude e pulisci input
  useEffect(() => {
    setShowGymTagsList(false);
    if (!isTagsMenuOpen) {
      setNewTag('');
      setShowTagsDropdown(false);
    }
  }, [isTagsMenuOpen]);

  // Chiudi lista palestra su click esterno
  useEffect(() => {
    if (!showGymTagsList) return;
    const handleOutside = (e: MouseEvent) => {
      if (gymTagsGroupRef.current && !gymTagsGroupRef.current.contains(e.target as Node)) {
        setShowGymTagsList(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [showGymTagsList]);

  // Deseleziona tag sotto descrizione su click esterno
  useEffect(() => {
    if (!selectedTagUnderDesc) return;
    const handleOutsideSelect = (e: MouseEvent) => {
      if (tagsUnderDescContainerRef.current && !tagsUnderDescContainerRef.current.contains(e.target as Node)) {
        setSelectedTagUnderDesc(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideSelect);
    return () => document.removeEventListener('mousedown', handleOutsideSelect);
  }, [selectedTagUnderDesc]);

  // Predefined exercises list - Comprehensive list organized by muscle groups
  const predefinedExercises = [
    // PETTO
    'Panca Piana', 'Panca Inclinata', 'Panca Declinata', 'Panca con Manubri', 
    'Panca Inclinata con Manubri', 'Croci su Panca', 'Croci Inclinata', 'Croci ai Cavi',
    'Dips alle Parallele', 'Push-up', 'Push-up Inclinati', 'Push-up Declinati',
    'Chest Press', 'Pectoral Machine', 'Cable Crossover',
    
    // SCHIENA
    'Stacco da Terra', 'Stacco Rumeno', 'Stacco Sumo', 'Trazioni alla Sbarra',
    'Trazioni Presa Larga', 'Trazioni Presa Stretta', 'Lat Machine', 'Lat Machine Presa Stretta',
    'Rematore con Bilanciere', 'Rematore con Manubrio', 'Rematore ai Cavi', 'Pulley Basso',
    'T-Bar Row', 'Seal Row', 'Hyperextension', 'Good Morning', 'Shrug con Bilanciere',
    'Shrug con Manubri', 'Face Pull', 'Reverse Fly',
    
    // GAMBE - QUADRICIPITI
    'Squat', 'Squat Frontale', 'Squat Bulgaro', 'Squat Sumo', 'Hack Squat',
    'Leg Press', 'Leg Press 45°', 'Leg Extension', 'Affondi', 'Affondi Laterali',
    'Affondi Inversi', 'Step Up', 'Sissy Squat', 'Wall Sit',
    
    // GAMBE - FEMORALI E GLUTEI
    'Stacco Rumeno', 'Stacco a Gambe Tese', 'Leg Curl', 'Nordic Curl',
    'Hip Thrust', 'Hip Thrust con Bilanciere', 'Glute Bridge', 'Sumo Deadlift',
    'Good Morning', 'Hyperextension', 'Calf Raise in Piedi', 'Calf Raise Seduto',
    
    // SPALLE
    'Military Press', 'Shoulder Press con Manubri', 'Arnold Press', 'Push Press',
    'Alzate Laterali', 'Alzate Frontali', 'Alzate Posteriori', 'Alzate a 90°',
    'Upright Row', 'Handstand Push-up', 'Pike Push-up', 'Shoulder Press Machine',
    'Cable Lateral Raise', 'Reverse Pec Deck',
    
    // BICIPITI
    'Curl con Bilanciere', 'Curl con Manubri', 'Hammer Curl', 'Curl Concentrato',
    'Curl ai Cavi', 'Curl Scott', 'Curl 21', 'Curl a Martello ai Cavi',
    'Chin-up', 'Curl con Bilanciere EZ', 'Drag Curl', 'Zottman Curl',
    
    // TRICIPITI
    'French Press', 'French Press con Manubri', 'Dips ai Tricipiti', 'Push-down ai Cavi',
    'Kick Back', 'Overhead Extension', 'Close Grip Bench Press', 'Diamond Push-up',
    'Tricep Dips', 'Skull Crusher', 'JM Press',
    
    // ADDOMINALI E CORE
    'Plank', 'Plank Laterale', 'Crunch', 'Crunch Inverso', 'Bicycle Crunch',
    'Russian Twist', 'Mountain Climbers', 'Dead Bug', 'Bird Dog', 'Hollow Hold',
    'V-Up', 'Leg Raise', 'Hanging Leg Raise', 'Ab Wheel', 'Pallof Press',
    'Woodchop', 'Bear Crawl', 'Superman',
    
    // CARDIO E FUNZIONALE
    'Burpees', 'Jumping Jacks', 'High Knees', 'Butt Kicks', 'Jump Squats',
    'Jump Lunges', 'Box Jump', 'Broad Jump', 'Tuck Jump', 'Star Jump',
    'Battle Ropes', 'Kettlebell Swing', 'Turkish Get-up', 'Farmer Walk',
    'Sled Push', 'Sled Pull', 'Tire Flip', 'Medicine Ball Slam',
    
    // STRETCHING E MOBILITÀ
    'Cat-Cow Stretch', 'Child Pose', 'Downward Dog', 'Cobra Stretch',
    'Hip Flexor Stretch', 'Hamstring Stretch', 'Quad Stretch', 'Calf Stretch',
    'Shoulder Stretch', 'Chest Stretch', 'Spinal Twist', 'Pigeon Pose',
    
    // ESERCIZI ISOMETRICI
    'Wall Sit', 'Hollow Hold', 'L-Sit', 'Front Lever', 'Back Lever',
    'Human Flag', 'Handstand Hold', 'Single Leg Glute Bridge Hold',
    
    // ESERCIZI CON ATTREZZI SPECIFICI
    'Kettlebell Swing', 'Kettlebell Clean', 'Kettlebell Snatch', 'Kettlebell Press',
    'TRX Row', 'TRX Push-up', 'TRX Squat', 'TRX Pike', 'Resistance Band Pull Apart',
    'Resistance Band Squat', 'Bosu Ball Squat', 'Swiss Ball Crunch', 'Swiss Ball Pike',
    
    // MACCHINARI DA PALESTRA
    // Petto
    'Chest Press Machine', 'Pec Deck', 'Cable Crossover Machine', 'Incline Chest Press Machine',
    'Decline Chest Press Machine', 'Chest Fly Machine', 'Dip Machine',
    
    // Schiena
    'Lat Pulldown Machine', 'Cable Row Machine', 'T-Bar Row Machine', 'Hyperextension Machine',
    'Assisted Pull-up Machine', 'Low Row Machine', 'High Row Machine', 'Reverse Fly Machine',
    'Shrug Machine', 'Deadlift Machine',
    
    // Spalle
    'Shoulder Press Machine', 'Lateral Raise Machine', 'Rear Delt Machine', 'Upright Row Machine',
    'Cable Lateral Raise Machine', 'Multi-Station Shoulder Machine',
    
    // Braccia
    'Bicep Curl Machine', 'Tricep Extension Machine', 'Preacher Curl Machine', 'Cable Bicep Machine',
    'Cable Tricep Machine', 'Hammer Curl Machine', 'Tricep Dip Machine',
    
    // Gambe
    'Leg Press Machine', 'Leg Extension Machine', 'Leg Curl Machine', 'Hack Squat Machine',
    'Smith Machine Squat', 'Calf Raise Machine', 'Seated Calf Machine', 'Leg Abduction Machine',
    'Leg Adduction Machine', 'Glute Machine', 'Hip Thrust Machine', 'Bulgarian Split Squat Machine',
    
    // Core e Addominali
    'Ab Crunch Machine', 'Oblique Machine', 'Roman Chair', 'Captain\'s Chair', 'Ab Coaster',
    'Torso Rotation Machine', 'Cable Crunch Machine',
    
    // Cardio Machines
    'Treadmill', 'Elliptical', 'Stationary Bike', 'Rowing Machine', 'Stair Climber',
    'Arc Trainer', 'Spin Bike', 'Recumbent Bike', 'Air Bike', 'Ski Erg',
    
    // Macchine Funzionali
    'Cable Machine', 'Functional Trainer', 'Multi-Station Gym', 'Power Rack', 'Smith Machine',
    'Cable Crossover Station', 'Adjustable Cable Machine', 'Pulley System',
    
    // Macchine Specializzate
    'Inversion Table', 'Vibration Platform', 'Pneumatic Machines', 'Hydraulic Machines',
    'Isokinetic Machines', 'Multi-Hip Machine', 'Pendulum Squat Machine', 'Belt Squat Machine'
  ];
  
  // Auto-save functionality
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);
  
  const autoSave = useCallback(async () => {
    if (workoutId) {
      try {
        console.log('🔄 AutoSave triggered for workout ID:', workoutId);
        console.log('📊 Current exercises in state:', exercises);
        console.log('📝 Current workout title:', workoutTitle);
        
        let workoutData = await DB.getWorkoutPlanById(workoutId);
        console.log('🔍 Workout data from DB:', workoutData);
        
        // Se il workout non esiste ancora, crealo con i dati di base
        if (!workoutData) {
          console.log('🆕 Workout not found, creating new workout with ID:', workoutId);
          console.log('💪 Creating with exercises:', exercises);
          const now = new Date().toISOString();
          const newWorkoutData = {
            id: workoutId,
            name: workoutTitle || 'Nuova scheda',
            description: workoutDescription || '',
            coach: 'Coach',
            duration: Math.max(1, durationWeeks) * 7,
            durationWeeks,
            exercises: exercises || [], // Include gli esercizi esistenti nella creazione iniziale
            days: { [activeDayKey]: exercises || [] },
            dayNames: originalDayNames || {},
            category: 'strength' as const,
            mediaFiles: { images: [], videos: [], audio: [] },
            tags: [],
            order: 0,
            difficulty: 1,
            targetMuscles: [],
            folderId: null,
            color: '#10B981',
            variants: [],
            activeVariantId: 'original',
            createdAt: now,
            updatedAt: now
          };
          // Usa updateWorkoutPlan per creare il nuovo workout (che gestisce sia creazione che aggiornamento)
          console.log('💾 Creating new workout via updateWorkoutPlan:', newWorkoutData);
          await updateWorkoutPlan(workoutId, newWorkoutData);
          console.log('✅ New workout created with', exercises.length, 'exercises');
          
          // Ricarica i dati dal database per assicurarsi che la scheda sia stata creata
          workoutData = await DB.getWorkoutPlanById(workoutId);
          if (!workoutData) {
            console.error('❌ Failed to create workout in database');
            return;
          }
        }

        // Calcola automaticamente la durata in giorni se sono presenti entrambe le date
        let calculatedDuration = workoutData.duration;

        // Aggiorna gli esercizi in base alla variante attiva
        let exercisesToSave = exercises;
        let updatedVariants = variants;
        let updatedOriginalDays = originalDays;
        let updatedOriginalWeeksStore = { ...originalWeeksStore };

        if (activeVariantId === 'original' || !variants.length || !variants.find(v => v.id === activeVariantId)) {
          // Se siamo nell'originale, salva gli esercizi nell'originale
          // Unisce i giorni della settimana attiva da weeksStore e dallo stato locale,
          // poi applica l'override del giorno attivo con gli esercizi correnti.
          const baseDaysForWeek = originalWeeksStore[activeWeekKey] || {};
          const newOriginalDays = { ...baseDaysForWeek, ...originalDays, [activeDayKey]: [...exercises] };
          updatedOriginalDays = newOriginalDays;
          setOriginalDays(newOriginalDays);
          exercisesToSave = newOriginalDays['G1'] || [];
          // Aggiorna weeksStore per la settimana attiva con i giorni uniti
          updatedOriginalWeeksStore = { ...originalWeeksStore, [activeWeekKey]: newOriginalDays };
          setOriginalWeeksStore(updatedOriginalWeeksStore);
          // Mantieni le varianti esistenti senza modificarle
          updatedVariants = variants.map(v => ({ ...v, days: (variantDaysById[v.id] || (v as any).days || {}) }));
          console.log('💾 Saving original workout exercises:', exercisesToSave.length);
        } else {
          // Se siamo in una variante esistente, salva gli esercizi nella variante
          const prevVariantDays = variantDaysById[activeVariantId] || {};
          const prevWeeksStore = variantWeeksStoreById[activeVariantId] || {};
          const baseVariantDaysForWeek = prevWeeksStore[activeWeekKey] || {};
          // Unione di giorni già presenti nello store della settimana e nello stato locale,
          // con override del giorno attivo.
          const newVariantDays = { ...baseVariantDaysForWeek, ...prevVariantDays, [activeDayKey]: [...exercises] };
          setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVariantDays });
          // Aggiorna weeksStore della variante per la settimana attiva usando i giorni uniti
          const newWeeksStoreForVariant = { ...prevWeeksStore, [activeWeekKey]: newVariantDays };
          const newVariantWeeksStoreById = { ...variantWeeksStoreById, [activeVariantId]: newWeeksStoreForVariant };
          setVariantWeeksStoreById(newVariantWeeksStoreById);
          updatedVariants = variants.map(v => 
            v.id === activeVariantId 
              ? { ...v, exercises: newVariantDays['G1'] || (v.exercises || []), days: newVariantDays, updatedAt: new Date().toISOString() }
              : { ...v, days: (variantDaysById[v.id] || (v as any).days || {}) }
          );
          // IMPORTANTE: Quando siamo in una variante, NON modificare gli esercizi originali
          // Usa gli originalExercises per mantenere l'originale intatto
          const safeOriginalDays = { ...originalDays };
          if (!safeOriginalDays['G1']) safeOriginalDays['G1'] = originalExercises || [];
          updatedOriginalDays = safeOriginalDays;
          exercisesToSave = safeOriginalDays['G1'] || [];
          updatedOriginalWeeksStore = { ...originalWeeksStore, [activeWeekKey]: updatedOriginalDays };
          console.log('🔄 Saving variant exercises to variant, keeping original intact');
          console.log('📊 Variant exercises count:', exercises.length);
          console.log('📊 Original exercises count (unchanged):', exercisesToSave.length);
          console.log('🔍 ActiveVariantId:', activeVariantId);
          console.log('🔍 Variants found:', variants.find(v => v.id === activeVariantId) ? 'YES' : 'NO');
        }

        const updatedWorkout = { 
          ...workoutData, 
          name: workoutTitle, 
          description: workoutDescription,
          duration: calculatedDuration,
          durationWeeks,
          exercises: exercisesToSave,
          days: updatedOriginalDays,
          dayNames: originalDayNames,
          weeks: weeks,
          weeksStore: updatedOriginalWeeksStore,
          associatedAthletes,
          variants: updatedVariants.map(v => ({
            ...v,
            dayNames: variantDayNamesById[v.id] || (v as any).dayNames || {}
            , weeksStore: (variantWeeksStoreById[v.id] || (v as any).weeksStore || {})
          })),
          activeVariantId,
          tags,
          originalWorkoutTitle: originalWorkoutTitle || workoutData.originalWorkoutTitle || workoutData.name,
          updatedAt: new Date().toISOString() 
        };
        
        console.log('💾 Saving workout with exercises:', exercisesToSave.length, 'exercises');
        console.log('🔍 Exercises to save:', exercisesToSave);
        console.log('🔄 Updated workout object:', updatedWorkout);
        await updateWorkoutPlan(workoutId, updatedWorkout);
        console.log('✅ Workout updated successfully');
        
        // Verifica che il salvataggio sia andato a buon fine
        const verifyData = await DB.getWorkoutPlanById(workoutId);
        console.log('🔍 Verification: workout after save:', verifyData);
        console.log('💪 Verification: exercises after save:', verifyData?.exercises);
      } catch (error) {
        console.error('Error saving workout:', error);
      }
    }
  }, [workoutId, workoutTitle, workoutDescription, durationWeeks, exercises, associatedAthletes, variants, activeVariantId, originalWorkoutTitle, tags, updateWorkoutPlan, weeks, originalWeeksStore, variantWeeksStoreById, activeWeekKey, activeDayKey, originalDays, variantDaysById]);
  
  // Trigger auto-save immediately
  const triggerAutoSave = useCallback(() => {
    // Salvataggio istantaneo senza timeout
    autoSave();
  }, [autoSave]);

  const handleSaveTitle = async () => {
    setIsEditingTitle(false);
    // Salva il titolo nel database e aggiorna la vista in base alla variante attiva
    if (!workoutId) return;
    try {
      const workoutData = await DB.getWorkoutPlanById(workoutId);
      if (!workoutData) return;

      if (activeVariantId === 'original') {
        // Aggiorna il titolo della scheda originale
        const originalTitle = workoutData.originalWorkoutTitle || workoutData.name;
        const updatedWorkout = {
          ...workoutData,
          name: workoutTitle,
          originalWorkoutTitle: originalTitle,
          updatedAt: new Date().toISOString()
        };
        await updateWorkoutPlan(workoutId, updatedWorkout);
        if (!originalWorkoutTitle) {
          setOriginalWorkoutTitle(originalTitle);
        }
      } else {
        // Aggiorna il nome della variante attiva
        const currentVariantName = variants.find(v => v.id === activeVariantId)?.name;
        const updatedVariants = (workoutData.variants || []).map(v =>
          v.id === activeVariantId ? { ...v, name: currentVariantName || v.name } : v
        );
        const updatedWorkout = {
          ...workoutData,
          variants: updatedVariants,
          updatedAt: new Date().toISOString()
        };
        await updateWorkoutPlan(workoutId, updatedWorkout);
      }
    } catch (error) {
      console.error('Error saving title:', error);
    }
  };

  const handleSaveDescription = async () => {
    setIsEditingDescription(false);
    // Salva la descrizione nel database e aggiorna la vista in base alla variante attiva
    if (!workoutId) return;
    try {
      const workoutData = await DB.getWorkoutPlanById(workoutId);
      if (!workoutData) return;

      if (activeVariantId === 'original') {
        // Aggiorna la descrizione della scheda originale
        const updatedWorkout = { ...workoutData, description: workoutDescription, updatedAt: new Date().toISOString() };
        await updateWorkoutPlan(workoutId, updatedWorkout);
      } else {
        // Aggiorna la descrizione della variante attiva
        const updatedVariants = (workoutData.variants || []).map(v =>
          v.id === activeVariantId ? { ...v, description: workoutDescription, updatedAt: new Date().toISOString() } : v
        );
        const updatedWorkout = { ...workoutData, variants: updatedVariants, updatedAt: new Date().toISOString() };
        await updateWorkoutPlan(workoutId, updatedWorkout);
      }
    } catch (error) {
      console.error('Error saving description:', error);
    }
  };
  
  useEffect(() => {
    if (isEditingDescription && descriptionInputRef.current) {
      const ta = descriptionInputRef.current;
      ta.focus();
      try {
        const len = ta.value.length;
        ta.setSelectionRange(len, len);
      } catch {}
    }
  }, [isEditingDescription]);

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      const input = titleInputRef.current;
      input.focus();
      try {
        const len = input.value.length;
        input.setSelectionRange(len, len);
      } catch {}
    }
  }, [isEditingTitle]);

  // Handle clicks outside exercise dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exerciseDropdownRef.current && !exerciseDropdownRef.current.contains(event.target as Node)) {
        setShowExerciseDropdown(false);
        setShowSearchSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Carica i dati della scheda dal database
  useEffect(() => {
    const loadWorkoutData = async () => {
      if (workoutId) {
        try {
          setIsLoadingWorkout(true);
          console.log('🔄 Loading workout data for ID:', workoutId);
          const workoutData = await DB.getWorkoutPlanById(workoutId);
          console.log('📊 Workout data loaded:', workoutData);
          
          if (workoutData) {
            setWorkoutTitle(workoutData.name);
            setOriginalWorkoutTitle(workoutData.originalWorkoutTitle || workoutData.name);
            setWorkoutDescription(workoutData.description || '');
            setOriginalWorkoutDescription(workoutData.description || '');
            setTags(workoutData.tags || []);
            
            // Carica sempre gli esercizi della scheda corrente, resettando lo stato precedente
            console.log('💪 Loading exercises for workout:', workoutId, workoutData.exercises);
            console.log('🔍 Exercise IDs from database:', workoutData.exercises?.map(ex => ({ name: ex.name, id: ex.id, idType: typeof ex.id })));
            
            if (workoutData.exercises && workoutData.exercises.length > 0) {
              // Fix exercises with empty or missing IDs
              const exercisesWithValidIds = workoutData.exercises.map(exercise => {
                if (!exercise.id || exercise.id.trim() === '') {
                  const newId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
                  console.log('🔧 Fixing exercise with empty ID:', exercise.name, 'New ID:', newId);
                  return { ...exercise, id: newId };
                }
                return exercise;
              });
              
              // Check if we need to save the updated exercises back to the database
              const needsUpdate = exercisesWithValidIds.some((ex, index) => ex.id !== workoutData.exercises[index].id);
              if (needsUpdate) {
                console.log('💾 Updating exercises with new IDs in database');
                // Update the database with the fixed IDs
                const updatedWorkout = { ...workoutData, exercises: exercisesWithValidIds };
                updateWorkoutPlan(workoutId, updatedWorkout).catch(error => {
                  console.error('Error updating exercise IDs:', error);
                });
              }
              // Inizializza settimane e store settimane -> giorni
              const incomingDayNames = (workoutData as any).dayNames || {};
              const incomingWeeks: string[] = (workoutData as any).weeks || ['W1'];
              let incomingWeeksStore: { [weekKey: string]: { [dayKey: string]: Exercise[] } } = (workoutData as any).weeksStore || {};
              const incomingDays = (workoutData as any).days || {};
              if (!incomingWeeksStore || Object.keys(incomingWeeksStore).length === 0) {
                // Backward-compatibility: usa days come W1
                incomingWeeksStore = {
                  W1: Object.keys(incomingDays).length ? incomingDays : { G1: exercisesWithValidIds }
                };
              }

              // Imposta weeks e weeksStore
              const finalWeeks = incomingWeeks && incomingWeeks.length ? incomingWeeks : ['W1'];
              setWeeks(finalWeeks);
              setOriginalWeeksStore(incomingWeeksStore);

              // Determina la settimana iniziale da visualizzare
              const availableWeekKeys = Object.keys(incomingWeeksStore);
              const defaultWeekKey = availableWeekKeys.length ? availableWeekKeys.slice().sort((a, b) => parseInt(a.replace(/^W/, ''), 10) - parseInt(b.replace(/^W/, ''), 10))[0] : 'W1';
              const selectedWeekKey = incomingWeeksStore[activeWeekKey] ? activeWeekKey : defaultWeekKey;
              setActiveWeekKey(selectedWeekKey);

              // Prepara i giorni per la settimana selezionata
              const currentWeekDays = incomingWeeksStore[selectedWeekKey] || { G1: exercisesWithValidIds };
              const currentDayKeys = Object.keys(currentWeekDays);
              const sortedKeys = currentDayKeys.length
                ? currentDayKeys.slice().sort((a, b) => {
                    const na = parseInt(String(a).replace(/^G/, ''), 10);
                    const nb = parseInt(String(b).replace(/^G/, ''), 10);
                    return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                  })
                : ['G1'];
              const initializedOriginalDays: { [key: string]: Exercise[] } = {};
              sortedKeys.forEach((dk) => {
                const list = dk === 'G1' ? (currentWeekDays[dk] || exercisesWithValidIds) : (currentWeekDays[dk] || []);
                initializedOriginalDays[dk] = list;
              });
              if (!initializedOriginalDays['G1']) initializedOriginalDays['G1'] = exercisesWithValidIds;
              setOriginalDays(initializedOriginalDays);
              setOriginalDayNames(incomingDayNames);

              // Gli originalExercises corrispondono sempre a G1
              setOriginalExercises(initializedOriginalDays['G1']);
              console.log('🔒 Original exercises set (G1):', initializedOriginalDays['G1'].length, 'exercises');

              // Carica gli esercizi del giorno attivo (default G1) all'ingresso
              const preferredDayKey = initializedOriginalDays[activeDayKey] ? activeDayKey : 'G1';
              const entryList = initializedOriginalDays[preferredDayKey] || [];
              console.log('📥 Loading original day', preferredDayKey, 'exercises:', entryList.length);
              setActiveDayKey(preferredDayKey);
              setExercises(entryList);
              console.log('✅ Exercises loaded from database for day', preferredDayKey, ':', entryList.length);
            } else {
              // Resetta sempre a array vuoto per nuove schede
              setOriginalExercises([]);
              setExercises([]);
              // Inizializza weeks e weeksStore vuoti
              const incomingWeeks: string[] = (workoutData as any).weeks || ['W1'];
              setWeeks(incomingWeeks && incomingWeeks.length ? incomingWeeks : ['W1']);
              setOriginalWeeksStore((workoutData as any).weeksStore || { W1: { G1: [] } });
              console.log('📝 No exercises found, setting empty array for workout:', workoutId);
            }
            
            // Carica gli atleti associati
            if (workoutData.associatedAthletes) {
              setAssociatedAthletes(workoutData.associatedAthletes);
            }
            
            // Carica lo status
            // Status rimosso: non carichiamo più bozza/pubblicata
            
            // Carica i dati della durata
            if (workoutData.durationWeeks) {
              setDurationWeeks(workoutData.durationWeeks);
            }
            
            // Carica le varianti se esistono, includendo weeksStore; all'ingresso forziamo la scheda originale attiva
              if (workoutData.variants && workoutData.variants.length > 0) {
                // Normalizza gli ID degli esercizi e inizializza giorni per ciascuna variante
                const normalizedVariants = workoutData.variants.map(v => {
                  const fixedExercises = (v.exercises || []).map(ex => {
                    if (!ex.id || ex.id.trim() === '') {
                      const newId = Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);
                      console.log('🔧 Fixing variant exercise with empty ID:', ex.name, 'New ID:', newId);
                      return { ...ex, id: newId };
                    }
                    return ex;
                  });
                  // Weeks store per variante
                  const incomingVariantDays = (v as any).days || {};
                  let incomingVariantWeeksStore: { [weekKey: string]: { [dayKey: string]: Exercise[] } } = (v as any).weeksStore || {};
                  if (!incomingVariantWeeksStore || Object.keys(incomingVariantWeeksStore).length === 0) {
                    incomingVariantWeeksStore = {
                      W1: Object.keys(incomingVariantDays).length ? incomingVariantDays : { G1: fixedExercises }
                    };
                  }
                  const incomingVariantDayNames = (v as any).dayNames || {};
                  // Usa i giorni della settimana attiva (o W1) per popolare la vista iniziale della variante
                  const selectedWeekKey = activeWeekKey && incomingVariantWeeksStore[activeWeekKey] ? activeWeekKey : 'W1';
                  const variantCurrentWeekDays = incomingVariantWeeksStore[selectedWeekKey] || { G1: fixedExercises };
                  const initializedVariantDays: { [key: string]: Exercise[] } = {};
                  const variantKeys = Object.keys(variantCurrentWeekDays);
                  const sortedVariantKeys = variantKeys.slice().sort((a, b) => {
                    const na = parseInt(String(a).replace(/^G/, ''), 10);
                    const nb = parseInt(String(b).replace(/^G/, ''), 10);
                    return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                  });
                  sortedVariantKeys.forEach((dk) => {
                    const list = dk === 'G1' ? (variantCurrentWeekDays[dk] || fixedExercises) : (variantCurrentWeekDays[dk] || []);
                    initializedVariantDays[dk] = list;
                  });
                  if (!initializedVariantDays['G1']) initializedVariantDays['G1'] = fixedExercises;
                  return { ...v, isActive: false, exercises: initializedVariantDays['G1'], days: initializedVariantDays, dayNames: incomingVariantDayNames, weeksStore: incomingVariantWeeksStore };
                });
                const getNumAsc = (name: string) => { const m = name.match(/Variante (\d+)/); return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER; };
                const sortedVariants = normalizedVariants.slice().sort((a, b) => getNumAsc(a.name) - getNumAsc(b.name));
                setVariants(sortedVariants);
                // Inizializza mappa giorni locali per le varianti
                const initialVariantDaysById: { [variantId: string]: { [key: string]: Exercise[] } } = {};
                const initialVariantWeeksStoreById: { [variantId: string]: { [weekKey: string]: { [dayKey: string]: Exercise[] } } } = {};
                sortedVariants.forEach(v => {
                  const wStore = (v as any).weeksStore || {};
                  initialVariantWeeksStoreById[v.id] = wStore;
                  const selectedWeekKey = activeWeekKey && wStore[activeWeekKey] ? activeWeekKey : 'W1';
                  initialVariantDaysById[v.id] = (wStore[selectedWeekKey] || (v as any).days || {}) as any;
                });
                setVariantDaysById(initialVariantDaysById);
                const initialVariantDayNamesById: { [variantId: string]: { [key: string]: string } } = {};
                sortedVariants.forEach(v => { if ((v as any).dayNames) initialVariantDayNamesById[v.id] = (v as any).dayNames as any; });
                setVariantDayNamesById(initialVariantDayNamesById);
                setVariantWeeksStoreById(initialVariantWeeksStoreById);
                setActiveVariantId('original');
                setWorkoutDescription(workoutData.description || '');
              } else {
                // Non inizializzare varianti di default - lascia l'array vuoto e mantieni l'originale attiva
                setVariants([]);
                setActiveVariantId('original');
              setWorkoutDescription(workoutData.description || '');
              
            }
          }
        } catch (error) {
          console.error('❌ Error loading workout data:', error);
        }
        finally {
          setIsLoadingWorkout(false);
        }
      }
    };
    
    loadWorkoutData();
  }, [workoutId]);
  
  // Auto-save function with debouncing is already defined above

  // Debounced auto-save effect - ora istantaneo
  useEffect(() => {
    // Solo salva se i dati sono stati caricati (evita di salvare durante il caricamento iniziale)
    if (workoutId && originalExercises !== null && !isLoadingWorkout) {
      console.log('🔄 Auto-save effect triggered - data loaded, proceeding with save');
      autoSave();
    } else {
      console.log('⏳ Auto-save effect triggered - waiting for data to load');
    }
    // Nota: evitiamo di includere "autoSave" nelle dipendenze per prevenire cicli di re-render
    // dovuti alla ricreazione della callback.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutTitle, workoutDescription, exercises, associatedAthletes, activeVariantId, originalExercises, isLoadingWorkout]);

  
  const handleAddExercise = () => {
    console.log('➕ Adding new exercise to workout ID:', workoutId);
    console.log('📊 Current state:', {
      activeVariant: activeVariantId,
      currentExercises: exercises.length,
      originalExercises: originalExercises?.length || 0
    });
    
    if (editingExerciseId) {
      handleUpdateExercise();
    } else {
      if (currentExercise.name.trim()) {
        // Combine sets and reps for the exercise object
        const setsValue = currentSets && currentReps ? `${currentSets} x ${currentReps}` : 
                         currentSets || currentReps || '';
        
        const newExercise: Exercise = {
          ...currentExercise,
          id: Date.now().toString(),
          sets: setsValue,
          ...(currentExercise.supersetGroupId ? { supersetGroupId: currentExercise.supersetGroupId, isSupersetLeader: false } : {})
        };
        console.log('🆕 New exercise created:', {
          exerciseId: newExercise.id,
          exerciseName: newExercise.name,
          activeVariant: activeVariantId
        });
        
        const updatedExercises = [...exercises, newExercise];
        console.log('📊 Exercises after adding:', {
          totalExercises: updatedExercises.length,
          activeVariant: activeVariantId
        });
        
        let finalExercises = updatedExercises;
        if (newExercise.supersetGroupId) {
          finalExercises = reorderSupersetGroup(updatedExercises, newExercise.supersetGroupId);
        }
        
        const wasEmptyBefore = exercises.length === 0;
        setExercises(finalExercises);
        
        // IMPORTANTE: Gestione corretta dell'isolamento tra variante e originale
        if (activeVariantId !== 'original') {
          // Aggiorna i giorni della variante corrente
          const prevVariantDays = variantDaysById[activeVariantId] || {};
          const newVariantDays = { ...prevVariantDays, [activeDayKey]: finalExercises };
          setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVariantDays });
          const updatedVariants = variants.map(v => 
            v.id === activeVariantId 
              ? { ...v, exercises: newVariantDays['G1'] || finalExercises, updatedAt: new Date().toISOString(), days: newVariantDays }
              : { ...v, days: (variantDaysById[v.id] || (v as any).days || {}) }
          );
          setVariants(updatedVariants);
          console.log('🔄 Updated ONLY variant day', activeDayKey, 'with new exercise:', {
            variantId: activeVariantId,
            exerciseCount: finalExercises.length
          });
          console.log('🔒 OriginalExercises PROTECTED and unchanged:', originalExercises?.length || 0, 'exercises');
        } else {
          // Aggiorna i giorni dell'originale
          const newOriginalDays = { ...originalDays, [activeDayKey]: finalExercises };
          setOriginalDays(newOriginalDays);
          if (activeDayKey === 'G1') setOriginalExercises(finalExercises);
          console.log('🔄 Updated ONLY original day', activeDayKey, 'exercises:', finalExercises.length);
          console.log('🔍 Original day exercises content:', finalExercises.map(ex => ex.name));
        }

        // Se è il primo esercizio del giorno, salva subito per non perdere il primo allenamento
        if (wasEmptyBefore) {
          console.log('💾 First exercise added for the day. Triggering immediate save.');
          triggerAutoSave();
        }

        // ➕ Aggiunge automaticamente il nome alla libreria personalizzata se non presente
        const addedName = newExercise.name.trim();
        if (addedName && !predefinedExercises.includes(addedName) && !customExercises.includes(addedName)) {
          console.log('📚 Adding to custom exercise library:', addedName);
          setCustomExercises([...customExercises, addedName]);
          setSaveMessage('Nuovo esercizio aggiunto correttamente');
        }

        setCurrentExercise({
          id: '',
          name: '',
          notes: '',
          sets: '',
          intensity: '',
          tut: '',
          recovery: '',
          videoLink: ''
        });
        // Clear separate sets/reps state
        setCurrentSets('');
        setCurrentReps('');
        setShowExerciseForm(false);
        
        // IMPORTANTE: Non chiamare triggerAutoSave() immediatamente
        // L'auto-save verrà attivato automaticamente dal useEffect quando lo state si aggiorna
        console.log('✅ Exercise added, auto-save will be triggered by useEffect');
      }
    }
  };
  
  const handleSaveCustomExercise = (exerciseName?: string) => {
    const nameToSave = exerciseName || newExerciseName;
    if (nameToSave.trim() && !predefinedExercises.includes(nameToSave) && !customExercises.includes(nameToSave)) {
      setCustomExercises([...customExercises, nameToSave]);
      if (exerciseName) {
        // Se viene passato un nome, aggiorna il campo corrente
        if (editingExercise) {
          setEditingExercise({ ...editingExercise, name: nameToSave });
        } else {
          setCurrentExercise({ ...currentExercise, name: nameToSave });
        }
      } else {
        // Se non viene passato un nome, usa il comportamento originale
        setCurrentExercise({ ...currentExercise, name: nameToSave });
        setNewExerciseName('');
      }
    }
  };
  
  const handleRemoveCustomExercise = (exerciseName: string) => {
    showConfirmation(
      'Vuoi davvero eliminare questo esercizio personalizzato?',
      () => {
        setCustomExercises(customExercises.filter(ex => ex !== exerciseName));
      }
    );
  };
  
  // Filtra gli esercizi in base alla query di ricerca
  const getFilteredExercises = () => {
    // Combina esercizi predefiniti e personalizzati, rimuovendo duplicati e stringhe vuote
    const allExercises = [...predefinedExercises, ...customExercises.filter(ex => ex.trim() !== '')];
    const uniqueExercises = Array.from(new Set(allExercises)).filter(ex => ex && ex.trim() !== '');
    
    if (!exerciseSearchQuery.trim()) {
      return uniqueExercises;
    }
    
    const query = exerciseSearchQuery.toLowerCase();
    return uniqueExercises.filter(exercise => 
      exercise && exercise.toLowerCase().includes(query)
    );
  };
  
  // Calcola la durata in settimane
  const calculateDuration = () => {
    return `${durationWeeks} settimana${durationWeeks > 1 ? 'e' : ''}`;
  };
  
  const getDayDisplayName = (dayKey: string) => {
    const namesMap = activeVariantId === 'original' ? originalDayNames : (variantDayNamesById[activeVariantId] || {});
    const customName = namesMap[dayKey];
    if (customName && String(customName).trim()) {
      return String(customName).trim();
    }
    const match = String(dayKey).match(/^G(\d+)/);
    const num = match ? parseInt(match[1], 10) : null;
    return num ? `Allenamento ${num}` : 'Allenamento';
  };
  
  // Gestisce l'eliminazione della scheda
  const handleDeleteWorkout = () => {
    setShowDeleteWorkoutDialog(true);
  };
  
  const confirmDeleteWorkout = () => {
    // Qui implementeresti la logica per eliminare effettivamente la scheda
    // Per ora simuliamo l'eliminazione chiudendo la pagina
    console.log('Scheda eliminata:', workoutTitle);
    setShowDeleteWorkoutDialog(false);
    onClose(); // Torna alla pagina precedente
  };
  
  const handleSelectPredefinedExercise = (exerciseName: string) => {
    if (editingExercise) {
      setEditingExercise({ ...editingExercise, name: exerciseName });
    } else {
      setCurrentExercise({ ...currentExercise, name: exerciseName });
    }
    setExerciseSearchQuery('');
    setShowExerciseDropdown(false);
    setShowSearchSuggestions(false);
  };
  
  const handleGenerateLink = () => {
    const link = `${window.location.origin}/workout/${workoutId}`;
    setGeneratedLink(link);
    setShowLinkModal(true);
    
    // Trigger auto-save to update link generation timestamp
    triggerAutoSave();
  };

  // Svuota gli esercizi della giornata selezionata (originale o variante attiva)
  const handleClearDay = (dayKey: string) => {
    if (activeVariantId === 'original') {
      const newOriginal = { ...originalDays, [dayKey]: [] };
      setOriginalDays(newOriginal);
      if (dayKey === activeDayKey) {
        setExercises([]);
        if (dayKey === 'G1') setOriginalExercises([]);
      } else if (dayKey === 'G1') {
        setOriginalExercises([]);
      }
    } else {
      const prevVariantDays = variantDaysById[activeVariantId] || {};
      const updatedVariantDays = { ...prevVariantDays, [dayKey]: [] };
      setVariantDaysById({ ...variantDaysById, [activeVariantId]: updatedVariantDays });
      if (dayKey === activeDayKey) setExercises([]);
    }
    setSaveMessage('Giornata svuotata');
    triggerAutoSave();
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    alert('Link copiato negli appunti!');
  };
  
  // Superset handlers
  const handleStartSuperset = (anchorId: string) => {
    setIsSupersetMode(true);
    setSupersetAnchorExerciseId(anchorId);
    setSupersetSelection([]);
  };
  
  const handleToggleSupersetSelection = (exerciseId: string) => {
    if (!isSupersetMode || exerciseId === supersetAnchorExerciseId) return;
    const target = exercises.find(ex => ex.id === exerciseId);
    if (!target || target.supersetGroupId || target.isSupersetLeader) return;
    setSupersetSelection(prev => prev.includes(exerciseId) ? prev.filter(id => id !== exerciseId) : [...prev, exerciseId]);
  };
  // Helper: riordina i follower del superset immediatamente sotto al capo, mantenendo l'ordine originale
  const reorderSupersetGroup = (list: Exercise[], leaderId: string): Exercise[] => {
    const leaderIndex = list.findIndex(ex => ex.id === leaderId);
    if (leaderIndex === -1) return list;
    const followersIds = new Set(list.filter(ex => String(ex.supersetGroupId) === String(leaderId) && !ex.isSupersetLeader).map(ex => ex.id));
    if (followersIds.size === 0) return list;
    const before = list.slice(0, leaderIndex).filter(ex => !followersIds.has(ex.id));
    const leader = list[leaderIndex];
    const followers = list.filter(ex => followersIds.has(ex.id));
    const after = list.slice(leaderIndex + 1).filter(ex => !followersIds.has(ex.id));
    return [...before, leader, ...followers, ...after];
  };
  
  // Helper: normalizza tutti i gruppi superset mantenendo i follower contigui e nell'ordine corrente
  const normalizeSupersets = (list: Exercise[]): Exercise[] => {
    let result = [...list];

    // 1) Rimuovi follower orfani (leader mancante) con confronto robusto su string
    const leaderIds = new Set(result.filter(ex => ex.isSupersetLeader).map(ex => String(ex.id)));
    result = result.map(ex => {
      const groupId = ex.supersetGroupId != null ? String(ex.supersetGroupId) : null;
      if (groupId && !leaderIds.has(groupId)) {
        return { ...ex, supersetGroupId: undefined, isSupersetLeader: false };
      }
      return ex;
    });

    // 2) Pulisci i capi senza follower con confronto robusto su string
    const leaders = result.filter(ex => ex.isSupersetLeader);
    leaders.forEach(leader => {
      const leaderId = String(leader.id);
      const followers = result.filter(ex => String(ex.supersetGroupId) === leaderId && !ex.isSupersetLeader);
      if (followers.length === 0) {
        const leaderIdx = result.findIndex(ex => String(ex.id) === leaderId);
        if (leaderIdx !== -1) {
          result[leaderIdx] = { ...result[leaderIdx], supersetGroupId: undefined, isSupersetLeader: false };
        }
      }
    });

    // 3) Mantieni i follower contigui sotto al capo nell'ordine corrente con confronto robusto su string
    const leadersAfterCleanup = result.filter(ex => ex.isSupersetLeader);
    leadersAfterCleanup.forEach(leader => {
      const leaderId = String(leader.id);
      const followers = result.filter(ex => String(ex.supersetGroupId) === leaderId && !ex.isSupersetLeader);
      if (followers.length === 0) return;
      const followerIds = new Set(followers.map(f => String(f.id)));
      result = result.filter(ex => !followerIds.has(String(ex.id)));
      const leaderIndex = result.findIndex(ex => String(ex.id) === leaderId);
      result.splice(leaderIndex + 1, 0, ...followers);
    });

    return result;
  };

  // Helper: riordina i follower di un gruppo in base all'ordine desiderato
  const reorderSupersetGroupWithOrder = (list: Exercise[], leaderId: string, desiredOrder: string[]): Exercise[] => {
    const mapById = new Map<string, Exercise>(list.map(ex => [String(ex.id), ex]));
    const followersSet = new Set<string>(list.filter(ex => String(ex.supersetGroupId) === leaderId && !ex.isSupersetLeader).map(ex => String(ex.id)));
    const orderedFollowers = desiredOrder.filter(id => followersSet.has(String(id))).map(id => String(id));
    const remainingFollowers = list
      .filter(ex => String(ex.supersetGroupId) === leaderId && !ex.isSupersetLeader && !orderedFollowers.includes(String(ex.id)))
      .map(ex => String(ex.id));
    const finalOrder: string[] = [...orderedFollowers, ...remainingFollowers];
    let result = list.filter(ex => !(String(ex.supersetGroupId) === leaderId && !ex.isSupersetLeader));
    const leaderIndex = result.findIndex(ex => String(ex.id) === leaderId);
    const followersObjs = finalOrder.map(id => mapById.get(id)!).filter(Boolean);
    result.splice(leaderIndex + 1, 0, ...followersObjs);
    return result;
  };
  
  const handleConfirmSuperset = () => {
    if (!supersetAnchorExerciseId) return;
    const groupId = supersetAnchorExerciseId;
    const updatedExercises = exercises.map(ex => {
      if (ex.id === supersetAnchorExerciseId) {
        return { ...ex, supersetGroupId: groupId, isSupersetLeader: true };
      }
      if (supersetSelection.includes(ex.id)) {
        return { ...ex, supersetGroupId: groupId, isSupersetLeader: false };
      }
      // Comportamento additivo: mantieni i follower già esistenti
      return ex;
    });
    // Ordine desiderato: prima i follower già presenti, poi i nuovi selezionati
    const existingFollowersOrder = exercises.filter(ex => String(ex.supersetGroupId) === String(groupId) && !ex.isSupersetLeader).map(ex => ex.id);
    const newFollowersOrder = supersetSelection.filter(id => !existingFollowersOrder.includes(id));
    const desiredOrder = [...existingFollowersOrder, ...newFollowersOrder];

    const reordered = reorderSupersetGroupWithOrder(updatedExercises, groupId, desiredOrder);
    setExercises(reordered);
    if (activeVariantId !== 'original') {
      const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, exercises: reordered, updatedAt: new Date().toISOString() } : v);
      setVariants(updatedVariants);
    } else {
      setOriginalExercises(reordered);
    }
    triggerAutoSave();
    setIsSupersetMode(false);
    setSupersetAnchorExerciseId(null);
    setSupersetSelection([]);
  };
  
  const handleCancelSuperset = () => {
    setIsSupersetMode(false);
    setSupersetAnchorExerciseId(null);
    setSupersetSelection([]);
  };
  
  // Cloning helpers
  const generateExerciseId = () => Date.now().toString() + '_' + Math.random().toString(36).substr(2, 9);

  const handleCloneExercise = (exerciseId: string) => {
    const idx = exercises.findIndex(ex => ex.id === exerciseId);
    if (idx === -1) return;
    const source = exercises[idx];
    const cloned: Exercise = {
      ...source,
      id: generateExerciseId(),
      supersetGroupId: undefined,
      isSupersetLeader: false,
    };
    const updatedExercises = [...exercises.slice(0, idx + 1), cloned, ...exercises.slice(idx + 1)];
    const normalized = normalizeSupersets(updatedExercises);
    setExercises(normalized);
    if (activeVariantId !== 'original') {
      const prevVariantDays = variantDaysById[activeVariantId] || {};
      const newVariantDays = { ...prevVariantDays, [activeDayKey]: normalized };
      setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVariantDays });
      const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, exercises: newVariantDays['G1'] || normalized, days: newVariantDays, updatedAt: new Date().toISOString() } : { ...v, days: (variantDaysById[v.id] || (v as any).days || {}) });
      setVariants(updatedVariants);
    } else {
      const newOriginalDays = { ...originalDays, [activeDayKey]: normalized };
      setOriginalDays(newOriginalDays);
      if (activeDayKey === 'G1') setOriginalExercises(normalized);
    }
    triggerAutoSave();
    setOpenCloneActionsId(null);
  };

  const handleCloneSuperset = (anyMemberId: string) => {
    const member = exercises.find(ex => ex.id === anyMemberId);
    if (!member) return;
    const leaderId = member.isSupersetLeader ? member.id : member.supersetGroupId;
    if (!leaderId) return;
    const leaderIdx = exercises.findIndex(ex => ex.id === leaderId);
    if (leaderIdx === -1) return;
    let lastIdx = leaderIdx;
    const followers: Exercise[] = [];
    for (let k = leaderIdx + 1; k < exercises.length; k++) {
      const ex = exercises[k];
      if (String(ex.supersetGroupId) === String(leaderId) && !ex.isSupersetLeader) {
        followers.push(ex);
        lastIdx = k;
      } else {
        break;
      }
    }
    const originalLeader = exercises[leaderIdx];
    const newLeaderId = generateExerciseId();
    const clonedLeader: Exercise = { ...originalLeader, id: newLeaderId, supersetGroupId: newLeaderId, isSupersetLeader: true };
    const clonedFollowers: Exercise[] = followers.map(f => ({ ...f, id: generateExerciseId(), supersetGroupId: newLeaderId, isSupersetLeader: false }));
    const updated = [
      ...exercises.slice(0, lastIdx + 1),
      clonedLeader,
      ...clonedFollowers,
      ...exercises.slice(lastIdx + 1)
    ];
    const normalized = normalizeSupersets(updated);
    setExercises(normalized);
    if (activeVariantId !== 'original') {
      const prevVariantDays = variantDaysById[activeVariantId] || {};
      const newVariantDays = { ...prevVariantDays, [activeDayKey]: normalized };
      setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVariantDays });
      const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, exercises: newVariantDays['G1'] || normalized, days: newVariantDays, updatedAt: new Date().toISOString() } : { ...v, days: (variantDaysById[v.id] || (v as any).days || {}) });
      setVariants(updatedVariants);
    } else {
      const newOriginalDays = { ...originalDays, [activeDayKey]: normalized };
      setOriginalDays(newOriginalDays);
      if (activeDayKey === 'G1') setOriginalExercises(normalized);
    }
    triggerAutoSave();
    setOpenCloneActionsId(null);
  };
  
  const handleCloneWorkout = async () => {
    // Calcola il numero della prossima variante
    const existingVariantNumbers = variants
      .map(v => {
        const match = v.name.match(/Variante (\d+)/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(num => num > 0);

    const nextVariantNumber = existingVariantNumbers.length > 0
      ? Math.max(...existingVariantNumbers) + 1
      : 1;

    // Determina la sorgente da clonare: scheda originale o variante attiva
    const isCloningOriginal = activeVariantId === 'original';
    const selectedVariant = isCloningOriginal ? null : variants.find(v => v.id === activeVariantId);
    const sourceDaysRaw: { [key: string]: Exercise[] } = isCloningOriginal
      ? (originalDays || {})
      : (variantDaysById[activeVariantId] || (selectedVariant as any)?.days || {});
    const sourceDayNamesRaw: { [key: string]: string } = isCloningOriginal
      ? (originalDayNames || {})
      : (variantDayNamesById[activeVariantId] || (selectedVariant as any)?.dayNames || {});

    // Clona esattamente i giorni presenti nella sorgente (senza aggiunte implicite)
    const sourceDayKeys = Object.keys(sourceDaysRaw);
    const clonedDays: { [key: string]: Exercise[] } = {};
    const clonedDayNames: { [key: string]: string } = {};
    if (sourceDayKeys.length === 0) {
      // Se la sorgente non ha giorni mappati, crea G1 dal contesto corrente
      const fallbackG1 = isCloningOriginal
        ? (originalExercises || [])
        : (selectedVariant?.exercises || []);
      clonedDays['G1'] = deepCloneExercises(fallbackG1);
      // Nessun nome personalizzato specificato: lascia vuoto per fallback numerico
    } else {
      sourceDayKeys.forEach(dk => {
        clonedDays[dk] = deepCloneExercises(sourceDaysRaw[dk] || []);
        if (sourceDayNamesRaw[dk] && String(sourceDayNamesRaw[dk]).trim()) {
          clonedDayNames[dk] = String(sourceDayNamesRaw[dk]).trim();
        }
      });
    }

    // L'array exercises della variante punta a G1 della sorgente (se esiste), altrimenti lista vuota
    const newVariantExercises = deepCloneExercises(
      (sourceDayKeys.includes('G1') ? sourceDaysRaw['G1'] : clonedDays[sourceDayKeys[0]]) || []
    );

    const newVariant: WorkoutVariant = {
      id: Date.now().toString(),
      name: `Variante ${nextVariantNumber} di ${workoutTitle}`,
      isActive: true,
      exercises: newVariantExercises,
      days: clonedDays,
      dayNames: clonedDayNames,
      parentWorkoutId: workoutId,
      modifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Disattiva tutte le altre varianti e inserisci la nuova mantenendo ordine crescente (da sinistra a destra)
    const updatedVariants = [...variants.map(v => ({ ...v, isActive: false })), newVariant].sort((a, b) => {
      const ma = (a.name || '').match(/Variante\s+(\d+)/i);
      const mb = (b.name || '').match(/Variante\s+(\d+)/i);
      const na = ma ? parseInt(ma[1], 10) : Number.MAX_SAFE_INTEGER;
      const nb = mb ? parseInt(mb[1], 10) : Number.MAX_SAFE_INTEGER;
      return na - nb;
    });
    setVariants(updatedVariants);
    setActiveVariantId(newVariant.id);
    // Inizializza giorni per la nuova variante nell'UI state
    setVariantDaysById({ ...variantDaysById, [newVariant.id]: newVariant.days || {} });
    setVariantDayNamesById({ ...variantDayNamesById, [newVariant.id]: newVariant.dayNames || {} });

    // Porta lo scroll all'inizio per mostrare la testa del percorso
    if (variantTabsRef.current) {
      try { variantTabsRef.current.scrollTo({ left: 0, behavior: 'smooth' }); }
      catch { variantTabsRef.current.scrollLeft = 0; }
    }

    // Carica gli esercizi della nuova variante per il giorno attivo (fallback al primo giorno se non esiste)
    const clonedDayKeys = Object.keys(newVariant.days || {});
    const targetDayKey = clonedDayKeys.includes(activeDayKey) ? activeDayKey : (clonedDayKeys[0] || 'G1');
    if (targetDayKey !== activeDayKey) setActiveDayKey(targetDayKey);
    const nextList = (newVariant.days || {})[targetDayKey] || [];
    setExercises(deepCloneExercises(nextList));

    // Notifica creazione variante
    setSaveMessage(`Nuova variante creata: ${newVariant.name}`);

    // NON modificare il titolo della scheda - mantieni quello originale
    // La variante avrà il suo nome ma la scheda mantiene il titolo originale

    // Salva immediatamente le modifiche nel database
    try {
      const workoutData = await DB.getWorkoutPlanById(workoutId);
      if (workoutData) {
        const updatedWorkout = {
          ...workoutData,
          variants: updatedVariants,
          activeVariantId: newVariant.id,
          updatedAt: new Date().toISOString()
        };
        await updateWorkoutPlan(workoutId, updatedWorkout);
      }
    } catch (error) {
      console.error('Error saving new variant:', error);
    }
  };
  
  // Alias usato dal pulsante "+": aggiunge una nuova variante clonando l'originale o quella attiva
  const handleAddVariant = async () => {
    if (!canEdit) return;
    await handleCloneWorkout();
  };

  // Clona esplicitamente dalla scheda originale, indipendentemente dalla variante attiva
  const handleCloneFromOriginal = async () => {
    if (!canEdit) return;
    // Calcola prossimo numero
    const existingVariantNumbers = variants
      .map(v => {
        const match = (v.name || '').match(/Variante\s+(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    const nextVariantNumber = existingVariantNumbers.length > 0
      ? Math.max(...existingVariantNumbers) + 1
      : 1;

    // Clona giorni e nomi giorni dall'originale (usa weeksStore per allineamento settimana attiva)
    const sourceDaysRaw: { [key: string]: Exercise[] } = originalWeeksStore[activeWeekKey] || originalDays || {};
    const sourceDayNamesRaw: { [key: string]: string } = originalDayNames || {};

    const sourceDayKeys = Object.keys(sourceDaysRaw);
    const clonedDays: { [key: string]: Exercise[] } = {};
    const clonedDayNames: { [key: string]: string } = {};
    if (sourceDayKeys.length === 0) {
      const fallbackG1 = originalExercises || [];
      clonedDays['G1'] = deepCloneExercises(fallbackG1);
    } else {
      sourceDayKeys.forEach(dk => {
        clonedDays[dk] = deepCloneExercises(sourceDaysRaw[dk] || []);
        if (sourceDayNamesRaw[dk] && String(sourceDayNamesRaw[dk]).trim()) {
          clonedDayNames[dk] = String(sourceDayNamesRaw[dk]).trim();
        }
      });
    }

    const newVariantExercises = deepCloneExercises(
      (sourceDayKeys.includes('G1') ? sourceDaysRaw['G1'] : clonedDays[sourceDayKeys[0]]) || []
    );

    const newVariant: WorkoutVariant = {
      id: Date.now().toString(),
      name: `Variante ${nextVariantNumber} di ${workoutTitle}`,
      isActive: true,
      exercises: newVariantExercises,
      days: clonedDays,
      dayNames: clonedDayNames,
      parentWorkoutId: workoutId,
      modifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedVariants = [...variants.map(v => ({ ...v, isActive: false })), newVariant].sort((a, b) => {
      const ma = (a.name || '').match(/Variante\s+(\d+)/i);
      const mb = (b.name || '').match(/Variante\s+(\d+)/i);
      const na = ma ? parseInt(ma[1], 10) : Number.MAX_SAFE_INTEGER;
      const nb = mb ? parseInt(mb[1], 10) : Number.MAX_SAFE_INTEGER;
      return na - nb;
    });
    setVariants(updatedVariants);
    setActiveVariantId(newVariant.id);
    setVariantDaysById({ ...variantDaysById, [newVariant.id]: newVariant.days || {} });
    setVariantDayNamesById({ ...variantDayNamesById, [newVariant.id]: newVariant.dayNames || {} });

    const clonedDayKeys = Object.keys(newVariant.days || {});
    const targetDayKey = clonedDayKeys.includes(activeDayKey) ? activeDayKey : (clonedDayKeys[0] || 'G1');
    if (targetDayKey !== activeDayKey) setActiveDayKey(targetDayKey);
    const nextList = (newVariant.days || {})[targetDayKey] || [];
    setExercises(deepCloneExercises(nextList));

    setSaveMessage(`Nuova variante creata: ${newVariant.name}`);
    try {
      const workoutData = await DB.getWorkoutPlanById(workoutId);
      if (workoutData) {
        const updatedWorkout = {
          ...workoutData,
          variants: updatedVariants,
          activeVariantId: newVariant.id,
          updatedAt: new Date().toISOString()
        };
        await updateWorkoutPlan(workoutId, updatedWorkout);
      }
    } catch (error) {
      console.error('Error saving new variant:', error);
    }
  };

  // Clona esplicitamente una variante selezionata dal menu contestuale
  const handleCloneVariant = async (variantId: string) => {
    if (!canEdit) return;
    const selectedVariant = variants.find(v => v.id === variantId);
    if (!selectedVariant) return;

    // Calcola il numero della prossima variante
    const existingVariantNumbers = variants
      .map(v => {
        const match = (v.name || '').match(/Variante\s+(\d+)/i);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);

    const nextVariantNumber = existingVariantNumbers.length > 0
      ? Math.max(...existingVariantNumbers) + 1
      : 1;

    // Sorgente: giorni/dati della variante selezionata
    const sourceDaysRaw: { [key: string]: Exercise[] } = (variantDaysById[variantId] || (selectedVariant as any)?.days || {});
    const sourceDayNamesRaw: { [key: string]: string } = (variantDayNamesById[variantId] || (selectedVariant as any)?.dayNames || {});

    const sourceDayKeys = Object.keys(sourceDaysRaw);
    const clonedDays: { [key: string]: Exercise[] } = {};
    const clonedDayNames: { [key: string]: string } = {};
    if (sourceDayKeys.length === 0) {
      // Fallback: crea G1 dai suoi exercises
      const fallbackG1 = selectedVariant.exercises || [];
      clonedDays['G1'] = deepCloneExercises(fallbackG1);
    } else {
      sourceDayKeys.forEach(dk => {
        clonedDays[dk] = deepCloneExercises(sourceDaysRaw[dk] || []);
        const dn = sourceDayNamesRaw[dk];
        if (dn && String(dn).trim()) clonedDayNames[dk] = String(dn).trim();
      });
    }

    const newVariantExercises = deepCloneExercises(
      (sourceDayKeys.includes('G1') ? sourceDaysRaw['G1'] : clonedDays[sourceDayKeys[0]]) || []
    );

    const newVariant: WorkoutVariant = {
      id: Date.now().toString(),
      name: `Variante ${nextVariantNumber} di ${workoutTitle}`,
      isActive: true,
      exercises: newVariantExercises,
      days: clonedDays,
      dayNames: clonedDayNames,
      parentWorkoutId: workoutId,
      modifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedVariants = [...variants.map(v => ({ ...v, isActive: false })), newVariant].sort((a, b) => {
      const ma = (a.name || '').match(/Variante\s+(\d+)/i);
      const mb = (b.name || '').match(/Variante\s+(\d+)/i);
      const na = ma ? parseInt(ma[1], 10) : Number.MAX_SAFE_INTEGER;
      const nb = mb ? parseInt(mb[1], 10) : Number.MAX_SAFE_INTEGER;
      return na - nb;
    });
    setVariants(updatedVariants);
    setActiveVariantId(newVariant.id);
    setVariantDaysById({ ...variantDaysById, [newVariant.id]: newVariant.days || {} });
    setVariantDayNamesById({ ...variantDayNamesById, [newVariant.id]: newVariant.dayNames || {} });

    if (variantTabsRef.current) {
      try { variantTabsRef.current.scrollTo({ left: 0, behavior: 'smooth' }); }
      catch { variantTabsRef.current.scrollLeft = 0; }
    }

    const clonedDayKeys = Object.keys(newVariant.days || {});
    const targetDayKey = clonedDayKeys.includes(activeDayKey) ? activeDayKey : (clonedDayKeys[0] || 'G1');
    if (targetDayKey !== activeDayKey) setActiveDayKey(targetDayKey);
    setExercises(deepCloneExercises((newVariant.days || {})[targetDayKey] || []));

    setSaveMessage(`Nuova variante creata: ${newVariant.name}`);

    try {
      const workoutData = await DB.getWorkoutPlanById(workoutId);
      if (workoutData) {
        const updatedWorkout = {
          ...workoutData,
          variants: updatedVariants,
          activeVariantId: newVariant.id,
          updatedAt: new Date().toISOString()
        };
        await updateWorkoutPlan(workoutId, updatedWorkout);
      }
    } catch (error) {
      console.error('Error saving cloned variant:', error);
    }
  };

  const handleSwitchVariant = (variantId: string) => {
    console.log('🔄 SWITCH VARIANT - Start:', {
      from: activeVariantId,
      to: variantId,
      currentExercises: exercises.length,
      originalExercises: originalExercises?.length || 0,
      variants: variants.map(v => ({ id: v.id, name: v.name, exerciseCount: v.exercises?.length || 0 }))
    });

    // IMPORTANTE: Prima di cambiare variante, salva CORRETTAMENTE gli esercizi correnti
    if (activeVariantId !== variantId) {
      if (activeVariantId === 'original') {
        // Salva gli esercizi correnti nel giorno attivo della scheda originale
        console.log('💾 Saving current exercises to originalDays before switching variant');
        const newOriginalDays = { ...originalDays, [activeDayKey]: [...exercises] };
        setOriginalDays(newOriginalDays);
        if (activeDayKey === 'G1') setOriginalExercises([...exercises]);
      } else {
        // Salva gli esercizi correnti nel giorno attivo della variante corrente
        const prevVariantDays = variantDaysById[activeVariantId] || {};
        const newVariantDays = { ...prevVariantDays, [activeDayKey]: [...exercises] };
        console.log('💾 Saving current exercises to variantDays:', activeVariantId, activeDayKey, exercises.length);
        setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVariantDays });
        // Aggiorna anche l'array exercises della variante per compatibilità (G1)
        const currentVariantIndex = variants.findIndex(v => v.id === activeVariantId);
        if (currentVariantIndex !== -1) {
          const updatedVariants = [...variants];
          updatedVariants[currentVariantIndex] = {
            ...updatedVariants[currentVariantIndex],
            exercises: newVariantDays['G1'] || updatedVariants[currentVariantIndex].exercises || [],
            updatedAt: new Date().toISOString(),
          };
          setVariants(updatedVariants);
        }
      }
    }
    
    // Aggiorna lo stato delle varianti
    setVariants(variants.map(v => ({ ...v, isActive: v.id === variantId })));
    setActiveVariantId(variantId);
    
    // Notifica cambio variante
    setSaveMessage(variantId === 'original' ? 'Scheda originale attiva' : `Variante attiva: ${variants.find(v => v.id === variantId)?.name || ''}`);
    
    // Aggiorna la descrizione mostrata in base alla variante
    if (variantId === 'original') {
      // Torna agli esercizi del giorno attivo nell'originale
      const hasDay = activeDayKey in originalDays;
      const nextDayKey = hasDay ? activeDayKey : 'G1';
      if (!hasDay) setActiveDayKey(nextDayKey);
      const list = originalDays[nextDayKey] || [];
      console.log('📥 Loading original day', activeDayKey, 'exercises:', list.length);
      setExercises([...list]);
      // Usa la descrizione originale della scheda
      setWorkoutDescription(originalWorkoutDescription || '');
    } else {
      // Carica gli esercizi della variante per il giorno attivo
      const selectedVariant = variants.find(v => v.id === variantId);
      const vDays = variantDaysById[variantId] || (selectedVariant as any)?.days || {};
      const hasDay = activeDayKey in vDays;
      const nextDayKey = hasDay ? activeDayKey : 'G1';
      if (!hasDay) setActiveDayKey(nextDayKey);
      const list = vDays[nextDayKey] || [];
      console.log('📥 Loading variant day', activeDayKey, 'exercises:', selectedVariant?.name, list.length);
      setExercises([...list]);
      // Usa la descrizione della variante se presente
      setWorkoutDescription(selectedVariant?.description || '');
    }
    
    console.log('✅ SWITCH VARIANT - Complete:', {
      newActiveVariant: variantId,
      exercisesLoaded: exercises.length
    });
    
    // NON modificare il titolo della scheda quando si cambia variante
    // Il titolo della scheda rimane sempre quello originale
    // Solo il nome della variante cambia nei tab
  };

  // Cambio giorno G1–G10 con salvataggio degli esercizi correnti
  const handleSwitchDay = (dayKey: string) => {
    if (dayKey === activeDayKey) return;
    // Salva gli esercizi correnti nel giorno attuale per la variante attiva
    if (activeVariantId === 'original') {
      const updatedOriginalDays = {
        ...originalDays,
        [activeDayKey]: [...exercises],
      };
      setOriginalDays(updatedOriginalDays);
      // Aggiorna originalExercises se stiamo toccando G1
      if (activeDayKey === 'G1') {
        setOriginalExercises([...exercises]);
      }
      setActiveDayKey(dayKey);
      const nextList = updatedOriginalDays[dayKey] || [];
      setExercises([...nextList]);
      if (dayKey === 'G1') {
        setOriginalExercises([...nextList]);
      }
    } else {
      const prevVariantDays = variantDaysById[activeVariantId] || {};
      const updatedVariantDays = {
        ...prevVariantDays,
        [activeDayKey]: [...exercises],
      };
      setVariantDaysById({
        ...variantDaysById,
        [activeVariantId]: updatedVariantDays,
      });
      setActiveDayKey(dayKey);
      const nextList = updatedVariantDays[dayKey] || [];
      setExercises([...nextList]);
    }
    // Salvataggio veloce dello stato
  triggerAutoSave();
};

  // Rimozione giorno corrente (solo per variante/scheda attiva). Non consente rimozione di G1
  const handleRemoveDay = (dayKey: string) => {
    if (dayKey === 'G1') {
      setSaveMessage('Allenamento 1 non può essere eliminato');
      return;
    }
    showConfirmation(
      `Vuoi davvero rimuovere ${getDayDisplayName(dayKey)}?`,
      () => {
        if (activeVariantId === 'original') {
          const newOriginalDays = { ...originalDays };
          delete newOriginalDays[dayKey];
          const newOriginalDayNames = { ...originalDayNames };
          delete newOriginalDayNames[dayKey];
          // Se stai rimuovendo il giorno attivo, passare a giorno esistente più vicino
          let nextDay = activeDayKey;
          if (!(nextDay in newOriginalDays)) {
            const remainingKeys = Object.keys(newOriginalDays);
            const sorted = (remainingKeys.length ? remainingKeys : ['G1']).slice().sort((a, b) => {
              const na = parseInt(String(a).replace(/^G/, ''), 10);
              const nb = parseInt(String(b).replace(/^G/, ''), 10);
              return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
            });
            nextDay = sorted[0] || 'G1';
          }
          setOriginalDays(newOriginalDays);
          setOriginalDayNames(newOriginalDayNames);
          // Sincronizza immediatamente lo store settimane -> giorni per la settimana attiva
          setOriginalWeeksStore(prev => ({ ...prev, [activeWeekKey]: newOriginalDays }));
          setActiveDayKey(nextDay);
          const nextList = newOriginalDays[nextDay] || [];
          setExercises([...nextList]);
          if (nextDay === 'G1') setOriginalExercises([...nextList]);
        } else {
          const prevMap = variantDaysById[activeVariantId] || {};
          const newVariantDays = { ...prevMap };
          delete newVariantDays[dayKey];
          const prevNames = variantDayNamesById[activeVariantId] || {};
          const newVariantNames = { ...prevNames };
          delete newVariantNames[dayKey];
          let nextDay = activeDayKey;
          if (!(nextDay in newVariantDays)) {
            const remainingKeys = Object.keys(newVariantDays);
            const sorted = (remainingKeys.length ? remainingKeys : ['G1']).slice().sort((a, b) => {
              const na = parseInt(String(a).replace(/^G/, ''), 10);
              const nb = parseInt(String(b).replace(/^G/, ''), 10);
              return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
            });
            nextDay = sorted[0] || 'G1';
          }
          setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVariantDays });
          setVariantDayNamesById({ ...variantDayNamesById, [activeVariantId]: newVariantNames });
          // Sincronizza immediatamente lo store settimane della variante -> giorni per la settimana attiva
          const prevWeeksStore = variantWeeksStoreById[activeVariantId] || {};
          const updatedWeeksStore = { ...prevWeeksStore, [activeWeekKey]: newVariantDays };
          setVariantWeeksStoreById({ ...variantWeeksStoreById, [activeVariantId]: updatedWeeksStore });
          const list = newVariantDays[nextDay] || [];
          setActiveDayKey(nextDay);
          setExercises([...list]);
          // Mantieni coerenza nel modello variante
          const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, days: newVariantDays, dayNames: newVariantNames, exercises: newVariantDays['G1'] || v.exercises || [], updatedAt: new Date().toISOString() } : v);
          setVariants(updatedVariants);
        }
        setSaveMessage(`${getDayDisplayName(dayKey)} rimosso`);
        triggerAutoSave();
      }
    );
  };

  // Svuota completamente la scheda originale (tutte le settimane/giorni/esercizi)
  const handleClearOriginal = () => {
    const clearedStore = Object.keys(originalWeeksStore).reduce((acc: { [weekKey: string]: { [dayKey: string]: Exercise[] } }, wk) => {
      const dayMap = originalWeeksStore[wk] || {};
      const clearedDayMap = Object.keys(dayMap).reduce((inner: { [dayKey: string]: Exercise[] }, dk) => {
        inner[dk] = [];
        return inner;
      }, {} as { [dayKey: string]: Exercise[] });
      acc[wk] = clearedDayMap;
      return acc;
    }, {} as { [weekKey: string]: { [dayKey: string]: Exercise[] } });
    setOriginalWeeksStore(clearedStore);
    const activeClearedDays = clearedStore[activeWeekKey] || {};
    setOriginalDays(activeClearedDays);
    if (activeDayKey === 'G1') setOriginalExercises([]);
    setExercises([]);
    setSaveMessage('Scheda originale svuotata');
    triggerAutoSave();
  };
  
  const handleRemoveVariant = (variantId: string) => {
    showConfirmation(
      'Vuoi davvero chiudere questa variante della scheda?',
      async () => {
        const deletedIndex = variants.findIndex(v => v.id === variantId);
        const filteredVariants = variants.filter(v => v.id !== variantId);

        // Determina quale variante deve diventare attiva (o originale)
        let nextActiveVariantId: string | null;
        if (activeVariantId === variantId) {
          if (filteredVariants.length > 0) {
            // Se esiste una precedente nella lista, attivala; altrimenti torna all'originale
            nextActiveVariantId = deletedIndex > 0 ? variants[deletedIndex - 1].id : null;
          } else {
            nextActiveVariantId = null; // originale
          }
        } else {
          // La variante eliminata non era attiva, mantieni l'attuale attiva
          nextActiveVariantId = activeVariantId === 'original' ? null : activeVariantId;
        }

        // Costruisci la lista finale delle varianti con isActive coerente e esercizi garantiti per la variante attiva
        let finalVariants = filteredVariants.map(v => ({ ...v, isActive: false }));
        if (nextActiveVariantId) {
          const idx = finalVariants.findIndex(v => v.id === nextActiveVariantId);
          if (idx !== -1) {
            const hasExercises = finalVariants[idx].exercises && (finalVariants[idx].exercises as Exercise[]).length > 0;
            const ensuredExercises = hasExercises ? [ ...(finalVariants[idx].exercises as Exercise[]) ] : deepCloneExercises(originalExercises);
            finalVariants[idx] = {
              ...finalVariants[idx],
              isActive: true,
              exercises: ensuredExercises,
              updatedAt: new Date().toISOString(),
            };
          }
        }

        // Aggiorna stato UI in modo atomico e coerente
        setVariants(finalVariants);
        setSaveMessage('Variante rimossa');
        if (nextActiveVariantId) {
          setActiveVariantId(nextActiveVariantId);
          const nextActiveVariant = finalVariants.find(v => v.id === nextActiveVariantId);
          setExercises(nextActiveVariant?.exercises ? [ ...(nextActiveVariant.exercises as Exercise[]) ] : []);
          setWorkoutDescription(nextActiveVariant?.description || '');
        } else {
          setActiveVariantId('original');
          setExercises(originalExercises ? [...originalExercises] : []);
          setWorkoutDescription(originalWorkoutDescription || '');
        }

        // Persisti nel database
        try {
          const workoutData = await DB.getWorkoutPlanById(workoutId);
          if (workoutData) {
            const updatedWorkout = {
              ...workoutData,
              variants: finalVariants,
              activeVariantId: nextActiveVariantId ?? null,
              updatedAt: new Date().toISOString(),
            };
            await updateWorkoutPlan(workoutId, updatedWorkout);
          }
        } catch (error) {
          console.error('Error saving variant deletion:', error);
        }
      }
    );
  };
  
  const showConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmDialog(true);
  };
  
  const handleConfirmAction = () => {
    confirmAction();
    setShowConfirmDialog(false);
  };
  
  const handleAssociateAthlete = async (athleteId: string, variantId?: string) => {
    if (!workoutId) return;
    if (!associatedAthletes.includes(athleteId)) {
      const target = athletes.find(u => u.id === athleteId);
      const tokensToAdd = [athleteId, target?.email].filter(Boolean) as string[];
      const updatedAthletes = Array.from(new Set([...associatedAthletes, ...tokensToAdd]));
      setAssociatedAthletes(updatedAthletes);

      setSaveMessage(`Scheda associata a ${target?.name || 'atleta'}`);

      // Trigger auto-save immediately for athlete association
      triggerAutoSave();

      // Notifica la pagina "Le tue schede" di aggiornare la lista
      try { window.dispatchEvent(new Event('kw8:user-workouts:update')); } catch {}

      // Aggiorna il profilo utente con la scheda assegnata
      try {
        if (target) {
          // Assegna in base alla variante selezionata nel menu Associa (fallback: variante attiva)
          const chosenVariantId = (variantId ?? activeVariantId) || 'original';
          const isVariant = chosenVariantId !== 'original';
          const variantToken = isVariant ? `${workoutId}|variant:${chosenVariantId}` : workoutId;
          // Aggiungi la nuova assegnazione mantenendo eventuali altre (scheda base o varianti già associate)
          const existingPlans = (target.workoutPlans || []);
          const uniquePlans = Array.from(new Set([...existingPlans, variantToken]));
          await updateUser(athleteId, { workoutPlans: uniquePlans } as any);
          // Aggiornamento ottimistico UI
          setLocalPlansOverrideByUserId(prev => ({ ...prev, [athleteId]: uniquePlans }));
        }
      } catch (e) {
        console.error('Errore aggiornando i piani utente:', e);
      }
      // Non chiudere il menu dopo l'associazione: resta aperto per altre azioni
    }
  };
  
  const handleRemoveAthlete = async (athleteId: string) => {
    if (!workoutId) return;
    const target = athletes.find(u => u.id === athleteId);
    const tokensToRemove = [athleteId, target?.email].filter(Boolean) as string[];
    const updatedAthletes = associatedAthletes.filter(a => !tokensToRemove.includes(a));
    setAssociatedAthletes(updatedAthletes);

    // Trigger auto-save immediately for athlete removal
    triggerAutoSave();

    // Notifica la pagina "Le tue schede" di aggiornare la lista
    try { window.dispatchEvent(new Event('kw8:user-workouts:update')); } catch {}

    // Aggiorna il profilo utente rimuovendo la scheda
    try {
      if (target) {
        // Rimuovi qualsiasi assegnazione relativa a questa scheda (base o varianti)
        const filteredPlans = (target.workoutPlans || []).filter(pid => !(pid === workoutId || pid.startsWith(`${workoutId}|variant:`)));
        await updateUser(athleteId, { workoutPlans: filteredPlans } as any);
        // Aggiornamento ottimistico UI
        setLocalPlansOverrideByUserId(prev => ({ ...prev, [athleteId]: filteredPlans }));
      }
      const removedUser = target || athletes.find(u => u.id === athleteId);
      setSaveMessage(`Associazione rimossa da ${removedUser?.name || 'atleta'}`);
    } catch (e) {
      console.error('Errore aggiornando i piani utente (rimozione):', e);
    }
  };

  // Rimuove una singola assegnazione (scheda base o specifica variante) dall'atleta
  const handleRemoveAthleteAssignment = async (athleteId: string, variantId: string) => {
    if (!workoutId) return;
    const target = athletes.find(u => u.id === athleteId);
    // Aggiorna solo il profilo utente togliendo il token specifico, senza toccare altre varianti
    try {
      if (target) {
        const tokenToRemove = variantId && variantId !== 'original' ? `${workoutId}|variant:${variantId}` : workoutId;
        const prunedPlans = (target.workoutPlans || []).filter(pid => pid !== tokenToRemove);
        await updateUser(athleteId, { workoutPlans: prunedPlans } as any);
        // Aggiornamento ottimistico UI
        setLocalPlansOverrideByUserId(prev => ({ ...prev, [athleteId]: prunedPlans }));
        // Se non restano assegnazioni per questa scheda, rimuovi l'atleta dalla lista associata
        const stillAssigned = prunedPlans.some(pid => pid === workoutId || String(pid).startsWith(`${workoutId}|variant:`));
        if (!stillAssigned) {
          // Rimuovi sia l'ID che l'email dal set associato
          setAssociatedAthletes(prev => prev.filter(a => a !== athleteId && a !== (target?.email ?? '')));
          triggerAutoSave();
        }
      }
      const removedUser = target || athletes.find(u => u.id === athleteId);
      const label = variantId && variantId !== 'original' ? 'variante' : 'scheda';
      setSaveMessage(`Rimossa ${label} da ${removedUser?.name || 'atleta'}`);
      // Aggiorna UI esterne interessate
      try { window.dispatchEvent(new Event('kw8:user-workouts:update')); } catch {}
    } catch (e) {
      console.error('Errore aggiornando i piani utente (rimozione singola):', e);
    }
  };

  // Associa tutte le schede/varianti selezionate al singolo atleta
  // Accetta opzionalmente una lista di ID varianti esplicita per evitare race con setState
  const handleAssociateSelected = async (athleteId: string, overrideIds?: string[]) => {
    if (!workoutId) return;
    const target = athletes.find(u => u.id === athleteId);
    const chosenIds = (overrideIds && overrideIds.length > 0)
      ? overrideIds
      : ((selectedAssociationVariantIds && selectedAssociationVariantIds.length > 0)
        ? selectedAssociationVariantIds
        : ['original']);
    const tokens = chosenIds.map(id => id !== 'original' ? `${workoutId}|variant:${id}` : workoutId);
    try {
      if (target) {
        const existingPlans = (target.workoutPlans || []);
        const uniquePlans = Array.from(new Set([...existingPlans, ...tokens]));
        await updateUser(athleteId, { workoutPlans: uniquePlans } as any);
        // Aggiornamento ottimistico UI
        setLocalPlansOverrideByUserId(prev => ({ ...prev, [athleteId]: uniquePlans }));
        // Assicura che l'atleta compaia nella lista associata a questa scheda
        setAssociatedAthletes(prev => (
          prev.includes(athleteId) ? prev : [...prev, athleteId]
        ));
        // Persisti subito l'aggiornamento della scheda
        triggerAutoSave();
      }
      const associatedUser = target || athletes.find(u => u.id === athleteId);
      setSaveMessage(`Schede associate a ${associatedUser?.name || 'atleta'}`);
      // Notifica aggiornamenti
      try { window.dispatchEvent(new Event('kw8:user-workouts:update')); } catch {}
    } catch (e) {
      console.error('Errore aggiornando i piani utente (associazione multipla):', e);
    }
  };
  
  const handleEditExercise = (exercise: Exercise) => {
    console.log('✏️ Editing exercise:', exercise);
    console.log('🆔 Exercise ID type:', typeof exercise.id);
    console.log('🆔 Exercise ID value:', exercise.id);
    console.log('🆔 Exercise ID length:', exercise.id?.length);
    console.log('🆔 Setting editingExerciseId to:', exercise.id);
    
    setEditingExerciseId(exercise.id);
    setEditingExercise({ ...exercise });
    
    // Parse existing sets format (e.g., "3 x 10" or "3x10") into separate values
    const setsString = exercise.sets || '';
    const setsMatch = setsString.match(/(\d+)\s*x\s*(\d+)/i);
    if (setsMatch) {
      setEditingSets(setsMatch[1]);
      setEditingReps(setsMatch[2]);
    } else {
      // If no 'x' format, try to parse as just sets or just reps
      const numMatch = setsString.match(/(\d+)/);
      if (numMatch) {
        setEditingSets(numMatch[1]);
        setEditingReps('');
      } else {
        setEditingSets('');
        setEditingReps('');
      }
    }
    
    setShowExerciseForm(true);
    setShowExerciseDropdown(false);
    
    console.log('✅ Edit state set - editingExerciseId should be:', exercise.id);
  };
  
  const handleUpdateExercise = () => {
    if (editingExercise && editingExerciseId) {
      // Ensure we have the most up-to-date data from the form
      const updatedExercise = {
        ...editingExercise,
        id: editingExerciseId
      };

      // Se il superset è stato rimosso, pulisci i metadati
      if (!updatedExercise.supersetGroupId) {
        delete (updatedExercise as any).isSupersetLeader;
      } else if (updatedExercise.supersetGroupId && updatedExercise.isSupersetLeader) {
        // Se è capo, assicurati di marcare gli altri come follower
        const groupId = updatedExercise.supersetGroupId;
        // verrà gestito nel riordino sotto
      }
      
      let updatedExercises = exercises.map(ex => 
        ex.id === editingExerciseId ? updatedExercise : ex
      );

      // Riordina se è follower di un superset
      if (updatedExercise.supersetGroupId && !updatedExercise.isSupersetLeader) {
        updatedExercises = reorderSupersetGroup(updatedExercises, updatedExercise.supersetGroupId);
      }
      
      console.log('🔄 Updating exercise:', updatedExercise);
      console.log('📊 Updated exercises list:', updatedExercises);
      
      setExercises(updatedExercises);

      if (activeVariantId !== 'original') {
        const prevVariantDays = variantDaysById[activeVariantId] || {};
        const newVariantDays = { ...prevVariantDays, [activeDayKey]: updatedExercises };
        setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVariantDays });
        const updatedVariants = variants.map(v => 
          v.id === activeVariantId 
            ? { ...v, exercises: newVariantDays['G1'] || updatedExercises, days: newVariantDays, updatedAt: new Date().toISOString() }
            : { ...v, days: (variantDaysById[v.id] || (v as any).days || {}) }
        );
        setVariants(updatedVariants);
      } else {
        const newOriginalDays = { ...originalDays, [activeDayKey]: updatedExercises };
        setOriginalDays(newOriginalDays);
        if (activeDayKey === 'G1') setOriginalExercises(updatedExercises);
      }

      setEditingExerciseId(null);
      setEditingExercise(null);
      setShowExerciseForm(false);
      setShowExerciseDropdown(false);
      
      // ➕ Aggiunge automaticamente il nome alla libreria personalizzata se non presente
      const updatedName = (updatedExercise.name || '').trim();
      if (updatedName && !predefinedExercises.includes(updatedName) && !customExercises.includes(updatedName)) {
        console.log('📚 Adding updated name to custom exercise library:', updatedName);
        setCustomExercises([...customExercises, updatedName]);
        setSaveMessage('Nuovo esercizio aggiunto correttamente');
      } else {
        // Notifica distinta per salvataggio/modifica dell'esercizio
        setSaveMessage('Esercizio aggiornato');
      }
      
      // Reset current exercise form
      setCurrentExercise({
        name: '',
        notes: '',
        sets: '',
        intensity: '',
        tut: '',
        recovery: '',
        videoLink: ''
      });
      
      // Trigger auto-save immediately for exercise updates
      console.log('🔄 Triggering auto-save after updating exercise');
      triggerAutoSave();
    }
  };
  
  const handleRemoveExercise = (exerciseId: string) => {
    // Guardia: evita cancellazioni massive se l'id è vuoto/invalid
    if (!exerciseId || typeof exerciseId !== 'string' || exerciseId.trim() === '') {
      console.warn('⚠️ Invalid exerciseId for removal, aborting to prevent mass deletion:', exerciseId);
      return;
    }
    showConfirmation(
      'Sei sicuro di voler rimuovere questo esercizio?',
      () => {
        console.log('🗑️ REMOVING EXERCISE:', {
          exerciseId,
          activeVariant: activeVariantId,
          currentExercises: exercises.length,
          originalExercises: originalExercises?.length || 0
        });
        
        const updatedExercises = exercises.filter(ex => ex.id !== exerciseId);
        const normalized = normalizeSupersets(updatedExercises);
        setExercises(normalized);

        // IMPORTANTE: Gestione corretta dell'isolamento per la rimozione con giorni
        if (activeVariantId !== 'original') {
          const prevVariantDays = variantDaysById[activeVariantId] || {};
          const newVariantDays = { ...prevVariantDays, [activeDayKey]: normalized };
          setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVariantDays });
          const updatedVariants = variants.map(v => 
            v.id === activeVariantId 
              ? { ...v, exercises: newVariantDays['G1'] || normalized, days: newVariantDays, updatedAt: new Date().toISOString() }
              : { ...v, days: (variantDaysById[v.id] || (v as any).days || {}) }
          );
          setVariants(updatedVariants);
          console.log('🔄 Updated ONLY variant day', activeDayKey, 'after deletion:', {
            variantId: activeVariantId,
            exerciseCount: normalized.length
          });
          console.log('🔒 OriginalExercises PROTECTED and unchanged:', originalExercises?.length || 0, 'exercises');
        } else {
          const newOriginalDays = { ...originalDays, [activeDayKey]: normalized };
          setOriginalDays(newOriginalDays);
          if (activeDayKey === 'G1') setOriginalExercises(normalized);
          console.log('🔄 Updated ONLY original day', activeDayKey, 'exercises after deletion:', normalized.length);
        }
        
        // Trigger auto-save immediately for exercise removal
        setSaveMessage('Esercizio rimosso');
        triggerAutoSave();
      }
    );
  };
  
  const handleBackToFolder = () => {
    onClose();
  };
  
  // Handler per drag-to-scroll su tab varianti (con soglia per non bloccare i click)
  const handleVariantTabsPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!variantTabsRef.current) return;
    // Consenti l'avvio del drag ovunque; i click dei bottoni restano funzionanti grazie alla soglia e alle guardie negli onClick
    setIsDragging(false); // diventa true solo dopo aver superato la soglia di movimento
    dragInitiatedRef.current = true;
    dragStartXRef.current = e.clientX;
    scrollStartLeftRef.current = variantTabsRef.current.scrollLeft;
  };
  
  const handleVariantTabsPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!variantTabsRef.current || !dragInitiatedRef.current) return;
    const deltaX = e.clientX - dragStartXRef.current;
    // Attiva dragging solo se supera una piccola soglia
    if (Math.abs(deltaX) > 5) {
      if (!isDragging) setIsDragging(true);
      variantTabsRef.current.scrollLeft = scrollStartLeftRef.current - deltaX;
      // Previeni il comportamento di selezione solo quando stai trascinando davvero
      e.preventDefault();
    }
  };
  
  const handleVariantTabsPointerUp = (_e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    dragInitiatedRef.current = false;
  };
  
  return (
    <div className="bg-gray-100 min-h-screen">
      {/* (Rimosso) Titolo pagina desktop e tasto indietro sopra la toolbar */}
      {/* Notifica stile Apple (pill) */}
      {saveMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50" role="status" aria-live="polite">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full bg-white/95 backdrop-blur-sm shadow-md ring-1 ring-gray-200 transform transition-all duration-300 ease-out ${isToastExiting ? 'opacity-0 -translate-y-2 scale-95' : isToastEntering ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
            <CheckCircle size={18} className="text-green-600" />
            <span className="text-gray-700 text-sm font-medium">{saveMessage}</span>
          </div>
        </div>
      )}
      {/* Barra di navigazione varianti spostata sotto il titolo della scheda */}
      {canEdit && !isStandaloneMobile && (
        <div className="w-full px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
          <div ref={toolbarRef} className="relative w-full flex justify-center max-w-full">
            <div className="flex flex-nowrap whitespace-nowrap justify-center items-center gap-1 p-2 bg-white/70 backdrop-blur-sm ring-1 ring-black/10 rounded-2xl shadow-sm">
              {/* Varianti dropdown */}
              <div className="relative">
                <button
                  ref={variantsDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                  onClick={(e) => toggleVariantsDropdown(e)}
                  title="Varianti"
                  aria-label="Varianti"
                  className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(28px, 6vw, 32px)', height: 'clamp(28px, 6vw, 32px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                >
                  {activeVariantId === 'original' ? (
                    <>
                      <FileText size={18} className="text-blue-600" />
                      <Star size={10} className="absolute -top-0.5 -right-0.5 text-blue-600" />
                    </>
                  ) : (
                    <>
                      <FileText size={18} className="text-red-600" />
                      {(() => { const idx = displayVariants.findIndex(v => v.id === activeVariantId); return idx >= 0 ? (<span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-red-600">{idx + 1}</span>) : null; })()}
                    </>
                  )}
                </button>
                {isVariantsDropdownOpen && (
                  <Portal>
                    <div
                      ref={variantsDropdownRef as React.RefObject<HTMLDivElement>}
                      style={{ position: 'fixed', top: variantsDropdownPosition?.top ?? 0, left: variantsDropdownPosition?.left ?? 0 }}
                      className="z-50 w-64 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                    >
                      <div className="mb-1 px-2 text-xs text-gray-500">Seleziona scheda</div>
                      <div className="space-y-1">
                        {/* Originale */}
                        {(!isAthlete || canSeeOriginal) && (
                          <button
                            onClick={() => { handleSwitchVariant('original'); closeVariantsDropdown(); }}
                            onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetVariantMenuPosition(e.currentTarget as HTMLElement); setOpenVariantMenuId('original'); }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              if (!canEdit) return;
                              variantLongPressTriggeredRef.current = false;
                              variantPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                              const anchor = e.currentTarget as HTMLElement;
                              if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current);
                              variantLongPressTimeoutRef.current = window.setTimeout(() => {
                                variantLongPressTriggeredRef.current = true;
                                computeAndSetVariantMenuPosition(anchor);
                                setOpenVariantMenuId('original');
                              }, VARIANT_LONG_PRESS_MS);
                            }}
                            onPointerUp={() => { if (!canEdit) return; if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }}
                            onPointerMove={(e) => {
                              if (!canEdit) return;
                              const startPos = variantPressStartPosRef.current; if (!startPos) return;
                              const dx = Math.abs(e.clientX - startPos.x); const dy = Math.abs(e.clientY - startPos.y);
                              if (dx > 6 || dy > 6) { if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeVariantId === 'original' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                            title={`Scheda: ${workoutTitle}`}
                          >
                            <FileText size={16} className={activeVariantId === 'original' ? 'text-blue-700' : 'text-gray-600'} />
                            <span>{workoutTitle}</span>
                          </button>
                        )}
                        {/* Varianti */}
                        {displayVariants.map((variant, index) => (
                          <button
                            key={variant.id}
                            onClick={() => { handleSwitchVariant(variant.id); closeVariantsDropdown(); }}
                            onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetVariantMenuPosition(e.currentTarget as HTMLElement); setOpenVariantMenuId(variant.id); }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              if (!canEdit) return;
                              variantLongPressTriggeredRef.current = false;
                              variantPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                              const anchor = e.currentTarget as HTMLElement;
                              if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current);
                              variantLongPressTimeoutRef.current = window.setTimeout(() => {
                                variantLongPressTriggeredRef.current = true;
                                computeAndSetVariantMenuPosition(anchor);
                                setOpenVariantMenuId(variant.id);
                              }, VARIANT_LONG_PRESS_MS);
                            }}
                            onPointerUp={() => { if (!canEdit) return; if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }}
                            onPointerMove={(e) => {
                              if (!canEdit) return;
                              const startPos = variantPressStartPosRef.current; if (!startPos) return;
                              const dx = Math.abs(e.clientX - startPos.x); const dy = Math.abs(e.clientY - startPos.y);
                              if (dx > 6 || dy > 6) { if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeVariantId === variant.id ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                            title={`Variante ${index + 1}: ${variant.name || 'Senza titolo'}`}
                          >
                            <FileText size={16} className={activeVariantId === variant.id ? 'text-red-700' : 'text-red-600'} />
                            <span>Variante {index + 1}{variant.name ? ` — ${variant.name}` : ''}</span>
                          </button>
                        ))}
                      </div>
                      {canEdit && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => { handleAddVariant(); }}
                            className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                            title="Crea nuova variante"
                          >
                            <Plus size={16} className="text-red-600" />
                            <span>Nuova variante</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Portal>
                )}
              </div>
              {/* Separatore Apple dopo Varianti */}
              <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

              {/* Settimane dropdown */}
              <div className="relative">
                <button
                  ref={weeksDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                  onClick={(e) => toggleWeeksDropdown(e)}
                  title="Settimane"
                  aria-label="Settimane"
                  className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(28px, 6vw, 32px)', height: 'clamp(28px, 6vw, 32px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                >
                  <Calendar size={18} className="text-cyan-600" />
                  <span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{parseInt(activeWeekKey.replace('W',''), 10)}</span>
                </button>
                {isWeeksDropdownOpen && (
                  <Portal>
                    <div
                      ref={weeksDropdownRef as React.RefObject<HTMLDivElement>}
                      style={{ position: 'fixed', top: weeksDropdownPosition?.top ?? 0, left: weeksDropdownPosition?.left ?? 0 }}
                      className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                    >
                      <div className="mb-1 px-2 text-xs text-gray-500">Seleziona settimana</div>
                      <div className="space-y-1">
                        {weeks.slice().sort((a, b) => {
                          const na = parseInt(a.replace(/^W/, ''), 10);
                          const nb = parseInt(b.replace(/^W/, ''), 10);
                          return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                        }).map((wk) => (
                          <button
                            key={wk}
                            onClick={() => { if (weekLongPressTriggeredRef.current) return; handleSwitchWeek(wk); closeWeeksDropdown(); }}
                            onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetWeekMenuPosition(e.currentTarget as HTMLElement); setOpenWeekKeyMenu(wk); }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              if (!canEdit) return;
                              weekLongPressTriggeredRef.current = false;
                              weekPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                              const anchor = e.currentTarget as HTMLElement;
                              if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current);
                              weekLongPressTimeoutRef.current = window.setTimeout(() => {
                                weekLongPressTriggeredRef.current = true;
                                computeAndSetWeekMenuPosition(anchor);
                                setOpenWeekKeyMenu(wk);
                              }, VARIANT_LONG_PRESS_MS);
                            }}
                            onPointerUp={() => { if (!canEdit) return; if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current); weekLongPressTriggeredRef.current = false; }}
                            onPointerMove={(e) => {
                              if (!canEdit) return;
                              const start = weekPressStartPosRef.current; if (!start) return;
                              const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y);
                              if (dx > 6 || dy > 6) { if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current); weekLongPressTriggeredRef.current = false; }
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeWeekKey === wk ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                            title={`Settimana ${parseInt(wk.replace('W',''), 10)}`}
                          >
                            <Calendar size={16} className={activeWeekKey === wk ? 'text-cyan-700' : 'text-gray-600'} />
                            <span>Settimana {parseInt(wk.replace('W',''), 10)}</span>
                          </button>
                        ))}
                      </div>
                      {canEdit && weeks.length < 12 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => { handleAddWeek(); }}
                            className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                            title="Aggiungi settimana"
                          >
                            <Plus size={16} className="text-cyan-600" />
                            <span>Aggiungi settimana</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Portal>
                )}
              </div>
              {/* Separatore Apple dopo Settimane */}
              <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

              {/* Giorni dropdown */}
              <div className="relative">
                <button
                  ref={daysDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                  onClick={(e) => toggleDaysDropdown(e)}
                  title="Allenamenti"
                  aria-label="Allenamenti"
                  className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(28px, 6vw, 32px)', height: 'clamp(28px, 6vw, 32px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                >
                  <Dumbbell size={18} className="text-orange-500" />
                  {(() => { const n = parseInt(String(activeDayKey).replace(/^G/, ''), 10); return isNaN(n) ? null : (<span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{n}</span>); })()}
                </button>
                {isDaysDropdownOpen && (
                  <Portal>
                    <div
                      ref={daysDropdownRef as React.RefObject<HTMLDivElement>}
                      style={{ position: 'fixed', top: daysDropdownPosition?.top ?? 0, left: daysDropdownPosition?.left ?? 0 }}
                      className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                    >
                      <div className="mb-1 px-2 text-xs text-gray-500">Seleziona allenamento</div>
                      <div className="space-y-1">
                        {(() => {
                          const keys = activeVariantId === 'original' ? Object.keys(originalDays) : Object.keys(variantDaysById[activeVariantId] || {});
                          const sorted = (keys.length ? keys : ['G1']).slice().sort((a, b) => {
                            const na = parseInt(String(a).replace(/^G/, ''), 10);
                            const nb = parseInt(String(b).replace(/^G/, ''), 10);
                            return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                          });
                          return sorted.map((dk) => {
                            const label = getDayDisplayName(dk);
                              return (
                                <button
                                  key={dk}
                                  onClick={() => { if (dayLongPressTriggeredRef.current) return; handleSwitchDay(dk); closeDaysDropdown(); }}
                                  onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetDayMenuPosition(e.currentTarget as HTMLElement); setOpenDayKeyMenu(dk); }}
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    if (!canEdit) return;
                                    dayLongPressTriggeredRef.current = false;
                                    dayPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                                    const anchor = e.currentTarget as HTMLElement;
                                    if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current);
                                    dayLongPressTimeoutRef.current = window.setTimeout(() => {
                                      dayLongPressTriggeredRef.current = true;
                                      computeAndSetDayMenuPosition(anchor);
                                      setOpenDayKeyMenu(dk);
                                    }, VARIANT_LONG_PRESS_MS);
                                  }}
                                  onPointerUp={() => { if (!canEdit) return; if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current); dayLongPressTriggeredRef.current = false; }}
                                  onPointerMove={(e) => {
                                    if (!canEdit) return;
                                    const start = dayPressStartPosRef.current; if (!start) return;
                                    const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y);
                                    if (dx > 6 || dy > 6) { if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current); dayLongPressTriggeredRef.current = false; }
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeDayKey === dk ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                                  title={label}
                                >
                                  <Dumbbell size={16} className={activeDayKey === dk ? 'text-orange-700' : 'text-orange-500'} />
                                  <span>{label}</span>
                                </button>
                              );
                          });
                        })()}
                      </div>
                      {canEdit && (() => {
                        const keys = activeVariantId === 'original' ? Object.keys(originalDays) : Object.keys(variantDaysById[activeVariantId] || {});
                        const count = keys.length > 0 ? keys.length : 1;
                        return count < 10;
                      })() && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => { handleAddDay(); }}
                            className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                            title="Aggiungi allenamento"
                          >
                            <Plus size={16} className="text-orange-600" />
                            <span>Aggiungi allenamento</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Portal>
                )}
              </div>
              {/* Separatore Apple dopo Allenamenti */}
              <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

              {/* Create Exercise */}
              <button
                onClick={() => {
                  if (showExerciseForm) {
                    setShowExerciseForm(false);
                    setEditingExerciseId(null);
                    setEditingExercise(null);
                    setCurrentExercise({
                      id: '',
                      name: '',
                      notes: '',
                      sets: '',
                      intensity: '',
                      tut: '',
                      recovery: '',
                      videoLink: ''
                    });
                    setCurrentSets('');
                    setCurrentReps('');
                    setEditingSets('');
                    setEditingReps('');
                  } else {
                    setShowExerciseForm(true);
                  }
                }}
                title="Crea"
                aria-label="Crea"
                className="bg-white rounded-md flex items-center justify-center cursor-pointer transition hover:bg-gray-50 shrink-0"
                style={{ width: 'clamp(32px, 7vw, 36px)', height: 'clamp(32px, 7vw, 36px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
              >
                <Plus size={18} className="text-green-600" />
              </button>
              {/* Separatore Apple dopo Crea */}
              <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

              {/* Tags button */}
              <div className="relative">
                <button
                  ref={tagsTriggerRef as React.RefObject<HTMLButtonElement>}
                  onClick={(e) => toggleTagsMenu(e)}
                  title="Tag"
                  aria-label="Tag"
                  className="bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(26px, 6vw, 30px)', height: 'clamp(26px, 6vw, 30px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                >
                  <Tag size={18} className="text-purple-600" />
                </button>
                {isTagsMenuOpen && (
                  <Portal>
                    <div
                      ref={tagsDropdownRef as React.RefObject<HTMLDivElement>}
                      style={{ position: 'fixed', top: tagsMenuPosition?.top ?? 0, left: tagsMenuPosition?.left ?? 0 }}
                      className="z-50 w-80 max-w-[85vw] bg-white/70 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-3"
                    >
                      <div className="mb-2">
                        <label className="block text-xs text-gray-600 mb-1">Cerca o aggiungi tag (max 10)</label>
                        <div className="relative flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => { setNewTag(e.target.value); setShowGymTagsList(false); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                              className="w-full pl-8 pr-7 py-1.5 border border-white/30 rounded-full text-xs bg-white/60 backdrop-blur-sm shadow-inner focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all duration-200"
                              placeholder="Es. forza, mobilità"
                              maxLength={20}
                              onFocus={() => setShowTagsDropdown(false)}
                            />
                            {newTag.trim() && tags.includes(newTag.trim()) && (
                              <p className="mt-1 text-xs text-green-600">Questo tag è già stato aggiunto</p>
                            )}
                            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            {newTag && (
                              <button
                                type="button"
                                aria-label="Pulisci"
                                onClick={() => setNewTag('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          <div className="relative" ref={gymTagsGroupRef}>
                            <button
                              type="button"
                              onClick={() => setShowGymTagsList(!showGymTagsList)}
                              className="flex items-center justify-between text-xs text-gray-700 bg-white/50 backdrop-blur-sm ring-1 ring-white/30 rounded-full px-2.5 py-1.5 shadow-sm hover:bg-white/60 hover:shadow-md hover:text-purple-700 transition-all duration-200"
                            >
                              {showGymTagsList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {showGymTagsList && (
                              <div className="absolute top-full right-0 z-50 mt-1 bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl ring-1 ring-white/20 w-44 max-h-40 overflow-auto transition-all duration-200">
                                {PREDEFINED_GYM_TAGS.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleToggleTag(t)}
                                    className={`w-full text-left px-3 py-1.5 rounded-full transition-all duration-150 text-xs ${tags.includes(t) ? 'bg-white/70 text-purple-700 hover:bg-white/80' : 'hover:bg-white/70 hover:text-purple-700'}`}
                                  >
                                    <span>{t}</span>
                                    {tags.includes(t) && <span className="ml-2 text-[11px] text-green-600">Già aggiunto</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddTag()}
                            className="text-xs bg-gradient-to-b from-purple-600 to-purple-700 text:white px-2.5 py-1.5 rounded-full shadow-md hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50"
                            disabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 10}
                            title="Aggiungi tag"
                            aria-label="Aggiungi tag"
                          >
                            +
                          </button>
                        </div>
                        {(() => {
                          const ALL_TAGS = Array.from(new Set([...PREDEFINED_GYM_TAGS, ...tags]));
                          const queryActive = newTag.trim().length > 0;
                          if (!queryActive) return null;
                          const filtered = ALL_TAGS.filter(t => t.toLowerCase().includes(newTag.toLowerCase())).slice(0, 10);
                          return (
                            <div className="mt-2 bg:white/60 backdrop-blur-sm border border-white/30 ring-1 ring-white/20 rounded-2xl h-[120px] overflow-auto transition-all duration-200">
                              {filtered.length > 0 ? (
                                filtered.map(t => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleToggleTag(t)}
                                    className={`w-full text-left px-3 py-1.5 text-xs rounded-full transition-all duration-150 ${tags.includes(t) ? 'bg-white/70 text-purple-700 flex justify-between hover:bg-white/80' : 'hover:bg-white/70 hover:text-purple-700'}`}
                                  >
                                    <span>{t}</span>
                                    {tags.includes(t) && <span className="ml-2 text-[11px] text-green-600">Già aggiunto</span>}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-xs text-gray-400">Nessun risultato</div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </Portal>
                )}
              </div>
              {/* Separatore Apple dopo Tag */}
              <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

              {/* Associa atleti */}
              <button
                ref={associateDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                onClick={(e) => toggleAssociateDropdown(e)}
                title="Associa"
                aria-label="Associa"
                className="relative bg-transparent rounded-md w-9 h-9 flex items-center justify-center cursor-pointer transition shrink-0"
                style={{ userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
              >
                <Users size={18} className="text-indigo-600" />
                <span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{associatedAthletesCount}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sezione giorni verrà posizionata dentro il contenitore, sopra "Esercizi" */}

      <div
        className={`relative mx-auto w-full rounded-2xl px-4 sm:px-6 lg:px-8 pt-0 pb-6 min-h-[calc(100vh-300px)] ${variants.length > 0 ? '' : '-mt-px'} bg-gray-100`}
      >

        
        {/* Header Row: su telefono la toolbar va sotto il tasto Indietro (non modificare PWA) */}
        <div className={`flex flex-col ${isStandaloneMobile ? 'items-start gap-2 mb-0' : 'items-center gap-2 mb-4 sm:mb-6'}`}>
          <div className="min-w-0 flex justify-center items-center hidden">
            {canEdit && !isStandaloneMobile && (
              <div ref={toolbarRef} className="relative w-full flex justify-center max-w-full">
                <div className="flex flex-nowrap whitespace-nowrap justify-center items-center gap-1 p-2 bg-white/70 backdrop-blur-sm ring-1 ring-black/10 rounded-2xl shadow-sm">
                  {/* Varianti dropdown */}
                  <div className="relative">
                <button
                  ref={variantsDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                  onClick={(e) => toggleVariantsDropdown(e)}
                  title="Varianti"
                  aria-label="Varianti"
                  className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(28px, 6vw, 32px)', height: 'clamp(28px, 6vw, 32px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                >
                      {activeVariantId === 'original' ? (
                        <>
                          <FileText size={18} className="text-blue-600" />
                          <Star size={10} className="absolute -top-0.5 -right-0.5 text-blue-600" />
                        </>
                      ) : (
                        <>
                          <FileText size={18} className="text-red-600" />
                          {(() => { const idx = displayVariants.findIndex(v => v.id === activeVariantId); return idx >= 0 ? (<span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-red-600">{idx + 1}</span>) : null; })()}
                        </>
                      )}
                    </button>
                    {isVariantsDropdownOpen && (
                      <Portal>
                        <div
                          ref={variantsDropdownRef as React.RefObject<HTMLDivElement>}
                          style={{ position: 'fixed', top: variantsDropdownPosition?.top ?? 0, left: variantsDropdownPosition?.left ?? 0 }}
                          className="z-50 w-64 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                        >
                      <div className="mb-1 px-2 text-xs text-gray-500">Seleziona scheda</div>
                      <div className="space-y-1">
                        {/* Originale */}
                        {(!isAthlete || canSeeOriginal) && (
                        <button
                          onClick={() => { handleSwitchVariant('original'); closeVariantsDropdown(); }}
                          onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetVariantMenuPosition(e.currentTarget as HTMLElement); setOpenVariantMenuId('original'); }}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            if (!canEdit) return;
                            variantLongPressTriggeredRef.current = false;
                            variantPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                            const anchor = e.currentTarget as HTMLElement;
                            if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current);
                            variantLongPressTimeoutRef.current = window.setTimeout(() => {
                              variantLongPressTriggeredRef.current = true;
                              computeAndSetVariantMenuPosition(anchor);
                              setOpenVariantMenuId('original');
                            }, VARIANT_LONG_PRESS_MS);
                          }}
                          onPointerUp={() => { if (!canEdit) return; if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }}
                          onPointerMove={(e) => {
                            if (!canEdit) return;
                            const startPos = variantPressStartPosRef.current; if (!startPos) return;
                            const dx = Math.abs(e.clientX - startPos.x); const dy = Math.abs(e.clientY - startPos.y);
                            if (dx > 6 || dy > 6) { if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }
                          }}
                          className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeVariantId === 'original' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                          title={`Scheda: ${workoutTitle}`}
                        >
                          <FileText size={16} className={activeVariantId === 'original' ? 'text-blue-700' : 'text-gray-600'} />
                          <span>{workoutTitle}</span>
                        </button>
                        )}
                        {/* Varianti */}
                        {displayVariants.map((variant, index) => (
                          <button
                            key={variant.id}
                            onClick={() => { handleSwitchVariant(variant.id); closeVariantsDropdown(); }}
                            onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetVariantMenuPosition(e.currentTarget as HTMLElement); setOpenVariantMenuId(variant.id); }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              if (!canEdit) return;
                              variantLongPressTriggeredRef.current = false;
                              variantPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                              const anchor = e.currentTarget as HTMLElement;
                              if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current);
                              variantLongPressTimeoutRef.current = window.setTimeout(() => {
                                variantLongPressTriggeredRef.current = true;
                                computeAndSetVariantMenuPosition(anchor);
                                setOpenVariantMenuId(variant.id);
                              }, VARIANT_LONG_PRESS_MS);
                            }}
                            onPointerUp={() => { if (!canEdit) return; if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }}
                            onPointerMove={(e) => {
                              if (!canEdit) return;
                              const startPos = variantPressStartPosRef.current; if (!startPos) return;
                              const dx = Math.abs(e.clientX - startPos.x); const dy = Math.abs(e.clientY - startPos.y);
                              if (dx > 6 || dy > 6) { if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeVariantId === variant.id ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                            title={`Variante ${index + 1}: ${variant.name || 'Senza titolo'}`}
                          >
                            <FileText size={16} className={activeVariantId === variant.id ? 'text-red-700' : 'text-red-600'} />
                            <span>Variante {index + 1}{variant.name ? ` — ${variant.name}` : ''}</span>
                          </button>
                        ))}
                      </div>
                      {canEdit && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => { handleAddVariant(); }}
                            className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                            title="Crea nuova variante"
                          >
                            <Plus size={16} className="text-red-600" />
                            <span>Nuova variante</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Portal>
                )}
              </div>
              {/* Separatore Apple dopo Varianti */}
              <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

              {/* Settimane dropdown */}
              <div className="relative">
                <button
                  ref={weeksDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                  onClick={(e) => toggleWeeksDropdown(e)}
                  title="Settimane"
                  aria-label="Settimane"
                  className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(28px, 6vw, 32px)', height: 'clamp(28px, 6vw, 32px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                >
                  <Calendar size={18} className="text-cyan-600" />
                  <span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{parseInt(activeWeekKey.replace('W',''), 10)}</span>
                </button>
                {isWeeksDropdownOpen && (
                  <Portal>
                    <div
                      ref={weeksDropdownRef as React.RefObject<HTMLDivElement>}
                      style={{ position: 'fixed', top: weeksDropdownPosition?.top ?? 0, left: weeksDropdownPosition?.left ?? 0 }}
                      className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                    >
                      <div className="mb-1 px-2 text-xs text-gray-500">Seleziona settimana</div>
                      <div className="space-y-1">
                        {weeks.slice().sort((a, b) => {
                          const na = parseInt(a.replace(/^W/, ''), 10);
                          const nb = parseInt(b.replace(/^W/, ''), 10);
                          return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                        }).map((wk) => (
                          <button
                            key={wk}
                            onClick={() => { if (weekLongPressTriggeredRef.current) return; handleSwitchWeek(wk); closeWeeksDropdown(); }}
                            onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetWeekMenuPosition(e.currentTarget as HTMLElement); setOpenWeekKeyMenu(wk); }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              if (!canEdit) return;
                              weekLongPressTriggeredRef.current = false;
                              weekPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                              const anchor = e.currentTarget as HTMLElement;
                              if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current);
                              weekLongPressTimeoutRef.current = window.setTimeout(() => {
                                weekLongPressTriggeredRef.current = true;
                                computeAndSetWeekMenuPosition(anchor);
                                setOpenWeekKeyMenu(wk);
                              }, VARIANT_LONG_PRESS_MS);
                            }}
                            onPointerUp={() => { if (!canEdit) return; if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current); weekLongPressTriggeredRef.current = false; }}
                            onPointerMove={(e) => {
                              if (!canEdit) return;
                              const start = weekPressStartPosRef.current; if (!start) return;
                              const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y);
                              if (dx > 6 || dy > 6) { if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current); weekLongPressTriggeredRef.current = false; }
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeWeekKey === wk ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                            title={`Settimana ${parseInt(wk.replace('W',''), 10)}`}
                          >
                            <Calendar size={16} className={activeWeekKey === wk ? 'text-cyan-700' : 'text-gray-600'} />
                            <span>Settimana {parseInt(wk.replace('W',''), 10)}</span>
                          </button>
                        ))}
                      </div>
                      {canEdit && weeks.length < 12 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => { handleAddWeek(); }}
                            className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                            title="Aggiungi settimana"
                          >
                            <Plus size={16} className="text-cyan-600" />
                            <span>Aggiungi settimana</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Portal>
                )}
              </div>
              {/* Separatore Apple dopo Settimane */}
              <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

              {/* Giorni dropdown */}
              <div className="relative">
                <button
                  ref={daysDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                  onClick={(e) => toggleDaysDropdown(e)}
                  title="Allenamenti"
                  aria-label="Allenamenti"
                  className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(28px, 6vw, 32px)', height: 'clamp(28px, 6vw, 32px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                >
                  <Dumbbell size={18} className="text-orange-500" />
                  {(() => { const n = parseInt(String(activeDayKey).replace(/^G/, ''), 10); return isNaN(n) ? null : (<span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{n}</span>); })()}
                </button>
                {isDaysDropdownOpen && (
                  <Portal>
                    <div
                      ref={daysDropdownRef as React.RefObject<HTMLDivElement>}
                      style={{ position: 'fixed', top: daysDropdownPosition?.top ?? 0, left: daysDropdownPosition?.left ?? 0 }}
                      className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                    >
                      <div className="mb-1 px-2 text-xs text-gray-500">Seleziona allenamento</div>
                      <div className="space-y-1">
                        {(() => {
                          const keys = activeVariantId === 'original' ? Object.keys(originalDays) : Object.keys(variantDaysById[activeVariantId] || {});
                          const sorted = (keys.length ? keys : ['G1']).slice().sort((a, b) => {
                            const na = parseInt(String(a).replace(/^G/, ''), 10);
                            const nb = parseInt(String(b).replace(/^G/, ''), 10);
                            return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                          });
                          return sorted.map((dk) => {
                            const label = getDayDisplayName(dk);
                              return (
                                <button
                                  key={dk}
                                  onClick={() => { if (dayLongPressTriggeredRef.current) return; handleSwitchDay(dk); closeDaysDropdown(); }}
                                  onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetDayMenuPosition(e.currentTarget as HTMLElement); setOpenDayKeyMenu(dk); }}
                                  onPointerDown={(e) => {
                                    e.preventDefault();
                                    if (!canEdit) return;
                                    dayLongPressTriggeredRef.current = false;
                                    dayPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                                    const anchor = e.currentTarget as HTMLElement;
                                    if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current);
                                    dayLongPressTimeoutRef.current = window.setTimeout(() => {
                                      dayLongPressTriggeredRef.current = true;
                                      computeAndSetDayMenuPosition(anchor);
                                      setOpenDayKeyMenu(dk);
                                    }, VARIANT_LONG_PRESS_MS);
                                  }}
                                  onPointerUp={() => { if (!canEdit) return; if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current); dayLongPressTriggeredRef.current = false; }}
                                  onPointerMove={(e) => {
                                    if (!canEdit) return;
                                    const start = dayPressStartPosRef.current; if (!start) return;
                                    const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y);
                                    if (dx > 6 || dy > 6) { if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current); dayLongPressTriggeredRef.current = false; }
                                  }}
                                  className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeDayKey === dk ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                                  title={label}
                                >
                                  <Dumbbell size={16} className={activeDayKey === dk ? 'text-orange-700' : 'text-orange-500'} />
                                  <span>{label}</span>
                                </button>
                              );
                          });
                        })()}
                      </div>
                      {canEdit && (() => {
                        const keys = activeVariantId === 'original' ? Object.keys(originalDays) : Object.keys(variantDaysById[activeVariantId] || {});
                        const count = keys.length > 0 ? keys.length : 1;
                        return count < 10;
                      })() && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => { handleAddDay(); }}
                            className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                            title="Aggiungi allenamento"
                          >
                            <Plus size={16} className="text-orange-600" />
                            <span>Aggiungi allenamento</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </Portal>
                )}
              </div>
              {/* Separatore Apple dopo Allenamenti */}
              <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

              {/* Menù azioni Varianti/Settimane/Giornate via Portal */}
              {canEdit && openVariantMenuId && variantMenuPosition && (
                <Portal>
                  <div
                    ref={variantMenuRef as React.RefObject<HTMLDivElement>}
                    style={{ position: 'fixed', top: variantMenuPosition.top!, left: variantMenuPosition.left!, transform: 'translateX(-50%)' }}
                    className="z-[9999] bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-44 relative"
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <div className="px-2 pb-2 text-xs text-gray-500">Azioni variante</div>
                    {openVariantMenuId === 'original' ? (
                      <>
                        <button
                          onClick={() => { handleCloneFromOriginal(); closeVariantMenu(); }}
                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                          title="Clona in nuova variante"
                        >
                          <Copy size={16} className="text-gray-700" />
                          <span>Clona come nuova</span>
                        </button>
                        <button
                          onClick={() => { handleCopyVariant('original'); closeVariantMenu(); }}
                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                          title="Copia variante"
                        >
                          <Copy size={16} className="text-gray-700" />
                          <span>Copia variante</span>
                        </button>
                        <button
                          onClick={() => { handlePasteVariant('original'); closeVariantMenu(); }}
                          disabled={!variantClipboard || variantClipboard.sourceVariantId === 'original'}
                          className={`w-full text-left px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${(!variantClipboard || variantClipboard.sourceVariantId === 'original') ? 'opacity-50 cursor-not-allowed bg-white text-gray-400' : 'hover:bg-gray-50 text-gray-800'}`}
                          title="Incolla variante"
                        >
                          <Save size={16} className="text-gray-700" />
                          <span>Incolla variante</span>
                        </button>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => { handleClearOriginal(); closeVariantMenu(); }}
                            className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2"
                            title="Svuota originale"
                          >
                            <Eraser size={16} className="text-red-600" />
                            <span>Svuota originale</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => { handleCopyVariant(openVariantMenuId!); closeVariantMenu(); }}
                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                          title="Copia variante"
                        >
                          <Copy size={16} className="text-gray-700" />
                          <span>Copia variante</span>
                        </button>
                        <button
                          onClick={() => { handlePasteVariant(openVariantMenuId!); closeVariantMenu(); }}
                          disabled={!variantClipboard || variantClipboard.sourceVariantId === openVariantMenuId}
                          className={`w-full text-left px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${(!variantClipboard || variantClipboard.sourceVariantId === openVariantMenuId) ? 'opacity-50 cursor-not-allowed bg-white text-gray-400' : 'hover:bg-gray-50 text-gray-800'}`}
                          title="Incolla variante"
                        >
                          <Save size={16} className="text-gray-700" />
                          <span>Incolla variante</span>
                        </button>
                        <button
                          onClick={() => { handleCloneVariant(openVariantMenuId!); closeVariantMenu(); }}
                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                          title="Clona variante"
                        >
                          <Copy size={16} className="text-gray-700" />
                          <span>Clona variante</span>
                        </button>
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <button
                            onClick={() => { handleRemoveVariant(openVariantMenuId!); closeVariantMenu(); }}
                            className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2"
                            title="Rimuovi variante"
                          >
                            <Trash2 size={16} className="text-red-600" />
                            <span>Rimuovi variante</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </Portal>
              )}

              {canEdit && openWeekKeyMenu && weekMenuPosition && (
                <Portal>
                  <div
                    ref={weekMenuRef as React.RefObject<HTMLDivElement>}
                    style={{ position: 'fixed', top: weekMenuPosition.top!, left: weekMenuPosition.left!, transform: 'translateX(-50%)' }}
                    className="z-[9999] bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-44 relative"
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <div className="px-2 pb-2 text-xs text-gray-500">Azioni settimana</div>
                    <button
                      onClick={() => { handleCopyWeek(openWeekKeyMenu!); closeWeekMenu(); }}
                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                      title="Copia settimana"
                    >
                      <Copy size={16} className="text-gray-700" />
                      <span>Copia settimana</span>
                    </button>
                    <button
                      onClick={() => { handlePasteWeek(openWeekKeyMenu!); closeWeekMenu(); }}
                      disabled={!weekClipboard || (weekClipboard.sourceVariantId === activeVariantId && weekClipboard.sourceWeekKey === openWeekKeyMenu)}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${(!weekClipboard || (weekClipboard.sourceVariantId === activeVariantId && weekClipboard.sourceWeekKey === openWeekKeyMenu)) ? 'opacity-50 cursor-not-allowed bg-white text-gray-400' : 'hover:bg-gray-50 text-gray-800'}`}
                      title="Incolla settimana"
                    >
                      <Save size={16} className="text-gray-700" />
                      <span>Incolla settimana</span>
                    </button>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => { handleClearWeek(openWeekKeyMenu!); closeWeekMenu(); }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                        title="Svuota settimana"
                      >
                        <Eraser size={16} className="text-gray-700" />
                        <span>Svuota settimana</span>
                      </button>
                      <button
                        onClick={() => { handleRemoveWeek(openWeekKeyMenu!); closeWeekMenu(); }}
                        className="mt-1 w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2"
                        title="Rimuovi settimana"
                      >
                        <Trash2 size={16} className="text-red-600" />
                        <span>Rimuovi settimana</span>
                      </button>
                    </div>
                  </div>
                </Portal>
              )}

              {canEdit && openDayKeyMenu && dayMenuPosition && (
                <Portal>
                  <div
                    ref={dayMenuRef as React.RefObject<HTMLDivElement>}
                    style={{ position: 'fixed', top: dayMenuPosition.top!, left: dayMenuPosition.left!, transform: 'translateX(-50%)' }}
                    className="z-[9999] bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-44 relative"
                    onClick={(e) => e.stopPropagation()}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                  >
                    <div className="px-2 pb-2 text-xs text-gray-500">Azioni giornata</div>
                    <button
                      onClick={() => { handleStartRenameDay(openDayKeyMenu!); closeDayMenu(); }}
                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                      title="Rinomina giornata"
                    >
                      <Edit3 size={16} className="text-gray-700" />
                      <span>Rinomina giornata</span>
                    </button>
                    <button
                      onClick={() => { handleCopyDay(openDayKeyMenu!); closeDayMenu(); }}
                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                      title="Copia giornata"
                    >
                      <Copy size={16} className="text-gray-700" />
                      <span>Copia giornata</span>
                    </button>
                    <button
                      onClick={() => { handlePasteDay(openDayKeyMenu!); }}
                      disabled={!dayClipboard || (dayClipboard.sourceVariantId === activeVariantId && dayClipboard.sourceWeekKey === activeWeekKey && dayClipboard.sourceDayKey === openDayKeyMenu)}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${(!dayClipboard || (dayClipboard.sourceVariantId === activeVariantId && dayClipboard.sourceWeekKey === activeWeekKey && dayClipboard.sourceDayKey === openDayKeyMenu)) ? 'opacity-50 cursor-not-allowed bg-white text-gray-400' : 'hover:bg-gray-50 text-gray-800'}`}
                      title="Incolla giornata"
                    >
                      <Save size={16} className="text-gray-700" />
                      <span>Incolla giornata</span>
                    </button>
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => { handleClearDay(openDayKeyMenu!); closeDayMenu(); }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                        title="Svuota giornata"
                      >
                        <Eraser size={16} className="text-gray-700" />
                        <span>Svuota giornata</span>
                      </button>
                      <button
                        onClick={() => { handleRemoveDay(openDayKeyMenu!); closeDayMenu(); }}
                        className="mt-1 w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2"
                        title="Rimuovi giornata"
                      >
                        <Trash2 size={16} className="text-red-600" />
                        <span>Rimuovi giornata</span>
                      </button>
                    </div>
                  </div>
                </Portal>
              )}

              {/* Create Exercise */}
              <button
                onClick={() => {
                  if (showExerciseForm) {
                    setShowExerciseForm(false);
                    setEditingExerciseId(null);
                    setEditingExercise(null);
                      setCurrentExercise({
                        id: '',
                        name: '',
                        notes: '',
                        sets: '',
                        intensity: '',
                        tut: '',
                        recovery: '',
                        videoLink: ''
                      });
                      setCurrentSets('');
                      setCurrentReps('');
                      setEditingSets('');
                      setEditingReps('');
                    } else {
                      setShowExerciseForm(true);
                    }
                }}
                title="Crea"
                aria-label="Crea"
                className="bg-white rounded-md flex items-center justify-center cursor-pointer transition hover:bg-gray-50 shrink-0"
                style={{ width: 'clamp(32px, 7vw, 36px)', height: 'clamp(32px, 7vw, 36px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
              >
                  <Plus size={18} className="text-green-600" />
              </button>
              {/* Separatore Apple dopo Crea */}
              <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

            {/* Duration Selector rimosso: la durata è sincronizzata con le settimane */}

              {/* Tags button */}
              <div className="relative">
                <button
                  ref={tagsTriggerRef as React.RefObject<HTMLButtonElement>}
                  onClick={(e) => toggleTagsMenu(e)}
                  title="Tag"
                  aria-label="Tag"
                  className="bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(26px, 6vw, 30px)', height: 'clamp(26px, 6vw, 30px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                >
                  <Tag size={18} className="text-purple-600" />
                </button>
                {isTagsMenuOpen && (
                  <Portal>
                    <div
                      ref={tagsDropdownRef as React.RefObject<HTMLDivElement>}
                      style={{ position: 'fixed', top: tagsMenuPosition?.top ?? 0, left: tagsMenuPosition?.left ?? 0 }}
                      className="z-50 w-80 max-w-[85vw] bg-white/70 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-3"
                    >
                      <div className="mb-2">
                        <label className="block text-xs text-gray-600 mb-1">Cerca o aggiungi tag (max 10)</label>
                        <div className="relative flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={newTag}
                              onChange={(e) => { setNewTag(e.target.value); setShowGymTagsList(false); }}
                              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                              className="w-full pl-8 pr-7 py-1.5 border border-white/30 rounded-full text-xs bg-white/60 backdrop-blur-sm shadow-inner focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all duration-200"
                              placeholder="Es. forza, mobilità"
                              maxLength={20}
                              onFocus={() => setShowTagsDropdown(false)}
                            />
                            {newTag.trim() && tags.includes(newTag.trim()) && (
                              <p className="mt-1 text-xs text-green-600">Questo tag è già stato aggiunto</p>
                            )}
                            <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                            {newTag && (
                              <button
                                type="button"
                                aria-label="Pulisci"
                                onClick={() => setNewTag('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <X size={14} />
                              </button>
                            )}
                          </div>
                          <div className="relative" ref={gymTagsGroupRef}>
                            <button
                              type="button"
                              onClick={() => setShowGymTagsList(!showGymTagsList)}
                              className="flex items-center justify-between text-xs text-gray-700 bg-white/50 backdrop-blur-sm ring-1 ring-white/30 rounded-full px-2.5 py-1.5 shadow-sm hover:bg-white/60 hover:shadow-md hover:text-purple-700 transition-all duration-200"
                            >
                              {showGymTagsList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </button>
                            {showGymTagsList && (
                              <div className="absolute top-full right-0 z-50 mt-1 bg-white/60 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl ring-1 ring-white/20 w-44 max-h-40 overflow-auto transition-all duration-200">
                                {PREDEFINED_GYM_TAGS.map((t) => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleToggleTag(t)}
                                    className={`w-full text-left px-3 py-1.5 rounded-full transition-all duration-150 text-xs ${tags.includes(t) ? 'bg-white/70 text-purple-700 hover:bg-white/80' : 'hover:bg-white/70 hover:text-purple-700'}`}
                                  >
                                    <span>{t}</span>
                                    {tags.includes(t) && <span className="ml-2 text-[11px] text-green-600">Già aggiunto</span>}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleAddTag()}
                            className="text-xs bg-gradient-to-b from-purple-600 to-purple-700 text-white px-2.5 py-1.5 rounded-full shadow-md hover:from-purple-600 hover:to-purple-800 transition-all duration-200 disabled:opacity-50"
                            disabled={!newTag.trim() || tags.includes(newTag.trim()) || tags.length >= 10}
                            title="Aggiungi tag"
                            aria-label="Aggiungi tag"
                          >
                            +
                          </button>
                        </div>
                        {(() => {
                          const ALL_TAGS = Array.from(new Set([...PREDEFINED_GYM_TAGS, ...tags]));
                          const queryActive = newTag.trim().length > 0;
                          if (!queryActive) return null;
                          const filtered = ALL_TAGS.filter(t => t.toLowerCase().includes(newTag.toLowerCase())).slice(0, 10);
                          return (
                            <div className="mt-2 bg-white/60 backdrop-blur-sm border border-white/30 ring-1 ring-white/20 rounded-2xl h-[120px] overflow-auto transition-all duration-200">
                              {filtered.length > 0 ? (
                                filtered.map(t => (
                                  <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleToggleTag(t)}
                                    className={`w-full text-left px-3 py-1.5 text-xs rounded-full transition-all duration-150 ${tags.includes(t) ? 'bg-white/70 text-purple-700 flex justify-between hover:bg-white/80' : 'hover:bg-white/70 hover:text-purple-700'}`}
                                  >
                                    <span>{t}</span>
                                    {tags.includes(t) && <span className="ml-2 text-[11px] text-green-600">Già aggiunto</span>}
                                  </button>
                                ))
                              ) : (
                                <div className="px-3 py-2 text-xs text-gray-400">Nessun risultato</div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </Portal>
                )}
              </div>
              {/* Separatore Apple dopo Tag */}
              <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />
              {/* Clone Workout rimosso - stato rimosso */}
              {/* Associa atleti */}
              <button
                ref={associateDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                onClick={(e) => toggleAssociateDropdown(e)}
                title="Associa"
                aria-label="Associa"
                className="relative bg-transparent rounded-md w-9 h-9 flex items-center justify-center cursor-pointer transition shrink-0"
                style={{ userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
              >
                <Users size={18} className="text-indigo-600" />
                <span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{associatedAthletesCount}</span>
              </button>
            </div>
          </div>
          )}
        </div>
        <div className="hidden">
            {/* Placeholder invisibile per bilanciare la centratura */}
            <div className="p-2 opacity-0 pointer-events-none">
              <ChevronLeft size={20} />
            </div>
          </div>
        </div>

        {isStandaloneMobile && (
          <Portal containerId="pwa-workout-toolbar">
            <div className="w-full flex justify-center max-w-full">
              <div className="max-w-4xl w-full mx-auto">
                <div className="flex flex-nowrap whitespace-nowrap items-center gap-2 p-2.5 bg-white/70 backdrop-blur-sm ring-1 ring-black/10 rounded-[28px] shadow-sm">
                {/* Varianti trigger */}
                <div className="relative">
                  <button
                    ref={variantsDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                    onClick={(e) => toggleVariantsDropdown(e)}
                    title="Varianti"
                    aria-label="Varianti"
                    className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(34px, 7.5vw, 40px)', height: 'clamp(34px, 7.5vw, 40px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                  >
                    {activeVariantId === 'original' ? (
                      <>
                        <FileText size={16} className="text-blue-600" />
                        <Star size={10} className="absolute -top-0.5 -right-0.5 text-blue-600" />
                      </>
                    ) : (
                      <>
                        <FileText size={16} className="text-red-600" />
                        {(() => { const idx = variants.findIndex(v => v.id === activeVariantId); return idx >= 0 ? (<span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-red-600">{idx + 1}</span>) : null; })()}
                      </>
                    )}
                  </button>
                </div>

                <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

                {/* Settimane trigger */}
                <div className="relative">
                  <button
                    ref={weeksDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                    onClick={(e) => toggleWeeksDropdown(e)}
                    title="Settimane"
                    aria-label="Settimane"
                    className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(34px, 7.5vw, 40px)', height: 'clamp(34px, 7.5vw, 40px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                  >
                    <Calendar size={16} className="text-cyan-600" />
                    <span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{parseInt(activeWeekKey.replace('W',''), 10)}</span>
                  </button>
                </div>

                <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

                {/* Giorni trigger */}
                <div className="relative">
                  <button
                    ref={daysDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                    onClick={(e) => toggleDaysDropdown(e)}
                    title="Allenamenti"
                    aria-label="Allenamenti"
                    className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(34px, 7.5vw, 40px)', height: 'clamp(34px, 7.5vw, 40px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                  >
                    <Dumbbell size={16} className="text-orange-500" />
                    {(() => { const n = parseInt(String(activeDayKey).replace(/^G/, ''), 10); return isNaN(n) ? null : (<span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{n}</span>); })()}
                  </button>
                </div>

                <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

                {/* Crea esercizio */}
                <button
                  onClick={() => {
                    if (showExerciseForm) {
                      setShowExerciseForm(false);
                      setEditingExerciseId(null);
                      setEditingExercise(null);
                      setCurrentExercise({
                        id: '',
                        name: '',
                        notes: '',
                        sets: '',
                        intensity: '',
                        tut: '',
                        recovery: '',
                        videoLink: ''
                      });
                      setCurrentSets('');
                      setCurrentReps('');
                      setEditingSets('');
                      setEditingReps('');
                    } else {
                      setShowExerciseForm(true);
                    }
                  }}
                  title="Crea"
                  aria-label="Crea"
                  className="bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(34px, 7.5vw, 40px)', height: 'clamp(34px, 7.5vw, 40px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                >
                  <Plus size={16} className="text-green-600" />
                </button>

                <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />

                {/* Tag trigger */}
                <div className="relative">
                  <button
                    ref={tagsTriggerRef as React.RefObject<HTMLButtonElement>}
                    onClick={(e) => toggleTagsMenu(e)}
                    title="Tag"
                    aria-label="Tag"
                    className="bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(34px, 7.5vw, 40px)', height: 'clamp(34px, 7.5vw, 40px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                  >
                    <Tag size={16} className="text-purple-600" />
                  </button>
                </div>

                {/* Separatore Apple */}
                <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />
                {/* Stato scheda rimosso */}

                {/* Associa atleti */}
                <button
                  ref={associateDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                  onClick={(e) => toggleAssociateDropdown(e)}
                  title="Associa"
                  aria-label="Associa"
                  className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                  style={{ width: 'clamp(34px, 7.5vw, 40px)', height: 'clamp(34px, 7.5vw, 40px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                >
                  <Users size={16} className="text-indigo-600" />
                  <span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{associatedAthletesCount}</span>
                </button>
              </div>
            </div>
            {/* Dropdown PWA: Varianti */}
            {isVariantsDropdownOpen && (
              <Portal>
                <div
                  ref={variantsDropdownRef as React.RefObject<HTMLDivElement>}
                  style={{ position: 'fixed', top: variantsDropdownPosition?.top ?? 0, left: variantsDropdownPosition?.left ?? 0 }}
                  className="z-50 w-64 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                >
                  <div className="mb-1 px-2 text-xs text-gray-500">Seleziona scheda</div>
                  <div className="space-y-1">
                    {/* Originale */}
                    {(!isAthlete || canSeeOriginal) && (
                    <button
                      onClick={() => { handleSwitchVariant('original'); closeVariantsDropdown(); }}
                      onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetVariantMenuPosition(e.currentTarget as HTMLElement); setOpenVariantMenuId('original'); }}
                      onPointerDown={(e) => {
                        e.preventDefault();
                        if (!canEdit) return;
                        variantLongPressTriggeredRef.current = false;
                        variantPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                        const anchor = e.currentTarget as HTMLElement;
                        if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current);
                        variantLongPressTimeoutRef.current = window.setTimeout(() => {
                          variantLongPressTriggeredRef.current = true;
                          computeAndSetVariantMenuPosition(anchor);
                          setOpenVariantMenuId('original');
                        }, VARIANT_LONG_PRESS_MS);
                      }}
                      onPointerUp={() => { if (!canEdit) return; if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }}
                      onPointerMove={(e) => {
                        if (!canEdit) return;
                        const startPos = variantPressStartPosRef.current; if (!startPos) return;
                        const dx = Math.abs(e.clientX - startPos.x); const dy = Math.abs(e.clientY - startPos.y);
                        if (dx > 6 || dy > 6) { if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }
                      }}
                      className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeVariantId === 'original' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                      title={`Scheda: ${workoutTitle}`}
                      style={{ WebkitUserSelect: 'none' as any, userSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                    >
                      <FileText size={16} className={activeVariantId === 'original' ? 'text-blue-700' : 'text-gray-600'} />
                      <span>{workoutTitle}</span>
                    </button>
                    )}
                    {/* Varianti */}
                    {displayVariants.map((variant, index) => (
                      <button
                        key={variant.id}
                        onClick={() => { handleSwitchVariant(variant.id); closeVariantsDropdown(); }}
                        onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetVariantMenuPosition(e.currentTarget as HTMLElement); setOpenVariantMenuId(variant.id); }}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          if (!canEdit) return;
                          variantLongPressTriggeredRef.current = false;
                          variantPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                          const anchor = e.currentTarget as HTMLElement;
                          if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current);
                          variantLongPressTimeoutRef.current = window.setTimeout(() => {
                            variantLongPressTriggeredRef.current = true;
                            computeAndSetVariantMenuPosition(anchor);
                            setOpenVariantMenuId(variant.id);
                          }, VARIANT_LONG_PRESS_MS);
                        }}
                        onPointerUp={() => { if (!canEdit) return; if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }}
                        onPointerMove={(e) => {
                          if (!canEdit) return;
                          const startPos = variantPressStartPosRef.current; if (!startPos) return;
                          const dx = Math.abs(e.clientX - startPos.x); const dy = Math.abs(e.clientY - startPos.y);
                          if (dx > 6 || dy > 6) { if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeVariantId === variant.id ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                        title={`Variante ${index + 1}: ${variant.name || 'Senza titolo'}`}
                        style={{ WebkitUserSelect: 'none' as any, userSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                      >
                        <FileText size={16} className={activeVariantId === variant.id ? 'text-red-700' : 'text-red-600'} />
                        <span>Variante {index + 1}{variant.name ? ` — ${variant.name}` : ''}</span>
                      </button>
                    ))}
                  </div>
                  {canEdit && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => { handleAddVariant(); }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                        title="Crea nuova variante"
                      >
                        <Plus size={16} className="text-red-600" />
                        <span>Nuova variante</span>
                      </button>
                    </div>
                  )}
                </div>
              </Portal>
            )}

            {/* Dropdown PWA: Settimane */}
            {isWeeksDropdownOpen && (
              <Portal>
                <div
                  ref={weeksDropdownRef as React.RefObject<HTMLDivElement>}
                  style={{ position: 'fixed', top: weeksDropdownPosition?.top ?? 0, left: weeksDropdownPosition?.left ?? 0 }}
                  className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                >
                  <div className="mb-1 px-2 text-xs text-gray-500">Seleziona settimana</div>
                  <div className="space-y-1">
                    {weeks.slice().sort((a, b) => {
                      const na = parseInt(a.replace(/^W/, ''), 10);
                      const nb = parseInt(b.replace(/^W/, ''), 10);
                      return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                    }).map((wk) => (
                      <button
                        key={wk}
                        onClick={() => { if (weekLongPressTriggeredRef.current) return; handleSwitchWeek(wk); closeWeeksDropdown(); }}
                        onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetWeekMenuPosition(e.currentTarget as HTMLElement); setOpenWeekKeyMenu(wk); }}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          if (!canEdit) return;
                          weekLongPressTriggeredRef.current = false;
                          weekPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                          const anchor = e.currentTarget as HTMLElement;
                          if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current);
                          weekLongPressTimeoutRef.current = window.setTimeout(() => {
                            weekLongPressTriggeredRef.current = true;
                            computeAndSetWeekMenuPosition(anchor);
                            setOpenWeekKeyMenu(wk);
                          }, VARIANT_LONG_PRESS_MS);
                        }}
                        onPointerUp={() => { if (!canEdit) return; if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current); weekLongPressTriggeredRef.current = false; }}
                        onPointerMove={(e) => {
                          if (!canEdit) return;
                          const start = weekPressStartPosRef.current; if (!start) return;
                          const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y);
                          if (dx > 6 || dy > 6) { if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current); weekLongPressTriggeredRef.current = false; }
                        }}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeWeekKey === wk ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                        title={`Settimana ${parseInt(wk.replace('W',''), 10)}`}
                        style={{ WebkitUserSelect: 'none' as any, userSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                      >
                        <Calendar size={16} className={activeWeekKey === wk ? 'text-cyan-700' : 'text-gray-600'} />
                        <span>Settimana {parseInt(wk.replace('W',''), 10)}</span>
                      </button>
                    ))}
                  </div>
                  {canEdit && weeks.length < 12 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => { handleAddWeek(); }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                        title="Aggiungi settimana"
                      >
                        <Plus size={16} className="text-cyan-600" />
                        <span>Aggiungi settimana</span>
                      </button>
                    </div>
                  )}
                </div>
              </Portal>
            )}

            {/* Dropdown PWA: Giorni */}
            {isDaysDropdownOpen && (
              <Portal>
                <div
                  ref={daysDropdownRef as React.RefObject<HTMLDivElement>}
                  style={{ position: 'fixed', top: daysDropdownPosition?.top ?? 0, left: daysDropdownPosition?.left ?? 0 }}
                  className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                >
                  <div className="mb-1 px-2 text-xs text-gray-500">Seleziona allenamento</div>
                  <div className="space-y-1">
                    {(() => {
                      const keys = activeVariantId === 'original' ? Object.keys(originalDays) : Object.keys(variantDaysById[activeVariantId] || {});
                      const sorted = (keys.length ? keys : ['G1']).slice().sort((a, b) => {
                        const na = parseInt(String(a).replace(/^G/, ''), 10);
                        const nb = parseInt(String(b).replace(/^G/, ''), 10);
                        return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                      });
                      return sorted.map((dk) => {
                        const label = getDayDisplayName(dk);
                        return (
                          <button
                            key={dk}
                            onClick={() => { if (dayLongPressTriggeredRef.current) return; handleSwitchDay(dk); closeDaysDropdown(); }}
                            onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetDayMenuPosition(e.currentTarget as HTMLElement); setOpenDayKeyMenu(dk); }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              if (!canEdit) return;
                              dayLongPressTriggeredRef.current = false;
                              dayPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                              const anchor = e.currentTarget as HTMLElement;
                              if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current);
                              dayLongPressTimeoutRef.current = window.setTimeout(() => {
                                dayLongPressTriggeredRef.current = true;
                                computeAndSetDayMenuPosition(anchor);
                                setOpenDayKeyMenu(dk);
                              }, VARIANT_LONG_PRESS_MS);
                            }}
                            onPointerUp={() => { if (!canEdit) return; if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current); dayLongPressTriggeredRef.current = false; }}
                            onPointerMove={(e) => {
                              if (!canEdit) return;
                              const start = dayPressStartPosRef.current; if (!start) return;
                              const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y);
                              if (dx > 6 || dy > 6) { if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current); dayLongPressTriggeredRef.current = false; }
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeDayKey === dk ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                            title={label}
                            style={{ WebkitUserSelect: 'none' as any, userSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                          >
                            <Dumbbell size={16} className={activeDayKey === dk ? 'text-orange-700' : 'text-orange-500'} />
                            <span>{label}</span>
                          </button>
                        );
                      });
                    })()}
                  </div>
                  {canEdit && (() => {
                    const keys = activeVariantId === 'original' ? Object.keys(originalDays) : Object.keys(variantDaysById[activeVariantId] || {});
                    const count = keys.length > 0 ? keys.length : 1;
                    return count < 10;
                  })() && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <button
                        onClick={() => { handleAddDay(); }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                        title="Aggiungi allenamento"
                      >
                        <Plus size={16} className="text-orange-600" />
                        <span>Aggiungi allenamento</span>
                      </button>
                    </div>
                  )}
                </div>
              </Portal>
            )}

            {/* Menù azioni Varianti/Settimane/Giornate in PWA */}
            {canEdit && openVariantMenuId && variantMenuPosition && (
              <Portal>
                <div
                  ref={variantMenuRef as React.RefObject<HTMLDivElement>}
                  style={{ position: 'fixed', top: variantMenuPosition.top!, left: variantMenuPosition.left!, transform: 'translateX(-50%)' }}
                  className="z-[9999] bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-44 relative"
                  onClick={(e) => e.stopPropagation()}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  <div className="px-2 pb-2 text-xs text-gray-500">Azioni variante</div>
                  {openVariantMenuId === 'original' ? (
                    <>
                      <button
                        onClick={() => { handleCloneFromOriginal(); closeVariantMenu(); }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                        title="Clona in nuova variante"
                      >
                        <Copy size={16} className="text-gray-700" />
                        <span>Clona come nuova</span>
                      </button>
                      <button
                        onClick={() => { handleCopyVariant('original'); closeVariantMenu(); }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                        title="Copia variante"
                      >
                        <Copy size={16} className="text-gray-700" />
                        <span>Copia variante</span>
                      </button>
                      <button
                        onClick={() => { handlePasteVariant('original'); closeVariantMenu(); }}
                        disabled={!variantClipboard || variantClipboard.sourceVariantId === 'original'}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${(!variantClipboard || variantClipboard.sourceVariantId === 'original') ? 'opacity-50 cursor-not-allowed bg-white text-gray-400' : 'hover:bg-gray-50 text-gray-800'}`}
                        title="Incolla variante"
                      >
                        <Save size={16} className="text-gray-700" />
                        <span>Incolla variante</span>
                      </button>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => { handleClearOriginal(); closeVariantMenu(); }}
                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2"
                          title="Svuota originale"
                        >
                          <Eraser size={16} className="text-red-600" />
                          <span>Svuota originale</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => { handleCopyVariant(openVariantMenuId!); closeVariantMenu(); }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                        title="Copia variante"
                      >
                        <Copy size={16} className="text-gray-700" />
                        <span>Copia variante</span>
                      </button>
                      <button
                        onClick={() => { handlePasteVariant(openVariantMenuId!); closeVariantMenu(); }}
                        disabled={!variantClipboard || variantClipboard.sourceVariantId === openVariantMenuId}
                        className={`w-full text-left px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${(!variantClipboard || variantClipboard.sourceVariantId === openVariantMenuId) ? 'opacity-50 cursor-not-allowed bg-white text-gray-400' : 'hover:bg-gray-50 text-gray-800'}`}
                        title="Incolla variante"
                      >
                        <Save size={16} className="text-gray-700" />
                        <span>Incolla variante</span>
                      </button>
                      <button
                        onClick={() => { handleCloneVariant(openVariantMenuId!); closeVariantMenu(); }}
                        className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                        title="Clona variante"
                      >
                        <Copy size={16} className="text-gray-700" />
                        <span>Clona variante</span>
                      </button>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <button
                          onClick={() => { handleRemoveVariant(openVariantMenuId!); closeVariantMenu(); }}
                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2"
                          title="Rimuovi variante"
                        >
                          <Trash2 size={16} className="text-red-600" />
                          <span>Rimuovi variante</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </Portal>
            )}

            {canEdit && openWeekKeyMenu && weekMenuPosition && (
              <Portal>
                <div
                  ref={weekMenuRef as React.RefObject<HTMLDivElement>}
                  style={{ position: 'fixed', top: weekMenuPosition.top!, left: weekMenuPosition.left!, transform: 'translateX(-50%)' }}
                  className="z-[9999] bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-44 relative"
                  onClick={(e) => e.stopPropagation()}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  <div className="px-2 pb-2 text-xs text-gray-500">Azioni settimana</div>
                  <button
                    onClick={() => { handleCopyWeek(openWeekKeyMenu!); closeWeekMenu(); }}
                    className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                    title="Copia settimana"
                  >
                    <Copy size={16} className="text-gray-700" />
                    <span>Copia settimana</span>
                  </button>
                  <button
                    onClick={() => { handlePasteWeek(openWeekKeyMenu!); closeWeekMenu(); }}
                    disabled={!weekClipboard || (weekClipboard.sourceVariantId === activeVariantId && weekClipboard.sourceWeekKey === openWeekKeyMenu)}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${(!weekClipboard || (weekClipboard.sourceVariantId === activeVariantId && weekClipboard.sourceWeekKey === openWeekKeyMenu)) ? 'opacity-50 cursor-not-allowed bg-white text-gray-400' : 'hover:bg-gray-50 text-gray-800'}`}
                    title="Incolla settimana"
                  >
                    <Save size={16} className="text-gray-700" />
                    <span>Incolla settimana</span>
                  </button>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => { handleClearWeek(openWeekKeyMenu!); closeWeekMenu(); }}
                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                      title="Svuota settimana"
                    >
                      <Eraser size={16} className="text-gray-700" />
                      <span>Svuota settimana</span>
                    </button>
                    <button
                      onClick={() => { handleRemoveWeek(openWeekKeyMenu!); closeWeekMenu(); }}
                      className="mt-1 w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2"
                      title="Rimuovi settimana"
                    >
                      <Trash2 size={16} className="text-red-600" />
                      <span>Rimuovi settimana</span>
                    </button>
                  </div>
                </div>
              </Portal>
            )}

            {canEdit && openDayKeyMenu && dayMenuPosition && (
              <Portal>
                <div
                  ref={dayMenuRef as React.RefObject<HTMLDivElement>}
                  style={{ position: 'fixed', top: dayMenuPosition.top!, left: dayMenuPosition.left!, transform: 'translateX(-50%)' }}
                  className="z-[9999] bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-44 relative"
                  onClick={(e) => e.stopPropagation()}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  <div className="px-2 pb-2 text-xs text-gray-500">Azioni giornata</div>
                  <button
                    onClick={() => { handleStartRenameDay(openDayKeyMenu!); closeDayMenu(); }}
                    className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                    title="Rinomina giornata"
                  >
                    <Edit3 size={16} className="text-gray-700" />
                    <span>Rinomina giornata</span>
                  </button>
                  <button
                    onClick={() => { handleCopyDay(openDayKeyMenu!); closeDayMenu(); }}
                    className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                    title="Copia giornata"
                  >
                    <Copy size={16} className="text-gray-700" />
                    <span>Copia giornata</span>
                  </button>
                  <button
                    onClick={() => { handlePasteDay(openDayKeyMenu!); }}
                    disabled={!dayClipboard || (dayClipboard.sourceVariantId === activeVariantId && dayClipboard.sourceWeekKey === activeWeekKey && dayClipboard.sourceDayKey === openDayKeyMenu)}
                    className={`w-full text-left px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 ${(!dayClipboard || (dayClipboard.sourceVariantId === activeVariantId && dayClipboard.sourceWeekKey === activeWeekKey && dayClipboard.sourceDayKey === openDayKeyMenu)) ? 'opacity-50 cursor-not-allowed bg-white text-gray-400' : 'hover:bg-gray-50 text-gray-800'}`}
                    title="Incolla giornata"
                  >
                    <Save size={16} className="text-gray-700" />
                    <span>Incolla giornata</span>
                  </button>
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => { handleClearDay(openDayKeyMenu!); closeDayMenu(); }}
                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                      title="Svuota giornata"
                    >
                      <Eraser size={16} className="text-gray-700" />
                      <span>Svuota giornata</span>
                    </button>
                    <button
                      onClick={() => { handleRemoveDay(openDayKeyMenu!); closeDayMenu(); }}
                      className="mt-1 w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2"
                      title="Rimuovi giornata"
                    >
                      <Trash2 size={16} className="text-red-600" />
                      <span>Rimuovi giornata</span>
                    </button>
                  </div>
                </div>
              </Portal>
            )}
            </div>
          </Portal>
        )}
        {isAssociateDropdownOpen && (
          <Portal>
            <div
              ref={associateDropdownRef as React.RefObject<HTMLDivElement>}
              style={{ position: 'fixed', top: associateDropdownPosition?.top ?? 0, left: associateDropdownPosition?.left ?? 0 }}
              className="z-50 w-[min(320px,85vw)] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
            >
              {/* Sezione atleti spostata in alto: la lista schede verrà mostrata sotto */}
              {/* rimosso: pulsante "Dissocia tutte" */}
                <div className="mt-2 pt-2 border-t border-gray-200">
                 <div className="px-2">
                   <button
                     className="w-full flex items-center justify-between text-xs text-gray-700 bg-white/60 hover:bg-white/80 border border-white/30 ring-1 ring-white/20 rounded-lg px-3 py-1.5"
                     onClick={() => setIsAthleteListOpen(v => !v)}
                     title="Apri/chiudi lista atleti"
                     aria-label="Apri/chiudi lista atleti"
                   >
                     <span className="flex items-center gap-2">
                       <span>Seleziona atleta</span>
                     </span>
                     <span className="inline-block w-3 text-center">{isAthleteListOpen ? '▾' : '▸'}</span>
                   </button>
                 </div>
                 {isAthleteListOpen && (
                 <>
                 <div className="px-2 pb-2">
                   <div className="relative">
                     <input
                       type="text"
                       placeholder="Cerca atleta..."
                       className="w-full pl-8 pr-7 py-1.5 border border-white/30 rounded-full text-xs bg-white/60 backdrop-blur-sm shadow-inner focus:ring-2 focus:ring-blue-300 focus:border-blue-300 transition-all"
                       value={athleteSearchQuery}
                       onChange={(e) => setAthleteSearchQuery(e.target.value)}
                     />
                     <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                     {athleteSearchQuery && (
                       <button
                         type="button"
                         aria-label="Pulisci"
                         onClick={() => setAthleteSearchQuery('')}
                         className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                       >
                         <X size={14} />
                       </button>
                     )}
                   </div>
                 </div>
                <div className="max-h-32 overflow-y-auto rounded-lg border border-gray-200 ring-1 ring-black/10 bg-white/90">
                  {athletesLoading ? (
                    <div className="p-3 text-xs text-gray-500 text-center">Caricamento atleti...</div>
                  ) : filteredAthletes.length === 0 ? (
                    <div className="p-3 text-xs text-gray-500 text-center">Nessun atleta disponibile</div>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {filteredAthletes.map((athlete) => {
                        const plans = (localPlansOverrideByUserId[athlete.id] ?? (athlete.workoutPlans || [])) as string[];
                        const isAssociatedWorkout = (plans || []).some(pid => pid === workoutId || String(pid).startsWith(`${workoutId}|variant:`));
                        const isSelected = selectedAthleteId === athlete.id;
                        return (
                          <li key={athlete.id}>
                            <button
                              type="button"
                              onClick={() => {
                                if (selectedAthleteId === athlete.id) {
                                  setSelectedAthleteId(null);
                                  setSelectedAssociationVariantIds([]);
                                } else {
                                  setSelectedAthleteId(athlete.id);
                                  const plansForUser = (localPlansOverrideByUserId[athlete.id] ?? (athlete.workoutPlans || [])) as string[];
                                  const assignedTokens = (plansForUser || []).filter(pid => pid === workoutId || String(pid).startsWith(`${workoutId}|variant:`));
                                  const assignedIds = assignedTokens.map(pid => pid === workoutId ? 'original' : String(pid).split('|variant:')[1]).filter(Boolean);
                                  const uniqueAssignedIds = Array.from(new Set(assignedIds));
                                  setSelectedAssociationVariantIds(uniqueAssignedIds);
                                  setIsAssociationVariantListOpen(true);
                                }
                              }}
                              className={`w-full flex items-center justify-between px-3 py-1.5 text-left ${isSelected ? 'bg-blue-50 ring-1 ring-blue-200' : (isAssociatedWorkout ? 'bg-green-50' : 'hover:bg-gray-50')}`}
                              aria-pressed={isSelected}
                            >
                              <div className="flex-1">
                                <div className={`text-sm ${isAssociatedWorkout ? 'text-green-700' : 'text-gray-800'}`}>{athlete.name}</div>
                                <div className="text-[11px] text-gray-500">{athlete.email}</div>
                              </div>
                              {isSelected && (
                                <span className="ml-2 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200">Selezionato</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                </>
                )}
                {/* Bottone Associa sotto la lista atleti */}
                {/* rimosso: bottone Associa multiplo */}
                {/* Sezione schede spostata sotto */}
                <div className="mt-3 px-2">
                  <button
                    className="w-full flex items-center justify-between text-xs text-gray-700 bg-white/60 hover:bg-white/80 border border-white/30 ring-1 ring-white/20 rounded-lg px-3 py-1.5"
                    onClick={() => setIsAssociationVariantListOpen(v => !v)}
                    title="Apri/chiudi lista: Associa o dissocia scheda"
                    aria-label="Apri/chiudi lista: Associa o dissocia scheda"
                  >
                    <span className="flex items-center gap-2">
                      <span>Associa o dissocia scheda</span>
                    </span>
                    <span className="inline-block w-3 text-center">{isAssociationVariantListOpen ? '▾' : '▸'}</span>
                  </button>
                  {isAssociationVariantListOpen && (
                    <div className="mt-1 max-h-32 overflow-y-auto rounded-lg border border-gray-200 ring-1 ring-black/10 bg-white/90">
                      <ul className="divide-y divide-gray-100">
                        <li>
                           <button
                             type="button"
                             onClick={async () => {
                               if (!selectedAthleteId) {
                                 setSaveMessage('Seleziona prima un atleta');
                                 return;
                               }
                               if (selectedAssociationVariantIds.includes('original')) {
                                 await handleRemoveAthleteAssignment(selectedAthleteId, 'original');
                                 setSelectedAssociationVariantIds(prev => prev.filter(id => id !== 'original'));
                                 setSaveMessage('Scheda dissociata dall\'atleta selezionato');
                               } else {
                                 const nextIds = Array.from(new Set([...selectedAssociationVariantIds, 'original']));
                                 setSelectedAssociationVariantIds(nextIds);
                                 await handleAssociateSelected(selectedAthleteId, nextIds);
                                 setSaveMessage('Scheda associata all\'atleta selezionato');
                               }
                             }}
                             className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${selectedAssociationVariantIds.includes('original') ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50 text-gray-800'}`}
                             title={`Scheda: ${workoutTitle}`}
                             aria-pressed={selectedAssociationVariantIds.includes('original')}
                           >
                            <FileText size={16} className={selectedAssociationVariantIds.includes('original') ? 'text-green-700' : 'text-gray-600'} />
                            <span>{workoutTitle}</span>
                            {selectedAssociationVariantIds.includes('original') && (
                              <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 ring-1 ring-green-200">Selezionata</span>
                            )}
                          </button>
                        </li>
                        {variants.map((variant) => (
                          <li key={variant.id}>
                             <button
                               type="button"
                               onClick={async () => {
                                 if (!selectedAthleteId) {
                                   setSaveMessage('Seleziona prima un atleta');
                                   return;
                                 }
                                 if (selectedAssociationVariantIds.includes(variant.id)) {
                                   await handleRemoveAthleteAssignment(selectedAthleteId, variant.id);
                                   setSelectedAssociationVariantIds(prev => prev.filter(id => id !== variant.id));
                                   setSaveMessage('Variante dissociata dall\'atleta selezionato');
                                 } else {
                                   const nextIds = Array.from(new Set([...selectedAssociationVariantIds, variant.id]));
                                   setSelectedAssociationVariantIds(nextIds);
                                   await handleAssociateSelected(selectedAthleteId, nextIds);
                                   setSaveMessage('Variante associata all\'atleta selezionato');
                                 }
                               }}
                               className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${selectedAssociationVariantIds.includes(variant.id) ? 'bg-green-50 text-green-700' : 'hover:bg-gray-50 text-gray-800'}`}
                               title={`${variant.name || 'Senza titolo'}`}
                               aria-pressed={selectedAssociationVariantIds.includes(variant.id)}
                             >
                              <FileText size={16} className={selectedAssociationVariantIds.includes(variant.id) ? 'text-green-700' : 'text-red-600'} />
                              <span>{variant.name || 'Senza titolo'}</span>
                              {selectedAssociationVariantIds.includes(variant.id) && (
                                <span className="ml-auto text-[11px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 ring-1 ring-green-200">Selezionata</span>
                              )}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Portal>
        )}
        {/* Menu Tag in PWA */}
        {isStandaloneMobile && canEdit && isTagsMenuOpen && (
          <Portal>
            <div
              ref={tagsDropdownRef as React.RefObject<HTMLDivElement>}
              style={{ position: 'fixed', top: tagsMenuPosition?.top ?? 0, left: tagsMenuPosition?.left ?? 0 }}
              className="z-50 w-80 max-w-[85vw] bg-white/70 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-3"
            >
              <div className="mb-2">
                <label className="block text-xs text-gray-600 mb-1">Cerca o aggiungi tag (max 10)</label>
                <div className="relative flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => { setNewTag(e.target.value); setShowGymTagsList(false); }}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }}
                      className="w-full pl-8 pr-7 py-1.5 border border-white/30 rounded-full text-xs bg-white/60 backdrop-blur-sm shadow-inner focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all duration-200"
                      placeholder="Es. forza, mobilità"
                      maxLength={20}
                      onFocus={() => setShowTagsDropdown(false)}
                    />
                    {newTag.trim() && tags.includes(newTag.trim()) && (
                      <p className="mt-1 text-xs text-green-600">Questo tag è già stato aggiunto</p>
                    )}
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    {newTag && (
                      <button
                        type="button"
                        aria-label="Pulisci"
                        onClick={() => setNewTag('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleAddTag}
                    disabled={!newTag.trim() || tags.length >= 10}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${!newTag.trim() || tags.length >= 10 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'} transition`}
                  >
                    Aggiungi
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-500 px-2 mb-1">Tag già aggiunti</div>
                {tags.length === 0 ? (
                  <div className="px-3 py-1.5 text-xs text-gray-500">Nessun tag aggiunto</div>
                ) : (
                  <div className="flex flex-wrap gap-2 px-2">
                    {tags.map((t) => (
                      <button
                        key={t}
                        onClick={() => handleRemoveTag(t)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ring-1 ring-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100"
                        title={`Rimuovi tag ${t}`}
                      >
                        <Tag size={12} className="text-purple-700" />
                        <span>{t}</span>
                        <X size={12} className="text-purple-700" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {showGymTagsList && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="text-xs text-gray-500 px-2 mb-1">Tag suggeriti</div>
                  <div className="flex flex-wrap gap-2 px-2">
                    {GYM_TAGS.map((t) => (
                      <button
                        key={t}
                        onClick={() => { setNewTag(t); setShowGymTagsList(false); }}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ring-1 ring-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                        title={`Usa tag ${t}`}
                      >
                        <Tag size={12} className="text-gray-700" />
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Portal>
        )}
        {/* Toolbar sopra il titolo: Varianti / Settimane / Allenamenti (desktop, solo atleta) */}
        {!isStandaloneMobile && currentUser?.role === 'athlete' && (
          <div className="flex justify-center items-center mb-3">
            <div ref={toolbarRef} className="relative w-full flex justify-center max-w-full">
              <div className="flex flex-nowrap whitespace-nowrap justify-center items-center gap-1 p-1.5 bg-white/70 backdrop-blur-sm ring-1 ring-black/10 rounded-2xl shadow-sm">
                {/* Varianti dropdown */}
                <div className="relative">
                  <button
                    ref={variantsDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                    onClick={(e) => toggleVariantsDropdown(e)}
                    title="Varianti"
                    aria-label="Varianti"
                    className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                    style={{ width: 'clamp(26px, 6vw, 30px)', height: 'clamp(26px, 6vw, 30px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                  >
                    {activeVariantId === 'original' ? (
                      <>
                        <FileText size={18} className="text-blue-600" />
                        <Star size={10} className="absolute -top-0.5 -right-0.5 text-blue-600" />
                      </>
                    ) : (
                      <>
                        <FileText size={18} className="text-red-600" />
                        {(() => { const idx = displayVariants.findIndex(v => v.id === activeVariantId); return idx >= 0 ? (<span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-red-600">{idx + 1}</span>) : null; })()}
                      </>
                    )}
                  </button>
                  {isVariantsDropdownOpen && (
                    <Portal>
                      <div
                        ref={variantsDropdownRef as React.RefObject<HTMLDivElement>}
                        style={{ position: 'fixed', top: variantsDropdownPosition?.top ?? 0, left: variantsDropdownPosition?.left ?? 0 }}
                        className="z-50 w-64 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                      >
                        <div className="mb-1 px-2 text-xs text-gray-500">Seleziona variante</div>
                        <div className="space-y-1">
                          {/* Originale */}
                          {(!isAthlete || canSeeOriginal) && (
                          <button
                            onClick={() => { handleSwitchVariant('original'); closeVariantsDropdown(); }}
                            onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetVariantMenuPosition(e.currentTarget as HTMLElement); setOpenVariantMenuId('original'); }}
                            onPointerDown={(e) => {
                              e.preventDefault();
                              if (!canEdit) return;
                              variantLongPressTriggeredRef.current = false;
                              variantPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                              const anchor = e.currentTarget as HTMLElement;
                              if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current);
                              variantLongPressTimeoutRef.current = window.setTimeout(() => {
                                variantLongPressTriggeredRef.current = true;
                                computeAndSetVariantMenuPosition(anchor);
                                setOpenVariantMenuId('original');
                              }, VARIANT_LONG_PRESS_MS);
                            }}
                            onPointerUp={() => { if (!canEdit) return; if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }}
                            onPointerMove={(e) => {
                              if (!canEdit) return;
                              const startPos = variantPressStartPosRef.current; if (!startPos) return;
                              const dx = Math.abs(e.clientX - startPos.x); const dy = Math.abs(e.clientY - startPos.y);
                              if (dx > 6 || dy > 6) { if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }
                            }}
                            className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeVariantId === 'original' ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                            title={`Scheda: ${workoutTitle}`}
                          >
                            <FileText size={16} className={activeVariantId === 'original' ? 'text-blue-700' : 'text-gray-600'} />
                            <span>{workoutTitle}</span>
                          </button>
                          )}
                          {/* Varianti */}
                          {displayVariants.map((variant, index) => (
                            <button
                              key={variant.id}
                              onClick={() => { handleSwitchVariant(variant.id); closeVariantsDropdown(); }}
                              onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetVariantMenuPosition(e.currentTarget as HTMLElement); setOpenVariantMenuId(variant.id); }}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                if (!canEdit) return;
                                variantLongPressTriggeredRef.current = false;
                                variantPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                                const anchor = e.currentTarget as HTMLElement;
                                if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current);
                                variantLongPressTimeoutRef.current = window.setTimeout(() => {
                                  variantLongPressTriggeredRef.current = true;
                                  computeAndSetVariantMenuPosition(anchor);
                                  setOpenVariantMenuId(variant.id);
                                }, VARIANT_LONG_PRESS_MS);
                              }}
                              onPointerUp={() => { if (!canEdit) return; if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }}
                              onPointerMove={(e) => {
                                if (!canEdit) return;
                                const startPos = variantPressStartPosRef.current; if (!startPos) return;
                                const dx = Math.abs(e.clientX - startPos.x); const dy = Math.abs(e.clientY - startPos.y);
                                if (dx > 6 || dy > 6) { if (variantLongPressTimeoutRef.current) clearTimeout(variantLongPressTimeoutRef.current); variantLongPressTriggeredRef.current = false; }
                              }}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeVariantId === variant.id ? 'bg-red-50 text-red-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                              title={`Variante ${index + 1}: ${variant.name || 'Senza titolo'}`}
                            >
                              <FileText size={16} className={activeVariantId === variant.id ? 'text-red-700' : 'text-red-600'} />
                              <span>Variante {index + 1}{variant.name ? ` — ${variant.name}` : ''}</span>
                            </button>
                          ))}
                        </div>
                        {canEdit && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => { handleAddVariant(); }}
                              className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                              title="Crea nuova variante"
                            >
                              <Plus size={16} className="text-red-600" />
                              <span>Nuova variante</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </Portal>
                  )}
                </div>
                {/* Separatore Apple dopo Varianti */}
                <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />
                {/* Settimane dropdown */}
                <div className="relative">
                  <button
                    ref={weeksDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                    onClick={(e) => toggleWeeksDropdown(e)}
                    title="Settimane"
                    aria-label="Settimane"
                    className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                    style={{ width: 'clamp(26px, 6vw, 30px)', height: 'clamp(26px, 6vw, 30px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                  >
                    <Calendar size={18} className="text-cyan-600" />
                    <span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{parseInt(activeWeekKey.replace('W',''), 10)}</span>
                  </button>
                  {isWeeksDropdownOpen && (
                    <Portal>
                      <div
                        ref={weeksDropdownRef as React.RefObject<HTMLDivElement>}
                        style={{ position: 'fixed', top: weeksDropdownPosition?.top ?? 0, left: weeksDropdownPosition?.left ?? 0 }}
                        className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                      >
                        <div className="mb-1 px-2 text-xs text-gray-500">Seleziona settimana</div>
                        <div className="space-y-1">
                          {weeks.slice().sort((a, b) => {
                            const na = parseInt(a.replace(/^W/, ''), 10);
                            const nb = parseInt(b.replace(/^W/, ''), 10);
                            return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                          }).map((wk) => (
                            <button
                              key={wk}
                              onClick={() => { if (weekLongPressTriggeredRef.current) return; handleSwitchWeek(wk); closeWeeksDropdown(); }}
                              onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetWeekMenuPosition(e.currentTarget as HTMLElement); setOpenWeekKeyMenu(wk); }}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                if (!canEdit) return;
                                weekLongPressTriggeredRef.current = false;
                                weekPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                                const anchor = e.currentTarget as HTMLElement;
                                if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current);
                                weekLongPressTimeoutRef.current = window.setTimeout(() => {
                                  weekLongPressTriggeredRef.current = true;
                                  computeAndSetWeekMenuPosition(anchor);
                                  setOpenWeekKeyMenu(wk);
                                }, VARIANT_LONG_PRESS_MS);
                              }}
                              onPointerUp={() => { if (!canEdit) return; if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current); weekLongPressTriggeredRef.current = false; }}
                              onPointerMove={(e) => {
                                if (!canEdit) return;
                                const start = weekPressStartPosRef.current; if (!start) return;
                                const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y);
                                if (dx > 6 || dy > 6) { if (weekLongPressTimeoutRef.current) clearTimeout(weekLongPressTimeoutRef.current); weekLongPressTriggeredRef.current = false; }
                              }}
                              className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeWeekKey === wk ? 'bg-cyan-50 text-cyan-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                              title={`Settimana ${parseInt(wk.replace('W',''), 10)}`}
                            >
                              <Calendar size={16} className={activeWeekKey === wk ? 'text-cyan-700' : 'text-gray-600'} />
                              <span>Settimana {parseInt(wk.replace('W',''), 10)}</span>
                            </button>
                          ))}
                        </div>
                        {canEdit && weeks.length < 12 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => { handleAddWeek(); }}
                              className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                              title="Aggiungi settimana"
                            >
                              <Plus size={16} className="text-cyan-600" />
                              <span>Aggiungi settimana</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </Portal>
                  )}
                </div>
                {/* Separatore Apple dopo Settimane */}
                <div aria-hidden="true" className="mx-1 h-4 w-px bg-gray-300/80 rounded-full" />
                {/* Giorni dropdown */}
                <div className="relative">
                  <button
                    ref={daysDropdownTriggerRef as React.RefObject<HTMLButtonElement>}
                    onClick={(e) => toggleDaysDropdown(e)}
                    title="Allenamenti"
                    aria-label="Allenamenti"
                    className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0"
                    style={{ width: 'clamp(26px, 6vw, 30px)', height: 'clamp(26px, 6vw, 30px)', userSelect: 'none' as any, WebkitUserSelect: 'none' as any, WebkitTouchCallout: 'none' as any }}
                  >
                    <Dumbbell size={18} className="text-orange-500" />
                    {(() => { const n = parseInt(String(activeDayKey).replace(/^G/, ''), 10); return isNaN(n) ? null : (<span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{n}</span>); })()}
                  </button>
                  {isDaysDropdownOpen && (
                    <Portal>
                      <div
                        ref={daysDropdownRef as React.RefObject<HTMLDivElement>}
                        style={{ position: 'fixed', top: daysDropdownPosition?.top ?? 0, left: daysDropdownPosition?.left ?? 0 }}
                        className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2"
                      >
                        <div className="mb-1 px-2 text-xs text-gray-500">Seleziona allenamento</div>
                        <div className="space-y-1">
                          {(() => {
                            const keys = activeVariantId === 'original' ? Object.keys(originalDays) : Object.keys(variantDaysById[activeVariantId] || {});
                            const sorted = (keys.length ? keys : ['G1']).slice().sort((a, b) => {
                              const na = parseInt(String(a).replace(/^G/, ''), 10);
                              const nb = parseInt(String(b).replace(/^G/, ''), 10);
                              return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                            });
                            return sorted.map((dk) => (
                              <button
                                key={dk}
                                onClick={() => { if (dayLongPressTriggeredRef.current) return; handleSwitchDay(dk); closeDaysDropdown(); }}
                                onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; computeAndSetDayMenuPosition(e.currentTarget as HTMLElement); setOpenDayKeyMenu(dk); }}
                                onPointerDown={(e) => {
                                  e.preventDefault();
                                  if (!canEdit) return;
                                  dayLongPressTriggeredRef.current = false;
                                  dayPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                                  const anchor = e.currentTarget as HTMLElement;
                                  if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current);
                                  dayLongPressTimeoutRef.current = window.setTimeout(() => {
                                    dayLongPressTriggeredRef.current = true;
                                    computeAndSetDayMenuPosition(anchor);
                                    setOpenDayKeyMenu(dk);
                                  }, VARIANT_LONG_PRESS_MS);
                                }}
                                onPointerUp={() => { if (!canEdit) return; if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current); dayLongPressTriggeredRef.current = false; }}
                                onPointerMove={(e) => {
                                  if (!canEdit) return;
                                  const start = dayPressStartPosRef.current; if (!start) return;
                                  const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y);
                                  if (dx > 6 || dy > 6) { if (dayLongPressTimeoutRef.current) clearTimeout(dayLongPressTimeoutRef.current); dayLongPressTriggeredRef.current = false; }
                                }}
                                className={`w-full text-left px-3 py-1.5 text-sm rounded-lg ${activeDayKey === dk ? 'bg-orange-50 text-orange-700' : 'hover:bg-gray-50 text-gray-800'} flex items-center gap-2`}
                                title={`Allenamento ${parseInt(String(dk).replace('G',''), 10)}`}
                              >
                                <Dumbbell size={16} className={activeDayKey === dk ? 'text-orange-700' : 'text-gray-600'} />
                                <span>Allenamento {parseInt(String(dk).replace('G',''), 10)}</span>
                              </button>
                            ));
                          })()}
                        </div>
                        {canEdit && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <button
                              onClick={() => { handleAddDay(); }}
                              className="w-full text-left px-3 py-1.5 text-sm rounded-lg bg-white hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                              title="Aggiungi allenamento"
                            >
                              <Plus size={16} className="text-orange-600" />
                              <span>Aggiungi allenamento</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </Portal>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {isEditingTitle && canEdit ? (
          <div className="relative w-full">
            <input
              ref={titleInputRef}
              type="text"
              value={activeVariantId === 'original' ? workoutTitle : (variants.find(v => v.id === activeVariantId)?.name || '')}
              onChange={(e) => {
                const newTitle = e.target.value;
                if (activeVariantId === 'original') {
                  setWorkoutTitle(newTitle);
                } else {
                  setVariants(variants.map(v => v.id === activeVariantId ? { ...v, name: newTitle } : v));
                }
              }}
              onBlur={handleSaveTitle}
              onKeyPress={(e) => e.key === 'Enter' && handleSaveTitle()}
              className={`w-full text-2xl font-bold border-b-2 ${activeVariantId === 'original' ? 'border-blue-500 text-navy-900' : 'border-red-500 text-red-700'} bg-transparent outline-none text-center`}
            />
            {(() => {
              const timeRegex = /\b(\d{1,2}:\d{2}|\d+\s*(min|minuti|m|sec|secondi|s|h|ore))\b/i;
              const currentTitle = activeVariantId === 'original' ? (workoutTitle || '') : ((variants.find(v => v.id === activeVariantId)?.name) || '');
              const hasTime = timeRegex.test(currentTitle);
              if (!hasTime) return null;
              return (
                <button
                  type="button"
                  aria-label="Cancella contenuto"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeVariantId === 'original') {
                      setWorkoutTitle('');
                    } else {
                      setVariants(variants.map(v => v.id === activeVariantId ? { ...v, name: '' } : v));
                    }
                    setTimeout(() => { try { handleSaveTitle(); } catch {} }, 0);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/70 text-red-600 hover:bg-white hover:shadow-sm"
                >
                  <X size={14} />
                </button>
              );
            })()}
          </div>
        ) : (
          <div className="relative w-full flex justify-center">
            <h1
              className={`text-2xl font-bold ${canEdit ? 'cursor-pointer' : 'cursor-default'} transition-colors truncate text-center ${activeVariantId === 'original' ? 'text-navy-900 hover:text-navy-800' : 'text-red-700 hover:text-red-800'}`}
              onClick={() => { if (!canEdit) return; setIsEditingTitle(true); setTimeout(() => { if (titleInputRef.current) { const input = titleInputRef.current; try { const len = input.value.length; input.setSelectionRange(len, len); } catch {} input.focus(); } }, 0); }}
              title={canEdit ? "Clicca per modificare il titolo" : "Solo visualizzazione"}
            >
              {activeVariantId === 'original' ? workoutTitle : (variants.find(v => v.id === activeVariantId)?.name || '')}
            </h1>
            {(() => {
              const timeRegex = /\b(\d{1,2}:\d{2}|\d+\s*(min|minuti|m|sec|secondi|s|h|ore))\b/i;
              const currentTitle = activeVariantId === 'original' ? (workoutTitle || '') : ((variants.find(v => v.id === activeVariantId)?.name) || '');
              const hasTime = timeRegex.test(currentTitle);
              if (!hasTime || !canEdit) return null;
              return (
                <button
                  type="button"
                  aria-label="Cancella contenuto"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (activeVariantId === 'original') {
                      setWorkoutTitle('');
                    } else {
                      setVariants(variants.map(v => v.id === activeVariantId ? { ...v, name: '' } : v));
                    }
                    setTimeout(() => { try { handleSaveTitle(); } catch {} }, 0);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/70 text-red-600 hover:bg-white hover:shadow-sm"
                >
                  <X size={14} />
                </button>
              );
            })()}
          </div>
        )}

        {/* Editable Description (read-only per atleti) */}
        <div className="flex justify-center items-center mb-6">
          {isEditingDescription && canEdit ? (
            <div className="relative w-full max-w-2xl">
              <textarea
                ref={descriptionInputRef}
                value={workoutDescription}
                onChange={(e) => setWorkoutDescription(e.target.value)}
                onFocus={() => { if (isEditingTitle) { handleSaveTitle(); } }}
                onBlur={handleSaveDescription}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSaveDescription()}
                placeholder="Aggiungi una descrizione..."
                className="w-full border-b-2 border-blue-500 bg-transparent outline-none resize-none text-gray-600 text-center"
                rows={2}
              />
              {(() => {
                const timeRegex = /\b(\d{1,2}:\d{2}|\d+\s*(min|minuti|m|sec|secondi|s|h|ore))\b/i;
                const hasTime = timeRegex.test(workoutDescription || '');
                if (!hasTime) return null;
                return (
                  <button
                    type="button"
                    aria-label="Cancella contenuto"
                    onClick={(e) => { e.stopPropagation(); setWorkoutDescription(''); setTimeout(() => { try { handleSaveDescription(); } catch {} }, 0); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/70 text-red-600 hover:bg-white hover:shadow-sm"
                  >
                    <X size={14} />
                  </button>
                );
              })()}
            </div>
          ) : (
            <div className={`relative w-full max-w-2xl mx-auto ${canEdit ? 'group' : ''}`} onClick={() => { if (!canEdit) return; if (isEditingTitle) { handleSaveTitle(); } setIsEditingDescription(true); setTimeout(() => { if (descriptionInputRef.current) { const ta = descriptionInputRef.current; try { const len = ta.value.length; ta.setSelectionRange(len, len); } catch {} ta.focus(); } }, 0); }} title={canEdit ? "Clicca per modificare la descrizione" : "Solo visualizzazione"}>
              <div className="flex items-center gap-2 justify-center">
                {workoutDescription ? (
                  <p className={`text-gray-600 max-w-2xl text-center break-words ${canEdit ? 'transition-colors group-hover:text-blue-600' : ''}`}>{workoutDescription}</p>
                ) : (
                  <p className="text-gray-400 italic text-center transition-colors group-hover:text-blue-600">Clicca per aggiungere una descrizione</p>
                )}
              </div>
              {(() => {
                const timeRegex = /\b(\d{1,2}:\d{2}|\d+\s*(min|minuti|m|sec|secondi|s|h|ore))\b/i;
                const hasTime = timeRegex.test(workoutDescription || '');
                if (!hasTime || !canEdit) return null;
                return (
                  <button
                    type="button"
                    aria-label="Cancella contenuto"
                    onClick={(e) => { e.stopPropagation(); setWorkoutDescription(''); setTimeout(() => { try { handleSaveDescription(); } catch {} }, 0); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/70 text-red-600 hover:bg-white hover:shadow-sm"
                  >
                    <X size={14} />
                  </button>
                );
              })()}
            </div>
          )}
        </div>

        {/* Tags sotto la descrizione */}
        {tags && tags.length > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4">
            <Tag size={16} className="text-purple-600" />
            <div ref={tagsUnderDescContainerRef as React.RefObject<HTMLDivElement>} className="flex flex-wrap items-center gap-2 max-w-2xl justify-center">
              {tags.map((tag, idx) => (
                <div key={idx} className="relative inline-flex items-center">
                  <button
                    type="button"
                    onClick={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      const rect = el.getBoundingClientRect();
                      setOpenTagActionsFor(tag);
                      setTagRenameDraft(tag);
                      setTagActionsPosition({ top: rect.bottom + 8, left: rect.left + rect.width / 2 });
                    }}
                    className="px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-xs shadow-sm hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition"
                    title="Azioni tag"
                  >
                    {tag}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Menu contestuale per tag sotto descrizione */}
        {canEdit && openTagActionsFor && tagActionsPosition && (
          <Portal>
            <>
              <div
                ref={tagActionsDropdownRef as React.RefObject<HTMLDivElement>}
                style={{ position: 'fixed', top: tagActionsPosition.top, left: tagActionsPosition.left, transform: 'translateX(-50%)' }}
                className="z-[9999] bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-56"
                onClick={(e) => e.stopPropagation()}
                onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
              >
                <div className="px-2 pb-2 text-xs text-gray-500">Azioni tag</div>
                <button
                  onClick={() => setShowTagRename(true)}
                  className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                  title="Modifica tag"
                >
                  <Edit3 size={16} className="text-gray-700" />
                  <span>Modifica</span>
                </button>
                <button
                  onClick={() => { handleRemoveTag(openTagActionsFor!); setOpenTagActionsFor(null); }}
                  className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 flex items-center gap-2"
                  title="Elimina tag"
                >
                  <Trash2 size={16} className="text-red-600" />
                  <span>Elimina</span>
                </button>
                {showTagRename && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <label className="block text-xs text-gray-600 mb-1">Rinomina o seleziona</label>
                    <input
                      type="text"
                      value={tagRenameDraft}
                      onChange={(e) => setTagRenameDraft(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-md border border-gray-200 bg-white focus:ring-2 focus:ring-purple-300"
                      maxLength={20}
                    />
                    <div className="mt-2 max-h-24 overflow-auto">
                      {PREDEFINED_GYM_TAGS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { handleRenameTag(openTagActionsFor!, t); setOpenTagActionsFor(null); setShowTagRename(false); }}
                          className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-white/70 ${tags.includes(t) ? 'opacity-60 cursor-not-allowed' : ''}`}
                          disabled={tags.includes(t)}
                        >
                          <span>{t}</span>
                          {tags.includes(t) && <span className="ml-2 text-[11px] text-green-600">Già presente</span>}
                        </button>
                      ))}
                    </div>
                    <div className="flex justify-end gap-2 mt-2">
                      <button type="button" onClick={() => { setShowTagRename(false); setOpenTagActionsFor(null); }} className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">Annulla</button>
                      <button type="button" onClick={() => { const newName = tagRenameDraft.trim(); if (newName) { handleRenameTag(openTagActionsFor!, newName); } setOpenTagActionsFor(null); setShowTagRename(false); }} className="text-xs px-2 py-1 rounded-full bg-purple-600 text-white disabled:opacity-50" disabled={!tagRenameDraft.trim()}>Salva</button>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ position: 'fixed', inset: 0 }} onClick={() => { setOpenTagActionsFor(null); setShowTagRename(false); }} className="z-[9998] bg-black/10" />
            </>
          </Portal>
        )}

        {/* Separatore Apple tra descrizione e "Esercizi" */}
        <SectionSeparator variant="apple" />
        
        {/* Toolbar rimossa da qui: ora posizionata sotto la barra varianti */}
        
        {/* Duration Modal */}
        <Modal
          isOpen={isEditingDates}
          onClose={() => setIsEditingDates(false)}
          title="Durata scheda"
        >
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Durata scheda (settimane)</label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-300 ring-1 ring-black/10 bg-white/90">
              <ul className="divide-y divide-gray-100">
                {Array.from({ length: 52 }, (_, i) => i + 1).map((n) => (
                  <li key={n}>
                    <button
                      type="button"
                      onClick={() => setDurationWeeksTemp(String(n))}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${String(n) === durationWeeksTemp || (!durationWeeksTemp && n === durationWeeks) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                    >
                      {n}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-xs text-gray-500 mt-1">Seleziona da 1 a 52 settimane</div>
          </div>

          <button
            onClick={() => {
              const parsed = parseInt(durationWeeksTemp, 10);
              const n = Number.isFinite(parsed) ? Math.min(52, Math.max(1, parsed)) : 1;
              setDurationWeeks(n);
              setIsEditingDates(false);
              setSaveMessage(`Durata aggiornata a ${n} settimana${n > 1 ? 'e' : ''}`);
            }}
            className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
          >
            Salva
          </button>
        </Modal>
        
        {/* Modal Associa rimosso: sostituito da dropdown coerente */}
        
        {/* View Athletes Modal */}
        <Modal
          isOpen={showAthletesList}
          onClose={() => setShowAthletesList(false)}
          title="Atleti associati"
        >
          {associatedAthletes.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">
              Nessun atleta associato
            </div>
          ) : (
            <div className="max-h-40 overflow-y-auto">
              {associatedAthletes.map((athleteIdOrName) => {
                const found = athletes.find(u => u.id === athleteIdOrName || u.name === athleteIdOrName || u.email === athleteIdOrName);
                const displayName = found ? found.name : athleteIdOrName;
                const idForActions = found ? found.id : athleteIdOrName;
                return (
                <div key={athleteIdOrName} className="flex items-center justify-between px-4 py-2 hover:bg-gray-100">
                  <span>{displayName}</span>
                  <button
                    onClick={() => handleRemoveAthlete(idForActions)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              )})}
            </div>
          )}
        </Modal>
        
        {/* Exercise Form */}
        <Modal
          isOpen={showExerciseForm}
          onClose={() => {
            setShowExerciseForm(false);
            setEditingExerciseId(null);
            setEditingExercise(null);
            setCurrentExercise({
              id: '',
              name: '',
              notes: '',
              sets: '',
              intensity: '',
              tut: '',
              recovery: '',
              videoLink: ''
            });
            setCurrentSets('');
            setCurrentReps('');
            setEditingSets('');
            setEditingReps('');
          }}
          title={editingExerciseId ? 'Modifica Esercizio' : 'Aggiungi Esercizio'}
        >
          <div className="mb-2">
            
            {/* Exercise Name with Smart Search */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Esercizio</label>
              <div className="flex space-x-2">
                <div className="flex-1 relative" ref={exerciseDropdownRef}>
                  <input
                    type="text"
                    value={editingExercise ? editingExercise.name : currentExercise.name}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (editingExercise) {
                        setEditingExercise({ ...editingExercise, name: value });
                      } else {
                        setCurrentExercise({ ...currentExercise, name: value });
                      }
                      // Update search query for intelligent search
                      setExerciseSearchQuery(value);
                      // Show search suggestions only if there's text and we're not showing the full dropdown
                      if (value.length > 0 && !showExerciseDropdown) {
                        setShowSearchSuggestions(true);
                      } else {
                        setShowSearchSuggestions(false);
                      }
                    }}
                    onFocus={() => {
                      // Show suggestions if there's text in the field
                      const currentName = editingExercise ? editingExercise.name : currentExercise.name;
                      if (currentName.length > 0 && !showExerciseDropdown) {
                        setExerciseSearchQuery(currentName);
                        setShowSearchSuggestions(true);
                      }
                    }}
                    onBlur={(e) => {
                      console.log('🔍 Input blur event triggered');
                      
                      // Check if the related target is within our dropdown
                      const relatedTarget = e.relatedTarget as HTMLElement;
                      const dropdownContainer = exerciseDropdownRef.current;
                      
                      // If there's no relatedTarget (like when clicking on scrollbar), don't close immediately
                      if (!relatedTarget) {
                        console.log('🔍 No related target (possibly scrollbar click) - delaying close');
                        setTimeout(() => {
                          // Only close if the dropdown is still not focused
                          if (!document.activeElement || !dropdownContainer?.contains(document.activeElement)) {
                            console.log('🔍 Closing dropdown after scrollbar interaction');
                            setShowSearchSuggestions(false);
                            if (!showExerciseDropdown) {
                              setShowSearchSuggestions(false);
                            }
                          }
                        }, 300);
                        return;
                      }
                      
                      if (dropdownContainer && relatedTarget && dropdownContainer.contains(relatedTarget)) {
                        console.log('🔍 Blur cancelled - click is within dropdown');
                        return; // Don't hide if clicking within dropdown
                      }
                      
                      // Delay hiding suggestions to allow clicking on them
                      setTimeout(() => {
                        console.log('🔍 Hiding suggestions after blur delay');
                        if (!showExerciseDropdown) {
                          setShowSearchSuggestions(false);
                        }
                      }, 200);
                    }}
                    placeholder="Cerca o digita nome esercizio..."
                    className="w-full px-3 py-2 rounded-lg bg-white/80 border border-gray-200 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  
                  {/* Search Suggestions */}
                  {showSearchSuggestions && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 rounded-xl shadow-md z-10 max-h-48 overflow-y-auto backdrop-blur-sm">
                      {getFilteredExercises().length > 0 ? (
                        getFilteredExercises().map((exercise, index) => {
                          const isCustomExercise = customExercises.includes(exercise);
                          const query = exerciseSearchQuery.toLowerCase();
                          const exerciseLower = exercise.toLowerCase();
                          const matchIndex = exerciseLower.indexOf(query);
                          
                          return (
                            <div
                              key={`search-${exercise}-${index}`}
                              className="flex items-center justify-between px-4 py-2 hover:bg-gray-100 transition-colors cursor-pointer"
                              onClick={() => {
                                if (editingExercise) {
                                  setEditingExercise({ ...editingExercise, name: exercise });
                                } else {
                                  setCurrentExercise({ ...currentExercise, name: exercise });
                                }
                                setExerciseSearchQuery('');
                                setShowSearchSuggestions(false);
                              }}
                            >
                              <div className="flex-1">
                                {matchIndex >= 0 ? (
                                  <span>
                                    {exercise.substring(0, matchIndex)}
                                    <span className="bg-yellow-200 font-semibold">
                                      {exercise.substring(matchIndex, matchIndex + query.length)}
                                    </span>
                                    {exercise.substring(matchIndex + query.length)}
                                  </span>
                                ) : (
                                  exercise
                                )}
                              </div>
                              {isCustomExercise && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveCustomExercise(exercise);
                                  }}
                                  className="p-1 text-red-500 hover:text-red-700 transition-colors ml-2"
                                  title="Elimina esercizio personalizzato"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-2 text-gray-500 text-sm">
                          Nessun esercizio trovato per "{exerciseSearchQuery}"
                        </div>
                      )}
                    </div>
                  )}


                </div>
                
                {/* Save New Exercise Button */}
                {(editingExercise ? editingExercise.name : currentExercise.name).trim() && 
                 !getFilteredExercises().includes(editingExercise ? editingExercise.name : currentExercise.name) && (
                  <button
                    onClick={() => {
                      const exerciseName = editingExercise ? editingExercise.name : currentExercise.name;
                      if (exerciseName.trim() && !predefinedExercises.includes(exerciseName) && !customExercises.includes(exerciseName)) {
                        handleSaveCustomExercise(exerciseName);
                        setSaveMessage('Nuovo esercizio aggiunto correttamente');
                      }
                    }}
                    className="px-4 py-2 bg-green-500 text-white rounded-full ring-1 ring-black/10 shadow-sm hover:bg-green-600 transition-all flex items-center"
                    title="Salva nuovo esercizio"
                  >
                    <Save size={16} />
                  </button>
                )}
                
                <div className="relative">
                  <button
                    onClick={() => {
                      console.log('🔽 Dropdown button clicked');
                      console.log('showExerciseDropdown before:', showExerciseDropdown);
                      
                      const isOpening = !showExerciseDropdown;
                      setShowExerciseDropdown(isOpening);
                      
                      console.log('isOpening:', isOpening);
                      
                      if (isOpening) {
                        // When opening dropdown, hide search suggestions and set search query
                        setShowSearchSuggestions(false);
                        const currentName = editingExercise ? editingExercise.name : currentExercise.name;
                        setExerciseSearchQuery(currentName);
                        console.log('Setting search query to:', currentName);
                      } else {
                        // When closing dropdown, clear search query
                        setExerciseSearchQuery('');
                        console.log('Clearing search query');
                      }
                    }}
                    className="px-4 py-2 bg-white/70 text-gray-700 rounded-full ring-1 ring-gray-300 shadow-sm hover:bg-white/90 transition-all"
                    title="Mostra tutti gli esercizi"
                  >
                    ▼
                  </button>
                  {showExerciseDropdown && (
                    <div 
                      className="absolute top-full right-0 mt-1 w-64 bg-white/95 border border-gray-200 rounded-xl ring-1 ring-gray-300 shadow-md z-50 backdrop-blur-sm"
                      ref={exerciseDropdownRef}
                      onMouseDown={(e) => {
                        console.log('🖱️ Mouse down on dropdown container');
                        e.preventDefault(); // Prevent blur from input field
                        e.stopPropagation(); // Prevent event bubbling
                      }}
                      onClick={(e) => {
                        // Prevent clicks on the dropdown container (including scrollbar) from closing
                        e.stopPropagation();
                      }}
                    >
                      <div 
                        className="max-h-40 overflow-y-auto"
                        onMouseDown={(e) => {
                          // Prevent scrollbar clicks from triggering blur
                          e.stopPropagation();
                        }}
                        onClick={(e) => {
                          // Prevent scrollbar clicks from closing dropdown
                          e.stopPropagation();
                        }}
                      >
                        {getFilteredExercises().map((exercise, index) => {
                          const isCustomExercise = customExercises.includes(exercise);
                          return (
                            <div
                              key={`dropdown-${exercise}-${index}`}
                              className="hover:bg-gray-100 transition-colors"
                            >
                              <button
                                onMouseDown={(e) => {
                                  console.log('🖱️ Mouse down on exercise button:', exercise);
                                  e.preventDefault(); // Prevent blur
                                  e.stopPropagation(); // Prevent event bubbling
                                  
                                  // Immediately handle the selection here instead of waiting for onClick
                                  console.log('🎯 Processing exercise selection:', exercise);
                                  console.log('📝 editingExercise before:', editingExercise);
                                  console.log('💪 currentExercise before:', currentExercise);
                                  
                                  if (editingExercise) {
                                    const updatedExercise = { ...editingExercise, name: exercise };
                                    console.log('✏️ Setting editingExercise to:', updatedExercise);
                                    setEditingExercise(updatedExercise);
                                    console.log('✏️ editingExercise after set:', updatedExercise);
                                  } else {
                                    const updatedExercise = { ...currentExercise, name: exercise };
                                    console.log('🔄 Setting currentExercise to:', updatedExercise);
                                    setCurrentExercise(updatedExercise);
                                    console.log('🔄 currentExercise after set:', updatedExercise);
                                  }
                                  
                                  console.log('🔄 Closing dropdowns...');
                                  setShowExerciseDropdown(false);
                                  setShowSearchSuggestions(false);
                                  setExerciseSearchQuery('');
                                  
                                  console.log('✅ Exercise selection completed in mouseDown');
                                }}
                                onClick={(e) => {
                                  console.log('🎯 onClick triggered for exercise:', exercise);
                                  // This is now just a fallback, the main logic is in mouseDown
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                className="w-full text-left px-4 py-2 flex items-center justify-between"
                              >
                                <span>{exercise}</span>
                                {isCustomExercise && (
                                  <button
                                    onClick={(e) => {
                                      console.log('🗑️ Removing custom exercise:', exercise);
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleRemoveCustomExercise(exercise);
                                    }}
                                    className="p-1 text-red-500 hover:text-red-700 transition-colors ml-2"
                                    title="Elimina esercizio personalizzato"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Exercise Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                <textarea
                  value={editingExercise ? editingExercise.notes : currentExercise.notes}
                  onChange={(e) => {
                    if (editingExercise) {
                      setEditingExercise({ ...editingExercise, notes: e.target.value });
                    } else {
                      setCurrentExercise({ ...currentExercise, notes: e.target.value });
                    }
                  }}
                  placeholder="Note sull'esercizio"
                  className="w-full px-3 py-2 rounded-lg bg-white/80 border border-gray-200 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 sr-only">Serie e Ripetizioni</label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Serie:</span>
                  <input
                    type="number"
                    value={editingExercise ? editingSets : currentSets}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (editingExercise) {
                        setEditingSets(value);
                        // Update the combined sets field for backward compatibility
                        const reps = editingReps || '';
                        setEditingExercise({ 
                          ...editingExercise, 
                          sets: reps ? `${value} x ${reps}` : value 
                        });
                      } else {
                        setCurrentSets(value);
                        // Update the combined sets field for backward compatibility
                        const reps = currentReps || '';
                        setCurrentExercise({ 
                          ...currentExercise, 
                          sets: reps ? `${value} x ${reps}` : value 
                        });
                      }
                    }}
                    placeholder="es. 3"
                    className="w-20 px-3 py-2 rounded-lg bg-white/80 border border-gray-200 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    min="1"
                  />
                  <div aria-hidden="true" className="mx-1 h-5 w-px bg-gradient-to-b from-transparent via-gray-300/80 to-transparent rounded-full" />
                  <span className="text-sm text-gray-700">Ripetizioni:</span>
                  <input
                    type="number"
                    value={editingExercise ? editingReps : currentReps}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (editingExercise) {
                        setEditingReps(value);
                        // Update the combined sets field for backward compatibility
                        const sets = editingSets || '';
                        setEditingExercise({ 
                          ...editingExercise, 
                          sets: sets ? `${sets} x ${value}` : value 
                        });
                      } else {
                        setCurrentReps(value);
                        // Update the combined sets field for backward compatibility
                        const sets = currentSets || '';
                        setCurrentExercise({ 
                          ...currentExercise, 
                          sets: sets ? `${sets} x ${value}` : value 
                        });
                      }
                    }}
                    placeholder="es. 8"
                    className="w-24 px-3 py-2 rounded-lg bg-white/80 border border-gray-200 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    min="1"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Intensità</label>
                    <input
                      type="text"
                      value={editingExercise ? editingExercise.intensity : currentExercise.intensity}
                      onChange={(e) => {
                        if (editingExercise) {
                          setEditingExercise({ ...editingExercise, intensity: e.target.value });
                        } else {
                          setCurrentExercise({ ...currentExercise, intensity: e.target.value });
                        }
                      }}
                      placeholder="es. RPE 8 o RIR 2 o 70% 1RM"
                      className="w-full px-3 py-2 rounded-lg bg-white/80 border border-gray-200 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">TUT</label>
                    <input
                      type="text"
                      value={editingExercise ? editingExercise.tut : currentExercise.tut}
                      onChange={(e) => {
                        if (editingExercise) {
                          setEditingExercise({ ...editingExercise, tut: e.target.value });
                        } else {
                          setCurrentExercise({ ...currentExercise, tut: e.target.value });
                        }
                      }}
                      placeholder="es. 3-1-2-1"
                      className="w-full px-3 py-2 rounded-lg bg-white/80 border border-gray-200 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Recupero</label>
                    <input
                      type="text"
                      value={editingExercise ? editingExercise.recovery : currentExercise.recovery}
                      onChange={(e) => {
                        if (editingExercise) {
                          setEditingExercise({ ...editingExercise, recovery: e.target.value });
                        } else {
                          setCurrentExercise({ ...currentExercise, recovery: e.target.value });
                        }
                      }}
                      placeholder="es. 90 secondi"
                      className="w-full px-3 py-2 rounded-lg bg-white/80 border border-gray-200 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>
              


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Link Video o Foto</label>
                <input
                  type="text"
                  value={editingExercise ? editingExercise.videoLink : currentExercise.videoLink}
                  onChange={(e) => {
                    if (editingExercise) {
                      setEditingExercise({ ...editingExercise, videoLink: e.target.value });
                    } else {
                      setCurrentExercise({ ...currentExercise, videoLink: e.target.value });
                    }
                  }}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg bg-white/80 border border-gray-200 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>
            </div>
            
            {/* Form Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleAddExercise}
                className="px-4 py-2 rounded-full bg-blue-500 text-white ring-1 ring-black/10 shadow-sm hover:bg-blue-600 transition-all"
              >
                {editingExerciseId ? 'Salva Modifiche' : 'Aggiungi Esercizio'}
              </button>
              <button
                onClick={() => {
                  setShowExerciseForm(false);
                  setEditingExerciseId(null);
                  setEditingExercise(null);
                  setCurrentExercise({
                    id: '',
                    name: '',
                    notes: '',
                    sets: '',
                    intensity: '',
                    tut: '',
                    recovery: '',
                    videoLink: ''
                  });
                  // Clear separate sets/reps state
                  setCurrentSets('');
                  setCurrentReps('');
                  setEditingSets('');
                  setEditingReps('');
                }}
                className="px-4 py-2 rounded-full bg-white text-gray-800 ring-1 ring-black/10 shadow-sm hover:bg-gray-100 transition-all"
              >
                Annulla
              </button>
            </div>
          </div>
        </Modal>
        
        {/* Liste di selezione spostate nella toolbar: varianti, settimane, giornate */}
        
        {/* Exercises List */}
        <div className="mt-6 mb-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 tracking-tight flex items-center">
            <Dumbbell size={22} className="mr-2 text-gray-700" />
            Esercizi
          </h3>
          {exercises.length > 0 ? (
            <div className="space-y-4">
              {isSupersetMode && supersetAnchorExerciseId && (
                <div className="relative z-[9999] flex justify-center">
                  <div className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md border border-purple-300 shadow-lg rounded-full px-4 py-2">
                    <span className="text-sm text-gray-700">Seleziona esercizi da collegare al superset</span>
                    <button onClick={handleConfirmSuperset} className="px-3 py-1 rounded-full bg-purple-600 text-white text-sm shadow hover:bg-purple-700">Conferma</button>
                    <button onClick={handleCancelSuperset} className="px-3 py-1 rounded-full bg-white text-gray-700 ring-1 ring-gray-300 text-sm shadow hover:bg-gray-50">Annulla</button>
                  </div>
                </div>
              )}
              {(() => {
                const rendered: JSX.Element[] = [];
                for (let i = 0; i < exercises.length; i++) {
                  const exercise = exercises[i];
                  // Gruppo superset: un unico contenitore con separatori
                  if (exercise.isSupersetLeader) {
                    const leader = exercise;
                    const followers: typeof exercises = [];
                    let j = i + 1;
                    while (j < exercises.length && String(exercises[j].supersetGroupId) === String(leader.id) && !exercises[j].isSupersetLeader) {
                      followers.push(exercises[j]);
                      j++;
                    }
                    rendered.push(
                      <div
                        key={`superset-${leader.id}`}
                        className={`relative p-4 rounded-2xl bg-white backdrop-blur-md ring-1 ring-purple-300 shadow-sm hover:shadow-md transition hover:translate-y-px`}
                        data-leader-index={i}
                        draggable={canEdit}
                        onDragStart={canEdit ? () => handleDragStartIndex(i) : undefined}
                        onDragOver={canEdit ? (e) => handleDragOverIndex(e, i) : undefined}
                        onDrop={canEdit ? (e) => { e.stopPropagation(); handleDropOnSupersetContainer(String(leader.id), i); } : undefined}
                        onDragEnd={canEdit ? handleDragEndIndex : undefined}
                      >
                        <div className="flex justify-center items-center mb-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs ring-1 ring-purple-300 bg-purple-50 text-purple-700 font-bold">Superset</span>
                        </div>
                        <div
                            className={`relative p-3 rounded-xl bg-white backdrop-blur-md ring-1 ring-black/10 shadow-sm ${dragOverExerciseIndex === i ? 'ring-2 ring-red-300' : ''} ${draggedExerciseIndex === i ? 'opacity-80' : ''} ${selectedSwapIndex === i ? 'ring-2 ring-blue-300' : ''} ${isSupersetMode && leader.id !== supersetAnchorExerciseId && !leader.supersetGroupId && !leader.isSupersetLeader ? (supersetSelection.includes(leader.id) ? 'ring-2 ring-purple-400' : 'cursor-pointer') : ''} ${openSupersetActionsId === leader.id || openCloneActionsId === leader.id ? 'z-50' : ''}`}
                          onClick={() => { if (exerciseLongPressTriggeredRef.current) return; const selectable = isSupersetMode && leader.id !== supersetAnchorExerciseId && !leader.supersetGroupId && !leader.isSupersetLeader; if (selectable) handleToggleSupersetSelection(leader.id); }}
                          onClickCapture={(e) => { if (exerciseLongPressTriggeredRef.current) { e.preventDefault(); e.stopPropagation(); } }}
                            onDoubleClick={() => { if (canEdit) handleEditExercise(leader); }}
                          onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; setOpenExerciseContextId(leader.id); computeAndSetMenuPosition(e.currentTarget as HTMLElement, 'exercise'); }}
                          onPointerDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!canEdit) return;
                            exerciseLongPressTriggeredRef.current = false;
                            exercisePressStartPosRef.current = { x: e.clientX, y: e.clientY };
                            const anchor = e.currentTarget as HTMLElement;
                            if (exerciseLongPressTimeoutRef.current) clearTimeout(exerciseLongPressTimeoutRef.current);
                            exerciseLongPressTimeoutRef.current = window.setTimeout(() => {
                              exerciseLongPressTriggeredRef.current = true;
                              setOpenExerciseContextId(leader.id);
                              computeAndSetMenuPosition(anchor, 'exercise');
                            }, VARIANT_LONG_PRESS_MS);
                          }}
                          onPointerUp={() => { if (!canEdit) return; if (exerciseLongPressTimeoutRef.current) clearTimeout(exerciseLongPressTimeoutRef.current); setTimeout(() => { exerciseLongPressTriggeredRef.current = false; }, 250); }}
                          onPointerMove={(e) => {
                            if (!canEdit) return;
                            const start = exercisePressStartPosRef.current; if (!start) return;
                            const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y);
                            if (dx > 6 || dy > 6) { if (exerciseLongPressTimeoutRef.current) clearTimeout(exerciseLongPressTimeoutRef.current); exerciseLongPressTriggeredRef.current = false; }
                          }}
                          draggable={canEdit}
                          onDragStart={canEdit ? () => handleDragStartIndex(i) : undefined}
                          onDragOver={canEdit ? (e) => handleDragOverIndex(e, i) : undefined}
                          onDrop={canEdit ? (e) => { e.stopPropagation(); handleDropOnCard(i); } : undefined}
                          onDragEnd={canEdit ? handleDragEndIndex : undefined}
                        >
                          <div className="flex justify-center items-center gap-2 mb-1">
                            <span className="font-semibold text-lg text-purple-700">{leader.name}</span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                            {leader.notes && (
                              <p className="flex items-center gap-2">
                                <FileText size={14} className="text-gray-500" />
                                <span className="font-semibold">Note:</span>
                                <span>{leader.notes}</span>
                              </p>
                            )}
                            {leader.sets && (
                              <p className="flex items-center gap-2">
                                <Dumbbell size={14} className="text-gray-500" />
                                {(() => {
                                  const m = (leader.sets || '').match(/(\d+)\s*[xX]\s*([^\s]+)/);
                                  if (m) {
                                    return (
                                      <>
                                        <span className="font-semibold">Serie:</span>
                                        <span>{m[1]}</span>
                                        <div aria-hidden="true" className="mx-1 h-4 w-px bg-gradient-to-b from-transparent via-gray-300/80 to-transparent rounded-full" />
                                        <span className="font-semibold">Ripetizioni:</span>
                                        <span>{m[2]}</span>
                                      </>
                                    );
                                  }
                                  return (
                                    <>
                                      <span className="font-semibold">Serie:</span>
                                      <span>{leader.sets}</span>
                                    </>
                                  );
                                })()}
                              </p>
                            )}
                            {leader.intensity && (
                              <p className="flex items-center gap-2">
                                <Zap size={14} className="text-gray-500" />
                                <span className="font-semibold">Intensità:</span>
                                <span>{leader.intensity}</span>
                              </p>
                            )}
                            {leader.tut && (
                              <p className="flex items-center gap-2">
                                <Timer size={14} className="text-gray-500" />
                                <span className="font-semibold">TUT:</span>
                                <span>{leader.tut}</span>
                              </p>
                            )}
                            {leader.recovery && (
                              <p className="flex items-center gap-2">
                                <Clock size={14} className="text-gray-500" />
                                <span className="font-semibold">Recupero:</span>
                                <span>{leader.recovery}</span>
                              </p>
                            )}
                            {leader.videoLink && (
                              <p className="flex items-center gap-2">
                                <Video size={14} className="text-gray-500" />
                                <span className="font-semibold">Video:</span>
                                <a href={leader.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                  Visualizza
                                </a>
                              </p>
                            )}
                          </div>
                          {canEdit && openExerciseContextId === leader.id && actionsMenuType === 'exercise' && actionsMenuPosition && (
                            <Portal>
                              <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} className="bg-black/10" onClick={closeActionsMenu} />
                              <div ref={actionsMenuRef} style={{ position: 'fixed', top: actionsMenuPosition.top, left: actionsMenuPosition.left, transform: 'translateX(-50%)', zIndex: 9999 }} className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2 relative" onClick={(e) => e.stopPropagation()}>
                                {actionsMenuPlacement === 'bottom' ? (
                                  <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.8)' }} />
                                ) : (
                                  <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.8)' }} />
                                )}
                                <div className="mb-1 px-2 text-xs text-gray-500">Azioni esercizio</div>
                                <div className="space-y-1">
                                  <button onClick={() => { handleEditExercise(leader); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 inline-flex items-center gap-2">
                                    <Edit3 size={14} className="text-gray-700" /> <span>Modifica</span>
                                  </button>
                                  <button onClick={() => { handleCloneExercise(leader.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 inline-flex items-center gap-2">
                                    <Copy size={14} className="text-gray-700" /> <span>Clona esercizio</span>
                                  </button>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                                  <button onClick={() => { handleCloneSuperset(leader.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-purple-50 text-purple-700 inline-flex items-center gap-2">
                                    <Copy size={14} className="text-purple-700" /> <span>Clona superset</span>
                                  </button>
                                  {leader.supersetGroupId ? (
                                    <button onClick={() => {
                                      const updatedExercises = exercises.map(ex => ex.id === leader.id ? { ...ex, supersetGroupId: undefined, isSupersetLeader: false } : ex);
                                      const normalized = normalizeSupersets(updatedExercises);
                                      setExercises(normalized);
                                      if (activeVariantId !== 'original') {
                                        const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, exercises: normalized, updatedAt: new Date().toISOString() } : v);
                                        setVariants(updatedVariants);
                                      } else {
                                        setOriginalExercises(normalized);
                                      }
                                      triggerAutoSave();
                                      closeActionsMenu();
                                    }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-purple-50 text-purple-700 inline-flex items-center gap-2">
                                      <Link2 size={14} className="text-purple-700" /> <span>Rimuovi dal superset</span>
                                    </button>
                                  ) : (
                                    <button onClick={() => { handleStartSuperset(leader.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-purple-50 text-purple-700 inline-flex items-center gap-2">
                                      <Link2 size={14} className="text-purple-700" /> <span>Crea superset</span>
                                    </button>
                                  )}
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <button onClick={() => { handleRemoveExercise(leader.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 inline-flex items-center gap-2">
                                    <Trash2 size={14} className="text-red-700" /> <span>Elimina</span>
                                  </button>
                                </div>
                              </div>
                            </Portal>
                          )}
                        </div>

                        {followers.map((follower, fi) => (
                          <div key={follower.id || `follower-${fi}`}>
                            <div className="my-3 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
                            <div
                                className={`relative p-3 rounded-xl bg-white backdrop-blur-md ring-1 ring-black/10 shadow-sm ${dragOverExerciseIndex === (i + 1 + fi) ? 'ring-2 ring-red-300' : ''} ${draggedExerciseIndex === (i + 1 + fi) ? 'opacity-80' : ''} ${selectedSwapIndex === (i + 1 + fi) ? 'ring-2 ring-blue-300' : ''} ${isSupersetMode && follower.id !== supersetAnchorExerciseId && !follower.supersetGroupId && !follower.isSupersetLeader ? (supersetSelection.includes(follower.id) ? 'ring-2 ring-purple-400' : 'cursor-pointer') : ''} ${openSupersetActionsId === follower.id || openCloneActionsId === follower.id ? 'z-50' : ''}`}
                              onClick={() => { if (exerciseLongPressTriggeredRef.current) return; const selectable = isSupersetMode && follower.id !== supersetAnchorExerciseId && !follower.supersetGroupId && !follower.isSupersetLeader; if (selectable) handleToggleSupersetSelection(follower.id); }}
                              onClickCapture={(e) => { if (exerciseLongPressTriggeredRef.current) { e.preventDefault(); e.stopPropagation(); } }}
                              onDoubleClick={() => { if (canEdit) handleEditExercise(follower); }}
                              onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; setOpenExerciseContextId(follower.id); computeAndSetMenuPosition(e.currentTarget as HTMLElement, 'exercise'); }}
                              onPointerDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!canEdit) return;
                                exerciseLongPressTriggeredRef.current = false;
                                exercisePressStartPosRef.current = { x: e.clientX, y: e.clientY };
                                const anchor = e.currentTarget as HTMLElement;
                                if (exerciseLongPressTimeoutRef.current) clearTimeout(exerciseLongPressTimeoutRef.current);
                                exerciseLongPressTimeoutRef.current = window.setTimeout(() => {
                                  exerciseLongPressTriggeredRef.current = true;
                                  setOpenExerciseContextId(follower.id);
                                  computeAndSetMenuPosition(anchor, 'exercise');
                                }, VARIANT_LONG_PRESS_MS);
                              }}
                              onPointerUp={() => { if (!canEdit) return; if (exerciseLongPressTimeoutRef.current) clearTimeout(exerciseLongPressTimeoutRef.current); setTimeout(() => { exerciseLongPressTriggeredRef.current = false; }, 250); }}
                              onPointerMove={(e) => {
                                if (!canEdit) return;
                                const start = exercisePressStartPosRef.current; if (!start) return;
                                const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y);
                                if (dx > 6 || dy > 6) { if (exerciseLongPressTimeoutRef.current) clearTimeout(exerciseLongPressTimeoutRef.current); exerciseLongPressTriggeredRef.current = false; }
                              }}
                            >
                              <div className="flex justify-center items-center gap-2 mb-1">
                                <span className="font-semibold text-lg text-purple-700">{follower.name}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                                {follower.notes && (
                                  <p className="flex items-center gap-2">
                                    <FileText size={14} className="text-gray-500" />
                                    <span className="font-semibold">Note:</span>
                                    <span>{follower.notes}</span>
                                  </p>
                                )}
                                {follower.sets && (
                                  <p className="flex items-center gap-2">
                                    <Dumbbell size={14} className="text-gray-500" />
                                    {(() => {
                                      const m = (follower.sets || '').match(/(\d+)\s*[xX]\s*([^\s]+)/);
                                      if (m) {
                                        return (
                                          <>
                                            <span className="font-semibold">Serie:</span>
                                            <span>{m[1]}</span>
                                            <div aria-hidden="true" className="mx-1 h-4 w-px bg-gradient-to-b from-transparent via-gray-300/80 to-transparent rounded-full" />
                                            <span className="font-semibold">Ripetizioni:</span>
                                            <span>{m[2]}</span>
                                          </>
                                        );
                                      }
                                      return (
                                        <>
                                          <span className="font-semibold">Serie:</span>
                                          <span>{follower.sets}</span>
                                        </>
                                      );
                                    })()}
                                  </p>
                                )}
                                {follower.intensity && (
                                  <p className="flex items-center gap-2">
                                    <Zap size={14} className="text-gray-500" />
                                    <span className="font-semibold">Intensità:</span>
                                    <span>{follower.intensity}</span>
                                  </p>
                                )}
                                {follower.tut && (
                                  <p className="flex items-center gap-2">
                                    <Timer size={14} className="text-gray-500" />
                                    <span className="font-semibold">TUT:</span>
                                    <span>{follower.tut}</span>
                                  </p>
                                )}
                                {follower.recovery && (
                                  <p className="flex items-center gap-2">
                                    <Clock size={14} className="text-gray-500" />
                                    <span className="font-semibold">Recupero:</span>
                                    <span>{follower.recovery}</span>
                                  </p>
                                )}
                                {follower.videoLink && (
                                  <p className="flex items-center gap-2">
                                    <Video size={14} className="text-gray-500" />
                                    <span className="font-semibold">Video:</span>
                                    <a href={follower.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                      Visualizza
                                    </a>
                                  </p>
                                )}
                              </div>
                          {canEdit && openExerciseContextId === follower.id && actionsMenuType === 'exercise' && actionsMenuPosition && (
                            <Portal>
                              <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} className="bg-black/10" onClick={closeActionsMenu} />
                              <div ref={actionsMenuRef} style={{ position: 'fixed', top: actionsMenuPosition.top, left: actionsMenuPosition.left, transform: 'translateX(-50%)', zIndex: 9999 }} className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2 relative" onClick={(e) => e.stopPropagation()}>
                                {actionsMenuPlacement === 'bottom' ? (
                                  <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.8)' }} />
                                ) : (
                                  <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.8)' }} />
                                )}
                                <div className="mb-1 px-2 text-xs text-gray-500">Azioni esercizio</div>
                                <div className="space-y-1">
                                  <button onClick={() => { handleEditExercise(follower); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 inline-flex items-center gap-2">
                                    <Edit3 size={14} className="text-gray-700" /> <span>Modifica</span>
                                  </button>
                                  <button onClick={() => { handleCloneExercise(follower.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 inline-flex items-center gap-2">
                                    <Copy size={14} className="text-gray-700" /> <span>Clona esercizio</span>
                                  </button>
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                                  <button onClick={() => { handleCloneSuperset(follower.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-purple-50 text-purple-700 inline-flex items-center gap-2">
                                    <Copy size={14} className="text-purple-700" /> <span>Clona superset</span>
                                  </button>
                                  {follower.supersetGroupId ? (
                                    <button onClick={() => {
                                      const updatedExercises = exercises.map(ex => ex.id === follower.id ? { ...ex, supersetGroupId: undefined, isSupersetLeader: false } : ex);
                                      const normalized = normalizeSupersets(updatedExercises);
                                      setExercises(normalized);
                                      if (activeVariantId !== 'original') {
                                        const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, exercises: normalized, updatedAt: new Date().toISOString() } : v);
                                        setVariants(updatedVariants);
                                      } else {
                                        setOriginalExercises(normalized);
                                      }
                                      triggerAutoSave();
                                      closeActionsMenu();
                                    }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-purple-50 text-purple-700 inline-flex items-center gap-2">
                                      <Link2 size={14} className="text-purple-700" /> <span>Rimuovi dal superset</span>
                                    </button>
                                  ) : (
                                    <button onClick={() => { handleStartSuperset(follower.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-purple-50 text-purple-700 inline-flex items-center gap-2">
                                      <Link2 size={14} className="text-purple-700" /> <span>Crea superset</span>
                                    </button>
                                  )}
                                </div>
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <button onClick={() => { handleRemoveExercise(follower.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 inline-flex items-center gap-2">
                                    <Trash2 size={14} className="text-red-700" /> <span>Elimina</span>
                                  </button>
                                </div>
                                  </div>
                                </Portal>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                    i = j - 1;
                    continue;
                  }

                  // Esercizio singolo
                  if (!exercise.supersetGroupId) {
                    rendered.push(
                      <div
                        key={exercise.id || `exercise-${i}`}
                        className={`relative p-4 rounded-2xl bg-white backdrop-blur-md ring-1 ring-black/10 shadow-sm hover:shadow-md transition hover:translate-y-px ${dragOverExerciseIndex === i ? 'ring-2 ring-red-300' : ''} ${draggedExerciseIndex === i ? 'opacity-80' : ''} ${selectedSwapIndex === i ? 'ring-2 ring-blue-300' : ''} ${isSupersetMode && exercise.id !== supersetAnchorExerciseId && !exercise.supersetGroupId && !exercise.isSupersetLeader ? (supersetSelection.includes(exercise.id) ? 'ring-2 ring-purple-400' : 'cursor-pointer') : ''} ${openSupersetActionsId === exercise.id || openCloneActionsId === exercise.id ? 'z-50' : ''}`}
                        onClick={() => { if (exerciseLongPressTriggeredRef.current) return; const selectable = isSupersetMode && exercise.id !== supersetAnchorExerciseId && !exercise.supersetGroupId && !exercise.isSupersetLeader; if (selectable) handleToggleSupersetSelection(exercise.id); }}
                        onClickCapture={(e) => { if (exerciseLongPressTriggeredRef.current) { e.preventDefault(); e.stopPropagation(); } }}
                        onDoubleClick={() => { if (canEdit) handleEditExercise(exercise); }}
                        onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; setOpenExerciseContextId(exercise.id); computeAndSetMenuPosition(e.currentTarget as HTMLElement, 'exercise'); }}
                        onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); if (!canEdit) return; exerciseLongPressTriggeredRef.current = false; exercisePressStartPosRef.current = { x: e.clientX, y: e.clientY }; const anchor = e.currentTarget as HTMLElement; if (exerciseLongPressTimeoutRef.current) clearTimeout(exerciseLongPressTimeoutRef.current); exerciseLongPressTimeoutRef.current = window.setTimeout(() => { exerciseLongPressTriggeredRef.current = true; setOpenExerciseContextId(exercise.id); computeAndSetMenuPosition(anchor, 'exercise'); }, VARIANT_LONG_PRESS_MS); }}
                        onPointerUp={() => { if (!canEdit) return; if (exerciseLongPressTimeoutRef.current) clearTimeout(exerciseLongPressTimeoutRef.current); setTimeout(() => { exerciseLongPressTriggeredRef.current = false; }, 250); }}
                        onPointerMove={(e) => { if (!canEdit) return; const start = exercisePressStartPosRef.current; if (!start) return; const dx = Math.abs(e.clientX - start.x); const dy = Math.abs(e.clientY - start.y); if (dx > 6 || dy > 6) { if (exerciseLongPressTimeoutRef.current) clearTimeout(exerciseLongPressTimeoutRef.current); exerciseLongPressTriggeredRef.current = false; } }}
                        draggable={canEdit}
                        onDragStart={canEdit ? () => handleDragStartIndex(i) : undefined}
                        onDragOver={canEdit ? (e) => handleDragOverIndex(e, i) : undefined}
                        onDrop={canEdit ? () => handleDropOnCard(i) : undefined}
                        onDragEnd={canEdit ? handleDragEndIndex : undefined}
                      >
                        <div className="flex justify-center items-center gap-2 mb-1">
                          <span className={`font-semibold text-lg ${isSupersetMode && supersetSelection.includes(exercise.id) ? 'text-purple-700' : ''}`}>{exercise.name}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-sm">
                          {exercise.notes && (
                            <p className="flex items-center gap-2">
                              <FileText size={14} className="text-gray-500" />
                              <span className="font-semibold">Note:</span>
                              <span>{exercise.notes}</span>
                            </p>
                          )}
                          {exercise.sets && (
                            <p className="flex items-center gap-2">
                              <Dumbbell size={14} className="text-gray-500" />
                              {(() => {
                                const m = (exercise.sets || '').match(/(\d+)\s*[xX]\s*([^\s]+)/);
                                if (m) {
                                  return (
                                    <>
                                      <span className="font-semibold">Serie:</span>
                                      <span>{m[1]}</span>
                                      <div aria-hidden="true" className="mx-1 h-4 w-px bg-gradient-to-b from-transparent via-gray-300/80 to-transparent rounded-full" />
                                      <span className="font-semibold">Ripetizioni:</span>
                                      <span>{m[2]}</span>
                                    </>
                                  );
                                }
                                return (
                                  <>
                                    <span className="font-semibold">Serie:</span>
                                    <span>{exercise.sets}</span>
                                  </>
                                );
                              })()}
                            </p>
                          )}
                          {exercise.intensity && (
                            <p className="flex items-center gap-2">
                              <Zap size={14} className="text-gray-500" />
                              <span className="font-semibold">Intensità:</span>
                              <span>{exercise.intensity}</span>
                            </p>
                          )}
                          {exercise.tut && (
                            <p className="flex items-center gap-2">
                              <Timer size={14} className="text-gray-500" />
                              <span className="font-semibold">TUT:</span>
                              <span>{exercise.tut}</span>
                            </p>
                          )}
                          {exercise.recovery && (
                            <p className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-500" />
                              <span className="font-semibold">Recupero:</span>
                              <span>{exercise.recovery}</span>
                            </p>
                          )}
                          {exercise.videoLink && (
                            <p className="flex items-center gap-2">
                              <Video size={14} className="text-gray-500" />
                              <span className="font-semibold">Video:</span>
                              <a href={exercise.videoLink} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                                Visualizza
                              </a>
                            </p>
                          )}
                        </div>
                        {canEdit && openExerciseContextId === exercise.id && actionsMenuType === 'exercise' && actionsMenuPosition && (
                          <Portal>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} className="bg-black/10" onClick={closeActionsMenu} />
                            <div ref={actionsMenuRef} style={{ position: 'fixed', top: actionsMenuPosition.top, left: actionsMenuPosition.left, transform: 'translateX(-50%)', zIndex: 9999 }} className="z-50 w-56 max-w-[85vw] bg-white/80 backdrop-blur-xl border border-white/30 ring-1 ring-white/20 rounded-2xl shadow-2xl p-2 relative" onClick={(e) => e.stopPropagation()}>
                              {actionsMenuPlacement === 'bottom' ? (
                                <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.8)' }} />
                              ) : (
                                <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.8)' }} />
                              )}
                              <div className="mb-1 px-2 text-xs text-gray-500">Azioni esercizio</div>
                              <div className="space-y-1">
                                <button onClick={() => { handleEditExercise(exercise); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 inline-flex items-center gap-2">
                                  <Edit3 size={14} className="text-gray-700" /> <span>Modifica</span>
                                </button>
                                <button onClick={() => { handleCloneExercise(exercise.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 inline-flex items-center gap-2">
                                  <Copy size={14} className="text-gray-700" /> <span>Clona esercizio</span>
                                </button>
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                                {exercise.isSupersetLeader && (
                                  <button onClick={() => { handleCloneSuperset(exercise.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-purple-50 text-purple-700 inline-flex items-center gap-2">
                                    <Copy size={14} className="text-purple-700" /> <span>Clona superset</span>
                                  </button>
                                )}
                                {exercise.supersetGroupId ? (
                                  <button onClick={() => {
                                    const updatedExercises = exercises.map(ex => ex.id === exercise.id ? { ...ex, supersetGroupId: undefined, isSupersetLeader: false } : ex);
                                    const normalized = normalizeSupersets(updatedExercises);
                                    setExercises(normalized);
                                    if (activeVariantId !== 'original') {
                                      const updatedVariants = variants.map(v => v.id === activeVariantId ? { ...v, exercises: normalized, updatedAt: new Date().toISOString() } : v);
                                      setVariants(updatedVariants);
                                    } else {
                                      setOriginalExercises(normalized);
                                    }
                                    triggerAutoSave();
                                    closeActionsMenu();
                                  }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-purple-50 text-purple-700 inline-flex items-center gap-2">
                                    <Link2 size={14} className="text-purple-700" /> <span>Rimuovi dal superset</span>
                                  </button>
                                ) : (
                                  <button onClick={() => { handleStartSuperset(exercise.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-purple-50 text-purple-700 inline-flex items-center gap-2">
                                    <Link2 size={14} className="text-purple-700" /> <span>Crea superset</span>
                                  </button>
                                )}
                              </div>
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <button onClick={() => { handleRemoveExercise(exercise.id); closeActionsMenu(); }} className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-700 inline-flex items-center gap-2">
                                  <Trash2 size={14} className="text-red-700" /> <span>Elimina</span>
                                </button>
                              </div>
                            </div>
                          </Portal>
                        )}
                      </div>
                    );
                    continue;
                  }
                }
                return rendered;
              })()}
            </div>
          ) : (
            <div className="text-gray-500 text-center py-8">
              <p>Nessun esercizio aggiunto ancora.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Link Generation Modal */}
      <Modal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
        title="Link Scheda Generato"
      >
        <div className="mb-4">
          <input
            type="text"
            value={generatedLink}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
          />
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Copy size={16} />
            <span>Copia</span>
          </button>
          <button
            onClick={() => setShowLinkModal(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Chiudi
          </button>
        </div>
      </Modal>
      
      {/* Confirmation Dialog */}
      <Modal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        title="Conferma Azione"
      >
        <div className="space-y-4">
          <p className="text-gray-700">{confirmMessage}</p>
          <div className="flex space-x-4">
            <button
              onClick={handleConfirmAction}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Conferma
            </button>
            <button
              onClick={() => setShowConfirmDialog(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Annulla
            </button>
          </div>
        </div>
      </Modal>

      {/* Rename Day Modal */}
      <Modal
        isOpen={!!renamingDayKey}
        onClose={handleCancelRenameDay}
        title="Rinomina Allenamento"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={renamingDayName}
            onChange={(e) => setRenamingDayName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Nuovo nome allenamento"
            autoFocus
          />
          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDayName}
              className="px-4 py-2 rounded-full bg-blue-600 text-white ring-1 ring-black/10 shadow-sm hover:bg-blue-700 transition-all"
            >
              Salva
            </button>
            <button
              onClick={handleCancelRenameDay}
              className="px-4 py-2 rounded-full bg-white text-gray-800 ring-1 ring-black/10 shadow-sm hover:bg-gray-100 transition-all"
            >
              Annulla
            </button>
          </div>
        </div>
      </Modal>
      
      {/* Delete Workout Confirmation Dialog */}
      <Modal
        isOpen={showDeleteWorkoutDialog}
        onClose={() => setShowDeleteWorkoutDialog(false)}
        title="Elimina Scheda"
      >
        <div className="flex items-center mb-4">
          <Trash2 className="text-red-500 mr-3" size={24} />
          <h3 className="text-lg font-semibold text-gray-800">Elimina Scheda</h3>
        </div>
        <p className="text-gray-600 mb-2">
          Sei sicuro di voler eliminare la scheda <strong>"{workoutTitle}"</strong>?
        </p>
        <p className="text-sm text-red-600 mb-6">
          ⚠️ Questa azione non può essere annullata. Tutti gli esercizi e le configurazioni verranno persi definitivamente.
        </p>
        <div className="flex space-x-4">
          <button
            onClick={confirmDeleteWorkout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
          >
            <Trash2 size={16} />
            <span>Elimina Definitivamente</span>
          </button>
          <button
            onClick={() => setShowDeleteWorkoutDialog(false)}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            Annulla
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default WorkoutDetailPage;
