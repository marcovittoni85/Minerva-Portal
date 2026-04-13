"use client";

import { useState, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ASSET_CLASS_OPTIONS, type AssetClass } from "@/lib/deal-config";

/* ─── Checklist field definitions per asset class ──────────── */

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "number" | "textarea" | "select";
  required: boolean;
  placeholder?: string;
  options?: string[];
  unit?: string;
}

const COMMON_FIELDS: FieldDef[] = [
  { key: "title", label: "Titolo Operazione", type: "text", required: true, placeholder: "Es: Acquisizione catena hotel 4 stelle" },
  { key: "blind_description", label: "Descrizione Blind (senza dati identificativi)", type: "textarea", required: true, placeholder: "Max 300 caratteri, nessun dato identificativo" },
  { key: "ev_range", label: "Valore Stimato / Range EV", type: "text", required: true, placeholder: "Es: 10-30 mln EUR" },
  { key: "side", label: "Side", type: "select", required: true, options: ["sell-side", "buy-side", "co-investment", "advisory"] },
];

const ASSET_FIELDS: Record<AssetClass, FieldDef[]> = {
  m_and_a: [
    { key: "sector", label: "Settore", type: "text", required: true, placeholder: "Es: Food & Beverage" },
    { key: "revenue", label: "Fatturato ultimo esercizio", type: "number", required: true, placeholder: "EUR", unit: "EUR" },
    { key: "ebitda", label: "EBITDA o margine indicativo", type: "number", required: true, placeholder: "EUR", unit: "EUR" },
    { key: "employees", label: "Numero dipendenti", type: "number", required: true, placeholder: "N." },
    { key: "sell_reason", label: "Motivazione vendita/acquisto", type: "text", required: true, placeholder: "Razionale strategico" },
    { key: "price_range", label: "Prezzo indicativo o range di multiplo", type: "text", required: true, placeholder: "Es: 6-8x EBITDA" },
    { key: "operation_type", label: "Tipo operazione", type: "select", required: true, options: ["100%", "maggioranza", "minoranza", "aumento capitale"] },
    { key: "mandate", label: "Mandato", type: "select", required: true, options: ["esclusiva", "generico", "nessuno"] },
    { key: "timeline", label: "Timeline attesa", type: "text", required: true, placeholder: "Es: Q3 2026" },
  ],
  real_estate: [
    { key: "property_type", label: "Tipologia", type: "select", required: true, options: ["residenziale", "commerciale", "industriale", "hospitality", "terreno", "sviluppo"] },
    { key: "location", label: "Localizzazione — città, zona", type: "text", required: true, placeholder: "Es: Milano, Porta Nuova" },
    { key: "surface_sqm", label: "Superficie mq", type: "number", required: true, placeholder: "mq" },
    { key: "yield", label: "Rendimento lordo/netto se a reddito", type: "text", required: false, placeholder: "Es: 5.5% lordo" },
    { key: "asking_price", label: "Prezzo richiesto", type: "number", required: true, placeholder: "EUR", unit: "EUR" },
    { key: "state", label: "Stato", type: "select", required: true, options: ["libero", "locato", "da ristrutturare"] },
  ],
  club_deal: [
    { key: "sector", label: "Settore", type: "text", required: true, placeholder: "Es: Tech / Healthcare" },
    { key: "min_ticket", label: "Ticket minimo", type: "number", required: true, placeholder: "EUR", unit: "EUR" },
    { key: "target_return", label: "Rendimento target", type: "text", required: true, placeholder: "Es: 15-20% IRR" },
    { key: "time_horizon", label: "Orizzonte temporale", type: "text", required: true, placeholder: "Es: 3-5 anni" },
    { key: "vehicle_structure", label: "Struttura veicolo", type: "select", required: true, options: ["SPV", "fondo", "co-investimento diretto"] },
    { key: "sponsor", label: "Gestore/sponsor", type: "text", required: true, placeholder: "Nome gestore" },
    { key: "track_record", label: "Track record", type: "text", required: false, placeholder: "Opzionale" },
  ],
  strategy: [
    { key: "subject", label: "Oggetto", type: "text", required: true, placeholder: "Oggetto della consulenza" },
    { key: "scope", label: "Scope del lavoro", type: "textarea", required: true, placeholder: "Descrivere in dettaglio" },
    { key: "duration", label: "Durata stimata", type: "text", required: true, placeholder: "Es: 3 mesi" },
    { key: "proposed_fee", label: "Fee proposta", type: "number", required: true, placeholder: "EUR", unit: "EUR" },
    { key: "deliverables", label: "Deliverable attesi", type: "textarea", required: true, placeholder: "Lista deliverable" },
  ],
  wealth_management: [
    { key: "client_aum", label: "Patrimonio indicativo del cliente", type: "text", required: true, placeholder: "Es: 5-10 mln EUR" },
    { key: "composition", label: "Composizione attuale (% immobili, % finanziario, % azienda)", type: "text", required: true, placeholder: "Es: 40% immobili, 30% fin, 30% azienda" },
    { key: "main_goal", label: "Obiettivo principale", type: "select", required: true, options: ["diversificazione", "protezione", "passaggio generazionale", "ottimizzazione fiscale"] },
    { key: "urgency", label: "Urgenza", type: "select", required: true, options: ["immediata", "1-3 mesi", "3-6 mesi", "6-12 mesi"] },
  ],
};

export default function ProposeNewDeal() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  const [assetClass, setAssetClass] = useState<AssetClass | "">("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [aiFilledKeys, setAiFilledKeys] = useState<Set<string>>(new Set());
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const uploadedPathsRef = useRef<string[]>([]);

  const allFields = useMemo(() => {
    if (!assetClass) return COMMON_FIELDS;
    return [...COMMON_FIELDS, ...ASSET_FIELDS[assetClass]];
  }, [assetClass]);

  const completeness = useMemo(() => {
    const requiredFields = allFields.filter(f => f.required);
    if (requiredFields.length === 0) return 0;
    const filled = requiredFields.filter(f => (formData[f.key] || "").trim().length > 0);
    const hasFiles = files.length > 0;
    const totalRequired = requiredFields.length + 1; // +1 for files
    const totalFilled = filled.length + (hasFiles ? 1 : 0);
    return Math.round((totalFilled / totalRequired) * 100);
  }, [allFields, formData, files]);

  const setField = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setFileError(null);
      uploadedPathsRef.current = [];
    }
  };

  const handleAnalyze = async () => {
    if (!assetClass) { setAnalyzeError("Seleziona prima il tipo di operazione"); return; }
    if (files.length === 0) { setAnalyzeError("Carica almeno un documento"); return; }
    setAnalyzing(true);
    setAnalyzeError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setAnalyzeError("Non autenticato"); setAnalyzing(false); return; }

    // Upload files to Supabase Storage (temp folder) if not already uploaded
    if (uploadedPathsRef.current.length === 0) {
      const tempId = crypto.randomUUID();
      const paths: string[] = [];
      for (const file of files) {
        const filePath = `proposals/tmp_${tempId}/${file.name}`;
        const { error: upErr } = await supabase.storage.from("deal-documents").upload(filePath, file);
        if (!upErr) paths.push(filePath);
      }
      uploadedPathsRef.current = paths;
    }

    if (uploadedPathsRef.current.length === 0) {
      setAnalyzeError("Errore nel caricamento dei file");
      setAnalyzing(false);
      return;
    }

    try {
      const res = await fetch("/api/analyze-deal-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_class: assetClass, file_paths: uploadedPathsRef.current }),
      });
      const json = await res.json();
      if (!res.ok) { setAnalyzeError(json.error || "Errore analisi"); setAnalyzing(false); return; }

      const extracted = json.data as Record<string, unknown>;
      const filled = new Set<string>();
      setFormData(prev => {
        const next = { ...prev };
        for (const [key, value] of Object.entries(extracted)) {
          if (value !== null && value !== undefined) {
            next[key] = String(value);
            filled.add(key);
          }
        }
        return next;
      });
      setAiFilledKeys(filled);
    } catch {
      setAnalyzeError("Errore di rete durante l'analisi");
    }
    setAnalyzing(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!assetClass) { setError("Seleziona il tipo di operazione"); return; }
    if (files.length === 0) { setFileError("Allega almeno un documento"); return; }
    if ((formData.blind_description || "").length > 300) { setError("La descrizione blind non può superare 300 caratteri"); return; }
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Non autenticato"); setLoading(false); return; }

    // Build checklist_data from asset-specific fields
    const checklistData: Record<string, string> = {};
    for (const field of (ASSET_FIELDS[assetClass] || [])) {
      if (formData[field.key]) checklistData[field.key] = formData[field.key];
    }

    const { data: deal, error: insertError } = await supabase.from("deals").insert({
      title: (formData.title || "").trim(),
      sector: (formData.sector || assetClass).trim(),
      geography: (formData.location || "").trim() || null,
      side: (formData.side || "").trim(),
      ev_range: (formData.ev_range || "").trim(),
      min_ticket: (formData.min_ticket || "").trim() || null,
      description: (formData.scope || formData.sell_reason || "").trim() || null,
      blind_description: (formData.blind_description || "").trim() || null,
      asset_class: assetClass,
      checklist_data: checklistData,
      checklist_completeness: completeness,
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
          <p className="text-slate-500 text-sm mb-6">Il team Minerva valuterà la tua proposta e ti contatteremo a breve.</p>
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

        {/* Completeness bar */}
        {assetClass && (
          <div className="mb-8 bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Completezza Checklist</span>
              <span className={"text-sm font-bold " + (completeness === 100 ? "text-emerald-600" : "text-[#D4AF37]")}>{completeness}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div className={"h-2 rounded-full transition-all duration-500 " + (completeness === 100 ? "bg-emerald-500" : "bg-[#D4AF37]")} style={{ width: `${completeness}%` }} />
            </div>
            {completeness < 100 && (
              <p className="text-[10px] text-slate-400 mt-2">Il deal non potrà essere approvato dall'admin finché la completezza non raggiunge il 100%.</p>
            )}
          </div>
        )}

        <div className="mb-8 bg-slate-50 border border-[#D4AF37]/20 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-slate-900 text-sm font-medium">Deal Proposal Template</p>
            <p className="text-slate-500 text-xs mt-1">Scarica il template PDF come guida per la compilazione</p>
          </div>
          <a href="/Minerva_Deal_Template.pdf" target="_blank" rel="noopener noreferrer" className="bg-[#D4AF37]/10 text-[#D4AF37] px-5 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase border border-[#D4AF37]/20 hover:bg-[#D4AF37]/20 transition-colors whitespace-nowrap">Scarica PDF</a>
        </div>

        {error && <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Asset class selector */}
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-2">Tipo di Operazione *</label>
            <select
              value={assetClass}
              onChange={e => { setAssetClass(e.target.value as AssetClass | ""); setFormData({}); }}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37]"
            >
              <option value="">Seleziona il tipo di operazione...</option>
              {ASSET_CLASS_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Dynamic fields */}
          {assetClass && allFields.map(field => {
            const isAiFilled = aiFilledKeys.has(field.key);
            const aiBorder = isAiFilled ? "border-blue-400 bg-blue-50/30" : "border-slate-200 bg-slate-50";
            return (
              <div key={field.key}>
                <label className={"text-[10px] uppercase tracking-widest font-medium block mb-2 " + (field.required ? "text-[#D4AF37]" : "text-slate-400")}>
                  {field.label} {field.required && "*"}
                  {isAiFilled && <span className="ml-2 text-blue-500 normal-case tracking-normal font-normal">&#10024; compilato da AI</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    value={formData[field.key] || ""}
                    onChange={e => { setField(field.key, e.target.value); setAiFilledKeys(prev => { const n = new Set(prev); n.delete(field.key); return n; }); }}
                    required={field.required}
                    className={`w-full rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] border ${aiBorder}`}
                  >
                    <option value="">Seleziona...</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
                  </select>
                ) : field.type === "textarea" ? (
                  <div>
                    <textarea
                      value={formData[field.key] || ""}
                      onChange={e => { setField(field.key, e.target.value); setAiFilledKeys(prev => { const n = new Set(prev); n.delete(field.key); return n; }); }}
                      required={field.required}
                      placeholder={field.placeholder}
                      rows={3}
                      maxLength={field.key === "blind_description" ? 300 : undefined}
                      className={`w-full rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors placeholder:text-slate-400 resize-none border ${aiBorder}`}
                    />
                    {field.key === "blind_description" && (
                      <p className="text-[10px] text-slate-400 mt-1">{(formData[field.key] || "").length}/300</p>
                    )}
                  </div>
                ) : (
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    value={formData[field.key] || ""}
                    onChange={e => { setField(field.key, e.target.value); setAiFilledKeys(prev => { const n = new Set(prev); n.delete(field.key); return n; }); }}
                    required={field.required}
                    placeholder={field.placeholder}
                    className={`w-full rounded-lg px-4 py-3 text-slate-900 text-sm outline-none focus:border-[#D4AF37] transition-colors placeholder:text-slate-400 border ${aiBorder}`}
                  />
                )}
              </div>
            );
          })}

          {/* File upload */}
          {assetClass && (
            <>
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
                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="mt-4 w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-blue-700 transition-colors disabled:opacity-50"
                  >
                    {analyzing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        Analisi in corso...
                      </>
                    ) : (
                      <>&#10024; Analizza Documenti con AI</>
                    )}
                  </button>
                )}
                {analyzeError && <p className="text-red-500 text-xs mt-2">{analyzeError}</p>}
                {aiFilledKeys.size > 0 && (
                  <p className="text-blue-500 text-xs mt-2">&#10024; {aiFilledKeys.size} campi precompilati dall&apos;AI — rivedi e correggi se necessario</p>
                )}
              </div>

              <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full bg-[#D4AF37] text-white py-3.5 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors disabled:opacity-50">
                  {loading ? "Invio in corso..." : "Invia Proposta"}
                </button>
              </div>

              <p className="text-center text-slate-400 text-[9px] uppercase tracking-wider">La proposta sarà visibile solo al team Minerva fino ad approvazione</p>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
