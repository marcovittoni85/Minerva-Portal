import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import RequestAccessButton from "./RequestAccessButton";

const sectorColors: Record<string, string> = {
  "Real Estate": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "M&A": "bg-blue-50 text-blue-700 border-blue-200",
  "Healthcare": "bg-rose-50 text-rose-700 border-rose-200",
  "Energy": "bg-amber-50 text-amber-700 border-amber-200",
  "Capital Markets": "bg-purple-50 text-purple-700 border-purple-200",
  "Banking & Credit": "bg-cyan-50 text-cyan-700 border-cyan-200",
  "DEBT": "bg-orange-50 text-orange-700 border-orange-200",
};

function getSectorStyle(sector: string) {
  return sectorColors[sector] || "bg-slate-50 text-slate-600 border-slate-200";
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
    <div className="p-8 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-10 pb-8 border-b border-slate-100">
        <div>
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Minerva Partners</p>
          <h1 className="text-3xl font-bold text-slate-900">Opportunita <span className="text-[#D4AF37]">Riservate</span></h1>
          <p className="text-slate-500 text-sm mt-2">{deals?.length || 0} operazioni disponibili</p>
        </div>
        {isAdmin && (
          <Link href="/portal/access-requests" className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] border border-[#D4AF37]/30 px-5 py-2.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors">Richieste Pendenti</Link>
        )}
      </header>

      {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-600 text-sm">{error.message}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {(deals ?? []).map((d: any) => (
          <div key={d.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-[#D4AF37]/40 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap gap-2">
                {(d.sector || "Altro").split(" & ").map((s: string) => (
                  <span key={s} className={"text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg border " + getSectorStyle(s.trim())}>
                    {s.trim()}
                  </span>
                ))}
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">{d.side}</span>
            </div>

            <Link href={"/portal/deals/" + d.id} className="group">
              <h3 className="text-slate-900 text-lg font-bold leading-snug mb-2 group-hover:text-[#D4AF37] transition-colors">{d.title}</h3>
            </Link>

            <p className="text-slate-500 text-sm leading-relaxed mb-4">{d.description || "Dettagli riservati"}</p>

            <div className="flex items-end justify-between pt-4 border-t border-slate-50">
              <div className="flex gap-6">
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">EV Range</p>
                  <p className="text-slate-900 text-sm font-bold">{d.ev_range || "Riservato"}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Area</p>
                  <p className="text-slate-900 text-sm font-bold">{d.geography || "Italia"}</p>
                </div>
              </div>
              <RequestAccessButton dealId={d.id} isAdmin={isAdmin} />
            </div>
          </div>
        ))}

        {(!deals || deals.length === 0) && (
          <div className="col-span-2 text-center py-16 text-slate-400">Nessuna opportunita disponibile.</div>
        )}
      </div>
    </div>
  );
}