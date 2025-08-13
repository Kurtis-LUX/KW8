import React, { useState, useEffect } from 'react';
import DB, { User } from '../utils/database';
import { v4 as uuidv4 } from 'uuid';
import { ArrowLeft, User as UserIcon, Mail, Lock, Eye, EyeOff, Calendar, MapPin, CreditCard, FileText } from 'lucide-react';
import Modal from '../components/Modal';
import { googleAuthService, GoogleUser } from '../services/googleAuth';

interface AuthPageProps {
  onNavigate: (page: string) => void;
  onLogin?: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onNavigate, onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    confirmPassword: '',
    birthDate: '',
    gender: '',
    fiscalCode: '',
    birthPlace: '',
    address: '',
    notes: ''
  });
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');

  // Auto-login effect
  useEffect(() => {
    const autoLoginData = DB.getAutoLogin();
    if (autoLoginData && onLogin) {
      const result = DB.verifyCredentials(autoLoginData.email, autoLoginData.password);
      if (result.success && result.user) {
        onLogin(result.user);
        onNavigate('home');
      } else {
        DB.clearAutoLogin();
      }
    }
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
    
    // Email validation (obbligatoria per login e registrazione)
    if (!DB.validateEmail(formData.email)) {
      newErrors.email = 'Email obbligatoria e valida';
    }
    
    // Password validation (obbligatoria per login e registrazione)
    if (!DB.validatePassword(formData.password)) {
      newErrors.password = 'Password obbligatoria (minimo 6 caratteri)';
    }
    
    if (!isLogin) {
      // Registration validation using database function
      const validation = DB.validateRegistrationFields(formData);
      Object.assign(newErrors, validation.errors);
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
    
    setTimeout(() => {
      if (isLogin) {
        // Login
        if (isAdmin) {
          // Verifica credenziali admin usando email
          const result = DB.verifyCredentials(formData.email, formData.password);
          
          if (result.success && result.user && result.user.role === 'admin') {
            // Set IP for session management and auto-login
            DB.setAutoLogin(formData.email, formData.password);
            
            if (onLogin) {
              onLogin(result.user);
            }
            setIsSubmitting(false);
            showModal('Login admin effettuato con successo!', false);
            setTimeout(() => {
              onNavigate('home');
            }, 2000);
          } else {
            setIsSubmitting(false);
            showModal('Email o password non corretti');
          }
        } else {
          // Login atleta
          const result = DB.verifyCredentials(formData.email, formData.password);
          
          if (result.success) {
            if (result.user && result.user.role === 'atleta') {
              // Set IP for session management and auto-login
              DB.setAutoLogin(formData.email, formData.password);
              
              if (onLogin) {
                onLogin(result.user);
              }
              setIsSubmitting(false);
              showModal('Login effettuato con successo!', false);
              setTimeout(() => {
                onNavigate('home');
              }, 2000);
            } else {
              setIsSubmitting(false);
              showModal('Questo account non è un account atleta.');
            }
          } else {
            setIsSubmitting(false);
            showModal('Email o password non corretti.');
          }
        }
      } else {
        // Registrazione (solo per atleti)
        const existingUser = DB.getUserByEmail(formData.email);
        if (existingUser) {
          setIsSubmitting(false);
          showModal('Email già registrata. Prova ad accedere.');
          return;
        }
        
        // Crea nuovo utente atleta
        const newUser: User = {
          id: uuidv4(),
          email: formData.email,
          name: `${formData.firstName} ${formData.lastName}`,
          password: formData.password,
          role: 'atleta',
          workoutPlans: [],
          birthDate: formData.birthDate,
          gender: formData.gender as 'M' | 'F',
          fiscalCode: formData.fiscalCode,
          birthPlace: formData.birthPlace,
          address: formData.address,
          notes: formData.notes || undefined,
          ipAddress: DB.getCurrentIP()
        };
        
        DB.saveUser(newUser);
        DB.setUserIP(DB.getCurrentIP());
        
        if (onLogin) {
          onLogin(newUser);
        }
        
        setIsSubmitting(false);
        showModal('Registrazione completata con successo!', false);
        setTimeout(() => {
          onNavigate('home');
        }, 2000);
      }
    }, 1500);
  };

  const handleForgotPassword = () => {
    if (!DB.validateEmail(resetEmail)) {
      showModal('Inserisci un indirizzo email valido');
      return;
    }
    
    const success = DB.requestPasswordReset(resetEmail);
    if (success) {
      showModal('Se l\'email è presente nel database, riceverai le istruzioni per il reset della password.', false);
      setShowForgotPassword(false);
      setResetEmail('');
    } else {
      showModal('Email non trovata nel database.');
    }
  };

  const showModal = (message: string, isError: boolean = true) => {
    setModalMessage(message);
    if (isError) {
      setShowErrorModal(true);
    } else {
      setShowSuccessModal(true);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const googleUser = await googleAuthService.signInWithGoogle();
      if (googleUser) {
        // Verifica se l'utente esiste già
        let existingUser = DB.getUserByEmail(googleUser.email);
        
        if (existingUser) {
          // Utente esistente, effettua il login
          if (onLogin) {
            onLogin(existingUser);
          }
          showModal('Login effettuato con successo!', false);
          setTimeout(() => {
            onNavigate('home');
          }, 2000);
        } else {
          // Nuovo utente, crea account
          const newUser: User = {
            id: googleUser.id,
            email: googleUser.email,
            name: googleUser.name,
            password: '', // Password vuota per utenti Google
            role: 'atleta',
            workoutPlans: [],
            birthDate: '',
            gender: 'M',
            fiscalCode: '',
            birthPlace: '',
            address: '',
            ipAddress: DB.getCurrentIP(),
            googleId: googleUser.id
          };
          
          DB.saveUser(newUser);
          if (onLogin) {
            onLogin(newUser);
          }
          showModal('Account creato e login effettuato con successo!', false);
          setTimeout(() => {
            onNavigate('home');
          }, 2000);
        }
      }
    } catch (error) {
      showModal('Errore durante l\'autenticazione Google');
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      confirmPassword: '',
      birthDate: '',
      gender: '',
      fiscalCode: '',
      birthPlace: '',
      address: '',
      notes: ''
    });
    setErrors({});
    setShowForgotPassword(false);
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
                {isLogin ? 'Accedi' : 'Registrati'}
              </h1>
              <p className="text-navy-700">
                {isLogin ? 'Bentornato in KW8!' : 'Unisciti alla famiglia KW8!'}
              </p>
              
              {/* Tipo di account */}
              {isLogin && (
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    type="button"
                    onClick={() => setIsAdmin(false)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${!isAdmin ? 'bg-navy-900 text-white' : 'bg-gray-200 text-navy-900'}`}
                  >
                    Atleta
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAdmin(true)}
                    className={`px-4 py-2 rounded-lg transition-all duration-300 ${isAdmin ? 'bg-red-600 text-white' : 'bg-gray-200 text-navy-900'}`}
                  >
                    Admin
                  </button>
                </div>
              )}
            </div>

            {showForgotPassword ? (
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-navy-900 text-center">Recupera Password</h3>
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                      placeholder="Inserisci la tua email"
                      required
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Invia Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setResetEmail('');
                    }}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 px-6 rounded-lg transition-all duration-300"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Registration Fields */}
                {!isLogin && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-navy-700 font-medium mb-2">Nome *</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ${
                              errors.firstName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                          />
                        </div>
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-navy-700 font-medium mb-2">Cognome *</label>
                        <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ${
                              errors.lastName ? 'border-red-500' : 'border-gray-300'
                            }`}
                            required
                          />
                        </div>
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-navy-700 font-medium mb-2">Data di Nascita *</label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                          <input
                            type="date"
                            name="birthDate"
                            value={formData.birthDate}
                            onChange={handleInputChange}
                            max={new Date().toISOString().split('T')[0]}
                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 appearance-none cursor-pointer ${
                              errors.birthDate ? 'border-red-500' : 'border-gray-300'
                            }`}
                            style={{
                              colorScheme: 'light',
                              fontSize: '16px'
                            }}
                            required
                          />
                        </div>
                        {errors.birthDate && <p className="text-red-500 text-sm mt-1">{errors.birthDate}</p>}
                      </div>
                      <div>
                        <label className="block text-navy-700 font-medium mb-2">Sesso *</label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={(e) => setFormData(prev => ({...prev, gender: e.target.value}))}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ${
                            errors.gender ? 'border-red-500' : 'border-gray-300'
                          }`}
                          required
                        >
                          <option value="">Seleziona</option>
                          <option value="M">Maschio</option>
                          <option value="F">Femmina</option>
                        </select>
                        {errors.gender && <p className="text-red-500 text-sm mt-1">{errors.gender}</p>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-navy-700 font-medium mb-2">Codice Fiscale *</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="fiscalCode"
                          value={formData.fiscalCode}
                          onChange={(e) => setFormData(prev => ({...prev, fiscalCode: e.target.value.toUpperCase()}))}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ${
                            errors.fiscalCode ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Codice Fiscale (16 caratteri)"
                          maxLength={16}
                          required
                        />
                      </div>
                      {errors.fiscalCode && <p className="text-red-500 text-sm mt-1">{errors.fiscalCode}</p>}
                    </div>

                    <div>
                      <label className="block text-navy-700 font-medium mb-2">Luogo di Nascita *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="birthPlace"
                          value={formData.birthPlace}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ${
                            errors.birthPlace ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Luogo di Nascita (es. Roma (RM))"
                          required
                        />
                      </div>
                      {errors.birthPlace && <p className="text-red-500 text-sm mt-1">{errors.birthPlace}</p>}
                    </div>

                    <div>
                      <label className="block text-navy-700 font-medium mb-2">Indirizzo di Residenza *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ${
                            errors.address ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Indirizzo (es. Via Roma 123, 00100 Roma (RM))"
                          required
                        />
                      </div>
                      {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
                    </div>

                  </>
                )}

                {/* Email */}
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="email@esempio.com"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ${
                        errors.email ? 'border-red-500' : 'border-gray-300'
                      }`}
                      required
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                </div>

              {/* Password */}
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
                      required
                    />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-300"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              </div>

                {/* Confirm Password (Registration only) */}
                {!isLogin && (
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Conferma Password *</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 ${
                          errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                  </div>
                )}

                {/* Notes (Registration only) */}
                {!isLogin && (
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Note (facoltativo)</label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-gray-400" size={20} />
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300 resize-none"
                        placeholder="Segnala eventuali problemi fisici o richieste particolari..."
                        rows={3}
                      />
                    </div>
                  </div>
                )}

                {/* Forgot Password (Login only) */}
                {isLogin && !isAdmin && (
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium transition-colors duration-300"
                    >
                      Password dimenticata?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className={`w-full font-bold py-4 px-8 rounded-lg transition-all duration-300 shadow-lg flex items-center justify-center ${isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-white transform hover:scale-105 hover:shadow-xl'}`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      <span>{isLogin ? 'ACCESSO IN CORSO...' : 'REGISTRAZIONE IN CORSO...'}</span>
                    </>
                  ) : (
                    <span>{isLogin ? 'ACCEDI' : 'REGISTRATI'}</span>
                  )}
                </button>

                {/* Terms (Registration only) */}
                {!isLogin && (
                  <p className="text-xs text-gray-600 text-center">
                    Registrandoti accetti i nostri{' '}
                    <button 
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-red-600 hover:text-red-700 font-medium underline"
                    >
                      Termini e Condizioni
                    </button>{' '}
                    e la{' '}
                    <button 
                      type="button"
                      onClick={() => setShowPrivacyModal(true)}
                      className="text-red-600 hover:text-red-700 font-medium underline"
                    >
                      Privacy Policy
                    </button>
                  </p>
                )}
              </form>
            )}

            {/* Toggle Auth Mode */}
            <div className="mt-8 text-center">
              <p className="text-navy-700">
                {isLogin ? 'Non hai un account?' : 'Hai già un account?'}
              </p>
              <button
                onClick={toggleAuthMode}
                className="text-red-600 hover:text-red-700 font-semibold transition-colors duration-300 mt-2"
              >
                {isLogin ? 'Registrati ora' : 'Accedi'}
              </button>
            </div>

            {/* Social Login */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">oppure</span>
                </div>
              </div>

              <div className="mt-6">
                <button 
                  onClick={handleGoogleLogin}
                  className="w-full inline-flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  <span>Continua con Google</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Terms Modal */}
      <Modal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        title="Termini e Condizioni"
      >
        <div className="prose max-w-none">
          <h3 className="text-xl font-bold text-navy-700 mb-4">1. Accettazione dei Termini</h3>
          <p className="mb-6 text-gray-700 leading-relaxed">
            Utilizzando i servizi della Palestra KW8, accetti di essere vincolato da questi termini e condizioni.
          </p>
          
          <h3 className="text-xl font-bold text-navy-700 mb-4">2. Servizi Offerti</h3>
          <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
            <li>Accesso alle attrezzature della palestra</li>
            <li>Lezioni di gruppo (CrossFit, Yoga, Karate)</li>
            <li>Consulenza nutrizionale</li>
            <li>Programmi di allenamento personalizzati</li>
          </ul>
          
          <h3 className="text-xl font-bold text-navy-700 mb-4">3. Responsabilità dell'Utente</h3>
          <p className="mb-4 text-gray-700 leading-relaxed">
            L'utente si impegna a utilizzare le attrezzature in modo appropriato e a rispettare le regole della struttura.
          </p>
        </div>
      </Modal>
      
      {/* Privacy Modal */}
      <Modal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)} 
        title="Privacy Policy"
      >
        <div className="prose max-w-none">
          <h3 className="text-xl font-bold text-navy-700 mb-4">1. Informazioni Generali</h3>
          <p className="mb-6 text-gray-700 leading-relaxed">
            La presente Privacy Policy descrive come la Palestra KW8 raccoglie, utilizza e protegge le informazioni personali.
          </p>
          
          <h3 className="text-xl font-bold text-navy-700 mb-4">2. Dati Raccolti</h3>
          <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
            <li>Dati anagrafici: nome, cognome, data di nascita</li>
            <li>Dati di contatto: email, telefono, indirizzo</li>
            <li>Dati identificativi: codice fiscale</li>
            <li>Dati sulla salute: informazioni mediche rilevanti</li>
          </ul>
          
          <h3 className="text-xl font-bold text-navy-700 mb-4">3. Finalità del Trattamento</h3>
          <p className="mb-4 text-gray-700 leading-relaxed">
            I dati sono utilizzati per la gestione dell'iscrizione, erogazione dei servizi e comunicazioni.
          </p>
        </div>
      </Modal>
      
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