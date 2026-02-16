export const dynamic = "force-dynamic";
export const revalidate = 0;

import { supabaseServer } from "@/lib/supabase-server";
import Link from "next/link";

export default async function DealsCatalogPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: deals, error: dealsError } = await supabase
    .from("deals")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });

  const { data: myRequests } = await supabase
    .from("deal_access_requests")
    .select("deal_id, status")
    .eq("user_id", user?.id);

  if (dealsError) return <div className="p-10 text-center uppercase font-black text-slate-400">Errore Protocollo.</div>;

  return (
    <div className="min-h-screen relative pb-32 overflow-hidden bg-white">
      {/* BACKGROUND PATTERN MINERVA */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: `radial-gradient(#D4AF37 0.8px, transparent 0.8px), linear-gradient(to right, #D4AF37 0.5px, transparent 0.5px), linear-gradient(to bottom, #D4AF37 0.5px, transparent 0.5px)`, backgroundSize: '60px 60px, 120px 120px, 120px 120px' }}>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-20 relative z-10 space-y-20">
        <header className="flex flex-col md:flex-row justify-between items-end gap-10 border-b-2 border-slate-900 pb-16">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-black text-[#001220] tracking-tighter uppercase leading-[0.85]">
              Marketplace <br/>
              <span className="text-[#D4AF37]">Operativo</span>
            </h1>
            <p className="text-slate-400 text-[10px] uppercase tracking-[0.5em] font-black italic">Protocollo VERITAS • Selezione Esclusiva</p>
          </div>
          <div className="bg-[#001220] px-10 py-6 rounded-[2rem] shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37] mb-2">Dossier Attivi</p>
            <p className="text-5xl font-black text-white leading-none tracking-tighter">{deals?.length || 0}</p>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {deals?.map((deal) => {
            const request = myRequests?.find(r => r.deal_id === deal.id);
            const isApproved = request?.status === 'ACCESS_APPROVED';
            const isPending = request?.status === 'pending';

            return (
              <Link 
                key={deal.id} 
                href={`/portal/deals/${deal.id}`}
                className="group bg-white border border-slate-100 rounded-[3.5rem] p-12 shadow-sm hover:shadow-2xl hover:border-[#D4AF37]/40 transition-all duration-700 flex flex-col justify-between relative overflow-hidden"
              >
                <div>
                  <div className="mb-10">
                    <span className="inline-block bg-[#001220] text-[#D4AF37] text-[11px] font-black uppercase tracking-[0.3em] px-6 py-3 rounded-xl shadow-lg group-hover:bg-[#D4AF37] group-hover:text-black transition-colors duration-500">
                      {deal.side || "OPERAZIONE"}
                    </span>
                    <p className="text-slate-900 text-2xl font-black uppercase tracking-tighter leading-none mt-6 border-l-4 border-slate-100 pl-4">
                      {deal.sector}
                    </p>
                  </div>

                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-6 group-hover:text-blue-700 transition-colors leading-[0.9]">
                    {deal.title}
                  </h3>
                  
                  <p className="text-slate-500 text-sm font-medium line-clamp-3 mb-12 leading-relaxed italic border-l-2 border-slate-50 pl-4">
                    {deal.description}
                  </p>
                </div>

                <div className="space-y-10">
                  <div className="flex justify-between items-end border-t border-slate-50 pt-10">
                    <div>
                      <p className="text-[9px] uppercase tracking-widest text-slate-400 font-black mb-2">Valutazione Target</p>
                      <p className="text-xl font-black text-slate-900 tracking-tight">{deal.ev_range}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      {isApproved ? (
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-4 py-1.5 rounded-xl border border-blue-100 shadow-sm">Full Access</span>
                      ) : isPending ? (
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-4 py-1.5 rounded-xl border border-amber-100">Review</span>
                      ) : (
                        <span className="text-[10px] font-black text-slate-300 bg-slate-50 px-4 py-1.5 rounded-xl border border-slate-100 italic">Blind Access</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[2rem] group-hover:bg-[#001220] transition-all duration-500 shadow-inner">
                    <span className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-900 group-hover:text-white">Analizza Dossier</span>
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-lg group-hover:rotate-45 transition-transform">
                      <span className="text-slate-900 group-hover:text-[#D4AF37] font-black text-xl">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}