"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    const { data } = await supabase.from("profiles").select("*").order("full_name");
    if (data) setPartners(data);
  };

  const uploadAgreement = async (userId: string, file: File) => {
    // 1. Carica il file nello storage
    const fileName = `${userId}/${file.name}`;
    const { data, error } = await supabase.storage.from('agreements').upload(fileName, file, { upsert: true });

    if (error) return alert("Errore upload: " + error.message);

    // 2. Ottieni l'URL pubblico e aggiorna il profilo
    const { data: { publicUrl } } = supabase.storage.from('agreements').getPublicUrl(fileName);
    
    await supabase.from("profiles")
      .update({ agreement_url: publicUrl, is_onboarded: true })
      .eq("id", userId);

    alert("Contratto caricato e Partner validato!");
    fetchPartners();
  };

  return (
    <div className="max-w-6xl mx-auto p-10">
      <h1 className="text-4xl font-black uppercase tracking-tighter mb-8">Gestione <span className="text-[#D4AF37]">Onboarding</span></h1>
      
      <div className="space-y-4">
        {partners.map((p) => (
          <div key={p.id} className="bg-white p-6 rounded-[2rem] border flex items-center justify-between shadow-sm">
            <div>
              <div className="font-bold text-lg uppercase tracking-tight">{p.full_name}</div>
              <div className="text-xs text-slate-400 uppercase tracking-widest">{p.role || 'Ruolo non definito'}</div>
            </div>

            <div className="flex items-center gap-6">
              {p.agreement_url ? (
                <a href={p.agreement_url} target="_blank" className="text-[10px] font-black text-green-600 uppercase border-b border-green-600">Documento Presente</a>
              ) : (
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => e.target.files && uploadAgreement(p.id, e.target.files[0])}
                  className="text-[10px] text-slate-400"
                />
              )}
              
              <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase ${p.is_onboarded ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}>
                {p.is_onboarded ? 'Partner Validato' : 'In Attesa'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}