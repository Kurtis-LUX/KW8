import React from 'react';

interface SubscriptionSectionProps {
  onNavigate?: (page: string, planType?: string) => void;
}

const SubscriptionSection: React.FC<SubscriptionSectionProps> = ({ onNavigate }) => {
  const plans = [
    {
      id: 'standard',
      name: 'Piano Standard',
      price: '35€/mese',
      description: 'Accesso illimitato a tutte le aree della palestra',
      features: ['Sala pesi', 'Cross training', 'Karate', 'Yoga', 'Consulenza nutrizionale']
    },
    {
      id: 'entry-flex',
      name: 'Piano Entry-Flex',
      price: '25€/10 ingressi',
      description: 'Flessibilità massima per i tuoi allenamenti',
      features: ['10 ingressi validi 3 mesi', 'Tutte le aree', 'Orario flessibile']
    }
  ];

  const beforeAfterCases = [
    {
      image: '/images/trasformazione-marco.jpg',
      title: 'Trasformazione Marco',
      description: 'Perdita di 15kg in 6 mesi'
    },
    {
      image: '/images/miglioramento-sara.jpg',
      title: 'Miglioramento Sara',
      description: 'Guadagno massa muscolare'
    },
    {
      image: '/images/recupero-giuseppe.jpg',
      title: 'Recupero Giuseppe',
      description: 'Risoluzione dolori alla schiena'
    }
  ];

  const handlePlanSelect = (planId: string) => {
    if (onNavigate) {
      onNavigate('payment', planId);
    }
  };

  return (
    <section id="abbonamenti" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 text-center mb-16 animate-fadeInUp">
          SCEGLI IL TUO PIANO
        </h2>

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          {plans.map((plan, index) => (
            <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <h3 className="text-2xl font-bold text-navy-900 mb-4">{plan.name}</h3>
              <div className="text-3xl font-bold text-red-600 mb-4">{plan.price}</div>
              <p className="text-navy-700 mb-6 leading-relaxed">{plan.description}</p>
              
              <ul className="mb-8 space-y-2">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="text-navy-700 flex items-center">
                    <span className="w-2 h-2 bg-red-600 rounded-full mr-3 animate-pulse"></span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handlePlanSelect(plan.id)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                {plan.name.toUpperCase()}
              </button>
            </div>
          ))}
        </div>

        {/* Separatore decorativo */}
        <div className="w-full py-4 flex justify-center bg-white">
          <div className="w-32 h-1 bg-red-600 rounded-full"></div>
        </div>

        {/* Before/After Cases */}
        <div className="mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-navy-900 text-center mb-12">
            CASI DI MIGLIORAMENTO FISICO
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {beforeAfterCases.map((case_, index) => (
              <div key={index} className="rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
                <img 
                  src={case_.image} 
                  alt={case_.title}
                  className="w-full h-48 object-cover transition-transform duration-300 hover:scale-110"
                />
                <div className="p-6 bg-white">
                  <h4 className="font-bold text-navy-900 mb-2">{case_.title}</h4>
                  <p className="text-navy-700 text-sm leading-relaxed">{case_.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SubscriptionSection;