'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const supabase = createClientComponentClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/portal/deals`,
      },
    });

    if (error) {
      setMessage({ type: 'error', text: "Errore: Inserisci un'email valida o contatta il Board." });
    } else {
      setMessage({ type: 'success', text: "Link di accesso inviato. Controlla la tua posta." });
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-[#001220] flex items-center justify-center p-6 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37] opacity-[0.03] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D4AF37] opacity-[0.03] blur-[120px] rounded-full"></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-[#001c30]/80 backdrop-blur-xl border border-[#D4AF37]/20 p-10 rounded-2xl shadow-2xl text-center">
          <div className="mb-10">
            <Image 
              src="/icon.webp" 
              alt="Minerva Logo" 
              width={100} 
              height={100} 
              className="mx-auto mb-6 drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              unoptimized
            />
            <h1 className="text-[#D4AF37] text-xl tracking-[0.4em] uppercase font-light">Accesso Riservato</h1>
            <div className="h-[1px] w-12 bg-[#D4AF37]/30 mx-auto mt-4"></div>
          </div>

          <form onSubmit={handleMagicLink} className="space-y-6">
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4AF37] opacity-50" />
              <input 
                type="email" 
                placeholder="EMAIL PARTNER" 
                className="w-full bg-[#001220]/50 border border-slate-800 p-4 pl-12 text-[10px] tracking-[0.2em] uppercase outline-none focus:border-[#D4AF37] text-white transition-all placeholder:text-slate-600" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button 
              disabled={loading}
              className="w-full bg-[#D4AF37] text-[#001220] font-bold py-4 tracking-[0.3em] uppercase hover:bg-[#FBE8A6] transition-all flex items-center justify-center group disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Ricevi Link <ArrowRight className="ml-3 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {message && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-8 text-[9px] uppercase tracking-[0.2em] ${message.type === 'error' ? 'text-red-500' : 'text-[#D4AF37]'}`}
            >
              {message.text}
            </motion.p>
          )}

          <div className="mt-12 pt-8 border-t border-white/5">
            <p className="text-slate-500 text-[8px] uppercase tracking-[0.4em]">Minerva Partners • Private & Confidential</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}