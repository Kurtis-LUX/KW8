import React, { useState } from 'react';
import {
  Folder,
  FolderOpen,
  Heart,
  Star,
  Target,
  Zap,
  Trophy,
  Dumbbell,
  Activity,
  Calendar,
  Clock,
  Users,
  BookOpen,
  Briefcase,
  Home,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  Minus
} from 'lucide-react';

interface FolderCustomizerProps {
  selectedIcon: string;
  selectedColor: string;
  onIconChange: (icon: string) => void;
  onColorChange: (color: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Folder', component: Folder, label: 'Cartella' },
  { name: 'FolderOpen', component: FolderOpen, label: 'Cartella Aperta' },
  { name: 'Dumbbell', component: Dumbbell, label: 'Manubrio' },
  { name: 'Activity', component: Activity, label: 'Attività' },
  { name: 'Target', component: Target, label: 'Obiettivo' },
  { name: 'Trophy', component: Trophy, label: 'Trofeo' },
  { name: 'Star', component: Star, label: 'Stella' },
  { name: 'Heart', component: Heart, label: 'Cuore' },
  { name: 'Zap', component: Zap, label: 'Energia' },
  { name: 'Calendar', component: Calendar, label: 'Calendario' },
  { name: 'Clock', component: Clock, label: 'Orologio' },
  { name: 'Users', component: Users, label: 'Utenti' },
  { name: 'BookOpen', component: BookOpen, label: 'Libro' },
  { name: 'Briefcase', component: Briefcase, label: 'Valigetta' },
  { name: 'Home', component: Home, label: 'Casa' },
  { name: 'Settings', component: Settings, label: 'Impostazioni' },
  { name: 'Play', component: Play, label: 'Play' },
  { name: 'Pause', component: Pause, label: 'Pausa' },
  { name: 'CheckCircle', component: CheckCircle, label: 'Completato' },
  { name: 'AlertCircle', component: AlertCircle, label: 'Attenzione' },
  { name: 'Info', component: Info, label: 'Informazioni' },
  { name: 'Plus', component: Plus, label: 'Più' },
  { name: 'Minus', component: Minus, label: 'Meno' }
];

const AVAILABLE_COLORS = [
  { name: 'Blu', value: '#3B82F6', bg: 'bg-blue-500' },
  { name: 'Rosso', value: '#EF4444', bg: 'bg-red-500' },
  { name: 'Verde', value: '#10B981', bg: 'bg-green-500' },
  { name: 'Giallo', value: '#F59E0B', bg: 'bg-yellow-500' },
  { name: 'Viola', value: '#8B5CF6', bg: 'bg-purple-500' },
  { name: 'Rosa', value: '#EC4899', bg: 'bg-pink-500' },
  { name: 'Indaco', value: '#6366F1', bg: 'bg-indigo-500' },
  { name: 'Teal', value: '#14B8A6', bg: 'bg-teal-500' },
  { name: 'Arancione', value: '#F97316', bg: 'bg-orange-500' },
  { name: 'Grigio', value: '#6B7280', bg: 'bg-gray-500' },
  { name: 'Slate', value: '#475569', bg: 'bg-slate-500' },
  { name: 'Emerald', value: '#059669', bg: 'bg-emerald-500' }
];

const FolderCustomizer: React.FC<FolderCustomizerProps> = ({
  selectedIcon,
  selectedColor,
  onIconChange,
  onColorChange
}) => {
  const [activeTab, setActiveTab] = useState<'icon' | 'color'>('icon');

  const getIconComponent = (iconName: string) => {
    const iconData = AVAILABLE_ICONS.find(icon => icon.name === iconName);
    return iconData ? iconData.component : Folder;
  };

  const SelectedIcon = getIconComponent(selectedIcon);

  return (
    <div className="space-y-4">
      {/* Anteprima */}
      <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg">
        <div 
          className="p-4 rounded-lg shadow-sm"
          style={{ backgroundColor: selectedColor + '20', color: selectedColor }}
        >
          <SelectedIcon size={32} />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveTab('icon');
          }}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'icon' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
          }`}
        >
          Icona
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveTab('color');
          }}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'color' ? 'bg-white shadow-sm' : 'hover:bg-gray-200'
          }`}
        >
          Colore
        </button>
      </div>

      {/* Selezione Icone */}
      {activeTab === 'icon' && (
        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto no-scrollbar">
          {AVAILABLE_ICONS.map((icon) => {
            const IconComponent = icon.component;
            const isSelected = selectedIcon === icon.name;
            
            return (
              <button
                key={icon.name}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onIconChange(icon.name);
                }}
                className={`p-3 rounded-lg border-2 transition-all hover:scale-105 flex items-center justify-center ${
                  isSelected
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                title={icon.label}
              >
                <IconComponent 
                  size={20} 
                  className={isSelected ? 'text-red-600' : 'text-gray-600'}
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Selezione Colori */}
      {activeTab === 'color' && (
        <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto no-scrollbar">
          {AVAILABLE_COLORS.map((color) => {
            const isSelected = selectedColor === color.value;
            
            return (
              <button
                key={color.value}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onColorChange(color.value);
                }}
                className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                  isSelected
                    ? 'border-gray-800 ring-2 ring-gray-300'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                title={color.name}
              >
                <div 
                  className={`w-6 h-6 rounded-full ${color.bg} mx-auto`}
                  style={{ backgroundColor: color.value }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FolderCustomizer;
export { AVAILABLE_ICONS, AVAILABLE_COLORS };