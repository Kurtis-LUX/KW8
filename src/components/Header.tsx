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
    
    // Aggiorna la pagina dopo un breve delay per renderlo più visibile
    setTimeout(() => {
      console.log('🔄 Header: Ricaricamento pagina in corso...');
      window.location.reload();
    }, 500);
    
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
    
    // Reindirizza alla home e aggiorna la pagina
    if (onNavigate) {
      onNavigate('home');
    }
    
    // Aggiorna la pagina dopo un breve delay per renderlo più visibile
    setTimeout(() => {
      console.log('🔄 Header: Ricaricamento pagina in corso...');
      window.location.reload();
    }, 500);
    
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

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-40 bg-transparent backdrop-blur-sm transition-all duration-300 cursor-pointer`}
        style={{ 
          marginRight: '0px',
          boxSizing: 'border-box'
        }}
        onClick={handleHeaderClick}
      >
        <div 
          className="container mx-auto px-4 py-4 flex items-center justify-between"
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
          <nav className="hidden lg:flex items-center space-x-8">
            {isDashboard ? (
              // Menu completo per Dashboard
              <>
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
              </>
            ) : (
              // Menu normale per le altre pagine
               <>
                 <button
                   onClick={() => scrollToSection('orari')}
                   className="inline-flex items-center rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200"
                 >
                   Orari
                 </button>
                <button
                  onClick={handleShowRules}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200"
                >
                  {t.header.rules}
                </button>
                <button
                  onClick={() => handleNavigation('workouts')}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200"
                >
                  {t.header.workouts}
                </button>
                <button
                  onClick={() => scrollToSection('aree')}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200"
                >
                  Aree
                </button>
                <button
                  onClick={() => scrollToSection('coach')}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200"
                >
                  Coach
                </button>
                <button
                  onClick={() => scrollToSection('posizione')}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200"
                >
                  {t.header.location}
                </button>
                <button
                  onClick={() => scrollToSection('contatti')}
                  className="inline-flex items-center rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200"
                >
                  Contatti
                </button>
              </>
            )}
          </nav>

          {/* Right side buttons */}
          <div className="flex items-center space-x-4">
            {/* Gestione Schede Button - Solo per coach */}
            {currentUser && currentUser.role === 'coach' && (
              <button
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
              <button
                onClick={() => handleNavigation('login')}
                className="inline-flex items-center space-x-2 rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3.5 py-2 text-gray-800 shadow-[0_2px_10px_rgba(0,0,0,0.08)] hover:bg-white/80 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
              >
                <User size={24} className="text-gray-700" />
                <span className="hidden md:inline font-medium">Coach</span>
              </button>
            )}
            
            {/* Hamburger Menu */}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-2 text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
            >
              <AlignJustify size={24} className="text-gray-700" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[100] bg-white transition-all duration-500 transform ${isMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-full'}`}>
        <div className="flex justify-between p-4 items-center">
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
                setIsMenuOpen(false); // Chiude il menu mobile
              }}
            />
          </div>
          <button
            onClick={toggleMenu}
            className="inline-flex items-center rounded-full border border-gray-200 bg-white/60 backdrop-blur-sm px-3 py-2 text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-black/10"
          >
            <X size={20} className="text-gray-700" />
          </button>
        </div>
        
        <nav className="px-3 sm:px-8 py-4 sm:py-8 overflow-y-auto max-h-[calc(100vh-80px)]">
          <ul className="space-y-1 sm:space-y-3">
            {isDashboard ? (
              // Menu Dashboard completo
              <>
                {/* 1. Dashboard */}
                <li>
                  <button
                    onClick={() => handleNavigation('coach-dashboard')}
                    className={`inline-flex items-center space-x-2 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-base sm:text-xl font-semibold w-full text-left py-2.5 px-4 ${
                      currentPage === 'coach-dashboard' ? 'text-red-600 ring-1 ring-black/5' : 'hover:text-red-600'
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
                    className={`inline-flex items-center space-x-2 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-base sm:text-xl font-semibold w-full text-left py-2.5 px-4 ${
                      currentPage === 'workout-manager' ? 'text-red-600 ring-1 ring-black/5' : 'hover:text-red-600'
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
                    className={`inline-flex items-center space-x-2 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-base sm:text-xl font-semibold w-full text-left py-2.5 px-4 ${
                      currentPage === 'athlete-manager' ? 'text-red-600 ring-1 ring-black/5' : 'hover:text-red-600'
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
                    className={`inline-flex items-center space-x-2 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-base sm:text-xl font-semibold w-full text-left py-2.5 px-4 ${
                      currentPage === 'rankings' ? 'text-red-600 ring-1 ring-black/5' : 'hover:text-red-600'
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
                    className={`inline-flex items-center space-x-2 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-base sm:text-xl font-semibold w-full text-left py-2.5 px-4 ${
                      currentPage === 'athlete-statistics' ? 'text-red-600 ring-1 ring-black/5' : 'hover:text-red-600'
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
                    className={`inline-flex items-center space-x-2 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-base sm:text-xl font-semibold w-full text-left py-2.5 px-4 ${
                      currentPage === 'membership-cards' ? 'text-red-600 ring-1 ring-black/5' : 'hover:text-red-600'
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
                    className={`inline-flex items-center space-x-2 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-base sm:text-xl font-semibold w-full text-left py-2.5 px-4 ${
                      currentPage === 'areas-manager' ? 'text-red-600 ring-1 ring-black/5' : 'hover:text-red-600'
                    }`}
                  >
                    <MapPin size={20} className="sm:w-6 sm:h-6" />
                    <span>Aree</span>
                  </button>
                </li>
               </>
             ) : (
               // Menu Standard
                <>
                  {/* 1. Informazioni */}
                  <li>
                    <button
                      onClick={scrollToFooter}
                      className="inline-flex items-center space-x-3 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-lg sm:text-xl font-semibold w-full text-left py-2.5 px-4"
                    >
                      <Mail size={20} className="sm:w-6 sm:h-6" />
                      <span>{t.header.information}</span>
                    </button>
                  </li>
                {/* 2. Orari */}
                <li>
                  <button
                    onClick={() => scrollToSection('orari')}
                    className="inline-flex items-center space-x-3 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-lg sm:text-xl font-semibold w-full text-left py-2.5 px-4"
                  >
                    <Clock size={20} className="sm:w-6 sm:h-6" />
                    <span>Orari</span>
                  </button>
                </li>
                {/* 3. Regole */}
                <li>
                  <button
                    onClick={handleShowRules}
                    className="inline-flex items-center space-x-3 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-lg sm:text-xl font-semibold w-full text-left py-2.5 px-4"
                  >
                    <BookOpen size={20} className="sm:w-6 sm:h-6" />
                    <span>{t.header.rules}</span>
                  </button>
                </li>
                {/* 4. Schede */}
                <li>
                  <button
                    onClick={() => handleNavigation('workouts')}
                    className={`inline-flex items-center space-x-3 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm transition-all duration-200 text-lg sm:text-xl font-semibold w-full text-left py-2.5 px-4 ${
                      currentPage === 'workouts' ? 'text-red-600 ring-1 ring-black/5' : 'text-gray-800 hover:text-red-600 hover:border-gray-300 hover:shadow-md'
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
                    className="inline-flex items-center space-x-3 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-lg sm:text-xl font-semibold w-full text-left py-2.5 px-4"
                  >
                    <Dumbbell size={20} className="sm:w-6 sm:h-6" />
                    <span>Aree</span>
                  </button>
                </li>
                {/* 6. Coach */}
                <li>
                  <button
                    onClick={() => scrollToSection('coach')}
                    className="inline-flex items-center space-x-3 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-lg sm:text-xl font-semibold w-full text-left py-2.5 px-4"
                  >
                    <Users size={20} className="sm:w-6 sm:h-6" />
                    <span>Coach</span>
                  </button>
                </li>
                {/* 7. Posizione */}
                <li>
                  <button
                    onClick={() => scrollToSection('posizione')}
                    className="inline-flex items-center space-x-3 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-lg sm:text-xl font-semibold w-full text-left py-2.5 px-4"
                  >
                    <MapPin size={20} className="sm:w-6 sm:h-6" />
                    <span>{t.header.location}</span>
                  </button>
                </li>
                {/* 8. Contatti */}
                <li>
                  <button
                    onClick={() => scrollToSection('contatti')}
                    className="inline-flex items-center space-x-3 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-lg sm:text-xl font-semibold w-full text-left py-2.5 px-4"
                  >
                    <Phone size={20} className="sm:w-6 sm:h-6" />
                    <span>Contatti</span>
                  </button>
                </li>
              </>
            )}
            

            

            
            <li>
              <button
                onClick={toggleLanguage}
                className="inline-flex items-center space-x-3 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-lg sm:text-xl font-semibold w-full text-left py-2.5 px-4"
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
                  className="inline-flex items-center space-x-3 sm:space-x-4 rounded-full border border-gray-200 bg-white/80 backdrop-blur-sm text-gray-800 hover:bg-white hover:border-gray-300 hover:shadow-md shadow-sm transition-all duration-200 text-lg sm:text-xl font-semibold w-full text-left py-2.5 px-4"
                    >
                      <LogOut size={20} className="sm:w-6 sm:h-6" />
                      <span>Logout</span>
                    </button>
              </li>
            )}
          </ul>
        </nav>
      </div>

      {/* Rules Modal */}
      <RulesSection 
        isOpen={showRulesModal} 
        onClose={() => setShowRulesModal(false)} 
      />
    </>
  );
};

export default Header;