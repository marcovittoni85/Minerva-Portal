import { supabaseServer } from "@/lib/supabase-server";

export default async function NotificationsPage() {
  const supabase = await supabaseServer();

  const { data: me } = await supabase.auth.getUser();
  const uid = me.user?.id;
  if (!uid) return <div className="p-6">Non autenticato.</div>;

  const { data: notifs, error } = await supabase
    .from("notifications")
    .select("id, type, title, body, data, is_read, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  // best-effort mark as read (non bloccare la pagina se fallisce)
  const { error: updErr } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Notifiche</h1>
        <p className="text-slate-600">Aggiornamenti e richieste.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
          {error.message}
        </div>
      )}

      {updErr && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-800">
          Non riesco a marcarle come lette (RLS): {updErr.message}
        </div>
      )}

      <div className="space-y-3">
        {(notifs ?? []).map((n: any) => (
          <div key={n.id} className="rounded-2xl border bg-white p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="font-semibold">{n.title ?? n.type}</div>
              <div className="text-xs text-slate-500">
                {n.created_at ? new Date(n.created_at).toLocaleString() : ""}
              </div>
            </div>
            {n.body && <div className="mt-2 text-sm text-slate-700">{n.body}</div>}
          </div>
        ))}

        {(!notifs || notifs.length === 0) && (
          <div className="rounded-2xl border bg-white p-6 text-slate-600">
            Nessuna notifica.
          </div>
        )}
      </div>
    </div>
  );
}
