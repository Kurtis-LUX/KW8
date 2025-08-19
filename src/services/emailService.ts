// Servizio per l'invio di email
export interface EmailData {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface NewsletterSubscription {
  email: string;
  timestamp: string;
  source: 'website';
}

class EmailService {
  private apiEndpoint = 'https://api.emailjs.com/api/v1.0/email/send';
  private serviceId = 'service_kw8gym'; // Da configurare su EmailJS
  private templateId = 'template_newsletter'; // Da configurare su EmailJS
  private publicKey = 'YOUR_EMAILJS_PUBLIC_KEY'; // Da configurare

  // Metodo per inviare email di benvenuto newsletter
  async sendNewsletterWelcome(email: string): Promise<boolean> {
    try {
      const templateParams = {
        to_email: email,
        to_name: email.split('@')[0],
        gym_name: 'KW8 Palestra',
        gym_address: 'Via Roma 123, 00100 Roma (RM)',
        gym_phone: '3338346546',
        unsubscribe_link: `${window.location.origin}/unsubscribe?email=${encodeURIComponent(email)}`
      };

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: this.serviceId,
          template_id: this.templateId,
          user_id: this.publicKey,
          template_params: templateParams
        })
      });

      if (response.ok) {
        console.log('Email di benvenuto inviata con successo a:', email);
        return true;
      } else {
        console.error('Errore nell\'invio email:', response.statusText);
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
    try {
      // Per ora usa EmailJS, ma può essere sostituito con altri servizi
      const templateParams = {
        to_email: emailData.to,
        subject: emailData.subject,
        html_content: emailData.html,
        text_content: emailData.text || emailData.html.replace(/<[^>]*>/g, '')
      };

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: this.serviceId,
          template_id: 'template_generic',
          user_id: this.publicKey,
          template_params: templateParams
        })
      });

      return response.ok;
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
  }
}

export const emailService = new EmailService();
export default emailService;