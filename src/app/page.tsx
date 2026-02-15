"use client";

import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();

  // Inizializzazione client rapida
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("IDENTITÀ NON RICONOSCIUTA");
        setLoading(false);
      } else {
        router.push("/portal");
        router.refresh();
      }
    } catch (err) {
      setError("SISTEMA MOMENTANEAMENTE OFFLINE");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#001220] flex items-center justify-center px-6 font-sans relative overflow-hidden">
      
      {/* --- SFONDO --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#D4AF37]/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-full max-w-[420px] z-10">
        
        {/* --- BRANDING --- */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-4">
              MINERVA <span className="text-[#D4AF37]">PARTNERS</span>
            </h1>
            <p className="text-[#D4AF37] text-[10px] md:text-[11px] uppercase tracking-[0.5em] font-bold opacity-80">
              L'eccellenza senza compromessi
            </p>
          </motion.div>
        </div>

        {/* --- BOX DI ACCESSO --- */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="bg-white/[0.02] backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem] shadow-2xl relative"
        >
          <form onSubmit={handleLogin} className="space-y-8">
            
            <div className="space-y-2">
              <label className="block text-[9px] uppercase tracking-[0.3em] text-white/30 font-black ml-1">
                Identità Istituzionale
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-white/5 focus:outline-none focus:border-[#D4AF37]/30 transition-all text-sm font-medium"
                placeholder="partner@minervapartners.it"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[9px] uppercase tracking-[0.3em] text-white/30 font-black ml-1">
                Chiave d'Accesso
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-white placeholder:text-white/5 focus:outline-none focus:border-[#D4AF37]/30 transition-all text-sm font-medium"
                placeholder="••••••••"
              />
            </div>

            {/* MESSAGGIO ERRORE */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-red-400 text-[10px] font-bold text-center bg-red-400/5 py-3 rounded-xl border border-red-400/20 uppercase tracking-[0.2em]"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-6 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#001220] py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-[#D4AF37] hover:text-black transition-all shadow-xl disabled:opacity-50"
              >
                {loading ? "VERIFICA AUTORIZZAZIONE..." : "AUTENTICAZIONE PARTNER"}
              </button>

              <div className="text-center">
                <Link 
                  href="/forgot-password" 
                  className="text-[9px] uppercase tracking-[0.2em] text-white/20 hover:text-[#D4AF37] transition-colors font-bold"
                >
                  Richiedi ripristino credenziali
                </Link>
              </div>
            </div>
          </form>
        </motion.div>

        {/* --- FOOTER --- */}
        <div className="mt-16 text-center">
          <p className="text-white/10 text-[9px] uppercase tracking-[1em] font-medium">
            CONFEDERAZIONE DEL VALORE
          </p>
        </div>
      </div>
    </main>
  );
}