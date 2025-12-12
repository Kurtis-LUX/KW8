import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
  children: React.ReactNode;
  containerId?: string;
  // Se true (default), crea automaticamente il container mancante in body.
  // Se false, aspetta che il container venga montato altrove (es. Header)
  // e si collega dinamicamente quando appare nel DOM.
  createIfMissing?: boolean;
}

const Portal: React.FC<PortalProps> = ({ children, containerId = 'portal-root', createIfMissing = true }) => {
  const [container, setContainer] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null;
    // Usa immediatamente document.body come fallback per evitare il primo render "vuoto"
    const existing = document.getElementById(containerId);
    if (existing) return existing;
    return createIfMissing ? document.body : null;
  });

  useEffect(() => {
    if (typeof document === 'undefined') return;

    let portalContainer = document.getElementById(containerId);
    let observer: MutationObserver | null = null;

    // Se non esiste, crealo subito per garantire che il prossimo render sia nel container dedicato
    if (!portalContainer) {
      if (createIfMissing) {
        portalContainer = document.createElement('div');
        portalContainer.id = containerId;
        portalContainer.style.position = 'relative';
        portalContainer.style.zIndex = '9999';
        document.body.appendChild(portalContainer);
      } else {
        // Osserva il DOM per collegarsi quando il container viene montato
        observer = new MutationObserver(() => {
          const found = document.getElementById(containerId);
          if (found) {
            setContainer(found);
            if (observer) observer.disconnect();
          }
        });
        observer.observe(document.body, { childList: true, subtree: true });
      }
    }

    // Aggiorna il container a quello dedicato (se prima era body)
    if (portalContainer) setContainer(portalContainer);

    // Cleanup: rimuovi il container solo se è vuoto
    return () => {
      if (createIfMissing) {
        if (
          portalContainer &&
          portalContainer !== document.body &&
          portalContainer.children.length === 0 &&
          portalContainer.parentNode === document.body
        ) {
          document.body.removeChild(portalContainer);
        }
      }
      if (observer) observer.disconnect();
    };
  }, [containerId, createIfMissing]);

  if (!container) return null;
  return createPortal(children, container);
};

export default Portal;
