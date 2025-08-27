// Servizio API per gestire le operazioni CRUD con backend remoto
import { authService } from './authService';

// Funzione per rilevare dinamicamente l'ambiente
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return 'https://kw8.vercel.app/api';
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // Se siamo in locale (localhost o 127.0.0.1)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  // Se siamo su Vercel, usa l'URL corrente del deployment
  if (hostname.includes('vercel.app')) {
    return `${protocol}//${hostname}/api`;
  }
  
  // Se siamo su dominio personalizzato kw8
  if (hostname.includes('kw8')) {
    return `${protocol}//${hostname}/api`;
  }
  
  // Fallback per altri casi
   return process.env.NODE_ENV === 'production' 
     ? `${protocol}//${hostname}/api`
     : 'http://localhost:3001/api';
}

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private readonly TIMEOUT_MS = 15000; // 15 secondi per mobile
  private readonly MAX_RETRIES = 3;
  
  private async requestWithTimeout<T>(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🌐 API Request attempt ${attempt}/${this.MAX_RETRIES}: ${endpoint}`);
        
        // Aggiungi automaticamente l'header di autorizzazione se disponibile
        const authHeaders = authService.getAuthHeader();
        
        const response = await this.requestWithTimeout(`${API_BASE_URL}${endpoint}`, {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders,
            ...options.headers,
          },
          credentials: 'include',
          ...options,
        }, this.TIMEOUT_MS);

        const data = await response.json();

        // Se ricevi un errore 401, il token potrebbe essere scaduto
        if (response.status === 401) {
          authService.logout();
          return {
            success: false,
            error: 'Sessione scaduta. Effettua nuovamente il login.',
          };
        }

        if (!response.ok) {
          // Non fare retry per errori client (4xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              error: data.error || `HTTP error! status: ${response.status}`,
            };
          }
          
          // Per errori server (5xx), prova di nuovo
          throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        console.log(`✅ API Request successful: ${endpoint}`);
        return {
          success: true,
          data: data,
        };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');
        console.warn(`⚠️ API Request attempt ${attempt} failed:`, lastError.message);
        
        // Non fare retry per errori di autenticazione o client
        if (lastError.message.includes('401') || lastError.message.includes('403')) {
          break;
        }
        
        // Se non è l'ultimo tentativo, aspetta prima di riprovare
        if (attempt < this.MAX_RETRIES) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
          console.log(`🔄 Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // Tutti i tentativi falliti
    console.error('❌ All API request attempts failed:', lastError?.message);
    return {
      success: false,
      error: this.getErrorMessage(lastError),
    };
  }
  
  private getErrorMessage(error: Error | null): string {
    if (!error) return 'Unknown error occurred';
    
    if (error.name === 'AbortError') {
      return 'Richiesta interrotta per timeout. Controlla la connessione.';
    }
    
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Errore di connessione. Controlla la rete e riprova.';
    }
    
    return error.message || 'Errore sconosciuto';
  }

  // Authentication API methods are handled by authService

  // Workout Plans API
  async getWorkoutPlans() {
    return this.request('/workout-plans', { method: 'GET' });
  }

  async getWorkoutPlanById(id: string) {
    return this.request(`/workout-plans/${id}`, { method: 'GET' });
  }

  async createWorkoutPlan(plan: any) {
    return this.request('/workout-plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    });
  }

  async updateWorkoutPlan(id: string, plan: any) {
    return this.request(`/workout-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plan),
    });
  }

  async deleteWorkoutPlan(id: string) {
    return this.request(`/workout-plans/${id}`, { method: 'DELETE' });
  }

  // Workout Folders API
  async getWorkoutFolders() {
    return this.request('/workout-folders', { method: 'GET' });
  }

  async createWorkoutFolder(folder: any) {
    return this.request('/workout-folders', {
      method: 'POST',
      body: JSON.stringify(folder),
    });
  }

  async updateWorkoutFolder(id: string, folder: any) {
    return this.request(`/workout-folders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(folder),
    });
  }

  async deleteWorkoutFolder(id: string) {
    return this.request(`/workout-folders/${id}`, { method: 'DELETE' });
  }

  // Authentication API
  async login(email: string, password: string) {
    // Usa direttamente authService per il login
    try {
      const result = await authService.login(email, password);
      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  }

  async verifyToken() {
    try {
      const result = await authService.verifyToken();
      return {
        success: !!result,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token verification failed',
      };
    }
  }

  async register(userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Health check
  async healthCheck() {
    return this.request('/health', { method: 'GET' });
  }
}

export const apiService = new ApiService();
export default apiService;