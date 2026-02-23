import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DealProposalsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  if (profile?.role !== "admin" && profile?.role !== "equity_partner") redirect("/portal");

  const { data: proposals } = await supabase
    .from("deals")
    .select("id, title, sector, side, geography, ev_range, description, min_ticket, status, created_at, created_by")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });

  const userIds = [...new Set((proposals ?? []).map(p => p.created_by).filter(Boolean))];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] };
  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-10 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Amministrazione</p>
        <h1 className="text-3xl font-bold text-slate-900">Proposte <span className="text-[#D4AF37]">Deal</span></h1>
        <p className="text-slate-500 text-sm mt-2">{proposals?.length || 0} proposte in attesa di revisione</p>
      </header>

      <div className="space-y-4">
        {!proposals || proposals.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-sm">Nessuna proposta in attesa</div>
        ) : (
          proposals.map((deal) => (
            <div key={deal.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-black text-slate-900 uppercase tracking-wider">{deal.side}</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-lg border bg-slate-50 text-slate-600 border-slate-200">{deal.sector}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{deal.title}</h3>
                  <p className="text-slate-500 text-sm mb-3">{deal.description || "Nessuna descrizione"}</p>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400">
                    {deal.geography && <span>📍 {deal.geography}</span>}
                    {deal.ev_range && <span>💰 {deal.ev_range}</span>}
                    {deal.min_ticket && <span>🎫 Min: {deal.min_ticket}</span>}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-slate-400 text-xs">Proposto da:</span>
                    <span className="text-slate-900 text-xs font-bold">{profileMap[deal.created_by] || "Sconosciuto"}</span>
                    <span className="text-slate-400 text-[10px]">• {new Date(deal.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" })}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <form action="/portal/deal-proposals/approve" method="POST">
                    <input type="hidden" name="dealId" value={deal.id} />
                    <button className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors">Approva</button>
                  </form>
                  <form action="/portal/deal-proposals/reject" method="POST">
                    <input type="hidden" name="dealId" value={deal.id} />
                    <button className="border border-red-200 text-red-500 px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-red-50 transition-colors">Rifiuta</button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}