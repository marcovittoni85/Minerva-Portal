export const dynamic = "force-dynamic";

import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import RequestAccessButton from "./RequestAccessButton";

export default async function BoardPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Recuperiamo i deal blind
  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .eq("status", "confirmed")
    .eq("active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#001220] p-4 md:p-8">
      <header className="max-w-6xl mx-auto mb-12">
        <h1 className="text-[#D4AF37] text-xl md:text-2xl tracking-[0.3em] uppercase font-light">Bacheca Opportunità</h1>
        <p className="text-slate-500 text-[10px] tracking-[0.2em] uppercase mt-2">Private & Confidential Marketplace</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {deals?.map((deal) => (
          <div key={deal.id} className="bg-[#001c30]/50 border border-white/5 p-6 rounded-xl hover:border-[#D4AF37]/30 transition-all group">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[9px] bg-[#D4AF37] text-[#001220] px-3 py-1 font-bold tracking-tighter uppercase rounded">
                {deal.side}
              </span>
              <span className="text-[9px] text-slate-500 tracking-widest uppercase italic">
                {deal.code}
              </span>
            </div>

            <h3 className="text-white text-base font-light tracking-tight mb-2 group-hover:text-[#D4AF37] transition-colors">
              {deal.title}
            </h3>
            
            <p className="text-slate-400 text-[11px] leading-relaxed mb-6 font-light">
              {deal.description}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5 mt-auto">
              <div>
                <p className="text-slate-500 text-[8px] uppercase tracking-widest mb-1">Settore</p>
                <p className="text-slate-300 text-[10px] uppercase tracking-wider">{deal.sector}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-500 text-[8px] uppercase tracking-widest mb-1">Target EV</p>
                <p className="text-[#D4AF37] text-[10px] font-bold">{deal.ev_range}</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end border-t border-white/5 pt-4">
              <RequestAccessButton dealId={deal.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}