import React from 'react';

const PrivacyPolicyPage: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <div className="bg-white p-6">
      <h1 className="text-3xl font-bold text-navy-700 mb-2">Privacy Policy</h1>
      <p className="text-gray-600 mb-6">Ultimo aggiornamento: Novembre 2025</p>

      <div className="max-w-none">
        <div className="prose max-w-none">
          <h2 className="text-2xl font-bold text-navy-700 mb-4">Informativa Semplice</h2>
          <p className="mb-4 text-gray-700 leading-relaxed">
            Questa applicazione utilizza il login con Google esclusivamente per identificare gli utenti
            (atleti e coach) e consentire l'accesso ai servizi.
          </p>
          <ul className="list-disc list-inside mb-6 text-gray-700 space-y-2">
            <li>Non memorizziamo dati personali oltre a quanto necessario per l'accesso.</li>
            <li>Non vendiamo né condividiamo i dati con terze parti per scopi commerciali.</li>
            <li>Le informazioni fornite vengono utilizzate solo per permettere l'accesso.</li>
          </ul>

          <h2 className="text-2xl font-bold text-navy-700 mb-4">Contatti</h2>
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-gray-700"><strong>Email:</strong> krossingweight@gmail.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;