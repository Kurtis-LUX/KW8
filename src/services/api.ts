// Servizio API per gestire le operazioni CRUD con backend remoto
import { authService } from './authService';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://kw8-fitness.vercel.app/api' // URL di produzione Vercel
  : 'http://localhost:3001/api'; // Server di sviluppo locale

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      // Aggiungi automaticamente l'header di autorizzazione se disponibile
      const authHeaders = authService.getAuthHeader();
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      });

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
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Users API (richiede autenticazione admin)
  async getUsers() {
    return this.request('/users', { method: 'GET' });
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`, { method: 'GET' });
  }

  async createUser(user: any) {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async updateUser(id: string, user: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, { method: 'DELETE' });
  }

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