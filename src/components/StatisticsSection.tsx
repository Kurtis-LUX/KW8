import React, { useState, useEffect } from 'react';
import { Users, Calendar, Zap, Dumbbell, User, Salad, Shield, Clock, Brain, Heart } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

const StatisticsSection: React.FC = () => {
  const { t } = useLanguageContext();
  const [animatedNumbers, setAnimatedNumbers] = useState({ subscribers: 0, years: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    const startAnimation = () => {
      if (!hasAnimated) {
        setHasAnimated(true);
        
        // Animazione per gli iscritti (200)
        let subscriberCount = 0;
        const subscriberInterval = setInterval(() => {
          subscriberCount += 8;
          if (subscriberCount >= 200) {
            subscriberCount = 200;
            clearInterval(subscriberInterval);
          }
          setAnimatedNumbers(prev => ({ ...prev, subscribers: subscriberCount }));
        }, 30);
        
        // Animazione per gli anni (5)
        let yearCount = 0;
        const yearInterval = setInterval(() => {
          yearCount += 1;
          if (yearCount >= 5) {
            yearCount = 5;
            clearInterval(yearInterval);
          }
          setAnimatedNumbers(prev => ({ ...prev, years: yearCount }));
        }, 200);
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          startAnimation();
        }
      },
      { threshold: 0.3 }
    );

    const section = document.getElementById('statistiche');
    if (section) {
      observer.observe(section);
      
      // Fallback: se la sezione è già visibile, avvia l'animazione
      const rect = section.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        setTimeout(startAnimation, 500);
      }
    }

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, [hasAnimated]);

  const statistics = [
    { number: '200+', label: t.subscribers },
    { number: '5', label: t.yearsOfActivity }
  ];

  const values = [
    { icon: Zap, title: t.moreEnergy, description: t.moreEnergyDesc },
    { icon: Dumbbell, title: t.aesthetics, description: t.aestheticsDesc },
    { icon: User, title: t.posture, description: t.postureDesc },
    { icon: Salad, title: t.nutrition, description: t.nutritionDesc },
    { icon: Shield, title: t.selfDefense, description: t.selfDefenseDesc },
    { icon: Clock, title: t.discipline, description: t.disciplineDesc },
    { icon: Brain, title: t.stressManagement, description: t.stressManagementDesc },
    { icon: Heart, title: t.mentalWellbeing, description: t.mentalWellbeingDesc }
  ];

  return (
    <section id="statistiche" className="py-16 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Statistics */}
        <div className="text-center mb-16">
          <div className="flex justify-center space-x-12 mb-12">
            {statistics.map((stat, index) => {
              const displayNumber = index === 0 
                ? `${animatedNumbers.subscribers}+` 
                : animatedNumbers.years.toString();
              
              return (
                <div key={index} className="text-center transform hover:scale-110 transition-transform duration-300">
                  <div className="text-5xl md:text-6xl font-bold text-navy-900 mb-2 transition-all duration-300">
                    {displayNumber}
                  </div>
                  <div className="text-xl text-navy-700 uppercase tracking-wide font-semibold">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div key={index} className="text-center p-4 rounded-xl bg-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
                <div className="flex justify-center mb-3 transform hover:scale-110 transition-transform duration-300">
                  <Icon size={40} className="text-red-600 drop-shadow-sm" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">
                  {value.title}
                </h3>
                <p className="text-navy-700 text-xs leading-relaxed">
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