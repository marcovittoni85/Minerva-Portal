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
    <div className="min-h-screen bg-white p-8 md:p-16">
      <header className="max-w-6xl mx-auto mb-16 border-b border-slate-100 pb-10">
        <h1 className="text-slate-900 text-3xl md:text-5xl font-extrabold tracking-tight mb-4">Bacheca Opportunità</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.4em]">Marketplace Privato & Confidential</p>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        {deals?.map((deal) => (
          <div key={deal.id} className="bg-white border border-slate-100 p-10 rounded-3xl flex flex-col shadow-sm hover:shadow-2xl hover:border-[#D4AF37]/50 transition-all duration-500">
            <div className="flex justify-between items-start mb-8">
              <span className="text-[10px] bg-slate-900 text-[#D4AF37] px-4 py-2 font-black tracking-widest uppercase rounded-full">{deal.sector}</span>
              <span className="text-[10px] text-slate-300 font-mono font-bold tracking-widest">{deal.code}</span>
            </div>
            <h3 className="text-slate-900 text-2xl font-bold tracking-tight mb-4 leading-tight">{deal.title}</h3>
            <p className="text-slate-500 text-base leading-relaxed mb-10 font-medium opacity-80">{deal.description}</p>
            <div className="mt-auto pt-8 border-t border-slate-50 grid grid-cols-2 gap-6">
              <div>
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Asset Class</p>
                <p className="text-slate-900 text-sm font-bold uppercase">{deal.side}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mb-1">Target EV</p>
                <p className="text-[#D4AF37] text-lg font-black">{deal.ev_range}</p>
              </div>
            </div>
            <div className="mt-10 flex justify-center"><RequestAccessButton dealId={deal.id} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}