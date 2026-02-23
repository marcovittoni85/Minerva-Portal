"use client";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Users } from "lucide-react";

type Deal = {
  id: string;
  code: string;
  title: string;
  sector: string;
  deal_stage: string;
  originator: string;
  wgCount: number;
};

const stages = [
  { key: "board", label: "Board" },
  { key: "in_review", label: "In Review" },
  { key: "workgroup", label: "Workgroup" },
  { key: "in_progress", label: "In Progress" },
  { key: "closing", label: "Closing" },
  { key: "closed", label: "Closed" },
];

const stageKeys = stages.map(s => s.key);

const columnColors: Record<string, string> = {
  board: "border-slate-300",
  in_review: "border-amber-400",
  workgroup: "border-blue-400",
  in_progress: "border-[#D4AF37]",
  closing: "border-emerald-400",
  closed: "border-slate-400",
};

const countBg: Record<string, string> = {
  board: "bg-slate-100 text-slate-600",
  in_review: "bg-amber-50 text-amber-700",
  workgroup: "bg-blue-50 text-blue-700",
  in_progress: "bg-[#D4AF37]/10 text-[#D4AF37]",
  closing: "bg-emerald-50 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

function getColumn(stage: string): string {
  if (stage === "closed_won" || stage === "closed_lost") return "closed";
  if (stageKeys.includes(stage)) return stage;
  return "board";
}

export default function PipelineClient({ deals: initialDeals }: { deals: Deal[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [deals, setDeals] = useState(initialDeals);
  const [moving, setMoving] = useState<string | null>(null);

  const moveDeal = async (dealId: string, newStage: string) => {
    setMoving(dealId);
    const deal = deals.find(d => d.id === dealId);
    const oldStage = deal?.deal_stage || "board";
    // Map "closed" column to "closed_won" for the DB
    const dbStage = newStage === "closed" ? "closed_won" : newStage;
    const { error } = await supabase
      .from("deals")
      .update({ deal_stage: dbStage })
      .eq("id", dealId);
    if (!error) {
      setDeals(prev => prev.map(d => d.id === dealId ? { ...d, deal_stage: dbStage } : d));
      // Log activity
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("deal_activity_log").insert({
        deal_id: dealId,
        user_id: user?.id,
        action: "stage_changed",
        details: { from: oldStage, to: dbStage },
      });
    }
    setMoving(null);
  };

  const columns = stages.map(stage => ({
    ...stage,
    deals: deals.filter(d => getColumn(d.deal_stage) === stage.key),
  }));

  return (
    <div className="p-8">
      <header className="mb-8 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Amministrazione</p>
        <h1 className="text-3xl font-bold text-slate-900">Pipeline <span className="text-[#D4AF37]">Deal</span></h1>
        <p className="text-slate-500 text-sm mt-2">{deals.length} deal attivi</p>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.key} className="flex-shrink-0 w-64">
            {/* Column header */}
            <div className={`border-t-[3px] ${columnColors[col.key]} pt-3 pb-3 px-1 flex items-center justify-between`}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-700">{col.label}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${countBg[col.key]}`}>{col.deals.length}</span>
            </div>

            {/* Cards */}
            <div className="space-y-3 min-h-[200px]">
              {col.deals.map(deal => {
                const colIdx = stageKeys.indexOf(col.key);
                const canLeft = colIdx > 0;
                const canRight = colIdx < stageKeys.length - 1;
                const isMoving = moving === deal.id;

                return (
                  <div
                    key={deal.id}
                    className={"bg-white border border-slate-100 rounded-xl p-3.5 shadow-sm hover:shadow-md transition-shadow" + (isMoving ? " opacity-50" : "")}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider">{deal.code}</span>
                      {deal.wgCount > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-blue-600 font-medium">
                          <Users className="w-3 h-3" />
                          {deal.wgCount}
                        </span>
                      )}
                    </div>
                    <a href={`/portal/deal-manage/${deal.id}`} className="text-sm font-bold text-slate-900 hover:text-[#D4AF37] transition-colors leading-snug block mb-1.5">
                      {deal.title}
                    </a>
                    <p className="text-[10px] text-slate-400 mb-0.5">{deal.sector || "—"}</p>
                    <p className="text-[10px] text-slate-400">{deal.originator}</p>

                    {/* Move buttons */}
                    <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-50">
                      <button
                        onClick={() => canLeft && moveDeal(deal.id, stageKeys[colIdx - 1])}
                        disabled={!canLeft || isMoving}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="w-4 h-4 text-slate-500" />
                      </button>
                      <span className="text-[9px] uppercase tracking-widest text-slate-300 font-bold">Sposta</span>
                      <button
                        onClick={() => canRight && moveDeal(deal.id, stageKeys[colIdx + 1])}
                        disabled={!canRight || isMoving}
                        className="p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {col.deals.length === 0 && (
                <div className="py-8 text-center text-slate-300 text-xs">Nessun deal</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
