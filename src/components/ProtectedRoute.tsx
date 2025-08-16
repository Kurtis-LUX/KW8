// Componente per proteggere le rotte che richiedono autenticazione
import React, { useEffect, useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../utils/database';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  onUnauthorized?: () => void;
  fallback?: React.ReactNode;
}

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: string | null;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAdmin = false, 
  onUnauthorized,
  fallback 
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Controlla se l'utente è già autenticato localmente
        const currentUser = authService.getCurrentUser();
        const hasToken = authService.getToken();
        
        if (!currentUser || !hasToken) {
          setAuthState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: 'Utente non autenticato'
          });
          return;
        }
        
        // Verifica la validità del token con il server
        const verifyResult = await authService.verifyToken();
        
        if (!verifyResult || !verifyResult.valid) {
          setAuthState({
            isLoading: false,
            isAuthenticated: false,
            user: null,
            error: 'Token non valido o scaduto'
          });
          return;
        }
        
        // Controlla i privilegi admin se richiesti
        if (requireAdmin && currentUser.role !== 'admin') {
          setAuthState({
            isLoading: false,
            isAuthenticated: true,
            user: currentUser,
            error: 'Privilegi di amministratore richiesti'
          });
          return;
        }
        
        // Tutto ok
        setAuthState({
          isLoading: false,
          isAuthenticated: true,
          user: currentUser,
          error: null
        });
        
      } catch (error) {
        console.error('Auth check failed:', error);
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: 'Errore durante la verifica dell\'autenticazione'
        });
      }
    };

    checkAuth();
  }, [requireAdmin]);

  // Chiama la callback se non autorizzato
  useEffect(() => {
    if (!authState.isLoading && (!authState.isAuthenticated || authState.error)) {
      onUnauthorized?.();
    }
  }, [authState.isLoading, authState.isAuthenticated, authState.error, onUnauthorized]);

  // Loading state
  if (authState.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or insufficient privileges
  if (!authState.isAuthenticated || authState.error) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {requireAdmin ? 'Accesso Negato' : 'Autenticazione Richiesta'}
          </h3>
          
          <p className="text-sm text-gray-500 mb-6">
            {authState.error || 'Devi effettuare il login per accedere a questa pagina.'}
          </p>
          
          <button
            onClick={() => {
              authService.logout();
              window.location.reload();
            }}
            className="w-full bg-navy-900 text-white py-2 px-4 rounded-lg hover:bg-navy-800 transition-colors"
          >
            Vai al Login
          </button>
        </div>
      </div>
    );
  }

  // Authenticated and authorized
  return <>{children}</>;
};

export default ProtectedRoute;

// Hook personalizzato per utilizzare l'autenticazione nei componenti
export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    error: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await authService.autoLogin();
        setAuthState({
          isLoading: false,
          isAuthenticated: !!user,
          user,
          error: null
        });
      } catch (error) {
        setAuthState({
          isLoading: false,
          isAuthenticated: false,
          user: null,
          error: 'Errore durante la verifica dell\'autenticazione'
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      const result = await authService.login(email, password);
      setAuthState({
        isLoading: false,
        isAuthenticated: true,
        user: result.user,
        error: null
      });
      return result;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login fallito'
      }));
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    setAuthState({
      isLoading: false,
      isAuthenticated: false,
      user: null,
      error: null
    });
  };

  return {
    ...authState,
    login,
    logout,
    isAdmin: authState.user?.role === 'admin'
  };
};