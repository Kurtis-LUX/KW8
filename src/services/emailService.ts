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
      if (typeof emailjs === 'undefined') {
        throw new Error('EmailJS non è disponibile');
      }
      
      const config = { serviceId: this.serviceId, templateId: this.templateId, publicKey: this.publicKey };
      if (!validateEmailConfig(config)) {
        throw new Error('Configurazione EmailJS non valida');
      }

      emailjs.init(this.publicKey);
      this.isInitialized = true;
    } catch (error) {
      console.error('Errore inizializzazione EmailJS:', error instanceof Error ? error.message : 'Errore sconosciuto');
      this.isInitialized = false;
    }
  }

  // Metodo per inviare email di benvenuto newsletter
  async sendNewsletterWelcome(email: string): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('EmailJS non inizializzato');
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

      return result.status === 200;
    } catch (error: any) {
      console.error('Errore invio email:', error instanceof Error ? error.message : 'Errore sconosciuto');
      return false;
    }
  }

  // Metodo per salvare l'iscrizione alla newsletter
  async subscribeToNewsletter(email: string): Promise<boolean> {
    try {
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
        
        if (!this.isInitialized) {
          this.reinitialize();
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          if (!this.isInitialized) {
            return true; // Iscrizione salvata comunque
          }
        }
        
        await this.sendNewsletterWelcome(email);
        return true;
      } else {
        return false;
      }
    } catch (error) {
      console.error('Errore iscrizione newsletter:', error instanceof Error ? error.message : 'Errore sconosciuto');
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

  // Metodo per re-inizializzare EmailJS se necessario
  reinitialize(): void {
    this.isInitialized = false;
    this.initializeEmailJS();
  }

  // Metodo per pulire le email registrate nella newsletter
  clearNewsletterSubscriptions(): void {
    try {
      localStorage.removeItem('newsletterEmails');
      localStorage.removeItem('newsletterSubscriptions');
    } catch (error) {
      console.error('Errore pulizia newsletter:', error);
    }
  }

  // Metodo per ottenere le email registrate
  getNewsletterSubscriptions(): NewsletterSubscription[] {
    try {
      const subscriptions = localStorage.getItem('newsletterSubscriptions');
      return subscriptions ? JSON.parse(subscriptions) : [];
    } catch (error) {
      console.error('Errore recupero newsletter:', error);
      return [];
    }
  }
}

export const emailService = new EmailService();
export default emailService;