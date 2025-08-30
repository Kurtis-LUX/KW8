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

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const dropdownRect = dropdownRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    let top = 0;
    let left = 0;
    let right: number | undefined;
    let bottom: number | undefined;

    // Calcola la posizione iniziale basata sulla preferenza
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

    // Auto-adjust se abilitato
    if (autoAdjust) {
      // Controlla se il dropdown esce dal viewport orizzontalmente
      if (left < scrollX) {
        left = scrollX + 8; // Margine dal bordo sinistro
      } else if (left + dropdownRect.width > scrollX + viewportWidth) {
        left = scrollX + viewportWidth - dropdownRect.width - 8; // Margine dal bordo destro
      }

      // Controlla se il dropdown esce dal viewport verticalmente
      if (top < scrollY) {
        // Se non c'è spazio sopra, posiziona sotto
        top = triggerRect.bottom + scrollY + offset;
      } else if (top + dropdownRect.height > scrollY + viewportHeight) {
        // Se non c'è spazio sotto, posiziona sopra
        top = triggerRect.top + scrollY - dropdownRect.height - offset;
        
        // Se ancora non c'è spazio, posiziona al centro del viewport
        if (top < scrollY) {
          top = scrollY + (viewportHeight - dropdownRect.height) / 2;
        }
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

    const handleResize = () => calculatePosition();
    const handleScroll = () => calculatePosition();

    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
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