import { emailService } from '../services/emailService';

export class EmailTester {
  
  // Test della configurazione EmailJS
  static testConfiguration(): boolean {
    console.log('🔍 Test configurazione EmailJS...');
    
    try {
      // Verifica se EmailJS è disponibile
      if (typeof window !== 'undefined' && !window.emailjs) {
        console.error('❌ EmailJS non è disponibile nel browser');
        return false;
      }

      // Verifica le credenziali
      const credentials = emailService.getCredentials();
      console.log('📋 Credenziali correnti:', {
        serviceId: credentials.serviceId,
        templateId: credentials.templateId,
        publicKey: credentials.publicKey.substring(0, 8) + '...',
        isInitialized: credentials.isInitialized
      });

      if (!credentials.serviceId || !credentials.templateId || !credentials.publicKey) {
        console.error('❌ Credenziali EmailJS mancanti');
        return false;
      }

      if (!credentials.isInitialized) {
        console.error('❌ EmailJS non è inizializzato correttamente');
        return false;
      }

      console.log('✅ Configurazione EmailJS valida');
      return true;
    } catch (error) {
      console.error('❌ Errore nel test di configurazione:', error);
      return false;
    }
  }

  // Test di invio email
  static async testEmailSending(): Promise<boolean> {
    console.log('📧 Test invio email...');
    
    try {
      if (!this.testConfiguration()) {
        console.error('❌ Configurazione non valida, impossibile testare l\'invio');
        return false;
      }

      // Test con email fittizia
      const testEmail = 'test@example.com';
      console.log(`📤 Tentativo di invio email di test a: ${testEmail}`);
      
      const result = await emailService.subscribeToNewsletter(testEmail);
      
      if (result) {
        console.log('✅ Test di invio email completato con successo');
        return true;
      } else {
        console.error('❌ Test di invio email fallito');
        return false;
      }
    } catch (error) {
      console.error('❌ Errore durante il test di invio:', error);
      return false;
    }
  }

  // Test completo
  static async runAllTests(): Promise<boolean> {
    console.log('🚀 Avvio test completi EmailJS...');
    
    const configTest = this.testConfiguration();
    const emailTest = await this.testEmailSending();
    
    const allPassed = configTest && emailTest;
    
    if (allPassed) {
      console.log('🎉 Tutti i test EmailJS sono passati!');
    } else {
      console.log('⚠️ Alcuni test EmailJS sono falliti');
    }
    
    return allPassed;
  }

  // Diagnostica avanzata
  static diagnoseEmailJSIssues(): void {
    console.log('🔧 Diagnostica problemi EmailJS...');
    
    // Verifica connessione internet
    if (!navigator.onLine) {
      console.warn('⚠️ Connessione internet non disponibile');
    }

    // Verifica se siamo in HTTPS (richiesto da EmailJS in produzione)
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      console.warn('⚠️ EmailJS potrebbe richiedere HTTPS in produzione');
    }

    // Verifica CORS
    console.log('🌐 Verifica CORS per api.emailjs.com...');
    
    // Test di connettività
    fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'OPTIONS'
    }).then(() => {
      console.log('✅ Connessione a EmailJS API disponibile');
    }).catch(error => {
      console.error('❌ Problema di connessione a EmailJS API:', error);
    });
  }
}

// Esporta per uso globale in console
if (typeof window !== 'undefined') {
  (window as any).EmailTester = EmailTester;
}