import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import app from '../config/firebase';

class StorageService {
  private storage = getStorage(app);
  private isStorageEnabled = true;

  constructor() {
    // Verifica se Firebase Storage è configurato correttamente
    try {
      if (!this.storage) {
        this.isStorageEnabled = false;
        console.warn('⚠️ Firebase Storage not properly configured');
      }
    } catch (error) {
      this.isStorageEnabled = false;
      console.warn('⚠️ Firebase Storage initialization failed:', error);
    }
  }

  /**
   * Carica un'immagine su Firebase Storage
   */
  async uploadImage(file: File, path: string): Promise<string> {
    if (!this.isStorageEnabled) {
      throw new Error('Firebase Storage not available');
    }

    try {
      // Crea un riferimento al file
      const storageRef = ref(this.storage, path);
      
      // Carica il file
      const snapshot = await uploadBytes(storageRef, file);
      
      // Ottieni l'URL di download
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      console.log('✅ Image uploaded successfully:', downloadURL);
      return downloadURL;
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Elimina un'immagine da Firebase Storage
   */
  async deleteImage(url: string): Promise<void> {
    if (!this.isStorageEnabled) {
      console.warn('⚠️ Firebase Storage not available for deletion');
      return;
    }

    try {
      // Estrai il path dall'URL
      const path = this.extractPathFromUrl(url);
      if (!path) {
        console.warn('⚠️ Cannot extract path from URL:', url);
        return;
      }

      const storageRef = ref(this.storage, path);
      await deleteObject(storageRef);
      
      console.log('✅ Image deleted successfully:', url);
    } catch (error) {
      console.error('❌ Error deleting image:', error);
      // Non lanciare l'errore per non bloccare altre operazioni
    }
  }

  /**
   * Carica un'immagine per le aree della palestra
   */
  async uploadGymAreaImage(file: File, areaId: string): Promise<string> {
    const timestamp = Date.now();
    const fileName = `${areaId}_${timestamp}.${file.name.split('.').pop()}`;
    const path = `gym-areas/${fileName}`;
    
    return this.uploadImage(file, path);
  }

  /**
   * Converte un file in Data URL (fallback quando Firebase Storage non è disponibile)
   */
  async fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve(result);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  /**
   * Gestisce l'upload dell'immagine con fallback
   */
  async handleImageUpload(file: File, areaId: string): Promise<string> {
    try {
      // Prova prima con Firebase Storage
      if (this.isStorageEnabled) {
        return await this.uploadGymAreaImage(file, areaId);
      }
    } catch (error) {
      console.warn('⚠️ Firebase Storage upload failed, using Data URL fallback:', error);
    }

    // Fallback a Data URL
    return this.fileToDataUrl(file);
  }

  /**
   * Estrae il path dall'URL di Firebase Storage
   */
  private extractPathFromUrl(url: string): string | null {
    try {
      // URL format: https://firebasestorage.googleapis.com/v0/b/bucket/o/path%2Fto%2Ffile?alt=media&token=...
      const urlObj = new URL(url);
      const pathMatch = urlObj.pathname.match(/\/o\/(.+)/);
      if (pathMatch) {
        return decodeURIComponent(pathMatch[1]);
      }
      return null;
    } catch (error) {
      console.error('Error extracting path from URL:', error);
      return null;
    }
  }

  /**
   * Verifica se un URL è un Data URL
   */
  isDataUrl(url: string): boolean {
    return url.startsWith('data:');
  }

  /**
   * Verifica se Firebase Storage è disponibile
   */
  isAvailable(): boolean {
    return this.isStorageEnabled;
  }
}

// Esporta un'istanza singleton
export const storageService = new StorageService();
export default storageService;