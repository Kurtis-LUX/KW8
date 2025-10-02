import React, { useState, useEffect, useRef } from 'react';
import { Menu, X, User as UserIcon, CreditCard, MapPin, Users, FileText, Mail, BookOpen, Globe, Clock, Phone, Dumbbell, Settings, Home, Trophy, Link, BarChart3, User, AlignJustify } from 'lucide-react';
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
                  className={`transition-all duration-300 font-medium ${
                    currentPage === 'coach-dashboard' ? 'text-red-600' : 'text-black hover:text-red-600'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavigation('workout-manager')}
                  className={`transition-all duration-300 font-medium ${
                    currentPage === 'workout-manager' ? 'text-red-600' : 'text-black hover:text-red-600'
                  }`}
                >
                  Schede
                </button>
                <button
                  onClick={() => handleNavigation('athlete-manager')}
                  className={`transition-all duration-300 font-medium ${
                    currentPage === 'athlete-manager' ? 'text-red-600' : 'text-black hover:text-red-600'
                  }`}
                >
                  Atleti
                </button>
                <button
                  onClick={() => handleNavigation('rankings')}
                  className={`transition-all duration-300 font-medium ${
                    currentPage === 'rankings' ? 'text-red-600' : 'text-black hover:text-red-600'
                  }`}
                >
                  Classifiche
                </button>
>
                <button
                  onClick={() => handleNavigation('membership-cards')}
                  className={`transition-all duration-300 font-medium ${
                    currentPage === 'membership-cards' ? 'text-red-600' : 'text-black hover:text-red-600'
                  }`}
                >
                  Tesserini
                </button>
                <button
                  onClick={() => handleNavigation('athlete-statistics')}
                  className={`transition-all duration-300 font-medium ${
                    currentPage === 'athlete-statistics' ? 'text-red-600' : 'text-black hover:text-red-600'
                  }`}
                >
                  Statistiche
                </button>
                <button
                  onClick={() => handleNavigation('areas-manager')}
                  className={`transition-all duration-300 font-medium ${
                    currentPage === 'areas-manager' ? 'text-red-600' : 'text-black hover:text-red-600'
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
                   className="text-black hover:text-red-600 transition-all duration-300 font-medium"
                 >
                   Orari
                 </button>
                <button
                  onClick={handleShowRules}
                  className="text-black hover:text-red-600 transition-all duration-300 font-medium"
                >
                  {t.header.rules}
                </button>
                <button
                  onClick={() => handleNavigation('workouts')}
                  className="text-black hover:text-red-600 transition-all duration-300 font-medium"
                >
                  {t.header.workouts}
                </button>
                <button
                  onClick={() => scrollToSection('aree')}
                  className="text-black hover:text-red-600 transition-all duration-300 font-medium"
                >
                  Aree
                </button>
                <button
                  onClick={() => scrollToSection('coach')}
                  className="text-black hover:text-red-600 transition-all duration-300 font-medium"
                >
                  Coach
                </button>
                <button
                  onClick={() => scrollToSection('posizione')}
                  className="text-black hover:text-red-600 transition-all duration-300 font-medium"
                >
                  {t.header.location}
                </button>
                <button
                  onClick={() => scrollToSection('contatti')}
                  className="text-black hover:text-red-600 transition-all duration-300 font-medium"
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
                className="flex items-center transition-all duration-300 transform hover:scale-110 p-2 text-black hover:text-red-600"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                  background: 'transparent',
                  border: 'none'
                }}
                title="Gestione Schede"
              >
                <FileText size={32} />
              </button>
            )}
            
            {/* User Profile/Login Button */}
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 transition-all duration-300 transform hover:scale-110 py-2 px-2 text-black hover:text-red-600"
                  style={{
                    filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                    background: 'transparent',
                    border: 'none'
                  }}
                >
                  <User size={28} />
                  <span className="hidden md:inline font-medium">{currentUser.name}</span>
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="font-semibold text-gray-800">{currentUser.name}</p>
                      <p className="text-sm text-gray-600">{currentUser.email}</p>
                      <p className="text-xs text-gray-500 capitalize">{currentUser.role}</p>
                    </div>
                    
                    <button
                      onClick={() => {
                        handleNavigation('home');
                        setShowUserMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
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
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
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
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center space-x-2"
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
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 text-red-600 flex items-center space-x-2"
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
                className="flex items-center space-x-2 transition-all duration-300 transform hover:scale-110 py-2 px-2 text-black hover:text-red-600"
                style={{
                  filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                  background: 'transparent',
                  border: 'none'
                }}
              >
                <User size={28} />
                <span className="hidden md:inline font-medium">Coach</span>
              </button>
            )}
            
            {/* Hamburger Menu */}
            <button
              onClick={toggleMenu}
              className="transition-all duration-300 transform hover:scale-110 p-2 text-black hover:text-red-600"
              style={{
                filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3))',
                background: 'transparent',
                border: 'none'
              }}
            >
              <AlignJustify size={32} />
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
            className="text-black hover:text-red-600 transition-all duration-300 transform hover:scale-110 p-2"
          >
            <X size={24} />
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
                    className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-300 text-base sm:text-xl font-semibold w-full text-left py-3 px-3 rounded-lg bg-white/90 hover:bg-white ${
                      currentPage === 'coach-dashboard' ? 'text-red-600' : 'text-gray-800 hover:text-red-600'
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
                    className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-300 text-base sm:text-xl font-semibold w-full text-left py-3 px-3 rounded-lg bg-white/90 hover:bg-white ${
                      currentPage === 'workout-manager' ? 'text-red-600' : 'text-gray-800 hover:text-red-600'
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
                    className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-300 text-base sm:text-xl font-semibold w-full text-left py-3 px-3 rounded-lg bg-white/90 hover:bg-white ${
                      currentPage === 'athlete-manager' ? 'text-red-600' : 'text-gray-800 hover:text-red-600'
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
                    className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-300 text-base sm:text-xl font-semibold w-full text-left py-3 px-3 rounded-lg bg-white/90 hover:bg-white ${
                      currentPage === 'rankings' ? 'text-red-600' : 'text-gray-800 hover:text-red-600'
                    }`}
                  >
                    <Trophy size={20} className="sm:w-6 sm:h-6" />
                    <span>Classifiche</span>
                  </button>
                </li>
>
                {/* 6. Statistiche */}
                <li>
                  <button
                    onClick={() => handleNavigation('athlete-statistics')}
                    className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-300 text-base sm:text-xl font-semibold w-full text-left py-3 px-3 rounded-lg bg-white/90 hover:bg-white ${
                      currentPage === 'athlete-statistics' ? 'text-red-600' : 'text-gray-800 hover:text-red-600'
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
                    className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-300 text-base sm:text-xl font-semibold w-full text-left py-3 px-3 rounded-lg bg-white/90 hover:bg-white ${
                      currentPage === 'membership-cards' ? 'text-red-600' : 'text-gray-800 hover:text-red-600'
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
                    className={`flex items-center space-x-2 sm:space-x-4 transition-all duration-300 text-base sm:text-xl font-semibold w-full text-left py-3 px-3 rounded-lg bg-white/90 hover:bg-white ${
                      currentPage === 'areas-manager' ? 'text-red-600' : 'text-gray-800 hover:text-red-600'
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
                      className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-red-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                    >
                      <Mail size={20} className="sm:w-6 sm:h-6" />
                      <span>{t.header.information}</span>
                    </button>
                  </li>
                {/* 2. Orari */}
                <li>
                  <button
                    onClick={() => scrollToSection('orari')}
                    className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-red-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                  >
                    <Clock size={20} className="sm:w-6 sm:h-6" />
                    <span>Orari</span>
                  </button>
                </li>
                {/* 3. Regole */}
                <li>
                  <button
                    onClick={handleShowRules}
                    className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-red-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                  >
                    <BookOpen size={20} className="sm:w-6 sm:h-6" />
                    <span>{t.header.rules}</span>
                  </button>
                </li>
                {/* 4. Schede */}
                <li>
                  <button
                    onClick={() => handleNavigation('workouts')}
                    className={`flex items-center space-x-3 sm:space-x-4 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white ${
                      currentPage === 'workouts' ? 'text-red-600' : 'text-gray-800 hover:text-red-600'
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
                    className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-red-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                  >
                    <Dumbbell size={20} className="sm:w-6 sm:h-6" />
                    <span>Aree</span>
                  </button>
                </li>
                {/* 6. Coach */}
                <li>
                  <button
                    onClick={() => scrollToSection('coach')}
                    className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-red-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                  >
                    <Users size={20} className="sm:w-6 sm:h-6" />
                    <span>Coach</span>
                  </button>
                </li>
                {/* 7. Posizione */}
                <li>
                  <button
                    onClick={() => scrollToSection('posizione')}
                    className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-red-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                  >
                    <MapPin size={20} className="sm:w-6 sm:h-6" />
                    <span>{t.header.location}</span>
                  </button>
                </li>
                {/* 8. Contatti */}
                <li>
                  <button
                    onClick={() => scrollToSection('contatti')}
                    className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-red-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
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
                className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-red-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
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
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-red-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                >
                  <UserIcon size={20} className="sm:w-6 sm:h-6" />
                  <span>{t.header.logout}</span>
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