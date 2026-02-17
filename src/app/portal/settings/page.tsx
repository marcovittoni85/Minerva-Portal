'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Lock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SettingsPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Le password non coincidono.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: 'error', text: 'Errore durante l\'aggiornamento: ' + error.message });
    } else {
      setMessage({ type: 'success', text: 'Password aggiornata con successo.' });
      setPassword('');
      setConfirmPassword('');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white p-8 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-12 border-b border-slate-100 pb-8">
          <div>
            <h1 className="text-slate-900 text-2xl tracking-[0.3em] uppercase font-bold">Impostazioni</h1>
            <p className="text-slate-400 text-[10px] tracking-[0.2em] uppercase mt-2">Gestione Sicurezza Account</p>
          </div>
          <Image src="/icon.webp" alt="Minerva" width={50} height={50} className="opacity-50" unoptimized />
        </div>

        {/* Password Form */}
        <div className="bg-white border border-slate-100 p-10 rounded-2xl shadow-sm text-slate-900">
          <div className="flex items-center space-x-4 mb-8">
            <Lock className="w-5 h-5 text-[#D4AF37]" />
            <h2 className="text-[12px] tracking-[0.2em] uppercase font-bold">Cambia Password</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-slate-400 text-[9px] uppercase tracking-widest ml-1">Nuova Password</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-[11px] tracking-widest text-slate-900 outline-none focus:border-[#D4AF37] transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-2">
                <label className="text-slate-400 text-[9px] uppercase tracking-widest ml-1">Conferma Password</label>
                <input 
                  type="password" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-4 text-[11px] tracking-widest text-slate-900 outline-none focus:border-[#D4AF37] transition-all"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="pt-4">
              <button 
                disabled={loading}
                className="bg-[#D4AF37] text-white px-8 py-4 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-[#b8962d] transition-all flex items-center disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : 'Aggiorna Password'}
              </button>
            </div>
          </form>

          {message && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className={`mt-8 p-4 flex items-center space-x-3 text-[10px] tracking-widest uppercase rounded-lg border ${
                message.type === 'success' ? 'bg-green-50 border-green-200 text-green-600' : 'bg-red-50 border-red-200 text-red-600'
              }`}
            >
              {message.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{message.text}</span>
            </motion.div>
          )}
        </div>

        <div className="mt-12 text-center text-slate-400">
          <p className="text-[8px] tracking-[0.4em] uppercase">Minerva Partners Security Protocol • AES-256 Encryption Active</p>
        </div>
      </motion.div>
    </div>
  );
}
