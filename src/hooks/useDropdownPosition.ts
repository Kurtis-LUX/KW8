import { useState, useEffect, useRef, useCallback } from 'react';

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
      // Desktop: usa scroll normale
      const scrollX = window.scrollX;
      const scrollY = window.scrollY;
      
      switch (preferredPosition) {
        case 'bottom-right':
          top = triggerRect.bottom + scrollY + offset;
          left = triggerRect.right + scrollX - dropdownRect.width;
          break;
        case 'bottom-left':
          top = triggerRect.bottom + scrollY + offset;
          left = triggerRect.left + scrollX;
          break;
        case 'top-right':
          top = triggerRect.top + scrollY - dropdownRect.height - offset;
          left = triggerRect.right + scrollX - dropdownRect.width;
          break;
        case 'top-left':
          top = triggerRect.top + scrollY - dropdownRect.height - offset;
          left = triggerRect.left + scrollX;
          break;
      }
    }

    // Auto-adjust se abilitato
    if (autoAdjust) {
      // Margini più generosi su mobile per evitare che il dropdown tocchi i bordi
      const horizontalMargin = isMobile ? 16 : 8;
      const verticalMargin = isMobile ? 16 : 8;
      
      // Su mobile, usa coordinate viewport-relative per i controlli
      const checkScrollX = isMobile ? 0 : (window.scrollX || 0);
      const checkScrollY = isMobile ? 0 : (window.scrollY || 0);
      
      // Controlla se il dropdown esce dal viewport orizzontalmente
      if (left < checkScrollX) {
        left = checkScrollX + horizontalMargin;
      } else if (left + dropdownRect.width > checkScrollX + viewportWidth) {
        left = checkScrollX + viewportWidth - dropdownRect.width - horizontalMargin;
      }

      // Controlla se il dropdown esce dal viewport verticalmente
      if (top < checkScrollY) {
        // Se non c'è spazio sopra, posiziona sotto
        top = (isMobile ? triggerRect.bottom : triggerRect.bottom + (window.scrollY || 0)) + offset;
      } else if (top + dropdownRect.height > checkScrollY + viewportHeight) {
        // Se non c'è spazio sotto, posiziona sopra
        top = (isMobile ? triggerRect.top : triggerRect.top + (window.scrollY || 0)) - dropdownRect.height - offset;
        
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

  // Calcola la posizione quando il dropdown si apre
  useEffect(() => {
    if (isOpen) {
      // Usa setTimeout per assicurarsi che il DOM sia aggiornato
      const timer = setTimeout(calculatePosition, 0);
      return () => clearTimeout(timer);
    }
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