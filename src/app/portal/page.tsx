"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import Link from "next/link";
import Image from "next/image";
import { Briefcase, Clock, CheckCircle, Calendar, TrendingUp, ArrowRight, PlusCircle, ClipboardList, Settings } from "lucide-react";

interface Deal {
  id: string;
  title: string;
  sector: string;
  ev_range: string;
  side: string;
  description: string;
  created_at: string;
}

interface AccessRequest {
  id: string;
  deal_id: string;
  status: string;
  created_at: string;
  deals: { title: string; sector: string } | null;
}

// Placeholder events
const placeholderEvents = [
  {
    id: "evt-1",
    title: "Minerva Partners Annual Meeting",
    date: "2026-03-15T10:00:00",
    location: "Milano, Palazzo Mezzanotte",
    description: "Incontro annuale con presentazione pipeline Q2 e networking esclusivo.",
    link: "#",
  },
  {
    id: "evt-2",
    title: "Deal Review — Healthcare Portfolio",
    date: "2026-03-28T14:30:00",
    location: "Virtual (Zoom)",
    description: "Review trimestrale sugli investimenti Healthcare con il team advisory.",
    link: "#",
  },
];

// Placeholder stories
const placeholderStories = [
  {
    id: "str-1",
    title: "Investimento in Clinica San Marco",
    category: "Healthcare",
    summary: "La clinica ha registrato una crescita del 25% YoY dopo la ristrutturazione operativa. Il piano di espansione verso il Veneto è stato approvato dal CdA.",
    date: "2026-02-10",
    trend: "up" as const,
  },
  {
    id: "str-2",
    title: "Progetto Residenze Lago di Como",
    category: "Real Estate",
    summary: "Pre-vendita completata al 78% in 3 mesi. Il rendimento atteso è stato rivisto al rialzo dal 12% al 15.5% IRR.",
    date: "2026-02-08",
    trend: "up" as const,
  },
  {
    id: "str-3",
    title: "Acquisizione LogiTech Solutions",
    category: "M&A",
    summary: "Integrazione post-merger in fase avanzata. Sinergie di costo realizzate al 60%, in linea con il business plan presentato ai partner.",
    date: "2026-02-05",
    trend: "up" as const,
  },
];

export default function DashboardPage() {
  const supabase = createClient();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [approvedDeals, setApprovedDeals] = useState<Deal[]>([]);
  const [pendingRequests, setPendingRequests] = useState<AccessRequest[]>([]);
  const [latestDeals, setLatestDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from("profiles").select("full_name, role").eq("id", user.id).single();
      setName(profile?.full_name || "Partner");
      setRole(profile?.role || "");

      const { data: accessRows } = await supabase
        .from("deal_access")
        .select("deal_id")
        .eq("user_id", user.id);

      if (accessRows && accessRows.length > 0) {
        const dealIds = accessRows.map(r => r.deal_id);
        const { data: deals } = await supabase
          .from("deals")
          .select("id, title, sector, ev_range, side, description, created_at")
          .in("id", dealIds)
          .order("created_at", { ascending: false })
          .limit(4);
        setApprovedDeals(deals || []);
      }

      const { data: pending } = await supabase
        .from("deal_access_requests")
        .select("id, deal_id, status, created_at, deals:deal_id(title, sector)")
        .eq("user_id", user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(5);
      setPendingRequests((pending as any) || []);

      const { data: latest } = await supabase.rpc("get_board_deals");
      setLatestDeals((latest || []).slice(0, 3));

      setLoading(false);
    }
    load();
  }, []);

  const isAdmin = role === "admin" || role === "equity_partner";

  const formatEventDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const formatStoryDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
  };

  const daysUntilEvent = (dateStr: string) => {
    const now = new Date();
    const event = new Date(dateStr);
    const diff = Math.ceil((event.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "Oggi";
    if (diff === 1) return "Domani";
    return `Tra ${diff} giorni`;
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-slate-100 rounded-2xl" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <div key={i} className="h-24 bg-slate-50 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Hero Banner */}
      <div className="relative rounded-2xl overflow-hidden mb-10">
        <div className="absolute inset-0">
          <Image
            src="/dashboard-hero.webp"
            alt="Minerva Partners"
            fill
            className="object-cover object-center"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/30" />
        </div>
        <div className="relative z-10 px-8 py-12 md:py-16">
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Minerva Partners</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white">Bentornato, <span className="text-[#D4AF37]">{name}</span></h1>
          <p className="text-white/60 text-sm mt-2 max-w-md">Ecco cosa sta succedendo nel tuo network</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Deal Attivi</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{approvedDeals.length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">In Attesa</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{pendingRequests.length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-4 h-4 text-blue-500" />
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Prossimi Eventi</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{placeholderEvents.length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-4 h-4 text-[#D4AF37]" />
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Nuove Opportunita</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{latestDeals.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Approved Deals */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 text-lg font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                I Tuoi Deal
              </h2>
              <Link href="/portal/my-deals" className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold hover:text-[#b8962d] transition-colors">Vedi tutti →</Link>
            </div>
            {approvedDeals.length === 0 ? (
              <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center">
                <p className="text-slate-400 text-sm mb-3">Non hai ancora deal attivi</p>
                <Link href="/portal/board" className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold">Esplora la Bacheca →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {approvedDeals.map((deal) => (
                  <Link key={deal.id} href={"/portal/deals/" + deal.id} className="group bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/40 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">Attivo</span>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">{deal.side}</span>
                    </div>
                    <h3 className="text-slate-900 text-sm font-bold mb-1 group-hover:text-[#D4AF37] transition-colors">{deal.title}</h3>
                    <p className="text-slate-400 text-xs">{deal.sector} • {deal.ev_range || "N/A"}</p>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Pending Requests */}
          {pendingRequests.length > 0 && (
            <section>
              <h2 className="text-slate-900 text-lg font-bold flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-amber-500" />
                Richieste in Attesa
              </h2>
              <div className="space-y-3">
                {pendingRequests.map((req) => (
                  <div key={req.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <div>
                        <p className="text-slate-900 text-sm font-medium">{(req.deals as any)?.title || "Deal"}</p>
                        <p className="text-slate-400 text-[10px] mt-0.5">{new Date(req.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short" })}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200">Pending</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Latest Opportunities */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-slate-900 text-lg font-bold flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                Ultime Opportunita
              </h2>
              <Link href="/portal/board" className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-bold hover:text-[#b8962d] transition-colors">Bacheca completa →</Link>
            </div>
            <div className="space-y-3">
              {latestDeals.map((deal) => (
                <Link key={deal.id} href={"/portal/deals/" + deal.id} className="group bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between hover:shadow-md hover:border-[#D4AF37]/30 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-slate-900 text-sm font-bold group-hover:text-[#D4AF37] transition-colors">{deal.title}</h3>
                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">{deal.side}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{deal.sector} • {deal.ev_range || "N/A"}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#D4AF37] transition-colors" />
                </Link>
              ))}
              {latestDeals.length === 0 && (
                <div className="bg-white border border-slate-100 rounded-xl p-6 text-center text-slate-400 text-sm">Nessuna nuova opportunita</div>
              )}
            </div>
          </section>

          {/* Network Stories */}
          <section>
            <h2 className="text-slate-900 text-lg font-bold flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Dal Network
            </h2>

            <div className="relative rounded-2xl overflow-hidden mb-5">
              <div className="aspect-[21/9] relative">
                <Image
                  src="/dashboard-network.webp"
                  alt="Minerva Network"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-transparent to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold mb-1">Aggiornamenti dal Network</p>
                  <p className="text-white text-sm font-medium">Le ultime novita sugli investimenti della community</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {placeholderStories.map((story) => (
                <div key={story.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">{story.category}</span>
                    <span className="text-[10px] text-slate-400">{formatStoryDate(story.date)}</span>
                  </div>
                  <h3 className="text-slate-900 text-sm font-bold mb-2">{story.title}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{story.summary}</p>
                  {story.trend === "up" && (
                    <div className="flex items-center gap-1 mt-3">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Performance positiva</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right column */}
        <div className="space-y-8">

          {/* Network Events */}
          <section>
            <h2 className="text-slate-900 text-lg font-bold flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-blue-500" />
              Prossimi Eventi
            </h2>

            <div className="relative rounded-2xl overflow-hidden mb-5">
              <div className="aspect-[4/3] relative">
                <Image
                  src="/dashboard-events.webp"
                  alt="Minerva Events"
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-[9px] uppercase tracking-widest text-[#D4AF37] font-bold mb-1">Prossimo Evento</p>
                  <p className="text-white text-sm font-bold">{placeholderEvents[0]?.title}</p>
                  <p className="text-white/60 text-xs mt-1">{formatEventDate(placeholderEvents[0]?.date)}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {placeholderEvents.map((event) => (
                <div key={event.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                      {daysUntilEvent(event.date)}
                    </span>
                  </div>
                  <h3 className="text-slate-900 text-sm font-bold mb-1">{event.title}</h3>
                  <p className="text-slate-400 text-xs mb-2">{formatEventDate(event.date)}</p>
                  <p className="text-slate-400 text-[10px] uppercase tracking-wider mb-3">{event.location}</p>
                  <p className="text-slate-500 text-xs leading-relaxed">{event.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Quick Actions */}
          <section>
            <p className="text-slate-400 text-[9px] uppercase tracking-widest font-bold mb-3">Azioni Rapide</p>
            <div className="space-y-2">
              <Link href="/portal/board" className="group flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-[#D4AF37]/30 transition-all">
                <Briefcase className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-slate-900 text-xs font-bold group-hover:text-[#D4AF37] transition-colors">Bacheca Deal</span>
              </Link>
              <Link href="/portal/propose-deal" className="group flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-[#D4AF37]/30 transition-all">
                <PlusCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-900 text-xs font-bold group-hover:text-[#D4AF37] transition-colors">Proponi Deal</span>
              </Link>
              <Link href="/portal/settings" className="group flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-[#D4AF37]/30 transition-all">
                <Settings className="w-4 h-4 text-slate-400" />
                <span className="text-slate-900 text-xs font-bold group-hover:text-[#D4AF37] transition-colors">Impostazioni</span>
              </Link>
              {isAdmin && (
                <Link href="/portal/access-requests" className="group flex items-center gap-3 bg-white border border-slate-100 rounded-xl p-4 hover:shadow-md hover:border-[#D4AF37]/30 transition-all">
                  <ClipboardList className="w-4 h-4 text-[#D4AF37]" />
                  <span className="text-slate-900 text-xs font-bold group-hover:text-[#D4AF37] transition-colors">Richieste Accesso</span>
                </Link>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
