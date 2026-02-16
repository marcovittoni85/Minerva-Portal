"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase-client";

export default function Economics({ dealId }: { dealId: string }) {
  const supabase = createClient();

  const [fin, setFin] = useState<any>(null);
  const [wf, setWf] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dealId]);

  async function load() {
    const { data: finRow } = await supabase
      .from("deal_financials")
      .select("*")
      .eq("deal_id", dealId)
      .maybeSingle();

    setFin(
      finRow ?? {
        deal_id: dealId,
        fee_gross: null,
        minerva_fee_pct: 0,
        minerva_fund_pct: 0,
        origination_pool_pct: 50,
        execution_pool_pct: 50,
        notes: "",
      }
    );

    const { data: wfRow } = await supabase.rpc("compute_deal_waterfall", {
      p_deal_id: dealId,
    });

    setWf((wfRow as any)?.[0] ?? null);
  }

  const clampPct = (x: any, d: number) => {
    const n = Number(x);
    if (Number.isNaN(n)) return d;
    return Math.max(0, Math.min(100, n));
  };

  async function save() {
    setSaving(true);

    const o = clampPct(fin.origination_pool_pct, 50);
    const e = clampPct(fin.execution_pool_pct, 50);

    if (Math.round(o + e) !== 100) {
      alert("Origination % + Execution % deve fare 100.");
      setSaving(false);
      return;
    }

    const payload = {
      deal_id: dealId,
      fee_gross: fin.fee_gross ? Number(fin.fee_gross) : null,
      minerva_fee_pct: clampPct(fin.minerva_fee_pct, 0),
      minerva_fund_pct: clampPct(fin.minerva_fund_pct, 0),
      origination_pool_pct: o,
      execution_pool_pct: e,
      notes: fin.notes ?? "",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("deal_financials")
      .upsert(payload, { onConflict: "deal_id" });

    if (error) {
      alert(error.message);
      setSaving(false);
      return;
    }

    await load();
    setSaving(false);
  }

  if (!fin) return null;

  return (
    <div className="rounded-2xl border bg-white p-6 space-y-6">
      <div>
        <h2 className="font-semibold">Economics (simulazione interna)</h2>
        <div className="text-sm text-slate-500">
          Visibile solo Admin / Equity / Minerva.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <Field
          label="Fee lorda (EUR)"
          value={fin.fee_gross ?? ""}
          onChange={(v) => setFin({ ...fin, fee_gross: v })}
        />

        <Field
          label="Minerva fee % (0–100)"
          value={fin.minerva_fee_pct ?? 0}
          onChange={(v) => setFin({ ...fin, minerva_fee_pct: v })}
        />

        <Field
          label="Fondo Minerva % (0–100)"
          value={fin.minerva_fund_pct ?? 0}
          onChange={(v) => setFin({ ...fin, minerva_fund_pct: v })}
        />

        <Field
          label="Origination pool % (0–100)"
          value={fin.origination_pool_pct ?? 50}
          onChange={(v) => setFin({ ...fin, origination_pool_pct: v })}
        />

        <Field
          label="Execution pool % (0–100)"
          value={fin.execution_pool_pct ?? 50}
          onChange={(v) => setFin({ ...fin, execution_pool_pct: v })}
        />

        <div className="md:col-span-3">
          <div className="text-slate-500">Note</div>
          <textarea
            className="mt-1 w-full border rounded-xl p-3 text-sm"
            value={fin.notes ?? ""}
            onChange={(e) => setFin({ ...fin, notes: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="rounded-xl bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
      >
        {saving ? "Salvataggio..." : "Salva & Ricalcola"}
      </button>

      <div className="rounded-xl border bg-slate-50 p-4 text-sm">
        <div className="font-medium mb-3">Risultato Waterfall</div>

        {wf ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <KV k="Fee lorda" v={wf.fee_gross} />
            <KV k="Minerva fee" v={wf.minerva_fee_amount} />
            <KV k="Fondo Minerva" v={wf.minerva_fund_amount} />
            <KV k="Net pool" v={wf.net_pool} />
            <KV k="Origination pool" v={wf.origination_pool} />
            <KV k="Execution pool" v={wf.execution_pool} />
          </div>
        ) : (
          <div className="text-slate-500">
            Inserisci la fee e salva per calcolare.
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="text-slate-500">{label}</div>
      <input
        className="mt-1 w-full border rounded-xl px-3 py-2"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function KV({ k, v }: { k: string; v: any }) {
  const num = typeof v === "number" ? v : v ? Number(v) : null;

  return (
    <div>
      <div className="text-slate-500">{k}</div>
      <div className="mt-1 font-mono">
        {num === null || Number.isNaN(num)
          ? "—"
          : num.toLocaleString("it-IT", {
              style: "currency",
              currency: "EUR",
            })}
      </div>
    </div>
  );
}
