import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { envConfig, debugEnvConfig } from '../../config/envConfig';
import { ChevronLeft, CheckCircle } from 'lucide-react';

interface CoachAuthPageProps {
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
        };
      };
    };
  }
}

const CoachAuthPage: React.FC<CoachAuthPageProps> = ({ onAuthSuccess, onNavigateHome }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');


  // Reset errori
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
          ? 'Configurazione Google OAuth mancante. Crea un file .env.local con VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com'
          : 'Configurazione Google OAuth mancante. Verifica le variabili d\'ambiente su Firebase.';
        setError(errorMsg);
        return;
      }
      
      if (window.google) {
        // Pulisci completamente eventuali inizializzazioni precedenti
        window.google.accounts.id.cancel();
        window.google.accounts.id.disableAutoSelect();
        
        // Forza il logout da eventuali sessioni Google attive
        try {
          window.google.accounts.id.revoke('', () => {
            console.log('🔄 Sessione Google revocata');
          });
        } catch (e) {
          console.log('🔄 Nessuna sessione da revocare');
        }
        
        // Configurazione per forzare selezione account e evitare redirect_uri_mismatch
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSignIn,
          auto_select: false,
          cancel_on_tap_outside: true,
          // Forza sempre la selezione dell'account
          prompt: 'select_account',
          ux_mode: 'popup',
          // Configurazioni per evitare problemi
          use_fedcm_for_prompt: false,
          itp_support: true,
          // Disabilita completamente l'auto-login
          context: 'signin',
          state_cookie_domain: window.location.hostname
        });

        const buttonElement = document.getElementById('google-signin-button');
        if (buttonElement) {
          // Pulisci il contenuto precedente del bottone
          buttonElement.innerHTML = '';
          
          window.google.accounts.id.renderButton(buttonElement, {
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            locale: 'it',
            type: 'standard'
          });
        }
      }
    };

    // Cleanup function per evitare inizializzazioni multiple
    const cleanup = () => {
      if (window.google) {
        window.google.accounts.id.cancel();
      }
    };

    // Carica lo script di Google Identity Services se non è già presente
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

    // Cleanup al dismount del componente
    return cleanup;
  }, []);

  // Gestione risposta Google Sign-In
  const handleGoogleSignIn = async (response: any) => {
    setLoading(true);
    clearMessages();

    try {
      // Validazioni di sicurezza lato client
      if (!response || !response.credential) {
        throw new Error('Risposta Google non valida');
      }
      
      // Verifica che il credential sia una stringa e abbia una lunghezza ragionevole
      if (typeof response.credential !== 'string' || 
          response.credential.length < 100 || 
          response.credential.length > 2048) {
        throw new Error('Formato credential non valido');
      }
      
      const result = await authService.googleSignIn(response.credential);
      
      if (result.success && result.data) {
        // Sanitizza il messaggio di successo
        const sanitizedMessage = 'Autenticazione completata con successo!';
        setSuccess(sanitizedMessage);
        
        // Attendi un momento per mostrare il messaggio di successo
        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess();
          }
        }, 1000);
      } else {
        // Sanitizza i messaggi di errore per prevenire XSS
        const errorMessage = result.message || 'Accesso non autorizzato';
        const sanitizedError = errorMessage.replace(/<[^>]*>/g, '').substring(0, 200);
        setError(sanitizedError);
      }
    } catch (error: any) {
      // Sanitizza i messaggi di errore
      const errorMessage = error.message || 'Errore durante l\'autenticazione';
      const sanitizedError = errorMessage.replace(/<[^>]*>/g, '').substring(0, 200);
      setError(sanitizedError);
      
      // Log dell'errore per debugging (solo in development)
      if (import.meta.env.DEV) {
        console.error('Errore autenticazione Google:', error);
      }
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
      {/* Pulsante Torna alla home in alto a sinistra */}
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
          <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">Accesso Coach</h2>
          <p className="text-gray-600 text-sm">Accedi con il tuo account</p>
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
            
            #google-signin-button button {
              margin: 0 auto !important;
              display: block !important;
            }
          `}</style>
          
          {loading && (
            <div className="flex items-center justify-center py-3">
              <div className="animate-spin rounded-full h-5 w-5 border-[2px] border-gray-300 border-t-gray-600 mr-2"></div>
              <span className="text-gray-700">Autenticazione in corso…</span>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">© 2025 KW8</p>
        </div>
      </div>
    </div>
  );
};

export default CoachAuthPage;