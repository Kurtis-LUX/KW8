// Configurazione EmailJS
export interface EmailJSConfig {
  serviceId: string;
  templateId: string;
  publicKey: string;
}

// Configurazione di default (da sostituire con credenziali valide)
export const defaultEmailConfig: EmailJSConfig = {
  serviceId: 'service_kw8gym',
  templateId: 'template_newsletter', 
  publicKey: 'LaN_cQnKCCBeoS2FW'
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