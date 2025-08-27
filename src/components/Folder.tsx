import React, { useState, useRef, useEffect } from 'react';
import { 
  Folder as FolderIcon, 
  FolderOpen, 
  Edit, 
  Trash2, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  GripVertical,
  Home,
  Briefcase,
  Heart,
  Zap,
  Shield,
  Award,
  Book,
  Users,
  Activity,
  Target,
  Star
} from 'lucide-react';
import { createDragProps, createDropProps } from '../hooks/useDragAndDrop';
import type { DropZone } from '../hooks/useDragAndDrop';

// Tipi per le props del componente
export interface FolderItem {
  id: string;
  name: string;
  icon: string;
  type: 'folder';
  parentId?: string;
  children: (FolderItem | ProgramItem)[];
  order: number;
  isExpanded?: boolean;
}

export interface ProgramItem {
  id: string;
  title: string;
  type: 'program';
  parentFolderId?: string;
  order: number;
  coach?: string;
  duration?: number;
  difficulty?: number;
  status?: 'draft' | 'published' | 'archived';
}

interface FolderProps {
  folder: FolderItem;
  onRename: (folderId: string, newName: string) => void;
  onDelete: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  onCreateProgram: (parentId: string) => void;
  onToggleExpand: (folderId: string) => void;
  onDragStart: (item: FolderItem | ProgramItem) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent, dropZone: DropZone) => void;
  onDragEnter: (e: React.DragEvent, dropZone: DropZone) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, dropZone: DropZone) => void;
  onIconChange: (folderId: string, newIcon: string) => void;
  onEditProgram: (program: ProgramItem) => void;
  onDeleteProgram: (programId: string) => void;
  dragOverZone: string | null;
  canDrop: boolean;
  level?: number;
  isDragging?: boolean;
}

// Mappa delle icone disponibili
const iconMap: { [key: string]: React.ComponentType<any> } = {
  Folder: FolderIcon,
  FolderOpen: FolderOpen,
  Home: Home,
  Briefcase: Briefcase,
  Heart: Heart,
  Zap: Zap,
  Shield: Shield,
  Award: Award,
  Book: Book,
  Users: Users,
  Activity: Activity,
  Target: Target,
  Star: Star
};

const iconOptions = Object.keys(iconMap);

// Componente per visualizzare una singola scheda/programma
const ProgramCard: React.FC<{
  program: ProgramItem;
  onEdit: (program: ProgramItem) => void;
  onDelete: (programId: string) => void;
  onDragStart: (item: ProgramItem) => void;
  onDragEnd: () => void;
  dragOverZone: string | null;
  canDrop: boolean;
  level: number;
}> = ({ program, onEdit, onDelete, onDragStart, onDragEnd, dragOverZone, canDrop, level }) => {
  const dragProps = createDragProps(program, onDragStart, onDragEnd);

  return (
    <div
      className={`flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 cursor-move group`}
      style={{ marginLeft: `${(level + 1) * 20}px` }}
      {...dragProps}
    >
      <div className="flex items-center space-x-3">
        <GripVertical size={16} className="text-gray-400 group-hover:text-gray-600" />
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Book size={16} className="text-blue-600" />
        </div>
        <div>
          <h4 className="font-medium text-navy-900">{program.title}</h4>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {program.coach && <span>Coach: {program.coach}</span>}
            {program.duration && <span>• {program.duration} min</span>}
            {program.difficulty && <span>• Diff: {program.difficulty}/5</span>}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        {program.status && (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            program.status === 'published'
              ? 'bg-green-100 text-green-800'
              : program.status === 'draft'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {program.status === 'published' ? 'Pubblicata' : 
             program.status === 'draft' ? 'Bozza' : 'Archiviata'}
          </span>
        )}
        
        <button
          onClick={() => onEdit(program)}
          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-300"
          title="Modifica programma"
        >
          <Edit size={14} />
        </button>
        
        <button
          onClick={() => onDelete(program.id)}
          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-300"
          title="Elimina programma"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

// Componente principale Folder
const Folder: React.FC<FolderProps> = ({
  folder,
  onRename,
  onDelete,
  onCreateSubfolder,
  onCreateProgram,
  onToggleExpand,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onIconChange,
  onEditProgram,
  onDeleteProgram,
  dragOverZone,
  canDrop,
  level = 0,
  isDragging = false
}) => {
  // Verifica che folder esista
  if (!folder) {
    return null;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const iconPickerRef = useRef<HTMLDivElement>(null);
  
  const IconComponent = iconMap[folder.icon] || FolderIcon;
  const isExpanded = folder.isExpanded ?? false;
  
  // Focus sull'input quando si entra in modalità editing
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  // Chiudi il picker delle icone quando si clicca fuori
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target as Node)) {
        setShowIconPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Gestione del salvataggio del nome
  const handleSaveName = () => {
    if (editName.trim() && editName.trim() !== folder.name) {
      onRename(folder.id, editName.trim());
    }
    setIsEditing(false);
    setEditName(folder.name);
  };
  
  // Gestione dei tasti durante l'editing
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditName(folder.name);
    }
  };
  
  // Gestione del drag and drop
  const dropZone: DropZone = {
    id: folder.id,
    type: 'folder',
    accepts: ['folder', 'program']
  };

  const dragProps = createDragProps(folder, onDragStart, onDragEnd);
  const dropProps = createDropProps(dropZone, {
    onDragOver,
    onDragEnter,
    onDragLeave,
    onDrop
  });

  const isDropTarget = dragOverZone === folder.id;
  const dropIndicatorClass = isDropTarget
    ? canDrop
      ? 'ring-2 ring-green-400 bg-green-50'
      : 'ring-2 ring-red-400 bg-red-50'
    : '';
  
  return (
    <div className={`transition-all duration-300 ${isDragging ? 'opacity-50' : ''}`}>
      {/* Header della cartella */}
      <div
        className={`flex items-center justify-between p-3 rounded-lg transition-all duration-300 group cursor-move ${
          isDragOver 
            ? 'bg-blue-50 border-2 border-blue-300 border-dashed' 
            : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
        } ${dropIndicatorClass}`}
        style={{ marginLeft: `${level * 20}px` }}
        {...(!isEditing ? dragProps : {})}
        {...dropProps}
      >
        <div className="flex items-center space-x-3 flex-1">
          {/* Icona di espansione */}
          <button
            onClick={() => onToggleExpand(folder.id)}
            className="p-1 hover:bg-gray-200 rounded transition-colors duration-300"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-600" />
            ) : (
              <ChevronRight size={16} className="text-gray-600" />
            )}
          </button>
          
          {/* Grip per il drag */}
          {!isEditing && (
            <GripVertical size={16} className="text-gray-400 group-hover:text-gray-600 cursor-move" />
          )}
          
          {/* Icona della cartella */}
          <div className="relative">
            <button
              onClick={() => setShowIconPicker(!showIconPicker)}
              className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center hover:bg-yellow-200 transition-colors duration-300"
              title="Cambia icona"
            >
              <IconComponent size={16} className="text-yellow-600" />
            </button>
            
            {/* Picker delle icone */}
            {showIconPicker && (
              <div
                ref={iconPickerRef}
                className="absolute top-10 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 grid grid-cols-4 gap-1 z-50"
              >
                {iconOptions.map((iconName) => {
                  const Icon = iconMap[iconName];
                  return (
                    <button
                      key={iconName}
                      onClick={() => {
                        onIconChange(folder.id, iconName);
                        setShowIconPicker(false);
                      }}
                      className={`w-8 h-8 rounded flex items-center justify-center hover:bg-gray-100 transition-colors duration-300 ${
                        folder.icon === iconName ? 'bg-blue-100 text-blue-600' : 'text-gray-600'
                      }`}
                      title={iconName}
                    >
                      <Icon size={14} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Nome della cartella */}
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={handleKeyPress}
              className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          ) : (
            <span
              className="font-medium text-navy-900 cursor-pointer"
              onClick={() => setIsEditing(true)}
            >
              {folder.name}
            </span>
          )}
        </div>
        
        {/* Azioni della cartella */}
        {!isEditing && (
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={() => onCreateSubfolder(folder.id)}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all duration-300"
              title="Crea sottocartella"
            >
              <Plus size={14} />
            </button>
            
            <button
              onClick={() => onCreateProgram(folder.id)}
              className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-300"
              title="Crea programma"
            >
              <Book size={14} />
            </button>
            
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-all duration-300"
              title="Rinomina cartella"
            >
              <Edit size={14} />
            </button>
            
            <button
              onClick={() => onDelete(folder.id)}
              className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-300"
              title="Elimina cartella"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      
      {/* Contenuto della cartella (sottocartelle e programmi) */}
      {isExpanded && (
        <div className="mt-2 space-y-2">
          {folder.children
            .sort((a, b) => a.order - b.order)
            .map((child) => {
              if (child.type === 'folder') {
                return (
                  <Folder
                    key={child.id}
                    folder={child as FolderItem}
                    onRename={onRename}
                    onDelete={onDelete}
                    onCreateSubfolder={onCreateSubfolder}
                    onCreateProgram={onCreateProgram}
                    onToggleExpand={onToggleExpand}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onDragOver={onDragOver}
                    onDragEnter={onDragEnter}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onIconChange={onIconChange}
                    onEditProgram={onEditProgram}
                    onDeleteProgram={onDeleteProgram}
                    dragOverZone={dragOverZone}
                    canDrop={canDrop}
                    level={level + 1}
                  />
                );
              } else {
                return (
                  <ProgramCard
                    key={child.id}
                    program={child as ProgramItem}
                    onEdit={onEditProgram}
                    onDelete={onDeleteProgram}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    dragOverZone={dragOverZone}
                    canDrop={canDrop}
                    level={level}
                  />
                );
              }
            })}
        </div>
      )}
    </div>
  );
};

export default Folder;
export { ProgramCard };