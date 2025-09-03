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
      const athleteData: Athlete[] = users
        .filter(user => user.role === 'user')
        .map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          address: user.address,
          joinDate: user.createdAt || new Date().toISOString(),
          birthDate: user.birthDate,
          status: user.isActive ? 'active' : 'inactive',
          activeWorkouts: user.workoutPlans?.length || 0,
          completedSessions: 0,
          lastActivity: user.lastLogin,
          notes: user.notes,
          emergencyContact: user.emergencyContact ? {
            name: user.emergencyContact.name,
            phone: user.emergencyContact.phone,
            relationship: user.emergencyContact.relationship
          } : undefined
        }));
      setAthletes(athleteData);
    }
  }, [users]);

  // Filtra e ordina atleti
  useEffect(() => {
    let filtered = athletes.filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           athlete.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || athlete.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'joinDate':
          aValue = new Date(a.joinDate);
          bValue = new Date(b.joinDate);
          break;
        case 'lastActivity':
          aValue = a.lastActivity ? new Date(a.lastActivity) : new Date(0);
          bValue = b.lastActivity ? new Date(b.lastActivity) : new Date(0);
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
      case 'active': return 'text-green-600 bg-green-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      case 'suspended': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
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
        console.error('Errore durante l\'eliminazione dell\'atleta:', error);
        alert('Errore durante l\'eliminazione dell\'atleta');
      }
    }
  };

  const handleCreateAthlete = async (athleteData: Partial<FirestoreUser>) => {
    try {
      await createUser(athleteData);
      setShowAddModal(false);
    } catch (error) {
      console.error('Errore durante la creazione dell\'atleta:', error);
      alert('Errore durante la creazione dell\'atleta');
    }
  };

  const handleUpdateAthlete = async (athleteData: Partial<FirestoreUser>) => {
    if (!selectedAthlete) return;
    
    try {
      await updateUser(selectedAthlete.id, athleteData);
      setShowEditModal(false);
      setSelectedAthlete(null);
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dell\'atleta:', error);
      alert('Errore durante l\'aggiornamento dell\'atleta');
    }
  };

  const handleImportAthletes = async (athletesData: Partial<FirestoreUser>[]) => {
    try {
      for (const athleteData of athletesData) {
        await createUser(athleteData);
      }
      setShowImportModal(false);
    } catch (error) {
      console.error('Errore durante l\'importazione degli atleti:', error);
      alert('Errore durante l\'importazione degli atleti');
    }
  };

  const closeAllModals = () => {
    setShowDetailModal(false);
    setShowAddModal(false);
    setShowEditModal(false);
    setShowImportModal(false);
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
            <div className="text-red-600 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Errore nel caricamento</h2>
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
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Upload size={16} />
                <span>Importa</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Plus size={16} />
                <span>Nuovo Atleta</span>
              </button>
            </div>
          </div>

          {/* Statistiche rapide */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Totale Atleti</p>
                  <p className="text-2xl font-bold text-gray-900">{athletes.length}</p>
                </div>
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Attivi</p>
                  <p className="text-2xl font-bold text-green-600">
                    {athletes.filter(a => a.status === 'active').length}
                  </p>
                </div>
                <Activity className="text-green-600" size={24} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Inattivi</p>
                  <p className="text-2xl font-bold text-gray-600">
                    {athletes.filter(a => a.status === 'inactive').length}
                  </p>
                </div>
                <Calendar className="text-gray-600" size={24} />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sospesi</p>
                  <p className="text-2xl font-bold text-red-600">
                    {athletes.filter(a => a.status === 'suspended').length}
                  </p>
                </div>
                <TrendingUp className="text-red-600" size={24} />
              </div>
            </div>
          </div>

          {/* Filtri e ricerca */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Cerca atleti..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="all">Tutti gli stati</option>
                <option value="active">Attivi</option>
                <option value="inactive">Inattivi</option>
                <option value="suspended">Sospesi</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="name">Ordina per Nome</option>
                <option value="joinDate">Ordina per Data Iscrizione</option>
                <option value="lastActivity">Ordina per Ultima Attività</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter size={16} className="mr-2" />
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>

          {/* Lista atleti */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">Atleti ({filteredAthletes.length})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Atleta</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stato</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contatto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attività</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAthletes.map((athlete) => (
                    <tr key={athlete.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-red-600">
                                {athlete.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(athlete.status)}`}>
                          {getStatusText(athlete.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <Mail size={14} className="mr-2 text-gray-400" />
                            {athlete.email}
                          </div>
                          {athlete.phone && (
                            <div className="flex items-center">
                              <Phone size={14} className="mr-2 text-gray-400" />
                              {athlete.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="space-y-1">
                          <div>Schede: {athlete.activeWorkouts}</div>
                          <div>Sessioni: {athlete.completedSessions}</div>
                          {athlete.lastActivity && (
                            <div className="text-xs text-gray-500">
                              Ultimo accesso: {new Date(athlete.lastActivity).toLocaleDateString('it-IT')}
                            </div>
                          )}
                        </div>
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
                            title="Modifica atleta"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteAthlete(athlete.id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Elimina atleta"
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
                <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun atleta trovato</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Inizia aggiungendo il tuo primo atleta'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal dettagli atleta */}
      {showDetailModal && selectedAthlete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Dettagli Atleta</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Informazioni Personali</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <div className="text-sm text-gray-900">{selectedAthlete.name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Email</label>
                        <div className="text-sm text-gray-900">{selectedAthlete.email}</div>
                      </div>
                      {selectedAthlete.birthDate && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Età</label>
                          <div className="text-sm text-gray-900">
                            {calculateAge(selectedAthlete.birthDate)} anni
                            <span className="text-gray-500 ml-2">
                              (nato il {new Date(selectedAthlete.birthDate).toLocaleDateString('it-IT')})
                            </span>
                          </div>
                        </div>
                      )}
                      {selectedAthlete.phone && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Telefono</label>
                          <div className="text-sm text-gray-900">{selectedAthlete.phone}</div>
                        </div>
                      )}
                      {selectedAthlete.address && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Indirizzo</label>
                          <div className="text-sm text-gray-900">{selectedAthlete.address}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Stato e Attività</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Stato</label>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedAthlete.status)}`}>
                          {getStatusText(selectedAthlete.status)}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Data Iscrizione</label>
                        <div className="text-sm text-gray-900">
                          {new Date(selectedAthlete.joinDate).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Schede Attive</label>
                        <div className="text-sm text-gray-900">{selectedAthlete.activeWorkouts}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Sessioni Completate</label>
                        <div className="text-sm text-gray-900">{selectedAthlete.completedSessions}</div>
                      </div>
                      {selectedAthlete.lastActivity && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Ultima Attività</label>
                          <div className="text-sm text-gray-900">
                            {new Date(selectedAthlete.lastActivity).toLocaleDateString('it-IT')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {selectedAthlete.emergencyContact && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Contatto di Emergenza</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Nome</label>
                        <div className="text-sm text-gray-900">{selectedAthlete.emergencyContact.name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Telefono</label>
                        <div className="text-sm text-gray-900">{selectedAthlete.emergencyContact.phone}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Relazione</label>
                        <div className="text-sm text-gray-900">{selectedAthlete.emergencyContact.relationship}</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {selectedAthlete.notes && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Note</h3>
                    <p className="text-sm text-gray-900">{selectedAthlete.notes}</p>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-8">
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