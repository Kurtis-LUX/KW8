// Configurazione centralizzata delle variabili d'ambiente
// Gestisce fallback e validazione per client e server

export interface EnvConfig {
  // Google OAuth
  googleClientId: string;
  
  // API URLs
  apiBaseUrl: string;
  frontendUrl: string;
  
  // Environment
  isDevelopment: boolean;
  isProduction: boolean;
  
  // EmailJS (opzionale)
  emailJs?: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
}

// Funzione per rilevare l'ambiente
function detectEnvironment() {
  if (typeof window === 'undefined') {
    // Server-side
    return {
      isDevelopment: process.env.NODE_ENV === 'development',
      isProduction: process.env.NODE_ENV === 'production'
    };
  }
  
  // Client-side
  return {
    isDevelopment: import.meta.env.DEV,
    isProduction: import.meta.env.PROD
  };
}

// Funzione per ottenere l'URL base dell'API
function getApiBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/api` : 'https://palestra-kw8.web.app/api';
  }
  
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  
  // SEMPRE usa l'API locale quando siamo su localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    console.log('🏠 Ambiente locale rilevato, usando API locale');
    return 'http://localhost:3001/api';
  }
  
  // In sviluppo con Vite, forza sempre l'uso del server locale
  if (import.meta.env.DEV) {
    console.log('🔧 Modalità development rilevata, usando API locale');
    return 'http://localhost:3001/api';
  }
  
  // Se siamo su Firebase Hosting, usa l'URL corrente del deployment
  if (hostname.includes('web.app') || hostname.includes('firebaseapp.com')) {
    console.log('🔥 Ambiente Firebase rilevato, usando API di produzione');
    return `${protocol}//${hostname}/api`;
  }
  
  // Se siamo su dominio kw8 personalizzato
  if (hostname.includes('kw8')) {
    console.log('🌐 Dominio KW8 rilevato, usando API di produzione');
    return `${protocol}//${hostname}/api`;
  }
  
  // Fallback: se non siamo sicuri, usa locale per development
  const isProduction = import.meta.env.PROD;
  const apiUrl = isProduction 
    ? `${protocol}//${hostname}/api`
    : 'http://localhost:3001/api';
  
  console.log(`🔄 Fallback API URL: ${apiUrl} (production: ${isProduction})`);
  return apiUrl;
}

// Funzione per ottenere il Google Client ID con fallback
function getGoogleClientId(): string {
  if (typeof window === 'undefined') {
    // Server-side: usa le variabili d'ambiente del server
    return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
  }
  
  // Client-side: usa le variabili d'ambiente di Vite
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  
  if (!clientId) {
    console.error('❌ Google Client ID non configurato!');
    console.error('Assicurati che VITE_GOOGLE_CLIENT_ID sia configurato in:');
    console.error('- File .env.local per sviluppo locale');
    console.error('- Firebase Environment Variables per produzione');
  }
  
  return clientId || '';
}

// Funzione per ottenere l'URL del frontend
function getFrontendUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side
    return process.env.FRONTEND_URL || 'https://palestra-kw8.web.app';
  }
  
  // Client-side
  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const port = window.location.port;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return port ? `${protocol}//${hostname}:${port}` : `${protocol}//${hostname}`;
  }
  
  return `${protocol}//${hostname}`;
}

// Funzione per validare la configurazione
function validateConfig(config: EnvConfig): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.googleClientId) {
    errors.push('Google Client ID mancante (VITE_GOOGLE_CLIENT_ID)');
  }
  
  if (!config.apiBaseUrl) {
    errors.push('API Base URL non configurato');
  }
  
  if (!config.frontendUrl) {
    errors.push('Frontend URL non configurato');
  }
  
  // Validazione formato Google Client ID
  if (config.googleClientId && !config.googleClientId.includes('.apps.googleusercontent.com')) {
    errors.push('Formato Google Client ID non valido (deve terminare con .apps.googleusercontent.com)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Configurazione principale
export function getEnvConfig(): EnvConfig {
  const env = detectEnvironment();
  
  const config: EnvConfig = {
    googleClientId: getGoogleClientId(),
    apiBaseUrl: getApiBaseUrl(),
    frontendUrl: getFrontendUrl(),
    isDevelopment: env.isDevelopment,
    isProduction: env.isProduction,
    
    // EmailJS (opzionale)
    emailJs: {
      serviceId: typeof window !== 'undefined' 
        ? (import.meta.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_EMAILJS_SERVICE_ID')
        : (process.env.VITE_EMAILJS_SERVICE_ID || 'YOUR_EMAILJS_SERVICE_ID'),
      templateId: typeof window !== 'undefined'
        ? (import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_EMAILJS_TEMPLATE_ID')
        : (process.env.VITE_EMAILJS_TEMPLATE_ID || 'YOUR_EMAILJS_TEMPLATE_ID'),
      publicKey: typeof window !== 'undefined'
        ? (import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_EMAILJS_PUBLIC_KEY')
        : (process.env.VITE_EMAILJS_PUBLIC_KEY || 'YOUR_EMAILJS_PUBLIC_KEY')
    }
  };
  
  // Validazione configurazione
  const validation = validateConfig(config);
  if (!validation.isValid) {
    console.error('❌ Errori di configurazione:', validation.errors);
    
    // In sviluppo, mostra errori dettagliati
    if (config.isDevelopment) {
      console.error('🔧 Guida alla risoluzione:');
      console.error('1. Crea un file .env.local nella root del progetto');
      console.error('2. Aggiungi: VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com');
      console.error('3. Riavvia il server di sviluppo');
    }
    
    // In produzione, mostra errori per Firebase
    if (config.isProduction) {
      console.error('🔥 Configurazione Firebase:');
      console.error('1. Usa firebase functions:config:set per impostare le variabili');
      console.error('2. Aggiungi VITE_GOOGLE_CLIENT_ID nelle variabili di ambiente');
      console.error('3. Rideploy il progetto con firebase deploy');
    }
  }
  
  return config;
}

// Esporta configurazione singleton
export const envConfig = getEnvConfig();

// Utility per debug
export function debugEnvConfig(): void {
  console.group('🔍 Configurazione Ambiente');
  console.log('Environment:', envConfig.isDevelopment ? 'Development' : 'Production');
  console.log('API Base URL:', envConfig.apiBaseUrl);
  console.log('Frontend URL:', envConfig.frontendUrl);
  console.log('Google Client ID:', envConfig.googleClientId ? '✅ Configurato' : '❌ Mancante');
  
  if (typeof window !== 'undefined') {
    console.log('Variabili Vite disponibili:');
    console.log('- VITE_GOOGLE_CLIENT_ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID ? '✅' : '❌');
    console.log('- VITE_EMAILJS_SERVICE_ID:', import.meta.env.VITE_EMAILJS_SERVICE_ID ? '✅' : '❌');
  }
  
  console.groupEnd();
}

// Funzione per verificare se tutte le variabili critiche sono configurate
export function checkCriticalEnvVars(): boolean {
  const validation = validateConfig(envConfig);
  
  if (!validation.isValid) {
    console.error('❌ Variabili d\'ambiente critiche mancanti:', validation.errors);
    return false;
  }
  
  console.log('✅ Tutte le variabili d\'ambiente critiche sono configurate');
  return true;
}