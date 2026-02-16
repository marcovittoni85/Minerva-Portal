export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, BarChart3, Tag, Download } from "lucide-react";

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: deal } = await supabase.from("deals").select("*").eq("id", params.id).single();
  if (!deal) notFound();

  return (
    <div className="min-h-screen bg-white p-6 md:p-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/portal/board" className="inline-flex items-center text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-12 hover:translate-x-[-5px] transition-transform">
          <ArrowLeft className="w-4 h-4 mr-2" /> Torna alla bacheca
        </Link>

        <header className="mb-16">
          <div className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-6">
            {deal.sector}
          </div>
          <h1 className="text-slate-900 text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-8">
            {deal.title}
          </h1>
          <div className="flex flex-wrap gap-8 text-slate-500 text-xs font-bold uppercase tracking-[0.1em]">
             <div className="flex items-center"><MapPin className="w-4 h-4 mr-2 text-[#D4AF37]" /> {deal.geography || "Internazionale"}</div>
             <div className="flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-[#D4AF37]" /> {deal.side}</div>
             <div className="flex items-center font-mono text-slate-400">ID: {deal.code}</div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-16">
          <div className="md:col-span-2 space-y-12">
            <section>
              <h4 className="text-slate-900 text-sm uppercase tracking-[0.2em] font-black mb-6">Executive Summary</h4>
              <p className="text-slate-700 text-lg leading-relaxed font-medium opacity-90">{deal.description}</p>
            </section>
            
            <section className="bg-slate-50 p-10 rounded-3xl border border-slate-100">
              <h4 className="text-slate-900 text-sm uppercase tracking-[0.2em] font-black mb-8 border-b border-slate-200 pb-4">Key Metrics</h4>
              <div className="grid grid-cols-2 gap-10">
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-2 font-bold">Valore (EV)</p>
                  <p className="text-[#D4AF37] text-2xl font-black italic">{deal.ev_range}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] uppercase tracking-widest mb-2 font-bold">Confidenzialità</p>
                  <p className="text-slate-800 text-base font-bold uppercase tracking-widest">Protocollo {deal.confidentiality || "Blind"}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-8">
             <div className="bg-slate-900 text-white p-10 rounded-3xl text-center shadow-2xl">
                <p className="text-[#D4AF37] text-[10px] uppercase font-black tracking-widest mb-6">Documentazione</p>
                <button className="w-full bg-[#D4AF37] text-[#001220] py-4 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-white transition-all flex items-center justify-center">
                   <Download className="w-4 h-4 mr-2" /> Teaser PDF
                </button>
                <p className="text-slate-500 text-[9px] mt-6 leading-relaxed font-bold uppercase">
                   Accesso protetto da NDA attivo
                </p>
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
}