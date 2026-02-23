"use client";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { Search } from "lucide-react";

const actionOptions = [
  { value: "ALL", label: "Tutte le azioni" },
  { value: "deal_viewed", label: "Deal visualizzato" },
  { value: "access_requested", label: "Accesso richiesto" },
  { value: "access_approved", label: "Accesso approvato" },
  { value: "workgroup_added", label: "Aggiunto a WG" },
  { value: "declaration_submitted", label: "Dichiarazione" },
  { value: "stage_changed", label: "Stage cambiato" },
];

const actionLabels: Record<string, string> = {
  deal_viewed: "Deal visualizzato",
  access_requested: "Accesso richiesto",
  access_approved: "Accesso approvato",
  workgroup_added: "Aggiunto a WG",
  declaration_submitted: "Dichiarazione inviata",
  stage_changed: "Stage cambiato",
};

const PAGE_SIZE = 50;

interface LogEntry {
  id: string;
  userName: string;
  dealCode: string;
  dealId: string;
  action: string;
  details: any;
  createdAt: string;
}

export default function AuditLogClient({ deals }: { deals: { id: string; code: string; title: string }[] }) {
  const supabaseRef = useRef(createClient());
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [actionFilter, setActionFilter] = useState("ALL");
  const [dealFilter, setDealFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");

  const dealMap = useMemo(() => Object.fromEntries(deals.map(d => [d.id, d.code])), [deals]);
  const dealTitleMap = useMemo(() => Object.fromEntries(deals.map(d => [d.id, d.title])), [deals]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const supabase = supabaseRef.current;

    let query = supabase
      .from("deal_activity_log")
      .select("id, deal_id, user_id, action, details, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (actionFilter !== "ALL") query = query.eq("action", actionFilter);
    if (dealFilter !== "ALL") query = query.eq("deal_id", dealFilter);
    if (dateFrom) query = query.gte("created_at", dateFrom + "T00:00:00");
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

    const { data: rows, count } = await query;
    setTotal(count ?? 0);

    // Resolve user names
    const userIds = [...new Set((rows ?? []).map(r => r.user_id).filter(Boolean))];
    const { data: profiles } = userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] as { id: string; full_name: string }[] };
    const nameMap: Record<string, string> = Object.fromEntries(
      (profiles ?? []).map(p => [p.id, p.full_name])
    );

    // Resolve deal codes for deals not in the dropdown (e.g. inactive deals)
    const missingDealIds = [...new Set(
      (rows ?? []).map(r => r.deal_id).filter((id: string) => id && !dealMap[id])
    )];
    let extraDealMap: Record<string, string> = {};
    if (missingDealIds.length > 0) {
      const { data: extraDeals } = await supabase.from("deals").select("id, code").in("id", missingDealIds);
      extraDealMap = Object.fromEntries((extraDeals ?? []).map(d => [d.id, d.code]));
    }

    setEntries((rows ?? []).map(r => ({
      id: r.id,
      userName: nameMap[r.user_id] || "Sistema",
      dealCode: dealMap[r.deal_id] || extraDealMap[r.deal_id] || "—",
      dealId: r.deal_id,
      action: r.action,
      details: r.details,
      createdAt: r.created_at,
    })));
    setLoading(false);
  }, [page, actionFilter, dealFilter, dateFrom, dateTo, dealMap]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Client-side text search within current page
  const filtered = search.trim()
    ? entries.filter(e =>
        e.userName.toLowerCase().includes(search.toLowerCase()) ||
        e.dealCode.toLowerCase().includes(search.toLowerCase()) ||
        (dealTitleMap[e.dealId] || "").toLowerCase().includes(search.toLowerCase())
      )
    : entries;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const selectClass = "bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#D4AF37] transition-colors";
  const inputClass = "bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#D4AF37] transition-colors";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-8 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Amministrazione</p>
        <h1 className="text-3xl font-bold text-slate-900">Audit <span className="text-[#D4AF37]">Log</span></h1>
        <p className="text-slate-500 text-sm mt-2">{total} eventi registrati</p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca utente o deal..."
            className={inputClass + " pl-9 w-56"}
          />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(0); }} className={selectClass}>
          {actionOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={dealFilter} onChange={e => { setDealFilter(e.target.value); setPage(0); }} className={selectClass}>
          <option value="ALL">Tutti i deal</option>
          {deals.map(d => <option key={d.id} value={d.id}>{d.code} — {d.title}</option>)}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Da</label>
          <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(0); }} className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">A</label>
          <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(0); }} className={inputClass} />
        </div>
        {(actionFilter !== "ALL" || dealFilter !== "ALL" || dateFrom || dateTo || search) && (
          <button
            onClick={() => { setActionFilter("ALL"); setDealFilter("ALL"); setDateFrom(""); setDateTo(""); setSearch(""); setPage(0); }}
            className="text-xs text-red-400 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-5 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Data</th>
              <th className="text-left px-5 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Utente</th>
              <th className="text-left px-5 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Deal</th>
              <th className="text-left px-5 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Azione</th>
              <th className="text-left px-5 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Dettagli</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">Caricamento...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-slate-400 text-sm">Nessun evento trovato</td></tr>
            ) : (
              filtered.map(entry => (
                <tr key={entry.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3 text-xs text-slate-500 whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleDateString("it-IT", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-slate-900">{entry.userName}</td>
                  <td className="px-5 py-3">
                    <a href={`/portal/deal-manage/${entry.dealId}`} className="text-xs font-bold text-slate-500 hover:text-[#D4AF37] transition-colors">{entry.dealCode}</a>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg">
                      {actionLabels[entry.action] || entry.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400 max-w-xs truncate">
                    {formatDetails(entry.action, entry.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs text-slate-400">
            Pagina {page + 1} di {totalPages} ({total} risultati)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="text-xs border border-slate-200 px-4 py-2 rounded-lg hover:border-[#D4AF37] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Precedente
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="text-xs border border-slate-200 px-4 py-2 rounded-lg hover:border-[#D4AF37] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Successiva
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDetails(action: string, details: any): string {
  if (!details) return "—";
  if (action === "stage_changed") return `${details.from || "?"} → ${details.to || "?"}`;
  if (action === "access_approved" && details.approved_user_name) return details.approved_user_name;
  if (action === "workgroup_added" && details.added_user_name) return details.added_user_name;
  if (action === "access_requested" && details.reason) return details.reason;
  if (action === "declaration_submitted" && details.has_conflict) return "Conflitto segnalato";
  return "—";
}
