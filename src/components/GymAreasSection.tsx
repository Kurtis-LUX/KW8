import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Dumbbell, Zap, Shield, Heart } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

const GymAreasSection: React.FC = () => {
  const { t } = useLanguageContext();
  const [currentSlide, setCurrentSlide] = useState(0);

  const areas = [
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

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % areas.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + areas.length) % areas.length);
  };

  return (
    <section id="aree" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 text-center mb-16 animate-fadeInUp">
          {t.gymAreas}
        </h2>

        <div className="relative max-w-4xl mx-auto">
          {/* Carousel Container */}
          <div className="relative overflow-hidden rounded-xl shadow-2xl">
            <div 
              className="flex transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {areas.map((area, index) => {
                const Icon = area.icon;
                return (
                  <div key={index} className="w-full flex-shrink-0 relative">
                    <div className="relative h-96">
                      <img 
                        src={area.image} 
                        alt={area.title}
                        className="w-full h-full object-cover transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-navy-900 bg-opacity-60 flex items-center justify-center transition-opacity duration-500">
                        <div className="text-center text-white p-8">
                          <Icon size={64} className="mx-auto mb-6 text-red-600 animate-bounce-subtle" />
                          <h3 className="text-3xl font-bold mb-6 tracking-wide">{area.title}</h3>
                          <p className="text-lg max-w-md leading-relaxed">{area.description}</p>
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
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-navy-900 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-90 hover:bg-opacity-100 text-navy-900 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-8 space-x-3">
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