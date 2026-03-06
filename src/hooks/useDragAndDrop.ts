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
  const canDropItem = useCallback((_dragItem: DragItem, _dropZone: DropZone): boolean => {
    return false;
  }, []);

  // Gestisce l'inizio del trascinamento
  const handleDragStart = useCallback((_item: TreeItem) => {
    setDragState({
      isDragging: false,
      draggedItem: null,
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
  const handleDragOver = useCallback((e: React.DragEvent, _dropZone: DropZone) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'none';
    setDragState(prev => ({ ...prev, dragOverZone: null, canDrop: false }));
  }, []);

  // Gestisce l'entrata in una zona di rilascio
  const handleDragEnter = useCallback((e: React.DragEvent, _dropZone: DropZone) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    setDragState(prev => ({ ...prev, dragOverZone: null, canDrop: false }));
  }, []);

  // Gestisce l'uscita da una zona di rilascio
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = Math.max(0, dragCounter.current - 1);
    if (dragCounter.current === 0) {
      setDragState(prev => ({ ...prev, dragOverZone: null, canDrop: false }));
    }
  }, []);

  // Gestisce il rilascio
  const handleDrop = useCallback((e: React.DragEvent, _dropZone: DropZone) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    handleDragEnd();
  }, [handleDragEnd]);

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
  draggable: false
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
  onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); },
  onDragEnter: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); },
  onDragLeave: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); },
  onDrop: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); }
});

export default useDragAndDrop;
