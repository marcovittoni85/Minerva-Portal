"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock, ScrollText, CircleDollarSign, X, Plus, Trash2, LayoutGrid, CheckSquare, Calendar, FileText, Upload, Download, Eye, Sparkles, Send, Ban, ParkingCircle, MessageSquare } from "lucide-react";
import FeeTracker from "@/components/fees/FeeTracker";
import AddTaskModal from "@/components/cockpit/AddTaskModal";
import EventForm from "@/components/calendar/EventForm";
import DealEvents from "@/components/calendar/DealEvents";
import { DEAL_TYPE_OPTIONS, ASSET_CLASS_OPTIONS, type AssetClass } from "@/lib/deal-config";

/* ─── Checklist field definitions (reused from propose-deal) ──────── */

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
  { key: "blind_description", label: "Descrizione Blind", type: "textarea", required: true, placeholder: "Max 300 caratteri, nessun dato identificativo" },
  { key: "ev_range", label: "Valore Stimato / Range EV", type: "text", required: true, placeholder: "Es: 10-30 mln EUR" },
  { key: "side", label: "Side", type: "select", required: true, options: ["sell-side", "buy-side", "co-investment", "advisory"] },
];

const ASSET_FIELDS: Record<string, FieldDef[]> = {
  m_and_a: [
    { key: "sector", label: "Settore", type: "text", required: true, placeholder: "Es: Food & Beverage" },
    { key: "revenue", label: "Fatturato ultimo esercizio", type: "number", required: true, placeholder: "EUR", unit: "EUR" },
    { key: "ebitda", label: "EBITDA o margine indicativo", type: "number", required: true, placeholder: "EUR", unit: "EUR" },
    { key: "employees", label: "Numero dipendenti", type: "number", required: true, placeholder: "N." },
    { key: "sell_reason", label: "Motivazione vendita/acquisto", type: "text", required: true },
    { key: "price_range", label: "Prezzo indicativo o range di multiplo", type: "text", required: true },
    { key: "operation_type", label: "Tipo operazione", type: "select", required: true, options: ["100%", "maggioranza", "minoranza", "aumento capitale"] },
    { key: "mandate", label: "Mandato", type: "select", required: true, options: ["esclusiva", "generico", "nessuno"] },
    { key: "timeline", label: "Timeline attesa", type: "text", required: true, placeholder: "Es: Q3 2026" },
  ],
  real_estate: [
    { key: "property_type", label: "Tipologia", type: "select", required: true, options: ["residenziale", "commerciale", "industriale", "hospitality", "terreno", "sviluppo"] },
    { key: "location", label: "Localizzazione", type: "text", required: true },
    { key: "surface_sqm", label: "Superficie mq", type: "number", required: true },
    { key: "yield", label: "Rendimento lordo/netto", type: "text", required: false },
    { key: "asking_price", label: "Prezzo richiesto", type: "number", required: true, unit: "EUR" },
    { key: "state", label: "Stato", type: "select", required: true, options: ["libero", "locato", "da ristrutturare"] },
  ],
  club_deal: [
    { key: "sector", label: "Settore", type: "text", required: true },
    { key: "min_ticket", label: "Ticket minimo", type: "number", required: true, unit: "EUR" },
    { key: "target_return", label: "Rendimento target", type: "text", required: true },
    { key: "time_horizon", label: "Orizzonte temporale", type: "text", required: true },
    { key: "vehicle_structure", label: "Struttura veicolo", type: "select", required: true, options: ["SPV", "fondo", "co-investimento diretto"] },
    { key: "sponsor", label: "Gestore/sponsor", type: "text", required: true },
    { key: "track_record", label: "Track record", type: "text", required: false },
  ],
  strategy: [
    { key: "subject", label: "Oggetto", type: "text", required: true },
    { key: "scope", label: "Scope del lavoro", type: "textarea", required: true },
    { key: "duration", label: "Durata stimata", type: "text", required: true },
    { key: "proposed_fee", label: "Fee proposta", type: "number", required: true, unit: "EUR" },
    { key: "deliverables", label: "Deliverable attesi", type: "textarea", required: true },
  ],
  wealth_management: [
    { key: "client_aum", label: "Patrimonio indicativo", type: "text", required: true },
    { key: "composition", label: "Composizione attuale", type: "text", required: true },
    { key: "main_goal", label: "Obiettivo principale", type: "select", required: true, options: ["diversificazione", "protezione", "passaggio generazionale", "ottimizzazione fiscale"] },
    { key: "urgency", label: "Urgenza", type: "select", required: true, options: ["immediata", "1-3 mesi", "3-6 mesi", "6-12 mesi"] },
  ],
};

interface DealDocument {
  id: string;
  deal_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_type: string | null;
  uploaded_by: string;
  uploaded_by_name: string;
  created_at: string;
}

/* ─── DocumentsChecklistSection component ─────────────────────── */

function DocumentsChecklistSection({ deal, adminId }: { deal: any; adminId: string }) {
  const supabase = createClient();
  const [documents, setDocuments] = useState<DealDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Checklist state
  const assetClass = (deal.asset_class || "") as string;
  const allFields = useMemo(() => {
    if (!assetClass || !ASSET_FIELDS[assetClass]) return COMMON_FIELDS;
    return [...COMMON_FIELDS, ...ASSET_FIELDS[assetClass]];
  }, [assetClass]);

  const [checklistData, setChecklistData] = useState<Record<string, string>>(() => {
    const raw = deal.checklist_data || {};
    const merged: Record<string, string> = {};
    // Include common field values from deal top-level fields too
    if (deal.title) merged.title = deal.title;
    if (deal.blind_description) merged.blind_description = deal.blind_description;
    if (deal.ev_range) merged.ev_range = deal.ev_range;
    if (deal.side) merged.side = deal.side;
    for (const [k, v] of Object.entries(raw)) {
      if (v !== null && v !== undefined) merged[k] = String(v);
    }
    return merged;
  });
  const [manuallyEdited, setManuallyEdited] = useState<string[]>(deal.checklist_manually_edited || []);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [checklistSaved, setChecklistSaved] = useState(false);
  const [reanalyzing, setReanalyzing] = useState(false);

  // Blind profile
  const [blindTitle, setBlindTitle] = useState(deal.blind_title || deal.title || "");
  const [blindDescription, setBlindDescription] = useState(deal.blind_description || "");
  const [generatingBlind, setGeneratingBlind] = useState(false);

  // Rejection
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectType, setRejectType] = useState<"rejected_not_conforming" | "parked" | "pending_integration">("rejected_not_conforming");
  const [rejectNote, setRejectNote] = useState("");
  const [integrationMessage, setIntegrationMessage] = useState("");
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  const completeness = useMemo(() => {
    const required = allFields.filter(f => f.required);
    if (required.length === 0) return 0;
    const filled = required.filter(f => (checklistData[f.key] || "").trim().length > 0);
    return Math.round((filled.length / required.length) * 100);
  }, [allFields, checklistData]);

  // Load documents
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fetch(`/api/deal-documents?deal_id=${deal.id}`);
      const data = await res.json();
      if (data.documents) setDocuments(data.documents);
    } catch { /* silent */ }
    setLoadingDocs(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("deal_id", deal.id);
      formData.append("file", file);
      const res = await fetch("/api/deal-documents", { method: "POST", body: formData });
      if (res.ok) fetchDocuments();
      else alert("Errore upload");
    } catch { alert("Errore di rete"); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm("Eliminare questo documento?")) return;
    try {
      const res = await fetch("/api/deal-documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: docId }),
      });
      if (res.ok) setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch { alert("Errore"); }
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "—";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const setChecklistField = (key: string, value: string) => {
    setChecklistData(prev => ({ ...prev, [key]: value }));
    if (!manuallyEdited.includes(key)) {
      setManuallyEdited(prev => [...prev, key]);
    }
  };

  const saveChecklist = async () => {
    setSavingChecklist(true);
    setChecklistSaved(false);
    try {
      const res = await fetch("/api/deal-manage/checklist", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dealId: deal.id,
          checklist_data: checklistData,
          checklist_completeness: completeness,
          blind_title: blindTitle,
          blind_description: blindDescription,
          checklist_manually_edited: manuallyEdited,
        }),
      });
      if (res.ok) {
        setChecklistSaved(true);
        setTimeout(() => setChecklistSaved(false), 2000);
      } else {
        const data = await res.json();
        alert(data.error || "Errore salvataggio");
      }
    } catch { alert("Errore di rete"); }
    setSavingChecklist(false);
  };

  const reanalyzeAI = async () => {
    setReanalyzing(true);
    try {
      // Get file paths from storage for this deal
      const { data: files } = await supabase.storage.from("deal-documents").list(`proposals/${deal.id}`);
      const paths = (files || []).map(f => `proposals/${deal.id}/${f.name}`);
      if (paths.length === 0) { alert("Nessun documento da analizzare"); setReanalyzing(false); return; }

      const res = await fetch("/api/analyze-deal-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset_class: assetClass, file_paths: paths }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        const extracted = json.data as Record<string, unknown>;
        setChecklistData(prev => {
          const next = { ...prev };
          for (const [key, value] of Object.entries(extracted)) {
            // Only overwrite fields NOT manually edited by admin
            if (value !== null && value !== undefined && !manuallyEdited.includes(key)) {
              next[key] = String(value);
            }
          }
          return next;
        });
      } else {
        alert(json.error || "Errore analisi AI");
      }
    } catch { alert("Errore di rete"); }
    setReanalyzing(false);
  };

  const generateBlind = async () => {
    setGeneratingBlind(true);
    try {
      const res = await fetch("/api/deal-manage/generate-blind", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checklist_data: checklistData, asset_class: assetClass }),
      });
      const json = await res.json();
      if (res.ok && json.data) {
        setBlindTitle(json.data.blind_title || "");
        setBlindDescription(json.data.blind_description || "");
      } else {
        alert(json.error || "Errore generazione blind");
      }
    } catch { alert("Errore di rete"); }
    setGeneratingBlind(false);
  };

  const approveDeal = async () => {
    if (completeness < 100) { alert("Checklist incompleta — completa tutti i campi obbligatori"); return; }
    if (!confirm("Approvare e pubblicare questo deal in bacheca?")) return;
    await saveChecklist();
    const { error } = await supabase.from("deals").update({
      status: "approved",
      active: true,
      is_visible_board: true,
      board_status: "active",
    }).eq("id", deal.id);
    if (!error) {
      await supabase.from("deal_activity_log").insert({
        deal_id: deal.id, user_id: adminId, action: "deal_approved",
        details: { completeness },
      });
      alert("Deal approvato e pubblicato in bacheca!");
      window.location.reload();
    }
  };

  const rejectDeal = async () => {
    const { error } = await supabase.from("deals").update({
      status: rejectType,
      rejection_type: rejectType,
      rejection_note_internal: rejectNote,
      active: false,
    }).eq("id", deal.id);
    if (!error) {
      await supabase.from("deal_activity_log").insert({
        deal_id: deal.id, user_id: adminId, action: "deal_rejected",
        details: { type: rejectType, note: rejectNote },
      });
      setShowRejectModal(false);
      alert("Deal rifiutato");
      window.location.reload();
    }
  };

  const requestIntegration = async () => {
    const { error } = await supabase.from("deals").update({
      status: "pending_integration",
      rejection_type: "pending_integration",
      rejection_note_external: integrationMessage,
    }).eq("id", deal.id);
    if (!error) {
      await supabase.from("deal_activity_log").insert({
        deal_id: deal.id, user_id: adminId, action: "integration_requested",
        details: { message: integrationMessage },
      });
      // Notify originator
      if (deal.created_by) {
        try {
          await fetch("/api/notifications/stage-changed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ dealId: deal.id, fromStage: deal.status, toStage: "pending_integration" }),
          });
        } catch { /* silent */ }
      }
      setShowIntegrationModal(false);
      alert("Richiesta integrazioni inviata");
      window.location.reload();
    }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 mt-8">
      <div className="flex items-center gap-2 mb-6">
        <FileText className="w-4 h-4 text-[#D4AF37]" />
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Documenti & Checklist</h2>
      </div>

      {/* === DOCUMENTS === */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Documenti Allegati</p>
          <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest cursor-pointer transition-colors ${uploading ? "bg-slate-100 text-slate-400" : "bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20"}`}>
            <Upload className="w-3 h-3" />
            {uploading ? "Caricamento..." : "Aggiungi"}
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {loadingDocs ? (
          <p className="text-xs text-slate-400 py-4 text-center animate-pulse">Caricamento documenti...</p>
        ) : documents.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Nessun documento caricato</p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-900 truncate">{doc.file_name}</p>
                    <p className="text-[10px] text-slate-400">
                      {formatFileSize(doc.file_size)} &middot; {doc.uploaded_by_name} &middot; {new Date(doc.created_at).toLocaleDateString("it-IT")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Visualizza">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                  <a href={doc.file_url} download className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors" title="Scarica">
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                  </a>
                  <button onClick={() => handleDeleteDoc(doc.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Elimina">
                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* === COMPLETENESS BAR === */}
      <div className="mb-6 bg-slate-50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Completezza Checklist</span>
          <span className={`text-sm font-bold ${completeness === 100 ? "text-emerald-600" : "text-[#D4AF37]"}`}>{completeness}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2">
          <div className={`h-2 rounded-full transition-all duration-500 ${completeness === 100 ? "bg-emerald-500" : "bg-[#D4AF37]"}`} style={{ width: `${completeness}%` }} />
        </div>
        {completeness < 100 && (
          <p className="text-[10px] text-slate-400 mt-2">Il deal non può essere approvato finché la completezza non raggiunge il 100%.</p>
        )}
      </div>

      {/* === EDITABLE CHECKLIST === */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
            Checklist {assetClass ? `— ${ASSET_CLASS_OPTIONS.find(o => o.value === assetClass)?.label || assetClass}` : ""}
          </p>
          <button
            onClick={reanalyzeAI}
            disabled={reanalyzing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-3 h-3 ${reanalyzing ? "animate-spin" : ""}`} />
            {reanalyzing ? "Analisi in corso..." : "Riesegui analisi AI"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allFields.map(field => {
            const isAiField = !manuallyEdited.includes(field.key) && (checklistData[field.key] || "").trim().length > 0;
            const borderClass = isAiField ? "border-blue-300 bg-blue-50/30" : "border-slate-200 bg-slate-50";
            return (
              <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <label className={`text-[9px] uppercase tracking-widest font-bold block mb-1 ${field.required ? "text-[#D4AF37]" : "text-slate-400"}`}>
                  {field.label} {field.required && "*"}
                  {isAiField && <span className="ml-1 text-blue-500 normal-case tracking-normal font-normal text-[9px]">AI</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    value={checklistData[field.key] || ""}
                    onChange={e => setChecklistField(field.key, e.target.value)}
                    className={`w-full rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37] border ${borderClass}`}
                  >
                    <option value="">Seleziona...</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={checklistData[field.key] || ""}
                    onChange={e => setChecklistField(field.key, e.target.value)}
                    rows={2}
                    placeholder={field.placeholder}
                    className={`w-full rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37] resize-none border ${borderClass}`}
                  />
                ) : (
                  <input
                    type={field.type}
                    value={checklistData[field.key] || ""}
                    onChange={e => setChecklistField(field.key, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37] border ${borderClass}`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* === BLIND PROFILE === */}
      <div className="mb-8 p-5 bg-slate-50 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Blind Profile</p>
          <button
            onClick={generateBlind}
            disabled={generatingBlind}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-50"
          >
            <Sparkles className={`w-3 h-3 ${generatingBlind ? "animate-spin" : ""}`} />
            {generatingBlind ? "Generazione..." : "Genera blind con AI"}
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Titolo Blind</label>
            <input
              type="text"
              value={blindTitle}
              onChange={e => setBlindTitle(e.target.value)}
              placeholder="Titolo senza dati identificativi"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Descrizione Blind <span className="text-slate-300">({blindDescription.length}/300)</span></label>
            <textarea
              value={blindDescription}
              onChange={e => { if (e.target.value.length <= 300) setBlindDescription(e.target.value); }}
              rows={3}
              placeholder="Descrizione non identificativa"
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37] resize-none"
            />
          </div>

          {/* Preview */}
          {(blindTitle || blindDescription) && (
            <div className="mt-3 p-4 bg-white border border-dashed border-[#D4AF37]/30 rounded-xl">
              <p className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold mb-2">Anteprima Bacheca</p>
              <h4 className="text-sm font-bold text-slate-900 mb-1">{blindTitle || "—"}</h4>
              <p className="text-xs text-slate-500 leading-relaxed">{blindDescription || "—"}</p>
            </div>
          )}
        </div>
      </div>

      {/* === SAVE + ACTION BUTTONS === */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
        <button
          onClick={saveChecklist}
          disabled={savingChecklist}
          className="bg-[#D4AF37] text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors disabled:opacity-50"
        >
          {savingChecklist ? "Salvataggio..." : checklistSaved ? "Salvato!" : "Salva Modifiche"}
        </button>

        <button
          onClick={approveDeal}
          disabled={completeness < 100}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors ${
            completeness === 100
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-slate-100 text-slate-400 cursor-not-allowed"
          }`}
          title={completeness < 100 ? "Checklist incompleta" : ""}
        >
          Approva e Pubblica
        </button>

        <button
          onClick={() => setShowIntegrationModal(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-amber-300 text-amber-700 hover:bg-amber-50 transition-colors"
        >
          <Send className="w-3 h-3" /> Richiedi Integrazioni
        </button>

        <button
          onClick={() => setShowRejectModal(true)}
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-red-300 text-red-600 hover:bg-red-50 transition-colors ml-auto"
        >
          <Ban className="w-3 h-3" /> Rifiuta
        </button>
      </div>

      {/* Reject modal */}
      {showRejectModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowRejectModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Rifiuta Deal</h3>
            <div className="space-y-3 mb-4">
              {([
                { value: "rejected_not_conforming", label: "Non Conforme", icon: Ban, desc: "Il deal non rispetta i criteri Minerva" },
                { value: "parked", label: "Parcheggiato", icon: ParkingCircle, desc: "Deal valido ma non prioritario al momento" },
                { value: "pending_integration", label: "Integrazioni necessarie", icon: MessageSquare, desc: "Servono documenti o info aggiuntive" },
              ] as const).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setRejectType(opt.value)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${rejectType === opt.value ? "border-red-300 bg-red-50/50" : "border-slate-100 hover:border-slate-200"}`}
                >
                  <div className="flex items-center gap-2">
                    <opt.icon className={`w-4 h-4 ${rejectType === opt.value ? "text-red-500" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-slate-900">{opt.label}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 ml-6">{opt.desc}</p>
                </button>
              ))}
            </div>
            <textarea
              value={rejectNote}
              onChange={e => setRejectNote(e.target.value)}
              rows={2}
              placeholder="Note interne (opzionale)"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-red-300 resize-none mb-4"
            />
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setShowRejectModal(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50">Annulla</button>
              <button onClick={rejectDeal} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700">Conferma Rifiuto</button>
            </div>
          </div>
        </>
      )}

      {/* Integration request modal */}
      {showIntegrationModal && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowIntegrationModal(false)} />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Richiedi Integrazioni</h3>
            <p className="text-xs text-slate-500 mb-3">Questo messaggio verrà inviato all'originator del deal.</p>
            <textarea
              value={integrationMessage}
              onChange={e => setIntegrationMessage(e.target.value)}
              rows={4}
              placeholder="Descrivi quali documenti o informazioni sono necessari..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37] resize-none mb-4"
            />
            <div className="flex items-center gap-3 justify-end">
              <button onClick={() => setShowIntegrationModal(false)} className="px-4 py-2 rounded-lg text-xs font-bold text-slate-500 border border-slate-200 hover:bg-slate-50">Annulla</button>
              <button onClick={requestIntegration} disabled={!integrationMessage.trim()} className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-[#D4AF37] hover:bg-[#b8962d] disabled:opacity-50">Invia Richiesta</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */

const stages = ["board", "in_review", "workgroup", "in_progress", "closed_won", "closed_lost"];
const stageLabels: Record<string, string> = {
  board: "Board",
  in_review: "In Review",
  workgroup: "Workgroup",
  in_progress: "In Progress",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

function getMacroCategory(sector: string) {
  if (sector === "Real estate & hospitality") return "REAL ESTATE";
  if (sector === "Utility e rinnovabili" || sector === "Petrolio e gas") return "ENERGY";
  if (sector === "Servizi finanziari") return "FINANCE";
  return "CORPORATE M&A";
}

interface DeclarationData {
  roleInDeal: string | null;
  hasMandate: boolean;
  mandateCounterparty: string | null;
  mandateFeeType: string | null;
  mandateFeeValue: string | null;
  hasConflict: boolean;
  conflictDetails: string | null;
  isChainMandate: boolean;
  chainMandanteName: string | null;
  chainMandanteCompany: string | null;
  chainMandanteContact: string | null;
  chainMandanteRelationship: string | null;
  reviewStatus: string | null;
  declaredAt: string | null;
}

const roleLabels: Record<string, string> = {
  facilitatore: "Facilitatore / Finder",
  buyer_rep: "Rappresentante Buyer",
  seller_rep: "Rappresentante Seller",
  supporto_tecnico: "Supporto Tecnico",
};

const counterpartyLabels: Record<string, string> = {
  buyer: "Buyer / Investitore",
  seller: "Venditore / Target",
  other: "Altro soggetto",
};

const feeTypeLabels: Record<string, string> = {
  percentage: "% su EV",
  fixed: "Importo fisso",
  tbd: "Da negoziare",
};

const reviewLabels: Record<string, string> = {
  pending: "In attesa di revisione",
  approved: "Approvato",
  rejected: "Rifiutato",
};

interface Member {
  id: string;
  name: string;
  role: string;
  roleInDeal?: string;
  declarationStatus?: "none" | "pending" | "conflict" | "approved";
  declaration?: DeclarationData | null;
}

interface PresentationRequest {
  id: string;
  userName: string;
  userId: string;
  counterpartyName: string;
  counterpartyCompany: string;
  counterpartyRole: string;
  notes: string;
  status: string;
  createdAt: string;
}

interface ActivityEntry {
  id: string;
  userName: string;
  action: string;
  details: any;
  createdAt: string;
}

const actionLabels: Record<string, string> = {
  deal_viewed: "Ha visualizzato il deal",
  access_requested: "Ha richiesto accesso",
  access_approved: "Ha approvato l'accesso",
  workgroup_added: "Ha aggiunto un membro al gruppo di lavoro",
  declaration_submitted: "Ha inviato la dichiarazione",
  stage_changed: "Ha cambiato lo stage",
  presentation_requested: "Ha richiesto autorizzazione a presentare",
  presentation_approved: "Ha approvato la presentazione",
  presentation_rejected: "Ha rifiutato la presentazione",
  nda_uploaded: "Ha caricato l'NDA firmato",
};

function getActionDescription(action: string, details: any): string {
  if (action === "stage_changed" && details?.from && details?.to) {
    const from = stageLabels[details.from] || details.from;
    const to = stageLabels[details.to] || details.to;
    return `Ha cambiato lo stage da ${from} a ${to}`;
  }
  if (action === "access_approved" && details?.approved_user_name) {
    return `Ha approvato l'accesso per ${details.approved_user_name}`;
  }
  if (action === "workgroup_added" && details?.added_user_name) {
    return `Ha aggiunto ${details.added_user_name} al gruppo di lavoro`;
  }
  if (action === "declaration_submitted" && details?.has_conflict) {
    return "Ha inviato la dichiarazione (conflitto segnalato)";
  }
  if (action === "presentation_requested" && details?.counterparty_name) {
    return `Ha richiesto di presentare a ${details.counterparty_name} (${details.counterparty_company || ""})`;
  }
  if (action === "presentation_approved" && details?.counterparty_name) {
    return `Ha approvato la presentazione a ${details.counterparty_name}`;
  }
  if (action === "presentation_rejected" && details?.counterparty_name) {
    return `Ha rifiutato la presentazione a ${details.counterparty_name}`;
  }
  if (action === "nda_uploaded" && details?.counterparty_company) {
    return `Ha caricato l'NDA firmato per ${details.counterparty_company}`;
  }
  return actionLabels[action] || action;
}

export default function DealManageClient({
  deal,
  originatorName,
  accessMembers,
  workgroupMembers,
  adminId,
  activityLog = [],
  presentationRequests: initialPresentationRequests = [],
  signedMandateId = null,
}: {
  deal: any;
  originatorName: string;
  accessMembers: Member[];
  workgroupMembers: Member[];
  adminId: string;
  activityLog?: ActivityEntry[];
  presentationRequests?: PresentationRequest[];
  signedMandateId?: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(deal.deal_stage || "board");
  const [loading, setLoading] = useState(false);
  const [wgMembers, setWgMembers] = useState<Member[]>(workgroupMembers);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);
  const [presRequests, setPresRequests] = useState<PresentationRequest[]>(initialPresentationRequests);
  const [processingPresId, setProcessingPresId] = useState<string | null>(null);

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  // Event modal
  const [showEventModal, setShowEventModal] = useState(false);
  const [eventsRefresh, setEventsRefresh] = useState(0);

  // Board editor drawer state
  const [boardDrawerOpen, setBoardDrawerOpen] = useState(false);
  const [boardForm, setBoardForm] = useState({
    is_visible_board: deal.is_visible_board ?? true,
    deal_type: deal.deal_type || "",
    estimated_ev: deal.estimated_ev || "",
    location: deal.location || "",
    teaser_description: deal.teaser_description || "",
    highlights: (Array.isArray(deal.highlights) ? deal.highlights : []) as string[],
  });
  const [newHighlight, setNewHighlight] = useState("");
  const [savingBoard, setSavingBoard] = useState(false);
  const [boardSaved, setBoardSaved] = useState(false);

  const saveBoardFields = async () => {
    setSavingBoard(true);
    setBoardSaved(false);
    try {
      const res = await fetch("/api/deal-manage/board-edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: deal.id, ...boardForm }),
      });
      if (res.ok) {
        setBoardSaved(true);
        setTimeout(() => setBoardSaved(false), 2000);
      } else {
        const data = await res.json();
        alert(data.error || "Errore nel salvataggio");
      }
    } catch {
      alert("Errore di rete");
    }
    setSavingBoard(false);
  };

  const addHighlight = () => {
    const val = newHighlight.trim();
    if (val && !boardForm.highlights.includes(val)) {
      setBoardForm(f => ({ ...f, highlights: [...f.highlights, val] }));
      setNewHighlight("");
    }
  };

  const removeHighlight = (index: number) => {
    setBoardForm(f => ({ ...f, highlights: f.highlights.filter((_, i) => i !== index) }));
  };

  const currentIndex = stages.indexOf(currentStage);

  const updateStage = async (newStage: string) => {
    setLoading(true);
    const oldStage = currentStage;
    const { error } = await supabase.from("deals").update({ deal_stage: newStage }).eq("id", deal.id);
    if (!error) {
      setCurrentStage(newStage);
      await supabase.from("deal_activity_log").insert({
        deal_id: deal.id,
        user_id: adminId,
        action: "stage_changed",
        details: { from: oldStage, to: newStage },
      });
      // Notify workgroup members about stage change
      try {
        await fetch("/api/notifications/stage-changed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId: deal.id, fromStage: oldStage, toStage: newStage }),
        });
      } catch (e) {
        console.error("stage-changed notification error:", e);
      }
    }
    setLoading(false);
  };

  const addToWorkgroup = async (userId: string, userName: string) => {
    setAddingUserId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/deal-manage/add-to-workgroup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ dealId: deal.id, userId, dealTitle: deal.title }),
      });
      const data = await res.json();
      if (res.ok) {
        setWgMembers(prev => [...prev, { id: userId, name: userName, role: "", roleInDeal: "member", declarationStatus: "none" }]);
        alert("Utente aggiunto al gruppo di lavoro");
        router.refresh();
      } else if (data.alreadyExists) {
        // Sync local state so button disappears
        setWgMembers(prev => prev.some(m => m.id === userId) ? prev : [...prev, { id: userId, name: userName, role: "", roleInDeal: "member", declarationStatus: "none" }]);
        alert("Utente già nel gruppo di lavoro");
      } else {
        alert("Errore: " + (data.error || "Impossibile aggiungere al gruppo"));
      }
    } catch (e: any) {
      alert("Errore di rete: " + (e.message || "Riprova più tardi"));
    }
    setAddingUserId(null);
  };

  const handlePresentationAction = async (requestId: string, action: "approved" | "rejected") => {
    setProcessingPresId(requestId);
    try {
      const res = await fetch("/api/presentation-request/approve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId, action }),
      });
      if (res.ok) {
        setPresRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: action } : r));
      } else {
        const data = await res.json();
        alert(data.error || "Errore");
      }
    } catch {
      alert("Errore di rete");
    }
    setProcessingPresId(null);
  };

  const wgUserIds = new Set(wgMembers.map(m => m.id));
  const eligibleForWg = accessMembers.filter(m => !wgUserIds.has(m.id));

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/portal/deal-manage" className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-[#D4AF37] transition-colors mb-4 inline-block">&larr; Tutti i Deal</Link>
        <div className="flex flex-col md:flex-row items-start md:justify-between gap-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-1">{deal.code}</p>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{deal.title}</h1>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{deal.sector}</span>
              {deal.sector && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded">{getMacroCategory(deal.sector)}</span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-start md:items-end gap-2">
            <p className="text-xs text-slate-400">Originator: <span className="text-slate-600 font-medium">{originatorName}</span></p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowTaskModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
              >
                <CheckSquare className="w-3.5 h-3.5" /> Crea Task
              </button>
              <button
                onClick={() => setShowEventModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
              >
                <Calendar className="w-3.5 h-3.5" /> Evento
              </button>
              <button
                onClick={() => setBoardDrawerOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Modifica Bacheca
              </button>
              <Link
                href={`/portal/mandates?deal_id=${deal.id}&deal_title=${encodeURIComponent(deal.title)}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#D4AF37] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors"
              >
                <ScrollText className="w-3.5 h-3.5" /> Genera Mandato
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stage Pipeline */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Pipeline</h2>
        <div className="flex items-center gap-1 mb-6 overflow-x-auto">
          {stages.map((stage, i) => {
            const isActive = i === currentIndex;
            const isPast = i < currentIndex;
            const isClosed = stage === "closed_won" || stage === "closed_lost";
            return (
              <div key={stage} className="flex-1 flex flex-col items-center">
                <div className={"w-full h-2 rounded-full transition-all " +
                  (isActive ? "bg-[#D4AF37]" : isPast ? "bg-[#D4AF37]/30" : "bg-slate-100")
                } />
                <p className={"mt-2 text-[9px] uppercase tracking-widest font-bold whitespace-nowrap " +
                  (isActive ? "text-[#D4AF37]" : isPast ? "text-slate-500" : "text-slate-300")
                }>
                  {stageLabels[stage]}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {currentIndex > 0 && (
            <button
              onClick={() => updateStage(stages[currentIndex - 1])}
              disabled={loading}
              className="border border-slate-200 text-slate-500 px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:border-slate-400 transition-colors disabled:opacity-50"
            >
              &larr; {stageLabels[stages[currentIndex - 1]]}
            </button>
          )}
          {currentIndex < stages.length - 1 && currentStage !== "closed_won" && currentStage !== "closed_lost" && (
            <>
              <button
                onClick={() => updateStage(stages[currentIndex + 1])}
                disabled={loading}
                className="bg-[#D4AF37] text-white px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors disabled:opacity-50"
              >
                {stageLabels[stages[currentIndex + 1]]} &rarr;
              </button>
              {currentStage !== "closed_lost" && (
                <button
                  onClick={() => updateStage("closed_lost")}
                  disabled={loading}
                  className="border border-red-200 text-red-500 px-5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors disabled:opacity-50 ml-auto"
                >
                  Chiudi (Lost)
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Approved Members */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Membri Approvati</h2>
            <span className="text-xs text-slate-400">{accessMembers.length}</span>
          </div>
          <div className="space-y-3">
            {accessMembers.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Nessun membro approvato</p>
            ) : (
              accessMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{m.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider">{m.role}</p>
                  </div>
                  {wgUserIds.has(m.id) ? (
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg">In WG</span>
                  ) : (
                    <button
                      onClick={() => addToWorkgroup(m.id, m.name)}
                      disabled={addingUserId === m.id}
                      className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors disabled:opacity-50"
                    >
                      {addingUserId === m.id ? "..." : "Aggiungi a WG"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Workgroup Members */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Gruppo di Lavoro</h2>
            <span className="text-xs text-slate-400">{wgMembers.length}</span>
          </div>
          <div className="space-y-3">
            {wgMembers.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Nessun membro nel gruppo di lavoro</p>
            ) : (
              wgMembers.map(m => {
                const declBadge = m.declarationStatus === "conflict"
                  ? { text: "Conflitto segnalato", style: "text-red-600 bg-red-50" }
                  : m.declarationStatus === "pending" || m.declarationStatus === "approved"
                  ? { text: "Dichiarato", style: "text-emerald-600 bg-emerald-50" }
                  : { text: "Dichiarazione pendente", style: "text-amber-600 bg-amber-50" };
                const hasDecl = !!m.declaration;
                const isExpanded = expandedMemberId === m.id;
                const d = m.declaration;
                return (
                  <div key={m.id} className="border-b border-slate-50 last:border-0">
                    <div
                      className={"flex items-center justify-between py-2" + (hasDecl ? " cursor-pointer hover:bg-slate-50/50 transition-colors rounded-lg -mx-2 px-2" : "")}
                      onClick={() => hasDecl && setExpandedMemberId(isExpanded ? null : m.id)}
                    >
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{m.name}</p>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider">{m.roleInDeal || "member"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={"text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg " + declBadge.style}>{declBadge.text}</span>
                        {hasDecl && (
                          <svg className={"w-4 h-4 text-slate-400 transition-transform duration-200 " + (isExpanded ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    {/* Expanded declaration detail */}
                    <div className={"overflow-hidden transition-all duration-200 " + (isExpanded ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0")}>
                      {d && (
                        <div className="border-l-2 border-[#D4AF37]/20 ml-1 pl-4 pb-3 pt-2 mt-1 mb-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                            {/* Ruolo */}
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Ruolo nel Deal</p>
                              <p className="text-xs text-slate-700">{roleLabels[d.roleInDeal || ""] || d.roleInDeal || "—"}</p>
                            </div>

                            {/* Review status */}
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Stato Revisione</p>
                              <p className="text-xs text-slate-700">{reviewLabels[d.reviewStatus || ""] || d.reviewStatus || "—"}</p>
                            </div>

                            {/* Mandato */}
                            <div>
                              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Mandato</p>
                              <p className="text-xs text-slate-700">{d.hasMandate ? "Sì" : "No"}</p>
                            </div>

                            {d.hasMandate && (
                              <div>
                                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Controparte</p>
                                <p className="text-xs text-slate-700">{counterpartyLabels[d.mandateCounterparty || ""] || d.mandateCounterparty || "—"}</p>
                              </div>
                            )}

                            {d.hasMandate && (
                              <>
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Tipo Fee</p>
                                  <p className="text-xs text-slate-700">{feeTypeLabels[d.mandateFeeType || ""] || d.mandateFeeType || "—"}</p>
                                </div>
                                {d.mandateFeeValue && (
                                  <div>
                                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Valore Fee</p>
                                    <p className="text-xs text-slate-700">{d.mandateFeeValue}</p>
                                  </div>
                                )}
                              </>
                            )}

                            {/* Chain mandate */}
                            {d.isChainMandate && (
                              <>
                                <div className="col-span-2 mt-1">
                                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Mandato in catena</p>
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Nome Mandante</p>
                                  <p className="text-xs text-slate-700">{d.chainMandanteName || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Azienda</p>
                                  <p className="text-xs text-slate-700">{d.chainMandanteCompany || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Contatto</p>
                                  <p className="text-xs text-slate-700">{d.chainMandanteContact || "—"}</p>
                                </div>
                                <div>
                                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Relazione</p>
                                  <p className="text-xs text-slate-700">{d.chainMandanteRelationship || "—"}</p>
                                </div>
                              </>
                            )}

                            {/* Conflict */}
                            {d.hasConflict && (
                              <div className="col-span-2 mt-1 bg-red-50/50 border border-red-100 rounded-lg p-3">
                                <p className="text-[9px] uppercase tracking-widest text-red-500 font-bold mb-0.5">Conflitto di Interesse</p>
                                <p className="text-xs text-red-700">{d.conflictDetails || "Conflitto segnalato senza dettagli"}</p>
                              </div>
                            )}
                          </div>

                          {/* Declaration date */}
                          {d.declaredAt && (
                            <p className="text-[9px] text-slate-400 mt-3">
                              Dichiarato il {new Date(d.declaredAt).toLocaleDateString("it-IT", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {eligibleForWg.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Aggiungi al gruppo</p>
              <div className="space-y-2">
                {eligibleForWg.map(m => (
                  <button
                    key={m.id}
                    onClick={() => addToWorkgroup(m.id, m.name)}
                    disabled={addingUserId === m.id}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg border border-slate-100 hover:border-[#D4AF37]/30 hover:bg-[#D4AF37]/5 transition-colors disabled:opacity-50"
                  >
                    <span className="text-xs text-slate-700">{m.name}</span>
                    <span className="text-[9px] text-[#D4AF37] font-bold uppercase tracking-wider">{addingUserId === m.id ? "..." : "+ Aggiungi"}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Presentation Requests */}
      {presRequests.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 mt-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Richieste di Presentazione</h2>
            <span className="text-xs text-slate-400">{presRequests.filter(r => r.status === "pending").length} in attesa</span>
          </div>
          <div className="space-y-4">
            {presRequests.map(req => {
              const statusConfig = req.status === "pending"
                ? { label: "In attesa", style: "text-amber-700 bg-amber-50 border-amber-200" }
                : req.status === "approved"
                ? { label: "Approvata", style: "text-emerald-700 bg-emerald-50 border-emerald-200" }
                : { label: "Rifiutata", style: "text-red-700 bg-red-50 border-red-200" };

              return (
                <div key={req.id} className="border border-slate-100 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{req.userName}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <span className={"text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border " + statusConfig.style}>
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Controparte</p>
                      <p className="text-xs text-slate-700">{req.counterpartyName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Società</p>
                      <p className="text-xs text-slate-700">{req.counterpartyCompany}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Ruolo</p>
                      <p className="text-xs text-slate-700">{req.counterpartyRole}</p>
                    </div>
                    {req.notes && (
                      <div>
                        <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-0.5">Note</p>
                        <p className="text-xs text-slate-700">{req.notes}</p>
                      </div>
                    )}
                  </div>
                  {req.status === "pending" && (
                    <div className="flex items-center gap-2 pt-3 border-t border-slate-50">
                      <button
                        onClick={() => handlePresentationAction(req.id, "approved")}
                        disabled={processingPresId === req.id}
                        className="text-[9px] font-bold uppercase tracking-widest text-emerald-700 border border-emerald-200 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        {processingPresId === req.id ? "..." : "Approva"}
                      </button>
                      <button
                        onClick={() => handlePresentationAction(req.id, "rejected")}
                        disabled={processingPresId === req.id}
                        className="text-[9px] font-bold uppercase tracking-widest text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Rifiuta
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ====== DOCUMENTS & CHECKLIST SECTION ====== */}
      <DocumentsChecklistSection deal={deal} adminId={adminId} />

      {/* Fee & Revenue */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 mt-8">
        <div className="flex items-center gap-2 mb-6">
          <CircleDollarSign className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Fee & Revenue</h2>
        </div>
        <FeeTracker
          dealId={deal.id}
          dealTitle={deal.title}
          mandateId={signedMandateId || undefined}
        />
      </div>

      {/* Deal Info */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 mt-8">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Dettagli Deal</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Tipo</p>
            <p className="text-sm font-bold text-slate-900">{deal.deal_type || "—"}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Sotto-settore</p>
            <p className="text-sm font-bold text-slate-900">{deal.sub_sector || "—"}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">EV Range</p>
            <p className="text-sm font-bold text-slate-900">{deal.ev_range || "—"}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Geografia</p>
            <p className="text-sm font-bold text-slate-900">{deal.geography || "—"}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Mandato</p>
            <p className="text-sm font-bold text-slate-900">{deal.mandate_type || "—"}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Area Tematica</p>
            <p className="text-sm font-bold text-slate-900">{deal.thematic_area || "—"}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Side</p>
            <p className="text-sm font-bold text-slate-900">{deal.side || "—"}</p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Riservatezza</p>
            <p className="text-sm font-bold text-slate-900">{deal.confidentiality || "—"}</p>
          </div>
        </div>
        {deal.description && (
          <div className="mt-4 pt-4 border-t border-slate-50">
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Descrizione</p>
            <p className="text-sm text-slate-600 leading-relaxed">{deal.description}</p>
          </div>
        )}
      </div>

      {/* Eventi collegati */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 mt-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Eventi</h2>
          <button
            onClick={() => setShowEventModal(true)}
            className="ml-auto text-[10px] font-bold text-[#D4AF37] hover:text-[#b8962d] uppercase tracking-widest transition-colors"
          >
            + Nuovo
          </button>
        </div>
        <DealEvents dealId={deal.id} refresh={eventsRefresh} />
      </div>

      {/* Activity Timeline */}
      {activityLog.length > 0 && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 mt-8">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="w-4 h-4 text-slate-400" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Attività Recenti</h2>
            <span className="text-xs text-slate-400 ml-auto">{activityLog.length} eventi</span>
          </div>
          <div className="relative">
            <div className="absolute left-[7px] top-2 bottom-2 w-px bg-slate-100" />
            <div className="space-y-4">
              {activityLog.map(entry => (
                <div key={entry.id} className="flex gap-4 relative">
                  <div className="w-[15px] flex-shrink-0 flex justify-center pt-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#D4AF37]/60" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">
                      <span className="font-medium text-slate-900">{entry.userName}</span>
                      {" "}{getActionDescription(entry.action, entry.details)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {new Date(entry.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      <AddTaskModal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSaved={() => {}}
        prefillDealId={deal.id}
        prefillDealTitle={deal.title}
      />

      {/* Event Modal */}
      <EventForm
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        onSaved={() => { setShowEventModal(false); setEventsRefresh(r => r + 1); }}
        prefillDealId={deal.id}
        prefillDealTitle={deal.title}
      />

      {/* Board Editor Drawer */}
      {boardDrawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setBoardDrawerOpen(false)} />
          <div className="fixed top-0 right-0 z-50 w-full sm:w-[420px] h-full bg-white shadow-2xl flex flex-col">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Modifica Bacheca</h3>
              </div>
              <button onClick={() => setBoardDrawerOpen(false)} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Drawer body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Visible toggle */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-900">Visibile in bacheca</p>
                  <p className="text-[10px] text-slate-400">Mostra questo deal nella bacheca pubblica</p>
                </div>
                <button
                  onClick={() => setBoardForm(f => ({ ...f, is_visible_board: !f.is_visible_board }))}
                  className={"w-11 h-6 rounded-full transition-colors relative " + (boardForm.is_visible_board ? "bg-[#D4AF37]" : "bg-slate-200")}
                >
                  <div className={"w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform " + (boardForm.is_visible_board ? "translate-x-[22px]" : "translate-x-0.5")} />
                </button>
              </div>

              {/* Deal type */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">Tipo operazione</label>
                <select
                  value={boardForm.deal_type}
                  onChange={e => setBoardForm(f => ({ ...f, deal_type: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-[#D4AF37] transition-colors"
                >
                  <option value="">— Seleziona —</option>
                  {DEAL_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Estimated EV */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">Stima EV</label>
                <input
                  type="text"
                  value={boardForm.estimated_ev}
                  onChange={e => setBoardForm(f => ({ ...f, estimated_ev: e.target.value }))}
                  placeholder="es. € 12-15M"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              {/* Location */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">Location</label>
                <input
                  type="text"
                  value={boardForm.location}
                  onChange={e => setBoardForm(f => ({ ...f, location: e.target.value }))}
                  placeholder="es. Milano, Lombardia"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              {/* Teaser description */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1 block">Descrizione teaser <span className="text-slate-300">({boardForm.teaser_description.length}/300)</span></label>
                <textarea
                  value={boardForm.teaser_description}
                  onChange={e => { if (e.target.value.length <= 300) setBoardForm(f => ({ ...f, teaser_description: e.target.value })); }}
                  rows={3}
                  placeholder="Breve descrizione per la bacheca..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors resize-none"
                />
              </div>

              {/* Highlights */}
              <div>
                <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2 block">Highlights</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {boardForm.highlights.map((h, i) => (
                    <span key={i} className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                      {h}
                      <button onClick={() => removeHighlight(i)} className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newHighlight}
                    onChange={e => setNewHighlight(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addHighlight())}
                    placeholder="Aggiungi highlight..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
                  />
                  <button
                    onClick={addHighlight}
                    disabled={!newHighlight.trim()}
                    className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setBoardDrawerOpen(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Annulla
              </button>
              <div className="flex items-center gap-3">
                {boardSaved && <span className="text-xs text-emerald-600 font-bold">Salvato!</span>}
                <button
                  onClick={saveBoardFields}
                  disabled={savingBoard}
                  className="bg-[#D4AF37] text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors disabled:opacity-50"
                >
                  {savingBoard ? "Salvataggio..." : "Salva"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
