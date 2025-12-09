import React, { useState } from 'react';
import { 
  Book,
  Folder as FolderIcon,
  FolderOpen,
  Home,
  Briefcase,
  Heart,
  Zap,
  Shield,
  Award,
  Users,
  Activity,
  Edit, 
  Trash2, 
  GripVertical, 
  User, 
  Clock, 
  Target, 
  Star,
  Eye,
  Copy,
  Play,
  Calendar
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
  // UI arricchimento lato atleta
  color?: string;
  icon?: string;
  durationWeeks?: number;
  trainingDays?: number;
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
  // Nuove opzioni per uso lato atleta
  role?: 'coach' | 'athlete';
  onOpen?: (program: ProgramItem) => void;
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
  showDetails = true,
  role = 'coach',
  onOpen
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Mappa delle icone disponibili (coerente con gestione cartelle)
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
  const IconComp = program.icon && iconMap[program.icon] ? iconMap[program.icon] : Book;
  const accentColor = program.color || '#3B82F6';
  const accentBg = `${accentColor}20`;
  
  const dragProps = role === 'coach' ? createDragProps(program, onDragStart, onDragEnd) : {};
  
  // Gestione del drag start
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/json', JSON.stringify(program));
    onDragStart(program);
  };
  
  // Rimosse funzioni di stato (non più usate)
  
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
        onClick={() => {
          if (role === 'athlete' && onOpen) onOpen(program);
        }}
        className={`flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-300 ${role === 'coach' ? 'cursor-move' : 'cursor-pointer'} group ${
          isDragging ? 'opacity-50' : ''
        }`}
        style={{ marginLeft: `${level * 20}px` }}
        {...dragProps}
      >
        <div className="flex items-center space-x-4 flex-1">
          {role === 'coach' && (
            <GripVertical size={16} className="text-gray-400 group-hover:text-gray-600" />
          )}
          
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentBg }}>
            <IconComp size={20} style={{ color: accentColor }} />
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
                {program.durationWeeks && (
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>{program.durationWeeks} {program.durationWeeks === 1 ? 'settimana' : 'settimane'}</span>
                  </div>
                )}
                {typeof program.trainingDays === 'number' && (
                  <div className="flex items-center space-x-1">
                    <Calendar size={14} />
                    <span>{program.trainingDays} {program.trainingDays === 1 ? 'giorno' : 'giorni'}</span>
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
          
          {/* Stato rimosso dalla vista lista */}
        </div>
        
        {role === 'coach' && (
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
        )}
      </div>
    );
  }
  
  // Rendering in modalità griglia (default)
  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => {
        if (role === 'athlete' && onOpen) onOpen(program);
      }}
      className={`bg-white border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-all duration-300 ${role === 'coach' ? 'cursor-move' : 'cursor-pointer'} group relative ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ marginLeft: `${level * 20}px` }}
      {...dragProps}
    >
      {/* Grip per il drag */}
      {role === 'coach' && (
        <div className="absolute top-2 right-2">
          <GripVertical size={16} className="text-gray-400 group-hover:text-gray-600" />
        </div>
      )}
      
      {/* Header della card */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: accentBg }}>
            <IconComp size={24} style={{ color: accentColor }} />
          </div>
          
          <div className="flex-1">
            <h4 className="font-semibold text-navy-900 mb-1 pr-8">{program.title}</h4>
            {showDetails && (role === 'athlete' || !!program.description) && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {program.description?.trim() || (role === 'athlete' ? 'Nessuna descrizione' : '')}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Dettagli del programma (mostra meta solo lato coach) */}
      {showDetails && (
        <div className="space-y-2 mb-4">
          {role === 'coach' && program.coach && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User size={14} />
              <span>Coach: {program.coach}</span>
            </div>
          )}
          
          {program.durationWeeks && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock size={14} />
              <span>Durata: {program.durationWeeks} {program.durationWeeks === 1 ? 'settimana' : 'settimane'}</span>
            </div>
          )}
          {role === 'coach' && typeof program.trainingDays === 'number' && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Calendar size={14} />
              <span>Giorni di allenamento: {program.trainingDays}</span>
            </div>
          )}
          
          {role === 'coach' && program.difficulty && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Target size={14} />
              <span>Difficoltà:</span>
              <div className="flex space-x-1">
                {renderDifficultyStars(program.difficulty)}
              </div>
            </div>
          )}
          
          {role === 'coach' && program.exercises && program.exercises.length > 0 && (
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
      
      {/* Footer con status e azioni (nasconde status lato atleta) */}
      <div className="flex items-center justify-between">
        {/* Stato rimosso dalla vista griglia */}
        
        {role === 'coach' && (
          <div className={`flex items-center space-x-1 transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
          {/* Toggle stato rimosso */}
          
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
        )}
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
