import React from 'react';
import { Users, Calendar, Zap, Dumbbell, User, Salad, Shield, Clock, Brain } from 'lucide-react';

const StatisticsSection: React.FC = () => {
  const statistics = [
    { number: '200+', label: 'iscritti' },
    { number: '5', label: 'anni di attività' }
  ];

  const values = [
    { icon: Zap, title: 'Più energia', description: 'Aumenta i tuoi livelli di energia e vitalità quotidiana' },
    { icon: Dumbbell, title: 'Estetica', description: 'Miglioramento dell\'aspetto fisico e della forma' },
    { icon: User, title: 'Postura', description: 'Correzione della postura e allineamento corporeo' },
    { icon: Salad, title: 'Alimentazione', description: 'Consulenza nutrizionale personalizzata' },
    { icon: Shield, title: 'Autodifesa', description: 'Tecniche di difesa personale e sicurezza' },
    { icon: Clock, title: 'Disciplina', description: 'Sviluppo della disciplina e costanza' },
    { icon: Brain, title: 'Gestione dello stress', description: 'Tecniche per ridurre stress e ansia' }
  ];

  return (
    <section id="statistiche" className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Statistics */}
        <div className="text-center mb-20">
          <div className="flex justify-center space-x-16 mb-16">
            {statistics.map((stat, index) => (
              <div key={index} className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-5xl md:text-6xl font-bold text-navy-900 mb-2 animate-countUp">
                  {stat.number}
                </div>
                <div className="text-xl text-navy-700 uppercase tracking-wide font-semibold">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div key={index} className="text-center p-6 rounded-xl bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex justify-center mb-4 transform hover:scale-110 transition-transform duration-300">
                  <Icon size={48} className="text-red-600 drop-shadow-sm" />
                </div>
                <h3 className="text-xl font-bold text-navy-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-navy-700 text-sm leading-relaxed">
                  {value.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default StatisticsSection;