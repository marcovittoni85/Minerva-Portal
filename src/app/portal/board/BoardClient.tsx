"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, Eye, Clock, XCircle, FolderOpen, ChevronRight, MapPin, User } from "lucide-react";
import { getCategoryConfig, getTypeBadgeConfig, getStageBadgeConfig, getBoardStatusConfig, CATEGORY_OPTIONS } from "@/lib/deal-config";
import { useAccessStatus } from "./useAccessStatus";

const boardVisibleStages = new Set(["board", "in_review", null, undefined, ""]);

/* ─── Action Button ──────────────────────────────────────────────── */

function ActionButton({ dealId, isAdmin, className = "" }: { dealId: string; isAdmin: boolean; className?: string }) {
  const status = useAccessStatus(dealId, isAdmin);

  if (status === "loading") return <div className={"h-9 w-24 bg-slate-100 animate-pulse rounded-lg " + className} />;

  if (isAdmin) {
    return (
      <Link href={`/portal/deal-manage/${dealId}`}
        className={"inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-[#001220] text-white hover:bg-[#001220]/90 transition-colors " + className}>
        <ChevronRight className="w-3.5 h-3.5" /> Gestisci
      </Link>
    );
  }
  if (status === "approved") {
    return (
      <Link href={`/portal/deals/${dealId}`}
        className={"inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-[#001220] text-white hover:bg-[#001220]/90 transition-colors " + className}>
        <FolderOpen className="w-3.5 h-3.5" /> Apri Dossier
      </Link>
    );
  }
  if (status === "pending") {
    return (
      <span className={"inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600 " + className}>
        <Clock className="w-3.5 h-3.5" /> In Attesa
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className={"inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-600 " + className}>
        <XCircle className="w-3.5 h-3.5" /> Rifiutato
      </span>
    );
  }
  return (
    <Link href={`/portal/deals/${dealId}/l1-request`}
      className={"inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-[#F5A623] to-[#E09000] text-white shadow-md shadow-[#F5A623]/30 hover:shadow-lg hover:shadow-[#F5A623]/40 transition-all " + className}>
      <Eye className="w-3.5 h-3.5" /> Approfondisci
    </Link>
  );
}

/* ─── Main Component ─────────────────────────────────────────────── */

export default function BoardClient({
  deals,
  isAdmin,
  originatorMap = {},
  error,
}: {
  deals: any[];
  isAdmin: boolean;
  originatorMap?: Record<string, string>;
  error?: string;
}) {
  deals = deals.filter(d => boardVisibleStages.has(d.deal_stage) || !d.deal_stage);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Count deals per category for pill badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const d of deals) {
      const label = getCategoryConfig(d.sector).label;
      counts[label] = (counts[label] || 0) + 1;
    }
    return counts;
  }, [deals]);

  const processed = useMemo(() => {
    let list = deals;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        d.title?.toLowerCase().includes(q) ||
        d.code?.toLowerCase().includes(q)
      );
    }

    if (categoryFilter !== "ALL") {
      list = list.filter(d => getCategoryConfig(d.sector).label === categoryFilter);
    }

    // Sort: category → type → title
    list = [...list].sort((a, b) => {
      const catA = getCategoryConfig(a.sector).label;
      const catB = getCategoryConfig(b.sector).label;
      if (catA !== catB) return catA.localeCompare(catB);
      const typeA = getTypeBadgeConfig(a.deal_type, a.side).label;
      const typeB = getTypeBadgeConfig(b.deal_type, b.side).label;
      if (typeA !== typeB) return typeA.localeCompare(typeB);
      return (a.title || "").localeCompare(b.title || "");
    });

    return list;
  }, [deals, searchQuery, categoryFilter]);

  const hasFilters = searchQuery.trim() !== "" || categoryFilter !== "ALL";

  return (
    <div className="p-4 md:p-8 max-w-[900px] mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opportunità <span className="text-[#D4AF37]">Riservate</span></h1>
          <p className="text-slate-400 text-sm mt-1">{processed.length} operazioni {hasFilters ? "filtrate" : "disponibili"}</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cerca titolo o codice..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>
          {isAdmin && (
            <Link href="/portal/access-requests"
              className="hidden md:inline-flex text-[10px] uppercase tracking-[0.15em] font-bold text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors whitespace-nowrap">
              Richieste Pendenti
            </Link>
          )}
        </div>
      </header>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setCategoryFilter("ALL")}
          className={"flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all " +
            (categoryFilter === "ALL"
              ? "bg-[#001220] text-white shadow-sm"
              : "bg-white text-slate-500 shadow-sm border border-slate-200 hover:border-slate-300")}
        >
          Tutte <span className="text-[9px] opacity-70">{deals.length}</span>
        </button>
        {CATEGORY_OPTIONS.map(opt => {
          const Icon = opt.icon;
          const count = categoryCounts[opt.label] || 0;
          if (count === 0) return null;
          const active = categoryFilter === opt.label;
          return (
            <button
              key={opt.label}
              onClick={() => setCategoryFilter(active ? "ALL" : opt.label)}
              className={"flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all " +
                (active
                  ? `${opt.bg} ${opt.color} ring-2 ${opt.activeRing} shadow-sm`
                  : "bg-white text-slate-500 shadow-sm border border-slate-200 hover:border-slate-300")}
            >
              <Icon className="w-3.5 h-3.5" />
              {opt.label}
              <span className="text-[9px] opacity-70">{count}</span>
            </button>
          );
        })}
      </div>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm">{error}</div>}

      {/* Deal Cards */}
      <div className="space-y-4">
        {processed.map(d => (
          <TeaserCard key={d.id} deal={d} isAdmin={isAdmin} originatorMap={originatorMap} />
        ))}
        {processed.length === 0 && (
          <div className="text-center py-20 text-slate-400">Nessuna opportunità con questi filtri.</div>
        )}
      </div>
    </div>
  );
}

/* ─── Teaser Card ────────────────────────────────────────────────── */

function TeaserCard({ deal: d, isAdmin, originatorMap }: { deal: any; isAdmin: boolean; originatorMap: Record<string, string> }) {
  const cat = getCategoryConfig(d.sector);
  const typeBadge = getTypeBadgeConfig(d.deal_type, d.side);
  const stage = getStageBadgeConfig(d.deal_stage);
  const CatIcon = cat.icon;
  const TypeIcon = typeBadge.icon;

  const highlights: string[] = Array.isArray(d.highlights) ? d.highlights : [];
  const ev = d.estimated_ev || d.ev_range || null;
  const location = d.location || d.geography || null;
  const teaser = d.teaser_description || d.description || null;

  return (
    <div
      className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-lg transition-all duration-200 flex"
    >
      {/* Left color bar */}
      <div className="w-[5px] flex-shrink-0 rounded-l-2xl" style={{ backgroundColor: cat.borderColor }} />

      {/* Content */}
      <div className="flex-1 min-w-0 py-5 px-5 md:px-7">
        {/* Row 1: Badges left, EV right */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${cat.bg} ${cat.color}`}>
              <CatIcon className="w-3.5 h-3.5" /> {cat.label}
            </span>
            {/* Type badge */}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${typeBadge.bg} ${typeBadge.color}`}>
              <TypeIcon className="w-3 h-3" /> {typeBadge.label}
            </span>
            {/* Board status badge */}
            {d.board_status && d.board_status !== "active" && (() => {
              const bs = getBoardStatusConfig(d.board_status);
              return (
                <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${bs.classes}`}>
                  {bs.label}
                </span>
              );
            })()}
            {/* Stage badge (admin only) */}
            {isAdmin && (
              <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${stage.classes}`}>
                {stage.label}
              </span>
            )}
          </div>
          {/* EV — desktop */}
          {ev && (
            <div className="hidden md:block text-right flex-shrink-0">
              <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Stima EV</p>
              <p className="text-xl font-extrabold text-[#001220] tabular-nums leading-tight">{ev}</p>
            </div>
          )}
        </div>

        {/* Row 2: Title */}
        <h3 className="text-lg font-bold text-[#001220] leading-snug mb-1">{d.title}</h3>

        {/* EV — mobile (below title) */}
        {ev && (
          <p className="md:hidden text-base font-extrabold text-[#001220] tabular-nums mb-2">{ev}</p>
        )}

        {/* Row 3: Teaser description */}
        {teaser && (
          <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-3">{teaser}</p>
        )}

        {/* Row 4: Bottom bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Highlights pills */}
            {highlights.map((h, i) => (
              <span key={i} className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-md">{h}</span>
            ))}
            {/* Location */}
            {location && (
              <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                <MapPin className="w-3 h-3" /> {location}
              </span>
            )}
            {/* Admin: originator + code + date */}
            {isAdmin && (
              <>
                {originatorMap[d.originator_id] && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                    <User className="w-3 h-3" /> {originatorMap[d.originator_id]}
                  </span>
                )}
                {d.code && (
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider">{d.code}</span>
                )}
                {d.created_at && (
                  <span className="text-[10px] text-slate-400">
                    {new Date(d.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "2-digit" })}
                  </span>
                )}
              </>
            )}
          </div>
          {/* Action button */}
          <ActionButton dealId={d.id} isAdmin={isAdmin} className="md:flex-shrink-0 w-full md:w-auto justify-center" />
        </div>
      </div>
    </div>
  );
}
