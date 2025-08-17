import { useState, useCallback, useRef } from 'react';
import type { TreeItem } from '../utils/folderTree';

export interface DragItem {
  id: string;
  type: 'folder' | 'program';
  parentId: string | null;
}

export interface DropZone {
  id: string | null; // null per root
  type: 'folder' | 'root';
  accepts: ('folder' | 'program')[];
}

export interface DragState {
  isDragging: boolean;
  draggedItem: DragItem | null;
  dragOverZone: string | null;
  canDrop: boolean;
}

export interface UseDragAndDropReturn {
  dragState: DragState;
  
  // Drag handlers
  handleDragStart: (item: TreeItem) => void;
  handleDragEnd: () => void;
  
  // Drop zone handlers
  handleDragOver: (e: React.DragEvent, dropZone: DropZone) => void;
  handleDragEnter: (e: React.DragEvent, dropZone: DropZone) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, dropZone: DropZone) => void;
  
  // Utilities
  canDropItem: (dragItem: DragItem, dropZone: DropZone) => boolean;
  resetDragState: () => void;
}

interface UseDragAndDropProps {
  onMoveItem: (itemId: string, newParentId: string | null) => boolean;
  onError?: (error: string) => void;
}

export const useDragAndDrop = ({ onMoveItem, onError }: UseDragAndDropProps): UseDragAndDropReturn => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    dragOverZone: null,
    canDrop: false
  });

  const dragCounter = useRef(0);
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  // Verifica se un elemento può essere rilasciato in una zona
  const canDropItem = useCallback((dragItem: DragItem, dropZone: DropZone): boolean => {
    // Non può rilasciare su se stesso
    if (dragItem.id === dropZone.id) {
      return false;
    }

    // Non può rilasciare nel proprio genitore corrente
    if (dragItem.parentId === dropZone.id) {
      return false;
    }

    // Verifica se il tipo è accettato
    if (!dropZone.accepts.includes(dragItem.type)) {
      return false;
    }

    // Non può rilasciare una cartella in un suo discendente (prevenzione cicli)
    // Questa logica dovrebbe essere implementata con accesso all'albero completo
    // Per ora assumiamo che sia valido
    return true;
  }, []);

  // Gestisce l'inizio del trascinamento
  const handleDragStart = useCallback((item: TreeItem) => {
    const dragItem: DragItem = {
      id: item.id,
      type: item.type,
      parentId: item.parentId
    };

    setDragState({
      isDragging: true,
      draggedItem: dragItem,
      dragOverZone: null,
      canDrop: false
    });

    dragCounter.current = 0;
  }, []);

  // Gestisce la fine del trascinamento
  const handleDragEnd = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverZone: null,
      canDrop: false
    });
    
    dragCounter.current = 0;
    dragStartPos.current = null;
  }, []);

  // Gestisce il passaggio sopra una zona di rilascio
  const handleDragOver = useCallback((e: React.DragEvent, dropZone: DropZone) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragState.draggedItem) return;

    const canDrop = canDropItem(dragState.draggedItem, dropZone);
    
    setDragState(prev => ({
      ...prev,
      dragOverZone: dropZone.id,
      canDrop
    }));

    // Cambia il cursore in base alla possibilità di rilascio
    e.dataTransfer.dropEffect = canDrop ? 'move' : 'none';
  }, [dragState.draggedItem, canDropItem]);

  // Gestisce l'entrata in una zona di rilascio
  const handleDragEnter = useCallback((e: React.DragEvent, dropZone: DropZone) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current++;

    if (!dragState.draggedItem) return;

    const canDrop = canDropItem(dragState.draggedItem, dropZone);
    
    setDragState(prev => ({
      ...prev,
      dragOverZone: dropZone.id,
      canDrop
    }));
  }, [dragState.draggedItem, canDropItem]);

  // Gestisce l'uscita da una zona di rilascio
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current--;

    // Solo se usciamo completamente dalla zona
    if (dragCounter.current === 0) {
      setDragState(prev => ({
        ...prev,
        dragOverZone: null,
        canDrop: false
      }));
    }
  }, []);

  // Gestisce il rilascio
  const handleDrop = useCallback((e: React.DragEvent, dropZone: DropZone) => {
    e.preventDefault();
    e.stopPropagation();
    
    dragCounter.current = 0;

    if (!dragState.draggedItem) {
      handleDragEnd();
      return;
    }

    const canDrop = canDropItem(dragState.draggedItem, dropZone);
    
    if (!canDrop) {
      onError?.('Non è possibile rilasciare l\'elemento in questa posizione');
      handleDragEnd();
      return;
    }

    try {
      const success = onMoveItem(dragState.draggedItem.id, dropZone.id);
      
      if (!success) {
        onError?.('Errore durante lo spostamento dell\'elemento');
      }
    } catch (error) {
      onError?.(error instanceof Error ? error.message : 'Errore sconosciuto durante lo spostamento');
    }

    handleDragEnd();
  }, [dragState.draggedItem, canDropItem, onMoveItem, onError, handleDragEnd]);

  // Reset dello stato di trascinamento
  const resetDragState = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedItem: null,
      dragOverZone: null,
      canDrop: false
    });
    dragCounter.current = 0;
    dragStartPos.current = null;
  }, []);

  return {
    dragState,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
    canDropItem,
    resetDragState
  };
};

// Utilità per creare attributi drag and drop
export const createDragProps = (item: TreeItem, onDragStart: (item: TreeItem) => void, onDragEnd: () => void) => ({
  draggable: true,
  onDragStart: (e: React.DragEvent) => {
    e.stopPropagation();
    // Imposta i dati di trasferimento per compatibilità
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
    onDragStart(item);
  },
  onDragEnd: (e: React.DragEvent) => {
    e.stopPropagation();
    onDragEnd();
  }
});

export const createDropProps = (
  dropZone: DropZone,
  {
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop
  }: {
    onDragOver: (e: React.DragEvent, dropZone: DropZone) => void;
    onDragEnter: (e: React.DragEvent, dropZone: DropZone) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, dropZone: DropZone) => void;
  }
) => ({
  onDragOver: (e: React.DragEvent) => onDragOver(e, dropZone),
  onDragEnter: (e: React.DragEvent) => onDragEnter(e, dropZone),
  onDragLeave: (e: React.DragEvent) => onDragLeave(e),
  onDrop: (e: React.DragEvent) => onDrop(e, dropZone)
});

export default useDragAndDrop;