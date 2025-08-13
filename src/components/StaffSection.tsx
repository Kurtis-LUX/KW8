import React from 'react';

const StaffSection: React.FC = () => {
  const staff = [
    {
      name: 'Giuseppe Pandolfo',
      role: 'Personal Trainer Sala Pesi',
      description: 'Certificazioni, esperienza, lavoro affiancato personalizzato.',
      image: '/images/giuseppe pandolfo.jpg'
    },
    {
      name: 'Saverio Di Maria',
      role: 'Coach Cross training',
      description: 'Certificazioni, attenzione agli obiettivi individuali.',
      image: '/images/saverio dimaria.jpg'
    },
    {
      name: 'Simone La Rosa',
      role: 'Maestro Karate',
      description: 'Cintura, certificazioni, focus su autodifesa e disciplina.',
      image: '/images/simone larosa.jpg'
    },
    {
      name: 'Eleonora Nonnehoidea',
      role: 'Maestra Yoga',
      description: 'Approccio olistico e personalizzazione in base alle esigenze.',
      image: '/images/eleonora nonnehoidea.jpg'
    }
  ];

  return (
    <section id="staff" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 text-center mb-16 animate-fadeInUp">
          STAFF / COACH
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {staff.map((member, index) => (
            <div key={index} className="text-center group transform hover:-translate-y-2 transition-all duration-300">
              <div className="relative overflow-hidden rounded-xl mb-6 shadow-lg group-hover:shadow-2xl transition-shadow duration-300">
                <img 
                  src={member.image} 
                  alt={member.name}
                  className="w-full h-64 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-navy-900 bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-500"></div>
              </div>
              
              <h3 className="text-xl font-bold text-navy-900 mb-3">
                {member.name}
              </h3>
              
              <h4 className="text-red-600 font-semibold mb-4">
                {member.role}
              </h4>
              
              <p className="text-navy-700 text-sm leading-relaxed">
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StaffSection;