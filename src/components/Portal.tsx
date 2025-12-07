import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
}

const Portal: React.FC<PortalProps> = ({ children, containerId = 'portal-root' }) => {
  const [container, setContainer] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null;
    // Usa immediatamente document.body come fallback per evitare il primo render "vuoto"
    return document.getElementById(containerId) || document.body;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    let portalContainer = document.getElementById(containerId);

    // Se non esiste, crealo subito per garantire che il prossimo render sia nel container dedicato
    if (!portalContainer) {
      portalContainer = document.createElement('div');
      portalContainer.id = containerId;
      portalContainer.style.position = 'relative';
      portalContainer.style.zIndex = '9999';
      document.body.appendChild(portalContainer);
    }

    // Aggiorna il container a quello dedicato (se prima era body)
    setContainer(portalContainer);

    // Cleanup: rimuovi il container solo se è vuoto
    return () => {
      if (
        portalContainer &&
        portalContainer !== document.body &&
        portalContainer.children.length === 0 &&
        portalContainer.parentNode === document.body
      ) {
        document.body.removeChild(portalContainer);
      }
    };
  }, [containerId]);

  if (!container) return null;
  return createPortal(children, container);
};

export default Portal;
