import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User as UserIcon, CreditCard, MapPin, Users, FileText, Mail, BookOpen, Globe, Clock, Phone, Dumbbell, Settings, Home, Trophy, Link, BarChart3, User, AlignJustify, LogOut, ChevronLeft, Bell, Search, Plus } from 'lucide-react';
import RulesSection from './RulesSection';

import { useLanguageContext } from '../contexts/LanguageContext';
import IosBottomBar from './ui/IosBottomBar';
import Portal from './Portal';
import useIsStandaloneMobile from '../hooks/useIsStandaloneMobile';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  currentUser?: User | null;
  onLogout?: () => void;
  isDashboard?: boolean;
  currentPage?: string;
  showAuthButtons?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentUser, onLogout, isDashboard = false, currentPage = 'home' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userMenuOrigin, setUserMenuOrigin] = useState<'header' | 'bottom' | null>(null);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const bottomProfileRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const { t, language, setLanguage } = useLanguageContext();
  const isStandaloneMobile = useIsStandaloneMobile();
  const [isBottomVisible, setIsBottomVisible] = useState(true);
  const lastScrollYRef = useRef<number>(0);
  const scrollTickRef = useRef<number | null>(null);
  const [headerOpacity, setHeaderOpacity] = useState(1);
  const [displayText, setDisplayText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const fullText = t.heroTitle;
  const [bottomMenuPos, setBottomMenuPos] = useState<{ top: number; left: number } | null>(null);
  
  // Helper: genera un nome leggibile dall'email se il name non è disponibile
  const deriveNameFromEmail = (email?: string): string => {
    if (!email) return '';
    const local = email.split('@')[0];
    return local
      .replace(/[._-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Aggiungi event listener per lo scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Blocca lo scroll della pagina quando il menu mobile è aperto
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup quando il componente viene smontato
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Header fade-out on scroll (disabilitato in modalità PWA standalone)
  useEffect(() => {
    if (isStandaloneMobile) {
      setHeaderOpacity(1);
      return;
    }
    const onScroll = () => {
      const y = (document.scrollingElement?.scrollTop ?? window.scrollY ?? 0);
      const fadeDistance = 220; // px to fully fade
      const opacity = Math.max(0, Math.min(1, 1 - y / fadeDistance));
      setHeaderOpacity(opacity);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [isStandaloneMobile]);

  // Typing animation for PWA header title
  useEffect(() => {
    if (!(isStandaloneMobile && currentPage === 'pwa-home')) return;
    setDisplayText('');
    setIsTypingComplete(false);
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setDisplayText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setIsTypingComplete(true);
      }
    }, 100);
    return () => clearInterval(typingInterval);
  }, [fullText, isStandaloneMobile, currentPage]);

  // Calcola posizione overlay menu profilo (ancorato al bottone della bottom bar)
  useEffect(() => {
    if (showUserMenu && userMenuOrigin === 'bottom' && bottomProfileRef.current) {
      const rect = bottomProfileRef.current.getBoundingClientRect();
      const overlayWidth = 256; // w-64
      const margin = 8;
      const left = Math.min(Math.max(rect.left, margin), window.innerWidth - overlayWidth - margin);
      const top = rect.top; // verrà traslato verso l'alto via transform
      setBottomMenuPos({ top, left });
    } else {
      setBottomMenuPos(null);
    }
  }, [showUserMenu, userMenuOrigin]);

  // Gestisce i click/touch/pointer esterni per chiudere il menu profilo (affidabile su mobile)
  useEffect(() => {
    const handleOutside = (event: Event) => {
      const target = event.target as Node;
      const clickedInsideHeaderMenu = userMenuRef.current && userMenuRef.current.contains(target);
      const clickedInsideBottomProfile = bottomProfileRef.current && bottomProfileRef.current.contains(target);
      if (!clickedInsideHeaderMenu && !clickedInsideBottomProfile) {
        setShowUserMenu(false);
        setUserMenuOrigin(null);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('pointerdown', handleOutside);
      document.addEventListener('touchstart', handleOutside, { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
    };
  }, [showUserMenu]);

  // Gestisce i click esterni per chiudere il menu ruolo (Coach/Atleta)
  useEffect(() => {
    const handleClickOutsideRole = (event: MouseEvent) => {
      if (roleMenuRef.current && !roleMenuRef.current.contains(event.target as Node)) {
        setShowRoleMenu(false);
      }
    };

    if (showRoleMenu) {
      document.addEventListener('mousedown', handleClickOutsideRole);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutsideRole);
    };
  }, [showRoleMenu]);

  const toggleMenu = () => {
    if (!isMenuOpen) {
      setIsMenuOpen(true);
      setIsClosing(false);
    } else {
      // Avvia subito l'animazione di uscita
      setIsClosing(true);
      setIsMenuOpen(false);
      // Nascondi overlay al termine della transizione
      setTimeout(() => {
        setIsClosing(false);
      }, 300);
    }
  };

  const closeMenuAnimated = () => {
    if (isMenuOpen) {
      // Avvia subito l'animazione di uscita
      setIsClosing(true);
      setIsMenuOpen(false);
      // Nascondi overlay al termine della transizione
      setTimeout(() => {
        setIsClosing(false);
      }, 300);
    } else {
      setIsMenuOpen(false);
    }
  };

  const handleShowRules = () => {
    setShowRulesModal(true);
    closeMenuAnimated();
  };

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it');
    closeMenuAnimated();
  };

  const scrollToSection = (sectionId: string) => {
    // Controlla se l'elemento esiste già nella pagina corrente
    const element = document.getElementById(sectionId);
    
    if (element) {
      // Se l'elemento esiste, fai scroll direttamente senza navigare
      element.scrollIntoView({ behavior: 'smooth' });
      closeMenuAnimated();
    } else if (onNavigate) {
      // Solo se l'elemento non esiste, naviga alla home e poi fai scroll
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      closeMenuAnimated();
    }
  };

  const scrollToFooter = () => {
    // Controlla se il footer esiste già nella pagina corrente
    const footer = document.querySelector('footer');
    
    if (footer) {
      // Se il footer esiste, fai scroll direttamente senza navigare
      footer.scrollIntoView({ behavior: 'smooth' });
      closeMenuAnimated();
    } else if (onNavigate) {
      // Solo se il footer non esiste, naviga alla home e poi fai scroll
      onNavigate('home');
      setTimeout(() => {
        const footer = document.querySelector('footer');
        if (footer) {
          footer.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      closeMenuAnimated();
    }
  };

  const handleNavigation = (page: string) => {
    if (page === 'workouts' && !currentUser) {
      // Reindirizza alla pagina di login coach se l'utente tenta di accedere alle schede senza essere loggato
      if (onNavigate) {
        onNavigate('login');
      }
    } else {
      if (onNavigate) {
        onNavigate(page);
      }
    }
    closeMenuAnimated();
  };

  // Funzione per navigazione con logout (per Menu Home e Dashboard Coach)
  const handleNavigationWithLogout = (page: string) => {
    console.log(`🚪 Navigazione con logout verso: ${page}`);
    
    // Chiudi tutti i menu aperti
    closeMenuAnimated();
    setShowUserMenu(false);
    
    // Se l'utente è loggato, esegui il logout
    if (currentUser && onLogout) {
      onLogout();
    }
    
    // Naviga alla pagina richiesta
    if (onNavigate) {
      onNavigate(page);
    }
    
    // Rimuovi il reload della pagina
    // Aggiorna immediatamente la UI
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log(`✅ Navigazione con logout completata verso: ${page}`);
  };

  const handleLogout = () => {
    console.log('🚪 Header: Logout iniziato');
    
    // Chiudi tutti i menu aperti
    closeMenuAnimated();
    setShowUserMenu(false);
    
    // Esegui il logout tramite la funzione parent
    if (onLogout) {
      onLogout();
    }
    
    // Reindirizza alla home senza reload
    if (onNavigate) {
      onNavigate('home');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('✅ Header: Logout completato');
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleSubscribe = () => {
    scrollToSection('informazioni');
  };

  const handleHeaderClick = (e: React.MouseEvent<HTMLElement>) => {
    // Verifica se il click è sul background dell'header (non su bottoni o elementi interattivi)
    if (e.target === e.currentTarget) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleContactsClick = () => {
    scrollToSection('contatti');
    setTimeout(() => {
      const contactsSection = document.getElementById('contatti');
      if (contactsSection) {
        const hasLinks = contactsSection.querySelector('a[href^="tel:"]') || contactsSection.querySelector('a[href^="mailto:"]');
        if (!hasLinks) {
          const toggleBtn = contactsSection.querySelector('button');
          (toggleBtn as HTMLButtonElement | null)?.click();
        }
      }
    }, 300);
  };

  // Titolo pagina per header mobile quando è presente la bottom nav
  const getMobilePageTitle = (page: string) => {
    switch (page) {
      case 'workout-manager':
        return 'Gestione schede';
      case 'coach-dashboard':
        return 'Dashboard Coach';
      case 'workouts':
        return 'Le tue schede';
      case 'athlete-manager':
        return 'Gestione atleti';
      default:
        return '';
    }
  };

  const isHomePage = currentPage === 'home' || currentPage === '/' || !currentPage;
  const isPwaWorkoutManager = isStandaloneMobile && currentPage === 'workout-manager';
  const [isWorkoutDetailOpen, setIsWorkoutDetailOpen] = React.useState(false);

  // Ascolta apertura/chiusura della scheda (WorkoutDetail) per nascondere azioni header
  React.useEffect(() => {
    const onOpen = () => setIsWorkoutDetailOpen(true);
    const onClose = () => setIsWorkoutDetailOpen(false);
    const onState = (e: Event) => {
      try {
        const ce = e as CustomEvent;
        if (ce && ce.detail && typeof ce.detail.open !== 'undefined') {
          setIsWorkoutDetailOpen(!!ce.detail.open);
        }
      } catch {}
    };
    window.addEventListener('kw8:workout-detail:open', onOpen as EventListener);
    window.addEventListener('kw8:workout-detail:close', onClose as EventListener);
    window.addEventListener('kw8:workout-detail:state', onState as EventListener);
    return () => {
      window.removeEventListener('kw8:workout-detail:open', onOpen as EventListener);
      window.removeEventListener('kw8:workout-detail:close', onClose as EventListener);
      window.removeEventListener('kw8:workout-detail:state', onState as EventListener);
    };
  }, []);

  const handleBack = () => {
    // In PWA Gestione Schede: se il dettaglio scheda è aperto, chiudilo e torna alla cartella
    if (isStandaloneMobile && currentPage === 'workout-manager' && isWorkoutDetailOpen) {
      window.dispatchEvent(new Event('kw8:workout-detail:close'));
      return;
    }
    try {
      if (window.history.length > 1) {
        window.history.back();
        return;
      }
    } catch {}
    if (onNavigate) {
      if (currentPage === 'workout-manager' || currentPage === 'athlete-manager' || currentPage === 'rankings' || currentPage === 'athlete-statistics') {
        onNavigate('coach-dashboard');
      } else {
        onNavigate('home');
      }
    }
  };

  // Evita sovrapposizione: aggiunge padding-bottom quando la bottom nav è visibile
  useEffect(() => {
    if (isStandaloneMobile) {
      document.body.style.paddingBottom = 'calc(72px + env(safe-area-inset-bottom))';
      // Imposta background grigio per evitare banda bianca in basso su PWA
      document.body.style.backgroundColor = 'rgb(243 244 246)'; // tailwind gray-100
    } else {
      document.body.style.paddingBottom = '';
      document.body.style.backgroundColor = '';
    }
    return () => {
      document.body.style.paddingBottom = '';
      document.body.style.backgroundColor = '';
    };
  }, [isStandaloneMobile]);

  // Bottom bar sempre visibile in modalità standalone (rimuove auto-hide su scroll)
  useEffect(() => {
    setIsBottomVisible(!!isStandaloneMobile);
    // Nessun listener di scroll necessario
    return () => {
      if (scrollTickRef.current) {
        cancelAnimationFrame(scrollTickRef.current);
        scrollTickRef.current = null;
      }
    };
  }, [isStandaloneMobile]);

  return (
    <React.Fragment>
      {/* Rimuovi completamente l'header su Home PWA */}
      {!(isStandaloneMobile && currentPage === 'pwa-home') && (
        <header 
          className={`fixed top-0 left-0 right-0 z-40 ${
            currentPage === 'workout-manager'
              ? ''
              : (isStandaloneMobile && currentPage === 'athlete-manager')
                ? 'bg-transparent'
                : 'bg-transparent backdrop-blur-sm'
          } transition-all duration-300 cursor-pointer`}
          style={{ 
            marginRight: '0px',
            boxSizing: 'border-box',
            opacity: headerOpacity,
            transition: 'opacity 150ms ease-out'
          }}
          onClick={handleHeaderClick}
        >
        {!isStandaloneMobile && (
          <div 
            className="container mx-auto px-6 py-3 flex items-center justify-between relative"
            onClick={(e) => e.stopPropagation()}
          >
          {/* Logo - nascosto su PWA Gestione Schede */}
          {!isPwaWorkoutManager && (
            <div className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="KW8 Logo" 
                className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-105 cursor-pointer filter drop-shadow-lg"
                onClick={() => {
                  if (isDashboard) {
                    // Se siamo nella dashboard, naviga alla home senza reload per mantenere la sessione
                    if (onNavigate) {
                      onNavigate('home');
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  } else {
                    // Per le altre pagine, mantieni il comportamento originale
                    if (onNavigate) {
                      onNavigate('home');
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // Refresh della pagina dopo un breve delay per permettere la navigazione
                    setTimeout(() => {
                      window.location.reload();
                    }, 100);
                  }
                }}
              />
            </div>
          )}

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
            {isDashboard ? (
              // Menu completo per Dashboard
              <React.Fragment>
                <div className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-2 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
                  <button
                    onClick={() => handleNavigation('coach-dashboard')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Dashboard
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={() => handleNavigation('workout-manager')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Schede
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={() => handleNavigation('athlete-manager')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Atleti
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={() => handleNavigation('rankings')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Classifiche
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={() => handleNavigation('membership-cards')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Tesserini
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={() => handleNavigation('athlete-statistics')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Statistiche
                  </button>
                </div>
              </React.Fragment>
            ) : (
              // Menu normale per le altre pagine
              <React.Fragment>
                <div className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-2 py-1 shadow-[0_2px_10px_rgba(0,0,0,0.08)]">
                  <button
                    onClick={() => scrollToSection('orari')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Orari
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={handleShowRules}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    {t.header.rules}
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={() => handleNavigation('workouts')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    {t.header.workouts}
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={() => scrollToSection('aree')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Aree
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={() => scrollToSection('staff')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Coach
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={() => scrollToSection('dove-siamo')}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    {t.header.location}
                  </button>
                  <div className="mx-1.5 h-5 w-px bg-black/10" />
                  <button
                    onClick={handleContactsClick}
                    className="px-3 py-1.5 text-sm font-medium text-gray-800 rounded-full hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-black/10"
                  >
                    Contatti
                  </button>
                </div>
              </React.Fragment>
            )}
          </nav>

          {/* Right side buttons - nascosti su PWA Gestione Schede */}
          {!isPwaWorkoutManager && (
          <div className="flex items-center space-x-4">
            {/* Gestione Schede Button - Solo per coach (non visibile nella Dashboard) */}
            {currentUser && currentUser.role === 'coach' && !isDashboard && (
              <button aria-label="Gestione Schede (Coach)"
                onClick={() => handleNavigation('workout-manager')}
                className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-sm ring-1 ring-black/10 px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
                title="Gestione Schede"
              >
                <FileText size={24} className="text-gray-700" />
              </button>
            )}
            
            {/* User Profile/Login Button */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => { setUserMenuOrigin('header'); toggleUserMenu(); }}
                  className="inline-flex items-center space-x-2 rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3.5 py-2 text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:bg-white/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <User size={24} className="text-gray-700" />
                  {!isHomePage && (
                    <span className="hidden md:inline font-medium">
                      {currentUser.name || deriveNameFromEmail(currentUser.email)}
                    </span>
                  )}
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/10 p-2 z-50">
                    <div className="px-4 py-3 border-b border-black/5">
                      <p className="font-semibold text-gray-800">{currentUser.name || deriveNameFromEmail(currentUser.email)}</p>
                      <p className="text-sm text-gray-600">{currentUser.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                    </div>
                    
                    {currentUser.role === 'coach' && (
                      <>
                        <button
                          onClick={() => {
                            handleNavigation('coach-home');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors"
                        >
                          <Home size={16} />
                          <span>Home</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigation('coach-dashboard');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors"
                        >
                          <Settings size={16} />
                          <span>Dashboard Coach</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigation('workout-manager');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors"
                        >
                          <FileText size={16} />
                          <span>Gestione schede</span>
                        </button>
                        <div className="mt-2 pt-2 border-t border-black/5">
                          <button
                            onClick={() => {
                              handleLogout();
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors text-red-700"
                          >
                            <LogOut size={16} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </>
                    )}

                    {currentUser.role === 'athlete' && (
                      <>
                        <button
                          onClick={() => {
                            handleNavigation('athlete-profile');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors"
                        >
                          <UserIcon size={16} />
                          <span>Profilo</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigation('home');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg_black/5 flex items-center space-x-2 transition-colors"
                        >
                          <Home size={16} />
                          <span>Home</span>
                        </button>
                        <button
                          onClick={() => {
                            handleNavigation('workouts');
                            setShowUserMenu(false);
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors"
                        >
                          <FileText size={16} />
                          <span>Schede</span>
                        </button>
                        <div className="mt-2 pt-2 border-t border-black/5">
                          <button
                            onClick={() => {
                              handleLogout();
                              setShowUserMenu(false);
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors text-red-700"
                          >
                            <LogOut size={16} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </>
                    )}
                    
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" ref={roleMenuRef}>
                <button
                  onClick={() => setShowRoleMenu(!showRoleMenu)}
                  className="inline-flex items-center space-x-2 rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3.5 py-2 text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:bg-white/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <User size={24} className="text-gray-700" />
                  <span className="hidden md:inline font-medium">Accedi</span>
                </button>
                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/10 p-2 z-50">
                    <button
                      onClick={() => {
                        handleNavigation('login');
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors"
                    >
                      <UserIcon size={16} />
                      <span>Accedi come Coach</span>
                    </button>
                    <button
                      onClick={() => {
                        handleNavigation('athlete-auth');
                        setShowRoleMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors"
                    >
                      <UserIcon size={16} />
                      <span>Accedi come Atleta</span>
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Azioni rapide spostate accanto al titolo nella header mobile di Gestione schede */}

            {/* Hamburger Menu */}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-sm ring-1 ring-black/10 px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <AlignJustify size={24} className="text-gray-700" />
            </button>
          </div>
          )}
        </div>
        )}

        {/* Titolo pagina mobile: usa animazione su PWA Home, titolo statico altrove */}

        {/* Titolo mobile centrato con back quando è attiva la bottom nav */}
        {isStandaloneMobile && !isHomePage && (currentPage === 'pwa-home' || !!getMobilePageTitle(currentPage)) && (
          <div className="lg:hidden">
            <div className={`container mx-auto px-6 ${currentPage === 'workout-manager' ? 'pb-0' : (((currentPage === 'workout-manager' || currentPage === 'workouts') && isWorkoutDetailOpen) ? 'pb-0' : 'pb-2')}`}>
              <div className={`w-full relative rounded-2xl ${(currentPage === 'athlete-manager' || currentPage === 'workout-manager' || currentPage === 'coach-dashboard') ? 'px-0' : 'px-3'} py-2 flex items-center justify-between flex-nowrap ${(currentPage === 'workout-manager' || currentPage === 'athlete-manager' || currentPage === 'coach-dashboard') ? '' : 'bg-white/70 backdrop-blur-md ring-1 ring-black/10 shadow-sm'}`}>
                  <>
                    {/* Back */}
                    <button
                      onClick={handleBack}
                      className="inline-flex items-center justify-center p-1.5 text-red-600 bg-white/70 hover:bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-black/10 shadow-sm transition-transform duration-300 hover:scale-110 shrink-0"
                      title="Indietro"
                      aria-label="Indietro"
                    >
                      <ChevronLeft size={20} className="block text-black" />
                    </button>
                    {/* Title center */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 pointer-events-none">
                      {currentPage === 'pwa-home' ? (
                        <h1
                          className={`text-2xl sm:text-3xl font-bold tracking-wider animate-fadeInSlideUp ${isTypingComplete ? 'animate-pulse' : ''}`}
                          style={{ fontFamily: 'Bebas Neue, cursive', minHeight: '1.2em' }}
                        >
                          <span style={{ fontFamily: 'Bebas Neue, cursive' }}>
                            {displayText.split(' ').map((word, index) => {
                              if (word === 'CROSS' || word === 'YOUR') {
                                return <span key={index} className="text-white">{word}</span>;
                              } else if (word === 'LIMITS.') {
                                return <span key={index} className="text-red-500">{word}</span>;
                              }
                              return <span key={index}>{word}</span>;
                            }).reduce((prev, curr) => (Array.isArray(prev) ? [...prev, ' ', curr] : [prev, ' ', curr]))}
                          </span>
                          {!isTypingComplete && <span className="animate-pulse" style={{ fontFamily: 'Bebas Neue, cursive' }}>|</span>}
                        </h1>
                      ) : (
                        <span className="font-sfpro text-base font-bold text-gray-900 tracking-tight whitespace-nowrap overflow-hidden max-w-[calc(100%-140px)]">
                          {getMobilePageTitle(currentPage)}
                        </span>
                      )}
                    </div>
                    {/* Right side placeholder or actions */}
                    {currentPage === 'workout-manager' ? (
                      !isWorkoutDetailOpen ? (
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => window.dispatchEvent(new Event('kw8:fileexplorer:add'))}
                            className="inline-flex items-center justify-center p-1.5 text-red-600 bg-white/70 hover:bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-black/10 shadow-sm transition-transform duration-300 hover:scale-110"
                            title="Aggiungi"
                            aria-label="Aggiungi"
                          >
                            <Plus size={20} />
                          </button>
                          <button
                            onClick={() => window.dispatchEvent(new Event('kw8:fileexplorer:open-menu'))}
                            className="inline-flex items-center justify-center p-1.5 text-gray-800 bg-white/70 hover:bg-white/80 backdrop-blur-sm rounded-2xl ring-1 ring-black/10 shadow-sm transition-transform duration-300 hover:scale-110"
                            title="Menu cartella"
                            aria-label="Menu cartella"
                          >
                            <Menu size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-8" />
                      )
                    ) : (
                      <div className="w-8" />
                    )}
                  </>
              </div>
              {/* Contenitori PWA per barra di ricerca e breadcrumb, quando su Gestione schede */}
              {currentPage === 'workout-manager' && !isWorkoutDetailOpen && (
                <div className="pt-2 space-y-2">
                  <div id="pwa-fileexplorer-search" className="w-full"></div>
                  <div id="pwa-folder-breadcrumb" className="w-full"></div>
                </div>
              )}

              {/* Contenitore PWA per toolbar della scheda, visibile quando il dettaglio è aperto */}
              {currentPage === 'workout-manager' && isWorkoutDetailOpen && (
                <div className="pt-0">
                  <div id="pwa-workout-toolbar" className="w-full"></div>
                </div>
              )}

              {/* Contenitore PWA per barra di ricerca su Gestione atleti */}
              {currentPage === 'athlete-manager' && (
                <div className="pt-2">
                  <div id="pwa-athlete-manager-search" className="w-full"></div>
                </div>
              )}

              {/* Barra varianti rimossa: ora renderizzata inline in WorkoutDetailPage */}
            </div>
          </div>
        )}
        </header>
      )}

      {/* Bottom Navigation - visibile solo su mobile/tablet e in modalità standalone */}
      {/* Bottom Navigation - sempre presente ma con animazioni show/dismiss e visibile solo se standalone */}
      <div
        className={`fixed left-0 right-0 z-[60] lg:hidden transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform will-change-opacity ${isStandaloneMobile ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6 pointer-events-none'}`}
        style={{
          bottom: '14px',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div className="mx-auto max-w-screen-sm px-6 pb-3">
          <IosBottomBar className="flex items-center px-2">
            {/* Layout a 3 colonne per centro logo assoluto */}
            <div className="grid grid-cols-3 w-full items-center">
              {/* Colonna sinistra: profilo + (eventuale) schede */}
              <div className="flex items-center gap-2 justify-start pl-2 relative" ref={bottomProfileRef}>
                {/* Profilo: apre il menu utente */}
                <button
                  onClick={() => { setUserMenuOrigin('bottom'); setShowUserMenu(!showUserMenu); }}
                  className={`inline-flex items-center justify-center w-11 h-11 rounded-2xl transition-transform ${showUserMenu && userMenuOrigin === 'bottom' ? 'text-red-600 scale-105' : 'text-gray-800'}`}
                  title="Profilo"
                  aria-label="Profilo"
                >
                  <User size={22} />
                </button>

                {/* Accesso rapido Schede (solo coach, nascosto su gestione schede; spostato su destra in PWA Home) */}
                {currentUser?.role === 'coach' && currentPage !== 'workout-manager' && currentPage !== 'pwa-home' && (
                  <button
                    onClick={() => onNavigate && onNavigate('workout-manager')}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-2xl text-gray-800"
                    title="Gestione schede"
                    aria-label="Gestione schede"
                  >
                    <FileText size={22} />
                  </button>
                )}

              </div>

              {/* Colonna centrale: logo sempre centrato */}
              <div className="flex items-center justify-center">
                <button
                  onClick={() => onNavigate && onNavigate('home')}
                  className="inline-flex items-center justify-center"
                  aria-label="Home"
                  title="Home"
                >
                  <img src="/images/logo.png" alt="KW8 Logo" className="h-10 w-auto object-contain drop-shadow" />
                </button>
              </div>

              {/* Colonna destra: accesso rapido (solo coach su PWA Home) + menu hamburger */}
              <div className="flex items-center justify-end pr-2">
                {currentUser?.role === 'coach' && currentPage === 'pwa-home' && (
                  <button
                    onClick={() => onNavigate && onNavigate('workout-manager')}
                    className="inline-flex items-center justify-center w-11 h-11 rounded-2xl text-gray-800 mr-1"
                    title="Gestione schede"
                    aria-label="Gestione schede"
                  >
                    <FileText size={22} />
                  </button>
                )}
                <button
                  onClick={toggleMenu}
                  className="inline-flex items-center justify-center w-11 h-11 rounded-2xl text-gray-800"
                  title="Menu"
                  aria-label="Menu"
                >
                  <AlignJustify size={22} />
                </button>
              </div>
            </div>
          </IosBottomBar>
          {/* Overlay menu profilo in Portal (body): evita clipping da maschere/transform */}
          {showUserMenu && userMenuOrigin === 'bottom' && bottomMenuPos && (
            <Portal containerId="menu-portal">
              <div
                ref={userMenuRef}
                className="fixed z-[10000] w-64 bg-white/90 backdrop-blur-md rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/10 p-2"
                style={{ top: bottomMenuPos.top, left: bottomMenuPos.left, transform: 'translateY(calc(-100% - 8px))' }}
              >
                {currentUser ? (
                  <>
                    <div className="px-4 py-3 border-b border-black/5">
                      <p className="font-semibold text-gray-800">{currentUser.name || deriveNameFromEmail(currentUser.email)}</p>
                      <p className="text-sm text-gray-600">{currentUser.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                    </div>
                    {currentUser.role === 'coach' ? (
                      <>
                        <button onClick={() => { handleNavigation('coach-home'); setShowUserMenu(false); setUserMenuOrigin(null); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors">
                          <Home size={16} />
                          <span>Home</span>
                        </button>
                        <button onClick={() => { handleNavigation('coach-dashboard'); setShowUserMenu(false); setUserMenuOrigin(null); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors">
                          <Settings size={16} />
                          <span>Dashboard Coach</span>
                        </button>
                        <button onClick={() => { handleNavigation('workout-manager'); setShowUserMenu(false); setUserMenuOrigin(null); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors">
                          <FileText size={16} />
                          <span>Gestione schede</span>
                        </button>
                        <div className="mt-2 pt-2 border-t border-black/5">
                          <button onClick={() => { handleLogout(); setShowUserMenu(false); setUserMenuOrigin(null); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors text-red-700">
                            <LogOut size={16} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <button onClick={() => { handleNavigation('athlete-profile'); setShowUserMenu(false); setUserMenuOrigin(null); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors">
                          <UserIcon size={16} />
                          <span>Profilo</span>
                        </button>
                        <button onClick={() => { handleNavigation('home'); setShowUserMenu(false); setUserMenuOrigin(null); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors">
                          <Home size={16} />
                          <span>Home</span>
                        </button>
                        <button onClick={() => { handleNavigation('workouts'); setShowUserMenu(false); setUserMenuOrigin(null); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors">
                          <FileText size={16} />
                          <span>Schede</span>
                        </button>
                        <div className="mt-2 pt-2 border-t border-black/5">
                          <button onClick={() => { handleLogout(); setShowUserMenu(false); setUserMenuOrigin(null); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors text-red-700">
                            <LogOut size={16} />
                            <span>Logout</span>
                          </button>
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <button onClick={() => { handleNavigation('login'); setShowUserMenu(false); setUserMenuOrigin(null); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors">
                      <UserIcon size={16} />
                      <span>Accedi come Coach</span>
                    </button>
                    <button onClick={() => { handleNavigation('athlete-auth'); setShowUserMenu(false); setUserMenuOrigin(null); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors">
                      <UserIcon size={16} />
                      <span>Accedi come Atleta</span>
                    </button>
                  </>
                )}
              </div>
            </Portal>
          )}
        </div>
      </div>

      {/* Mobile Menu Overlay & Side Panel */}
      <div className={`${(isMenuOpen || isClosing) ? 'visible' : 'invisible'} fixed inset-0 z-[100] pointer-events-none`}>
        {/* Backdrop */}
        <div
          onClick={closeMenuAnimated}
          className={`absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Side Panel */}
        <div
          className={`absolute top-0 left-0 h-full w-1/2 max-w-md bg-white ring-1 ring-black/10 shadow-2xl rounded-r-lg transition-transform duration-300 ease-out transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} pointer-events-auto`}
        >
          <div className="flex justify-center p-4 items-center border-b border-black/10">
            <img 
              src="/images/logo.png" 
              alt="KW8 Logo" 
              className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-105 cursor-pointer"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('home');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setIsMenuOpen(false);
              }}
            />
          </div>
      
          <nav className="px-2 sm:px-4 py-2 overflow-y-auto h-[calc(100vh-64px)]">
            <ul className="divide-y divide-black/10">
              {isDashboard ? (
                // Menu Dashboard completo
                <React.Fragment>
                  {/* 1. Dashboard */}
                  <li>
                    <button
                      onClick={() => handleNavigation('coach-dashboard')}
                      className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                    >
                      <Settings size={20} className="sm:w-6 sm:h-6" />
                      <span>Dashboard</span>
                    </button>
                  </li>
                  {/* 2. Schede */}
                  <li>
                    <button
                      onClick={() => handleNavigation('workout-manager')}
                      className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                    >
                      <FileText size={20} className="sm:w-6 sm:h-6" />
                      <span>Schede</span>
                    </button>
                  </li>
                  {/* 3. Atleti */}
                  <li>
                    <button
                      onClick={() => handleNavigation('athlete-manager')}
                      className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                    >
                      <Users size={20} className="sm:w-6 sm:h-6" />
                      <span>Atleti</span>
                    </button>
                  </li>
                  {/* 4. Classifiche */}
                  <li>
                    <button
                      onClick={() => handleNavigation('rankings')}
                      className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                    >
                      <Trophy size={20} className="sm:w-6 sm:h-6" />
                      <span>Classifiche</span>
                    </button>
                  </li>
                  {/* 6. Statistiche */}
                  <li>
                    <button
                      onClick={() => handleNavigation('athlete-statistics')}
                      className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                    >
                      <BarChart3 size={20} className="sm:w-6 sm:h-6" />
                      <span>Statistiche</span>
                    </button>
                  </li>
                  {/* 7. Tessere */}
                  <li>
                    <button
                      onClick={() => handleNavigation('membership-cards')}
                      className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                    >
                      <CreditCard size={20} className="sm:w-6 sm:h-6" />
                      <span>Tessere</span>
                    </button>
                  </li>
                </React.Fragment>
              ) : (
                // Menu Standard (Home)
                <React.Fragment>
                  {/* 1. Informazioni */}
                  <li>
                    <button
                      onClick={() => scrollToSection('informazioni')}
                      className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                    >
                      <Mail size={20} className="sm:w-6 sm:h-6" />
                      <span>{t.header.information}</span>
                    </button>
                  </li>
                {/* 2. Orari */}
                <li>
                  <button
                    onClick={() => scrollToSection('orari')}
                    className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                  >
                    <Clock size={20} className="sm:w-6 sm:h-6" />
                    <span>Orari</span>
                  </button>
                </li>
                {/* 2b. Avvisi */}
                <li>
                  <button
                    onClick={() => scrollToSection('avvisi')}
                    className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                  >
                    <Bell size={20} className="sm:w-6 sm:h-6" />
                    <span>Avvisi</span>
                  </button>
                </li>
                {/* 3. Regole */}
                <li>
                  <button
                    onClick={handleShowRules}
                    className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                  >
                    <BookOpen size={20} className="sm:w-6 sm:h-6" />
                    <span>{t.header.rules}</span>
                  </button>
                </li>
                {/* 4. Schede */}
                <li>
                  <button
                    onClick={() => handleNavigation('workouts')}
                    className={`inline-flex items-center space-x-3 sm:space-x-4 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5 ${
                      currentPage === 'workouts' ? 'text-red-600' : 'text-gray-800'
                    }`}
                  >
                    <FileText size={20} className="sm:w-6 sm:h-6" />
                    <span>{t.header.workouts}</span>
                  </button>
                </li>
                {/* 5. Aree */}
                <li>
                  <button
                    onClick={() => scrollToSection('aree')}
                    className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                  >
                    <Dumbbell size={20} className="sm:w-6 sm:h-6" />
                    <span>Aree</span>
                  </button>
                </li>
                {/* 6. Coach */}
                <li>
                  <button
                    onClick={() => scrollToSection('staff')}
                    className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                  >
                    <Users size={20} className="sm:w-6 sm:h-6" />
                    <span>Coach</span>
                  </button>
                </li>
                {/* 7. Posizione */}
                <li>
                  <button
                    onClick={() => scrollToSection('dove-siamo')}
                    className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                  >
                    <MapPin size={20} className="sm:w-6 sm:h-6" />
                    <span>{t.header.location}</span>
                  </button>
                </li>
                {/* 8. Contatti */}
                <li>
                  <button
                    onClick={handleContactsClick}
                    className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                  >
                    <Phone size={20} className="sm:w-6 sm:h-6" />
                    <span>Contatti</span>
                  </button>
                </li>
              </React.Fragment>
            )}
            
            
            
            
            <li>
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
              >
                <Globe size={20} className="sm:w-6 sm:h-6" />
                <span className="flex items-center space-x-2">
                  <span>{t.header.language}</span>
                  <span className="text-2xl">{language === 'it' ? '🇮🇹' : '🇬🇧'}</span>
                </span>
              </button>
            </li>
            
            {currentUser && (
              <li>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center space-x-3 sm:space-x-4 text-gray-800 transition-colors duration-200 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 hover:bg-black/5"
                   >
                     <LogOut size={20} className="sm:w-6 sm:h-6" />
                     <span>Logout</span>
                   </button>
              </li>
            )}
          </ul>
        </nav>
      </div>
      </div>

      {/* Rules Modal */}
      <RulesSection 
        isOpen={showRulesModal} 
        onClose={() => setShowRulesModal(false)} 
      />
      </React.Fragment>
    );
    
  };
    export default Header;
