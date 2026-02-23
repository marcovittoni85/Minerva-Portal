import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AccessRequestsPage() {
  const supabase = await supabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = profile?.role || "";
  const isAdmin = role === "admin" || role === "equity_partner";

  // Check if user is originator of any deal
  const { data: originatedDeals } = await supabase.from("deals").select("id, title").eq("originator_id", user.id).eq("active", true);
  const isOriginator = (originatedDeals ?? []).length > 0;

  // If not admin and not originator, redirect
  if (!isAdmin && !isOriginator) redirect("/portal");

  const originatedDealIds = (originatedDeals ?? []).map(d => d.id);

  // Pending requests: admin sees all, originator sees only their deals
  let pendingQuery = supabase.from("deal_access_requests").select("id, status, created_at, reason, user_id, deal_id").eq("status", "pending").order("created_at", { ascending: false });
  if (!isAdmin) {
    pendingQuery = pendingQuery.in("deal_id", originatedDealIds);
  }
  const { data: pending } = await pendingQuery;

  // History: same logic
  let historyQuery = supabase.from("deal_access_requests").select("id, status, created_at, reason, user_id, deal_id, decided_at").neq("status", "pending").order("decided_at", { ascending: false }).limit(50);
  if (!isAdmin) {
    historyQuery = historyQuery.in("deal_id", originatedDealIds);
  }
  const { data: history } = await historyQuery;

  const allUserIds = [...new Set([...(pending ?? []).map(r => r.user_id), ...(history ?? []).map(r => r.user_id)])];
  const allDealIds = [...new Set([...(pending ?? []).map(r => r.deal_id), ...(history ?? []).map(r => r.deal_id)])];

  const { data: profiles } = allUserIds.length > 0 ? await supabase.from("profiles").select("id, full_name").in("id", allUserIds) : { data: [] };
  const { data: deals } = allDealIds.length > 0 ? await supabase.from("deals").select("id, title").in("id", allDealIds) : { data: [] };

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.full_name]));
  const dealMap = Object.fromEntries((deals ?? []).map(d => [d.id, d.title]));

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <header className="mb-10 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">{isAdmin ? "Amministrazione" : "I Tuoi Deal"}</p>
        <h1 className="text-3xl font-bold text-slate-900">Richieste <span className="text-[#D4AF37]">Accesso</span></h1>
        <p className="text-slate-500 text-sm mt-2">{isAdmin ? "Tutte le richieste di accesso ai deal" : "Richieste di accesso ai deal che hai originato"}</p>
      </header>

      <div className="mb-12">
        <h2 className="text-slate-900 text-lg font-bold mb-4">Pendenti <span className="text-slate-400 text-sm font-normal">({pending?.length || 0})</span></h2>
        <div className="space-y-4">
          {!pending || pending.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-sm">Nessuna richiesta pendente</div>
          ) : (
            pending.map((req) => (
              <div key={req.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-slate-900 font-bold text-lg">{profileMap[req.user_id] || "Partner"}</span>
                      <span className="text-[9px] text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-1 rounded uppercase tracking-wider font-bold">{dealMap[req.deal_id] || "Deal"}</span>
                    </div>
                    <p className="text-slate-400 text-xs">{new Date(req.created_at).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    {req.reason && (
                      <p className="mt-3 text-slate-600 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 italic">{req.reason}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <form action="/portal/access-requests/approve" method="POST">
                      <input type="hidden" name="requestId" value={req.id} />
                      <button className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors">Approva</button>
                    </form>
                    <form action="/portal/access-requests/rejects" method="POST">
                      <input type="hidden" name="requestId" value={req.id} />
                      <button className="border border-red-200 text-red-500 px-6 py-2.5 rounded-lg text-[10px] font-bold tracking-widest uppercase hover:bg-red-50 transition-colors">Rifiuta</button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2 className="text-slate-900 text-lg font-bold mb-4">Storico <span className="text-slate-400 text-sm font-normal">({history?.length || 0})</span></h2>
        <div className="space-y-3">
          {!history || history.length === 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl p-8 text-center text-slate-400 text-sm">Nessuna decisione registrata</div>
          ) : (
            history.map((req) => {
              const isApproved = req.status === "ACCESS_APPROVED";
              return (
                <div key={req.id} className="bg-white border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className={"w-2 h-2 rounded-full " + (isApproved ? "bg-green-500" : "bg-red-500")} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 text-sm font-medium">{profileMap[req.user_id] || "Partner"}</span>
                        <span className="text-slate-300">&rarr;</span>
                        <span className="text-slate-500 text-xs">{dealMap[req.deal_id] || "Deal"}</span>
                      </div>
                      <p className="text-slate-400 text-[10px] mt-1">
                        {req.decided_at ? new Date(req.decided_at).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                  <span className={"text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg " + (isApproved ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50")}>
                    {isApproved ? "Approvata" : "Rifiutata"}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}