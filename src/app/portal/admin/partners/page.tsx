"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { UserPlus, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Filter } from "lucide-react";

type OnboardingFilter = "all" | "pending" | "completed" | "expired";

export default function AdminPartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [filter, setFilter] = useState<OnboardingFilter>("all");
  const [extendingId, setExtendingId] = useState<string | null>(null);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => { fetchPartners(); }, []);

  const fetchPartners = async () => {
    const { data } = await supabase.from("profiles").select("*").order("full_name");
    if (data) setPartners(data);
  };

  const uploadAgreement = async (userId: string, file: File) => {
    const fileName = `${userId}/${file.name}`;
    const { error } = await supabase.storage.from("agreements").upload(fileName, file, { upsert: true });
    if (error) return alert("Errore upload: " + error.message);

    const { data: { publicUrl } } = supabase.storage.from("agreements").getPublicUrl(fileName);
    await supabase.from("profiles").update({ agreement_url: publicUrl, is_onboarded: true }).eq("id", userId);
    alert("Contratto caricato e Partner validato!");
    fetchPartners();
  };

  const extendDeadline = async (userId: string, days: number) => {
    setExtendingId(userId);
    try {
      const res = await fetch("/api/onboarding/extend-deadline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, days }),
      });
      if (res.ok) {
        alert(`Deadline estesa di ${days} giorni`);
        fetchPartners();
      } else {
        const data = await res.json();
        alert(data.error || "Errore");
      }
    } catch { alert("Errore di rete"); }
    setExtendingId(null);
  };

  const resendCredentials = async (userId: string) => {
    setResendingId(userId);
    try {
      const res = await fetch("/api/onboarding/resend-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        alert("Credenziali re-inviate con successo");
      } else {
        const data = await res.json();
        alert(data.error || "Errore");
      }
    } catch { alert("Errore di rete"); }
    setResendingId(null);
  };

  const disableUser = async (userId: string) => {
    if (!confirm("Sei sicuro di voler disabilitare questo utente?")) return;
    await supabase.from("profiles").update({ active: false }).eq("id", userId);
    fetchPartners();
  };

  const now = new Date();
  const filtered = partners.filter(p => {
    if (filter === "all") return true;
    const deadlineDate = p.onboarding_deadline ? new Date(p.onboarding_deadline) : null;
    const isExpired = deadlineDate && deadlineDate < now && !p.onboarding_completed;
    if (filter === "completed") return p.onboarding_completed;
    if (filter === "expired") return isExpired;
    if (filter === "pending") return !p.onboarding_completed && !isExpired;
    return true;
  });

  const counts = {
    all: partners.length,
    pending: partners.filter(p => !p.onboarding_completed && !(p.onboarding_deadline && new Date(p.onboarding_deadline) < now)).length,
    completed: partners.filter(p => p.onboarding_completed).length,
    expired: partners.filter(p => !p.onboarding_completed && p.onboarding_deadline && new Date(p.onboarding_deadline) < now).length,
  };

  function getOnboardingBadge(p: any) {
    if (p.onboarding_completed) {
      return { text: "Completato", style: "bg-emerald-50 text-emerald-700", icon: CheckCircle };
    }
    if (p.onboarding_deadline && new Date(p.onboarding_deadline) < now) {
      return { text: "Scaduto", style: "bg-red-50 text-red-600", icon: XCircle };
    }
    if (p.onboarding_deadline) {
      const days = Math.ceil((new Date(p.onboarding_deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `${days}g rimasti`, style: days <= 5 ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700", icon: Clock };
    }
    if (p.role === "admin") {
      return { text: "Admin", style: "bg-slate-100 text-slate-500", icon: CheckCircle };
    }
    return { text: "Non invitato", style: "bg-slate-50 text-slate-400", icon: AlertTriangle };
  }

  return (
    <div className="max-w-6xl mx-auto p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Gestione <span className="text-[#D4AF37]">Onboarding</span></h1>
          <p className="text-sm text-slate-400 mt-1">{partners.length} utenti registrati</p>
        </div>
        <Link
          href="/portal/admin/invite-user"
          className="inline-flex items-center gap-2 bg-[#0f172a] text-[#D4AF37] px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-800 transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Invita Utente
        </Link>
      </div>

      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-slate-400" />
        {([
          { key: "all", label: "Tutti" },
          { key: "pending", label: "In attesa" },
          { key: "completed", label: "Completati" },
          { key: "expired", label: "Scaduti" },
        ] as { key: OnboardingFilter; label: string }[]).map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
              filter === f.key
                ? "bg-[#D4AF37]/10 text-[#D4AF37] ring-1 ring-[#D4AF37]/30"
                : "bg-slate-50 text-slate-400 hover:text-slate-600"
            }`}
          >
            {f.label} ({counts[f.key]})
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((p) => {
          const badge = getOnboardingBadge(p);
          const BadgeIcon = badge.icon;
          return (
            <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-bold text-lg uppercase tracking-tight">{p.full_name || "—"}</div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-slate-400 uppercase tracking-widest">{p.role || "N/A"}</span>
                      {p.company && <span className="text-[10px] text-slate-400">{p.company}</span>}
                      <span className="text-[10px] text-slate-300">{p.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Onboarding badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest ${badge.style}`}>
                    <BadgeIcon className="w-3 h-3" /> {badge.text}
                  </div>

                  {/* Deadline */}
                  {p.onboarding_deadline && !p.onboarding_completed && (
                    <span className="text-[10px] text-slate-400">
                      Scad: {new Date(p.onboarding_deadline).toLocaleDateString("it-IT")}
                    </span>
                  )}

                  {/* Signed timestamp */}
                  {p.onboarding_signed_at && (
                    <span className="text-[10px] text-emerald-500">
                      Firmato: {new Date(p.onboarding_signed_at).toLocaleDateString("it-IT")}
                    </span>
                  )}

                  {/* Agreement */}
                  {p.agreement_url ? (
                    <a href={p.agreement_url} target="_blank" className="text-[10px] font-black text-green-600 uppercase border-b border-green-600">Doc Presente</a>
                  ) : (
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) => e.target.files && uploadAgreement(p.id, e.target.files[0])}
                      className="text-[10px] text-slate-400 w-32"
                    />
                  )}

                  {/* Onboarded badge */}
                  <div className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase ${p.is_onboarded ? "bg-green-100 text-green-700" : "bg-red-50 text-red-600"}`}>
                    {p.is_onboarded ? "Validato" : "In Attesa"}
                  </div>
                </div>
              </div>

              {/* Admin actions for non-completed onboarding */}
              {!p.onboarding_completed && p.role !== "admin" && p.onboarding_deadline && (
                <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2">
                  <button
                    onClick={() => extendDeadline(p.id, 15)}
                    disabled={extendingId === p.id}
                    className="text-[9px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    {extendingId === p.id ? "..." : "+15 giorni"}
                  </button>
                  <button
                    onClick={() => extendDeadline(p.id, 30)}
                    disabled={extendingId === p.id}
                    className="text-[9px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                  >
                    +30 giorni
                  </button>
                  <button
                    onClick={() => resendCredentials(p.id)}
                    disabled={resendingId === p.id}
                    className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg hover:bg-[#D4AF37]/20 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${resendingId === p.id ? "animate-spin" : ""}`} />
                    {resendingId === p.id ? "Invio..." : "Re-invia credenziali"}
                  </button>
                  <button
                    onClick={() => disableUser(p.id)}
                    className="text-[9px] font-bold uppercase tracking-widest text-red-500 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors ml-auto"
                  >
                    Disabilita
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-sm">
            Nessun utente trovato per questo filtro
          </div>
        )}
      </div>
    </div>
  );
}
