"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Clock } from "lucide-react";

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
  return actionLabels[action] || action;
}

export default function DealManageClient({
  deal,
  originatorName,
  accessMembers,
  workgroupMembers,
  adminId,
  activityLog = [],
}: {
  deal: any;
  originatorName: string;
  accessMembers: Member[];
  workgroupMembers: Member[];
  adminId: string;
  activityLog?: ActivityEntry[];
}) {
  const supabase = createClient();
  const router = useRouter();
  const [currentStage, setCurrentStage] = useState(deal.deal_stage || "board");
  const [loading, setLoading] = useState(false);
  const [wgMembers, setWgMembers] = useState<Member[]>(workgroupMembers);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [expandedMemberId, setExpandedMemberId] = useState<string | null>(null);

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

  const wgUserIds = new Set(wgMembers.map(m => m.id));
  const eligibleForWg = accessMembers.filter(m => !wgUserIds.has(m.id));

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link href="/portal/deal-manage" className="text-[10px] uppercase tracking-widest text-slate-400 hover:text-[#D4AF37] transition-colors mb-4 inline-block">&larr; Tutti i Deal</Link>
        <div className="flex items-start justify-between">
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
          <p className="text-xs text-slate-400">Originator: <span className="text-slate-600 font-medium">{originatorName}</span></p>
        </div>
      </div>

      {/* Stage Pipeline */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-8">
        <h2 className="text-sm font-bold text-slate-900 mb-6 uppercase tracking-widest">Pipeline</h2>
        <div className="flex items-center gap-1 mb-6">
          {stages.map((stage, i) => {
            const isActive = i === currentIndex;
            const isPast = i < currentIndex;
            const isClosed = stage === "closed_won" || stage === "closed_lost";
            return (
              <div key={stage} className="flex-1 flex flex-col items-center">
                <div className={"w-full h-2 rounded-full transition-all " +
                  (isActive ? "bg-[#D4AF37]" : isPast ? "bg-[#D4AF37]/30" : "bg-slate-100")
                } />
                <p className={"mt-2 text-[9px] uppercase tracking-widest font-bold " +
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
                          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
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
    </div>
  );
}
