import React, { useEffect, useState } from 'react';
import { Bell, Info, AlertTriangle, XCircle, Edit3, Plus, Trash2, Save } from 'lucide-react';
import { subscribeToAnnouncementsSection, saveAnnouncementsSection, getAnnouncementsSection } from '../utils/database';

interface Announcement {
  id: string;
  title: string;
  message: string;
  level: 'info' | 'warning' | 'alert';
  isActive: boolean;
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
  const hasCoachAccess = currentUser?.role === 'coach';

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

  const startEdit = () => {
    if (!hasCoachAccess || !data) return;
    setDraft(JSON.parse(JSON.stringify(data)));
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!hasCoachAccess || !draft) return;
    const payload = { ...draft, updatedAt: new Date().toISOString(), id: draft.id || 'announcements-section' };
    try {
      await saveAnnouncementsSection(payload);
      setIsEditing(false);
    } catch (e) {
      console.error('Errore salvataggio Avvisi:', e);
      alert('Errore nel salvataggio degli Avvisi');
    }
  };

  const addAnnouncement = () => {
    if (!draft) return;
    const now = new Date().toISOString();
    const newItem: Announcement = {
      id: 'a_' + Math.random().toString(36).slice(2),
      title: 'Nuovo avviso',
      message: 'Contenuto dell\'avviso',
      level: 'info',
      isActive: true,
      createdAt: now,
      updatedAt: now
    };
    setDraft({ ...draft, announcements: [newItem, ...draft.announcements] });
  };

  const updateAnnouncement = (id: string, patch: Partial<Announcement>) => {
    if (!draft) return;
    setDraft({
      ...draft,
      announcements: draft.announcements.map((a) => (a.id === id ? { ...a, ...patch, updatedAt: new Date().toISOString() } : a))
    });
  };

  const removeAnnouncement = (id: string) => {
    if (!draft) return;
    setDraft({ ...draft, announcements: draft.announcements.filter((a) => a.id !== id) });
  };

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
                <button onClick={startEdit} className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all">
                  <Edit3 size={18} className="mr-1" /> Modifica
                </button>
              ) : (
                <>
                  <button onClick={addAnnouncement} className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all">
                    <Plus size={18} className="mr-1" /> Aggiungi
                  </button>
                  <button onClick={saveEdit} className="inline-flex items-center rounded-full bg-green-600 text-white px-3 py-2 hover:bg-green-700 transition-all">
                    <Save size={18} className="mr-1" /> Salva
                  </button>
                  <button onClick={cancelEdit} className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-3 py-2 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all">
                    Annulla
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Lista Avvisi */}
        {(isEditing ? draft?.announcements : activeAnnouncements)?.length ? (
          <div className="space-y-3">
            {(isEditing ? draft!.announcements : activeAnnouncements).map((a) => {
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
                          <div>
                            <h3 className="font-semibold text-gray-900">{a.title}</h3>
                            <p className="text-sm text-gray-700 mt-1">{a.message}</p>
                          </div>
                        ) : (
                          <div className="flex-1">
                            <input
                              className="w-full bg-white/80 border border-black/10 rounded-xl px-2 py-1 text-gray-900"
                              value={a.title}
                              onChange={(e) => updateAnnouncement(a.id, { title: e.target.value })}
                            />
                            <textarea
                              className="w-full mt-2 bg-white/80 border border-black/10 rounded-xl px-2 py-1 text-gray-900"
                              value={a.message}
                              onChange={(e) => updateAnnouncement(a.id, { message: e.target.value })}
                            />
                            <div className="mt-2 flex items-center space-x-2">
                              {(['info','warning','alert'] as const).map((lvl) => (
                                <button
                                  key={lvl}
                                  onClick={() => updateAnnouncement(a.id, { level: lvl })}
                                  className={`px-2 py-1 rounded-full text-xs ring-1 ring-black/10 ${a.level === lvl ? 'bg-black/10' : 'bg-white/70'}`}
                                >
                                  {levelConfig[lvl].label}
                                </button>
                              ))}
                              <label className="ml-2 text-xs inline-flex items-center space-x-1">
                                <input
                                  type="checkbox"
                                  checked={a.isActive}
                                  onChange={(e) => updateAnnouncement(a.id, { isActive: e.target.checked })}
                                />
                                <span>Attivo</span>
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                      {isEditing && (
                        <button onClick={() => removeAnnouncement(a.id)} className="inline-flex items-center rounded-full bg-white/70 backdrop-blur-md ring-1 ring-black/10 px-2 py-1 text-gray-800 hover:bg-white hover:shadow-md shadow-sm transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                    {!isEditing && (
                      <div className="mt-3 inline-flex items-center rounded-full bg-black/5 ring-1 ring-black/10 px-2 py-1 text-xs text-gray-700">
                        {levelConfig[a.level].label}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl ring-1 ring-black/10 bg-white/55 backdrop-blur-md p-4 text-center text-gray-700">
            Nessun avviso attivo
          </div>
        )}
      </div>
    </section>
  );
};

export default AnnouncementsSection;
