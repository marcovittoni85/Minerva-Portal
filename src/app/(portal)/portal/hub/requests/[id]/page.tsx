import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";

type ReqRow = {
  id: string;
  deal_id: string;
  requester_id: string;
  status: string;
  created_at: string;
  deals?: { code?: string | null; title?: string | null } | null;
  profiles?: { email?: string | null; role?: string | null } | null;
};

export default async function HubRequestsPage() {
  const supabase = await supabaseServer();

  // (A) leggi user e ruolo
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-red-600">Non autenticato.</div>
      </div>
    );
  }

  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (prof?.role !== "admin") {
    return (
      <div className="p-6 space-y-3">
        <Link href="/portal" className="underline">← Torna</Link>
        <div className="rounded-xl border bg-white p-4">
          Accesso riservato (solo Admin).
        </div>
      </div>
    );
  }

  // (B) richieste pending
  const { data, error } = await supabase
    .from("access_requests")
    .select("id, deal_id, requester_id, status, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as ReqRow[];

  // (C) arricchisci a mano (eviti join se non hai FK/relazioni in PostgREST)
  // prendi deal ids e user ids
  const dealIds = Array.from(new Set(rows.map((r) => r.deal_id)));
  const userIds = Array.from(new Set(rows.map((r) => r.requester_id)));

  const { data: deals } = await supabase
    .from("deals")
    .select("id, code, title")
    .in("id", dealIds);

  const { data: users } = await supabase
    .from("profiles")
    .select("id, email, role")
    .in("id", userIds);

  const dealMap = new Map((deals ?? []).map((d: any) => [d.id, d]));
  const userMap = new Map((users ?? []).map((u: any) => [u.id, u]));

  const enriched = rows.map((r) => ({
    ...r,
    deals: dealMap.get(r.deal_id) ?? null,
    profiles: userMap.get(r.requester_id) ?? null,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Minerva Hub — Richieste Accesso</h1>
          <p className="text-slate-600">Approva o rifiuta l’accesso alle opportunità.</p>
        </div>
        <Link href="/portal/deals" className="underline">Vai alle opportunità</Link>
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
              <th className="px-4 py-3 text-left">Deal</th>
              <th className="px-4 py-3 text-left">Richiedente</th>
              <th className="px-4 py-3 text-left">Ruolo</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-right">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {enriched.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">
                  <div className="font-medium">
                    {(r.deals?.code ?? "—") + " — " + (r.deals?.title ?? "—")}
                  </div>
                  <div className="text-xs text-slate-500">{r.deal_id}</div>
                </td>

                <td className="px-4 py-3">
                  <div>{r.profiles?.email ?? r.requester_id}</div>
                  <div className="text-xs text-slate-500">{r.requester_id}</div>
                </td>

                <td className="px-4 py-3">{r.profiles?.role ?? "—"}</td>

                <td className="px-4 py-3">
                  {new Date(r.created_at).toLocaleString("it-IT")}
                </td>

                <td className="px-4 py-3 text-right space-x-3">
                  <form
                    action={`/portal/hub/requests/${r.id}/approve`}
                    method="post"
                    className="inline"
                  >
                    <button className="underline text-emerald-700 hover:text-emerald-800">
                      Approva
                    </button>
                  </form>

                  <form
                    action={`/portal/hub/requests/${r.id}/reject`}
                    method="post"
                    className="inline"
                  >
                    <button className="underline text-red-700 hover:text-red-800">
                      Rifiuta
                    </button>
                  </form>
                </td>
              </tr>
            ))}

            {enriched.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-slate-500">
                  Nessuna richiesta pending.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
