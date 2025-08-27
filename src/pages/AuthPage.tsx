import React, { useState, useEffect } from 'react';
import DB from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import Modal from '../components/Modal';

import { authService } from '../services/authService';

interface AuthPageProps {
  onNavigate: (page: string) => void;
  onLogin?: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Auto-login effect con JWT
  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        const user = await authService.autoLogin();
        if (user && onLogin) {
          onLogin(user);
          onNavigate('home');
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
        authService.logout();
      }
    };
    
    checkAutoLogin();
  }, [onLogin, onNavigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    // Email validation
    if (!DB.validateEmail(formData.email)) {
      newErrors.email = 'Email obbligatoria e valida';
    }
    
    // Password validation
    if (!DB.validatePassword(formData.password)) {
      newErrors.password = 'Password obbligatoria (minimo 6 caratteri)';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Check IP session
    DB.clearSessionOnIPChange();
    
    const handleAuthOperation = async () => {
      // Login sicuro con JWT
      try {
        const result = await authService.login(formData.email, formData.password);
        
        // Verifica che sia un account admin
        if (result.user.role !== 'admin') {
          setIsSubmitting(false);
          showModal('Accesso negato: privilegi di amministratore richiesti');
          return;
        }
        
        if (onLogin) {
          onLogin(result.user);
        }
        
        setIsSubmitting(false);
        showModal('Login admin effettuato con successo!', false);
        
        setTimeout(() => {
          onNavigate('home');
        }, 2000);
        
      } catch (error) {
        setIsSubmitting(false);
        const errorMessage = error instanceof Error ? error.message : 'Email o password non corretti';
        showModal(errorMessage);
      }
    };
    
    // Esegui l'operazione di autenticazione con un piccolo delay
    setTimeout(() => {
      handleAuthOperation();
    }, 1500);
  };



  const showModal = (message: string, isError: boolean = true) => {
    setModalMessage(message);
    if (isError) {
      setShowErrorModal(true);
    } else {
      setShowSuccessModal(true);
    }
  };



  // Check IP session on component mount
  useEffect(() => {
    DB.clearSessionOnIPChange();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-red-600 flex items-center justify-center py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-white hover:text-red-300 transition-colors duration-300"
          >
            <ArrowLeft size={24} />
            <span className="font-semibold">Torna alla home</span>
          </button>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
            {/* Logo */}
            <div className="text-center mb-8">
              <img 
                src="/images/logo.png" 
                alt="KW8 Logo" 
                className="h-16 w-auto mx-auto mb-4"
              />
              <h1 className="text-3xl font-bold text-navy-900 mb-2">
                Accesso Admin
              </h1>
              <p className="text-navy-700">
                Area riservata agli amministratori
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Email Field */}
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Inserisci la tua email"
                      required
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ${
                        errors.password ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Inserisci la tua password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white transform hover:scale-105 hover:shadow-xl'}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>ACCESSO IN CORSO...</span>
                    </>
                  ) : (
                    <span>ACCEDI</span>
                  )}
                </button>
              </form>
          </div>
        </div>
      </div>
      
      {/* Login Only - Terms and Privacy modals removed */}
      
      {/* Error Modal */}
      <Modal 
        isOpen={showErrorModal} 
        onClose={() => setShowErrorModal(false)} 
        title="Errore"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="text-gray-700">{modalMessage}</p>
        </div>
      </Modal>
      
      {/* Success Modal */}
      <Modal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
        title="Successo"
      >
        <div className="text-center py-4">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-gray-700">{modalMessage}</p>
        </div>
      </Modal>
    </div>
  );
};

export default AuthPage;