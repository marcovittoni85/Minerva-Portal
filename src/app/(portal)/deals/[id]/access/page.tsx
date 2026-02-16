import Link from "next/link";
import { supabaseServer } from "@/lib/supabase-server";

export default async function AccessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();

  const { data: deal } = await supabase.from("deals").select("id,code,title").eq("id", id).single();
  const { data: rows } = await supabase
    .from("deal_access")
    .select("user_id, access_level, can_comment, can_upload, can_edit_deal, can_invite")
    .eq("deal_id", id)
    .order("user_id");

  return (
    <div className="p-6 space-y-6">
      <Link className="underline" href={`/portal/deals/${id}`}>← Torna al deal</Link>

      <div className="rounded-2xl border bg-white p-6">
        <div className="text-xs text-slate-500">{deal?.code}</div>
        <h1 className="text-2xl font-semibold">Accessi</h1>

        <div className="mt-4 space-y-2 text-sm">
          {(rows ?? []).map((r) => (
            <div key={r.user_id} className="border rounded-xl p-3">
              <div className="font-mono text-xs">{r.user_id}</div>
              <div className="mt-2">level: {r.access_level}</div>
              <div className="mt-1 text-xs text-slate-500">
                comment:{String(r.can_comment)} upload:{String(r.can_upload)} edit:{String(r.can_edit_deal)} invite:{String(r.can_invite)}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-slate-500 text-sm">
          Inserimento/Update accessi: lo facciamo nello step successivo con un form (server action) per evitare errori.
        </p>
      </div>
    </div>
  );
}
