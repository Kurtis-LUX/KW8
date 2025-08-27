// Servizio di autenticazione con JWT
import { envConfig, checkCriticalEnvVars } from '../config/envConfig';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  nome?: string;
  cognome?: string;
}

interface LoginResponse {
  user: AuthUser;
  token: string;
  message: string;
  expiresIn: string;
}

interface GoogleSignInResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: {
      email: string;
      role: string;
    };
    expiresAt: string;
    tokenType: string;
  };
}

interface VerifyResponse {
  valid: boolean;
  user: {
    id: string;
    email: string;
    role: string;
  };
  message: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'kw8_auth_token';
  private readonly USER_KEY = 'kw8_current_user';
  
  constructor() {
    // Verifica che le variabili d'ambiente critiche siano configurate
    if (!checkCriticalEnvVars()) {
      console.warn('⚠️ Alcune variabili d\'ambiente critiche non sono configurate');
    }
  }
  
  private get API_BASE_URL(): string {
    return envConfig.apiBaseUrl;
  }

  // Autenticazione con Google Identity Services
  async googleSignIn(credential: string): Promise<GoogleSignInResponse> {
    try {
      console.log('🔍 Inizio Google Sign-In, URL:', `${this.API_BASE_URL}/auth/google-signin`);
      
      const response = await fetch(`${this.API_BASE_URL}/auth/google-signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });

      console.log('📡 Risposta ricevuta - Status:', response.status, 'StatusText:', response.statusText);
      
      // Verifica Content-Type della risposta
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Content-Type non valido:', contentType);
        throw new Error('Il server non ha restituito una risposta JSON valida');
      }

      // Usa response.json() direttamente per evitare problemi di parsing
      let data: GoogleSignInResponse;
      try {
        data = await response.json();
        console.log('✅ JSON parsato con successo:', data);
      } catch (jsonError) {
        console.error('❌ Errore nel parsing JSON per Google Sign-In:', jsonError);
        throw new Error('Risposta JSON non valida dal server');
      }
      
      // Validazione struttura risposta
      if (!data || typeof data !== 'object') {
        console.error('❌ Struttura risposta non valida:', data);
        throw new Error('Struttura risposta non valida dal server');
      }
      
      if (!response.ok) {
        console.log('❌ Risposta non OK:', data.message || 'Errore sconosciuto');
        const errorMessage = (data as any).message || (data as any).error || 'Errore nell\'autenticazione Google';
        throw new Error(errorMessage);
      }

      // Validazione campi obbligatori
      if (typeof data.success !== 'boolean') {
        console.error('❌ Campo success mancante o non valido');
        throw new Error('Risposta del server incompleta');
      }

      // Se l'autenticazione è riuscita, salva il token e i dati utente
      if (data.success && data.data) {
        // Validazione dati utente
        if (!data.data.token || !data.data.user || !data.data.user.email) {
          console.error('❌ Dati utente incompleti:', data.data);
          throw new Error('Dati di autenticazione incompleti');
        }
        
        console.log('✅ Login riuscito, salvando token e user');
        this.setToken(data.data.token);
        this.setUser({
          id: data.data.user.email, // Usa email come ID
          email: data.data.user.email,
          role: data.data.user.role || 'user'
        });
      } else {
        console.log('❌ Login fallito:', data.message || 'Autenticazione non riuscita');
      }

      return data;
    } catch (error) {
      console.error('❌ Errore Google Sign-In:', error);
      throw error;
    }
  }

  // Login con credenziali (mantenuto per compatibilità)
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      // Verifica Content-Type della risposta
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Content-Type non valido per login:', contentType);
        throw new Error('Il server non ha restituito una risposta JSON valida');
      }

      // Usa response.json() direttamente
      let data: any;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Errore nel parsing JSON per login:', jsonError);
        throw new Error('Risposta JSON non valida dal server');
      }

      // Validazione struttura risposta
      if (!data || typeof data !== 'object') {
        console.error('❌ Struttura risposta login non valida:', data);
        throw new Error('Struttura risposta non valida dal server');
      }

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Login fallito';
        throw new Error(errorMessage);
      }

      // Validazione campi obbligatori per login
      if (!data.token || !data.user || !data.user.email) {
        console.error('❌ Dati login incompleti:', data);
        throw new Error('Dati di login incompleti dal server');
      }
      
      // Salva il token e i dati utente
      this.setToken(data.token);
      this.setUser(data.user);
      
      return data as LoginResponse;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Verifica la validità del token
  async verifyToken(): Promise<VerifyResponse | null> {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }

    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      // Verifica Content-Type della risposta
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Content-Type non valido per verify:', contentType);
        this.logout();
        return null;
      }

      // Usa response.json() direttamente
      let data: any;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Errore nel parsing JSON per verify:', jsonError);
        this.logout();
        return null;
      }
      
      // Validazione struttura risposta
      if (!data || typeof data !== 'object') {
        console.error('❌ Struttura risposta verify non valida:', data);
        this.logout();
        return null;
      }
      
      // Controlla se il token è valido dal campo 'valid'
      if (typeof data.valid !== 'boolean' || !data.valid) {
        console.log('Token non valido:', data.message || 'Token verification failed');
        this.logout();
        return null;
      }
      
      // Validazione dati utente
      if (!data.user || !data.user.email) {
        console.error('❌ Dati utente mancanti nella risposta verify:', data);
        this.logout();
        return null;
      }
      
      // Se il token è valido, restituisci i dati utente
      return {
        valid: true,
        user: data.user,
        message: data.message || 'Token valido'
      } as VerifyResponse;
    } catch (error) {
      console.error('Token verification error:', error);
      this.logout();
      return null;
    }
  }

  // Logout
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('kw8_auto_login'); // Rimuovi anche auto-login
  }

  // Ottieni il token corrente
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Salva il token
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Ottieni l'utente corrente
  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Salva i dati utente
  private setUser(user: AuthUser): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  // Controlla se l'utente è autenticato
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  // Controlla se l'utente è admin
  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin';
  }

  // Controlla se l'utente è coach
  isCoach(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'coach';
  }

  // Controlla se l'utente ha accesso alle funzioni coach
  hasCoachAccess(): boolean {
    return this.isCoach() || this.isAdmin();
  }

  // Ottieni l'header di autorizzazione per le API
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Auto-login se il token è ancora valido
  async autoLogin(): Promise<AuthUser | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const verifyResult = await this.verifyToken();
      
      if (verifyResult && verifyResult.valid) {
        // Token valido, aggiorna i dati utente se necessario
        const currentUser = this.getCurrentUser();
        if (currentUser) {
          return currentUser;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Auto-login error:', error);
      this.logout();
      return null;
    }
  }

  // Refresh del token (se implementato nel backend)
  async refreshToken(): Promise<boolean> {
    // Implementazione futura per il refresh dei token
    // Per ora, richiedi un nuovo login
    return false;
  }

  // Controlla se il token sta per scadere (entro 1 ora)
  isTokenExpiringSoon(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Decodifica il payload del JWT (senza verificare la firma)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Converti in millisecondi
      const currentTime = Date.now();
      const oneHour = 60 * 60 * 1000; // 1 ora in millisecondi
      
      return (expirationTime - currentTime) < oneHour;
    } catch {
      return true; // Se non riusciamo a decodificare, considera il token come in scadenza
    }
  }
}

// Esporta un'istanza singleton
export const authService = new AuthService();
export default authService;

// Tipi per l'export
export type { LoginResponse, VerifyResponse, GoogleSignInResponse };