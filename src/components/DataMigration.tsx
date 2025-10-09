// Componente per gestire la migrazione dei dati da localStorage a Firestore
import React, { useState } from 'react';
import { useDataMigration } from '../hooks/useFirestore';
import { setFirestoreEnabled, isFirestoreEnabled } from '../utils/database';
import Modal from './Modal';

interface DataMigrationProps {
  onMigrationComplete?: () => void;
}

const DataMigration: React.FC<DataMigrationProps> = ({ onMigrationComplete }) => {
  const { migrating, migrationError, migrationSuccess, migrateData } = useDataMigration();
  const [firestoreEnabled, setFirestoreEnabledState] = useState(isFirestoreEnabled());
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);

  const handleToggleFirestore = () => {
    const newState = !firestoreEnabled;
    setFirestoreEnabled(newState);
    setFirestoreEnabledState(newState);
    
    if (newState) {
      // Se abilitiamo Firestore, mostra il dialog di migrazione
      setShowMigrationDialog(true);
    }
  };

  const handleMigration = async () => {
    try {
      await migrateData();
      setShowMigrationDialog(false);
      onMigrationComplete?.();
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };

  const handleSkipMigration = () => {
    setShowMigrationDialog(false);
    onMigrationComplete?.();
  };

  return (
    <div className="data-migration-container">
      {/* Toggle Firestore */}
      <div className="firestore-toggle">
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Database Firestore</h3>
            <p className="text-sm text-gray-600">
              {firestoreEnabled 
                ? 'I dati vengono salvati su Firestore (cloud)' 
                : 'I dati vengono salvati localmente nel browser'
              }
            </p>
          </div>
          <button
            onClick={handleToggleFirestore}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              firestoreEnabled ? 'bg-blue-600' : 'bg-gray-200'
            }`}
            disabled={migrating}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                firestoreEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dialog di migrazione */}
      <Modal
        isOpen={showMigrationDialog}
        onClose={() => setShowMigrationDialog(false)}
        title="Migrazione a Firestore"
      >
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Migrazione a Firestore
            </h3>
          </div>
        </div>
        
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Hai abilitato Firestore come database principale. Vuoi migrare i tuoi dati esistenti 
            dal browser al cloud?
          </p>
          <div className="mt-3 p-3 bg-blue-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Vantaggi:</strong> Sincronizzazione tra dispositivi, backup automatico, 
                  accesso da qualsiasi luogo.
                </p>
              </div>
            </div>
          </div>
        </div>

        {migrationError && (
          <div className="mb-4 p-3 bg-red-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  <strong>Errore:</strong> {migrationError}
                </p>
              </div>
            </div>
          </div>
        )}

        {migrationSuccess && (
          <div className="mb-4 p-3 bg-green-50 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  <strong>Successo!</strong> I tuoi dati sono stati migrati con successo a Firestore.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={handleMigration}
            disabled={migrating || migrationSuccess}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {migrating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Migrazione...
              </>
            ) : migrationSuccess ? (
              'Completato'
            ) : (
              'Migra Ora'
            )}
          </button>
          <button
            onClick={handleSkipMigration}
            disabled={migrating}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Salta
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default DataMigration;