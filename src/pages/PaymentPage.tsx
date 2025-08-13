import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Lock, Check } from 'lucide-react';
import DB from '../utils/database';
import { v4 as uuidv4 } from 'uuid';

// Importazioni per Stripe (commentate fino all'installazione dei pacchetti)
// import { loadStripe } from '@stripe/stripe-js';
// import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Simulazione di Stripe per demo
const StripeSimulation = {
  CardElement: ({ className, options }: any) => (
    <div className={className}>
      <div className="p-4 border rounded-md bg-white">
        <div className="mb-2 text-sm text-gray-600">Numero carta</div>
        <div className="h-10 bg-gray-100 rounded-md mb-4"></div>
        <div className="flex space-x-4">
          <div className="flex-1">
            <div className="mb-2 text-sm text-gray-600">Scadenza</div>
            <div className="h-10 bg-gray-100 rounded-md"></div>
          </div>
          <div className="flex-1">
            <div className="mb-2 text-sm text-gray-600">CVC</div>
            <div className="h-10 bg-gray-100 rounded-md"></div>
          </div>
        </div>
      </div>
    </div>
  )
};

interface PaymentPageProps {
  planType?: string;
  onNavigate: (page: string) => void;
}

const PaymentPage: React.FC<PaymentPageProps> = ({ planType = 'standard', onNavigate }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: '',
    city: '',
    postalCode: ''
  });

  const plans = {
    standard: {
      name: 'Piano Standard',
      price: '35€',
      period: '/mese',
      features: ['Accesso illimitato', 'Sala pesi', 'Cross training', 'Karate', 'Yoga', 'Consulenza nutrizionale']
    },
    'entry-flex': {
      name: 'Piano Entry-Flex',
      price: '25€',
      period: '/10 ingressi',
      features: ['10 ingressi validi 3 mesi', 'Tutte le aree', 'Orario flessibile', 'Massima flessibilità']
    }
  };

  // Assicuriamoci che il planType sia valido prima di accedervi
  const normalizedPlanType = planType?.toLowerCase();
  const selectedPlan = normalizedPlanType && plans[normalizedPlanType as keyof typeof plans] 
    ? plans[normalizedPlanType as keyof typeof plans] 
    : plans.standard;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  useEffect(() => {
    // Recupera l'email dell'utente dal localStorage se disponibile
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      // Recupera i dati dell'utente dal database
      const user = DB.getUserByEmail(userEmail);
      if (user) {
        // Pre-compila il form con i dati dell'utente
        setFormData(prev => ({
          ...prev,
          email: user.email,
          firstName: user.name?.split(' ')[0] || '',
          lastName: user.name?.split(' ')[1] || ''
        }));
      }
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulazione di elaborazione del pagamento
    setIsProcessing(true);
    
    // Simulazione di una richiesta API a Stripe
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentSuccess(true);
      
      // Salva l'abbonamento nel database
      const userId = localStorage.getItem('userId');
      if (userId) {
        const user = DB.getUserById(userId);
        if (user) {
          // Aggiorna l'utente con il nuovo abbonamento normalizzato
          user.subscriptionType = normalizedPlanType || 'standard';
          user.paymentStatus = 'paid' as const;
          user.membershipStatus = 'active' as const;
          
          // Calcola la data di fine abbonamento (1 mese da oggi)
          const endDate = new Date();
          endDate.setMonth(endDate.getMonth() + 1);
          user.subscriptionEndDate = endDate.toISOString().split('T')[0];
          
          // Salva l'utente aggiornato
          DB.saveUser(user);
        }
      }
      
      // Reindirizza alla home dopo il pagamento
      setTimeout(() => {
        alert('Pagamento elaborato con successo!');
        onNavigate('home');
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-navy-900 hover:text-red-600 transition-colors duration-300"
          >
            <ArrowLeft size={24} />
            <span className="font-semibold">Torna alla home</span>
          </button>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Payment Form */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <div className="flex items-center space-x-3 mb-8">
              <CreditCard className="text-red-600" size={32} />
              <h1 className="text-3xl font-bold text-navy-900">Pagamento Sicuro</h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="text-xl font-semibold text-navy-900 mb-4">Informazioni Personali</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Nome</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Cognome</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-navy-700 font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                    required
                  />
                </div>
              </div>

              {/* Payment Information */}
              <div>
                <h3 className="text-xl font-semibold text-navy-900 mb-4">Informazioni di Pagamento</h3>
                <div className="space-y-4">
                  {/* Componente Stripe simulato */}
                  <StripeSimulation.CardElement 
                    className="w-full transition-all duration-300"
                    options={{
                      style: {
                        base: {
                          fontSize: '16px',
                          color: '#424770',
                          '::placeholder': {
                            color: '#aab7c4',
                          },
                        },
                        invalid: {
                          color: '#9e2146',
                        },
                      },
                    }}
                  />
                </div>
              </div>

              {/* Billing Address */}
              <div>
                <h3 className="text-xl font-semibold text-navy-900 mb-4">Indirizzo di Fatturazione</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Indirizzo</label>
                    <input
                      type="text"
                      name="billingAddress"
                      value={formData.billingAddress}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-navy-700 font-medium mb-2">Città</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-navy-700 font-medium mb-2">CAP</label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                <Lock className="text-green-600" size={24} />
                <div>
                  <p className="text-green-800 font-medium">Pagamento Sicuro</p>
                  <p className="text-green-700 text-sm">I tuoi dati sono protetti con crittografia SSL</p>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isProcessing || paymentSuccess}
                className={`w-full font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center space-x-2 ${isProcessing || paymentSuccess ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white transform hover:scale-105 hover:shadow-xl'}`}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    <span>ELABORAZIONE IN CORSO...</span>
                  </>
                ) : paymentSuccess ? (
                  <>
                    <Check size={20} className="text-white" />
                    <span>PAGAMENTO COMPLETATO</span>
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    <span>PAGA ORA</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-navy-900 mb-6">Riepilogo Ordine</h2>
            
            <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-6 mb-6">
              <h3 className="text-xl font-bold text-navy-900 mb-2">{selectedPlan.name}</h3>
              <div className="text-3xl font-bold text-red-600 mb-4">
                {selectedPlan.price}<span className="text-lg text-navy-700">{selectedPlan.period}</span>
              </div>
              
              <div className="space-y-2">
                {selectedPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check size={16} className="text-green-600" />
                    <span className="text-navy-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="flex justify-between items-center mb-4">
                <span className="text-navy-700">Subtotale:</span>
                <span className="font-semibold text-navy-900">{selectedPlan.price}</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-navy-700">IVA (22%):</span>
                <span className="font-semibold text-navy-900">
                  {planType === 'standard' ? '7.70€' : '5.50€'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xl font-bold text-navy-900 border-t border-gray-200 pt-4">
                <span>Totale:</span>
                <span className="text-red-600">
                  {planType === 'standard' ? '42.70€' : '30.50€'}
                </span>
              </div>
            </div>

            <div className="mt-8 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-navy-900 mb-2">Cosa succede dopo?</h4>
              <ul className="text-sm text-navy-700 space-y-1">
                <li>• Riceverai una conferma via email</li>
                <li>• Potrai accedere immediatamente alla palestra</li>
                <li>• Il tuo piano sarà attivo entro 24 ore</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;