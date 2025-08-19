# Diagnosi Problemi Vercel - Pagina Bianca

## 🔍 PROBLEMI IDENTIFICATI

### 1. API Functions Non Deployate (CRITICO)
**Problema**: Le API functions restituiscono errore 404 su Vercel
- ❌ `https://kw8.vercel.app/api/health` → 404 NOT_FOUND
- ❌ `https://kw8.vercel.app/api/auth/login` → 404 NOT_FOUND

**Causa**: Le API functions TypeScript non sono state compilate/deployate correttamente

### 2. Variabili d'Ambiente Mancanti (CRITICO)
**Problema**: Variabili d'ambiente non configurate su Vercel
- `JWT_SECRET` - Necessario per generare token di autenticazione
- `FRONTEND_URL` - Deve essere `https://kw8.vercel.app`
- `NODE_ENV` - Deve essere `production`

### 3. Database Locale vs Produzione
**Problema**: Il database usa localStorage del browser
- ✅ **Locale**: Funziona con admin `kw8@gmail.com / kw8@182`
- ❌ **Vercel**: Non può accedere al localStorage locale

## 🛠️ SOLUZIONI NECESSARIE

### STEP 1: Configurare Variabili d'Ambiente su Vercel
1. Vai su [vercel.com](https://vercel.com) → Il tuo progetto `kw8`
2. Settings → Environment Variables
3. Aggiungi per **Production**:
   ```
   JWT_SECRET = una_stringa_segreta_lunga_almeno_32_caratteri
   FRONTEND_URL = https://kw8.vercel.app
   NODE_ENV = production
   ```

### STEP 2: Verificare Build Configuration
Il `vercel.json` è corretto:
```json
{
  "version": 2,
  "builds": [
    { "src": "package.json", "use": "@vercel/static-build" },
    { "src": "api/**/*.ts", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "api/$1" },
    { "src": "/(.*)", "dest": "/index.html" }
  ]
}
```

### STEP 3: Redeploy Completo
1. Dopo aver configurato le variabili d'ambiente
2. Vai su Vercel → Deployments
3. Clicca sui tre puntini dell'ultimo deployment
4. Seleziona "Redeploy"

## 🔧 STRUTTURA DATABASE ATTUALE

### Dati Iniziali (localStorage)
- **Admin User**: `kw8@gmail.com / kw8@182`
- **Subscriptions**: 
  - Standard: €39.99/mese
  - Entry-flex: €29.99/mese

### Chiavi localStorage
- `kw8_users` - Array utenti
- `kw8_subscriptions` - Array abbonamenti  
- `kw8_workout_plans` - Piani allenamento
- `kw8_workout_folders` - Cartelle organizzazione
- `kw8_initialized` - Flag inizializzazione

## 🧪 TEST POST-DEPLOYMENT

### 1. Test API Health
```bash
curl https://kw8.vercel.app/api/health
```
**Risultato atteso**: `{"status":"healthy",...}`

### 2. Test Login Admin
```bash
curl -X POST https://kw8.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"kw8@gmail.com","password":"kw8@182"}'
```
**Risultato atteso**: `{"success":true,"token":"...","user":{...}}`

### 3. Test Frontend
1. Apri `https://kw8.vercel.app`
2. Dovrebbe caricare la pagina di login
3. Prova login con `kw8@gmail.com / kw8@182`
4. Dovrebbe reindirizzare alla dashboard admin

## ⚠️ NOTE IMPORTANTI

1. **JWT_SECRET**: Usa una stringa casuale lunga almeno 32 caratteri
2. **Database**: Su Vercel il database sarà vuoto inizialmente (localStorage browser)
3. **CORS**: Già configurato per `kw8.vercel.app`
4. **Node.js**: Aggiornato a versione 22.x

## 🎯 PRIORITÀ AZIONI

1. **ALTA**: Configurare variabili d'ambiente su Vercel
2. **ALTA**: Fare redeploy completo
3. **MEDIA**: Testare API endpoints
4. **MEDIA**: Testare login frontend

Dopo questi step, il sito dovrebbe funzionare correttamente su Vercel.