import React from 'react';

interface TermsPageProps {
  onNavigate: (page: string) => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white p-6">
      <h1 className="text-3xl font-bold text-navy-700 mb-2">Termini e Condizioni</h1>
      <p className="text-gray-600 mb-6">Ultimo aggiornamento: Novembre 2025</p>

      <div className="max-w-none">
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold text-navy-700 mb-4">Informativa Semplice</h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            Utilizzando i servizi di KW8, accetti i seguenti termini. L'app è pensata per
            atleti e coach; l'accesso e l'uso sono soggetti alle regole qui indicate.
          </p>

          <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
            <li>Accesso ai servizi riservato a utenti registrati (atleti e coach).</li>
            <li>Gli utenti sono responsabili della correttezza delle informazioni inserite.</li>
            <li>Uso dei dati limitato all'identificazione e all'accesso ai servizi.</li>
            <li>Non condividiamo né vendiamo dati personali a terze parti.</li>
            <li>È vietato qualsiasi uso improprio o non autorizzato dell'app.</li>
            <li>Possiamo aggiornare funzioni e contenuti per migliorare il servizio.</li>
          </ul>

          <h2 className="text-2xl font-bold text-navy-700 mb-4">Privacy e Cookie</h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            La Privacy è descritta nella nostra informativa dedicata. Questa applicazione
            utilizza il login Google esclusivamente per identificare gli utenti e consentire l'accesso.
            Per i cookie, fai riferimento alla nostra Cookie Policy.
          </p>

          <h2 className="text-2xl font-bold text-navy-700 mb-4">Responsabilità</h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            KW8 non è responsabile di eventuali interruzioni del servizio, perdite di dati,
            o danni indiretti derivanti dall'uso dell'app. L'utente si impegna a usare il servizio
            in modo conforme alle leggi applicabili.
          </p>

          <h2 className="text-2xl font-bold text-navy-700 mb-4">Modifiche</h2>
          <p className="mb-6 text-gray-700 leading-relaxed">
            Possiamo aggiornare questi termini per migliorare il servizio o per conformità legale.
            Le modifiche entrano in vigore con la pubblicazione.
          </p>

          <h2 className="text-2xl font-bold text-navy-700 mb-4">Contatti</h2>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-gray-700"><strong>Email:</strong> krossingweight@gmail.com</p>
          </div>


        </div>
      </div>
    </div>
  );
};

export default TermsPage;