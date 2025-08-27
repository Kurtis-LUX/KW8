# 🔐 Configurazione Google OAuth per KW8

## ❌ Problema Attuale
Gli errori 500 dal backend `/api/auth/google-signin` in produzione indicano problemi di configurazione OAuth e variabili d'ambiente.

## ✅ Soluzione: Configurare Google OAuth per Produzione

### Passo 1: Accedere alla Google Cloud Console
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Accedi con il tuo account Google
3. Crea un nuovo progetto o seleziona un progetto esistente

### Passo 2: Abilitare l'API corretta
1. Nel menu laterale, vai su **"API e servizi" > "Libreria"**
2. ⚠️ **IMPORTANTE**: Se hai già abilitato **"Google+ API"**, va bene così!
3. **Google+ API** funziona correttamente con Google Identity Services
4. **ALTERNATIVA**: Puoi anche cercare **"Google Identity"** se preferisci l'API più moderna
5. Clicca su **"Abilita"** se non è già abilitata

### Passo 3: Configurare la Schermata di Consenso OAuth
1. Vai su **"API e servizi" > "Schermata di consenso OAuth"**
2. Seleziona **"Esterno"** come tipo di utente
3. Compila i campi obbligatori:
   - **Nome dell'applicazione**: "KW8"
   - **Email di supporto utente**: la tua email
   - **Dominio dell'applicazione**: `localhost` (per sviluppo)
   - **Email dello sviluppatore**: la tua email
4. Clicca **"Salva e continua"**

### Passo 4: Creare le Credenziali OAuth
1. Vai su **"API e servizi" > "Credenziali"**
2. Clicca **"+ CREA CREDENZIALI" > "ID client OAuth 2.0"**
3. Seleziona **"Applicazione web"** come tipo
4. Configura:
   - **Nome**: "KW8 Web Client"
   - **Origini JavaScript autorizzate**:
     - `http://localhost:5173` (per sviluppo locale)
     - `https://kw8.vercel.app` (per produzione)
   - **URI di reindirizzamento autorizzati**:
     - `https://kw8.vercel.app/api/auth/google-signin` (per produzione)
     - ⚠️ **IMPORTANTE**: Aggiungi questo URI per il backend API
5. Clicca **"Crea"**

### Passo 5: Copiare Client ID e Client Secret
1. Dopo la creazione, apparirà una finestra con:
   - **ID client**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Segreto client**: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxxx`
2. **Copia entrambi i valori**:
   - **Client ID** (per il frontend)
   - **Client Secret** (per il backend)

### Passo 6: Configurare le Variabili d'Ambiente

#### Per Sviluppo Locale (.env.local)
1. Crea/aggiorna il file `.env.local` nella root del progetto:
   ```bash
   # Google OAuth
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=IL_TUO_CLIENT_ID_REALE.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=IL_TUO_CLIENT_SECRET_REALE
   
   # Email autorizzata
   AUTHORIZED_EMAIL=krossingweight@gmail.com
   
   # Altri settings
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long
   API_SECRET_KEY=your-super-secret-api-key-here
   MONGODB_URI=your-mongodb-uri-here
   FRONTEND_URL=http://localhost:5173
   CORS_ORIGIN=http://localhost:5173
   NODE_ENV=development
   ```

#### Per Produzione (Vercel)
1. Vai su [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleziona il progetto KW8
3. Vai su **Settings** → **Environment Variables**
4. Aggiungi le seguenti variabili per **Production**:
   - `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Il tuo Client ID
   - `GOOGLE_CLIENT_SECRET`: Il tuo Client Secret
   - `AUTHORIZED_EMAIL`: `krossingweight@gmail.com`
   - `JWT_SECRET`: Una stringa segreta di almeno 32 caratteri
   - `API_SECRET_KEY`: Una chiave API segreta
   - `MONGODB_URI`: La tua stringa di connessione MongoDB
   - `FRONTEND_URL`: `https://kw8.vercel.app`
   - `CORS_ORIGIN`: `https://kw8.vercel.app`
   - `NODE_ENV`: `production`
5. Clicca **Save** per ogni variabile
6. **Redeploy** il progetto per applicare le modifiche

### Passo 7: Configurare Email Autorizzata
Per cambiare l'email autorizzata:

1. **Sviluppo locale**: Modifica `.env.local`:
   ```bash
   AUTHORIZED_EMAIL=tua-email@gmail.com
   ```

2. **Produzione**: Aggiorna la variabile su Vercel:
   - Vai su **Settings** → **Environment Variables**
   - Modifica `AUTHORIZED_EMAIL` con la tua email
   - Redeploy il progetto

### Passo 8: Testare la Configurazione

#### Sviluppo Locale
1. Ferma il server di sviluppo (Ctrl+C)
2. Riavvia con: `npm run dev`
3. Vai su `http://localhost:5173`
4. Testa il login con Google

#### Produzione
1. Dopo aver configurato le variabili su Vercel
2. Redeploy il progetto
3. Vai su `https://kw8.vercel.app`
4. Testa il login con Google

## 🔍 Verifica della Configurazione

Dopo aver completato i passaggi:
1. Vai su `http://localhost:5173`
2. Clicca su **"Accedi con Google"**
3. Dovresti vedere la schermata di consenso Google invece dell'errore

## ⚠️ Note Importanti

- **Per sviluppo locale**: Usa `http://localhost:5173` (non HTTPS)
- **Per produzione**: Il sito KW8 è già configurato per `https://kw8.vercel.app`
- **Sicurezza**: Non condividere mai il Client ID in repository pubblici
- **Email autorizzate**: Solo l'email configurata in `AUTHORIZED_COACH_EMAIL` può accedere
- **Configurazione completata**: ✅ Google OAuth configurato correttamente per KW8

## 🆘 Risoluzione Problemi

### 🔴 Errore "Token Google non valido o scaduto"
**CAUSA PRINCIPALE**: Client ID nel file `.env` non corrisponde a quello della Google Cloud Console

**SOLUZIONE**:
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il tuo progetto KW8
3. Vai su **"API e servizi" > "Credenziali"**
4. Clicca sul tuo Client ID OAuth 2.0
5. **COPIA** il Client ID completo (formato: `xxxxx-xxxxx.apps.googleusercontent.com`)
6. Apri il file `.env` nel tuo progetto
7. **SOSTITUISCI** il valore di `VITE_GOOGLE_CLIENT_ID` con quello copiato
8. **RIAVVIA** il server con `npm run dev`
9. Riprova l'autenticazione

### 🔴 Pagina Bianca su accounts.google.com/gsi/transform
**CAUSA PRINCIPALE**: URI di reindirizzamento configurati erroneamente nella Google Cloud Console

**SOLUZIONE**:
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il tuo progetto KW8
3. Vai su **"API e servizi" > "Credenziali"**
4. Clicca sul tuo Client ID OAuth 2.0
5. Nella sezione **"URI di reindirizzamento autorizzati"**:
   - ❌ **RIMUOVI TUTTI** gli URI di reindirizzamento
   - ✅ **LASCIA VUOTA** questa sezione
6. Mantieni solo le **"Origini JavaScript autorizzate"**:
   - `http://localhost:5173`
   - `https://kw8.vercel.app`
7. Clicca **"Salva"**
8. Attendi 5-10 minuti per la propagazione delle modifiche
9. Riprova l'autenticazione

### Errore "redirect_uri_mismatch"
- Verifica che `http://localhost:5173` sia nelle origini autorizzate
- Controlla che non ci siano spazi extra nell'URL

### Errore "access_denied"
- L'utente ha rifiutato l'accesso
- Oppure l'email non è autorizzata nel server

### Errore "invalid_client" persiste
- Verifica che il Client ID sia copiato correttamente
- Controlla che non ci siano spazi extra nel file `.env`
- Riavvia il server dopo aver modificato `.env`

---

**📞 Supporto**: Se hai ancora problemi, verifica che tutti i passaggi siano stati seguiti correttamente e che il server sia stato riavviato dopo le modifiche.