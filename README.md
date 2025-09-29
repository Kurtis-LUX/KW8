# KW8 - Fitness & Wellness Management Platform

## 📋 Descrizione

KW8 è una piattaforma web moderna per la gestione di palestre e centri fitness. Offre un sistema completo per la gestione di atleti, programmi di allenamento, abbonamenti e molto altro.

## ✨ Caratteristiche Principali

- **Gestione Atleti**: Sistema completo per la registrazione e gestione degli atleti
- **Programmi di Allenamento**: Creazione e personalizzazione di workout e piani di allenamento
- **Sistema di Autenticazione**: Login sicuro con Google OAuth
- **Dashboard Amministrativa**: Interfaccia intuitiva per la gestione della palestra
- **Responsive Design**: Ottimizzato per desktop e dispositivi mobili
- **Classifiche e Statistiche**: Monitoraggio delle performance degli atleti
- **Gestione Abbonamenti**: Sistema per la gestione delle membership

## 🛠️ Tecnologie Utilizzate

### Frontend
- **React 18** con TypeScript
- **Vite** per il build e development
- **Tailwind CSS** per lo styling
- **React Router** per la navigazione
- **Firebase** per autenticazione e database

### Backend
- **Node.js** con TypeScript
- **Firebase Functions** per le API serverless
- **Firestore** come database NoSQL
- **Firebase Authentication** per la gestione utenti

### Deployment
- **Vercel** per il frontend
- **Firebase Hosting** come alternativa
- **GitHub Actions** per CI/CD

## 🚀 Installazione e Setup

### Prerequisiti
- Node.js (versione 18 o superiore)
- npm o yarn
- Account Firebase
- Account Google per OAuth

### Installazione

1. **Clona il repository**
   ```bash
   git clone https://github.com/Kurtis-LUX/KW8.git
   cd KW8
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   ```bash
   cp .env.example .env
   ```
   Compila il file `.env` con le tue configurazioni Firebase e Google OAuth.

4. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   ```

5. **Setup Firebase Functions (opzionale)**
   ```bash
   cd functions
   npm install
   npm run build
   ```

## 📁 Struttura del Progetto

```
KW8/
├── src/
│   ├── components/          # Componenti React riutilizzabili
│   ├── pages/              # Pagine dell'applicazione
│   ├── services/           # Servizi per API e Firebase
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── contexts/           # React contexts
│   └── config/             # Configurazioni
├── functions/              # Firebase Functions
├── public/                 # Asset statici
└── api/                   # API routes per Vercel
```

## 🔧 Configurazione

### Firebase Setup
1. Crea un nuovo progetto Firebase
2. Abilita Authentication con Google
3. Configura Firestore Database
4. Ottieni le chiavi di configurazione

### Google OAuth Setup
1. Vai alla Google Cloud Console
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita Google+ API
4. Crea credenziali OAuth 2.0
5. Configura i domini autorizzati

## 📱 Funzionalità

### Per gli Amministratori
- Dashboard completa per la gestione della palestra
- Gestione atleti e istruttori
- Creazione e modifica di programmi di allenamento
- Monitoraggio statistiche e performance
- Gestione abbonamenti e pagamenti

### Per gli Atleti
- Accesso ai propri programmi di allenamento
- Visualizzazione delle statistiche personali
- Prenotazione delle sessioni
- Comunicazione con gli istruttori

## 🔒 Sicurezza

- Autenticazione sicura tramite Firebase Auth
- Protezione delle route sensibili
- Validazione dei dati lato client e server
- Gestione sicura delle chiavi API
- HTTPS obbligatorio in produzione

## 🚀 Deployment

### Vercel (Raccomandato)
```bash
npm run build
vercel --prod
```

### Firebase Hosting
```bash
npm run build
firebase deploy
```

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 📞 Supporto

Per supporto o domande:
- Apri una issue su GitHub
- Contatta il team di sviluppo

## 🔄 Versioning

Utilizziamo [SemVer](http://semver.org/) per il versioning. Per le versioni disponibili, vedi i [tags su questo repository](https://github.com/Kurtis-LUX/KW8/tags).

---

**Sviluppato con ❤️ per la community fitness**