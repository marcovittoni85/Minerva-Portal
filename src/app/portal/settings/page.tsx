'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Lock, CheckCircle, AlertCircle, Loader2, Bell } from 'lucide-react';

const notificationTypes = [
  { key: "access_approved", label: "Accesso approvato" },
  { key: "access_rejected", label: "Accesso rifiutato" },
  { key: "access_request", label: "Richiesta accesso (admin)" },
  { key: "workgroup_added", label: "Aggiunto al gruppo di lavoro" },
  { key: "declaration_received", label: "Dichiarazione ricevuta (admin)" },
  { key: "stage_changed", label: "Cambio stage deal" },
  { key: "deal_proposal_approved", label: "Proposta deal approvata" },
  { key: "deal_proposal_rejected", label: "Proposta deal rifiutata" },
  { key: "new_deal_board", label: "Nuovo deal in bacheca" },
] as const;

type PrefsRow = Record<string, boolean>;

export default function SettingsPage() {
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [prefs, setPrefs] = useState<PrefsRow | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function loadPrefs() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPrefs(data);
      } else {
        // Create default preferences
        const defaults: Record<string, any> = { user_id: user.id };
        for (const t of notificationTypes) {
          defaults[`${t.key}_app`] = true;
          defaults[`${t.key}_email`] = false;
        }
        // Some types default to email=true
        defaults.access_approved_email = true;
        defaults.access_request_email = true;
        defaults.workgroup_added_email = true;
        defaults.declaration_received_email = true;
        defaults.deal_proposal_approved_email = true;

        const { data: inserted } = await supabase
          .from("notification_preferences")
          .insert(defaults)
          .select()
          .single();

        setPrefs(inserted || defaults);
      }
      setPrefsLoading(false);
    }
    loadPrefs();
  }, []);

  const togglePref = useCallback(async (column: string, value: boolean) => {
    if (!userId) return;
    setPrefs(prev => prev ? { ...prev, [column]: value } : prev);

    await supabase
      .from("notification_preferences")
      .update({ [column]: value })
      .eq("user_id", userId);
  }, [userId, supabase]);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'La password deve avere almeno 6 caratteri.' });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Le password non coincidono.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', text: 'Errore: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Password aggiornata con successo.' });
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <header className="mb-10 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Minerva Partners</p>
        <h1 className="text-3xl font-bold text-slate-900">Impostazioni</h1>
        <p className="text-slate-500 text-sm mt-2">Gestione sicurezza account e preferenze</p>
      </header>

      {/* Password Section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <Lock className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Cambia Password</h2>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-2">Nuova Password</label>
              <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-2">Conferma Password</label>
              <input type="password" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
          </div>

          <button disabled={loading} className="bg-[#D4AF37] text-white px-6 py-3 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors disabled:opacity-50 flex items-center">
            {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : 'Aggiorna Password'}
          </button>
        </form>

        {message && (
          <div className={"mt-6 p-4 flex items-center gap-3 text-xs rounded-lg border " + (message.type === 'success' ? "bg-green-50 border-green-200 text-green-600" : "bg-red-50 border-red-200 text-red-600")}>
            {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{message.text}</span>
          </div>
        )}
      </div>

      {/* Notification Preferences Section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm mt-8">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Preferenze Notifiche</h2>
        </div>

        {prefsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-1">
            {/* Header row */}
            <div className="grid grid-cols-[1fr_80px_80px] gap-2 pb-3 border-b border-slate-100">
              <div />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold text-center">In-App</p>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold text-center">Email</p>
            </div>

            {notificationTypes.map((t) => {
              const appKey = `${t.key}_app`;
              const emailKey = `${t.key}_email`;
              const appOn = prefs?.[appKey] ?? true;
              const emailOn = prefs?.[emailKey] ?? false;

              return (
                <div key={t.key} className="grid grid-cols-[1fr_80px_80px] gap-2 py-3 border-b border-slate-50 last:border-0">
                  <p className="text-sm text-slate-700">{t.label}</p>
                  <div className="flex justify-center">
                    <button
                      onClick={() => togglePref(appKey, !appOn)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${appOn ? "bg-[#D4AF37]" : "bg-slate-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${appOn ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => togglePref(emailKey, !emailOn)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${emailOn ? "bg-[#D4AF37]" : "bg-slate-200"}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${emailOn ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[10px] text-slate-400 mt-4">Le modifiche vengono salvate automaticamente.</p>
      </div>
    </div>
  );
}
