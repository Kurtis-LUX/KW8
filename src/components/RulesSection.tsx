import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';

interface Rule {
  id: number;
  title: string;
  description: string;
  image: string;
  icon: string;
}

const rules: Rule[] = [
  {
    id: 1,
    title: "Rispetto degli orari",
    description: "Rispetta gli orari di apertura e chiusura della palestra. Assicurati di terminare il tuo allenamento entro l'orario di chiusura.",
    image: "/images/orari.jpg",
    icon: "⏰"
  },
  {
    id: 2,
    title: "Igiene",
    description: "Mantieni sempre un'ottima igiene personale. Porta sempre un asciugamano pulito e utilizzalo su attrezzi e panche.",
    image: "/images/heropalestra.jpg",
    icon: "🧼"
  },
  {
    id: 3,
    title: "Mantieni l'ordine",
    description: "Rimetti sempre a posto gli attrezzi dopo l'uso. Questo aiuta a mantenere la palestra ordinata e sicura per tutti.",
    image: "/images/sala pesi.jpg",
    icon: "🏋️"
  },
  {
    id: 4,
    title: "Rispetto degli altri",
    description: "Rispetta gli altri utenti e il loro spazio. Evita di monopolizzare gli attrezzi e consenti a tutti di allenarsi serenamente.",
    image: "/images/crossfit.jpg",
    icon: "🤝"
  },
  {
    id: 5,
    title: "Abbigliamento adeguato",
    description: "Indossa sempre abbigliamento sportivo appropriato e scarpe da ginnastica pulite. L'abbigliamento deve essere adatto all'attività fisica.",
    image: "/images/karate.jpg",
    icon: "👕"
  },
  {
    id: 6,
    title: "Sicurezza prima di tutto",
    description: "Segui sempre le norme di sicurezza. In caso di dubbi su un esercizio, chiedi aiuto ai nostri coach.",
    image: "/images/yoga.jpg",
    icon: "🛡️"
  }
];

interface RulesSectionProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesSection: React.FC<RulesSectionProps> = ({ isOpen, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);

  // Blocca lo scroll della pagina quando il modal è aperto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup quando il componente viene smontato
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const nextRule = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % rules.length);
  };

  const prevRule = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + rules.length) % rules.length);
  };

  const goToRule = (index: number) => {
    setCurrentIndex(index);
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
      nextRule();
    } else if (diff < -threshold) {
      prevRule();
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

  if (!isOpen) return null;

  const currentRule = rules[currentIndex];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-xl ring-1 ring-black/10 bg-white/70 backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/20 bg-white/30 backdrop-blur-md">
          <div className="flex items-center space-x-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/40 backdrop-blur-md shadow-sm">
              <BookOpen className="text-navy-900" size={22} />
            </span>
            <h2 className="text-xl md:text-2xl font-semibold text-navy-900">Regole della Palestra</h2>
          </div>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center h-10 w-10 rounded-full border border-white/30 bg-white/40 backdrop-blur-md text-navy-900 hover:shadow-md hover:bg-white/50 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Carousel Container */}
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-black/10 bg-white/10 backdrop-blur-md shadow-lg mb-6">
            <div 
              className="flex transition-transform duration-700 ease-in-out cursor-grab active:cursor-grabbing select-none"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {rules.map((rule, index) => (
                <div key={index} className="w-full flex-shrink-0 relative">
                  <div className="relative h-96">
                    <img 
                      src={rule.image} 
                      alt={rule.title}
                      className="w-full h-full object-cover transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-black/35 backdrop-blur-[2px] flex items-center justify-center transition-opacity duration-500">
                      <div className="text-center text-white p-8">
                        <div className="text-6xl mb-6 animate-bounce-subtle">{rule.icon}</div>
                        <h3 className="text-3xl font-bold mb-6 tracking-wide">{rule.title}</h3>
                        <p className="text-lg max-w-md leading-relaxed">{rule.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Arrows */}
            <button
              onClick={prevRule}
              className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/30 bg-white/40 backdrop-blur-md text-white hover:bg-white/60 hover:shadow-md transition-all z-10"
            >
              <ChevronLeft size={24} className="md:w-6 md:h-6" />
            </button>

            <button
              onClick={nextRule}
              className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 inline-flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-full border border-white/30 bg-white/40 backdrop-blur-md text-white hover:bg-white/60 hover:shadow-md transition-all z-10"
            >
              <ChevronRight size={24} className="md:w-6 md:h-6" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mb-6 space-x-3">
            {rules.map((_, index) => (
              <button
                key={index}
                onClick={() => goToRule(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 transform hover:scale-125 ${
                  currentIndex === index ? 'bg-red-600 scale-125 shadow-[0_0_0_3px_rgba(255,255,255,0.4)]' : 'bg-white/50 ring-1 ring-white/40'
                }`}
              />
            ))}
          </div>


        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-white/20 bg-white/30 backdrop-blur-md">
          <div className="text-center">
            <p className="text-navy-900/80 text-sm">
              Regola {currentIndex + 1} di {rules.length}
            </p>
            <p className="text-navy-900/70 text-xs mt-1">
              Rispettare queste regole garantisce un ambiente sicuro e piacevole per tutti
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RulesSection;