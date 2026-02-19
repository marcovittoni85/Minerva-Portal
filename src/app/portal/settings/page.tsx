'use client';

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const supabase = createClient();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
        <p className="text-slate-500 text-sm mt-2">Gestione sicurezza account</p>
      </header>

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
    </div>
  );
}