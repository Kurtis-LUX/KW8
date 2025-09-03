# 📱 Risoluzione Errore Google OAuth su Mobile

## ❌ Problema Riscontrato
Quando si tenta di fare il login da telefono, appare l'errore:
```
google: Missing required parameter: client_id
Errore 400: invalid_request
```

## 🔍 Causa del Problema
L'errore indica che il `client_id` di Google OAuth non viene trasmesso correttamente quando si accede da dispositivi mobili. Questo può essere causato da:

1. **Configurazione Google Cloud Console incompleta per mobile**
2. **Origini JavaScript non configurate per il dominio di produzione**
3. **Differenze nel caricamento dello script Google Identity Services su mobile**

## 🚨 Errori OAuth Comuni

### Errore: "Missing required parameter: client_id"
Questo errore si verifica quando Google Identity Services non riesce a trovare il `client_id` necessario per l'autenticazione OAuth.

### Errore: "origin_mismatch" (Errore 400)
Questo errore si verifica quando l'origine del sito web non è autorizzata nella configurazione OAuth di Google Cloud Console.

**Messaggio completo:**
```
Accesso bloccato: errore di autorizzazione
Non puoi accedere a questa app perché non è conforme alle norme OAuth 2.0 di Google.
Se hai sviluppato tu l'app, registra l'origine JavaScript in Google Cloud Console.
Errore 400: origin_mismatch
```

### Problema: Login automatico con account sbagliato
Google Identity Services può fare login automatico con un account già collegato al browser, impedendo la selezione di un account diverso.

**Sintomi:**
- Non appare la schermata di selezione account
- Login automatico con l'account precedentemente utilizzato
- Impossibilità di cambiare account Google

## ✅ Soluzioni

### Soluzione 1: 🔧 Risoluzione "Redirect a URL Firebase sbagliato"

**CAUSA**: Il servizio di autenticazione forza l'uso di un URL Firebase diverso invece di usare l'URL corrente del deployment.

**SINTOMI**:
- Dopo il login, l'utente viene reindirizzato a un URL Firebase diverso
- Errori di CORS o API non trovate
- L'applicazione non funziona correttamente su deployment branch

**SOLUZIONE**:
- Assicurati che tutte le configurazioni puntino a `https://palestra-kw8.web.app`
- Funziona correttamente su tutti i deployment Firebase (main, branch, preview)

### Soluzione 2: 🔧 Configurazione Google Cloud Console

#### Passo 1: Verifica Origini JavaScript Autorizzate
1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il progetto corretto
3. Vai su **API e servizi** → **Credenziali**
4. Clicca sul tuo **Client ID OAuth 2.0**
5. Nella sezione **Origini JavaScript autorizzate**, assicurati di avere:
   ```
   https://palestra-kw8.web.app
   http://localhost:5173
   ```

#### Passo 2: Verifica URI di Reindirizzamento Autorizzati
Nella sezione **URI di reindirizzamento autorizzati**, aggiungi:
```
https://palestra-kw8.web.app
https://palestra-kw8.web.app/
```

#### Passo 3: Salva e Attendi
- Clicca **Salva**
- Attendi 5-10 minuti per la propagazione delle modifiche
- Testa nuovamente il login

### Soluzione 3: 🔧 Verifica Variabili d'Ambiente

#### Frontend (Vite)
Assicurati che nel file `.env.local` o nelle variabili di build ci sia:
```bash
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

#### Backend (Firebase Functions)
Configura le variabili d'ambiente:
```bash
firebase functions:config:set google.client_secret="your-google-client-secret"
firebase functions:config:set frontend.url="https://palestra-kw8.web.app"
firebase functions:config:set cors.origin="https://palestra-kw8.web.app"
```

### Soluzione 4: Configurazione Firebase per Produzione (CRITICA)

⚠️ **PROBLEMA PRINCIPALE**: Le variabili d'ambiente non sono configurate su Firebase!

1. **Aggiungi le variabili d'ambiente su Firebase**:
   - Vai su [Firebase Console](https://console.firebase.google.com/)
   - Seleziona il progetto **palestra-kw8**
   - Vai su **Functions** → **Environment Variables**
   - Aggiungi:
     ```
     VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
     GOOGLE_CLIENT_SECRET=your-google-client-secret
     JWT_SECRET=your-jwt-secret-32-chars-minimum
     FRONTEND_URL=https://palestra-kw8.web.app
     CORS_ORIGIN=https://palestra-kw8.web.app
     ```

2. **Redeploy l'applicazione**:
   ```bash
   firebase deploy
   ```

3. **Verifica il deployment**:
   - Vai su `https://palestra-kw8.web.app`
   - Testa il login da desktop
   - Testa il login da mobile

### Soluzione 5: 🔧 Debug Avanzato

#### Controlla Console del Browser
1. Apri DevTools (F12)
2. Vai su **Console**
3. Cerca errori relativi a:
   - `client_id`
   - `CORS`
   - `origin_mismatch`

#### Controlla Network Tab
1. Vai su **Network** in DevTools
2. Filtra per `google` o `oauth`
3. Verifica le richieste durante il login
4. Controlla gli headers e le risposte

#### Test da Mobile
1. Apri il browser mobile
2. Vai su `https://palestra-kw8.web.app` da mobile
3. Apri DevTools mobile (se disponibile)
4. Tenta il login e monitora gli errori

## 🧪 Testing

### Test Desktop
1. Apri `https://palestra-kw8.web.app`
2. Clicca "Accedi con Google"
3. Verifica che appaia la finestra di selezione account
4. Completa il login
5. Verifica il redirect alla dashboard

### Test Mobile
1. Apri il browser mobile
2. Vai su `https://palestra-kw8.web.app`
3. Clicca "Accedi con Google"
4. Verifica che il login funzioni correttamente
5. Controlla che non ci siano errori di redirect

### Verifica su Firebase (Produzione)

- Vai su Firebase Console > Functions
- Controlla i logs per errori
- Verifica che le variabili d'ambiente siano configurate
- Testa gli endpoint API

## 📋 Checklist Completa

### Google Cloud Console
- [ ] Client ID OAuth 2.0 creato
- [ ] Origini JavaScript autorizzate:
  - [ ] `https://palestra-kw8.web.app`
  - [ ] `http://localhost:5173` (per sviluppo)
- [ ] URI di reindirizzamento autorizzati:
  - [ ] `https://palestra-kw8.web.app`
- [ ] Schermata di consenso OAuth configurata
- [ ] Email di test aggiunta (se in modalità test)

### Firebase Console
- [ ] **CRITICO**: Variabile d'ambiente `VITE_GOOGLE_CLIENT_ID` configurata su Firebase
- [ ] **CRITICO**: Progetto ridisployato su Firebase dopo aver aggiunto le variabili
- [ ] Variabile `GOOGLE_CLIENT_SECRET` configurata
- [ ] Variabile `JWT_SECRET` configurata (min 32 caratteri)
- [ ] Variabile `FRONTEND_URL` = `https://palestra-kw8.web.app`
- [ ] Variabile `CORS_ORIGIN` = `https://palestra-kw8.web.app`

### Test Funzionali
- [ ] Login da desktop funzionante
- [ ] Login da mobile funzionante
- [ ] Redirect corretto dopo login
- [ ] Dashboard accessibile dopo login
- [ ] Logout funzionante
- [ ] No errori in console browser

## 🌐 URL di Produzione

URL principale:
```
https://palestra-kw8.web.app
```

## 📞 Supporto

Se il problema persiste:
1. Controlla i logs su Firebase Console
2. Verifica la configurazione Google Cloud Console
3. Testa con un browser in incognito
4. Controlla che tutte le variabili d'ambiente siano configurate
5. Assicurati che il deployment sia aggiornato

---

**Nota**: Dopo ogni modifica alla configurazione OAuth o alle variabili d'ambiente, attendi 5-10 minuti prima di testare nuovamente.