// Configurazione EmailJS
import { envConfig } from './envConfig';

export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

// Configurazione di default (placeholder - configurare tramite variabili d'ambiente)
export const defaultEmailConfig: EmailJSConfig = {
  serviceId: 'YOUR_EMAILJS_SERVICE_ID',
  templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
  publicKey: 'YOUR_EMAILJS_PUBLIC_KEY'
};

// Funzione per validare la configurazione
export function validateEmailConfig(config: EmailJSConfig): boolean {
  return !!(config.serviceId && config.templateId && config.publicKey &&
    config.serviceId !== 'YOUR_EMAILJS_SERVICE_ID' &&
    config.templateId !== 'YOUR_EMAILJS_TEMPLATE_ID' &&
    config.publicKey !== 'YOUR_EMAILJS_PUBLIC_KEY');
}

// Funzione per ottenere la configurazione dalle variabili d'ambiente o default
export function getEmailConfig(): EmailJSConfig {
  // Usa la configurazione centralizzata
  return envConfig.emailJs || defaultEmailConfig;
}

// Funzione per verificare se EmailJS è configurato correttamente
export function isEmailJSConfigured(): boolean {
  const config = getEmailConfig();
  const isValid = validateEmailConfig(config);
  
  if (!isValid) {
    console.warn('⚠️ EmailJS non configurato correttamente');
    console.warn('Aggiungi le seguenti variabili d\'ambiente:');
    console.warn('- VITE_EMAILJS_SERVICE_ID');
    console.warn('- VITE_EMAILJS_TEMPLATE_ID');
    console.warn('- VITE_EMAILJS_PUBLIC_KEY');
  }
  
  return isValid;
}