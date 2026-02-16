import { supabaseServer } from "@/lib/supabase-server";
import { redirect } from "next/navigation";

export default async function AccessRequestsPage() {
  const supabase = await supabaseServer();
  
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
  
  if (profile?.role !== 'admin' && profile?.role !== 'equity_partner') {
    redirect("/portal");
  }

  const { data: requests } = await supabase
    .from("deal_access_requests")
    .select(`
      id,
      status,
      created_at,
      reason,
      user_id,
      deal_id,
      profiles:user_id ( full_name, email, phone ),
      deals:deal_id ( title )
    `)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-6xl mx-auto pb-20 px-4">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
          Richieste <span className="text-[#D4AF37]">Accesso</span>
        </h1>
        <p className="text-slate-400 text-xs uppercase tracking-[0.4em] font-bold mt-2">
          Amministrazione Club Minerva
        </p>
      </div>

      <div className="space-y-4">
        {requests?.length === 0 ? (
          <div className="bg-white border border-dashed p-20 rounded-[2.5rem] text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
            Nessuna richiesta pendente
          </div>
        ) : (
          requests?.map((req: any) => (
            <div key={req.id} className="bg-white border border-slate-100 p-8 rounded-[2.5rem] shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-50 text-blue-700 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    {req.deals?.title}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                  {req.profiles?.full_name || "Partner"}
                </h3>
                <div className="flex gap-4 mt-1">
                  <p className="text-slate-500 text-[11px] font-medium">{req.profiles?.email}</p>
                  <p className="text-slate-500 text-[11px] font-medium">{req.profiles?.phone}</p>
                </div>
                {req.reason && (
                  <p className="mt-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                    "{req.reason}"
                  </p>
                )}
              </div>

              <form action="/portal/access-requests/approve" method="POST">
                <input type="hidden" name="requestId" value={req.id} />
                <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#D4AF37] hover:text-black transition-all shadow-xl">
                  Approva & Notifica
                </button>
              </form>
            </div>
          ))
        )}
      </div>
    </div>
  );
}