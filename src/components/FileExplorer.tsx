import React, { useState, useEffect, useRef } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Grid3X3,
  List,
  Plus,
  MoreVertical,
  Download,
  Edit3,
  Trash2,
  Link,
  ChevronRight,
  ChevronDown,
  Users,
  Calendar,
  Target,
  Palette,
  Search,
  Filter,
  SlidersHorizontal,
  ArrowLeft,
  Menu,
  CheckCircle,
  Ban,
  Copy,
  X,
  Tag
} from 'lucide-react';
import Portal from './Portal';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import { useWorkoutPlans } from '../hooks/useFirestore';
import DB, { WorkoutPlan, WorkoutFolder, WorkoutVariant } from '../utils/database';
import FolderCustomizer, { AVAILABLE_ICONS, AVAILABLE_COLORS } from './FolderCustomizer';
import WorkoutCustomizer from './WorkoutCustomizer';
import WorkoutDetailPage from './WorkoutDetailPage';
import Modal from './Modal';

interface FileExplorerProps {
  currentUser: any;
}

type ViewMode = 'list' | 'grid';

interface FolderTreeItem {
  id: string;
  name: string;
  type: 'folder' | 'file';
  icon?: string;
  color?: string;
  parentId?: string;
  children?: FolderTreeItem[];
  workoutCount?: number;
  subfolderCount?: number;
  isExpanded?: boolean;
  data?: WorkoutPlan | WorkoutFolder;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ currentUser }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>(undefined);
  const [folderTree, setFolderTree] = useState<FolderTreeItem[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<{ id?: string; name: string }[]>([{ name: 'Home' }]);

  const { position, triggerRef, dropdownRef, openDropdown, closeDropdown, isOpen } = useDropdownPosition({ offset: 6, preferredPosition: 'bottom-left' });

// Riferimenti e logica per auto-scroll e drag-to-scroll del breadcrumb
const breadcrumbNavRef = useRef<HTMLElement | null>(null);
const isDraggingBreadcrumbRef = useRef(false);
const startXRef = useRef(0);
const scrollLeftStartRef = useRef(0);

const onBreadcrumbMouseDown = (e: React.MouseEvent<HTMLElement>) => {
  const container = breadcrumbNavRef.current;
  if (!container) return;
  isDraggingBreadcrumbRef.current = true;
  startXRef.current = e.clientX;
  scrollLeftStartRef.current = container.scrollLeft;
};

const onBreadcrumbMouseMove = (e: React.MouseEvent<HTMLElement>) => {
  if (!isDraggingBreadcrumbRef.current) return;
  e.preventDefault();
  const container = breadcrumbNavRef.current;
  if (!container) return;
  const dx = e.clientX - startXRef.current;
  container.scrollLeft = scrollLeftStartRef.current - dx;
};

const onBreadcrumbMouseUp = () => {
  isDraggingBreadcrumbRef.current = false;
};

const onBreadcrumbMouseLeave = () => {
  isDraggingBreadcrumbRef.current = false;
};

const onBreadcrumbTouchStart = (e: React.TouchEvent<HTMLElement>) => {
  const container = breadcrumbNavRef.current;
  if (!container) return;
  isDraggingBreadcrumbRef.current = true;
  startXRef.current = e.touches[0].clientX;
  scrollLeftStartRef.current = container.scrollLeft;
};

const onBreadcrumbTouchMove = (e: React.TouchEvent<HTMLElement>) => {
  if (!isDraggingBreadcrumbRef.current) return;
  const container = breadcrumbNavRef.current;
  if (!container) return;
  const dx = e.touches[0].clientX - startXRef.current;
  container.scrollLeft = scrollLeftStartRef.current - dx;
};

const onBreadcrumbTouchEnd = () => {
  isDraggingBreadcrumbRef.current = false;
};

// Auto-scroll all'ultimo elemento del breadcrumb quando cambia
useEffect(() => {
  const container = breadcrumbNavRef.current;
  if (!container) return;
  container.scrollTo({ left: container.scrollWidth, behavior: 'smooth' });
}, [breadcrumb]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'folder' | 'workout'>('folder');
  const [showEditModal, setShowEditModal] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<FolderTreeItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FolderTreeItem | null>(null);
  const [showToolbarDropdown, setShowToolbarDropdown] = useState(false);
const [showFiltersSubmenu, setShowFiltersSubmenu] = useState(false);
const [showSortSubmenu, setShowSortSubmenu] = useState(false);
const [sortOptions, setSortOptions] = useState({ folders: 'name' as 'name' | 'date', workouts: 'name' as 'name' | 'date' });
  
  // Hook Firestore per gestire i piani di allenamento
  const { workoutPlans, loading, error, createWorkoutPlan, updateWorkoutPlan, deleteWorkoutPlan, refetch } = useWorkoutPlans();
  
  // Hook per il posizionamento del menu toolbar
  const {
    position: toolbarPosition,
    isOpen: isToolbarOpen,
    triggerRef: toolbarTriggerRef,
    dropdownRef: toolbarDropdownRef,
    toggleDropdown: toggleToolbarDropdown,
    closeDropdown: closeToolbarDropdown
  } = useDropdownPosition({
    preferredPosition: 'bottom-right',
    offset: 8,
    autoAdjust: true
  });

  const [draggedItem, setDraggedItem] = useState<FolderTreeItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const dropInProgressRef = useRef(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [showWorkoutDetail, setShowWorkoutDetail] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // Toast animato stile "Apple"
  const [isToastVisible, setIsToastVisible] = useState(false);
  const [isToastExiting, setIsToastExiting] = useState(false);
  const toastExitTimeoutRef = useRef<number | null>(null);
  const toastHideTimeoutRef = useRef<number | null>(null);

  const showToast = (message: string, duration = 3000) => {
    // Pulisci eventuali timeout precedenti
    if (toastExitTimeoutRef.current) { clearTimeout(toastExitTimeoutRef.current); toastExitTimeoutRef.current = null; }
    if (toastHideTimeoutRef.current) { clearTimeout(toastHideTimeoutRef.current); toastHideTimeoutRef.current = null; }
    // Mostra toast con animazione di entrata
    setToastMessage(message);
    setIsToastVisible(true);
    setIsToastExiting(false);
    // Avvia animazione di uscita poco prima di nascondere
    toastExitTimeoutRef.current = window.setTimeout(() => {
      setIsToastExiting(true);
    }, Math.max(200, duration - 250));
    // Nascondi definitivamente dopo la durata
    toastHideTimeoutRef.current = window.setTimeout(() => {
      setIsToastVisible(false);
      setIsToastExiting(false);
      setToastMessage(null);
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (toastExitTimeoutRef.current) { clearTimeout(toastExitTimeoutRef.current); }
      if (toastHideTimeoutRef.current) { clearTimeout(toastHideTimeoutRef.current); }
    };
  }, []);
  
  // Stati per ricerca e filtraggio
  const [searchTerm, setSearchTerm] = useState('');
  // Suggerimenti ricerca intelligente (come nella ricerca esercizi)
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);
  // Variante da attivare all'apertura (se la selezione viene da un suggerimento di variante)
  const [initialActiveVariantId, setInitialActiveVariantId] = useState<string | undefined>(undefined);
  // Stati globali per ricerca annidata su tutte le cartelle e schede
  const [allFolders, setAllFolders] = useState<WorkoutFolder[]>([]);
  const [allWorkouts, setAllWorkouts] = useState<WorkoutPlan[]>([]);
  const [filters, setFilters] = useState({
    showFolders: false,
    showWorkouts: false,
    sortBy: 'name' as 'name' | 'date'
  });

  // Funzione per contare schede e sottocartelle
  const getFolderCounts = (folderId: string, allFolders: WorkoutFolder[], allWorkouts: WorkoutPlan[]) => {
    const subfolders = allFolders.filter(folder => folder.parentId === folderId);
    const workouts = allWorkouts.filter(workout => workout.folderId === folderId);
    
    // Conta ricorsivamente tutte le schede nelle sottocartelle
    const countWorkoutsRecursive = (folderIds: string[]): number => {
      let count = 0;
      folderIds.forEach(id => {
        count += allWorkouts.filter(workout => workout.folderId === id).length;
        const childFolders = allFolders.filter(folder => folder.parentId === id);
        if (childFolders.length > 0) {
          count += countWorkoutsRecursive(childFolders.map(f => f.id));
        }
      });
      return count;
    };

    // Conta ricorsivamente tutte le sottocartelle discendenti
    const countSubfoldersRecursive = (folderIds: string[]): number => {
      let count = 0;
      folderIds.forEach(id => {
        const childFolders = allFolders.filter(folder => folder.parentId === id);
        count += childFolders.length;
        if (childFolders.length > 0) {
          count += countSubfoldersRecursive(childFolders.map(f => f.id));
        }
      });
      return count;
    };
    
    const totalWorkouts = workouts.length + countWorkoutsRecursive(subfolders.map(f => f.id));
    const totalSubfolders = subfolders.length + countSubfoldersRecursive(subfolders.map(f => f.id));
    
    return {
      subfolders: totalSubfolders,
      workouts: totalWorkouts
    };
  };

  const loadFolderContent = async (forceFresh?: boolean) => {
    try {
      const folders = await DB.getWorkoutFolders();
      const allWorkoutPlans = forceFresh ? await DB.getWorkoutPlans() : (workoutPlans || await DB.getWorkoutPlans());

      // Aggiorna stati globali per la ricerca annidata
      setAllFolders(folders);
      setAllWorkouts(allWorkoutPlans);

      console.log('🔍 FileExplorer Debug - loadFolderContent:');
      console.log('📁 Folders loaded:', folders);
      console.log('💪 Workout plans loaded:', allWorkoutPlans);
      console.log('📍 Current folder ID:', currentFolderId);

      // Filtra cartelle e schede per la cartella corrente
      const currentFolders = folders.filter(folder => folder.parentId === currentFolderId);
      // Includi schede senza cartella quando siamo nella root (currentFolderId === undefined)
      const currentWorkouts = allWorkoutPlans.filter(plan => 
        plan.folderId === currentFolderId || 
        (currentFolderId === undefined && (plan.folderId === undefined || plan.folderId === null))
      );

      console.log('📂 Current folders filtered:', currentFolders);
      console.log('🏋️ Current workouts filtered:', currentWorkouts);

      // Crea gli elementi dell'albero
      const treeItems: FolderTreeItem[] = [
        // Cartelle
        ...currentFolders.map(folder => {
          const counts = getFolderCounts(folder.id, folders, allWorkoutPlans);
          
          return {
            id: folder.id,
            name: folder.name,
            type: 'folder' as const,
            icon: folder.icon,
            parentId: folder.parentId,
            workoutCount: counts.workouts,
            subfolderCount: counts.subfolders,
            isExpanded: folder.isExpanded,
            data: folder
          };
        }),
        // Schede di allenamento
        ...currentWorkouts.map(workout => ({
          id: workout.id,
          name: workout.name,
          type: 'file' as const,
          parentId: workout.folderId,
          data: workout
        }))
      ];

      console.log('🌳 Tree items created:', treeItems);
      setFolderTree(treeItems);
    } catch (error) {
      console.error('❌ Error loading folder content:', error);
    }
  };

  useEffect(() => {
    loadFolderContent();
  }, [currentFolderId, workoutPlans]);
  
  // Mostra loading se i dati stanno caricando
  if (loading) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento schede di allenamento...</p>
        </div>
      </div>
    );
  }
  
  // Mostra errore se c'è un problema
  if (error) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">Errore nel caricamento dei dati</p>
          <button 
            onClick={() => loadFolderContent()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  // Funzioni drag & drop
  const handleDragStart = (e: React.DragEvent, item: FolderTreeItem) => {
    setDraggedItem(item);
    try {
      // Alcuni browser richiedono setData per abilitare il drop
      e.dataTransfer.setData('application/json', JSON.stringify({ id: item.id, type: item.type }));
      e.dataTransfer.setData('text/plain', item.id);
    } catch {}
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    // Determina se il drop è proibito per cartelle: nella stessa cartella (parent) o su sé stessa
    let dropEffect: 'none' | 'move' = 'move';
    if (draggedItem?.type === 'folder') {
      const draggedFolder = draggedItem.data as WorkoutFolder;
      const prevParentId = draggedFolder.parentId ?? null;
      if (targetId === draggedItem.id || targetId === prevParentId) {
        dropEffect = 'none';
      }
    }
    e.dataTransfer.dropEffect = dropEffect;
    if (dragOverItem !== targetId) {
      setDragOverItem(targetId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropInProgressRef.current) return;
    dropInProgressRef.current = true;
    setDragOverItem(null);
    
    if (!draggedItem) { dropInProgressRef.current = false; return; }
    
    try {
      if (draggedItem.type === 'folder') {
        // Evita spostamenti non validi: dentro sé stessa o una sua sottocartella
        if (targetFolderId === draggedItem.id) {
          return;
        }
        if (targetFolderId) {
          const folders = await DB.getWorkoutFolders();
          let currentId: string | null = targetFolderId;
          let isTargetDescendant = false;
          while (currentId) {
            if (currentId === draggedItem.id) { isTargetDescendant = true; break; }
            const current = folders.find(f => f.id === currentId);
            currentId = current?.parentId ?? null;
          }
          if (isTargetDescendant) {
            alert('Non puoi spostare una cartella dentro sé stessa o una sua sottocartella.');
            return;
          }
        }
        // Sposta cartella
        const folder = draggedItem.data as WorkoutFolder;
        const prevParentId = folder.parentId ?? null;
        const newParentId = targetFolderId ?? null;
        // Impedisci trasferimento nella stessa cartella
        if ((newParentId ?? null) === (prevParentId ?? null)) {
          return;
        }
        await DB.saveWorkoutFolder({ ...folder, parentId: targetFolderId });
        // Aggiornamento ottimistico: rimuovi la cartella dalla vista corrente se cambia directory
        if (prevParentId === (currentFolderId ?? null) && newParentId !== (currentFolderId ?? null)) {
          setFolderTree(prev => prev.filter(i => i.id !== folder.id));
        }
        // Notifica successo
        showToast('Cartella spostata con successo', 2500);
        await loadFolderContent(true);
      } else {
        // Sposta scheda
        const workout = draggedItem.data as WorkoutPlan;
        const prevFolderId = (workout.folderId ?? null);
        const newFolderId = (targetFolderId ?? null);
        // Impedisci trasferimento nella stessa cartella
        if ((newFolderId ?? null) === (prevFolderId ?? null)) {
          return;
        }
        await updateWorkoutPlan(workout.id, { folderId: targetFolderId ?? null });
        // Aggiornamento ottimistico: rimuovi la scheda dalla vista corrente se cambia directory
        if (prevFolderId === (currentFolderId ?? null) && newFolderId !== (currentFolderId ?? null)) {
          setFolderTree(prev => prev.filter(i => i.id !== workout.id));
        }
        // Notifica successo
        showToast('Scheda spostata con successo', 2500);
        // Assicura che la vista usi i piani aggiornati
        await refetch();
        await loadFolderContent(true);
      }
      
      setDraggedItem(null);
    } catch (error) {
      console.error('Errore durante lo spostamento:', error);
    } finally {
      dropInProgressRef.current = false;
    }
  };

  const navigateToFolder = async (folderId?: string, folderName?: string) => {
    setCurrentFolderId(folderId);
    
    if (folderId) {
      const folder = await DB.getWorkoutFolderById(folderId);
      if (folder) {
        // Costruisci il breadcrumb
        const newBreadcrumb = [...breadcrumb];
        if (!newBreadcrumb.find(b => b.id === folderId)) {
          newBreadcrumb.push({ id: folderId, name: folder.name });
        }
        setBreadcrumb(newBreadcrumb);
      }
    } else {
      setBreadcrumb([{ name: 'Home' }]);
    }
    
    // Non chiamare loadFolderContent() qui - sarà chiamato automaticamente dal useEffect
    // quando currentFolderId cambia, evitando il doppio caricamento
  };

  const navigateToBreadcrumb = (index: number) => {
    const newBreadcrumb = breadcrumb.slice(0, index + 1);
    setBreadcrumb(newBreadcrumb);
    
    const targetFolder = newBreadcrumb[newBreadcrumb.length - 1];
    setCurrentFolderId(targetFolder.id);
  };

  // Funzione per filtrare e ordinare gli elementi
  const getFilteredAndSortedItems = () => {
    let filtered = folderTree.filter(item => {
      // Filtro per tipo - se entrambi sono deselezionati, mostra tutto
      if (!filters.showFolders && !filters.showWorkouts) {
        // Mostra tutto quando nessun filtro è selezionato
      } else {
        if (!filters.showFolders && item.type === 'folder') return false;
        if (!filters.showWorkouts && item.type === 'file') return false;
      }
      
      // Filtro per ricerca (intelligente: include nome variante delle schede)
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const nameMatch = item.name.toLowerCase().includes(q);
        if (nameMatch) return true;
        if (item.type === 'file' && item.data && 'variants' in item.data) {
          const workout = item.data as WorkoutPlan;
          const variants = workout.variants || [];
          const variantMatch = variants.some(v => (v.name || '').toLowerCase().includes(q));
          if (variantMatch) return true;
        }
        return false;
      }
      
      return true;
    });

    // Ordinamento: applica criteri separati per Cartelle e Schede
    const sortByCriterion = (arr: FolderTreeItem[], criterion: 'name' | 'date') => {
      return arr.slice().sort((a, b) => {
        if (criterion === 'name') {
          const aName = a.name || '';
          const bName = b.name || '';
          return aName.localeCompare(bName);
        }
        // 'date' => ordina per data di creazione, più recente prima
        const aDate = a.data && 'createdAt' in a.data ? (a.data as any).createdAt : '';
        const bDate = b.data && 'createdAt' in b.data ? (b.data as any).createdAt : '';
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
    };

    const folders = filtered.filter(item => item.type === 'folder');
    const workoutsItems = filtered.filter(item => item.type === 'file');

    const sortedFolders = sortByCriterion(folders, sortOptions.folders);
    const sortedWorkouts = sortByCriterion(workoutsItems, sortOptions.workouts);

    // Combina mantenendo le categorie separate: Cartelle prima, poi Schede
    filtered = [...sortedFolders, ...sortedWorkouts];

    return filtered;
  };

  // Ricerca intelligente: suggerimenti dinamici per cartelle, schede e varianti (globale, annidata)
  const getSmartSearchSuggestions = () => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [] as Array<{ type: 'folder' | 'workout' | 'variant'; id: string; workoutId?: string; label: string; parentLabel?: string }>;

    const suggestions: Array<{ type: 'folder' | 'workout' | 'variant'; id: string; workoutId?: string; label: string; parentLabel?: string }> = [];

    // Cerca tra tutte le cartelle
    allFolders.forEach(folder => {
      if ((folder.name || '').toLowerCase().includes(query)) {
        suggestions.push({ type: 'folder', id: folder.id, label: folder.name });
      }
    });

    // Cerca tra tutte le schede e le loro varianti
    allWorkouts.forEach(workout => {
      const workoutName = (workout.name || '').toLowerCase();
      if (workoutName.includes(query)) {
        suggestions.push({ type: 'workout', id: workout.id, label: workout.name });
      }
      const variants = workout.variants || [];
      variants.forEach(v => {
        const vName = (v.name || '').toLowerCase();
        if (vName.includes(query)) {
          suggestions.push({ type: 'variant', id: v.id, workoutId: workout.id, label: v.name || '', parentLabel: workout.name || '' });
        }
      });
    });

    // Limita il numero di suggerimenti per evitare liste troppo lunghe
    return suggestions.slice(0, 12);
  };

  const handleItemClick = (item: FolderTreeItem) => {
    if (item.type === 'folder') {
      navigateToFolder(item.id, item.name);
    } else {
      // Apri scheda di allenamento
      setSelectedWorkoutId(item.id);
      setShowWorkoutDetail(true);
    }
  };

  const handleCloseWorkoutDetail = async () => {
    setShowWorkoutDetail(false);
    setSelectedWorkoutId(null);
    setInitialActiveVariantId(undefined);
    
    // Ricarica i dati per mostrare le modifiche aggiornate
    console.log('🔄 FileExplorer: Reloading data after workout detail close...');
    await refetch();
  };


  const generateUniqueName = async (baseName: string, type: 'folder' | 'workout', parentId?: string): Promise<string> => {
    const folders = await DB.getWorkoutFolders();
    const allWorkoutPlans = workoutPlans || await DB.getWorkoutPlans();
    
    let existingNames: string[] = [];
    
    if (type === 'folder') {
      // Ottieni i nomi delle cartelle nella stessa directory
      existingNames = folders
        .filter(folder => folder.parentId === parentId)
        .map(folder => folder.name);
    } else {
      // Ottieni i nomi delle schede nella stessa directory
      existingNames = allWorkoutPlans
        .filter(plan => plan.folderId === parentId || (parentId === undefined && (plan.folderId === undefined || plan.folderId === null)))
        .map(plan => plan.name);
    }
    
    // Se il nome base non esiste, restituiscilo
    if (!existingNames.includes(baseName)) {
      return baseName;
    }
    
    // Altrimenti, trova il primo numero disponibile
    let counter = 1;
    let uniqueName = `${baseName} ${counter}`;
    
    while (existingNames.includes(uniqueName)) {
      counter++;
      uniqueName = `${baseName} ${counter}`;
    }
    
    return uniqueName;
  };

  const createNewItem = async (type: 'folder' | 'workout', name: string, icon?: string, color?: string, variants?: WorkoutVariant[]) => {
    const now = new Date().toISOString();
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Genera un nome unico
      const uniqueName = await generateUniqueName(name, type, currentFolderId);
      
      if (type === 'folder') {
        const newFolder: WorkoutFolder = {
          id,
          name: uniqueName,
          icon: icon || 'Folder',
          color: color || '#EF4444',
          parentId: currentFolderId,
          order: folderTree.filter(item => item.type === 'folder').length,
          createdAt: now,
          updatedAt: now,
          isExpanded: false
        };
        await DB.saveWorkoutFolder(newFolder);
        // Ricarica immediatamente dopo la creazione della cartella
        await loadFolderContent();
        // Toast creazione cartella
        showToast('Cartella creata con successo', 2500);
      } else {
        const newWorkoutData = {
          id, // Usa l'ID generato qui
          name: uniqueName,
          description: '',
          coach: currentUser?.name || 'Coach',
          startDate: now,
          duration: 30,
          exercises: [],
          category: 'strength' as const,
          status: 'draft' as const,
          mediaFiles: { images: [], videos: [], audio: [] },
          tags: [],
          order: folderTree.filter(item => item.type === 'file').length,
          difficulty: 1,
          targetMuscles: [],
          folderId: currentFolderId,
          color: color || '#3B82F6',
          variants: variants || [],
          createdAt: now,
          updatedAt: now
        };
        await createWorkoutPlan(newWorkoutData);
        // Non serve chiamare loadFolderContent() qui perché createWorkoutPlan 
        // già ricarica i dati tramite fetchPlans() nel hook useWorkoutPlans
        // Toast creazione scheda
        showToast('Scheda creata con successo', 2500)
      }


      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating new item:', error);
    }
  };

  const deleteItem = async (itemId: string, itemType: 'folder' | 'file') => {
    try {
      if (itemType === 'folder') {
        await DB.deleteWorkoutFolder(itemId);
        await loadFolderContent(); // Ricarica per le cartelle
      } else {
        await deleteWorkoutPlan(itemId);
        // Non serve chiamare loadFolderContent() perché deleteWorkoutPlan già ricarica i dati
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleEdit = async (
    item: FolderTreeItem,
    updates: { name: string; icon?: string; color?: string }
  ) => {
    try {
      if (item.type === 'folder' && item.data && 'icon' in item.data) {
        const now = new Date().toISOString();
        const updatedFolder: WorkoutFolder = {
          ...(item.data as WorkoutFolder),
          name: updates.name ?? item.name,
          icon: updates.icon ?? (item.data as any).icon ?? 'Folder',
          color: updates.color ?? (item.data as any).color ?? '#EF4444',
          updatedAt: now
        };
        await DB.saveWorkoutFolder(updatedFolder);
        await loadFolderContent(); // Ricarica per le cartelle
        // Toast modifica cartella
        showToast('Cartella aggiornata', 2500);
      } else if (item.type === 'file' && item.data && 'name' in item.data) {
        const newName = updates.name ?? item.name;
        const newColor = updates.color ?? (item.data as any).color ?? '#3B82F6';
        await updateWorkoutPlan(item.id, { name: newName, color: newColor });
        // Non serve chiamare loadFolderContent() perché updateWorkoutPlan già ricarica i dati
        // Toast modifica scheda
        showToast('Scheda aggiornata', 2500);
      }
      
      setShowEditModal(false);
      setItemToEdit(null);
    } catch (error) {
      console.error('Error editing item:', error);
    }
  };

  const handleDelete = async (item: FolderTreeItem) => {
    try {
      if (item.type === 'folder') {
        // Elimina ricorsivamente tutte le sottocartelle e schede
        const folders = await DB.getWorkoutFolders();
        const allWorkouts = workoutPlans || await DB.getWorkoutPlans();
        
        const deleteRecursive = async (folderId: string) => {
          const subfolders = folders.filter(f => f.parentId === folderId);
          const folderWorkouts = allWorkouts.filter(w => w.folderId === folderId);
          
          // Elimina tutte le schede in questa cartella
          for (const workout of folderWorkouts) {
            await deleteWorkoutPlan(workout.id);
          }
          
          // Elimina ricorsivamente le sottocartelle
          for (const subfolder of subfolders) {
            await deleteRecursive(subfolder.id);
            await DB.deleteWorkoutFolder(subfolder.id);
          }
        };
        
        await deleteRecursive(item.id);
        await DB.deleteWorkoutFolder(item.id);
        await loadFolderContent(); // Ricarica solo per le cartelle
        // Toast eliminazione cartella
        showToast('Cartella eliminata con successo', 2500);
      } else if (item.type === 'file') {
        await deleteWorkoutPlan(item.id);
        // Non chiamare loadFolderContent() perché deleteWorkoutPlan già ricarica i dati
        // Toast eliminazione scheda
        showToast('Scheda eliminata con successo', 2500);
      }
      
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const handleDownload = (item: FolderTreeItem) => {
    // Implementazione placeholder per il download
    if (item.type === 'folder') {
      alert(`Download cartella "${item.name}" come ZIP - Funzionalità in sviluppo`);
    } else {
      alert(`Download scheda "${item.name}" - Funzionalità in sviluppo`);
    }
  };

  const handleGenerateLink = (item: FolderTreeItem) => {
    if (item.type === 'workout') {
      const link = `${window.location.origin}/workout/${item.id}`;
      navigator.clipboard.writeText(link);
      alert(`Link copiato negli appunti: ${link}`);
    }
  };

  const FolderIcon = ({ item }: { item: FolderTreeItem }) => {
    if (item.type === 'folder' && item.data && 'icon' in item.data) {
      const iconData = AVAILABLE_ICONS.find(icon => icon.name === item.data.icon);
      if (iconData) {
        const IconComponent = iconData.component;
        return <IconComponent size={20} />;
      }
    }
    
    if (item.type === 'folder') {
      return item.isExpanded ? <FolderOpen size={20} /> : <Folder size={20} />;
    }
    return <FileText size={20} />;
  };

  const ItemCard = ({ item }: { item: FolderTreeItem }) => {
    const isDragOver = dragOverItem === item.id;
    const isDragging = draggedItem?.id === item.id;
    const isForbidden = ((): boolean => {
      if (item.type !== 'folder') return false;
      if (!draggedItem) return false;
      if (draggedItem.type === 'file') {
        const plan: any = draggedItem.data as any;
        return ((plan?.folderId ?? null) === (item.id ?? null));
      }
      if (draggedItem.type === 'folder') {
        const folder: any = draggedItem.data as any;
        return ((draggedItem.id === item.id) || ((folder?.parentId ?? null) === (item.id ?? null)));
      }
      return false;
    })();
    
    // Hook separato per il posizionamento del menu di ogni elemento
    const {
      position: itemMenuPosition,
      isOpen: isItemMenuOpen,
      triggerRef: itemMenuTriggerRef,
      dropdownRef: itemMenuDropdownRef,
      toggleDropdown: toggleItemMenu
    } = useDropdownPosition({
      preferredPosition: 'bottom-right',
      offset: 8,
      autoAdjust: true
    });
    
    const handleItemMenuClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      toggleItemMenu();
    };
    
    const handleCardClick = (e: React.MouseEvent) => {
      // Previeni il click se si sta cliccando sul menu o sui suoi elementi
      if ((e.target as HTMLElement).closest('.menu-button') || 
          (e.target as HTMLElement).closest('.dropdown-menu')) {
        return;
      }
      // Singolo click non apre più la scheda/cartella (richiesto doppio click)
    };
    
    const handleCardDoubleClick = (e: React.MouseEvent) => {
      // Previeni il doppio click se si sta cliccando sul menu o sui suoi elementi
      if ((e.target as HTMLElement).closest('.menu-button') || 
          (e.target as HTMLElement).closest('.dropdown-menu')) {
        return;
      }
      handleItemClick(item);
    };
    
    return (
      <div 
          className={`group relative rounded-xl border border-gray-200 transition-colors duration-200 ease-in-out cursor-pointer 
            ${isDragOver ? (isForbidden ? 'ring-2 ring-red-500 bg-red-100/80 shadow-lg' : 'ring-2 ring-red-300 bg-red-50/70 shadow-lg') : 'ring-1 ring-gray-300 hover:ring-gray-400 hover:shadow-lg'} 
            ${item.type === 'folder' ? 'bg-white/70' : 'bg-white/80'} backdrop-blur-sm`}
          data-item-type={item.type}
          data-folder-id={item.type === 'folder' ? item.id : undefined}
          onDoubleClick={handleCardDoubleClick}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragEnd={() => { setDragOverItem(null); }}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); if (dragOverItem !== item.id) { setDragOverItem(item.id); } }}
          onDragOver={(e) => item.type === 'folder' ? handleDragOver(e, item.id) : (e.preventDefault(), e.stopPropagation(), (e.dataTransfer.dropEffect = 'none'))}
          onDragLeave={() => { if (dragOverItem === item.id) setDragOverItem(null); }}
          onDrop={(e) => item.type === 'folder' ? (e.preventDefault(), e.stopPropagation(), handleDrop(e, item.id)) : (e.preventDefault(), e.stopPropagation())}
        >
        {/* Overlay divieto quando il drop è proibito sulla cartella */}
        {item.type === 'folder' && isDragOver && isForbidden && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-start justify-end p-3">
            <div className="flex items-center gap-2 bg-red-600 text-white rounded-full px-3 py-1 shadow-lg ring-1 ring-red-700/50">
              <Ban size={16} />
              <span className="text-xs font-semibold">Divieto</span>
            </div>
          </div>
        )}
        <div className="p-4">
          {/* Header con icona e nome */}
          <div className="flex items-center space-x-3 mb-2">
            <div 
              className="p-2.5 rounded-xl ring-1 ring-gray-200 backdrop-blur-sm"
              style={{
                backgroundColor: item.type === 'folder'
                  ? (((item.data && 'color' in item.data) ? ((item.data as any).color === '#3B82F6' ? '#EF4444' : (item.data as any).color) : '#EF4444') + '20')
                  : (((item.data && 'color' in item.data) ? (item.data as any).color : '#3B82F6') + '20'),
                color: item.type === 'folder'
                  ? ((item.data && 'color' in item.data) ? (((item.data as any).color === '#3B82F6') ? '#EF4444' : (item.data as any).color) : '#EF4444')
                  : ((item.data && 'color' in item.data) ? (item.data as any).color : '#3B82F6')
              }}
            >
              <FolderIcon item={item} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900/90 tracking-tight truncate">
                {item.name}
              </h3>
              {item.type === 'folder' && (
                <p className="text-sm text-gray-500">
                  {item.workoutCount || 0} schede, {item.subfolderCount || 0} sottocartelle
                </p>
              )}
              {item.type === 'file' && item.data && 'coach' in item.data && (
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-500">
                    Coach: {item.data.coach}
                    {item.data && 'variants' in item.data && item.data.variants && item.data.variants.length > 0 && (
                      <span> • {item.data.variants.length} variant{item.data.variants.length === 1 ? 'e' : 'i'}</span>
                    )}
                  </p>
                  {/* Status indicator */}
                  {item.data && 'status' in item.data && (
                    <div className="flex items-center">
                      <div 
                        className={`w-2 h-2 rounded-full ${
                          item.data.status === 'published' ? 'bg-green-500' : 
                          item.data.status === 'draft' ? 'bg-yellow-500' : 
                          'bg-gray-400'
                        }`}
                        title={
                          item.data.status === 'published' ? 'Pubblicata' : 
                          item.data.status === 'draft' ? 'Bozza' : 
                          'Archiviata'
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Metadata per schede */}
          {item.type === 'file' && item.data && 'exercises' in item.data && (
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Target size={12} />
                <span>
                  {/* Mostra sempre il numero di esercizi originali, non delle varianti */}
                  {(() => {
                    const workout = item.data as WorkoutPlan;
                    // Se la scheda ha varianti, conta solo gli esercizi originali
                    // Gli esercizi originali sono quelli nella proprietà exercises della scheda principale
                    return workout.exercises?.length || 0;
                  })()} esercizi
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>
                  {(() => {
                    const dw = (item.data as any).durationWeeks;
                    if (dw && dw > 0) {
                      return `${dw} ${dw === 1 ? 'settimana' : 'settimane'}`;
                    }
                    const days = (item.data as any).duration;
                    const weeks = days ? Math.round(days / 7) : 0;
                    return weeks > 0 ? `${weeks} ${weeks === 1 ? 'settimana' : 'settimane'}` : '—';
                  })()}
                </span>
                {/* Primo tag accanto alle settimane */}
                {Array.isArray((item.data as any).tags) && (item.data as any).tags.length > 0 && (
                  <div className="flex items-center space-x-1 ml-2">
                    <Tag size={12} className="text-purple-600" />
                    <span className="px-2 py-[2px] rounded-full border border-gray-200 bg-gray-50 text-gray-700 text-[10px]">
                      {(item.data as any).tags[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Menu azioni */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            ref={itemMenuTriggerRef}
            className="menu-button p-2 rounded-lg bg-white/60 hover:bg-white border border-gray-200 ring-1 ring-gray-200 backdrop-blur-sm transition-shadow hover:shadow-sm"
            onClick={handleItemMenuClick}
          >
            <MoreVertical size={16} />
          </button>
          
          {/* Dropdown menu con Portal */}
          {isItemMenuOpen && (
            <Portal>
              <div 
                ref={itemMenuDropdownRef}
                className="dropdown-menu min-w-[150px]"
                style={{
                   position: 'fixed',
                   left: itemMenuPosition?.left ?? -9999,
                   top: itemMenuPosition?.top ?? -9999,
                   visibility: itemMenuPosition ? 'visible' : 'hidden',
                 }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToEdit(item);
                    setShowEditModal(true);
                    toggleItemMenu();
                  }}
                  className="dropdown-item"
                >
                  <Edit3 size={14} />
                  <span>Modifica</span>
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(item);
                    toggleItemMenu();
                  }}
                  className="dropdown-item"
                >
                  <Download size={14} />
                  <span>Scarica</span>
                </button>
                
                
                <hr className="my-1" />
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(item);
                    setShowDeleteModal(true);
                    toggleItemMenu();
                  }}
                  className="dropdown-item text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  <span>Elimina</span>
                </button>
              </div>
            </Portal>
          )}
        </div>

        {item.type === 'file' && isDragOver && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="bg-white/70 rounded-full p-2 ring-2 ring-red-400">
              <Ban size={20} className="text-red-500" />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Renderizza WorkoutDetailPage se una scheda è selezionata
  if (showWorkoutDetail && selectedWorkoutId) {
    return (
      <WorkoutDetailPage 
        workoutId={selectedWorkoutId}
        onClose={handleCloseWorkoutDetail}
        initialActiveVariantId={initialActiveVariantId}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col bg-gray-50">

      {toastMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md ring-1 ring-black/10 shadow-md flex items-center space-x-2 text-gray-800 transform transition-all duration-300 ease-out ${isToastExiting ? 'opacity-0 -translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}`} role="status" aria-live="polite">
          <CheckCircle className="text-green-600" size={18} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
      
      {/* Toolbar */}
      <div className="relative z-30 bg-white/60 backdrop-blur-md rounded-2xl ring-1 ring-black/10 shadow-sm p-4">
        {/* Barra di ricerca e filtri */}
        <div className="mb-4">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Barra di ricerca */}
            <div className="relative flex-1 min-w-0" ref={searchDropdownRef}>
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
              <input
                type="text"
                placeholder="Cerca cartelle, schede e varianti..."
                value={searchTerm}
                onChange={(e) => {
                  const value = e.target.value;
                  setSearchTerm(value);
                  setShowSearchSuggestions(!!value);
                }}
                onFocus={() => {
                  if (searchTerm.trim().length > 0) {
                    setShowSearchSuggestions(true);
                  }
                  openDropdown();
                }}
                onBlur={(e) => {
                  const container = searchDropdownRef.current;
                  // Ritarda la chiusura per consentire il click sui suggerimenti
                  setTimeout(() => {
                    if (!container) { setShowSearchSuggestions(false); closeDropdown(); return; }
                    if (!document.activeElement || !container.contains(document.activeElement)) {
                      setShowSearchSuggestions(false);
                      closeDropdown();
                    }
                  }, 150);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                  }
                }}
                className="w-full pl-10 pr-10 py-2 rounded-2xl bg-white/60 backdrop-blur-sm ring-1 ring-black/10 shadow-sm focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-red-500 hover:bg-white/70"
                ref={triggerRef as any}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 transition-colors"
                  aria-label="Pulisci ricerca"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSearchTerm('');
                    setShowSearchSuggestions(false);
                  }}
                >
                  <X size={16} />
                </button>
              )}

              {/* Suggerimenti ricerca intelligente */}
              {showSearchSuggestions && searchTerm.trim().length > 0 && isOpen && (
                <div
                  ref={dropdownRef as any}
                  className="fixed bg-white/95 border border-gray-200 rounded-xl ring-1 ring-black/10 shadow-md z-[1000] max-h-64 overflow-y-auto backdrop-blur-sm pointer-events-auto"
                  style={{
                    top: position?.top ?? 0,
                    left: position?.left ?? 0,
                    width: triggerRef.current ? triggerRef.current.getBoundingClientRect().width : undefined,
                  }}
                >
                  {getSmartSearchSuggestions().length > 0 ? (
                    getSmartSearchSuggestions().map((s, idx) => {
                      const lower = s.label.toLowerCase();
                      const q = searchTerm.toLowerCase();
                      const mi = lower.indexOf(q);
                      const before = mi >= 0 ? s.label.slice(0, mi) : s.label;
                      const match = mi >= 0 ? s.label.slice(mi, mi + q.length) : '';
                      const after = mi >= 0 ? s.label.slice(mi + q.length) : '';
                      return (
                        <button
                          type="button"
                          key={`${s.type}-${s.id}-${idx}`}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (s.type === 'folder') {
                              navigateToFolder(s.id, s.label);
                            } else if (s.type === 'workout') {
                              setInitialActiveVariantId(undefined);
                              setSelectedWorkoutId(s.id);
                              setShowWorkoutDetail(true);
                            } else {
                              // variant
                              setInitialActiveVariantId(s.id);
                              setSelectedWorkoutId(s.workoutId!);
                              setShowWorkoutDetail(true);
                            }
                            setShowSearchSuggestions(false);
                            closeDropdown();
                          }}
                        >
                          {s.type === 'folder' ? (
                            <Folder size={16} className="text-gray-500" />
                          ) : s.type === 'workout' ? (
                            <FileText size={16} className="text-gray-500" />
                          ) : (
                            <Copy size={16} className="text-red-500" />
                          )}
                          <span className="flex-1 text-sm">
                            {mi >= 0 ? (
                              <>
                                {before}
                                <mark className="bg-yellow-100 text-gray-900 rounded px-0.5">{match}</mark>
                                {after}
                              </>
                            ) : (
                              s.label
                            )}
                          </span>
                          {s.type === 'variant' && s.parentLabel && (
                            <span className="text-xs text-gray-500">({s.parentLabel})</span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">Nessun risultato per "{searchTerm}"</div>
                  )}
                </div>
              )}
            </div>
            
            {/* Menu unificato */}
            <div className="relative">
              <button
                ref={toolbarTriggerRef}
                onClick={toggleToolbarDropdown}
                className="flex items-center space-x-2 bg-white/60 backdrop-blur-sm ring-1 ring-black/10 hover:bg-white/80 text-gray-700 px-4 py-2 rounded-2xl shadow-sm transition-all duration-300 ease-in-out hover:shadow-md active:scale-[0.98] flex-shrink-0 sm:px-4 px-2"
              >
                <Menu size={16} />
                <span className="hidden sm:inline">Menu</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isToolbarOpen ? 'rotate-180' : ''} hidden sm:inline`} />
               </button>
               
               {/* Dropdown Menu con Portal */}
               {isToolbarOpen && (
                 <Portal>
                   <div 
                     ref={toolbarDropdownRef}
                     className="dropdown-menu w-72 max-h-96 overflow-y-auto bg-white/80 backdrop-blur-md ring-1 ring-black/10 shadow-xl rounded-xl p-2"
                     style={{
                       position: 'fixed',
                       left: toolbarPosition?.left ?? -9999,
                       top: toolbarPosition?.top ?? -9999,
                       visibility: toolbarPosition ? 'visible' : 'hidden',
                     }}
                   >
                     {/* Modalità vista */}
                     <div className="px-4 py-2">
                       <p className="text-sm font-medium text-gray-700 mb-2">Modalità vista</p>
                       <div className="flex space-x-2">
                         <button
                           onClick={() => {
                             setViewMode('list');
                             closeToolbarDropdown();
                           }}
                           className={`flex-1 p-2 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                             viewMode === 'list' ? 'bg-red-100/80 text-red-600 ring-1 ring-red-200 shadow-sm' : 'bg-white/60 hover:bg-white/80 ring-1 ring-black/10 shadow-sm'
                           }`}
                         >
                           <List size={16} />
                           <span className="text-sm">Lista</span>
                         </button>
                         <button
                           onClick={() => {
                             setViewMode('grid');
                             closeToolbarDropdown();
                           }}
                           className={`flex-1 p-2 rounded-xl transition-all duration-300 flex items-center justify-center space-x-2 ${
                             viewMode === 'grid' ? 'bg-red-100/80 text-red-600 ring-1 ring-red-200 shadow-sm' : 'bg-white/60 hover:bg-white/80 ring-1 ring-black/10 shadow-sm'
                           }`}
                         >
                           <Grid3X3 size={16} />
                           <span className="text-sm">Griglia</span>
                         </button>
                       </div>
                     </div>
                     
                     <hr className="my-2" />

                     {/* Ordina - Menu a tendina interno */}
                     <div className="relative">
                       <button
                         onClick={() => setShowSortSubmenu(!showSortSubmenu)}
                         className="dropdown-item justify-between w-full"
                       >
                         <div className="flex items-center space-x-3">
                           <SlidersHorizontal size={16} />
                           <span>Ordina</span>
                         </div>
                         <ChevronRight size={14} className={`transition-transform duration-200 ${showSortSubmenu ? 'rotate-90' : ''}`} />
                       </button>

                       {showSortSubmenu && (
                         <div className="ml-4 mt-2 space-y-3 border-l-2 border-gray-200/60 pl-4 pr-4">
                           <div>
                             <label className="block text-xs font-medium text-gray-600 mb-1">Cartelle</label>
                             <div className="grid grid-cols-2 gap-2">
                               <button onClick={() => setSortOptions(prev => ({ ...prev, folders: 'name' }))} className={`px-2 py-1 text-xs rounded-xl ${sortOptions.folders === 'name' ? 'bg-red-100/80 text-red-600 ring-1 ring-red-200' : 'bg-white/60 hover:bg-white/80 ring-1 ring-black/10'}`}>Nome</button>
                               <button onClick={() => setSortOptions(prev => ({ ...prev, folders: 'date' }))} className={`px-2 py-1 text-xs rounded-xl ${sortOptions.folders === 'date' ? 'bg-red-100/80 text-red-600 ring-1 ring-red-200' : 'bg-white/60 hover:bg-white/80 ring-1 ring-black/10'}`}>Data creazione</button>
                             </div>
                           </div>

                           <div>
                             <label className="block text-xs font-medium text-gray-600 mb-1">Schede</label>
                             <div className="grid grid-cols-2 gap-2">
                               <button onClick={() => setSortOptions(prev => ({ ...prev, workouts: 'name' }))} className={`px-2 py-1 text-xs rounded-xl ${sortOptions.workouts === 'name' ? 'bg-red-100/80 text-red-600 ring-1 ring-red-200' : 'bg-white/60 hover:bg-white/80 ring-1 ring-black/10'}`}>Nome</button>
                               <button onClick={() => setSortOptions(prev => ({ ...prev, workouts: 'date' }))} className={`px-2 py-1 text-xs rounded-xl ${sortOptions.workouts === 'date' ? 'bg-red-100/80 text-red-600 ring-1 ring-red-200' : 'bg-white/60 hover:bg-white/80 ring-1 ring-black/10'}`}>Data creazione</button>
                             </div>
                           </div>
                         </div>
                       )}
                     </div>

                     <hr className="my-2" />
                     
                     {/* Filtri - Menu a tendina interno */}
                     <div className="relative">
                       <button
                         onClick={() => setShowFiltersSubmenu(!showFiltersSubmenu)}
                         className="dropdown-item justify-between w-full"
                       >
                         <div className="flex items-center space-x-3">
                           <Filter size={16} />
                           <span>Filtri</span>
                         </div>
                         <ChevronRight size={14} className={`transition-transform duration-200 ${showFiltersSubmenu ? 'rotate-90' : ''}`} />
                       </button>
                       
                       {/* Submenu Filtri */}
                       {showFiltersSubmenu && (
                         <div className="ml-4 mt-2 space-y-3 border-l-2 border-gray-200 pl-4 pr-4">
                           {/* Filtri tipo */}
                           <div>
                             <label className="block text-xs font-medium text-gray-600 mb-1">Mostra</label>
                             <div className="space-y-1">
                               <label className="flex items-center text-sm">
                                 <input
                                   type="checkbox"
                                   checked={filters.showFolders}
                                   onChange={(e) => setFilters(prev => ({ ...prev, showFolders: e.target.checked }))}
                                   className="mr-2 text-red-600 focus:ring-red-500"
                                 />
                                 <Folder size={14} className="mr-1" />
                                 Cartelle
                               </label>
                               <label className="flex items-center text-sm">
                                 <input
                                   type="checkbox"
                                   checked={filters.showWorkouts}
                                   onChange={(e) => setFilters(prev => ({ ...prev, showWorkouts: e.target.checked }))}
                                   className="mr-2 text-red-600 focus:ring-red-500"
                                 />
                                 <FileText size={14} className="mr-1" />
                                 Schede
                               </label>
                             </div>
                           </div>
                           
                           {/* Azioni filtri */}
                           <div className="flex justify-between pt-2">
                             <button
                               onClick={() => {
                                 setSearchTerm('');
                                 setFilters({ showFolders: false, showWorkouts: false, sortBy: 'name' });
                               }}
                               className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50"
                             >
                               Reset
                             </button>
                             <button
                               onClick={() => setShowFiltersSubmenu(false)}
                               className="px-2 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded"
                             >
                               Applica
                             </button>
                           </div>
                         </div>
                       )}
                     </div>
                   </div>
                 </Portal>
               )}
             </div>

             {/* Pulsante Aggiungi */}
             <button
               onClick={() => setShowCreateModal(true)}
               className="flex items-center space-x-2 bg-red-600/90 hover:bg-red-600 text-white px-4 py-2 rounded-2xl shadow-sm backdrop-blur-sm ring-1 ring-red-300/40 transition-all duration-300 ease-in-out hover:shadow-md active:scale-[0.98] flex-shrink-0 sm:px-4 px-2"
             >
               <Plus size={16} />
               <span className="hidden sm:inline">Aggiungi</span>
             </button>
           </div>
         </div>
        
        <div className="flex items-center justify-between">
          {/* Breadcrumb con pulsante indietro */}
          <div className="flex items-center space-x-3 min-w-0 flex-1">
            {/* Pulsante freccia indietro */}
            {breadcrumb.length > 1 && (
              <button
                onClick={() => {
                  const parentIndex = breadcrumb.length - 2;
                  navigateToBreadcrumb(parentIndex);
                }}
                className="p-2 rounded-2xl bg-white/60 backdrop-blur-sm ring-1 ring-black/10 hover:bg-white/80 text-gray-700 transition-all duration-300 ease-in-out hover:shadow-sm active:scale-[0.98] flex-shrink-0"
                title="Torna indietro"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            
            {/* Breadcrumb con scroll orizzontale */}
            <div className="min-w-0 flex-1">
              <nav
                ref={breadcrumbNavRef}
                className="flex items-center space-x-2 text-sm overflow-x-auto overflow-y-visible no-scrollbar py-1 px-2 cursor-grab active:cursor-grabbing select-none"
                style={{ touchAction: 'pan-x' }}
                onMouseDown={onBreadcrumbMouseDown}
                onMouseMove={onBreadcrumbMouseMove}
                onMouseUp={onBreadcrumbMouseUp}
                onMouseLeave={onBreadcrumbMouseLeave}
                onTouchStart={onBreadcrumbTouchStart}
                onTouchMove={onBreadcrumbTouchMove}
                onTouchEnd={onBreadcrumbTouchEnd}
              >
                <div className="flex items-center space-x-2 whitespace-nowrap bg-white/60 backdrop-blur-sm ring-inset ring-1 ring-black/10 rounded-2xl px-3 py-1.5">
                  {breadcrumb.map((crumb, index) => {
                    const isCurrentFolder = index === breadcrumb.length - 1;
                    return (
                      <React.Fragment key={index}>
                        <button
                          onClick={() => navigateToBreadcrumb(index)}
                          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); const targetKey = index === 0 ? 'root' : (crumb.id ?? ''); if (targetKey && dragOverItem !== targetKey) setDragOverItem(targetKey); }}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); const targetKey = index === 0 ? 'root' : (crumb.id ?? ''); if (targetKey && dragOverItem !== targetKey) setDragOverItem(targetKey); const isCurrent = index === breadcrumb.length - 1; let isForbidden = false; if (isCurrent && draggedItem) { if (draggedItem.type === 'file') { const plan: any = draggedItem.data as any; isForbidden = ((plan?.folderId ?? null) === (currentFolderId ?? null)); } else if (draggedItem.type === 'folder') { const folder: any = draggedItem.data as any; isForbidden = ((draggedItem.id === (crumb.id ?? null)) || ((folder?.parentId ?? null) === (currentFolderId ?? null))); } } e.dataTransfer.dropEffect = isForbidden ? 'none' : 'move'; }}
                          onDragLeave={() => { const targetKey = index === 0 ? 'root' : (crumb.id ?? ''); if (dragOverItem === targetKey) setDragOverItem(null); }}
                          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const targetFolderId = index === 0 ? null : (crumb.id ?? null); handleDrop(e, targetFolderId); }}
                          data-breadcrumb-index={index}
                          className={`font-medium whitespace-nowrap transition-colors duration-200 ${isCurrentFolder ? 'text-red-600 hover:text-red-700' : 'text-gray-700 hover:text-gray-900'}`}
                        >
                          {crumb.name}
                          
                        </button>
                        {index < breadcrumb.length - 1 && (
                          <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Contenuto */}
      <div className="flex-1 p-4 overflow-auto min-h-[calc(100vh-300px)]">
        {/* Layout principale con sidebar opzionale */}
        <div className="flex">
          
          {/* Contenuto principale */}
          <div 
            className={`flex-1 transition-all duration-300 ease-in-out ${dragOverItem === 'root' ? 'ring-1 ring-blue-300 rounded-lg' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
              const folderEl = el?.closest('[data-folder-id]') as HTMLElement | null;
              if (folderEl) {
                const fid = folderEl.getAttribute('data-folder-id');
                if (fid && dragOverItem !== fid) setDragOverItem(fid);
              } else {
                if (dragOverItem !== 'root') setDragOverItem('root');
              }
              let isForbidden = false;
              if (draggedItem) {
                if (draggedItem.type === 'file') {
                  const plan: any = draggedItem.data as any;
                  isForbidden = ((plan?.folderId ?? null) === (currentFolderId ?? null));
                } else if (draggedItem.type === 'folder') {
                  const folder: any = draggedItem.data as any;
                  isForbidden = ((folder?.parentId ?? null) === (currentFolderId ?? null));
                }
              }
              e.dataTransfer.dropEffect = isForbidden ? 'none' : 'move';
            }}
            onDragLeave={() => { if (dragOverItem === 'root') setDragOverItem(null); }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const targetKey = dragOverItem;
              const targetFolderId = targetKey === 'root' ? currentFolderId : (targetKey ?? currentFolderId);
              handleDrop(e, targetFolderId);
            }}
          >
            {(() => {
              const filteredItems = getFilteredAndSortedItems();
              
              if (folderTree.length === 0) {
                return (
                  <div className="text-center py-12">
                    <Folder className="mx-auto mb-4 text-gray-400" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Cartella vuota</h3>
                    <p className="text-gray-500 mb-4">Inizia creando una nuova cartella o scheda di allenamento.</p>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Crea il primo elemento
                    </button>
                  </div>
                );
              }
              
              if (filteredItems.length === 0) {
                return (
                  <div className="text-center py-12">
                    <Search className="mx-auto mb-4 text-gray-400" size={48} />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun risultato</h3>
                    <p className="text-gray-500 mb-4">Nessun elemento corrisponde ai criteri di ricerca o filtri selezionati.</p>
                    <button
                      onClick={() => {
                        setSearchTerm('');
                        setFilters({ showFolders: true, showWorkouts: true, sortBy: 'name' });
                      }}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Cancella filtri
                    </button>
                  </div>
                );
              }
              
              return (
                <div className={`${
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4'
                    : 'space-y-2'
                }`}>
                  {filteredItems.map((item) => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Modal creazione */}
      {showCreateModal && (
        <CreateItemModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createNewItem}
          type={createType}
          onTypeChange={setCreateType}
        />
      )}

      {/* Modal modifica */}
      {showEditModal && itemToEdit && (
        <EditModal
          item={itemToEdit}
          onClose={() => {
            setShowEditModal(false);
            setItemToEdit(null);
          }}
          onEdit={handleEdit}
        />
      )}

      {/* Modal eliminazione */}
      {showDeleteModal && itemToDelete && (
        <DeleteModal
          item={itemToDelete}
          onClose={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
          }}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
};

// Modal per creare nuovi elementi
interface CreateItemModalProps {
  onClose: () => void;
  onCreate: (type: 'folder' | 'workout', name: string, icon?: string, color?: string, variants?: WorkoutVariant[]) => void;
  type: 'folder' | 'workout';
  onTypeChange: (type: 'folder' | 'workout') => void;
}

const CreateItemModal: React.FC<CreateItemModalProps> = ({ onClose, onCreate, type, onTypeChange }) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Folder');
  const [selectedColor, setSelectedColor] = useState(type === 'folder' ? '#EF4444' : '#3B82F6');
  const [workoutVariants, setWorkoutVariants] = useState<WorkoutVariant[]>([]);
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Sync default color with selected type
  useEffect(() => {
    setSelectedColor(type === 'folder' ? '#EF4444' : '#3B82F6');
  }, [type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Usa il nome inserito o il nome predefinito
    const finalName = name.trim() || (type === 'workout' ? 'Nuova scheda' : 'Nuova Cartella');
    
    onCreate(
      type, 
      finalName, 
      type === 'folder' ? selectedIcon : undefined, 
      selectedColor,
      type === 'workout' ? workoutVariants : undefined
    );
    setName('');
    setSelectedIcon('Folder');
    setSelectedColor(type === 'folder' ? '#EF4444' : '#3B82F6');
    setWorkoutVariants([]);
    setShowCustomizer(false);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Crea ${type === 'folder' ? 'Cartella' : 'Scheda'}`}
      variant="centered"
    >
      <div className="w-full max-w-md mx-auto">>
        
        {/* Selezione tipo */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => onTypeChange('folder')}
            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
              type === 'folder'
                ? 'border-red-500 bg-red-50 text-red-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Folder className="inline mr-2" size={16} />
            Cartella
          </button>
          <button
            onClick={() => onTypeChange('workout')}
            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
              type === 'workout'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FileText className="inline mr-2" size={16} />
            Scheda
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome {type === 'folder' ? 'cartella' : 'scheda'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`Inserisci il nome della ${type === 'folder' ? 'cartella' : 'scheda'}...`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoFocus
            />
          </div>

          {/* Personalizzazione */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Personalizzazione
              </label>
              <button
                type="button"
                onClick={() => setShowCustomizer(!showCustomizer)}
                className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
              >
                <Palette size={14} />
                <span>{showCustomizer ? 'Nascondi' : 'Personalizza'}</span>
              </button>
            </div>
            
            {showCustomizer && (
              <div className="border border-gray-200 rounded-lg p-4 overflow-visible">
                {type === 'folder' ? (
                  <FolderCustomizer
                    selectedIcon={selectedIcon}
                    selectedColor={selectedColor}
                    onIconChange={setSelectedIcon}
                    onColorChange={setSelectedColor}
                  />
                ) : (
                  <WorkoutCustomizer
                    selectedColor={selectedColor}
                    onColorChange={setSelectedColor}
                    variants={workoutVariants}
                    onVariantsChange={setWorkoutVariants}
                    originalWorkoutTitle={name}
                    showVariants={false}
                  />
                )}
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Crea
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

// Modal per rinominare elementi
// RenameModal rimosso: la funzionalità è stata sostituita da EditModal.

interface EditModalProps {
  item: FolderTreeItem;
  onClose: () => void;
  onEdit: (item: FolderTreeItem, updates: { name: string; icon?: string; color?: string }) => void;
}

const EditModal: React.FC<EditModalProps> = ({ item, onClose, onEdit }) => {
  const [name, setName] = useState(item.name);
  const initialIcon = item.type === 'folder' && item.data && 'icon' in item.data ? ((item.data as any).icon || 'Folder') : undefined;
  const initialColor = item.data && 'color' in item.data
    ? ((item.data as any).color || (item.type === 'folder' ? '#EF4444' : '#3B82F6'))
    : (item.type === 'folder' ? '#EF4444' : '#3B82F6');
  const [icon, setIcon] = useState<string | undefined>(initialIcon);
  const [color, setColor] = useState<string>(initialColor);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { onClose(); return; }
    const updates: { name: string; icon?: string; color?: string } = { name: trimmed };
    if (item.type === 'folder') { updates.icon = icon; updates.color = color; }
    else { updates.color = color; }
    onEdit(item, updates);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Modifica ${item.type === 'folder' ? 'Cartella' : 'Scheda'}`}
      variant="centered"
    >>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent" autoFocus />
          </div>

          {item.type === 'folder' ? (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Aspetto cartella</label>
              <FolderCustomizer selectedIcon={icon || 'Folder'} selectedColor={color} onIconChange={(val) => setIcon(val)} onColorChange={(val) => setColor(val)} />
            </div>
          ) : (
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">Colore scheda</label>
              <div className="grid grid-cols-6 gap-1 max-h-40 overflow-y-auto no-scrollbar">
                {AVAILABLE_COLORS.map((c) => {
                  const isSelected = color === c.value;
                  return (
                    <button key={c.value} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setColor(c.value); }} className={`p-2 rounded-md border transition-all hover:scale-105 ${isSelected ? 'border-gray-800 ring-1 ring-gray-300' : 'border-gray-200 hover:border-gray-300'}`} title={c.name}>
                      <div className={`w-5 h-5 rounded-full ${c.bg} mx-auto`} style={{ backgroundColor: c.value }} />
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Annulla</button>
            <button type="submit" className="flex-1 py-2 px-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">Salva</button>
          </div>
        </form>
    </Modal>
  );
};

// Modal per confermare eliminazione
interface DeleteModalProps {
  item: FolderTreeItem;
  onClose: () => void;
  onDelete: (item: FolderTreeItem) => void;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ item, onClose, onDelete }) => {
  const handleDelete = () => {
    onDelete(item);
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Elimina ${item.type === 'folder' ? 'Cartella' : 'Scheda'}`}
      variant="centered"
     >
        
        <p className="text-gray-600 mb-6">
          Sei sicuro di voler eliminare "{item.name}"?
          {item.type === 'folder' && (
            <span className="block mt-2 text-red-600 font-medium">
              Attenzione: verranno eliminate anche tutte le sottocartelle e schede contenute.
            </span>
          )}
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Elimina
          </button>
        </div>
    </Modal>
  );
};

export default FileExplorer;