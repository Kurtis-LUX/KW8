# KW8 Fitness - Gym Management System

🏋️‍♂️ Sistema di gestione completo per palestre con dashboard amministrativa, gestione abbonamenti e newsletter.

## 🚀 Caratteristiche Principali

- **Dashboard Amministrativa**: Gestione utenti, piani di allenamento e cartelle
- **Sistema di Autenticazione**: Login sicuro con JWT e protezione delle route
- **Gestione Abbonamenti**: Visualizzazione e gestione dei piani di abbonamento
- **Newsletter**: Sistema di iscrizione e invio newsletter tramite EmailJS
- **Responsive Design**: Interfaccia moderna e mobile-friendly
- **Database Ibrido**: Supporto per localStorage (sviluppo) e MongoDB (produzione)

## 🛠️ Tecnologie Utilizzate

- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, Vercel Functions
- **Database**: MongoDB (produzione), localStorage (sviluppo)
- **Autenticazione**: JWT, bcrypt
- **Email**: EmailJS
- **Deployment**: Vercel

## 📋 Prerequisiti

- Node.js 18+ 
- npm o yarn
- Account MongoDB (per produzione)
- Account EmailJS (per newsletter)

## 🔧 Installazione

1. **Clona il repository**
   ```bash
   git clone https://github.com/yourusername/kw8-fitness.git
   cd kw8-fitness
   ```

2. **Installa le dipendenze**
   ```bash
   npm install
   ```

3. **Configura le variabili d'ambiente**
   
   Copia il file `.env.example` in `.env` e configura:
   ```env
   # Database
   MONGODB_URI=your_mongodb_connection_string
   
   # JWT
   JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
   
   # API Security
   API_SECRET_KEY=your-super-secret-api-key
   
   # EmailJS (Frontend)
   VITE_EMAILJS_SERVICE_ID=your_emailjs_service_id
   VITE_EMAILJS_TEMPLATE_ID=your_emailjs_template_id
   VITE_EMAILJS_PUBLIC_KEY=your_emailjs_public_key
   ```

4. **Avvia il server di sviluppo**
   ```bash
   npm run dev
   ```

5. **Avvia il server API locale (opzionale)**
   ```bash
   node server.cjs
   ```

## 🌐 Deployment su Vercel

1. **Installa Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login e deploy**
   ```bash
   vercel login
   vercel
   ```

3. **Configura le variabili d'ambiente su Vercel**
   - Vai al dashboard Vercel
   - Seleziona il progetto
   - Settings → Environment Variables
   - Aggiungi tutte le variabili del file `.env`

## 🔐 Configurazione Sicurezza

### Credenziali di Default (DA CAMBIARE IN PRODUZIONE)

⚠️ **IMPORTANTE**: Cambia queste credenziali prima del deployment:

- **Admin Email**: `admin@example.com`
- **Admin Password**: `CHANGE_IN_PRODUCTION`
- **JWT Secret**: Genera una chiave sicura di almeno 32 caratteri
- **API Secret**: Genera una chiave API sicura

### EmailJS Setup

1. Crea un account su [EmailJS](https://www.emailjs.com/)
2. Crea un servizio email
3. Crea un template per la newsletter
4. Ottieni le credenziali e configurale nelle variabili d'ambiente

## 📁 Struttura del Progetto

```
kw8-fitness/
├── api/                    # Vercel API Functions
│   ├── auth/              # Autenticazione
│   ├── users/             # Gestione utenti
│   ├── workout-plans/     # Piani di allenamento
│   └── workout-folders/   # Cartelle allenamenti
├── public/                # Asset statici
├── src/
│   ├── components/        # Componenti React
│   ├── pages/            # Pagine dell'applicazione
│   ├── services/         # Servizi API
│   ├── utils/            # Utilità e database
│   └── contexts/         # Context React
└── docs/                 # Documentazione
```

## 🎯 Utilizzo

### Dashboard Amministrativa

1. Accedi con le credenziali admin
2. Gestisci utenti, piani di allenamento e cartelle
3. Visualizza statistiche e metriche

### Gestione Newsletter

- Gli utenti possono iscriversi alla newsletter
- Gli admin possono visualizzare e gestire le iscrizioni
- Invio automatico email di benvenuto

## 🧪 Testing

```bash
# Test locale
npm run dev

# Test API endpoints
curl http://localhost:5173/api/health
```

## 📚 API Endpoints

### Autenticazione
- `POST /api/auth/login` - Login utente
- `POST /api/auth/verify` - Verifica token

### Utenti (Admin only)
- `GET /api/users` - Lista utenti
- `GET /api/users/[id]` - Dettagli utente
- `POST /api/users` - Crea utente
- `PUT /api/users/[id]` - Aggiorna utente
- `DELETE /api/users/[id]` - Elimina utente

### Piani di Allenamento (Admin only)
- `GET /api/workout-plans` - Lista piani
- `POST /api/workout-plans` - Crea piano
- `PUT /api/workout-plans/[id]` - Aggiorna piano
- `DELETE /api/workout-plans/[id]` - Elimina piano

### Cartelle (Admin only)
- `GET /api/workout-folders` - Lista cartelle
- `POST /api/workout-folders` - Crea cartella
- `PUT /api/workout-folders/[id]` - Aggiorna cartella
- `DELETE /api/workout-folders/[id]` - Elimina cartella

## 🔒 Sicurezza

- Autenticazione JWT con scadenza
- Password hashate con bcrypt
- CORS configurato
- Protezione route API e frontend
- Validazione input
- Rate limiting (configurabile)

## 🐛 Troubleshooting

### Problemi Comuni

1. **API 404**: Verifica che i file in `/api` siano deployati
2. **CORS Error**: Controlla la configurazione CORS
3. **JWT Error**: Verifica la variabile `JWT_SECRET`
4. **Database Error**: Controlla la connessione MongoDB

### Logs

Controlla i logs su:
- Console del browser (frontend)
- Vercel Dashboard (API functions)
- Network tab per richieste API

## 🤝 Contribuire

1. Fork del progetto
2. Crea un branch per la feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push del branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è sotto licenza MIT. Vedi il file `LICENSE` per i dettagli.

## 📞 Supporto

Per supporto e domande:
- Apri un issue su GitHub
- Controlla la documentazione in `/docs`
- Verifica i logs di Vercel

## 🔄 Changelog

### v1.0.0
- Release iniziale
- Dashboard amministrativa completa
- Sistema di autenticazione
- Gestione newsletter
- Deployment Vercel ready

---

**Sviluppato con ❤️ per KW8 Fitness**