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
    <div className="min-h-screen bg-white p-6 md:p-16">
      <div className="max-w-4xl mx-auto">
        <Link href="/portal/board" className="inline-flex items-center text-[#D4AF37] text-xs font-medium uppercase tracking-widest mb-12 hover:opacity-70 transition-opacity">
          ← Torna alla bacheca
        </Link>

        <header className="mb-12 pb-8 border-b border-slate-100">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded">{deal.side || "OPERAZIONE"}</span>
            <span className="text-[9px] text-slate-400 tracking-wider">{deal.code || ""}</span>
          </div>
          <h1 className="text-slate-900 text-3xl font-bold tracking-tight mb-4">{deal.title}</h1>
          <div className="flex flex-wrap gap-6 text-slate-500 text-xs tracking-wide">
            <span>{deal.sector}</span>
            <span>{deal.geography || "Internazionale"}</span>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-10">
            <section>
              <h4 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-medium mb-4">Executive Summary</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{deal.description}</p>
            </section>

            <section className="bg-slate-50 border border-slate-100 p-8 rounded-xl">
              <h4 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-medium mb-6">Key Metrics</h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-slate-400 text-[9px] uppercase tracking-widest mb-2">Valore (EV)</p>
                  <p className="text-slate-900 text-xl font-bold">{deal.ev_range || "N/A"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[9px] uppercase tracking-widest mb-2">Confidenzialita</p>
                  <p className="text-slate-900 text-sm font-medium uppercase tracking-wider">{deal.confidentiality || "Blind"}</p>
                </div>
              </div>
            </section>
          </div>

          <aside>
            <div className="bg-slate-50 border border-slate-100 p-8 rounded-xl text-center">
              <p className="text-[#D4AF37] text-[9px] uppercase tracking-[0.3em] font-medium mb-6">Documentazione</p>
              <button className="w-full bg-[#D4AF37] text-white py-3 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors">Teaser PDF</button>
              <p className="text-slate-400 text-[8px] mt-4 uppercase tracking-wider">Accesso protetto da NDA</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
