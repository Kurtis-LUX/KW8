import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle, AlertCircle, Bell, Smartphone, Bookmark, Inbox } from 'lucide-react';
import emailService from '../services/emailService';
import { useLanguageContext } from '../contexts/LanguageContext';


const NewsletterSection: React.FC = () => {
  const { t } = useLanguageContext();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1,
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
  }, []);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isValid = emailRegex.test(email.trim());
    
    // Debug dettagliato quando la validazione fallisce
    if (!isValid) {
      console.log('❌ Email non valida:', email.trim());
    } else {
      console.log('✅ Email valida:', email.trim());
    }
    
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage(t.enterEmail);
      setShowError(true);
      return;
    }
    
    if (!validateEmail(email)) {
      setErrorMessage(t.enterValidEmail);
      setShowError(true);
      return;
    }

    console.log('Tentativo di iscrizione newsletter per:', email);
    setIsSubmitting(true);
    
    setIsSubmitting(true);
    setShowError(false);
    
    try {
      // Utilizza il servizio email per l'iscrizione alla newsletter
      const success = await emailService.subscribeToNewsletter(email.trim());
      
      if (success) {
        setShowSuccess(true);
        setEmail('');
        
        // Nascondi il messaggio di successo dopo 5 secondi
        setTimeout(() => {
          setShowSuccess(false);
        }, 5000);
      } else {
        // Email già iscritta
        setErrorMessage(t.emailAlreadySubscribed);
        setShowError(true);
      }
      
    } catch (error) {
      console.error('Errore durante l\'iscrizione:', error);
      setErrorMessage(t.subscribeError);
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section 
      ref={sectionRef}
      id="newsletter" 
      className={`py-16 bg-gradient-to-b from-white to-gray-50 transition-opacity duration-1000 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-900">{t.subscribeToNewsletter}</h2>
          {/* Descrizione rimossa su richiesta */}
          {/* <p className="text-lg text-gray-500 mb-8">{t.newsletterDescription}</p> */}

          {/* Newsletter Subscription */}
          <div className={`max-w-2xl mx-auto transition-all duration-1000 delay-500 transform ${
            isVisible 
              ? 'translate-y-0 opacity-100' 
              : 'translate-y-10 opacity-0'
          }`}>
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <Mail className="mx-auto mb-4 text-red-600" size={48} />
              <h3 className="text-2xl font-bold text-navy-900 mb-4">
                Newsletter KW8
              </h3>
              {/* Descrizione rimossa su richiesta */}
              {/* <p className="text-navy-700 leading-relaxed">
                {t.newsletterDescription}
              </p> */}
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t.enterYourEmail}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                  disabled={isSubmitting}
                />
              </div>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                    {t.sending}
                  </>
                ) : (
                  t.subscribeToNewsletter
                )}
              </button>
            </form>
            
            {/* Success Message */}
            {showSuccess && (
              <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-lg flex items-center">
                <CheckCircle className="text-green-600 mr-2" size={20} />
                <span className="text-green-700 font-medium">
                  {t.subscriptionSuccess}
                </span>
              </div>
            )}
            
            {/* Error Message */}
            {showError && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 rounded-lg flex items-center">
                <AlertCircle className="text-red-600 mr-2" size={20} />
                <span className="text-red-700 font-medium">{errorMessage}</span>
              </div>
            )}
            
            <p className="text-xs text-gray-600 text-center mt-4">
              {t.noSpamPolicy}
            </p>
          </div>
        </div>
      </div>
      </div>
    </section>
  );
};

export default NewsletterSection;