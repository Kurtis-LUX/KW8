import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

interface SubscriptionSectionProps {
  onNavigate?: (page: string, planType?: string) => void;
}

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ onNavigate }) => {
  const { t } = useLanguageContext();
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

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



  // Carousel navigation functions
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % transformationCases.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + transformationCases.length) % transformationCases.length);
  };

  // Drag handlers
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

  const transformationCases = [
    {
      name: t.transformations?.marco?.name || 'Marco',
      description: t.transformations?.marco?.description || 'Perdita di 15kg in 6 mesi',
      beforeImage: '/images/marco-prima.svg',
      afterImage: '/images/marco-dopo.svg'
    },
    {
      name: t.transformations?.sara?.name || 'Sara',
      description: t.transformations?.sara?.description || 'Guadagno massa muscolare',
      beforeImage: '/images/sara-prima.svg',
      afterImage: '/images/sara-dopo.svg'
    },
    {
      name: t.transformations?.giuseppe?.name || 'Giuseppe',
      description: t.transformations?.giuseppe?.description || 'Risoluzione dolori alla schiena',
      beforeImage: '/images/giuseppe-prima.svg',
      afterImage: '/images/giuseppe-dopo.svg'
    }
  ];

  return (
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
        <h2 className={`text-4xl md:text-5xl font-bold text-navy-900 text-center mb-16 transition-all duration-800 transform ${
          isVisible 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-8 opacity-0 scale-95'
        }`}>
          {t.transformations?.title || 'CASI DI MIGLIORAMENTO FISICO'}
        </h2>

        {/* Transformation Cases Grid */}
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
            {transformationCases.map((case_, index) => (
              <div key={index} className="w-full flex-shrink-0 relative">
                <div className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-700 transform hover:scale-105 hover:shadow-xl ${
                  isVisible 
                    ? 'translate-y-0 opacity-100' 
                    : 'translate-y-8 opacity-0'
                }`}
                style={{ transitionDelay: `${index * 200}ms` }}>
                      {/* Before/After Images */}
                      <div className="relative h-48 bg-gradient-to-r from-gray-100 to-gray-200">
                        <div className="flex h-full">
                          <div className="w-1/2 relative overflow-hidden">
                            <img 
                              src={case_.beforeImage} 
                              alt={`${case_.name} prima`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                              {t.before || 'Prima'}
                            </div>
                          </div>
                          <div className="w-1/2 relative overflow-hidden">
                            <img 
                              src={case_.afterImage} 
                              alt={`${case_.name} dopo`}
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
                        <h4 className="text-xl font-bold text-navy-900 mb-2 text-center">{case_.name}</h4>
                        <p className="text-navy-700 text-sm text-center leading-relaxed">{case_.description}</p>
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
              {transformationCases.map((_, index) => (
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
      </div>
    </section>
  );
};

export default SubscriptionSection;