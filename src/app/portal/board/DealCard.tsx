"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import RequestAccessButton from "./RequestAccessButton";
import { Hotel, Stethoscope, Factory, Wind, Banknote, FlaskConical, Bike, Cpu, BriefcaseBusiness, HardHat, Truck, Wheat, GraduationCap, Film, Plane, CircleDot } from "lucide-react";

const sectorIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Real estate & hospitality": Hotel,
  "Healthcare": Stethoscope,
  "Macchinari industriali": Factory,
  "Utility e rinnovabili": Wind,
  "Servizi finanziari": Banknote,
  "Chimica": FlaskConical,
  "Sports goods": Bike,
  "Tecnologia": Cpu,
  "Business services": BriefcaseBusiness,
  "Infrastrutture e costruzioni": HardHat,
  "Trasporti e logistica": Truck,
  "Agribusiness": Wheat,
  "Education": GraduationCap,
  "Media & entertainment": Film,
  "Aerospace e difesa": Plane,
};

function SectorIcon({ sector }: { sector: string }) {
  const Icon = sectorIcons[sector] || CircleDot;
  return <Icon className="w-6 h-6 text-slate-300" />;
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

  const metaLine = [d.sector, d.sub_sector, d.deal_type].filter(Boolean).join(" · ");

  return (
    <div className={"relative bg-white border border-slate-100 border-l-[5px] rounded-2xl p-6 hover:shadow-lg hover:border-slate-100 hover:border-l-[5px] transition-all " + getSideBorderColor(d.side)}>
      {/* Sector icon watermark — top right */}
      <div className="absolute top-5 right-5">
        <SectorIcon sector={d.sector} />
      </div>

      {/* Side label */}
      {d.side && (
        <p className={"text-[9px] font-bold uppercase tracking-[0.3em] mb-1 " + getSideLabelColor(d.side)}>{d.side}</p>
      )}

      {/* Deal code */}
      <p className="text-[10px] text-slate-400 tracking-wider mb-3">{d.code}</p>

      {/* Title — conditional behavior */}
      {hasAccess ? (
        <Link href={"/portal/deals/" + d.id} className="group">
          <h3 className="text-slate-900 text-lg font-bold leading-snug mb-1 group-hover:text-[#D4AF37] transition-colors">{d.title}</h3>
        </Link>
      ) : (
        <button onClick={() => setExpanded(prev => !prev)} className="text-left w-full group">
          <h3 className="text-slate-900 text-lg font-bold leading-snug mb-1 group-hover:text-[#D4AF37] transition-colors flex items-center gap-2">
            {d.title}
            <svg className={"w-3.5 h-3.5 text-slate-300 transition-transform flex-shrink-0 " + (expanded ? "rotate-180" : "")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
          </h3>
        </button>
      )}

      {/* Sector · Sub-sector · Deal type */}
      {metaLine && <p className="text-xs text-slate-400 mb-3">{metaLine}</p>}

      {/* Description */}
      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">{d.description || "Dettagli riservati"}</p>

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
