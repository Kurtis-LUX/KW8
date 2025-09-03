import React, { useState } from 'react';
import { X, Dumbbell, Plus, Trash2 } from 'lucide-react';

interface MuscleGroup {
  id?: string;
  name: string;
  exercises: string[];
  color: string;
  description?: string;
}

interface MuscleGroupFormProps {
  muscleGroup?: MuscleGroup;
  onSubmit: (data: Omit<MuscleGroup, 'id'>) => Promise<void>;
  onCancel: () => void;
  title: string;
}

const MuscleGroupForm: React.FC<MuscleGroupFormProps> = ({
  muscleGroup,
  onSubmit,
  onCancel,
  title
}) => {
  const [formData, setFormData] = useState<Omit<MuscleGroup, 'id'>>({
    name: muscleGroup?.name || '',
    exercises: muscleGroup?.exercises || [],
    color: muscleGroup?.color || 'bg-blue-500',
    description: muscleGroup?.description || ''
  });
  const [newExercise, setNewExercise] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const colorOptions = [
    { value: 'bg-red-500', label: 'Rosso', preview: 'bg-red-500' },
    { value: 'bg-blue-500', label: 'Blu', preview: 'bg-blue-500' },
    { value: 'bg-green-500', label: 'Verde', preview: 'bg-green-500' },
    { value: 'bg-yellow-500', label: 'Giallo', preview: 'bg-yellow-500' },
    { value: 'bg-purple-500', label: 'Viola', preview: 'bg-purple-500' },
    { value: 'bg-pink-500', label: 'Rosa', preview: 'bg-pink-500' },
    { value: 'bg-indigo-500', label: 'Indaco', preview: 'bg-indigo-500' },
    { value: 'bg-orange-500', label: 'Arancione', preview: 'bg-orange-500' }
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Il nome del gruppo muscolare è obbligatorio';
    }

    if (formData.exercises.length === 0) {
      newErrors.exercises = 'Aggiungi almeno un esercizio';
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

  const addExercise = () => {
    if (newExercise.trim() && !formData.exercises.includes(newExercise.trim())) {
      setFormData(prev => ({
        ...prev,
        exercises: [...prev.exercises, newExercise.trim()]
      }));
      setNewExercise('');
      if (errors.exercises) {
        setErrors(prev => ({ ...prev, exercises: '' }));
      }
    }
  };

  const removeExercise = (index: number) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addExercise();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <Dumbbell className="mr-3 text-red-600" size={24} />
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
            {/* Nome gruppo muscolare */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Gruppo Muscolare *
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
                placeholder="es. Petto, Schiena, Gambe..."
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            {/* Colore */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Colore
              </label>
              <div className="grid grid-cols-4 gap-3">
                {colorOptions.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, color: color.value }))}
                    className={`flex items-center space-x-2 p-2 rounded-lg border-2 transition-all ${
                      formData.color === color.value
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full ${color.preview}`}></div>
                    <span className="text-sm">{color.label}</span>
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
                placeholder="Descrizione del gruppo muscolare..."
              />
            </div>

            {/* Esercizi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Esercizi *
              </label>
              
              {/* Aggiungi nuovo esercizio */}
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  value={newExercise}
                  onChange={(e) => setNewExercise(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Nome esercizio..."
                />
                <button
                  type="button"
                  onClick={addExercise}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Lista esercizi */}
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {formData.exercises.map((exercise, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm text-gray-900">{exercise}</span>
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              
              {errors.exercises && (
                <p className="text-red-500 text-sm mt-1">{errors.exercises}</p>
              )}
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

export default MuscleGroupForm;