import React, { useState, useEffect } from 'react';
import { X, Award, Dumbbell, Zap, Shield, Heart } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

const StaffSection: React.FC = () => {
  const { t } = useLanguageContext();
  const [selectedCoach, setSelectedCoach] = useState<number | null>(null);

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

  // Blocca lo scroll della pagina quando il modal è aperto
  useEffect(() => {
    if (selectedCoach !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup quando il componente viene smontato
    return () => {
      document.body.style.overflow = 'unset';
    };
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
      name: 'Eleonora Nonnehoidea',
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
      <section id="staff" className="py-16 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 text-center mb-12 animate-fadeInUp">
            {t.ourTeam}
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {staff.map((member, index) => {
              const Icon = member.icon;
              return (
                <div 
                  key={index} 
                  className="text-center group cursor-pointer transform hover:-translate-y-2 transition-all duration-300"
                  onClick={() => setSelectedCoach(index)}
                >
                  <div className="relative overflow-hidden rounded-xl mb-4 shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
                    <img 
                      src={member.image} 
                      alt={member.name}
                      className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-navy-900 bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-500 flex items-center justify-center">
                      <Icon className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" size={32} />
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-navy-900 mb-2 group-hover:text-red-600 transition-colors duration-300">
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
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 sm:p-6 relative">
              <button
                onClick={() => setSelectedCoach(null)}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/10"
              >
                <X size={20} className="sm:w-6 sm:h-6" />
              </button>
              
              <div className="flex items-center space-x-3 sm:space-x-4 pr-8">
                <img 
                  src={staff[selectedCoach].image} 
                  alt={staff[selectedCoach].name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white shadow-lg"
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
                <h4 className="text-base sm:text-lg font-bold text-navy-900 flex items-center">
                  <Award className="mr-2" size={18} />
                  {t.certifications}
                </h4>
              </div>

              <div className="space-y-2">
                {staff[selectedCoach].certifications.map((cert, index) => {
                  const Icon = staff[selectedCoach].icon;
                  return (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 hover:shadow-md transition-all duration-300">
                      <Icon className="text-red-600 flex-shrink-0 mt-0.5" size={16} />
                      <span className="text-sm text-navy-700 leading-relaxed">{cert}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer con azione */}
            <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 hidden sm:block">
                  Clicca per chiudere o premi ESC
                </span>
                <button
                  onClick={() => setSelectedCoach(null)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                >
                  {t.closeCertifications}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StaffSection;