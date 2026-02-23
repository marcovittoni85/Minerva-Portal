'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';

// Creiamo il client direttamente qui per evitare errori di libreria
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ActivatePage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Il link è scaduto o non valido. Riprova.");
      setLoading(false);
    } else {
      router.push('/portal/deals');
    }
  };

  return (
    <div className="min-h-screen bg-[#001220] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full bg-[#001c30] p-10 rounded-2xl border border-[#D4AF37]/20 shadow-2xl text-center">
        <Image src="/icon.webp" alt="Logo" width={100} height={100} className="mx-auto mb-8" unoptimized />
        <h2 className="text-[#D4AF37] text-xl tracking-[0.3em] uppercase font-light mb-6">Attiva Account</h2>
        <form onSubmit={handleActivate} className="space-y-6">
          <input 
            type="password" 
            placeholder="NUOVA PASSWORD" 
            className="w-full bg-[#001220] border border-slate-800 p-4 text-[10px] tracking-widest uppercase outline-none focus:border-[#D4AF37] text-white" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          <button disabled={loading} className="w-full bg-[#D4AF37] text-[#001220] font-bold py-4 tracking-widest uppercase hover:bg-[#FBE8A6] disabled:opacity-50">
            {loading ? 'ELABORAZIONE...' : 'CONFERMA E ACCEDI'}
          </button>
        </form>
        {error && <p className="mt-6 text-red-500 text-[9px] uppercase tracking-widest">{error}</p>}
      </div>
    </div>
  );
}