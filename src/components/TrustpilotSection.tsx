import React, { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

const TrustpilotSection: React.FC = () => {
  const { t } = useLanguageContext();
  const [currentReview, setCurrentReview] = useState(0);

  const reviews = [
    {
      name: 'Marco Rossi',
      rating: 5,
      date: '2 settimane fa',
      title: 'Esperienza fantastica!',
      content: 'Palestra eccellente con attrezzature moderne e staff competente. Ho raggiunto i miei obiettivi in tempi record grazie al supporto personalizzato.',
      verified: true
    },
    {
      name: 'Sara Bianchi',
      rating: 5,
      date: '1 mese fa',
      title: 'Ambiente professionale',
      content: 'Finalmente una palestra seria! I personal trainer sono preparati e l\'ambiente è sempre pulito. Consigliatissima per chi vuole risultati veri.',
      verified: true
    },
    {
      name: 'Giuseppe Verdi',
      rating: 5,
      date: '3 settimane fa',
      title: 'Ottimo rapporto qualità-prezzo',
      content: 'Prezzi onesti per un servizio di qualità. Le lezioni di karate sono fantastiche e il cross training mi ha cambiato la vita. Top!',
      verified: true
    },
    {
      name: 'Elena Neri',
      rating: 5,
      date: '1 settimana fa',
      title: 'Staff eccezionale',
      content: 'Lo staff è sempre disponibile e professionale. Mi hanno aiutato a superare i miei limiti e ora mi sento più forte che mai.',
      verified: true
    },
    {
      name: 'Andrea Gialli',
      rating: 5,
      date: '2 mesi fa',
      title: 'Risultati garantiti',
      content: 'In 6 mesi ho perso 12kg e guadagnato massa muscolare. Il programma personalizzato ha fatto la differenza. Grazie KW8!',
      verified: true
    }
  ];

  const nextReview = () => {
    setCurrentReview((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentReview((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={20}
        className={`${index < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-navy-900 mb-8 animate-fadeInUp">
            {t.whatOurClientsSay}
          </h2>
          
          {/* Trustpilot Logo e Rating */}
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold text-lg mr-4">
                Trustpilot
              </div>
              <div className="flex items-center space-x-1">
                {renderStars(Math.round(averageRating))}
                <span className="ml-2 text-xl font-bold text-navy-900">
                  {averageRating.toFixed(1)}
                </span>
              </div>
            </div>
            <p className="text-navy-700 font-semibold">
              {t.excellent} • {reviews.length} {t.reviews}
            </p>
          </div>
        </div>

        {/* Transazioni */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto mb-16">
          {/* Transazioni in Entrata */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 p-3 rounded-full">
                  <TrendingUp className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-green-800">Transazioni in Entrata</h3>
                  <p className="text-green-600 text-sm">Nuovi iscritti questo mese</p>
                </div>
              </div>
              <ArrowUpRight className="text-green-600" size={20} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-green-700">Nuovi membri</span>
                <span className="font-bold text-green-800 text-lg">+47</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700">Rinnovi</span>
                <span className="font-bold text-green-800 text-lg">+23</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-green-700">Upgrade abbonamenti</span>
                <span className="font-bold text-green-800 text-lg">+12</span>
              </div>
              <div className="border-t border-green-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-green-800 font-semibold">Totale</span>
                  <span className="font-bold text-green-800 text-xl">+82</span>
                </div>
              </div>
            </div>
          </div>

          {/* Transazioni in Uscita */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-8 border border-red-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="bg-red-600 p-3 rounded-full">
                  <TrendingDown className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-red-800">Transazioni in Uscita</h3>
                  <p className="text-red-600 text-sm">Disiscrizioni questo mese</p>
                </div>
              </div>
              <ArrowDownLeft className="text-red-600" size={20} />
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-red-700">Disiscrizioni</span>
                <span className="font-bold text-red-800 text-lg">-8</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-700">Mancati rinnovi</span>
                <span className="font-bold text-red-800 text-lg">-5</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-red-700">Downgrade</span>
                <span className="font-bold text-red-800 text-lg">-2</span>
              </div>
              <div className="border-t border-red-300 pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-red-800 font-semibold">Totale</span>
                  <span className="font-bold text-red-800 text-xl">-15</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Slider */}
        <div className="relative max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 relative overflow-hidden">
            {/* Quote Icon */}
            <div className="absolute top-6 left-6 text-red-600 opacity-20">
              <Quote size={48} />
            </div>
            
            {/* Review Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-700 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {reviews[currentReview].name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-navy-900 text-lg">
                      {reviews[currentReview].name}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        {renderStars(reviews[currentReview].rating)}
                      </div>
                      {reviews[currentReview].verified && (
                        <span className="text-green-600 text-sm font-medium">
                          ✓ Verificata
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-gray-500 text-sm">
                  {reviews[currentReview].date}
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-navy-900 mb-4">
                {reviews[currentReview].title}
              </h3>
              
              <p className="text-navy-700 leading-relaxed text-lg">
                {reviews[currentReview].content}
              </p>
            </div>
          </div>
          
          {/* Navigation Buttons */}
          <button
            onClick={prevReview}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-50 text-navy-900 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft size={24} />
          </button>
          
          <button
            onClick={nextReview}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white hover:bg-gray-50 text-navy-900 p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
          >
            <ChevronRight size={24} />
          </button>
        </div>
        
        {/* Dots Indicator */}
        <div className="flex justify-center mt-8 space-x-2">
          {reviews.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentReview(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentReview
                  ? 'bg-red-600 scale-125'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
        
        {/* CTA */}
        <div className="text-center mt-12">
          <p className="text-navy-700 mb-6 text-lg">
            {t.joinSatisfiedClients}
          </p>
          <a
            href="https://www.trustpilot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
          >
            <span>{t.seeAllReviews}</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default TrustpilotSection;