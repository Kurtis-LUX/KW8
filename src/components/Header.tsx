import React, { useState, useEffect } from 'react';
import { Menu, X, User as UserIcon, CreditCard, MapPin, Users, FileText, Mail, BookOpen, Globe, Clock, Phone, Dumbbell, Sun, Moon } from 'lucide-react';
import { User } from '../utils/database';
import RulesSection from './RulesSection';

import { useLanguageContext } from '../contexts/LanguageContext';
import { useThemeContext } from '../contexts/ThemeContext';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  const { language, setLanguage, t } = useLanguageContext();
  const { theme, toggleTheme } = useThemeContext();
  
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
    if (onNavigate) {
      onNavigate('home');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  const scrollToFooter = () => {
    if (onNavigate) {
      onNavigate('home');
      setTimeout(() => {
        const footer = document.querySelector('footer');
        if (footer) {
          footer.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const footer = document.querySelector('footer');
      if (footer) {
        footer.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setIsMenuOpen(false);
  };

  const handleNavigation = (page: string) => {
    if (page === 'workouts' && !currentUser) {
      // Reindirizza alla pagina di autenticazione se l'utente tenta di accedere alle schede senza essere loggato
      if (onNavigate) {
        onNavigate('auth');
      }
      alert('Devi effettuare il login per accedere alle schede di allenamento');
    } else if (onNavigate) {
      onNavigate(page);
    }
    setIsMenuOpen(false);
    setShowUserMenu(false);
  };
  
  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    setShowUserMenu(false);
  };
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleSubscribe = () => {
    scrollToSection('informazioni');
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 ${isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'} backdrop-blur-sm transition-all duration-300`}>
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <img 
              src="/images/logo.png" 
              alt="KW8 Logo" 
              className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-105 cursor-pointer filter drop-shadow-lg"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('home');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Refresh della pagina dopo un breve delay per permettere la navigazione
                setTimeout(() => {
                  window.location.reload();
                }, 100);
              }}
            />
          </div>



          {/* User Profile / Login Button */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 transition-all duration-300 transform hover:scale-110 py-2 px-3 bg-white border-2 border-red-600 rounded-full text-black"
                >
                  <UserIcon size={20} />
                  <span className="hidden md:inline font-medium">
                    {currentUser.name || currentUser.email.split('@')[0]}
                    {currentUser.role === 'admin' ? 
                      <span className="ml-1 text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">Admin</span> :
                      <span className="ml-1 text-xs bg-blue-900 text-white px-2 py-0.5 rounded-full">Atleta</span>
                    }
                  </span>
                </button>
                
                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                      <p className="font-medium">{currentUser.name}</p>
                      <p className="text-xs text-gray-500">{currentUser.email}</p>
                      <p className="text-xs mt-1 bg-gray-100 inline-block px-2 py-0.5 rounded-full">
                        {currentUser.role === 'admin' ? 'Admin' : 'Atleta'}
                      </p>
                    </div>
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => handleNavigation('admin-dashboard')}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Dashboard Admin
                      </button>
                    )}
                    <button
                      onClick={() => handleNavigation('cookie-settings')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t.header.cookieSettings}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 border-t border-gray-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => handleNavigation('auth')}
                className="flex items-center space-x-2 transition-all duration-300 transform hover:scale-110 py-2 px-3 bg-white border-2 border-red-600 rounded-full text-black"
              >
                <UserIcon size={20} />
                <span className="hidden md:inline font-medium">Accedi</span>
              </button>
            )}
            
            {/* Hamburger Menu */}
            <button
              onClick={toggleMenu}
              className="transition-all duration-300 transform hover:scale-110 p-2 bg-white border-2 border-red-600 rounded-full text-black"
            >
              <Menu size={28} />
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
                  // Refresh della pagina dopo un breve delay per permettere la navigazione
                  setTimeout(() => {
                    window.location.reload();
                  }, 100);
                  setIsMenuOpen(false); // Chiude il menu mobile
                }}
              />
            </div>
            <button
              onClick={toggleMenu}
              className="text-black hover:text-red-600 transition-all duration-300 transform hover:scale-110 p-2"
            >
              <Menu size={24} />
            </button>
          </div>
          
          <nav className="px-4 sm:px-8 py-6 sm:py-8 overflow-y-auto max-h-[calc(100vh-100px)]">
            <ul className="space-y-2 sm:space-y-3">
              {/* 1. Profilo */}
              <li>
                <button
                  onClick={() => currentUser ? toggleUserMenu() : handleNavigation('auth')}
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                >
                  <UserIcon size={20} className="sm:w-6 sm:h-6" />
                  <span>{currentUser ? `${currentUser.name || t.header.profile} ${currentUser.role === 'admin' ? '(Admin)' : ''}` : t.header.profile}</span>
                </button>
              </li>
              {/* 2. Informazioni */}
              <li>
                <button
                  onClick={scrollToFooter}
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                >
                  <Mail size={20} className="sm:w-6 sm:h-6" />
                  <span>{t.header.information}</span>
                </button>
              </li>
              {/* 3. Orari */}
              <li>
                <button
                  onClick={() => scrollToSection('orari')}
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                >
                  <Clock size={20} className="sm:w-6 sm:h-6" />
                  <span>Orari</span>
                </button>
              </li>
              {/* 4. Regole */}
              <li>
                <button
                  onClick={handleShowRules}
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                >
                  <BookOpen size={20} className="sm:w-6 sm:h-6" />
                  <span>{t.header.rules}</span>
                </button>
              </li>
              {/* 5. Schede */}
              <li>
                <button
                  onClick={() => handleNavigation('workouts')}
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                >
                  <FileText size={20} className="sm:w-6 sm:h-6" />
                  <span>{t.header.workouts}</span>
                </button>
              </li>
              {/* 6. Aree */}
              <li>
                <button
                  onClick={() => scrollToSection('aree')}
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                >
                  <Dumbbell size={20} className="sm:w-6 sm:h-6" />
                  <span>Aree</span>
                </button>
              </li>
              {/* 7. Coach */}
              <li>
                <button
                  onClick={() => scrollToSection('staff')}
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                >
                  <Users size={20} className="sm:w-6 sm:h-6" />
                  <span>Coach</span>
                </button>
              </li>
              {/* 8. Posizione */}
              <li>
                <button
                  onClick={() => scrollToSection('posizione')}
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                >
                  <MapPin size={20} className="sm:w-6 sm:h-6" />
                  <span>{t.header.location}</span>
                </button>
              </li>
              {/* 9. Contatti */}
              <li>
                <button
                  onClick={() => scrollToSection('contatti')}
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                >
                  <Phone size={20} className="sm:w-6 sm:h-6" />
                  <span>Contatti</span>
                </button>
              </li>
              
              {currentUser && (
                <li>
                  <button
                    onClick={() => handleNavigation('cookie-settings')}
                    className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                  >
                    <FileText size={20} className="sm:w-6 sm:h-6" />
                    <span>{t.header.cookieSettings}</span>
                  </button>
                </li>
              )}
              
              {currentUser && currentUser.role === 'admin' && (
                <li>
                  <button
                    onClick={() => handleNavigation('admin-dashboard')}
                    className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
                  >
                    <Users size={20} className="sm:w-6 sm:h-6" />
                    <span>{t.header.adminDashboard}</span>
                  </button>
                </li>
              )}
              
              <li>
                <button
                  onClick={toggleLanguage}
                  className="flex items-center space-x-3 sm:space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
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
                    className="flex items-center space-x-3 sm:space-x-4 text-red-600 hover:text-red-700 transition-all duration-300 text-lg sm:text-xl font-semibold w-full text-left py-2 px-3 rounded-lg bg-white/90 hover:bg-white"
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