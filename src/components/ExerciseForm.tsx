import React, { useState } from 'react';
import { X, Target, Plus, Trash2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Target className="mr-3 text-red-600" size={24} />
              {title}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

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

            {/* Descrizione */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrizione (opzionale)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                rows={3}
                placeholder="Breve descrizione dell'esercizio..."
              />
            </div>

            {/* Istruzioni */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Istruzioni di Esecuzione *
              </label>
              
              {/* Aggiungi nuova istruzione */}
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, addInstruction)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Passo dell'esecuzione..."
                />
                <button
                  type="button"
                  onClick={addInstruction}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Lista istruzioni */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.instructions.map((instruction, index) => (
                  <div
                    key={index}
                    className="flex items-start justify-between bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <div className="flex items-start space-x-2 flex-1">
                      <span className="inline-block w-6 h-6 bg-red-600 text-white text-xs rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                        {index + 1}
                      </span>
                      <span className="text-sm text-gray-900">{instruction}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeInstruction(index)}
                      className="text-red-500 hover:text-red-700 transition-colors ml-2 flex-shrink-0"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              {errors.instructions && (
                <p className="text-red-500 text-sm mt-1">{errors.instructions}</p>
              )}
            </div>

            {/* Attrezzatura */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Attrezzatura Necessaria (opzionale)
              </label>
              
              {/* Aggiungi nuova attrezzatura */}
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newEquipment}
                  onChange={(e) => setNewEquipment(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, addEquipment)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="es. Bilanciere, Manubri..."
                />
                <button
                  type="button"
                  onClick={addEquipment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Lista attrezzatura */}
              <div className="flex flex-wrap gap-2">
                {formData.equipment.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center bg-blue-50 px-3 py-1 rounded-full text-sm"
                  >
                    <span className="text-blue-800">{item}</span>
                    <button
                      type="button"
                      onClick={() => removeEquipment(index)}
                      className="ml-2 text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Pulsanti */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annulla
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Salvando...
                  </>
                ) : (
                  'Salva'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExerciseForm;