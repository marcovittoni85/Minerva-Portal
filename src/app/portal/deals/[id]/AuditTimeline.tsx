"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function AuditTimeline({ dealId }: { dealId: string }) {
  const supabase = createClient();
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    async function fetchActivity() {
      const { data } = await supabase
        .from("deal_activity")
        .select(`
          id,
          action,
          created_at,
          meta,
          profiles ( full_name )
        `)
        .eq("deal_id", dealId)
        .order("created_at", { ascending: false });

      if (data) setActivities(data);
    }
    fetchActivity();
  }, [dealId]);

  return (
    <div className="bg-white rounded-2xl border p-8 shadow-sm">
      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Intelligence Log</h3>
      <div className="space-y-8">
        {activities.map((act) => (
          <div key={act.id} className="relative pl-8 border-l-2 border-slate-100 last:border-0 pb-4">
            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-900 border-4 border-white shadow-sm" />
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
              {new Date(act.created_at).toLocaleString("it-IT")}
            </div>
            <div className="text-sm text-slate-700 mt-2 leading-relaxed">
              <span className="font-bold text-slate-900">{act.profiles?.full_name || "Sistema"}</span>
              {" • "}
              <span className="text-blue-600 font-medium">{act.action.replace('_', ' ')}</span>
            </div>
            {act.meta?.reason && (
              <div className="mt-3 text-xs bg-slate-50 p-4 rounded-xl text-slate-500 border border-slate-100 italic">
                “{act.meta.reason}”
              </div>
            )}
          </div>
        ))}
        {activities.length === 0 && (
          <p className="text-sm text-slate-400 italic text-center py-4">Nessun log registrato per questa operazione.</p>
        )}
      </div>
    </div>
  );
}