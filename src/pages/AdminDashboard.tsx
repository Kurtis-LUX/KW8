import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Search, Plus, Edit, Trash2, Download, Upload, User as UserIcon, FileText, CheckCircle, XCircle, X, ChevronUp, ChevronDown, Grid, List, Copy, Filter, SortAsc, SortDesc, Play, Image, Music, Tag, Calendar, Clock, Target, Star, Eye, EyeOff, GripVertical, Folder, FolderOpen, FolderPlus, Settings, Home, Briefcase, Heart, Zap, Shield, Award, Book, Users, Activity } from 'lucide-react';
import DB, { User, WorkoutPlan, Exercise, WorkoutFolder } from '../utils/database';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser: User | null;
}

// Componente Loading
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
    <span className="ml-4 text-lg text-navy-700">Caricamento...</span>
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, currentUser }) => {
  // Stati principali
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [athletes, setAthletes] = useState<User[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [workoutFolders, setWorkoutFolders] = useState<WorkoutFolder[]>([]);
  
  // Stati UI
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'athletes' | 'workouts' | 'statistics'>('athletes');
  
  // Stati modali
  const [showAthleteModal, setShowAthleteModal] = useState<boolean>(false);
  const [showWorkoutPlanModal, setShowWorkoutPlanModal] = useState<boolean>(false);
  const [showAssignModal, setShowAssignModal] = useState<boolean>(false);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [showDeleteWorkoutModal, setShowDeleteWorkoutModal] = useState<boolean>(false);
  const [showFolderModal, setShowFolderModal] = useState<boolean>(false);
  const [showDeleteFolderModal, setShowDeleteFolderModal] = useState<boolean>(false);
  
  // Stati filtri
  const [showAthleteFilters, setShowAthleteFilters] = useState<boolean>(false);
  const [showWorkoutFilters, setShowWorkoutFilters] = useState<boolean>(false);
  
  // Stati selezioni
  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(null);
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [athleteToDelete, setAthleteToDelete] = useState<string | null>(null);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  const [folderToDelete, setFolderToDelete] = useState<string | null>(null);
  
  // Stati per interfaccia schede
  const [workoutViewMode, setWorkoutViewMode] = useState<'grid' | 'list'>('grid');
  const [draggedWorkout, setDraggedWorkout] = useState<string | null>(null);
  const [workoutSortBy, setWorkoutSortBy] = useState<'name' | 'date' | 'order' | 'status'>('order');
  const [workoutSortOrder, setWorkoutSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Stati navigazione cartelle
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderHistory, setFolderHistory] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<{type: 'workout' | 'folder', id: string} | null>(null);
  
  // Stati statistiche
  const [selectedMonth, setSelectedMonth] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [showMembershipDetails, setShowMembershipDetails] = useState<boolean>(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState<boolean>(false);
  const [showRevenueDetails, setShowRevenueDetails] = useState<boolean>(false);
  
  // Stati filtri
  const [filters, setFilters] = useState({
    paymentStatus: { paid: false, pending: false },
    membershipStatus: { active: false, pending: false },
    gender: { M: false, F: false },
    certificatoMedico: { presente: false, mancante: false },
    workoutPlan: {
      athlete: '',
      coach: ''
    }
  });
  
  const [workoutFilters, setWorkoutFilters] = useState({
    status: '',
    category: '',
    difficulty: '',
    coach: ''
  });
  
  // Form states
  const [athleteForm, setAthleteForm] = useState({
    id: '',
    name: '',
    email: '',
    birthDate: '',
    gender: 'M' as 'M' | 'F',
    fiscalCode: '',
    birthPlace: '',
    address: '',
    notes: '',
    paymentStatus: 'pending' as 'paid' | 'pending',
    lastPaymentDate: '',
    membershipStatus: 'pending' as 'active' | 'pending',
    membershipDate: '',
    membershipFilePath: '',
    invoiceFilePath: '',
    certificatoMedico: false,
    certificatoMedicoFile: ''
  });
  
  const [workoutPlanForm, setWorkoutPlanForm] = useState({
    id: '',
    name: '',
    description: '',
    coach: '',
    duration: 30,
    startDate: '',
    userId: '',
    difficulty: 1,
    tags: '',
    exercises: [{ id: '', name: '', sets: 3, reps: 10, rest: 60, description: '' }]
  });
  
  const [folderForm, setFolderForm] = useState({
    id: '',
    name: '',
    icon: 'Folder',
    parentId: '',
    order: 0
  });
  
  // Caricamento dati iniziale
  useEffect(() => {
    const initializeData = async () => {
      try {
        setIsLoading(true);
        
        // Verifica autorizzazioni
        if (!currentUser || currentUser.role !== 'admin') {
          onNavigate('home');
          return;
        }
        
        await loadData();
      } catch (error) {
        console.error('Errore durante il caricamento dei dati:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [currentUser, onNavigate]);
  
  // Funzione per caricare i dati dal database
  const loadData = async (): Promise<void> => {
    try {
      // Carica tutti gli atleti
      const allUsers = DB.getUsers();
      const athleteUsers = allUsers.filter(user => user.role === 'atleta');
      setAthletes(athleteUsers);
      
      // Carica tutte le schede di allenamento
      const allWorkoutPlans = DB.getWorkoutPlans();
      setWorkoutPlans(allWorkoutPlans);
      
      // Carica tutte le cartelle
      const allFolders = DB.getWorkoutFolders();
      setWorkoutFolders(allFolders);
    } catch (error) {
      console.error('Errore durante il caricamento dei dati:', error);
      throw error;
    }
  };
  
  // Gestione click fuori dai dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.filter-dropdown')) {
        setShowAthleteFilters(false);
        setShowWorkoutFilters(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Gestione cambiamenti form atleta
  const handleAthleteFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAthleteForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Validazione form atleta
  const validateAthleteForm = (): boolean => {
    const requiredFields = ['name', 'email', 'birthDate', 'gender', 'fiscalCode', 'birthPlace', 'address', 'paymentStatus', 'membershipStatus'];
    const missingFields = requiredFields.filter(field => !athleteForm[field as keyof typeof athleteForm]);
    
    if (missingFields.length > 0) {
      alert('I seguenti campi sono obbligatori: ' + missingFields.join(', '));
      return false;
    }
    return true;
  };
  
  // Funzioni modali
  const openNewAthleteModal = useCallback(() => {
    setAthleteForm({
      id: '',
      name: '',
      email: '',
      birthDate: '',
      gender: 'M',
      fiscalCode: '',
      birthPlace: '',
      address: '',
      notes: '',
      paymentStatus: 'pending',
      lastPaymentDate: '',
      membershipStatus: 'pending',
      membershipDate: '',
      membershipFilePath: '',
      invoiceFilePath: '',
      certificatoMedico: false,
      certificatoMedicoFile: ''
    });
    setSelectedAthlete(null);
    setShowAthleteModal(true);
  }, []);
  
  const openEditAthleteModal = useCallback((athlete: User) => {
    setAthleteForm({
      id: athlete.id,
      name: athlete.name,
      email: athlete.email,
      birthDate: athlete.birthDate || '',
      gender: athlete.gender || 'M',
      fiscalCode: athlete.fiscalCode || '',
      birthPlace: athlete.birthPlace || '',
      address: athlete.address || '',
      notes: athlete.notes || '',
      paymentStatus: athlete.paymentStatus || 'pending',
      lastPaymentDate: athlete.lastPaymentDate || '',
      membershipStatus: athlete.membershipStatus || 'pending',
      membershipDate: athlete.membershipDate || '',
      membershipFilePath: athlete.membershipFilePath || '',
      invoiceFilePath: athlete.invoiceFilePath || '',
      certificatoMedico: athlete.certificatoMedico || false,
      certificatoMedicoFile: athlete.certificatoMedicoFile || ''
    });
    setSelectedAthlete(athlete);
    setShowAthleteModal(true);
  }, []);
  
  const openNewWorkoutPlanModal = useCallback(() => {
    setWorkoutPlanForm({
      id: '',
      name: '',
      description: '',
      coach: '',
      duration: 30,
      startDate: '',
      userId: '',
      difficulty: 1,
      tags: '',
      exercises: [{ id: '', name: '', sets: 3, reps: 10, rest: 60, description: '' }]
    });
    setSelectedWorkoutPlan(null);
    setShowWorkoutPlanModal(true);
  }, []);
  
  const openEditWorkoutPlanModal = useCallback((plan: WorkoutPlan) => {
    setWorkoutPlanForm({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      coach: plan.coach,
      duration: plan.duration,
      startDate: plan.startDate,
      userId: plan.userId,
      difficulty: plan.difficulty || 1,
      tags: plan.tags ? plan.tags.join(', ') : '',
      exercises: plan.exercises
    });
    setSelectedWorkoutPlan(plan);
    setShowWorkoutPlanModal(true);
  }, []);
  
  const openAssignModal = useCallback((athlete: User) => {
    setSelectedAthlete(athlete);
    setShowAssignModal(true);
  }, []);
  
  // Funzioni CRUD
  const saveAthlete = async (): Promise<void> => {
    try {
      if (!validateAthleteForm()) {
        return;
      }
      
      const newAthlete: User = {
        id: athleteForm.id || `user-${Date.now()}`,
        email: athleteForm.email,
        name: athleteForm.name,
        password: selectedAthlete?.password || 'defaultPassword123',
        role: 'atleta',
        workoutPlans: selectedAthlete?.workoutPlans || [],
        birthDate: athleteForm.birthDate,
        gender: athleteForm.gender,
        fiscalCode: athleteForm.fiscalCode,
        birthPlace: athleteForm.birthPlace,
        address: athleteForm.address,
        notes: athleteForm.notes,
        paymentStatus: athleteForm.paymentStatus,
        lastPaymentDate: athleteForm.paymentStatus === 'paid' && !athleteForm.lastPaymentDate 
          ? new Date().toISOString().split('T')[0] 
          : athleteForm.paymentStatus === 'pending' ? '' : athleteForm.lastPaymentDate,
        membershipStatus: athleteForm.membershipStatus,
        membershipDate: athleteForm.membershipDate,
        membershipFilePath: athleteForm.membershipFilePath,
        invoiceFilePath: athleteForm.invoiceFilePath,
        certificatoMedico: athleteForm.certificatoMedico,
        certificatoMedicoFile: athleteForm.certificatoMedicoFile
      };
      
      DB.saveUser(newAthlete);
      setShowAthleteModal(false);
      await loadData();
    } catch (error) {
      console.error('Errore durante il salvataggio dell\'atleta:', error);
    }
  };
  
  const saveWorkoutPlan = async (): Promise<void> => {
    try {
      const isNewPlan = !workoutPlanForm.id;
      const now = new Date().toISOString();
      
      const newWorkoutPlan: WorkoutPlan = {
        id: workoutPlanForm.id || `workout-${Date.now()}`,
        name: workoutPlanForm.name,
        description: workoutPlanForm.description,
        coach: workoutPlanForm.coach,
        duration: workoutPlanForm.duration,
        startDate: workoutPlanForm.startDate,
        userId: workoutPlanForm.userId || '',
        exercises: workoutPlanForm.exercises,
        category: 'strength',
        status: 'draft',
        mediaFiles: {
          images: [],
          videos: [],
          audio: []
        },
        tags: workoutPlanForm.tags ? workoutPlanForm.tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        order: isNewPlan ? workoutPlans.length : (workoutPlans.find(p => p.id === workoutPlanForm.id)?.order || 0),
        createdAt: isNewPlan ? now : (workoutPlans.find(p => p.id === workoutPlanForm.id)?.createdAt || now),
        updatedAt: now,
        difficulty: workoutPlanForm.difficulty || 1,
        targetMuscles: []
      };
      
      DB.saveWorkoutPlan(newWorkoutPlan);
      
      // Assegna automaticamente la scheda se è stato selezionato un atleta
      if (workoutPlanForm.userId) {
        const selectedAthleteData = athletes.find(athlete => athlete.id === workoutPlanForm.userId);
        
        if (selectedAthleteData) {
          const updatedAthlete = { ...selectedAthleteData };
          
          if (!updatedAthlete.workoutPlans.includes(newWorkoutPlan.id)) {
            updatedAthlete.workoutPlans.push(newWorkoutPlan.id);
            DB.saveUser(updatedAthlete);
          }
        }
      }
      
      setShowWorkoutPlanModal(false);
      setSelectedWorkoutPlan(null);
      setWorkoutPlanForm({
        id: '',
        name: '',
        description: '',
        coach: '',
        duration: 30,
        startDate: '',
        userId: '',
        difficulty: 1,
        tags: '',
        exercises: [{ id: '', name: '', sets: 3, reps: 10, rest: 60, description: '' }]
      });
      await loadData();
    } catch (error) {
      console.error('Errore durante il salvataggio della scheda:', error);
    }
  };
  
  // funzione rimossa - eliminazione atleti non più consentita
  // const deleteAthlete = useCallback((athleteId: string) => {
  //   setAthleteToDelete(athleteId);
  //   setShowDeleteModal(true);
  // }, []);
  
  // const confirmDeleteAthlete = async (): Promise<void> => {
  //   try {
  //     if (athleteToDelete) {
  //       DB.deleteUser(athleteToDelete);
  //       await loadData();
  //       setShowDeleteModal(false);
  //       setAthleteToDelete(null);
  //     }
  //   } catch (error) {
  //     console.error('Errore durante l\'eliminazione dell\'atleta:', error);
  //   }
  // };
  
  const deleteWorkoutPlan = useCallback((workoutPlanId: string) => {
    setWorkoutToDelete(workoutPlanId);
    setShowDeleteWorkoutModal(true);
  }, []);
  
  const confirmDeleteWorkoutPlan = async (): Promise<void> => {
    try {
      if (workoutToDelete) {
        DB.deleteWorkoutPlan(workoutToDelete);
        await loadData();
        setWorkoutToDelete(null);
        setShowDeleteWorkoutModal(false);
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione della scheda:', error);
    }
  };
  
  // Funzioni filtri
  const handleFilterChange = useCallback((category: string, key: string, value: boolean) => {
    setFilters(prev => {
      const categoryFilters = prev[category as keyof typeof prev] as any;
      return {
        ...prev,
        [category]: {
          ...categoryFilters,
          [key]: value
        }
      };
    });
  }, []);
  
  const handleMembershipStatusChange = useCallback(async (athleteId: string, newStatus: 'active' | 'pending') => {
    try {
      const athlete = athletes.find(a => a.id === athleteId);
      if (athlete) {
        const updatedAthlete = {
          ...athlete,
          membershipStatus: newStatus,
          membershipDate: newStatus === 'active' ? new Date().toISOString().split('T')[0] : ''
        };
        DB.saveUser(updatedAthlete);
        await loadData();
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dello stato tesseramento:', error);
    }
  }, [athletes]);
  
  const handlePaymentStatusChange = useCallback(async (athleteId: string, newStatus: 'paid' | 'pending') => {
    try {
      const athlete = athletes.find(a => a.id === athleteId);
      if (athlete) {
        const updatedAthlete = {
          ...athlete,
          paymentStatus: newStatus,
          lastPaymentDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : ''
        };
        DB.saveUser(updatedAthlete);
        await loadData();
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento dello stato pagamento:', error);
    }
  }, [athletes]);

  const handleCertificatoMedicoChange = useCallback(async (athleteId: string, hasCertificato: boolean) => {
    try {
      const athlete = athletes.find(a => a.id === athleteId);
      if (athlete) {
        const updatedAthlete = {
          ...athlete,
          certificatoMedico: hasCertificato
        };
        DB.saveUser(updatedAthlete);
        await loadData();
      }
    } catch (error) {
      console.error('Errore durante l\'aggiornamento del certificato medico:', error);
    }
  }, [athletes]);
  
  // Funzione per reset database atleti (SOLO PER SVILUPPO)
  const resetAthleteDatabase = async (): Promise<void> => {
    try {
      if (window.confirm('ATTENZIONE: Questa operazione eliminerà TUTTI gli atleti dal database. Continuare?')) {
        // Ottieni tutti gli utenti
        const allUsers = DB.getUsers();
        
        // Filtra solo gli atleti e li elimina
        const athletesToDelete = allUsers.filter(user => user.role === 'atleta');
        
        for (const athlete of athletesToDelete) {
          DB.deleteUser(athlete.id);
        }
        
        // Ricarica i dati
        await loadData();
        
        alert(`Database reset completato. Eliminati ${athletesToDelete.length} atleti.`);
      }
    } catch (error) {
      console.error('Errore durante il reset del database:', error);
      alert('Errore durante il reset del database.');
    }
  };

  // Funzione per pulire i filtri atleti
  const clearAthleteFilters = useCallback(() => {
    setFilters({
      paymentStatus: { paid: false, pending: false },
      membershipStatus: { active: false, pending: false },
      gender: { M: false, F: false },
      certificatoMedico: { presente: false, mancante: false },
      workoutPlan: {
        athlete: '',
        coach: ''
      }
    });
    setSearchTerm('');
  }, []);
  
  // Funzione per aprire il modal di assegnazione scheda
  const openAssignWorkoutModal = useCallback((athlete: User) => {
    setSelectedAthlete(athlete);
    setWorkoutPlanForm(prev => ({
      ...prev,
      userId: athlete.id
    }));
    setShowWorkoutPlanModal(true);
  }, []);
  
  // Atleti filtrati
  const filteredAthletes = useMemo(() => {
    return athletes.filter(athlete => {
      const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           athlete.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const hasPaymentFilter = Object.values(filters.paymentStatus).some(v => v);
      const hasMembershipFilter = Object.values(filters.membershipStatus).some(v => v);
      const hasGenderFilter = Object.values(filters.gender).some(v => v);
      const hasCertificatoFilter = Object.values(filters.certificatoMedico).some(v => v);
      
      const matchesPaymentFilter = !hasPaymentFilter || filters.paymentStatus[athlete.paymentStatus as keyof typeof filters.paymentStatus];
      const matchesMembershipFilter = !hasMembershipFilter || filters.membershipStatus[athlete.membershipStatus as keyof typeof filters.membershipStatus];
      const matchesGenderFilter = !hasGenderFilter || filters.gender[athlete.gender as keyof typeof filters.gender];
      const matchesCertificatoFilter = !hasCertificatoFilter || 
        (filters.certificatoMedico.presente && athlete.certificatoMedico) ||
        (filters.certificatoMedico.mancante && !athlete.certificatoMedico);
      
      return matchesSearch && matchesPaymentFilter && matchesMembershipFilter && matchesGenderFilter && matchesCertificatoFilter;
    });
  }, [athletes, searchTerm, filters.paymentStatus, filters.membershipStatus, filters.gender, filters.certificatoMedico]);
  
  // Schede filtrate
  const filteredWorkoutPlans = useMemo(() => {
    return workoutPlans.filter(plan => {
      const matchesSearch = !searchTerm ||
        plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.coach.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCoach = !filters.workoutPlan.coach || plan.coach.toLowerCase().includes(filters.workoutPlan.coach.toLowerCase());
      const matchesAthlete = !filters.workoutPlan.athlete || athletes.some(athlete =>
        athlete.id === plan.userId && athlete.name.toLowerCase().includes(filters.workoutPlan.athlete.toLowerCase())
      );
      
      return matchesSearch && matchesCoach && matchesAthlete;
    });
  }, [workoutPlans, searchTerm, filters.workoutPlan, athletes]);
  
  // Statistiche
  const statistics = useMemo(() => {
    const targetMonth = selectedMonth.month;
    const targetYear = selectedMonth.year;
    
    const totalMembers = athletes.length;
    const registeredMembers = athletes.filter(athlete => athlete.membershipStatus === 'active');
    const unregisteredMembers = athletes.filter(athlete => athlete.membershipStatus === 'pending');
    
    const paidThisMonth = athletes.filter(athlete => {
      if (!athlete.lastPaymentDate) return false;
      const paymentDate = new Date(athlete.lastPaymentDate);
      return paymentDate.getMonth() + 1 === targetMonth && paymentDate.getFullYear() === targetYear;
    });
    
    const unpaidThisMonth = athletes.filter(athlete => {
      if (!athlete.lastPaymentDate) return true;
      const paymentDate = new Date(athlete.lastPaymentDate);
      return !(paymentDate.getMonth() + 1 === targetMonth && paymentDate.getFullYear() === targetYear);
    });
    
    const monthlyRevenue = paidThisMonth.length * 50;
    
    return {
      totalMembers,
      registeredMembers,
      unregisteredMembers,
      paidThisMonth,
      unpaidThisMonth,
      monthlyRevenue
    };
  }, [athletes, selectedMonth.month, selectedMonth.year]);
  
  // Funzioni utilità
  const getMonthName = (month: number): string => {
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return months[month - 1];
  };
  
  // Mostra loading se i dati non sono ancora caricati
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center space-x-2 text-navy-900 hover:text-red-600 transition-colors duration-300"
          >
            <ArrowLeft size={24} />
            <span className="font-semibold">Torna alla home</span>
          </button>
          
          <h1 className="text-3xl md:text-4xl font-bold text-navy-900">Dashboard Admin</h1>
          
          <div className="w-24"></div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mb-8 bg-gray-100 p-1 rounded-lg max-w-2xl mx-auto">
          <button
            onClick={() => setActiveTab('athletes')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'athletes'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            Atleti
          </button>
          <button
            onClick={() => setActiveTab('workouts')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'workouts'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            Schede
          </button>
          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-300 ${
              activeTab === 'statistics'
                ? 'bg-white text-red-600 shadow-sm'
                : 'text-navy-700 hover:text-navy-900'
            }`}
          >
            Statistiche
          </button>
        </div>
        
        {/* Search and Add */}
        {activeTab !== 'statistics' && (
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div className="flex items-center space-x-4 w-full md:w-auto mb-4 md:mb-0">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder={`Cerca ${activeTab === 'athletes' ? 'atleti' : 'schede'}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                />
              </div>
            </div>
            
            <button
              onClick={activeTab === 'athletes' ? openNewAthleteModal : openNewWorkoutPlanModal}
              className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors duration-300"
            >
              <Plus size={20} />
              <span>{activeTab === 'athletes' ? 'Nuovo Atleta' : 'Nuova Scheda'}</span>
            </button>
          </div>
        )}
        
        {/* Content based on active tab */}
        {activeTab === 'athletes' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-navy-900">Gestione Atleti</h2>
                
                {/* Pulsante Reset Database - SOLO PER SVILUPPO */}
                <button
                  onClick={resetAthleteDatabase}
                  className="flex items-center space-x-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition-colors duration-300 text-sm"
                  title="Reset database atleti (solo per sviluppo)"
                >
                  <Trash2 size={16} />
                  <span>Reset DB</span>
                </button>
              </div>
              
              {/* Filtri Avanzati */}
              <div className="mb-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="relative">
                    <button
                      onClick={() => setShowAthleteFilters(!showAthleteFilters)}
                      className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-300"
                    >
                      <Filter size={16} />
                      <span>Filtri</span>
                      {showAthleteFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {showAthleteFilters && (
                      <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-10 min-w-80 filter-dropdown">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Stato Pagamento</label>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={filters.paymentStatus.paid}
                                  onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    paymentStatus: { ...prev.paymentStatus, paid: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <span className="text-sm">Pagato</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={filters.paymentStatus.pending}
                                  onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    paymentStatus: { ...prev.paymentStatus, pending: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <span className="text-sm">In attesa</span>
                              </label>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Stato Tesseramento</label>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={filters.membershipStatus.active}
                                  onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    membershipStatus: { ...prev.membershipStatus, active: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <span className="text-sm">Attivo</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={filters.membershipStatus.pending}
                                  onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    membershipStatus: { ...prev.membershipStatus, pending: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <span className="text-sm">In attesa</span>
                              </label>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Genere</label>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={filters.gender.M}
                                  onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    gender: { ...prev.gender, M: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <span className="text-sm">Maschio</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={filters.gender.F}
                                  onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    gender: { ...prev.gender, F: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <span className="text-sm">Femmina</span>
                              </label>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Certificato Medico</label>
                            <div className="space-y-2">
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={filters.certificatoMedico.presente}
                                  onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    certificatoMedico: { ...prev.certificatoMedico, presente: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <span className="text-sm">Presente</span>
                              </label>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={filters.certificatoMedico.mancante}
                                  onChange={(e) => setFilters(prev => ({
                                    ...prev,
                                    certificatoMedico: { ...prev.certificatoMedico, mancante: e.target.checked }
                                  }))}
                                  className="mr-2"
                                />
                                <span className="text-sm">Mancante</span>
                              </label>
                            </div>
                          </div>
                          
                          <div className="col-span-2">
                            <button
                              onClick={clearAthleteFilters}
                              className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-300"
                            >
                              Pulisci Filtri
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    Totale atleti: {filteredAthletes.length}
                  </div>
                </div>
              </div>
              
              {filteredAthletes.length === 0 ? (
                <div className="text-center py-12">
                  <UserIcon size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 text-lg mb-2">Nessun atleta trovato</p>
                  <p className="text-gray-400 text-sm">Aggiungi il primo atleta o modifica i filtri di ricerca</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-navy-900">Nome</th>
                        <th className="text-left py-3 px-4 font-semibold text-navy-900">Email</th>
                        <th className="text-left py-3 px-4 font-semibold text-navy-900">Data Nascita</th>
                        <th className="text-left py-3 px-4 font-semibold text-navy-900">Genere</th>
                        <th className="text-left py-3 px-4 font-semibold text-navy-900">Pagamento</th>
                        <th className="text-left py-3 px-4 font-semibold text-navy-900">Tesseramento</th>
                        <th className="text-left py-3 px-4 font-semibold text-navy-900">Certificato Medico</th>
                        <th className="text-center py-3 px-4 font-semibold text-navy-900">Azioni</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAthletes.map((athlete, index) => (
                        <tr key={athlete.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                        }`}>
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                                <UserIcon size={20} className="text-red-600" />
                              </div>
                              <div>
                                <p className="font-semibold text-navy-900">{athlete.name}</p>
                                <p className="text-sm text-gray-500">{athlete.fiscalCode}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-navy-700">{athlete.email}</p>
                          </td>
                          <td className="py-4 px-4">
                            <p className="text-navy-700">
                              {athlete.birthDate ? new Date(athlete.birthDate).toLocaleDateString('it-IT') : 'N/A'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {athlete.birthPlace || 'N/A'}
                            </p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              athlete.gender === 'M' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-pink-100 text-pink-800'
                            }`}>
                              {athlete.gender === 'M' ? 'Maschio' : 'Femmina'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={athlete.paymentStatus}
                              onChange={(e) => handlePaymentStatusChange(athlete.id, e.target.value as 'paid' | 'pending')}
                              className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                                athlete.paymentStatus === 'paid'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              <option value="pending">In attesa</option>
                              <option value="paid">Pagato</option>
                            </select>
                            {athlete.lastPaymentDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(athlete.lastPaymentDate).toLocaleDateString('it-IT')}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={athlete.membershipStatus}
                              onChange={(e) => handleMembershipStatusChange(athlete.id, e.target.value as 'active' | 'pending')}
                              className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                                athlete.membershipStatus === 'active'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              <option value="pending">In attesa</option>
                              <option value="active">Attivo</option>
                            </select>
                            {athlete.membershipDate && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(athlete.membershipDate).toLocaleDateString('it-IT')}
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <select
                              value={athlete.certificatoMedico ? 'presente' : 'mancante'}
                              onChange={(e) => handleCertificatoMedicoChange(athlete.id, e.target.value === 'presente')}
                              className={`px-3 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${
                                athlete.certificatoMedico
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              <option value="mancante">Mancante</option>
                              <option value="presente">Presente</option>
                            </select>
                            {athlete.certificatoMedicoFile && (
                              <p className="text-xs text-gray-500 mt-1">
                                File caricato
                              </p>
                            )}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center space-x-2">
                              <button
                                onClick={() => openEditAthleteModal(athlete)}
                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all duration-300"
                                title="Modifica atleta"
                              >
                                <Edit size={16} />
                              </button>
                              {/* funzione rimossa - deleteAthlete */}
                              {/* funzione rimossa - openAssignWorkoutModal */}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'workouts' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-navy-900 mb-6">Gestione Schede</h2>
              
              {filteredWorkoutPlans.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Nessuna scheda trovata</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredWorkoutPlans.map((plan) => (
                    <div key={plan.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-300">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-navy-900">{plan.name}</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditWorkoutPlanModal(plan)}
                            className="text-blue-600 hover:text-blue-800 transition-colors duration-300"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => deleteWorkoutPlan(plan.id)}
                            className="text-red-600 hover:text-red-800 transition-colors duration-300"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">Coach: {plan.coach}</p>
                      <p className="text-sm text-gray-600 mb-2">Durata: {plan.duration} min</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          plan.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : plan.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {plan.status === 'published' ? 'Pubblicata' : plan.status === 'draft' ? 'Bozza' : 'Archiviata'}
                        </span>
                        
                        <span className="text-gray-500">
                          Difficoltà: {plan.difficulty || 1}/5
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-navy-900 mb-6">Statistiche</h2>
              
              {/* Selezione mese */}
              <div className="mb-6">
                <label className="block text-navy-700 font-medium mb-2">Seleziona Mese</label>
                <div className="flex space-x-4">
                  <select
                    value={selectedMonth.month}
                    onChange={(e) => setSelectedMonth(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {getMonthName(i + 1)}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={selectedMonth.year}
                    onChange={(e) => setSelectedMonth(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>
              
              {/* Cards statistiche */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-600 text-sm font-medium">Totale Membri</p>
                      <p className="text-2xl font-bold text-blue-900">{statistics.totalMembers}</p>
                    </div>
                    <Users className="text-blue-600" size={32} />
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-600 text-sm font-medium">Membri Attivi</p>
                      <p className="text-2xl font-bold text-green-900">{statistics.registeredMembers.length}</p>
                    </div>
                    <CheckCircle className="text-green-600" size={32} />
                  </div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-600 text-sm font-medium">Pagamenti {getMonthName(selectedMonth.month)}</p>
                      <p className="text-2xl font-bold text-yellow-900">{statistics.paidThisMonth.length}</p>
                    </div>
                    <CheckCircle className="text-yellow-600" size={32} />
                  </div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-600 text-sm font-medium">Ricavi {getMonthName(selectedMonth.month)}</p>
                      <p className="text-2xl font-bold text-red-900">€{statistics.monthlyRevenue}</p>
                    </div>
                    <Target className="text-red-600" size={32} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Modals */}
        {showAthleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-navy-900 mb-6">
                {selectedAthlete ? 'Modifica Atleta' : 'Nuovo Atleta'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Nome *</label>
                  <input
                    type="text"
                    value={athleteForm.name}
                    onChange={(e) => setAthleteForm({...athleteForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={athleteForm.email}
                    onChange={(e) => setAthleteForm({...athleteForm, email: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Data di Nascita *</label>
                  <input
                    type="date"
                    value={athleteForm.birthDate}
                    onChange={(e) => setAthleteForm({...athleteForm, birthDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Genere *</label>
                  <select
                    value={athleteForm.gender}
                    onChange={(e) => setAthleteForm({...athleteForm, gender: e.target.value as 'M' | 'F'})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  >
                    <option value="M">Maschio</option>
                    <option value="F">Femmina</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Codice Fiscale *</label>
                  <input
                    type="text"
                    value={athleteForm.fiscalCode}
                    onChange={(e) => setAthleteForm({...athleteForm, fiscalCode: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Luogo di Nascita *</label>
                  <input
                    type="text"
                    value={athleteForm.birthPlace}
                    onChange={(e) => setAthleteForm({...athleteForm, birthPlace: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-navy-700 font-medium mb-2">Indirizzo *</label>
                  <input
                    type="text"
                    value={athleteForm.address}
                    onChange={(e) => setAthleteForm({...athleteForm, address: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Stato Pagamento</label>
                  <select
                    value={athleteForm.paymentStatus}
                    onChange={(e) => setAthleteForm({...athleteForm, paymentStatus: e.target.value as 'paid' | 'pending'})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="pending">In attesa</option>
                    <option value="paid">Pagato</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Stato Tesseramento</label>
                  <select
                    value={athleteForm.membershipStatus}
                    onChange={(e) => setAthleteForm({...athleteForm, membershipStatus: e.target.value as 'active' | 'pending'})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="pending">In attesa</option>
                    <option value="active">Attivo</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Certificato Medico</label>
                  <select
                    value={athleteForm.certificatoMedico ? 'presente' : 'mancante'}
                    onChange={(e) => setAthleteForm({...athleteForm, certificatoMedico: e.target.value === 'presente'})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="mancante">Mancante</option>
                    <option value="presente">Presente</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">File Certificato Medico</label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        // In una implementazione reale, qui caricheresti il file su un server
                        // Per ora salviamo solo il nome del file
                        setAthleteForm({...athleteForm, certificatoMedicoFile: file.name});
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  {athleteForm.certificatoMedicoFile && (
                    <p className="text-sm text-gray-600 mt-1">
                      File caricato: {athleteForm.certificatoMedicoFile}
                    </p>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-navy-700 font-medium mb-2">Note</label>
                  <textarea
                    value={athleteForm.notes}
                    onChange={(e) => setAthleteForm({...athleteForm, notes: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowAthleteModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-navy-700 hover:bg-gray-50 transition-colors duration-300"
                >
                  Annulla
                </button>
                <button
                  onClick={saveAthlete}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300"
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showWorkoutPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-navy-900 mb-6">
                {selectedWorkoutPlan ? 'Modifica Scheda' : 'Nuova Scheda'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Nome Scheda *</label>
                  <input
                    type="text"
                    value={workoutPlanForm.name}
                    onChange={(e) => setWorkoutPlanForm({...workoutPlanForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Descrizione</label>
                  <textarea
                    value={workoutPlanForm.description}
                    onChange={(e) => setWorkoutPlanForm({...workoutPlanForm, description: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Coach *</label>
                    <input
                      type="text"
                      value={workoutPlanForm.coach}
                      onChange={(e) => setWorkoutPlanForm({...workoutPlanForm, coach: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Durata (minuti)</label>
                    <input
                      type="number"
                      value={workoutPlanForm.duration}
                      onChange={(e) => setWorkoutPlanForm({...workoutPlanForm, duration: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Data Inizio</label>
                    <input
                      type="date"
                      value={workoutPlanForm.startDate}
                      onChange={(e) => setWorkoutPlanForm({...workoutPlanForm, startDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Difficoltà</label>
                    <select
                      value={workoutPlanForm.difficulty}
                      onChange={(e) => setWorkoutPlanForm({...workoutPlanForm, difficulty: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value={1}>1 - Principiante</option>
                      <option value={2}>2 - Facile</option>
                      <option value={3}>3 - Intermedio</option>
                      <option value={4}>4 - Avanzato</option>
                      <option value={5}>5 - Esperto</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Tags (separati da virgola)</label>
                  <input
                    type="text"
                    value={workoutPlanForm.tags}
                    onChange={(e) => setWorkoutPlanForm({...workoutPlanForm, tags: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="es: forza, cardio, resistenza"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowWorkoutPlanModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-navy-700 hover:bg-gray-50 transition-colors duration-300"
                >
                  Annulla
                </button>
                <button
                  onClick={saveWorkoutPlan}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300"
                >
                  Salva
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Delete Modals */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conferma Eliminazione</h3>
              <p className="text-gray-600 mb-6">
                Sei sicuro di voler eliminare questo atleta? Questa azione non può essere annullata.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmDeleteAthlete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        )}
        
        {showDeleteWorkoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conferma Eliminazione Scheda</h3>
              <p className="text-gray-600 mb-6">
                Sei sicuro di voler eliminare questa scheda? Questa azione non può essere annullata.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteWorkoutModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-300"
                >
                  Annulla
                </button>
                <button
                  onClick={confirmDeleteWorkoutPlan}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-300"
                >
                  Elimina
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
