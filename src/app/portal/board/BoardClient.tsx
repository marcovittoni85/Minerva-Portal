"use client";
import { useState } from "react";
import Link from "next/link";
import DealCard from "./DealCard";

const boardVisibleStages = new Set(["board", "in_review", null, undefined, ""]);

export default function BoardClient({ deals, isAdmin, error }: { deals: any[]; isAdmin: boolean; error?: string }) {
  // Filter out deals that have progressed past board/in_review
  deals = deals.filter(d => boardVisibleStages.has(d.deal_stage) || !d.deal_stage);
  const [sectorFilter, setSectorFilter] = useState("ALL");
  const [dealTypeFilter, setDealTypeFilter] = useState("ALL");
  const [geoFilter, setGeoFilter] = useState("ALL");

  const sectors = ["ALL", ...Array.from(new Set(deals.map(d => d.sector).filter(Boolean))).sort()];
  const dealTypes = ["ALL", ...Array.from(new Set(deals.map(d => d.deal_type).filter(Boolean))).sort()];
  const geos = ["ALL", ...Array.from(new Set(deals.map(d => d.geography).filter(Boolean))).sort()];

  const filtered = deals.filter(d => {
    const matchSector = sectorFilter === "ALL" || d.sector === sectorFilter;
    const matchType = dealTypeFilter === "ALL" || d.deal_type === dealTypeFilter;
    const matchGeo = geoFilter === "ALL" || d.geography === geoFilter;
    return matchSector && matchType && matchGeo;
  });

  const hasFilters = sectorFilter !== "ALL" || dealTypeFilter !== "ALL" || geoFilter !== "ALL";

  const selectClass = "bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#D4AF37] transition-colors cursor-pointer";

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 pb-8 border-b border-slate-100">
        <div>
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Minerva Partners</p>
          <h1 className="text-3xl font-bold text-slate-900">Opportunita <span className="text-[#D4AF37]">Riservate</span></h1>
          <p className="text-slate-500 text-sm mt-2">{filtered.length} operazioni {hasFilters ? "filtrate" : "disponibili"}</p>
        </div>
        <div className="flex gap-2">
          {hasFilters && (
            <button onClick={() => { setSectorFilter("ALL"); setDealTypeFilter("ALL"); setGeoFilter("ALL"); }} className="text-xs text-red-400 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors">Reset</button>
          )}
          {isAdmin && (
            <Link href="/portal/access-requests" className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] border border-[#D4AF37]/30 px-5 py-2.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors">Richieste Pendenti</Link>
          )}
        </div>
      </header>

      {/* Filtri dropdown */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Settore</label>
          <select value={sectorFilter} onChange={e => setSectorFilter(e.target.value)} className={selectClass}>
            {sectors.map(s => <option key={s} value={s}>{s === "ALL" ? "Tutti i settori" : s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Tipo operazione</label>
          <select value={dealTypeFilter} onChange={e => setDealTypeFilter(e.target.value)} className={selectClass}>
            {dealTypes.map(s => <option key={s} value={s}>{s === "ALL" ? "Tutti i tipi" : s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Geografia</label>
          <select value={geoFilter} onChange={e => setGeoFilter(e.target.value)} className={selectClass}>
            {geos.map(s => <option key={s} value={s}>{s === "ALL" ? "Tutte le aree" : s}</option>)}
          </select>
        </div>
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((d: any) => (
          <DealCard key={d.id} deal={d} isAdmin={isAdmin} />
        ))}

        {filtered.length === 0 && (
          <div className="col-span-2 text-center py-16 text-slate-400">Nessuna opportunita con questi filtri.</div>
        )}
      </div>
    </div>
  );
}
