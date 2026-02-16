"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function FailureAnalysis() {
  const supabase = createClient();
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    async function getIntelligence() {
      const { data } = await supabase
        .from("deals")
        .select("sector, stop_reason")
        .eq("status", "archived")
        .not("stop_reason", "is", null);

      if (data) {
        // Raggruppiamo i dati per settore nel frontend per semplicità
        const grouped = data.reduce((acc: any, curr: any) => {
          acc[curr.sector] = acc[curr.sector] || { count: 0, reasons: [] };
          acc[curr.sector].count += 1;
          acc[curr.sector].reasons.push(curr.stop_reason);
          return acc;
        }, {});
        
        setStats(Object.entries(grouped).map(([sector, val]: any) => ({
          sector,
          ...val
        })));
      }
    }
    getIntelligence();
  }, []);

  return (
    <div className="space-y-6 p-6 bg-slate-50 rounded-3xl border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-800">Analisi Intelligence: Fallimenti</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((item) => (
          <div key={item.sector} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-bold rounded-full uppercase">
                {item.sector || "Settore Non Definito"}
              </span>
              <span className="text-2xl font-black text-slate-800">{item.count}</span>
            </div>
            
            <h4 className="text-sm font-semibold text-slate-400 mb-2 uppercase tracking-tight">Principali Motivi:</h4>
            <ul className="space-y-2">
              {item.reasons.slice(0, 3).map((r: string, i: number) => (
                <li key={i} className="text-sm text-slate-600 border-l-2 border-red-200 pl-3 italic">
                  “{r}”
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {stats.length === 0 && (
        <div className="text-center py-12 text-slate-400 italic">
          Nessun dato di fallimento registrato. Ottimo segno!
        </div>
      )}
    </div>
  );
}