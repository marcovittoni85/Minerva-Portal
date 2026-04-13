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
  { key: "proposed", label: "Proposto" },
  { key: "admin_review", label: "Revisione" },
  { key: "on_board", label: "Bacheca" },
  { key: "l1_requested", label: "L1 Richiesta" },
  { key: "l1_approved", label: "L1 Approvata" },
  { key: "l2_requested", label: "L2 Richiesta" },
  { key: "l2_approved", label: "L2 Approvata" },
  { key: "in_negotiation", label: "Trattativa" },
  { key: "fee_agreement", label: "Fee Agr." },
  { key: "execution", label: "Esecuzione" },
  { key: "closing", label: "Closing" },
  { key: "closed", label: "Chiuso" },
];

const stageKeys = stages.map(s => s.key);

const columnColors: Record<string, string> = {
  proposed: "border-slate-300",
  admin_review: "border-amber-400",
  on_board: "border-blue-400",
  l1_requested: "border-yellow-400",
  l1_approved: "border-emerald-400",
  l2_requested: "border-yellow-400",
  l2_approved: "border-emerald-400",
  in_negotiation: "border-[#D4AF37]",
  fee_agreement: "border-purple-400",
  execution: "border-[#D4AF37]",
  closing: "border-emerald-400",
  closed: "border-slate-400",
};

const countBg: Record<string, string> = {
  proposed: "bg-slate-100 text-slate-600",
  admin_review: "bg-amber-50 text-amber-700",
  on_board: "bg-blue-50 text-blue-700",
  l1_requested: "bg-yellow-50 text-yellow-700",
  l1_approved: "bg-emerald-50 text-emerald-700",
  l2_requested: "bg-yellow-50 text-yellow-700",
  l2_approved: "bg-emerald-50 text-emerald-700",
  in_negotiation: "bg-[#D4AF37]/10 text-[#D4AF37]",
  fee_agreement: "bg-purple-50 text-purple-700",
  execution: "bg-[#D4AF37]/10 text-[#D4AF37]",
  closing: "bg-emerald-50 text-emerald-700",
  closed: "bg-slate-100 text-slate-600",
};

function getColumn(stage: string): string {
  if (stage === "closed_won" || stage === "closed_lost" || stage === "fee_distributed") return "closed";
  if (stage === "board") return "on_board";
  if (stage === "in_review") return "admin_review";
  if (stage === "in_progress") return "execution";
  if (stage === "workgroup") return "l1_approved";
  if (stage === "call_scheduled") return "in_negotiation";
  if (stageKeys.includes(stage)) return stage;
  return "proposed";
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
      // Notify workgroup members about stage change
      try {
        await fetch("/api/notifications/stage-changed", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dealId, fromStage: oldStage, toStage: dbStage }),
        });
      } catch (e) {
        console.error("stage-changed notification error:", e);
      }
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
          <div key={col.key} className="flex-shrink-0 w-52">
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
