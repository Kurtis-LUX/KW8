import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import Modal from './Modal';

interface Exercise {
  id?: string;
  name: string;
  muscleGroup: string;
  description?: string;
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string[];
}

interface ExerciseFormProps {
  exercise?: Exercise;
  onSubmit: (data: Omit<Exercise, 'id'>) => Promise<void>;
  onCancel: () => void;
  title: string;
  muscleGroups: Array<{ name: string; color: string }>;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({
  exercise,
  onSubmit,
  onCancel,
  title,
  muscleGroups
}) => {
  const [formData, setFormData] = useState<Omit<Exercise, 'id'>>({
    name: exercise?.name || '',
    muscleGroup: exercise?.muscleGroup || '',
    description: exercise?.description || '',
    instructions: exercise?.instructions || [],
    difficulty: exercise?.difficulty || 'beginner',
    equipment: exercise?.equipment || []
  });
  const [newInstruction, setNewInstruction] = useState('');
  const [newEquipment, setNewEquipment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const difficultyOptions = [
    { value: 'beginner', label: 'Principiante', color: 'bg-green-100 text-green-800' },
    { value: 'intermediate', label: 'Intermedio', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'advanced', label: 'Avanzato', color: 'bg-red-100 text-red-800' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Il nome dell\'esercizio è obbligatorio';
    }

    if (!formData.muscleGroup) {
      newErrors.muscleGroup = 'Seleziona un gruppo muscolare';
    }

    if (formData.instructions.length === 0) {
      newErrors.instructions = 'Aggiungi almeno un\'istruzione';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Errore nel salvataggio:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addInstruction = () => {
    if (newInstruction.trim()) {
      setFormData(prev => ({
        ...prev,
        instructions: [...prev.instructions, newInstruction.trim()]
      }));
      setNewInstruction('');
      if (errors.instructions) {
        setErrors(prev => ({ ...prev, instructions: '' }));
      }
    }
  };

  const removeInstruction = (index: number) => {
    setFormData(prev => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== index)
    }));
  };

  const addEquipment = () => {
    if (newEquipment.trim() && !formData.equipment.includes(newEquipment.trim())) {
      setFormData(prev => ({
        ...prev,
        equipment: [...prev.equipment, newEquipment.trim()]
      }));
      setNewEquipment('');
    }
  };

  const removeEquipment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      action();
    }
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title={title}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Nome esercizio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome Esercizio *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="es. Panca Piana, Squat..."
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Gruppo muscolare */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Gruppo Muscolare *
            </label>
            <select
              value={formData.muscleGroup}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, muscleGroup: e.target.value }));
                if (errors.muscleGroup) setErrors(prev => ({ ...prev, muscleGroup: '' }));
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 ${
                errors.muscleGroup ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Seleziona gruppo muscolare</option>
              {muscleGroups.map((group) => (
                <option key={group.name} value={group.name}>
                  {group.name}
                </option>
              ))}
            </select>
            {errors.muscleGroup && (
              <p className="text-red-500 text-sm mt-1">{errors.muscleGroup}</p>
            )}
          </div>
        </div>

        {/* Difficoltà */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Livello di Difficoltà
          </label>
          <div className="grid grid-cols-3 gap-3">
            {difficultyOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, difficulty: option.value as any }))}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  formData.difficulty === option.value
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${option.color}`}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Istruzioni */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Istruzioni *
          </label>
          <div className="space-y-3">
            {formData.instructions.map((instruction, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={instruction}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      instructions: prev.instructions.map((inst, i) => i === index ? value : inst)
                    }));
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={`Istruzione ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      instructions: prev.instructions.filter((_, i) => i !== index)
                    }));
                  }}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newInstruction}
                onChange={(e) => setNewInstruction(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addInstruction)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nuova istruzione..."
              />
              <button
                type="button"
                onClick={addInstruction}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Aggiungi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Attrezzatura */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Attrezzatura
          </label>
          <div className="space-y-3">
            {formData.equipment.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      equipment: prev.equipment.map((eq, i) => i === index ? value : eq)
                    }));
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={`Attrezzatura ${index + 1}`}
                />
                <button
                  type="button"
                  onClick={() => removeEquipment(index)}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={newEquipment}
                onChange={(e) => setNewEquipment(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, addEquipment)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Nuova attrezzatura..."
              />
              <button
                type="button"
                onClick={addEquipment}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>Aggiungi</span>
              </button>
            </div>
          </div>
        </div>

        {/* Azioni */}
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
          >
            Annulla
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Salva
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ExerciseForm;