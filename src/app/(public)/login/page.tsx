"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
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

      console.log("LOGIN RESULT", { data, error });

      if (error) {
        setErr(error.message);
        return;
      }

      // Verifica utente dopo login (utile per capire se la sessione è stata salvata)
      const { data: u2 } = await supabase.auth.getUser();
      console.log("AFTER LOGIN getUser()", u2);

      // Redirect
      router.replace(next.startsWith("/") ? next : `/${next}`);
      router.refresh();
    } catch (e: any) {
      console.error("LOGIN EXCEPTION", e);
      setErr(e?.message ?? "Errore inatteso");
    } finally {
      setLoading(false);
      console.log("SUBMIT END");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <div className="text-sm tracking-[0.28em] text-amber-300/90">
            MINERVA
          </div>
          <h1 className="text-2xl font-semibold mt-2">Area Riservata</h1>
          <p className="text-slate-300 mt-1 text-sm">
            Accedi al portale opportunità.
          </p>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-sm text-slate-300">Email</label>
            <input
              id="email"
              name="email"
              autoComplete="email"
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 outline-none focus:border-amber-300/60"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-300">Password</label>
            <input
              id="password"
              name="password"
              autoComplete="current-password"
              className="mt-1 w-full rounded-xl bg-slate-950/60 border border-slate-800 px-3 py-2 outline-none focus:border-amber-300/60"
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
            className="w-full rounded-xl bg-amber-300 text-slate-950 font-semibold py-2 hover:bg-amber-200 disabled:opacity-60"
            type="submit"
          >
            {loading ? "Accesso..." : "Accedi"}
          </button>

          <div className="text-xs text-slate-500">
            Debug: apri Console (F12) e guarda “SUBMIT START / LOGIN RESULT”.
          </div>
        </form>
      </div>
    </div>
  );
}
