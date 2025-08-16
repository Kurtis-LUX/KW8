// Database ibrido che supporta sia localStorage che API remote
import { apiService } from '../services/api';
import DB, { User, WorkoutPlan, WorkoutFolder } from './database';

const USE_REMOTE_API = process.env.NODE_ENV === 'production';

class HybridDatabase {
  // Users
  async getUsers(): Promise<User[]> {
    if (USE_REMOTE_API) {
      try {
        const response = await apiService.getUsers();
        return response.success ? response.data || [] : [];
      } catch (error) {
        console.error('Failed to fetch users from API, falling back to localStorage:', error);
        return DB.getUsers();
      }
    }
    return DB.getUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    if (USE_REMOTE_API) {
      try {
        const response = await apiService.getUserById(id);
        return response.success ? response.data || null : null;
      } catch (error) {
        console.error('Failed to fetch user from API, falling back to localStorage:', error);
        return DB.getUserById(id);
      }
    }
    return DB.getUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    if (USE_REMOTE_API) {
      try {
        const users = await this.getUsers();
        return users.find(u => u.email === email) || null;
      } catch (error) {
        console.error('Failed to fetch user by email from API, falling back to localStorage:', error);
        return DB.getUserByEmail(email);
      }
    }
    return DB.getUserByEmail(email);
  }

  async saveUser(user: User): Promise<boolean> {
    if (USE_REMOTE_API) {
      try {
        const existingUser = await this.getUserById(user.id);
        const response = existingUser 
          ? await apiService.updateUser(user.id, user)
          : await apiService.createUser(user);
        
        if (response.success) {
          // Aggiorna anche localStorage come cache
          DB.saveUser(user);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to save user to API, falling back to localStorage:', error);
        DB.saveUser(user);
        return true;
      }
    }
    DB.saveUser(user);
    return true;
  }

  async deleteUser(userId: string): Promise<boolean> {
    if (USE_REMOTE_API) {
      try {
        const response = await apiService.deleteUser(userId);
        if (response.success) {
          // Aggiorna anche localStorage come cache
          DB.deleteUser(userId);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to delete user from API, falling back to localStorage:', error);
        DB.deleteUser(userId);
        return true;
      }
    }
    DB.deleteUser(userId);
    return true;
  }

  // Workout Plans
  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    if (USE_REMOTE_API) {
      try {
        const response = await apiService.getWorkoutPlans();
        return response.success ? response.data || [] : [];
      } catch (error) {
        console.error('Failed to fetch workout plans from API, falling back to localStorage:', error);
        return DB.getWorkoutPlans();
      }
    }
    return DB.getWorkoutPlans();
  }

  async getWorkoutPlanById(id: string): Promise<WorkoutPlan | null> {
    if (USE_REMOTE_API) {
      try {
        const response = await apiService.getWorkoutPlanById(id);
        return response.success ? response.data || null : null;
      } catch (error) {
        console.error('Failed to fetch workout plan from API, falling back to localStorage:', error);
        return DB.getWorkoutPlanById(id);
      }
    }
    return DB.getWorkoutPlanById(id);
  }

  async getWorkoutPlansByUserId(userId: string): Promise<WorkoutPlan[]> {
    const plans = await this.getWorkoutPlans();
    return plans.filter(plan => plan.userId === userId);
  }

  async saveWorkoutPlan(plan: WorkoutPlan): Promise<boolean> {
    if (USE_REMOTE_API) {
      try {
        const existingPlan = await this.getWorkoutPlanById(plan.id);
        const response = existingPlan 
          ? await apiService.updateWorkoutPlan(plan.id, plan)
          : await apiService.createWorkoutPlan(plan);
        
        if (response.success) {
          // Aggiorna anche localStorage come cache
          DB.saveWorkoutPlan(plan);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to save workout plan to API, falling back to localStorage:', error);
        DB.saveWorkoutPlan(plan);
        return true;
      }
    }
    DB.saveWorkoutPlan(plan);
    return true;
  }

  async deleteWorkoutPlan(planId: string): Promise<boolean> {
    if (USE_REMOTE_API) {
      try {
        const response = await apiService.deleteWorkoutPlan(planId);
        if (response.success) {
          // Aggiorna anche localStorage come cache
          DB.deleteWorkoutPlan(planId);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to delete workout plan from API, falling back to localStorage:', error);
        DB.deleteWorkoutPlan(planId);
        return true;
      }
    }
    DB.deleteWorkoutPlan(planId);
    return true;
  }

  // Workout Folders
  async getWorkoutFolders(): Promise<WorkoutFolder[]> {
    if (USE_REMOTE_API) {
      try {
        const response = await apiService.getWorkoutFolders();
        return response.success ? response.data || [] : [];
      } catch (error) {
        console.error('Failed to fetch workout folders from API, falling back to localStorage:', error);
        return DB.getWorkoutFolders();
      }
    }
    return DB.getWorkoutFolders();
  }

  async saveWorkoutFolder(folder: WorkoutFolder): Promise<boolean> {
    if (USE_REMOTE_API) {
      try {
        const existingFolder = DB.getWorkoutFolderById(folder.id);
        const response = existingFolder 
          ? await apiService.updateWorkoutFolder(folder.id, folder)
          : await apiService.createWorkoutFolder(folder);
        
        if (response.success) {
          // Aggiorna anche localStorage come cache
          DB.saveWorkoutFolder(folder);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to save workout folder to API, falling back to localStorage:', error);
        DB.saveWorkoutFolder(folder);
        return true;
      }
    }
    DB.saveWorkoutFolder(folder);
    return true;
  }

  async deleteWorkoutFolder(folderId: string): Promise<boolean> {
    if (USE_REMOTE_API) {
      try {
        const response = await apiService.deleteWorkoutFolder(folderId);
        if (response.success) {
          // Aggiorna anche localStorage come cache
          DB.deleteWorkoutFolder(folderId);
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to delete workout folder from API, falling back to localStorage:', error);
        DB.deleteWorkoutFolder(folderId);
        return true;
      }
    }
    DB.deleteWorkoutFolder(folderId);
    return true;
  }

  // Authentication
  async verifyCredentials(email: string, password: string): Promise<{ user: User | null, success: boolean, message: string }> {
    if (USE_REMOTE_API) {
      try {
        const response = await apiService.login(email, password);
        if (response.success && response.data) {
          return {
            user: response.data.user,
            success: true,
            message: 'Login successful'
          };
        }
        return {
          user: null,
          success: false,
          message: response.error || 'Login failed'
        };
      } catch (error) {
        console.error('Failed to verify credentials with API, falling back to localStorage:', error);
        return DB.verifyCredentials(email, password);
      }
    }
    return DB.verifyCredentials(email, password);
  }

  // Metodi di utilità che rimangono locali
  validateEmail = DB.validateEmail;
  validatePassword = DB.validatePassword;
  validateBirthDate = DB.validateBirthDate;
  validateFiscalCode = DB.validateFiscalCode;
  validateBirthPlace = DB.validateBirthPlace;
  validateAddress = DB.validateAddress;
  validateRegistrationFields = DB.validateRegistrationFields;
  initializeDatabase = DB.initializeDatabase;
  
  // Metodi per gestire sessioni e preferenze (rimangono locali)
  saveCookiePreferences = DB.saveCookiePreferences;
  getCookiePreferences = DB.getCookiePreferences;
  setAutoLogin = DB.setAutoLogin;
  getAutoLogin = DB.getAutoLogin;
  clearAutoLogin = DB.clearAutoLogin;
  getCurrentIP = DB.getCurrentIP;
  setUserIP = DB.setUserIP;
  checkIPSession = DB.checkIPSession;
  clearSessionOnIPChange = DB.clearSessionOnIPChange;
  requestPasswordReset = DB.requestPasswordReset;

  // Metodi derivati
  async getWorkoutPlansByFolderId(folderId?: string): Promise<WorkoutPlan[]> {
    const plans = await this.getWorkoutPlans();
    return plans.filter(plan => plan.folderId === folderId);
  }

  async getSubfolders(parentId?: string): Promise<WorkoutFolder[]> {
    const folders = await this.getWorkoutFolders();
    return folders.filter(folder => folder.parentId === parentId);
  }

  getWorkoutFolderById(id: string): WorkoutFolder | null {
    return DB.getWorkoutFolderById(id);
  }

  // Metodi per subscriptions (rimangono locali per ora)
  getSubscriptions = DB.getSubscriptions;
  getSubscriptionById = DB.getSubscriptionById;
  saveSubscription = DB.saveSubscription;
}

export const hybridDB = new HybridDatabase();
export default hybridDB;