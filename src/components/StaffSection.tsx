import React, { useState, useEffect, useRef } from 'react';
import { X, Award, Dumbbell, Zap, Shield, Heart } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

const StaffSection: React.FC = () => {
  const { t } = useLanguageContext();
  const [selectedCoach, setSelectedCoach] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const sectionRef = useRef<HTMLElement>(null);

  // Intersection Observer per le transizioni
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

  // Gestione chiusura modal con ESC
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedCoach !== null) {
        setSelectedCoach(null);
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [selectedCoach]);

  // Blocca lo scroll della pagina quando il modal è aperto e salva/ripristina la posizione
  useEffect(() => {
    if (selectedCoach !== null) {
      // Salva la posizione di scroll corrente
      setScrollPosition(window.pageYOffset);
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${window.pageYOffset}px`;
      document.body.style.width = '100%';
    } else if (selectedCoach === null && scrollPosition > 0) {
      // Ripristina la posizione di scroll solo quando si chiude il modal
      document.body.style.overflow = 'unset';
      document.body.style.position = 'unset';
      document.body.style.top = 'unset';
      document.body.style.width = 'unset';
      setTimeout(() => {
        window.scrollTo(0, scrollPosition);
      }, 0);
    }
  }, [selectedCoach]);

  const staff = [
    {
      name: 'Giuseppe Pandolfo',
      role: 'Personal Trainer Sala Pesi',
      description: 'Certificazioni, esperienza, lavoro affiancato personalizzato.',
      image: '/images/giuseppe pandolfo.jpg',
      icon: Dumbbell,
      certifications: [
        'Certificazione ISSA Personal Trainer',
        'Specializzazione Bodybuilding',
        'Corso Nutrizione Sportiva',
        '5+ anni di esperienza',
        'Specialista in Powerlifting'
      ]
    },
    {
      name: 'Saverio Di Maria',
      role: 'Coach Cross training',
      description: 'Certificazioni, attenzione agli obiettivi individuali.',
      image: '/images/saverio dimaria.jpg',
      icon: Zap,
      certifications: [
        'Certificazione CrossFit Level 2',
        'Functional Movement Screen',
        'Corso Olimpic Lifting',
        '4+ anni di esperienza',
        'Specialista in Functional Training'
      ]
    },
    {
      name: 'Simone La Rosa',
      role: 'Maestro Karate',
      description: 'Cintura, certificazioni, focus su autodifesa e disciplina.',
      image: '/images/simone larosa.jpg',
      icon: Shield,
      certifications: [
        'Cintura Nera 3° Dan',
        'Istruttore Federale FIJLKAM',
        'Corso Autodifesa',
        '10+ anni di esperienza',
        'Specialista in Karate Tradizionale'
      ]
    },
    {
      name: 'Eleonora Perico',
      role: 'Maestra Yoga',
      description: 'Approccio olistico e personalizzazione in base alle esigenze.',
      image: '/images/eleonora nonnehoidea.jpg',
      icon: Heart,
      certifications: [
        'Certificazione Yoga Alliance 500h',
        'Specializzazione Hatha Yoga',
        'Corso Meditazione Mindfulness',
        '6+ anni di esperienza',
        'Specialista in Yoga Terapeutico'
      ]
    }
  ];

  return (
    <>
      <section 
        ref={sectionRef}
        id="staff" 
        className={`py-16 bg-white transition-all duration-1000 transform ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="container mx-auto px-4">
          <h2 className={`text-4xl md:text-5xl font-bold text-blue-900 text-center mb-12 transition-all duration-800 transform ${
            isVisible 
              ? 'translate-y-0 opacity-100 scale-100' 
              : 'translate-y-8 opacity-0 scale-95'
          }`}>
            {t.ourTeam}
          </h2>

          <div className="grid grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
            {staff.map((member, index) => {
              const Icon = member.icon;
              return (
                <div 
                  key={index} 
                  className={`text-center group cursor-pointer transform hover:-translate-y-2 transition-all duration-700 ${
                    isVisible 
                      ? 'translate-y-0 opacity-100 scale-100' 
                      : 'translate-y-12 opacity-0 scale-90'
                  }`}
                  style={{ transitionDelay: `${300 + index * 150}ms` }}
                  onClick={() => setSelectedCoach(index)}
                  onTouchStart={() => {}}
                >
                  <div className={`relative overflow-hidden rounded-xl mb-4 shadow-lg group-hover:shadow-2xl transition-all duration-600 transform ${
                    isVisible 
                      ? 'rotate-0 scale-100' 
                      : 'rotate-3 scale-95'
                  }`}
                  style={{ transitionDelay: `${500 + index * 150}ms` }}>
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className={`absolute inset-0 transition-opacity duration-500 flex items-center justify-center ${
                      index === 0 ? 'bg-blue-900 bg-opacity-0 group-hover:bg-opacity-70' :
                      index === 1 ? 'bg-red-600 bg-opacity-0 group-hover:bg-opacity-70' :
                      index === 2 ? 'bg-white bg-opacity-0 group-hover:bg-opacity-70' :
                      'bg-yellow-400 bg-opacity-0 group-hover:bg-opacity-70'
                    }`}>
                      <Icon className={`opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        index === 0 ? 'text-white' :
                        index === 1 ? 'text-white' :
                        index === 2 ? 'text-gray-900' :
                        'text-gray-900'
                      }`} size={32} />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-blue-900 mb-2 group-hover:text-red-600 transition-colors duration-300">
                    {member.name}
                  </h3>
                  
                  <h4 className="text-red-600 font-semibold text-sm mb-2">
                    {member.role}
                  </h4>
                  
                  <p className="text-navy-700 text-xs leading-relaxed">
                    {member.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal Certificazioni */}
      {selectedCoach !== null && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-2 sm:p-4">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setSelectedCoach(null)}></div>
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl max-h-[95vh] sm:max-h-[90vh] w-full overflow-hidden">
            {/* Header */}
            <div className={`bg-gradient-to-r ${
              staff[selectedCoach].name === 'Giuseppe Pandolfo' ? 'from-blue-900 to-blue-800' :
              staff[selectedCoach].name === 'Saverio Di Maria' ? 'from-red-600 to-red-700' :
              staff[selectedCoach].role.includes('Karate') ? 'from-white to-gray-100' :
              staff[selectedCoach].role.includes('Yoga') ? 'from-yellow-400 to-yellow-500' :
              'from-red-600 to-red-700'
            } ${
              staff[selectedCoach].role.includes('Karate') ? 'text-black' : 
              staff[selectedCoach].role.includes('Yoga') ? 'text-black' : 'text-white'
            } p-4 sm:p-6 relative`}>
              <button
                onClick={() => setSelectedCoach(null)}
                className={`absolute top-2 right-2 sm:top-4 sm:right-4 ${
                  staff[selectedCoach].role.includes('Karate') ? 'text-black hover:text-gray-600' :
                  staff[selectedCoach].role.includes('Yoga') ? 'text-black hover:text-gray-600' :
                  'text-white hover:text-gray-200'
                } transition-colors p-2 rounded-full hover:bg-black/10`}
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
              
              <div className="flex items-center space-x-3 sm:space-x-4 pr-8">
                <img 
                  src={staff[selectedCoach].image} 
                  alt={staff[selectedCoach].name}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 ${
                    staff[selectedCoach].role.includes('Karate') ? 'border-black' :
                    staff[selectedCoach].role.includes('Yoga') ? 'border-black' :
                    'border-white'
                  } shadow-lg`}
                />
                <div>
                  <h3 className="text-lg sm:text-xl font-bold">{staff[selectedCoach].name}</h3>
                  <p className="text-xs sm:text-sm opacity-90">{staff[selectedCoach].role}</p>
                </div>
              </div>
            </div>

            {/* Content Compatto */}
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-180px)] sm:max-h-[calc(90vh-180px)]">
              <div className="mb-3">
                <h4 className="text-base sm:text-lg font-bold text-blue-900 flex items-center">
                  <Award className="mr-2" size={18} />
                  {t.certifications}
                </h4>
              </div>

              <div className="space-y-2">
                {staff[selectedCoach].certifications.map((cert, index) => {
                  const Icon = staff[selectedCoach].icon;
                  const iconColor = 
                    staff[selectedCoach].name === 'Giuseppe Pandolfo' ? 'text-blue-900' :
                    staff[selectedCoach].name === 'Saverio Di Maria' ? 'text-red-600' :
                    staff[selectedCoach].role.includes('Karate') ? 'text-yellow-500' :
                    staff[selectedCoach].role.includes('Yoga') ? 'text-yellow-600' :
                    'text-red-600';
                  return (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-300">
                      <Icon className={`${iconColor} flex-shrink-0 mt-0.5`} size={16} />
                      <span className="text-sm text-navy-700 leading-relaxed">{cert}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
              <div className="flex items-center justify-center">
                <span className="text-xs text-gray-600">
                  Clicca per chiudere o premi ESC
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffSection;