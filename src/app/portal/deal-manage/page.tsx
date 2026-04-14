export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

const stageLabels: Record<string, string> = {
  board: "Board",
  in_review: "In Review",
  workgroup: "Workgroup",
  in_progress: "In Progress",
  closed_won: "Closed Won",
  closed_lost: "Closed Lost",
};

const stageStyles: Record<string, string> = {
  board: "bg-slate-100 text-slate-600",
  in_review: "bg-amber-50 text-amber-700",
  workgroup: "bg-blue-50 text-blue-700",
  in_progress: "bg-[#D4AF37]/10 text-[#D4AF37]",
  closed_won: "bg-emerald-50 text-emerald-700",
  closed_lost: "bg-red-50 text-red-500",
};

export default async function DealManagePage() {
  const supabase = await supabaseServer();
  const { data: { session } } = await supabase.auth.getSession(); const user = session?.user;
  if (!user) redirect("/login");

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = prof?.role === "admin";
  if (!isAdmin) redirect("/portal");

  const { data: deals } = await supabase
    .from("deals")
    .select("id, code, title, sector, deal_stage, originator_id, active")
    .eq("active", true)
    .order("created_at", { ascending: false });

  // Get originator names
  const originatorIds = [...new Set((deals ?? []).map(d => d.originator_id).filter(Boolean))];
  const { data: originatorProfiles } = originatorIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", originatorIds)
    : { data: [] };
  const originatorMap = Object.fromEntries((originatorProfiles ?? []).map(p => [p.id, p.full_name]));

  // Get approved member counts per deal
  const dealIds = (deals ?? []).map(d => d.id);
  const { data: accessRows } = dealIds.length > 0
    ? await supabase.from("deal_access").select("deal_id").in("deal_id", dealIds)
    : { data: [] };
  const accessCounts: Record<string, number> = {};
  (accessRows ?? []).forEach(r => { accessCounts[r.deal_id] = (accessCounts[r.deal_id] || 0) + 1; });

  // Get workgroup member counts per deal
  const { data: wgRows } = dealIds.length > 0
    ? await supabase.from("deal_workgroup").select("deal_id").in("deal_id", dealIds)
    : { data: [] };
  const wgCounts: Record<string, number> = {};
  (wgRows ?? []).forEach(r => { wgCounts[r.deal_id] = (wgCounts[r.deal_id] || 0) + 1; });

  const stages = ["ALL", "board", "in_review", "workgroup", "in_progress", "closed_won", "closed_lost"];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <header className="mb-10 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Amministrazione</p>
        <h1 className="text-3xl font-bold text-slate-900">Gestione <span className="text-[#D4AF37]">Deal</span></h1>
        <p className="text-slate-500 text-sm mt-2">{deals?.length || 0} deal attivi</p>
      </header>

      {/* Stage filter tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        {stages.map(s => (
          <a key={s} href={s === "ALL" ? "/portal/deal-manage" : `/portal/deal-manage?stage=${s}`}
            className="text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg border border-slate-200 text-slate-500 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors">
            {s === "ALL" ? "Tutti" : stageLabels[s] || s}
          </a>
        ))}
      </div>

      {/* Deal table */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Codice</th>
              <th className="text-left px-6 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Titolo</th>
              <th className="text-left px-6 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Settore</th>
              <th className="text-left px-6 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Stage</th>
              <th className="text-left px-6 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Originator</th>
              <th className="text-center px-6 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">Accessi</th>
              <th className="text-center px-6 py-4 text-[9px] uppercase tracking-widest text-slate-400 font-bold">WG</th>
            </tr>
          </thead>
          <tbody>
            {(deals ?? []).map(deal => (
              <tr key={deal.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/portal/deal-manage/${deal.id}`} className="text-xs font-bold text-slate-500 hover:text-[#D4AF37] transition-colors">{deal.code}</Link>
                </td>
                <td className="px-6 py-4">
                  <Link href={`/portal/deal-manage/${deal.id}`} className="text-sm font-bold text-slate-900 hover:text-[#D4AF37] transition-colors">{deal.title}</Link>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{deal.sector || "—"}</td>
                <td className="px-6 py-4">
                  <span className={"text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg " + (stageStyles[deal.deal_stage] || stageStyles.board)}>
                    {stageLabels[deal.deal_stage] || "Board"}
                  </span>
                </td>
                <td className="px-6 py-4 text-xs text-slate-500">{originatorMap[deal.originator_id] || "—"}</td>
                <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">{accessCounts[deal.id] || 0}</td>
                <td className="px-6 py-4 text-center text-xs font-bold text-slate-600">{wgCounts[deal.id] || 0}</td>
              </tr>
            ))}
            {(!deals || deals.length === 0) && (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 text-sm">Nessun deal trovato</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
