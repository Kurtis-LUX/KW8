// Struttura dati per la gestione gerarchica di cartelle e schede

export interface FolderItem {
  id: string;
  name: string;
  icon: string;
  type: 'folder';
  parentId: string | null;
  children: (FolderItem | ProgramItem)[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgramItem {
  id: string;
  title: string;
  type: 'program';
  parentId: string | null;
  description?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  status?: 'active' | 'inactive' | 'draft';
  duration?: number; // in minutes
  exercises?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type TreeItem = FolderItem | ProgramItem;

// Classe per la gestione dell'albero gerarchico
export class FolderTreeManager {
  private items: Map<string, TreeItem> = new Map();
  private rootItems: TreeItem[] = [];

  constructor(initialData?: TreeItem[]) {
    if (initialData) {
      this.loadData(initialData);
    }
  }

  // Carica i dati nell'albero
  loadData(items: TreeItem[]): void {
    console.log('🌳 FolderTreeManager: Caricamento dati...', items.length, 'elementi');
    this.items.clear();
    this.rootItems = [];

    // Prima passata: aggiungi tutti gli elementi alla mappa e resetta i children
    items.forEach(item => {
      if (item.type === 'folder') {
        item.children = []; // Resetta i children per evitare duplicazioni
      }
      this.items.set(item.id, item);
    });

    // Seconda passata: costruisci la gerarchia
    items.forEach(item => {
      if (item.parentId === null) {
        this.rootItems.push(item);
        console.log('🏠 Elemento root aggiunto:', item.type, item.name || item.title);
      } else {
        const parent = this.items.get(item.parentId);
        if (parent && parent.type === 'folder') {
          parent.children.push(item);
          console.log('📁 Elemento aggiunto alla cartella:', item.type, item.name || item.title, '-> parent:', parent.name);
        } else {
          console.warn('⚠️ Parent non trovato per:', item.type, item.name || item.title, 'parentId:', item.parentId);
        }
      }
    });
    
    console.log('✅ FolderTreeManager: Caricamento completato. Root items:', this.rootItems.length);
  }

  // Ottieni tutti gli elementi root
  getRootItems(): TreeItem[] {
    return this.rootItems;
  }

  // Ottieni un elemento per ID
  getItem(id: string): TreeItem | undefined {
    return this.items.get(id);
  }

  // Ottieni tutti gli elementi come array piatto
  getAllItems(): TreeItem[] {
    return Array.from(this.items.values());
  }

  // Crea una nuova cartella
  createFolder(name: string, parentId: string | null = null, icon: string = '📁'): FolderItem {
    const newFolder: FolderItem = {
      id: `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      icon,
      type: 'folder',
      parentId,
      children: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.items.set(newFolder.id, newFolder);
    console.log('📁 FolderTreeManager: Creata nuova cartella:', newFolder.name, 'ID:', newFolder.id, 'Parent:', parentId);

    if (parentId === null) {
      this.rootItems.push(newFolder);
      console.log('🏠 Cartella aggiunta al root');
    } else {
      const parent = this.items.get(parentId);
      if (parent && parent.type === 'folder') {
        parent.children.push(newFolder);
        console.log('📁 Cartella aggiunta alla parent:', parent.name);
      } else {
        console.warn('⚠️ Parent non trovato per la nuova cartella:', parentId);
      }
    }

    return newFolder;
  }

  // Crea un nuovo programma
  createProgram(
    title: string,
    parentId: string | null = null,
    options: Partial<Pick<ProgramItem, 'description' | 'difficulty' | 'status' | 'duration' | 'exercises'>> = {}
  ): ProgramItem {
    const newProgram: ProgramItem = {
      id: `program_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      type: 'program',
      parentId,
      description: options.description || '',
      difficulty: options.difficulty || 'beginner',
      status: options.status || 'draft',
      duration: options.duration || 60,
      exercises: options.exercises || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.items.set(newProgram.id, newProgram);
    console.log('🏋️ FolderTreeManager: Creato nuovo programma:', newProgram.title, 'ID:', newProgram.id, 'Parent:', parentId);

    if (parentId === null) {
      this.rootItems.push(newProgram);
      console.log('🏠 Programma aggiunto al root');
    } else {
      const parent = this.items.get(parentId);
      if (parent && parent.type === 'folder') {
        parent.children.push(newProgram);
        console.log('📁 Programma aggiunto alla parent:', parent.name);
      } else {
        console.warn('⚠️ Parent non trovato per il nuovo programma:', parentId);
      }
    }

    return newProgram;
  }

  // Sposta un elemento in una nuova posizione
  moveItem(itemId: string, newParentId: string | null): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    // Rimuovi dall'attuale posizione
    this.removeFromParent(item);

    // Aggiorna il parentId
    item.parentId = newParentId;
    item.updatedAt = new Date();

    // Aggiungi alla nuova posizione
    if (newParentId === null) {
      this.rootItems.push(item);
    } else {
      const newParent = this.items.get(newParentId);
      if (newParent && newParent.type === 'folder') {
        newParent.children.push(item);
        newParent.updatedAt = new Date();
      } else {
        return false;
      }
    }

    return true;
  }

  // Rinomina un elemento
  renameItem(itemId: string, newName: string): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    if (item.type === 'folder') {
      item.name = newName;
    } else {
      item.title = newName;
    }
    item.updatedAt = new Date();

    return true;
  }

  // Cambia l'icona di una cartella
  changeFolderIcon(folderId: string, newIcon: string): boolean {
    const folder = this.items.get(folderId);
    if (!folder || folder.type !== 'folder') return false;

    folder.icon = newIcon;
    folder.updatedAt = new Date();

    return true;
  }

  // Elimina un elemento e tutti i suoi figli
  deleteItem(itemId: string): boolean {
    const item = this.items.get(itemId);
    if (!item) return false;

    // Se è una cartella, elimina ricorsivamente tutti i figli
    if (item.type === 'folder') {
      const childrenToDelete = [...item.children];
      childrenToDelete.forEach(child => {
        this.deleteItem(child.id);
      });
    }

    // Rimuovi dall'attuale posizione
    this.removeFromParent(item);

    // Rimuovi dalla mappa
    this.items.delete(itemId);

    return true;
  }

  // Ottieni il percorso di un elemento (breadcrumb)
  getItemPath(itemId: string): TreeItem[] {
    const path: TreeItem[] = [];
    let currentItem = this.items.get(itemId);

    while (currentItem) {
      path.unshift(currentItem);
      if (currentItem.parentId) {
        currentItem = this.items.get(currentItem.parentId);
      } else {
        break;
      }
    }

    return path;
  }

  // Cerca elementi per nome/titolo
  searchItems(query: string): TreeItem[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllItems().filter(item => {
      const name = item.type === 'folder' ? item.name : item.title;
      return name.toLowerCase().includes(lowerQuery);
    });
  }

  // Ottieni statistiche dell'albero
  getStats(): { totalFolders: number; totalPrograms: number; maxDepth: number } {
    const items = this.getAllItems();
    const totalFolders = items.filter(item => item.type === 'folder').length;
    const totalPrograms = items.filter(item => item.type === 'program').length;
    
    const getDepth = (item: TreeItem, currentDepth = 0): number => {
      if (item.type === 'folder' && item.children.length > 0) {
        return Math.max(...item.children.map(child => getDepth(child, currentDepth + 1)));
      }
      return currentDepth;
    };

    const maxDepth = Math.max(...this.rootItems.map(item => getDepth(item)));

    return { totalFolders, totalPrograms, maxDepth };
  }

  // Metodo privato per rimuovere un elemento dal suo genitore
  private removeFromParent(item: TreeItem): void {
    if (item.parentId === null) {
      const index = this.rootItems.findIndex(rootItem => rootItem.id === item.id);
      if (index !== -1) {
        this.rootItems.splice(index, 1);
      }
    } else {
      const parent = this.items.get(item.parentId);
      if (parent && parent.type === 'folder') {
        const index = parent.children.findIndex(child => child.id === item.id);
        if (index !== -1) {
          parent.children.splice(index, 1);
          parent.updatedAt = new Date();
        }
      }
    }
  }

  // Esporta i dati come JSON
  exportData(): TreeItem[] {
    return this.getAllItems();
  }

  // Valida la consistenza dell'albero
  validateTree(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const allItems = this.getAllItems();

    // Verifica che tutti i parentId esistano
    allItems.forEach(item => {
      if (item.parentId && !this.items.has(item.parentId)) {
        errors.push(`Item ${item.id} has invalid parentId: ${item.parentId}`);
      }
    });

    // Verifica che non ci siano cicli
    const visited = new Set<string>();
    const checkCycles = (itemId: string, path: Set<string>): boolean => {
      if (path.has(itemId)) {
        errors.push(`Cycle detected involving item: ${itemId}`);
        return false;
      }
      
      if (visited.has(itemId)) return true;
      
      visited.add(itemId);
      path.add(itemId);
      
      const item = this.items.get(itemId);
      if (item && item.type === 'folder') {
        for (const child of item.children) {
          if (!checkCycles(child.id, new Set(path))) {
            return false;
          }
        }
      }
      
      path.delete(itemId);
      return true;
    };

    this.rootItems.forEach(item => {
      checkCycles(item.id, new Set());
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// Icone predefinite per le cartelle
export const FOLDER_ICONS = [
  '📁', '📂', '🗂️', '📋', '📊', '💪', '🏃‍♂️', '🏋️‍♂️', 
  '🤸‍♂️', '🧘‍♂️', '⚽', '🏀', '🎯', '🔥', '⭐', '💎'
] as const;

// Utilità per creare dati di esempio
export const createSampleData = (): TreeItem[] => {
  const manager = new FolderTreeManager();
  
  // Crea cartelle principali
  const strengthFolder = manager.createFolder('Forza', null, '💪');
  const cardioFolder = manager.createFolder('Cardio', null, '🏃‍♂️');
  const flexibilityFolder = manager.createFolder('Flessibilità', null, '🧘‍♂️');
  
  // Crea sottocartelle
  const upperBodyFolder = manager.createFolder('Parte Superiore', strengthFolder.id, '🏋️‍♂️');
  const lowerBodyFolder = manager.createFolder('Parte Inferiore', strengthFolder.id, '🦵');
  
  // Crea programmi
  manager.createProgram('Push Day', upperBodyFolder.id, {
    description: 'Allenamento per petto, spalle e tricipiti',
    difficulty: 'intermediate',
    status: 'active',
    duration: 90,
    exercises: 8
  });
  
  manager.createProgram('Pull Day', upperBodyFolder.id, {
    description: 'Allenamento per schiena e bicipiti',
    difficulty: 'intermediate',
    status: 'active',
    duration: 85,
    exercises: 7
  });
  
  manager.createProgram('Leg Day', lowerBodyFolder.id, {
    description: 'Allenamento completo per le gambe',
    difficulty: 'advanced',
    status: 'active',
    duration: 100,
    exercises: 10
  });
  
  manager.createProgram('HIIT Cardio', cardioFolder.id, {
    description: 'Allenamento cardio ad alta intensità',
    difficulty: 'intermediate',
    status: 'active',
    duration: 30,
    exercises: 6
  });
  
  manager.createProgram('Stretching Mattutino', flexibilityFolder.id, {
    description: 'Routine di stretching per iniziare la giornata',
    difficulty: 'beginner',
    status: 'active',
    duration: 15,
    exercises: 12
  });
  
  return manager.exportData();
};