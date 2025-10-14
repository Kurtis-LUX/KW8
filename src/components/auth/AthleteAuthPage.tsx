import React, { useEffect, useState } from 'react';
import { authService } from '../../services/authService';
import { apiService } from '../../services/api';
import { envConfig, debugEnvConfig } from '../../config/envConfig';
import { ChevronLeft, CheckCircle } from 'lucide-react';

interface AthleteAuthPageProps {
  onAuthSuccess?: () => void;
  onNavigateHome?: () => void;
}

// Dichiarazione globale per Google Identity Services
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
          cancel: () => void;
          disableAutoSelect: () => void;
          revoke: (hint: string, callback: () => void) => void;
        };
      };
    };
  }
}

const AthleteAuthPage: React.FC<AthleteAuthPageProps> = ({ onAuthSuccess, onNavigateHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

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
      const sanitizedError = (err.message || 'Login fallito').replace(/<[^>]*>/g, '').substring(0, 200);
      setError(sanitizedError);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    clearMessages();
    if (!email || !password) {
      setError('Inserisci email e password per registrarti');
      return;
    }
    setLoading(true);
    try {
      const payload = { email, password, role: 'athlete' };
      const res = await apiService.register(payload);
      if (res.success) {
        setSuccess('Registrazione completata! Ora effettua il login.');
      } else {
        const sanitizedError = (res.error || 'Registrazione non riuscita').replace(/<[^>]*>/g, '').substring(0, 200);
        setError(sanitizedError);
      }
    } catch (err: any) {
      const sanitizedError = (err.message || 'Errore di registrazione').replace(/<[^>]*>/g, '').substring(0, 200);
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-white ring-1 ring-black/10 text-navy-900 rounded-2xl hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Registrati
              </button>
            </div>
          </div>
        </div>

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