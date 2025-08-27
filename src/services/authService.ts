// Servizio di autenticazione con JWT

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
  
  // Funzione per rilevare dinamicamente l'ambiente
  private getApiBaseUrl(): string {
    if (typeof window === 'undefined') {
      // Server-side rendering
      return 'https://kw8.vercel.app/api';
    }
    
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // SEMPRE usa l'API locale quando siamo su localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('🏠 Ambiente locale rilevato, usando API locale');
      return 'http://localhost:3001/api';
    }
    
    // In sviluppo con Vite, forza sempre l'uso del server locale
    if (import.meta.env.DEV) {
      console.log('🔧 Modalità development rilevata, usando API locale');
      return 'http://localhost:3001/api';
    }
    
    // Se siamo su Vercel, usa l'URL corrente del deployment
    if (hostname.includes('vercel.app')) {
      console.log('☁️ Ambiente Vercel rilevato, usando API di produzione');
      return `${protocol}//${hostname}/api`;
    }
    
    // Se siamo su dominio kw8 personalizzato
    if (hostname.includes('kw8')) {
      console.log('🌐 Dominio KW8 rilevato, usando API di produzione');
      return `${protocol}//${hostname}/api`;
    }
    
    // Fallback: se non siamo sicuri, usa locale per development
    const isProduction = import.meta.env.PROD;
    const apiUrl = isProduction 
      ? `${protocol}//${hostname}/api`
      : 'http://localhost:3001/api';
    
    console.log(`🔄 Fallback API URL: ${apiUrl} (production: ${isProduction})`);
    return apiUrl;
  }
  
  private get API_BASE_URL(): string {
    return this.getApiBaseUrl();
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
      console.log('📡 Headers risposta:', Object.fromEntries(response.headers.entries()));

      // Verifica che la risposta contenga contenuto
      const responseText = await response.text();
      console.log('📄 Testo risposta completo:', responseText);
      
      if (!responseText) {
        console.error('❌ Risposta vuota dal server');
        throw new Error('Risposta vuota dal server');
      }

      let data: GoogleSignInResponse;
      try {
        data = JSON.parse(responseText);
        console.log('✅ JSON parsato con successo:', data);
      } catch (jsonError) {
        console.error('❌ Errore nel parsing JSON per Google Sign-In:', jsonError);
        console.error('❌ Risposta ricevuta:', responseText.substring(0, 500));
        throw new Error('Risposta non valida dal server');
      }
      
      if (!response.ok) {
        console.log('❌ Risposta non OK:', data.message);
        throw new Error(data.message || 'Errore nell\'autenticazione Google');
      }

      // Se l'autenticazione è riuscita, salva il token e i dati utente
      if (data.success && data.data) {
        console.log('✅ Login riuscito, salvando token e user');
        this.setToken(data.data.token);
        this.setUser({
          id: data.data.user.email, // Usa email come ID
          email: data.data.user.email,
          role: data.data.user.role
        });
      } else {
        console.log('❌ Login fallito:', data.message);
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

      if (!response.ok) {
        let errorMessage = 'Login fallito';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.error('Errore nel parsing della risposta di errore:', jsonError);
        }
        throw new Error(errorMessage);
      }

      // Verifica che la risposta contenga contenuto
      const responseText = await response.text();
      if (!responseText) {
        throw new Error('Risposta vuota dal server');
      }

      let data: LoginResponse;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Errore nel parsing JSON:', jsonError);
        console.error('Risposta ricevuta:', responseText);
        throw new Error('Risposta non valida dal server');
      }
      
      // Salva il token e i dati utente
      this.setToken(data.token);
      this.setUser(data.user);
      
      return data;
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

      // Verifica che la risposta contenga contenuto
      const responseText = await response.text();
      if (!responseText) {
        console.error('Risposta vuota dal server per verify');
        this.logout();
        return null;
      }

      let data: any;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Errore nel parsing JSON per verify:', jsonError);
        console.error('Risposta ricevuta:', responseText);
        this.logout();
        return null;
      }
      
      // Controlla se il token è valido dal campo 'valid'
      if (!data.valid) {
        console.log('Token non valido:', data.message);
        this.logout();
        return null;
      }
      
      // Se il token è valido, restituisci i dati utente
      return {
        valid: true,
        user: data.user
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