import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, Zap, Shield, Heart, Edit, Plus, Trash2, Save, X, Upload, Palette } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

interface GymArea {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  iconName: string;
  description: string;
  image: string;
  overlayColor: string;
  overlayOpacity: number;
  iconColor: string;
  textColor: string;
}

interface EditableGymAreasSectionProps {
  isEditing?: boolean;
  onSave?: (areas: GymArea[]) => void;
}

const availableIcons = {
  Dumbbell,
  Zap,
  Shield,
  Heart
};

const colorOptions = [
  { name: 'Blu Navy', value: 'bg-blue-900' },
  { name: 'Rosso', value: 'bg-red-600' },
  { name: 'Bianco', value: 'bg-white' },
  { name: 'Grigio', value: 'bg-gray-900' },
  { name: 'Verde', value: 'bg-green-600' },
  { name: 'Viola', value: 'bg-purple-600' },
  { name: 'Giallo', value: 'bg-yellow-500' },
  { name: 'Arancione', value: 'bg-orange-500' }
];

const textColorOptions = [
  { name: 'Bianco', value: 'text-white' },
  { name: 'Nero', value: 'text-gray-900' },
  { name: 'Rosso', value: 'text-red-600' },
  { name: 'Blu', value: 'text-blue-900' },
  { name: 'Giallo', value: 'text-yellow-400' }
];

const EditableGymAreasSection: React.FC<EditableGymAreasSectionProps> = ({ isEditing = false, onSave }) => {
  const { t } = useLanguageContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [editingArea, setEditingArea] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [areas, setAreas] = useState<GymArea[]>([
    {
      id: 'sala-pesi',
      title: t.weightRoom || 'Sala Pesi',
      icon: Dumbbell,
      iconName: 'Dumbbell',
      description: t.weightRoomDesc || 'Allenamento con pesi e macchine professionali',
      image: '/images/sala pesi.jpg',
      overlayColor: 'bg-blue-900',
      overlayOpacity: 70,
      iconColor: 'text-red-600',
      textColor: 'text-white'
    },
    {
      id: 'crosstraining',
      title: t.crossfit || 'CrossTraining',
      icon: Zap,
      iconName: 'Zap',
      description: t.crossfitDesc || 'Allenamento funzionale ad alta intensità',
      image: '/images/crossfit.jpg',
      overlayColor: 'bg-red-600',
      overlayOpacity: 30,
      iconColor: 'text-blue-900',
      textColor: 'text-white'
    },
    {
      id: 'karate',
      title: t.karate || 'Karate',
      icon: Shield,
      iconName: 'Shield',
      description: t.karateDesc || 'Arte marziale tradizionale giapponese',
      image: '/images/karate.jpg',
      overlayColor: 'bg-white',
      overlayOpacity: 70,
      iconColor: 'text-yellow-400',
      textColor: 'text-gray-900'
    },
    {
      id: 'yoga',
      title: t.yoga || 'Yoga',
      icon: Heart,
      iconName: 'Heart',
      description: t.yogaDesc || 'Equilibrio tra mente e corpo',
      image: '/images/yoga.jpg',
      overlayColor: 'bg-white',
      overlayOpacity: 30,
      iconColor: 'text-white',
      textColor: 'text-gray-900'
    }
  ]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.2,
        rootMargin: '50px'
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % areas.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + areas.length) % areas.length);
  };

  const handleStart = (clientX: number) => {
    if (isEditing) return;
    setIsDragging(true);
    setStartX(clientX);
    setCurrentX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging || isEditing) return;
    setCurrentX(clientX);
  };

  const handleEnd = () => {
    if (!isDragging || isEditing) return;
    setIsDragging(false);
    
    const diff = startX - currentX;
    const threshold = 50;
    
    if (diff > threshold) {
      nextSlide();
    } else if (diff < -threshold) {
      prevSlide();
    }
  };

  const updateArea = (index: number, updates: Partial<GymArea>) => {
    setAreas(prev => prev.map((area, i) => 
      i === index ? { ...area, ...updates } : area
    ));
  };

  const deleteArea = (index: number) => {
    if (areas.length <= 1) {
      alert('Deve rimanere almeno un\'area');
      return;
    }
    setAreas(prev => prev.filter((_, i) => i !== index));
    if (currentSlide >= areas.length - 1) {
      setCurrentSlide(0);
    }
  };

  const addArea = () => {
    const newArea: GymArea = {
      id: `area-${Date.now()}`,
      title: 'Nuova Area',
      icon: Dumbbell,
      iconName: 'Dumbbell',
      description: 'Descrizione della nuova area',
      image: '/images/default-gym.jpg',
      overlayColor: 'bg-gray-900',
      overlayOpacity: 50,
      iconColor: 'text-red-600',
      textColor: 'text-white'
    };
    setAreas(prev => [...prev, newArea]);
    setShowAddModal(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(areas);
    }
  };

  const handleImageUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateArea(index, { image: result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <section 
      id="aree"
      ref={sectionRef}
      className={`py-20 bg-white transition-all duration-1000 transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center mb-16">
          <h2 className={`text-4xl md:text-5xl font-bold text-navy-900 text-center transition-all duration-800 transform ${
            isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-8 opacity-0 scale-95'
          }`}>
            {t.gymAreas || 'LE NOSTRE AREE'}
          </h2>
          {isEditing && (
            <div className="ml-4 flex space-x-2">
              <button
                onClick={handleSave}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save size={16} className="mr-1" />
                Salva
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={16} className="mr-1" />
                Aggiungi Area
              </button>
            </div>
          )}
        </div>

        <div className={`relative max-w-4xl mx-auto transition-all duration-1000 transform ${
          isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-16 opacity-0 scale-95'
        }`}
        style={{ transitionDelay: '300ms' }}>
          <div 
            ref={carouselRef}
            className="relative overflow-hidden rounded-xl shadow-2xl"
          >
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ 
                transform: `translateX(-${currentSlide * 100}%)`,
              }}
            >
              {areas.map((area, index) => {
                const Icon = area.icon;
                const overlayClass = `${area.overlayColor} bg-opacity-${area.overlayOpacity}`;
                
                return (
                  <div key={area.id} className="w-full flex-shrink-0 relative">
                    <div className="relative h-96">
                      <img 
                        src={area.image} 
                        alt={area.title}
                        className="w-full h-full object-cover transition-transform duration-700"
                      />
                      <div className={`absolute inset-0 ${overlayClass} flex items-center justify-center transition-opacity duration-500`}>
                        <div className="text-center p-8">
                          <Icon size={64} className={`mx-auto mb-6 ${area.iconColor} animate-bounce-subtle`} />
                          <h3 className={`text-3xl font-bold mb-6 tracking-wide ${area.textColor}`}>{area.title}</h3>
                          <p className={`text-lg max-w-md leading-relaxed ${area.textColor}`}>{area.description}</p>
                        </div>
                      </div>
                      
                      {isEditing && (
                        <div className="absolute top-4 right-4 flex space-x-2">
                          <button
                            onClick={() => setEditingArea(editingArea === index ? null : index)}
                            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteArea(index)}
                            className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {isEditing && editingArea === index && (
                      <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-10">
                        <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4 max-h-96 overflow-y-auto">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Modifica Area</h3>
                            <button
                              onClick={() => setEditingArea(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X size={20} />
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">Titolo</label>
                              <input
                                type="text"
                                value={area.title}
                                onChange={(e) => updateArea(index, { title: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Descrizione</label>
                              <textarea
                                value={area.description}
                                onChange={(e) => updateArea(index, { description: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Colore Overlay</label>
                              <select
                                value={area.overlayColor}
                                onChange={(e) => updateArea(index, { overlayColor: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {colorOptions.map(color => (
                                  <option key={color.value} value={color.value}>{color.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Opacità Overlay (%)</label>
                              <input
                                type="range"
                                min="10"
                                max="90"
                                step="10"
                                value={area.overlayOpacity}
                                onChange={(e) => updateArea(index, { overlayOpacity: parseInt(e.target.value) })}
                                className="w-full"
                              />
                              <span className="text-sm text-gray-600">{area.overlayOpacity}%</span>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Colore Icona</label>
                              <select
                                value={area.iconColor}
                                onChange={(e) => updateArea(index, { iconColor: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {textColorOptions.map(color => (
                                  <option key={color.value} value={color.value}>{color.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Colore Testo</label>
                              <select
                                value={area.textColor}
                                onChange={(e) => updateArea(index, { textColor: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {textColorOptions.map(color => (
                                  <option key={color.value} value={color.value}>{color.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Icona</label>
                              <select
                                value={area.iconName}
                                onChange={(e) => {
                                  const iconName = e.target.value as keyof typeof availableIcons;
                                  updateArea(index, { 
                                    iconName,
                                    icon: availableIcons[iconName]
                                  });
                                }}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              >
                                {Object.keys(availableIcons).map(iconName => (
                                  <option key={iconName} value={iconName}>{iconName}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium mb-1">Immagine</label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleImageUpload(index, e)}
                                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {!isEditing && (
            <>
              <button
                onClick={prevSlide}
                className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-navy-900 p-3 rounded-full shadow-lg transition-all duration-500 hover:scale-110 ${
                  isVisible 
                    ? 'translate-x-0 opacity-100' 
                    : '-translate-x-8 opacity-0'
                }`}
                style={{ transitionDelay: '600ms' }}
              >
                <ChevronLeft size={24} />
              </button>

              <button
                onClick={nextSlide}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-navy-900 p-3 rounded-full shadow-lg transition-all duration-500 hover:scale-110 ${
                  isVisible 
                    ? 'translate-x-0 opacity-100' 
                    : 'translate-x-8 opacity-0'
                }`}
                style={{ transitionDelay: '600ms' }}
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className={`flex justify-center mt-8 space-x-3 transition-all duration-700 transform ${
            isVisible 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-4 opacity-0'
          }`}
          style={{ transitionDelay: '800ms' }}>
            {areas.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 transform hover:scale-125 ${
                  currentSlide === index ? 'bg-red-600 scale-125' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
      
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">Aggiungi Nuova Area</h3>
            <p className="text-gray-600 mb-4">Verrà creata una nuova area con valori predefiniti che potrai modificare successivamente.</p>
            <div className="flex space-x-3">
              <button
                onClick={addArea}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Aggiungi
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default EditableGymAreasSection;