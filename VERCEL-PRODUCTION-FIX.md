# Risoluzione Errore Login Produzione Vercel

## Problema Identificato
Il login su **kw8.vercel.app** restituisce "Risposta non valida dal server" a causa di variabili d'ambiente mancanti o non configurate correttamente.

## Causa Principale
L'API `/api/auth/google-signin.ts` controlla la presenza di variabili d'ambiente specifiche e restituisce errore 500 se mancanti:
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (linea 190)
- `GOOGLE_CLIENT_SECRET` (linea 196) 
- `JWT_SECRET` (linea 202)

## Configurazione Vercel - Passo per Passo

### 1. Accesso al Dashboard Vercel
1. Vai su [vercel.com](https://vercel.com)
2. Accedi al tuo account
3. Seleziona il progetto **KW8**

### 2. Configurazione Variabili d'Ambiente
Vai su **Settings** → **Environment Variables** e aggiungi:

#### Variabili Pubbliche (Frontend)
```
Name: NEXT_PUBLIC_GOOGLE_CLIENT_ID
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
Value: https://kw8.vercel.app
Environment: Production

Name: CORS_ORIGIN
Value: https://kw8.vercel.app
Environment: Production

Name: AUTHORIZED_EMAIL
Value: [LA TUA EMAIL AUTORIZZATA]
Environment: Production

Name: NODE_ENV
Value: production
Environment: Production
```

#### Variabili Opzionali
```
Name: API_RATE_LIMIT
Value: 100
Environment: Production

Name: SESSION_TIMEOUT
Value: 24h
Environment: Production

Name: REFRESH_TOKEN_EXPIRY
Value: 7d
Environment: Production
```

### 3. Redeploy
1. Vai su **Deployments**
2. Clicca sui tre puntini dell'ultimo deployment
3. Seleziona **Redeploy**
4. Attendi il completamento del deployment

### 4. Verifica Google Cloud Console
Assicurati che in Google Cloud Console:
1. **Authorized JavaScript origins** includa:
   - `https://kw8.vercel.app`
   - `http://localhost:5173` (per sviluppo)

2. **Authorized redirect URIs** includa:
   - `https://kw8.vercel.app`
   - `http://localhost:5173` (per sviluppo)

## Test della Configurazione

### 1. Verifica Variabili Frontend
Apri la console del browser su `https://kw8.vercel.app` e verifica:
```javascript
console.log('NEXT_PUBLIC_GOOGLE_CLIENT_ID:', import.meta.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);
```

### 2. Test Login
1. Vai su `https://kw8.vercel.app`
2. Clicca su "Accedi con Google"
3. Verifica che non ci siano errori 500

### 3. Controllo Log Vercel
1. Vai su **Functions** nel dashboard Vercel
2. Controlla i log dell'API `/api/auth/google-signin`
3. Verifica che non ci siano errori di configurazione

## Errori Comuni e Soluzioni

### Errore: "NEXT_PUBLIC_GOOGLE_CLIENT_ID non configurato"
**Soluzione**: Aggiungi la variabile su Vercel e fai redeploy

### Errore: "Token Google non valido"
**Soluzione**: Verifica la configurazione Google Cloud Console

### Errore: "CORS error"
**Soluzione**: Verifica che `CORS_ORIGIN` sia impostato su `https://kw8.vercel.app`

## Note di Sicurezza

⚠️ **IMPORTANTE**: 
- Non condividere mai `GOOGLE_CLIENT_SECRET` o `JWT_SECRET`
- Usa sempre HTTPS in produzione
- Rigenera i segreti se compromessi
- Limita l'accesso alle variabili d'ambiente

## Stato Attuale

✅ **Locale**: Login funzionante su `http://localhost:3001`
❌ **Produzione**: Login non funzionante su `https://kw8.vercel.app`

**Prossimi passi**: Configurare le variabili d'ambiente su Vercel seguendo questa guida.