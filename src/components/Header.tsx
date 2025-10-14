import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User as UserIcon, CreditCard, MapPin, Users, FileText, Mail, BookOpen, Globe, Clock, Phone, Dumbbell, Settings, Home, Trophy, Link, BarChart3, User, AlignJustify, LogOut } from 'lucide-react';
import RulesSection from './RulesSection';

import { useLanguageContext } from '../contexts/LanguageContext';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  currentUser?: User | null;
  onLogout?: () => void;
  isDashboard?: boolean;
  currentPage?: string;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentUser, onLogout, isDashboard = false, currentPage = 'home' }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const roleMenuRef = useRef<HTMLDivElement>(null);
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  const { t, language, setLanguage } = useLanguageContext();
  
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

  // Gestisce i click esterni per chiudere il menu profilo
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const handleShowRules = () => {
    setShowRulesModal(true);
    setIsMenuOpen(false);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'it' ? 'en' : 'it');
    setIsMenuOpen(false);
  };

  const scrollToSection = (sectionId: string) => {
    // Controlla se l'elemento esiste già nella pagina corrente
    const element = document.getElementById(sectionId);
    
    if (element) {
      // Se l'elemento esiste, fai scroll direttamente senza navigare
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    } else if (onNavigate) {
      // Solo se l'elemento non esiste, naviga alla home e poi fai scroll
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      setIsMenuOpen(false);
    }
  };

  const scrollToFooter = () => {
    // Controlla se il footer esiste già nella pagina corrente
    const footer = document.querySelector('footer');
    
    if (footer) {
      // Se il footer esiste, fai scroll direttamente senza navigare
      footer.scrollIntoView({ behavior: 'smooth' });
      setIsMenuOpen(false);
    } else if (onNavigate) {
      // Solo se il footer non esiste, naviga alla home e poi fai scroll
      onNavigate('home');
      setTimeout(() => {
        const footer = document.querySelector('footer');
        if (footer) {
          footer.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      setIsMenuOpen(false);
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
    setIsMenuOpen(false);
  };

  // Funzione per navigazione con logout (per Menu Home e Dashboard Coach)
  const handleNavigationWithLogout = (page: string) => {
    console.log(`🚪 Navigazione con logout verso: ${page}`);
    
    // Chiudi tutti i menu aperti
    setIsMenuOpen(false);
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
    setIsMenuOpen(false);
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

  return (
    <React.Fragment>
      <header 
        className={`fixed top-0 left-0 right-0 z-40 bg-transparent backdrop-blur-sm transition-all duration-300 cursor-pointer`}
        style={{ 
          marginRight: '0px',
          boxSizing: 'border-box'
        }}
        onClick={handleHeaderClick}
      >
        <div 
          className="container mx-auto px-6 py-3 flex items-center justify-between relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Logo */}
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

          {/* Desktop Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex items-center justify-center absolute left-1/2 -translate-x-1/2">
            {isDashboard ? (
              // Menu completo per Dashboard
              <React.Fragment>
                <button
                  onClick={() => handleNavigation('coach-dashboard')}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-200 shadow-sm ${
                    currentPage === 'coach-dashboard' ? 'bg-white border-gray-300 text-red-600 hover:shadow-md' : 'bg-white/60 border-gray-200 text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavigation('workout-manager')}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-200 shadow-sm ${
                    currentPage === 'workout-manager' ? 'bg-white border-gray-300 text-red-600 hover:shadow-md' : 'bg-white/60 border-gray-200 text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  Schede
                </button>
                <button
                  onClick={() => handleNavigation('athlete-manager')}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-200 shadow-sm ${
                    currentPage === 'athlete-manager' ? 'bg-white border-gray-300 text-red-600 hover:shadow-md' : 'bg-white/60 border-gray-200 text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  Atleti
                </button>
                <button
                  onClick={() => handleNavigation('rankings')}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-200 shadow-sm ${
                    currentPage === 'rankings' ? 'bg-white border-gray-300 text-red-600 hover:shadow-md' : 'bg-white/60 border-gray-200 text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  Classifiche
                </button>
                <button
                  onClick={() => handleNavigation('membership-cards')}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-200 shadow-sm ${
                    currentPage === 'membership-cards' ? 'bg-white border-gray-300 text-red-600 hover:shadow-md' : 'bg-white/60 border-gray-200 text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  Tesserini
                </button>
                <button
                  onClick={() => handleNavigation('athlete-statistics')}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-200 shadow-sm ${
                    currentPage === 'athlete-statistics' ? 'bg-white border-gray-300 text-red-600 hover:shadow-md' : 'bg-white/60 border-gray-200 text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  Statistiche
                </button>
                <button
                  onClick={() => handleNavigation('areas-manager')}
                  className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-medium backdrop-blur-sm transition-all duration-200 shadow-sm ${
                    currentPage === 'areas-manager' ? 'bg-white border-gray-300 text-red-600 hover:shadow-md' : 'bg-white/60 border-gray-200 text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  Aree
                </button>
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

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Gestione Schede Button - Solo per coach (non visibile nella Dashboard) */}
            {currentUser && currentUser.role === 'coach' && !isDashboard && (
              <button aria-label="Gestione Schede (Coach)"
                onClick={() => handleNavigation('workout-manager')}
                className="inline-flex items-center rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-2 text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
                title="Gestione Schede"
              >
                <FileText size={24} className="text-gray-700" />
              </button>
            )}
            
            {/* User Profile/Login Button */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="inline-flex items-center space-x-2 rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3.5 py-2 text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:bg-white/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
                >
                  <User size={24} className="text-gray-700" />
                  <span className="hidden md:inline font-medium">{currentUser.name}</span>
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white/80 backdrop-blur-md rounded-2xl shadow-[0_16px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/10 p-2 z-50">
                    <div className="px-4 py-3 border-b border-black/5">
                      <p className="font-semibold text-gray-800">{currentUser.name}</p>
                      <p className="text-sm text-gray-600">{currentUser.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        handleNavigation('home');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors"
                    >
                      <Home size={16} />
                      <span>Home</span>
                    </button>
                    
                    {currentUser.role === 'coach' && (
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
                    )}
                    
                    {currentUser.role === 'athlete' && (
                      <button
                        onClick={() => {
                          handleNavigation('workouts');
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-black/5 flex items-center space-x-2 transition-colors"
                      >
                        <FileText size={16} />
                        <span>{t.header.workouts}</span>
                      </button>
                    )}
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 flex items-center space-x-2 transition-colors"
                    >
                      <UserIcon size={16} />
                      <span>{t.header.logout}</span>
                    </button>
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
            
            {/* Hamburger Menu */}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <AlignJustify size={24} className="text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay & Side Panel */}
      <div className={`${isMenuOpen ? 'visible' : 'invisible'} fixed inset-0 z-[100] pointer-events-none`}>
        {/* Backdrop */}
        <div
          onClick={toggleMenu}
          className={`absolute inset-0 bg-black/10 backdrop-blur-sm transition-opacity duration-300 pointer-events-auto ${isMenuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        {/* Side Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-1/2 max-w-md bg-white ring-1 ring-black/10 shadow-2xl rounded-l-lg transition-transform duration-300 ease-out transform ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'} pointer-events-auto`}
        >
          <div className="flex justify-between p-4 items-center border-b border-black/10">
            <div className="flex items-center">
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
            <button
              onClick={toggleMenu}
              className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-sm px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <X size={20} className="text-gray-700" />
            </button>
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
                      className={`inline-flex items-center space-x-3 sm:space-x-4 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 transition-colors duration-200 hover:bg-black/5 ${
                        currentPage === 'coach-dashboard' ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      <Settings size={20} className="sm:w-6 sm:h-6" />
                      <span>Dashboard</span>
                    </button>
                  </li>
                  {/* 2. Schede */}
                  <li>
                    <button
                      onClick={() => handleNavigation('workout-manager')}
                      className={`inline-flex items-center space-x-3 sm:space-x-4 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 transition-colors duration-200 hover:bg-black/5 ${
                        currentPage === 'workout-manager' ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      <FileText size={20} className="sm:w-6 sm:h-6" />
                      <span>Schede</span>
                    </button>
                  </li>
                  {/* 3. Atleti */}
                  <li>
                    <button
                      onClick={() => handleNavigation('athlete-manager')}
                      className={`inline-flex items-center space-x-3 sm:space-x-4 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 transition-colors duration-200 hover:bg-black/5 ${
                        currentPage === 'athlete-manager' ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      <Users size={20} className="sm:w-6 sm:h-6" />
                      <span>Atleti</span>
                    </button>
                  </li>
                  {/* 4. Classifiche */}
                  <li>
                    <button
                      onClick={() => handleNavigation('rankings')}
                      className={`inline-flex items-center space-x-3 sm:space-x-4 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 transition-colors duration-200 hover:bg-black/5 ${
                        currentPage === 'rankings' ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      <Trophy size={20} className="sm:w-6 sm:h-6" />
                      <span>Classifiche</span>
                    </button>
                  </li>
                  {/* 6. Statistiche */}
                  <li>
                    <button
                      onClick={() => handleNavigation('athlete-statistics')}
                      className={`inline-flex items-center space-x-3 sm:space-x-4 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 transition-colors duration-200 hover:bg-black/5 ${
                        currentPage === 'athlete-statistics' ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      <BarChart3 size={20} className="sm:w-6 sm:h-6" />
                      <span>Statistiche</span>
                    </button>
                  </li>
                  {/* 7. Tessere */}
                  <li>
                    <button
                      onClick={() => handleNavigation('membership-cards')}
                      className={`inline-flex items-center space-x-3 sm:space-x-4 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 transition-colors duration-200 hover:bg-black/5 ${
                        currentPage === 'membership-cards' ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      <CreditCard size={20} className="sm:w-6 sm:h-6" />
                      <span>Tessere</span>
                    </button>
                  </li>
                  {/* 8. Aree */}
                  <li>
                    <button
                      onClick={() => handleNavigation('areas-manager')}
                      className={`inline-flex items-center space-x-3 sm:space-x-4 text-lg sm:text-xl font-semibold w-full text-left py-3 px-4 transition-colors duration-200 hover:bg-black/5 ${
                        currentPage === 'areas-manager' ? 'text-red-600' : 'text-gray-800'
                      }`}
                    >
                      <MapPin size={20} className="sm:w-6 sm:h-6" />
                      <span>Aree</span>
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