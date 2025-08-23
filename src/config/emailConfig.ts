// Configurazione EmailJS
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
  return !!(config.serviceId && config.templateId && config.publicKey);
}

// Funzione per ottenere la configurazione dalle variabili d'ambiente o default
export function getEmailConfig(): EmailJSConfig {
  // In produzione, queste dovrebbero venire da variabili d'ambiente
  return {
    serviceId: import.meta.env.VITE_EMAILJS_SERVICE_ID || defaultEmailConfig.serviceId,
    templateId: import.meta.env.VITE_EMAILJS_TEMPLATE_ID || defaultEmailConfig.templateId,
    publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY || defaultEmailConfig.publicKey
  };
}