import React, { useState } from 'react';
import { Plus, Trash2, Edit3, Palette } from 'lucide-react';
import { WorkoutVariant } from '../utils/database';

interface WorkoutCustomizerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
  variants: WorkoutVariant[];
  onVariantsChange: (variants: WorkoutVariant[]) => void;
  workoutId?: string;
  originalWorkoutTitle?: string;
  showVariants?: boolean;
}

const AVAILABLE_COLORS = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#6B7280', // Gray
  '#1F2937', // Dark Gray
];

const WorkoutCustomizer: React.FC<WorkoutCustomizerProps> = ({
  selectedColor,
  onColorChange,
  variants,
  onVariantsChange,
  workoutId,
  originalWorkoutTitle,
  showVariants = true
}) => {
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [editingVariant, setEditingVariant] = useState<WorkoutVariant | null>(null);
  const [variantName, setVariantName] = useState('');
  const [variantDescription, setVariantDescription] = useState('');

  const handleAddVariant = () => {
    // Calcola il numero della prossima variante
    const variantNumbers = variants
      .map(v => {
        const match = v.name.match(/Variante (\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    const nextVariantNumber = variantNumbers.length > 0 ? Math.max(...variantNumbers) + 1 : 1;
    
    const baseTitle = (originalWorkoutTitle && originalWorkoutTitle.trim()) ? originalWorkoutTitle.trim() : 'Nuova scheda';
    const finalVariantName = `Variante ${nextVariantNumber} di ${baseTitle}`;

    const newVariant: WorkoutVariant = {
      id: `variant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: finalVariantName,
      description: variantDescription.trim() || undefined,
      parentWorkoutId: workoutId || '',
      modifications: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onVariantsChange([...variants, newVariant]);
    setVariantName('');
    setVariantDescription('');
    setShowVariantForm(false);
  };

  const handleEditVariant = (variant: WorkoutVariant) => {
    setEditingVariant(variant);
    setVariantName(variant.name);
    setVariantDescription(variant.description || '');
    setShowVariantForm(true);
  };

  const handleUpdateVariant = () => {
    if (!editingVariant || !variantName.trim()) return;

    const updatedVariant: WorkoutVariant = {
      ...editingVariant,
      name: variantName.trim(),
      description: variantDescription.trim() || undefined,
      updatedAt: new Date().toISOString()
    };

    const updatedVariants = variants.map(v => 
      v.id === editingVariant.id ? updatedVariant : v
    );

    onVariantsChange(updatedVariants);
    setEditingVariant(null);
    setVariantName('');
    setVariantDescription('');
    setShowVariantForm(false);
  };

  const handleDeleteVariant = (variantId: string) => {
    const updatedVariants = variants.filter(v => v.id !== variantId);
    onVariantsChange(updatedVariants);
  };

  const cancelVariantForm = () => {
    setShowVariantForm(false);
    setEditingVariant(null);
    setVariantName('');
    setVariantDescription('');
  };

  return (
    <div className="space-y-6">
      {/* Selezione colore */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Colore scheda
        </label>
        <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto no-scrollbar">
          {AVAILABLE_COLORS.map((color) => (
            <button
              key={color}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onColorChange(color);
              }}
              className={`w-9 h-9 rounded-full border-2 transition-all bg-white ${
                selectedColor === color
                  ? 'border-gray-800 scale-110'
                  : 'border-gray-300 hover:border-gray-500'
              }`}
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
        
        {/* Anteprima colore */}
        <div className="mt-3 p-3 rounded-lg border bg-white" style={{ backgroundColor: selectedColor + '20' }}>
          <div className="flex items-center space-x-2">
            <div 
              className="w-4 h-4 rounded ring-1 ring-black/10"
              style={{ backgroundColor: selectedColor }}
            />
            <span className="text-sm" style={{ color: selectedColor }}>
              Anteprima colore scheda
            </span>
          </div>
        </div>
      </div>

      {/* Gestione varianti */}
      {showVariants && (
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Varianti ({variants.length})
          </label>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowVariantForm(true);
            }}
            className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700"
          >
            <Plus size={14} />
            <span>Aggiungi variante</span>
          </button>
        </div>

        {/* Lista varianti esistenti */}
        {variants.length > 0 && (
          <div className="space-y-2 mb-4">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{variant.name}</h4>
                  {variant.description && (
                    <p className="text-sm text-gray-600">{variant.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditVariant(variant);
                    }}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteVariant(variant.id);
                    }}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form per aggiungere/modificare variante */}
        {showVariantForm && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900 mb-3">
              {editingVariant ? 'Modifica variante' : 'Nuova variante'}
            </h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome variante
                </label>
                <input
                  type="text"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Es. Versione principianti, Con pesi maggiori... (verrà generato automaticamente)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrizione (opzionale)
                </label>
                <textarea
                  value={variantDescription}
                  onChange={(e) => setVariantDescription(e.target.value)}
                  placeholder="Descrivi le modifiche di questa variante..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-2 mt-4">
              <button
                onClick={cancelVariantForm}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={editingVariant ? handleUpdateVariant : handleAddVariant}
                disabled={editingVariant ? !variantName.trim() : false}
                className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingVariant ? 'Aggiorna' : 'Aggiungi'}
              </button>
            </div>
          </div>
        )}
      </div>
      )}
    </div>
  );
};

export default WorkoutCustomizer;
