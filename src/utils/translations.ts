export interface Translations {
  // Header
  header: {
    profile: string;
    information: string;
    location: string;
    staff: string;
    rules: string;
    workouts: string;
    cookieSettings: string;
  
    logout: string;
    language: string;
  };

  // Hero Section
  heroTitle: string;
  heroSubtitle: string;
  discoverMore: string;
  subscribeNow: string;

  // Statistics Section
  subscribers: string;
  yearsOfActivity: string;
  moreEnergy: string;
  moreEnergyDesc: string;
  aesthetics: string;
  aestheticsDesc: string;
  posture: string;
  postureDesc: string;
  nutrition: string;
  nutritionDesc: string;
  selfDefense: string;
  selfDefenseDesc: string;
  discipline: string;
  disciplineDesc: string;
  stressManagement: string;
  stressManagementDesc: string;
  mentalWellbeing: string;
  mentalWellbeingDesc: string;

  // Staff Section
  ourTeam: string;
  certifications: string;
  closeCertifications: string;

  // Gym Areas Section
  gymAreas: string;
  crossfit: string;
  crossfitDesc: string;
  weightRoom: string;
  weightRoomDesc: string;
  karate: string;
  karateDesc: string;
  yoga: string;
  yogaDesc: string;

  // Schedule Section
  schedules: string;
  schedulesDesc: string;
  morning: string;
  evening: string;
  callNow: string;
  sunday: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  openNow: string;
  closedNow: string;
  today: string;

  // Location Section
  whereWeAre: string;
  whereAreWe: string;
  openOnGoogleMaps: string;
  address: string;
  phone: string;
  email: string;
  openingHours: string;
  mondayFriday: string;
  closed: string;

  // Newsletter Section
  newsletter: string;
  newsletterDesc: string;
  newsletterDescription: string;
  enterEmail: string;
  enterValidEmail: string;
  emailAlreadySubscribed: string;
  enterYourEmail: string;
  sending: string;
  subscribeToNewsletter: string;
  subscriptionSuccess: string;
  noSpamPolicy: string;
  emailPlaceholder: string;
  subscribe: string;
  subscribeSuccess: string;
  subscribeError: string;

  // Trustpilot Section
  customerReviews: string;
  whatOurClientsSay: string;
  excellent: string;
  reviews: string;
  joinSatisfiedClients: string;
  seeAllReviews: string;
  trustpilotDesc: string;

  // Footer
  legal: string;
  termsAndConditions: string;
  cookies: string;
  managePreferences: string;
  contacts: string;
  copyright: string;
  quickLinks: string;
  followUs: string;
  contactInfo: string;
  privacyPolicy: string;
  termsOfService: string;
  cookiePolicy: string;
  allRightsReserved: string;

  // Cookie Settings
  cookieSettings: string;
  essentialCookies: string;
  essentialCookiesDesc: string;
  marketingCookies: string;
  marketingCookiesDesc: string;
  statisticsCookies: string;
  statisticsCookiesDesc: string;
  savePreferences: string;
  acceptAll: string;
  note: string;
  cookiePreferencesNote: string;

  // Cookie Consent
  weUseCookies: string;
  cookieConsentText: string;
  decline: string;

  // Error Boundary
  errorTitle: string;
  errorMessage: string;
  reloadPage: string;
  errorDetails: string;

  // Progress Section
  transformations: {
    title: string;
    marco: {
      name: string;
      title: string;
      description: string;
      duration: string;
      stats: {
        weightLost: string;
        bodyFat: string;
        strength: string;
      };
    };
    sara: {
      name: string;
      title: string;
      description: string;
      duration: string;
      stats: {
        muscleMass: string;
        strength: string;
        endurance: string;
      };
    };
    giuseppe: {
      name: string;
      title: string;
      description: string;
      duration: string;
      stats: {
        pain: string;
        mobility: string;
        posture: string;
      };
    };
  };
  before: string;
  after: string;
  age: string;
  weight: string;
  height: string;
  goal: string;
  duration: string;
  months: string;
}

export const translations: Record<'it' | 'en', Translations> = {
  it: {
    // Header
    header: {
      profile: 'Profilo',
      information: 'Informazioni',
      location: 'Posizione',
      staff: 'Coach',
      rules: 'Regole',
      workouts: 'Schede',
      cookieSettings: 'Impostazioni Cookie',
  
      logout: 'Logout',
      language: 'Lingua',
    },

    // Hero Section
    heroTitle: 'CROSS YOUR LIMITS.',
    heroSubtitle: 'Supera i tuoi limiti con il nostro team di esperti. Raggiungi i tuoi obiettivi di fitness in un ambiente motivante e professionale.',
    discoverMore: 'SCOPRI DI PIÙ',
    subscribeNow: 'ISCRIVITI ORA',

    // Statistics Section
    subscribers: 'iscritti',
    yearsOfActivity: 'anni di attività',
    moreEnergy: 'Più energia',
    moreEnergyDesc: 'Aumenta i tuoi livelli di energia e vitalità quotidiana',
    aesthetics: 'Estetica',
    aestheticsDesc: 'Miglioramento dell\'aspetto fisico e della forma',
    posture: 'Postura',
    postureDesc: 'Correzione della postura e allineamento corporeo',
    nutrition: 'Alimentazione',
    nutritionDesc: 'Consulenza nutrizionale personalizzata',
    selfDefense: 'Autodifesa',
    selfDefenseDesc: 'Tecniche di difesa personale e sicurezza',
    discipline: 'Disciplina',
    disciplineDesc: 'Sviluppo della disciplina e costanza',
    stressManagement: 'Gestione dello stress',
    stressManagementDesc: 'Tecniche per ridurre stress e ansia',
    mentalWellbeing: 'Benessere mentale',
    mentalWellbeingDesc: 'Miglioramento dell\'equilibrio psico-fisico e autostima',

    // Staff Section
    ourTeam: 'IL NOSTRO TEAM',
    certifications: 'Certificazioni',
    closeCertifications: 'Chiudi Certificazioni',

    // Gym Areas Section
    gymAreas: 'LE NOSTRE AREE',
    crossfit: 'Cross training',
    crossfitDesc: 'Allenamento funzionale ad alta intensità per migliorare forza, resistenza e agilità.',
    weightRoom: 'Sala Pesi',
    weightRoomDesc: 'Attrezzature moderne per l\'allenamento con i pesi e il bodybuilding.',
    karate: 'Karate',
    karateDesc: 'Arte marziale tradizionale per disciplina, tecnica e autodifesa.',
    yoga: 'Yoga',
    yogaDesc: 'Pratiche per il benessere fisico e mentale, flessibilità e rilassamento.',

    // Schedule Section
    schedules: 'ORARI',
    schedulesDesc: 'Scopri gli orari delle nostre attività e prenota la tua sessione di allenamento.',
    morning: 'Mattina',
    evening: 'Sera',
    callNow: 'CHIAMACI ORA',
    sunday: 'Domenica',
    monday: 'Lunedì',
    tuesday: 'Martedì',
    wednesday: 'Mercoledì',
    thursday: 'Giovedì',
    friday: 'Venerdì',
    saturday: 'Sabato',
    openNow: 'APERTO',
    closedNow: 'CHIUSO',
    today: 'Oggi',

    // Location Section
    whereWeAre: 'Dove siamo',
    whereAreWe: 'DOVE CI TROVIAMO?',
    openOnGoogleMaps: 'APRI SU GOOGLE MAPS',
    address: 'Indirizzo',
    phone: 'Telefono',
    email: 'Email',
    openingHours: 'Orari di apertura',
    mondayFriday: 'Lunedì - Venerdì',
    closed: 'CHIUSO',

    // Newsletter Section
    newsletter: 'Newsletter',
    newsletterDesc: 'Rimani aggiornato sulle nostre novità, eventi e offerte speciali.',
    newsletterDescription: '',
    enterEmail: 'Inserisci un indirizzo email',
    enterValidEmail: 'Inserisci un indirizzo email valido',
    emailAlreadySubscribed: 'Questa email è già iscritta alla newsletter.',
    enterYourEmail: 'Inserisci la tua email',
    sending: 'INVIO IN CORSO...',
    subscribeToNewsletter: 'ISCRIVITI ALLA NEWSLETTER',
    subscriptionSuccess: 'Perfetto! Ti abbiamo inviato un\'email di benvenuto con tutte le informazioni sulla palestra.',
    noSpamPolicy: 'Non invieremo spam. Puoi annullare l\'iscrizione in qualsiasi momento.',
    emailPlaceholder: 'Inserisci la tua email',
    subscribe: 'Iscriviti',
    subscribeSuccess: 'Iscrizione avvenuta con successo!',
    subscribeError: 'Errore durante l\'iscrizione. Riprova.',

    // Trustpilot Section
    customerReviews: 'Recensioni dei clienti',
    whatOurClientsSay: 'COSA DICONO I NOSTRI CLIENTI',
    excellent: 'Eccellente',
    reviews: 'recensioni',
    joinSatisfiedClients: 'Unisciti ai nostri clienti soddisfatti!',
    seeAllReviews: 'Vedi tutte le recensioni',
    trustpilotDesc: 'Scopri cosa dicono i nostri clienti sulla loro esperienza con noi.',

    // Footer
    legal: 'Legale',
    termsAndConditions: 'Termini e condizioni',
    cookies: 'Cookie',
    managePreferences: 'Gestisci preferenze',
    contacts: 'Contatti',
    copyright: '© KW8 2025 - Tutti i diritti riservati.',
    quickLinks: 'Link rapidi',
    followUs: 'Seguici',
    contactInfo: 'Informazioni di contatto',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Termini di Servizio',
    cookiePolicy: 'Cookie Policy',
    allRightsReserved: 'Tutti i diritti riservati.',

    // Cookie Settings
    cookieSettings: 'Impostazioni Cookie',
    essentialCookies: 'Cookie Essenziali',
    essentialCookiesDesc: 'Questi cookie sono necessari per il funzionamento del sito e non possono essere disattivati.',
    marketingCookies: 'Cookie Marketing',
    marketingCookiesDesc: 'Questi cookie vengono utilizzati per fornire pubblicità più rilevante per te e i tuoi interessi.',
    statisticsCookies: 'Cookie Statistici',
    statisticsCookiesDesc: 'Questi cookie ci aiutano a capire come i visitatori interagiscono con il sito, raccogliendo e riportando informazioni in forma anonima.',
    savePreferences: 'Salva preferenze',
    acceptAll: 'Accetta tutti',
    note: 'Nota',
    cookiePreferencesNote: 'Le preferenze dei cookie verranno salvate solo se hai effettuato l\'accesso.',

    // Cookie Consent
    weUseCookies: 'Utilizziamo i cookie',
    cookieConsentText: 'Utilizziamo i cookie per migliorare la tua esperienza sul nostro sito, personalizzare contenuti e annunci, fornire funzionalità di social media e analizzare il nostro traffico. Facendo clic su "Accetta tutti", acconsenti all\'uso dei cookie. Puoi anche scegliere di rifiutare i cookie non essenziali.',
    decline: 'Rifiuta',

    // Error Boundary
    errorTitle: 'Oops! Qualcosa è andato storto',
    errorMessage: 'Si è verificato un errore imprevisto. Ricarica la pagina per riprovare.',
    reloadPage: 'Ricarica Pagina',
    errorDetails: 'Dettagli errore (dev)',

    // Progress Section
    transformations: {
      title: 'CASI DI MIGLIORAMENTO FISICO',
      marco: {
        name: 'Marco',
        title: 'Trasformazione Marco',
        description: 'Perdita di 15kg in 6 mesi',
        duration: '6 mesi',
        stats: {
          weightLost: 'Peso perso',
          bodyFat: 'Massa grassa',
          strength: 'Forza'
        }
      },
      sara: {
        name: 'Sara',
        title: 'Miglioramento Sara',
        description: 'Guadagno massa muscolare',
        duration: '4 mesi',
        stats: {
          muscleMass: 'Massa muscolare',
          strength: 'Forza',
          endurance: 'Resistenza'
        }
      },
      giuseppe: {
        name: 'Giuseppe',
        title: 'Recupero Giuseppe',
        description: 'Risoluzione dolori alla schiena',
        duration: '3 mesi',
        stats: {
          pain: 'Dolore',
          mobility: 'Mobilità',
          posture: 'Postura'
        }
      }
    },
    before: 'Prima',
    after: 'Dopo',
    age: 'Età',
    weight: 'Peso',
    height: 'Altezza',
    goal: 'Obiettivo',
    duration: 'Durata',
    months: 'mesi'
  },
  en: {
    // Header
    header: {
      profile: 'Profile',
      information: 'Information',
      location: 'Location',
      staff: 'Staff',
      rules: 'Rules',
      workouts: 'Workouts',
      cookieSettings: 'Cookie Settings',
  
      logout: 'Logout',
      language: 'Language',
    },

    // Hero Section
    heroTitle: 'CROSS YOUR LIMITS.',
    heroSubtitle: 'Overcome your limits with our team of experts. Achieve your fitness goals in a motivating and professional environment.',
    discoverMore: 'DISCOVER MORE',
    subscribeNow: 'SUBSCRIBE NOW',

    // Statistics Section
    subscribers: 'members',
    yearsOfActivity: 'years of activity',
    moreEnergy: 'More energy',
    moreEnergyDesc: 'Increase your daily energy and vitality levels',
    aesthetics: 'Aesthetics',
    aestheticsDesc: 'Improvement of physical appearance and shape',
    posture: 'Posture',
    postureDesc: 'Posture correction and body alignment',
    nutrition: 'Nutrition',
    nutritionDesc: 'Personalized nutritional consulting',
    selfDefense: 'Self-defense',
    selfDefenseDesc: 'Personal defense and safety techniques',
    discipline: 'Discipline',
    disciplineDesc: 'Development of discipline and consistency',
    stressManagement: 'Stress management',
    stressManagementDesc: 'Techniques to reduce stress and anxiety',
    mentalWellbeing: 'Mental wellbeing',
    mentalWellbeingDesc: 'Improvement of psycho-physical balance and self-esteem',

    // Staff Section
    ourTeam: 'OUR TEAM',
    certifications: 'Certifications',
    closeCertifications: 'Close Certifications',

    // Gym Areas Section
    gymAreas: 'OUR AREAS',
    crossfit: 'Cross training',
    crossfitDesc: 'High-intensity functional training to improve strength, endurance and agility.',
    weightRoom: 'Weight Room',
    weightRoomDesc: 'Modern equipment for weight training and bodybuilding.',
    karate: 'Karate',
    karateDesc: 'Traditional martial art for discipline, technique and self-defense.',
    yoga: 'Yoga',
    yogaDesc: 'Practices for physical and mental wellbeing, flexibility and relaxation.',

    // Schedule Section
    schedules: 'SCHEDULES',
    schedulesDesc: 'Discover the schedules of our activities and book your training session.',
    morning: 'Morning',
    evening: 'Evening',
    callNow: 'CALL NOW',
    sunday: 'Sunday',
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    openNow: 'OPEN',
    closedNow: 'CLOSED',
    today: 'Today',

    // Location Section
    whereWeAre: 'Where we are',
    whereAreWe: 'WHERE ARE WE?',
    openOnGoogleMaps: 'OPEN ON GOOGLE MAPS',
    address: 'Address',
    phone: 'Phone',
    email: 'Email',
    openingHours: 'Opening hours',
    mondayFriday: 'Monday - Friday',
    closed: 'CLOSED',

    // Newsletter Section
    newsletter: 'Newsletter',
    newsletterDesc: 'Stay updated on our news, events and special offers.',
    newsletterDescription: '',
    enterEmail: 'Enter an email address',
    enterValidEmail: 'Enter a valid email address',
    emailAlreadySubscribed: 'This email is already subscribed to the newsletter.',
    enterYourEmail: 'Enter your email',
    sending: 'SENDING...',
    subscribeToNewsletter: 'SUBSCRIBE TO NEWSLETTER',
    subscriptionSuccess: 'Perfect! We have sent you a welcome email with all the information about the gym.',
    noSpamPolicy: 'We will not send spam. You can unsubscribe at any time.',
    emailPlaceholder: 'Enter your email',
    subscribe: 'Subscribe',
    subscribeSuccess: 'Successfully subscribed!',
    subscribeError: 'Error during subscription. Please try again.',

    // Trustpilot Section
    customerReviews: 'Customer reviews',
    whatOurClientsSay: 'WHAT OUR CLIENTS SAY',
    excellent: 'Excellent',
    reviews: 'reviews',
    joinSatisfiedClients: 'Join our satisfied clients!',
    seeAllReviews: 'See all reviews',
    trustpilotDesc: 'Discover what our customers say about their experience with us.',

    // Footer
    legal: 'Legal',
    termsAndConditions: 'Terms and conditions',
    cookies: 'Cookies',
    managePreferences: 'Manage preferences',
    contacts: 'Contacts',
    copyright: '© KW8 2025 - All rights reserved.',
    quickLinks: 'Quick links',
    followUs: 'Follow us',
    contactInfo: 'Contact information',
    privacyPolicy: 'Privacy Policy',
    termsOfService: 'Terms of Service',
    cookiePolicy: 'Cookie Policy',
    allRightsReserved: 'All rights reserved.',

    // Cookie Settings
    cookieSettings: 'Cookie Settings',
    essentialCookies: 'Essential Cookies',
    essentialCookiesDesc: 'These cookies are necessary for the website to function and cannot be disabled.',
    marketingCookies: 'Marketing Cookies',
    marketingCookiesDesc: 'These cookies are used to provide more relevant advertising for you and your interests.',
    statisticsCookies: 'Statistics Cookies',
    statisticsCookiesDesc: 'These cookies help us understand how visitors interact with the website by collecting and reporting information anonymously.',
    savePreferences: 'Save preferences',
    acceptAll: 'Accept all',
    note: 'Note',
    cookiePreferencesNote: 'Cookie preferences will only be saved if you are logged in.',

    // Cookie Consent
    weUseCookies: 'We use cookies',
    cookieConsentText: 'We use cookies to improve your experience on our site, personalize content and ads, provide social media features and analyze our traffic. By clicking "Accept all", you consent to the use of cookies. You can also choose to decline non-essential cookies.',
    decline: 'Decline',

    // Error Boundary
    errorTitle: 'Oops! Something went wrong',
    errorMessage: 'An unexpected error occurred. Reload the page to try again.',
    reloadPage: 'Reload Page',
    errorDetails: 'Error details (dev)',

    // Progress Section
    transformations: {
      title: 'PHYSICAL IMPROVEMENT CASES',
      marco: {
        name: 'Marco',
        title: 'Marco\'s Transformation',
        description: '15kg weight loss in 6 months',
        duration: '6 months',
        stats: {
          weightLost: 'Weight lost',
          bodyFat: 'Body fat',
          strength: 'Strength'
        }
      },
      sara: {
        name: 'Sara',
        title: 'Sara\'s Improvement',
        description: 'Muscle mass gain',
        duration: '4 months',
        stats: {
          muscleMass: 'Muscle mass',
          strength: 'Strength',
          endurance: 'Endurance'
        }
      },
      giuseppe: {
        name: 'Giuseppe',
        title: 'Giuseppe\'s Recovery',
        description: 'Back pain resolution',
        duration: '3 months',
        stats: {
          pain: 'Pain',
          mobility: 'Mobility',
          posture: 'Posture'
        }
      }
    },
    before: 'Before',
    after: 'After',
    age: 'Age',
    weight: 'Weight',
    height: 'Height',
    goal: 'Goal',
    duration: 'Duration',
    months: 'months'
  }
};

export const useTranslation = (language: 'it' | 'en') => {
  return translations[language];
};