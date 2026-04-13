"use client";
import Link from "next/link";
import { ArrowLeft, TrendingUp, FileText, MapPin, Clock, Lock, Briefcase, XCircle, Eye } from "lucide-react";

function getMacroCategory(sector: string) {
  if (sector === "Real estate & hospitality") return "REAL ESTATE";
  if (sector === "Utility e rinnovabili" || sector === "Petrolio e gas") return "ENERGY";
  if (sector === "Servizi finanziari") return "FINANCE";
  return "CORPORATE M&A";
}

function getSideBorderColor(side: string) {
  const s = side?.toUpperCase() || "";
  if (s.includes("SELL")) return "border-l-[#D4AF37]";
  if (s.includes("BUY")) return "border-l-[#001220]";
  return "border-l-slate-200";
}

function getSideLabelColor(side: string) {
  const s = side?.toUpperCase() || "";
  if (s.includes("SELL")) return "text-[#D4AF37]";
  if (s.includes("BUY")) return "text-[#001220]";
  return "text-slate-400";
}

export default function DealPreview({
  deal,
  interestStatus = "none",
  declineMessage,
}: {
  deal: {
    id: string;
    code: string;
    title: string;
    sector: string;
    sub_sector: string;
    deal_type: string;
    side: string;
    ev_range: string;
    geography: string;
    thematic_area: string;
    blind_description?: string | null;
    teaser_description?: string | null;
    asset_class?: string | null;
    board_status?: string | null;
  };
  interestStatus?: "none" | "l1_pending" | "l1_declined";
  declineMessage?: string;
}) {
  const macro = deal.sector ? getMacroCategory(deal.sector) : null;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/portal/board" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna alla Bacheca
      </Link>

      {/* Header card */}
      <div className={"bg-white border border-slate-100 border-l-[5px] rounded-2xl p-8 shadow-sm mb-6 " + getSideBorderColor(deal.side)}>
        {/* Top row: side + code on left, macro category on right */}
        <div className="flex items-start justify-between mb-4">
          <div>
            {deal.side && (
              <p className={"text-[9px] font-bold uppercase tracking-[0.3em] mb-1 " + getSideLabelColor(deal.side)}>{deal.side}</p>
            )}
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">{deal.code}</p>
          </div>
          {macro && (
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg">{macro}</span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3">{deal.title}</h1>

        {/* Blind description */}
        {(deal.blind_description || deal.teaser_description) && (
          <p className="text-slate-500 text-sm leading-relaxed mb-6">{deal.blind_description || deal.teaser_description}</p>
        )}

        {/* Asset class badge */}
        {deal.asset_class && (
          <span className="inline-block text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-lg mb-4">
            {deal.asset_class.replace(/_/g, " ")}
          </span>
        )}

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Settore</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.sector || "N/A"}</p>
            {deal.sub_sector && <p className="text-xs text-slate-500 mt-0.5">{deal.sub_sector}</p>}
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Tipo Operazione</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.deal_type || "N/A"}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">EV Range</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.ev_range || "N/A"}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Geografia</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.geography || "N/A"}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Area Tematica</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.thematic_area || "N/A"}</p>
          </div>
          {deal.side && (
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Side</p>
              <p className={"text-sm font-bold " + getSideLabelColor(deal.side)}>{deal.side}</p>
            </div>
          )}
        </div>
      </div>

      {/* Blurred restricted section */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="px-8 pt-6 pb-2">
          <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold flex items-center gap-2">
            <Lock className="w-3 h-3" /> Dettagli riservati
          </p>
        </div>
        <div className="relative px-8 pb-8">
          {/* Blurred fake content */}
          <div className="select-none pointer-events-none blur-[6px] opacity-40">
            <div className="mb-6">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Descrizione</p>
              <div className="space-y-2">
                <div className="h-4 bg-slate-200 rounded w-full" />
                <div className="h-4 bg-slate-200 rounded w-11/12" />
                <div className="h-4 bg-slate-200 rounded w-9/12" />
                <div className="h-4 bg-slate-200 rounded w-10/12" />
              </div>
            </div>
            <div className="mb-6">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Documenti</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-12 bg-slate-100 rounded-lg border border-slate-200" />
                <div className="h-12 bg-slate-100 rounded-lg border border-slate-200" />
                <div className="h-12 bg-slate-100 rounded-lg border border-slate-200" />
              </div>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Discussione</p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-slate-200 rounded w-24" />
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 bg-slate-200 rounded w-20" />
                    <div className="h-4 bg-slate-100 rounded w-2/3" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/60 to-white" />
        </div>
      </div>

      {/* L1 Interest CTA */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center">
        {interestStatus === "l1_declined" && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-red-600">Autorizzazione Livello 1 Negata</span>
            </div>
            {declineMessage && (
              <p className="text-sm text-red-700 mt-2">{declineMessage}</p>
            )}
          </div>
        )}

        {interestStatus === "l1_pending" && (
          <>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Richiesta in Attesa</h2>
            <p className="text-sm text-slate-500 mb-2">
              La tua richiesta di interesse è in fase di valutazione dall&apos;originator.
            </p>
            <p className="text-xs text-slate-400">Riceverai una notifica con l&apos;esito.</p>
          </>
        )}

        {interestStatus === "none" && (
          <>
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Eye className="w-5 h-5 text-[#D4AF37]" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-2">Richiedi Approfondimento</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
              Per visualizzare i dati completi dell&apos;operazione, richiedi l&apos;autorizzazione Livello 1. La tua identità resterà anonima per l&apos;originator.
            </p>
            {deal.board_status === "in_negotiation" && (
              <p className="text-xs text-amber-600 font-bold mb-4">
                Questo deal è in fase di trattativa. Puoi comunque segnalare il tuo interesse.
              </p>
            )}
            <Link
              href={`/portal/deals/${deal.id}/l1-request`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[#F5A623] to-[#E09000] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md shadow-[#F5A623]/30 hover:shadow-lg hover:shadow-[#F5A623]/40 transition-all"
            >
              <Eye className="w-4 h-4" /> Richiedi Approfondimento
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
