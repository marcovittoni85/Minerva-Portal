"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import RequestAccessButton from "./RequestAccessButton";

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

type AccessStatus = "loading" | "none" | "pending" | "approved" | "rejected";

export default function DealCard({ deal: d, isAdmin }: { deal: any; isAdmin: boolean }) {
  const supabase = createClient();
  const [status, setStatus] = useState<AccessStatus>("loading");

  useEffect(() => {
    if (isAdmin) { setStatus("approved"); return; }
    async function checkStatus() {
      const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
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
  const macro = d.sector ? getMacroCategory(d.sector) : null;

  return (
    <div className={"bg-white border border-slate-100 border-l-[5px] rounded-2xl p-6 hover:shadow-lg hover:border-slate-100 hover:border-l-[5px] transition-all " + getSideBorderColor(d.side)}>
      {/* Top row: side + code on left, macro category on right */}
      <div className="flex items-start justify-between mb-3">
        <div>
          {d.side && (
            <p className={"text-[9px] font-bold uppercase tracking-[0.3em] mb-1 " + getSideLabelColor(d.side)}>{d.side}</p>
          )}
          <p className="text-[10px] text-slate-400 uppercase tracking-widest">{d.code}</p>
        </div>
        {macro && (
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1.5 rounded-lg">{macro}</span>
        )}
      </div>

      {/* Title — always links to deal page (preview for non-approved) */}
      <Link href={"/portal/deals/" + d.id} className="group">
        <h3 className="text-slate-900 text-lg font-bold leading-snug mb-1 group-hover:text-[#D4AF37] transition-colors">{d.title}</h3>
      </Link>

      {/* Sector · Sub-sector · Deal type */}
      {metaLine && <p className="text-xs text-slate-500 mb-3">{metaLine}</p>}

      {/* Description */}
      <p className="text-slate-500 text-sm leading-relaxed line-clamp-2 mb-4">{d.description || "Dettagli riservati"}</p>

      {/* Bottom: Meta + Action */}
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
    </div>
  );
}
