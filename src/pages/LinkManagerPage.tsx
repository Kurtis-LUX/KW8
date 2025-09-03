import React, { useState, useEffect } from 'react';
import { ArrowLeft, Link as LinkIcon, ExternalLink, Copy, Plus, Search, Filter, Edit3, Trash2, Eye, Calendar, Users, Database, QrCode, BarChart3 } from 'lucide-react';
import { useLinks } from '../hooks/useFirestore';
import { Link as FirestoreLink } from '../services/firestoreService';

interface WorkoutLink {
  id: string;
  workoutName: string;
  workoutId: string;
  athleteName: string;
  athleteId: string;
  linkUrl: string;
  shortCode: string;
  createdDate: string;
  expiryDate?: string;
  accessCount: number;
  lastAccessed?: string;
  status: 'active' | 'expired' | 'disabled';
  description?: string;
}

interface LinkManagerPageProps {
  onNavigate: (page: string) => void;
  currentUser: any;
}

const LinkManagerPage: React.FC<LinkManagerPageProps> = ({ onNavigate, currentUser }) => {
  const { links: firestoreLinks, loading, error, createLink, updateLink, deleteLink } = useLinks();
  const [links, setLinks] = useState<WorkoutLink[]>([]);
  const [filteredLinks, setFilteredLinks] = useState<WorkoutLink[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired' | 'disabled'>('all');
  const [sortBy, setSortBy] = useState<'createdDate' | 'accessCount' | 'lastAccessed'>('createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLink, setSelectedLink] = useState<WorkoutLink | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  // Conversione dei link Firestore in WorkoutLink
  useEffect(() => {
    if (firestoreLinks) {
      const workoutLinks: WorkoutLink[] = firestoreLinks.map(link => ({
        id: link.id || '',
        workoutName: link.title || 'Link senza titolo',
        workoutId: link.workoutId || '',
        athleteName: link.athleteName || 'Atleta sconosciuto',
        athleteId: link.athleteId || '',
        linkUrl: link.url || '',
        shortCode: link.shortCode || '',
        createdDate: link.createdAt ? new Date(link.createdAt.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expiryDate: link.expiryDate ? new Date(link.expiryDate.seconds * 1000).toISOString().split('T')[0] : undefined,
        accessCount: link.accessCount || 0,
        lastAccessed: link.lastAccessed ? new Date(link.lastAccessed.seconds * 1000).toISOString().split('T')[0] : undefined,
        status: (link.status as 'active' | 'expired' | 'disabled') || 'active',
        description: link.description || ''
      }));
      setLinks(workoutLinks);
    }
  }, [firestoreLinks]);

  // Filtri e ordinamento
  useEffect(() => {
    let filtered = links.filter(link => {
      const matchesSearch = link.workoutName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           link.shortCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'createdDate':
          aValue = new Date(a.createdDate).getTime();
          bValue = new Date(b.createdDate).getTime();
          break;
        case 'accessCount':
          aValue = a.accessCount;
          bValue = b.accessCount;
          break;
        case 'lastAccessed':
          aValue = a.lastAccessed ? new Date(a.lastAccessed).getTime() : 0;
          bValue = b.lastAccessed ? new Date(b.lastAccessed).getTime() : 0;
          break;
        default:
          aValue = new Date(a.createdDate).getTime();
          bValue = new Date(b.createdDate).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredLinks(filtered);
  }, [links, searchTerm, statusFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'disabled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Attivo';
      case 'expired': return 'Scaduto';
      case 'disabled': return 'Disabilitato';
      default: return 'Sconosciuto';
    }
  };

  const handleCopyLink = async (link: WorkoutLink) => {
    try {
      await navigator.clipboard.writeText(link.linkUrl);
      setCopiedLinkId(link.id);
      setTimeout(() => setCopiedLinkId(null), 2000);
    } catch (err) {
      console.error('Errore nella copia del link:', err);
    }
  };

  const handleViewDetails = (link: WorkoutLink) => {
    setSelectedLink(link);
    setShowDetailModal(true);
  };

  const handleDeleteLink = async (linkId: string) => {
    if (window.confirm('Sei sicuro di voler eliminare questo link?')) {
      try {
        await deleteLink(linkId);
      } catch (err) {
        console.error('Errore nell\'eliminazione del link:', err);
      }
    }
  };

  const handleToggleStatus = async (linkId: string) => {
    const link = links.find(l => l.id === linkId);
    if (link) {
      const newStatus = link.status === 'active' ? 'disabled' : 'active';
      try {
        await updateLink(linkId, { status: newStatus });
      } catch (err) {
        console.error('Errore nell\'aggiornamento dello stato del link:', err);
      }
    }
  };

  const isExpired = (link: WorkoutLink) => {
    if (!link.expiryDate) return false;
    return new Date(link.expiryDate) < new Date();
  };

  // Gestione stati di caricamento ed errore
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento link...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Errore nel caricamento</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Riprova
          </button>
        </div>
      </div>
    );
  }

  // Statistiche
  const totalLinks = links.length;
  const activeLinks = links.filter(l => l.status === 'active').length;
  const totalAccesses = links.reduce((sum, l) => sum + l.accessCount, 0);
  const expiredLinks = links.filter(l => l.status === 'expired' || isExpired(l)).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header compatto */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('coach-dashboard')}
            className="flex items-center justify-center w-10 h-10 bg-white border-2 border-red-600 rounded-full text-red-600 hover:bg-red-50 transition-all duration-300 transform hover:scale-110 shadow-lg"
            title="Torna alla Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-blue-900 bg-clip-text text-transparent">
              Gestione Link
            </h1>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-lg text-sm"
          >
            <Plus size={16} />
            <span>Nuovo</span>
          </button>
        </div>

        {/* Statistiche compatte */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <BarChart3 className="text-gray-600" size={18} />
              <span className="text-sm font-medium text-gray-700">Statistiche</span>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-1">
                <LinkIcon className="text-blue-600" size={16} />
                <span className="text-gray-600">Totali:</span>
                <span className="font-bold text-blue-600">{totalLinks}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Database className="text-green-600" size={16} />
                <span className="text-gray-600">Attivi:</span>
                <span className="font-bold text-green-600">{activeLinks}</span>
              </div>
              <div className="flex items-center space-x-1">
                <ExternalLink className="text-orange-600" size={16} />
                <span className="text-gray-600">Accessi:</span>
                <span className="font-bold text-orange-600">{totalAccesses}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="text-red-600" size={16} />
                <span className="text-gray-600">Scaduti:</span>
                <span className="font-bold text-red-600">{expiredLinks}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtri compatti */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center space-x-4">
            {/* Ricerca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Cerca link, atleti o codici..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>

            {/* Filtro stato */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 appearance-none text-sm min-w-[140px]"
              >
                <option value="all">Tutti</option>
                <option value="active">Attivi</option>
                <option value="expired">Scaduti</option>
                <option value="disabled">Disabilitati</option>
              </select>
            </div>

            {/* Ordinamento */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm min-w-[160px]"
            >
              <option value="createdDate">Data Creazione</option>
              <option value="accessCount">Accessi</option>
              <option value="lastAccessed">Ultimo Accesso</option>
            </select>

            {/* Direzione ordinamento */}
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        {/* Lista link */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Link Schede ({filteredLinks.length})
            </h3>
          </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheda
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Atleta
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Link
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stato
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Accessi
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scadenza
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Azioni
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLinks.map((link) => (
                    <tr key={link.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-blue-900 rounded-lg flex items-center justify-center text-white">
                            <Database size={16} />
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[120px]">{link.workoutName}</div>
                            <div className="text-xs text-gray-500">ID: {link.workoutId.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white font-bold text-xs">
                            {link.athleteName.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-2">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[100px]">{link.athleteName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                            {link.shortCode}
                          </code>
                          <button
                            onClick={() => handleCopyLink(link)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Copia link"
                          >
                            {copiedLinkId === link.id ? (
                              <span className="text-green-600 text-xs">✓</span>
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(link.status)}`}>
                          {getStatusText(link.status)}
                        </span>
                        {isExpired(link) && link.status === 'active' && (
                          <div className="text-xs text-red-600 mt-1">Scaduto</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          <ExternalLink className="text-gray-400 mr-1" size={14} />
                          {link.accessCount}
                        </div>
                        {link.lastAccessed && (
                          <div className="text-xs text-gray-500">
                            Ultimo: {new Date(link.lastAccessed).toLocaleDateString('it-IT')}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {link.expiryDate ? (
                          <div className={isExpired(link) ? 'text-red-600' : 'text-gray-900'}>
                            {new Date(link.expiryDate).toLocaleDateString('it-IT')}
                          </div>
                        ) : (
                          <span className="text-gray-500">Nessuna</span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => handleViewDetails(link)}
                            className="text-blue-600 hover:text-blue-900 transition-colors p-1"
                            title="Visualizza dettagli"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => handleToggleStatus(link.id)}
                            className={`${link.status === 'active' ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} transition-colors p-1`}
                            title={link.status === 'active' ? 'Disabilita' : 'Abilita'}
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteLink(link.id)}
                            className="text-red-600 hover:text-red-900 transition-colors p-1"
                            title="Elimina"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredLinks.length === 0 && (
              <div className="text-center py-8">
                <LinkIcon className="mx-auto mb-3 text-gray-400" size={48} />
                <h3 className="text-base font-semibold text-gray-900 mb-2">Nessun link trovato</h3>
                <p className="text-sm text-gray-600">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Prova a modificare i filtri di ricerca'
                    : 'Crea il tuo primo link per condividere le schede con gli atleti'
                  }
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal dettagli link */}
      {showDetailModal && selectedLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Dettagli Link</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Informazioni scheda */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Informazioni Scheda</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nome Scheda</label>
                        <div className="text-sm text-gray-900">{selectedLink.workoutName}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Atleta</label>
                        <div className="text-sm text-gray-900">{selectedLink.athleteName}</div>
                      </div>
                    </div>
                    {selectedLink.description && (
                      <div className="mt-2">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Descrizione</label>
                        <div className="text-sm text-gray-900">{selectedLink.description}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Informazioni link */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Informazioni Link</h3>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">URL Completo:</span>
                      <div className="flex items-center space-x-2">
                        <code className="bg-white px-2 py-1 rounded text-xs font-mono border max-w-[200px] truncate">
                          {selectedLink.linkUrl}
                        </code>
                        <button
                          onClick={() => handleCopyLink(selectedLink)}
                          className="text-blue-600 hover:text-blue-900 transition-colors"
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Codice Breve:</span>
                      <code className="bg-white px-2 py-1 rounded text-xs font-mono border">
                        {selectedLink.shortCode}
                      </code>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">Stato:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLink.status)}`}>
                        {getStatusText(selectedLink.status)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Statistiche accesso */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Statistiche Accesso</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-50 p-2 rounded-lg text-center">
                      <div className="text-xs text-gray-600">Accessi</div>
                      <div className="text-lg font-bold text-blue-600">{selectedLink.accessCount}</div>
                    </div>
                    <div className="bg-green-50 p-2 rounded-lg text-center">
                      <div className="text-xs text-gray-600">Creazione</div>
                      <div className="text-xs font-bold text-green-600">
                        {new Date(selectedLink.createdDate).toLocaleDateString('it-IT')}
                      </div>
                    </div>
                    <div className="bg-orange-50 p-2 rounded-lg text-center">
                      <div className="text-xs text-gray-600">Ultimo</div>
                      <div className="text-xs font-bold text-orange-600">
                        {selectedLink.lastAccessed 
                          ? new Date(selectedLink.lastAccessed).toLocaleDateString('it-IT')
                          : 'Mai'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code placeholder */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">QR Code</h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-center">
                    <QrCode className="mx-auto mb-2 text-gray-400" size={32} />
                    <p className="text-xs text-gray-600">QR Code per accesso rapido</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Disponibile nella prossima versione
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Chiudi
                </button>
                <button
                  onClick={() => handleCopyLink(selectedLink)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Copia Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal crea link */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Nuovo Link</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>

              <div className="text-center py-6">
                <LinkIcon className="mx-auto mb-3 text-gray-400" size={48} />
                <h3 className="text-base font-semibold text-gray-900 mb-2">Funzionalità in Sviluppo</h3>
                <p className="text-sm text-gray-600">
                  Il modulo per creare nuovi link sarà disponibile nella prossima versione.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkManagerPage;