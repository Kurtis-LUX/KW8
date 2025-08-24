import React, { useState, useEffect, useRef } from 'react';
import { useLanguageContext } from '../contexts/LanguageContext';

interface SubscriptionSectionProps {
  onNavigate?: (page: string, planType?: string) => void;
}

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ onNavigate }) => {
  const { t } = useLanguageContext();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
            <div className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-700 transform ${
              isVisible 
                ? 'rotate-0 scale-100' 
                : 'rotate-1 scale-95'
            }`}
            style={{ transitionDelay: '500ms' }}>
              <div className="relative">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                  {transformationCases.map((case_, index) => (
                    <div key={index} className={`bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-700 transform hover:scale-105 hover:shadow-xl ${
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
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionSection;