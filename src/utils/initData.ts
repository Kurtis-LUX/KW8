import DB, { WorkoutPlan, Exercise, Subscription, User } from './database';
import { v4 as uuidv4 } from 'uuid';

// Funzione per inizializzare il database con dati di esempio
export const initializeData = () => {
  // Verifica se il database è già stato inizializzato con dati di esempio
  if (typeof window === 'undefined' || !window.localStorage) return;
  if (DB.getItem('kw8_data_initialized')) return;
  
  // Crea abbonamenti predefiniti
  const subscriptions: Subscription[] = [
    {
      id: '1',
      type: 'standard',
      price: 39.99,
      duration: 1, // mesi
      features: [
        'Accesso illimitato alla sala pesi',
        'Accesso alle lezioni di gruppo',
        'Armadietto personale',
        'Consulenza nutrizionale mensile'
      ]
    },
    {
      id: '2',
      type: 'entry-flex',
      price: 29.99,
      duration: 1, // mesi
      features: [
        'Accesso limitato alla sala pesi (8:00-16:00)',
        'Accesso alle lezioni di gruppo base',
        'Armadietto condiviso'
      ]
    }
  ];
  
  // Salva gli abbonamenti
  subscriptions.forEach(subscription => DB.saveSubscription(subscription));
  
  // Crea utenti di esempio (l'admin viene creato automaticamente da database.ts)
  const users: User[] = [
    {
      id: uuidv4(),
      email: 'mario.rossi@example.com',
      name: 'Mario Rossi',
      role: 'atleta',
      subscriptionType: 'standard',
      subscriptionEndDate: new Date(2025, 5, 15).toISOString(),
      workoutPlans: [],
      birthDate: new Date(1990, 5, 15).toISOString(),
      gender: 'M',
      fiscalCode: 'RSSMRA90H15F205X',
      birthPlace: 'Roma',
      address: 'Via Roma 123, Roma',
      notes: 'Atleta esperto, preferisce allenamenti serali',
      paymentStatus: 'paid',
      membershipStatus: 'active'
    },
    {
      id: uuidv4(),
      email: 'giulia.bianchi@example.com',
      name: 'Giulia Bianchi',
      role: 'atleta',
      subscriptionType: 'entry-flex',
      subscriptionEndDate: new Date(2025, 3, 20).toISOString(),
      workoutPlans: [],
      birthDate: new Date(1995, 2, 10).toISOString(),
      gender: 'F',
      fiscalCode: 'BNCGLI95C50H501Y',
      birthPlace: 'Milano',
      address: 'Via Milano 456, Milano',
      notes: 'Principiante, necessita di supporto iniziale',
      paymentStatus: 'pending',
      membershipStatus: 'pending'
    }
  ];
  
  // Crea esercizi di esempio
  const exercises: Exercise[] = [
    {
      id: uuidv4(),
      name: 'Squat',
      sets: 4,
      reps: 8,
      rest: 90,
      description: '80kg',
      imageUrl: '/images/exercises/squat.jpg'
    },
    {
      id: uuidv4(),
      name: 'Panca Piana',
      sets: 4,
      reps: 6,
      rest: 120,
      description: '70kg',
      imageUrl: '/images/exercises/bench-press.jpg'
    },
    {
      id: uuidv4(),
      name: 'Stacco da Terra',
      sets: 3,
      reps: 5,
      rest: 180,
      description: '100kg',
      imageUrl: '/images/exercises/deadlift.jpg'
    },
    {
      id: uuidv4(),
      name: 'Military Press',
      sets: 3,
      reps: 8,
      rest: 90,
      description: '45kg',
      imageUrl: '/images/exercises/military-press.jpg'
    },
    {
      id: uuidv4(),
      name: 'Trazioni',
      sets: 3,
      reps: 10,
      rest: 90,
      description: 'Corpo libero',
      imageUrl: '/images/exercises/pull-ups.jpg'
    }
  ];
  
  // Crea piani di allenamento di esempio
  const workoutPlans: WorkoutPlan[] = [
    {
      id: uuidv4(),
      name: 'Programma Forza - Settimana 3',
      description: 'Programma completo per lo sviluppo della forza muscolare',
      coach: 'Giuseppe Pandolfo',
      startDate: new Date(2025, 0, 15).toISOString(),
      duration: 56, // 8 settimane in giorni
      exercises: [
        exercises[0], // Squat
        exercises[1], // Panca Piana
        exercises[2], // Stacco da Terra
        exercises[3], // Military Press
        exercises[4]  // Trazioni
      ],
      userId: users[0].id, // Assegna a Mario Rossi
      category: 'strength',
      status: 'published',
      mediaFiles: {
        images: [],
        videos: [],
        audio: []
      },
      tags: ['forza', 'massa', 'powerlifting'],
      order: 0,
      createdAt: new Date(2025, 0, 1).toISOString(),
      updatedAt: new Date(2025, 0, 15).toISOString(),
      difficulty: 'intermediate',
      targetMuscles: ['quadricipiti', 'pettorali', 'dorsali', 'spalle']
    },
    {
      id: uuidv4(),
      name: 'Programma Tonificazione',
      description: 'Programma di tonificazione per principianti',
      coach: 'Saverio Di Maria',
      startDate: new Date(2025, 0, 10).toISOString(),
      duration: 42, // 6 settimane in giorni
      exercises: [
        exercises[4], // Trazioni
        exercises[0], // Squat
        exercises[3]  // Military Press
      ],
      userId: users[1].id, // Assegna a Giulia Bianchi
      category: 'cardio',
      status: 'published',
      mediaFiles: {
        images: [],
        videos: [],
        audio: []
      },
      tags: ['tonificazione', 'principianti', 'fitness'],
      order: 1,
      createdAt: new Date(2025, 0, 5).toISOString(),
      updatedAt: new Date(2025, 0, 10).toISOString(),
      difficulty: 'beginner',
      targetMuscles: ['dorsali', 'quadricipiti', 'spalle']
    }
  ];
  
  // Aggiorna gli utenti con i riferimenti ai piani di allenamento
  users[0].workoutPlans = [workoutPlans[0].id];
  users[1].workoutPlans = [workoutPlans[1].id];
  
  // Salva tutti i dati nel database
  users.forEach(user => DB.saveUser(user));
  workoutPlans.forEach(plan => DB.saveWorkoutPlan(plan));
  
  // Segna il database come inizializzato con dati di esempio
  if (typeof window !== 'undefined' && window.localStorage) {
    DB.setItem('kw8_data_initialized', 'true');
  }
};

export default initializeData;