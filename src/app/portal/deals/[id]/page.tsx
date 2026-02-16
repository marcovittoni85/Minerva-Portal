export const dynamic = "force-dynamic";
import { supabaseServer } from "@/lib/supabase-server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, MapPin, BarChart3, Tag } from "lucide-react";

export default async function DealDetailPage({ params }: { params: { id: string } }) {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Verifica se l'utente ha accesso a questo specifico deal
  const { data: access } = await supabase
    .from("deal_access")
    .select("*")
    .eq("deal_id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!access) redirect("/portal/board");

  const { data: deal } = await supabase
    .from("deals")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!deal) notFound();

  return (
    <div className="min-h-screen bg-[#001220] text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <Link href="/portal/my-deals" className="inline-flex items-center text-[#D4AF37] text-[9px] uppercase tracking-widest mb-10 hover:opacity-70 transition-all">
          <ArrowLeft className="w-3 h-3 mr-2" /> Torna ai miei Investimenti
        </Link>

        <header className="mb-12 border-b border-white/10 pb-10">
          <div className="flex items-center space-x-3 mb-4 text-[#D4AF37]">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px] tracking-[0.4em] uppercase font-bold">Documentazione Riservata</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-light tracking-tight leading-tight mb-4">{deal.title}</h1>
          <div className="flex flex-wrap gap-4 text-slate-500 text-[10px] uppercase tracking-widest">
             <div className="flex items-center"><Tag className="w-3 h-3 mr-2 text-[#D4AF37]" /> {deal.sector}</div>
             <div className="flex items-center"><MapPin className="w-3 h-3 mr-2 text-[#D4AF37]" /> {deal.geography || "International"}</div>
             <div className="flex items-center"><BarChart3 className="w-3 h-3 mr-2 text-[#D4AF37]" /> {deal.side}</div>
          </div>
        </header>

        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-10">
            <section>
              <h4 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Executive Summary</h4>
              <p className="text-slate-300 text-sm leading-relaxed font-light">{deal.description}</p>
            </section>
            
            <section className="bg-white/5 p-8 rounded-lg border border-white/5">
              <h4 className="text-white text-[10px] uppercase tracking-[0.3em] font-bold mb-6">Dettagli Operazione</h4>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-slate-500 text-[8px] uppercase tracking-widest mb-1">Valore (EV)</p>
                  <p className="text-[#D4AF37] text-xs font-bold">{deal.ev_range}</p>
                </div>
                <div>
                  <p className="text-slate-500 text-[8px] uppercase tracking-widest mb-1">Confidenzialità</p>
                  <p className="text-slate-300 text-xs uppercase tracking-widest">Protocollo {deal.confidentiality || "Blind"}</p>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-6">
             <div className="bg-[#D4AF37] text-[#001220] p-6 rounded-lg text-center">
                <p className="text-[8px] uppercase font-black tracking-widest mb-4">Materiale Disponibile</p>
                <button className="w-full bg-[#001220] text-white py-3 rounded text-[9px] font-bold tracking-widest uppercase hover:bg-slate-900 transition-all">
                   Scarica Teaser PDF
                </button>
             </div>
             <p className="text-slate-500 text-[8px] leading-relaxed text-center uppercase tracking-tighter">
                L'accesso ai dati sensibili è monitorato in conformità agli accordi di riservatezza (NDA) sottoscritti.
             </p>
          </aside>
        </div>
      </div>
    </div>
  );
}