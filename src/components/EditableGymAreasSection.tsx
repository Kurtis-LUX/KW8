import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Dumbbell, Zap, Shield, Heart, Edit, Plus, Trash2, Save, X, Upload, Palette,
  Activity, Bike, Flame, Target, Trophy, Users, Clock, Star, Smile, Sun, Moon, Compass,
  Mountain, Waves, Wind, Leaf, Umbrella, Camera, Music, Headphones, Settings, Lock, Key, Eye, EyeOff,
  Search, Filter, Download, Share, Copy, Minus, Check, ChevronUp, ChevronDown,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Home, User, Mail, Phone, MapPin,
  Calendar, Bookmark, Tag, Flag, Bell, Volume2, VolumeX, Wifi, Battery, Smartphone,
  Laptop, Monitor, Printer, HardDrive, Globe, Link, ExternalLink,
  FileText, File, Folder, FolderOpen, Image, Video, Play, Pause, Square,
  Coffee, Car, Plane, Train, Ship, Truck, Bus, Navigation, Map
} from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';
import DB, { GymArea as DBGymArea } from '../utils/database';
import storageService from '../services/storageService';

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
  createdAt?: string;
  updatedAt?: string;
}

interface EditableGymAreasSectionProps {
  isEditing?: boolean;
  onSave?: (areas: GymArea[]) => void;
}

const availableIcons = {
  // Fitness & Sport
  Dumbbell,
  Activity,
  Bike,
  Target,
  Trophy,
  Heart,
  Zap,
  Flame,
  Shield,
  
  // People & Social
  Users,
  User,
  Smile,
  
  // Time & Schedule
  Clock,
  Calendar,
  
  // Rating & Quality
  Star,
  Flag,
  Bookmark,
  
  // Nature & Weather
  Sun,
  Moon,
  Leaf,
  Mountain,
  Waves,
  Wind,
  Umbrella,
  
  // Technology
  Smartphone,
  Laptop,
  Monitor,
  Camera,
  Headphones,
  Wifi,
  Battery,
  
  // Tools & Utilities
  Settings,
  Key,
  Lock,
  Search,
  Filter,
  
  // Media & Entertainment
  Music,
  Play,
  Pause,
  Video,
  Image,
  
  // Navigation & Location
  Home,
  MapPin,
  Compass,
  Navigation,
  Map,
  
  // Communication
  Mail,
  Phone,
  Bell,
  
  // Food & Lifestyle
  Coffee,
  
  // Transport
  Car,
  Plane,
  Train,
  Ship,
  Truck,
  Bus,
  
  // Creative
  Palette,
  
  // Files & Storage
  File,
  Folder,
  FolderOpen,
  HardDrive,
  
  // Actions
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Share,
  Copy,
  Save,
  X,
  Check,
  Minus,
  
  // Navigation Controls
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  
  // Other
  Eye,
  EyeOff,
  Tag,
  Volume2,
  VolumeX,
  Printer,
  Globe,
  Link,
  ExternalLink,
  FileText,
  Square
};



const textColorOptions = [
  { name: 'Bianco', value: 'text-white', color: '#ffffff' },
  { name: 'Nero', value: 'text-gray-900', color: '#111827' },
  { name: 'Grigio Chiaro', value: 'text-gray-300', color: '#d1d5db' },
  { name: 'Grigio Scuro', value: 'text-gray-600', color: '#4b5563' },
  { name: 'Rosso', value: 'text-red-600', color: '#dc2626' },
  { name: 'Rosso Chiaro', value: 'text-red-400', color: '#f87171' },
  { name: 'Blu', value: 'text-blue-900', color: '#1e3a8a' },
  { name: 'Blu Chiaro', value: 'text-blue-400', color: '#60a5fa' },
  { name: 'Verde', value: 'text-green-600', color: '#16a34a' },
  { name: 'Verde Chiaro', value: 'text-green-400', color: '#4ade80' },
  { name: 'Giallo', value: 'text-yellow-400', color: '#facc15' },
  { name: 'Giallo Scuro', value: 'text-yellow-600', color: '#ca8a04' },
  { name: 'Viola', value: 'text-purple-600', color: '#9333ea' },
  { name: 'Viola Chiaro', value: 'text-purple-400', color: '#c084fc' },
  { name: 'Rosa', value: 'text-pink-600', color: '#db2777' },
  { name: 'Arancione', value: 'text-orange-600', color: '#ea580c' },
  { name: 'Indaco', value: 'text-indigo-600', color: '#4f46e5' },
  { name: 'Teal', value: 'text-teal-600', color: '#0d9488' }
];

const overlayColorOptions = [
  { name: 'Nero', value: 'bg-black', color: '#000000' },
  { name: 'Grigio Scuro', value: 'bg-gray-800', color: '#1f2937' },
  { name: 'Grigio', value: 'bg-gray-600', color: '#4b5563' },
  { name: 'Grigio Chiaro', value: 'bg-gray-400', color: '#9ca3af' },
  { name: 'Bianco', value: 'bg-white', color: '#ffffff' },
  { name: 'Blu Scuro', value: 'bg-blue-900', color: '#1e3a8a' },
  { name: 'Blu', value: 'bg-blue-600', color: '#2563eb' },
  { name: 'Blu Chiaro', value: 'bg-blue-400', color: '#60a5fa' },
  { name: 'Rosso Scuro', value: 'bg-red-800', color: '#991b1b' },
  { name: 'Rosso', value: 'bg-red-600', color: '#dc2626' },
  { name: 'Rosso Chiaro', value: 'bg-red-400', color: '#f87171' },
  { name: 'Verde Scuro', value: 'bg-green-800', color: '#166534' },
  { name: 'Verde', value: 'bg-green-600', color: '#16a34a' },
  { name: 'Verde Chiaro', value: 'bg-green-400', color: '#4ade80' },
  { name: 'Viola Scuro', value: 'bg-purple-800', color: '#6b21a8' },
  { name: 'Viola', value: 'bg-purple-600', color: '#9333ea' },
  { name: 'Viola Chiaro', value: 'bg-purple-400', color: '#c084fc' },
  { name: 'Giallo', value: 'bg-yellow-500', color: '#eab308' },
  { name: 'Arancione', value: 'bg-orange-600', color: '#ea580c' },
  { name: 'Rosa', value: 'bg-pink-600', color: '#db2777' },
  { name: 'Indaco', value: 'bg-indigo-600', color: '#4f46e5' },
  { name: 'Teal', value: 'bg-teal-600', color: '#0d9488' },
  { name: 'Cyan', value: 'bg-cyan-600', color: '#0891b2' },
  { name: 'Lime', value: 'bg-lime-600', color: '#65a30d' }
];

const EditableGymAreasSection: React.FC<EditableGymAreasSectionProps> = ({ isEditing = false, onSave }) => {
  const { t } = useLanguageContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [editingArea, setEditingArea] = useState<number | null>(null);
  const [originalAreaState, setOriginalAreaState] = useState<GymArea | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'success' | 'error' | null>(null);
  const [newAreaData, setNewAreaData] = useState({
    title: 'Nuova Area',
    description: 'Descrizione della nuova area',
    image: '/images/default-gym.jpg'
  });
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [areas, setAreas] = useState<GymArea[]>([]);

  // Carica le aree dal database all'avvio
  useEffect(() => {
    const loadAreas = async () => {
      try {
        const savedAreas = await DB.getGymAreas();
        if (savedAreas && savedAreas.length > 0) {
          // Converte le aree dal database al formato del componente
          const convertedAreas = savedAreas.map(area => ({
            ...area,
            icon: availableIcons[area.iconName as keyof typeof availableIcons] || Dumbbell
          }));
          setAreas(convertedAreas);
        } else {
          // Usa le aree predefinite se non ci sono dati salvati
          const defaultAreas = [
            {
              id: 'sala-pesi',
              title: t.weightRoom || 'Sala Pesi',
              icon: Dumbbell,
              iconName: 'Dumbbell',
              description: t.weightRoomDesc || 'Allenamento con pesi e macchine professionali',
              image: '/images/sala pesi.jpg',
              overlayColor: 'rgba(30, 58, 138, 0.7)',
              overlayOpacity: 70,
              iconColor: 'text-red-600',
              textColor: 'text-white',
              titleColor: 'text-white',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'crosstraining',
              title: t.crossfit || 'CrossTraining',
              icon: Zap,
              iconName: 'Zap',
              description: t.crossfitDesc || 'Allenamento funzionale ad alta intensità',
              image: '/images/crossfit.jpg',
              overlayColor: 'rgba(220, 38, 38, 0.3)',
              overlayOpacity: 30,
              iconColor: 'text-blue-900',
              textColor: 'text-white',
              titleColor: 'text-white',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'karate',
              title: t.karate || 'Karate',
              icon: Shield,
              iconName: 'Shield',
              description: t.karateDesc || 'Arte marziale tradizionale giapponese',
              image: '/images/karate.jpg',
              overlayColor: 'rgba(255, 255, 255, 0.7)',
              overlayOpacity: 70,
              iconColor: 'text-yellow-400',
              textColor: 'text-gray-900',
              titleColor: 'text-gray-900',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            },
            {
              id: 'yoga',
              title: t.yoga || 'Yoga',
              icon: Heart,
              iconName: 'Heart',
              description: t.yogaDesc || 'Equilibrio tra mente e corpo',
              image: '/images/yoga.jpg',
              overlayColor: 'rgba(255, 255, 255, 0.3)',
              overlayOpacity: 30,
              iconColor: 'text-white',
              textColor: 'text-gray-900',
              titleColor: 'text-gray-900',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          ];
          const convertedAreas = defaultAreas.map(area => ({
            ...area,
            icon: availableIcons[area.iconName as keyof typeof availableIcons] || Dumbbell
          }));
          setAreas(convertedAreas);
          // Salva le aree predefinite nel database
          await DB.saveGymAreas(defaultAreas);
        }
      } catch (error) {
        console.error('Error loading gym areas:', error);
      }
    };
    
    loadAreas();
  }, [t]);

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
    setIsDragging(true);
    setStartX(clientX);
    setCurrentX(clientX);
  };

  const handleMove = (clientX: number) => {
    if (!isDragging) return;
    setCurrentX(clientX);
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const diff = startX - currentX;
    const threshold = 50;
    
    if (diff > threshold) {
      nextSlide();
    } else if (diff < -threshold) {
      prevSlide();
    }
  };

  const openEditModal = (index: number) => {
    setEditingArea(index);
    // Salva lo stato originale per il ripristino
    setOriginalAreaState({ ...areas[index] });
  };

  const closeEditModal = () => {
    setEditingArea(null);
    setOriginalAreaState(null);
  };

  const cancelEditModal = () => {
    if (editingArea !== null && originalAreaState) {
      // Ripristina lo stato originale
      setAreas(prev => prev.map((area, i) => 
        i === editingArea ? originalAreaState : area
      ));
    }
    closeEditModal();
  };

  const updateArea = (index: number, updates: Partial<GymArea>) => {
    setAreas(prev => {
      const updatedAreas = prev.map((area, i) => 
        i === index ? { ...area, ...updates, updatedAt: new Date().toISOString() } : area
      );
      
      // Salva automaticamente nel database
      const saveToDatabase = async () => {
        try {
          await DB.saveGymAreas(updatedAreas);
        } catch (error) {
          console.error('Error saving gym areas:', error);
        }
      };
      
      saveToDatabase();
      return updatedAreas;
    });
  };

  const deleteArea = (index: number) => {
    if (areas.length <= 1) {
      alert('Deve rimanere almeno un\'area');
      return;
    }
    setShowDeleteConfirm(index);
  };
  
  const confirmDeleteArea = async (index: number) => {
    const updatedAreas = areas.filter((_, i) => i !== index);
    setAreas(updatedAreas);
    
    if (currentSlide >= updatedAreas.length) {
      setCurrentSlide(0);
    }
    
    // Salva automaticamente nel database
    try {
      await DB.saveGymAreas(updatedAreas);
    } catch (error) {
      console.error('Error auto-saving areas after deletion:', error);
    }
    
    setShowDeleteConfirm(null);
  };

  const handleNewAreaImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        setNewAreaData(prev => ({ ...prev, image: 'loading...' }));
        
        const { storageService } = await import('../services/storageService');
        const tempId = `temp-${Date.now()}`;
        const imageUrl = await storageService.handleImageUpload(file, tempId);
        
        setNewAreaData(prev => ({ ...prev, image: imageUrl }));
        console.log('✅ New area image uploaded successfully');
      } catch (error) {
        console.error('❌ Error uploading new area image:', error);
        alert('Errore nel caricamento dell\'immagine. Riprova.');
        setNewAreaData(prev => ({ ...prev, image: '/images/default-gym.jpg' }));
      }
    }
  };

  const addArea = async () => {
    const newArea: GymArea = {
      id: `area-${Date.now()}`,
      title: newAreaData.title.trim() || 'Nuova Area',
      icon: Dumbbell,
      iconName: 'Dumbbell',
      description: newAreaData.description.trim() || 'Descrizione della nuova area',
      image: newAreaData.image,
      overlayColor: 'bg-gray-900',
      overlayOpacity: 50,
      iconColor: 'text-red-600',
      textColor: 'text-white',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const updatedAreas = [...areas, newArea];
    setAreas(updatedAreas);
    
    // Salva nel database
    try {
      await DB.saveGymAreas(updatedAreas);
    } catch (error) {
      console.error('Error saving new area:', error);
    }
    
    setShowAddModal(false);
    // Reset dei dati del modal
    setNewAreaData({
      title: 'Nuova Area',
      description: 'Descrizione della nuova area',
      image: '/images/default-gym.jpg'
    });
  };

  const handleSave = async () => {
    try {
      // Prepara i dati per il database (senza la proprietà icon)
      const areasForDB = areas.map(area => ({
        id: area.id,
        title: area.title,
        iconName: area.iconName,
        description: area.description,
        image: area.image,
        overlayColor: area.overlayColor,
        overlayOpacity: area.overlayOpacity,
        iconColor: area.iconColor,
        textColor: area.textColor,
        titleColor: area.titleColor,
        createdAt: area.createdAt,
        updatedAt: new Date().toISOString()
      }));
      
      // Salva nel database
      await DB.saveGymAreas(areasForDB);
      
      // Chiama anche la callback se fornita
      if (onSave) {
        onSave(areas);
      }
      
      setSaveStatus('success');
      setShowSaveModal(true);
    } catch (error) {
      console.error('Error saving areas:', error);
      setSaveStatus('error');
      setShowSaveModal(true);
    }
  };

  const handleImageUpload = async (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Mostra un indicatore di caricamento
        const area = areas[index];
        updateArea(index, { image: 'loading...' });
        
        // Carica l'immagine usando il servizio di storage
        const { storageService } = await import('../services/storageService');
        const imageUrl = await storageService.handleImageUpload(file, area.id);
        
        // Aggiorna l'area con la nuova immagine
        updateArea(index, { 
          image: imageUrl,
          updatedAt: new Date().toISOString()
        });
        
        console.log('✅ Image uploaded successfully for area:', area.id);
      } catch (error) {
        console.error('❌ Error uploading image:', error);
        alert('Errore nel caricamento dell\'immagine. Riprova.');
        
        // Ripristina l'immagine precedente in caso di errore
        const area = areas[index];
        updateArea(index, { image: area.image });
      }
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
        <div className="text-center mb-8">
          <h2 className={`text-4xl md:text-5xl font-bold text-navy-900 transition-all duration-800 transform ${
            isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-8 opacity-0 scale-95'
          }`}>
            {t.gymAreas || 'LE NOSTRE AREE'}
          </h2>
          {isEditing ? (
            <div className="flex justify-center space-x-4 mt-6">
              <button
                onClick={handleSave}
                className="flex items-center justify-center w-12 h-12 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-lg"
                title="Salva modifiche"
              >
                <Save size={20} />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors shadow-lg"
                title="Aggiungi nuova area"
              >
                <Plus size={20} />
              </button>
            </div>
          ) : (
            <div className="flex justify-center mt-6">
              <button
                onClick={() => onSave && onSave(areas)}
                className="flex items-center justify-center w-12 h-12 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                title="Modifica aree"
              >
                <Edit size={20} />
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
            onMouseDown={(e) => handleStart(e.clientX)}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={handleEnd}
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
                    <div className="relative h-64 md:h-80 lg:h-96">
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
                            onClick={() => openEditModal(index)}
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
                    

                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={prevSlide}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-navy-900 p-3 rounded-full shadow-lg transition-all duration-500 hover:scale-110 z-20 ${
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
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-navy-900 p-3 rounded-full shadow-lg transition-all duration-500 hover:scale-110 z-20 ${
              isVisible 
                ? 'translate-x-0 opacity-100' 
                : 'translate-x-8 opacity-0'
            }`}
            style={{ transitionDelay: '600ms' }}
          >
            <ChevronRight size={24} />
          </button>

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
      
      {/* Edit Area Modal */}
      {editingArea !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center">
                  <Edit size={24} className="mr-3" />
                  Modifica Area: {areas[editingArea]?.title}
                </h3>
                <button
                  onClick={cancelEditModal}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      Informazioni Base
                    </h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Titolo</label>
                        <input
                          type="text"
                          value={areas[editingArea]?.title || ''}
                          onChange={(e) => updateArea(editingArea, { title: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="Nome dell'area"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
                        <textarea
                          value={areas[editingArea]?.description || ''}
                          onChange={(e) => updateArea(editingArea, { description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                          rows={3}
                          placeholder="Descrizione dell'area"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Style Settings */}
                   <div className="bg-gray-50 p-4 rounded-lg">
                     <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                       <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                       Stile e Colori
                     </h4>
                     
                     <div className="space-y-4">
                       {/* Icon Selector */}
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Icona</label>
                         <select
                           value={areas[editingArea]?.iconName || 'Dumbbell'}
                           onChange={(e) => {
                             const iconName = e.target.value;
                             const IconComponent = availableIcons[iconName as keyof typeof availableIcons];
                             updateArea(editingArea, { 
                               iconName,
                               icon: IconComponent
                             });
                           }}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                         >
                           {Object.keys(availableIcons).map(iconName => (
                             <option key={iconName} value={iconName}>
                               {iconName}
                             </option>
                           ))}
                         </select>
                       </div>
                       
                       {/* Icon Color Picker */}
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Colore Icona</label>
                         <select
                           value={areas[editingArea]?.iconColor || 'text-red-600'}
                           onChange={(e) => updateArea(editingArea, { iconColor: e.target.value })}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                         >
                           {textColorOptions.map(colorOption => (
                             <option key={colorOption.value} value={colorOption.value}>
                               {colorOption.name}
                             </option>
                           ))}
                         </select>
                       </div>
                       
                       {/* Text Color Picker */}
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Colore Testo</label>
                         <select
                           value={areas[editingArea]?.textColor || 'text-white'}
                           onChange={(e) => updateArea(editingArea, { textColor: e.target.value })}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                         >
                           {textColorOptions.map(colorOption => (
                             <option key={colorOption.value} value={colorOption.value}>
                               {colorOption.name}
                             </option>
                           ))}
                         </select>
                       </div>
                       
                       {/* Title Color Picker */}
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Colore Titolo</label>
                         <select
                           value={areas[editingArea]?.titleColor || 'text-white'}
                           onChange={(e) => updateArea(editingArea, { titleColor: e.target.value })}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                         >
                           {textColorOptions.map(colorOption => (
                             <option key={colorOption.value} value={colorOption.value}>
                               {colorOption.name}
                             </option>
                           ))}
                         </select>
                       </div>
                       
                       {/* Overlay Settings */}
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">Colore Overlay</label>
                         <select
                           value={areas[editingArea]?.overlayColor || 'bg-blue-900'}
                           onChange={(e) => updateArea(editingArea, { overlayColor: e.target.value })}
                           className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                         >
                           {overlayColorOptions.map(colorOption => (
                             <option key={colorOption.value} value={colorOption.value}>
                               {colorOption.name}
                             </option>
                           ))}
                         </select>
                       </div>
                       
                       {/* Overlay Opacity */}
                       <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                           Opacità Overlay: {areas[editingArea]?.overlayOpacity || 70}%
                         </label>
                         <input
                           type="range"
                           min="0"
                           max="100"
                           value={areas[editingArea]?.overlayOpacity || 70}
                           onChange={(e) => updateArea(editingArea, { overlayOpacity: parseInt(e.target.value) })}
                           className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                         />
                         <div className="flex justify-between text-xs text-gray-500 mt-1">
                           <span>0%</span>
                           <span>50%</span>
                           <span>100%</span>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>

                {/* Right Column - Image */}
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      Immagine
                    </h4>
                    
                    {/* Current Image Preview */}
                    <div className="mb-4">
                      <div className="relative group">
                        <img 
                          src={areas[editingArea]?.image || '/images/default-gym.jpg'} 
                          alt={areas[editingArea]?.title || 'Area'}
                          className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 rounded-lg flex items-center justify-center">
                          <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-sm font-medium">
                            Immagine corrente
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Upload New Image */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Carica nuova immagine</label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(editingArea, e)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Formati supportati: JPG, PNG, GIF (max 5MB)</p>
                    </div>
                  </div>

                  {/* Preview Card */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-2 h-2 bg-orange-500 rounded-full mr-2"></div>
                      Anteprima Completa
                    </h4>
                    
                    {/* Full Area Preview */}
                    <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200 shadow-sm mb-3">
                      {/* Background Image */}
                      <div 
                        className="absolute inset-0 bg-cover bg-center"
                        style={{
                          backgroundImage: areas[editingArea]?.image 
                            ? `url(${areas[editingArea].image})` 
                            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        }}
                      />
                      
                      {/* Overlay */}
                      <div 
                        className={`absolute inset-0 ${areas[editingArea]?.overlayColor || 'bg-black'}`}
                        style={{
                          opacity: (areas[editingArea]?.overlayOpacity || 70) / 100
                        }}
                      />
                      
                      {/* Content */}
                      <div className="relative z-10 h-full flex flex-col justify-center items-center text-center p-6">
                        <div className={`mb-3 ${areas[editingArea]?.iconColor || 'text-white'}`}>
                          {areas[editingArea] && React.createElement(areas[editingArea].icon, { size: 48 })}
                        </div>
                        <h3 className={`text-xl font-bold mb-2 ${areas[editingArea]?.titleColor || 'text-white'}`}>
                              {areas[editingArea]?.title || 'Titolo Area'}
                            </h3>
                        <p className={`text-sm opacity-90 ${areas[editingArea]?.textColor || 'text-white'}`}>
                          {areas[editingArea]?.description || 'Descrizione dell\'area della palestra...'}
                        </p>
                      </div>
                      
                      {/* Corner Label */}
                      <div className="absolute top-2 right-2 bg-white bg-opacity-90 px-2 py-1 rounded text-xs font-medium text-gray-700">
                        Anteprima Live
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelEditModal}
                  className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Annulla
                </button>
                <button
                  onClick={closeEditModal}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                >
                  Salva Modifiche
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">Aggiungi Nuova Area</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nome Area</label>
                <input
                  type="text"
                  value={newAreaData.title}
                  onChange={(e) => setNewAreaData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nome della nuova area"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descrizione</label>
                <textarea
                  value={newAreaData.description}
                  onChange={(e) => setNewAreaData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Descrizione dell'area"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Immagine</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleNewAreaImageUpload}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {newAreaData.image && newAreaData.image !== '/images/default-gym.jpg' && (
                  <div className="mt-2">
                    <img 
                      src={newAreaData.image} 
                      alt="Preview" 
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={addArea}
                disabled={!newAreaData.title.trim()}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Aggiungi
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewAreaData({
                    title: 'Nuova Area',
                    description: 'Descrizione della nuova area',
                    image: '/images/default-gym.jpg'
                  });
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Annulla
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Conferma Eliminazione
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Sei sicuro di voler eliminare l'area "{areas[showDeleteConfirm]?.title}"? Questa azione non può essere annullata.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => confirmDeleteArea(showDeleteConfirm)}
                  className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Elimina
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
       )}
       
       {/* Save Status Modal */}
       {showSaveModal && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
           <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
             <div className="text-center">
               <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                 saveStatus === 'success' ? 'bg-green-100' : 'bg-red-100'
               }`}>
                 {saveStatus === 'success' ? (
                   <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                   </svg>
                 ) : (
                   <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 )}
               </div>
               <h3 className="text-lg font-medium text-gray-900 mb-2">
                 {saveStatus === 'success' ? 'Salvataggio Completato' : 'Errore di Salvataggio'}
               </h3>
               <p className="text-sm text-gray-500 mb-6">
                 {saveStatus === 'success' 
                   ? 'Le aree sono state salvate con successo nel database.'
                   : 'Si è verificato un errore durante il salvataggio. Riprova.'
                 }
               </p>
               <button
                 onClick={() => {
                   setShowSaveModal(false);
                   setSaveStatus(null);
                 }}
                 className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
                   saveStatus === 'success'
                     ? 'bg-green-600 text-white hover:bg-green-700'
                     : 'bg-red-600 text-white hover:bg-red-700'
                 }`}
               >
                 OK
               </button>
             </div>
           </div>
         </div>
       )}
    </section>
  );
};

export default EditableGymAreasSection;