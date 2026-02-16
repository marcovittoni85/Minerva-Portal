import { supabaseServer } from "@/lib/supabase-server";

export default async function ModerationCommentsPage() {
  const supabase = await supabaseServer();

  // 1. Verifica permessi Admin
  const { data: me } = await supabase.auth.getUser();
  const { data: prof } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", me.user?.id || "")
    .maybeSingle();

  const isAdmin = prof?.role === "admin" || prof?.role === "equity_partner" || prof?.role === "minerva";
  if (!isAdmin) return <div className="p-8 text-red-500 font-bold">Area Riservata.</div>;

  // 2. Recupero richieste (Senza join per evitare l'errore schema cache)
  const { data: requests, error } = await supabase
    .from("deal_access_requests")
    .select("id, reason, status, created_at, user_id, deal_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  // 3. Arricchimento dati manuale per bypassare l'errore di relazione
  const enrichedRequests = await Promise.all(
    (requests || []).map(async (req) => {
      const [dealRes, profileRes] = await Promise.all([
        supabase.from("deals").select("title").eq("id", req.deal_id).maybeSingle(),
        supabase.from("profiles").select("full_name, email").eq("id", req.user_id).maybeSingle()
      ]);
      return { 
        ...req, 
        dealTitle: dealRes.data?.title || "Dossier", 
        partnerName: profileRes.data?.full_name || "Partner", 
        partnerEmail: profileRes.data?.email 
      };
    })
  );

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Moderazione Accessi</h1>
        <p className="text-slate-500">Gestisci le richieste per advisor1 e gli altri partner.</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl">
          Errore: {error.message}
        </div>
      )}

      <div className="grid gap-4">
        {enrichedRequests.length === 0 ? (
          <div className="p-20 border-2 border-dashed rounded-3xl text-center bg-white text-slate-400">
            Nessuna richiesta pendente.
          </div>
        ) : (
          enrichedRequests.map((req) => (
            <div key={req.id} className="bg-white border rounded-2xl p-6 flex justify-between items-center shadow-sm hover:border-blue-200 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {req.dealTitle}
                </span>
                <p className="font-bold text-slate-900 text-lg">{req.partnerName}</p>
                <p className="text-xs text-slate-400">{req.partnerEmail}</p>
              </div>
              
              <form action="/portal/access-requests/approve" method="POST">
                <input type="hidden" name="id" value={req.id} /> 
                <button 
                  type="submit" 
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-600 transition-all shadow-lg active:scale-95"
                >
                  Concedi Accesso
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}