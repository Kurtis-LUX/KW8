import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, Download, Users } from 'lucide-react';
import type { User as FirestoreUser } from '../services/firestoreService';

interface AthleteImportProps {
  onImport: (athletes: Partial<FirestoreUser>[]) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

interface ImportResult {
  success: number;
  errors: { row: number; message: string; data?: any }[];
  total: number;
}

const AthleteImport: React.FC<AthleteImportProps> = ({ onImport, onCancel, isLoading = false }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<Partial<FirestoreUser>[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
      alert('Formato file non supportato. Utilizzare CSV, XLS o XLSX.');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const data = await parseFile(selectedFile);
      setParsedData(data);
      setStep('preview');
    } catch (error) {
      console.error('Errore nel parsing del file:', error);
      alert('Errore nel parsing del file. Verificare il formato.');
    } finally {
      setIsProcessing(false);
    }
  };

  const parseFile = async (file: File): Promise<Partial<FirestoreUser>[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('Il file deve contenere almeno un header e una riga di dati'));
            return;
          }

          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          const athletes: Partial<FirestoreUser>[] = [];

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const athlete: Partial<FirestoreUser> = { role: 'athlete' };

            headers.forEach((header, index) => {
              const value = values[index]?.replace(/^"|"$/g, '') || '';
              
              switch (header) {
                case 'nome':
                case 'name':
                  athlete.name = value;
                  break;
                case 'email':
                  athlete.email = value;
                  break;
                case 'telefono':
                case 'phone':
                  athlete.phone = value;
                  break;
                case 'data_nascita':
                case 'birthdate':
                case 'birth_date':
                  if (value) {
                    // Prova diversi formati di data
                    const date = new Date(value);
                    if (!isNaN(date.getTime())) {
                      athlete.birthDate = date.toISOString().split('T')[0];
                    }
                  }
                  break;
                case 'indirizzo':
                case 'address':
                  athlete.address = value;
                  break;
                case 'contatto_emergenza_nome':
                case 'emergency_contact_name':
                  athlete.emergencyContactName = value;
                  break;
                case 'contatto_emergenza_telefono':
                case 'emergency_contact_phone':
                  athlete.emergencyContactPhone = value;
                  break;
                case 'contatto_emergenza_relazione':
                case 'emergency_contact_relationship':
                  athlete.emergencyContactRelationship = value;
                  break;
                case 'note':
                case 'notes':
                  athlete.notes = value;
                  break;
              }
            });

            if (athlete.name && athlete.email) {
              athletes.push(athlete);
            }
          }

          resolve(athletes);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Errore nella lettura del file'));
      reader.readAsText(file);
    });
  };

  const handleImport = async () => {
    setIsProcessing(true);
    try {
      await onImport(parsedData);
      setImportResult({
        success: parsedData.length,
        errors: [],
        total: parsedData.length
      });
      setStep('result');
    } catch (error) {
      console.error('Errore nell\'importazione:', error);
      setImportResult({
        success: 0,
        errors: [{ row: 0, message: 'Errore generale nell\'importazione' }],
        total: parsedData.length
      });
      setStep('result');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = [
      'nome,email,telefono,data_nascita,indirizzo,contatto_emergenza_nome,contatto_emergenza_telefono,contatto_emergenza_relazione,note',
      'Mario Rossi,mario.rossi@email.com,+39 123 456 7890,1990-01-15,Via Roma 123 Milano,Anna Rossi,+39 987 654 3210,Coniuge,Note esempio'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_atleti.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetImport = () => {
    setFile(null);
    setParsedData([]);
    setImportResult(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {step === 'upload' && (
        <>
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Importa Atleti</h3>
            <p className="text-gray-600">Carica un file CSV o Excel con i dati degli atleti</p>
          </div>

          {/* Template download */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Download className="text-blue-600 mr-2" size={20} />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Template CSV</h4>
                  <p className="text-sm text-blue-700">Scarica il template per il formato corretto</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
              >
                Scarica
              </button>
            </div>
          </div>

          {/* File upload area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-red-500 bg-red-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Trascina il file qui o clicca per selezionare
            </h3>
            <p className="text-gray-600 mb-4">
              Formati supportati: CSV, XLS, XLSX
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Seleziona File
            </button>
          </div>

          {isProcessing && (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-2"></div>
              <p className="text-gray-600">Elaborazione file...</p>
            </div>
          )}
        </>
      )}

      {step === 'preview' && (
        <>
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Anteprima Importazione</h3>
            <p className="text-gray-600">
              {parsedData.length} atleti trovati nel file "{file?.name}"
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden max-h-96 overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Nome
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Telefono
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Data Nascita
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {parsedData.slice(0, 10).map((athlete, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900">{athlete.name}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{athlete.email}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{athlete.phone || '-'}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">
                      {athlete.birthDate ? new Date(athlete.birthDate).toLocaleDateString('it-IT') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsedData.length > 10 && (
              <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 text-center">
                ... e altri {parsedData.length - 10} atleti
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              onClick={resetImport}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cambia File
            </button>
            <button
              onClick={handleImport}
              disabled={isProcessing || isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center"
            >
              {(isProcessing || isLoading) && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              Importa {parsedData.length} Atleti
            </button>
          </div>
        </>
      )}

      {step === 'result' && importResult && (
        <>
          <div className="text-center mb-6">
            <div className={`mx-auto mb-4 ${importResult.success > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {importResult.success > 0 ? (
                <CheckCircle size={48} />
              ) : (
                <AlertCircle size={48} />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {importResult.success > 0 ? 'Importazione Completata' : 'Importazione Fallita'}
            </h3>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                <div className="text-sm text-gray-600">Importati</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{importResult.errors.length}</div>
                <div className="text-sm text-gray-600">Errori</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{importResult.total}</div>
                <div className="text-sm text-gray-600">Totale</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Errori:</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 flex items-center">
                      <AlertCircle size={14} className="mr-1 flex-shrink-0" />
                      Riga {error.row}: {error.message}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-center space-x-3 pt-4">
            <button
              onClick={resetImport}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Importa Altri
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Chiudi
            </button>
          </div>
        </>
      )}

      {step === 'upload' && (
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Annulla
          </button>
        </div>
      )}
    </div>
  );
};

export default AthleteImport;