"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, ArrowLeft, Mail, Check } from "lucide-react";
import Link from "next/link";

export default function InviteUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    email: "",
    company: "",
    ruolo: "",
  });

  const setField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invite-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Errore durante l'invito");
      } else {
        setSuccess(true);
      }
    } catch {
      setError("Errore di rete");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center max-w-md shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-slate-900 text-xl font-bold mb-3">Invito Inviato</h2>
          <p className="text-slate-500 text-sm mb-2">
            <strong>{form.nome} {form.cognome}</strong> riceverà un'email con le credenziali temporanee.
          </p>
          <p className="text-slate-400 text-xs mb-6">
            L'utente ha 30 giorni per completare l'onboarding e firmare i codici Minerva.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => { setSuccess(false); setForm({ nome: "", cognome: "", email: "", company: "", ruolo: "" }); }}
              className="border border-slate-200 text-slate-600 px-5 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
            >
              Invita un altro
            </button>
            <button
              onClick={() => router.push("/portal/admin/partners")}
              className="bg-[#D4AF37] text-white px-5 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors"
            >
              Gestione Partner
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-xl mx-auto px-6 pt-12">
        <Link href="/portal/admin/partners" className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest text-slate-400 hover:text-[#D4AF37] transition-colors mb-8">
          <ArrowLeft className="w-3 h-3" /> Gestione Partner
        </Link>

        <header className="mb-10 pb-8 border-b border-slate-100">
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-3">Admin</p>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <UserPlus className="w-8 h-8 text-[#D4AF37]" />
            Invita <span className="text-[#D4AF37]">Utente</span>
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            L'invitato riceverà email con credenziali temporanee e avrà 30 giorni per firmare i codici Minerva.
          </p>
        </header>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Nome *</label>
              <input
                type="text"
                value={form.nome}
                onChange={e => setField("nome", e.target.value)}
                required
                placeholder="Mario"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Cognome *</label>
              <input
                type="text"
                value={form.cognome}
                onChange={e => setField("cognome", e.target.value)}
                required
                placeholder="Rossi"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Email *</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={form.email}
                onChange={e => setField("email", e.target.value)}
                required
                placeholder="mario.rossi@studio.it"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium block mb-2">Società / Studio</label>
            <input
              type="text"
              value={form.company}
              onChange={e => setField("company", e.target.value)}
              placeholder="Studio Legale Rossi & Associati"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Ruolo *</label>
            <select
              value={form.ruolo}
              onChange={e => setField("ruolo", e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors"
            >
              <option value="">Seleziona ruolo...</option>
              <option value="partner">Partner</option>
              <option value="friend">Friend</option>
              <option value="advisor">Advisor</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0f172a] text-[#D4AF37] py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="animate-pulse">Invio in corso...</span>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" /> Invia Invito
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
