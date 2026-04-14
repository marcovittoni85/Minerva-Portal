'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Lock, CheckCircle, AlertCircle, Loader2, Bell, SlidersHorizontal } from 'lucide-react';

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
  { key: "document_uploaded", label: "Nuovo documento caricato" },
] as const;

const sectorOptions = [
  "Real estate & hospitality",
  "Healthcare",
  "Macchinari industriali",
  "Utility e rinnovabili",
  "Servizi finanziari",
  "Chimica",
  "Sports goods",
  "Petrolio e gas",
  "Tecnologia",
  "Food & Beverage",
  "Trasporti e logistica",
  "Media e intrattenimento",
];

const operationTypes = ["Buy-side", "Sell-side", "Club Deal", "Debt"];

const geographyOptions = ["Nord Italia", "Centro Italia", "Sud Italia", "Europa", "Extra-EU"];

type PrefsRow = Record<string, boolean>;

interface DealPreferences {
  sectors: string[];
  operation_types: string[];
  ev_min: number | null;
  ev_max: number | null;
  geographies: string[];
}

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors";

export default function SettingsPage() {
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [prefs, setPrefs] = useState<PrefsRow | null>(null);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Deal preferences
  const [dealPrefs, setDealPrefs] = useState<DealPreferences>({
    sectors: [], operation_types: [], ev_min: null, ev_max: null, geographies: [],
  });
  const [dealPrefsLoading, setDealPrefsLoading] = useState(true);
  const [dealPrefsSaved, setDealPrefsSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
      if (!user) return;
      setUserId(user.id);

      // Load notification preferences
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setPrefs(data);
      } else {
        const defaults: Record<string, any> = { user_id: user.id };
        for (const t of notificationTypes) {
          defaults[`${t.key}_app`] = true;
          defaults[`${t.key}_email`] = false;
        }
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

      // Load deal preferences from profiles.preferences jsonb
      const { data: profile } = await supabase
        .from("profiles")
        .select("preferences")
        .eq("id", user.id)
        .single();

      if (profile?.preferences) {
        const p = profile.preferences as DealPreferences;
        setDealPrefs({
          sectors: p.sectors || [],
          operation_types: p.operation_types || [],
          ev_min: p.ev_min ?? null,
          ev_max: p.ev_max ?? null,
          geographies: p.geographies || [],
        });
      }
      setDealPrefsLoading(false);
    }
    load();
  }, []);

  const togglePref = useCallback(async (column: string, value: boolean) => {
    if (!userId) return;
    setPrefs(prev => prev ? { ...prev, [column]: value } : prev);
    await supabase.from("notification_preferences").update({ [column]: value }).eq("user_id", userId);
  }, [userId, supabase]);

  const saveDealPrefs = useCallback(async (updated: DealPreferences) => {
    if (!userId) return;
    setDealPrefs(updated);
    setDealPrefsSaved(false);
    await supabase.from("profiles").update({ preferences: updated }).eq("id", userId);
    setDealPrefsSaved(true);
    setTimeout(() => setDealPrefsSaved(false), 2000);
  }, [userId, supabase]);

  const toggleMulti = (arr: string[], value: string) =>
    arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setMessage({ type: 'error', text: 'La password deve avere almeno 6 caratteri.' }); return; }
    if (password !== confirmPassword) { setMessage({ type: 'error', text: 'Le password non coincidono.' }); return; }
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setMessage({ type: 'error', text: 'Errore: ' + error.message }); }
    else { setMessage({ type: 'success', text: 'Password aggiornata con successo.' }); setPassword(''); setConfirmPassword(''); }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <header className="mb-10 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Minerva Partners</p>
        <h1 className="text-3xl font-bold text-slate-900">Impostazioni</h1>
        <p className="text-slate-500 text-sm mt-2">Gestione sicurezza account e preferenze</p>
      </header>

      {/* Deal Preferences Section */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm mb-8">
        <div className="flex items-center gap-3 mb-6">
          <SlidersHorizontal className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Preferenze Deal</h2>
          {dealPrefsSaved && <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider ml-auto">Salvato</span>}
        </div>

        {dealPrefsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Settori */}
            <div>
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-3">Settori di interesse</label>
              <div className="grid grid-cols-2 gap-2">
                {sectorOptions.map(s => {
                  const on = dealPrefs.sectors.includes(s);
                  return (
                    <button
                      key={s}
                      onClick={() => saveDealPrefs({ ...dealPrefs, sectors: toggleMulti(dealPrefs.sectors, s) })}
                      className={`text-left px-3 py-2 rounded-lg text-xs border transition-colors ${
                        on ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37] font-bold" : "border-slate-100 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tipo operazione */}
            <div>
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-3">Tipo operazione</label>
              <div className="flex flex-wrap gap-2">
                {operationTypes.map(t => {
                  const on = dealPrefs.operation_types.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => saveDealPrefs({ ...dealPrefs, operation_types: toggleMulti(dealPrefs.operation_types, t) })}
                      className={`px-4 py-2 rounded-lg text-xs border transition-colors ${
                        on ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37] font-bold" : "border-slate-100 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* EV Range */}
            <div>
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-3">EV Range di interesse</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[9px] text-slate-400 block mb-1">Minimo (€)</label>
                  <input
                    type="number"
                    value={dealPrefs.ev_min ?? ""}
                    onChange={e => saveDealPrefs({ ...dealPrefs, ev_min: e.target.value ? Number(e.target.value) : null })}
                    placeholder="es. 1000000"
                    className={inputCls}
                    min={0}
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block mb-1">Massimo (€)</label>
                  <input
                    type="number"
                    value={dealPrefs.ev_max ?? ""}
                    onChange={e => saveDealPrefs({ ...dealPrefs, ev_max: e.target.value ? Number(e.target.value) : null })}
                    placeholder="es. 50000000"
                    className={inputCls}
                    min={0}
                  />
                </div>
              </div>
            </div>

            {/* Aree geografiche */}
            <div>
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-3">Aree geografiche</label>
              <div className="flex flex-wrap gap-2">
                {geographyOptions.map(g => {
                  const on = dealPrefs.geographies.includes(g);
                  return (
                    <button
                      key={g}
                      onClick={() => saveDealPrefs({ ...dealPrefs, geographies: toggleMulti(dealPrefs.geographies, g) })}
                      className={`px-4 py-2 rounded-lg text-xs border transition-colors ${
                        on ? "border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37] font-bold" : "border-slate-100 text-slate-600 hover:border-slate-200"
                      }`}
                    >
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="text-[10px] text-slate-400">Le modifiche vengono salvate automaticamente. Riceverai notifiche quando nuovi deal compatibili vengono pubblicati.</p>
          </div>
        )}
      </div>

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
              <input type="password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-2">Conferma Password</label>
              <input type="password" className={inputCls} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
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
