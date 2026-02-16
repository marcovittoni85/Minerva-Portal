import { supabaseServer } from "@/lib/supabase-server";

export default async function HubRequestsPage() {
  const supabase = await supabaseServer();

  const { data, error } = await supabase
    .from("access_requests")
    .select(`
      id,
      deal_id,
      requester_id,
      status,
      deals (title, code),
      profiles (email)
    `)
    .eq("status", "pending");

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Richieste Accesso</h1>

      {error && (
        <div className="text-red-600">{error.message}</div>
      )}

      <div className="rounded-2xl border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-4 py-3 text-left">Deal</th>
              <th className="px-4 py-3 text-left">Utente</th>
              <th className="px-4 py-3 text-left">Azioni</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((r: any) => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-3">
                  {r.deals?.code} - {r.deals?.title}
                </td>
                <td className="px-4 py-3">
                  {r.profiles?.email ?? r.requester_id}
                </td>
                <td className="px-4 py-3 space-x-3">
                  <form action={`/portal/hub/requests/${r.id}/approve`} method="post" className="inline">
                    <button className="underline text-green-600">
                      Approva
                    </button>
                  </form>

                  <form action={`/portal/hub/requests/${r.id}/reject`} method="post" className="inline">
                    <button className="underline text-red-600">
                      Rifiuta
                    </button>
                  </form>
                </td>
              </tr>
            ))}

            {(!data || data.length === 0) && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-slate-500">
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
