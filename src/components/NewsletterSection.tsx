import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import emailService from '../services/emailService';

const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setErrorMessage('Inserisci un indirizzo email');
      setShowError(true);
      return;
    }
    
    if (!validateEmail(email)) {
      setErrorMessage('Inserisci un indirizzo email valido');
      setShowError(true);
      return;
    }
    
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
        setErrorMessage('Questa email è già iscritta alla newsletter.');
        setShowError(true);
      }
      
    } catch (error) {
      console.error('Errore durante l\'iscrizione:', error);
      setErrorMessage('Errore durante l\'invio. Riprova più tardi.');
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl md:text-5xl font-bold text-navy-900 text-center mb-16 animate-fadeInUp">
          RIMANI AGGIORNATO
        </h2>

        {/* Newsletter Subscription */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-100">
            <div className="text-center mb-8">
              <Mail className="mx-auto mb-4 text-red-600" size={48} />
              <h3 className="text-2xl font-bold text-navy-900 mb-4">
                Newsletter KW8
              </h3>
              <p className="text-navy-700 leading-relaxed">
                Inserisci la tua email per ricevere informazioni automatiche sulla palestra, 
                aggiornamenti sui nostri servizi ed eventi speciali.
              </p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Inserisci la tua email"
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
                    INVIO IN CORSO...
                  </>
                ) : (
                  'ISCRIVITI ALLA NEWSLETTER'
                )}
              </button>
            </form>
            
            {/* Success Message */}
            {showSuccess && (
              <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-lg flex items-center">
                <CheckCircle className="text-green-600 mr-2" size={20} />
                <span className="text-green-700 font-medium">
                  Perfetto! Ti abbiamo inviato un'email di benvenuto con tutte le informazioni sulla palestra.
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
              Non invieremo spam. Puoi annullare l'iscrizione in qualsiasi momento.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default NewsletterSection;