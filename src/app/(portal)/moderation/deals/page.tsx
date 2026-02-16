import { supabaseServer } from "@/lib/supabase-server";

export default async function DealModerationPage() {
  const supabase = await supabaseServer();
  const { data: me } = await supabase.auth.getUser();

  // Controllo Ruolo (Admin/Equity Partner)
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", me.user?.id)
    .maybeSingle();

  if (prof?.role !== "admin" && prof?.role !== "equity_partner") {
    return <div className="p-6">Accesso negato.</div>;
  }

  // Azione per approvare il DEAL
  async function approveDeal(formData: FormData) {
    "use server";
    const id = String(formData.get("id") ?? "");
    const supabase = await supabaseServer();
    await supabase.from("deals").update({ is_confirmed: true }).eq("id", id);
  }

  // Recupero deal non confermati
  const { data: rows } = await supabase
    .from("deals")
    .select("id, code, internal_title_real, created_at")
    .eq("is_confirmed", false)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Approvazione Deal</h1>
      <div className="space-y-3">
        {(rows ?? []).map((d) => (
          <div key={d.id} className="p-4 bg-white border rounded-2xl flex justify-between items-center shadow-sm">
            <div>
              <div className="text-xs font-mono text-slate-500">{d.code || "NO-CODE"}</div>
              <div className="font-semibold text-slate-900">{d.internal_title_real}</div>
            </div>
            <form action={approveDeal}>
              <input type="hidden" name="id" value={d.id} />
              <button className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700">
                Approva e Pubblica
              </button>
            </form>
          </div>
        ))}
        {(!rows || rows.length === 0) && <p className="text-slate-500">Nessun deal da approvare.</p>}
      </div>
    </div>
  );
}