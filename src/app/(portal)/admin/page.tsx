import { supabaseServer } from "@/lib/supabase-server";

export default async function AdminDashboard() {
  const supabase = await supabaseServer();

  // Recupero gli ultimi accessi approvati
  const { data: activity } = await supabase
    .from("deal_access_requests")
    .select(`
      id,
      status,
      updated_at,
      profiles:user_id ( full_name ),
      deals:deal_id ( title )
    `)
    .eq("status", "ACCESS_APPROVED")
    .order("updated_at", { ascending: false })
    .limit(10);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
          Admin <span className="text-[#D4AF37]">Insights</span>
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-[#001220] p-8 rounded-[2.5rem] text-white">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">Accessi Totali</p>
          <p className="text-4xl font-black text-[#D4AF37]">{activity?.length || 0}</p>
        </div>
        {/* Aggiungeremo qui altri KPI come Deal più visti, etc. */}
      </div>

      <div className="bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden">
        <div className="p-8 border-b">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Attività Recente VDR</h3>
        </div>
        <div className="divide-y divide-slate-50">
          {activity?.map((log: any) => (
            <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div>
                <span className="text-sm font-bold text-slate-900">{log.profiles?.full_name}</span>
                <p className="text-[11px] text-slate-500 uppercase tracking-widest">ha ottenuto l'accesso a <span className="text-blue-600 font-bold">{log.deals?.title}</span></p>
              </div>
              <span className="text-[10px] text-slate-400 font-medium italic">
                {new Date(log.updated_at).toLocaleString('it-IT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}