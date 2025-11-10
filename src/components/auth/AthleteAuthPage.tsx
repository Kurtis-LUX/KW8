import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { apiService } from '../../services/api';
import { envConfig, debugEnvConfig } from '../../config/envConfig';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { auth } from '../../config/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import firestoreService from '../../services/firestoreService';
import zxcvbn from 'zxcvbn'

interface AthleteAuthPageProps {
  onAuthSuccess?: () => void;
  onNavigateHome?: () => void;
  onNavigateRegister?: () => void;
}

interface GoogleSignupResponse {
  success: boolean;
  data?: {
    token: string;
    user: {
      email: string;
      role?: string;
    };
  };
  message?: string;
  error?: string;
}

const AthleteAuthPage: React.FC<AthleteAuthPageProps> = ({ onAuthSuccess, onNavigateHome, onNavigateRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Stato per email non registrata e sezione registrazione
  const [notRegistered, setNotRegistered] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  // Nuovi campi registrazione
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordScore, setPasswordScore] = useState<number>(0)
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([])
  const [regPasswordErrors, setRegPasswordErrors] = useState<string[]>([])
  const [regPasswordScore, setRegPasswordScore] = useState<number>(0)
  const [regPasswordFeedback, setRegPasswordFeedback] = useState<string[]>([])

  // Stati 'touched' per mostrare feedback alla fine dell'inserimento
  const [firstNameTouched, setFirstNameTouched] = useState(false)
  const [lastNameTouched, setLastNameTouched] = useState(false)
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [passwordTouched, setPasswordTouched] = useState(false)
  const [confirmTouched, setConfirmTouched] = useState(false)

  // Validazione email
  const validateEmail = (val: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(val)


  const clearMessages = () => {
    setError('');
    setSuccess('');
    setNotRegistered(false);
    setPasswordErrors([]);
  };

  const validatePassword = (pwd: string): string[] => {
    const errors: string[] = [];
    if (pwd.length < 8) errors.push('Almeno 8 caratteri');
    if (!/[A-Z]/.test(pwd)) errors.push('Una lettera maiuscola');
    if (!/[a-z]/.test(pwd)) errors.push('Una lettera minuscola');
    if (!/[0-9]/.test(pwd)) errors.push('Un numero');
    if (!/[!@#$%^&*(),.?":{}|<>_\-]/.test(pwd)) errors.push('Un simbolo');
    return errors;
  };

  const validatePhone = (val: string): boolean => {
    const clean = val.replace(/\s+/g, '');
    return /^\+?[0-9]{7,15}$/.test(clean);
  };

  // Helpers validità campi
  const firstNameValid = firstName.trim().length > 0
  const lastNameValid = lastName.trim().length > 0
  const emailValid = validateEmail(email)
  const phoneValid = !phone || validatePhone(phone)
  const passwordValid = validatePassword(password).length === 0
  const confirmValid = confirmPassword.length > 0 && confirmPassword === password

  // Classi dinamiche per bordo e focus ring
  const fieldClasses = (valid: boolean, touched: boolean) =>
    touched ? (valid ? 'border-green-500 focus:ring-green-500' : 'border-red-500 focus:ring-red-500') : 'border-gray-300 focus:ring-navy-800'

  // Disabilita il pulsante registrazione finché i criteri non sono rispettati
  const isRegisterDisabled = (
    loading ||
    !firstName.trim() ||
    !lastName.trim() ||
    !email.trim() ||
    !password ||
    confirmPassword !== password ||
    validatePassword(password).length > 0 ||
    (phone && !validatePhone(phone))
  );

  const regCriteria = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: /[!@#$%^&*(),.?":{}|<>_\-]/.test(password)
  }
  const scoreLabels = ['Molto debole', 'Debole', 'Medio', 'Forte', 'Molto forte']
  const scoreColors = ['text-red-600', 'text-orange-600', 'text-yellow-600', 'text-green-600', 'text-green-700']
  const levelLabel = scoreLabels[Math.min(4, Math.max(0, passwordScore))]
  const levelColor = scoreColors[Math.min(4, Math.max(0, passwordScore))]

  // Inizializzazione Google Identity Services
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      // Debug configurazione ambiente
      debugEnvConfig();

      const clientId = envConfig.googleClientId;
      console.log('🔍 Client ID da envConfig:', clientId);

      if (!clientId) {
        console.error('❌ Google Client ID non configurato!');
        const errorMsg = envConfig.isDevelopment
          ? 'Configurazione Google OAuth mancante. Configura VITE_GOOGLE_CLIENT_ID in .env.local'
          : 'Configurazione Google OAuth mancante. Verifica le variabili d\'ambiente su Firebase.';
        setError(errorMsg);
        return;
      }

      if (window.google) {
        // Pulisci eventuali inizializzazioni precedenti
        try {
          window.google.accounts.id.cancel();
          window.google.accounts.id.disableAutoSelect();
          window.google.accounts.id.revoke('', () => {
            console.log('🔄 Sessione Google revocata');
          });
        } catch (e) {
          console.log('🔄 Nessuna sessione da revocare');
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSignup,
          auto_select: false,
          cancel_on_tap_outside: true,
          prompt: 'select_account',
          ux_mode: 'popup',
          use_fedcm_for_prompt: false,
          itp_support: true,
          context: 'signup',
          state_cookie_domain: window.location.hostname,
        });

        const buttonElement = document.getElementById('google-signin-button');
        if (buttonElement) {
          buttonElement.innerHTML = '';
          window.google.accounts.id.renderButton(buttonElement, {
            theme: 'outline',
            size: 'large',
            text: 'signup_with',
            locale: 'it',
            type: 'standard',
          });
        }
      }
    };

    const cleanup = () => {
      if (window.google) {
        try {
          window.google.accounts.id.cancel();
        } catch {}
      }
    };

    // Carica lo script se necessario
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }

    return cleanup;
  }, []);

  const handleGoogleSignup = async (response: any) => {
    setLoading(true);
    clearMessages();
    try {
      if (!response || !response.credential) {
        throw new Error('Risposta Google non valida');
      }
      if (typeof response.credential !== 'string' || response.credential.length < 100 || response.credential.length > 2048) {
        throw new Error('Formato credential non valido');
      }

      const result = await authService.googleSignup(response.credential);
      if (result.success && result.data) {
        const sanitizedMessage = 'Registrazione completata con Google!';
        setSuccess(sanitizedMessage);
        setTimeout(() => {
          onAuthSuccess && onAuthSuccess();
        }, 800);
      } else {
        const msg = result.message || 'Registrazione non autorizzata';
        const sanitizedError = msg.replace(/<[^>]*>/g, '').substring(0, 200);
        setError(sanitizedError);
      }
    } catch (err: any) {
      const sanitizedError = (err.message || 'Errore durante la registrazione').replace(/<[^>]*>/g, '').substring(0, 200);
      setError(sanitizedError);
      if (import.meta.env.DEV) {
        console.error('Errore registrazione Google:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    clearMessages();
    if (!email || !password) {
      setError('Inserisci email e password');
      return;
    }
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      const role = data?.user?.role || 'user';
      if (['athlete', 'user'].includes(role)) {
        setSuccess('Login effettuato!');
        setTimeout(() => {
          onAuthSuccess && onAuthSuccess();
        }, 600);
      } else {
        setError('Accesso riservato agli atleti');
      }
    } catch (err: any) {
      const code = (err && err.code) ? String(err.code) : '';
      const msg = (err && err.message) ? String(err.message) : '';
      const lowerMsg = msg.toLowerCase();
      if (code === 'auth/user-not-found' || lowerMsg.includes('user-not-found') || lowerMsg.includes('no user') || lowerMsg.includes('non trovato')) {
        // Email non registrata: mostra messaggio sotto il campo e apri sezione registrazione
        setNotRegistered(true);
        setShowRegistration(true);
        setError('');
      } else {
        const sanitizedError = (msg || 'Login fallito').replace(/<[^>]*>/g, '').substring(0, 200);
        setError(sanitizedError);
        setNotRegistered(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    clearMessages();
    // Validazione campi
    if (!firstName.trim() || !lastName.trim()) {
      setError('Inserisci Nome e Cognome');
      return;
    }
    if (!email || !password) {
      setError('Inserisci email e password per registrarti');
      return;
    }
    if (phone && !validatePhone(phone)) {
      setError('Inserisci un numero di telefono valido');
      return;
    }
    const pwdErrors = validatePassword(password);
    setPasswordErrors(pwdErrors);
    if (pwdErrors.length > 0) {
      setError('La password non rispetta i criteri minimi');
      return;
    }
    if (confirmPassword !== password) {
      setError('Le password non coincidono');
      return;
    }

    setLoading(true);
    try {
      // Registra l'utente atleta su Firebase Auth
      await createUserWithEmailAndPassword(auth, email, password);
      // Crea il documento utente in Firestore con ruolo atleta
      await firestoreService.createUser({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: 'athlete',
        certificatoMedicoStato: 'non_presente',
        notes: ''
      });

      setSuccess('Registrazione completata! Effettuo il login...');
      // Esegui il login per ottenere il JWT applicativo e impostare il ruolo
      await authService.login(email, password);
      setTimeout(() => {
        onAuthSuccess && onAuthSuccess();
      }, 600);
    } catch (err: any) {
      const sanitizedError = (err.message || 'Registrazione non riuscita').replace(/<[^>]*>/g, '').substring(0, 200);
      setError(sanitizedError);
    } finally {
      setLoading(false);
    }
  };

  // Apri la sezione di registrazione
  const openRegistrationSection = () => {
    setShowRegistration(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ff3b30] via-[#3b264a] to-[#0a1535] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[65vw] h-[65vw] bg-[radial-gradient(ellipse_at_center,_rgba(255,59,48,0.35),_transparent_60%)] blur-[100px]"></div>
        <div className="absolute -bottom-40 -right-40 w-[65vw] h-[65vw] bg-[radial-gradient(ellipse_at_center,_rgba(10,21,53,0.35),_transparent_60%)] blur-[100px]"></div>
      </div>

      {/* Pulsante Torna alla home */}
      <button
        onClick={() => onNavigateHome && onNavigateHome()}
        className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full px-3 py-2 bg-[#0a1535]/40 hover:bg-[#0a1535]/60 backdrop-blur-sm ring-1 ring-white/10 text-white transition-colors"
        title="Torna alla home"
        aria-label="Torna alla home"
      >
        <ChevronLeft size={24} />
        <span className="text-sm font-medium">Indietro</span>
      </button>

      <div className="bg-white rounded-3xl ring-1 ring-black/10 shadow-lg w-full max-w-md p-7 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/images/logo.png" alt="KW8 Logo" className="h-16 w-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">Accesso Atleti</h2>
          <p className="text-gray-600 text-sm">Accedi con il tuo account o registrati con Google</p>
        </div>

        {/* Messaggi */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm ring-1 ring-red-200 text-red-800 px-4 py-3 rounded-2xl mb-4 shadow-sm">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}
        {success && (
          <div className="bg-white/85 backdrop-blur-sm ring-1 ring-black/10 text-navy-900 px-4 py-3 rounded-2xl mb-4 shadow-sm">
            <div className="flex items-center">
              <CheckCircle size={18} className="mr-2 text-green-600" />
              <span className="text-sm font-medium tracking-tight">{success}</span>
            </div>
          </div>
        )}

        {/* Google Sign-In */}
        <div className="space-y-4">
          <div className="w-full flex justify-center items-center min-h-[60px]">
            <div id="google-signin-button" className="flex justify-center items-center"></div>
          </div>

          {/* Apple Sign-In (placeholder sicuro) */}
          <button
            type="button"
            disabled
            className="w-full px-4 py-2 rounded-2xl bg-gray-100 text-gray-500 ring-1 ring-black/10 cursor-not-allowed"
            title="Prossimamente"
          >
            Accedi con Apple (presto)
          </button>

          {/* Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-sm text-gray-500">oppure</span>
            </div>
          </div>

          {/* Email/Password */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy-800"
                placeholder="esempio@dominio.com"
                autoComplete="email"
              />
              {notRegistered && (
                <div className="mt-2 text-sm text-red-700 bg-red-50/70 ring-1 ring-red-200 rounded-xl px-3 py-2">
                  Nessun account associato a questa email.
                  <button type="button" onClick={() => (onNavigateRegister ? onNavigateRegister() : openRegistrationSection())} className="ml-1 underline text-red-800 hover:text-red-900">
                    Registrati ora
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-navy-800"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleEmailLogin}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-navy-800 text-white rounded-2xl hover:bg-navy-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Attendere...' : 'Accedi'}
              </button>
              <button
                type="button"
                onClick={() => (onNavigateRegister ? onNavigateRegister() : openRegistrationSection())}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-white ring-1 ring-black/10 text-navy-900 rounded-2xl hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Registrati
              </button>
            </div>
          </div>
        </div>

        {/* Sezione registrazione */}
        {showRegistration && (
          <div className="mt-6 p-4 bg-white/90 ring-1 ring-black/10 rounded-2xl shadow-sm">
            <h3 className="text-lg font-semibold text-navy-900 mb-2">Registrazione Atleti</h3>
            <p className="text-sm text-gray-600 mb-3">Crea un nuovo account atleta usando i dati richiesti.</p>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nome</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    onBlur={() => setFirstNameTouched(true)}
                    className={`w-full rounded-2xl border px-3 py-2 focus:outline-none focus:ring-2 ${fieldClasses(firstNameValid, firstNameTouched)}`}
                    placeholder="Mario"
                    autoComplete="given-name"
                  />
                  {firstNameTouched && !firstNameValid && <p className="mt-1 text-xs text-red-600">Inserisci il nome.</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Cognome</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    onBlur={() => setLastNameTouched(true)}
                    className={`w-full rounded-2xl border px-3 py-2 focus:outline-none focus:ring-2 ${fieldClasses(lastNameValid, lastNameTouched)}`}
                    placeholder="Rossi"
                    autoComplete="family-name"
                  />
                  {lastNameTouched && !lastNameValid && <p className="mt-1 text-xs text-red-600">Inserisci il cognome.</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Numero di telefono</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onBlur={() => setPhoneTouched(true)}
                  className={`w-full rounded-2xl border px-3 py-2 focus:outline-none focus:ring-2 ${fieldClasses(phoneValid, phoneTouched)}`}
                  placeholder="+39 333 1234567"
                  autoComplete="tel"
                />
                {phoneTouched && phone && !validatePhone(phone) && (
                  <p className="mt-1 text-xs text-red-600">Numero di telefono non valido.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  className={`w-full rounded-2xl border px-3 py-2 focus:outline-none focus:ring-2 ${fieldClasses(emailValid, emailTouched)}`}
                  placeholder="nome@esempio.com"
                  autoComplete="email"
                />
                {emailTouched && !emailValid && <p className="mt-1 text-xs text-red-600">Inserisci un'email valida.</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value
                    setPassword(val)
                    setPasswordErrors(validatePassword(val))
                    const res = zxcvbn(val)
                    setPasswordScore(res.score)
                    const feedback = [...(res.feedback?.suggestions || []), res.feedback?.warning || ''].filter(Boolean)
                    setPasswordFeedback(feedback as string[])
                  }}
                  onBlur={() => setPasswordTouched(true)}
                  className={`w-full rounded-2xl border px-3 py-2 focus:outline-none focus:ring-2 ${fieldClasses(passwordValid, passwordTouched)}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {passwordTouched && !passwordValid && (
                  <p className="mt-1 text-xs text-red-600">La password non soddisfa i requisiti.</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Conferma password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={() => setConfirmTouched(true)}
                  className={`w-full rounded-2xl border px-3 py-2 focus:outline-none focus:ring-2 ${fieldClasses(confirmValid, confirmTouched)}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                {confirmTouched && !confirmValid && (
                  <p className="mt-1 text-xs text-red-600">Le password non coincidono.</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={isRegisterDisabled}
                  className="px-4 py-2 bg-navy-800 text-white rounded-2xl hover:bg-navy-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? 'Attendere...' : 'Completa registrazione'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegistration(false)}
                  className="px-4 py-2 bg-white ring-1 ring-black/10 text-navy-900 rounded-2xl hover:bg-gray-50"
                >
                  Annulla
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx>{`
          #google-signin-button {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            text-align: center !important;
          }
          #google-signin-button > div {
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            margin: 0 auto !important;
            text-align: center !important;
          }
          #google-signin-button iframe {
            margin: 0 auto !important;
            display: block !important;
          }
        `}</style>
      </div>
    </div>
  );
};

export default AthleteAuthPage;