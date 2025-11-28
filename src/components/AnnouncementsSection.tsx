import React, { useEffect, useRef, useState } from 'react';
import { Bell, Info, AlertTriangle, XCircle, Edit3, Plus, Trash2, Save, X, CheckCircle, Pin } from 'lucide-react';
import { subscribeToAnnouncementsSection, saveAnnouncementsSection, getAnnouncementsSection } from '../utils/database';
import Modal from './Modal';

interface Announcement {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'alert';
  isActive: boolean;
  pinned?: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

interface AnnouncementsPayload {
  id: string;
  title?: string;
  subtitle?: string;
  announcements: Announcement[];
  createdAt?: string;
  updatedAt?: string;
}

interface AnnouncementsSectionProps {
  currentUser?: { role: 'admin' | 'coach' | 'athlete' | 'user' } | null;
}

const levelConfig: Record<Announcement['level'], { color: string; label: string; icon: React.ComponentType<any> }> = {
  info: { color: 'from-blue-500 to-blue-700', label: 'Info', icon: Info },
  warning: { color: 'from-yellow-500 to-orange-600', label: 'Avviso', icon: AlertTriangle },
  alert: { color: 'from-red-500 to-red-700', label: 'Allerta', icon: XCircle }
};

const AnnouncementsSection: React.FC<AnnouncementsSectionProps> = ({ currentUser }) => {
  const [data, setData] = useState<AnnouncementsPayload | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<AnnouncementsPayload | null>(null);
  const [editMode, setEditMode] = useState<'create' | 'modify' | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Toast stile Apple, coerente con FileExplorer
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isToastExiting, setIsToastExiting] = useState(false);
  const toastExitTimeoutRef = useRef<number | null>(null);
  const toastHideTimeoutRef = useRef<number | null>(null);
  const hasCoachAccess = currentUser?.role === 'coach';

  const showToast = (type: 'success' | 'error', message: string, duration = 3000) => {
    // Pulisci eventuali timeout precedenti
    if (toastExitTimeoutRef.current) { clearTimeout(toastExitTimeoutRef.current); toastExitTimeoutRef.current = null; }
    if (toastHideTimeoutRef.current) { clearTimeout(toastHideTimeoutRef.current); toastHideTimeoutRef.current = null; }
    // Mostra toast con animazione di entrata/uscita
    setToastType(type);
    setToastMessage(message);
    setIsToastExiting(false);
    // Avvia uscita poco prima della chiusura
    toastExitTimeoutRef.current = window.setTimeout(() => {
      setIsToastExiting(true);
    }, Math.max(200, duration - 250));
    // Nascondi definitivamente dopo la durata
    toastHideTimeoutRef.current = window.setTimeout(() => {
      setToastMessage(null);
      setIsToastExiting(false);
    }, duration);
  };

  useEffect(() => {
    return () => {
      if (toastExitTimeoutRef.current) { clearTimeout(toastExitTimeoutRef.current); }
      if (toastHideTimeoutRef.current) { clearTimeout(toastHideTimeoutRef.current); }
    };
  }, []);

  useEffect(() => {
    let unsub: (() => void) | null = null;
    const load = async () => {
      try {
        const initial = await getAnnouncementsSection();
        if (initial) setData(initial);
      } catch (e) {
        console.error('Errore caricamento Avvisi:', e);
      }
      try {
        unsub = await subscribeToAnnouncementsSection((payload) => {
          if (payload) setData(payload);
        });
      } catch (e) {
        console.error('Errore sottoscrizione Avvisi:', e);
      }
    };
    load();
    return () => { if (unsub) unsub(); };
  }, []);

  const activeAnnouncements = (data?.announcements || []).filter((a) => {
    if (!a.isActive) return false;
    const now = Date.now();
    const startOk = a.startDate ? new Date(a.startDate).getTime() <= now : true;
    const endOk = a.endDate ? new Date(a.endDate).getTime() >= now : true;
    return startOk && endOk;
  });
  
  // Ordina: prima fissati, poi per data di pubblicazione (più recenti)
  const sortedActiveAnnouncements = [...activeAnnouncements].sort((a, b) => {
    const pinDiff = Number(!!b.pinned) - Number(!!a.pinned);
    if (pinDiff !== 0) return pinDiff;
    const da = new Date(a.createdAt).getTime();
    const db = new Date(b.createdAt).getTime();
    return db - da;
  });

  // Stato per mostrare tutti gli avvisi oltre al limite di 3
  const [showAll, setShowAll] = useState(false);

  const startEdit = () => {
    if (!hasCoachAccess) return;

    const now = new Date().toISOString();

    // Se il documento non esiste ancora o è vuoto, inizializza una bozza di default
    if (!data) {
      const initPayload: AnnouncementsPayload = {
        id: 'announcements-section',
        title: 'Avvisi',
        subtitle: '',
        announcements: [],
        createdAt: now,
        updatedAt: now
      };
      setData(initPayload);
      setDraft(JSON.parse(JSON.stringify(initPayload)));
      setIsEditing(true);
      return;
    }

    // Normalizza i dati esistenti per evitare problemi se "announcements" manca o non è un array
    const normalized: AnnouncementsPayload = {
      id: data.id || 'announcements-section',
      title: data.title,
      subtitle: data.subtitle,
      announcements: Array.isArray((data as any).announcements) ? (data as any).announcements : [],
      createdAt: (data as any).createdAt || now,
      updatedAt: now
    };

    setDraft(JSON.parse(JSON.stringify(normalized)));
    setIsEditing(true);
    setEditMode('modify');
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(null);
    setEditMode(null);
  };

  const saveEdit = async () => {
    if (!hasCoachAccess || !draft) return;
    const basePayload = { ...draft, updatedAt: new Date().toISOString(), id: draft.id || 'announcements-section' };
    // In modalità "create", unisci i nuovi avvisi a quelli esistenti senza mostrarli durante la creazione
    const payload: AnnouncementsPayload = (() => {
      if (editMode === 'create') {
        const existing = Array.isArray((data as any)?.announcements) ? (data as any).announcements : [];
        return { ...basePayload, announcements: [...draft.announcements, ...existing] };
      }
      return basePayload as AnnouncementsPayload;
    })();

    // Limite massimo: 3 avvisi totali
    const maxAllowed = 3;
    const totalCount = (payload.announcements || []).length;
    if (totalCount > maxAllowed) {
      showToast('error', `Limite massimo di ${maxAllowed} avvisi raggiunto`);
      return;
    }

    // Validazione: non consentire avvisi vuoti (titolo o descrizione vuoti)
    const items = payload.announcements || [];
    if (editMode === 'create') {
      const only = items[0];
      if (!only || !only.title?.trim() || !only.message?.trim()) {
        showToast('error', 'Inserisci titolo e descrizione dell\'avviso');
        return;
      }
    } else if (editMode === 'modify') {
      const invalid = items.some((a) => !a.title?.trim() || !a.message?.trim());
      if (invalid) {
        showToast('error', 'Titolo e descrizione non possono essere vuoti');
        return;
      }
    }

    try {
      await saveAnnouncementsSection(payload);
      // Aggiorna subito la vista locale per mostrare gli ultimi cambiamenti
      setData(payload);
      setIsEditing(false);
      setEditMode(null);
      showToast('success', 'Avvisi salvati');
    } catch (e) {
      console.error('Errore salvataggio Avvisi:', e);
      showToast('error', 'Errore nel salvataggio degli Avvisi');
    }
  };

  const addAnnouncement = () => {
    if (!draft) return;
    const maxAllowed = 3;
    const existingCount = Array.isArray((data as any)?.announcements) ? (data as any).announcements.length : 0;
    // In modifica: blocca se bozza ha già 3
    if (editMode === 'modify' && draft.announcements.length >= maxAllowed) {
      showToast('error', `Limite massimo di ${maxAllowed} avvisi raggiunto`);
      return;
    }
    // In crea: blocca se l'unione bozza + esistenti supererebbe 3
    if (editMode === 'create' && (draft.announcements.length + existingCount) >= maxAllowed) {
      showToast('error', `Limite massimo di ${maxAllowed} avvisi raggiunto`);
      return;
    }
    const now = new Date().toISOString();
    const newItem: Announcement = {
      id: 'a_' + Math.random().toString(36).slice(2),
      title: '',
      message: '',
      level: 'info',
      isActive: true,
      pinned: false,
      createdAt: now,
      updatedAt: now
    };
    setDraft({ ...draft, announcements: [newItem, ...draft.announcements] });
  };

  // Crea immediatamente un nuovo avviso e apre la modalità di modifica
  const createAndEditNew = () => {
    if (!hasCoachAccess) return;
    const now = new Date().toISOString();

    // Base payload, inizializzando se necessario
    const base: AnnouncementsPayload = data ? {
      id: data.id || 'announcements-section',
      title: data.title,
      subtitle: data.subtitle,
      announcements: Array.isArray((data as any).announcements) ? (data as any).announcements : [],
      createdAt: (data as any).createdAt || now,
      updatedAt: now
    } : {
      id: 'announcements-section',
      title: 'Avvisi',
      subtitle: '',
      announcements: [],
      createdAt: now,
      updatedAt: now
    };

    // Limite massimo: non consentire nuova creazione se già 3 avvisi
    const maxAllowed = 3;
    const existingCount = base.announcements.length;
    if (existingCount >= maxAllowed) {
      showToast('error', `Limite massimo di ${maxAllowed} avvisi raggiunto`);
      return;
    }

    const newItem: Announcement = {
      id: 'a_' + Math.random().toString(36).slice(2),
      title: '',
      message: '',
      level: 'info',
      isActive: true,
      pinned: false,
      createdAt: now,
      updatedAt: now
    };

    const nextDraft: AnnouncementsPayload = {
      ...base,
      // In modalità crea, mostra solo i nuovi avvisi in editing
      announcements: [newItem],
      updatedAt: now
    };

    // Aggiorna stato e entra in modalità modifica
    setData(base);
    setDraft(nextDraft);
    setIsEditing(true);
    setEditMode('create');
  };

  const updateAnnouncement = (id: string, patch: Partial<Announcement>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      announcements: draft.announcements.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a))
    });
  };

  const requestDelete = (id: string) => {
    if (!draft) return;
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!draft || !confirmDeleteId) return;
    const filtered = draft.announcements.filter((a) => a.id !== confirmDeleteId);
    const nextDraft: AnnouncementsPayload = {
      ...draft,
      announcements: filtered,
      id: draft.id || 'announcements-section',
      updatedAt: new Date().toISOString()
    };
    setDraft(nextDraft);
    setConfirmDeleteId(null);

    // Persisti subito l'eliminazione in modalità modifica
    if (editMode === 'modify') {
      try {
        await saveAnnouncementsSection(nextDraft);
        setData(nextDraft);
        showToast('success', 'Avviso eliminato');
        // Esci dalla modalità modifica, salvataggio già effettuato
        setIsEditing(false);
        setEditMode(null);
      } catch (e) {
        console.error('Errore eliminazione Avviso:', e);
        showToast('error', 'Errore nell\'eliminazione dell\'avviso');
      }
    } else {
      // In modalità crea, l'eliminazione è locale al draft finché non si salva
      showToast('success', 'Avviso eliminato');
      // Nascondi il tasto Salva uscendo dalla modifica
      setIsEditing(false);
      setEditMode(null);
    }
  };

  const cancelDelete = () => setConfirmDeleteId(null);

  return (
    <section id="avvisi" className="relative px-4 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="inline-flex items-center rounded-2xl bg-white/60 backdrop-blur-md ring-1 ring-black/10 px-3 py-2 shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
            <Bell className="text-gray-700 mr-2" size={20} />
            <span className="font-semibold text-gray-800">Avvisi</span>
          </div>
          {hasCoachAccess && (
            <div className="inline-flex items-center space-x-2">
              {!isEditing ? (
                <>
                  <button onClick={createAndEditNew} className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all" aria-label="Crea" title="Crea">
                    <Plus size={18} />
                  </button>
                  {(data?.announcements?.length || 0) > 0 && (
                    <button onClick={startEdit} className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all" aria-label="Modifica" title="Modifica">
                      <Edit3 size={18} />
                    </button>
                  )}
                </>
              ) : (
                <>
                  {editMode === 'create' && (
                    <button onClick={addAnnouncement} className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all" aria-label="Aggiungi" title="Aggiungi">
                      <Plus size={18} />
                    </button>
                  )}
                  <button onClick={saveEdit} className="inline-flex items-center rounded-full bg-green-600 text-white px-3 py-2 hover:bg-green-700 transition-all" aria-label="Salva" title="Salva">
                    <Save size={18} />
                  </button>
                  <button onClick={cancelEdit} className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all" aria-label="Annulla" title="Annulla">
                    <X size={18} />
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Lista Avvisi */}
        {(isEditing ? draft?.announcements : sortedActiveAnnouncements)?.length ? (
          <div className="space-y-3">
            {isEditing ? (
              draft!.announcements.map((a) => {
                const cfg = levelConfig[a.level];
                const Icon = cfg.icon;
                return (
                  <div key={a.id} className="relative rounded-3xl ring-1 ring-black/10 bg-white/55 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.10)] overflow-hidden">
                    <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${cfg.color}`} />
                    <div className="p-4 pl-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center">
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-2xl bg-black/5 ring-1 ring-black/10 mr-2">
                            <Icon className="text-gray-700" size={18} />
                          </div>
                          <div className="flex-1">
                            <input
                              className="w-full bg-white/80 border border-black/10 rounded-xl px-2 py-1 text-gray-900 break-words"
                              value={a.title}
                              placeholder="Titolo dell'avviso"
                              onChange={(e) => updateAnnouncement(a.id, { title: e.target.value })}
                            />
                            <textarea
                              className="w-full mt-2 bg-white/80 border border-black/10 rounded-xl px-2 py-1 text-gray-900 break-words"
                              value={a.message}
                              placeholder="Descrizione dell'avviso"
                              onChange={(e) => updateAnnouncement(a.id, { message: e.target.value })}
                            />
                            <div className="mt-3 flex items-center justify-between w-full">
                              <div className="flex items-center space-x-2">
                                {(['info','warning','alert'] as const).map((lvl) => (
                                  <button
                                    key={lvl}
                                    onClick={() => updateAnnouncement(a.id, { level: lvl })}
                                    className={`px-2 py-1 rounded-full text-xs ring-1 ring-black/10 ${a.level === lvl ? 'bg-black/10' : 'bg-white/70'}`}
                                  >
                                    {levelConfig[lvl].label}
                                  </button>
                                ))}
                                <span className="inline-block w-px h-5 bg-black/10 mx-1" />
                                <button
                                  onClick={() => updateAnnouncement(a.id, { pinned: !a.pinned })}
                                  className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ring-1 ring-black/10 ${a.pinned ? 'bg-yellow-100 text-yellow-800' : 'bg-white/70 text-gray-700'}`}
                                  aria-pressed={!!a.pinned}
                                  aria-label="Fissa in alto"
                                  title="Fissa in alto"
                                >
                                  <Pin size={14} />
                                  <span>Fissa</span>
                                </button>
                              </div>
                              <button
                                onClick={() => requestDelete(a.id)}
                                className="inline-flex items-center justify-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-red-300 px-2 py-1 text-red-600 hover:bg-white hover:shadow-md shadow-sm transition-all"
                                aria-label="Elimina avviso"
                                title="Elimina"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <>
                {sortedActiveAnnouncements.slice(0, 3).map((a) => {
                  const cfg = levelConfig[a.level];
                  const Icon = cfg.icon;
                  return (
                    <div key={a.id} className="relative rounded-3xl ring-1 ring-black/10 bg-white/55 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.10)] overflow-hidden">
                      <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${cfg.color}`} />
                      <div className="p-4 pl-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-2xl bg-black/5 ring-1 ring-black/10 mr-2">
                              <Icon className="text-gray-700" size={18} />
                            </div>
                            {!isEditing ? (
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-gray-900 break-all sm:break-words">{a.title}</h3>
                                <p className="text-sm text-gray-700 mt-1 break-all sm:break-words">{a.message}</p>
                              </div>
                              ) : (
                              <div className="flex-1">
                                <input
                                  className="w-full bg-white/80 border border-black/10 rounded-xl px-2 py-1 text-gray-900 break-words"
                                  value={a.title}
                                  placeholder="Titolo dell'avviso"
                                  onChange={(e) => updateAnnouncement(a.id, { title: e.target.value })}
                                />
                                <textarea
                                  className="w-full mt-2 bg-white/80 border border-black/10 rounded-xl px-2 py-1 text-gray-900 break-words"
                                  value={a.message}
                                  placeholder="Descrizione dell'avviso"
                                  onChange={(e) => updateAnnouncement(a.id, { message: e.target.value })}
                                />
                                <div className="mt-3 flex items-center justify-between w-full">
                                  <div className="flex items-center space-x-2">
                                    {(['info','warning','alert'] as const).map((lvl) => (
                                      <button
                                        key={lvl}
                                        onClick={() => updateAnnouncement(a.id, { level: lvl })}
                                        className={`px-2 py-1 rounded-full text-xs ring-1 ring-black/10 ${a.level === lvl ? 'bg-black/10' : 'bg-white/70'}`}
                                      >
                                        {levelConfig[lvl].label}
                                      </button>
                                    ))}
                                    <span className="inline-block w-px h-5 bg-black/10 mx-1" />
                                    <button
                                      onClick={() => updateAnnouncement(a.id, { pinned: !a.pinned })}
                                      className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ring-1 ring-black/10 ${a.pinned ? 'bg-yellow-100 text-yellow-800' : 'bg-white/70 text-gray-700'}`}
                                      aria-pressed={!!a.pinned}
                                      aria-label="Fissa in alto"
                                      title="Fissa in alto"
                                    >
                                      <Pin size={14} />
                                      <span>Fissa</span>
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => requestDelete(a.id)}
                                    className="inline-flex items-center justify-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-red-300 px-2 py-1 text-red-600 hover:bg-white hover:shadow-md shadow-sm transition-all"
                                    aria-label="Elimina avviso"
                                    title="Elimina"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        {!isEditing && (
                          <div className="mt-3 inline-flex items-center rounded-full bg-black/5 ring-1 ring-black/10 px-2 py-1 text-xs text-gray-700">
                            {levelConfig[a.level].label}
                          </div>
                        )}
                        {!isEditing && a.pinned && (
                          <div className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-black/10 shadow-sm">
                            <Pin className="text-yellow-700" size={16} />
                          </div>
                        )}
                        {!isEditing && (
                          <div className="absolute bottom-2 right-3 text-[11px] text-gray-500">
                            Pubblicato il {new Date(a.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {showAll && sortedActiveAnnouncements.slice(3).map((a) => {
                  const cfg = levelConfig[a.level];
                  const Icon = cfg.icon;
                  return (
                    <div key={a.id} className="relative rounded-3xl ring-1 ring-black/10 bg-white/55 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.10)] overflow-hidden">
                      <div className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${cfg.color}`} />
                      <div className="p-4 pl-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center">
                            <div className="inline-flex items-center justify-center w-8 h-8 rounded-2xl bg-black/5 ring-1 ring-black/10 mr-2">
                              <Icon className="text-gray-700" size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-gray-900 break-all sm:break-words">{a.title}</h3>
                              <p className="text-sm text-gray-700 mt-1 break-all sm:break-words">{a.message}</p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 inline-flex items-center rounded-full bg-black/5 ring-1 ring-black/10 px-2 py-1 text-xs text-gray-700">
                          {levelConfig[a.level].label}
                        </div>
                        {a.pinned && (
                          <div className="absolute top-2 right-2 inline-flex items-center justify-center w-7 h-7 rounded-2xl bg-white/70 backdrop-blur-md ring-1 ring-black/10 shadow-sm">
                            <Pin className="text-yellow-700" size={16} />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-3 text-[11px] text-gray-500">
                          Pubblicato il {new Date(a.createdAt).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
            {!isEditing && sortedActiveAnnouncements.length > 3 && !showAll && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAll(true)}
                  className="mt-2 inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3 py-1.5 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all"
                >
                  Mostra tutti
                </button>
              </div>
            )}
            {!isEditing && sortedActiveAnnouncements.length > 3 && showAll && (
              <div className="flex justify-center">
                <button
                  onClick={() => setShowAll(false)}
                  className="mt-2 inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3 py-1.5 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all"
                >
                  Riduci
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-3xl ring-1 ring-black/10 bg-white/55 backdrop-blur-md p-4 text-center text-gray-700">
            Nessun avviso attivo
          </div>
        )}
      </div>

      {/* Modal conferma eliminazione - uniforme al Folder */}
      {confirmDeleteId && (
        <Modal isOpen={true} onClose={cancelDelete} title="Elimina Avviso" variant="centered">
          <p className="text-gray-600 mb-6">
            {(() => {
              const target = draft?.announcements?.find(a => a.id === confirmDeleteId);
              const name = target?.title?.trim() ? `"${target!.title}"` : 'questo avviso';
              return `Sei sicuro di voler eliminare ${name}?`;
            })()}
          </p>
          <div className="flex space-x-3">
            <button
              onClick={cancelDelete}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Annulla
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Elimina
            </button>
          </div>
        </Modal>
      )}

      {/* Toast stile Apple con stesse animazioni del FileExplorer */}
      {toastMessage && (
        <div
          className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md ring-1 ring-black/10 shadow-md flex items-center space-x-2 text-gray-800 transform transition-all duration-300 ease-out ${isToastExiting ? 'opacity-0 -translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}
          role="status"
          aria-live="polite"
        >
          {toastType === 'success' ? (
            <CheckCircle className="text-green-600" size={18} />
          ) : (
            <XCircle className="text-red-600" size={18} />
          )}
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </section>
  );
};

export default AnnouncementsSection;
