'use client';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/portal/deals` },
    });

    if (error) setMessage({ type: 'error', text: "Accesso negato." });
    else setMessage({ type: 'success', text: "Link inviato! Controlla la posta." });
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[#001220] flex items-center justify-center p-6 overflow-hidden">
      <div className="relative z-10 w-full max-w-md bg-[#001c30]/80 backdrop-blur-xl border border-[#D4AF37]/20 p-10 rounded-2xl shadow-2xl text-center">
        <Image src="/icon.webp" alt="Logo" width={100} height={100} className="mx-auto mb-6" unoptimized />
        <h1 className="text-[#D4AF37] text-xl tracking-[0.4em] uppercase font-light">Accesso Riservato</h1>
        <form onSubmit={handleMagicLink} className="mt-10 space-y-6">
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37] opacity-50" />
            <input 
              type="email" 
              placeholder="EMAIL PARTNER" 
              className="w-full bg-[#001220]/50 border border-slate-800 p-4 pl-12 text-[10px] tracking-[0.2em] uppercase outline-none focus:border-[#D4AF37] text-white" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button disabled={loading} className="w-full bg-[#D4AF37] text-[#001220] font-bold py-4 tracking-[0.3em] uppercase hover:bg-[#FBE8A6] flex items-center justify-center disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" /> : <>Ricevi Link <ArrowRight className="ml-3 w-4 h-4" /></>}
          </button>
        </form>
        {message && <p className={`mt-8 text-[9px] uppercase tracking-[0.2em] ${message.type === 'error' ? 'text-red-500' : 'text-[#D4AF37]'}`}>{message.text}</p>}
      </div>
    </div>
  );
}