import { supabaseServer } from "@/lib/supabase-server";

export default async function ModerationRequestsPage() {
  const supabase = await supabaseServer();

  // 1. Recupera le richieste pendenti
  const { data: requests } = await supabase
    .from("deal_access_requests")
    .select(`
      id,
      reason,
      status,
      deals ( title ),
      profiles ( full_name, email )
    `)
    .eq("status", "pending");

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-8 text-slate-900">Approvazione Accessi</h1>
      
      {!requests || requests.length === 0 ? (
        <div className="p-12 border-2 border-dashed rounded-3xl text-center bg-white">
          <p className="text-slate-400 font-medium">Nessuna richiesta in sospeso.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((req: any) => (
            <div key={req.id} className="bg-white border rounded-2xl p-6 flex justify-between items-center shadow-sm hover:border-blue-200 transition-all">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {req.deals?.title}
                </span>
                <p className="font-bold text-slate-900 text-lg leading-tight mt-1">{req.profiles?.full_name}</p>
                <p className="text-xs text-slate-400">{req.profiles?.email}</p>
              </div>
              
              {/* --- PUNTO 2: INTEGRATO CON SOTTOCARTELLA /APPROVE --- */}
              <form action="/portal/access-requests/approve" method="POST">
                {/* Il nome deve essere request_id per combaciare con la route */}
                <input type="hidden" name="request_id" value={req.id} />
                
                <button 
                  type="submit" 
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-green-600 transition-all shadow-md active:scale-95"
                >
                  Concedi Accesso
                </button>
              </form>
              {/* -------------------------------------------------- */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}