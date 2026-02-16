"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const STAGES = [
  "Origination",
  "Screening",
  "NDA",
  "DD",
  "Negotiation",
  "Signing",
  "Closed",
  "Dropped",
] as const;

export default function FunnelBoard({
  initialRows,
}: {
  initialRows: Array<{
    deal_id: string;
    stage: string;
    updated_at: string;
    deal: { id: string; code: string | null; title: string | null };
  }>;
}) {
  const [rows, setRows] = useState(initialRows);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Stati per il Modal dello Stop Reason
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [currentDealId, setCurrentDealId] = useState<string | null>(null);
  const [reasonText, setReasonText] = useState("");

  const grouped = useMemo(() => {
    const g: Record<string, any[]> = Object.fromEntries(STAGES.map((s) => [s, []]));
    for (const r of rows) {
      const st = STAGES.includes(r.stage as any) ? r.stage : "Origination";
      g[st].push(r);
    }
    return g;
  }, [rows]);

  // Funzione principale di aggiornamento
  async function updateStage(dealId: string, stage: string, stopReason?: string) {
    setBusyId(dealId);

    const form = new FormData();
    form.append("deal_id", dealId);
    form.append("stage", stage);
    if (stopReason) form.append("stop_reason", stopReason); // Invia il motivo al DB

    const res = await fetch("/portal/funnel/update", { method: "POST", body: form });
    const json = await res.json();

    if (!res.ok) {
      setBusyId(null);
      alert(json.error ?? "Errore aggiornamento stage");
      return;
    }

    setRows((prev) =>
      prev.map((r) => (r.deal_id === dealId ? { ...r, stage, updated_at: new Date().toISOString() } : r))
    );
    setBusyId(null);
    setIsStopModalOpen(false);
    setReasonText("");
  }

  // Intercettore per il cambio stage
  const handleStageChange = (dealId: string, newStage: string) => {
    if (newStage === "Dropped") {
      setCurrentDealId(dealId);
      setIsStopModalOpen(true);
    } else {
      updateStage(dealId, newStage);
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-8 gap-3">
        {STAGES.map((stage) => (
          <div key={stage} className="rounded-2xl border bg-white overflow-hidden">
            <div className={`px-3 py-2 text-sm font-medium ${stage === 'Dropped' ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-700'}`}>
              {stage}
            </div>

            <div className="p-3 space-y-2">
              {(grouped[stage] ?? []).map((x: any) => (
                <div key={x.deal_id} className="rounded-xl border p-3 text-sm bg-white shadow-sm">
                  <div className="text-xs text-slate-500">{x.deal.code ?? "—"}</div>
                  <div className="font-medium truncate">{x.deal.title ?? "—"}</div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <Link className="underline text-xs text-blue-600" href={`/portal/deals/${x.deal_id}`}>
                      Apri
                    </Link>

                    <select
                      className="border rounded px-2 py-1 text-xs bg-slate-50"
                      value={STAGES.includes(x.stage as any) ? x.stage : "Origination"}
                      disabled={busyId === x.deal_id}
                      onChange={(e) => handleStageChange(x.deal_id, e.target.value)}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              {(grouped[stage] ?? []).length === 0 && (
                <div className="text-xs text-slate-400 text-center py-2">—</div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal per lo Stop Reason */}
      {isStopModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Perché hai fermato questo deal?</h3>
            <p className="text-sm text-slate-500 mt-1">Questi dati aiuteranno Minerva nell'analisi dei fallimenti.</p>
            
            <textarea
              className="w-full mt-4 p-3 border rounded-xl text-sm focus:ring-2 focus:ring-red-500 outline-none"
              rows={4}
              placeholder="Es: Valutazione eccessiva, scarso interesse dei partner..."
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
            />

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => { setIsStopModalOpen(false); setReasonText(""); }}
                className="flex-1 px-4 py-2 border rounded-xl text-sm font-medium hover:bg-slate-50"
              >
                Annulla
              </button>
              <button
                disabled={!reasonText.trim()}
                onClick={() => currentDealId && updateStage(currentDealId, "Dropped", reasonText)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Archivia Deal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}