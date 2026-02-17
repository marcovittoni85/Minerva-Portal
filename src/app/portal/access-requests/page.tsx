import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AccessRequestsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  if (profile?.role !== "admin" && profile?.role !== "equity_partner") redirect("/portal");

  // Richieste pendenti
  const { data: pending } = await supabase
    .from("deal_access_requests")
    .select("id, status, created_at, reason, user_id, deal_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // Storico (approvate + rifiutate)
  const { data: history } = await supabase
    .from("deal_access_requests")
    .select("id, status, created_at, reason, user_id, deal_id, decided_at")
    .neq("status", "pending")
    .order("decided_at", { ascending: false })
    .limit(50);

  const allUserIds = [...new Set([...(pending ?? []).map(r => r.user_id), ...(history ?? []).map(r => r.user_id)])];
  const allDealIds = [...new Set([...(pending ?? []).map(r => r.deal_id), ...(history ?? []).map(r => r.deal_id)])];

  const { data: profiles } = allUserIds.length > 0
    ? await supabase.from("profiles").select("id, full_name").in("id", allUserIds)
    : { data: [] };

  const { data: deals } = allDealIds.length > 0
    ? await supabase.from("deals").select("id, title").in("id", allDealIds)
    : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]));
  const dealMap = Object.fromEntries((deals ?? []).map(d => [d.id, d.title]));

  return (
    <div className="min-h-screen bg-[#001220] pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <header className="mb-10 pb-8 border-b border-white/10">
          <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-3">Amministrazione</p>
          <h1 className="text-3xl font-light text-white">Richieste <span className="text-[#D4AF37]">Accesso</span></h1>
        </header>

        {/* PENDENTI */}
        <div className="mb-12">
          <h2 className="text-white text-lg font-light mb-4">Pendenti <span className="text-slate-500 text-sm">({pending?.length || 0})</span></h2>
          <div className="space-y-4">
            {!pending || pending.length === 0 ? (
              <div className="bg-[#001c30] border border-white/5 rounded-xl p-8 text-center text-slate-600 text-sm">Nessuna richiesta pendente</div>
            ) : (
              pending.map((req) => (
                <div key={req.id} className="bg-[#001c30] border border-white/5 rounded-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-white font-light text-lg">{profileMap[req.user_id] || "Partner"}</span>
                        <span className="text-[9px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded uppercase tracking-wider">{dealMap[req.deal_id] || "Deal"}</span>
                      </div>
                      <p className="text-slate-500 text-xs">{new Date(req.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      {req.reason && (
                        <p className="mt-3 text-slate-400 text-sm bg-white/5 p-3 rounded-lg border border-white/5 italic">{req.reason}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <form action="/portal/access-requests/approve" method="POST">
                        <input type="hidden" name="requestId" value={req.id} />
                        <button className="bg-[#D4AF37] text-[#001220] px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#FBE8A6] transition-colors">Approva</button>
                      </form>
                      <form action="/portal/access-requests/rejects" method="POST">
                        <input type="hidden" name="requestId" value={req.id} />
                        <button className="border border-red-500/20 text-red-400 px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-red-500/10 transition-colors">Rifiuta</button>
                      </form>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* STORICO */}
        <div>
          <h2 className="text-white text-lg font-light mb-4">Storico <span className="text-slate-500 text-sm">({history?.length || 0})</span></h2>
          <div className="space-y-3">
            {!history || history.length === 0 ? (
              <div className="bg-[#001c30] border border-white/5 rounded-xl p-8 text-center text-slate-600 text-sm">Nessuna decisione registrata</div>
            ) : (
              history.map((req) => {
                const isApproved = req.status === "ACCESS_APPROVED";
                return (
                  <div key={req.id} className="bg-[#001c30]/50 border border-white/5 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className={"w-2 h-2 rounded-full " + (isApproved ? "bg-green-400" : "bg-red-400")} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm">{profileMap[req.user_id] || "Partner"}</span>
                          <span className="text-slate-600 text-xs">→</span>
                          <span className="text-slate-400 text-xs">{dealMap[req.deal_id] || "Deal"}</span>
                        </div>
                        <p className="text-slate-600 text-[10px] mt-1">
                          {req.decided_at ? new Date(req.decided_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : new Date(req.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <span className={"text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg " + (isApproved ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10")}>
                      {isApproved ? "Approvata" : "Rifiutata"}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}