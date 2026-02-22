export const dynamic = "force-dynamic";
export const revalidate = 0;
import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";

export default async function MyDealsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accessRows } = await supabase
    .from("deal_access")
    .select("deal_id, access_level")
    .eq("user_id", user.id);

  const dealIds = (accessRows ?? []).map((r) => r.deal_id);

  // Also get deals where user is originator
  const { data: originatedDeals } = await supabase
    .from("deals")
    .select("id")
    .eq("originator_id", user.id)
    .eq("active", true);

  const originatedIds = (originatedDeals ?? []).map((d) => d.id);
  const allDealIds = [...new Set([...dealIds, ...originatedIds])];

  if (allDealIds.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">I Miei Deal</h1>
        <p className="text-slate-500 text-sm mb-8">Qui trovi i deal a cui hai accesso approvato e quelli che hai originato. Puoi consultare il dossier completo e comunicare con l'originator o i membri approvati.</p>
        <div className="bg-white border rounded-2xl p-12 text-center">
          <p className="text-slate-400 text-lg mb-4">Non hai ancora accesso a nessun deal.</p>
          <Link href="/portal/board" className="inline-block bg-[#D4AF37] text-white text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-[#b8962d] transition-colors">Esplora la Bacheca</Link>
        </div>
      </div>
    );
  }

  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .in("id", allDealIds)
    .eq("active", true)
    .order("created_at", { ascending: false });

  const accessMap = Object.fromEntries((accessRows ?? []).map((r) => [r.deal_id, r.access_level]));

  // Get comment counts per deal
  const { data: commentCounts } = await supabase
    .from("deal_comments")
    .select("deal_id")
    .in("deal_id", allDealIds);

  const commentMap: Record<string, number> = {};
  (commentCounts ?? []).forEach((c) => {
    commentMap[c.deal_id] = (commentMap[c.deal_id] || 0) + 1;
  });

  // Get originator names
  const originatorIds = [...new Set((deals ?? []).map((d) => d.originator_id).filter(Boolean))];
  const { data: originatorProfiles } = originatorIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", originatorIds)
    : { data: [] };
  const originatorMap = Object.fromEntries((originatorProfiles ?? []).map((p) => [p.id, p.full_name]));

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const isAdmin = prof?.role?.toString() === "admin";

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900">I Miei Deal</h1>
        <p className="text-slate-500 text-sm mt-2 max-w-2xl">Qui trovi i deal a cui hai accesso approvato e quelli che hai originato. Puoi consultare il dossier completo, scaricare i documenti e comunicare direttamente con l'originator tramite i commenti.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deals?.map((deal) => {
          const level = accessMap[deal.id] || (originatedIds.includes(deal.id) ? "Originator" : "—");
          const isOriginator = deal.originator_id === user.id;
          const comments = commentMap[deal.id] || 0;

          return (
            <Link key={deal.id} href={"/portal/deals/" + deal.id} className="group bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-lg hover:border-[#D4AF37]/30 transition-all">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{deal.code}</span>
                {isOriginator ? (
                  <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded-lg border border-[#D4AF37]/20">Originator</span>
                ) : (
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1 rounded-lg border border-green-100">{level}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{deal.sector}</span>
                <span className="text-[10px] font-bold text-slate-900">{deal.deal_type}</span>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-[#D4AF37] transition-colors leading-tight">{deal.title}</h3>

              {isAdmin && deal.originator_id && (
                <p className="text-[10px] text-slate-400 mb-2">Originator: {originatorMap[deal.originator_id] || "—"}</p>
              )}

              <p className="text-slate-500 text-sm mb-4 line-clamp-2">{deal.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">EV Range</p>
                    <p className="text-sm font-bold text-slate-900">{deal.ev_range || "N/A"}</p>
                  </div>
                  {comments > 0 && (
                    <div className="flex items-center gap-1 text-slate-400">
                      <MessageSquare className="w-3 h-3" />
                      <span className="text-[10px] font-bold">{comments}</span>
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold text-[#D4AF37] group-hover:underline">Apri →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}