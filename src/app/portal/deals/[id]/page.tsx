export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: deal } = await supabase.from("deals").select("*").eq("id", id).single();
  if (!deal) notFound();

  return (
    <div className="min-h-screen bg-[#001220] p-6 md:p-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/portal/board" className="inline-flex items-center text-[#D4AF37] text-xs font-medium uppercase tracking-widest mb-12 hover:opacity-70 transition-opacity">
          ← Torna alla bacheca
        </Link>

        <header className="mb-12 pb-8 border-b border-white/10">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded">{deal.side || "OPERAZIONE"}</span>
            <span className="text-[9px] text-slate-500 tracking-wider">{deal.code || ""}</span>
          </div>
          <h1 className="text-white text-3xl font-light tracking-tight mb-4">{deal.title}</h1>
          <div className="flex flex-wrap gap-6 text-slate-500 text-xs tracking-wide">
            <span>{deal.sector}</span>
            <span>{deal.geography || "Internazionale"}</span>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-10">
            <section>
              <h4 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-medium mb-4">Executive Summary</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{deal.description}</p>
            </section>

            <section className="bg-[#001c30] border border-white/5 p-8 rounded-xl">
              <h4 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-medium mb-6">Key Metrics</h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-2">Valore (EV)</p>
                  <p className="text-white text-xl font-light">{deal.ev_range || "N/A"}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[9px] uppercase tracking-widest mb-2">Confidenzialita</p>
                  <p className="text-white text-sm font-light uppercase tracking-wider">{deal.confidentiality || "Blind"}</p>
                </div>
              </div>
            </section>
          </div>

          <aside>
            <div className="bg-[#001c30] border border-white/5 p-8 rounded-xl text-center">
              <p className="text-[#D4AF37] text-[9px] uppercase tracking-[0.3em] font-medium mb-6">Documentazione</p>
              <button className="w-full bg-[#D4AF37] text-[#001220] py-3 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors">Teaser PDF</button>
              <p className="text-slate-600 text-[8px] mt-4 uppercase tracking-wider">Accesso protetto da NDA</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}