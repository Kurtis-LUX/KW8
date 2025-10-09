import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';

interface Position {
  top: number;
  left: number;
  right?: number;
  bottom?: number;
}

interface UseDropdownPositionOptions {
  offset?: number;
  preferredPosition?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoAdjust?: boolean;
}

interface UseDropdownPositionReturn {
  position: Position | null;
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement>;
  dropdownRef: React.RefObject<HTMLElement>;
  openDropdown: (event?: React.MouseEvent) => void;
  closeDropdown: () => void;
  toggleDropdown: (event?: React.MouseEvent) => void;
}

export const useDropdownPosition = ({
  offset = 8,
  preferredPosition = 'bottom-right',
  autoAdjust = true
}: UseDropdownPositionOptions = {}): UseDropdownPositionReturn => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const dropdownRef = useRef<HTMLElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !dropdownRef.current) return;

    // Forza un reflow per assicurarsi che i valori siano aggiornati su mobile
    triggerRef.current.offsetHeight;
    
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Su mobile, usa document.documentElement.scrollTop/Left per maggiore affidabilità
    const isMobile = window.innerWidth <= 768;
    
    // Su mobile, non aggiungere scroll perché usiamo position: fixed
    // che è relativo al viewport, non al documento
    const scrollX = 0;
    const scrollY = 0;

    let top = 0;
    let left = 0;
    let right: number | undefined;
    let bottom: number | undefined;

    // Calcola la posizione iniziale basata sulla preferenza
    // Su mobile, forza sempre il posizionamento sotto l'icona per una migliore UX
    if (isMobile) {
      switch (preferredPosition) {
        case 'bottom-right':
        case 'top-right':
          top = triggerRect.bottom + offset;
          // Su mobile, allinea il dropdown al bordo destro del trigger per evitare overflow
          left = Math.max(8, triggerRect.right - dropdownRect.width);
          break;
        case 'bottom-left':
        case 'top-left':
          top = triggerRect.bottom + offset;
          left = triggerRect.left;
          break;
      }
    } else {
      // Desktop: usa coordinate viewport (position: fixed)
      switch (preferredPosition) {
        case 'bottom-right':
          top = triggerRect.bottom + offset;
          left = triggerRect.right - dropdownRect.width;
          break;
        case 'bottom-left':
          top = triggerRect.bottom + offset;
          left = triggerRect.left;
          break;
        case 'top-right':
          top = triggerRect.top - dropdownRect.height - offset;
          left = triggerRect.right - dropdownRect.width;
          break;
        case 'top-left':
          top = triggerRect.top - dropdownRect.height - offset;
          left = triggerRect.left;
          break;
      }
    }

    // Auto-adjust se abilitato
    if (autoAdjust) {
      // Margini più generosi su mobile per evitare che il dropdown tocchi i bordi
      const horizontalMargin = isMobile ? 16 : 8;
      const verticalMargin = isMobile ? 16 : 8;
      
      // Con position: fixed, usa coordinate viewport-relative per i controlli
      const checkScrollX = 0;
      const checkScrollY = 0;
      
      // Controlla se il dropdown esce dal viewport orizzontalmente
      if (left < checkScrollX) {
        left = checkScrollX + horizontalMargin;
      } else if (left + dropdownRect.width > checkScrollX + viewportWidth) {
        left = checkScrollX + viewportWidth - dropdownRect.width - horizontalMargin;
      }

      // Controlla se il dropdown esce dal viewport verticalmente
      if (top < checkScrollY) {
        // Se non c'è spazio sopra, posiziona sotto
        top = triggerRect.bottom + offset;
      } else if (top + dropdownRect.height > checkScrollY + viewportHeight) {
        // Se non c'è spazio sotto, posiziona sopra
        top = triggerRect.top - dropdownRect.height - offset;
        
        // Se ancora non c'è spazio, posiziona al centro del viewport con margini
        if (top < checkScrollY) {
          top = checkScrollY + verticalMargin;
          // Su mobile, assicurati che il dropdown non sia troppo alto
          if (isMobile && dropdownRect.height > viewportHeight - (verticalMargin * 2)) {
            top = checkScrollY + (viewportHeight - dropdownRect.height) / 2;
          }
        }
      }
      
      // Su mobile, assicurati che il dropdown non vada mai sotto la fold
      if (isMobile && top + dropdownRect.height > checkScrollY + viewportHeight) {
        top = checkScrollY + viewportHeight - dropdownRect.height - verticalMargin;
      }
    }

    setPosition({ top, left, right, bottom });
  }, [offset, preferredPosition, autoAdjust]);

  const openDropdown = useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    setIsOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setPosition(null);
  }, []);

  const toggleDropdown = useCallback((event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown(event);
    }
  }, [isOpen, openDropdown, closeDropdown]);

  // Calcola la posizione quando il dropdown si apre in modo affidabile anche con Portal
  useLayoutEffect(() => {
    if (!isOpen) return;

    let attempts = 0;
    let rafId: number | null = null;
    let timeoutId: number | null = null;

    const tryCalc = () => {
      attempts++;
      if (triggerRef.current && dropdownRef.current) {
        // Assicura che il dropdown sia stato renderizzato con dimensioni misurabili
        const hasSize = dropdownRef.current.offsetWidth > 0 || dropdownRef.current.offsetHeight > 0;
        if (hasSize) {
          calculatePosition();
          cleanup();
          return;
        }
      }
      if (attempts < 6) {
        rafId = requestAnimationFrame(tryCalc);
      } else {
        // Fallback: prova comunque a calcolare
        timeoutId = window.setTimeout(calculatePosition, 0);
      }
    };

    const cleanup = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (timeoutId !== null) clearTimeout(timeoutId);
    };

    rafId = requestAnimationFrame(tryCalc);
    return () => cleanup();
  }, [isOpen, calculatePosition]);

  // Ricalcola la posizione quando la finestra viene ridimensionata o si fa scroll
  useEffect(() => {
    if (!isOpen) return;

    let timeoutId: NodeJS.Timeout;
    const isMobile = window.innerWidth <= 768;
    
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(calculatePosition, isMobile ? 100 : 50);
    };
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      // Su mobile, usa un debounce più aggressivo per evitare calcoli troppo frequenti
      timeoutId = setTimeout(calculatePosition, isMobile ? 150 : 16);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);
    
    // Su mobile, aggiungi anche listener per orientationchange
    if (isMobile) {
      window.addEventListener('orientationchange', handleResize);
    }

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
      if (isMobile) {
        window.removeEventListener('orientationchange', handleResize);
      }
    };
  }, [isOpen, calculatePosition]);

  // Chiude il dropdown quando si clicca fuori
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        dropdownRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeDropdown]);

  return {
    position,
    isOpen,
    triggerRef,
    dropdownRef,
    openDropdown,
    closeDropdown,
    toggleDropdown
  };
};