import React, { useState } from 'react';
import { FolderPlus, Plus, X, Folder, FileText } from 'lucide-react';
import { FOLDER_ICONS } from '../utils/folderTree';
import type { FolderItem, ProgramItem } from '../utils/folderTree';

interface CreateButtonsProps {
  currentFolderId: string | null;
  onCreateFolder: (name: string, parentId: string | null, icon?: string) => Promise<any> | any;
  onCreateProgram: (title: string, parentId: string | null, options?: Partial<Pick<ProgramItem, 'description' | 'difficulty' | 'status' | 'duration' | 'exercises'>>) => Promise<any> | any;
  className?: string;
}

interface CreateFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, icon: string) => void;
}

interface CreateProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
  }) => void;
}

// Modal per creare una nuova cartella
const CreateFolderModal: React.FC<CreateFolderModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('📁');
  const [errors, setErrors] = useState<{ name?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { name?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Il nome della cartella è obbligatorio';
    } else if (name.trim().length < 2) {
      newErrors.name = 'Il nome deve essere di almeno 2 caratteri';
    } else if (name.trim().length > 50) {
      newErrors.name = 'Il nome non può superare i 50 caratteri';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(name.trim(), selectedIcon);
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setSelectedIcon('📁');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Crea Nuova Cartella
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="folder-name" className="block text-sm font-medium text-gray-700 mb-1">
              Nome Cartella
            </label>
            <input
              id="folder-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Inserisci il nome della cartella"
              autoFocus
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icona Cartella
            </label>
            <div className="grid grid-cols-8 gap-2">
              {FOLDER_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`w-10 h-10 flex items-center justify-center text-xl rounded-md border-2 transition-colors ${
                    selectedIcon === icon
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Crea Cartella
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Modal per creare un nuovo programma
const CreateProgramModal: React.FC<CreateProgramModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    duration: 60
  });
  const [errors, setErrors] = useState<{ title?: string; duration?: string }>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: { title?: string; duration?: string } = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Il titolo del programma è obbligatorio';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Il titolo deve essere di almeno 3 caratteri';
    } else if (formData.title.trim().length > 100) {
      newErrors.title = 'Il titolo non può superare i 100 caratteri';
    }
    
    if (formData.duration < 5) {
      newErrors.duration = 'La durata minima è di 5 minuti';
    } else if (formData.duration > 300) {
      newErrors.duration = 'La durata massima è di 300 minuti';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit({
      title: formData.title.trim(),
      description: formData.description.trim(),
      difficulty: formData.difficulty,
      duration: formData.duration
    });
    handleClose();
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      difficulty: 'beginner',
      duration: 60
    });
    setErrors({});
    onClose();
  };

  const handleInputChange = (field: keyof typeof formData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Crea Nuovo Programma
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="program-title" className="block text-sm font-medium text-gray-700 mb-1">
              Titolo Programma *
            </label>
            <input
              id="program-title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Inserisci il titolo del programma"
              autoFocus
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label htmlFor="program-description" className="block text-sm font-medium text-gray-700 mb-1">
              Descrizione
            </label>
            <textarea
              id="program-description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descrizione del programma (opzionale)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="program-difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                Difficoltà
              </label>
              <select
                id="program-difficulty"
                value={formData.difficulty}
                onChange={(e) => handleInputChange('difficulty', e.target.value as 'beginner' | 'intermediate' | 'advanced')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzato</option>
              </select>
            </div>

            <div>
              <label htmlFor="program-duration" className="block text-sm font-medium text-gray-700 mb-1">
                Durata (minuti) *
              </label>
              <input
                id="program-duration"
                type="number"
                min="5"
                max="300"
                value={formData.duration}
                onChange={(e) => handleInputChange('duration', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.duration ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.duration && (
                <p className="text-red-500 text-sm mt-1">{errors.duration}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Crea Programma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Componente principale per i pulsanti di creazione
const CreateButtons: React.FC<CreateButtonsProps> = ({
  currentFolderId,
  onCreateFolder,
  onCreateProgram,
  className = ''
}) => {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showProgramModal, setShowProgramModal] = useState(false);

  const handleCreateFolder = async (name: string, icon: string) => {
    try {
      await onCreateFolder(name, currentFolderId, icon);
      setShowFolderModal(false);
    } catch (error) {
      console.error('Errore nella creazione della cartella:', error);
    }
  };

  const handleCreateProgram = async (data: {
    title: string;
    description: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    duration: number;
  }) => {
    try {
      await onCreateProgram(data.title, currentFolderId, {
        description: data.description,
        difficulty: data.difficulty,
        duration: data.duration,
        status: 'draft'
      });
      setShowProgramModal(false);
    } catch (error) {
      console.error('Errore nella creazione del programma:', error);
    }
  };

  return (
    <>
      <div className={`flex gap-3 ${className}`}>
        <button
          onClick={() => setShowFolderModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
        >
          <FolderPlus className="w-4 h-4" />
          Crea Cartella
        </button>
        
        <button
          onClick={() => setShowProgramModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Crea Programma
        </button>
      </div>

      <CreateFolderModal
        isOpen={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onSubmit={handleCreateFolder}
      />

      <CreateProgramModal
        isOpen={showProgramModal}
        onClose={() => setShowProgramModal(false)}
        onSubmit={handleCreateProgram}
      />
    </>
  );
};

export default CreateButtons;