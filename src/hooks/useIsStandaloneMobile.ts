import { useEffect, useState } from 'react';

/**
 * Rileva se l'app è eseguita in modalità PWA "standalone" e su dispositivo mobile/tablet.
 * - iOS Safari: usa `navigator.standalone`
 * - Altri: usa `matchMedia('(display-mode: standalone)')`
 * - Mobile/Tablet: larghezza viewport <= 1024px
 */
export default function useIsStandaloneMobile() {
  const [isStandaloneMobile, setIsStandaloneMobile] = useState(false);

  useEffect(() => {
    const detect = () => {
      const isIOSStandalone = (typeof navigator !== 'undefined' && (navigator as any).standalone === true);
      const isDisplayModeStandalone = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(display-mode: standalone)').matches;
      const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const forcedParam = urlParams?.get('bottomnav');
      const isForced = forcedParam === '1'; // forza solo via query param, non persistente
      const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth <= 1024;
      // Se forzato via query/localStorage, considera standalone indipendentemente dalla larghezza.
      // Altrimenti, applica il gating mobile/tablet.
      const baseStandalone = (isIOSStandalone || isDisplayModeStandalone);
      // Forzato richiede comunque viewport mobile/tablet
      const result = (isForced || baseStandalone) && isMobileOrTablet;
      setIsStandaloneMobile(result);
    };

    detect();
    window.addEventListener('resize', detect);
    return () => window.removeEventListener('resize', detect);
  }, []);

  return isStandaloneMobile;
}
