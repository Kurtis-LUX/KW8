import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsPageProps {
  onNavigate: (page: string) => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center text-navy-700 hover:text-red-600 transition-colors duration-300 mb-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Torna alla Home
          </button>
          <h1 className="text-3xl font-bold text-navy-700">Termini e Condizioni</h1>
          <p className="text-gray-600 mt-2">Ultimo aggiornamento: Gennaio 2025</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="prose max-w-none">
            <h2 className="text-2xl font-bold text-navy-700 mb-4">1. Accettazione dei Termini</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Utilizzando i servizi della Palestra KW8, accetti di essere vincolato da questi termini e condizioni. 
              Se non accetti questi termini, non utilizzare i nostri servizi.
            </p>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">2. Servizi Offerti</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              La Palestra KW8 offre:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Accesso alle attrezzature della palestra</li>
              <li>Lezioni di gruppo (CrossFit, Yoga, Karate)</li>
              <li>Consulenza nutrizionale</li>
              <li>Programmi di allenamento personalizzati</li>
              <li>Servizi di personal training</li>
            </ul>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">3. Iscrizione e Pagamenti</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              L'iscrizione alla palestra richiede:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Compilazione completa del modulo di registrazione</li>
              <li>Presentazione di un documento di identità valido</li>
              <li>Certificato medico per attività sportiva non agonistica</li>
              <li>Pagamento della quota di iscrizione e del primo mese</li>
            </ul>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">4. Regole di Comportamento</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Tutti i membri devono:
            </p>
            <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
              <li>Rispettare gli altri membri e il personale</li>
              <li>Utilizzare le attrezzature in modo appropriato</li>
              <li>Mantenere puliti gli spazi comuni</li>
              <li>Indossare abbigliamento sportivo adeguato</li>
              <li>Seguire le istruzioni del personale qualificato</li>
            </ul>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">5. Responsabilità e Sicurezza</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              La Palestra KW8 non è responsabile per infortuni derivanti da uso improprio delle attrezzature 
              o mancato rispetto delle regole di sicurezza. Ogni membro si allena a proprio rischio e pericolo.
            </p>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">6. Cancellazione e Rimborsi</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              Le cancellazioni devono essere comunicate con almeno 30 giorni di preavviso. 
              Non sono previsti rimborsi per periodi di abbonamento non utilizzati, salvo casi eccezionali 
              valutati dalla direzione.
            </p>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">7. Modifiche ai Termini</h2>
            <p className="mb-6 text-gray-700 leading-relaxed">
              La Palestra KW8 si riserva il diritto di modificare questi termini in qualsiasi momento. 
              Le modifiche saranno comunicate tramite il sito web e/o email.
            </p>

            <h2 className="text-2xl font-bold text-navy-700 mb-4">8. Contatti</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Per domande sui termini e condizioni, contattaci:
            </p>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700"><strong>Email:</strong> info@palestrakw8.it</p>
              <p className="text-gray-700"><strong>Telefono:</strong> +39 123 456 7890</p>
              <p className="text-gray-700"><strong>Indirizzo:</strong> Via Roma 123, 00100 Roma (RM)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;