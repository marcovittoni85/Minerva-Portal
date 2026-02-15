"use client";

import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { motion } from "framer-motion";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/portal/settings/update-password`,
    });

    if (error) {
      setError("Impossibile procedere. Verificare l'indirizzo inserito.");
    } else {
      setMessage("Istruzioni inviate. Controlli la sua casella di posta istituzionale.");
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#001220] flex items-center justify-center px-6 font-sans relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-white tracking-tighter mb-4 uppercase">
            Ripristino <span className="text-[#D4AF37]">Accesso</span>
          </h1>
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">
            Protocollo di Sicurezza Minerva
          </p>
        </div>

        <div className="bg-white/5 backdrop-blur-3xl border border-white/10 p-10 rounded-[2.5rem]">
          {!message ? (
            <form onSubmit={handleReset} className="space-y-6">
              <p className="text-white/50 text-xs leading-relaxed text-center mb-4">
                Inserisca l'email associata al suo profilo Partner per ricevere il link di ripristino.
              </p>
              <div className="space-y-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/10 focus:outline-none focus:border-[#D4AF37]/50 transition-all text-sm"
                  placeholder="email@minervapartners.it"
                />
              </div>

              {error && <div className="text-red-400 text-[10px] font-bold text-center uppercase tracking-widest">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-white text-[#001220] py-4 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#D4AF37] transition-all disabled:opacity-50"
              >
                {loading ? "Invio in corso..." : "Invia Istruzioni"}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-6">
              <div className="text-[#D4AF37] text-4xl">✓</div>
              <p className="text-white text-sm font-medium">{message}</p>
            </div>
          )}
          
          <div className="mt-8 text-center">
            <Link href="/" className="text-white/30 hover:text-[#D4AF37] text-[10px] uppercase tracking-widest transition-colors font-bold">
              ← Torna al Login
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}