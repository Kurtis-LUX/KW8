import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Polyfill per browser più vecchi
if (!window.Promise) {
  console.warn('⚠️ Promise not supported, loading polyfill');
}

// Debug logging for mobile - ENHANCED
console.log('🚀 Main.tsx loaded');
console.log('📱 User Agent:', navigator.userAgent);
console.log('🌐 Window size:', window.innerWidth, 'x', window.innerHeight);
console.log('🔍 Document ready state:', document.readyState);
console.log('🎯 Root element exists:', !!document.getElementById('root'));
console.log('💾 LocalStorage available:', typeof Storage !== 'undefined' && typeof localStorage !== 'undefined');
console.log('🔧 IndexedDB available:', typeof indexedDB !== 'undefined');
console.log('🌐 Fetch available:', typeof fetch !== 'undefined');
console.log('⚡ ES6 support:', typeof Symbol !== 'undefined');

// Timeout per il caricamento dell'app
const APP_LOAD_TIMEOUT = 10000; // 10 secondi
let appLoadTimer: NodeJS.Timeout;

// Fallback per dispositivi mobili con timeout
const initializeApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error('❌ Root element not found!');
      showErrorFallback('Elemento root non trovato. Ricarica la pagina.');
      return;
    }
    
    console.log('✅ Root element found, creating React app');
    
    // Imposta timeout per il caricamento
    appLoadTimer = setTimeout(() => {
      console.warn('⚠️ App load timeout reached');
      showErrorFallback('Caricamento lento. Controlla la connessione e ricarica.');
    }, APP_LOAD_TIMEOUT);
    
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
    
    console.log('✅ React app rendered successfully');
    
    // Cancella il timeout se l'app si carica correttamente
    clearTimeout(appLoadTimer);
    
    // Nascondi il fallback di caricamento
    const fallback = document.getElementById('loading-fallback');
    if (fallback) {
      fallback.style.display = 'none';
      console.log('✅ Loading fallback hidden');
    }
  } catch (error) {
    console.error('❌ Critical error in main.tsx:', error);
    clearTimeout(appLoadTimer);
    showErrorFallback(`Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}`);
  }
};

// Funzione per mostrare errori in modo consistente
const showErrorFallback = (message: string) => {
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial; background: #f5f5f5; min-height: 100vh;">
      <h1 style="color: #d32f2f;">Errore di Caricamento</h1>
      <p>Si è verificato un errore durante il caricamento dell'applicazione.</p>
      <p style="font-size: 14px; color: #666;">${message}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer; margin: 10px;">Ricarica Pagina</button>
      <br>
      <a href="/test-mobile.html" style="color: #1976d2; text-decoration: none; font-size: 14px;">Test Mobile Debug</a>
    </div>
  `;
};

// Aspetta che il DOM sia pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Temporarily disable service worker for debugging
// Register service worker for PWA
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}
*/
