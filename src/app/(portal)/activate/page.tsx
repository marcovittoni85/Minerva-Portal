'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function ActivatePage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  // Sicurezza: Verifichiamo se l'utente è effettivamente autorizzato a stare qui
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      // Se clicchi il link dall'email, Supabase ti logga temporaneamente.
      // Se non c'è sessione e non c'è un hash nell'URL, l'utente è nel posto sbagliato.
      if (!session && !window.location.hash) {
        console.warn("Nessuna sessione rilevata o token mancante.");
      }
    };
    checkAuth();
  }, [supabase.auth]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setIsError(false);
    setMessage(null);

    // Aggiorniamo la password dell'utente (che è già "autenticato" dal link dell'email)
    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setIsError(true);
      setMessage(error.message === "New password should be different from the old password" 
        ? "La password deve essere diversa dalla precedente." 
        : error.message);
      setLoading(false);
    } else {
      setMessage("Account attivato con successo. Accesso al Marketplace in corso...");
      
      // Piccola pausa per dare enfasi al successo e poi reindirizzamento
      setTimeout(() => {
        router.push('/portal');
        router.refresh();
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#001220] flex flex-col items-center justify-center p-4 text-white font-sans overflow-hidden">
      {/* Background Decorativo Luxury */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#D4AF37] opacity-[0.03] blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D4AF37] opacity-[0.03] blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-md w-full bg-[#001c30]/80 backdrop-blur-xl p-10 rounded-2xl border border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative z-10">
        
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <Image 
              src="/icon.webp" 
              alt="Minerva Logo" 
              width={110} 
              height={110} 
              priority
              className="drop-shadow-[0_0_15px_rgba(212,175,55,0.2)]" 
            />
          </div>
          <h2 className="text-[#D4AF37] text-2xl tracking-[0.25em] uppercase font-extralight mb-2">
            Attivazione
          </h2>
          <div className="h-[1px] w-12 bg-[#D4AF37]/30 mx-auto mb-4"></div>
          <p className="text-slate-400 text-[10px] uppercase tracking-[0.3em] font-medium opacity-60 italic">
            Private Marketplace Access
          </p>
        </div>

        <form onSubmit={handleActivate} className="space-y-8">
          <div className="space-y-2">
            <label className="block text-[9px] uppercase tracking-[0.4em] text-slate-500 mb-2 ml-1">
              Imposta Chiave d'Accesso
            </label>
            <input
              type="password"
              placeholder="••••••••••••"
              className="w-full px-5 py-4 bg-[#001220] border border-slate-800 rounded-lg text-white focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] outline-none transition-all duration-500 placeholder:opacity-20 text-center tracking-[0.3em]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full overflow-hidden py-4 bg-[#D4AF37] text-[#001220] font-bold rounded-lg uppercase tracking-[0.3em] text-[10px] hover:bg-[#b8962d] transition-all duration-500 disabled:opacity-30 shadow-[0_10px_20px_rgba(212,175,55,0.1)]"
          >
            <span className="relative z-10">
              {loading ? 'Sincronizzazione...' : 'Attiva Profilo Partner'}
            </span>
          </button>
        </form>

        {message && (
          <div className={`mt-8 p-4 rounded-lg text-[10px] text-center tracking-[0.2em] uppercase border animate-in fade-in slide-in-from-bottom-2 duration-700 ${
            isError ? 'bg-red-900/10 border-red-900/40 text-red-400' : 'bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]'
          }`}>
            {message}
          </div>
        )}
      </div>

      <footer className="mt-12 text-center relative z-10">
        <p className="text-slate-600 text-[8px] uppercase tracking-[0.5em] mb-1">
          Strettamente Riservato
        </p>
        <p className="text-[#D4AF37]/40 text-[7px] uppercase tracking-[0.2em]">
          © 2026 Minerva Partners • Board of Directors
        </p>
      </footer>
    </div>
  );
}