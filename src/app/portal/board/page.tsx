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
    <div className="min-h-screen bg-[#001220] p-6">
      <header className="max-w-6xl mx-auto mb-10 border-b border-white/5 pb-8">
        <h1 className="text-[#D4AF37] text-lg tracking-[0.4em] uppercase font-light">Bacheca Opportunità</h1>
        <p className="text-slate-500 text-[8px] tracking-[0.3em] uppercase mt-2">Riservato ai Partner Minerva</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {deals?.map((deal) => (
          <div key={deal.id} className="bg-[#001c30]/40 border border-white/5 p-5 rounded-lg flex flex-col group hover:border-[#D4AF37]/20 transition-all">
            <div className="flex justify-between items-start mb-4">
              <span className="text-[8px] border border-[#D4AF37]/30 text-[#D4AF37] px-2 py-0.5 font-bold tracking-widest uppercase rounded">
                {deal.sector}
              </span>
              <span className="text-[7px] text-slate-600 tracking-[0.2em] uppercase">{deal.code}</span>
            </div>

            <h3 className="text-white text-[13px] font-medium tracking-tight mb-2 group-hover:text-[#D4AF37] transition-colors leading-snug">
              {deal.title}
            </h3>
            
            <p className="text-slate-400 text-[10px] leading-relaxed mb-6 font-light line-clamp-3">
              {deal.description}
            </p>

            <div className="mt-auto pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
              <div>
                <p className="text-slate-600 text-[7px] uppercase tracking-widest">Asset Class</p>
                <p className="text-slate-300 text-[9px] uppercase font-medium">{deal.side}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-600 text-[7px] uppercase tracking-widest">EV Range</p>
                <p className="text-[#D4AF37] text-[9px] font-bold">{deal.ev_range}</p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <RequestAccessButton dealId={deal.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}