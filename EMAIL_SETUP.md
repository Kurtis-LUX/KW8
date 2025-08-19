# Configurazione Servizio Email per Newsletter

## Panoramica
Il sistema di newsletter è ora configurato per inviare email reali utilizzando EmailJS. Per attivare completamente il servizio, segui questi passaggi:

## 1. Registrazione su EmailJS

1. Vai su [EmailJS](https://www.emailjs.com/)
2. Crea un account gratuito
3. Verifica la tua email

## 2. Configurazione del Servizio

1. Nel dashboard di EmailJS, vai su **Services**
2. Clicca su **Add New Service**
3. Scegli il provider email (Gmail, Outlook, etc.)
4. Configura il servizio con le tue credenziali email
5. Annota il **Service ID** (es. `service_kw8gym`)

## 3. Creazione del Template

1. Vai su **Email Templates**
2. Clicca su **Create New Template**
3. Usa questo template per la newsletter:

```html
Ciao {{to_name}},

Benvenuto nella newsletter di {{gym_name}}!

Grazie per esserti iscritto alla nostra newsletter. Riceverai aggiornamenti su:
- Nuovi programmi di allenamento
- Eventi speciali e promozioni
- Consigli fitness e nutrizione
- Orari e novità della palestra

Informazioni Palestra:
📍 Indirizzo: {{gym_address}}
📞 Telefono: {{gym_phone}}

Se non desideri più ricevere le nostre email, puoi disiscriverti qui: {{unsubscribe_link}}

Grazie e buon allenamento!
Team {{gym_name}}
```

4. Salva il template e annota il **Template ID** (es. `template_newsletter`)

## 4. Configurazione nel Codice

1. Apri il file `src/services/emailService.ts`
2. Sostituisci i valori placeholder:
   - `serviceId`: Il tuo Service ID di EmailJS
   - `templateId`: Il tuo Template ID di EmailJS  
   - `publicKey`: La tua Public Key di EmailJS (trovabile in Account > API Keys)

```typescript
private serviceId = 'il_tuo_service_id';
private templateId = 'il_tuo_template_id'; 
private publicKey = 'la_tua_public_key';
```

## 5. Test del Sistema

1. Avvia l'applicazione
2. Vai alla sezione newsletter
3. Inserisci una email di test
4. Verifica che l'email arrivi correttamente

## 6. Funzionalità Implementate

✅ **Validazione Email**: Controllo formato email valido
✅ **Prevenzione Duplicati**: Evita iscrizioni multiple della stessa email
✅ **Invio Email Automatico**: Email di benvenuto immediata
✅ **Gestione Errori**: Messaggi di errore user-friendly
✅ **Salvataggio Locale**: Backup delle iscrizioni nel localStorage
✅ **Tracking Iscrizioni**: Timestamp e fonte di ogni iscrizione

## 7. Monitoraggio

Le iscrizioni vengono salvate in:
- `localStorage.newsletterEmails`: Array delle email iscritte
- `localStorage.newsletterSubscriptions`: Dettagli completi delle iscrizioni

## 8. Limiti EmailJS Gratuito

- 200 email/mese nel piano gratuito
- Per volumi maggiori, considera l'upgrade a un piano a pagamento

## 9. Alternative

Se preferisci altri servizi email:
- **Mailchimp**: Per newsletter professionali
- **SendGrid**: Per volumi elevati
- **Nodemailer**: Se hai un server backend

Il servizio è modulare e può essere facilmente sostituito modificando `emailService.ts`.

## Supporto

Per problemi di configurazione, contatta il team di sviluppo.