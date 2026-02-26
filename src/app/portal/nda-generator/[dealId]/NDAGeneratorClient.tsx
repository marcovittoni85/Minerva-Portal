"use client";
import { useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { ArrowLeft, FileText, Download, Upload, CheckCircle, Loader2 } from "lucide-react";

interface Props {
  deal: { id: string; code: string; title: string };
  counterparty: { name: string; company: string; role: string };
  userId: string;
}

export default function NDAGeneratorClient({ deal, counterparty, userId }: Props) {
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [language, setLanguage] = useState<"it" | "en">("it");
  const [form, setForm] = useState({
    counterparty_vat: "",
    counterparty_address: "",
    counterparty_legal_rep: "",
    counterparty_email: "",
  });
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  const generateNDA = async () => {
    if (!form.counterparty_vat || !form.counterparty_address || !form.counterparty_legal_rep || !form.counterparty_email) {
      alert("Compila tutti i campi obbligatori");
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/generate-nda", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: deal.id,
          language,
          counterparty_vat: form.counterparty_vat,
          counterparty_address: form.counterparty_address,
          counterparty_legal_rep: form.counterparty_legal_rep,
          counterparty_email: form.counterparty_email,
        }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const disposition = res.headers.get("Content-Disposition");
        const filenameMatch = disposition?.match(/filename="(.+)"/);
        a.download = filenameMatch?.[1] || `NDA_${deal.code}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setGenerated(true);
      } else {
        const data = await res.json();
        alert(data.error || "Errore nella generazione");
      }
    } catch {
      alert("Errore di rete");
    }
    setGenerating(false);
  };

  const uploadSignedNDA = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.currentTarget.value = "";

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
      const storagePath = `deals/${deal.id}/nda/${crypto.randomUUID()}_${safeName}`;

      const { error: upErr } = await supabase.storage
        .from("nda-documents")
        .upload(storagePath, file, { contentType: file.type });

      if (upErr) {
        alert("Errore nel caricamento: " + upErr.message);
        setUploading(false);
        return;
      }

      // Log NDA upload activity
      await supabase.from("deal_activity_log").insert({
        deal_id: deal.id,
        user_id: userId,
        action: "nda_uploaded",
        details: {
          deal_title: deal.title,
          counterparty_company: counterparty.company,
          counterparty_name: counterparty.name,
          file_name: file.name,
          storage_path: storagePath,
        },
      });

      // Notify admin (fire-and-forget)
      fetch("/api/notifications/document-uploaded", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: deal.id,
          dealTitle: deal.title,
          userId,
          fileName: `NDA firmato - ${file.name}`,
        }),
      }).catch(() => {});

      setUploaded(true);
    } catch {
      alert("Errore di rete");
    }
    setUploading(false);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href={`/portal/deals/${deal.id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna al Deal
      </Link>

      {/* Header */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-5 h-5 text-[#D4AF37]" />
          <h1 className="text-lg font-bold text-slate-900">Generatore NDA</h1>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">{deal.code}</p>
        <p className="text-sm text-slate-600">{deal.title}</p>
      </div>

      {/* Counterparty info (pre-filled, read-only) */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Controparte Autorizzata</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Nome</p>
            <p className="text-sm font-medium text-slate-900">{counterparty.name}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Società</p>
            <p className="text-sm font-medium text-slate-900">{counterparty.company}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Ruolo</p>
            <p className="text-sm font-medium text-slate-900">{counterparty.role}</p>
          </div>
        </div>
      </div>

      {/* Language selector */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Lingua NDA</h2>
        <div className="flex gap-4">
          <label className={"flex items-center gap-3 flex-1 border rounded-xl p-4 cursor-pointer transition-colors " + (language === "it" ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-200 hover:border-slate-300")}>
            <input
              type="radio"
              name="language"
              value="it"
              checked={language === "it"}
              onChange={() => setLanguage("it")}
              className="accent-[#D4AF37]"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">Italiano</p>
              <p className="text-[10px] text-slate-400">Accordo di Riservatezza e Non Circumvenzione</p>
            </div>
          </label>
          <label className={"flex items-center gap-3 flex-1 border rounded-xl p-4 cursor-pointer transition-colors " + (language === "en" ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-200 hover:border-slate-300")}>
            <input
              type="radio"
              name="language"
              value="en"
              checked={language === "en"}
              onChange={() => setLanguage("en")}
              className="accent-[#D4AF37]"
            />
            <div>
              <p className="text-sm font-bold text-slate-900">English</p>
              <p className="text-[10px] text-slate-400">Non-Disclosure Agreement</p>
            </div>
          </label>
        </div>
      </div>

      {/* Additional form fields */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">
          {language === "it" ? "Dati Controparte per NDA" : "Counterparty Details for NDA"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">
              {language === "it" ? "P.IVA / Codice Fiscale *" : "VAT / Registration Number *"}
            </label>
            <input
              type="text"
              value={form.counterparty_vat}
              onChange={(e) => setForm({ ...form, counterparty_vat: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
              placeholder={language === "it" ? "IT12345678901" : "Registration number"}
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">
              {language === "it" ? "Sede Legale *" : "Registered Office *"}
            </label>
            <input
              type="text"
              value={form.counterparty_address}
              onChange={(e) => setForm({ ...form, counterparty_address: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
              placeholder={language === "it" ? "Via Roma 1, 20100 Milano" : "123 Main St, London"}
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">
              {language === "it" ? "Rappresentante Legale *" : "Legal Representative *"}
            </label>
            <input
              type="text"
              value={form.counterparty_legal_rep}
              onChange={(e) => setForm({ ...form, counterparty_legal_rep: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
              placeholder={language === "it" ? "Nome e cognome" : "Full name"}
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">
              {language === "it" ? "Email Controparte *" : "Counterparty Email *"}
            </label>
            <input
              type="email"
              value={form.counterparty_email}
              onChange={(e) => setForm({ ...form, counterparty_email: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
              placeholder="email@esempio.com"
            />
          </div>
        </div>
      </div>

      {/* Generate button */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-6">
        <button
          onClick={generateNDA}
          disabled={generating || !form.counterparty_vat || !form.counterparty_address || !form.counterparty_legal_rep || !form.counterparty_email}
          className="w-full bg-[#D4AF37] text-white py-3.5 rounded-xl text-sm font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generazione in corso...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              {language === "it" ? "Genera NDA (.docx)" : "Generate NDA (.docx)"}
            </>
          )}
        </button>
      </div>

      {/* Upload signed NDA */}
      {generated && !uploaded && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm mb-6">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-2">Carica NDA Firmato</h2>
          <p className="text-xs text-slate-500 mb-4">Dopo aver fatto firmare l'NDA dalla controparte, carica qui il documento firmato.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border-2 border-dashed border-slate-200 hover:border-[#D4AF37] rounded-xl py-6 flex flex-col items-center gap-2 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[#D4AF37]" />
            ) : (
              <Upload className="w-5 h-5 text-slate-400" />
            )}
            <p className="text-xs text-slate-500">
              {uploading ? "Caricamento in corso..." : "Clicca per selezionare il file firmato"}
            </p>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc"
            className="hidden"
            onChange={uploadSignedNDA}
          />
        </div>
      )}

      {/* Success state */}
      {uploaded && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-emerald-600" />
            <div>
              <p className="text-sm font-bold text-emerald-900">NDA firmato caricato con successo</p>
              <p className="text-xs text-emerald-700 mt-1">L'amministratore è stato notificato. Il documento è stato salvato nella cartella del deal.</p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href={`/portal/deals/${deal.id}`}
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Torna al deal
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
