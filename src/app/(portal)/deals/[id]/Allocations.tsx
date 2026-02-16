"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

type Pool = "origination" | "execution";

export default function Allocations({ dealId }: { dealId: string }) {
  const supabase = createClient();

  const [allocs, setAllocs] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [wf, setWf] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  async function load() {
    const { data: a, error: aErr } = await supabase
      .from("deal_allocations")
      .select("id, deal_id, actor_id, actor_type, pool, pct, created_at")
      .eq("deal_id", dealId)
      .order("created_at", { ascending: true });

    if (aErr) alert(aErr.message);
    setAllocs(a ?? []);

    // ✅ FIX: Rimosso "equity_partner" che non esiste nel database
    const { data: p, error: pErr } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "partner", "friend"])
      .order("full_name", { ascending: true });

    if (pErr) alert(pErr.message);
    setProfiles(p ?? []);

    const { data: wfRow, error: wfErr } = await supabase.rpc(
      "compute_deal_waterfall",
      { p_deal_id: dealId }
    );

    if (wfErr) alert(wfErr.message);
    setWf((wfRow as any)?.[0] ?? null);
  }

  function addRow() {
    setAllocs([
      ...allocs,
      {
        id: crypto.randomUUID(),
        deal_id: dealId,
        actor_id: "",
        actor_type: "partner",
        pool: "origination" as Pool,
        pct: 0,
      },
    ]);
  }

  function updateRow(id: string, field: string, value: any) {
    setAllocs(allocs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  }

  function removeRowLocal(id: string) {
    setAllocs(allocs.filter((r) => r.id !== id));
  }

  const clampPct = (x: any) => {
    const n = Number(x);
    if (Number.isNaN(n)) return 0;
    return Math.max(0, Math.min(100, n));
  };

  function calcAmount(r: any) {
    if (!wf) return null;

    const base =
      r.pool === "origination" ? Number(wf.origination_pool) : Number(wf.execution_pool);

    if (!Number.isFinite(base)) return null;

    return (base * clampPct(r.pct)) / 100;
  }

  function sumPct(pool: Pool) {
    return allocs
      .filter((a) => a.pool === pool)
      .reduce((acc, a) => acc + clampPct(a.pct), 0);
  }

  async function save() {
    setSaving(true);

    const sOrig = Math.round(sumPct("origination"));
    const sExec = Math.round(sumPct("execution"));

    if (sOrig > 100 || sExec > 100) {
      alert("La somma delle % per pool non può superare 100.");
      setSaving(false);
      return;
    }

    const { error: delErr } = await supabase
      .from("deal_allocations")
      .delete()
      .eq("deal_id", dealId);

    if (delErr) {
      alert(delErr.message);
      setSaving(false);
      return;
    }

    const rows = allocs
      .filter((r) => String(r.actor_id || "").length > 0)
      .map((r) => ({
        deal_id: dealId,
        actor_id: r.actor_id,
        actor_type: r.actor_type,
        pool: r.pool,
        pct: clampPct(r.pct),
      }));

    if (rows.length > 0) {
      const { error: insErr } = await supabase.from("deal_allocations").insert(rows);
      if (insErr) {
        alert(insErr.message);
        setSaving(false);
        return;
      }
    }

    await load();
    setSaving(false);
  }

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-semibold">Allocazioni</h2>
          <div className="text-sm text-slate-500">
            Ripartizione interna (simulazione). Percentuali per pool (0–100).
          </div>
        </div>

        <button
          onClick={addRow}
          className="rounded-xl bg-slate-900 text-white px-4 py-2 hover:bg-slate-800"
        >
          Aggiungi
        </button>
      </div>

      <div className="rounded-xl border bg-slate-50 p-4 text-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-slate-500">Somma Origination %</div>
            <div className="mt-1 font-mono">{Math.round(sumPct("origination"))}%</div>
          </div>
          <div>
            <div className="text-slate-500">Somma Execution %</div>
            <div className="mt-1 font-mono">{Math.round(sumPct("execution"))}%</div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {allocs.map((r) => (
          <div
            key={r.id}
            className="grid grid-cols-1 md:grid-cols-6 gap-3 text-sm border rounded-xl p-3"
          >
            <div className="md:col-span-2">
              <div className="text-slate-500">Persona</div>
              <select
                value={r.actor_id}
                onChange={(e) => updateRow(r.id, "actor_id", e.target.value)}
                className="mt-1 w-full border rounded-xl px-2 py-2"
              >
                <option value="">Seleziona</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name ?? p.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-slate-500">Pool</div>
              <select
                value={r.pool}
                onChange={(e) => updateRow(r.id, "pool", e.target.value)}
                className="mt-1 w-full border rounded-xl px-2 py-2"
              >
                <option value="origination">Origination</option>
                <option value="execution">Execution</option>
              </select>
            </div>

            <div>
              <div className="text-slate-500">%</div>
              <input
                type="number"
                value={r.pct ?? 0}
                onChange={(e) => updateRow(r.id, "pct", e.target.value)}
                className="mt-1 w-full border rounded-xl px-2 py-2"
                placeholder="0-100"
                min={0}
                max={100}
              />
            </div>

            <div>
              <div className="text-slate-500">Importo stimato</div>
              <div className="mt-2 font-mono">
                {calcAmount(r)?.toLocaleString("it-IT", {
                  style: "currency",
                  currency: "EUR",
                }) ?? "—"}
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => removeRowLocal(r.id)}
                className="underline text-red-700"
              >
                Rimuovi
              </button>
            </div>
          </div>
        ))}

        {allocs.length === 0 && (
          <div className="text-sm text-slate-500">Nessuna allocazione.</div>
        )}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50 hover:bg-slate-800"
      >
        {saving ? "Salvataggio..." : "Salva allocazioni"}
      </button>
    </div>
  );
}