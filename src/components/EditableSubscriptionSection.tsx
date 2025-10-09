import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Edit3, Save, X, Plus, Trash2, Upload } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';
import { saveTransformationCases, loadTransformationCases } from '../utils/database';
import { uploadImage } from '../utils/storage';
import Modal from './Modal';

interface TransformationCase {
  id: string;
  name: string;
  title: string;
  description: string;
  beforeImage: string;
  afterImage: string;
  duration?: string;
}

interface EditableSubscriptionSectionProps {
  currentUser?: {
    id: string;
    role: string;
  } | null;
}

const EditableSubscriptionSection: React.FC<EditableSubscriptionSectionProps> = ({ currentUser }) => {
  const { t } = useLanguageContext();
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editingCase, setEditingCase] = useState<TransformationCase | null>(null);
  const [cases, setCases] = useState<TransformationCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState<'before' | 'after' | null>(null);

  // Carica i casi di miglioramento dal database
  useEffect(() => {
    const loadCases = async () => {
      try {
        setIsLoading(true);
        const savedCases = await loadTransformationCases();
        
        if (!savedCases || savedCases.length === 0) {
          // Carica i casi predefiniti se non ci sono dati salvati
          const defaultCases: TransformationCase[] = [
            {
              id: '1',
              name: t.transformations?.marco?.name || 'Marco',
              title: t.transformations?.marco?.title || 'Trasformazione Marco',
              description: t.transformations?.marco?.description || 'Perdita di 15kg in 6 mesi',
              beforeImage: '/images/marco-prima.svg',
              afterImage: '/images/marco-dopo.svg',
              duration: '6 mesi'
            },
            {
              id: '2',
              name: t.transformations?.sara?.name || 'Sara',
              title: t.transformations?.sara?.title || 'Miglioramento Sara',
              description: t.transformations?.sara?.description || 'Guadagno massa muscolare',
              beforeImage: '/images/sara-prima.svg',
              afterImage: '/images/sara-dopo.svg',
              duration: '4 mesi'
            },
            {
              id: '3',
              name: t.transformations?.giuseppe?.name || 'Giuseppe',
              title: t.transformations?.giuseppe?.title || 'Recupero Giuseppe',
              description: t.transformations?.giuseppe?.description || 'Risoluzione dolori alla schiena',
              beforeImage: '/images/giuseppe-prima.svg',
              afterImage: '/images/giuseppe-dopo.svg',
              duration: '3 mesi'
            }
          ];
          setCases(defaultCases);
          // Salva i casi predefiniti nel database
          await saveTransformationCases(defaultCases);
        } else {
          setCases(savedCases);
        }
      } catch (error) {
        console.error('Errore nel caricamento dei casi:', error);
        // In caso di errore, carica i casi predefiniti
        const defaultCases: TransformationCase[] = [
          {
            id: '1',
            name: 'Marco',
            title: 'Trasformazione Marco',
            description: 'Perdita di 15kg in 6 mesi',
            beforeImage: '/images/marco-prima.svg',
            afterImage: '/images/marco-dopo.svg',
            duration: '6 mesi'
          },
          {
            id: '2',
            name: 'Sara',
            title: 'Miglioramento Sara',
            description: 'Guadagno massa muscolare',
            beforeImage: '/images/sara-prima.svg',
            afterImage: '/images/sara-dopo.svg',
            duration: '4 mesi'
          },
          {
            id: '3',
            name: 'Giuseppe',
            title: 'Recupero Giuseppe',
            description: 'Risoluzione dolori alla schiena',
            beforeImage: '/images/giuseppe-prima.svg',
            afterImage: '/images/giuseppe-dopo.svg',
            duration: '3 mesi'
          }
        ];
        setCases(defaultCases);
      } finally {
        setIsLoading(false);
      }
    };

    loadCases();
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

  // Funzioni di navigazione del carousel
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % cases.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + cases.length) % cases.length);
  };

  // Gestione drag
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
    
    const deltaX = currentX - startX;
    const threshold = 50;
    
    if (deltaX > threshold) {
      prevSlide();
    } else if (deltaX < -threshold) {
      nextSlide();
    }
  };

  // Eventi mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleEnd();
  };

  // Eventi touch
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
  };

  // Funzioni di editing
  const handleEditCase = (caseItem: TransformationCase) => {
    setEditingCase({ ...caseItem });
    setIsEditing(true);
  };

  const handleSaveCase = async () => {
    if (!editingCase) return;
    
    try {
      setIsSaving(true);
      const updatedCases = cases.map(c => 
        c.id === editingCase.id ? editingCase : c
      );
      
      await saveTransformationCases(updatedCases);
      setCases(updatedCases);
      setIsEditing(false);
      setEditingCase(null);
    } catch (error) {
      console.error('Errore nel salvataggio del caso:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingCase(null);
  };

  const handleAddCase = () => {
    const newCase: TransformationCase = {
      id: Date.now().toString(),
      name: 'Nuovo Cliente',
      title: 'Nuova Trasformazione',
      description: 'Descrizione del miglioramento',
      beforeImage: '/images/placeholder.svg',
      afterImage: '/images/placeholder.svg',
      duration: '3 mesi'
    };
    setEditingCase(newCase);
    setIsEditing(true);
  };

  const handleDeleteCase = async (caseId: string) => {
    if (cases.length <= 1) {
      alert('Non puoi eliminare l\'ultimo caso di miglioramento');
      return;
    }
    
    if (confirm('Sei sicuro di voler eliminare questo caso di miglioramento?')) {
      try {
        const updatedCases = cases.filter(c => c.id !== caseId);
        await saveTransformationCases(updatedCases);
        setCases(updatedCases);
        
        // Aggiusta l'indice del slide corrente se necessario
        if (currentSlide >= updatedCases.length) {
          setCurrentSlide(updatedCases.length - 1);
        }
      } catch (error) {
        console.error('Errore nell\'eliminazione del caso:', error);
      }
    }
  };

  // Gestione upload immagini
  const handleImageUpload = async (file: File, type: 'before' | 'after') => {
    if (!editingCase) return;
    
    try {
      setUploadingImage(type);
      const imageUrl = await uploadImage(file, `transformations/${editingCase.id}/${type}`);
      
      setEditingCase({
        ...editingCase,
        [type === 'before' ? 'beforeImage' : 'afterImage']: imageUrl
      });
    } catch (error) {
      console.error('Errore nell\'upload dell\'immagine:', error);
      alert('Errore nell\'upload dell\'immagine');
    } finally {
      setUploadingImage(null);
    }
  };

  const triggerImageUpload = (type: 'before' | 'after') => {
    if (fileInputRef.current) {
      fileInputRef.current.setAttribute('data-type', type);
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = e.target.getAttribute('data-type') as 'before' | 'after';
    
    if (file && type) {
      handleImageUpload(file, type);
    }
  };

  if (isLoading) {
    return (
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <div className="text-navy-900">Caricamento casi di miglioramento...</div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        ref={sectionRef}
        id="informazioni" 
        className={`py-20 bg-white transition-all duration-1000 transform ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="container mx-auto px-4">
          {/* Header con pulsanti di controllo */}
          {currentUser && currentUser.role === 'coach' && (
            <div className="flex justify-center mb-6">
              <div className="flex gap-3">
                <button
                  onClick={handleAddCase}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  <Plus size={18} />
                  Aggiungi Caso
                </button>
              </div>
            </div>
          )}

          <h2 className={`text-4xl md:text-5xl font-bold text-navy-900 text-center mb-16 transition-all duration-800 transform ${
            isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-8 opacity-0 scale-95'
          }`}>
            {t.transformations?.title || 'CASI DI MIGLIORAMENTO FISICO'}
          </h2>

          {cases.length > 0 ? (
            <div className={`mb-8 transition-all duration-1000 transform ${
              isVisible 
                ? 'translate-y-0 opacity-100 scale-100' 
                : 'translate-y-16 opacity-0 scale-95'
            }`}
            style={{ transitionDelay: '300ms' }}>
              <div className="max-w-4xl mx-auto">
                {/* Carousel Container */}
                <div 
                  ref={carouselRef}
                  className="relative overflow-hidden rounded-xl shadow-2xl cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                  <div 
                    className="flex transition-transform duration-700 ease-in-out"
                    style={{ 
                      transform: `translateX(-${currentSlide * 100}%)`,
                      userSelect: 'none'
                    }}
                  >
                    {cases.map((caseItem, index) => (
                      <div key={caseItem.id} className="w-full flex-shrink-0 relative">
                        <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-700 transform hover:scale-105 hover:shadow-xl ${
                          isVisible 
                            ? 'translate-y-0 opacity-100' 
                            : 'translate-y-8 opacity-0'
                        }`}
                        style={{ transitionDelay: `${index * 200}ms` }}>
                          {/* Pulsanti di controllo per coach */}
                          {currentUser && currentUser.role === 'coach' && (
                            <div className="absolute top-4 right-4 z-20 flex gap-2">
                              <button
                                onClick={() => handleEditCase(caseItem)}
                                className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteCase(caseItem.id)}
                                className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full shadow-lg transition-colors duration-200"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}

                          {/* Before/After Images */}
                          <div className="relative h-48 bg-gradient-to-r from-gray-100 to-gray-200">
                            <div className="flex h-full">
                              <div className="w-1/2 relative overflow-hidden">
                                <img 
                                  src={caseItem.beforeImage} 
                                  alt={`${caseItem.name} prima`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                  {t.before || 'Prima'}
                                </div>
                              </div>
                              <div className="w-1/2 relative overflow-hidden">
                                <img 
                                  src={caseItem.afterImage} 
                                  alt={`${caseItem.name} dopo`}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute bottom-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                                  {t.after || 'Dopo'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div className="p-4">
                            <h4 className="text-xl font-bold text-navy-900 mb-2 text-center">{caseItem.title}</h4>
                            <p className="text-navy-700 text-sm text-center leading-relaxed">{caseItem.description}</p>
                            {caseItem.duration && (
                              <p className="text-navy-500 text-xs text-center mt-2">Durata: {caseItem.duration}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={prevSlide}
                  className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-95 hover:bg-opacity-100 text-navy-900 p-3 md:p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 z-10 opacity-90 hover:opacity-100"
                >
                  <ChevronLeft size={28} className="md:w-8 md:h-8" />
                </button>

                <button
                  onClick={nextSlide}
                  className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-95 hover:bg-opacity-100 text-navy-900 p-3 md:p-4 rounded-full shadow-xl transition-all duration-300 hover:scale-110 z-10 opacity-90 hover:opacity-100"
                >
                  <ChevronRight size={28} className="md:w-8 md:h-8" />
                </button>

                {/* Dots Indicator */}
                <div className={`flex justify-center mt-8 space-x-3 transition-all duration-700 transform ${
                  isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-4 opacity-0'
                }`}
                style={{ transitionDelay: '800ms' }}>
                  {cases.map((_, index) => (
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
          ) : (
            <div className="text-center text-navy-700">
              Nessun caso di miglioramento disponibile.
            </div>
          )}
        </div>
      </section>

      {/* Modal di editing */}
      {isEditing && editingCase && (
        <Modal
          isOpen={isEditing && !!editingCase}
          onClose={handleCancelEdit}
          title={cases.find(c => c.id === editingCase.id) ? 'Modifica Caso' : 'Nuovo Caso'}
        >
          <div className="p-6">
            {/* Contenuto del form (senza header duplicato e bottone close, gestiti da Modal) */}
            <div className="space-y-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  Nome Cliente
                </label>
                <input
                  type="text"
                  value={editingCase.name}
                  onChange={(e) => setEditingCase({ ...editingCase, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Nome del cliente"
                />
              </div>

              {/* Titolo */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  Titolo
                </label>
                <input
                  type="text"
                  value={editingCase.title}
                  onChange={(e) => setEditingCase({ ...editingCase, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Titolo della trasformazione"
                />
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  Descrizione
                </label>
                <textarea
                  value={editingCase.description}
                  onChange={(e) => setEditingCase({ ...editingCase, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent h-24 resize-none"
                  placeholder="Descrizione del miglioramento ottenuto"
                />
              </div>

              {/* Durata */}
              <div>
                <label className="block text-sm font-medium text-navy-700 mb-2">
                  Durata
                </label>
                <input
                  type="text"
                  value={editingCase.duration || ''}
                  onChange={(e) => setEditingCase({ ...editingCase, duration: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="es. 6 mesi"
                />
              </div>

              {/* Immagini */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Immagine Prima */}
                <div>
                  <label className="block text-sm font-medium text-navy-700 mb-2">
                    Immagine Prima
                  </label>
                  <div className="relative">
                    <img
                      src={editingCase.beforeImage}
                      alt="Prima"
                      className="w-full h-32 object-cover rounded-lg border border-gray-300"
                    />
                    <button
                      onClick={() => triggerImageUpload('before')}
                      disabled={uploadingImage === 'before'}
                      className="absolute inset-0 bg-black bg-opacity-50 text-white rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
                    >
                      {uploadingImage === 'before' ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      ) : (
                        <Upload size={24} />
                      )}
                    </button>
                  </div>

                  {/* Immagine Dopo */}
                  <div>
                    <label className="block text-sm font-medium text-navy-700 mb-2">
                      Immagine Dopo
                    </label>
                    <div className="relative">
                      <img
                        src={editingCase.afterImage}
                        alt="Dopo"
                        className="w-full h-32 object-cover rounded-lg border border-gray-300"
                      />
                      <button
                        onClick={() => triggerImageUpload('after')}
                        disabled={uploadingImage === 'after'}
                        className="absolute inset-0 bg-black bg-opacity-50 text-white rounded-lg flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-200"
                      >
                        {uploadingImage === 'after' ? (
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        ) : (
                          <Upload size={24} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pulsanti */}
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={handleCancelEdit}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleSaveCase}
                    disabled={isSaving}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSaving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save size={16} />
                    )}
                    {isSaving ? 'Salvataggio...' : 'Salva'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Input file nascosto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </>
  );
};

export default EditableSubscriptionSection;