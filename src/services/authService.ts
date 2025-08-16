// Servizio di autenticazione con JWT
import { User } from '../utils/database';

interface LoginResponse {
  user: User;
  token: string;
  message: string;
  expiresIn: string;
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
  private readonly API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://kw8-fitness.vercel.app/api'
    : 'http://localhost:3001/api';

  // Login con credenziali
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

      if (!response.ok) {
        // Token non valido o scaduto
        this.logout();
        return null;
      }

      const data: VerifyResponse = await response.json();
      return data;
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
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem(this.USER_KEY);
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Salva i dati utente
  private setUser(user: User): void {
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

  // Ottieni l'header di autorizzazione per le API
  getAuthHeader(): { Authorization: string } | {} {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Auto-login se il token è ancora valido
  async autoLogin(): Promise<User | null> {
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
export type { LoginResponse, VerifyResponse };