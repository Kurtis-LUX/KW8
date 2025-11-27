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
      const isForced = typeof window !== 'undefined' && /(^|[?&])bottomnav=1([&#]|$)/.test(window.location.search);
      const isMobileOrTablet = typeof window !== 'undefined' && window.innerWidth <= 1024;
      setIsStandaloneMobile(((isIOSStandalone || isDisplayModeStandalone) || isForced) && isMobileOrTablet);
    };

    detect();
    window.addEventListener('resize', detect);
    return () => window.removeEventListener('resize', detect);
  }, []);

  return isStandaloneMobile;
}