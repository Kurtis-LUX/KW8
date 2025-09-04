import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
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

import AuthPage from './pages/AuthPage';
import WorkoutsPage from './pages/WorkoutsPage';
import WorkoutManagerPage from './pages/WorkoutManagerPage';
import AthleteStatisticsPage from './pages/AthleteStatisticsPage';
import AthleteManagerPage from './pages/AthleteManagerPage';
import RankingsPage from './pages/RankingsPage';
import LinkManagerPage from './pages/LinkManagerPage';
import MembershipCardsPage from './pages/MembershipCardsPage';
import CoachAuthPage from './components/auth/CoachAuthPage';
import PrivacyPage from './pages/PrivacyPage';
import CookiePolicyPage from './pages/CookiePolicyPage';
import TermsPage from './pages/TermsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import CookieConsent from './components/CookieConsent';
import CookieSettings from './components/CookieSettings';
import Modal from './components/Modal';
import DataMigration from './components/DataMigration';

import ProtectedRoute from './components/ProtectedRoute';
import DB from './utils/database';
import initializeData from './utils/initData';

import { authService } from './services/authService';
import { LanguageProvider } from './contexts/LanguageContext';
import LoadingScreen from './components/LoadingScreen';
import './styles/dropdown.css';

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
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [workoutsDefaultTab, setWorkoutsDefaultTab] = useState<string>('current');

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
      // Reset del tab di default per workouts se non viene dalla dashboard coach
      if (page === 'workouts' && workoutsDefaultTab !== 'current') {
        setWorkoutsDefaultTab('current');
      }
      setCurrentPage(page);
    }
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    setCurrentPage('home');
  };
  
  const handleLogout = () => {
    console.log('🚪 Logout iniziato');
    
    // Pulisci lo stato dell'applicazione
    setCurrentUser(null);
    
    // Pulisci localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('kw8_auto_login');
    
    // Pulisci authService (token JWT e cookie)
    authService.logout();
    
    // Pulisci database locale
    DB.clearAutoLogin();
    
    // Se l'utente è in una pagina riservata, reindirizza alla home
    if (currentPage === 'workouts' || currentPage === 'admin-dashboard' || currentPage === 'coach-dashboard') {
      setCurrentPage('home');
    }
    
    console.log('✅ Logout completato');
  };

  // Gestione delle pagine

  if (currentPage === 'auth') {
    return (
      <LanguageProvider>
        <AuthPage onNavigate={handleNavigation} onLogin={handleLogin} />
      </LanguageProvider>
    );
  }

  if (currentPage === 'login') {
    return (
      <LanguageProvider>
        <CoachAuthPage 
          onAuthSuccess={async () => {
            // Verifica l'autenticazione e aggiorna lo stato dell'utente
            try {
              const user = await authService.autoLogin();
              if (user) {
                setCurrentUser(user);
                handleNavigation('coach-dashboard');
              } else {
                console.error('Login Google riuscito ma utente non trovato');
                handleNavigation('home');
              }
            } catch (error) {
              console.error('Errore durante la verifica post-login:', error);
              handleNavigation('home');
            }
          }}
          onNavigateHome={() => handleNavigation('home')}
        />
      </LanguageProvider>
    );
  }

  if (currentPage === 'coach-dashboard') {
    return (
      <LanguageProvider>
        <ProtectedRoute requireAdmin={false}>
          <div className="min-h-screen bg-gray-100">
            <Header onNavigate={handleNavigation} currentUser={currentUser} onLogout={handleLogout} isDashboard={true} />
            <div className="bg-white shadow-sm border-b mt-20">
              <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
                <div className="flex justify-center items-center py-4 sm:py-6">
                  <div className="text-center">
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-600 to-blue-900 bg-clip-text text-transparent">
                      Dashboard Coach
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">Gestione schede, programmi e atleti</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">📋 Gestione Schede</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Crea e gestisci le schede di allenamento per i tuoi atleti</p>
                  <button 
                    onClick={() => handleNavigation('workout-manager')}
                    className="w-full bg-blue-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                  >
                    Gestisci Schede
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">👥 Gestione Atleti</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Visualizza e gestisci i profili dei tuoi atleti</p>
                  <button 
                    onClick={() => handleNavigation('athlete-manager')}
                    className="w-full bg-green-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-green-700 transition-colors text-sm sm:text-base"
                  >
                    Gestisci Atleti
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🏆 Classifiche</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Visualizza i massimali e i record degli atleti</p>
                  <button 
                    onClick={() => handleNavigation('rankings')}
                    className="w-full bg-purple-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base"
                  >
                    Visualizza Classifiche
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">🔗 Gestione Link</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Gestisci i link di accesso alle schede per gli atleti</p>
                  <button 
                    onClick={() => handleNavigation('link-manager')}
                    className="w-full bg-indigo-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm sm:text-base"
                  >
                    Gestisci Link
                  </button>
                </div>
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">💳 Tesserini Atleti</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Gestisci tesserini e pagamenti degli atleti</p>
                  <button 
                    onClick={() => handleNavigation('membership-cards')}
                    className="w-full bg-emerald-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base"
                  >
                    Gestisci Tesserini
                  </button>
                </div>
                <div 
                  className="bg-white rounded-lg shadow p-4 sm:p-6 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
                  onClick={() => handleNavigation('athlete-statistics')}
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">📊 Statistiche Atleti</h3>
                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">Visualizza progressi e analisi dettagliate degli atleti</p>
                  <button 
                    onClick={() => handleNavigation('athlete-statistics')}
                    className="w-full bg-orange-600 text-white py-2 px-3 sm:px-4 rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base"
                  >
                    Visualizza Statistiche
                  </button>
                </div>
              </div>
              
              {/* Sezione Migrazione Dati */}
              <div className="mt-8">
                <DataMigration currentUser={currentUser} />
              </div>
            </div>
          </div>
        </ProtectedRoute>
      </LanguageProvider>
    );
  }

  if (currentPage === 'workouts') {
    return (
      <LanguageProvider>
        {currentUser ? 
          <WorkoutsPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
            defaultTab={workoutsDefaultTab}
          /> : 
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

  if (currentPage === 'workout-manager') {
    return (
      <LanguageProvider>
        {currentUser ? 
          <WorkoutManagerPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
          /> : 
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

  if (currentPage === 'athlete-statistics') {
    return (
      <LanguageProvider>
        {currentUser ? 
          <AthleteStatisticsPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
          /> : 
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

  if (currentPage === 'athlete-manager') {
    return (
      <LanguageProvider>
        {currentUser ? 
          <AthleteManagerPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
          /> : 
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

  if (currentPage === 'rankings') {
    return (
      <LanguageProvider>
        {currentUser ? 
          <RankingsPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
          /> : 
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

  if (currentPage === 'link-manager') {
    return (
      <LanguageProvider>
        {currentUser ? 
          <LinkManagerPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
          /> : 
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

  if (currentPage === 'membership-cards') {
    return (
      <LanguageProvider>
        {currentUser && currentUser.role === 'coach' ? (
          <MembershipCardsPage onBack={() => handleNavigation('home')} />
        ) : (
          <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Accesso Negato</h2>
              <p className="text-gray-600 mb-6">Non hai i permessi per accedere a questa pagina.</p>
              <button
                onClick={() => handleNavigation('home')}
                className="px-4 py-2 bg-navy-800 text-white rounded hover:bg-navy-700"
              >
                Torna alla Home
              </button>
            </div>
          </div>
        )}
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

  // Mostra loading screen personalizzata
  if (showLoadingScreen) {
    return (
      <LanguageProvider>
        <LoadingScreen onLoadingComplete={() => setShowLoadingScreen(false)} />
      </LanguageProvider>
    );
  }

  // Mostra errore durante l'inizializzazione se necessario
  if (!appInitialized && initError) {
    return (
      <LanguageProvider>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mt-2 text-sm">Errore: {initError}</p>
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
        <HeroSection currentUser={currentUser} onNavigate={handleNavigation} />
        <StatisticsSection />
        <SectionSeparator variant="black" />
        <GymAreasSection />
        <SectionSeparator variant="black" />
        <ScheduleSection currentUser={currentUser} />
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