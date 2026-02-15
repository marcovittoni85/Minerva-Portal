import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";
import RequestAccessButton from "./RequestAccessButton";

export default async function BoardPage() {
  const supabase = await supabaseServer();

  const { data: userRes } = await supabase.auth.getUser();
  const email = userRes.user?.email ?? "";
  const uid = userRes.user?.id;

  if (!uid) return <div className="p-6">Non autenticato.</div>;

  // ruolo (per togliere richiesta accesso solo admin/equity)
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", uid)
    .maybeSingle();

  const role = (prof?.role as any)?.toString?.() ?? String(prof?.role ?? "");
  const isAdmin = role === "admin" || role === "equity_partner";

  const { data: deals, error } = await supabase.rpc("get_board_deals");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Bacheca (confermate)</h1>
          <p className="text-slate-600">Vista blind. ({email})</p>
        </div>
        <Link className="underline" href="/portal/deals">
          Vai alle mie operazioni
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error.message}
        </div>
      )}

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">Codice</th>
              <th className="text-left px-4 py-3">Titolo</th>
              <th className="text-left px-4 py-3">Stato</th>
              <th className="text-left px-4 py-3">Conf.</th>
              <th className="text-left px-4 py-3">Settore</th>
              <th className="text-left px-4 py-3">Geo</th>
              <th className="text-right px-4 py-3">Azione</th>
            </tr>
          </thead>
          <tbody>
            {(deals ?? []).map((d: any) => (
              <tr key={d.id} className="border-t">
                <td className="px-4 py-3">{d.code ?? "—"}</td>
                <td className="px-4 py-3 font-medium">{d.title ?? "—"}</td>
                <td className="px-4 py-3">{d.status ?? "—"}</td>
                <td className="px-4 py-3">{d.confidentiality ?? "—"}</td>
                <td className="px-4 py-3">{d.sector ?? "—"}</td>
                <td className="px-4 py-3">{d.geography ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  {isAdmin ? (
                    <span className="text-xs text-slate-500">Admin</span>
                  ) : (
                    <RequestAccessButton dealId={d.id} />
                  )}
                </td>
              </tr>
            ))}

            {(!deals || deals.length === 0) && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-slate-500">
                  Nessuna opportunità confermata visibile.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
