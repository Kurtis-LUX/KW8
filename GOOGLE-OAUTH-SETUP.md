# 🔐 Configurazione Google OAuth per KW8

## ❌ Problema Attuale
L'errore **"OAuth client was not found. Errore 401: invalid_client"** indica che il Google Client ID non è configurato correttamente.

## ✅ Soluzione: Configurare Google OAuth

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
     - ⚠️ **IMPORTANTE**: Per Google Identity Services (GSI), NON aggiungere URI di reindirizzamento specifici
      - GSI gestisce automaticamente i redirect, aggiungere URI manuali può causare pagine bianche
      - Lascia questa sezione VUOTA o rimuovi eventuali URI aggiunti
5. Clicca **"Crea"**

### Passo 5: Copiare il Client ID
1. Dopo la creazione, apparirà una finestra con:
   - **ID client**: `123456789-abcdefghijklmnop.apps.googleusercontent.com`
   - **Segreto client**: (non necessario per il frontend)
2. **Copia l'ID client** (quello che termina con `.apps.googleusercontent.com`)

### Passo 6: Aggiornare il File .env
1. Apri il file `.env` nella root del progetto
2. Sostituisci la riga:
   ```
   VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
   ```
   Con:
   ```
   VITE_GOOGLE_CLIENT_ID=IL_TUO_CLIENT_ID_REALE.apps.googleusercontent.com
   ```

### Passo 7: Aggiungere Email Autorizzate (Opzionale)
Se vuoi autorizzare email diverse da `krossingweight@gmail.com`:

1. Apri `server.cjs`
2. Trova la riga:
   ```javascript
   const AUTHORIZED_COACH_EMAIL = 'krossingweight@gmail.com';
   ```
3. Cambiala con la tua email:
   ```javascript
   const AUTHORIZED_COACH_EMAIL = 'email';
   ```

### Passo 8: Riavviare il Server
1. Ferma il server di sviluppo (Ctrl+C)
2. Riavvia con:
   ```bash
   npm run dev
   ```

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