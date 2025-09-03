# Configurazione Firebase per KW8 Fitness

## Variabili d'Ambiente Richieste

Per il corretto funzionamento dell'applicazione su Firebase, è necessario configurare le seguenti variabili d'ambiente nella Firebase Console:

### 1. Variabili Obbligatorie

```env
# JWT Security (OBBLIGATORIO)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Frontend URL per CORS (OBBLIGATORIO)
FRONTEND_URL=https://palestra-kw8.web.app

# Environment
NODE_ENV=production
```

### 2. Variabili Opzionali

```env
# Database (attualmente usa storage in-memory)
MONGODB_URI=your_mongodb_connection_string

# CORS aggiuntivo
CORS_ORIGIN=https://palestra-kw8.web.app

# Session
SESSION_TIMEOUT=24h
REFRESH_TOKEN_EXPIRY=7d
```

## Come Configurare su Firebase

### Metodo 1: Firebase Console
1. Vai su [console.firebase.google.com](https://console.firebase.google.com)
2. Seleziona il tuo progetto palestra-kw8
3. Vai su **Functions** > **Environment Variables**
4. Aggiungi ogni variabile:
   - **Name**: `JWT_SECRET`
   - **Value**: `una-chiave-segreta-di-almeno-32-caratteri-molto-lunga-e-sicura`

### Metodo 2: Firebase CLI
```bash
# Installa Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Configura le variabili d'ambiente
firebase functions:config:set jwt.secret="your-super-secret-jwt-key"
firebase functions:config:set frontend.url="https://palestra-kw8.web.app"
firebase functions:config:set cors.origin="https://palestra-kw8.web.app"

# Deploy per applicare le modifiche
firebase deploy --only functions
```

## Configurazione Hosting

### firebase.json
Il file `firebase.json` deve essere configurato correttamente:

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "functions": {
    "source": "api",
    "runtime": "nodejs18"
  }
}
```

## Deploy dell'Applicazione

### Build e Deploy Completo
```bash
# Build del frontend
npm run build

# Deploy completo (hosting + functions)
firebase deploy

# Deploy solo hosting
firebase deploy --only hosting

# Deploy solo functions
firebase deploy --only functions
```

## Sicurezza e Best Practices

### 1. Variabili Sensibili
- Non committare mai le variabili d'ambiente nel repository
- Usa chiavi JWT di almeno 32 caratteri
- Cambia le credenziali di default prima del deploy

### 2. CORS Configuration
- Configura correttamente `FRONTEND_URL` e `CORS_ORIGIN`
- Per sviluppo locale usa `http://localhost:5173`
- Per produzione usa `https://palestra-kw8.web.app`

### 3. Monitoring
- Controlla i logs in Firebase Console > Functions > Logs
- Monitora l'utilizzo delle risorse
- Configura alerting per errori critici

## Troubleshooting

### Problemi Comuni

1. **Functions non deployate**
   ```bash
   firebase deploy --only functions --debug
   ```

2. **Errori CORS**
   - Verifica `FRONTEND_URL` e `CORS_ORIGIN`
   - Controlla che le origini siano configurate correttamente

3. **Errori JWT**
   - Verifica che `JWT_SECRET` sia configurato
   - Controlla che la chiave sia di almeno 32 caratteri

4. **Hosting non aggiornato**
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

### Logs e Debug
```bash
# Visualizza logs delle functions
firebase functions:log

# Debug deploy
firebase deploy --debug

# Serve localmente per test
firebase serve
```

## URL di Produzione

- **Frontend**: https://palestra-kw8.web.app
- **Functions**: https://us-central1-palestra-kw8.cloudfunctions.net/
- **Console**: https://console.firebase.google.com/project/palestra-kw8

---

**Nota**: Questo setup sostituisce completamente la configurazione Vercel precedente.