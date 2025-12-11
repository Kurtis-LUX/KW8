import React, { useState } from 'react';
import { Folder, Check } from 'lucide-react';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from './FolderCustomizer';

interface CustomizationPanelProps {
  mode: 'folder' | 'workout';
  selectedIcon?: string;
  selectedColor: string;
  onIconChange?: (icon: string) => void;
  onColorChange: (color: string) => void;
  titlePreview?: string;
}

const CustomizationPanel: React.FC<CustomizationPanelProps> = ({
  mode,
  selectedIcon,
  selectedColor,
  onIconChange,
  onColorChange,
  titlePreview,
}) => {
  const [tab, setTab] = useState<'icons' | 'colors'>(mode === 'folder' ? 'icons' : 'colors');
  const getIconComponent = (iconName?: string) => {
    if (!iconName) return Folder;
    const iconData = AVAILABLE_ICONS.find(icon => icon.name === iconName);
    return iconData ? iconData.component : Folder;
  };

  const SelectedIcon = getIconComponent(selectedIcon);

  const resetDefaults = (e: React.MouseEvent) => {
    e.preventDefault();
    if (mode === 'folder') {
      onIconChange && onIconChange('Folder');
      onColorChange('#EF4444');
    } else {
      onColorChange('#3B82F6');
    }
  };

  return (
    <div className="space-y-4">
      {/* Anteprima */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-4 rounded-lg bg-white" style={{ backgroundColor: selectedColor + '20' }}>
            {mode === 'folder' ? (
              <SelectedIcon size={36} strokeWidth={2} style={{ color: selectedColor }} />
            ) : (
              <div className="w-8 h-8 rounded" style={{ backgroundColor: selectedColor }} />
            )}
          </div>
          <div className="text-xs text-gray-600">
            {mode === 'folder' ? 'Anteprima cartella' : 'Anteprima colore scheda'}
            {titlePreview && (
              <span className="ml-2 text-gray-500">{titlePreview}</span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={resetDefaults}
          className="text-xs text-gray-500 hover:text-gray-700"
          aria-label="Reset personalizzazione"
        >
          Reset
        </button>
      </div>

      {/* Tabs chiare */}
      <div className="flex bg-gray-100 rounded-lg p-1 w-full">
        {mode === 'folder' && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTab('icons'); }}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${tab === 'icons' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
          >
            Icone
          </button>
        )}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTab('colors'); }}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${tab === 'colors' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'}`}
        >
          Colori
        </button>
      </div>

      {/* Selezione Icona (solo cartelle) */}
      {mode === 'folder' && onIconChange && tab === 'icons' && (
        <div>
          <div
            role="radiogroup"
            aria-label="Seleziona icona"
            className="grid grid-cols-[repeat(4,minmax(3.5rem,1fr))] gap-3 place-items-center max-h-48 overflow-y-auto no-scrollbar"
          >
            {AVAILABLE_ICONS.map((icon) => {
              const IconComp = icon.component;
              const isSelected = selectedIcon === icon.name;
              return (
                <button
                  key={icon.name}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={icon.label}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onIconChange(icon.name); }}
                  className={`w-14 h-14 p-0 rounded-md transition-colors flex items-center justify-center overflow-hidden isolate ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  title={icon.label}
                >
                  <IconComp
                    strokeWidth={2}
                    style={{ color: isSelected ? selectedColor : '#374151' }}
                    className="w-10 h-10"
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selezione Colore */}
      {tab === 'colors' && (
        <div
          role="radiogroup"
          aria-label="Seleziona colore"
          className="grid grid-cols-[repeat(4,minmax(3.5rem,1fr))] gap-3 place-items-center max-h-48 overflow-y-auto no-scrollbar"
        >
          {AVAILABLE_COLORS.map((color) => {
            const isSelected = selectedColor === color.value;
            return (
              <button
                key={color.value}
                role="radio"
                aria-checked={isSelected}
                aria-label={color.name}
                tabIndex={isSelected ? 0 : -1}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); onColorChange(color.value); }}
                className={`w-14 h-14 p-0 rounded-md bg-transparent flex items-center justify-center transition-colors overflow-hidden isolate ${isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                title={color.name}
              >
                <div
                  className={`relative w-10 h-10 rounded-full ring-2 ${isSelected ? 'ring-black/25' : 'ring-black/15'}`}
                  style={{ backgroundColor: color.value }}
                >
                  {isSelected && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                      <Check size={14} className="text-white drop-shadow-sm" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomizationPanel;
