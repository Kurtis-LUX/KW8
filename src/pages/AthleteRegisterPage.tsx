import React, { useState } from 'react';
import { ChevronLeft, CheckCircle } from 'lucide-react';
import { auth } from '../config/firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import firestoreService from '../services/firestoreService';
import { authService } from '../services/authService';
import zxcvbn from 'zxcvbn'

interface AthleteRegisterPageProps {
  onAuthSuccess?: () => void;
  onNavigateHome?: () => void;
  onNavigateLogin?: () => void;
}

const AthleteRegisterPage: React.FC<AthleteRegisterPageProps> = ({ onAuthSuccess, onNavigateHome, onNavigateLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [passwordScore, setPasswordScore] = useState<number>(0)
  const [passwordFeedback, setPasswordFeedback] = useState<string[]>([])

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

  const criteria = {
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

  const handleRegister = async () => {
    clearMessages();
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await firestoreService.createUser({
        name: `${firstName.trim()} ${lastName.trim()}`.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: 'athlete',
        certificatoMedicoStato: 'non_presente',
        notes: ''
      });
      try { await sendEmailVerification(userCredential.user) } catch {}

      setSuccess('Registrazione completata! Ti abbiamo inviato una email di verifica. Effettuo il login...');
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">Registrazione Atleti</h2>
          <p className="text-gray-600 text-sm">Crea un nuovo account atleta con i tuoi dati</p>
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

        {/* Form registrazione */}
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
            <div className="mt-2 space-y-2">
              <p className="text-xs text-gray-600">La password deve includere:</p>
              <ul className="grid grid-cols-1 gap-1 text-xs">
                <li className={criteria.length ? 'text-green-700' : 'text-gray-600'}>• Almeno 8 caratteri</li>
                <li className={criteria.upper ? 'text-green-700' : 'text-gray-600'}>• Una lettera maiuscola</li>
                <li className={criteria.lower ? 'text-green-700' : 'text-gray-600'}>• Una lettera minuscola</li>
                <li className={criteria.number ? 'text-green-700' : 'text-gray-600'}>• Un numero</li>
                <li className={criteria.symbol ? 'text-green-700' : 'text-gray-600'}>• Un simbolo</li>
              </ul>
              <div className="mt-2">
                <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-2 transition-all duration-300 ${
                      passwordScore === 0 ? 'bg-red-500 w-1/5' :
                      passwordScore === 1 ? 'bg-orange-500 w-2/5' :
                      passwordScore === 2 ? 'bg-yellow-500 w-3/5' :
                      passwordScore === 3 ? 'bg-green-500 w-4/5' :
                      passwordScore >= 4 ? 'bg-green-700 w-full' : 'w-0'
                    }`}
                  />
                </div>
                <p className={`mt-1 text-xs ${levelColor}`} aria-live="polite">Livello password: {levelLabel}</p>
              </div>
            </div>
            {passwordErrors.length > 0 && password.length > 0 && (
              <div className="mt-2 text-sm text-red-700 bg-red-50/70 ring-1 ring-red-200 rounded-xl px-3 py-2">
                Requisiti mancanti: {passwordErrors.join(', ')}
              </div>
            )}
          </div>
          <div>
            <label className="block text sm font-medium text-gray-700">Conferma password</label>
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
              className="flex-1 px-4 py-2 bg-navy-800 text-white rounded-2xl hover:bg-navy-700 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Attendere...' : 'Completa registrazione'}
            </button>
            <button
              type="button"
              onClick={() => onNavigateLogin && onNavigateLogin()}
              className="flex-1 px-4 py-2 bg-white ring-1 ring-black/10 text-navy-900 rounded-2xl hover:bg-gray-50"
            >
              Torna al login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AthleteRegisterPage;