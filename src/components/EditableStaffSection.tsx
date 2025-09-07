import React, { useState, useEffect } from 'react';
import { Dumbbell, Heart, Apple, Users, Zap, Shield, Edit, Plus, Trash2, X, Save, RotateCcw, Edit2, Trophy, Target, Star, Award, CheckCircle, Upload } from 'lucide-react';
import { getStaffSection, saveStaffSection, subscribeToStaffSection } from '../utils/database';
import { authService } from '../services/authService';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  description: string;
  image: string;
  iconName: string;
  icon: any;
  nameColor: string;
  roleColor: string;
  descriptionColor: string;
  iconColor: string;
  overlayColor: string;
  certifications: string[];
  createdAt: string;
  updatedAt: string;
}

interface StaffSectionData {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  staff: StaffMember[];
  createdAt: string;
  updatedAt: string;
}

const iconOptions = [
  { name: 'Dumbbell', component: Dumbbell, label: 'Manubrio' },
  { name: 'Heart', component: Heart, label: 'Cuore' },
  { name: 'Apple', component: Apple, label: 'Mela' },
  { name: 'Users', component: Users, label: 'Utenti' },
  { name: 'Zap', component: Zap, label: 'Fulmine' },
  { name: 'Shield', component: Shield, label: 'Scudo' }
];

const colorOptions = [
  { value: 'text-white', label: 'Bianco' },
  { value: 'text-gray-300', label: 'Grigio Chiaro' },
  { value: 'text-gray-400', label: 'Grigio' },
  { value: 'text-gray-700', label: 'Grigio Scuro' },
  { value: 'text-blue-900', label: 'Blu Scuro' },
  { value: 'text-red-600', label: 'Rosso' },
  { value: 'text-green-600', label: 'Verde' },
  { value: 'text-yellow-600', label: 'Giallo' },
  { value: 'text-purple-600', label: 'Viola' }
];

const overlayColorOptions = [
  { value: 'rgba(30, 58, 138, 0.7)', label: 'Blu' },
  { value: 'rgba(220, 38, 38, 0.7)', label: 'Rosso' },
  { value: 'rgba(255, 255, 255, 0.7)', label: 'Bianco' },
  { value: 'rgba(251, 191, 36, 0.7)', label: 'Giallo' },
  { value: 'rgba(34, 197, 94, 0.7)', label: 'Verde' },
  { value: 'rgba(168, 85, 247, 0.7)', label: 'Viola' }
];

interface EditableStaffSectionProps {
  currentUser?: {
    id: string;
    email: string;
    role: 'admin' | 'coach' | 'user';
    name?: string;
  } | null;
}

const EditableStaffSection: React.FC<EditableStaffSectionProps> = ({ currentUser }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<StaffMember | null>(null);
  const [showCertModal, setShowCertModal] = useState(false);
  const [editingCertifications, setEditingCertifications] = useState<string[]>([]);
  const [newCertification, setNewCertification] = useState('');
  const [hasCoachAccess, setHasCoachAccess] = useState(false);
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSectionEditModal, setShowSectionEditModal] = useState(false);
  const [staffData, setStaffData] = useState<StaffSectionData>({
    id: 'staff-section',
    title: 'Il nostro team',
    subtitle: '',
    description: 'Il nostro team di professionisti qualificati è qui per guidarti nel tuo percorso di fitness.',
    staff: [
      {
          id: 'giuseppe-pandolfo',
          name: 'Giuseppe Pandolfo',
          role: 'Personal Trainer Sala Pesi',
          description: 'Certificazioni, esperienza, lavoro affiancato personalizzato.',
          image: '/images/giuseppe pandolfo.jpg',
          iconName: 'Dumbbell',
          icon: Dumbbell,
          nameColor: 'text-blue-900',
          roleColor: 'text-red-600',
          descriptionColor: 'text-gray-700',
          iconColor: 'text-white',
          overlayColor: 'rgba(30, 58, 138, 0.7)',
          certifications: [
            'Certificazione ISSA Personal Trainer',
            'Specializzazione Bodybuilding',
            'Corso Nutrizione Sportiva',
            '5+ anni di esperienza',
            'Specialista in Powerlifting'
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'saverio-di-maria',
          name: 'Saverio Di Maria',
          role: 'Coach Cross training',
          description: 'Certificazioni, attenzione agli obiettivi individuali.',
          image: '/images/saverio dimaria.jpg',
          iconName: 'Zap',
          icon: Zap,
          nameColor: 'text-blue-900',
          roleColor: 'text-red-600',
          descriptionColor: 'text-gray-700',
          iconColor: 'text-white',
          overlayColor: 'rgba(220, 38, 38, 0.7)',
          certifications: [
            'Certificazione CrossFit Level 2',
            'Functional Movement Screen',
            'Corso Olimpic Lifting',
            '4+ anni di esperienza',
            'Specialista in Functional Training'
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'simone-la-rosa',
          name: 'Simone La Rosa',
          role: 'Maestro Karate',
          description: 'Cintura, certificazioni, focus su autodifesa e disciplina.',
          image: '/images/simone larosa.jpg',
          iconName: 'Shield',
          icon: Shield,
          nameColor: 'text-blue-900',
          roleColor: 'text-red-600',
          descriptionColor: 'text-gray-700',
          iconColor: 'text-white',
          overlayColor: 'rgba(255, 255, 255, 0.7)',
          certifications: [
            'Cintura Nera 3° Dan',
            'Istruttore Federale FIJLKAM',
            'Corso Autodifesa',
            '10+ anni di esperienza',
            'Specialista in Karate Tradizionale'
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'eleonora-perico',
          name: 'Eleonora Perico',
          role: 'Maestra Yoga',
          description: 'Approccio olistico e personalizzazione in base alle esigenze.',
          image: '/images/eleonora nonnehoidea.jpg',
          iconName: 'Heart',
          icon: Heart,
          nameColor: 'text-blue-900',
          roleColor: 'text-red-600',
          descriptionColor: 'text-gray-700',
          iconColor: 'text-white',
          overlayColor: 'rgba(251, 191, 36, 0.7)',
          certifications: [
            'Certificazione Yoga Alliance 500h',
            'Specializzazione Hatha Yoga',
            'Corso Meditazione Mindfulness',
            '6+ anni di esperienza',
            'Specialista in Yoga Terapeutico'
          ],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  
  const [originalStaffData, setOriginalStaffData] = useState<StaffSectionData | null>(null);
  
  // Stati per la modifica della sezione
  const [sectionData, setSectionData] = useState({
    title: 'Il nostro team',
    titleColor: 'text-white',
    subtitle: '',
    subtitleColor: 'text-gray-300',
    description: 'Il nostro team di professionisti qualificati è qui per guidarti nel tuo percorso di fitness.',
    descriptionColor: 'text-gray-400',
    icon: 'Users',
    iconColor: 'text-blue-400',
    backgroundImage: '/images/team-bg.jpg'
  });

  const [newMemberData, setNewMemberData] = useState({
    name: 'Nuovo Coach',
    role: 'Personal Trainer',
    description: 'Descrizione del nuovo coach',
    image: '/images/default-coach.jpg',
    iconName: 'Dumbbell',
    nameColor: 'text-blue-900',
    roleColor: 'text-red-600',
    descriptionColor: 'text-gray-700',
    iconColor: 'text-white',
    overlayColor: 'rgba(30, 58, 138, 0.7)',
    certifications: ['Nuova certificazione']
  });

  const [editingCoachData, setEditingCoachData] = useState<StaffMember | null>(null);

  // Caricamento dati dal database
  useEffect(() => {
    const loadStaffData = async () => {
      try {
        const data = await getStaffSection();
        if (data) {
          setStaffData(data);
          setSectionData({
            title: data.title,
            titleColor: data.titleColor || 'text-white',
            subtitle: data.subtitle,
            subtitleColor: data.subtitleColor || 'text-gray-300',
            description: data.description,
            descriptionColor: data.descriptionColor || 'text-gray-400',
            icon: data.icon || 'Users',
            iconColor: data.iconColor || 'text-blue-400',
            backgroundImage: data.backgroundImage || '/images/team-bg.jpg'
          });
        }
      } catch (error) {
        console.error('Error loading staff data:', error);
      }
    };

    loadStaffData();

    // Sottoscrizione per aggiornamenti in tempo reale
    let unsubscribe: (() => void) | null = null;
    
    const setupSubscription = async () => {
      try {
        unsubscribe = await subscribeToStaffSection((data) => {
          if (data) {
            setStaffData(data);
          }
        });
      } catch (error) {
        console.error('Error setting up staff subscription:', error);
      }
    };
    
    setupSubscription();

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    // Verifica se l'utente corrente ha accesso coach
    setHasCoachAccess(currentUser?.role === 'coach' || currentUser?.role === 'admin');
  }, [currentUser]);

  const handleSectionEdit = () => {
    setOriginalStaffData({ ...staffData });
    setShowSectionEditModal(true);
  };

  const handleSectionSave = async () => {
    try {
      const updatedData = {
        ...staffData,
        title: sectionData.title,
        subtitle: sectionData.subtitle,
        description: sectionData.description,
        titleColor: sectionData.titleColor,
        subtitleColor: sectionData.subtitleColor,
        descriptionColor: sectionData.descriptionColor,
        icon: sectionData.icon,
        iconColor: sectionData.iconColor,
        backgroundImage: sectionData.backgroundImage,
        updatedAt: new Date().toISOString()
      };
      
      await saveStaffSection(updatedData);
      setStaffData(updatedData);
      setShowSectionEditModal(false);
      setOriginalStaffData(null);
    } catch (error) {
      console.error('Error saving section data:', error);
      alert('Errore nel salvataggio. Riprova.');
    }
  };

  const handleSectionCancel = () => {
    if (originalStaffData) {
      setStaffData(originalStaffData);
      setSectionData({
        title: originalStaffData.title,
        titleColor: originalStaffData.titleColor || 'text-white',
        subtitle: originalStaffData.subtitle,
        subtitleColor: originalStaffData.subtitleColor || 'text-gray-300',
        description: originalStaffData.description,
        descriptionColor: originalStaffData.descriptionColor || 'text-gray-400',
        icon: originalStaffData.icon || 'Users',
        iconColor: originalStaffData.iconColor || 'text-blue-400',
        backgroundImage: originalStaffData.backgroundImage || '/images/team-bg.jpg'
      });
    }
    setShowSectionEditModal(false);
    setOriginalStaffData(null);
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = iconOptions.find(option => option.name === iconName);
    return iconOption ? iconOption.component : Users;
  };

  const handleAddCoach = () => {
    setShowAddModal(true);
  };

  const handleSaveNewCoach = async () => {
    try {
      const newCoach: StaffMember = {
        id: Date.now().toString(),
        name: newMemberData.name,
        role: newMemberData.role,
        description: newMemberData.description,
        image: newMemberData.image,
        iconName: newMemberData.iconName,
        icon: getIconComponent(newMemberData.iconName),
        nameColor: newMemberData.nameColor,
        roleColor: newMemberData.roleColor,
        descriptionColor: newMemberData.descriptionColor,
        iconColor: newMemberData.iconColor,
        overlayColor: newMemberData.overlayColor,
        certifications: newMemberData.certifications,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedData = {
        ...staffData,
        staff: [...staffData.staff, newCoach],
        updatedAt: new Date().toISOString()
      };

      await saveStaffSection(updatedData);
      setStaffData(updatedData);
      setShowAddModal(false);
      
      // Reset form
      setNewMemberData({
        name: 'Nuovo Coach',
        role: 'Personal Trainer',
        description: 'Descrizione del nuovo coach',
        image: '/images/default-coach.jpg',
        iconName: 'Dumbbell',
        nameColor: 'text-blue-900',
        roleColor: 'text-red-600',
        descriptionColor: 'text-gray-700',
        iconColor: 'text-white',
        overlayColor: 'rgba(30, 58, 138, 0.7)',
        certifications: ['Nuova certificazione']
      });
    } catch (error) {
      console.error('Error adding new coach:', error);
      alert('Errore nell\'aggiunta del coach. Riprova.');
    }
  };

  const handleEditCoach = (coach: StaffMember) => {
    setEditingCoachData({ ...coach });
    setEditingMember(staffData.staff.findIndex(c => c.id === coach.id));
  };

  const handleSaveEditCoach = async () => {
    if (!editingCoachData || editingMember === null) return;

    try {
      const updatedStaff = staffData.staff.map((coach, index) => 
        index === editingMember 
          ? { ...editingCoachData, updatedAt: new Date().toISOString() }
          : coach
      );

      const updatedData = {
        ...staffData,
        staff: updatedStaff,
        updatedAt: new Date().toISOString()
      };

      await saveStaffSection(updatedData);
      setStaffData(updatedData);
      setEditingMember(null);
      setEditingCoachData(null);
    } catch (error) {
      console.error('Error updating coach:', error);
      alert('Errore nell\'aggiornamento del coach. Riprova.');
    }
  };

  const handleDeleteCoach = async (coachId: string) => {
    if (staffData.staff.length <= 1) {
      alert('Deve rimanere almeno un coach nella sezione.');
      return;
    }

    if (confirm('Sei sicuro di voler eliminare questo coach?')) {
      try {
        const updatedStaff = staffData.staff.filter(coach => coach.id !== coachId);
        const updatedData = {
          ...staffData,
          staff: updatedStaff,
          updatedAt: new Date().toISOString()
        };

        await saveStaffSection(updatedData);
        setStaffData(updatedData);
      } catch (error) {
        console.error('Error deleting coach:', error);
        alert('Errore nell\'eliminazione del coach. Riprova.');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingMember(null);
    setEditingCoachData(null);
  };

  const handleAddCertification = async () => {
    if (!newCertification.trim() || !selectedCoach) return;
    
    const updatedCertifications = [...selectedCoach.certifications, newCertification.trim()];
    const updatedCoach = { ...selectedCoach, certifications: updatedCertifications };
    setSelectedCoach(updatedCoach);
    setNewCertification('');
    
    await handleUpdateCoachCertifications(updatedCoach);
  };

  const handleUpdateCoachCertifications = async (updatedCoach: StaffMember) => {
    try {
      const updatedStaff = staffData.staff.map(coach => 
        coach.id === updatedCoach.id 
          ? { ...updatedCoach, updatedAt: new Date().toISOString() }
          : coach
      );

      const updatedData = {
        ...staffData,
        staff: updatedStaff,
        updatedAt: new Date().toISOString()
      };

      await saveStaffSection(updatedData);
      setStaffData(updatedData);
    } catch (error) {
      console.error('Error updating coach certifications:', error);
      alert('Errore nell\'aggiornamento delle certificazioni. Riprova.');
    }
  };

  const handleCancelAdd = () => {
    setShowAddModal(false);
    setNewMemberData({
      name: 'Nuovo Coach',
      role: 'Personal Trainer',
      description: 'Descrizione del nuovo coach',
      image: '/images/default-coach.jpg',
      iconName: 'Dumbbell',
      nameColor: 'text-blue-900',
      roleColor: 'text-red-600',
      descriptionColor: 'text-gray-700',
      iconColor: 'text-white',
      overlayColor: 'rgba(30, 58, 138, 0.7)',
      certifications: ['Nuova certificazione']
    });
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
        style={{ backgroundImage: `url(${sectionData.backgroundImage})` }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header con tasti modifica e aggiungi */}
        <div className="text-center mb-16 relative">
          {currentUser && (currentUser.role === 'coach' || currentUser.role === 'admin') && (
            <div className="absolute top-0 right-0 flex gap-2">
              <button
                onClick={handleAddCoach}
                className="flex items-center justify-center p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                title="Aggiungi coach"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
          
          <div className="flex justify-center mb-6">
            {React.createElement(getIconComponent(sectionData.icon), {
              size: 48,
              className: sectionData.iconColor
            })}
          </div>
          
          <h2 className={`text-4xl md:text-5xl font-bold mb-4 ${sectionData.titleColor}`}>
            {sectionData.title}
          </h2>
          
          <p className={`text-xl mb-6 ${sectionData.subtitleColor}`}>
            {sectionData.subtitle}
          </p>
          
          <p className={`text-lg max-w-3xl mx-auto ${sectionData.descriptionColor}`}>
            {sectionData.description}
          </p>
        </div>

        {/* Layout dei coach */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-8">
          {staffData.staff.map((member, index) => {
            const IconComponent = getIconComponent(member.iconName);
            
            return (
              <div key={member.id} className="group relative">
                {/* Pulsanti di modifica ed eliminazione */}
                {currentUser && (currentUser.role === 'coach' || currentUser.role === 'admin') && (
                  <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCoach(member);
                      }}
                      className="flex items-center justify-center p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      title="Modifica coach"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCoach(member.id);
                      }}
                      className="flex items-center justify-center p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      title="Elimina coach"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl">
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div 
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ backgroundColor: member.overlayColor }}
                    >
                      <IconComponent size={48} className={member.iconColor} />
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className={`text-xl font-bold mb-2 ${member.nameColor}`}>
                      {member.name}
                    </h3>
                    <p className={`text-sm font-medium mb-3 ${member.roleColor}`}>
                      {member.role}
                    </p>
                    <p className={`text-sm leading-relaxed ${member.descriptionColor}`}>
                      {member.description}
                    </p>
                    
                    <button
                      onClick={() => {
                        setSelectedCoach(member);
                        setShowCertModal(true);
                      }}
                      className="mt-4 w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
                    >
                      Vedi Certificazioni
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Modifica Sezione */}
      {showSectionEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Modifica Sezione Team</h3>
                <button
                  onClick={handleSectionCancel}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Titolo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titolo</label>
                  <input
                    type="text"
                    value={sectionData.title}
                    onChange={(e) => setSectionData({...sectionData, title: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={sectionData.titleColor}
                    onChange={(e) => setSectionData({...sectionData, titleColor: e.target.value})}
                    className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sottotitolo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sottotitolo</label>
                  <input
                    type="text"
                    value={sectionData.subtitle}
                    onChange={(e) => setSectionData({...sectionData, subtitle: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={sectionData.subtitleColor}
                    onChange={(e) => setSectionData({...sectionData, subtitleColor: e.target.value})}
                    className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Descrizione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                  <textarea
                    value={sectionData.description}
                    onChange={(e) => setSectionData({...sectionData, description: e.target.value})}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <select
                    value={sectionData.descriptionColor}
                    onChange={(e) => setSectionData({...sectionData, descriptionColor: e.target.value})}
                    className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Icona */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Icona</label>
                  <select
                    value={sectionData.icon}
                    onChange={(e) => setSectionData({...sectionData, icon: e.target.value})}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {iconOptions.map(option => (
                      <option key={option.name} value={option.name}>{option.label}</option>
                    ))}
                  </select>
                  <select
                    value={sectionData.iconColor}
                    onChange={(e) => setSectionData({...sectionData, iconColor: e.target.value})}
                    className="w-full mt-2 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                {/* Immagine di sfondo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Immagine di sfondo</label>
                  <input
                    type="text"
                    value={sectionData.backgroundImage}
                    onChange={(e) => setSectionData({...sectionData, backgroundImage: e.target.value})}
                    placeholder="URL dell'immagine"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSectionSave}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Salva Modifiche
                </button>
                <button
                  onClick={handleSectionCancel}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Certificazioni */}
      {showCertModal && selectedCoach && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Certificazioni</h3>
                <button
                  onClick={() => setShowCertModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{selectedCoach.name}</h4>
                <p className="text-sm text-gray-600 mb-4">{selectedCoach.role}</p>
              </div>
              
              <div className="space-y-3">
                {selectedCoach.certifications.map((cert, index) => (
                  <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-blue-500 flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-800">{cert}</p>
                    {editingCertifications && currentUser && (currentUser.role === 'coach' || currentUser.role === 'admin') && (
                      <button
                        onClick={() => {
                          const updatedCertifications = selectedCoach.certifications.filter((_, i) => i !== index);
                          const updatedCoach = { ...selectedCoach, certifications: updatedCertifications };
                          setSelectedCoach(updatedCoach);
                          handleUpdateCoachCertifications(updatedCoach);
                        }}
                        className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition-colors"
                        title="Rimuovi certificazione"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                
                {editingCertifications && currentUser && (currentUser.role === 'coach' || currentUser.role === 'admin') && (
                  <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCertification}
                        onChange={(e) => setNewCertification(e.target.value)}
                        placeholder="Nuova certificazione"
                        className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCertification();
                          }
                        }}
                      />
                      <button
                        onClick={handleAddCertification}
                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded transition-colors flex items-center gap-1"
                      >
                        <Plus size={16} />
                        Aggiungi
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {currentUser && (currentUser.role === 'coach' || currentUser.role === 'admin') && (
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={() => {
                      setEditingCertifications(!editingCertifications);
                      setNewCertification('');
                    }}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 ${
                      editingCertifications 
                        ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {editingCertifications ? (
                      <>
                        <CheckCircle size={16} />
                        Termina Modifica
                      </>
                    ) : (
                      <>
                        <Edit2 size={16} />
                        Modifica Certificazioni
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Aggiungi Coach */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Aggiungi Nuovo Coach</h3>
                <button
                  onClick={handleCancelAdd}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informazioni base */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input
                      type="text"
                      value={newMemberData.name}
                      onChange={(e) => setNewMemberData({...newMemberData, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo</label>
                    <input
                      type="text"
                      value={newMemberData.role}
                      onChange={(e) => setNewMemberData({...newMemberData, role: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                    <textarea
                      value={newMemberData.description}
                      onChange={(e) => setNewMemberData({...newMemberData, description: e.target.value})}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Immagine Coach</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setNewMemberData({...newMemberData, image: event.target?.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {newMemberData.image && (
                      <div className="mt-2">
                        <img src={newMemberData.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Stili e colori */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icona</label>
                    <select
                      value={newMemberData.iconName}
                      onChange={(e) => setNewMemberData({...newMemberData, iconName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {iconOptions.map(option => (
                        <option key={option.name} value={option.name}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Colore Nome</label>
                    <select
                      value={newMemberData.nameColor}
                      onChange={(e) => setNewMemberData({...newMemberData, nameColor: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Colore Ruolo</label>
                    <select
                      value={newMemberData.roleColor}
                      onChange={(e) => setNewMemberData({...newMemberData, roleColor: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  

                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSaveNewCoach}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Salva Coach
                </button>
                <button
                  onClick={handleCancelAdd}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifica Coach */}
      {editingMember !== null && editingCoachData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">Modifica Coach</h3>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Informazioni base */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                    <input
                      type="text"
                      value={editingCoachData.name}
                      onChange={(e) => setEditingCoachData({...editingCoachData, name: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Ruolo</label>
                    <input
                      type="text"
                      value={editingCoachData.role}
                      onChange={(e) => setEditingCoachData({...editingCoachData, role: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Descrizione</label>
                    <textarea
                      value={editingCoachData.description}
                      onChange={(e) => setEditingCoachData({...editingCoachData, description: e.target.value})}
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Immagine Coach</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            setEditingCoachData({...editingCoachData, image: event.target?.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {editingCoachData.image && (
                      <div className="mt-2">
                        <img src={editingCoachData.image} alt="Preview" className="w-20 h-20 object-cover rounded-lg" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Stili e colori */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Icona</label>
                    <select
                      value={editingCoachData.iconName}
                      onChange={(e) => setEditingCoachData({...editingCoachData, iconName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {iconOptions.map(option => (
                        <option key={option.name} value={option.name}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Colore Nome</label>
                    <select
                      value={editingCoachData.nameColor}
                      onChange={(e) => setEditingCoachData({...editingCoachData, nameColor: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Colore Ruolo</label>
                    <select
                      value={editingCoachData.roleColor}
                      onChange={(e) => setEditingCoachData({...editingCoachData, roleColor: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Certificazioni (una per riga)</label>
                    <textarea
                      value={editingCoachData.certifications.join('\n')}
                      onChange={(e) => setEditingCoachData({...editingCoachData, certifications: e.target.value.split('\n').filter(cert => cert.trim())})}
                      rows={4}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Inserisci una certificazione per riga"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex gap-4 mt-8">
                <button
                  onClick={handleSaveEditCoach}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  Salva Modifiche
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  <RotateCcw size={20} />
                  Annulla
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default EditableStaffSection;