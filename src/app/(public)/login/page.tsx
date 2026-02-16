"use client";

import { useState, Suspense } from "react"; // Importato Suspense
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

// 1. Creiamo un componente interno che contiene tutta la tua logica
function LoginContent() {
  const supabase = supabaseBrowser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const next = searchParams.get("next") || "/portal";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    console.log("SUBMIT START", { email, next });

    setErr(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log(" RESULT", { data, error });

      if (error) {
        setErr(error.message);
        return;
      }

      const { data: u2 } = await supabase.auth.getUser();
      console.log("AFTER  getUser()", u2);

      // Redirect
      router.replace(next.startsWith("/") ? next : `/${next}`);
      router.refresh();
    } catch (e: any) {
      console.error(" EXCEPTION", e);
      setErr(e?.message ?? "Errore inatteso");
    } finally {
      setLoading(false);
      console.log("SUBMIT END");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="text-sm tracking-[0.28em] text-amber-300/90 font-bold">
            MINERVA
          </div>
          <h1 className="text-2xl font-semibold mt-2 uppercase tracking-tighter">Area Riservata</h1>
          <p className="text-slate-300 mt-1 text-sm italic">
            Accedi al portale opportunità.
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Email</label>
            <input
              id="email"
              name="email"
              autoComplete="email"
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-3 outline-none focus:border-amber-300/60 transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase text-slate-400 tracking-widest">Password</label>
            <input
              id="password"
              name="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-3 outline-none focus:border-amber-300/60 transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          {err && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {err}
            </div>
          )}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-amber-300 text-slate-950 font-black uppercase text-xs tracking-widest py-4 hover:bg-amber-200 disabled:opacity-60 transition-all shadow-lg active:scale-95"
            type="submit"
          >
            {loading ? "Accesso..." : "Accedi al Portale"}
          </button>

          <div className="text-[10px] text-slate-500 uppercase tracking-tight text-center">
            Identità Minerva Verificata
          </div>
        </form>
      </div>
    </div>
  );
}

// 2. Il componente Page principale avvolge tutto in Suspense
export default function Page() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-amber-300 text-xs font-black uppercase animate-pulse tracking-[0.3em]">
          Caricamento Minerva...
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}