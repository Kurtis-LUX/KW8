import React, { useState, useEffect } from 'react';
import { Settings, ChevronLeft, Users } from 'lucide-react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import StatisticsSection from './components/StatisticsSection';

import GymAreasSection from './components/GymAreasSection';
import ScheduleSection from './components/ScheduleSection';
import LocationSection from './components/LocationSection';
import EditableStaffSection from './components/EditableStaffSection';
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

import MembershipCardsPage from './pages/MembershipCardsPage';
import WorkoutCardPage from './pages/WorkoutCardPage';
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
import LoadingTransition from './components/LoadingTransition';
import DB from './utils/database';
import initializeData from './utils/initData';

import { authService } from './services/authService';
import { LanguageProvider } from './contexts/LanguageContext';
import LoadingScreen from './components/LoadingScreen';
import './styles/dropdown.css';
import AthleteAuthPage from './components/auth/AthleteAuthPage';
import AthleteRegisterPage from './pages/AthleteRegisterPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [workoutLinkId, setWorkoutLinkId] = useState<string | null>(null);
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
        
        // Controlla se l'URL contiene un link per una scheda
        const urlParams = new URLSearchParams(window.location.search);
        const linkId = urlParams.get('workout');
        if (linkId) {
          setWorkoutLinkId(linkId);
          setCurrentPage('workout-card');
          console.log('🔗 Workout link detected:', linkId);
        }
        
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
            console.log('🔐 Checking for existing authentication...');
            
            // Prima prova con il sistema JWT
            const jwtUser = await authService.autoLogin();
            if (jwtUser) {
              setCurrentUser(jwtUser);
              // Sincronizza con localStorage per compatibilità
              localStorage.setItem('currentUser', JSON.stringify(jwtUser));
              console.log('👤 Restored JWT user session:', jwtUser.email);
              return;
            }
            
            // Fallback per sessioni legacy (solo se non c'è JWT)
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser && !authService.getToken()) {
              const user = JSON.parse(savedUser);
              setCurrentUser(user);
              console.log('👤 Restored legacy user session:', user.name);
            } else {
              console.log('👤 No existing session found');
            }
          } catch (error) {
            console.error('❌ Auto-login failed:', error);
            // Pulisci tutti i dati di sessione non validi
            localStorage.removeItem('currentUser');
            authService.logout();
          }
        };

        console.log('🔐 Starting authentication check...');
        await checkAutoLogin();
        // Apri la Privacy Policy se l'URL diretto è /privacy
        if (window.location && window.location.pathname === '/privacy') {
          setShowPrivacyPolicyModal(true);
        }
        // Apri i Termini se l'URL diretto è /terms
        if (window.location && window.location.pathname === '/terms') {
          setShowTermsModal(true);
        }
        // Apri la Cookie Policy se l'URL diretto è /cookie-policy
        if (window.location && window.location.pathname === '/cookie-policy') {
          setShowCookiePolicyModal(true);
        }
        // Apri le impostazioni cookie se l'URL diretto è /cookie-settings
        if (window.location && window.location.pathname === '/cookie-settings') {
          setShowCookieSettings(true);
        }
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



  const handleNavigation = (page: string, plan?: string, linkId?: string) => {
    if (plan) {
      setSelectedPlan(plan);
    }
    
    if (page === 'workout-card' && linkId) {
      setWorkoutLinkId(linkId);
      setCurrentPage('workout-card');
    } else if (page === 'privacy') {
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
    // Mantieni la sincronizzazione con localStorage per compatibilità
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
    
    // Reindirizza immediatamente alla home
    setCurrentPage('home');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('✅ Logout completato');
  };

  // Gestione delle pagine

  if (currentPage === 'login') {
    return (
      <LanguageProvider>
        <CoachAuthPage 
          onAuthSuccess={async () => {
            try {
              const user = await authService.autoLogin();
              if (user) {
                setCurrentUser(user);
                handleNavigation('home');
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

  if (currentPage === 'athlete-auth') {
    return (
      <LanguageProvider>
        <AthleteAuthPage 
          onAuthSuccess={async () => {
            try {
              const user = await authService.autoLogin();
              if (user) {
                setCurrentUser(user);
                handleNavigation('workouts');
              } else {
                console.error('Login riuscito ma utente non trovato');
                handleNavigation('workouts');
              }
            } catch (error) {
              console.error('Errore durante la verifica post-login:', error);
              handleNavigation('workouts');
            }
          }}
          onNavigateHome={() => handleNavigation('home')}
          onNavigateRegister={() => handleNavigation('athlete-register')}
        />
      </LanguageProvider>
    );
  }

  if (currentPage === 'athlete-register') {
    return (
      <LanguageProvider>
        <AthleteRegisterPage
          onAuthSuccess={async () => {
            try {
              const user = await authService.autoLogin();
              if (user) {
                setCurrentUser(user);
                handleNavigation('workouts');
              } else {
                console.error('Registrazione riuscita ma utente non trovato');
                handleNavigation('workouts');
              }
            } catch (error) {
              console.error('Errore durante la verifica post-registrazione:', error);
              handleNavigation('workouts');
            }
          }}
          onNavigateHome={() => handleNavigation('home')}
          onNavigateLogin={() => handleNavigation('athlete-auth')}
        />
      </LanguageProvider>
    );
  }

  if (currentPage === 'coach-dashboard') {
    return (
      <LanguageProvider>
        <ProtectedRoute requireAdmin={false} onUnauthorized={() => handleNavigation('login')}>
          <div className="min-h-screen bg-gray-100">
            <Header onNavigate={handleNavigation} currentUser={currentUser} onLogout={handleLogout} isDashboard={true} currentPage={currentPage} />
            <div className="pt-20">
              <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex items-center justify-between bg-white/60 backdrop-blur-md rounded-2xl ring-1 ring-black/10 shadow-sm px-4 py-3">
                  <button
                    onClick={() => handleNavigation('home')}
                    className="inline-flex items-center justify-center transition-all duration-300 transform hover:scale-110 p-2 text-red-600 bg-white/60 backdrop-blur-sm rounded-2xl ring-1 ring-black/10 hover:bg-white/80 hover:shadow-sm active:scale-[0.98]"
                    title="Torna alla Home"
                  >
                    <ChevronLeft size={24} className="block" />
                  </button>
                  
                  <div className="text-center flex-1">
                    <h1 className="font-sfpro text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-navy-900 tracking-tight drop-shadow-sm mb-1">Dashboard Coach</h1>
                    <p className="font-sfpro text-[#001f3f]/90 font-medium text-sm sm:text-base">Gestione schede, programmi e atleti</p>
                  </div>
                  
                  <div className="w-10"></div>
                </div>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
                <div 
                  className="group rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-black/10 shadow-sm p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-md hover:ring-black/20"
                  onClick={() => handleNavigation('workout-manager')}
                >
                  <div className="flex items-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 text-blue-600 mr-3 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Gestione Schede</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Crea e gestisci le schede di allenamento per i tuoi atleti</p>
                </div>
                <div 
                  className="group rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-black/10 shadow-sm p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-md hover:ring-black/20"
                  onClick={() => handleNavigation('athlete-manager')}
                >
                  <div className="flex items-center mb-3 sm:mb-4">
                    <Users className="w-6 h-6 text-green-600 mr-3 transition-transform duration-300 group-hover:scale-110" />
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Gestione Atleti</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Visualizza e gestisci i profili dei tuoi atleti</p>
                </div>
                <div 
                  className="group rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-black/10 shadow-sm p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-md hover:ring-black/20"
                  onClick={() => handleNavigation('rankings')}
                >
                  <div className="flex items-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 text-purple-600 mr-3 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Classifiche</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Visualizza i massimali e i record degli atleti</p>
                </div>
                <div 
                  className="group rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-black/10 shadow-sm p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-md hover:ring-black/20"
                  onClick={() => handleNavigation('membership-cards')}
                >
                  <div className="flex items-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 text-emerald-600 mr-3 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 00-3 3z" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Tesserini Atleti</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Gestisci tesserini e pagamenti degli atleti</p>
                </div>
                <div 
                  className="group rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-black/10 shadow-sm p-4 sm:p-6 cursor-pointer transition-all duration-300 hover:bg-white hover:shadow-md hover:ring-black/20"
                  onClick={() => handleNavigation('athlete-statistics')}
                >
                  <div className="flex items-center mb-3 sm:mb-4">
                    <svg className="w-6 h-6 text-orange-600 mr-3 transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">Statistiche Atleti</h3>
                  </div>
                  <p className="text-sm sm:text-base text-gray-600">Visualizza progressi e analisi dettagliate degli atleti</p>
                </div>
>
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
              onClick={() => handleNavigation('login')} 
              className="mt-4 px-4 py-2 bg-navy-800 text-white rounded hover:bg-navy-700"
            >
              Accedi come Coach
            </button>
          </div>
        }
      </LanguageProvider>
    );
  }

  if (currentPage === 'workout-manager') {
    return (
      <LanguageProvider>
        <ProtectedRoute requireAdmin={false} onUnauthorized={() => handleNavigation('login')}>
          <WorkoutManagerPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
          />
        </ProtectedRoute>
      </LanguageProvider>
    );
  }

  if (currentPage === 'athlete-statistics') {
    return (
      <LanguageProvider>
        <ProtectedRoute requireAdmin={false} onUnauthorized={() => handleNavigation('login')}>
          <AthleteStatisticsPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
            onLogout={handleLogout}
          />
        </ProtectedRoute>
      </LanguageProvider>
    );
  }

  if (currentPage === 'athlete-manager') {
    return (
      <LanguageProvider>
        <ProtectedRoute requireAdmin={false} onUnauthorized={() => handleNavigation('login')}>
          <AthleteManagerPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
            onLogout={handleLogout}
          />
        </ProtectedRoute>
      </LanguageProvider>
    );
  }

  if (currentPage === 'rankings') {
    return (
      <LanguageProvider>
        <ProtectedRoute requireAdmin={false} onUnauthorized={() => handleNavigation('login')}>
          <RankingsPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
            onLogout={handleLogout}
          />
        </ProtectedRoute>
      </LanguageProvider>
    );
  }



  if (currentPage === 'membership-cards') {
    return (
      <LanguageProvider>
        <ProtectedRoute requireAdmin={false} onUnauthorized={() => handleNavigation('login')}>
          <MembershipCardsPage 
            onNavigate={handleNavigation} 
            currentUser={currentUser} 
            onLogout={handleLogout}
          />
        </ProtectedRoute>
      </LanguageProvider>
    );
  }

  if (currentPage === 'workout-card') {
    return (
      <LanguageProvider>
        <ProtectedRoute requireAdmin={false} onUnauthorized={() => handleNavigation('login')}>
          <WorkoutCardPage />
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
        <Header onNavigate={handleNavigation} currentUser={currentUser} onLogout={handleLogout} currentPage={currentPage} />
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
        <GymAreasSection />
        <ScheduleSection currentUser={currentUser} />
        <LocationSection />
        <EditableStaffSection currentUser={currentUser} />
        <NewsletterSection />
        <TrustpilotSection />
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
        <CookiePolicyPage onNavigate={handleNavigation} />
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