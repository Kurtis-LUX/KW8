import React, { useState } from 'react';
import { 
  Book, 
  Edit, 
  Trash2, 
  GripVertical, 
  User, 
  Clock, 
  Target, 
  Star,
  Eye,
  EyeOff,
  Copy,
  Play
} from 'lucide-react';
import { createDragProps } from '../hooks/useDragAndDrop';

// Interfaccia per il programma/scheda
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
  description?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  category?: string;
  targetMuscles?: string[];
  exercises?: any[];
}

interface ProgramCardProps {
  program: ProgramItem;
  onEdit: (program: ProgramItem) => void;
  onDelete: (programId: string) => void;
  onDragStart: (item: ProgramItem) => void;
  onDragEnd: () => void;
  dragOverZone: string | null;
  canDrop: boolean;
  onDuplicate?: (program: ProgramItem) => void;
  onToggleStatus?: (programId: string, newStatus: 'draft' | 'published' | 'archived') => void;
  onPreview?: (program: ProgramItem) => void;
  level?: number;
  viewMode?: 'grid' | 'list';
  isDragging?: boolean;
  showDetails?: boolean;
}

// Componente ProgramCard
const ProgramCard: React.FC<ProgramCardProps> = ({
  program,
  onEdit,
  onDelete,
  onDragStart,
  onDragEnd,
  dragOverZone,
  canDrop,
  onDuplicate,
  onToggleStatus,
  onPreview,
  level = 0,
  viewMode = 'grid',
  isDragging = false,
  showDetails = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const dragProps = createDragProps(program, onDragStart, onDragEnd);
  
  // Gestione del drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(program));
    onDragStart(program);
  };
  
  // Funzione per ottenere il colore dello status
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Funzione per ottenere il testo dello status
  const getStatusText = (status?: string) => {
    switch (status) {
      case 'published':
        return 'Pubblicata';
      case 'draft':
        return 'Bozza';
      case 'archived':
        return 'Archiviata';
      default:
        return 'Bozza';
    }
  };
  
  // Funzione per ottenere le stelle della difficoltà
  const renderDifficultyStars = (difficulty?: number) => {
    const stars = [];
    const level = difficulty || 1;
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          className={i <= level ? 'text-yellow-400 fill-current' : 'text-gray-300'}
        />
      );
    }
    
    return stars;
  };
  
  // Rendering in modalità lista
  if (viewMode === 'list') {
    return (
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 cursor-move group ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ marginLeft: `${level * 20}px` }}
        {...dragProps}
      >
        <div className="flex items-center space-x-4 flex-1">
          <GripVertical size={16} className="text-gray-400 group-hover:text-gray-600" />
          
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Book size={20} className="text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-navy-900 mb-1">{program.title}</h4>
            {showDetails && (
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {program.coach && (
                  <div className="flex items-center space-x-1">
                    <User size={14} />
                    <span>{program.coach}</span>
                  </div>
                )}
                {program.duration && (
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{program.duration} min</span>
                  </div>
                )}
                {program.difficulty && (
                  <div className="flex items-center space-x-1">
                    <Target size={14} />
                    <div className="flex space-x-1">
                      {renderDifficultyStars(program.difficulty)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {program.status && (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
              {getStatusText(program.status)}
            </span>
          )}
        </div>
        
        <div className={`flex items-center space-x-2 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          {onPreview && (
            <button
              onClick={() => onPreview(program)}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-all duration-300"
              title="Anteprima programma"
            >
              <Eye size={16} />
            </button>
          )}
          
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(program)}
              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all duration-300"
              title="Duplica programma"
            >
              <Copy size={16} />
            </button>
          )}
          
          <button
            onClick={() => onEdit(program)}
            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-all duration-300"
            title="Modifica programma"
          >
            <Edit size={16} />
          </button>
          
          <button
            onClick={() => onDelete(program.id)}
            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-all duration-300"
            title="Elimina programma"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }
  
  // Rendering in modalità griglia (default)
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 cursor-move group relative ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ marginLeft: `${level * 20}px` }}
      {...dragProps}
    >
      {/* Grip per il drag */}
      <div className="absolute top-2 right-2">
        <GripVertical size={16} className="text-gray-400 group-hover:text-gray-600" />
      </div>
      
      {/* Header della card */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Book size={24} className="text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-navy-900 mb-1 pr-8">{program.title}</h4>
            {program.description && showDetails && (
              <p className="text-sm text-gray-600 line-clamp-2">{program.description}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Dettagli del programma */}
      {showDetails && (
        <div className="space-y-2 mb-4">
          {program.coach && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User size={14} />
              <span>Coach: {program.coach}</span>
            </div>
          )}
          
          {program.duration && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock size={14} />
              <span>Durata: {program.duration} minuti</span>
            </div>
          )}
          
          {program.difficulty && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Target size={14} />
              <span>Difficoltà:</span>
              <div className="flex space-x-1">
                {renderDifficultyStars(program.difficulty)}
              </div>
            </div>
          )}
          
          {program.exercises && program.exercises.length > 0 && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Play size={14} />
              <span>{program.exercises.length} esercizi</span>
            </div>
          )}
          
          {program.tags && program.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {program.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
              {program.tags.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{program.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Footer con status e azioni */}
      <div className="flex items-center justify-between">
        {program.status && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(program.status)}`}>
            {getStatusText(program.status)}
          </span>
        )}
        
        <div className={`flex items-center space-x-1 transition-opacity duration-300 ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}>
          {onToggleStatus && (
            <button
              onClick={() => {
                const newStatus = program.status === 'published' ? 'draft' : 'published';
                onToggleStatus(program.id, newStatus);
              }}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-all duration-300"
              title={program.status === 'published' ? 'Metti in bozza' : 'Pubblica'}
            >
              {program.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          )}
          
          {onPreview && (
            <button
              onClick={() => onPreview(program)}
              className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-all duration-300"
              title="Anteprima programma"
            >
              <Eye size={14} />
            </button>
          )}
          
          {onDuplicate && (
            <button
              onClick={() => onDuplicate(program)}
              className="p-1 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-all duration-300"
              title="Duplica programma"
            >
              <Copy size={14} />
            </button>
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
      
      {/* Data di creazione/modifica */}
      {showDetails && (program.createdAt || program.updatedAt) && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            {program.updatedAt && (
              <span>Modificato: {new Date(program.updatedAt).toLocaleDateString('it-IT')}</span>
            )}
            {!program.updatedAt && program.createdAt && (
              <span>Creato: {new Date(program.createdAt).toLocaleDateString('it-IT')}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramCard;