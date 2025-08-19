import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, User } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

interface SubscriptionSectionProps {
  onNavigate?: (page: string, planType?: string) => void;
}

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ onNavigate }) => {
  const { t } = useLanguageContext();
  const [currentCase, setCurrentCase] = useState(0);

  const transformationCases = [
    {
      name: t.transformations?.marco?.name || 'Marco',
      title: t.transformations?.marco?.title || 'Trasformazione Marco',
      description: t.transformations?.marco?.description || 'Perdita di 15kg in 6 mesi',
      duration: t.transformations?.marco?.duration || '6 mesi',
      progress: 85,
      icon: '💪',
      stats: [
        { label: t.transformations?.marco?.stats?.weightLost || 'Peso perso', value: '15kg' },
        { label: t.transformations?.marco?.stats?.bodyFat || 'Massa grassa', value: '-8%' },
        { label: t.transformations?.marco?.stats?.strength || 'Forza', value: '+25%' }
      ]
    },
    {
      name: t.transformations?.sara?.name || 'Sara',
      title: t.transformations?.sara?.title || 'Miglioramento Sara',
      description: t.transformations?.sara?.description || 'Guadagno massa muscolare',
      duration: t.transformations?.sara?.duration || '4 mesi',
      progress: 92,
      icon: '🏋️‍♀️',
      stats: [
        { label: t.transformations?.sara?.stats?.muscleMass || 'Massa muscolare', value: '+3kg' },
        { label: t.transformations?.sara?.stats?.strength || 'Forza', value: '+40%' },
        { label: t.transformations?.sara?.stats?.endurance || 'Resistenza', value: '+60%' }
      ]
    },
    {
      name: t.transformations?.giuseppe?.name || 'Giuseppe',
      title: t.transformations?.giuseppe?.title || 'Recupero Giuseppe',
      description: t.transformations?.giuseppe?.description || 'Risoluzione dolori alla schiena',
      duration: t.transformations?.giuseppe?.duration || '3 mesi',
      progress: 95,
      icon: '🧘‍♂️',
      stats: [
        { label: t.transformations?.giuseppe?.stats?.pain || 'Dolore', value: '-90%' },
        { label: t.transformations?.giuseppe?.stats?.mobility || 'Mobilità', value: '+70%' },
        { label: t.transformations?.giuseppe?.stats?.posture || 'Postura', value: '+80%' }
      ]
    }
  ];

  const nextCase = () => {
    setCurrentCase((prev) => (prev + 1) % transformationCases.length);
  };

  const prevCase = () => {
    setCurrentCase((prev) => (prev - 1 + transformationCases.length) % transformationCases.length);
  };

  return (
    <section id="informazioni" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 text-center mb-16 animate-fadeInUp">
          {t.transformations?.title || 'CASI DI MIGLIORAMENTO FISICO'}
        </h2>

        {/* Transformation Cases Slider */}
        <div className="mb-8">
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Slider Container */}
              <div className="relative">
                <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentCase * 100}%)` }}>
                  {transformationCases.map((case_, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <div className="p-6 md:p-8">
                        {/* Header with Icon */}
                        <div className="text-center mb-6">
                          <div className="text-6xl mb-4">{case_.icon}</div>
                          <h4 className="text-2xl md:text-3xl font-bold text-navy-900 mb-2">{case_.title}</h4>
                          <p className="text-lg text-navy-700 mb-4">{case_.description}</p>
                          <div className="flex items-center justify-center space-x-2 text-sm text-red-600">
                            <Calendar size={16} />
                            <span className="font-semibold">{case_.duration}</span>
                          </div>
                        </div>

                        {/* User Icon and Name */}
                        <div className="flex items-center justify-center mb-6">
                          <div className="flex items-center space-x-3 bg-gray-50 px-4 py-2 rounded-full">
                            <User size={20} className="text-navy-700" />
                            <span className="font-semibold text-navy-900">{case_.name}</span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-navy-900 flex items-center">
                              <TrendingUp size={16} className="mr-1" />
                              Progresso Obiettivo
                            </span>
                            <span className="text-sm font-bold text-green-600">{case_.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-green-500 h-2 rounded-full transition-all duration-1000"
                              style={{ width: `${case_.progress}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                          {case_.stats.map((stat, statIndex) => (
                            <div key={statIndex} className="text-center p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                              <div className="text-lg md:text-xl font-bold text-navy-900">{stat.value}</div>
                              <div className="text-xs text-navy-700">{stat.label}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Arrows */}
                <button
                  onClick={prevCase}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-navy-900 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextCase}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white text-navy-900 rounded-full p-2 shadow-lg transition-all duration-300 hover:scale-110"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              {/* Dots Indicator */}
              <div className="flex justify-center space-x-2 p-4 bg-gray-50">
                {transformationCases.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentCase(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentCase ? 'bg-red-600 w-6' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionSection;