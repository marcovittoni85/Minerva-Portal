import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import RequestAccessButton from "./RequestAccessButton";

export default async function BoardPage() {
  const supabase = await supabaseServer();

  const { data: userRes } = await supabase.auth.getUser();
  const email = userRes.user?.email ?? "";
  const uid = userRes.user?.id;

  if (!uid) return <div className="p-6 text-slate-400">Non autenticato.</div>;

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle();

  const role = (prof?.role as any)?.toString?.() ?? String(prof?.role ?? "");
  const isAdmin = role === "admin" || role === "equity_partner";

  const { data: deals, error } = await supabase.rpc("get_board_deals");

  return (
    <div className="min-h-screen bg-[#001220] pb-20">
      <div className="max-w-6xl mx-auto px-6 pt-12">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-10 border-b border-white/10">
          <div>
            <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-3">Minerva Partners</p>
            <h1 className="text-3xl font-light text-white tracking-tight">
              Opportunità <span className="text-[#D4AF37]">Riservate</span>
            </h1>
            <p className="text-slate-500 text-xs mt-2 tracking-wide">Vista blind • {email}</p>
          </div>
          <Link
            href="/portal/deals"
            className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] border border-[#D4AF37]/20 px-5 py-2.5 rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
          >
            Catalogo Operazioni →
          </Link>
        </header>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-400 text-sm">
            {error.message}
          </div>
        )}

        {/* Table */}
        <div className="mt-8 rounded-xl border border-white/5 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#001c30] text-[9px] uppercase tracking-[0.2em]">
                <th className="text-left px-5 py-4 text-[#D4AF37] font-medium">Codice</th>
                <th className="text-left px-5 py-4 text-[#D4AF37] font-medium">Operazione</th>
                <th className="text-left px-5 py-4 text-[#D4AF37] font-medium">Settore</th>
                <th className="text-left px-5 py-4 text-[#D4AF37] font-medium">Geografia</th>
                <th className="text-left px-5 py-4 text-[#D4AF37] font-medium">Livello</th>
                <th className="text-right px-5 py-4 text-[#D4AF37] font-medium">Azione</th>
              </tr>
            </thead>
            <tbody>
              {(deals ?? []).map((d: any, i: number) => (
                <tr
                  key={d.id}
                  className={`border-t border-white/5 hover:bg-[#D4AF37]/5 transition-colors ${
                    i % 2 === 0 ? "bg-[#001220]" : "bg-[#001c30]/30"
                  }`}
                >
                  <td className="px-5 py-4 text-slate-500 text-xs tracking-wider">{d.code ?? "—"}</td>
                  <td className="px-5 py-4 text-white font-light">{d.title ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{d.sector ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-400 text-xs">{d.geography ?? "—"}</td>
                  <td className="px-5 py-4">
                    <span className="text-[9px] uppercase tracking-wider text-slate-500 bg-white/5 px-2.5 py-1 rounded">
                      {d.confidentiality ?? "blind"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {isAdmin ? (
                      <span className="text-[9px] text-slate-600 uppercase tracking-wider">Admin</span>
                    ) : (
                      <RequestAccessButton dealId={d.id} />
                    )}
                  </td>
                </tr>
              ))}

              {(!deals || deals.length === 0) && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-600 text-sm">
                    Nessuna opportunità confermata al momento.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[8px] uppercase tracking-[0.4em] text-slate-600">
            Minerva Partners • Private & Confidential
          </p>
        </div>
      </div>
    </div>
  );
}
