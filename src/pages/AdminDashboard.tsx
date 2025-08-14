import React, { useState, useEffect } from 'react';
import { ArrowLeft, Search, Plus, Edit, Trash2, Download, Upload, User as UserIcon, FileText, CheckCircle, XCircle, X, ChevronUp, ChevronDown, Grid, List, Copy, Filter, SortAsc, SortDesc, Play, Image, Music, Tag, Calendar, Clock, Target, Star, Eye, EyeOff, GripVertical } from 'lucide-react';
import DB, { User, WorkoutPlan, Exercise } from '../utils/database';

interface AdminDashboardProps {
  onNavigate: (page: string) => void;
  currentUser: User | null;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, currentUser }) => {
  // Stati per la gestione degli atleti e delle schede
  const [athletes, setAthletes] = useState<User[]>([]);
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('athletes');
  const [selectedAthlete, setSelectedAthlete] = useState<User | null>(null);
  const [selectedWorkoutPlan, setSelectedWorkoutPlan] = useState<WorkoutPlan | null>(null);
  const [showAthleteModal, setShowAthleteModal] = useState(false);
  const [showWorkoutPlanModal, setShowWorkoutPlanModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAthleteFilters, setShowAthleteFilters] = useState(false);
  const [showWorkoutFilters, setShowWorkoutFilters] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [athleteToDelete, setAthleteToDelete] = useState<string | null>(null);
  const [showDeleteWorkoutModal, setShowDeleteWorkoutModal] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<string | null>(null);
  
  // Stati per la nuova interfaccia schede
  const [workoutViewMode, setWorkoutViewMode] = useState<'grid' | 'list'>('grid');
  const [draggedWorkout, setDraggedWorkout] = useState<string | null>(null);
  const [workoutSortBy, setWorkoutSortBy] = useState<'name' | 'date' | 'order' | 'status'>('order');
  const [workoutSortOrder, setWorkoutSortOrder] = useState<'asc' | 'desc'>('asc');
  const [workoutFilters, setWorkoutFilters] = useState({
    status: '',
    category: '',
    difficulty: '',
    coach: ''
  });
  
  // Stati per i filtri degli atleti e delle schede
  const [filters, setFilters] = useState({
    paymentStatus: { paid: false, pending: false },
    membershipStatus: { active: false, pending: false },
    gender: { M: false, F: false },
    workoutPlan: {
      athlete: '',
      coach: ''
    }
  });



  // Stato per il mese selezionato nelle statistiche
  const [selectedMonth, setSelectedMonth] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  // Opzioni per i filtri
  const filterOptions = {
    paymentStatus: [
      { value: 'paid', label: 'Pagato' },
      { value: 'pending', label: 'In attesa' }
    ],
    membershipStatus: [
      { value: 'active', label: 'Attivo' },
      { value: 'pending', label: 'In attesa' }
    ],
    gender: [
      { value: 'M', label: 'Maschio' },
      { value: 'F', label: 'Femmina' }
    ]
  };
  
  // Stati per le statistiche
  const [showMembershipDetails, setShowMembershipDetails] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [showRevenueDetails, setShowRevenueDetails] = useState(false);

  // Form data per la creazione/modifica di atleti
  const [athleteForm, setAthleteForm] = useState({
    id: '',
    name: '', // required
    email: '', // required
    birthDate: '', // required
    gender: 'M', // required
    fiscalCode: '', // required
    birthPlace: '', // required
    address: '', // required
    notes: '', // optional
    paymentStatus: 'pending', // required - default "in attesa"
    lastPaymentDate: '', // optional
    membershipStatus: 'pending', // required - default "in attesa"
    membershipFilePath: '', // optional
    invoiceFilePath: '' // optional
  });

  // Validazione del form atleta
  const validateAthleteForm = () => {
    const requiredFields = ['name', 'email', 'birthDate', 'gender', 'fiscalCode', 'birthPlace', 'address', 'paymentStatus', 'membershipStatus'];
    const missingFields = requiredFields.filter(field => !athleteForm[field as keyof typeof athleteForm]);
    
    if (missingFields.length > 0) {
      alert('I seguenti campi sono obbligatori: ' + missingFields.join(', '));
      return false;
    }
    return true;
  };

  // Form data per la creazione/modifica di schede
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

  // Chiudi dropdown quando si clicca fuori
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

  // Carica i dati all'avvio
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      onNavigate('home');
      return;
    }
    
    loadData();
  }, [currentUser, onNavigate]);

  // Funzione per caricare i dati dal database
  const loadData = () => {
    // Carica tutti gli atleti
    const allUsers = DB.getUsers();
    const athleteUsers = allUsers.filter(user => user.role === 'atleta');
    setAthletes(athleteUsers);

    // Carica tutte le schede di allenamento
    const allWorkoutPlans = DB.getWorkoutPlans();
    setWorkoutPlans(allWorkoutPlans);
  };

  // Filtra gli atleti in base al termine di ricerca e ai filtri
  const filteredAthletes = athletes.filter(athlete => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         athlete.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const hasPaymentFilter = Object.values(filters.paymentStatus).some(v => v);
    const hasMembershipFilter = Object.values(filters.membershipStatus).some(v => v);
    const hasGenderFilter = Object.values(filters.gender).some(v => v);
    
    const matchesPaymentFilter = !hasPaymentFilter || filters.paymentStatus[athlete.paymentStatus as keyof typeof filters.paymentStatus];
    const matchesMembershipFilter = !hasMembershipFilter || filters.membershipStatus[athlete.membershipStatus as keyof typeof filters.membershipStatus];
    const matchesGenderFilter = !hasGenderFilter || filters.gender[athlete.gender as keyof typeof filters.gender];
    
    return matchesSearch && matchesPaymentFilter && matchesMembershipFilter && matchesGenderFilter;
  });

  // Funzioni di utilità per le schede
  const sortWorkouts = (plans: WorkoutPlan[]) => {
    return [...plans].sort((a, b) => {
      let comparison = 0;
      
      switch (workoutSortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'date':
          comparison = new Date(a.createdAt || a.startDate).getTime() - new Date(b.createdAt || b.startDate).getTime();
          break;
        case 'order':
          comparison = (a.order || 0) - (b.order || 0);
          break;
        case 'status':
          const statusOrder = { 'published': 0, 'draft': 1, 'archived': 2 };
          comparison = statusOrder[a.status] - statusOrder[b.status];
          break;
      }
      
      return workoutSortOrder === 'desc' ? -comparison : comparison;
    });
  };

  const filterWorkouts = (plans: WorkoutPlan[]) => {
    return plans.filter(plan => {
      const matchesStatus = !workoutFilters.status || plan.status === workoutFilters.status;
      const matchesCategory = !workoutFilters.category || plan.category === workoutFilters.category;
      const matchesDifficulty = !workoutFilters.difficulty || plan.difficulty === workoutFilters.difficulty;
      const matchesCoach = !workoutFilters.coach || plan.coach.toLowerCase().includes(workoutFilters.coach.toLowerCase());
      
      return matchesStatus && matchesCategory && matchesDifficulty && matchesCoach;
    });
  };

  // Filtra le schede in base al termine di ricerca e ai filtri
  const filteredWorkoutPlans = (() => {
    let filtered = workoutPlans.filter(plan => {
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
    
    // Applica filtri avanzati
    filtered = filterWorkouts(filtered);
    
    // Applica ordinamento
    filtered = sortWorkouts(filtered);
    
    return filtered;
  })();

  // Gestione del form atleta
  const handleAthleteFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAthleteForm(prev => {
      const updated = { ...prev, [name]: value };
      
      // Gestione automatica delle date
      if (name === 'paymentStatus') {
        if (value === 'paid') {
          updated.lastPaymentDate = new Date().toISOString().split('T')[0];
        } else if (value === 'pending') {
          updated.lastPaymentDate = '';
        }
      }
      
      if (name === 'membershipStatus') {
        if (value === 'active') {
          updated.membershipDate = new Date().toISOString().split('T')[0];
        } else if (value === 'pending') {
          updated.membershipDate = '';
        }
      }
      
      return updated;
    });
  };

  // Gestione del form scheda
  const handleWorkoutPlanFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setWorkoutPlanForm(prev => ({ ...prev, [name]: value }));
  };

  // Gestione degli esercizi nel form scheda
  const handleExerciseChange = (index: number, field: string, value: string | number) => {
    const updatedExercises = [...workoutPlanForm.exercises];
    updatedExercises[index] = { ...updatedExercises[index], [field]: value };
    setWorkoutPlanForm(prev => ({ ...prev, exercises: updatedExercises }));
  };

  // Aggiunge un nuovo esercizio al form
  const addExercise = () => {
    setWorkoutPlanForm(prev => ({
      ...prev,
      exercises: [...prev.exercises, { id: `exercise-${Date.now()}`, name: '', sets: 3, reps: 10, rest: 60, description: '' }]
    }));
  };

  // Rimuove un esercizio dal form
  const removeExercise = (index: number) => {
    const updatedExercises = [...workoutPlanForm.exercises];
    updatedExercises.splice(index, 1);
    setWorkoutPlanForm(prev => ({ ...prev, exercises: updatedExercises }));
  };

  // Apre il modal per creare un nuovo atleta
  const openNewAthleteModal = () => {
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
      membershipFilePath: '',
      invoiceFilePath: ''
    });
    setSelectedAthlete(null);
    setShowAthleteModal(true);
  };

  // Apre il modal per modificare un atleta esistente
  const openEditAthleteModal = (athlete: User) => {
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
      membershipFilePath: athlete.membershipFilePath || '',
      invoiceFilePath: athlete.invoiceFilePath || ''
    });
    setSelectedAthlete(athlete);
    setShowAthleteModal(true);
  };

  // Apre il modal per creare una nuova scheda
  const openNewWorkoutPlanModal = () => {
    setWorkoutPlanForm({
      id: '',
      name: '',
      description: '',
      coach: currentUser?.name || '',
      duration: 30,
      startDate: new Date().toISOString().split('T')[0],
      userId: '',
      difficulty: 1,
      tags: '',
      exercises: [{ id: `exercise-${Date.now()}`, name: '', sets: 3, reps: 10, rest: 60, description: '' }]
    });
    setSelectedWorkoutPlan(null);
    setShowWorkoutPlanModal(true);
  };

  // Apre il modal per modificare una scheda esistente
  const openEditWorkoutPlanModal = (plan: WorkoutPlan) => {
    setWorkoutPlanForm({
      id: plan.id,
      name: plan.name,
      description: plan.description || '',
      coach: plan.coach,
      duration: plan.duration,
      startDate: plan.startDate,
      userId: plan.userId,
      difficulty: plan.difficulty || 1,
      tags: plan.tags || '',
      exercises: plan.exercises
    });
    setSelectedWorkoutPlan(plan);
    setShowWorkoutPlanModal(true);
  };

  // Apre il modal per assegnare una scheda a un atleta
  const openAssignModal = (athlete: User) => {
    setSelectedAthlete(athlete);
    setShowAssignModal(true);
  };

  // Salva un atleta (nuovo o modificato)
  const saveAthlete = () => {
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
      lastPaymentDate: athleteForm.lastPaymentDate,
      membershipStatus: athleteForm.membershipStatus,
      membershipFilePath: athleteForm.membershipFilePath,
      invoiceFilePath: athleteForm.invoiceFilePath
    };

    DB.saveUser(newAthlete);
    setShowAthleteModal(false);
    loadData();
  };

  // Salva una scheda (nuova o modificata)
  const saveWorkoutPlan = () => {
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
      category: 'strength', // Default category
      status: 'draft', // Default status
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
    
    // Se è stato selezionato un atleta, assegna automaticamente la scheda
    if (workoutPlanForm.userId) {
      const selectedAthlete = athletes.find(athlete => athlete.id === workoutPlanForm.userId);
      if (selectedAthlete) {
        const updatedAthlete = { ...selectedAthlete };
        
        // Verifica se la scheda non è già assegnata
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
    loadData();
  };

  // Assegna una scheda a un atleta
  const assignWorkoutPlan = (workoutPlanId: string) => {
    if (!selectedAthlete) return;

    const workoutPlan = workoutPlans.find(plan => plan.id === workoutPlanId);
    if (!workoutPlan) return;

    const updatedAthlete = { ...selectedAthlete };
    
    // Verifica se la scheda è già assegnata
    const existingIndex = updatedAthlete.workoutPlans.findIndex(planId => planId === workoutPlanId);
    
    if (existingIndex >= 0) {
      // La scheda è già assegnata, non fare nulla
      // Scheda già assegnata
    } else {
      // Aggiungi l'ID della nuova scheda
      updatedAthlete.workoutPlans.push(workoutPlanId);
    }

    DB.saveUser(updatedAthlete);
    setShowAssignModal(false);
    loadData();
  };

  // Rimuove una scheda da un atleta
  const removeWorkoutPlanFromAthlete = (athlete: User, workoutPlanId: string) => {
    const updatedAthlete = { ...athlete };
    updatedAthlete.workoutPlans = updatedAthlete.workoutPlans.filter(planId => planId !== workoutPlanId);
    
    DB.saveUser(updatedAthlete);
    loadData();
  };

  // Elimina un atleta
  const deleteAthlete = (athleteId: string) => {
    setAthleteToDelete(athleteId);
    setShowDeleteModal(true);
  };

  const confirmDeleteAthlete = () => {
    if (athleteToDelete) {
      DB.deleteUser(athleteToDelete);
      loadData();
      setShowDeleteModal(false);
      setAthleteToDelete(null);
    }
  };

  // Elimina una scheda
  const deleteWorkoutPlan = (workoutPlanId: string) => {
    setWorkoutToDelete(workoutPlanId);
    setShowDeleteWorkoutModal(true);
  };

  const confirmDeleteWorkoutPlan = () => {
    if (workoutToDelete) {
      DB.deleteWorkoutPlan(workoutToDelete);
      loadData();
      setWorkoutToDelete(null);
      setShowDeleteWorkoutModal(false);
    }
  };

  // Funzioni per la nuova interfaccia schede
  const duplicateWorkoutPlan = (planId: string) => {
    const plan = workoutPlans.find(p => p.id === planId);
    if (plan) {
      const duplicatedPlan: WorkoutPlan = {
        ...plan,
        id: `workout-${Date.now()}`,
        name: `${plan.name} (Copia)`,
        status: 'draft',
        order: workoutPlans.length,
        difficulty: plan.difficulty || 1,
        tags: plan.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      DB.saveWorkoutPlan(duplicatedPlan);
      loadData();
    }
  };

  const handleWorkoutDragStart = (plan: WorkoutPlan) => {
    setDraggedWorkout(plan.id);
  };

  const handleWorkoutDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleWorkoutDrop = (targetIndex: number) => {
    if (draggedWorkout) {
      const draggedIndex = filteredWorkoutPlans.findIndex(p => p.id === draggedWorkout);
      
      if (draggedIndex !== -1 && draggedIndex !== targetIndex) {
        const updatedPlans = [...workoutPlans];
        const draggedPlan = updatedPlans.find(p => p.id === draggedWorkout);
        const targetPlan = filteredWorkoutPlans[targetIndex];
        
        if (draggedPlan && targetPlan) {
          // Trova gli indici nell'array completo
          const fullDraggedIndex = updatedPlans.findIndex(p => p.id === draggedWorkout);
          const fullTargetIndex = updatedPlans.findIndex(p => p.id === targetPlan.id);
          
          // Rimuovi l'elemento dalla posizione originale
          updatedPlans.splice(fullDraggedIndex, 1);
          // Inserisci nella nuova posizione
          updatedPlans.splice(fullTargetIndex, 0, draggedPlan);
          
          // Aggiorna l'ordine e salva nel database
          updatedPlans.forEach((plan, index) => {
            const updatedPlan = { ...plan, order: index, updatedAt: new Date().toISOString() };
            DB.saveWorkoutPlan(updatedPlan);
          });
          
          // Aggiorna lo stato locale
          setWorkoutPlans(updatedPlans);
        }
      }
    }
    setDraggedWorkout(null);
  };

  const updateWorkoutStatus = (workoutId: string, newStatus: 'draft' | 'published' | 'archived') => {
    const workout = workoutPlans.find(w => w.id === workoutId);
    if (workout) {
      const updatedWorkout = { 
        ...workout, 
        status: newStatus,
        updatedAt: new Date().toISOString()
      };
      DB.saveWorkoutPlan(updatedWorkout);
      loadData();
    }
  };

  // Gestione filtri
  const handleFilterChange = (category: string, key: string, value: boolean) => {
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
  };

  // Gestione modifica stato tesseramento
  const handleMembershipStatusChange = (athleteId: string, newStatus: 'active' | 'pending') => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      const updatedAthlete = { 
        ...athlete, 
        membershipStatus: newStatus,
        membershipDate: newStatus === 'active' ? new Date().toISOString().split('T')[0] : ''
      };
      DB.saveUser(updatedAthlete);
      loadData();
    }
  };

  // Gestione modifica stato pagamento
  const handlePaymentStatusChange = (athleteId: string, newStatus: 'paid' | 'pending') => {
    const athlete = athletes.find(a => a.id === athleteId);
    if (athlete) {
      const updatedAthlete = { 
        ...athlete, 
        paymentStatus: newStatus,
        lastPaymentDate: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : ''
      };
      DB.saveUser(updatedAthlete);
      loadData();
    }
  };

  // Funzione per applicare i filtri


  // Funzione per ottenere il nome del mese in italiano
  const getMonthName = (month: number) => {
    const months = [
      'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
      'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
    ];
    return months[month - 1];
  };

  // Calcolo statistiche
  const calculateStatistics = () => {
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
    
    // Calcolo guadagno mensile (assumendo 50€ per abbonamento mensile)
    const monthlyRevenue = paidThisMonth.length * 50;
    
    return {
      totalMembers,
      registeredMembers,
      unregisteredMembers,
      paidThisMonth,
      unpaidThisMonth,
      monthlyRevenue
    };
  };

  const statistics = calculateStatistics();

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
          
          <div className="w-24"></div> {/* Spacer for centering */}
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
              
              {/* Filtri Dropdown per Atleti */}
               {activeTab === 'athletes' && (
                 <div className="relative filter-dropdown">
                  <button
                    onClick={() => setShowAthleteFilters(!showAthleteFilters)}
                    className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 min-w-[120px]"
                  >
                    <span>Filtri</span>
                    {showAthleteFilters ? 
                      <ChevronUp size={16} className="ml-2" /> : 
                      <ChevronDown size={16} className="ml-2" />
                    }
                  </button>
                  
                  {showAthleteFilters && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                      <div className="space-y-4">
                        {/* Filtro Stato Pagamento */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Stato Pagamento</label>
                          <select
                            value={Object.entries(filters.paymentStatus).find(([_, value]) => value)?.[0] || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFilters(prev => ({
                                ...prev,
                                paymentStatus: {
                                  paid: value === 'paid',
                                  pending: value === 'pending'
                                }
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="">Tutti</option>
                            {filterOptions.paymentStatus.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Filtro Tesseramento */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Tesseramento</label>
                          <select
                            value={Object.entries(filters.membershipStatus).find(([_, value]) => value)?.[0] || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFilters(prev => ({
                                ...prev,
                                membershipStatus: {
                                  active: value === 'active',
                                  pending: value === 'pending'
                                }
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="">Tutti</option>
                            {filterOptions.membershipStatus.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Filtro Genere */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Genere</label>
                          <select
                            value={Object.entries(filters.gender).find(([_, value]) => value)?.[0] || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              setFilters(prev => ({
                                ...prev,
                                gender: {
                                  M: value === 'M',
                                  F: value === 'F'
                                }
                              }));
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="">Tutti</option>
                            {filterOptions.gender.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>
                        

                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Filtri Dropdown per Schede */}
               {activeTab === 'workouts' && (
                 <div className="relative filter-dropdown">
                  <button
                    onClick={() => setShowWorkoutFilters(!showWorkoutFilters)}
                    className="flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-300 min-w-[120px]"
                  >
                    <span>Filtri</span>
                    {showWorkoutFilters ? 
                      <ChevronUp size={16} className="ml-2" /> : 
                      <ChevronDown size={16} className="ml-2" />
                    }
                  </button>
                  
                  {showWorkoutFilters && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 min-w-[300px]">
                      <div className="space-y-4">
                        {/* Filtro per Atleta */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Filtra per Atleta</label>
                          <select
                            value={filters.workoutPlan.athlete}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              workoutPlan: {
                                ...prev.workoutPlan,
                                athlete: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="">Tutti gli atleti</option>
                            {athletes.map(athlete => (
                              <option key={athlete.id} value={athlete.name}>{athlete.name}</option>
                            ))}
                          </select>
                        </div>
                        
                        {/* Filtro per Coach */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Filtra per Coach</label>
                          <select
                            value={filters.workoutPlan.coach}
                            onChange={(e) => setFilters(prev => ({
                              ...prev,
                              workoutPlan: {
                                ...prev.workoutPlan,
                                coach: e.target.value
                              }
                            }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                          >
                            <option value="">Tutti i coach</option>
                            {[...new Set(workoutPlans.map(plan => plan.coach))].filter(coach => coach).map(coach => (
                              <option key={coach} value={coach}>{coach}</option>
                            ))}
                          </select>
                        </div>
                        

                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {activeTab === 'athletes' && (
              <button
                onClick={openNewAthleteModal}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
              >
                <Plus size={20} />
                <span>Nuovo Atleta</span>
              </button>
            )}
          </div>
        )}



        {/* Statistics Tab */}
        {activeTab === 'statistics' && (
          <div className="space-y-6">
            {/* Selettore Periodo */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Seleziona Periodo</h3>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mese</label>
                  <select
                    value={selectedMonth.month}
                    onChange={(e) => setSelectedMonth(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                      <option key={month} value={month}>{getMonthName(month)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Anno</label>
                  <select
                    value={selectedMonth.year}
                    onChange={(e) => setSelectedMonth(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            
            {/* Statistiche Generali */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Iscritti Totali</h3>
                <p className="text-3xl font-bold text-red-600">{statistics.totalMembers}</p>
                <button
                  onClick={() => setShowMembershipDetails(!showMembershipDetails)}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  {showMembershipDetails ? 'Nascondi' : 'Mostra'} dettagli
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tesserati</h3>
                <p className="text-3xl font-bold text-green-600">{statistics.registeredMembers.length}</p>
                <button
                  onClick={() => setShowMembershipDetails(!showMembershipDetails)}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  {showMembershipDetails ? 'Nascondi' : 'Mostra'} dettagli
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Pagamenti Mese</h3>
                <p className="text-3xl font-bold text-blue-600">{statistics.paidThisMonth.length}</p>
                <button
                  onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  {showPaymentDetails ? 'Nascondi' : 'Mostra'} dettagli
                </button>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Entrate {getMonthName(selectedMonth.month)}</h3>
                <p className="text-3xl font-bold text-green-600">€{statistics.monthlyRevenue}</p>
                <button
                  onClick={() => setShowRevenueDetails(!showRevenueDetails)}
                  className="text-sm text-blue-600 hover:underline mt-2"
                >
                  {showRevenueDetails ? 'Nascondi' : 'Mostra'} dettagli
                </button>
              </div>
            </div>

            {/* Dettagli Iscritti Totali */}
            {showMembershipDetails && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Elenco Iscritti</h3>
                <div>
                  <h4 className="font-medium text-blue-600 mb-2">Tutti gli Iscritti ({statistics.totalMembers})</h4>
                  <ul className="space-y-1 text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
                    {athletes.map(member => (
                      <li key={member.id} className="text-gray-700">{member.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Dettagli Pagamenti */}
            {showPaymentDetails && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dettagli Pagamenti Mese Corrente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-green-600 mb-2">Hanno Pagato ({statistics.paidThisMonth.length})</h4>
                    <ul className="space-y-1 text-sm">
                      {statistics.paidThisMonth.map(member => (
                        <li key={member.id} className="text-gray-700">{member.name}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-600 mb-2">Non Hanno Pagato ({statistics.unpaidThisMonth.length})</h4>
                    <ul className="space-y-1 text-sm">
                      {statistics.unpaidThisMonth.map(member => (
                        <li key={member.id} className="text-gray-700">{member.name}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Dettagli Entrate */}
            {showRevenueDetails && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Dettagli Entrate {getMonthName(selectedMonth.month)}</h3>
                <div className="space-y-3">
                  <h4 className="font-medium text-green-600 mb-2">Pagamenti Ricevuti (€{statistics.monthlyRevenue})</h4>
                  <ul className="space-y-2 text-sm">
                    {statistics.paidThisMonth.map(member => (
                      <li key={member.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-gray-700">{member.name}</span>
                        <span className="font-medium text-green-600">€50</span>
                      </li>
                    ))}
                  </ul>
                  {statistics.paidThisMonth.length === 0 && (
                    <p className="text-gray-500 italic">Nessun pagamento ricevuto questo mese</p>
                  )}
                </div>
              </div>
            )}


          </div>
        )}

        {/* Athletes Tab */}
        {activeTab === 'athletes' && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data di Nascita</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sesso</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Codice Fiscale</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Luogo di Nascita</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Indirizzo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Note</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pagamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tesseramento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Azioni</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAthletes.length > 0 ? (
                    filteredAthletes.map((athlete) => (
                      <tr key={athlete.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-red-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{athlete.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{athlete.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{athlete.birthDate || 'Non specificata'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{athlete.gender === 'M' ? 'Maschio' : 'Femmina'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{athlete.fiscalCode || 'Non specificato'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{athlete.birthPlace || 'Non specificato'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{athlete.address || 'Non specificato'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{athlete.notes || 'Nessuna nota'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={athlete.paymentStatus}
                            onChange={(e) => handlePaymentStatusChange(athlete.id, e.target.value as 'paid' | 'pending')}
                            className={`px-2 py-1 text-xs font-semibold rounded-lg border ${
                              athlete.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}
                          >
                            <option value="paid">Pagato</option>
                            <option value="pending">In attesa</option>
                          </select>
                          {athlete.paymentStatus === 'paid' && athlete.lastPaymentDate && (
            <div className="text-xs text-gray-500 mt-1">{athlete.lastPaymentDate}</div>
          )}
                          {athlete.paymentStatus === 'paid' && athlete.invoiceFilePath && (
                            <div className="text-xs text-blue-500 mt-1 cursor-pointer">Visualizza fattura</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={athlete.membershipStatus}
                            onChange={(e) => handleMembershipStatusChange(athlete.id, e.target.value as 'active' | 'pending')}
                            className={`px-2 py-1 text-xs font-semibold rounded-lg border ${
                              athlete.membershipStatus === 'active' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}
                          >
                            <option value="active">Attivo</option>
                            <option value="pending">In attesa</option>
                          </select>
                          {athlete.membershipStatus === 'active' && athlete.membershipDate && (
            <div className="text-xs text-gray-500 mt-1">{athlete.membershipDate}</div>
          )}
          {athlete.membershipFilePath && (
            <div className="text-xs text-blue-500 mt-1 cursor-pointer">Visualizza file</div>
          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => openEditAthleteModal(athlete)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit size={18} />
                            </button>
                            <button 
                              onClick={() => deleteAthlete(athlete.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                        Nessun atleta trovato
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Workout Plans Tab */}
        {activeTab === 'workouts' && (
          <div className="space-y-6">
            {/* Header con controlli */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Titolo e contatori */}
              <div className="flex items-center space-x-4 mb-6">
                <h2 className="text-2xl font-bold text-navy-900">Schede di Allenamento</h2>
                <div className="flex space-x-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {filteredWorkoutPlans.length} schede
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {filteredWorkoutPlans.filter(p => p.status === 'published').length} pubblicate
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {filteredWorkoutPlans.filter(p => p.status === 'draft').length} bozze
                  </span>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Barra di ricerca */}
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Cerca schede..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-300"
                  />
                </div>

                {/* Controlli vista e azioni */}
                <div className="flex items-center space-x-3">
                  {/* Toggle vista griglia/lista */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setWorkoutViewMode('grid')}
                      className={`p-2 rounded-md transition-colors ${
                        workoutViewMode === 'grid'
                          ? 'bg-white text-navy-900 shadow-sm'
                          : 'text-gray-600 hover:text-navy-900'
                      }`}
                      title="Vista griglia"
                    >
                      <Grid size={18} />
                    </button>
                    <button
                      onClick={() => setWorkoutViewMode('list')}
                      className={`p-2 rounded-md transition-colors ${
                        workoutViewMode === 'list'
                          ? 'bg-white text-navy-900 shadow-sm'
                          : 'text-gray-600 hover:text-navy-900'
                      }`}
                      title="Vista lista"
                    >
                      <List size={18} />
                    </button>
                  </div>

                  {/* Controlli ordinamento */}
                  <div className="flex items-center space-x-2">
                    <select
                      value={workoutSortBy}
                      onChange={(e) => setWorkoutSortBy(e.target.value as any)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="name">Nome</option>
                      <option value="createdAt">Data creazione</option>
                      <option value="updatedAt">Ultima modifica</option>
                      <option value="status">Stato</option>
                      <option value="category">Categoria</option>
                      <option value="difficulty">Difficoltà</option>
                    </select>
                    <button
                      onClick={() => setWorkoutSortOrder(workoutSortOrder === 'asc' ? 'desc' : 'asc')}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title={`Ordina ${workoutSortOrder === 'asc' ? 'decrescente' : 'crescente'}`}
                    >
                      {workoutSortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
                    </button>
                  </div>

                  {/* Filtri avanzati dropdown */}
                  <div className="relative filter-dropdown">
                    <button
                      onClick={() => setShowWorkoutFilters(!showWorkoutFilters)}
                      className={`flex items-center justify-between px-4 py-2 border rounded-lg transition-colors min-w-[120px] ${
                        showWorkoutFilters
                          ? 'bg-red-50 border-red-300 text-red-700'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                      title="Filtri avanzati"
                    >
                      <span className="flex items-center space-x-2">
                        <Filter size={16} />
                        <span>Filtri</span>
                      </span>
                      {showWorkoutFilters ? 
                        <ChevronUp size={16} className="ml-2" /> : 
                        <ChevronDown size={16} className="ml-2" />
                      }
                    </button>
                    
                    {showWorkoutFilters && (
                      <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-6 z-50 min-w-[500px]">
                        {/* Sezione Ricerca */}
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Ricerca Avanzata</h4>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Cerca Schede</label>
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                  type="text"
                                  value={searchTerm}
                                  onChange={(e) => setSearchTerm(e.target.value)}
                                  placeholder="Nome scheda, descrizione, categoria..."
                                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cerca per Atleta</label>
                                <select
                                  value={workoutFilters.coach}
                                  onChange={(e) => setWorkoutFilters(prev => ({ ...prev, coach: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                  <option value="">Tutti gli atleti</option>
                                  {athletes.map(athlete => (
                                    <option key={athlete.id} value={athlete.name}>{athlete.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Cerca per Coach</label>
                                <select
                                  value={workoutFilters.coach}
                                  onChange={(e) => setWorkoutFilters(prev => ({ ...prev, coach: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                >
                                  <option value="">Tutti i coach</option>
                                  {[...new Set(workoutPlans.map(plan => plan.coach))].map(coach => (
                                    <option key={coach} value={coach}>{coach}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Sezione Filtri */}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Filtri</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Stato</label>
                              <select
                                value={workoutFilters.status}
                                onChange={(e) => setWorkoutFilters(prev => ({ ...prev, status: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              >
                                <option value="">Tutti gli stati</option>
                                <option value="draft">Bozza</option>
                                <option value="published">Pubblicata</option>
                                <option value="archived">Archiviata</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                              <select
                                value={workoutFilters.category}
                                onChange={(e) => setWorkoutFilters(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              >
                                <option value="">Tutte le categorie</option>
                                <option value="strength">Forza</option>
                                <option value="cardio">Cardio</option>
                                <option value="flexibility">Flessibilità</option>
                                <option value="sports">Sport specifico</option>
                                <option value="rehabilitation">Riabilitazione</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Difficoltà</label>
                              <select
                                value={workoutFilters.difficulty}
                                onChange={(e) => setWorkoutFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
                              >
                                <option value="">Tutte le difficoltà</option>
                                <option value="1">⭐ (1 stella)</option>
                                <option value="2">⭐⭐ (2 stelle)</option>
                                <option value="3">⭐⭐⭐ (3 stelle)</option>
                                <option value="4">⭐⭐⭐⭐ (4 stelle)</option>
                                <option value="5">⭐⭐⭐⭐⭐ (5 stelle)</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        
                        {/* Pulsanti azioni */}
                        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setWorkoutFilters({ status: '', category: '', difficulty: '', coach: '' });
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                          >
                            Cancella filtri
                          </button>
                          <button
                            onClick={() => setShowWorkoutFilters(false)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            Applica
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
                
                {/* Pulsante Nuova Scheda */}
                <div className="flex justify-end">
                  <button
                    onClick={() => openNewWorkoutPlanModal()}
                    className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-all duration-300 flex items-center space-x-2"
                  >
                    <Plus size={20} />
                    <span>Nuova Scheda</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Lista/Griglia schede */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {filteredWorkoutPlans.length > 0 ? (
                <div className={workoutViewMode === 'grid' 
                  ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 p-8'
                  : 'divide-y divide-gray-200'
                }>
                  {filteredWorkoutPlans.map((plan, index) => (
                    <div
                      key={plan.id}
                      draggable
                      onDragStart={() => handleWorkoutDragStart(plan)}
                      onDragOver={handleWorkoutDragOver}
                      onDrop={() => handleWorkoutDrop(index)}
                      className={workoutViewMode === 'grid'
                        ? 'group bg-white border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 cursor-move'
                        : 'group flex items-center p-6 hover:bg-gray-50 transition-colors cursor-move'
                      }
                    >
                      {workoutViewMode === 'grid' ? (
                        /* Vista griglia espansa */
                        <div className="p-8">
                          {/* Header con drag handle e azioni */}
                          <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center space-x-3">
                              <GripVertical size={18} className="text-gray-400 group-hover:text-gray-600" />
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-navy-900 group-hover:text-red-600 transition-colors mb-2">
                                  {plan.name}
                                </h3>
                                <div className="flex items-center flex-wrap gap-2">
                                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                                    plan.status === 'published'
                                      ? 'bg-green-100 text-green-800'
                                      : plan.status === 'draft'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {plan.status === 'published' ? 'Pubblicata' : 
                                     plan.status === 'draft' ? 'Bozza' : 'Archiviata'}
                                  </span>
                                  {plan.category && (
                                    <span className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full">
                                      {plan.category}
                                    </span>
                                  )}
                                  {plan.difficulty && (
                                    <div className="flex items-center space-x-1 px-3 py-1 bg-yellow-50 rounded-full">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          size={14}
                                          className={i < (['beginner', 'intermediate', 'advanced', 'expert'].indexOf(plan.difficulty || 'beginner') + 1)
                                            ? 'text-yellow-400 fill-current'
                                            : 'text-gray-300'
                                          }
                                        />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col space-y-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => updateWorkoutStatus(plan.id, plan.status === 'published' ? 'draft' : 'published')}
                                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title={plan.status === 'published' ? 'Metti in bozza' : 'Pubblica'}
                                >
                                  {plan.status === 'published' ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button
                                  onClick={() => duplicateWorkoutPlan(plan)}
                                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Duplica scheda"
                                >
                                  <Copy size={18} />
                                </button>
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => openEditWorkoutPlanModal(plan)}
                                  className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                  title="Modifica"
                                >
                                  <Edit size={18} />
                                </button>
                                <button
                                  onClick={() => deleteWorkoutPlan(plan.id)}
                                  className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Elimina"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Descrizione espansa */}
                          <div className="mb-6">
                            <p className="text-gray-700 text-base leading-relaxed">
                              {plan.description || 'Nessuna descrizione disponibile'}
                            </p>
                          </div>

                          {/* Statistiche principali */}
                          <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <UserIcon size={16} className="text-red-600" />
                                <span className="text-sm font-medium text-gray-700">Coach</span>
                              </div>
                              <p className="text-lg font-bold text-navy-900">{plan.coach}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Calendar size={16} className="text-blue-600" />
                                <span className="text-sm font-medium text-gray-700">Durata</span>
                              </div>
                              <p className="text-lg font-bold text-navy-900">{plan.duration} giorni</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Target size={16} className="text-green-600" />
                                <span className="text-sm font-medium text-gray-700">Esercizi</span>
                              </div>
                              <p className="text-lg font-bold text-navy-900">{plan.exercises.length}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <Clock size={16} className="text-purple-600" />
                                <span className="text-sm font-medium text-gray-700">Creata</span>
                              </div>
                              <p className="text-lg font-bold text-navy-900">
                                {plan.createdAt ? new Date(plan.createdAt).toLocaleDateString('it-IT') : 'N/A'}
                              </p>
                            </div>
                          </div>

                          {/* Media preview espanso */}
                          {plan.mediaFiles && plan.mediaFiles.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                                <Image size={16} />
                                <span>File Media ({plan.mediaFiles.length})</span>
                              </h4>
                              <div className="grid grid-cols-2 gap-2">
                                {plan.mediaFiles.slice(0, 4).map((media, idx) => (
                                  <div key={idx} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg text-sm">
                                    {media.type === 'video' && <Play size={14} className="text-red-600" />}
                                    {media.type === 'image' && <Image size={14} className="text-blue-600" />}
                                    {media.type === 'audio' && <Music size={14} className="text-green-600" />}
                                    <span className="truncate text-gray-700">{media.name}</span>
                                  </div>
                                ))}
                                {plan.mediaFiles.length > 4 && (
                                  <div className="flex items-center justify-center p-2 bg-gray-100 rounded-lg text-sm text-gray-600">
                                    +{plan.mediaFiles.length - 4} altri
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Tags espansi */}
                          {plan.tags && plan.tags.length > 0 && (
                            <div className="mb-6">
                              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                                <Tag size={16} />
                                <span>Tags</span>
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {plan.tags.map((tag, idx) => (
                                  <span key={idx} className="inline-flex items-center space-x-1 px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 transition-colors">
                                    <Tag size={12} />
                                    <span>{tag}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Azioni rapide */}
                          <div className="flex space-x-2 pt-4 border-t border-gray-200">
                            <button
                              onClick={() => openEditWorkoutPlanModal(plan)}
                              className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                              <Edit size={16} />
                              <span>Modifica</span>
                            </button>
                            <button
                              onClick={() => duplicateWorkoutPlan(plan)}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                            >
                              <Copy size={16} />
                              <span>Duplica</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Vista lista */
                        <>
                          <div className="flex items-center space-x-4 flex-1">
                            <GripVertical size={16} className="text-gray-400 group-hover:text-gray-600" />
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-3">
                                <h3 className="text-lg font-bold text-navy-900 group-hover:text-red-600 transition-colors truncate">
                                  {plan.name}
                                </h3>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                                  plan.status === 'published'
                                    ? 'bg-green-100 text-green-800'
                                    : plan.status === 'draft'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {plan.status === 'published' ? 'Pubblicata' : 
                                   plan.status === 'draft' ? 'Bozza' : 'Archiviata'}
                                </span>
                                {plan.category && (
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full whitespace-nowrap">
                                    {plan.category}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 text-sm mt-1 truncate">
                                {plan.description || 'Nessuna descrizione disponibile'}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-6 text-sm text-gray-600">
                              <div className="flex items-center space-x-1">
                                <UserIcon size={14} />
                                <span>{plan.coach}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar size={14} />
                                <span>{plan.duration}g</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Target size={14} />
                                <span>{plan.exercises.length}</span>
                              </div>
                              {plan.mediaFiles && plan.mediaFiles.length > 0 && (
                                <div className="flex items-center space-x-1">
                                  <Image size={14} />
                                  <span>{plan.mediaFiles.length}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => updateWorkoutStatus(plan.id, plan.status === 'published' ? 'draft' : 'published')}
                              className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title={plan.status === 'published' ? 'Metti in bozza' : 'Pubblica'}
                            >
                              {plan.status === 'published' ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                            <button
                              onClick={() => duplicateWorkoutPlan(plan)}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Duplica scheda"
                            >
                              <Copy size={16} />
                            </button>
                            <button
                              onClick={() => openEditWorkoutPlanModal(plan)}
                              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="Modifica"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => deleteWorkoutPlan(plan.id)}
                              className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Elimina"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <FileText size={48} className="mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna scheda trovata</h3>
                  <p className="text-gray-600 mb-6">Inizia creando la tua prima scheda di allenamento</p>
                  <button
                    onClick={() => openNewWorkoutPlanModal()}
                    className="inline-flex items-center space-x-2 bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <Plus size={20} />
                    <span>Crea Prima Scheda</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Athlete Modal */}
        {showAthleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-navy-900 mb-6">
                {selectedAthlete ? 'Modifica Atleta' : 'Nuovo Atleta'}
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Nome Completo</label>
                    <input
                      type="text"
                      name="name"
                      value={athleteForm.name}
                      onChange={handleAthleteFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={athleteForm.email}
                      onChange={handleAthleteFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={athleteForm.password}
                    onChange={handleAthleteFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required={!selectedAthlete}
                    placeholder={selectedAthlete ? '(Lascia vuoto per non modificare)' : ''}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Data di Nascita *</label>
                    <input
                      type="date"
                      name="birthDate"
                      value={athleteForm.birthDate}
                      onChange={handleAthleteFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      max="9999-12-31"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Sesso *</label>
                    <select
                      name="gender"
                      value={athleteForm.gender}
                      onChange={handleAthleteFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    >
                      <option value="M">Maschio</option>
                      <option value="F">Femmina</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Codice Fiscale *</label>
                    <input
                      type="text"
                      name="fiscalCode"
                      value={athleteForm.fiscalCode}
                      onChange={handleAthleteFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Luogo di Nascita *</label>
                    <input
                      type="text"
                      name="birthPlace"
                      value={athleteForm.birthPlace}
                      onChange={handleAthleteFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Indirizzo di Residenza *</label>
                  <input
                    type="text"
                    name="address"
                    value={athleteForm.address}
                    onChange={handleAthleteFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Note (facoltativo)</label>
                  <textarea
                    name="notes"
                    value={athleteForm.notes}
                    onChange={handleAthleteFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                    placeholder="Eventuali problemi fisici o richieste particolari..."
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Stato Pagamento</label>
                    <select
                      name="paymentStatus"
                      value={athleteForm.paymentStatus}
                      onChange={handleAthleteFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="pending">In attesa</option>
                      <option value="paid">Pagato</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Data Ultimo Pagamento</label>
                    <input
                      type="date"
                      name="lastPaymentDate"
                      value={athleteForm.lastPaymentDate}
                      onChange={handleAthleteFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      max="9999-12-31"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Stato Tesseramento</label>
                    <select
                      name="membershipStatus"
                      value={athleteForm.membershipStatus}
                      onChange={handleAthleteFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    >
                      <option value="pending">In attesa</option>
                      <option value="active">Attivo</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">File Tesseramento (max 2)</label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        name="membershipFiles"
                        onChange={(e) => {
                          const files = e.target.files;
                          if (files && files.length > 2) {
                            alert('Puoi caricare al massimo 2 file per il tesseramento');
                            e.target.value = '';
                            return;
                          }
                          // Qui gestiremo il caricamento dei file
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        multiple
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <p className="text-sm text-gray-500">Formati accettati: PDF, JPG, PNG</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Fattura (opzionale)</label>
                    <div className="space-y-2">
                      <input
                        type="file"
                        name="invoiceFile"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            // Qui gestiremo il caricamento della fattura
                            setAthleteForm(prev => ({ ...prev, invoiceFilePath: file.name }));
                          }
                        }}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        accept=".pdf,.jpg,.jpeg,.png"
                      />
                      <p className="text-sm text-gray-500">Formati accettati: PDF, JPG, PNG</p>
                    </div>
                  </div>
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

        {/* Workout Plan Modal */}
        {showWorkoutPlanModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
              {/* X Button to close without saving */}
              <button
                onClick={() => {
                  setShowWorkoutPlanModal(false);
                  setSelectedWorkoutPlan(null);
                  setWorkoutPlanForm({
                    name: '',
                    description: '',
                    coach: '',
                    duration: 30,
                    startDate: '',
                    difficulty: 1,
                    tags: '',
                    exercises: []
                  });
                }}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
              
              <h2 className="text-2xl font-bold text-navy-900 mb-6">
                {selectedWorkoutPlan ? 'Modifica Scheda' : 'Nuova Scheda'}
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Nome Scheda</label>
                  <input
                    type="text"
                    name="name"
                    value={workoutPlanForm.name}
                    onChange={handleWorkoutPlanFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Descrizione</label>
                  <textarea
                    name="description"
                    value={workoutPlanForm.description}
                    onChange={handleWorkoutPlanFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-navy-700 font-medium mb-2">Assegna ad Atleta</label>
                  <select
                    name="userId"
                    value={workoutPlanForm.userId || ''}
                    onChange={handleWorkoutPlanFormChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  >
                    <option value="">Seleziona un atleta (opzionale)</option>
                    {athletes.map(athlete => (
                      <option key={athlete.id} value={athlete.id}>
                        {athlete.name} - {athlete.email}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Coach</label>
                    <input
                      type="text"
                      name="coach"
                      value={workoutPlanForm.coach}
                      onChange={handleWorkoutPlanFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Durata (giorni)</label>
                    <input
                      type="number"
                      name="duration"
                      value={workoutPlanForm.duration}
                      onChange={handleWorkoutPlanFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      min="1"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Data Inizio</label>
                    <input
                      type="date"
                      name="startDate"
                      value={workoutPlanForm.startDate}
                      onChange={handleWorkoutPlanFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      max="9999-12-31"
                      required
                    />
                  </div>
                </div>

                {/* Nuovi campi: Difficoltà e Tag */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Livello di Difficoltà</label>
                    <div className="flex items-center space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setWorkoutPlanForm(prev => ({ ...prev, difficulty: star }))}
                          className={`text-2xl transition-colors ${
                            star <= workoutPlanForm.difficulty
                              ? 'text-yellow-400 hover:text-yellow-500'
                              : 'text-gray-300 hover:text-gray-400'
                          }`}
                        >
                          <Star size={24} fill={star <= workoutPlanForm.difficulty ? 'currentColor' : 'none'} />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">({workoutPlanForm.difficulty}/5)</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-navy-700 font-medium mb-2">Tag</label>
                    <input
                      type="text"
                      name="tags"
                      value={workoutPlanForm.tags}
                      onChange={handleWorkoutPlanFormChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      placeholder="es: forza, cardio, principianti (separati da virgola)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-navy-700 font-medium mb-2">File Aggiuntivi (max 5)</label>
                  <div className="space-y-2">
                    <input
                      type="file"
                      name="additionalFiles"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (files && files.length > 5) {
                          alert('Puoi caricare al massimo 5 file aggiuntivi');
                          e.target.value = '';
                          return;
                        }
                        // Qui gestiremo il caricamento dei file
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    <p className="text-sm text-gray-500">Formati accettati: PDF, JPG, PNG, DOC</p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-navy-900">Esercizi</h3>
                    <button
                      type="button"
                      onClick={addExercise}
                      className="text-red-600 hover:text-red-700 font-medium flex items-center space-x-1"
                    >
                      <Plus size={16} />
                      <span>Aggiungi Esercizio</span>
                    </button>
                  </div>
                  
                  {workoutPlanForm.exercises.map((exercise, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg mb-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-navy-900">Esercizio {index + 1}</h4>
                        <button
                          type="button"
                          onClick={() => removeExercise(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                        <div>
                          <label className="block text-navy-700 text-sm mb-1">Nome Esercizio</label>
                          <input
                            type="text"
                            value={exercise.name}
                            onChange={(e) => handleExerciseChange(index, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-navy-700 text-sm mb-1">Serie</label>
                            <input
                              type="number"
                              value={exercise.sets}
                              onChange={(e) => handleExerciseChange(index, 'sets', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                              min="1"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-navy-700 text-sm mb-1">Ripetizioni</label>
                            <input
                              type="number"
                              value={exercise.reps}
                              onChange={(e) => handleExerciseChange(index, 'reps', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                              min="1"
                              required
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-navy-700 text-sm mb-1">Descrizione / Note</label>
                        <input
                          type="text"
                          value={exercise.description}
                          onChange={(e) => handleExerciseChange(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm"
                          placeholder="Peso, note tecniche, ecc."
                        />
                      </div>
                    </div>
                  ))}
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

        {/* Assign Workout Plan Modal */}
        {showAssignModal && selectedAthlete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-navy-900 mb-2">
                Assegna Scheda a {selectedAthlete.name}
              </h2>
              <p className="text-navy-700 mb-6">Seleziona una scheda da assegnare all'atleta</p>
              
              {/* Schede già assegnate */}
              {selectedAthlete.workoutPlans.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-navy-900 mb-3">Schede Assegnate</h3>
                  <div className="space-y-2">
                    {selectedAthlete.workoutPlans.map((plan) => (
                      <div key={plan.id} className="flex justify-between items-center p-3 border border-gray-200 rounded-lg">
                        <div>
                          <div className="font-medium text-navy-900">{plan.name}</div>
                          <div className="text-sm text-navy-700">Coach: {plan.coach}</div>
                        </div>
                        <button
                          onClick={() => removeWorkoutPlanFromAthlete(selectedAthlete, plan.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Schede disponibili */}
              <div>
                <h3 className="text-lg font-semibold text-navy-900 mb-3">Schede Disponibili</h3>
                {workoutPlans.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workoutPlans.map((plan) => (
                      <div 
                        key={plan.id} 
                        className="p-4 border border-gray-200 rounded-lg hover:border-red-200 cursor-pointer transition-colors duration-300"
                        onClick={() => assignWorkoutPlan(plan.id)}
                      >
                        <div className="font-medium text-navy-900 mb-1">{plan.name}</div>
                        <div className="text-sm text-navy-700">Coach: {plan.coach}</div>
                        <div className="text-sm text-navy-700">Durata: {plan.duration} giorni</div>
                        <div className="text-sm text-navy-700">Esercizi: {plan.exercises.length}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">Nessuna scheda disponibile</p>
                )}
              </div>
              
              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-navy-700 hover:bg-gray-50 transition-colors duration-300"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal di conferma eliminazione */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Conferma Eliminazione</h2>
              <p className="text-gray-700 mb-6">Sei sicuro di voler eliminare questo atleta? Questa azione non può essere annullata.</p>
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

        {/* Modal di conferma eliminazione scheda */}
        {showDeleteWorkoutModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Conferma Eliminazione</h3>
              <p className="text-gray-600 mb-6">Sei sicuro di voler eliminare questa scheda? Questa azione non può essere annullata.</p>
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
