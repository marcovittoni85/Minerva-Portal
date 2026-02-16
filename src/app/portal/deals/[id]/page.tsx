export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import { notFound } from "next/navigation";

// Componenti Core
import Comments from "./Comments";
import Documents from "./Documents";
import Economics from "./Economics";
import Allocations from "./Allocations";
import AuditTimeline from "./AuditTimeline";
import CommentBox from "@/components/CommentBox";

export default async function DealDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  if (!id) return notFound();

  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;
  if (!user) return <div className="p-10 text-white bg-[#001220] min-h-screen font-black uppercase tracking-widest text-center flex items-center justify-center italic">Autenticazione Richiesta.</div>;

  const { data: deal } = await supabase.from("deals").select("*").eq("id", id).single();
  if (!deal) return notFound();

  const { data: prof } = await supabase.from("profiles").select("role, is_onboarded").eq("id", user.id).maybeSingle();
  const globalRole = String(prof?.role ?? "").toLowerCase();
  const isAdmin = globalRole === "admin" || globalRole === "equity_partner";

  const { data: accessRequest } = await supabase.from("deal_access_requests").select("*").eq("deal_id", deal.id).eq("user_id", user.id).maybeSingle();
  
  const isApproved = accessRequest?.status === "ACCESS_APPROVED";
  const hasAcknowledged = !!accessRequest?.acknowledged_at;
  const canViewDetails = isAdmin || isApproved;

  // MODAL DI INGAGGIO (L'OSTACOLO)
  const showEngagementModal = isApproved && !hasAcknowledged && !isAdmin;

  return (
    <div className="min-h-screen bg-white relative font-sans overflow-hidden">
      {/* Pattern Minerva Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] z-0" 
           style={{ backgroundImage: `linear-gradient(to right, #D4AF37 0.5px, transparent 0.5px), linear-gradient(to bottom, #D4AF37 0.5px, transparent 0.5px)`, backgroundSize: '100px 100px' }}>
      </div>

      {showEngagementModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#001220]/98 backdrop-blur-2xl p-6 text-center">
          <div className="max-w-2xl w-full bg-white rounded-[4rem] p-20 shadow-2xl border border-[#D4AF37]/40 relative">
            <div className="text-[#D4AF37] text-8xl mb-12">⚖️</div>
            <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter mb-8 leading-none">Presa di Coscienza <br/>e Ingaggio</h2>
            <p className="text-slate-500 text-base leading-relaxed mb-14 px-8 font-medium italic">
              Conferma di operare nel rispetto del <span className="font-black text-[#001220] underline decoration-[#D4AF37] decoration-4">Codice Etico Minerva Partners</span>. Ogni azione su questo dossier è tracciata.
            </p>
            <form action="/api/deals/acknowledge" method="POST">
              <input type="hidden" name="requestId" value={accessRequest.id} />
              <input type="hidden" name="dealId" value={deal.id} />
              <button type="submit" className="w-full bg-[#001220] text-white py-8 rounded-[2.5rem] font-black uppercase tracking-[0.5em] text-xs hover:bg-[#D4AF37] hover:text-black transition-all shadow-2xl active:scale-95">
                Accetto e Accedo ai Dati
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 pt-20 pb-40 relative z-10 space-y-20">
        <header className="flex flex-col gap-12 border-b-2 border-slate-100 pb-20">
          <Link href="/portal/deals" className="group flex items-center gap-4 text-[11px] uppercase tracking-[0.5em] text-slate-400 hover:text-[#D4AF37] font-black transition-all">
            <span className="group-hover:-translate-x-2 transition-transform">←</span> Torna al Marketplace
          </Link>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-5">
                <span className="bg-[#001220] text-[#D4AF37] text-[10px] font-black px-6 py-2.5 rounded-xl uppercase tracking-[0.3em] shadow-lg">
                  {deal.side}
                </span>
                <span className="text-slate-400 text-[11px] font-black uppercase tracking-[0.5em]">
                  {deal.sector}
                </span>
              </div>
              <h1 className="text-6xl md:text-8xl font-black text-[#001220] tracking-tighter uppercase leading-[0.85]">
                {deal.title}
              </h1>
            </div>

            {isApproved && accessRequest?.vdr_link && (
              <a href={accessRequest.vdr_link} target="_blank" className="bg-blue-600 text-white px-12 py-6 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.4em] hover:bg-blue-700 transition-all shadow-2xl flex items-center gap-4 group">
                📂 ACCEDI VDR <span className="group-hover:translate-x-1 transition-transform">→</span>
              </a>
            )}
          </div>
        </header>

        {!canViewDetails ? (
          <div className="bg-[#001220] rounded-[4rem] p-20 text-center border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px]" />
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter mb-6">Dossier Riservato</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed italic mb-10">
              L'analisi tecnica è protetta dal protocollo Minerva. Richiedi l'abilitazione per partecipare al deal.
            </p>
            <form action="/portal/access-requests/request" method="post" className="max-w-md mx-auto space-y-6">
              <input type="hidden" name="dealId" value={deal.id} />
              <input type="hidden" name="userId" value={user.id} />
              <button className="w-full rounded-[2rem] bg-white text-[#001220] font-black py-6 uppercase tracking-[0.3em] text-[11px] hover:bg-[#D4AF37] hover:text-black transition-all shadow-2xl">
                Richiedi Abilitazione Partner
              </button>
            </form>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-24">
            <div className="lg:col-span-2 space-y-24">
              <section>
                <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-[#D4AF37] mb-12 flex items-center gap-4">01 <span className="h-px w-12 bg-[#D4AF37]"></span> Executive Summary</h3>
                <div className="text-slate-700 text-2xl leading-relaxed font-medium tracking-tight">{deal.description}</div>
              </section>
              <section className="bg-slate-50 p-16 rounded-[4rem] border border-slate-100 shadow-inner">
                <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-slate-400 mb-12">Audit & Milestone Protocol</h3>
                <AuditTimeline dealId={deal.id} />
              </section>
              <section className="bg-[#001220] p-16 rounded-[4rem] shadow-2xl relative overflow-hidden">
                <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-[#D4AF37] mb-12">Data Room Istituzionale</h3>
                <Documents dealId={deal.id} />
              </section>
              {isAdmin && (
                <div className="space-y-16 pt-20 border-t-2 border-blue-50">
                  <section className="bg-blue-50/30 p-16 rounded-[4rem] border border-blue-100">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.6em] text-blue-600 mb-12">Economics & Allocations (Admin)</h3>
                    <Economics dealId={deal.id} />
                  </section>
                </div>
              )}
            </div>
            <aside className="space-y-12">
              <div className="bg-white p-14 rounded-[4rem] border border-slate-100 shadow-2xl space-y-12 sticky top-10">
                <h4 className="text-[12px] font-black uppercase tracking-[0.5em] text-slate-400 border-b pb-8">Financial Specs</h4>
                <Metric label="Enterprise Value" value={deal.ev_range} />
                <Metric label="Status" value={deal.status} isGold />
                <div className="pt-10 border-t border-slate-50">
                  <p className="text-[11px] text-slate-300 font-black uppercase tracking-[0.4em] leading-relaxed italic text-center">Protocollo Riservato</p>
                </div>
              </div>
            </aside>
          </div>
        )}

        <div className="pt-32 border-t-2 border-slate-100">
          <h2 className="text-5xl font-black text-[#001220] uppercase tracking-tighter mb-16">Discussione <span className="text-[#D4AF37]">Riservata</span></h2>
          <div className="bg-white rounded-[4rem] p-16 border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-3 h-full bg-[#D4AF37]" />
            <Comments dealId={deal.id} />
            {canViewDetails && (
              <div className="mt-16 pt-16 border-t-2 border-slate-50">
                <CommentBox dealId={deal.id} userId={user.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, isGold = false }: { label: string; value: any; isGold?: boolean }) {
  return (
    <div className="group">
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 group-hover:text-[#D4AF37] transition-colors">{label}</p>
      <p className={`text-3xl font-black uppercase tracking-tighter leading-none ${isGold ? "text-[#D4AF37]" : "text-[#001220]"}`}>{value || "—"}</p>
    </div>
  );
}