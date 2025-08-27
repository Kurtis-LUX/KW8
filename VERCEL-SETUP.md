# Configurazione Vercel per KW8 Fitness

## Variabili d'Ambiente Richieste

Per il corretto funzionamento dell'applicazione su Vercel, è necessario configurare le seguenti variabili d'ambiente nel dashboard di Vercel:

### 1. Variabili Obbligatorie

```env
# JWT Security (OBBLIGATORIO)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Frontend URL per CORS (OBBLIGATORIO)
FRONTEND_URL=https://kw8.vercel.app

# Environment
NODE_ENV=production
```

### 2. Variabili Opzionali

```env
# Database (attualmente usa storage in-memory)
MONGODB_URI=your_mongodb_connection_string

# CORS aggiuntivo
CORS_ORIGIN=https://kw8.vercel.app

# Session
SESSION_TIMEOUT=24h
REFRESH_TOKEN_EXPIRY=7d
```

## Come Configurare su Vercel

### Metodo 1: Dashboard Web
1. Vai su [vercel.com](https://vercel.com)
2. Seleziona il tuo progetto KW8
3. Vai su **Settings** > **Environment Variables**
4. Aggiungi ogni variabile:
   - **Name**: `JWT_SECRET`
   - **Value**: `una-chiave-segreta-di-almeno-32-caratteri-molto-lunga-e-sicura`
   - **Environment**: `Production`, `Preview`, `Development`

### Metodo 2: Vercel CLI
```bash
# Installa Vercel CLI
npm install -g vercel

# Login
vercel login

# Configura le variabili
vercel env add JWT_SECRET
vercel env add FRONTEND_URL
vercel env add NODE_ENV

# Redeploy per applicare le modifiche
vercel --prod
```

## Verifica Configurazione

### Test delle API
```bash
# Health check
curl https://kw8.vercel.app/api/health

# Test login (dovrebbe restituire errore di credenziali, non CORS)
curl -X POST https://kw8.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'
```

### Credenziali Admin di Default
- **Email**: `admin@example.com`
- **Password**: `CHANGE_IN_PRODUCTION`

## Troubleshooting

### Problema: "Failed to fetch" o errori CORS
**Soluzione**: Verifica che `FRONTEND_URL` sia configurato correttamente

### Problema: "Invalid JWT" o errori di autenticazione
**Soluzione**: Verifica che `JWT_SECRET` sia configurato e abbia almeno 32 caratteri

### Problema: API non trovate (404)
**Soluzione**: Verifica che i file TypeScript in `/api` siano deployati correttamente

### Problema: Schermo bianco su Vercel
**Soluzione**: 
1. Controlla i logs di Vercel per errori
2. Verifica che tutte le variabili d'ambiente siano configurate
3. Assicurati che il build sia completato senza errori

## Logs e Debugging

### Visualizzare i logs
```bash
# Via CLI
vercel logs https://kw8-fitness.vercel.app

# Via dashboard
# Vai su Functions > View Function Logs
```

### Logs importanti da controllare
- Errori di inizializzazione delle API functions
- Errori di variabili d'ambiente mancanti
- Errori CORS
- Errori JWT

## Checklist Pre-Deploy

- [ ] `JWT_SECRET` configurato (min 32 caratteri)
- [ ] `FRONTEND_URL` configurato con URL di produzione
- [ ] `NODE_ENV=production` configurato
- [ ] Build locale completato senza errori
- [ ] Test API locali funzionanti
- [ ] File `vercel.json` configurato per TypeScript

## Checklist Post-Deploy

- [ ] Health check API funzionante
- [ ] Login admin funzionante
- [ ] Dashboard accessibile
- [ ] Nessun errore CORS nel browser
- [ ] Logs Vercel senza errori critici