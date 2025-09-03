import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users, Plus, Search, Filter, Edit3, Trash2, Eye, Calendar, Activity, TrendingUp, Mail, Phone, MapPin, Upload, Download } from 'lucide-react';
import Header from '../components/Header';
import AthleteForm from '../components/AthleteForm';
import AthleteImport from '../components/AthleteImport';
import { User } from '../utils/database';
import { useUsers } from '../hooks/useFirestore';
import type { User as FirestoreUser } from '../services/firestoreService';

interface AthleteManagerPageProps {
  onNavigate: (page: string) => void;
  currentUser: User | null;
}

interface Athlete {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  joinDate: string;
  birthDate?: string;
  status: 'active' | 'inactive' | 'suspended';
  activeWorkouts: number;
  completedSessions: number;
  lastActivity?: string;
  notes?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const AthleteManagerPage: React.FC<AthleteManagerPageProps> = ({ onNavigate, currentUser }) => {
  const { users, loading, error, createUser, updateUser, deleteUser } = useUsers();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [filteredAthletes, setFilteredAthletes] = useState<Athlete[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'joinDate' | 'lastActivity'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Converti utenti Firestore in atleti
  useEffect(() => {
    if (users.length > 0) {
      const athleteUsers = users
        .filter(user => user.role === 'athlete')
        .map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: '', // Non disponibile nel modello User
          joinDate: user.createdAt,
          birthDate: user.birthDate,
          status: 'active' as const, // Default status
          activeWorkouts: 0, // Da calcolare con le schede assegnate
          completedSessions: 0, // Da implementare con tracking sessioni
          lastActivity: user.updatedAt,
          notes: '', // Da aggiungere al modello User se necessario
          emergencyContact: undefined // Da aggiungere al modello User se necessario
        }));
      setAthletes(athleteUsers);
    }
  }, [users]);

  // Filtri e ordinamento
  useEffect(() => {
    let filtered = athletes.filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           athlete.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || athlete.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'joinDate':
          aValue = new Date(a.joinDate).getTime();
          bValue = new Date(b.joinDate).getTime();
          break;
        case 'lastActivity':
          aValue = a.lastActivity ? new Date(a.lastActivity).getTime() : 0;
          bValue = b.lastActivity ? new Date(b.lastActivity).getTime() : 0;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredAthletes(filtered);
  }, [athletes, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'inactive': return 'Inattivo';
      case 'suspended': return 'Sospeso';
      default: return 'Sconosciuto';
    }
  };

  const handleViewDetails = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setShowDetailModal(true);
    setIsEditing(false);
  };

  const handleEditAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    setShowEditModal(true);
  };

  const handleDeleteAthlete = async (athleteId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo atleta?')) {
      try {
        await deleteUser(athleteId);
      } catch (error) {
        console.error('Errore nell\'eliminazione dell\'atleta:', error);
        alert('Errore nell\'eliminazione dell\'atleta');
      }
    }
  };

  const handleCreateAthlete = async (athleteData: Partial<FirestoreUser>) => {
    try {
      await createUser(athleteData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Errore nella creazione dell\'atleta:', error);
      throw error;
    }
  };

  const handleUpdateAthlete = async (athleteData: Partial<FirestoreUser>) => {
    if (!selectedAthlete) return;
    
    try {
      await updateUser(selectedAthlete.id, athleteData);
      setShowEditModal(false);
      setSelectedAthlete(null);
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'atleta:', error);
      throw error;
    }
  };

  const handleImportAthletes = async (athletesData: Partial<FirestoreUser>[]) => {
    try {
      for (const athleteData of athletesData) {
        await createUser(athleteData);
      }
      setShowImportModal(false);
    } catch (error) {
      console.error('Errore nell\'importazione degli atleti:', error);
      throw error;
    }
  };

  const closeAllModals = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowImportModal(false);
    setShowDetailModal(false);
    setSelectedAthlete(null);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Gestione stati di caricamento ed errore
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          onNavigate={onNavigate} 
          currentUser={currentUser}
          showAuthButtons={false}
          isDashboard={true}
        />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Caricamento atleti...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header 
          onNavigate={onNavigate} 
          currentUser={currentUser}
          showAuthButtons={false}
          isDashboard={true}
        />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Errore nel caricamento</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        onNavigate={onNavigate} 
        currentUser={currentUser}
        showAuthButtons={false}
        isDashboard={true}
      />
      
      <div className="pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => onNavigate('coach-dashboard')}
              className="flex items-center justify-center w-12 h-12 bg-white border-2 border-red-600 rounded-full text-red-600 hover:bg-red-50 transition-all duration-300 transform hover:scale-110 shadow-lg"
              title="Torna alla Dashboard Coach"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-blue-900 bg-clip-text text-transparent mb-2">
                Gestione Atleti
              </h1>
              <p className="text-gray-600">
                Gestisci i profili e le informazioni dei tuoi atleti
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
                title="Importa atleti da CSV/Excel"
              >
                <Upload size={20} />
                <span className="hidden sm:inline">Importa</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg"
              >
                <Plus size={20} />
                <span>Nuovo Atleta</span>
              </button>
            </div>
          </div>

          {/* Filtri e ricerca */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Ricerca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Cerca atleti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {/* Filtro stato */}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none"
                >
                  <option value="all">Tutti gli stati</option>
                  <option value="active">Attivi</option>
                  <option value="inactive">Inattivi</option>
                  <option value="suspended">Sospesi</option>
                </select>
              </div>

              {/* Ordinamento */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="name">Ordina per Nome</option>
                <option value="joinDate">Ordina per Data Iscrizione</option>
                <option value="lastActivity">Ordina per Ultima Attività</option>
              </select>

              {/* Direzione ordinamento */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑ Crescente' : '↓ Decrescente'}
              </button>
            </div>
          </div>

          {/* Statistiche rapide compatte */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <Users className="text-blue-600 mx-auto mb-1" size={20} />
                <div className="text-lg font-bold text-blue-600">{athletes.length}</div>
                <div className="text-xs text-gray-600">Totale</div>
              </div>
              <div className="text-center">
                <Activity className="text-green-600 mx-auto mb-1" size={20} />
                <div className="text-lg font-bold text-green-600">
                  {athletes.filter(a => a.status === 'active').length}
                </div>
                <div className="text-xs text-gray-600">Attivi</div>
              </div>
              <div className="text-center">
                <TrendingUp className="text-orange-600 mx-auto mb-1" size={20} />
                <div className="text-lg font-bold text-orange-600">
                  {athletes.reduce((sum, a) => sum + a.completedSessions, 0)}
                </div>
                <div className="text-xs text-gray-600">Sessioni</div>
              </div>
              <div className="text-center">
                <Calendar className="text-purple-600 mx-auto mb-1" size={20} />
                <div className="text-lg font-bold text-purple-600">
                  {athletes.filter(a => {
                    const joinDate = new Date(a.joinDate);
                    const now = new Date();
                    return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
                  }).length}
                </div>
                <div className="text-xs text-gray-600">Nuovi</div>
              </div>
            </div>
          </div>

          {/* Lista atleti */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Atleti ({filteredAthletes.length})
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atleta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contatti
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attività
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Iscrizione
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAthletes.map((athlete) => (
                    <tr key={athlete.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-blue-900 rounded-full flex items-center justify-center text-white font-bold">
                            {athlete.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{athlete.name}</div>
                            {athlete.birthDate && (
                              <div className="text-sm text-gray-500">
                                {calculateAge(athlete.birthDate)} anni
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{athlete.email}</div>
                        {athlete.phone && (
                          <div className="text-sm text-gray-500">{athlete.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(athlete.status)}`}>
                          {getStatusText(athlete.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>Schede: {athlete.activeWorkouts}</div>
                        <div className="text-gray-500">Sessioni: {athlete.completedSessions}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(athlete.joinDate).toLocaleDateString('it-IT')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewDetails(athlete)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Visualizza dettagli"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleEditAthlete(athlete)}
                            className="text-green-600 hover:text-green-900 transition-colors"
                            title="Modifica"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAthlete(athlete.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Elimina"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredAthletes.length === 0 && (
              <div className="text-center py-12">
                <Users className="mx-auto mb-4 text-gray-400" size={64} />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Nessun atleta trovato</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Aggiungi il tuo primo atleta per iniziare'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal dettagli atleta */}
      {showDetailModal && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {isEditing ? 'Modifica Atleta' : 'Dettagli Atleta'}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Informazioni personali */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Informazioni Personali</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                      <div className="text-sm text-gray-900">{selectedAthlete.name}</div>
                    </div>
                    {selectedAthlete.birthDate && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Età</label>
                        <div className="text-sm text-gray-900">
                          {calculateAge(selectedAthlete.birthDate)} anni
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contatti */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contatti</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="text-gray-400" size={16} />
                      <span className="text-sm text-gray-900">{selectedAthlete.email}</span>
                    </div>
                    {selectedAthlete.phone && (
                      <div className="flex items-center space-x-3">
                        <Phone className="text-gray-400" size={16} />
                        <span className="text-sm text-gray-900">{selectedAthlete.phone}</span>
                      </div>
                    )}
                    {selectedAthlete.address && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="text-gray-400" size={16} />
                        <span className="text-sm text-gray-900">{selectedAthlete.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Statistiche */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiche</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Schede Attive</div>
                      <div className="text-xl font-bold text-blue-600">{selectedAthlete.activeWorkouts}</div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Sessioni Completate</div>
                      <div className="text-xl font-bold text-green-600">{selectedAthlete.completedSessions}</div>
                    </div>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-600">Stato</div>
                      <div className={`text-xl font-bold ${selectedAthlete.status === 'active' ? 'text-green-600' : selectedAthlete.status === 'inactive' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {getStatusText(selectedAthlete.status)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contatto di emergenza */}
                {selectedAthlete.emergencyContact && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Contatto di Emergenza</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-900 font-medium">{selectedAthlete.emergencyContact.name}</div>
                      <div className="text-sm text-gray-600">{selectedAthlete.emergencyContact.phone}</div>
                      <div className="text-sm text-gray-600">{selectedAthlete.emergencyContact.relationship}</div>
                    </div>
                  </div>
                )}

                {/* Note */}
                {selectedAthlete.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Note</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedAthlete.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Chiudi
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    handleEditAthlete(selectedAthlete!);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Modifica
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal aggiungi atleta */}
      {showAddModal && (
        <AthleteForm
          onSubmit={handleCreateAthlete}
          onCancel={closeAllModals}
          title="Nuovo Atleta"
        />
      )}

      {/* Modal modifica atleta */}
      {showEditModal && selectedAthlete && (
        <AthleteForm
          athlete={selectedAthlete}
          onSubmit={handleUpdateAthlete}
          onCancel={closeAllModals}
          title="Modifica Atleta"
        />
      )}

      {/* Modal importa atleti */}
      {showImportModal && (
        <AthleteImport
          onImport={handleImportAthletes}
          onCancel={closeAllModals}
        />
      )}
    </div>
  );
};

export default AthleteManagerPage;