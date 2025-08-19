import emailjs from '@emailjs/browser';
import { getEmailConfig, validateEmailConfig, type EmailJSConfig } from '../config/emailConfig';

// Interfacce per i dati email
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NewsletterSubscription {
  email: string;
  timestamp: string;
  source: string;
}

class EmailService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;
  private isInitialized = false;

  constructor() {
    const config = getEmailConfig();
    this.serviceId = config.serviceId;
    this.templateId = config.templateId;
    this.publicKey = config.publicKey;
    this.initializeEmailJS();
  }

  private initializeEmailJS() {
    try {
      // Valida la configurazione
      const config = { serviceId: this.serviceId, templateId: this.templateId, publicKey: this.publicKey };
      if (!validateEmailConfig(config)) {
        throw new Error('Configurazione EmailJS non valida');
      }

      // Inizializza EmailJS con la chiave pubblica
      emailjs.init(this.publicKey);
      this.isInitialized = true;
      console.log('EmailJS inizializzato correttamente con:', {
        serviceId: this.serviceId,
        templateId: this.templateId,
        publicKey: this.publicKey.substring(0, 8) + '...'
      });
    } catch (error) {
      console.error('Errore nell\'inizializzazione di EmailJS:', error);
      this.isInitialized = false;
    }
  }

  // Metodo per inviare email di benvenuto newsletter
  async sendNewsletterWelcome(email: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('EmailJS non è inizializzato correttamente');
      return false;
    }

    try {
      const templateParams = {
        to_email: email,
        to_name: email.split('@')[0],
        gym_name: 'KW8',
        gym_address: 'Via Pietro Nenni, 96010 Sortino SR',
        gym_phone: '3338346546',
        unsubscribe_link: `${window.location.origin}/unsubscribe?email=${encodeURIComponent(email)}`
      };

      const result = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      if (result.status === 200) {
        console.log('Email di benvenuto inviata con successo a:', email);
        return true;
      } else {
        console.error('Errore nell\'invio email:', result.text);
        return false;
      }
    } catch (error) {
      console.error('Errore durante l\'invio email:', error);
      return false;
    }
  }

  // Metodo per salvare l'iscrizione alla newsletter
  async subscribeToNewsletter(email: string): Promise<boolean> {
    try {
      // Salva nel localStorage
      const existingEmails = JSON.parse(localStorage.getItem('newsletterEmails') || '[]');
      const subscriptions = JSON.parse(localStorage.getItem('newsletterSubscriptions') || '[]');
      
      if (!existingEmails.includes(email)) {
        existingEmails.push(email);
        localStorage.setItem('newsletterEmails', JSON.stringify(existingEmails));
        
        const subscription: NewsletterSubscription = {
          email,
          timestamp: new Date().toISOString(),
          source: 'website'
        };
        
        subscriptions.push(subscription);
        localStorage.setItem('newsletterSubscriptions', JSON.stringify(subscriptions));
        
        // Invia email di benvenuto
        const emailSent = await this.sendNewsletterWelcome(email);
        
        if (emailSent) {
          console.log('Iscrizione completata e email inviata per:', email);
        } else {
          console.log('Iscrizione salvata ma email non inviata per:', email);
        }
        
        return true;
      } else {
        console.log('Email già iscritta:', email);
        return false;
      }
    } catch (error) {
      console.error('Errore durante l\'iscrizione:', error);
      return false;
    }
  }

  // Metodo per inviare email generiche
  async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('EmailJS non è inizializzato correttamente');
      return false;
    }

    try {
      // Per ora usa EmailJS, ma può essere sostituito con altri servizi
      const templateParams = {
        to_email: emailData.to,
        subject: emailData.subject,
        html_content: emailData.html,
        text_content: emailData.text || emailData.html.replace(/<[^>]*>/g, '')
      };

      const result = await emailjs.send(
        this.serviceId,
        'template_generic',
        templateParams
      );

      return result.status === 200;
    } catch (error) {
      console.error('Errore durante l\'invio email:', error);
      return false;
    }
  }

  // Metodo per configurare le credenziali EmailJS
  configure(serviceId: string, templateId: string, publicKey: string) {
    this.serviceId = serviceId;
    this.templateId = templateId;
    this.publicKey = publicKey;
    // Reinizializza EmailJS con la nuova chiave
    this.initializeEmailJS();
  }

  // Metodo per verificare se EmailJS è inizializzato
  isEmailJSReady(): boolean {
    return this.isInitialized;
  }

  // Metodo per ottenere le credenziali correnti
  getCredentials() {
    return {
      serviceId: this.serviceId,
      templateId: this.templateId,
      publicKey: this.publicKey,
      isInitialized: this.isInitialized
    };
  }
}

export const emailService = new EmailService();
export default emailService;