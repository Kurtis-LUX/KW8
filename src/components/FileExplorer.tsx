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
  ArrowLeft
} from 'lucide-react';
import Portal from './Portal';
import { useDropdownPosition } from '../hooks/useDropdownPosition';
import DB, { WorkoutPlan, WorkoutFolder, WorkoutVariant } from '../utils/database';
import FolderCustomizer, { AVAILABLE_ICONS } from './FolderCustomizer';
import WorkoutCustomizer from './WorkoutCustomizer';
import TreeView from './TreeView';
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

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState<'folder' | 'workout'>('folder');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [itemToRename, setItemToRename] = useState<FolderTreeItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<FolderTreeItem | null>(null);
  const [showToolbarDropdown, setShowToolbarDropdown] = useState(false);
  
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
  const [showTreeView, setShowTreeView] = useState(false);
  const [draggedItem, setDraggedItem] = useState<FolderTreeItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);
  const [showWorkoutDetail, setShowWorkoutDetail] = useState(false);
  
  // Stati per ricerca e filtraggio
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    showFolders: true,
    showWorkouts: true,
    sortBy: 'name' as 'name' | 'date'
  });
  
  // Hook per il posizionamento del menu filtri
  const {
    position: filtersPosition,
    isOpen: isFiltersOpen,
    triggerRef: filtersTriggerRef,
    dropdownRef: filtersDropdownRef,
    toggleDropdown: toggleFilters,
    closeDropdown: closeFilters
  } = useDropdownPosition({
    preferredPosition: 'bottom-left',
    offset: 8,
    autoAdjust: true
  });

  useEffect(() => {
    loadFolderContent();
  }, [currentFolderId]);

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
    
    const totalWorkouts = workouts.length + countWorkoutsRecursive(subfolders.map(f => f.id));
    
    return {
      subfolders: subfolders.length,
      workouts: totalWorkouts
    };
  };

  // Funzioni drag & drop
  const handleDragStart = (e: React.DragEvent, item: FolderTreeItem) => {
    setDraggedItem(item);
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
        // Sposta cartella
        const folder = draggedItem.data as WorkoutFolder;
        const updatedFolder = { ...folder, parentId: targetFolderId };
        await DB.saveWorkoutFolder(updatedFolder);
      } else {
        // Sposta scheda
        const workout = draggedItem.data as WorkoutPlan;
        const updatedWorkout = { ...workout, folderId: targetFolderId };
        await DB.saveWorkoutPlan(updatedWorkout);
      }
      
      // Ricarica il contenuto
      await loadFolderContent();
      setDraggedItem(null);
    } catch (error) {
      console.error('Errore durante lo spostamento:', error);
    }
  };

  const loadFolderContent = () => {
    const folders = DB.getWorkoutFolders();
    const workoutPlans = DB.getWorkoutPlans();

    // Filtra cartelle e schede per la cartella corrente
    const currentFolders = folders.filter(folder => folder.parentId === currentFolderId);
    const currentWorkouts = workoutPlans.filter(plan => plan.folderId === currentFolderId);

    // Crea gli elementi dell'albero
    const treeItems: FolderTreeItem[] = [
      // Cartelle
      ...currentFolders.map(folder => {
        const counts = getFolderCounts(folder.id, folders, workoutPlans);
        
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

    setFolderTree(treeItems);
  };

  const navigateToFolder = (folderId?: string, folderName?: string) => {
    setCurrentFolderId(folderId);
    
    if (folderId) {
      const folder = DB.getWorkoutFolderById(folderId);
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
    
    // Ricarica il contenuto della cartella
    loadFolderContent();
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

    // Ordinamento
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          const aDate = a.data && 'createdAt' in a.data ? a.data.createdAt : '';
          const bDate = b.data && 'createdAt' in b.data ? b.data.createdAt : '';
          return new Date(bDate).getTime() - new Date(aDate).getTime();

        default:
          return 0;
      }
    });

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

  const handleCloseWorkoutDetail = () => {
    setShowWorkoutDetail(false);
    setSelectedWorkoutId(null);
  };


  const createNewItem = (type: 'folder' | 'workout', name: string, icon?: string, color?: string, variants?: WorkoutVariant[]) => {
    const now = new Date().toISOString();
    const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (type === 'folder') {
      const newFolder: WorkoutFolder = {
        id,
        name,
        icon: icon || 'Folder',
        color: color || '#3B82F6',
        parentId: currentFolderId,
        order: folderTree.filter(item => item.type === 'folder').length,
        createdAt: now,
        updatedAt: now,
        isExpanded: false
      };
      DB.saveWorkoutFolder(newFolder);
    } else {
      const newWorkout: WorkoutPlan = {
        id,
        name,
        description: '',
        coach: currentUser?.name || 'Coach',
        startDate: now,
        duration: 30,
        exercises: [],
        category: 'strength',
        status: 'draft',
        mediaFiles: { images: [], videos: [], audio: [] },
        tags: [],
        order: folderTree.filter(item => item.type === 'file').length,
        createdAt: now,
        updatedAt: now,
        difficulty: 1,
        targetMuscles: [],
        folderId: currentFolderId,
        color: color || '#10B981',
        variants: variants || [],
        assignedAthletes: []
      };
      DB.saveWorkoutPlan(newWorkout);
    }

    loadFolderContent();
    setShowCreateModal(false);
  };

  const deleteItem = (itemId: string, itemType: 'folder' | 'file') => {
    if (itemType === 'folder') {
      DB.deleteWorkoutFolder(itemId);
    } else {
      DB.deleteWorkoutPlan(itemId);
    }
    loadFolderContent();
  };

  const handleRename = (item: FolderTreeItem, newName: string) => {
    if (item.type === 'folder' && item.data && 'icon' in item.data) {
      const updatedFolder = { ...item.data, name: newName, updatedAt: new Date().toISOString() };
      DB.saveWorkoutFolder(updatedFolder);
    } else if (item.type === 'file' && item.data && 'name' in item.data) {
      const updatedWorkout = { ...item.data, name: newName, updatedAt: new Date().toISOString() };
      DB.saveWorkoutPlan(updatedWorkout);
    }
    loadFolderContent();
    setShowRenameModal(false);
    setItemToRename(null);
  };

  const handleDelete = (item: FolderTreeItem) => {
    if (item.type === 'folder') {
      // Elimina ricorsivamente tutte le sottocartelle e schede
      const folders = DB.getWorkoutFolders();
      const workouts = DB.getWorkoutPlans();
      
      const deleteRecursive = (folderId: string) => {
        const subfolders = folders.filter(f => f.parentId === folderId);
        const folderWorkouts = workouts.filter(w => w.folderId === folderId);
        
        // Elimina tutte le schede in questa cartella
        folderWorkouts.forEach(workout => DB.deleteWorkoutPlan(workout.id));
        
        // Elimina ricorsivamente le sottocartelle
        subfolders.forEach(subfolder => {
          deleteRecursive(subfolder.id);
          DB.deleteWorkoutFolder(subfolder.id);
        });
      };
      
      deleteRecursive(item.id);
      DB.deleteWorkoutFolder(item.id);
    } else if (item.type === 'file') {
       DB.deleteWorkoutPlan(item.id);
     }
    
    loadFolderContent();
    setShowDeleteModal(false);
    setItemToDelete(null);
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
      toggleItemMenu();
    };
    
    return (
      <div 
          className={`group relative rounded-lg border-2 transition-all duration-300 ease-in-out hover:shadow-lg hover:scale-[1.02] cursor-pointer transform border-gray-200 hover:border-gray-300 ${
            isDragOver ? 'border-red-300 bg-red-50 shadow-lg scale-[1.02]' : ''
          } ${
            isDragging ? 'scale-95' : ''
          } ${
            item.type === 'folder' ? 'bg-yellow-50' : 'bg-blue-50'
          }`}
          onClick={() => handleItemClick(item)}
          draggable
          onDragStart={(e) => handleDragStart(e, item)}
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
                backgroundColor: item.type === 'folder' && item.data && 'color' in item.data 
                  ? item.data.color + '20' 
                  : item.type === 'workout' && item.data && 'color' in item.data
                  ? item.data.color + '20'
                  : item.type === 'folder' ? '#3B82F620' : '#10B98120',
                color: item.type === 'folder' && item.data && 'color' in item.data 
                  ? item.data.color 
                  : item.type === 'workout' && item.data && 'color' in item.data
                  ? item.data.color
                  : item.type === 'folder' ? '#3B82F6' : '#10B981'
              }}
            >
              <FolderIcon item={item} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-gray-900 truncate">{item.name}</h3>
              {item.type === 'folder' && (
                <p className="text-sm text-gray-500">
                  {item.workoutCount || 0} schede, {item.subfolderCount || 0} sottocartelle
                </p>
              )}
              {item.type === 'file' && item.data && 'coach' in item.data && (
                <p className="text-sm text-gray-500">
                  Coach: {item.data.coach}
                  {item.data && 'variants' in item.data && item.data.variants && item.data.variants.length > 0 && (
                    <span> • {item.data.variants.length} varianti</span>
                  )}
                </p>
              )}
            </div>
          </div>

          {/* Metadata per schede */}
          {item.type === 'file' && item.data && 'exercises' in item.data && (
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Target size={12} />
                <span>{item.data.exercises?.length || 0} esercizi</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar size={12} />
                <span>{item.data.duration} giorni</span>
              </div>
            </div>
          )}
        </div>

        {/* Menu azioni */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            ref={itemMenuTriggerRef}
            className="p-1 rounded hover:bg-gray-100"
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
                   left: itemMenuPosition?.left || 0,
                   top: itemMenuPosition?.top || 0,
                 }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToRename(item);
                    setShowRenameModal(true);
                    toggleItemMenu();
                  }}
                  className="dropdown-item"
                >
                  <Edit3 size={14} />
                  <span>Rinomina</span>
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
                
                {item.type === 'workout' && (
                   <button
                     onClick={(e) => {
                       e.stopPropagation();
                       handleGenerateLink(item);
                       toggleItemMenu();
                     }}
                     className="dropdown-item"
                   >
                     <Link size={14} />
                     <span>Genera link</span>
                   </button>
                 )}
                
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
      <div className="bg-white border-b border-gray-200 p-4">
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
            
            {/* Pulsante filtri */}
            <div className="relative">
              <button
                ref={filtersTriggerRef}
                onClick={toggleFilters}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
                  isFiltersOpen ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <SlidersHorizontal size={16} />
                <span>Filtri</span>
              </button>
              
              {/* Dropdown filtri */}
              {isFiltersOpen && (
                <Portal>
                  <div 
                    ref={filtersDropdownRef}
                    className="dropdown-menu w-96"
                    style={{
                      position: 'fixed',
                      left: filtersPosition?.left || 0,
                      top: filtersPosition?.top || 0,
                    }}
                  >
                    <div className="p-4">
                      <div className="grid grid-cols-1 gap-4">
                        {/* Filtri tipo */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Mostra</label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={filters.showFolders}
                                onChange={(e) => setFilters(prev => ({ ...prev, showFolders: e.target.checked }))}
                                className="mr-2 text-red-600 focus:ring-red-500"
                              />
                              <Folder size={16} className="mr-1" />
                              Cartelle
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={filters.showWorkouts}
                                onChange={(e) => setFilters(prev => ({ ...prev, showWorkouts: e.target.checked }))}
                                className="mr-2 text-red-600 focus:ring-red-500"
                              />
                              <FileText size={16} className="mr-1" />
                              Schede
                            </label>
                          </div>
                        </div>
                        
                        {/* Ordinamento */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Ordina per</label>
                          <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'name' | 'date' }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="name">Nome</option>
                            <option value="date">Data creazione</option>
                          </select>
                        </div>
                        
                        {/* Azioni filtri */}
                        <div className="flex justify-between">
                          <button
                             onClick={() => {
                               setSearchTerm('');
                               setFilters({ showFolders: false, showWorkouts: false, sortBy: 'name' });
                             }}
                             className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                           >
                             Reset
                           </button>
                           <button
                             onClick={closeFilters}
                             className="px-3 py-2 text-sm text-white bg-red-600 hover:bg-red-700 rounded-lg"
                           >
                             Applica
                           </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </Portal>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          {/* Breadcrumb con pulsante indietro */}
          <div className="flex items-center space-x-3">
            {/* Pulsante freccia indietro */}
            {breadcrumb.length > 1 && (
              <button
                onClick={() => {
                  const parentIndex = breadcrumb.length - 2;
                  navigateToBreadcrumb(parentIndex);
                }}
                className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-all duration-200 ease-in-out hover:scale-105"
                title="Torna indietro"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm">
              {breadcrumb.map((crumb, index) => (
                <React.Fragment key={index}>
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className="text-gray-600 hover:text-gray-900 font-medium"
                  >
                    {crumb.name}
                  </button>
                  {index < breadcrumb.length - 1 && (
                    <ChevronRight size={16} className="text-gray-400" />
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Menu Toolbar */}
          <div className="relative">
            <button
              ref={toolbarTriggerRef}
              onClick={toggleToolbarDropdown}
              className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition-all duration-200 ease-in-out hover:scale-105"
            >
              <SlidersHorizontal size={16} />
              <span>Menu</span>
              <ChevronDown size={14} className={`transition-transform duration-200 ${isToolbarOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {/* Dropdown Menu con Portal */}
            {isToolbarOpen && (
              <Portal>
                <div 
                  ref={toolbarDropdownRef}
                  className="dropdown-menu w-64"
                  style={{
                    position: 'fixed',
                    left: toolbarPosition?.left || 0,
                    top: toolbarPosition?.top || 0,
                  }}
                >
                  {/* Vista ad albero */}
                  <button
                    onClick={() => {
                      setShowTreeView(!showTreeView);
                      closeToolbarDropdown();
                    }}
                    className={`dropdown-item justify-between ${
                      showTreeView ? 'text-red-600 bg-red-50' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <ChevronRight size={16} className={`transition-transform duration-200 ${showTreeView ? 'rotate-90' : ''}`} />
                      <span>Vista ad albero</span>
                    </div>
                    {showTreeView && <div className="w-2 h-2 bg-red-600 rounded-full"></div>}
                  </button>
                  
                  <hr className="my-2" />
                  
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
                  
                  {/* Filtri */}
                  <button
                    onClick={() => {
                      toggleFilters();
                      closeToolbarDropdown();
                    }}
                    className={`dropdown-item justify-between ${
                      isFiltersOpen ? 'text-red-600 bg-red-50' : ''
                    }`}
                  >
                    <Filter size={16} />
                    <span>Filtri</span>
                  </button>
                  
                  <hr className="my-2" />
                  
                  {/* Crea nuovo */}
                  <button
                    onClick={() => {
                      setShowCreateModal(true);
                      closeToolbarDropdown();
                    }}
                    className="dropdown-item text-red-600 hover:bg-red-50 font-medium"
                  >
                    <Plus size={16} />
                    <span>Crea nuovo</span>
                  </button>
                </div>
              </Portal>
            )}
          </div>
        </div>
      </div>

      {/* Contenuto */}
      <div className="flex-1 p-4 overflow-auto min-h-[calc(100vh-300px)]">
        {/* Layout principale con sidebar opzionale */}
        <div className={`flex ${showTreeView ? 'space-x-4' : ''}`}>
          {/* Sidebar navigazione ad albero */}
          {showTreeView && (
            <div className="w-64 flex-shrink-0">
              <TreeView
                currentFolderId={currentFolderId}
                onFolderSelect={navigateToFolder}
              />
            </div>
          )}
          
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

      {/* Modal rinomina */}
      {showRenameModal && itemToRename && (
        <RenameModal
          item={itemToRename}
          onClose={() => {
            setShowRenameModal(false);
            setItemToRename(null);
          }}
          onRename={handleRename}
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
  const [selectedColor, setSelectedColor] = useState(type === 'folder' ? '#3B82F6' : '#10B981');
  const [workoutVariants, setWorkoutVariants] = useState<WorkoutVariant[]>([]);
  const [showCustomizer, setShowCustomizer] = useState(false);

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
    setSelectedColor(type === 'folder' ? '#3B82F6' : '#10B981');
    setWorkoutVariants([]);
    setShowCustomizer(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Crea {type === 'folder' ? 'Cartella' : 'Scheda'}
        </h2>
        
        {/* Selezione tipo */}
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => onTypeChange('folder')}
            className={`flex-1 py-2 px-4 rounded-lg border transition-colors ${
              type === 'folder'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
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
                ? 'border-green-500 bg-green-50 text-green-700'
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
              <div className="border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
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
interface RenameModalProps {
  item: FolderTreeItem;
  onClose: () => void;
  onRename: (item: FolderTreeItem, newName: string) => void;
}

const RenameModal: React.FC<RenameModalProps> = ({ item, onClose, onRename }) => {
  const [name, setName] = useState(item.name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name.trim() !== item.name) {
      onRename(item, name.trim());
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Rinomina {item.type === 'folder' ? 'Cartella' : 'Scheda'}
        </h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuovo nome
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              autoFocus
            />
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
              disabled={!name.trim()}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Rinomina
            </button>
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
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
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