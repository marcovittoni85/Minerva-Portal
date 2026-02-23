"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import RequestAccessButton from "./RequestAccessButton";
import { Building2, Heart, Settings, Zap, Landmark, Beaker, Trophy, Monitor, Briefcase } from "lucide-react";

function getSideStyle(side: string) {
  const s = side.toUpperCase();
  if (s.includes("SELL")) return "bg-[#001220] text-[#D4AF37]";
  if (s.includes("BUY")) return "bg-[#D4AF37] text-white";
  return "bg-slate-100 text-slate-700";
}

const sectorIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Real estate & hospitality": Building2,
  "Healthcare": Heart,
  "Macchinari industriali": Settings,
  "Utility e rinnovabili": Zap,
  "Servizi finanziari": Landmark,
  "Chimica": Beaker,
  "Sports goods": Trophy,
  "Tecnologia": Monitor,
};

function SectorIcon({ sector }: { sector: string }) {
  const Icon = sectorIcons[sector] || Briefcase;
  return <Icon className="w-5 h-5 text-slate-200" />;
}

type AccessStatus = "loading" | "none" | "pending" | "approved" | "rejected";

export default function DealCard({ deal: d, isAdmin }: { deal: any; isAdmin: boolean }) {
  const supabase = createClient();
  const [status, setStatus] = useState<AccessStatus>("loading");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (isAdmin) { setStatus("approved"); return; }
    async function checkStatus() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: access } = await supabase.from("deal_access").select("*").eq("deal_id", d.id).eq("user_id", user.id).maybeSingle();
      if (access) { setStatus("approved"); return; }
      const { data: request } = await supabase.from("deal_access_requests").select("status").eq("deal_id", d.id).eq("user_id", user.id).maybeSingle();
      if (request) { setStatus(request.status === "ACCESS_APPROVED" ? "approved" : request.status as any); } else { setStatus("none"); }
    }
    checkStatus();
  }, [d.id, supabase, isAdmin]);

  const hasAccess = status === "approved" || isAdmin;

  return (
    <div className="relative bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/40 transition-all">
      {/* Sector icon watermark */}
      <div className="absolute top-5 right-5">
        <SectorIcon sector={d.sector} />
      </div>

      {/* Top: Side badge + Code · Deal type */}
      <div className="flex flex-wrap items-center gap-2 mb-1">
        {d.side && (
          <span className={"text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg " + getSideStyle(d.side)}>
            {d.side}
          </span>
        )}
        <span className="text-[10px] text-slate-400 tracking-wider">
          {d.code}{d.deal_type ? ` · ${d.deal_type}` : ""}
        </span>
      </div>

      {/* Title — conditional behavior */}
      {hasAccess ? (
        <Link href={"/portal/deals/" + d.id} className="group">
          <h3 className="text-slate-900 text-lg font-bold leading-snug mb-1 group-hover:text-[#D4AF37] transition-colors">{d.title}</h3>
        </Link>
      ) : (
        <button onClick={() => setExpanded(prev => !prev)} className="text-left w-full group">
          <h3 className="text-slate-900 text-lg font-bold leading-snug mb-1 group-hover:text-[#D4AF37] transition-colors flex items-center gap-2">
            {d.title}
            <svg className={"w-4 h-4 text-slate-400 transition-transform " + (expanded ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </h3>
        </button>
      )}

      {/* Sector · Sub-sector as plain text */}
      <p className="text-xs text-slate-400 mb-3">
        {d.sector || "Altro"}{d.sub_sector ? ` · ${d.sub_sector}` : ""}
      </p>

      {/* Description */}
      <p className="text-slate-500 text-sm leading-relaxed mb-4">{d.description || "Dettagli riservati"}</p>

      {/* Expanded preview */}
      <div className={"overflow-hidden transition-all duration-300 ease-in-out " + (expanded ? "max-h-[500px] opacity-100 mb-4" : "max-h-0 opacity-0")}>
        <div className="pt-4 border-t border-slate-100">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
            {d.deal_type && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Tipo Operazione</p>
                <p className="text-slate-900 text-sm font-bold">{d.deal_type}</p>
              </div>
            )}
            {d.thematic_area && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Area Tematica</p>
                <p className="text-slate-900 text-sm font-bold">{d.thematic_area}</p>
              </div>
            )}
            {d.mandate_type && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Tipo Mandato</p>
                <p className="text-slate-900 text-sm font-bold">{d.mandate_type}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Settore</p>
              <p className="text-slate-900 text-sm font-bold">{d.sector || "—"}</p>
            </div>
            {d.sub_sector && (
              <div>
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Sotto-settore</p>
                <p className="text-slate-900 text-sm font-bold">{d.sub_sector}</p>
              </div>
            )}
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">EV Range</p>
              <p className="text-slate-900 text-sm font-bold">{d.ev_range || "Riservato"}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Area Geografica</p>
              <p className="text-slate-900 text-sm font-bold">{d.geography || "Italia"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <RequestAccessButton dealId={d.id} isAdmin={isAdmin} externalStatus={status} />
            <button onClick={() => setExpanded(false)} className="text-[9px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">Chiudi</button>
          </div>
        </div>
      </div>

      {/* Bottom: Meta + Action (collapsed view) */}
      {!expanded && (
        <div className="flex items-end justify-between pt-4 border-t border-slate-50">
          <div className="flex gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">EV Range</p>
              <p className="text-slate-900 text-sm font-bold">{d.ev_range || "Riservato"}</p>
            </div>
            <div>
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Area</p>
              <p className="text-slate-900 text-sm font-bold">{d.geography || "Italia"}</p>
            </div>
          </div>
          <RequestAccessButton dealId={d.id} isAdmin={isAdmin} externalStatus={status} />
        </div>
      )}
    </div>
  );
}
