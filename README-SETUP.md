# KW8 Fitness - Setup e Configurazione

## 📋 Panoramica
KW8 Fitness è un'applicazione web completa per la gestione di palestre, allenamenti e atleti. Include funzionalità per coach, gestione schede di allenamento, statistiche atleti e molto altro.

## 🚀 Installazione

### Prerequisiti
- Node.js (versione 18 o superiore)
- npm o yarn
- Account Google per l'autenticazione OAuth

### Setup Locale

1. **Clona il repository**
   ```bash
   git clone <repository-url>
   cd KW8
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   Crea un file `.env.local` nella root del progetto:
   ```bash
   # Google OAuth
   VITE_GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   
   # Autenticazione
   AUTHORIZED_EMAIL=krossingweight@gmail.com
   JWT_SECRET=your_jwt_secret_key_32_chars_min
   API_SECRET_KEY=your_api_secret_key
   
   # Database (opzionale per MongoDB)
   MONGODB_URI=your_mongodb_connection_string
   
   # Ambiente
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   CORS_ORIGIN=http://localhost:5173
   ```

4. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   ```

## 🔐 Account Autorizzati

Gli account email autorizzati ad accedere al sistema sono:
- `admin@kw8fitness.com`
- `coach@kw8fitness.com`
- `giuseppe@kw8fitness.com`
- `saverio@kw8fitness.com`
- `giuseppepando@gmail.com`
- `simeoneluca44@gmail.com`
- Email configurata in `AUTHORIZED_EMAIL`

## 🛠 Configurazione Google OAuth

### 1. Crea un progetto Google Cloud
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un nuovo progetto o seleziona uno esistente
3. Abilita l'API "Google+ API" o "Google Identity"

### 2. Configura OAuth 2.0
1. Vai su **APIs & Services** → **Credentials**
2. Clicca **Create Credentials** → **OAuth 2.0 Client ID**
3. Seleziona **Web application**
4. Aggiungi gli URI autorizzati:
   - **Authorized JavaScript origins**: `http://localhost:5173`, `https://yourdomain.com`
   - **Authorized redirect URIs**: `http://localhost:5173`, `https://yourdomain.com`

### 3. Ottieni le credenziali
- Copia il **Client ID** e **Client Secret**
- Aggiungili al file `.env.local`

## 🌐 Deploy su Vercel

### 1. Prepara il progetto
```bash
npm run build
```

### 2. Deploy su Vercel
1. Installa Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`

### 3. Configura le variabili d'ambiente su Vercel
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi tutte le variabili del file `.env.local`

## 📁 Struttura del Progetto

```
KW8/
├── api/                    # API endpoints
│   ├── auth/              # Autenticazione
│   ├── middleware/        # Middleware RBAC
│   └── workout-folders/   # Gestione cartelle
├── src/
│   ├── components/        # Componenti React
│   ├── pages/            # Pagine dell'applicazione
│   ├── services/         # Servizi (API, auth)
│   ├── utils/            # Utilità e database
│   └── contexts/         # Context React
├── public/               # File statici
└── vercel.json          # Configurazione Vercel
```

## 🔧 Funzionalità Principali

- **Dashboard Coach**: Gestione completa delle attività
- **Gestione Schede**: Creazione e modifica allenamenti
- **Statistiche Atleti**: Monitoraggio progressi
- **Autenticazione Google**: Login sicuro
- **File Explorer**: Organizzazione cartelle
- **Responsive Design**: Ottimizzato per mobile

## 🐛 Troubleshooting

### Errori comuni
1. **Google OAuth non funziona**: Verifica che gli URI siano configurati correttamente
2. **Errore 403**: Controlla che l'email sia nella lista autorizzata
3. **Build fallisce**: Verifica che tutte le dipendenze siano installate

### Log e Debug
- Controlla la console del browser per errori frontend
- Verifica i log del server per errori backend
- Usa `npm run dev` per il debug locale

## 📞 Supporto

Per supporto tecnico o domande:
- Email: support@kw8fitness.com
- Documentazione: Consulta i file nella cartella `/docs`

## 📄 Licenza

Questo progetto è proprietario di KW8 Fitness. Tutti i diritti riservati.