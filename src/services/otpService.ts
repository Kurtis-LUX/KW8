// Servizio OTP per autenticazione a due fattori
import emailjs from '@emailjs/browser';

interface OTPData {
  code: string;
  email: string;
  expiresAt: number;
  attempts: number;
}

interface OTPVerificationResult {
  success: boolean;
  message: string;
  remainingAttempts?: number;
}

class OTPService {
  private readonly OTP_STORAGE_KEY = 'kw8_otp_data';
  private readonly OTP_EXPIRY_MINUTES = 10; // 10 minuti di validità
  private readonly MAX_ATTEMPTS = 3;
  private readonly OTP_LENGTH = 6;

  // Genera un codice OTP numerico
  private generateOTP(): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < this.OTP_LENGTH; i++) {
      otp += digits[Math.floor(Math.random() * digits.length)];
    }
    return otp;
  }

  // Salva i dati OTP nel localStorage (temporaneo)
  private saveOTPData(otpData: OTPData): void {
    localStorage.setItem(this.OTP_STORAGE_KEY, JSON.stringify(otpData));
  }

  // Recupera i dati OTP dal localStorage
  private getOTPData(): OTPData | null {
    const data = localStorage.getItem(this.OTP_STORAGE_KEY);
    if (!data) return null;
    
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  // Rimuove i dati OTP dal localStorage
  private clearOTPData(): void {
    localStorage.removeItem(this.OTP_STORAGE_KEY);
  }

  // Invia OTP via email usando EmailJS
  async sendOTP(email: string): Promise<{ success: boolean; message: string }> {
    try {
      // Genera nuovo codice OTP
      const otpCode = this.generateOTP();
      const expiresAt = Date.now() + (this.OTP_EXPIRY_MINUTES * 60 * 1000);
      
      // Salva i dati OTP
      const otpData: OTPData = {
        code: otpCode,
        email,
        expiresAt,
        attempts: 0
      };
      this.saveOTPData(otpData);

      // Parametri per EmailJS
      const templateParams = {
        to_email: email,
        otp_code: otpCode,
        expiry_minutes: this.OTP_EXPIRY_MINUTES,
        app_name: 'KW8 Fitness',
        from_name: 'KW8 Security Team'
      };

      // Configurazione EmailJS (usa le variabili d'ambiente)
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        console.warn('EmailJS non configurato, simulazione invio OTP');
        console.log(`🔐 OTP simulato per ${email}: ${otpCode}`);
        return {
          success: true,
          message: `Codice OTP inviato a ${email}. Per sviluppo: ${otpCode}`
        };
      }

      // Invia email tramite EmailJS
      await emailjs.send(serviceId, templateId, templateParams, publicKey);
      
      return {
        success: true,
        message: `Codice OTP inviato a ${email}`
      };
    } catch (error) {
      console.error('Errore invio OTP:', error);
      
      // In caso di errore, mostra comunque il codice per sviluppo
      const otpData = this.getOTPData();
      if (otpData) {
        console.log(`🔐 OTP di backup per ${email}: ${otpData.code}`);
        return {
          success: true,
          message: `Errore invio email. Codice OTP per sviluppo: ${otpData.code}`
        };
      }
      
      return {
        success: false,
        message: 'Errore durante l\'invio del codice OTP'
      };
    }
  }

  // Verifica il codice OTP inserito
  verifyOTP(inputCode: string, email: string): OTPVerificationResult {
    const otpData = this.getOTPData();
    
    if (!otpData) {
      return {
        success: false,
        message: 'Nessun codice OTP trovato. Richiedi un nuovo codice.'
      };
    }

    // Verifica che l'email corrisponda
    if (otpData.email !== email) {
      return {
        success: false,
        message: 'Codice OTP non valido per questa email.'
      };
    }

    // Verifica scadenza
    if (Date.now() > otpData.expiresAt) {
      this.clearOTPData();
      return {
        success: false,
        message: 'Codice OTP scaduto. Richiedi un nuovo codice.'
      };
    }

    // Verifica numero di tentativi
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.clearOTPData();
      return {
        success: false,
        message: 'Troppi tentativi falliti. Richiedi un nuovo codice.'
      };
    }

    // Incrementa il numero di tentativi
    otpData.attempts++;
    this.saveOTPData(otpData);

    // Verifica il codice
    if (inputCode.trim() === otpData.code) {
      this.clearOTPData(); // Rimuovi i dati OTP dopo verifica riuscita
      return {
        success: true,
        message: 'Codice OTP verificato con successo!'
      };
    }

    const remainingAttempts = this.MAX_ATTEMPTS - otpData.attempts;
    return {
      success: false,
      message: `Codice OTP non corretto. Tentativi rimanenti: ${remainingAttempts}`,
      remainingAttempts
    };
  }

  // Verifica se esiste un OTP valido per l'email
  hasValidOTP(email: string): boolean {
    const otpData = this.getOTPData();
    
    if (!otpData || otpData.email !== email) {
      return false;
    }

    // Verifica scadenza
    if (Date.now() > otpData.expiresAt) {
      this.clearOTPData();
      return false;
    }

    // Verifica tentativi rimanenti
    return otpData.attempts < this.MAX_ATTEMPTS;
  }

  // Ottieni il tempo rimanente per l'OTP
  getOTPTimeRemaining(email: string): number {
    const otpData = this.getOTPData();
    
    if (!otpData || otpData.email !== email) {
      return 0;
    }

    const remaining = otpData.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / 1000)); // Ritorna secondi rimanenti
  }

  // Cancella manualmente i dati OTP
  cancelOTP(): void {
    this.clearOTPData();
  }
}

// Esporta un'istanza singleton
export const otpService = new OTPService();
export default otpService;

// Tipi per l'export
export type { OTPVerificationResult };