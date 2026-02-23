export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DealsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: deals } = await supabase
    .from("deals")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen bg-[#001220] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10 border-b border-[#D4AF37]/20 pb-6">
          <h1 className="text-[#D4AF37] text-lg tracking-[0.4em] uppercase font-light">Marketplace Esclusivo</h1>
          <p className="text-slate-500 text-[9px] tracking-[0.2em] uppercase mt-1 text-white/60">Partner Portfolio Overview</p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deals?.map((deal) => (
            <Link key={deal.id} href={`/portal/deals/${deal.id}`} className="block group">
              <div className="bg-[#001c30] border border-white/5 p-5 rounded-lg hover:border-[#D4AF37]/40 transition-all h-full flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[8px] bg-[#D4AF37]/10 text-[#D4AF37] px-2 py-0.5 rounded border border-[#D4AF37]/20 font-bold uppercase tracking-tighter">
                    {deal.side}
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">{deal.code}</span>
                </div>

                <h3 className="text-white text-sm font-medium tracking-tight mb-2 group-hover:text-[#D4AF37] transition-colors leading-tight">
                  {deal.title}
                </h3>
                
                <p className="text-slate-400 text-[10px] leading-relaxed mb-6 font-light line-clamp-2">
                  {deal.description}
                </p>

                <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-end">
                  <div>
                    <p className="text-slate-500 text-[7px] uppercase tracking-widest mb-0.5">Valore Stimato</p>
                    <p className="text-[#D4AF37] text-[11px] font-semibold tracking-tight">{deal.ev_range}</p>
                  </div>
                  <span className="text-[#D4AF37] text-[10px] font-light">Dettagli →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}