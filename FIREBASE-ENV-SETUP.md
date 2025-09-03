# Configurazione Variabili d'Ambiente per Firebase

Questa guida spiega come configurare correttamente le variabili d'ambiente per il deployment su Firebase.

## Variabili d'Ambiente Richieste

### 1. Frontend (Pubbliche)
Queste variabili sono visibili nel browser e devono iniziare con `VITE_`:

```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

### 2. Backend (Private)
Queste variabili sono accessibili solo nelle Firebase Functions:

```bash
# Google OAuth
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# JWT e Sicurezza
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-in-production
API_SECRET_KEY=your-super-secret-api-key-here-change-in-production

# Database
MONGODB_URI=your-mongodb-uri-here

# CORS e Frontend
FRONTEND_URL=https://palestra-kw8.web.app
CORS_ORIGIN=https://palestra-kw8.web.app

# Email autorizzata
AUTHORIZED_EMAIL=krossingweight@gmail.com

# Configurazioni opzionali
API_RATE_LIMIT=100
SESSION_TIMEOUT=24h
REFRESH_TOKEN_EXPIRY=7d
NODE_ENV=production
```

## Configurazione su Firebase

### Passo 1: Accedi alla Firebase Console
1. Vai su [console.firebase.google.com](https://console.firebase.google.com)
2. Accedi al tuo account Google
3. Seleziona il progetto **palestra-kw8**

### Passo 2: Configura le Variabili d'Ambiente
1. Vai su **Functions** → **Environment Variables**
2. Clicca su **Add Variable** per ogni variabile
3. Inserisci **Name** e **Value** per ogni variabile

#### Esempio di Configurazione:

| Name | Value | Descrizione |
|------|-------|-------------|
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-xxxxx...` | Secret per Google OAuth |
| `JWT_SECRET` | `your-32-char-secret...` | Chiave per JWT (min 32 caratteri) |
| `API_SECRET_KEY` | `your-api-secret...` | Chiave API generale |
| `MONGODB_URI` | `mongodb+srv://...` | Stringa connessione MongoDB |
| `FRONTEND_URL` | `https://palestra-kw8.web.app` | URL del frontend |
| `CORS_ORIGIN` | `https://palestra-kw8.web.app` | Origine CORS consentita |
| `AUTHORIZED_EMAIL` | `krossingweight@gmail.com` | Email autorizzata |
| `NODE_ENV` | `production` | Ambiente di esecuzione |

### Passo 3: Configurazione tramite Firebase CLI

Alternativamente, puoi configurare le variabili tramite CLI:

```bash
# Login a Firebase
firebase login

# Configura le variabili d'ambiente
firebase functions:config:set google.client_secret="your-client-secret"
firebase functions:config:set jwt.secret="your-jwt-secret"
firebase functions:config:set api.secret_key="your-api-secret"
firebase functions:config:set mongodb.uri="your-mongodb-uri"
firebase functions:config:set frontend.url="https://palestra-kw8.web.app"
firebase functions:config:set cors.origin="https://palestra-kw8.web.app"
firebase functions:config:set authorized.email="krossingweight@gmail.com"

# Visualizza la configurazione
firebase functions:config:get

# Deploy per applicare le modifiche
firebase deploy --only functions
```

## Configurazione per Sviluppo Locale

### File .env.local
Crea un file `.env.local` nella root del progetto:

```bash
# Frontend (VITE_ prefix obbligatorio)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Backend
GOOGLE_CLIENT_SECRET=your-google-client-secret
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
API_SECRET_KEY=your-super-secret-api-key
MONGODB_URI=your-mongodb-uri
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
AUTHORIZED_EMAIL=krossingweight@gmail.com
NODE_ENV=development
```

### Configurazione Firebase Emulator
Per testare le functions localmente:

```bash
# Installa Firebase CLI
npm install -g firebase-tools

# Inizializza gli emulators
firebase init emulators

# Avvia gli emulators
firebase emulators:start
```

## Sicurezza delle Variabili

### ⚠️ Variabili Sensibili
- **MAI** committare file `.env` nel repository
- Usa chiavi JWT di almeno 32 caratteri
- Cambia tutte le chiavi di default prima del deploy
- Usa password complesse per MongoDB

### ✅ Best Practices
- Usa prefisso `VITE_` solo per variabili pubbliche
- Mantieni separate le configurazioni dev/prod
- Ruota regolarmente le chiavi API
- Monitora l'accesso alle variabili

## Verifica della Configurazione

### 1. Controlla le Variabili
```bash
# Visualizza configurazione Firebase
firebase functions:config:get

# Test delle functions
firebase functions:log
```

### 2. Test dell'Applicazione
1. Deploy dell'applicazione: `firebase deploy`
2. Vai su `https://palestra-kw8.web.app`
3. Testa il login con Google
4. Controlla i logs per errori

### 3. Debug Comuni

#### Errore "Environment variable not found"
```bash
# Verifica che la variabile sia configurata
firebase functions:config:get

# Redeploy le functions
firebase deploy --only functions
```

#### Errore CORS
```bash
# Verifica FRONTEND_URL e CORS_ORIGIN
firebase functions:config:get frontend
firebase functions:config:get cors
```

#### Errore JWT
```bash
# Verifica JWT_SECRET
firebase functions:config:get jwt

# Assicurati che sia di almeno 32 caratteri
```

## Migrazione da Vercel

Se stai migrando da Vercel:

1. **Cambia i prefissi**: `NEXT_PUBLIC_` → `VITE_`
2. **Aggiorna gli URL**: `vercel.app` → `web.app`
3. **Riconfigura le variabili** in Firebase Console
4. **Testa tutto** prima di andare in produzione

## Comandi Utili

```bash
# Configurazione
firebase functions:config:set key="value"
firebase functions:config:get
firebase functions:config:unset key

# Deploy
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy

# Debug
firebase functions:log
firebase serve --only functions
firebase emulators:start
```

---

**Nota**: Dopo ogni modifica alle variabili d'ambiente, è necessario fare redeploy delle functions per applicare le modifiche.