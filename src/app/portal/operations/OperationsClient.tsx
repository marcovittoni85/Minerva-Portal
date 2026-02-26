"use client";

import Link from "next/link";
import {
  Briefcase,
  CheckCircle,
  AlertTriangle,
  Users,
  Clock,
  FileText,
  MessageSquare,
  FolderOpen,
} from "lucide-react";

interface DealOp {
  id: string;
  code: string;
  title: string;
  sector: string;
  side: string | null;
  deal_stage: string;
  description: string | null;
  myRole: string;
  declared: boolean;
  team: string[];
  lastActivity: { action: string; created_at: string } | null;
}

function getMacroCategory(sector: string) {
  if (sector === "Real estate & hospitality") return "REAL ESTATE";
  if (sector === "Utility e rinnovabili" || sector === "Petrolio e gas") return "ENERGY";
  if (sector === "Servizi finanziari") return "FINANCE";
  return "CORPORATE M&A";
}

function getSideBorderColor(side: string | null) {
  const s = (side || "").toUpperCase();
  if (s.includes("SELL")) return "border-l-[#D4AF37]";
  if (s.includes("BUY")) return "border-l-[#001220]";
  return "border-l-slate-200";
}

const stageConfig: Record<string, { label: string; color: string }> = {
  workgroup: { label: "Workgroup", color: "text-amber-700 bg-amber-50 border-amber-200" },
  in_progress: { label: "In Progress", color: "text-blue-700 bg-blue-50 border-blue-200" },
  closing: { label: "Closing", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
};

const roleLabels: Record<string, string> = {
  member: "Membro",
  facilitatore: "Facilitatore",
  buyer_rep: "Buyer Rep",
  seller_rep: "Seller Rep",
  supporto_tecnico: "Supporto Tecnico",
  originator: "Originator",
};

const actionLabels: Record<string, string> = {
  deal_viewed: "Deal visualizzato",
  access_requested: "Accesso richiesto",
  access_approved: "Accesso approvato",
  workgroup_added: "Aggiunto al workgroup",
  stage_changed: "Stage aggiornato",
  declaration_submitted: "Dichiarazione inviata",
  comment_added: "Commento aggiunto",
  document_uploaded: "Documento caricato",
  presentation_requested: "Presentazione richiesta",
  presentation_approved: "Presentazione approvata",
  presentation_rejected: "Presentazione rifiutata",
  nda_uploaded: "NDA firmato caricato",
};

function formatTimeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  return `${days}g fa`;
}

export default function OperationsClient({
  deals,
  userId,
}: {
  deals: DealOp[];
  userId: string;
}) {
  if (deals.length === 0) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <header className="mb-10 pb-8 border-b border-slate-100">
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">
            Minerva Partners
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Operazioni in Corso</h1>
          <p className="text-slate-500 text-sm mt-2">I deal in cui sei attivamente coinvolto</p>
        </header>
        <div className="text-center py-20">
          <Briefcase className="w-10 h-10 text-slate-200 mx-auto mb-3" />
          <p className="text-sm text-slate-400">Nessuna operazione attiva al momento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <header className="mb-10 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">
          Minerva Partners
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Operazioni in Corso</h1>
        <p className="text-slate-500 text-sm mt-2">I deal in cui sei attivamente coinvolto</p>
      </header>

      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-5">
        {deals.length} operazion{deals.length === 1 ? "e" : "i"} attiv{deals.length === 1 ? "a" : "e"}
      </p>

      <div className="space-y-5">
        {deals.map((deal) => {
          const macro = getMacroCategory(deal.sector);
          const stage = stageConfig[deal.deal_stage] || stageConfig.workgroup;

          return (
            <div
              key={deal.id}
              className={`bg-white border border-slate-100 border-l-[5px] rounded-2xl p-6 hover:shadow-lg transition-all ${getSideBorderColor(deal.side)}`}
            >
              {/* Top row: code + stage on left, macro on right */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest">
                    {deal.code}
                  </span>
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border ${stage.color}`}
                  >
                    {stage.label}
                  </span>
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg">
                  {macro}
                </span>
              </div>

              {/* Title + sector */}
              <h3 className="text-lg font-bold text-slate-900 mb-1">{deal.title}</h3>
              <p className="text-xs text-slate-500 mb-4">{deal.sector}</p>

              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {/* My Role */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                    Il tuo ruolo
                  </p>
                  <p className="text-sm font-medium text-slate-700">
                    {roleLabels[deal.myRole] || deal.myRole}
                  </p>
                </div>

                {/* Declaration status */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                    Dichiarazione
                  </p>
                  {deal.declared ? (
                    <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Completata
                    </span>
                  ) : (
                    <Link
                      href={`/portal/declaration/${deal.id}`}
                      className="inline-flex items-center gap-1.5 text-sm text-[#D4AF37] font-medium hover:text-[#b8962d] transition-colors"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Da compilare
                    </Link>
                  )}
                </div>

                {/* Team */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                    Team
                  </p>
                  {deal.team.length > 0 ? (
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-sm text-slate-700 truncate">
                        {deal.team.length <= 2
                          ? deal.team.join(", ")
                          : `${deal.team.slice(0, 2).join(", ")} +${deal.team.length - 2}`}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Solo tu</p>
                  )}
                </div>

                {/* Last activity */}
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">
                    Ultima attività
                  </p>
                  {deal.lastActivity ? (
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <p className="text-xs text-slate-600 truncate">
                        {actionLabels[deal.lastActivity.action] || deal.lastActivity.action}{" "}
                        <span className="text-slate-400">
                          · {formatTimeAgo(deal.lastActivity.created_at)}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">—</p>
                  )}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
                <Link
                  href={`/portal/deals/${deal.id}`}
                  className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#b8962d] transition-colors"
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  Apri Dossier
                </Link>
                <Link
                  href={`/portal/deals/${deal.id}`}
                  className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Chat
                </Link>
                {!deal.declared && (
                  <Link
                    href={`/portal/declaration/${deal.id}`}
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-600 hover:text-amber-700 transition-colors ml-auto"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Compila Dichiarazione
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
