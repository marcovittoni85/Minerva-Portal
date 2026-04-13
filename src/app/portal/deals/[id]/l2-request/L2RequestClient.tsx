"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle, Clock, AlertCircle, Loader2, FileText, Shield } from "lucide-react";

interface Props {
  deal: { id: string; title: string; code: string };
  interest: {
    id: string;
    anonymous_code: string;
    l1_status: string;
    l2_status: string;
    l1_expires_at: string | null;
    l2_client_name: string | null;
    l2_client_surname: string | null;
    l2_client_company: string | null;
    l2_client_email: string | null;
    l2_fee_from_client: string | null;
    l2_fee_from_minerva: string | null;
    l2_mandate_type: string | null;
    l2_mandate_file_url: string | null;
    l2_nda_file_url: string | null;
    l2_admin_notes: string | null;
  };
}

export default function L2RequestClient({ deal, interest }: Props) {
  const supabase = createClient();
  const router = useRouter();
  const [form, setForm] = useState({
    clientName: interest.l2_client_name || "",
    clientSurname: interest.l2_client_surname || "",
    clientCompany: interest.l2_client_company || "",
    clientEmail: interest.l2_client_email || "",
    feeFromClient: interest.l2_fee_from_client || "",
    feeFromMinerva: interest.l2_fee_from_minerva || "",
    mandateType: interest.l2_mandate_type || "none",
  });
  const [mandateFile, setMandateFile] = useState<File | null>(null);
  const [ndaFile, setNdaFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check L1 expiry
  const isExpired = interest.l1_expires_at && new Date(interest.l1_expires_at) < new Date();
  const daysLeft = interest.l1_expires_at
    ? Math.max(0, Math.ceil((new Date(interest.l1_expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  // Already submitted statuses
  const isSubmitted = interest.l2_status !== "not_requested" && interest.l2_status !== "pending_docs";
  const isPendingDocs = interest.l2_status === "pending_docs";

  const handleSubmit = async () => {
    if (!form.clientName.trim() || !form.clientSurname.trim()) {
      setError("Nome e cognome del cliente sono obbligatori");
      return;
    }
    setSending(true);
    setError(null);

    let mandateFileUrl = interest.l2_mandate_file_url;
    let ndaFileUrl = interest.l2_nda_file_url;

    // Upload mandate file
    if (mandateFile) {
      const path = `${deal.id}/${interest.id}/mandate_${mandateFile.name}`;
      const { error: upErr } = await supabase.storage.from("deal-documents").upload(path, mandateFile, { upsert: true });
      if (upErr) { setError("Errore upload mandato: " + upErr.message); setSending(false); return; }
      mandateFileUrl = path;
    }

    // Upload NDA file
    if (ndaFile) {
      const path = `${deal.id}/${interest.id}/nda_${ndaFile.name}`;
      const { error: upErr } = await supabase.storage.from("deal-documents").upload(path, ndaFile, { upsert: true });
      if (upErr) { setError("Errore upload NDA: " + upErr.message); setSending(false); return; }
      ndaFileUrl = path;
    }

    try {
      const res = await fetch("/api/deal-interest/l2-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: interest.id,
          clientName: form.clientName,
          clientSurname: form.clientSurname,
          clientCompany: form.clientCompany,
          clientEmail: form.clientEmail,
          feeFromClient: form.feeFromClient,
          feeFromMinerva: form.feeFromMinerva,
          mandateType: form.mandateType,
          mandateFileUrl,
          ndaFileUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        router.refresh();
      } else {
        setError(data.error || "Errore nell'invio");
      }
    } catch {
      setError("Errore di rete");
    }
    setSending(false);
  };

  if (isExpired) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Link href="/portal/board" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Torna alla Bacheca
        </Link>
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-red-800 mb-2">Autorizzazione L1 Scaduta</h2>
          <p className="text-red-600 text-sm">Il tempo per procedere con L2 è scaduto. Puoi ripresentare una nuova richiesta.</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="p-4 md:p-8 max-w-2xl mx-auto">
        <Link href={`/portal/deals/${deal.id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Torna al Deal
        </Link>
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center">
          {interest.l2_status === "pending_admin" && (
            <>
              <Clock className="w-10 h-10 text-amber-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-900 mb-2">Documentazione in Verifica</h2>
              <p className="text-slate-500 text-sm">L'admin sta verificando i documenti caricati. Riceverai una notifica.</p>
            </>
          )}
          {interest.l2_status === "pending_originator" && (
            <>
              <Clock className="w-10 h-10 text-[#D4AF37] mx-auto mb-4" />
              <h2 className="text-lg font-bold text-slate-900 mb-2">In Attesa dell'Originator</h2>
              <p className="text-slate-500 text-sm">I documenti sono stati verificati. L'originator sta valutando la richiesta.</p>
            </>
          )}
          {interest.l2_status === "approved" && (
            <>
              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 mb-1">Autorizzazione Livello 2</p>
                <p className="text-lg font-bold text-emerald-800">Codice Minerva: {interest.anonymous_code}</p>
              </div>
              <p className="text-slate-500 text-sm">Verrai contattato per schedulare una call con le parti.</p>
            </>
          )}
          {interest.l2_status === "declined" && (
            <>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-4">
                <p className="text-xs font-bold uppercase tracking-widest text-red-600">Autorizzazione L2 Negata</p>
              </div>
              <p className="text-slate-500 text-sm">La richiesta non è stata accolta.</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // Form for L2 submission (not_requested or pending_docs)
  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <Link href={`/portal/deals/${deal.id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna al Deal
      </Link>

      <header className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{deal.code} — {interest.anonymous_code}</p>
        <h1 className="text-2xl font-bold text-slate-900">Richiesta <span className="text-[#D4AF37]">Livello 2</span></h1>
        <p className="text-slate-500 text-sm mt-1">{deal.title}</p>
      </header>

      {daysLeft !== null && (
        <div className={"rounded-xl p-4 mb-6 text-xs font-bold " + (daysLeft <= 3 ? "bg-red-50 text-red-700 border border-red-200" : "bg-amber-50 text-amber-700 border border-amber-200")}>
          <Clock className="w-3.5 h-3.5 inline mr-1" />
          {daysLeft} giorni rimanenti per completare la richiesta L2
        </div>
      )}

      {/* Admin notes (if pending_docs with feedback) */}
      {isPendingDocs && interest.l2_admin_notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-[10px] uppercase tracking-widest text-amber-700 font-bold mb-1">Note dall'admin</p>
          <p className="text-sm text-amber-800">{interest.l2_admin_notes}</p>
        </div>
      )}

      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-5 h-5 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Dati Cliente e Mandato</h2>
        </div>

        {/* Client info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-1">Nome Cliente *</label>
            <input value={form.clientName} onChange={e => setForm({ ...form, clientName: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37]" placeholder="Nome" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-1">Cognome Cliente *</label>
            <input value={form.clientSurname} onChange={e => setForm({ ...form, clientSurname: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37]" placeholder="Cognome" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium block mb-1">Società</label>
            <input value={form.clientCompany} onChange={e => setForm({ ...form, clientCompany: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37]" placeholder="Ragione sociale" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium block mb-1">Email Cliente</label>
            <input type="email" value={form.clientEmail} onChange={e => setForm({ ...form, clientEmail: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37]" placeholder="email@esempio.it" />
          </div>
        </div>

        {/* Fees */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium block mb-1">Fee concordata col cliente</label>
            <input value={form.feeFromClient} onChange={e => setForm({ ...form, feeFromClient: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37]" placeholder="Es: 2% success fee" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-slate-400 font-medium block mb-1">Fee richiesta a Minerva</label>
            <input value={form.feeFromMinerva} onChange={e => setForm({ ...form, feeFromMinerva: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37]" placeholder="Es: 50% origination" />
          </div>
        </div>

        {/* Mandate type */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Tipo Mandato *</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "exclusive", label: "Esclusiva" },
              { value: "generic", label: "Generico" },
              { value: "none", label: "Nessun Mandato" },
            ].map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setForm({ ...form, mandateType: opt.value })}
                className={"py-3 rounded-xl text-xs font-bold uppercase tracking-widest border-2 transition-all " +
                  (form.mandateType === opt.value
                    ? "border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]"
                    : "border-slate-200 text-slate-500 hover:border-slate-300")}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Upload mandate */}
        {(form.mandateType === "exclusive" || form.mandateType === "generic") && (
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">
              Mandato Firmato (PDF) *
            </label>
            <div className="border border-dashed border-slate-200 rounded-lg p-4 text-center hover:border-[#D4AF37]/30 transition-colors">
              <input type="file" accept=".pdf" onChange={e => setMandateFile(e.target.files?.[0] || null)} className="hidden" id="mandate-upload" />
              <label htmlFor="mandate-upload" className="cursor-pointer flex items-center justify-center gap-2 text-sm text-slate-500">
                <Upload className="w-4 h-4" />
                {mandateFile ? mandateFile.name : (interest.l2_mandate_file_url ? "Mandato già caricato — clicca per sostituire" : "Carica mandato firmato")}
              </label>
            </div>
          </div>
        )}

        {/* No mandate → need both NDA and mandate template */}
        {form.mandateType === "none" && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
            <p className="text-xs text-amber-700 font-bold">
              Senza mandato esistente, è necessario far firmare NDA e mandato template generati dal sistema.
            </p>
            <div className="flex gap-3">
              <Link
                href={`/portal/nda-generator/${deal.id}`}
                className="flex-1 text-center bg-[#D4AF37]/10 text-[#D4AF37] px-4 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors"
              >
                <FileText className="w-3.5 h-3.5 inline mr-1" /> Genera NDA
              </Link>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-amber-700 font-medium block mb-2">Mandato Firmato (PDF) *</label>
              <div className="border border-dashed border-amber-300 rounded-lg p-3 text-center">
                <input type="file" accept=".pdf" onChange={e => setMandateFile(e.target.files?.[0] || null)} className="hidden" id="mandate-upload-none" />
                <label htmlFor="mandate-upload-none" className="cursor-pointer text-xs text-amber-700">
                  <Upload className="w-3.5 h-3.5 inline mr-1" />
                  {mandateFile ? mandateFile.name : "Carica mandato firmato"}
                </label>
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-widest text-amber-700 font-medium block mb-2">NDA Firmato (PDF) *</label>
              <div className="border border-dashed border-amber-300 rounded-lg p-3 text-center">
                <input type="file" accept=".pdf" onChange={e => setNdaFile(e.target.files?.[0] || null)} className="hidden" id="nda-upload" />
                <label htmlFor="nda-upload" className="cursor-pointer text-xs text-amber-700">
                  <Upload className="w-3.5 h-3.5 inline mr-1" />
                  {ndaFile ? ndaFile.name : "Carica NDA firmato"}
                </label>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-600 text-xs">{error}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={sending || !form.clientName.trim() || !form.clientSurname.trim()}
          className="w-full bg-[#D4AF37] text-white py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {sending ? "Invio in corso..." : "Invia Richiesta L2"}
        </button>
      </div>
    </div>
  );
}
