import React from 'react';

interface CookiePolicyPageProps {
  onNavigate?: (page: string) => void;
}

const CookiePolicyPage: React.FC<CookiePolicyPageProps> = ({ onNavigate }) => {
  return (
    <div className="bg-white p-6">
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-navy-900 mb-6 border-b pb-4">Informativa sui Cookie</h1>

        <section className="mb-6">
          <p className="text-gray-700">
            Utilizziamo cookie essenziali per garantire il corretto funzionamento del sito
            (ad esempio, sicurezza e preferenze di base). Per funzionalità aggiuntive
            e per migliorare l’esperienza, potresti scegliere di abilitare cookie
            statistici e/o di marketing nelle preferenze.
          </p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold text-navy-800 mb-3">Tipi di cookie</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-2">
            <li>
              <span className="font-medium text-navy-800">Essenziali</span>: necessari al funzionamento del sito e sempre attivi.
            </li>
            <li>
              <span className="font-medium text-navy-800">Statistici</span>: ci aiutano a capire come viene utilizzato il sito.
            </li>
            <li>
              <span className="font-medium text-navy-800">Marketing</span>: servono per contenuti e comunicazioni personalizzate.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-3">Gestisci preferenze</h2>
          <p className="text-gray-700 mb-4">
            Puoi modificare in qualsiasi momento le tue preferenze sui cookie.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('cookie-settings')}
            className="bg-navy-900 hover:bg-navy-800 text-white font-semibold py-2 px-4 rounded"
          >
            Gestisci preferenze cookie
          </button>
        </section>

        <section className="mb-4">
          <p className="text-gray-600 text-sm">Ultimo aggiornamento: 10 novembre 2025</p>
        </section>
      </main>
    </div>
  );
};

export default CookiePolicyPage;