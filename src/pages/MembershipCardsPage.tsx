import React, { useState, useEffect } from 'react';
import { ArrowLeft, CreditCard, Search, Filter, Calendar, User, CheckCircle, XCircle, AlertCircle, Euro, Phone, Mail, MapPin, Eye, Edit3, Plus, Download, ChevronLeft } from 'lucide-react';
import Header from '../components/Header';
import { User as UserType } from '../utils/database';
import { useMembershipCards } from '../hooks/useFirestore';
import { MembershipCard as FirestoreMembershipCard } from '../services/firestoreService';

interface MembershipCardsPageProps {
  currentUser: UserType | null;
  onNavigate: (page: string) => void;
  onLogout?: () => void;
}

interface MembershipCard {
  id: string;
  athleteId: string;
  athleteName: string;
  athleteEmail: string;
  athletePhone: string;
  membershipNumber: string;
  membershipType: 'monthly' | 'quarterly' | 'annual';
  startDate: string;
  expiryDate: string;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPaymentDate?: string;
  nextPaymentDate: string;
  monthlyFee: number;
  totalPaid: number;
  notes?: string;
  isActive: boolean;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const MembershipCardsPage: React.FC<MembershipCardsPageProps> = ({ currentUser, onNavigate, onLogout }) => {
  const { cards: firestoreCards, loading, error, createCard, updateCard, deleteCard } = useMembershipCards();
  const [cards, setCards] = useState<MembershipCard[]>([]);
  const [filteredCards, setFilteredCards] = useState<MembershipCard[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'overdue'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'monthly' | 'quarterly' | 'annual'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'expiryDate' | 'paymentStatus'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedCard, setSelectedCard] = useState<MembershipCard | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Gestione tasto ESC per chiudere i modali
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (showDetailModal) {
          setShowDetailModal(false);
        } else if (showCreateModal) {
          setShowCreateModal(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showDetailModal, showCreateModal]);

  // Conversione dei tesserini Firestore in MembershipCard
  useEffect(() => {
    if (firestoreCards) {
      const membershipCards: MembershipCard[] = firestoreCards.map(card => ({
        id: card.id || '',
        athleteId: card.athleteId || '',
        athleteName: card.athleteName || 'Atleta sconosciuto',
        athleteEmail: card.athleteEmail || '',
        athletePhone: card.athletePhone || '',
        membershipNumber: card.membershipNumber || '',
        membershipType: (card.membershipType as 'monthly' | 'quarterly' | 'annual') || 'monthly',
        startDate: card.startDate ? new Date(card.startDate.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        expiryDate: card.expiryDate ? new Date(card.expiryDate.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        paymentStatus: (card.paymentStatus as 'paid' | 'pending' | 'overdue') || 'pending',
        lastPaymentDate: card.lastPaymentDate ? new Date(card.lastPaymentDate.seconds * 1000).toISOString().split('T')[0] : undefined,
        nextPaymentDate: card.nextPaymentDate ? new Date(card.nextPaymentDate.seconds * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        monthlyFee: card.monthlyFee || 50,
        totalPaid: card.totalPaid || 0,
        notes: card.notes || '',
        isActive: card.isActive !== undefined ? card.isActive : true,
        emergencyContact: card.emergencyContact ? {
          name: card.emergencyContact.name || '',
          phone: card.emergencyContact.phone || '',
          relationship: card.emergencyContact.relationship || ''
        } : undefined
      }));
      setCards(membershipCards);
    }
  }, [firestoreCards]);

  // Filtri e ordinamento
  useEffect(() => {
    let filtered = cards.filter(card => {
      const matchesSearch = card.athleteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.membershipNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           card.athleteEmail.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || card.paymentStatus === statusFilter;
      const matchesType = typeFilter === 'all' || card.membershipType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

    filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortBy) {
        case 'name':
          aValue = a.athleteName.toLowerCase();
          bValue = b.athleteName.toLowerCase();
          break;
        case 'expiryDate':
          aValue = new Date(a.expiryDate).getTime();
          bValue = new Date(b.expiryDate).getTime();
          break;
        case 'paymentStatus':
          const statusOrder = { 'overdue': 0, 'pending': 1, 'paid': 2 };
          aValue = statusOrder[a.paymentStatus];
          bValue = statusOrder[b.paymentStatus];
          break;
        default:
          aValue = a.athleteName.toLowerCase();
          bValue = b.athleteName.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    setFilteredCards(filtered);
  }, [cards, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <CheckCircle size={16} className="text-green-600" />;
      case 'pending': return <AlertCircle size={16} className="text-yellow-600" />;
      case 'overdue': return <XCircle size={16} className="text-red-600" />;
      default: return <AlertCircle size={16} className="text-gray-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'paid': return 'Pagato';
      case 'pending': return 'In Attesa';
      case 'overdue': return 'Scaduto';
      default: return 'Sconosciuto';
    }
  };

  const getTypeText = (type: string) => {
    switch (type) {
      case 'monthly': return 'Mensile';
      case 'quarterly': return 'Trimestrale';
      case 'annual': return 'Annuale';
      default: return 'Sconosciuto';
    }
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const isExpired = (expiryDate: string) => {
    return new Date(expiryDate) < new Date();
  };

  const handleViewDetails = (card: MembershipCard) => {
    setSelectedCard(card);
    setShowDetailModal(true);
  };

  const handleUpdatePaymentStatus = async (cardId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
    try {
      const card = cards.find(c => c.id === cardId);
      if (!card) return;

      const updateData: Partial<MembershipCard> = { paymentStatus: newStatus };
      
      if (newStatus === 'paid') {
        updateData.lastPaymentDate = new Date().toISOString().split('T')[0];
        // Calcola la prossima data di pagamento
        const nextDate = new Date();
        switch (card.membershipType) {
          case 'monthly':
            nextDate.setMonth(nextDate.getMonth() + 1);
            break;
          case 'quarterly':
            nextDate.setMonth(nextDate.getMonth() + 3);
            break;
          case 'annual':
            nextDate.setFullYear(nextDate.getFullYear() + 1);
            break;
        }
        updateData.nextPaymentDate = nextDate.toISOString().split('T')[0];
        updateData.totalPaid = (card.totalPaid || 0) + card.monthlyFee;
      }
      
      await updateCard(cardId, updateData);
    } catch (error) {
      console.error('Errore nell\'aggiornamento dello stato di pagamento:', error);
    }
  };

  // Gestione stati di caricamento ed errore
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto mb-3"></div>
            <p className="text-gray-600 text-sm">Caricamento tesserini...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="text-red-600 mb-3">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-2">Errore nel caricamento</h3>
            <p className="text-gray-600 mb-3 text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Statistiche
  const totalCards = cards.length;
  const activeCards = cards.filter(c => c.isActive).length;
  const paidCards = cards.filter(c => c.paymentStatus === 'paid').length;
  const overdueCards = cards.filter(c => c.paymentStatus === 'overdue').length;
  const totalRevenue = cards.reduce((sum, c) => sum + c.totalPaid, 0);
  const expiringSoon = cards.filter(c => isExpiringSoon(c.expiryDate)).length;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <Header onNavigate={onNavigate} currentUser={currentUser} onLogout={onLogout} isDashboard={true} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header compatto */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => onNavigate('coach-dashboard')}
            className="transition-all duration-300 transform hover:scale-110 p-2 text-red-600"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))',
              background: 'transparent',
              border: 'none'
            }}
            title="Torna alla Dashboard Coach"
          >
            <ChevronLeft size={32} />
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-xl font-bold bg-gradient-to-r from-red-600 to-blue-900 bg-clip-text text-transparent">
              Tesserini Atleti
            </h1>
            <p className="text-gray-600 text-sm">
              Gestisci i tesserini e i pagamenti degli atleti
            </p>
          </div>
          
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm"
          >
            <Plus size={16} />
            <span>Nuovo</span>
          </button>
        </div>

        {/* Statistiche rapide compatte */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <CreditCard className="text-blue-600 mr-2" size={16} />
              <div>
                <div className="text-xs text-gray-600">Totali</div>
                <div className="text-lg font-bold text-blue-600">{totalCards}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <CheckCircle className="text-green-600 mr-2" size={16} />
              <div>
                <div className="text-xs text-gray-600">Attivi</div>
                <div className="text-lg font-bold text-green-600">{activeCards}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <CheckCircle className="text-emerald-600 mr-2" size={16} />
              <div>
                <div className="text-xs text-gray-600">Pagati</div>
                <div className="text-lg font-bold text-emerald-600">{paidCards}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <XCircle className="text-red-600 mr-2" size={16} />
              <div>
                <div className="text-xs text-gray-600">Scaduti</div>
                <div className="text-lg font-bold text-red-600">{overdueCards}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <AlertCircle className="text-orange-600 mr-2" size={16} />
              <div>
                <div className="text-xs text-gray-600">In Scadenza</div>
                <div className="text-lg font-bold text-orange-600">{expiringSoon}</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center">
              <Euro className="text-purple-600 mr-2" size={16} />
              <div>
                <div className="text-xs text-gray-600">Incasso</div>
                <div className="text-lg font-bold text-purple-600">€{totalRevenue}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtri e ricerca compatti */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Barra di ricerca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Cerca atleti o tesserini..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              />
            </div>

            {/* Filtro stato pagamento */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="all">Tutti i pagamenti</option>
              <option value="paid">Pagati</option>
              <option value="pending">In attesa</option>
              <option value="overdue">Scaduti</option>
            </select>

            {/* Filtro tipo abbonamento */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
            >
              <option value="all">Tutti i tipi</option>
              <option value="monthly">Mensile</option>
              <option value="quarterly">Trimestrale</option>
              <option value="annual">Annuale</option>
            </select>

            {/* Ordinamento */}
            <div className="flex space-x-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
              >
                <option value="name">Nome</option>
                <option value="expiryDate">Scadenza</option>
                <option value="paymentStatus">Stato</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

          {/* Lista tesserini */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCards.map((card) => (
            <div key={card.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow">
              {/* Header della card compatto */}
              <div className={`p-3 ${
                card.paymentStatus === 'paid' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                card.paymentStatus === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
                'bg-gradient-to-r from-red-500 to-red-600'
              } text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(card.paymentStatus)}
                    <span className="font-medium text-xs">{getStatusText(card.paymentStatus)}</span>
                  </div>
                  <div className="text-xs opacity-90 font-mono">
                    {card.membershipNumber}
                  </div>
                </div>
              </div>

              {/* Contenuto della card compatto */}
              <div className="p-3">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-red-600 to-blue-900 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {card.athleteName.charAt(0).toUpperCase()}
                  </div>
                  <div className="ml-2 flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 text-sm truncate">{card.athleteName}</h3>
                    <p className="text-xs text-gray-600">{getTypeText(card.membershipType)}</p>
                  </div>
                </div>

                  <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Scadenza:</span>
                    <span className={`font-medium ${
                      isExpired(card.expiryDate) ? 'text-red-600' :
                      isExpiringSoon(card.expiryDate) ? 'text-orange-600' :
                      'text-gray-900'
                    }`}>
                      {new Date(card.expiryDate).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Quota:</span>
                    <span className="font-medium text-gray-900">€{card.monthlyFee}</span>
                  </div>
                  {card.nextPaymentDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Prossimo:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(card.nextPaymentDate).toLocaleDateString('it-IT')}
                      </span>
                    </div>
                  )}
                </div>

                  {/* Avvisi compatti */}
                {isExpired(card.expiryDate) && (
                  <div className="mt-2 p-1 bg-red-50 border border-red-200 rounded">
                    <p className="text-xs text-red-700 font-medium">⚠️ Scaduto</p>
                  </div>
                )}
                {isExpiringSoon(card.expiryDate) && !isExpired(card.expiryDate) && (
                  <div className="mt-2 p-1 bg-orange-50 border border-orange-200 rounded">
                    <p className="text-xs text-orange-700 font-medium">⏰ In scadenza</p>
                  </div>
                )}

                {/* Azioni compatte */}
                <div className="mt-3 flex space-x-1">
                  <button
                    onClick={() => handleViewDetails(card)}
                    className="flex-1 bg-blue-600 text-white py-1 px-2 rounded hover:bg-blue-700 transition-colors text-xs flex items-center justify-center space-x-1"
                  >
                    <Eye size={12} />
                    <span>Dettagli</span>
                  </button>
                  {card.paymentStatus !== 'paid' && (
                    <button
                      onClick={() => handleUpdatePaymentStatus(card.id, 'paid')}
                      className="bg-green-600 text-white py-1 px-2 rounded hover:bg-green-700 transition-colors"
                      title="Segna come pagato"
                    >
                      <CheckCircle size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center py-8">
            <CreditCard className="mx-auto mb-3 text-gray-400" size={48} />
            <h3 className="text-base font-semibold text-gray-900 mb-2">Nessun tesserino trovato</h3>
            <p className="text-gray-600 text-sm">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Crea il primo tesserino per i tuoi atleti'
              }
            </p>
          </div>
        )}
      </div>

      {/* Modal dettagli tesserino compatto */}
      {showDetailModal && selectedCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Dettagli Tesserino</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {/* Informazioni atleta compatte */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Informazioni Atleta</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Nome Completo</label>
                        <div className="text-sm text-gray-900">{selectedCard.athleteName}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Numero Tesserino</label>
                        <div className="text-sm text-gray-900 font-mono">{selectedCard.membershipNumber}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                        <div className="text-sm text-gray-900 flex items-center">
                          <Mail size={14} className="mr-2 text-gray-400" />
                          {selectedCard.athleteEmail}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Telefono</label>
                        <div className="text-sm text-gray-900 flex items-center">
                          <Phone size={14} className="mr-2 text-gray-400" />
                          {selectedCard.athletePhone}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Informazioni abbonamento compatte */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Informazioni Abbonamento</h3>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tipo Abbonamento</label>
                        <div className="text-sm text-gray-900">{getTypeText(selectedCard.membershipType)}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Quota Mensile</label>
                        <div className="text-sm text-gray-900 font-semibold">€{selectedCard.monthlyFee}</div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Data Inizio</label>
                        <div className="text-sm text-gray-900">
                          {new Date(selectedCard.startDate).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Data Scadenza</label>
                        <div className={`text-sm font-medium ${
                          isExpired(selectedCard.expiryDate) ? 'text-red-600' :
                          isExpiringSoon(selectedCard.expiryDate) ? 'text-orange-600' :
                          'text-gray-900'
                        }`}>
                          {new Date(selectedCard.expiryDate).toLocaleDateString('it-IT')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stato pagamenti compatto */}
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Stato Pagamenti</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`p-2 rounded border ${
                      selectedCard.paymentStatus === 'paid' ? 'bg-green-50 border-green-200' :
                      selectedCard.paymentStatus === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center">
                        {getStatusIcon(selectedCard.paymentStatus)}
                        <span className="ml-1 font-medium text-xs">{getStatusText(selectedCard.paymentStatus)}</span>
                      </div>
                    </div>
                    <div className="bg-blue-50 p-2 rounded border border-blue-200">
                      <div className="text-xs text-gray-600">Totale Pagato</div>
                      <div className="text-sm font-bold text-blue-600">€{selectedCard.totalPaid}</div>
                    </div>
                    <div className="bg-purple-50 p-2 rounded border border-purple-200">
                      <div className="text-xs text-gray-600">Prossimo</div>
                      <div className="text-xs font-bold text-purple-600">
                        {selectedCard.nextPaymentDate 
                          ? new Date(selectedCard.nextPaymentDate).toLocaleDateString('it-IT')
                          : 'N/A'
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contatto di emergenza compatto */}
                {selectedCard.emergencyContact && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Contatto di Emergenza</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="grid grid-cols-1 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                          <div className="text-sm text-gray-900">{selectedCard.emergencyContact.name}</div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Telefono</label>
                          <div className="text-sm text-gray-900">{selectedCard.emergencyContact.phone}</div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Relazione</label>
                          <div className="text-sm text-gray-900">{selectedCard.emergencyContact.relationship}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Note compatte */}
                {selectedCard.notes && (
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Note</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-900">{selectedCard.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-3 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
                >
                  Chiudi
                </button>
                {selectedCard.paymentStatus !== 'paid' && (
                  <button
                    onClick={() => {
                      handleUpdatePaymentStatus(selectedCard.id, 'paid');
                      setShowDetailModal(false);
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    Segna come Pagato
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal crea tesserino compatto */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Nuovo Tesserino</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors text-xl"
                >
                  ×
                </button>
              </div>

              <div className="text-center py-6">
                <CreditCard className="mx-auto mb-3 text-gray-400" size={48} />
                <h3 className="text-base font-semibold text-gray-900 mb-2">Funzionalità in Sviluppo</h3>
                <p className="text-gray-600 text-sm">
                  Il modulo per creare nuovi tesserini sarà disponibile nella prossima versione.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm"
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

export default MembershipCardsPage;