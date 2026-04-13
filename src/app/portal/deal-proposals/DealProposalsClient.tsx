"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

interface Proposal {
  id: string;
  title: string;
  sector: string;
  side: string;
  geography: string;
  ev_range: string;
  description: string | null;
  min_ticket: string | null;
  status: string;
  created_at: string;
  created_by: string;
  asset_class: string | null;
  checklist_completeness: number | null;
  rejection_type: string | null;
  parked_until: string | null;
}

type RejectionType = "rejected_not_conforming" | "parked" | "pending_integration";

export default function DealProposalsClient({
  proposals,
  profileMap,
}: {
  proposals: Proposal[];
  profileMap: Record<string, string>;
}) {
  const router = useRouter();
  const [acting, setActing] = useState<string | null>(null);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectionType, setRejectionType] = useState<RejectionType>("rejected_not_conforming");
  const [internalNote, setInternalNote] = useState("");
  const [externalNote, setExternalNote] = useState("");
  const [parkedMonths, setParkedMonths] = useState(3);

  const handleApprove = async (dealId: string) => {
    setActing(dealId);
    const form = new FormData();
    form.append("dealId", dealId);
    await fetch("/portal/deal-proposals/approve", { method: "POST", body: form });
    router.refresh();
    setActing(null);
  };

  const handleReject = async () => {
    if (!rejectModal || !internalNote.trim()) return;
    setActing(rejectModal);

    const form = new FormData();
    form.append("dealId", rejectModal);
    form.append("rejectionType", rejectionType);
    form.append("internalNote", internalNote.trim());
    form.append("externalNote", externalNote.trim());
    if (rejectionType === "parked") form.append("parkedMonths", String(parkedMonths));

    await fetch("/portal/deal-proposals/reject", { method: "POST", body: form });
    setRejectModal(null);
    setInternalNote("");
    setExternalNote("");
    router.refresh();
    setActing(null);
  };

  const pendingReview = proposals.filter(p => p.status === "pending_review");
  const pendingIntegration = proposals.filter(p => p.status === "pending_integration");

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-10 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Amministrazione</p>
        <h1 className="text-3xl font-bold text-slate-900">Proposte <span className="text-[#D4AF37]">Deal</span></h1>
        <p className="text-slate-500 text-sm mt-2">
          {pendingReview.length} in revisione{pendingIntegration.length > 0 ? `, ${pendingIntegration.length} in attesa integrazioni` : ""}
        </p>
      </header>

      {pendingReview.length === 0 && pendingIntegration.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-sm">Nessuna proposta in attesa</div>
      ) : (
        <>
          {/* Pending integration */}
          {pendingIntegration.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-amber-700 mb-4 flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5" /> In Attesa Integrazioni ({pendingIntegration.length})
              </h2>
              <div className="space-y-4">
                {pendingIntegration.map(deal => (
                  <ProposalCard key={deal.id} deal={deal} profileMap={profileMap} acting={acting} onApprove={handleApprove} onReject={dealId => setRejectModal(dealId)} />
                ))}
              </div>
            </div>
          )}

          {/* Pending review */}
          <div className="space-y-4">
            {pendingReview.length > 0 && (
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Da Revisione ({pendingReview.length})</h2>
            )}
            {pendingReview.map(deal => (
              <ProposalCard key={deal.id} deal={deal} profileMap={profileMap} acting={acting} onApprove={handleApprove} onReject={dealId => setRejectModal(dealId)} />
            ))}
          </div>
        </>
      )}

      {/* Rejection modal with 3 levels */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Motivo Rifiuto</h3>
            </div>
            <div className="p-6 space-y-5">
              {/* Rejection type */}
              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block">Tipo di rifiuto *</label>

                <label className={"flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all " + (rejectionType === "rejected_not_conforming" ? "border-red-300 bg-red-50" : "border-slate-200 hover:border-slate-300")}>
                  <input type="radio" name="rejType" value="rejected_not_conforming" checked={rejectionType === "rejected_not_conforming"} onChange={() => setRejectionType("rejected_not_conforming")} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Non conforme ai criteri Minerva</p>
                    <p className="text-xs text-slate-500">Deal archiviato. Non riproponibile senza modifiche sostanziali.</p>
                  </div>
                </label>

                <label className={"flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all " + (rejectionType === "parked" ? "border-orange-300 bg-orange-50" : "border-slate-200 hover:border-slate-300")}>
                  <input type="radio" name="rejType" value="parked" checked={rejectionType === "parked"} onChange={() => setRejectionType("parked")} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Interessante ma non ora</p>
                    <p className="text-xs text-slate-500">Reminder automatico all'originator alla scadenza.</p>
                  </div>
                </label>

                {rejectionType === "parked" && (
                  <div className="ml-6">
                    <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Ripresentabile tra</label>
                    <div className="flex gap-2">
                      {[3, 6, 12].map(m => (
                        <button key={m} type="button" onClick={() => setParkedMonths(m)}
                          className={"px-4 py-2 rounded-lg text-xs font-bold transition-all " + (parkedMonths === m ? "bg-[#D4AF37] text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}>
                          {m} mesi
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <label className={"flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all " + (rejectionType === "pending_integration" ? "border-amber-300 bg-amber-50" : "border-slate-200 hover:border-slate-300")}>
                  <input type="radio" name="rejType" value="pending_integration" checked={rejectionType === "pending_integration"} onChange={() => setRejectionType("pending_integration")} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">Richiesta integrazioni</p>
                    <p className="text-xs text-slate-500">30 giorni per integrare, reminder a 25 giorni.</p>
                  </div>
                </label>
              </div>

              {/* External note (sent to originator) */}
              {rejectionType === "pending_integration" && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Cosa manca (inviato all'originator) *</label>
                  <textarea value={externalNote} onChange={e => setExternalNote(e.target.value)} rows={3} placeholder="Specifica cosa serve per completare la proposta..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37] resize-none" />
                </div>
              )}

              {/* Internal note (admin only) */}
              <div>
                <label className="text-[10px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Note Interne (solo admin) *</label>
                <textarea value={internalNote} onChange={e => setInternalNote(e.target.value)} rows={2} placeholder="Note interne..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:border-slate-300 resize-none" />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => { setRejectModal(null); setInternalNote(""); setExternalNote(""); }} className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50">
                Annulla
              </button>
              <button
                onClick={handleReject}
                disabled={!internalNote.trim() || (rejectionType === "pending_integration" && !externalNote.trim()) || !!acting}
                className="bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Conferma Rifiuto
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ProposalCard({
  deal, profileMap, acting, onApprove, onReject,
}: {
  deal: Proposal;
  profileMap: Record<string, string>;
  acting: string | null;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const completeness = deal.checklist_completeness ?? 0;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{deal.side}</span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border bg-slate-50 text-slate-600 border-slate-200">{deal.sector}</span>
            {deal.asset_class && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-[#D4AF37]/10 text-[#D4AF37]">
                {deal.asset_class.replace(/_/g, " ")}
              </span>
            )}
            {deal.status === "pending_integration" && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                Integrazioni
              </span>
            )}
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">{deal.title}</h3>
          <p className="text-slate-500 text-sm mb-3">{deal.description || "Nessuna descrizione"}</p>

          {/* Completeness */}
          {deal.asset_class && (
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Completezza</span>
                <span className={"text-[10px] font-bold " + (completeness === 100 ? "text-emerald-600" : "text-amber-600")}>{completeness}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className={"h-1.5 rounded-full " + (completeness === 100 ? "bg-emerald-500" : "bg-amber-400")} style={{ width: `${completeness}%` }} />
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-slate-400">
            {deal.geography && <span>📍 {deal.geography}</span>}
            {deal.ev_range && <span>💰 {deal.ev_range}</span>}
            {deal.min_ticket && <span>🎫 Min: {deal.min_ticket}</span>}
          </div>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-slate-400 text-xs">Proposto da:</span>
            <span className="text-slate-900 text-xs font-bold">{profileMap[deal.created_by] || "Sconosciuto"}</span>
            <span className="text-slate-400 text-[10px]">• {new Date(deal.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(deal.id)}
            disabled={acting === deal.id || !!(deal.asset_class && completeness < 100)}
            className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors disabled:opacity-50"
            title={deal.asset_class && completeness < 100 ? "Completezza checklist < 100%" : undefined}
          >
            {acting === deal.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Approva"}
          </button>
          <button
            onClick={() => onReject(deal.id)}
            className="border border-red-200 text-red-500 px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-red-50 transition-colors"
          >
            Rifiuta
          </button>
        </div>
      </div>
    </div>
  );
}
