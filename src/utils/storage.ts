import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import app from '../config/firebase';

/**
 * Carica un'immagine su Firebase Storage
 * @param file Il file da caricare
 * @param path Il percorso in cui salvare il file
 * @returns L'URL dell'immagine caricata
 */
export const uploadImage = async (file: File, path: string): Promise<string> => {
  const storage = getStorage(app);
  
  try {
    // Crea un riferimento al file
    const storageRef = ref(storage, path);
    
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
};

/**
 * Elimina un'immagine da Firebase Storage
 * @param url L'URL dell'immagine da eliminare
 */
export const deleteImage = async (url: string): Promise<void> => {
  const storage = getStorage(app);
  
  try {
    // Estrai il path dall'URL
    const path = extractPathFromUrl(url);
    if (!path) {
      console.warn('⚠️ Cannot extract path from URL:', url);
      return;
    }

    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    
    console.log('✅ Image deleted successfully:', url);
  } catch (error) {
    console.error('❌ Error deleting image:', error);
    // Non lanciare l'errore per non bloccare altre operazioni
  }
};

/**
 * Estrae il percorso da un URL di Firebase Storage
 * @private
 */
const extractPathFromUrl = (url: string): string | null => {
  try {
    // Formato URL Firebase Storage: https://firebasestorage.googleapis.com/v0/b/[bucket]/o/[path]?[token]
    const match = url.match(/firebasestorage\.googleapis\.com\/v0\/b\/[^\/]+\/o\/([^?]+)/);
    if (match && match[1]) {
      return decodeURIComponent(match[1]);
    }
    return null;
  } catch (error) {
    console.error('Error extracting path from URL:', error);
    return null;
  }
};