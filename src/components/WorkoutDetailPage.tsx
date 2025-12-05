import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Edit3, Plus, Save, Copy, Users, ArrowLeft, ChevronLeft, Eye, X, Trash2, Calendar, Star, CheckCircle, Folder, FileText, ChevronUp, ChevronDown, Tag, Search, Link2, Dumbbell, Zap, Timer, Clock, Video } from 'lucide-react';
import { AVAILABLE_ICONS } from './FolderCustomizer';
import { useWorkoutPlans, useUsers } from '../hooks/useFirestore';
import DB from '../utils/database';
import Portal from './Portal';
import Modal from './Modal';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import useIsStandaloneMobile from '../hooks/useIsStandaloneMobile';
import { authService } from '../services/authService';

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
  
  // Refs
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  const exerciseDropdownRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const isStandaloneMobile = useIsStandaloneMobile();

  // Ruoli utente per gestire permessi di modifica
  const currentUser = authService.getCurrentUser();
  const canEdit = currentUser?.role === 'coach' || currentUser?.role === 'admin';
  
  // Hook Firestore per gestire i piani di allenamento e gli utenti
  const { workoutPlans, loading, error, updateWorkoutPlan } = useWorkoutPlans();
  const { users: athletes, loading: athletesLoading, updateUser } = useUsers();
  
  // Gestione tempo scheda
  const [isEditingDates, setIsEditingDates] = useState(false);
  const [durationWeeks, setDurationWeeks] = useState(4);
  // Stato temporaneo per consentire editing libero (compresa cancellazione)
  const [durationWeeksTemp, setDurationWeeksTemp] = useState('');
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
};

// Rimuovi una settimana (non consentito rimuovere l’ultima)
const handleRemoveWeek = (weekKey: string) => {
  if (weeks.length <= 1) {
    setSaveMessage('Deve esistere almeno una settimana');
    return;
  }
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
    const list = activeVariantId === 'original' ? (newOriginal[activeDayKey] || []) : ((newVariantById[activeVariantId] || {})[activeDayKey] || []);
    setExercises([...list]);
    if (activeVariantId === 'original' && activeDayKey === 'G1') setOriginalExercises([...list]);
  }
  setSaveMessage('Settimana rimossa');
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
  const list = activeVariantId === 'original' ? (newOriginal[activeDayKey] || []) : ((newVariantById[activeVariantId] || {})[activeDayKey] || []);
  setExercises([...list]);
  if (activeVariantId === 'original' && activeDayKey === 'G1') setOriginalExercises([...list]);
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
const [actionsMenuPosition, setActionsMenuPosition] = useState<{ top: number; left: number } | null>(null);
const [actionsMenuType, setActionsMenuType] = useState<'clone' | 'superset' | null>(null);
// Riferimenti e configurazioni per posizionamento dinamico e rifiniture UI
const actionsMenuAnchorElRef = useRef<HTMLElement | null>(null);
const actionsMenuRef = useRef<HTMLDivElement | null>(null);
const [actionsMenuPlacement, setActionsMenuPlacement] = useState<'bottom' | 'top'>('bottom');
const MENU_OFFSET_Y = 8;
const MENU_MARGIN = 8;
const CLONE_MENU_WIDTH = 176; // w-44
const SUPERSET_MENU_WIDTH = 160; // w-40

const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));

const closeActionsMenu = () => {
  setOpenCloneActionsId(null);
  setOpenSupersetActionsId(null);
  setActionsMenuPosition(null);
  setActionsMenuType(null);
  actionsMenuAnchorElRef.current = null;
};

const computeAndSetMenuPosition = (anchor: HTMLElement, type: 'clone' | 'superset') => {
  actionsMenuAnchorElRef.current = anchor;
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const menuWidth = type === 'clone' ? CLONE_MENU_WIDTH : SUPERSET_MENU_WIDTH;
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
  const menuWidth = actionsMenuType === 'clone' ? CLONE_MENU_WIDTH : SUPERSET_MENU_WIDTH;
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
  const [showAthleteDropdown, setShowAthleteDropdown] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState('');
  const [workoutStatus, setWorkoutStatus] = useState<'published' | 'draft'>('draft');
  const [generatedLink, setGeneratedLink] = useState('');
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [variants, setVariants] = useState<WorkoutVariant[]>([]);
  const [activeVariantId, setActiveVariantId] = useState('original');

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
    if (workoutId) {
      try {
        await updateWorkoutPlan(workoutId, { tags: updated, updatedAt: new Date().toISOString() });
      } catch (e) {
        console.error('Errore nel salvataggio dei tag:', e);
      }
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

// Inizializza input temporaneo quando si apre il modal
useEffect(() => {
  if (isEditingDates) {
    setDurationWeeksTemp(String(durationWeeks));
  }
}, [isEditingDates, durationWeeks]);

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
    isOpen: isTagsMenuOpen, 
    openDropdown: openTagsMenu, 
    closeDropdown: closeTagsMenu, 
    toggleDropdown: toggleTagsMenu 
  } = useDropdownPosition({ offset: 0, preferredPosition: 'bottom-left', autoAdjust: true });

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
            status: workoutStatus || 'draft',
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

        if (activeVariantId === 'original' || !variants.length || !variants.find(v => v.id === activeVariantId)) {
          // Se siamo nell'originale, salva gli esercizi nell'originale
          const newOriginalDays = { ...originalDays, [activeDayKey]: [...exercises] };
          updatedOriginalDays = newOriginalDays;
          setOriginalDays(newOriginalDays);
          exercisesToSave = newOriginalDays['G1'] || [];
          // Mantieni le varianti esistenti senza modificarle
          updatedVariants = variants.map(v => ({ ...v, days: (variantDaysById[v.id] || (v as any).days || {}) }));
          console.log('💾 Saving original workout exercises:', exercisesToSave.length);
        } else {
          // Se siamo in una variante esistente, salva gli esercizi nella variante
          const prevVariantDays = variantDaysById[activeVariantId] || {};
          const newVariantDays = { ...prevVariantDays, [activeDayKey]: [...exercises] };
          setVariantDaysById({ ...variantDaysById, [activeVariantId]: newVariantDays });
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
          associatedAthletes,
          status: workoutStatus,
          variants: updatedVariants.map(v => ({
            ...v,
            dayNames: variantDayNamesById[v.id] || (v as any).dayNames || {}
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
  }, [workoutId, workoutTitle, workoutDescription, durationWeeks, exercises, associatedAthletes, workoutStatus, variants, activeVariantId, originalWorkoutTitle, tags, updateWorkoutPlan]);
  
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
              
            // Inizializza mappa giorni originale in modo dinamico (inizialmente solo G1)
            const incomingDays = (workoutData as any).days || {};
            const incomingDayNames = (workoutData as any).dayNames || {};
            const incomingKeys = Object.keys(incomingDays);
            const sortedKeys = incomingKeys.length
              ? incomingKeys.slice().sort((a, b) => {
                  const na = parseInt(String(a).replace(/^G/, ''), 10);
                  const nb = parseInt(String(b).replace(/^G/, ''), 10);
                  return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                })
              : ['G1'];
            const initializedOriginalDays: { [key: string]: Exercise[] } = {};
            sortedKeys.forEach((dk) => {
              const list = dk === 'G1' ? (incomingDays[dk] || exercisesWithValidIds) : (incomingDays[dk] || []);
              initializedOriginalDays[dk] = list;
            });
            // Se non c'erano giorni, assicurati che G1 esista
            if (!initializedOriginalDays['G1']) initializedOriginalDays['G1'] = exercisesWithValidIds;
            setOriginalDays(initializedOriginalDays);
            setOriginalDayNames(incomingDayNames);

              // Gli originalExercises corrispondono sempre a G1
              setOriginalExercises(initializedOriginalDays['G1']);
              console.log('🔒 Original exercises set (G1):', initializedOriginalDays['G1'].length, 'exercises');

              // Carica gli esercizi del giorno attivo (default G1) all'ingresso
              const entryList = initializedOriginalDays[activeDayKey] || [];
              console.log('📥 Loading original day', activeDayKey, 'exercises:', entryList.length);
              setExercises(entryList);
              console.log('✅ Exercises loaded from database for day', activeDayKey, ':', entryList.length);
            } else {
              // Resetta sempre a array vuoto per nuove schede
              setOriginalExercises([]);
              setExercises([]);
              console.log('📝 No exercises found, setting empty array for workout:', workoutId);
            }
            
            // Carica gli atleti associati
            if (workoutData.associatedAthletes) {
              setAssociatedAthletes(workoutData.associatedAthletes);
            }
            
            // Carica lo status
            if (workoutData.status) {
              setWorkoutStatus(workoutData.status);
            }
            
            // Carica i dati della durata
            if (workoutData.durationWeeks) {
              setDurationWeeks(workoutData.durationWeeks);
            }
            
            // Carica le varianti se esistono, ma all'ingresso forziamo la scheda originale attiva
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
                  const incomingVariantDays = (v as any).days || {};
                  const incomingVariantDayNames = (v as any).dayNames || {};
                  const initializedVariantDays: { [key: string]: Exercise[] } = {};
                  const variantKeys = Object.keys(incomingVariantDays).length
                    ? Object.keys(incomingVariantDays)
                    : Object.keys(initializedOriginalDays);
                  const sortedVariantKeys = variantKeys.slice().sort((a, b) => {
                    const na = parseInt(String(a).replace(/^G/, ''), 10);
                    const nb = parseInt(String(b).replace(/^G/, ''), 10);
                    return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                  });
                  sortedVariantKeys.forEach((dk) => {
                    const list = dk === 'G1' ? (incomingVariantDays[dk] || fixedExercises) : (incomingVariantDays[dk] || []);
                    initializedVariantDays[dk] = list;
                  });
                  if (!initializedVariantDays['G1']) initializedVariantDays['G1'] = fixedExercises;
                  return { ...v, isActive: false, exercises: initializedVariantDays['G1'], days: initializedVariantDays, dayNames: incomingVariantDayNames };
                });
                const getNumAsc = (name: string) => { const m = name.match(/Variante (\d+)/); return m ? parseInt(m[1], 10) : Number.MAX_SAFE_INTEGER; };
                const sortedVariants = normalizedVariants.slice().sort((a, b) => getNumAsc(a.name) - getNumAsc(b.name));
                setVariants(sortedVariants);
                // Inizializza mappa giorni locali per le varianti
                const initialVariantDaysById: { [variantId: string]: { [key: string]: Exercise[] } } = {};
                sortedVariants.forEach(v => { if ((v as any).days) initialVariantDaysById[v.id] = (v as any).days as any; });
                setVariantDaysById(initialVariantDaysById);
                const initialVariantDayNamesById: { [variantId: string]: { [key: string]: string } } = {};
                sortedVariants.forEach(v => { if ((v as any).dayNames) initialVariantDayNamesById[v.id] = (v as any).dayNames as any; });
                setVariantDayNamesById(initialVariantDayNamesById);
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
      }
    };
    
    loadWorkoutData();
  }, [workoutId]);
  
  // Auto-save function with debouncing is already defined above

  // Debounced auto-save effect - ora istantaneo
  useEffect(() => {
    // Solo salva se i dati sono stati caricati (evita di salvare durante il caricamento iniziale)
    if (workoutId && originalExercises !== null) {
      console.log('🔄 Auto-save effect triggered - data loaded, proceeding with save');
      autoSave();
    } else {
      console.log('⏳ Auto-save effect triggered - waiting for data to load');
    }
  }, [workoutTitle, workoutDescription, exercises, associatedAthletes, workoutStatus, variants, activeVariantId, autoSave, originalExercises]);

  
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
  
  const handleAssociateAthlete = async (athleteId: string) => {
    if (!workoutId) return;
    if (!associatedAthletes.includes(athleteId)) {
      const target = athletes.find(u => u.id === athleteId);
      const tokensToAdd = [athleteId, target?.email].filter(Boolean) as string[];
      const updatedAthletes = Array.from(new Set([...associatedAthletes, ...tokensToAdd]));
      setAssociatedAthletes(updatedAthletes);
      setShowAthleteDropdown(false);

      setSaveMessage(`Scheda associata a ${target?.name || 'atleta'}`);

      // Trigger auto-save immediately for athlete association
      triggerAutoSave();

      // Notifica la pagina "Le tue schede" di aggiornare la lista
      try { window.dispatchEvent(new Event('kw8:user-workouts:update')); } catch {}

      // Aggiorna il profilo utente con la scheda assegnata
      try {
        if (target) {
          const uniquePlans = Array.from(new Set([...(target.workoutPlans || []), workoutId]));
          await updateUser(athleteId, { workoutPlans: uniquePlans } as any);
        }
      } catch (e) {
        console.error('Errore aggiornando i piani utente:', e);
      }
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
        const filteredPlans = (target.workoutPlans || []).filter(pid => pid !== workoutId);
        await updateUser(athleteId, { workoutPlans: filteredPlans } as any);
      }
      const removedUser = target || athletes.find(u => u.id === athleteId);
      setSaveMessage(`Associazione rimossa da ${removedUser?.name || 'atleta'}`);
    } catch (e) {
      console.error('Errore aggiornando i piani utente (rimozione):', e);
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
    <div>
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

      {/* Sezione giorni verrà posizionata dentro il contenitore, sopra "Esercizi" */}

      <div className={`relative left-1/2 -translate-x-1/2 w-screen rounded-2xl px-4 sm:px-6 lg:px-8 pt-2 pb-6 min-h-[calc(100vh-300px)] border border-gray-200 ${variants.length > 0 ? '' : '-mt-px'} transition-shadow backdrop-blur-sm bg-white/95 ring-1 ring-black/10 shadow-md`} style={{ marginTop: headerOffsetTop }}>

        
        {/* Header Row: Back button + centered Title within card container */}
        <div className="grid grid-cols-[auto_1fr_auto] items-center mb-4">
          <div className="flex justify-start">
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center transition-all duration-300 transform hover:scale-110 p-2 text-red-600 bg-white/60 backdrop-blur-sm rounded-2xl ring-1 ring-black/10 hover:bg-white/80 hover:shadow-sm active:scale-[0.98] shrink-0"
              title="Torna alla Cartella"
            >
              <ChevronLeft size={24} />
            </button>
          </div>
          <div className="min-w-0 flex justify-center flex-col items-center">
            {/* Barra varianti: ora posizionata sopra il titolo */}
            <div className="mb-2">
              <div className="flex justify-center">
                <div
                  ref={variantTabsRef}
                  onPointerDown={handleVariantTabsPointerDown}
                  onPointerMove={handleVariantTabsPointerMove}
                  onPointerUp={handleVariantTabsPointerUp}
                  className={`inline-flex items-center gap-3 bg-white rounded-full shadow-sm ring-1 ring-gray-200 px-4 ${isStandaloneMobile ? 'py-2' : 'py-2.5'} overflow-x-auto overflow-y-visible no-scrollbar select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                  style={{ touchAction: 'pan-x' }}
                >
                  <div className="relative h-10 w-10 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        if (activeVariantId !== 'original') {
                          const currentVariantIndex = variants.findIndex(v => v.id === activeVariantId);
                          if (currentVariantIndex !== -1) {
                            const updatedVariants = [...variants];
                            updatedVariants[currentVariantIndex] = {
                              ...updatedVariants[currentVariantIndex],
                              exercises: [...exercises],
                              updatedAt: new Date().toISOString()
                            };
                            setVariants(updatedVariants.map(v => ({ ...v, isActive: false })));
                          }
                        }
                        setActiveVariantId('original');
                        setExercises(originalExercises ? [...originalExercises] : []);
                      }}
                      className={`${activeVariantId === 'original' ? 'bg-gray-100 text-blue-600 scale-105 ring-1 ring-gray-300' : 'bg-white text-gray-500 hover:bg-gray-50'} h-10 w-10 rounded-full flex items-center justify-center transition-colors transition-transform duration-300 ease-out`}
                      title={`Scheda originale: ${workoutTitle}`}
                      aria-label={`Scheda originale: ${workoutTitle}`}
                    >
                      {React.createElement(FileText, { size: 18, className: activeVariantId === 'original' ? 'text-blue-600' : 'text-gray-500' })}
                    </button>
                  </div>
                  {variants.map((variant, index) => (
                    <div key={variant.id} className="group relative h-10 w-10 flex-shrink-0 overflow-visible">
                      <button
                        onClick={() => { if (!variantLongPressTriggeredRef.current) handleSwitchVariant(variant.id); }}
                        onPointerDown={(e) => {
                          if (!canEdit) return;
                          variantLongPressTriggeredRef.current = false;
                          variantPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                          clearTimeout(variantLongPressTimeoutRef.current!);
                          variantLongPressTimeoutRef.current = setTimeout(() => {
                            variantLongPressTriggeredRef.current = true;
                            setOpenVariantMenuId(variant.id);
                            setActionsMenuPosition({ x: e.clientX, y: e.clientY });
                          }, 450);
                        }}
                        onPointerUp={() => {
                          if (!canEdit) return;
                          clearTimeout(variantLongPressTimeoutRef.current!);
                          variantLongPressTriggeredRef.current = false;
                        }}
                        onPointerMove={(e) => {
                          if (!canEdit) return;
                          const startPos = variantPressStartPosRef.current;
                          if (!startPos) return;
                          const dx = Math.abs(e.clientX - startPos.x);
                          const dy = Math.abs(e.clientY - startPos.y);
                          if (dx > 6 || dy > 6) {
                            clearTimeout(variantLongPressTimeoutRef.current!);
                            variantLongPressTriggeredRef.current = false;
                          }
                        }}
                        onContextMenu={(e) => {
                          if (!canEdit) return;
                          e.preventDefault();
                          setOpenVariantMenuId(variant.id);
                          setActionsMenuPosition({ x: e.clientX, y: e.clientY });
                        }}
                        className={`${activeVariantId === variant.id ? 'bg-gray-100 text-red-600 scale-105 ring-1 ring-gray-300' : 'bg-white text-gray-500 hover:bg-gray-50'} h-10 w-10 rounded-full flex items-center justify-center transition-colors transition-transform duration-300 ease-out`}
                        title={`Variante ${index + 1}: ${variant.name || 'Senza titolo'}`}
                        aria-label={`Variante ${index + 1}: ${variant.name || 'Senza titolo'}`}
                      >
                        {React.createElement(Copy, { size: 18, className: activeVariantId === variant.id ? 'text-red-600' : 'text-gray-500' })}
                      </button>
                      {/* Numero variante sotto icona (più vicino e in grassetto) */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-red-600 text-xs">
                        {index + 1}
                      </div>
                      {/* Menu variante */}
                      {openVariantMenuId === variant.id && actionsMenuPosition && (
                        <Portal>
                          <div>
                            {/* Overlay per chiudere il menu cliccando fuori */}
                            <div
                              className="fixed inset-0 z-[999]"
                              onClick={() => { setOpenVariantMenuId(null); setActionsMenuPosition(null); }}
                            />
                            {/* Menu contestuale */}
                            <div
                              className="fixed z-[1000] bg-white rounded-xl shadow-lg ring-1 ring-black/10 p-2 min-w-[200px]"
                              style={{ left: actionsMenuPosition.x + 8, top: actionsMenuPosition.y + 8 }}
                            >
                              <button
                                onClick={() => { setOpenVariantMenuId(null); handleSwitchVariant(variant.id); }}
                                className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                              >
                                <Eye size={16} className="text-gray-600" />
                                <span>Apri</span>
                              </button>
                              <button
                                onClick={() => { setOpenVariantMenuId(null); handleCloneVariant(variant.id); }}
                                className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                              >
                                <Copy size={16} className="text-gray-700" />
                                <span>Clona</span>
                              </button>
                              {/* Separatore stile Apple */}
                              <div className="my-1 mx-2 h-px bg-gray-200" />
                              <button
                                onClick={() => { setOpenVariantMenuId(null); handleRemoveVariant(variant.id); }}
                                className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2"
                              >
                                <Trash2 size={16} className="text-red-600" />
                                <span>Elimina</span>
                              </button>
                            </div>
                          </div>
                        </Portal>
                      )}
                    </div>
                  ))}
                  {/* Aggiungi Variante */}
                  <div className="relative h-10 w-10 flex-shrink-0">
                    <button
                      onClick={handleAddVariant}
                      className={`h-10 w-10 rounded-full flex items-center justify-center ${canEdit ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 ring-1 ring-blue-300' : 'bg-white text-gray-400 ring-1 ring-gray-200'} transition-colors`}
                      title={canEdit ? 'Aggiungi variante' : 'Solo visualizzazione'}
                      aria-label={canEdit ? 'Aggiungi variante' : 'Solo visualizzazione'}
                      disabled={!canEdit}
                    >
                      {React.createElement(Plus, { size: 18 })}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {isEditingTitle && canEdit ? (
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
            ) : (
              <h1
                className={`text-2xl font-bold ${canEdit ? 'cursor-pointer' : 'cursor-default'} transition-colors truncate text-center ${activeVariantId === 'original' ? 'text-navy-900 hover:text-navy-800' : 'text-red-700 hover:text-red-800'}`}
                onClick={() => { if (!canEdit) return; setIsEditingTitle(true); setTimeout(() => { if (titleInputRef.current) { const input = titleInputRef.current; try { const len = input.value.length; input.setSelectionRange(len, len); } catch {} input.focus(); } }, 0); }}
                title={canEdit ? "Clicca per modificare il titolo" : "Solo visualizzazione"}
              >
                {activeVariantId === 'original' ? workoutTitle : (variants.find(v => v.id === activeVariantId)?.name || '')}
              </h1>
            )}
            {/* Barra varianti inline: Portal rimosso */}
          </div>
          <div className="flex justify-end">
            {/* Placeholder invisibile per mantenere il titolo perfettamente centrato rispetto al contenitore */}
            <div className="p-2 opacity-0 pointer-events-none">
              <ChevronLeft size={20} />
            </div>
          </div>
        </div>

        {/* Editable Description (read-only per atleti) */}
        <div className="flex justify-center items-center mb-6">
          {isEditingDescription && canEdit ? (
            <textarea
              ref={descriptionInputRef}
              value={workoutDescription}
              onChange={(e) => setWorkoutDescription(e.target.value)}
              onFocus={() => { if (isEditingTitle) { handleSaveTitle(); } }}
              onBlur={handleSaveDescription}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSaveDescription()}
              placeholder="Aggiungi una descrizione..."
              className="w-full max-w-2xl border-b-2 border-blue-500 bg-transparent outline-none resize-none text-gray-600 text-center"
              rows={2}
            />
          ) : (
        <div className={`flex items-center gap-2 justify-center ${canEdit ? 'group' : ''}`} onClick={() => { if (!canEdit) return; if (isEditingTitle) { handleSaveTitle(); } setIsEditingDescription(true); setTimeout(() => { if (descriptionInputRef.current) { const ta = descriptionInputRef.current; try { const len = ta.value.length; ta.setSelectionRange(len, len); } catch {} ta.focus(); } }, 0); }} title={canEdit ? "Clicca per modificare la descrizione" : "Solo visualizzazione"}>
              {workoutDescription ? (
          <p className={`text-gray-600 max-w-2xl text-center break-words ${canEdit ? 'transition-colors group-hover:text-blue-600' : ''}`}>{workoutDescription}</p>
              ) : (
                <p className="text-gray-400 italic text-center transition-colors group-hover:text-blue-600">Clicca per aggiungere una descrizione</p>
              )}
              {/* Icona modifica descrizione rimossa: il testo è già cliccabile per modificare */}
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
                    onClick={() => setSelectedTagUnderDesc(tag)}
                    className="px-3 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-xs shadow-sm hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 transition"
                    title="Seleziona tag"
                  >
                    {tag}
                  </button>
                  {selectedTagUnderDesc === tag && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); setSelectedTagUnderDesc(null); }}
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-white border border-gray-200 text-red-500 hover:text-red-700 shadow-sm"
                      aria-label="Rimuovi"
                      title="Rimuovi"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Toolbar - visibile solo per coach/admin */}
        {canEdit && (
        <div className="flex justify-center mb-8">
          <div ref={toolbarRef} className="relative w-full flex justify-center px-0 -mx-6 sm:mx-0">
            <div className="flex flex-nowrap justify-center gap-2 p-2.5 bg-white/90 rounded-xl shadow-sm border border-gray-200 backdrop-blur-sm w-full">
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
                  className="bg-white/95 rounded-md shadow-sm ring-1 ring-gray-200 w-9 h-9 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:shadow-md shrink-0"
                >
                  <Plus size={18} className="text-green-600" />
                </button>
              
              {/* Duration Selector */}
              <button
                onClick={() => setIsEditingDates(!isEditingDates)}
                title="Durata"
                aria-label="Durata"
                className="bg-white/95 rounded-md shadow-sm ring-1 ring-gray-200 w-9 h-9 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:shadow-md shrink-0"
              >
                <Calendar size={18} className="text-blue-600" />
              </button>

              {/* Tags button */}
              <div className="relative">
                <button
                  onClick={(e) => toggleTagsMenu(e)}
                  title="Tag"
                  aria-label="Tag"
                  className="bg-white/95 rounded-md shadow-sm ring-1 ring-gray-200 w-9 h-9 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:shadow-md shrink-0"
                >
                  <Tag size={18} className="text-purple-600" />
                </button>
                <Modal
                  isOpen={isTagsMenuOpen}
                  onClose={() => { closeTagsMenu(); setShowGymTagsList(false); setShowTagsDropdown(false); }}
                  title="Gestisci Tag"
                >
                  {/* Contenuto diretto del Modal senza contenitori aggiuntivi */}
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
                                onClick={() => handleAddTag(t)}
                                className="w-full text-left px-3 py-1.5 rounded-full hover:bg-white/70 hover:text-purple-700 transition-all duration-150 text-xs"
                                disabled={tags.includes(t) || tags.length >= 10}
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
                                onClick={() => handleAddTag(t)}
                                className={`w-full text-left px-3 py-1.5 text-xs rounded-full hover:bg-white/70 hover:text-purple-700 transition-all duration-150 ${tags.includes(t) ? 'opacity-60 cursor-not-allowed flex justify-between' : ''}`}
                                disabled={tags.includes(t) || tags.length >= 10}
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
                </Modal>
              </div>
              
              {/* Clone Workout */}
              <button
                onClick={handleCloneWorkout}
                title="Clona"
                aria-label="Clona"
                className="bg-white/95 rounded-md shadow-sm ring-1 ring-gray-200 w-9 h-9 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:shadow-md shrink-0"
              >
                <Copy size={18} className="text-red-600" />
              </button>
              
              {/* Workout Status */}
              <button
                onClick={() => {
                  const prev = workoutStatus;
                  const next = prev === 'published' ? 'draft' : 'published';
                  setWorkoutStatus(next);
                  updateWorkoutPlan(workoutId, { status: next })
                    .then(() => {
                      setSaveMessage(next === 'published' ? 'Scheda pubblicata' : 'Scheda impostata in bozza');
                    })
                    .catch((err) => {
                      console.error('Errore aggiornando lo status:', err);
                      setWorkoutStatus(prev);
                    });
                }}
                title={workoutStatus === 'published' ? 'Pubblicata' : 'Bozza'}
                aria-label={workoutStatus === 'published' ? 'Pubblicata' : 'Bozza'}
                className="bg-white/95 rounded-md shadow-sm ring-1 ring-gray-200 w-9 h-9 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:shadow-md shrink-0"
              >
                <div className={`w-3 h-3 rounded-full ${
                  workoutStatus === 'published' ? 'bg-green-400' : 'bg-yellow-400'
                }`}></div>
              </button>
              
              {/* Associate Athlete */}
              <button
                onClick={() => setShowAthleteDropdown(!showAthleteDropdown)}
                title="Associa"
                aria-label="Associa"
                className="bg-white/95 rounded-md shadow-sm ring-1 ring-gray-200 w-9 h-9 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:shadow-md shrink-0"
              >
                <Users size={18} className="text-purple-600" />
              </button>
              
              {/* View Associated Athletes */}
              <button
                onClick={() => setShowAthletesList(!showAthletesList)}
                title="Visualizza"
                aria-label="Visualizza"
                className="bg-white/95 rounded-md shadow-sm ring-1 ring-gray-200 w-9 h-9 flex items-center justify-center cursor-pointer transition hover:bg-gray-50 hover:shadow-md shrink-0"
              >
                <Eye size={18} className="text-indigo-600" />
              </button>
            </div>
          </div>
        </div>
        )}
        
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
        
        {/* Associate Athlete Modal */}
        <Modal
          isOpen={showAthleteDropdown}
          onClose={() => setShowAthleteDropdown(false)}
          title="Associa atleta"
        >
          <div className="p-2">
            <input
              type="text"
              placeholder="Cerca atleta..."
              className="w-full px-3 py-2 rounded-lg bg-white/80 border border-gray-200 ring-1 ring-black/10 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              value={athleteSearchQuery}
              onChange={(e) => setAthleteSearchQuery(e.target.value)}
            />
          </div>
          <div className="max-h-40 overflow-y-auto">
            {athletesLoading ? (
              <div className="p-4 text-gray-500 text-center">Caricamento atleti...</div>
            ) : filteredAthletes.length === 0 ? (
              <div className="p-4 text-gray-500 text-center">Nessun atleta disponibile</div>
            ) : (
              filteredAthletes.map((athlete) => {
                const isAssociated = associatedAthletes.includes(athlete.id);
                return (
                  <div
                    key={athlete.id}
                    className={`flex items-center justify-between px-4 py-2 transition-colors ${isAssociated ? 'bg-green-50' : 'hover:bg-gray-100'}`}
                  >
                    <button
                      type="button"
                      onClick={() => isAssociated ? handleRemoveAthlete(athlete.id) : handleAssociateAthlete(athlete.id)}
                      className="flex-1 text-left"
                    >
                      <div>
                        <div className={`font-medium ${isAssociated ? 'text-green-700' : ''}`}>{athlete.name}</div>
                        <div className="text-sm text-gray-500">{athlete.email}</div>
                      </div>
                    </button>
                    {isAssociated ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 ring-1 ring-green-200">
                          <CheckCircle size={14} />
                          Associato
                        </span>
                        <button
                          onClick={() => handleRemoveAthlete(athlete.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Rimuovi associazione"
                          aria-label="Rimuovi associazione"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAssociateAthlete(athlete.id)}
                        className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 ring-1 ring-blue-200"
                        title="Associa scheda"
                        aria-label="Associa scheda"
                      >
                        Associa
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Modal>
        
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
                const found = athletes.find(u => u.id === athleteIdOrName || u.name === athleteIdOrName);
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
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white/95 border border-gray-200 rounded-xl ring-1 ring-gray-300 shadow-md z-10 max-h-48 overflow-y-auto backdrop-blur-sm">
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Serie x Ripetizioni</label>
                <div className="flex items-center gap-2">
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
                  <span className="text-gray-500 font-medium">x</span>
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
        
        {/* Sezione Giorni: sotto la toolbar varianti, sopra "Esercizi" */}
        <div className="mb-6">
          <div className="flex justify-center items-center gap-2">
            <div
              ref={dayTabsRef}
              onPointerDown={handleDayTabsPointerDown}
              onPointerMove={handleDayTabsPointerMove}
              onPointerUp={handleDayTabsPointerUp}
              onPointerCancel={handleDayTabsPointerCancel}
              onPointerLeave={handleDayTabsPointerLeave}
              className={`inline-flex items-center gap-2 bg-white rounded-full shadow-sm ring-1 ring-gray-200 px-5 py-2.5 overflow-x-auto no-scrollbar select-none ${isDraggingDays ? 'cursor-grabbing' : 'cursor-grab'} max-w-[85vw]`}
              style={{ touchAction: 'pan-x' }}
            >
              {(() => {
                const dayKeysToRender = (() => {
                  const keys = activeVariantId === 'original'
                    ? Object.keys(originalDays)
                    : Object.keys(variantDaysById[activeVariantId] || {});
                  const sorted = (keys.length ? keys : ['G1']).slice().sort((a, b) => {
                    const na = parseInt(String(a).replace(/^G/, ''), 10);
                    const nb = parseInt(String(b).replace(/^G/, ''), 10);
                    return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                  });
                  return sorted;
                })();
                return dayKeysToRender.map((dk, idx) => {
                  const label = getDayDisplayName(dk);
                  return (
                    <div key={dk} className="group relative flex-shrink-0 overflow-visible">
                      <button
                        onClick={() => { if (!dayLongPressTriggeredRef.current) handleSwitchDay(dk); }}
                        onPointerDown={(e) => {
                          if (!canEdit) return;
                          dayLongPressTriggeredRef.current = false;
                          dayPressStartPosRef.current = { x: e.clientX, y: e.clientY };
                          if (dayPressTimerRef.current) { window.clearTimeout(dayPressTimerRef.current); }
                          dayPressTimerRef.current = window.setTimeout(() => {
                            dayLongPressTriggeredRef.current = true;
                            computeAndSetDayMenuPosition(e.currentTarget as HTMLElement);
                            setOpenDayKeyMenu(dk);
                          }, DAY_LONG_PRESS_MS);
                        }}
                        onPointerMove={(e) => {
                          const start = dayPressStartPosRef.current;
                          if (!start) return;
                          const dx = Math.abs(e.clientX - start.x);
                          const dy = Math.abs(e.clientY - start.y);
                          if (dx > 5 || dy > 5) {
                            if (dayPressTimerRef.current) { window.clearTimeout(dayPressTimerRef.current); dayPressTimerRef.current = null; }
                          }
                        }}
                        onPointerUp={() => {
                          if (dayPressTimerRef.current) { window.clearTimeout(dayPressTimerRef.current); dayPressTimerRef.current = null; }
                        }}
                        onPointerCancel={() => {
                          if (dayPressTimerRef.current) { window.clearTimeout(dayPressTimerRef.current); dayPressTimerRef.current = null; }
                        }}
                        onPointerLeave={() => {
                          if (dayPressTimerRef.current) { window.clearTimeout(dayPressTimerRef.current); dayPressTimerRef.current = null; }
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          if (!canEdit) return;
                          computeAndSetDayMenuPosition(e.currentTarget as HTMLElement);
                          setOpenDayKeyMenu(dk);
                        }}
                        className={`day-tab-button ${activeDayKey === dk ? 'bg-gray-100 text-blue-600 ring-1 ring-gray-300' : 'bg-white text-gray-600 hover:bg-gray-50'} h-8 px-3 rounded-full text-sm font-medium transition-colors`}
                        data-day-key={dk}
                        title={label}
                        aria-label={label}
                      >
                        {label}
                      </button>
                      {canEdit && openDayKeyMenu === dk && dayMenuPosition && (
                        <Portal>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} className="bg-black/10" onClick={closeDayMenu} />
                          <div
                            ref={dayMenuRef}
                            style={{ position: 'fixed', top: dayMenuPosition.top, left: dayMenuPosition.left, transform: 'translateX(-50%)', zIndex: 9999 }}
                            className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-40 relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {dayMenuPlacement === 'bottom' ? (
                              <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.95)' }} />
                            ) : (
                              <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.95)' }} />
                            )}
                            <button
                              onClick={() => { handleStartRenameDay(dk); }}
                              className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                            >
                              <Edit3 size={14} />
                              <span>Modifica</span>
                            </button>
                            <div className="my-1 border-t border-gray-200" />
                            <button
                              onClick={() => { handleRemoveDay(dk); closeDayMenu(); }}
                              disabled={dk === 'G1'}
                              className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50 flex items-center gap-2"
                            >
                              <Trash2 size={14} className="text-red-600" />
                              <span>Elimina</span>
                            </button>
                          </div>
                        </Portal>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            {canEdit && (
              <button
                onClick={handleAddDay}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-white text-gray-600 hover:bg-gray-50 ring-1 ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Aggiungi giorno"
                aria-label="Aggiungi giorno"
                disabled={(() => {
                  const keys = activeVariantId === 'original' ? Object.keys(originalDays) : Object.keys(variantDaysById[activeVariantId] || {});
                  const count = keys.length > 0 ? keys.length : 1; // fallback G1
                  return count >= 10;
                })()}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Barra Settimane: sotto le giornate, prima degli esercizi */}
        <div className="mb-6">
          <div className="flex justify-center items-center gap-2">
            <div className={`inline-flex items-center gap-2 bg-white rounded-full shadow-sm ring-1 ring-gray-200 px-5 py-2 overflow-x-auto no-scrollbar select-none max-w-[85vw]`}>
              {(() => {
                const weekKeysToRender = weeks.slice().sort((a, b) => {
                  const na = parseInt(a.replace(/^W/, ''), 10);
                  const nb = parseInt(b.replace(/^W/, ''), 10);
                  return (isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb);
                });
                return weekKeysToRender.map((wk) => (
                  <div key={wk} className="group relative flex-shrink-0 overflow-visible">
                    <button
                      onClick={() => handleSwitchWeek(wk)}
                      onContextMenu={(e) => { e.preventDefault(); if (!canEdit) return; setOpenWeekKeyMenu(wk); setWeekActionsPosition({ x: e.clientX, y: e.clientY }); }}
                      className={`${activeWeekKey === wk ? 'bg-gray-100 text-blue-600 ring-1 ring-gray-300' : 'bg-white text-gray-600 hover:bg-gray-50'} h-8 px-3 rounded-full text-sm font-medium transition-colors`}
                      title={`Settimana ${parseInt(wk.replace('W',''), 10)}`}
                      aria-label={`Settimana ${parseInt(wk.replace('W',''), 10)}`}
                    >
                      {`Settimana ${parseInt(wk.replace('W',''), 10)}`}
                    </button>
                    {canEdit && openWeekKeyMenu === wk && weekActionsPosition && (
                      <Portal>
                        <div>
                          {/* Overlay per chiudere cliccando fuori */}
                          <div className="fixed inset-0 z-[999]" onClick={() => { setOpenWeekKeyMenu(null); setWeekActionsPosition(null); }} />
                          {/* Menu contestuale settimane */}
                          <div
                            className="fixed z-[1000] bg-white rounded-xl shadow-lg ring-1 ring-black/10 p-2 min-w-[200px]"
                            style={{ left: weekActionsPosition.x + 8, top: weekActionsPosition.y + 8 }}
                          >
                            <button
                              onClick={() => { setOpenWeekKeyMenu(null); handleSwitchWeek(wk); }}
                              className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800 flex items-center gap-2"
                            >
                              <Eye size={16} className="text-gray-600" />
                              <span>Apri</span>
                            </button>
                            {/* Separatore stile Apple */}
                            <div className="my-1 mx-2 h-px bg-gray-200" />
                            <button
                              onClick={() => { setOpenWeekKeyMenu(null); handleRemoveWeek(wk); }}
                              className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-2"
                            >
                              <Trash2 size={16} className="text-red-600" />
                              <span>Elimina</span>
                            </button>
                          </div>
                        </div>
                      </Portal>
                    )}
                  </div>
                ));
              })()}
            </div>
            {canEdit && (
              <button
                onClick={handleAddWeek}
                className="h-8 w-8 flex items-center justify-center rounded-full bg-white text-gray-600 hover:bg-gray-50 ring-1 ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Aggiungi settimana"
                aria-label="Aggiungi settimana"
                disabled={weeks.length >= 12}
              >
                <Plus size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Exercises List */}
        <div className="mb-8">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-pink-600 to-blue-600 tracking-tight">Esercizi</h3>
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
                        className={`relative p-4 rounded-2xl bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-md ring-1 ring-purple-300 shadow-sm hover:shadow-md transition hover:translate-y-px`}
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
                            className={`relative p-3 rounded-xl bg-white/80 backdrop-blur-md ring-1 ring-black/10 shadow-sm ${dragOverExerciseIndex === i ? 'ring-2 ring-red-300' : ''} ${draggedExerciseIndex === i ? 'opacity-80' : ''} ${selectedSwapIndex === i ? 'ring-2 ring-blue-300' : ''} ${isSupersetMode && leader.id !== supersetAnchorExerciseId && !leader.supersetGroupId && !leader.isSupersetLeader ? (supersetSelection.includes(leader.id) ? 'ring-2 ring-purple-400' : 'cursor-pointer') : ''} ${openSupersetActionsId === leader.id || openCloneActionsId === leader.id ? 'z-50' : ''}`}
                          onClick={() => { const selectable = isSupersetMode && leader.id !== supersetAnchorExerciseId && !leader.supersetGroupId && !leader.isSupersetLeader; if (selectable) handleToggleSupersetSelection(leader.id); }}
                            onDoubleClick={() => { if (canEdit) handleEditExercise(leader); }}
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
                                <span className="font-semibold">S x R:</span>
                                <span>{(() => { const m = (leader.sets || '').match(/(\d+)\s*[xX]\s*([^\s]+)/); return m ? `${m[1]} x ${m[2]}` : leader.sets; })()}</span>
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
                          {canEdit && (
                          <div className="mt-4 flex justify-center items-center gap-2">
                            <button
                              onClick={() => handleEditExercise(leader)}
                              className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                              title="Modifica"
                              aria-label="Modifica"
                            >
                              <Edit3 size={14} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                const newId = openCloneActionsId === leader.id ? null : leader.id;
                                setOpenCloneActionsId(newId);
                                if (newId) {
                                  computeAndSetMenuPosition(e.currentTarget as HTMLElement, 'clone');
                                } else {
                                  closeActionsMenu();
                                }
                              }}
                                className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                title="Clona"
                                aria-label="Clona"
                              >
                                <Copy size={14} />
                              </button>
                              {canEdit && openCloneActionsId === leader.id && actionsMenuType === 'clone' && actionsMenuPosition && (
                                <Portal>
                                  <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} className="bg-black/10" onClick={closeActionsMenu} />
                                  <div ref={actionsMenuRef} style={{ position: 'fixed', top: actionsMenuPosition.top, left: actionsMenuPosition.left, transform: 'translateX(-50%)', zIndex: 9999 }} className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-44 relative" onClick={(e) => e.stopPropagation()}>
                                    {actionsMenuPlacement === 'bottom' ? (
                                      <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.95)' }} />
                                    ) : (
                                      <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.95)' }} />
                                    )}
                                    <button
                                      onClick={() => { handleCloneExercise(leader.id); closeActionsMenu(); }}
                                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                    >
                                      Clona esercizio
                                    </button>
                                    <button
                                      onClick={() => { handleCloneSuperset(leader.id); closeActionsMenu(); }}
                                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                    >
                                      Clona superset
                                    </button>
                                  </div>
                                </Portal>
                              )}
                            </div>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  if (leader.supersetGroupId) {
                                    const newId = openSupersetActionsId === leader.id ? null : leader.id;
                                    setOpenSupersetActionsId(newId);
                                    if (newId) {
                                      computeAndSetMenuPosition(e.currentTarget as HTMLElement, 'superset');
                                    } else {
                                      closeActionsMenu();
                                    }
                                  } else {
                                    handleStartSuperset(leader.id);
                                  }
                                }}
                                className={`p-1 ${isSupersetMode && supersetAnchorExerciseId === leader.id ? 'text-purple-700' : 'text-purple-600'} hover:text-purple-700 transition-colors`}
                                title="Superset"
                                aria-label="Superset"
                              >
                                <Link2 size={14} />
                              </button>
                              {canEdit && openSupersetActionsId === leader.id && actionsMenuType === 'superset' && actionsMenuPosition && (
                                <Portal>
                                  <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} className="bg-black/10" onClick={closeActionsMenu} />
                                  <div ref={actionsMenuRef} style={{ position: 'fixed', top: actionsMenuPosition.top, left: actionsMenuPosition.left, transform: 'translateX(-50%)', zIndex: 9999 }} className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-40 relative" onClick={(e) => e.stopPropagation()}>
                                    {actionsMenuPlacement === 'bottom' ? (
                                      <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.95)' }} />
                                    ) : (
                                      <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.95)' }} />
                                    )}
                                    <button
                                      onClick={() => { setIsSupersetMode(true); setSupersetAnchorExerciseId(leader.id); setSupersetSelection([]); closeActionsMenu(); }}
                                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                    >
                                      Collega un esercizio al superset
                                    </button>
                                    <button
                                      onClick={() => {
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
                                        setOpenSupersetActionsId(null);
                                        setActionsMenuPosition(null);
                                        setActionsMenuType(null);
                                      }}
                                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                    >
                                      Rimuovi dal superset
                                    </button>
                                  </div>
                                </Portal>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveExercise(leader.id)}
                              className="p-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Elimina"
                              aria-label="Elimina"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          )}
                        </div>

                        {followers.map((follower, fi) => (
                          <div key={follower.id || `follower-${fi}`}>
                            <div className="my-3 h-px bg-gradient-to-r from-transparent via-purple-200 to-transparent" />
                            <div
                                className={`relative p-3 rounded-xl bg-white/80 backdrop-blur-md ring-1 ring-black/10 shadow-sm ${dragOverExerciseIndex === (i + 1 + fi) ? 'ring-2 ring-red-300' : ''} ${draggedExerciseIndex === (i + 1 + fi) ? 'opacity-80' : ''} ${selectedSwapIndex === (i + 1 + fi) ? 'ring-2 ring-blue-300' : ''} ${isSupersetMode && follower.id !== supersetAnchorExerciseId && !follower.supersetGroupId && !follower.isSupersetLeader ? (supersetSelection.includes(follower.id) ? 'ring-2 ring-purple-400' : 'cursor-pointer') : ''} ${openSupersetActionsId === follower.id || openCloneActionsId === follower.id ? 'z-50' : ''}`}
                              onClick={() => { const selectable = isSupersetMode && follower.id !== supersetAnchorExerciseId && !follower.supersetGroupId && !follower.isSupersetLeader; if (selectable) handleToggleSupersetSelection(follower.id); }}
                              onDoubleClick={() => { if (canEdit) handleEditExercise(follower); }}
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
                                    <span className="font-semibold">S x R:</span>
                                    <span>{(() => { const m = (follower.sets || '').match(/(\d+)\s*[xX]\s*([^\s]+)/); return m ? `${m[1]} x ${m[2]}` : follower.sets; })()}</span>
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
                              {canEdit && (
                              <div className="mt-4 flex justify-center items-center gap-2">
                                <button
                                  onClick={() => handleEditExercise(follower)}
                                  className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                                  title="Modifica"
                                  aria-label="Modifica"
                                >
                                  <Edit3 size={14} />
                                </button>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      if (!follower.supersetGroupId && !follower.isSupersetLeader) {
                                        handleCloneExercise(follower.id);
                                        closeActionsMenu();
                                        return;
                                      }
                                      const newId = openCloneActionsId === follower.id ? null : follower.id;
                                      setOpenCloneActionsId(newId);
                                      if (newId) {
                                        computeAndSetMenuPosition(e.currentTarget as HTMLElement, 'clone');
                                      } else {
                                        closeActionsMenu();
                                      }
                                    }}
                                    className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                    title="Clona"
                                    aria-label="Clona"
                                  >
                                    <Copy size={14} />
                                  </button>
                                  {canEdit && openCloneActionsId === follower.id && actionsMenuType === 'clone' && actionsMenuPosition && (
                                    <Portal>
                                      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} className="bg-black/10" onClick={closeActionsMenu} />
                                      <div ref={actionsMenuRef} style={{ position: 'fixed', top: actionsMenuPosition.top, left: actionsMenuPosition.left, transform: 'translateX(-50%)', zIndex: 9999 }} className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-44 relative" onClick={(e) => e.stopPropagation()}>
                                        {actionsMenuPlacement === 'bottom' ? (
                                          <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.95)' }} />
                                        ) : (
                                          <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.95)' }} />
                                        )}
                                        <button
                                          onClick={() => { handleCloneExercise(follower.id); closeActionsMenu(); }}
                                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                        >
                                          Clona esercizio
                                        </button>
                                        <button
                                          onClick={() => { handleCloneSuperset(follower.id); closeActionsMenu(); }}
                                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                        >
                                          Clona superset
                                        </button>
                                      </div>
                                    </Portal>
                                  )}
                                </div>
                                <div className="relative">
                                  <button
                                    onClick={(e) => {
                                      if (follower.supersetGroupId) {
                                        const newId = openSupersetActionsId === follower.id ? null : follower.id;
                                        setOpenSupersetActionsId(newId);
                                        if (newId) {
                                          computeAndSetMenuPosition(e.currentTarget as HTMLElement, 'superset');
                                        } else {
                                          closeActionsMenu();
                                        }
                                      } else {
                                        handleStartSuperset(follower.id);
                                      }
                                    }}
                                    className={`p-1 ${isSupersetMode && supersetAnchorExerciseId === follower.id ? 'text-purple-700' : 'text-purple-600'} hover:text-purple-700 transition-colors`}
                                    title="Superset"
                                    aria-label="Superset"
                                  >
                                    <Link2 size={14} />
                                  </button>
                                  {canEdit && openSupersetActionsId === follower.id && actionsMenuType === 'superset' && actionsMenuPosition && (
                                    <Portal>
                                      <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} className="bg-black/10" onClick={closeActionsMenu} />
                                      <div ref={actionsMenuRef} style={{ position: 'fixed', top: actionsMenuPosition.top, left: actionsMenuPosition.left, transform: 'translateX(-50%)', zIndex: 9999 }} className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-40 relative" onClick={(e) => e.stopPropagation()}>
                                        {actionsMenuPlacement === 'bottom' ? (
                                          <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.95)' }} />
                                        ) : (
                                          <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.95)' }} />
                                        )}
                                        <button
                                          onClick={() => { if (follower.supersetGroupId) { setIsSupersetMode(true); setSupersetAnchorExerciseId(follower.supersetGroupId); setSupersetSelection([]); closeActionsMenu(); } }}
                                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                        >
                                          Collega un esercizio al superset
                                        </button>
                                        <button
                                          onClick={() => {
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
                                            setOpenSupersetActionsId(null);
                                            setActionsMenuPosition(null);
                                            setActionsMenuType(null);
                                          }}
                                          className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                        >
                                          Rimuovi dal superset
                                        </button>
                                      </div>
                                    </Portal>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleRemoveExercise(follower.id)}
                                  className="p-1 text-red-600 hover:text-red-700 transition-colors"
                                  title="Elimina"
                                  aria-label="Elimina"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
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
                        className={`relative p-4 rounded-2xl bg-gradient-to-br from-white/70 to-white/50 backdrop-blur-md ring-1 ring-black/10 shadow-sm hover:shadow-md transition hover:translate-y-px ${dragOverExerciseIndex === i ? 'ring-2 ring-red-300' : ''} ${draggedExerciseIndex === i ? 'opacity-80' : ''} ${selectedSwapIndex === i ? 'ring-2 ring-blue-300' : ''} ${isSupersetMode && exercise.id !== supersetAnchorExerciseId && !exercise.supersetGroupId && !exercise.isSupersetLeader ? (supersetSelection.includes(exercise.id) ? 'ring-2 ring-purple-400' : 'cursor-pointer') : ''} ${openSupersetActionsId === exercise.id || openCloneActionsId === exercise.id ? 'z-50' : ''}`}
                        onClick={() => { const selectable = isSupersetMode && exercise.id !== supersetAnchorExerciseId && !exercise.supersetGroupId && !exercise.isSupersetLeader; if (selectable) handleToggleSupersetSelection(exercise.id); }}
                        onDoubleClick={() => { if (canEdit) handleEditExercise(exercise); }}
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
                              <span className="font-semibold">S x R:</span>
                              <span>{(() => { const m = (exercise.sets || '').match(/(\d+)\s*[xX]\s*([^\s]+)/); return m ? `${m[1]} x ${m[2]}` : exercise.sets; })()}</span>
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
                        {canEdit && (
                        <div className="mt-4 flex justify-center items-center gap-2">
                          <button
                            onClick={() => handleEditExercise(exercise)}
                            className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
                            title="Modifica"
                            aria-label="Modifica"
                          >
                            <Edit3 size={14} />
                          </button>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                              if (!exercise.supersetGroupId && !exercise.isSupersetLeader) {
                                handleCloneExercise(exercise.id);
                                closeActionsMenu();
                                return;
                              }
                              const newId = openCloneActionsId === exercise.id ? null : exercise.id;
                              setOpenCloneActionsId(newId);
                              if (newId) {
                                computeAndSetMenuPosition(e.currentTarget as HTMLElement, 'clone');
                              } else {
                                closeActionsMenu();
                              }
                            }}
                              className="p-1 text-red-600 hover:text-red-700 transition-colors"
                              title="Clona"
                              aria-label="Clona"
                            >
                              <Copy size={14} />
                            </button>
                            {canEdit && openCloneActionsId === exercise.id && actionsMenuType === 'clone' && actionsMenuPosition && (
                              <Portal>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} className="bg-black/10" onClick={closeActionsMenu} />
                                <div ref={actionsMenuRef} style={{ position: 'fixed', top: actionsMenuPosition.top, left: actionsMenuPosition.left, transform: 'translateX(-50%)', zIndex: 9999 }} className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-44 relative" onClick={(e) => e.stopPropagation()}>
                                  {actionsMenuPlacement === 'bottom' ? (
                                    <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.95)' }} />
                                  ) : (
                                    <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.95)' }} />
                                  )}
                                  <button
                                    onClick={() => { handleCloneExercise(exercise.id); closeActionsMenu(); }}
                                    className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                  >
                                    Clona esercizio
                                  </button>
                                  {exercise.isSupersetLeader && (
                                    <button
                                      onClick={() => { handleCloneSuperset(exercise.id); closeActionsMenu(); }}
                                      className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                    >
                                      Clona superset
                                    </button>
                                  )}
                                </div>
                              </Portal>
                            )}
                          </div>
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                if (exercise.supersetGroupId) {
                                  const newId = openSupersetActionsId === exercise.id ? null : exercise.id;
                                  setOpenSupersetActionsId(newId);
                                  if (newId) {
                                    computeAndSetMenuPosition(e.currentTarget as HTMLElement, 'superset');
                                  } else {
                                    closeActionsMenu();
                                  }
                                } else {
                                  handleStartSuperset(exercise.id);
                                }
                              }}
                              className={`p-1 ${isSupersetMode && supersetAnchorExerciseId === exercise.id ? 'text-purple-700' : 'text-purple-600'} hover:text-purple-700 transition-colors`}
                              title="Superset"
                              aria-label="Superset"
                            >
                              <Link2 size={14} />
                            </button>
                            {canEdit && openSupersetActionsId === exercise.id && actionsMenuType === 'superset' && actionsMenuPosition && (
                              <Portal>
                                <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }} className="bg-black/10" onClick={closeActionsMenu} />
                                <div ref={actionsMenuRef} style={{ position: 'fixed', top: actionsMenuPosition.top, left: actionsMenuPosition.left, transform: 'translateX(-50%)', zIndex: 9999 }} className="bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 w-40 relative" onClick={(e) => e.stopPropagation()}>
                                  {actionsMenuPlacement === 'bottom' ? (
                                    <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid rgba(255,255,255,0.95)' }} />
                                  ) : (
                                    <div style={{ position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid rgba(255,255,255,0.95)' }} />
                                  )}
                                  <button
                                    onClick={() => {
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
                                      setOpenSupersetActionsId(null);
                                      setActionsMenuPosition(null);
                                      setActionsMenuType(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-sm rounded-lg hover:bg-gray-50 text-gray-800"
                                  >
                                    Rimuovi dal superset
                                  </button>
                                </div>
                              </Portal>
                            )}
                          </div>
                          <button
                            onClick={() => handleRemoveExercise(exercise.id)}
                            className="p-1 text-red-600 hover:text-red-700 transition-colors"
                            title="Elimina"
                            aria-label="Elimina"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
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
              <p className="text-sm mt-2">Clicca su "Aggiungi Esercizio" per iniziare.</p>
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
        <p className="text-gray-700 mb-6 font-sfpro">{confirmMessage}</p>
        <div className="flex items-center gap-3">
          <button
            onClick={handleConfirmAction}
            className="px-4 py-2 rounded-full bg-red-500 text-white ring-1 ring-black/10 shadow-sm hover:bg-red-600 transition-all"
          >
            Conferma
          </button>
          <button
            onClick={() => setShowConfirmDialog(false)}
            className="px-4 py-2 rounded-full bg-white text-gray-800 ring-1 ring-black/10 shadow-sm hover:bg-gray-100 transition-all"
          >
            Annulla
          </button>
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
