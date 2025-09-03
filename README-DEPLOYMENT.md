# KW8 Gym Management - Deployment Guide

## Panoramica

Questo progetto è stato aggiornato per supportare la persistenza dei dati in produzione tramite API remote e database cloud.

## Architettura

### Sviluppo (Locale)
- **Frontend**: React + Vite (porta 5173)
- **Persistenza**: localStorage del browser
- **Database**: Simulato con localStorage

### Produzione (Firebase)
- **Frontend**: React build statico (Firebase Hosting)
- **Backend**: Firebase Functions
- **Persistenza**: Database remoto (da configurare)
- **API**: Endpoints REST per operazioni CRUD

## Struttura API

### Endpoints Disponibili

#### Utenti
- `GET /api/users` - Lista tutti gli utenti
- `POST /api/users` - Crea nuovo utente
- `GET /api/users/[id]` - Ottieni utente specifico
- `PUT /api/users/[id]` - Aggiorna utente
- `DELETE /api/users/[id]` - Elimina utente

#### Piani di Allenamento
- `GET /api/workout-plans` - Lista tutti i piani
- `POST /api/workout-plans` - Crea nuovo piano
- `GET /api/workout-plans/[id]` - Ottieni piano specifico
- `PUT /api/workout-plans/[id]` - Aggiorna piano
- `DELETE /api/workout-plans/[id]` - Elimina piano

#### Cartelle Allenamento
- `GET /api/workout-folders` - Lista tutte le cartelle
- `POST /api/workout-folders` - Crea nuova cartella
- `GET /api/workout-folders/[id]` - Ottieni cartella specifica
- `PUT /api/workout-folders/[id]` - Aggiorna cartella
- `DELETE /api/workout-folders/[id]` - Elimina cartella

#### Autenticazione
- `POST /api/auth/login` - Login utente

#### Utilità
- `GET /api/health` - Health check dell'API

## Deployment su Firebase

### 1. Preparazione

1. Installa le dipendenze:
```bash
npm install
```

2. Testa il build locale:
```bash
npm run build
npm run preview
```

### 2. Deploy su Firebase

#### Opzione A: Firebase CLI
```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

#### Opzione B: GitHub Actions
1. Pusha il codice su GitHub
2. Configura GitHub Actions per Firebase
3. Il deploy avverrà automaticamente

### 3. Configurazione Database

**IMPORTANTE**: Gli endpoint API attuali usano array in memoria che si resettano ad ogni riavvio. Per la produzione, è necessario configurare un database persistente.

#### Opzioni Database Consigliate:

1. **MongoDB Atlas** (Consigliato)
   - Gratuito fino a 512MB
   - Facile integrazione
   - Scalabile

2. **PlanetScale** (MySQL)
   - Piano gratuito disponibile
   - Serverless

3. **Supabase** (PostgreSQL)
   - Piano gratuito
   - Include autenticazione

#### Configurazione MongoDB Atlas:

1. Crea account su [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Crea un nuovo cluster
3. Ottieni la connection string
4. Aggiungi le variabili d'ambiente su Firebase:
   ```bash
   firebase functions:config:set mongodb.uri="<YOUR_MONGODB_URI>"
   ```

5. Aggiorna gli endpoint API per usare MongoDB:
   ```typescript
   import { MongoClient } from 'mongodb';
   
   const client = new MongoClient(functions.config().mongodb.uri);
   ```

## Variabili d'Ambiente

Configura queste variabili su Firebase:

```env
# Database
MONGODB_URI=your_mongodb_connection_string

# Ambiente
NODE_ENV=production

# API (opzionale)
API_SECRET_KEY=your_secret_key
```

## Funzionalità Implementate

### ✅ Completate
- [x] Modello User aggiornato con `certificatoMedicoStato`
- [x] Logica condizionata per `dataCertificato`
- [x] Visualizzazione data certificato nella UI
- [x] API endpoints per operazioni CRUD
- [x] Database ibrido (localStorage + API)
- [x] Configurazione Firebase

### 🔄 Da Completare
- [ ] Integrazione database reale (MongoDB/PostgreSQL)
- [ ] Autenticazione JWT
- [ ] Validazione dati lato server
- [ ] Gestione errori avanzata
- [ ] Backup e recovery
- [ ] Monitoring e logging

## Testing

### Test Locale
```bash
npm run dev
# Testa su http://localhost:5173
```

### Test API
```bash
# Health check
curl https://palestra-kw8.web.app/api/health

# Test users endpoint
curl https://palestra-kw8.web.app/api/users
```

## Sicurezza

### Raccomandazioni:
1. **Autenticazione**: Implementa JWT per proteggere le API
2. **Validazione**: Valida tutti i dati in input
3. **Rate Limiting**: Limita le richieste per prevenire abusi
4. **HTTPS**: Sempre abilitato su Firebase
5. **Variabili d'Ambiente**: Non committare mai credenziali nel codice

## Monitoraggio

- **Firebase Analytics**: Automaticamente abilitato
- **Error Tracking**: Considera Sentry per il tracking degli errori
- **Performance**: Usa Firebase Performance Monitoring

## Supporto

Per problemi o domande:
1. Controlla i log su Firebase Console
2. Testa gli endpoint API individualmente
3. Verifica le variabili d'ambiente con `firebase functions:config:get`
4. Controlla la connessione al database