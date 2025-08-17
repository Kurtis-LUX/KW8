import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import StatisticsSection from './components/StatisticsSection';
import SubscriptionSection from './components/SubscriptionSection';
import GymAreasSection from './components/GymAreasSection';
import ScheduleSection from './components/ScheduleSection';
import LocationSection from './components/LocationSection';
import StaffSection from './components/StaffSection';
import SocialSection from './components/SocialSection';
import Footer from './components/Footer';
import PaymentPage from './pages/PaymentPage';
import AuthPage from './pages/AuthPage';
import WorkoutsPage from './pages/WorkoutsPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookieConsent from './components/CookieConsent';
import CookieSettings from './components/CookieSettings';
import Modal from './components/Modal';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import DB from './utils/database';
import initializeData from './utils/initData';
import { User } from './utils/database';
import { authService } from './services/authService';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [showCookieConsent, setShowCookieConsent] = useState(true);
  const [showCookieSettings, setShowCookieSettings] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCookiePolicyModal, setShowCookiePolicyModal] = useState(false);
  const [showPrivacyPolicyModal, setShowPrivacyPolicyModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Inizializza il database con le configurazioni di base
    DB.initializeDatabase();
    
    // Inizializza il database con dati di esempio
    initializeData();
    
    // Controlla se l'utente ha già dato il consenso ai cookie
    const hasConsent = localStorage.getItem('cookieConsent');
    if (hasConsent) {
      setShowCookieConsent(false);
    }
    
    // Auto-login sicuro con JWT
    const checkAutoLogin = async () => {
      try {
        const user = await authService.autoLogin();
        if (user) {
          setCurrentUser(user);
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
      } catch (error) {
        console.error('Auto-login failed:', error);
        // Rimuovi dati di sessione non validi
        localStorage.removeItem('currentUser');
        authService.logout();
      }
    };
    
    checkAutoLogin();
  }, []);

  const handleNavigation = (page: string, plan?: string) => {
    if (plan) {
      setSelectedPlan(plan);
    }
    
    if (page === 'privacy') {
      setShowPrivacyModal(true);
    } else if (page === 'terms') {
      setShowTermsModal(true);
    } else if (page === 'cookie-policy') {
      setShowCookiePolicyModal(true);
    } else if (page === 'privacy-policy') {
      setShowPrivacyPolicyModal(true);
    } else if (page === 'cookie-settings') {
      setShowCookieSettings(true);
    } else {
      setCurrentPage(page);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentPage('home');
  };
  
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    authService.logout(); // Pulisce i token JWT
    DB.clearAutoLogin(); // Rimuove l'auto-login
    // Se l'utente è in una pagina riservata, reindirizza alla home
    if (currentPage === 'workouts' || currentPage === 'admin-dashboard') {
      setCurrentPage('home');
    }
  };

  // Gestione delle pagine
  if (currentPage === 'payment') {
    return <PaymentPage onNavigate={handleNavigation} selectedPlan={selectedPlan} currentUser={currentUser} />;
  }

  if (currentPage === 'auth') {
    return <AuthPage onNavigate={handleNavigation} onLogin={handleLogin} />;
  }

  if (currentPage === 'workouts') {
    return currentUser ? 
      <WorkoutsPage onNavigate={handleNavigation} currentUser={currentUser} /> : 
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600">Accesso negato</h2>
        <p className="mt-4">Devi essere loggato per accedere a questa pagina.</p>
        <button 
          onClick={() => handleNavigation('auth')} 
          className="mt-4 px-4 py-2 bg-navy-800 text-white rounded hover:bg-navy-700"
        >
          Accedi
        </button>
      </div>;
  }

  if (currentPage === 'admin-dashboard') {
    return (
      <ProtectedRoute 
        requireAdmin={true}
        onUnauthorized={() => handleNavigation('auth')}
      >
        <AdminDashboard onNavigate={handleNavigation} currentUser={currentUser} />
      </ProtectedRoute>
    );
  }

  const handleCookieAccept = () => {
    // Cookie accettati
    // Qui puoi aggiungere logica per abilitare tutti i cookie
  };

  const handleCookieDecline = () => {
    // Cookie rifiutati
    // Qui puoi aggiungere logica per disabilitare i cookie non essenziali
  };

  return (
    <div className="min-h-screen">
      <Header onNavigate={handleNavigation} currentUser={currentUser} onLogout={handleLogout} />
      {showCookieConsent && (
        <CookieConsent 
          onAccept={handleCookieAccept} 
          onDecline={handleCookieDecline}
          onNavigate={handleNavigation}
        />
      )}
      {showCookieSettings && (
        <CookieSettings 
          onClose={() => setShowCookieSettings(false)} 
          currentUser={currentUser} 
        />
      )}
      <HeroSection />
      
      {/* Separatore decorativo */}
      <div className="w-full py-4 flex justify-center bg-white">
        <div className="w-32 h-1 bg-red-600 rounded-full"></div>
      </div>
      
      <StatisticsSection />
      
      {/* Separatore decorativo */}
      <div className="w-full py-4 flex justify-center bg-white">
        <div className="w-32 h-1 bg-red-600 rounded-full"></div>
      </div>
      
      <SubscriptionSection onNavigate={handleNavigation} />
      
      {/* Separatore decorativo */}
      <div className="w-full py-4 flex justify-center bg-white">
        <div className="w-32 h-1 bg-red-600 rounded-full"></div>
      </div>
      
      <GymAreasSection />
      
      {/* Separatore decorativo */}
      <div className="w-full py-4 flex justify-center bg-white">
        <div className="w-32 h-1 bg-red-600 rounded-full"></div>
      </div>
      
      <ScheduleSection />
      
      {/* Separatore decorativo */}
      <div className="w-full py-4 flex justify-center bg-white">
        <div className="w-32 h-1 bg-red-600 rounded-full"></div>
      </div>
      
      <LocationSection />
      
      {/* Separatore decorativo */}
      <div className="w-full py-4 flex justify-center bg-white">
        <div className="w-32 h-1 bg-red-600 rounded-full"></div>
      </div>
      
      <StaffSection />
      
      {/* Separatore decorativo */}
      <div className="w-full py-4 flex justify-center bg-white">
        <div className="w-32 h-1 bg-red-600 rounded-full"></div>
      </div>
      
      <SocialSection />
      <Footer onNavigate={handleNavigation} />
      
      {/* Modal per Privacy */}
      <Modal 
        isOpen={showPrivacyModal} 
        onClose={() => setShowPrivacyModal(false)}
        title="Informativa Privacy"
      >
        <PrivacyPage onNavigate={() => {}} />
      </Modal>
      
      {/* Modal per Termini e Condizioni */}
      <Modal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)}
        title="Termini e Condizioni"
      >
        <TermsPage onNavigate={() => {}} />
      </Modal>
      
      {/* Modal per Cookie Policy */}
      <Modal 
        isOpen={showCookiePolicyModal} 
        onClose={() => setShowCookiePolicyModal(false)}
        title="Cookie Policy"
      >
        <CookiePolicyPage onNavigate={() => {}} />
      </Modal>
      
      {/* Modal per Privacy Policy */}
      <Modal 
        isOpen={showPrivacyPolicyModal} 
        onClose={() => setShowPrivacyPolicyModal(false)}
        title="Privacy Policy"
      >
        <PrivacyPolicyPage onNavigate={() => {}} />
      </Modal>
    </div>
  );
}

export default App;