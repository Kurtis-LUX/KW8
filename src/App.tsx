import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import StatisticsSection from './components/StatisticsSection';
import SubscriptionSection from './components/SubscriptionSection';
import GymAreasSection from './components/GymAreasSection';
import ScheduleSection from './components/ScheduleSection';
import LocationSection from './components/LocationSection';
import StaffSection from './components/StaffSection';
import NewsletterSection from './components/NewsletterSection';
import SocialSection from './components/SocialSection';
import TrustpilotSection from './components/TrustpilotSection';
import Footer from './components/Footer';
import SectionSeparator from './components/SectionSeparator';
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
import { LanguageProvider } from './contexts/LanguageContext';

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
  const [appInitialized, setAppInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🔧 App initialization started');
        console.log('📱 Mobile debug - localStorage available:', typeof localStorage !== 'undefined');
        console.log('📱 Mobile debug - sessionStorage available:', typeof sessionStorage !== 'undefined');
        
        // Inizializza il database con le configurazioni di base e controlli di compatibilità
        console.log('💾 Initializing database...');
        await DB.initializeDatabase();
        console.log('💾 Database initialized');
        
        // Inizializza il database con dati di esempio
        console.log('📊 Initializing data...');
        await initializeData();
        console.log('📊 Data initialized');
        
        // Controlla se l'utente ha già dato il consenso ai cookie
        console.log('🍪 Checking cookie consent...');
        const hasConsent = localStorage.getItem('cookieConsent');
        if (hasConsent) {
          setShowCookieConsent(false);
          console.log('🍪 Cookie consent found, hiding banner');
        } else {
          console.log('🍪 No cookie consent found, showing banner');
        }
        
        // Auto-login sicuro con JWT
        const checkAutoLogin = async () => {
          try {
            console.log('🔐 Checking authentication');
            const user = await authService.autoLogin();
            if (user) {
              setCurrentUser(user);
              localStorage.setItem('currentUser', JSON.stringify(user));
              console.log('👤 User authenticated:', user.email);
            } else {
              console.log('👤 No authenticated user');
            }
          } catch (error) {
            console.error('❌ Auto-login failed:', error);
            // Rimuovi dati di sessione non validi
            localStorage.removeItem('currentUser');
            authService.logout();
          }
        };
        
        console.log('🔐 Starting auto-login check...');
        await checkAutoLogin();
        console.log('✅ App initialization completed successfully');
        setAppInitialized(true);
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        setInitError(error instanceof Error ? error.message : 'Unknown error');
        // Fallback per dispositivi mobili - forza il rendering anche in caso di errore
        console.log('🔄 Forcing app render despite initialization error');
        setAppInitialized(true); // Forza il rendering anche con errori
      }
    };
    
    console.log('🚀 Starting app initialization...');
    initializeApp();
  }, []);

  // Blocca lo scroll della pagina quando qualsiasi modal è aperto
  useEffect(() => {
    const isAnyModalOpen = showCookieSettings || showPrivacyModal || showTermsModal || 
                          showCookiePolicyModal || showPrivacyPolicyModal;
    
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup quando il componente viene smontato
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showCookieSettings, showPrivacyModal, showTermsModal, showCookiePolicyModal, showPrivacyPolicyModal]);

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
    return (
      <LanguageProvider>
        <PaymentPage onNavigate={handleNavigation} selectedPlan={selectedPlan} currentUser={currentUser} />
      </LanguageProvider>
    );
  }

  if (currentPage === 'auth') {
    return (
      <LanguageProvider>
        <AuthPage onNavigate={handleNavigation} onLogin={handleLogin} />
      </LanguageProvider>
    );
  }

  if (currentPage === 'workouts') {
    return (
      <LanguageProvider>
        {currentUser ? 
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
          </div>
        }
      </LanguageProvider>
    );
  }

  if (currentPage === 'admin-dashboard') {
    return (
      <LanguageProvider>
        <ProtectedRoute 
          requireAdmin={true}
          onUnauthorized={() => handleNavigation('auth')}
        >
          <AdminDashboard onNavigate={handleNavigation} currentUser={currentUser} />
        </ProtectedRoute>
      </LanguageProvider>
    );
  }

  if (currentPage === 'email-test') {
    return (
      <LanguageProvider>
        <div className="min-h-screen bg-gray-100 py-8">
          <div className="container mx-auto px-4">
            <div className="mb-6">
              <button
                onClick={() => handleNavigation('home')}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                ← Torna alla Home
              </button>
            </div>
          </div>
        </div>
      </LanguageProvider>
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

  // Mostra loading o errore durante l'inizializzazione
  if (!appInitialized) {
    return (
      <LanguageProvider>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-navy-800 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Caricamento in corso...</p>
            {initError && (
              <p className="text-red-500 mt-2 text-sm">Errore: {initError}</p>
            )}
          </div>
        </div>
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-white">
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
        <StatisticsSection />
        <SectionSeparator variant="black" />
        <GymAreasSection />
        <SectionSeparator variant="black" />
        <ScheduleSection />
        <SectionSeparator variant="black" />
        <LocationSection />
        <SectionSeparator variant="black" />
        <StaffSection />
        <SectionSeparator variant="black" />
        <SubscriptionSection onNavigate={handleNavigation} />
        <NewsletterSection />
        <TrustpilotSection />
        <SectionSeparator variant="default" />
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
    </LanguageProvider>
  );
}

export default App;