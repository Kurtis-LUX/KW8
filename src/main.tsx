import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

// Debug logging for mobile - ENHANCED
console.log('🚀 Main.tsx loaded');
console.log('📱 User Agent:', navigator.userAgent);
console.log('🌐 Window size:', window.innerWidth, 'x', window.innerHeight);
console.log('🔍 Document ready state:', document.readyState);
console.log('🎯 Root element exists:', !!document.getElementById('root'));

// Fallback per dispositivi mobili
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('❌ Root element not found!');
    document.body.innerHTML = '<div style="padding: 20px; text-align: center; font-family: Arial;"><h1>Errore di caricamento</h1><p>Elemento root non trovato. Ricarica la pagina.</p></div>';
  } else {
    console.log('✅ Root element found, creating React app');
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>
    );
    console.log('✅ React app rendered successfully');
    
    // Nascondi il fallback di caricamento
    const fallback = document.getElementById('loading-fallback');
    if (fallback) {
      fallback.style.display = 'none';
      console.log('✅ Loading fallback hidden');
    }
  }
} catch (error) {
  console.error('❌ Critical error in main.tsx:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial; background: #f5f5f5; min-height: 100vh;">
      <h1 style="color: #d32f2f;">Errore di Caricamento</h1>
      <p>Si è verificato un errore durante il caricamento dell'applicazione.</p>
      <p style="font-size: 14px; color: #666;">Errore: ${error instanceof Error ? error.message : 'Errore sconosciuto'}</p>
      <button onclick="window.location.reload()" style="padding: 10px 20px; background: #1976d2; color: white; border: none; border-radius: 4px; cursor: pointer;">Ricarica Pagina</button>
    </div>
  `;
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
