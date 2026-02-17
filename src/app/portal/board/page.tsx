import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import RequestAccessButton from "./RequestAccessButton";

const sectorColors: Record<string, string> = {
  "Real Estate": "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  "M&A": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Healthcare": "bg-rose-500/10 text-rose-400 border-rose-500/20",
  "Energy": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Capital Markets": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "Banking & Credit": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "DEBT": "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

function getSectorStyle(sector: string) {
  return sectorColors[sector] || "bg-white/5 text-slate-400 border-white/10";
}

export default async function BoardPage() {
  const supabase = await supabaseServer();
  const { data: userRes } = await supabase.auth.getUser();
  const uid = userRes.user?.id;

  if (!uid) return <div className="p-6 text-slate-400">Non autenticato.</div>;

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", uid).maybeSingle();
  const role = String(prof?.role ?? "");
  const isAdmin = role === "admin" || role === "equity_partner";

  const { data: deals, error } = await supabase.rpc("get_board_deals");

  return (
    <div className="min-h-screen bg-[#001220] pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-10 border-b border-white/10">
          <div>
            <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-3">Minerva Partners</p>
            <h1 className="text-3xl font-light text-white tracking-tight">Opportunita <span className="text-[#D4AF37]">Riservate</span></h1>
            <p className="text-slate-500 text-sm mt-2">{deals?.length || 0} operazioni disponibili</p>
          </div>
          {isAdmin && (
            <Link href="/portal/access-requests" className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] border border-[#D4AF37]/20 px-5 py-2.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors">Richieste Pendenti</Link>
          )}
        </header>

        {error && <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm">{error.message}</div>}

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          {(deals ?? []).map((d: any) => (
            <div key={d.id} className="bg-[#001c30] border border-white/5 rounded-xl p-6 hover:border-[#D4AF37]/20 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-wrap gap-2">
                  {(d.sector || "Altro").split(" & ").map((s: string) => (
                    <span key={s} className={"text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-lg border " + getSectorStyle(s.trim())}>
                      {s.trim()}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{d.side}</span>
              </div>

              <Link href={"/portal/deals/" + d.id} className="group">
                <h3 className="text-white text-lg font-medium leading-snug mb-2 group-hover:text-[#D4AF37] transition-colors">{d.title}</h3>
              </Link>

              <p className="text-slate-400 text-sm leading-relaxed mb-4">{d.description || "Dettagli riservati"}</p>

              <div className="flex items-end justify-between pt-4 border-t border-white/5">
                <div className="flex gap-6">
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1">EV Range</p>
                    <p className="text-white text-sm font-medium">{d.ev_range || "Riservato"}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest text-slate-600 mb-1">Area</p>
                    <p className="text-white text-sm font-medium">{d.geography || "Italia"}</p>
                  </div>
                </div>
                <RequestAccessButton dealId={d.id} isAdmin={isAdmin} />
              </div>
            </div>
          ))}

          {(!deals || deals.length === 0) && (
            <div className="col-span-2 text-center py-16 text-slate-600">Nessuna opportunita disponibile.</div>
          )}
        </div>
      </div>
    </div>
  );
}