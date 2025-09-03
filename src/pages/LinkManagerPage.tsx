import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const LinkManagerPage: React.FC = () => {
  const navigate = useNavigate();
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
        createdDate: link.createdAt ? (typeof link.createdAt === 'string' ? link.createdAt.split('T')[0] : new Date(link.createdAt).toISOString().split('T')[0]) : new Date().toISOString().split('T')[0],
        expiryDate: link.expiryDate ? (typeof link.expiryDate === 'string' ? link.expiryDate.split('T')[0] : new Date(link.expiryDate).toISOString().split('T')[0]) : undefined,
        accessCount: link.accessCount || 0,
        lastAccessed: link.lastAccessed ? (typeof link.lastAccessed === 'string' ? link.lastAccessed.split('T')[0] : new Date(link.lastAccessed).toISOString().split('T')[0]) : undefined,
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/coach-dashboard')}
            className="flex items-center justify-center w-10 h-10 bg-white border-2 border-red-600 rounded-full text-red-600 hover:bg-red-50 transition-all duration-300 transform hover:scale-110 shadow-lg"
            title="Torna alla Dashboard"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Gestione Link</h1>
          <div className="w-10"></div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">
              Link Schede ({filteredLinks.length})
            </h3>
          </div>
          
          <div className="p-4">
            {filteredLinks.length === 0 ? (
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
            ) : (
              <div className="space-y-4">
                {filteredLinks.map((link) => (
                  <div key={link.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{link.workoutName}</h4>
                        <p className="text-sm text-gray-600">{link.athleteName}</p>
                        <p className="text-xs text-gray-500">{link.shortCode}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          link.status === 'active' ? 'bg-green-100 text-green-800' :
                          link.status === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {link.status === 'active' ? 'Attivo' :
                           link.status === 'expired' ? 'Scaduto' : 'Disabilitato'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkManagerPage;