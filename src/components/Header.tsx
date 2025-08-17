import React, { useState, useEffect } from 'react';
import { Menu, X, User as UserIcon, CreditCard, MapPin, Users, FileText } from 'lucide-react';

import { User } from '../utils/database';

interface HeaderProps {
  onNavigate?: (page: string) => void;
  currentUser?: User | null;
  onLogout?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNavigate, currentUser, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Aggiungi event listener per lo scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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
    scrollToSection('abbonamenti');
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
              className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-105 cursor-pointer"
              onClick={() => {
                if (onNavigate) {
                  onNavigate('home');
                }
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>

          {/* Central CTA - Positioned in the center of the page */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <button 
              onClick={handleSubscribe}
              className="hidden md:block bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              ISCRIVITI ORA
            </button>
          </div>

          {/* Mobile CTA */}
          <button 
            onClick={handleSubscribe}
            className="md:hidden bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded text-sm transition-all duration-300 transform hover:scale-105"
          >
            ISCRIVITI ORA
          </button>

          {/* User Profile / Login Button */}
          <div className="flex items-center space-x-4">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center space-x-2 text-gray-800 hover:text-gray-600 transition-all duration-300 transform hover:scale-110 py-2 px-3 rounded-full bg-white shadow-sm border-2 border-red-600"
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
                      Impostazioni Cookie
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
                className="flex items-center space-x-2 text-gray-800 hover:text-gray-600 transition-all duration-300 transform hover:scale-110 py-2 px-3 rounded-full bg-white shadow-sm border-2 border-red-600"
              >
                <UserIcon size={20} />
                <span className="hidden md:inline font-medium">Accedi</span>
              </button>
            )}
            
            {/* Hamburger Menu */}
            <button
              onClick={toggleMenu}
              className="text-gray-800 hover:text-gray-600 transition-all duration-300 transform hover:scale-110 p-2 rounded-full bg-white shadow-sm border-2 border-red-600"
            >
              <Menu size={28} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[100] bg-red-50 transition-all duration-500 transform ${isMenuOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-full'}`}>
          <div className="flex justify-between p-4 items-center">
            <div className="flex items-center">
              <img 
                src="/images/logo.png" 
                alt="KW8 Logo" 
                className="h-12 w-auto object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>
            <button
              onClick={toggleMenu}
              className="text-navy-900 hover:text-red-600 transition-all duration-300 transform hover:scale-110"
            >
              <Menu size={28} />
            </button>
          </div>
          
          <nav className="px-8 py-8">
            <ul className="space-y-6">
              <li>
                <button
                  onClick={() => currentUser ? toggleUserMenu() : handleNavigation('auth')}
                  className="flex items-center space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-xl font-semibold w-full text-left py-3 px-4 rounded-lg bg-white/90 hover:bg-white"
                >
                  <UserIcon size={24} />
                  <span>{currentUser ? `${currentUser.name || 'Profilo'} ${currentUser.role === 'admin' ? '(Admin)' : ''}` : 'Accedi'}</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('abbonamenti')}
                  className="flex items-center space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-xl font-semibold w-full text-left py-3 px-4 rounded-lg bg-white/90 hover:bg-white"
                >
                  <CreditCard size={24} />
                  <span>Abbonamenti</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('posizione')}
                  className="flex items-center space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-xl font-semibold w-full text-left py-3 px-4 rounded-lg bg-white/90 hover:bg-white"
                >
                  <MapPin size={24} />
                  <span>Posizione</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => scrollToSection('staff')}
                  className="flex items-center space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-xl font-semibold w-full text-left py-3 px-4 rounded-lg bg-white/90 hover:bg-white"
                >
                  <Users size={24} />
                  <span>Coach</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNavigation('workouts')}
                  className="flex items-center space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-xl font-semibold w-full text-left py-3 px-4 rounded-lg bg-white/90 hover:bg-white"
                >
                  <FileText size={24} />
                  <span>Schede</span>
                </button>
              </li>
              
              {currentUser && (
                <li>
                  <button
                    onClick={() => handleNavigation('cookie-settings')}
                    className="flex items-center space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-xl font-semibold w-full text-left py-3 px-4 rounded-lg bg-white/90 hover:bg-white"
                  >
                    <FileText size={24} />
                    <span>Impostazioni Cookie</span>
                  </button>
                </li>
              )}
              
              {currentUser && currentUser.role === 'admin' && (
                <li>
                  <button
                    onClick={() => handleNavigation('admin-dashboard')}
                    className="flex items-center space-x-4 text-gray-800 hover:text-gray-600 transition-all duration-300 text-xl font-semibold w-full text-left py-3 px-4 rounded-lg bg-white/90 hover:bg-white"
                  >
                    <Users size={24} />
                    <span>Dashboard Admin</span>
                  </button>
                </li>
              )}
              
              {currentUser && (
                <li>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-4 text-red-600 hover:text-red-700 transition-all duration-300 text-xl font-semibold w-full text-left py-3 px-4 rounded-lg bg-white/90 hover:bg-white"
                  >
                    <UserIcon size={24} />
                    <span>Logout</span>
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
    </>
  );
};

export default Header;