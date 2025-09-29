import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, Zap, Shield, Heart } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';
import DB from '../utils/database';

const GymAreasSection: React.FC = () => {
  const { t } = useLanguageContext();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  const [areas, setAreas] = useState<any[]>([]);

  const availableIcons = {
    Dumbbell,
    Zap,
    Shield,
    Heart
  };

  // Carica le aree dal database e sottoscrive agli aggiornamenti
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
              title: t.weightRoom,
              icon: Dumbbell,
              description: t.weightRoomDesc,
              image: '/images/sala pesi.jpg'
            },
            {
              id: 'crosstraining',
              title: t.crossfit,
              icon: Zap,
              description: t.crossfitDesc,
              image: '/images/crossfit.jpg'
            },
            {
              id: 'karate',
              title: t.karate,
              icon: Shield,
              description: t.karateDesc,
              image: '/images/karate.jpg'
            },
            {
              id: 'yoga',
              title: t.yoga,
              icon: Heart,
              description: t.yogaDesc,
              image: '/images/yoga.jpg'
            }
          ];
          setAreas(defaultAreas);
          
          // Salva le aree predefinite nel database per future visualizzazioni
          const areasToSave = defaultAreas.map(area => ({
            ...area,
            iconName: area.icon === Dumbbell ? 'Dumbbell' : 
                     area.icon === Zap ? 'Zap' : 
                     area.icon === Shield ? 'Shield' : 'Heart',
            overlayColor: area.id === 'sala-pesi' ? 'rgba(30, 58, 138, 0.7)' :
                         area.id === 'crosstraining' ? 'rgba(220, 38, 38, 0.3)' :
                         area.id === 'karate' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.3)',
            overlayOpacity: area.id === 'sala-pesi' || area.id === 'karate' ? 70 : 30,
            iconColor: area.id === 'sala-pesi' ? 'text-red-600' :
                      area.id === 'crosstraining' ? 'text-blue-900' :
                      area.id === 'karate' ? 'text-yellow-400' : 'text-white',
            textColor: area.id === 'karate' || area.id === 'yoga' ? 'text-gray-900' : 'text-white',
            titleColor: area.id === 'karate' || area.id === 'yoga' ? 'text-gray-900' : 'text-white',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
          
          try {
            await DB.saveGymAreas(areasToSave);
            console.log('Default gym areas saved to database');
          } catch (error) {
            console.error('Error saving default gym areas:', error);
          }
        }
      } catch (error) {
        console.error('Error loading gym areas:', error);
      }
    };
    
    loadAreas();
    
    // Sottoscrivi agli aggiornamenti in tempo reale
    const unsubscribe = DB.subscribeToGymAreas((updatedAreas) => {
      if (updatedAreas.length > 0) {
        const convertedAreas = updatedAreas.map(area => ({
          ...area,
          icon: availableIcons[area.iconName as keyof typeof availableIcons] || Dumbbell
        }));
        setAreas(convertedAreas);
      }
    });
    
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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

  // Touch and mouse drag handlers
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

  // Mouse events
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

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    handleEnd();
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
        <h2 className={`text-4xl md:text-5xl font-bold text-navy-900 text-center mb-16 transition-all duration-800 transform ${
          isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-8 opacity-0 scale-95'
        }`}>
          {t.gymAreas}
        </h2>

        <div className={`relative max-w-4xl mx-auto transition-all duration-1000 transform ${
          isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-16 opacity-0 scale-95'
        }`}
        style={{ transitionDelay: '300ms' }}>
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
              {areas.map((area, index) => {
                const Icon = area.icon;
                
                // Definisci colori specifici per ogni area
                let overlayColor = 'bg-navy-900 bg-opacity-30';
                let iconColor = 'text-red-600';
                let textColor = 'text-white';
                
                switch(area.id) {
                  case 'sala-pesi': // sala pesi
                    overlayColor = 'bg-blue-900 bg-opacity-70';
                    iconColor = 'text-red-600';
                    textColor = 'text-white';
                    break;
                  case 'crosstraining':
                    overlayColor = 'bg-red-600 bg-opacity-30';
                    iconColor = 'text-blue-900';
                    textColor = 'text-white';
                    break;
                  case 'karate':
                    overlayColor = 'bg-white bg-opacity-70';
                    iconColor = 'text-yellow-400';
                    textColor = 'text-gray-900';
                    break;
                  case 'yoga':
                    overlayColor = 'bg-white bg-opacity-30';
                    iconColor = 'text-white';
                    textColor = 'text-gray-900';
                    break;
                  default:
                    overlayColor = 'bg-gray-900 bg-opacity-30';
                    iconColor = 'text-red-600';
                    textColor = 'text-white';
                }
                
                return (
                  <div key={index} className="w-full flex-shrink-0 relative">
                    <div className="relative h-96">
                      <img 
                        src={area.image} 
                        alt={area.title}
                        className="w-full h-full object-cover transition-transform duration-700"
                      />
                      <div className={`absolute inset-0 ${overlayColor} flex items-center justify-center transition-opacity duration-500`}>
                        <div className="text-center p-8">
                          <Icon size={64} className={`mx-auto mb-6 ${iconColor} animate-bounce-subtle`} />
                          <h3 className={`text-3xl font-bold mb-6 tracking-wide ${textColor}`}>{area.title}</h3>
                          <p className={`text-lg max-w-md leading-relaxed ${textColor}`}>{area.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-white p-3 transition-all duration-500 hover:scale-110 ${
              isVisible 
                ? 'translate-x-0 opacity-100' 
                : '-translate-x-8 opacity-0'
            }`}
            style={{ 
              transitionDelay: '600ms',
              filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8))'
            }}
          >
            <ChevronLeft size={32} strokeWidth={3} />
          </button>

          <button
            onClick={nextSlide}
            className={`absolute right-4 top-1/2 transform -translate-y-1/2 text-white p-3 transition-all duration-500 hover:scale-110 ${
              isVisible 
                ? 'translate-x-0 opacity-100' 
                : 'translate-x-8 opacity-0'
            }`}
            style={{ 
              transitionDelay: '600ms',
              filter: 'drop-shadow(1px 1px 2px rgba(0, 0, 0, 0.8))'
            }}
          >
            <ChevronRight size={32} strokeWidth={3} />
          </button>

          {/* Dots Indicator */}
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
    </section>
  );
};

export default GymAreasSection;