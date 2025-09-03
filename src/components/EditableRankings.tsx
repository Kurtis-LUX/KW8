import React, { useState } from 'react';
import { Edit3, Save, X, Trash2, Plus, Trophy, Target } from 'lucide-react';

interface ExerciseRecord {
  id: string;
  athleteName: string;
  exerciseName: string;
  weight: number;
  reps: number;
  oneRepMax: number;
  date: string;
  category: string;
}

interface EditableRankingsProps {
  records: ExerciseRecord[];
  onUpdateRecord: (id: string, data: Partial<ExerciseRecord>) => Promise<void>;
  onDeleteRecord: (id: string) => Promise<void>;
  onAddRecord: (data: Omit<ExerciseRecord, 'id'>) => Promise<void>;
  exercises: string[];
  athletes: string[];
  categories: string[];
}

const EditableRankings: React.FC<EditableRankingsProps> = ({
  records,
  onUpdateRecord,
  onDeleteRecord,
  onAddRecord,
  exercises,
  athletes,
  categories
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<ExerciseRecord>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newRecord, setNewRecord] = useState<Omit<ExerciseRecord, 'id'>>({
    athleteName: '',
    exerciseName: '',
    weight: 0,
    reps: 0,
    oneRepMax: 0,
    date: new Date().toISOString().split('T')[0],
    category: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const calculateOneRepMax = (weight: number, reps: number): number => {
    if (reps === 1) return weight;
    return Math.round(weight * (1 + reps / 30));
  };

  const startEdit = (record: ExerciseRecord) => {
    setEditingId(record.id);
    setEditData({ ...record });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!editingId || !editData) return;

    // Ricalcola 1RM se peso o reps sono cambiati
    if (editData.weight !== undefined && editData.reps !== undefined) {
      editData.oneRepMax = calculateOneRepMax(editData.weight, editData.reps);
    }

    setIsSubmitting(true);
    try {
      await onUpdateRecord(editingId, editData);
      setEditingId(null);
      setEditData({});
    } catch (error) {
      console.error('Errore nell\'aggiornamento:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo record?')) {
      setIsSubmitting(true);
      try {
        await onDeleteRecord(id);
      } catch (error) {
        console.error('Errore nell\'eliminazione:', error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleAddRecord = async () => {
    if (!newRecord.athleteName || !newRecord.exerciseName || !newRecord.weight || !newRecord.reps) {
      alert('Compila tutti i campi obbligatori');
      return;
    }

    const recordToAdd = {
      ...newRecord,
      oneRepMax: calculateOneRepMax(newRecord.weight, newRecord.reps)
    };

    setIsSubmitting(true);
    try {
      await onAddRecord(recordToAdd);
      setNewRecord({
        athleteName: '',
        exerciseName: '',
        weight: 0,
        reps: 0,
        oneRepMax: 0,
        date: new Date().toISOString().split('T')[0],
        category: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Errore nell\'aggiunta:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateEditData = (field: keyof ExerciseRecord, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const updateNewRecord = (field: keyof ExerciseRecord, value: any) => {
    setNewRecord(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center">
          <Trophy className="mr-2 text-yellow-500" size={24} />
          Classifiche Editabili
        </h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center"
        >
          <Plus size={16} className="mr-2" />
          Aggiungi Record
        </button>
      </div>

      {/* Form per nuovo record */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="mr-2 text-red-600" size={20} />
            Nuovo Record
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Atleta</label>
              <select
                value={newRecord.athleteName}
                onChange={(e) => updateNewRecord('athleteName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Seleziona atleta</option>
                {athletes.map(athlete => (
                  <option key={athlete} value={athlete}>{athlete}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Esercizio</label>
              <select
                value={newRecord.exerciseName}
                onChange={(e) => updateNewRecord('exerciseName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Seleziona esercizio</option>
                {exercises.map(exercise => (
                  <option key={exercise} value={exercise}>{exercise}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso (kg)</label>
              <input
                type="number"
                value={newRecord.weight}
                onChange={(e) => updateNewRecord('weight', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ripetizioni</label>
              <input
                type="number"
                value={newRecord.reps}
                onChange={(e) => updateNewRecord('reps', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={newRecord.category}
                onChange={(e) => updateNewRecord('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Seleziona categoria</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
              <input
                type="date"
                value={newRecord.date}
                onChange={(e) => updateNewRecord('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>
          <div className="flex justify-end space-x-3 mt-4">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={handleAddRecord}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Salvando...' : 'Salva Record'}
            </button>
          </div>
        </div>
      )}

      {/* Tabella records */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Pos.</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Atleta</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Esercizio</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Peso x Reps</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">1RM</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Categoria</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Data</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record, index) => (
              <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4">
                  <div className="flex items-center">
                    {index < 3 && (
                      <Trophy 
                        className={`mr-2 ${
                          index === 0 ? 'text-yellow-500' : 
                          index === 1 ? 'text-gray-400' : 'text-orange-600'
                        }`} 
                        size={16} 
                      />
                    )}
                    <span className="font-medium">{index + 1}</span>
                  </div>
                </td>
                
                {editingId === record.id ? (
                  // Modalità editing
                  <>
                    <td className="py-3 px-4">
                      <select
                        value={editData.athleteName || record.athleteName}
                        onChange={(e) => updateEditData('athleteName', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        {athletes.map(athlete => (
                          <option key={athlete} value={athlete}>{athlete}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={editData.exerciseName || record.exerciseName}
                        onChange={(e) => updateEditData('exerciseName', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        {exercises.map(exercise => (
                          <option key={exercise} value={exercise}>{exercise}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-1">
                        <input
                          type="number"
                          value={editData.weight !== undefined ? editData.weight : record.weight}
                          onChange={(e) => updateEditData('weight', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                          min="0"
                          step="0.5"
                        />
                        <span className="self-center text-sm text-gray-500">x</span>
                        <input
                          type="number"
                          value={editData.reps !== undefined ? editData.reps : record.reps}
                          onChange={(e) => updateEditData('reps', parseInt(e.target.value) || 0)}
                          className="w-12 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                          min="1"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-red-600">
                        {calculateOneRepMax(
                          editData.weight !== undefined ? editData.weight : record.weight,
                          editData.reps !== undefined ? editData.reps : record.reps
                        )} kg
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={editData.category || record.category}
                        onChange={(e) => updateEditData('category', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="date"
                        value={editData.date || record.date}
                        onChange={(e) => updateEditData('date', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          disabled={isSubmitting}
                          className="text-green-600 hover:text-green-800 transition-colors disabled:opacity-50"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // Modalità visualizzazione
                  <>
                    <td className="py-3 px-4">
                      <span className="font-medium text-gray-900">{record.athleteName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-700">{record.exerciseName}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{record.weight}kg x {record.reps}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-red-600">{record.oneRepMax} kg</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {record.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString('it-IT')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => startEdit(record)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        
        {records.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="mx-auto mb-4 text-gray-300" size={48} />
            <p>Nessun record trovato</p>
            <p className="text-sm">Aggiungi il primo record per iniziare!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditableRankings;