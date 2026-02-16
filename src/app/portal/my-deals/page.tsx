export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MyDealsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: accessRows } = await supabase
    .from("deal_access")
    .select("deal_id, access_level")
    .eq("user_id", user.id);

  const dealIds = (accessRows ?? []).map((r) => r.deal_id);

  if (dealIds.length === 0) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">I Miei Investimenti</h1>
        <div className="bg-white border rounded-2xl p-12 text-center">
          <p className="text-slate-400 text-lg mb-4">Non hai ancora accesso a nessun deal.</p>
          <Link href="/portal/board" className="inline-block bg-[#001220] text-[#D4AF37] text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-[#D4AF37] hover:text-[#001220] transition-colors">
            Esplora la Bacheca
          </Link>
        </div>
      </div>
    );
  }

  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .in("id", dealIds)
    .order("created_at", { ascending: false });

  const accessMap = Object.fromEntries((accessRows ?? []).map((r) => [r.deal_id, r.access_level]));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">I Miei Investimenti</h1>
          <p className="text-slate-500 mt-2">{deals?.length} deal con accesso approvato</p>
        </div>
        <Link href="/portal/board" className="text-sm text-slate-500 underline">Torna alla Bacheca</Link>
      </header>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {deals?.map((deal) => (
          <Link key={deal.id} href={`/portal/deals/${deal.id}`} className="group bg-white border border-slate-100 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center justify-between mb-6">
              <span className="inline-block bg-[#001220] text-[#D4AF37] text-[10px] font-bold uppercase tracking-widest px-4 py-2 rounded-lg">{deal.side || "OPERAZIONE"}</span>
              <span className="text-[10px] font-bold text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100">{accessMap[deal.id] || "Full Access"}</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-[#D4AF37] transition-colors">{deal.title}</h3>
            <p className="text-slate-400 text-xs uppercase tracking-widest mb-4">{deal.sector} • {deal.geography || "—"}</p>
       className="text-slate-500 text-sm line-clamp-2 mb-6"