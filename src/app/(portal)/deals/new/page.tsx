"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client"; // Assicurati che il percorso sia corretto
import { createDeal } from "./actions";

export default function NewDealPage() {
  const supabase = createClient();
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Recuperiamo il ruolo dell'utente per mostrare i campi corretti
  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single();
        setRole(data?.role || "friend");
      }
      setLoading(false);
    }
    getProfile();
  }, []);

  const isAdmin = role === "admin";

  if (loading) return <div className="p-10 text-center">Caricamento...</div>;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/portal/deals" className="underline text-slate-500 hover:text-slate-800 transition">
          ← Torna alla bacheca
        </Link>
        <h1 className="text-2xl font-semibold mt-3">Nuova Operazione</h1>
        <p className="text-slate-600">
          {isAdmin 
            ? "Stai creando un'operazione come Admin (validazione immediata)." 
            : "Inserisci i dati dell'opportunità. L'Admin la revisionerà prima della pubblicazione."}
        </p>
      </div>

      <form action={createDeal} className="rounded-2xl border bg-white p-6 space-y-6 max-w-3xl shadow-sm">
        
        {/* SEZIONE DATI RISERVATI (Solo Admin o visibili solo a lui dopo l'invio) */}
        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 space-y-4">
          <h2 className="text-sm font-bold text-blue-800 uppercase tracking-wider">Dati Riservati (Solo Admin)</h2>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-sm text-slate-600 font-medium">Titolo Reale / Nome Azienda *</label>
              <input
                name="internal_title_real"
                required
                placeholder="es: Hotel Splendid Roma S.r.l."
                className="mt-1 w-full rounded-xl border border-blue-200 px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-blue-600 mt-1">Questo campo non sarà mai visibile ai Partner o Friend.</p>
            </div>
          </div>
        </div>

        {/* SEZIONE DATI PUBBLICI (BLIND) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Dati Blind (Visibili a tutti)</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="text-sm text-slate-600">Codice Operazione</label>
              <input
                name="code"
                placeholder="es: RE-2024-01"
                className="mt-1 w-full rounded-xl border px-3 py-2 focus:border-slate-400 outline-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-sm text-slate-600">Titolo Blind (Nome di fantasia) *</label>
              <input
                name="title"
                required
                placeholder="es: Progetto Luxury Hospitality Centro Italia"
                className="mt-1 w-full rounded-xl border px-3 py-2 focus:border-slate-400 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600">Settore</label>
              <select name="sector" className="mt-1 w-full rounded-xl border px-3 py-2 bg-white">
                <option value="Real Estate">Real Estate</option>
                <option value="Energy">Energy</option>
                <option value="M&A">M&A</option>
                <option value="Wealth Management">Wealth Management</option>
                <option value="Other">Altro</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-600">Geografia (Regione/Stato)</label>
              <input 
                name="geography" 
                placeholder="es: Lombardia, Italia"
                className="mt-1 w-full rounded-xl border px-3 py-2 focus:border-slate-400 outline-none" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600">Valore Stimato (Visualizzazione Blind)</label>
              <input 
                name="approx_value" 
                placeholder="es: 5-10 M€"
                className="mt-1 w-full rounded-xl border px-3 py-2 focus:border-slate-400 outline-none" 
              />
            </div>
            <div>
              <label className="text-sm text-slate-600">Confidenzialità</label>
              <select name="confidentiality" className="mt-1 w-full rounded-xl border px-3 py-2 bg-white">
                <option value="blind">blind (nasconde dettagli)</option>
                <option value="teaser">teaser (informazioni base)</option>
                <option value="full">full (visibilità completa)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t flex justify-end">
          <button className="rounded-xl bg-slate-900 text-white px-8 py-3 font-semibold hover:bg-blue-700 transition-colors shadow-lg active:transform active:scale-95">
            {isAdmin ? "Pubblica Operazione" : "Invia per Approvazione"}
          </button>
        </div>
      </form>
    </div>
  );
}