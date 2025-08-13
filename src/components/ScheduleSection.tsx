import React from 'react';

const ScheduleSection: React.FC = () => {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-16 animate-fadeInUp">ORARI</h2>
        
        <div className="max-w-2xl mx-auto mb-12">
          <img 
            src="/images/orari.jpg" 
            alt="Orari della palestra" 
            className="w-full h-auto rounded-xl shadow-2xl transition-transform duration-300 hover:scale-105"
          />
        </div>

        <button className="bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl">
          VEDI ORARI COMPLETI
        </button>
      </div>
    </section>
  );
};

export default ScheduleSection;