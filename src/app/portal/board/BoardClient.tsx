"use client";
import { useState } from "react";
import Link from "next/link";
import RequestAccessButton from "./RequestAccessButton";

const sectorColors: Record<string, string> = {
  "Real Estate": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "M&A": "bg-blue-50 text-blue-700 border-blue-200",
  "Healthcare": "bg-rose-50 text-rose-700 border-rose-200",
  "Energy": "bg-amber-50 text-amber-700 border-amber-200",
  "Capital Markets": "bg-purple-50 text-purple-700 border-purple-200",
  "Banking & Credit": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "DEBT": "bg-orange-50 text-orange-700 border-orange-200",
};

function getSectorStyle(sector: string) {
  return sectorColors[sector] || "bg-slate-50 text-slate-600 border-slate-200";
}

export default function BoardClient({ deals, isAdmin, error }: { deals: any[]; isAdmin: boolean; error?: string }) {
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [sideFilter, setSideFilter] = useState("ALL");

  const sectors = ["ALL", ...Array.from(new Set(deals.flatMap(d => (d.sector || "Altro").split(" & ").map((s: string) => s.trim()))))];
  const sides = ["ALL", ...Array.from(new Set(deals.map(d => d.side).filter(Boolean)))];

  const filtered = deals.filter(d => {
    const matchSector = sectorFilter === "ALL" || (d.sector || "").includes(sectorFilter);
    const matchSide = sideFilter === "ALL" || d.side === sideFilter;
    return matchSector && matchSide;
  });

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 pb-8 border-b border-slate-100">
        <div>
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Minerva Partners</p>
          <h1 className="text-3xl font-bold text-slate-900">Opportunita <span className="text-[#D4AF37]">Riservate</span></h1>
          <p className="text-slate-500 text-sm mt-2">{filtered.length} operazioni {sectorFilter !== "ALL" || sideFilter !== "ALL" ? "filtrate" : "disponibili"}</p>
        </div>
        {isAdmin && (
          <Link href="/portal/access-requests" className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] border border-[#D4AF37]/30 px-5 py-2.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors">Richieste Pendenti</Link>
        )}
      </header>

      {/* Filtri */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Settore:</span>
          <div className="flex flex-wrap gap-1.5">
            {sectors.map(s => (
              <button key={s} onClick={() => setSectorFilter(s)} className={"px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all " + (sectorFilter === s ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-slate-500 border-slate-200 hover:border-[#D4AF37]/40")}>
                {s === "ALL" ? "Tutti" : s}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Tipo:</span>
          <div className="flex flex-wrap gap-1.5">
            {sides.map(s => (
              <button key={s} onClick={() => setSideFilter(s)} className={"px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all " + (sideFilter === s ? "bg-[#D4AF37] text-white border-[#D4AF37]" : "bg-white text-slate-500 border-slate-200 hover:border-[#D4AF37]/40")}>
                {s === "ALL" ? "Tutti" : s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((d: any) => (
          <div key={d.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                {(d.sector || "Altro").split(" & ").map((s: string) => (
                  <span key={s} className={"text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border " + getSectorStyle(s.trim())}>
                    {s.trim()}
                  </span>
                ))}
              </div>
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{d.side}</span>
            </div>

            <Link href={"/portal/deals/" + d.id} className="group">
              <h3 className="text-slate-900 text-lg font-bold leading-snug mb-2 group-hover:text-[#D4AF37] transition-colors">{d.title}</h3>
            </Link>

            <p className="text-slate-500 text-sm leading-relaxed mb-4">{d.description || "Dettagli riservati"}</p>

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
              <RequestAccessButton dealId={d.id} isAdmin={isAdmin} />
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-slate-400">Nessuna opportunita con questi filtri.</div>
        )}
      </div>
    </div>
  );
}