export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import RequestAccessButton from "./RequestAccessButton";

export default async function BoardPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "confirmed")
    .eq("active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 font-sans">
      <header className="max-w-6xl mx-auto mb-12 border-b border-slate-100 pb-10">
        <h1 className="text-slate-900 text-2xl md:text-3xl tracking-tight font-bold">Bacheca Opportunità</h1>
        <p className="text-slate-500 text-sm tracking-widest uppercase mt-2 font-medium">Marketplace Riservato Minerva Partners</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {deals?.map((deal) => (
          <div key={deal.id} className="bg-white border border-slate-200 p-8 rounded-2xl flex flex-col shadow-sm hover:shadow-xl hover:border-[#D4AF37] transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] bg-slate-100 text-slate-700 px-3 py-1.5 font-bold tracking-widest uppercase rounded-full">
                {deal.sector}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">{deal.code}</span>
            </div>

            <h3 className="text-slate-900 text-xl font-bold tracking-tight mb-3 leading-snug">
              {deal.title}
            </h3>
            
            <p className="text-slate-600 text-[13px] leading-relaxed mb-8 font-normal line-clamp-4">
              {deal.description}
            </p>

            <div className="mt-auto pt-6 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-[9px] uppercase tracking-[0.2em] mb-1">Asset Class</p>
                <p className="text-slate-800 text-xs font-semibold uppercase">{deal.side}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-[9px] uppercase tracking-[0.2em] mb-1">EV Range</p>
                <p className="text-[#D4AF37] text-sm font-bold">{deal.ev_range}</p>
              </div>
            </div>

            <div className="mt-8 flex justify-center pt-2">
              <RequestAccessButton dealId={deal.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}