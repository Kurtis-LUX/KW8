import React, { useEffect, useState } from 'react';
import { ChevronLeft, CheckCircle, User as UserIcon, Phone as PhoneIcon } from 'lucide-react';
import firestoreService from '../services/firestoreService';
import { authService } from '../services/authService';

interface AthleteProfilePageProps {
  currentUser?: User | null;
  onNavigateHome?: () => void;
  onUserUpdated?: (user: User) => void;
}

const AthleteProfilePage: React.FC<AthleteProfilePageProps> = ({ currentUser, onNavigateHome, onUserUpdated }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [firstNameTouched, setFirstNameTouched] = useState(false);
  const [lastNameTouched, setLastNameTouched] = useState(false);
  const [phoneTouched, setPhoneTouched] = useState(false);

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  const validatePhone = (val: string): boolean => {
    const clean = val.replace(/\s+/g, '');
    return /^\+?[0-9]{7,15}$/.test(clean);
  };

  // Deriva inizialmente nome/cognome dal currentUser, poi prova a caricare da Firestore
  useEffect(() => {
    const init = async () => {
      const email = currentUser?.email || '';
      // Split "Nome Cognome" se presente
      const fullName = (currentUser?.name || '').trim();
      if (fullName) {
        const parts = fullName.split(' ');
        setFirstName(parts[0] || '');
        setLastName(parts.slice(1).join(' ') || '');
      }
      // Carica telefono e eventuale nome aggiornato da Firestore
      try {
        if (email) {
          const fsUser = await firestoreService.getUserByEmail(email);
          if (fsUser) {
            if (fsUser.name) {
              const p = String(fsUser.name).trim().split(' ');
              setFirstName(p[0] || firstName);
              setLastName(p.slice(1).join(' ') || lastName);
            }
            if (fsUser.phone) setPhone(fsUser.phone);
          }
        }
      } catch (e) {
        console.warn('Profilo: impossibile caricare da Firestore (continua con dati locali)', e);
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSave = async () => {
    clearMessages();
    if (!firstName.trim() || !lastName.trim()) {
      setError('Inserisci Nome e Cognome');
      return;
    }
    if (phone && !validatePhone(phone)) {
      setError('Inserisci un numero di telefono valido');
      return;
    }
    if (!currentUser || !currentUser.email) {
      setError('Utente non autenticato');
      return;
    }

    setLoading(true);
    try {
      const updatedName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const email = currentUser.email.trim();

      // Aggiorna o crea il profilo su Firestore
      try {
        const fsUser = await firestoreService.getUserByEmail(email);
        if (fsUser?.id) {
          await firestoreService.updateUser(fsUser.id, {
            name: updatedName,
            phone: phone.trim(),
          });
        } else {
          await firestoreService.createUser({
            name: updatedName,
            email,
            phone: phone.trim(),
            role: 'athlete',
            certificatoMedicoStato: 'non_presente',
            notes: '',
            birthDate: '',
            address: '',
          } as any);
        }
      } catch (fsErr) {
        console.warn('Salvataggio Firestore non riuscito, proseguo con aggiornamento locale', fsErr);
      }

      // Aggiorna utente nella sessione locale
      const localUser = authService.getCurrentUser() || currentUser;
      const mergedUser: User = { ...localUser, name: updatedName } as User;
      try {
        // Prova ad aggiornare la sessione dal token (se disponibile)
        const refreshed = await authService.autoLogin();
        if (refreshed && refreshed.email === email) {
          onUserUpdated && onUserUpdated({ ...refreshed, name: updatedName });
        } else {
          onUserUpdated && onUserUpdated(mergedUser);
        }
      } catch {
        onUserUpdated && onUserUpdated(mergedUser);
      }
      // Allinea anche localStorage per compatibilità con App
      try {
        localStorage.setItem('currentUser', JSON.stringify(mergedUser));
      } catch {}

      setSuccess('Profilo aggiornato con successo');
    } catch (err: any) {
      const msg = (err && err.message) ? String(err.message) : 'Aggiornamento profilo non riuscito';
      setError(msg.replace(/<[^>]*>/g, '').substring(0, 200));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ff3b30] via-[#3b264a] to-[#0a1535] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[65vw] h-[65vw] bg-[radial-gradient(ellipse_at_center,_rgba(255,59,48,0.35),_transparent_60%)] blur-[100px]"></div>
        <div className="absolute -bottom-40 -right-40 w-[65vw] h-[65vw] bg-[radial-gradient(ellipse_at_center,_rgba(10,21,53,0.35),_transparent_60%)] blur-[100px]"></div>
      </div>

      {/* Pulsante Torna alla home */}
      <button
        onClick={() => onNavigateHome && onNavigateHome()}
        className="absolute top-5 left-5 inline-flex items-center gap-2 rounded-full px-3 py-2 bg-[#0a1535]/40 hover:bg-[#0a1535]/60 backdrop-blur-sm ring-1 ring-white/10 text-white transition-colors"
        title="Torna alla home"
        aria-label="Torna alla home"
      >
        <ChevronLeft size={24} />
        <span className="text-sm font-medium">Indietro</span>
      </button>

      <div className="bg-white rounded-3xl ring-1 ring-black/10 shadow-lg w-full max-w-md p-7 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/images/logo.png" alt="KW8 Logo" className="h-16 w-auto" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-1 tracking-tight">Il tuo profilo</h2>
          <p className="text-gray-600 text-sm">Modifica le tue informazioni personali</p>
        </div>

        {/* Messaggi */}
        {error && (
          <div className="bg-red-50/80 backdrop-blur-sm ring-1 ring-red-200 text-red-800 px-4 py-3 rounded-2xl mb-4 shadow-sm">
            <div className="flex items-center">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          </div>
        )}
        {success && (
          <div className="bg-white/85 backdrop-blur-sm ring-1 ring-black/10 text-navy-900 px-4 py-3 rounded-2xl mb-4 shadow-sm">
            <div className="flex items-center">
              <CheckCircle size={18} className="mr-2 text-green-600" />
              {success}
            </div>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
            <div className="relative">
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => setFirstNameTouched(true)}
                placeholder="Inserisci il tuo nome"
                className={`w-full px-4 py-3 rounded-2xl ring-1 ring-black/10 bg-white focus:outline-none focus:ring-2 transition-colors ${firstNameTouched ? (firstName.trim() ? 'border-green-500 focus:ring-green-500' : 'border-red-500 focus:ring-red-500') : 'border-gray-300 focus:ring-navy-800'}`}
              />
              <UserIcon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          {/* Cognome */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cognome</label>
            <div className="relative">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => setLastNameTouched(true)}
                placeholder="Inserisci il tuo cognome"
                className={`w-full px-4 py-3 rounded-2xl ring-1 ring-black/10 bg-white focus:outline-none focus:ring-2 transition-colors ${lastNameTouched ? (lastName.trim() ? 'border-green-500 focus:ring-green-500' : 'border-red-500 focus:ring-red-500') : 'border-gray-300 focus:ring-navy-800'}`}
              />
              <UserIcon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          {/* Telefono */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Numero di telefono</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                placeholder="Es. +39 345 1234567"
                className={`w-full px-4 py-3 rounded-2xl ring-1 ring-black/10 bg-white focus:outline-none focus:ring-2 transition-colors ${phoneTouched ? (!phone || validatePhone(phone) ? 'border-green-500 focus:ring-green-500' : 'border-red-500 focus:ring-red-500') : 'border-gray-300 focus:ring-navy-800'}`}
              />
              <PhoneIcon size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>
            {phoneTouched && phone && !validatePhone(phone) && (
              <p className="text-xs text-red-600 mt-1">Formato non valido. Inserisci 7-15 cifre, opzionale prefisso +.</p>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={loading || !firstName.trim() || !lastName.trim() || (phone && !validatePhone(phone))}
            className={`w-full px-4 py-3 rounded-2xl font-semibold text-white transition-colors ${loading ? 'bg-gray-400' : 'bg-navy-800 hover:bg-navy-700'}`}
          >
            {loading ? 'Salvataggio...' : 'Salva modifiche'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AthleteProfilePage;