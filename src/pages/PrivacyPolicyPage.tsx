import React from 'react';

interface PrivacyPolicyPageProps {
  onNavigate: (page: string) => void;
}

const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white p-6">
      <h1 className="text-3xl font-bold text-navy-700 mb-2">Privacy Policy</h1>
      <p className="text-gray-600 mb-6">Ultimo aggiornamento: Gennaio 2025</p>
      <div className="max-w-none">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-navy-700 mb-4">1. Informazioni Generali</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              La presente Privacy Policy descrive come la Palestra KW8 raccoglie, utilizza e protegge 
              le informazioni personali dei propri utenti, in conformità al Regolamento Generale sulla 
              Protezione dei Dati (GDPR) e alla normativa italiana sulla privacy.
            </p>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">2. Titolare del Trattamento</h2>
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-gray-700"><strong>Palestra KW8</strong></p>
              <p className="text-gray-700">Via Roma 123, 00100 Roma (RM)</p>
              <p className="text-gray-700">Email: privacy@palestrakw8.it</p>
              <p className="text-gray-700">Telefono: +39 123 456 7890</p>
            </div>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">3. Dati Raccolti</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Raccogliamo i seguenti tipi di dati personali:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li><strong>Dati anagrafici:</strong> nome, cognome, data di nascita, luogo di nascita</li>
              <li><strong>Dati di contatto:</strong> indirizzo email, numero di telefono, indirizzo di residenza</li>
              <li><strong>Dati identificativi:</strong> codice fiscale</li>
              <li><strong>Dati sulla salute:</strong> informazioni su problemi fisici o condizioni mediche rilevanti</li>
              <li><strong>Dati di pagamento:</strong> informazioni relative agli abbonamenti e pagamenti</li>
              <li><strong>Dati di utilizzo:</strong> accessi alla struttura, partecipazione a corsi</li>
            </ul>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">4. Finalità del Trattamento</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              I dati personali sono trattati per le seguenti finalità:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Gestione dell'iscrizione e dell'abbonamento</li>
              <li>Erogazione dei servizi richiesti</li>
              <li>Comunicazioni relative ai servizi</li>
              <li>Gestione dei pagamenti</li>
              <li>Sicurezza e controllo accessi</li>
              <li>Adempimenti di obblighi legali</li>
              <li>Marketing diretto (previo consenso)</li>
            </ul>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">5. Base Giuridica</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Il trattamento dei dati è basato su:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li><strong>Esecuzione del contratto:</strong> per l'erogazione dei servizi</li>
              <li><strong>Consenso:</strong> per attività di marketing e comunicazioni promozionali</li>
              <li><strong>Obbligo legale:</strong> per adempimenti fiscali e normativi</li>
              <li><strong>Interesse legittimo:</strong> per la sicurezza della struttura</li>
            </ul>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">6. Conservazione dei Dati</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              I dati personali sono conservati per il tempo necessario al raggiungimento delle finalità 
              per cui sono stati raccolti e comunque non oltre 10 anni dalla cessazione del rapporto, 
              salvo diversi obblighi di legge.
            </p>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">7. Diritti dell'Interessato</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Hai il diritto di:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Accedere ai tuoi dati personali</li>
              <li>Rettificare dati inesatti o incompleti</li>
              <li>Cancellare i dati (diritto all'oblio)</li>
              <li>Limitare il trattamento</li>
              <li>Portabilità dei dati</li>
              <li>Opporti al trattamento</li>
              <li>Revocare il consenso</li>
            </ul>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">8. Sicurezza dei Dati</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Adottiamo misure tecniche e organizzative appropriate per proteggere i dati personali 
              da accessi non autorizzati, perdita, distruzione o divulgazione accidentale.
            </p>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">9. Cookie e Tecnologie Simili</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Il nostro sito web utilizza cookie tecnici necessari per il funzionamento e cookie 
              analitici per migliorare l'esperienza utente. Puoi gestire le preferenze sui cookie 
              tramite le impostazioni del browser.
            </p>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">10. Modifiche alla Privacy Policy</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Ci riserviamo il diritto di modificare questa Privacy Policy. Le modifiche saranno 
              pubblicate su questa pagina con indicazione della data di ultimo aggiornamento.
            </p>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">11. Contatti</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Per esercitare i tuoi diritti o per qualsiasi domanda sulla privacy:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> privacy@palestrakw8.it</p>
              <p className="text-gray-700"><strong>Telefono:</strong> +39 123 456 7890</p>
              <p className="text-gray-700"><strong>Indirizzo:</strong> Via Roma 123, 00100 Roma (RM)</p>
            </div>
          </div>
        </div>
    </div>
  );
};

export default PrivacyPolicyPage;