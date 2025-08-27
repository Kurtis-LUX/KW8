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

### Soluzione 1: 🔧 Risoluzione "origin_mismatch"

**CAUSA**: L'origine del sito web non è autorizzata nella Google Cloud Console.

**SOLUZIONE IMMEDIATA**:

1. **Accedi alla Google Cloud Console**:
   - Vai su [Google Cloud Console](https://console.cloud.google.com/)
   - Seleziona il progetto KW8

2. **Verifica le Credenziali OAuth**:
   - Vai su **"API e servizi" > "Credenziali"**
   - Clicca sul Client ID OAuth 2.0 esistente
   - Clicca sull'icona della matita per modificare

3. **Aggiungi TUTTE le origini necessarie**:
   ```
   http://localhost:5173
   http://localhost:3000
   https://kw8.vercel.app
   https://kw8-fitness.vercel.app
   ```
   
   **⚠️ IMPORTANTE**: 
   - Aggiungi sia `http://localhost:5173` che `http://localhost:3000`
   - Verifica che l'URL di produzione sia esatto (senza slash finale)
   - Salva le modifiche

4. **Verifica URI di Reindirizzamento**:
   - ⚠️ **IMPORTANTE**: Lascia la sezione "URI di reindirizzamento autorizzati" **VUOTA**
   - Google Identity Services gestisce automaticamente i redirect

5. **Attendi la propagazione** (5-10 minuti)

### 2. 🔧 Risoluzione "Login automatico con account sbagliato"

**CAUSA**: Google mantiene la sessione dell'account precedente nel browser.

**SOLUZIONE IMPLEMENTATA**:
- Aggiunto `disableAutoSelect()` per forzare la disconnessione
- Configurazione `use_fedcm_for_prompt: false` per impedire il salvataggio della sessione
- Configurazione per forzare sempre la selezione dell'account

**Come funziona**:
1. Ogni login richiederà sempre la selezione dell'account
2. La sessione non viene salvata tra i login
3. Apparirà sempre la schermata di selezione account Google

### 3. 🔧 Risoluzione "Missing client_id"

**CAUSA**: Variabile d'ambiente non configurata correttamente.

**SOLUZIONE**: Aggiornare Variabili d'Ambiente

1. **Verifica il file `.env`**:
   ```bash
   VITE_GOOGLE_CLIENT_ID=803496166941-a6eb8r5v7ei7fo4rd2ks1i02044u1ogf.apps.googleusercontent.com
   ```

2. **Verifica che il Client ID sia corretto**:
   - Copia il Client ID dalla Google Cloud Console
   - Sostituisci il valore nel file `.env`
   - Riavvia il server di sviluppo

### Soluzione 3: Configurazione Vercel per Produzione (CRITICA)

⚠️ **PROBLEMA PRINCIPALE**: Le variabili d'ambiente non sono configurate su Vercel!

1. **Aggiungi le variabili d'ambiente su Vercel**:
   - Vai su [Vercel Dashboard](https://vercel.com/dashboard)
   - Seleziona il progetto KW8
   - Vai su **Settings > Environment Variables**
   - Clicca **Add New**
   - Aggiungi ESATTAMENTE:
     ```
     Name: VITE_GOOGLE_CLIENT_ID
     Value: 803496166941-a6eb8r5v7ei7fo4rd2ks1i02044u1ogf.apps.googleusercontent.com
     Environment: Production, Preview, Development (seleziona tutti)
     ```
   - ⚠️ **ATTENZIONE**: Non aggiungere spazi prima o dopo il valore!

2. **Verifica la configurazione**:
   - Dopo aver aggiunto la variabile, dovrebbe apparire nella lista
   - Verifica che il nome sia esattamente `VITE_GOOGLE_CLIENT_ID`
   - Verifica che il valore termini con `.apps.googleusercontent.com`

3. **Rideploy il progetto**:
   - Vai su **Deployments**
   - Clicca sui tre puntini dell'ultimo deployment
   - Seleziona **Redeploy**
   - ⚠️ **IMPORTANTE**: Le variabili d'ambiente si applicano solo ai nuovi deployment!

4. **Verifica il deployment**:
   - Attendi che il deployment sia completato
   - Controlla i log del build per eventuali errori
   - Testa il login Google su produzione

### Soluzione 4: Test e Verifica

1. **Test su Desktop**:
   - Vai su `http://localhost:5173`
   - Prova il login Google
   - Verifica che funzioni correttamente

2. **Test su Mobile (Locale)**:
   - Trova l'IP locale del tuo computer (es. `192.168.1.100`)
   - Aggiungi `http://192.168.1.100:5173` alle origini autorizzate in Google Cloud Console
   - Accedi da mobile usando l'IP locale

3. **Test su Mobile (Produzione)**:
   - Vai su `https://kw8.vercel.app` da mobile
   - Prova il login Google
   - Verifica che l'errore sia risolto

## 🔧 Configurazione Avanzata per Mobile

### Aggiungere Meta Tag per Mobile
Il file `index.html` è già configurato correttamente con:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
```

### Verifica Caricamento Script Google
Il componente `CoachAuthPage.tsx` carica dinamicamente lo script:
```javascript
if (!window.google) {
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  script.onload = initializeGoogleSignIn;
  document.head.appendChild(script);
}
```

## 🔍 Debug delle Variabili d'Ambiente

### Verifica Locale (Sviluppo)
1. **Controlla il file `.env`**:
   ```bash
   cat .env | grep VITE_GOOGLE_CLIENT_ID
   ```
   Dovrebbe mostrare:
   ```
   VITE_GOOGLE_CLIENT_ID=803496166941-a6eb8r5v7ei7fo4rd2ks1i02044u1ogf.apps.googleusercontent.com
   ```

2. **Verifica nel browser (F12 > Console)**:
   ```javascript
   console.log('Client ID:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
   ```
   Non dovrebbe essere `undefined`

### Verifica su Vercel (Produzione)
1. **Controlla i log di build**:
   - Vai su Vercel Dashboard > Deployments
   - Clicca sull'ultimo deployment
   - Vai su **Build Logs**
   - Cerca errori relativi a variabili d'ambiente

2. **Aggiungi log temporaneo** (per debug):
   Nel file `src/components/auth/CoachAuthPage.tsx`, aggiungi:
   ```javascript
   console.log('🔍 Client ID Debug:', import.meta.env.VITE_GOOGLE_CLIENT_ID);
   ```
   Poi rideploy e controlla i log del browser su produzione

## 🚨 Checklist di Verifica

### Per errore "origin_mismatch":
- [ ] **CRITICO**: Tutte le origini JavaScript aggiunte in Google Cloud Console:
  - [ ] `http://localhost:5173`
  - [ ] `http://localhost:3000` 
  - [ ] `https://kw8.vercel.app`
  - [ ] Altri domini personalizzati (se applicabili)
- [ ] URI di reindirizzamento lasciati **VUOTI** (importante per GSI)
- [ ] Modifiche salvate nella Google Cloud Console
- [ ] Atteso 5-10 minuti per la propagazione
- [ ] Cache del browser svuotata
- [ ] Test con browser in modalità incognito

### Per problema "Login automatico con account sbagliato":
- [ ] Verifica che `disableAutoSelect()` funzioni correttamente
- [ ] Configurazione `use_fedcm_for_prompt: false` implementata
- [ ] Ogni login richiede sempre la selezione dell'account
- [ ] Nessuna sessione salvata tra i login
- [ ] Test con browser che ha più account Google collegati

### Per errore "Missing client_id":
- [ ] Client ID copiato correttamente dalla Google Cloud Console
- [ ] Variabile d'ambiente `VITE_GOOGLE_CLIENT_ID` configurata nel file `.env` locale
- [ ] Server di sviluppo riavviato dopo modifiche al `.env`
- [ ] **CRITICO**: Variabile d'ambiente `VITE_GOOGLE_CLIENT_ID` configurata su Vercel
- [ ] **CRITICO**: Progetto ridisployato su Vercel dopo aver aggiunto le variabili
- [ ] Verifica che `import.meta.env.VITE_GOOGLE_CLIENT_ID` non sia `undefined` in produzione
- [ ] Test effettuato sia su desktop che mobile

## ⚡ Risoluzione Rapida per "origin_mismatch"

**Se vedi l'errore "origin_mismatch" SUBITO:**

1. **Apri Google Cloud Console** → [console.cloud.google.com](https://console.cloud.google.com/)
2. **Vai su "APIs & Services" → "Credentials"**
3. **Clicca sul tuo OAuth 2.0 Client ID**
4. **Aggiungi queste origini JavaScript autorizzate:**
   ```
   http://localhost:5173
   http://localhost:3000
   https://kw8.vercel.app
   ```
5. **Salva e attendi 5-10 minuti**
6. **Svuota cache browser e riprova**

## 📞 Supporto Aggiuntivo

Se il problema persiste dopo aver seguito tutti i passaggi:

1. **Controlla i log della console del browser** (F12 > Console)
2. **Verifica che il dominio di produzione sia corretto**
3. **Prova con un browser diverso** sul mobile
4. **Prova in modalità incognito**
5. **Contatta il supporto tecnico** con screenshot dell'errore

---

*Documento creato per risolvere gli errori OAuth di Google: "Missing required parameter: client_id" e "origin_mismatch".*