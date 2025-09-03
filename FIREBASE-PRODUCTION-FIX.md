# Risoluzione Errore Login Produzione Firebase

## Problema Identificato
Il login su **palestra-kw8.web.app** restituisce "Risposta non valida dal server" a causa di variabili d'ambiente mancanti o non configurate correttamente.

## Causa Principale
Le Firebase Functions controllano la presenza di variabili d'ambiente specifiche e restituiscono errore 500 se mancanti:
- `VITE_GOOGLE_CLIENT_ID` (per il frontend)
- `GOOGLE_CLIENT_SECRET` (per il backend) 
- `JWT_SECRET` (per l'autenticazione)

## Configurazione Firebase - Passo per Passo

### 1. Accesso alla Firebase Console
1. Vai su [console.firebase.google.com](https://console.firebase.google.com)
2. Accedi al tuo account Google
3. Seleziona il progetto **palestra-kw8**

### 2. Configurazione Variabili d'Ambiente
Vai su **Functions** → **Environment Variables** e aggiungi:

#### Variabili Pubbliche (Frontend)
```
Name: VITE_GOOGLE_CLIENT_ID
Value: [IL TUO GOOGLE_CLIENT_ID]
Environment: Production
```

#### Variabili Private (Backend)
```
Name: GOOGLE_CLIENT_SECRET
Value: [IL TUO GOOGLE_CLIENT_SECRET]
Environment: Production

Name: JWT_SECRET
Value: [IL TUO JWT_SECRET]
Environment: Production

Name: API_SECRET_KEY
Value: [IL TUO API_SECRET_KEY]
Environment: Production

Name: MONGODB_URI
Value: [LA TUA STRINGA MONGODB]
Environment: Production

Name: FRONTEND_URL
Value: https://palestra-kw8.web.app
Environment: Production

Name: CORS_ORIGIN
Value: https://palestra-kw8.web.app
Environment: Production

Name: NODE_ENV
Value: production
Environment: Production
```

### 3. Configurazione tramite Firebase CLI
Alternativamente, puoi configurare le variabili tramite CLI:

```bash
# Login a Firebase
firebase login

# Configura le variabili d'ambiente
firebase functions:config:set google.client_secret="IL_TUO_CLIENT_SECRET"
firebase functions:config:set jwt.secret="IL_TUO_JWT_SECRET"
firebase functions:config:set api.secret_key="IL_TUO_API_SECRET"
firebase functions:config:set mongodb.uri="LA_TUA_STRINGA_MONGODB"
firebase functions:config:set frontend.url="https://palestra-kw8.web.app"
firebase functions:config:set cors.origin="https://palestra-kw8.web.app"

# Deploy per applicare le modifiche
firebase deploy --only functions
```

## Verifica della Configurazione

### 1. Controlla le Variabili
Nella Firebase Console:
1. Vai su **Functions** → **Environment Variables**
2. Verifica che tutte le variabili siano presenti
3. Controlla che i valori siano corretti (senza spazi extra)

### 2. Test delle Functions
```bash
# Controlla i logs delle functions
firebase functions:log

# Test locale
firebase serve --only functions
```

### 3. Test dell'Applicazione
1. Vai su `https://palestra-kw8.web.app`
2. Prova il login con Google
3. Controlla la console del browser per errori

## Risoluzione Problemi Comuni

### Errore "Token Google non valido"
**Causa**: Client ID non configurato correttamente

**Soluzione**:
1. Verifica `VITE_GOOGLE_CLIENT_ID` nelle variabili d'ambiente
2. Controlla che il Client ID sia quello corretto dalla Google Cloud Console
3. Redeploy l'applicazione: `firebase deploy`

### Errore "JWT Secret mancante"
**Causa**: `JWT_SECRET` non configurato

**Soluzione**:
1. Aggiungi `JWT_SECRET` nelle variabili d'ambiente Firebase
2. Usa una stringa di almeno 32 caratteri
3. Redeploy le functions: `firebase deploy --only functions`

### Errore CORS
**Causa**: `FRONTEND_URL` o `CORS_ORIGIN` non configurati

**Soluzione**:
1. Verifica che `FRONTEND_URL=https://palestra-kw8.web.app`
2. Verifica che `CORS_ORIGIN=https://palestra-kw8.web.app`
3. Redeploy le functions: `firebase deploy --only functions`

### Functions non rispondono
**Causa**: Deploy non completato o errori nelle functions

**Soluzione**:
```bash
# Controlla lo stato del deploy
firebase deploy --only functions --debug

# Verifica i logs
firebase functions:log --limit 50

# Test locale
firebase serve --only functions
```

## Checklist di Verifica

- [ ] Tutte le variabili d'ambiente sono configurate in Firebase Console
- [ ] `VITE_GOOGLE_CLIENT_ID` corrisponde al Client ID di Google Cloud
- [ ] `JWT_SECRET` è di almeno 32 caratteri
- [ ] `FRONTEND_URL` e `CORS_ORIGIN` puntano a `https://palestra-kw8.web.app`
- [ ] Le functions sono deployate correttamente
- [ ] I logs non mostrano errori critici
- [ ] Il login con Google funziona

## Comandi Utili

```bash
# Deploy completo
firebase deploy

# Deploy solo functions
firebase deploy --only functions

# Deploy solo hosting
firebase deploy --only hosting

# Visualizza logs
firebase functions:log

# Test locale
firebase serve

# Debug deploy
firebase deploy --debug
```

## URL di Riferimento

- **Applicazione**: https://palestra-kw8.web.app
- **Firebase Console**: https://console.firebase.google.com/project/palestra-kw8
- **Google Cloud Console**: https://console.cloud.google.com/

---

**Nota**: Dopo ogni modifica alle variabili d'ambiente, è necessario fare redeploy delle functions per applicare le modifiche.