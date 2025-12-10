import React, { useState, useEffect, useRef } from 'react';
import { Users, Plus, Search, Filter, Edit3, Trash2, Eye, Calendar, Activity, TrendingUp, Mail, Phone, MapPin, Upload, Download, ChevronLeft, ChevronRight, ChevronDown, X, FileText, Copy, User as UserIcon } from 'lucide-react';
import Header from '../components/Header';
import useIsStandaloneMobile from '../hooks/useIsStandaloneMobile';
import AthleteForm from '../components/AthleteForm';
import Modal from '../components/Modal';
import Portal from '../components/Portal';
import AthleteImport from '../components/AthleteImport';
import { User } from '../utils/database';
import { useUsers, useWorkoutPlans } from '../hooks/useFirestore';
import { WorkoutPlan, WorkoutVariant } from '../utils/database';
import type { User as FirestoreUser } from '../services/firestoreService';
import { useDropdownPosition } from '../hooks/useDropdownPosition';

interface AthleteManagerPageProps {
  onNavigate: (page: string, plan?: string, linkId?: string) => void;
  currentUser: User | null;
  onLogout?: () => void;
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

const AthleteManagerPage: React.FC<AthleteManagerPageProps> = ({ onNavigate, currentUser, onLogout }) => {
  const { users, loading, error, createUser, updateUser, deleteUser } = useUsers();
  const { workoutPlans, loading: plansLoading, error: plansError, refetch: refetchPlans } = useWorkoutPlans();
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
  const [isEditing, setIsEditing] = useState(false);
  const [showCompactTitle, setShowCompactTitle] = useState(false);
  const [headerHeight, setHeaderHeight] = useState<number>(0);
  const isStandaloneMobile = useIsStandaloneMobile();
  const [assignedByAthlete, setAssignedByAthlete] = useState<Record<string, WorkoutPlan[]>>({});
  const [assignedEntriesByAthlete, setAssignedEntriesByAthlete] = useState<Record<string, { plan: WorkoutPlan; assignedVariants: WorkoutVariant[]; originalAssigned: boolean }[]>>({});
  const [openMenuKey, setOpenMenuKey] = useState<string | null>(null);
  const [assignedMenuOpen, setAssignedMenuOpen] = useState<{ athleteId: string | null; rect: DOMRect | null }>({ athleteId: null, rect: null });
  const [variantsExpandedForPlan, setVariantsExpandedForPlan] = useState<Record<string, boolean>>({});
  const assignedMenuRef = useRef<HTMLDivElement | null>(null);
  const [assignedMenuPosition, setAssignedMenuPosition] = useState<{ left: number; top: number; maxHeight: number } | null>(null);
  // Caricamento progressivo atleti (10 alla volta)
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const listEndRef = useRef<HTMLDivElement | null>(null);

  // Ricerca smart sotto titolo
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement | null>(null);
  const { dropdownRef, openDropdown, closeDropdown, toggleDropdown, isOpen, position, triggerRef } = useDropdownPosition({ preferredPosition: 'bottom-left' });
  
  // Calcolo posizione robusta per il menu assegnazioni (corregge apertura dell'ultimo atleta)
  useEffect(() => {
    if (!assignedMenuOpen.athleteId || !assignedMenuOpen.rect) {
      setAssignedMenuPosition(null);
      return;
    }
    const rect = assignedMenuOpen.rect;
    const dropdownWidth = 18 * 16; // w-72
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - dropdownWidth - 8));
    // Misura altezza dopo render per decidere apertura sopra/sotto
    requestAnimationFrame(() => {
      const measuredHeight = assignedMenuRef.current?.offsetHeight || 320;
      const availableBelow = Math.max(0, window.innerHeight - rect.bottom - 8);
      const defaultTop = rect.bottom + 8;
      let top = defaultTop;
      let maxHeight = 384;
      if (availableBelow < 220) {
        maxHeight = Math.min(384, Math.max(160, rect.top - 16));
        const used = Math.min(maxHeight, measuredHeight);
        top = Math.max(8, rect.top - used - 8);
      } else {
        maxHeight = Math.min(384, Math.max(160, window.innerHeight - defaultTop - 16));
      }
      setAssignedMenuPosition({ left, top, maxHeight });
    });
  }, [assignedMenuOpen]);

  // Inizializza visibilità atleti quando cambia l'elenco filtrato
  useEffect(() => {
    setVisibleCount(Math.min(10, filteredAthletes.length));
  }, [filteredAthletes]);

  // IntersectionObserver per caricare progressivamente altri atleti
  useEffect(() => {
    const sentinel = listEndRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 10, filteredAthletes.length));
        }
      });
    }, { root: null, rootMargin: '200px', threshold: 0.1 });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [listEndRef, filteredAthletes.length]);

  // Conferma eliminazione atleta
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Athlete | null>(null);

  // Campi per il modal di modifica (allineati alla registrazione atleta)
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Converte utenti in atleti e calcola le schede assegnate e il conteggio
  useEffect(() => {
    const athleteUsers = users
      .filter(user => user.role === 'athlete')
      .map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: '',
        joinDate: user.createdAt,
        birthDate: user.birthDate,
        status: 'active' as const,
        activeWorkouts: 0,
        completedSessions: 0,
        lastActivity: user.updatedAt,
        notes: '',
        emergencyContact: undefined
      }));

    // Mappatura schede assegnate per atleta (id o nome)
    const mapping: Record<string, WorkoutPlan[]> = {};
    athleteUsers.forEach(a => {
      const plans = workoutPlans.filter(p => Array.isArray((p as any).associatedAthletes) && ((p as any).associatedAthletes || []).some((val: string) => val === a.id || val === a.name));
      mapping[a.id] = plans;
    });
    setAssignedByAthlete(mapping);

    // Mappatura varianti assegnate per atleta, basata su entries in workoutPlans dell'utente es: "<planId>|variant:<variantId>"
    const variantByAthlete: Record<string, Record<string, string[]>> = {};
    athleteUsers.forEach(a => {
      const u = users.find(u => u.id === a.id || u.name === a.name);
      const entries = Array.isArray((u as any)?.workoutPlans) ? ((u as any).workoutPlans as string[]) : [];
      const varMap: Record<string, string[]> = {};
      entries.forEach(s => {
        if (typeof s === 'string' && s.includes('|variant:')) {
          const [planId, variantPart] = s.split('|variant:');
          const variantId = variantPart?.trim();
          if (planId && variantId) {
            if (!varMap[planId]) varMap[planId] = [];
            if (!varMap[planId].includes(variantId)) varMap[planId].push(variantId);
          }
        }
      });
      variantByAthlete[a.id] = varMap;
    });

    // Costruisci elenco assegnazioni per ogni atleta: piano + varianti assegnate
    const assignedEntries: Record<string, { plan: WorkoutPlan; assignedVariants: WorkoutVariant[]; originalAssigned: boolean }[]> = {};
    athleteUsers.forEach(a => {
      const varMap = variantByAthlete[a.id] || {};
      const planSet = new Set<string>();
      (mapping[a.id] || []).forEach(p => planSet.add(p.id));
      Object.keys(varMap).forEach(pid => planSet.add(pid));
      assignedEntries[a.id] = Array.from(planSet).map(planId => {
        const plan = workoutPlans.find(p => p.id === planId) || (mapping[a.id] || []).find(p => p.id === planId);
        if (!plan) {
          return null as any;
        }
        const variantIds = varMap[planId] || [];
        const assignedVariants = (plan.variants || []).filter(v => variantIds.includes(v.id));
        const originalAssigned = !!((mapping[a.id] || []).some(p => p.id === planId));
        return { plan, assignedVariants, originalAssigned };
      }).filter(Boolean) as { plan: WorkoutPlan; assignedVariants: WorkoutVariant[]; originalAssigned: boolean }[];
    });
    setAssignedEntriesByAthlete(assignedEntries);

    // Aggiorna conteggi nelle card atleti
    const withCounts = athleteUsers.map(a => ({
      ...a,
      activeWorkouts: (mapping[a.id]?.length) || 0
    }));
    setAthletes(withCounts);
  }, [users, workoutPlans]);

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

  useEffect(() => {
    const onScroll = () => {
      setShowCompactTitle(window.scrollY > 60);
      const headerEl = document.querySelector('header');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
    };
    const onResize = () => {
      const headerEl = document.querySelector('header');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
    };
    const initHeader = () => {
      const headerEl = document.querySelector('header');
      if (headerEl) setHeaderHeight(headerEl.getBoundingClientRect().height);
    };
    initHeader();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  const toggleMenu = (key: string) => setOpenMenuKey(prev => (prev === key ? null : key));

  const openAssignedMenu = (athleteId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setAssignedMenuOpen({ athleteId, rect });
  };
  const closeAssignedMenu = () => setAssignedMenuOpen({ athleteId: null, rect: null });

  // Aggiorna elenco quando cambiano associazioni (evento globale)
  useEffect(() => {
    const handler = () => {
      try { refetchPlans(); } catch {}
    };
    window.addEventListener('kw8:user-workouts:update', handler as EventListener);
    return () => {
      window.removeEventListener('kw8:user-workouts:update', handler as EventListener);
    };
  }, [refetchPlans]);

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

  // Suggerimenti ricerca intelligente (atleti, schede e varianti assegnate)
  type SmartSuggestion = {
    type: 'athlete' | 'workout' | 'variant';
    id: string;
    label: string;
    athleteId?: string;
    parentLabel?: string;
  };
  const getSmartSearchSuggestions = (): SmartSuggestion[] => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    const suggestions: SmartSuggestion[] = [];

    // Atleti matching
    const matchedAthletes = athletes.filter(a =>
      a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
    );
    matchedAthletes.forEach(a => {
      suggestions.push({ type: 'athlete', id: a.id, label: a.name });
      const entries = assignedEntriesByAthlete[a.id] || [];
      entries.forEach(({ plan, assignedVariants }) => {
        if (plan.name.toLowerCase().includes(q)) {
          suggestions.push({ type: 'workout', id: plan.id, label: plan.name, athleteId: a.id });
        }
        (assignedVariants || []).forEach(v => {
          if (v.name.toLowerCase().includes(q)) {
            suggestions.push({ type: 'variant', id: v.id, label: v.name, athleteId: a.id, parentLabel: plan.name });
          }
        });
      });
    });

    return suggestions.slice(0, 12);
  };

  const handleEditAthlete = (athlete: Athlete) => {
    setSelectedAthlete(athlete);
    // Precompila i campi del modal di modifica
    const parts = (athlete.name || '').trim().split(' ');
    setEditFirstName(parts[0] || '');
    setEditLastName(parts.slice(1).join(' ') || '');
    setEditEmail(athlete.email || '');
    setEditPhone(athlete.phone || '');
    setShowEditModal(true);
  };

  const handleDeleteAthleteClick = (athlete: Athlete) => {
    setDeleteTarget(athlete);
    setShowDeleteConfirm(true);
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

  const handleSaveEditAthlete = async () => {
    if (!selectedAthlete) return;
    const name = `${editFirstName.trim()} ${editLastName.trim()}`.trim();
    const athleteData: Partial<FirestoreUser> = {
      name,
      email: editEmail.trim(),
      phone: editPhone.trim() || undefined,
    };
    try {
      await updateUser(selectedAthlete.id, athleteData);
      setShowEditModal(false);
      setSelectedAthlete(null);
    } catch (error) {
      console.error('Errore nell\'aggiornamento dell\'atleta:', error);
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
          onLogout={onLogout}
          showAuthButtons={false}
          isDashboard={true}
          currentPage={'athlete-manager'}
        />
        <div className="pt-0 flex items-center justify-center min-h-[60vh]">
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
          onLogout={onLogout}
          showAuthButtons={false}
          isDashboard={true}
          currentPage={'athlete-manager'}
        />
        <div className="pt-0 flex items-center justify-center min-h-[60vh]">
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
        onLogout={onLogout}
        showAuthButtons={false}
        isDashboard={true}
        currentPage={'athlete-manager'}
      />
      {/* Titolo a comparsa rimosso su richiesta */}
      
      <div className="pt-0" style={{ paddingTop: isStandaloneMobile ? (headerHeight || 80) : undefined }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Titolo pagina: rimosso sfondo/bordi, centrato */}
          {!isStandaloneMobile && (
            <div style={{ paddingTop: headerHeight || 80 }} className="mb-2">
              <div className="w-full">
                <div className="relative flex items-center justify-center">
                  <button
                    onClick={() => onNavigate('coach-dashboard')}
                    className="absolute left-0 inline-flex items-center justify-center transition-all duration-300 transform hover:scale-110 p-2 bg-white ring-1 ring-black/10 rounded-2xl shadow-sm hover:bg-white active:scale-[0.98] shrink-0"
                    title="Torna alla Dashboard Coach"
                    aria-label="Torna alla Dashboard Coach"
                  >
                    <ChevronLeft size={20} className="block text-black" />
                  </button>
                  <h2 className="font-sfpro text-base sm:text-lg font-bold text-gray-900 tracking-tight text-center">Gestione atleti</h2>
                </div>
              </div>
            </div>
          )}


          {/* Barra di ricerca smart: inline su desktop, via Portal sotto titolo su PWA */}
          <div className="w-full mb-6">
            {isStandaloneMobile ? (
              <Portal containerId="pwa-athlete-manager-search">
                <div
                  className="relative w-full rounded-2xl bg-white/70 backdrop-blur-sm ring-1 ring-black/10 shadow-sm"
                  ref={(el) => {
                    searchDropdownRef.current = el;
                    (triggerRef as any).current = el as any;
                  }}
                >
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Cerca atleti, schede e varianti..."
                    value={searchTerm}
                    onChange={(e) => {
                      const value = e.target.value;
                      setSearchTerm(value);
                      setShowSearchSuggestions(!!value);
                    }}
                    onFocus={() => {
                      if (searchTerm.trim().length > 0) {
                        setShowSearchSuggestions(true);
                      }
                      openDropdown();
                    }}
                    onBlur={() => {
                      const container = searchDropdownRef.current;
                      setTimeout(() => {
                        if (!container) { setShowSearchSuggestions(false); closeDropdown(); return; }
                        if (!document.activeElement || !container.contains(document.activeElement)) {
                          setShowSearchSuggestions(false);
                          closeDropdown();
                        }
                      }, 150);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        e.stopPropagation();
                      }
                    }}
                    className="w-full pl-10 pr-10 py-2 rounded-2xl bg-transparent focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-red-500"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 transition-colors"
                      aria-label="Pulisci ricerca"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSearchTerm('');
                        setShowSearchSuggestions(false);
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                  {showSearchSuggestions && searchTerm.trim().length > 0 && isOpen && (
                    <div
                      ref={dropdownRef as any}
                      className="absolute top-full left-0 mt-2 bg-white/95 border border-gray-200 rounded-xl ring-1 ring-black/10 shadow-md z-[1000] max-h-64 overflow-y-auto backdrop-blur-sm pointer-events-auto"
                      style={{
                        width: (triggerRef.current as any) ? (triggerRef.current as any).getBoundingClientRect().width : undefined,
                        maxWidth: 'calc(100vw - 32px)'
                      }}
                    >
                      {getSmartSearchSuggestions().length > 0 ? (
                        getSmartSearchSuggestions().map((s, idx) => {
                          const lower = s.label.toLowerCase();
                          const q = searchTerm.toLowerCase();
                          const mi = lower.indexOf(q);
                          const before = mi >= 0 ? s.label.slice(0, mi) : s.label;
                          const match = mi >= 0 ? s.label.slice(mi, mi + q.length) : '';
                          const after = mi >= 0 ? s.label.slice(mi + q.length) : '';
                          return (
                            <button
                              type="button"
                              key={`${s.type}-${s.id}-${idx}`}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (s.type === 'athlete') {
                                  setSearchTerm(s.label);
                                  const row = document.querySelector(`li[data-athlete-id="${s.id}"]`);
                                  if (row) (row as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                                } else {
                                  const triggerBtn = document.querySelector(`button[data-assigned-menu-trigger="${s.athleteId}"]`);
                                  if (triggerBtn) {
                                    const rect = (triggerBtn as HTMLElement).getBoundingClientRect();
                                    setAssignedMenuOpen({ athleteId: s.athleteId!, rect });
                                  }
                                }
                                setShowSearchSuggestions(false);
                                closeDropdown();
                              }}
                            >
                              {s.type === 'athlete' ? (
                                <UserIcon size={16} className="text-gray-500" />
                              ) : s.type === 'workout' ? (
                                <FileText size={16} className="text-gray-500" />
                              ) : (
                                <Copy size={16} className="text-red-500" />
                              )}
                              <span className="flex-1 text-sm">
                                {mi >= 0 ? (
                                  <>
                                    {before}
                                    <mark className="bg-yellow-100 text-gray-900 rounded px-0.5">{match}</mark>
                                    {after}
                                  </>
                                ) : (
                                  s.label
                                )}
                              </span>
                              {s.type !== 'athlete' && s.parentLabel && (
                                <span className="text-xs text-gray-500">({s.parentLabel})</span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">Nessun risultato per "{searchTerm}"</div>
                      )}
                    </div>
                  )}
                </div>
              </Portal>
            ) : (
              <div
                className="relative w-full"
                ref={(el) => {
                  searchDropdownRef.current = el;
                  (triggerRef as any).current = el as any;
                }}
              >
                <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="Cerca atleti, schede e varianti..."
                  value={searchTerm}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearchTerm(value);
                    setShowSearchSuggestions(!!value);
                  }}
                  onFocus={() => {
                    if (searchTerm.trim().length > 0) {
                      setShowSearchSuggestions(true);
                    }
                    openDropdown();
                  }}
                  onBlur={() => {
                    const container = searchDropdownRef.current;
                    setTimeout(() => {
                      if (!container) { setShowSearchSuggestions(false); closeDropdown(); return; }
                      if (!document.activeElement || !container.contains(document.activeElement)) {
                        setShowSearchSuggestions(false);
                        closeDropdown();
                      }
                    }, 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                    }
                  }}
                  className="w-full pl-10 pr-10 py-2 rounded-2xl bg-white/60 backdrop-blur-sm ring-1 ring-black/10 shadow-sm focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-red-500 hover:bg-white/70"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-600 transition-colors"
                    aria-label="Pulisci ricerca"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSearchTerm('');
                      setShowSearchSuggestions(false);
                    }}
                  >
                    <X size={16} />
                  </button>
                )}
                {showSearchSuggestions && searchTerm.trim().length > 0 && isOpen && (
                  <div
                    ref={dropdownRef as any}
                    className="absolute top-full left-0 mt-2 bg-white/95 border border-gray-200 rounded-xl ring-1 ring-black/10 shadow-md z-[1000] max-h-64 overflow-y-auto backdrop-blur-sm pointer-events-auto"
                    style={{
                      width: (triggerRef.current as any) ? (triggerRef.current as any).getBoundingClientRect().width : undefined,
                      maxWidth: 'calc(100vw - 32px)'
                    }}
                  >
                    {getSmartSearchSuggestions().length > 0 ? (
                      getSmartSearchSuggestions().map((s, idx) => {
                        const lower = s.label.toLowerCase();
                        const q = searchTerm.toLowerCase();
                        const mi = lower.indexOf(q);
                        const before = mi >= 0 ? s.label.slice(0, mi) : s.label;
                        const match = mi >= 0 ? s.label.slice(mi, mi + q.length) : '';
                        const after = mi >= 0 ? s.label.slice(mi + q.length) : '';
                        return (
                          <button
                            type="button"
                            key={`${s.type}-${s.id}-${idx}`}
                            className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (s.type === 'athlete') {
                                setSearchTerm(s.label);
                                const row = document.querySelector(`li[data-athlete-id="${s.id}"]`);
                                if (row) (row as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
                              } else {
                                const triggerBtn = document.querySelector(`button[data-assigned-menu-trigger="${s.athleteId}"]`);
                                if (triggerBtn) {
                                  const rect = (triggerBtn as HTMLElement).getBoundingClientRect();
                                  setAssignedMenuOpen({ athleteId: s.athleteId!, rect });
                                }
                              }
                              setShowSearchSuggestions(false);
                              closeDropdown();
                            }}
                          >
                            {s.type === 'athlete' ? (
                              <UserIcon size={16} className="text-gray-500" />
                            ) : s.type === 'workout' ? (
                              <FileText size={16} className="text-gray-500" />
                            ) : (
                              <Copy size={16} className="text-red-500" />
                            )}
                            <span className="flex-1 text-sm">
                              {mi >= 0 ? (
                                <>
                                  {before}
                                  <mark className="bg-yellow-100 text-gray-900 rounded px-0.5">{match}</mark>
                                  {after}
                                </>
                              ) : (
                                s.label
                              )}
                            </span>
                            {s.type !== 'athlete' && s.parentLabel && (
                              <span className="text-xs text-gray-500">({s.parentLabel})</span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">Nessun risultato per "{searchTerm}"</div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lista atleti */}
          <div className="bg-white/70 backdrop-blur rounded-2xl shadow-sm overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Atleti ({filteredAthletes.length})
              </h3>
            </div>
            
            <div>
              <ul className="divide-y divide-gray-200">
                {filteredAthletes.slice(0, visibleCount).map((athlete) => (
                  <li key={athlete.id} data-athlete-id={athlete.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-blue-900 rounded-full flex items-center justify-center text-white font-bold">
                        {athlete.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{athlete.name}</div>
                        <div className="mt-1 text-xs text-gray-600">
                          {athlete.email}{athlete.phone ? ` • ${athlete.phone}` : ''}
                        </div>
                        {/* Anteprima schede rimossa su richiesta */}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* Bottone scheda: apre menu con tutte le assegnazioni per l'atleta con badge numero */}
                      <button
                        data-assigned-menu-trigger={athlete.id}
                        onClick={(e) => openAssignedMenu(athlete.id, e)}
                        className="relative bg-transparent rounded-md flex items-center justify-center cursor-pointer transition shrink-0 text-gray-600 hover:text-red-600"
                        title="Schede assegnate"
                        aria-label="Schede assegnate"
                        style={{ width: 'clamp(26px, 6vw, 30px)', height: 'clamp(26px, 6vw, 30px)' }}
                      >
                        <FileText size={18} className="" />
                        <span className="absolute -top-0.5 -right-0.5 text-[10px] leading-none text-gray-700">{athlete.activeWorkouts || 0}</span>
                      </button>
                      <button
                        onClick={() => handleEditAthlete(athlete)}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                        title="Modifica"
                      >
                        <Edit3 size={16} />
                      </button>
                      {/* Spostato Elimina nel modal di modifica; rimosso da riga elenco */}
                      {/* Rimosso tasto Dettagli su richiesta */}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {visibleCount < filteredAthletes.length && (
              <div ref={listEndRef} className="py-4 flex items-center justify-center">
                <span className="text-sm text-gray-500">Carico altri atleti…</span>
              </div>
            )}

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

      {/* Menu assegnazioni per atleta (dropdown ancorato al bottone scheda) */}
      {assignedMenuOpen.athleteId && assignedMenuOpen.rect && (
        <div>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            className="bg-black/10"
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); closeAssignedMenu(); }}
            onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); closeAssignedMenu(); }}
          />
          {(() => {
            const dropdownWidth = 18 * 16; // w-72
            const rect = assignedMenuOpen.rect!;
            // Allinea il dropdown al trigger (ancorato a sinistra del bottone), con clamp ai bordi
            let left = Math.max(8, Math.min(rect.left, window.innerWidth - dropdownWidth - 8));
            // Calcola spazio disponibile sotto e sopra il trigger
            const availableBelow = Math.max(0, window.innerHeight - rect.bottom - 8);
            const defaultTop = rect.bottom + 8;
            let top = defaultTop;
            let maxHeight = 384; // px (tailwind max-h-96)
            if (availableBelow < 220) {
              // Poco spazio sotto: apri verso l'alto e limita altezza
              maxHeight = Math.min(384, Math.max(160, rect.top - 16));
              top = Math.max(8, rect.top - maxHeight);
            } else {
              // Sufficiente spazio sotto: limita altezza per evitare overflow
              maxHeight = Math.min(384, Math.max(160, window.innerHeight - defaultTop - 16));
            }
            const pos = assignedMenuPosition ?? { left, top, maxHeight };
            const entries = assignedEntriesByAthlete[assignedMenuOpen.athleteId!] || [];
            return (
              <div
                ref={assignedMenuRef}
                className="dropdown-menu w-72 bg-white/95 backdrop-blur-md border border-gray-200 shadow-lg rounded-xl p-2 overflow-y-auto"
                style={{ position: 'fixed', left: pos.left, top: pos.top, maxHeight: pos.maxHeight, visibility: 'visible', zIndex: 9999 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-700">Schede e varianti assegnate</p>
                </div>
                <div className="py-2">
                  {entries.length > 0 ? (
                    entries.map(({ plan, assignedVariants, originalAssigned }, idx) => (
                      <div key={`${plan.id}-${idx}`} className="px-3 py-2 text-sm text-gray-800 rounded-lg">
                        <div className="flex items-center justify-between gap-2">
                          <div
                            className="flex items-center gap-2 text-left flex-1 rounded-md px-2 py-1 cursor-default"
                          >
                            <FileText size={16} className="text-gray-500" />
                            <span className="font-medium">{plan.name}</span>
                          </div>
                          {assignedVariants && assignedVariants.length > 0 && (
                            <button
                              type="button"
                              aria-label="Espandi varianti"
                              className="p-1 rounded hover:bg-black/5"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setVariantsExpandedForPlan(prev => ({ ...prev, [plan.id]: !prev[plan.id] }));
                              }}
                            >
                              <ChevronDown size={14} className={`transition-transform ${variantsExpandedForPlan[plan.id] ? 'rotate-180' : ''}`} />
                            </button>
                          )}
                        </div>
                        {/* Rimosso 'Apri originale' per evitare modifica schede dal menu */}
                        {assignedVariants && assignedVariants.length > 0 && variantsExpandedForPlan[plan.id] && (
                          <div className="mt-1 pl-0 space-y-1">
                            {assignedVariants.map(v => (
                              <div
                                key={v.id}
                                className="flex items-center gap-2 text-xs text-gray-700 w-full text-left rounded-md px-2 py-1 cursor-default"
                              >
                                <FileText size={14} className="text-red-600" />
                                <span>{v.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">Nessuna scheda assegnata</div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Modal dettagli atleta (riutilizza componente Modal per coerenza) */}
      <Modal isOpen={!!showDetailModal && !!selectedAthlete} onClose={() => setShowDetailModal(false)} title={isEditing ? 'Modifica Atleta' : 'Dettagli Atleta'}>
        {selectedAthlete && (
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
                    <div className="text-sm text-gray-900">{calculateAge(selectedAthlete.birthDate)} anni</div>
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
                  <div className={`text-xl font-bold ${selectedAthlete.status === 'active' ? 'text-green-600' : selectedAthlete.status === 'inactive' ? 'text-yellow-600' : 'text-red-600'}`}>{getStatusText(selectedAthlete.status)}</div>
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
                  handleEditAthlete(selectedAthlete);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Modifica
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal aggiungi atleta */}
      <Modal isOpen={showAddModal} onClose={closeAllModals} title="Nuovo Atleta">
        <AthleteForm
          onSave={handleCreateAthlete}
          onCancel={closeAllModals}
        />
      </Modal>

      {/* Modal modifica atleta: campi allineati alla registrazione (Nome, Cognome, Email, Telefono) */}
      <Modal isOpen={!!showEditModal && !!selectedAthlete} onClose={closeAllModals} title="Modifica Atleta">
        {selectedAthlete && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Mario"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
                <input
                  type="text"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Rossi"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero di telefono</label>
              <input
                type="tel"
                inputMode="tel"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="+39 333 1234567"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="nome@esempio.com"
              />
            </div>
            <div className="grid grid-cols-[auto,1px,auto] items-center pt-4 border-t border-black/10 gap-4">
              <div>
                <button
                  onClick={() => { closeAllModals(); if (selectedAthlete) handleDeleteAthleteClick(selectedAthlete); }}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  title="Elimina atleta"
                >
                  Elimina atleta
                </button>
              </div>
              <div className="h-6 w-px bg-black/10" aria-hidden="true" />
              <div className="flex items-center space-x-3">
                <button
                  onClick={closeAllModals}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleSaveEditAthlete}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

  {/* Modal importa atleti */}
  <Modal isOpen={showImportModal} onClose={closeAllModals} title="Importa Atleti">
    <AthleteImport
      onImport={handleImportAthletes}
      onCancel={closeAllModals}
    />
  </Modal>

  {/* Modal conferma eliminazione atleta - stile Apple coerente con Gestione schede */}
  <Modal
    isOpen={!!showDeleteConfirm && !!deleteTarget}
    onClose={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
    title="Elimina Atleta"
    variant="centered"
  >
    {deleteTarget && (
      <div>
        <p className="text-gray-600 mb-6">
          Sei sicuro di voler eliminare "{deleteTarget.name}"?
        </p>
        <div className="flex space-x-3">
          <button
            onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={async () => {
              if (!deleteTarget) return;
              try { await deleteUser(deleteTarget.id); } catch (err) { console.error('Eliminazione atleta fallita', err); }
              setShowDeleteConfirm(false); setDeleteTarget(null);
            }}
            className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Elimina
          </button>
        </div>
      </div>
    )}
  </Modal>
    </div>
  );
};

export default AthleteManagerPage;
