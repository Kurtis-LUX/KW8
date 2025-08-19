import React, { useState } from 'react';
import { Mail, CheckCircle, AlertCircle, Settings, Play, Info } from 'lucide-react';
import { EmailTester } from '../utils/emailTest';
import { EmailDebugger } from '../utils/emailDebugger';

const EmailTestPanel: React.FC = () => {
  const [testEmail, setTestEmail] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const runEmailTest = async () => {
    if (!testEmail.trim()) {
      alert('Inserisci un indirizzo email per il test');
      return;
    }

    setIsRunning(true);
    setResults(null);

    try {
      // Test di validazione locale prima
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isValidLocal = emailRegex.test(testEmail.trim());
      
      // Debug dettagliato
      EmailDebugger.logDetailedValidation(testEmail);
      
      console.log('🔍 Test validazione locale:', {
        email: testEmail.trim(),
        isValid: isValidLocal,
        regex: emailRegex.toString()
      });
      
      const configTest = EmailTester.testConfiguration();
      const emailTest = await EmailTester.testEmailSending();
      const overall = configTest && emailTest;
      
      setResults({
        configTest: { success: configTest, message: configTest ? 'Configurazione valida' : 'Configurazione non valida' },
        emailTest: { success: emailTest, message: emailTest ? 'Test email riuscito' : 'Test email fallito' },
        overall: { success: overall, message: overall ? 'Tutti i test superati' : 'Alcuni test falliti' },
        localValidation: {
          success: isValidLocal,
          message: isValidLocal ? 'Email valida localmente' : 'Email non valida localmente'
        }
      });
    } catch (error) {
      console.error('Errore durante il test:', error);
      setResults({
        configTest: { success: false, message: 'Errore durante il test' },
        emailTest: { success: false, message: 'Errore durante il test' },
        overall: { success: false, message: `Errore: ${error}` },
        localValidation: { success: false, message: 'Errore nella validazione locale' }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      EmailTester.diagnoseEmailJSIssues();
      const configTest = EmailTester.testConfiguration();
      setDiagnostics({
        configuration: { success: configTest, message: configTest ? 'Configurazione valida' : 'Configurazione non valida' },
        apiStatus: { success: true, message: 'Verifica console per dettagli connessione' }
      });
      setShowDiagnostics(true);
    } catch (error) {
      console.error('Errore durante la diagnostica:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const ResultCard: React.FC<{ title: string; result: { success: boolean; message: string } }> = ({ title, result }) => (
    <div className={`p-4 rounded-lg border-2 ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
      <div className="flex items-center mb-2">
        {result.success ? (
          <CheckCircle className="text-green-600 mr-2" size={20} />
        ) : (
          <AlertCircle className="text-red-600 mr-2" size={20} />
        )}
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
        {result.message}
      </p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <Mail className="mx-auto mb-4 text-blue-600" size={48} />
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Test Sistema Email</h2>
        <p className="text-gray-600">Verifica il funzionamento del sistema di invio email</p>
      </div>

      {/* Form di test */}
      <div className="mb-8">
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-gray-700 font-medium mb-2">Email di test</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="inserisci@tuaemail.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isRunning}
            />
          </div>
          <button
            onClick={runEmailTest}
            disabled={isRunning || !testEmail.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            {isRunning ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Testing...
              </>
            ) : (
              <>
                <Play size={20} />
                Avvia Test
              </>
            )}
          </button>
          <button
            onClick={runDiagnostics}
            disabled={isRunning}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
          >
            <Settings size={20} />
            Diagnostica
          </button>
        </div>
      </div>

      {/* Risultati test */}
      {results && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <CheckCircle className="mr-2 text-green-600" size={24} />
            Risultati Test
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {results.localValidation && (
              <ResultCard title="Test Validazione Locale" result={results.localValidation} />
            )}
            <ResultCard title="Test Configurazione" result={results.configTest} />
            <ResultCard title="Test Invio Email" result={results.emailTest} />
          </div>
          <div className="mt-4">
            <ResultCard title="Risultato Complessivo" result={results.overall} />
          </div>
        </div>
      )}

      {/* Diagnostica */}
      {showDiagnostics && diagnostics && (
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Info className="mr-2 text-blue-600" size={24} />
            Diagnostica Sistema
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <ResultCard title="Stato API EmailJS" result={diagnostics.apiStatus} />
            <ResultCard title="Configurazione" result={diagnostics.configuration} />
            <ResultCard title="LocalStorage" result={diagnostics.localStorage} />
          </div>
          
          {diagnostics.localStorage.data && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Dati LocalStorage:</h4>
              <div className="text-sm text-gray-700">
                <p><strong>Email salvate:</strong> {diagnostics.localStorage.data.emails.length}</p>
                <p><strong>Iscrizioni:</strong> {diagnostics.localStorage.data.subscriptions.length}</p>
                {diagnostics.localStorage.data.emails.length > 0 && (
                  <div className="mt-2">
                    <p><strong>Ultime email:</strong></p>
                    <ul className="list-disc list-inside ml-4">
                      {diagnostics.localStorage.data.emails.slice(-3).map((email: string, index: number) => (
                        <li key={index}>{email}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Informazioni di debug */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2 text-gray-800">Informazioni Debug:</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Service ID:</strong> service_kw8gym</p>
          <p><strong>Template ID:</strong> template_newsletter</p>
          <p><strong>Public Key:</strong> LaN_cQnKCCBeoS2FW</p>
          <p><strong>API Endpoint:</strong> https://api.emailjs.com/api/v1.0/email/send</p>
        </div>
      </div>

      {/* Istruzioni */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-blue-800 mb-2">Come usare questo test:</h4>
        <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
          <li>Inserisci un indirizzo email valido nel campo sopra</li>
          <li>Clicca "Avvia Test" per testare l'invio email</li>
          <li>Controlla la tua casella di posta per l'email di benvenuto</li>
          <li>Usa "Diagnostica" per verificare lo stato del sistema</li>
        </ol>
      </div>
    </div>
  );
};

export default EmailTestPanel;