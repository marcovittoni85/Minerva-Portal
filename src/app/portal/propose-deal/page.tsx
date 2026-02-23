"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function ProposeNewDeal() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setFileError(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (files.length === 0) { setFileError("Allega almeno un documento"); return; }
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Non autenticato"); setLoading(false); return; }

    const { data: deal, error: insertError } = await supabase.from("deals").insert({
      title: String(form.get("title") || "").trim(),
      sector: String(form.get("sector") || "").trim(),
      geography: String(form.get("geography") || "").trim(),
      side: String(form.get("side") || "").trim(),
      ev_range: String(form.get("ev_range") || "").trim(),
      min_ticket: String(form.get("min_ticket") || "").trim() || null,
      description: String(form.get("description") || "").trim() || null,
      confidentiality: "blind",
      status: "pending_review",
      active: false,
      created_by: user.id,
    }).select("id").single();

    if (insertError) { setError(insertError.message); setLoading(false); return; }

    if (deal && files.length > 0) {
      for (const file of files) {
        const filePath = "proposals/" + deal.id + "/" + file.name;
        await supabase.storage.from("deal-documents").upload(filePath, file);
      }
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="bg-white border border-slate-100 rounded-xl p-12 text-center max-w-md shadow-sm">
          <div className="text-[#D4AF37] text-4xl mb-4">&#10003;</div>
          <h2 className="text-slate-900 text-xl font-bold mb-3">Proposta Inviata</h2>
          <p className="text-slate-500 text-sm mb-6">Il team Minerva valutera la tua proposta e ti contatteremo a breve.</p>
          <button onClick={() => router.push("/portal/board")} className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors">Torna alla Bacheca</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="max-w-2xl mx-auto px-6 pt-12">
        <header className="mb-10 pb-8 border-b border-slate-100">
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-3">Minerva Partners</p>
          <h1 className="text-3xl font-bold text-slate-900">Proponi <span className="text-[#D4AF37]">Operazione</span></h1>
          <p className="text-slate-500 text-sm mt-2">Compila il form e allega la documentazione di supporto</p>
          <p className="text-slate-400 text-xs mt-1">I campi con * sono obbligatori</p>
        </header>

        <div className="mb-8 bg-slate-50 border border-[#D4AF37]/20 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-slate-900 text-sm font-medium">Deal Proposal Template</p>
            <p className="text-slate-500 text-xs mt-1">Scarica il template PDF come guida per la compilazione</p>
          </div>
          <a href="/Minerva_Deal_Template.pdf" target="_blank" rel="noopener noreferrer" className="bg-[#D4AF37]/10 text-[#D4AF37] px-5 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors whitespace-nowrap">Scarica PDF</a>
        </div>

        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Titolo Operazione *</label>
            <input name="title" required placeholder="Es: Acquisizione catena hotel 4 stelle" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors placeholder:text-slate-400" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Settore *</label>
              <select name="sector" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37]">
                <option value="">Seleziona...</option>
                <option value="Real Estate">Real Estate</option>
                <option value="M&A">M&A</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Energy">Energy</option>
                <option value="Banking & Credit">Banking & Credit</option>
                <option value="Capital Markets">Capital Markets</option>
                <option value="Healthcare & Real Estate">Healthcare & Real Estate</option>
                <option value="Altro">Altro</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Tipologia *</label>
              <select name="side" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37]">
                <option value="">Seleziona...</option>
                <option value="BUY SIDE">Buy Side</option>
                <option value="SELL SIDE">Sell Side</option>
                <option value="FUNDRAISING">Fundraising</option>
                <option value="DEVELOPMENT">Development</option>
                <option value="DEBT">Debt</option>
                <option value="ADVISORY">Advisory</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Geografia *</label>
              <input name="geography" required placeholder="Es: Nord Italia, London UK" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors placeholder:text-slate-400" />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">EV Range *</label>
              <input name="ev_range" required placeholder="Es: 10-30 mln" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors placeholder:text-slate-400" />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium block mb-2">Ticket Minimo</label>
            <input name="min_ticket" placeholder="Es: 500K" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors placeholder:text-slate-400" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium block mb-2">Note / Descrizione</label>
            <textarea name="description" rows={3} placeholder="Eventuali dettagli aggiuntivi sull'operazione..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors placeholder:text-slate-400 resize-none" />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Documenti Allegati *</label>
            <div className={"border border-dashed rounded-lg p-6 text-center transition-colors " + (fileError ? "border-red-300 bg-red-50" : "border-slate-200 hover:border-[#D4AF37]/30")}>
              <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.png" onChange={handleFiles} className="hidden" id="file-upload" />
              <label htmlFor="file-upload" className="cursor-pointer">
                <p className="text-slate-500 text-sm mb-1">Clicca per selezionare i file</p>
                <p className="text-slate-400 text-xs">PDF, Word, Excel, PowerPoint, immagini</p>
              </label>
            </div>
            {fileError && <p className="text-red-500 text-xs mt-2">{fileError}</p>}
            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">
                    <span className="text-slate-900 text-xs truncate">{f.name}</span>
                    <span className="text-slate-400 text-[10px] ml-3 whitespace-nowrap">{formatFileSize(f.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4">
            <button type="submit" disabled={loading} className="w-full bg-[#D4AF37] text-white py-3.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors disabled:opacity-50">
              {loading ? "Invio in corso..." : "Invia Proposta"}
            </button>
          </div>

          <p className="text-center text-slate-400 text-[9px] uppercase tracking-wider">La proposta sara visibile solo al team Minerva fino ad approvazione</p>
        </form>
      </div>
    </div>
  );
}
