# Configurazione Google OAuth per Localhost

## Problema
Errore `TypeError: Failed to fetch` durante l'autenticazione Google in ambiente locale.

## Soluzione

### 1. Configurare Google Cloud Console

1. Vai su [Google Cloud Console](https://console.cloud.google.com/)
2. Seleziona il tuo progetto
3. Vai su **APIs & Services** > **Credentials**
4. Trova il tuo OAuth 2.0 Client ID: `803496166941-a6eb8r5v7ei7fo4rd2ks1i02044u1ogf.apps.googleusercontent.com`
5. Clicca su di esso per modificarlo

### 2. Configurare Authorized JavaScript Origins

Aggiungi questi domini nella sezione **Authorized JavaScript origins**:
```
http://localhost:5173
http://127.0.0.1:5173
http://localhost:3000
http://127.0.0.1:3000
```

### 3. Configurare Authorized Redirect URIs

Aggiungi questi URI nella sezione **Authorized redirect URIs**:
```
http://localhost:5173
http://127.0.0.1:5173
http://localhost:5173/auth/callback
http://127.0.0.1:5173/auth/callback
```

### 4. Note Importanti

- **Localhost è esente da HTTPS**: Per localhost, puoi usare HTTP invece di HTTPS
- **Propagazione**: Le modifiche possono richiedere fino a 5 minuti per essere attive
- **Cache del browser**: Svuota la cache del browser dopo le modifiche
- **Incognito**: Testa in modalità incognito per evitare problemi di cache

### 5. Verifica Configurazione

Dopo aver salvato le modifiche:
1. Aspetta 5-10 minuti
2. Riavvia il server di sviluppo: `npm run dev`
3. Apri il browser in modalità incognito
4. Testa l'autenticazione Google

### 6. Debug

Se il problema persiste:
1. Controlla la console del browser per errori specifici
2. Verifica che il Client ID sia corretto nel file `.env.local`
3. Assicurati che non ci siano caratteri nascosti negli URI configurati

### 7. Configurazione Attuale

**Client ID**: `803496166941-a6eb8r5v7ei7fo4rd2ks1i02044u1ogf.apps.googleusercontent.com`
**Frontend URL**: `http://localhost:5173`
**API URL**: `http://localhost:3001`

## Risoluzione Problemi Comuni

### Error: origin_mismatch
- Verifica che `http://localhost:5173` sia in **Authorized JavaScript origins**

### Error: redirect_uri_mismatch
- Verifica che gli URI di redirect siano configurati correttamente

### Error: Failed to fetch
- Problema di CORS o origine non autorizzata
- Verifica la configurazione delle origini JavaScript