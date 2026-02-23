"use client";
import Link from "next/link";
import { ArrowLeft, TrendingUp, FileText, MapPin, Clock, Lock } from "lucide-react";
import RequestAccessButton from "../../board/RequestAccessButton";

export default function DealPreview({
  deal,
  accessStatus,
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
  };
  accessStatus: "none" | "pending" | "rejected";
}) {
  const sectorColors: Record<string, string> = {
    "Real estate & hospitality": "bg-emerald-50 text-emerald-700",
    "Healthcare": "bg-rose-50 text-rose-700",
    "Macchinari industriali": "bg-blue-50 text-blue-700",
    "Utility e rinnovabili": "bg-amber-50 text-amber-700",
    "Servizi finanziari": "bg-purple-50 text-purple-700",
    "Chimica": "bg-cyan-50 text-cyan-700",
    "Sports goods": "bg-orange-50 text-orange-700",
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <Link href="/portal/board" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna alla Bacheca
      </Link>

      {/* Header card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{deal.code}</span>
          <span className={"text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded " + (sectorColors[deal.sector] || "bg-slate-50 text-slate-600")}>{deal.sector}</span>
          {deal.sub_sector && <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{deal.sub_sector}</span>}
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-6">{deal.title}</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">EV Range</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.ev_range || "N/A"}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-3 h-3 text-slate-400" />
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Tipo</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.deal_type || deal.side || "N/A"}</p>
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
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Thematic</p>
            </div>
            <p className="text-sm font-bold text-slate-900">{deal.thematic_area || "N/A"}</p>
          </div>
        </div>

        {deal.side && (
          <div className="mt-4">
            <div className="bg-slate-50 rounded-xl p-4 inline-block">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Side</p>
              <p className="text-sm font-bold text-slate-900">{deal.side}</p>
            </div>
          </div>
        )}
      </div>

      {/* Access required banner */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="w-5 h-5 text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Accesso Richiesto</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-md mx-auto">
          Per visualizzare la descrizione completa, i documenti e partecipare alla discussione è necessario richiedere l&apos;accesso a questa operazione.
        </p>
        <div className="flex justify-center">
          <RequestAccessButton dealId={deal.id} externalStatus={accessStatus} />
        </div>
      </div>
    </div>
  );
}
