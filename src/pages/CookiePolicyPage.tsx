import React from 'react';

interface CookiePolicyPageProps {
  onNavigate?: (page: string) => void;
}

const CookiePolicyPage: React.FC<CookiePolicyPageProps> = ({ onNavigate }) => {

  return (
    <div className="bg-white p-6">

      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-navy-900 mb-6 border-b pb-4">Informativa sui Cookie</h1>
        
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">Cosa sono i cookie?</h2>
          <p className="text-gray-700 mb-4">
            I cookie sono piccoli file di testo che i siti web visitati dagli utenti inviano ai loro terminali, dove vengono memorizzati per essere poi ritrasmessi agli stessi siti in occasione di visite successive. I cookie sono utilizzati per diverse finalità, hanno caratteristiche diverse, e possono essere utilizzati sia dal titolare del sito che si sta visitando, sia da terze parti.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">Come utilizziamo i cookie</h2>
          <p className="text-gray-700 mb-4">
            Utilizziamo i cookie per diverse finalità al fine di offrirti la migliore esperienza online. I cookie che utilizziamo ci consentono di riconoscerti e di ottenere informazioni sul tuo account, ma anche di permetterti di accedere a funzionalità e aree del nostro sito che altrimenti sarebbero limitate.
          </p>
        </section>



        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">Tipi di cookie utilizzati</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-navy-800 mb-2">Cookie tecnici essenziali</h3>
              <p className="text-gray-700 mb-2">
                Questi cookie sono necessari per il funzionamento del sito e non possono essere disattivati nei nostri sistemi. Di solito vengono impostati solo in risposta alle azioni da te effettuate che costituiscono una richiesta di servizi, come l'impostazione delle preferenze di privacy, l'accesso o la compilazione di moduli.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-navy-800 mb-2">Cookie di marketing</h3>
              <p className="text-gray-700 mb-2">
                Questi cookie ci permettono di offrirti contenuti personalizzati e di ricordare le tue preferenze. Possono essere impostati da noi o da fornitori terzi i cui servizi abbiamo aggiunto alle nostre pagine. Se non consenti questi cookie, alcune o tutte queste funzionalità potrebbero non funzionare correttamente.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium text-navy-800 mb-2">Cookie statistici</h3>
              <p className="text-gray-700 mb-2">
                Questi cookie ci permettono di contare le visite e le fonti di traffico in modo da poter misurare e migliorare le prestazioni del nostro sito. Ci aiutano a sapere quali sono le pagine più e meno popolari e vedere come i visitatori si muovono nel sito. Tutte le informazioni raccolte da questi cookie sono aggregate e quindi anonime.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-navy-800 mb-4">Come disabilitare i cookie</h2>
          <p className="text-gray-700 mb-4">
            Oltre a utilizzare gli strumenti forniti in questa pagina, puoi gestire le preferenze sui cookie direttamente dal tuo browser ed impedire, ad esempio, che terze parti possano installarne. Tramite le preferenze del browser è inoltre possibile eliminare i cookie installati in passato, incluso il cookie in cui venga eventualmente salvato il consenso all'installazione di cookie da parte di questo sito.
          </p>
          <p className="text-gray-700 mb-4">
            È importante notare che disabilitando tutti i cookie, il funzionamento di questo sito potrebbe essere compromesso. Puoi trovare informazioni su come gestire i cookie nel tuo browser ai seguenti indirizzi:
          </p>
          <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
            <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Google Chrome</a></li>
            <li><a href="https://support.mozilla.org/it/kb/Gestione%20dei%20cookie" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Mozilla Firefox</a></li>
            <li><a href="https://support.apple.com/it-it/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Apple Safari</a></li>
            <li><a href="https://support.microsoft.com/it-it/help/17442/windows-internet-explorer-delete-manage-cookies" target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">Microsoft Edge</a></li>
          </ul>
        </section>
      </main>
    </div>
  );
};

export default CookiePolicyPage;