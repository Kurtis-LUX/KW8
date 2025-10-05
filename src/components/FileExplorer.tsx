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
  Menu
} from 'lucide-react';
import Portal from './Portal';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import { useWorkoutPlans } from '../hooks/useFirestore';
import DB, { WorkoutPlan, WorkoutFolder, WorkoutVariant } from '../utils/database';
import FolderCustomizer, { AVAILABLE_ICONS, AVAILABLE_COLORS } from './FolderCustomizer';
import WorkoutCustomizer from './WorkoutCustomizer';
import WorkoutDetailPage from './WorkoutDetailPage';

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
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [showWorkoutDetail, setShowWorkoutDetail] = useState(false);
  
  // Stati per ricerca e filtraggio
  const [searchTerm, setSearchTerm] = useState('');
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

  const loadFolderContent = async () => {
    try {
      const folders = await DB.getWorkoutFolders();
      const allWorkoutPlans = workoutPlans || await DB.getWorkoutPlans();

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
    e.dataTransfer.dropEffect = 'move';
    setDragOverItem(targetId);
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverItem(null);
    
    if (!draggedItem) return;
    
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
        await DB.saveWorkoutFolder({ ...folder, parentId: targetFolderId });
        await loadFolderContent();
      } else {
        // Sposta scheda
        const workout = draggedItem.data as WorkoutPlan;
        await updateWorkoutPlan(workout.id, { folderId: targetFolderId ?? null });
        await loadFolderContent();
      }
      
      setDraggedItem(null);
    } catch (error) {
      console.error('Errore durante lo spostamento:', error);
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
      
      // Filtro per ricerca
      if (searchTerm) {
        return item.name.toLowerCase().includes(searchTerm.toLowerCase());
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
        const aDate = a.data && 'createdAt' in a.data ? a.data.createdAt : '';
        const bDate = b.data && 'createdAt' in b.data ? b.data.createdAt : '';
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
      } else if (item.type === 'file' && item.data && 'name' in item.data) {
        const newName = updates.name ?? item.name;
        const newColor = updates.color ?? (item.data as any).color ?? '#3B82F6';
        await updateWorkoutPlan(item.id, { name: newName, color: newColor });
        // Non serve chiamare loadFolderContent() perché updateWorkoutPlan già ricarica i dati
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
      } else if (item.type === 'file') {
        await deleteWorkoutPlan(item.id);
        // Non chiamare loadFolderContent() perché deleteWorkoutPlan già ricarica i dati
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
      handleItemClick(item);
    };
    
    return (
      <div 
          className={`group relative rounded-lg border-2 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] cursor-pointer transform border-gray-200 hover:border-gray-300 ${
            isDragOver ? 'border-red-300 bg-red-50 shadow-lg scale-[1.02]' : ''
          } ${
            isDragging ? 'scale-95' : ''
          } ${
            item.type === 'folder' ? 'bg-gray-100' : 'bg-white'
          }`}
          onClick={handleCardClick}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
          onDragEnd={() => { setDragOverItem(null); }}
          onDragOver={(e) => item.type === 'folder' ? handleDragOver(e, item.id) : e.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={(e) => item.type === 'folder' ? handleDrop(e, item.id) : e.preventDefault()}
        >
        <div className="p-4">
          {/* Header con icona e nome */}
          <div className="flex items-center space-x-3 mb-2">
            <div 
              className="p-2 rounded-lg"
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
              <h3 className="font-medium text-gray-900 truncate">
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
              </div>
            </div>
          )}
        </div>

        {/* Menu azioni */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            ref={itemMenuTriggerRef}
            className="menu-button p-1 rounded hover:bg-gray-100"
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
      </div>
    );
  };

  // Renderizza WorkoutDetailPage se una scheda è selezionata
  if (showWorkoutDetail && selectedWorkoutId) {
    return (
      <WorkoutDetailPage 
        workoutId={selectedWorkoutId}
        onClose={handleCloseWorkoutDetail} 
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col bg-gray-50">

      
      {/* Toolbar */}
      <div className="bg-white border-t border-b border-gray-200 p-4">
        {/* Barra di ricerca e filtri */}
        <div className="mb-4">
          <div className="flex items-center justify-center space-x-4">
            {/* Barra di ricerca */}
            <div className="relative flex-1 max-w-md">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca cartelle e schede..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
            
            {/* Menu unificato */}
            <div className="relative">
              <button
                ref={toolbarTriggerRef}
                onClick={toggleToolbarDropdown}
                className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 sm:px-4 px-2"
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
                     className="dropdown-menu w-64 max-h-96 overflow-y-auto"
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
                           className={`flex-1 p-2 rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                             viewMode === 'list' ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'
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
                           className={`flex-1 p-2 rounded-md transition-all duration-200 flex items-center justify-center space-x-2 ${
                             viewMode === 'grid' ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'
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
                         <div className="ml-4 mt-2 space-y-3 border-l-2 border-gray-200 pl-4 pr-4">
                           <div>
                             <label className="block text-xs font-medium text-gray-600 mb-1">Cartelle</label>
                             <div className="grid grid-cols-2 gap-2">
                               <button onClick={() => setSortOptions(prev => ({ ...prev, folders: 'name' }))} className={`px-2 py-1 text-xs rounded ${sortOptions.folders === 'name' ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Nome</button>
                               <button onClick={() => setSortOptions(prev => ({ ...prev, folders: 'date' }))} className={`px-2 py-1 text-xs rounded ${sortOptions.folders === 'date' ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Data creazione</button>
                             </div>
                           </div>

                           <div>
                             <label className="block text-xs font-medium text-gray-600 mb-1">Schede</label>
                             <div className="grid grid-cols-2 gap-2">
                               <button onClick={() => setSortOptions(prev => ({ ...prev, workouts: 'name' }))} className={`px-2 py-1 text-xs rounded ${sortOptions.workouts === 'name' ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Nome</button>
                               <button onClick={() => setSortOptions(prev => ({ ...prev, workouts: 'date' }))} className={`px-2 py-1 text-xs rounded ${sortOptions.workouts === 'date' ? 'bg-red-100 text-red-600' : 'bg-gray-100 hover:bg-gray-200'}`}>Data creazione</button>
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
               className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105 sm:px-4 px-2"
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
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 ease-in-out hover:scale-105 flex-shrink-0"
                title="Torna indietro"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            
            {/* Breadcrumb con scroll orizzontale */}
            <div className="min-w-0 flex-1">
              <nav
                ref={breadcrumbNavRef}
                className="flex items-center space-x-2 text-sm overflow-x-auto no-scrollbar pb-1 cursor-grab active:cursor-grabbing select-none"
                style={{ touchAction: 'pan-x' }}
                onMouseDown={onBreadcrumbMouseDown}
                onMouseMove={onBreadcrumbMouseMove}
                onMouseUp={onBreadcrumbMouseUp}
                onMouseLeave={onBreadcrumbMouseLeave}
                onTouchStart={onBreadcrumbTouchStart}
                onTouchMove={onBreadcrumbTouchMove}
                onTouchEnd={onBreadcrumbTouchEnd}
              >
                <div className="flex items-center space-x-2 whitespace-nowrap">
                  {breadcrumb.map((crumb, index) => {
                    const isCurrentFolder = index === breadcrumb.length - 1;
                    return (
                      <React.Fragment key={index}>
                        <button
                          onClick={() => navigateToBreadcrumb(index)}
                          className={`font-medium whitespace-nowrap ${
                            isCurrentFolder 
                              ? 'text-red-600 hover:text-red-700' 
                              : 'text-gray-600 hover:text-gray-900'
                          }`}
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
            className={`flex-1 transition-all duration-300 ease-in-out ${
              dragOverItem === 'root' ? 'bg-red-50 border-2 border-dashed border-red-300 rounded-lg transform scale-[1.01]' : ''
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverItem('root');
            }}
            onDragLeave={() => setDragOverItem(null)}
            onDrop={(e) => handleDrop(e, currentFolderId)}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Crea {type === 'folder' ? 'Cartella' : 'Scheda'}
        </h2>
        
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
    </div>
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-4 w-full max-w-sm mx-auto max-h-[90vh] overflow-y-auto no-scrollbar">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Modifica {item.type === 'folder' ? 'Cartella' : 'Scheda'}
        </h2>
        
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
      </div>
    </div>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w_full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Elimina {item.type === 'folder' ? 'Cartella' : 'Scheda'}
        </h2>
        
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
      </div>
    </div>
  );
};

export default FileExplorer;