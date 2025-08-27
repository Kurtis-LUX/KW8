# Configurazione Variabili d'Ambiente per Vercel

Questa guida spiega come configurare correttamente le variabili d'ambiente per il deployment su Vercel.

## Variabili d'Ambiente Richieste

### 1. Frontend (Pubbliche)
Queste variabili sono visibili nel browser e devono iniziare con `NEXT_PUBLIC_`:

```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
```

### 2. Backend (Private)
Queste variabili sono accessibili solo lato server:

```bash
# Google OAuth
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# JWT e Sicurezza
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-in-production
API_SECRET_KEY=your-super-secret-api-key-here-change-in-production

# Database
MONGODB_URI=your-mongodb-uri-here

# CORS e Frontend
FRONTEND_URL=https://kw8.vercel.app
CORS_ORIGIN=https://kw8.vercel.app

# Email autorizzata
AUTHORIZED_EMAIL=krossingweight@gmail.com

# Configurazioni opzionali
API_RATE_LIMIT=100
SESSION_TIMEOUT=24h
REFRESH_TOKEN_EXPIRY=7d
NODE_ENV=production
```

## Configurazione su Vercel

### Passo 1: Accedi al Dashboard Vercel
1. Vai su [vercel.com](https://vercel.com)
2. Accedi al tuo account
3. Seleziona il progetto KW8

### Passo 2: Configura le Variabili d'Ambiente
1. Vai su **Settings** → **Environment Variables**
2. Aggiungi le seguenti variabili per l'ambiente **Production**:

#### Variabili Pubbliche (Frontend)
- **Name**: `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- **Value**: Il tuo Google Client ID (es. `123456789-abc.apps.googleusercontent.com`)
- **Environment**: Production

#### Variabili Private (Backend)
- **Name**: `GOOGLE_CLIENT_SECRET`
- **Value**: Il tuo Google Client Secret
- **Environment**: Production

- **Name**: `JWT_SECRET`
- **Value**: Una stringa segreta di almeno 32 caratteri
- **Environment**: Production

- **Name**: `API_SECRET_KEY`
- **Value**: Una chiave API segreta
- **Environment**: Production

- **Name**: `MONGODB_URI`
- **Value**: La tua stringa di connessione MongoDB
- **Environment**: Production

- **Name**: `FRONTEND_URL`
- **Value**: `https://kw8.vercel.app`
- **Environment**: Production

- **Name**: `CORS_ORIGIN`
- **Value**: `https://kw8.vercel.app`
- **Environment**: Production

- **Name**: `AUTHORIZED_EMAIL`
- **Value**: `krossingweight@gmail.com`
- **Environment**: Production

### Passo 3: Redeploy
Dopo aver aggiunto tutte le variabili d'ambiente:
1. Vai su **Deployments**
2. Clicca sui tre puntini dell'ultimo deployment
3. Seleziona **Redeploy**
4. Conferma il redeploy

## Verifica della Configurazione

### Test delle Variabili
Per verificare che le variabili siano configurate correttamente:

1. **Frontend**: Apri la console del browser su `https://kw8.vercel.app` e verifica che `NEXT_PUBLIC_GOOGLE_CLIENT_ID` sia disponibile
2. **Backend**: Controlla i log di Vercel per eventuali errori di configurazione

### Errori Comuni

#### Errore: "NEXT_PUBLIC_GOOGLE_CLIENT_ID non configurato"
- **Causa**: La variabile d'ambiente non è stata impostata correttamente
- **Soluzione**: Verifica che il nome sia esatto e che sia stata deployata

#### Errore: "GOOGLE_CLIENT_SECRET non configurato"
- **Causa**: La variabile privata non è stata impostata
- **Soluzione**: Aggiungi la variabile nelle impostazioni di Vercel

#### Errore: "Token Google non valido"
- **Causa**: Configurazione Google Cloud Console non corretta
- **Soluzione**: Verifica la configurazione OAuth in Google Cloud Console

## File di Configurazione Locale

Per lo sviluppo locale, crea un file `.env.local` nella root del progetto:

```bash
# .env.local (per sviluppo locale)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long-change-in-production
API_SECRET_KEY=your-super-secret-api-key-here-change-in-production
MONGODB_URI=your-mongodb-uri-here
FRONTEND_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
AUTHORIZED_EMAIL=krossingweight@gmail.com
API_RATE_LIMIT=100
SESSION_TIMEOUT=24h
REFRESH_TOKEN_EXPIRY=7d
NODE_ENV=development
```

## Note di Sicurezza

1. **Mai committare** file `.env.local` o `.env` nel repository
2. **Usa sempre** variabili d'ambiente per informazioni sensibili
3. **Rigenera** JWT_SECRET e API_SECRET_KEY per la produzione
4. **Limita** l'accesso alle variabili d'ambiente solo al personale autorizzato

## Supporto

Per problemi con la configurazione:
1. Controlla i log di Vercel
2. Verifica la sintassi delle variabili d'ambiente
3. Assicurati che tutte le variabili richieste siano presenti
4. Testa prima in locale con `.env.local`