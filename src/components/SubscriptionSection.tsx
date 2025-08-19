import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp } from 'lucide-react';

interface SubscriptionSectionProps {
  onNavigate?: (page: string, planType?: string) => void;
}

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ onNavigate }) => {
  const [currentCase, setCurrentCase] = useState(0);

  const beforeAfterCases = [
    {
      beforeImage: '/images/marco-prima.svg',
      afterImage: '/images/marco-dopo.svg',
      title: 'Trasformazione Marco',
      description: 'Perdita di 15kg in 6 mesi',
      duration: '6 mesi',
      progress: 85,
      stats: [
        { label: 'Peso perso', value: '15kg' },
        { label: 'Massa grassa', value: '-8%' },
        { label: 'Forza', value: '+25%' }
      ]
    },
    {
      beforeImage: '/images/sara-prima.svg',
      afterImage: '/images/sara-dopo.svg',
      title: 'Miglioramento Sara',
      description: 'Guadagno massa muscolare',
      duration: '4 mesi',
      progress: 92,
      stats: [
        { label: 'Massa muscolare', value: '+3kg' },
        { label: 'Forza', value: '+40%' },
        { label: 'Resistenza', value: '+60%' }
      ]
    },
    {
      beforeImage: '/images/giuseppe-prima.svg',
      afterImage: '/images/giuseppe-dopo.svg',
      title: 'Recupero Giuseppe',
      description: 'Risoluzione dolori alla schiena',
      duration: '3 mesi',
      progress: 95,
      stats: [
        { label: 'Dolore', value: '-90%' },
        { label: 'Mobilità', value: '+70%' },
        { label: 'Postura', value: '+80%' }
      ]
    }
  ];

  const nextCase = () => {
    setCurrentCase((prev) => (prev + 1) % beforeAfterCases.length);
  };

  const prevCase = () => {
    setCurrentCase((prev) => (prev - 1 + beforeAfterCases.length) % beforeAfterCases.length);
  };

  return (
    <section id="informazioni" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 text-center mb-16 animate-fadeInUp">
          CASI DI MIGLIORAMENTO FISICO
        </h2>

        {/* Before/After Cases Slider */}
        <div className="mb-8">
          
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Slider Container */}
              <div className="relative">
                <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentCase * 100}%)` }}>
                  {beforeAfterCases.map((case_, index) => (
                    <div key={index} className="w-full flex-shrink-0">
                      <div className="p-4 md:p-6">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg md:text-xl font-bold text-navy-900">{case_.title}</h4>
                            <p className="text-sm text-navy-700">{case_.description}</p>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-red-600">
                            <Calendar size={16} />
                            <span className="font-semibold">{case_.duration}</span>
                          </div>
                        </div>

                        {/* Before/After Images */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="relative">
                            <img 
                              src={case_.beforeImage} 
                              alt={`${case_.title} - Prima`}
                              className="w-full h-40 sm:h-32 md:h-40 object-cover rounded-lg"
                            />
                            <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-semibold">
                              PRIMA
                            </div>
                          </div>
                          <div className="relative">
                            <img 
                              src={case_.afterImage} 
                              alt={`${case_.title} - Dopo`}
                              className="w-full h-40 sm:h-32 md:h-40 object-cover rounded-lg"
                            />
                            <div className="absolute top-2 left-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-semibold">
                              DOPO
                            </div>
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
                {beforeAfterCases.map((_, index) => (
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