import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import RequestAccessButton from "./RequestAccessButton";

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
            <p className="text-slate-500 text-xs mt-2 tracking-wide">{isAdmin ? "Vista Admin" : "Vista blind"}</p>
          </div>
          {isAdmin && (
            <Link href="/portal/access-requests" className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] border border-[#D4AF37]/20 px-5 py-2.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors">Richieste Pendenti</Link>
          )}
        </header>

        {error && <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm">{error.message}</div>}

        <div className="mt-8 space-y-4">
          {(deals ?? []).map((d: any) => (
            <div key={d.id} className="bg-[#001c30]/80 border border-white/5 rounded-xl p-6 hover:border-[#D4AF37]/20 transition-all">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <Link href={"/portal/deals/" + d.id} className="flex-1 group">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#D4AF37] bg-[#D4AF37]/10 px-3 py-1 rounded">{d.side || "OP"}</span>
                    <span className="text-[9px] text-slate-600 tracking-wider">{d.code}</span>
                    <span className="text-[9px] text-slate-600">{d.sector}</span>
                    <span className="text-[9px] text-slate-600">{d.geography}</span>
                  </div>
                  <h3 className="text-white font-light group-hover:text-[#D4AF37] transition-colors">{d.title}</h3>
                </Link>
                <RequestAccessButton dealId={d.id} isAdmin={isAdmin} />
              </div>
            </div>
          ))}

          {(!deals || deals.length === 0) && (
            <div className="text-center py-10 text-slate-600">Nessuna opportunita disponibile.</div>
          )}
        </div>
      </div>
    </div>
  );
}