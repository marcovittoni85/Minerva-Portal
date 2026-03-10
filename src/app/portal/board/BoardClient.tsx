"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, ChevronUp, ChevronDown, Eye, Clock, XCircle, FolderOpen, ChevronRight } from "lucide-react";
import { getCategoryConfig, getTypeBadgeConfig, getStageBadgeConfig, CATEGORY_OPTIONS } from "@/lib/deal-config";
import { useAccessStatus } from "./useAccessStatus";

const boardVisibleStages = new Set(["board", "in_review", null, undefined, ""]);

type SortField = "category" | "type" | "title" | "ev" | "date";
type SortDir = "asc" | "desc";

/* ─── Action Button per row ──────────────────────────────────────── */

function ActionButton({ dealId, isAdmin }: { dealId: string; isAdmin: boolean }) {
  const status = useAccessStatus(dealId, isAdmin);

  if (status === "loading") return <div className="h-8 w-20 bg-slate-50 animate-pulse rounded-lg" />;

  if (isAdmin) {
    return (
      <Link href={`/portal/deal-manage/${dealId}`}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-[#001220] text-white hover:bg-[#001220]/90 transition-colors">
        <ChevronRight className="w-3.5 h-3.5" /> Gestisci
      </Link>
    );
  }

  if (status === "approved") {
    return (
      <Link href={`/portal/deals/${dealId}`}
        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-[#001220] text-white hover:bg-[#001220]/90 transition-colors">
        <FolderOpen className="w-3.5 h-3.5" /> Apri Dossier
      </Link>
    );
  }

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-600">
        <Clock className="w-3.5 h-3.5" /> In Attesa
      </span>
    );
  }

  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-red-50 text-red-600">
        <XCircle className="w-3.5 h-3.5" /> Rifiutato
      </span>
    );
  }

  // status === "none"
  return (
    <Link href={`/portal/deals/${dealId}`}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-gradient-to-r from-[#F5A623] to-[#E09000] text-white shadow-md shadow-[#F5A623]/30 hover:shadow-lg hover:shadow-[#F5A623]/40 transition-all">
      <Eye className="w-3.5 h-3.5" /> Dettagli
    </Link>
  );
}

/* ─── Sort helper ────────────────────────────────────────────────── */

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ChevronUp className="w-3 h-3 text-slate-300" />;
  return dir === "asc"
    ? <ChevronUp className="w-3 h-3 text-[#D4AF37]" />
    : <ChevronDown className="w-3 h-3 text-[#D4AF37]" />;
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
  const [sortField, setSortField] = useState<SortField>("category");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const processed = useMemo(() => {
    let list = deals;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(d =>
        (d.title?.toLowerCase().includes(q)) ||
        (d.code?.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (categoryFilter !== "ALL") {
      list = list.filter(d => getCategoryConfig(d.sector).label === categoryFilter);
    }

    // Sort
    list = [...list].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "category":
          cmp = getCategoryConfig(a.sector).label.localeCompare(getCategoryConfig(b.sector).label);
          if (cmp === 0) cmp = getTypeBadgeConfig(a.deal_type, a.side).label.localeCompare(getTypeBadgeConfig(b.deal_type, b.side).label);
          break;
        case "type":
          cmp = getTypeBadgeConfig(a.deal_type, a.side).label.localeCompare(getTypeBadgeConfig(b.deal_type, b.side).label);
          break;
        case "title":
          cmp = (a.title || "").localeCompare(b.title || "");
          break;
        case "ev":
          cmp = (a.ev_range || "").localeCompare(b.ev_range || "");
          break;
        case "date":
          cmp = (a.created_at || "").localeCompare(b.created_at || "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return list;
  }, [deals, searchQuery, categoryFilter, sortField, sortDir]);

  const hasFilters = searchQuery.trim() !== "" || categoryFilter !== "ALL";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Opportunità <span className="text-[#D4AF37]">Riservate</span></h1>
          <p className="text-slate-400 text-sm mt-1">{processed.length} operazioni {hasFilters ? "filtrate" : "disponibili"}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search */}
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
          {/* Category dropdown */}
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#D4AF37] transition-colors cursor-pointer"
          >
            <option value="ALL">Tutte le categorie</option>
            {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          {/* Admin link */}
          {isAdmin && (
            <Link href="/portal/access-requests"
              className="text-[10px] uppercase tracking-[0.15em] font-bold text-[#D4AF37] border border-[#D4AF37]/30 px-4 py-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors whitespace-nowrap">
              Richieste Pendenti
            </Link>
          )}
        </div>
      </header>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm">{error}</div>}

      {/* Desktop Table (≥md) */}
      <div className="hidden md:block bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <Th field="category" current={sortField} dir={sortDir} onClick={toggleSort}>Categoria</Th>
              <Th field="type" current={sortField} dir={sortDir} onClick={toggleSort}>Tipo</Th>
              <Th field="title" current={sortField} dir={sortDir} onClick={toggleSort}>Deal</Th>
              <Th field="ev" current={sortField} dir={sortDir} onClick={toggleSort}>Stima EV</Th>
              {isAdmin && (
                <>
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-wide font-bold text-slate-500">Originator</th>
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-wide font-bold text-slate-500">Codice</th>
                  <th className="text-left px-6 py-3 text-[10px] uppercase tracking-wide font-bold text-slate-500">Status</th>
                  <Th field="date" current={sortField} dir={sortDir} onClick={toggleSort}>Data</Th>
                </>
              )}
              <th className="px-6 py-3 text-[10px] uppercase tracking-wide font-bold text-slate-500 text-right">Azione</th>
            </tr>
          </thead>
          <tbody>
            {processed.map((d, i) => {
              const cat = getCategoryConfig(d.sector);
              const typeBadge = getTypeBadgeConfig(d.deal_type, d.side);
              const stage = getStageBadgeConfig(d.deal_stage);
              const CatIcon = cat.icon;
              const TypeIcon = typeBadge.icon;

              // Category separator
              const prevCat = i > 0 ? getCategoryConfig(processed[i - 1].sector).label : null;
              const showSep = sortField === "category" && prevCat !== null && prevCat !== cat.label;

              return (
                <tr key={d.id} className={"hover:bg-slate-50/50 transition-colors " + (showSep ? "border-t-2 border-slate-200" : "border-b border-slate-50")}>
                  {/* Categoria */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${cat.bg}`}>
                        <CatIcon className={`w-4 h-4 ${cat.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-slate-700">{cat.label}</span>
                    </div>
                  </td>
                  {/* Tipo */}
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold ${typeBadge.bg} ${typeBadge.color}`}>
                      <TypeIcon className="w-3 h-3" /> {typeBadge.label}
                    </span>
                  </td>
                  {/* Deal */}
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-slate-900">{d.title}</span>
                  </td>
                  {/* EV */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-700 tabular-nums">{d.ev_range || "—"}</span>
                  </td>
                  {/* Admin columns */}
                  {isAdmin && (
                    <>
                      <td className="px-6 py-4 text-xs text-slate-600">{originatorMap[d.originator_id] || "—"}</td>
                      <td className="px-6 py-4 text-[10px] text-slate-400 uppercase tracking-wider font-mono">{d.code || "—"}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize ${stage.classes}`}>
                          {stage.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 tabular-nums">
                        {d.created_at ? new Date(d.created_at).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                      </td>
                    </>
                  )}
                  {/* Azione */}
                  <td className="px-6 py-4 text-right">
                    <ActionButton dealId={d.id} isAdmin={isAdmin} />
                  </td>
                </tr>
              );
            })}
            {processed.length === 0 && (
              <tr><td colSpan={isAdmin ? 9 : 5} className="text-center py-16 text-slate-400">Nessuna opportunità con questi filtri.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards (<md) */}
      <div className="md:hidden space-y-3">
        {processed.map(d => {
          const cat = getCategoryConfig(d.sector);
          const typeBadge = getTypeBadgeConfig(d.deal_type, d.side);
          const CatIcon = cat.icon;
          const TypeIcon = typeBadge.icon;
          return (
            <div key={d.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              {/* Top: icon + title */}
              <div className="flex items-start gap-3 mb-3">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.bg}`}>
                  <CatIcon className={`w-4 h-4 ${cat.color}`} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 leading-snug">{d.title}</h3>
              </div>
              {/* Middle: badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${typeBadge.bg} ${typeBadge.color}`}>
                  <TypeIcon className="w-3 h-3" /> {typeBadge.label}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">{cat.label}</span>
              </div>
              {/* Bottom: EV + action */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">EV Range</p>
                  <p className="text-sm font-bold text-slate-900 tabular-nums">{d.ev_range || "—"}</p>
                </div>
                <ActionButton dealId={d.id} isAdmin={isAdmin} />
              </div>
            </div>
          );
        })}
        {processed.length === 0 && (
          <div className="text-center py-16 text-slate-400">Nessuna opportunità con questi filtri.</div>
        )}
      </div>
    </div>
  );
}

/* ─── Sortable Table Header ──────────────────────────────────────── */

function Th({ field, current, dir, onClick, children }: {
  field: SortField; current: SortField; dir: SortDir; onClick: (f: SortField) => void; children: React.ReactNode;
}) {
  return (
    <th
      className="text-left px-6 py-3 text-[10px] uppercase tracking-wide font-bold text-slate-500 cursor-pointer select-none hover:text-slate-700 transition-colors"
      onClick={() => onClick(field)}
    >
      <span className="inline-flex items-center gap-1">
        {children}
        <SortIcon field={field} current={current} dir={dir} />
      </span>
    </th>
  );
}
