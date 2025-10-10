import React, { useState, useEffect, useRef } from 'react';
import { Users, Calendar, Zap, Dumbbell, User, Salad, Shield, Clock, Brain, Heart } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

const StatisticsSection: React.FC = () => {
  const { t } = useLanguageContext();
  const [animatedNumbers, setAnimatedNumbers] = useState({ subscribers: 0, years: 0 });
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting && !hasAnimated) {
          startAnimation();
        }
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
  }, [hasAnimated]);

  const startAnimation = () => {
    if (!hasAnimated) {
      setHasAnimated(true);
      
      // Animazione per gli iscritti
      let subscriberCount = 0;
      const subscriberInterval = setInterval(() => {
        subscriberCount += 5;
        if (subscriberCount >= 200) {
          subscriberCount = 200;
          clearInterval(subscriberInterval);
        }
        setAnimatedNumbers(prev => ({ ...prev, subscribers: subscriberCount }));
      }, 50);
      
      // Animazione per gli anni
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

  const statistics = [
    { number: animatedNumbers.subscribers.toString() + '+', label: t.subscribers || 'Iscritti' },
    { number: animatedNumbers.years.toString(), label: t.yearsOfActivity }
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
    <section 
      ref={sectionRef}
      id="statistiche" 
      className={`py-20 bg-gradient-to-b from-white to-gray-50 scroll-mt-[100px] transition-all duration-1000 transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-6 font-sfpro">
        {/* Statistics */}
        <div className="text-center mb-20">
          <div className="flex justify-center space-x-12 mb-12">
            {statistics.map((stat, index) => {
              return (
                <div 
                  key={index} 
                  className="text-center"
                >
                  <div className="text-5xl md:text-6xl font-semibold text-navy-900 mb-2 transition-all duration-300">
                    {stat.number}
                  </div>
                  <div className="text-lg text-navy-700 tracking-tight font-medium">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Values */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon;
            return (
              <div 
                key={index} 
                className={`text-center p-5 rounded-2xl bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-200 border border-white/60 ${
                  isVisible 
                    ? 'translate-y-0 opacity-100 scale-100' 
                    : 'translate-y-8 opacity-0 scale-95'
                }`}
                style={{ transitionDelay: `${600 + index * 100}ms` }}
              >
                <div className={`flex justify-center mb-2 transition-all duration-150 ${
                  isVisible 
                    ? 'rotate-0 scale-100' 
                    : 'rotate-180 scale-0'
                }`}
                style={{ transitionDelay: `${800 + index * 100}ms` }}>
                  <Icon size={28} className="text-red-600 drop-shadow-sm" />
                </div>
                <h3 className="text-sm font-semibold text-navy-900 mb-1">
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