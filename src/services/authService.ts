// Servizio di autenticazione con JWT
import { envConfig, checkCriticalEnvVars } from '../config/envConfig';
import { auth } from '../config/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import firestoreService from './firestoreService';

interface AuthUser {
  id: string;
  email: string;
  role: string;
  name?: string;
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
    name?: string;
  };
  message: string;
}

class AuthService {
  private readonly TOKEN_KEY = 'kw8_auth_token';
  private readonly USER_KEY = 'kw8_current_user';
  private readonly SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 giorni in millisecondi
  
  constructor() {
    // Verifica che le variabili d'ambiente critiche siano configurate
    if (!checkCriticalEnvVars()) {
      console.warn('⚠️ Alcune variabili d\'ambiente critiche non sono configurate');
    }
    
    // Inizializza la gestione delle sessioni persistenti
    this.initializePersistentSession();
  }
  
  // Rileva se siamo su un dispositivo mobile
  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (window.innerWidth <= 768);
  }
  
  // Inizializza la sessione persistente al caricamento
  private initializePersistentSession(): void {
    // Verifica se esiste un token nei cookie
    const cookieToken = this.getCookie(this.TOKEN_KEY);
    const cookieUser = this.getCookie(this.USER_KEY);
    
    // Se non c'è token in localStorage ma c'è nei cookie, ripristina la sessione
    if (!this.getToken() && cookieToken) {
      localStorage.setItem(this.TOKEN_KEY, cookieToken);
      console.log('🔐 Token ripristinato dai cookie');
    }
    
    if (!this.getCurrentUser() && cookieUser) {
      try {
        const user = JSON.parse(decodeURIComponent(cookieUser));
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        console.log('👤 Utente ripristinato dai cookie:', user.email);
      } catch (error) {
        console.error('Errore nel parsing del cookie utente:', error);
        // Pulisci cookie corrotti
        this.deleteCookie(this.USER_KEY);
      }
    }
  }
  
  private get API_BASE_URL(): string {
    return envConfig.apiBaseUrl;
  }

  // Usa sempre Firebase Functions per gli endpoint di autenticazione critici
  private get FUNCTIONS_BASE_URL(): string {
    // In sviluppo usa il server API locale (proxy), in produzione usa Cloud Functions
    return envConfig.apiBaseUrl;
  }

  // Autenticazione con Google Identity Services
  async googleSignIn(credential: string): Promise<GoogleSignInResponse> {
    try {
      console.log('🔍 Inizio Google Sign-In, URL:', `${this.FUNCTIONS_BASE_URL}/apiAuthGoogleSignin`);
      
      const response = await fetch(`${this.FUNCTIONS_BASE_URL}/apiAuthGoogleSignin`, {
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
        let name: string | undefined;
        try {
          const fsUser = await firestoreService.getUserByEmail(data.data.user.email);
          name = fsUser?.name;
        } catch {}
        this.setUser({
          id: data.data.user.email, // Usa email come ID
          email: data.data.user.email,
          role: data.data.user.role || 'user',
          name,
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

  // Registrazione con Google Identity Services (Atleta)
  async googleSignup(credential: string): Promise<GoogleSignupResponse> {
    try {
      console.log('🔍 Inizio Google Sign-Up, URL:', `${this.FUNCTIONS_BASE_URL}/apiAuthGoogleSignup`);

      const response = await fetch(`${this.FUNCTIONS_BASE_URL}/apiAuthGoogleSignup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ credential }),
      });

      console.log('📡 Risposta ricevuta (signup) - Status:', response.status, 'StatusText:', response.statusText);

      // Verifica Content-Type della risposta
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Content-Type non valido (signup):', contentType);
        throw new Error('Il server non ha restituito una risposta JSON valida');
      }

      // Usa response.json() direttamente
      let data: GoogleSignupResponse;
      try {
        data = await response.json();
        console.log('✅ JSON parsato con successo (signup):', data);
      } catch (jsonError) {
        console.error('❌ Errore nel parsing JSON per Google Sign-Up:', jsonError);
        throw new Error('Risposta JSON non valida dal server');
      }

      // Validazione struttura risposta
      if (!data || typeof data !== 'object') {
        console.error('❌ Struttura risposta non valida (signup):', data as any);
        throw new Error('Struttura risposta non valida dal server');
      }

      if (!response.ok) {
        console.log('❌ Risposta non OK (signup):', (data as any).message || 'Errore sconosciuto');
        const errorMessage = (data as any).message || (data as any).error || 'Errore nella registrazione Google';
        throw new Error(errorMessage);
      }

      // Validazione campi obbligatori
      if (typeof data.success !== 'boolean') {
        console.error('❌ Campo success mancante o non valido (signup)');
        throw new Error('Risposta del server incompleta');
      }

      // Se la registrazione è riuscita, salva il token e i dati utente con ruolo atleta
      if (data.success && data.data) {
        if (!data.data.token || !data.data.user || !data.data.user.email) {
          console.error('❌ Dati utente incompleti (signup):', data.data);
          throw new Error('Dati di registrazione incompleti');
        }

        console.log('✅ Registrazione riuscita, salvando token e user (athlete)');
        this.setToken(data.data.token);
        let name: string | undefined = data.data.user.name;
        try {
          const fsUser = await firestoreService.getUserByEmail(data.data.user.email);
          name = name || fsUser?.name;
        } catch {}
        this.setUser({
          id: data.data.user.email,
          email: data.data.user.email,
          role: data.data.user.role || 'athlete',
          name,
        });
      } else {
        console.log('❌ Registrazione fallita:', data.message || 'Registrazione non riuscita');
      }

      return data;
    } catch (error) {
      console.error('❌ Errore Google Sign-Up:', error);
      throw error;
    }
  }

  // Login con credenziali (mantenuto per compatibilità)
  async login(email: string, password: string): Promise<LoginResponse> {
    try {
      // 1) Login su Firebase Auth con email/password
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (!firebaseUser) {
        throw new Error('Autenticazione Firebase fallita');
      }

      // 2) Ottieni l'ID token di Firebase
      const idToken = await firebaseUser.getIdToken();
      if (!idToken) {
        throw new Error('Impossibile ottenere ID token da Firebase');
      }

      // 3) Scambia l'ID token per un JWT applicativo
      const response = await fetch(`${this.FUNCTIONS_BASE_URL}/apiAuthFirebaseExchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Content-Type non valido per firebase-exchange:', contentType);
        // Fallback in sviluppo: usa token locale e prosegui
        if (envConfig.isDevelopment) {
          const localTokenPayload = {
            email: firebaseUser.email || email,
            role: 'athlete',
            iat: Math.floor(Date.now() / 1000)
          };
          const localToken = btoa(JSON.stringify(localTokenPayload));
          this.setToken(localToken);
          const userEmail = (firebaseUser.email || email || 'unknown');
          let name: string | undefined;
          try {
            const fsUser = await firestoreService.getUserByEmail(userEmail);
            name = fsUser?.name;
          } catch {}
          this.setUser({ id: userEmail, email: userEmail, role: 'athlete', name });
          const result: LoginResponse = {
            user: { id: userEmail, email: userEmail, role: 'athlete', name },
            token: localToken,
            message: 'Login effettuato (fallback locale)',
            expiresIn: '7d',
          };
          return result;
        }
        throw new Error('Il server non ha restituito una risposta JSON valida');
      }

      let data: any;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Errore nel parsing JSON per firebase-exchange:', jsonError);
        // Fallback in sviluppo: usa token locale e prosegui
        if (envConfig.isDevelopment) {
          const userEmail = (firebaseUser.email || email || 'unknown');
          const localTokenPayload = {
            email: userEmail,
            role: 'athlete',
            iat: Math.floor(Date.now() / 1000)
          };
          const localToken = btoa(JSON.stringify(localTokenPayload));
          this.setToken(localToken);
          let name: string | undefined;
          try {
            const fsUser = await firestoreService.getUserByEmail(userEmail);
            name = fsUser?.name;
          } catch {}
          this.setUser({ id: userEmail, email: userEmail, role: 'athlete', name });
          const result: LoginResponse = {
            user: { id: userEmail, email: userEmail, role: 'athlete', name },
            token: localToken,
            message: `Login effettuato (fallback locale): ${errorMessage}`,
            expiresIn: '7d',
          };
          return result;
        }
        throw new Error('Risposta JSON non valida dal server');
      }

      if (!response.ok) {
        const errorMessage = data.message || data.error || 'Login fallito';
        // Fallback in sviluppo anche su status non OK
        if (envConfig.isDevelopment) {
          const userEmail = (firebaseUser.email || email || 'unknown');
          const localTokenPayload = {
            email: userEmail,
            role: 'athlete',
            iat: Math.floor(Date.now() / 1000)
          };
          const localToken = btoa(JSON.stringify(localTokenPayload));
          this.setToken(localToken);
          let name: string | undefined;
          try {
            const fsUser = await firestoreService.getUserByEmail(userEmail);
            name = fsUser?.name;
          } catch {}
          this.setUser({ id: userEmail, email: userEmail, role: 'athlete', name });
          const result: LoginResponse = {
            user: { id: userEmail, email: userEmail, role: 'athlete', name },
            token: localToken,
            message: `Login effettuato (fallback locale): ${errorMessage}`,
            expiresIn: '7d',
          };
          return result;
        }
        throw new Error(errorMessage);
      }

      if (!data || typeof data !== 'object' || !data.success || !data.data || !data.data.token || !data.data.user || !data.data.user.email) {
        console.error('❌ Dati exchange incompleti:', data);
        throw new Error('Dati di login incompleti dal server');
      }

      // 4) Salva il token e i dati utente
      this.setToken(data.data.token);
      let name: string | undefined;
      try {
        const fsUser = await firestoreService.getUserByEmail(data.data.user.email);
        name = fsUser?.name;
      } catch {}
      this.setUser({
        id: data.data.user.email,
        email: data.data.user.email,
        role: (data.data.user.role === 'user') ? 'athlete' : (data.data.user.role || 'athlete'),
        name,
      });

      // 5) Restituisci nel formato atteso da chiamanti esistenti
      const result: LoginResponse = {
        user: {
          id: data.data.user.email,
          email: data.data.user.email,
          role: (data.data.user.role === 'user') ? 'athlete' : (data.data.user.role || 'athlete'),
          name,
        },
        token: data.data.token,
        message: data.message || 'Login effettuato',
        expiresIn: '7d',
      };

      return result;
    } catch (error) {
      console.error('Login error:', error);
      throw error as Error;
    }
  }

  // Verifica la validità del token
  async verifyToken(): Promise<VerifyResponse | null> {
    const token = this.getToken();
    
    if (!token) {
      console.log('🔐 No token found for verification');
      return null;
    }

    console.log('🔐 Starting token verification with URL:', `${this.FUNCTIONS_BASE_URL}/authVerify`);
    console.log('🔐 Token exists, length:', token.length);

    try {
      const response = await fetch(`${this.FUNCTIONS_BASE_URL}/authVerify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      console.log('🔐 Response received - Status:', response.status, 'StatusText:', response.statusText);

      // Verifica Content-Type della risposta
      const contentType = response.headers.get('content-type');
      console.log('🔐 Response Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        console.error('❌ Content-Type non valido per verify:', contentType);
        if (envConfig.isDevelopment) {
          const localUser = this.getCurrentUser();
          if (localUser) {
            console.log('🔐 Dev fallback verify: usando utente locale');
            return { valid: true, user: localUser, message: 'Dev verify fallback: non-JSON upstream' } as VerifyResponse;
          }
          return null;
        }
        this.logout();
        return null;
      }

      // Usa response.json() direttamente
      let data: any;
      try {
        data = await response.json();
        console.log('🔐 Response data:', data);
      } catch (jsonError) {
        console.error('❌ Errore nel parsing JSON per verify:', jsonError);
        if (envConfig.isDevelopment) {
          const localUser = this.getCurrentUser();
          if (localUser) {
            console.log('🔐 Dev fallback verify: usando utente locale (parse error)');
            return { valid: true, user: localUser, message: 'Dev verify fallback: parse error' } as VerifyResponse;
          }
          return null;
        }
        this.logout();
        return null;
      }
      
      // Validazione struttura risposta
      if (!data || typeof data !== 'object') {
        console.error('❌ Struttura risposta verify non valida:', data);
        if (envConfig.isDevelopment) {
          const localUser = this.getCurrentUser();
          if (localUser) {
            console.log('🔐 Dev fallback verify: usando utente locale (bad structure)');
            return { valid: true, user: localUser, message: 'Dev verify fallback: bad structure' } as VerifyResponse;
          }
          return null;
        }
        this.logout();
        return null;
      }
      
      // Controlla se il token è valido dal campo 'valid'
      if (typeof data.valid !== 'boolean' || !data.valid) {
        console.log('❌ Token non valido:', data.message || 'Token verification failed');
        if (envConfig.isDevelopment) {
          const localUser = this.getCurrentUser();
          if (localUser) {
            console.log('🔐 Dev fallback verify: usando utente locale (invalid token)');
            return { valid: true, user: localUser, message: 'Dev verify fallback: invalid upstream token' } as VerifyResponse;
          }
          return null;
        }
        this.logout();
        return null;
      }
      
      // Validazione dati utente
      if (!data.user || !data.user.email) {
        console.error('❌ Dati utente mancanti nella risposta verify:', data);
        if (envConfig.isDevelopment) {
          const localUser = this.getCurrentUser();
          if (localUser) {
            console.log('🔐 Dev fallback verify: usando utente locale (missing user)');
            return { valid: true, user: localUser, message: 'Dev verify fallback: missing user upstream' } as VerifyResponse;
          }
          return null;
        }
        this.logout();
        return null;
      }
      
      console.log('✅ Token verification successful, user:', data.user);
      
      // Se il token è valido, restituisci i dati utente
      const normalizedRole = (data.user.role === 'user') ? 'athlete' : (data.user.role || 'athlete');
      let name: string | undefined;
      try {
        const fsUser = await firestoreService.getUserByEmail(data.user.email);
        name = fsUser?.name;
      } catch {}
      return {
        valid: true,
        user: { ...data.user, role: normalizedRole, name },
        message: data.message || 'Token valido'
      } as VerifyResponse;
    } catch (error) {
      console.error('❌ Token verification error:', error);
      if (envConfig.isDevelopment) {
        const localUser = this.getCurrentUser();
        if (localUser) {
          console.log('🔐 Dev fallback verify: usando utente locale (network/error)');
          return { valid: true, user: localUser, message: 'Dev verify fallback: network/error' } as VerifyResponse;
        }
        return null;
      }
      this.logout();
      return null;
    }
  }

  // Logout completo con pulizia cookie
  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem('kw8_auto_login'); // Rimuovi anche auto-login
    
    // Rimuovi anche i cookie
    this.deleteCookie(this.TOKEN_KEY);
    this.deleteCookie(this.USER_KEY);
    
    console.log('✅ Logout completato: localStorage e cookie puliti');
  }

  // Ottieni il token corrente
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Salva il token con persistenza di 7 giorni
  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
    this.setCookie(this.TOKEN_KEY, token, this.SESSION_DURATION);
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

  // Salva i dati utente con persistenza di 7 giorni
  private setUser(user: AuthUser): void {
    const userString = JSON.stringify(user);
    localStorage.setItem(this.USER_KEY, userString);
    this.setCookie(this.USER_KEY, encodeURIComponent(userString), this.SESSION_DURATION);
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
    try {
      const token = this.getToken();
      if (!token) {
        console.log('🔐 No token found for auto-login');
        return null;
      }

      console.log('🔐 Attempting auto-login with existing token');
      
      // Su mobile, usa timeout più lungo e retry
      const isMobile = this.isMobileDevice();
      const maxRetries = isMobile ? 3 : 1;
      const timeout = isMobile ? 10000 : 5000; // 10s mobile, 5s desktop
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          console.log(`🔐 Auto-login attempt ${attempt}/${maxRetries} (${isMobile ? 'mobile' : 'desktop'})`);
          
          const result = await Promise.race([
            this.verifyToken(),
            new Promise<null>((_, reject) => 
              setTimeout(() => reject(new Error('Timeout')), timeout)
            )
          ]);
          
          if (result && result.valid) {
            console.log('✅ Auto-login successful');
            if (result.user) {
              this.setUser(result.user);
            }
            return result.user;
          } else {
            console.log(`❌ Token verification failed during auto-login (attempt ${attempt})`);
            if (attempt === maxRetries) {
              this.logout(); // Pulisce i dati non validi solo all'ultimo tentativo
            }
          }
        } catch (error) {
          console.error(`❌ Auto-login attempt ${attempt} failed:`, error);
          if (attempt === maxRetries) {
            this.logout(); // Pulisce i dati in caso di errore finale
            return null;
          }
          // Attendi prima del prossimo tentativo (solo su mobile)
          if (isMobile && attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error('❌ Auto-login error:', error);
      this.logout(); // Pulisce i dati in caso di errore
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
  
  // Gestione Cookie - Imposta un cookie con scadenza
  private setCookie(name: string, value: string, maxAge: number): void {
    const expires = new Date(Date.now() + maxAge).toUTCString();
    // Usa SameSite=Lax per compatibilità e Secure solo su HTTPS
    const secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax${secure}`;
    console.log(`🍪 Cookie impostato: ${name} (scade: ${expires})`);
  }
  
  // Gestione Cookie - Legge un cookie
  private getCookie(name: string): string | null {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
  
  // Gestione Cookie - Elimina un cookie
  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    console.log(`🍪 Cookie eliminato: ${name}`);
  }
  
  // Verifica se la sessione è ancora valida (entro 7 giorni)
  isSessionValid(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    // Verifica anche se il cookie esiste ancora
    const cookieToken = this.getCookie(this.TOKEN_KEY);
    return !!(token && cookieToken);
  }
}

// Esporta un'istanza singleton
export const authService = new AuthService();
export default authService;

// Tipi per l'export
interface GoogleSignupResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      email: string;
      role: string;
      name?: string;
      picture?: string;
    };
  };
}

export type { LoginResponse, VerifyResponse, GoogleSignInResponse, GoogleSignupResponse };