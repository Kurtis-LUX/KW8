import React from 'react';

interface PrivacyPageProps {
  onNavigate?: (page: string) => void;
}

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white p-6">

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-navy-900 mb-6 border-b pb-4">Informativa sulla Privacy</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">1. Introduzione</h2>
          <p className="text-gray-700 mb-4">
            La presente Informativa sulla Privacy descrive come KW8 Palestra raccoglie, utilizza e condivide i tuoi dati personali quando visiti o interagisci con il nostro sito web, utilizzi i nostri servizi o comunichi con noi in altro modo.
          </p>
          <p className="text-gray-700 mb-4">
            Ci impegniamo a proteggere la tua privacy e a trattare i tuoi dati personali in conformità con le leggi applicabili sulla protezione dei dati, incluso il Regolamento Generale sulla Protezione dei Dati (GDPR).
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">2. Dati che raccogliamo</h2>
          <p className="text-gray-700 mb-4">
            Possiamo raccogliere i seguenti tipi di informazioni:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
            <li><strong>Dati personali:</strong> nome, indirizzo email, numero di telefono, indirizzo postale.</li>
            <li><strong>Dati di account:</strong> nome utente, password, preferenze di account.</li>
            <li><strong>Dati di pagamento:</strong> informazioni sulla carta di credito, dati bancari (gestiti in modo sicuro tramite i nostri processori di pagamento).</li>
            <li><strong>Dati di utilizzo:</strong> informazioni su come utilizzi il nostro sito web e i nostri servizi.</li>
            <li><strong>Dati tecnici:</strong> indirizzo IP, tipo di browser, provider di servizi internet, informazioni sul dispositivo.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">3. Come utilizziamo i tuoi dati</h2>
          <p className="text-gray-700 mb-4">
            Utilizziamo i tuoi dati personali per:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
            <li>Fornirti i nostri servizi e gestire il tuo account</li>
            <li>Elaborare i tuoi pagamenti e gestire le tue iscrizioni</li>
            <li>Comunicare con te riguardo ai nostri servizi</li>
            <li>Personalizzare la tua esperienza sul nostro sito</li>
            <li>Migliorare il nostro sito web e i nostri servizi</li>
            <li>Rispettare i nostri obblighi legali</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">4. Condivisione dei dati</h2>
          <p className="text-gray-700 mb-4">
            Possiamo condividere i tuoi dati personali con:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
            <li><strong>Fornitori di servizi:</strong> che ci aiutano a fornire i nostri servizi (es. processori di pagamento, hosting web).</li>
            <li><strong>Partner commerciali:</strong> con cui collaboriamo per offrirti servizi o promozioni congiunte.</li>
            <li><strong>Autorità legali:</strong> quando richiesto dalla legge o per proteggere i nostri diritti legali.</li>
          </ul>
          <p className="text-gray-700 mb-4">
            Non vendiamo i tuoi dati personali a terze parti.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">5. I tuoi diritti</h2>
          <p className="text-gray-700 mb-4">
            Hai il diritto di:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
            <li>Accedere ai tuoi dati personali</li>
            <li>Rettificare i tuoi dati personali se sono inaccurati</li>
            <li>Richiedere la cancellazione dei tuoi dati personali</li>
            <li>Opporti al trattamento dei tuoi dati personali</li>
            <li>Richiedere la limitazione del trattamento dei tuoi dati personali</li>
            <li>Richiedere la portabilità dei tuoi dati personali</li>
            <li>Revocare il consenso in qualsiasi momento</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">6. Sicurezza dei dati</h2>
          <p className="text-gray-700 mb-4">
            Adottiamo misure di sicurezza tecniche e organizzative appropriate per proteggere i tuoi dati personali da perdita, uso improprio, accesso non autorizzato, divulgazione, alterazione e distruzione.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">7. Modifiche alla presente Informativa</h2>
          <p className="text-gray-700 mb-4">
            Possiamo aggiornare questa Informativa sulla Privacy di tanto in tanto. Ti informeremo di eventuali modifiche pubblicando la nuova Informativa sulla Privacy su questa pagina e, se le modifiche sono significative, ti invieremo una notifica.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">8. Contattaci</h2>
          <p className="text-gray-700 mb-4">
            Se hai domande sulla presente Informativa sulla Privacy o sul trattamento dei tuoi dati personali, contattaci all'indirizzo email: privacy@kw8palestra.it
          </p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPage;