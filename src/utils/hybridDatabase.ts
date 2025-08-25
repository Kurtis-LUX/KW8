// Database ibrido che supporta sia localStorage che API remote
import { apiService } from '../services/api';
import DB, { WorkoutPlan, WorkoutFolder } from './database';

const USE_REMOTE_API = process.env.NODE_ENV === 'production';

class HybridDatabase {
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
  // Database initialization
  initializeDatabase = DB.initializeDatabase;

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
}

export const hybridDB = new HybridDatabase();
export default hybridDB;