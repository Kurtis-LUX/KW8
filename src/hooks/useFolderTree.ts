import { useState, useCallback, useEffect, useMemo } from 'react';
import { FolderTreeManager, TreeItem, FolderItem, ProgramItem } from '../utils/folderTree';

export interface UseFolderTreeReturn {
  // Stato
  treeManager: FolderTreeManager;
  rootItems: TreeItem[];
  currentItems: TreeItem[];
  currentFolderId: string | null;
  folderHistory: string[];
  isLoading: boolean;
  error: string | null;
  
  // Navigazione
  navigateToFolder: (folderId: string | null) => void;
  navigateBack: () => void;
  getCurrentFolder: () => FolderItem | null;
  getBreadcrumbs: () => TreeItem[];
  
  // Operazioni CRUD
  createFolder: (name: string, parentId?: string | null, icon?: string) => FolderItem;
  createProgram: (title: string, parentId?: string | null, options?: Partial<Pick<ProgramItem, 'description' | 'difficulty' | 'status' | 'duration' | 'exercises'>>) => ProgramItem;
  moveItem: (itemId: string, newParentId: string | null) => boolean;
  renameItem: (itemId: string, newName: string) => boolean;
  changeFolderIcon: (folderId: string, newIcon: string) => boolean;
  deleteItem: (itemId: string) => boolean;
  
  // Utilità
  searchItems: (query: string) => TreeItem[];
  getStats: () => { totalFolders: number; totalPrograms: number; maxDepth: number };
  refreshData: () => void;
  loadData: (data: TreeItem[]) => void;
  exportData: () => TreeItem[];
}

export const useFolderTree = (initialData?: TreeItem[]): UseFolderTreeReturn => {
  const [treeManager] = useState(() => new FolderTreeManager(initialData));
  const [rootItems, setRootItems] = useState<TreeItem[]>(() => treeManager.getRootItems());
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Stato per forzare il re-render quando i dati cambiano
  const [dataVersion, setDataVersion] = useState(0);

  // Calcola gli elementi correnti basati sulla cartella selezionata
  const currentItems = useMemo(() => {
    console.log('🔄 Ricalcolo currentItems:', { currentFolderId, rootItemsLength: rootItems.length, dataVersion });
    if (currentFolderId) {
      const currentFolder = treeManager.findItem(currentFolderId) as FolderItem;
      const items = currentFolder?.children || [];
      console.log('📁 Elementi nella cartella corrente:', items.length);
      return items;
    }
    console.log('🏠 Elementi root:', rootItems.length);
    return rootItems;
  }, [currentFolderId, rootItems, treeManager, dataVersion]);

  // Aggiorna lo stato quando cambia il tree manager
  const refreshData = useCallback(() => {
    try {
      setRootItems([...treeManager.getRootItems()]);
      setDataVersion(prev => prev + 1); // Forza il re-render
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    }
  }, [treeManager]);

  // Carica nuovi dati
  const loadData = useCallback((data: TreeItem[]) => {
    setIsLoading(true);
    try {
      treeManager.loadData(data);
      refreshData();
      setCurrentFolderId(null);
      setFolderHistory([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel caricamento dei dati');
    } finally {
      setIsLoading(false);
    }
  }, [treeManager, refreshData]);

  // Navigazione
  const navigateToFolder = useCallback((folderId: string | null) => {
    if (folderId === currentFolderId) return;
    
    if (folderId !== null) {
      const folder = treeManager.getItem(folderId);
      if (!folder || folder.type !== 'folder') {
        setError('Cartella non trovata');
        return;
      }
      
      // Aggiungi alla cronologia solo se non stiamo tornando indietro
      if (currentFolderId !== null) {
        setFolderHistory(prev => [...prev, currentFolderId]);
      }
    }
    
    setCurrentFolderId(folderId);
    setError(null);
  }, [currentFolderId, treeManager]);

  const navigateBack = useCallback(() => {
    if (folderHistory.length > 0) {
      const previousFolderId = folderHistory[folderHistory.length - 1];
      setFolderHistory(prev => prev.slice(0, -1));
      setCurrentFolderId(previousFolderId);
    } else {
      setCurrentFolderId(null);
    }
  }, [folderHistory]);

  const getCurrentFolder = useCallback((): FolderItem | null => {
    if (!currentFolderId) return null;
    const folder = treeManager.getItem(currentFolderId);
    return folder && folder.type === 'folder' ? folder : null;
  }, [currentFolderId, treeManager]);

  const getBreadcrumbs = useCallback((): TreeItem[] => {
    if (!currentFolderId) return [];
    return treeManager.getItemPath(currentFolderId);
  }, [currentFolderId, treeManager]);

  // Operazioni CRUD
  const createFolder = useCallback((name: string, parentId?: string | null, icon?: string): FolderItem => {
    try {
      const actualParentId = parentId !== undefined ? parentId : currentFolderId;
      const newFolder = treeManager.createFolder(name, actualParentId, icon);
      refreshData();
      return newFolder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione della cartella');
      throw err;
    }
  }, [currentFolderId, treeManager, refreshData]);

  const createProgram = useCallback((
    title: string,
    parentId?: string | null,
    options?: Partial<Pick<ProgramItem, 'description' | 'difficulty' | 'status' | 'duration' | 'exercises'>>
  ): ProgramItem => {
    try {
      const actualParentId = parentId !== undefined ? parentId : currentFolderId;
      const newProgram = treeManager.createProgram(title, actualParentId, options);
      refreshData();
      return newProgram;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella creazione del programma');
      throw err;
    }
  }, [currentFolderId, treeManager, refreshData]);

  const moveItem = useCallback((itemId: string, newParentId: string | null): boolean => {
    try {
      const success = treeManager.moveItem(itemId, newParentId);
      if (success) {
        refreshData();
      } else {
        setError('Impossibile spostare l\'elemento');
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nello spostamento dell\'elemento');
      return false;
    }
  }, [treeManager, refreshData]);

  const renameItem = useCallback((itemId: string, newName: string): boolean => {
    try {
      const success = treeManager.renameItem(itemId, newName);
      if (success) {
        refreshData();
      } else {
        setError('Impossibile rinominare l\'elemento');
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella rinomina dell\'elemento');
      return false;
    }
  }, [treeManager, refreshData]);

  const changeFolderIcon = useCallback((folderId: string, newIcon: string): boolean => {
    try {
      const success = treeManager.changeFolderIcon(folderId, newIcon);
      if (success) {
        refreshData();
      } else {
        setError('Impossibile cambiare l\'icona della cartella');
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel cambio dell\'icona');
      return false;
    }
  }, [treeManager, refreshData]);

  const deleteItem = useCallback((itemId: string): boolean => {
    try {
      const success = treeManager.deleteItem(itemId);
      if (success) {
        // Se stiamo eliminando la cartella corrente, torna alla root
        if (itemId === currentFolderId) {
          setCurrentFolderId(null);
          setFolderHistory([]);
        }
        refreshData();
      } else {
        setError('Impossibile eliminare l\'elemento');
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'eliminazione dell\'elemento');
      return false;
    }
  }, [currentFolderId, treeManager, refreshData]);

  // Utilità
  const searchItems = useCallback((query: string): TreeItem[] => {
    try {
      return treeManager.searchItems(query);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nella ricerca');
      return [];
    }
  }, [treeManager]);

  const getStats = useCallback(() => {
    try {
      return treeManager.getStats();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nel calcolo delle statistiche');
      return { totalFolders: 0, totalPrograms: 0, maxDepth: 0 };
    }
  }, [treeManager]);

  const exportData = useCallback((): TreeItem[] => {
    try {
      return treeManager.exportData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore nell\'esportazione dei dati');
      return [];
    }
  }, [treeManager]);

  // Effetto per validare l'albero periodicamente
  useEffect(() => {
    const validateTree = () => {
      const validation = treeManager.validateTree();
      if (!validation.isValid) {
        console.warn('Tree validation errors:', validation.errors);
        setError(`Errori di validazione: ${validation.errors.join(', ')}`);
      }
    };

    // Valida immediatamente
    validateTree();

    // Valida ogni 30 secondi in development
    const interval = process.env.NODE_ENV === 'development' 
      ? setInterval(validateTree, 30000)
      : null;

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [treeManager]);

  return {
    // Stato
    treeManager,
    rootItems,
    currentItems,
    currentFolderId,
    folderHistory,
    isLoading,
    error,
    
    // Navigazione
    navigateToFolder,
    navigateBack,
    getCurrentFolder,
    getBreadcrumbs,
    
    // Operazioni CRUD
    createFolder,
    createProgram,
    moveItem,
    renameItem,
    changeFolderIcon,
    deleteItem,
    
    // Utilità
    searchItems,
    getStats,
    refreshData,
    loadData,
    exportData
  };
};

export default useFolderTree;