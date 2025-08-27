import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, MapPin } from 'lucide-react';
import { useLanguageContext } from '../contexts/LanguageContext';

const ScheduleSection: React.FC = () => {
  const { t } = useLanguageContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  // Aggiorna l'ora ogni secondo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.15,
        rootMargin: '40px'
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
  }, []);

  // Orari della palestra
  const scheduleData = {
    lunedi: { open: '09:00-13:00', close: '16:00-21:00', isOpen: true },
    martedi: { open: '09:00-14:30', close: '16:00-21:00', isOpen: true },
    mercoledi: { open: '09:00-13:00', close: '16:00-21:00', isOpen: true },
    giovedi: { open: '09:00-14:30', close: '16:00-21:00', isOpen: true },
    venerdi: { open: '09:00-13:00', close: '16:00-21:00', isOpen: true },
    sabato: { open: '09:00-14:30', close: '16:00-21:00', isOpen: true },
    domenica: { open: 'CHIUSO', close: '', isOpen: false }
  };

  const daysOfWeek = ['domenica', 'lunedi', 'martedi', 'mercoledi', 'giovedi', 'venerdi', 'sabato'];
  const dayNames = [t.sunday, t.monday, t.tuesday, t.wednesday, t.thursday, t.friday, t.saturday];
  
  // Ordine per visualizzazione: Lunedì-Sabato, poi Domenica
  const displayOrder = [1, 2, 3, 4, 5, 6, 0]; // Indici per riordinare i giorni
  
  const today = daysOfWeek[currentDate.getDay()];
  const todaySchedule = scheduleData[today];

  // Verifica se la palestra è attualmente aperta
  const isCurrentlyOpen = () => {
    if (!todaySchedule.isOpen) return false;
    
    const now = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    // Prima fascia oraria (mattina)
    const morningSlot = todaySchedule.open.split('-');
    const [morningStart, morningEnd] = morningSlot;
    const [morningStartHour, morningStartMin] = morningStart.split(':').map(Number);
    const [morningEndHour, morningEndMin] = morningEnd.split(':').map(Number);
    const morningStartTime = morningStartHour * 60 + morningStartMin;
    const morningEndTime = morningEndHour * 60 + morningEndMin;
    
    // Seconda fascia oraria (pomeriggio/sera)
    const eveningSlot = todaySchedule.close.split('-');
    const [eveningStart, eveningEnd] = eveningSlot;
    const [eveningStartHour, eveningStartMin] = eveningStart.split(':').map(Number);
    const [eveningEndHour, eveningEndMin] = eveningEnd.split(':').map(Number);
    const eveningStartTime = eveningStartHour * 60 + eveningStartMin;
    const eveningEndTime = eveningEndHour * 60 + eveningEndMin;
    
    return (now >= morningStartTime && now <= morningEndTime) || 
           (now >= eveningStartTime && now <= eveningEndTime);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <section 
      id="orari"
      ref={sectionRef}
      className={`py-12 bg-white transition-all duration-1000 transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto px-4 text-center">
        <h2 className={`text-3xl md:text-4xl font-bold text-navy-900 mb-8 transition-all duration-800 delay-100 transform ${
          isVisible 
            ? 'translate-y-0 opacity-100' 
            : '-translate-y-8 opacity-0'
        }`}>{t.schedules}</h2>
        
        {/* Data e Ora Attuale */}
        <div className={`max-w-6xl mx-auto mb-6 transition-all duration-900 delay-300 transform ${
          isVisible 
            ? 'translate-x-0 opacity-100' 
            : '-translate-x-10 opacity-0'
        }`}>
          <div className="bg-gray-50 rounded-xl shadow-lg p-4 mb-4 border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="text-red-600" size={20} />
                <span className="text-sm md:text-base font-semibold text-navy-900">{formatDate(currentDate)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="text-red-600" size={20} />
                <span className="text-sm md:text-base font-semibold text-navy-900">{formatTime(currentTime)}</span>
              </div>
            </div>
            
            {/* Stato Attuale e Orari di Oggi */}
            <div className="flex flex-col sm:flex-row items-center justify-between bg-gray-50 rounded-lg p-3 mb-4 space-y-2 sm:space-y-0">
              <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full font-semibold text-sm ${
                isCurrentlyOpen() 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isCurrentlyOpen() ? 'bg-green-500' : 'bg-red-500'
                }`}></div>
                <span>{isCurrentlyOpen() ? t.openNow : t.closedNow}</span>
              </div>
              
              <div className="text-center sm:text-right">
                <h3 className="text-sm font-bold text-navy-900 mb-1">{t.today} - {dayNames[currentDate.getDay()]}</h3>
                <div className="text-xs">
                  {todaySchedule.isOpen ? (
                    <div className="text-navy-700">
                      <span><strong>{t.morning}:</strong> {todaySchedule.open}</span>
                      <span className="mx-2">•</span>
                      <span><strong>{t.evening}:</strong> {todaySchedule.close}</span>
                    </div>
                  ) : (
                    <span className="text-red-600 font-semibold">{t.closed}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Orari Settimanali */}
            <div className={`bg-gray-50 rounded-xl shadow-lg p-4 border border-gray-200 transition-all duration-1000 delay-500 transform ${
              isVisible 
                ? 'translate-y-0 opacity-100' 
                : 'translate-y-10 opacity-0'
            }`}>
              <h3 className="text-xl font-bold text-navy-900 mb-4">{t.weeklySchedule}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                {/* Giorni Lunedì-Sabato */}
                {displayOrder.slice(0, 6).map((dayIndex) => {
                  const day = daysOfWeek[dayIndex];
                  const schedule = scheduleData[day];
                  return (
                    <div 
                      key={day} 
                      className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                        day === today 
                          ? 'border-red-600 bg-red-50' 
                          : 'border-gray-200 bg-gray-50 hover:border-red-300'
                      }`}
                    >
                      <h4 className="font-bold text-navy-900 mb-2 text-xs sm:text-sm capitalize">{dayNames[dayIndex]}</h4>
                      {schedule.isOpen ? (
                        <div className="text-xs text-navy-700">
                          <div className="mb-1">
                            <span className="font-semibold">{t.morning}:</span><br className="sm:hidden" /> {schedule.open}
                          </div>
                          <div>
                            <span className="font-semibold">{t.evening}:</span><br className="sm:hidden" /> {schedule.close}
                          </div>
                        </div>
                      ) : (
                        <span className="text-red-600 font-semibold text-xs">{t.closed}</span>
                      )}
                    </div>
                  );
                })}
                
                {/* Domenica - prende due caselle */}
                {(() => {
                  const dayIndex = displayOrder[6]; // Domenica
                  const day = daysOfWeek[dayIndex];
                  const schedule = scheduleData[day];
                  return (
                    <div 
                      key={day} 
                      className={`col-span-2 p-4 rounded-lg border-2 transition-all duration-300 ${
                        day === today 
                          ? 'border-red-600 bg-red-50' 
                          : 'border-gray-200 bg-gray-50 hover:border-red-300'
                      }`}
                    >
                      <h4 className="font-bold text-navy-900 mb-2 text-sm sm:text-base capitalize text-center">{dayNames[dayIndex]}</h4>
                      <div className="text-center">
                        {schedule.isOpen ? (
                          <div className="text-sm text-navy-700">
                            <div className="mb-1">
                              <span className="font-semibold">{t.morning}:</span> {schedule.open}
                            </div>
                            <div>
                              <span className="font-semibold">{t.evening}:</span> {schedule.close}
                            </div>
                          </div>
                        ) : (
                          <span className="text-red-600 font-semibold text-sm">{t.closed}</span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>

        <div className={`flex justify-center transition-all duration-800 delay-700 transform ${
          isVisible 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-8 opacity-0'
        }`}>
          <a 
            href="tel:+393338346546" 
            className="bg-navy-900 hover:bg-navy-800 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center space-x-2"
          >
            <span>{t.callNow}</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default ScheduleSection;