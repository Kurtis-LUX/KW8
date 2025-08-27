import React, { useState, useEffect } from 'react';
import { authService } from '../../services/authService';

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
      // Debug: Verifica che il client_id sia configurato
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      console.log('🔍 Client ID Debug:', clientId);
      
      if (!clientId) {
        console.error('❌ VITE_GOOGLE_CLIENT_ID non configurato!');
        setError('Configurazione Google OAuth mancante. Contatta l\'amministratore.');
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
            width: '100%',
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-red-600 flex items-center justify-center p-4 relative">
      {/* Pulsante Torna alla home in alto a sinistra */}
      <button
        onClick={() => onNavigateHome && onNavigateHome()}
        className="absolute top-4 left-4 text-white hover:text-gray-200 font-medium transition-colors flex items-center space-x-2 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-black/30"
      >
        <span>←</span>
        <span>Torna alla home</span>
      </button>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
            <h1 className="text-3xl font-bold mb-2">🏋️ KW8</h1>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Accesso Coach
          </h2>
          <p className="text-gray-600 text-sm">
            Accedi con il tuo account Google autorizzato
          </p>
        </div>

        {/* Messaggi */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            <div className="flex items-center">
              <span className="text-green-500 mr-2">✅</span>
              {success}
            </div>
          </div>
        )}

        {/* Google Sign-In */}
        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Clicca sul pulsante qui sotto per accedere con Google
            </p>
          </div>
          
          {/* Container per il pulsante Google */}
          <div className="flex justify-center">
            <div id="google-signin-button" className="w-full"></div>
          </div>
          

          
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-gray-600">Autenticazione in corso...</span>
            </div>
          )}
          
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Solo gli account autorizzati possono accedere
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            © 2025 KW8
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoachAuthPage;