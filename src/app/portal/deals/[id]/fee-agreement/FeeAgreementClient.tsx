"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, AlertTriangle, Download, Loader2, CheckCircle } from "lucide-react";
import { MINERVA_SERVICES, calcFondoStrategico } from "@/lib/deal-config";

interface Party {
  role: string;
  name: string;
  percentage: string;
  amount: string;
  type: string; // success, retainer, milestone, mix
  trigger: string; // signing, closing, milestone, data
}

interface L2Request {
  id: string;
  anonymous_code: string;
  requester_id: string;
  requester_name: string;
  l2_client_name: string | null;
  l2_client_surname: string | null;
  l2_client_company: string | null;
  l2_fee_from_client: string | null;
  l2_fee_from_minerva: string | null;
}

export default function FeeAgreementClient({
  deal, originatorName, existing, l2Requests, userId,
}: {
  deal: { id: string; title: string; code: string; originator_id: string; ev_range: string; asset_class: string | null };
  originatorName: string;
  existing: any;
  l2Requests: L2Request[];
  userId: string;
}) {
  const [serviceType, setServiceType] = useState(existing?.service_type || "");
  const [feeLorda, setFeeLorda] = useState<number>(existing?.fee_lorda || 0);
  const [minervaFeePct, setMinervaFeePct] = useState<number>(existing?.minerva_fee_pct || 3);
  const [notes, setNotes] = useState(existing?.notes || "");
  const [parties, setParties] = useState<Party[]>(existing?.parties || [
    { role: "Originator", name: originatorName, percentage: "", amount: "", type: "success", trigger: "closing" },
    { role: "Minerva Hub", name: "Minerva Partners", percentage: "", amount: "", type: "success", trigger: "closing" },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-calculations
  const minervaFeeAmount = feeLorda * (minervaFeePct / 100);
  const residuo = feeLorda - minervaFeeAmount;
  const service = MINERVA_SERVICES[serviceType];
  const noFondo = service?.noFondo;
  const fondoPct = noFondo ? 0 : (feeLorda <= 500000 ? 3 : 2);
  const fondoAmount = noFondo ? 0 : calcFondoStrategico(feeLorda, minervaFeeAmount);
  const netPool = residuo - fondoAmount;

  const icRequired = feeLorda > 500000;

  const addParty = () => {
    setParties([...parties, { role: "", name: "", percentage: "", amount: "", type: "success", trigger: "closing" }]);
  };

  const removeParty = (idx: number) => {
    setParties(parties.filter((_, i) => i !== idx));
  };

  const updateParty = (idx: number, field: keyof Party, value: string) => {
    setParties(parties.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch("/api/fee-agreement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dealId: deal.id,
        parties,
        serviceType,
        minervaFeePct,
        minervaFeeAmount,
        fondoStrategicoPct: fondoPct,
        fondoStrategicoAmount: fondoAmount,
        netPool,
        feeLorda,
        notes,
        icRequired,
      }),
    });
    if (res.ok) setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <Link href={`/portal/deals/${deal.id}`} className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 text-sm mb-8 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Torna al Deal
      </Link>

      <header className="mb-8">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{deal.code}</p>
        <h1 className="text-2xl font-bold text-slate-900">Fee <span className="text-[#D4AF37]">Agreement</span></h1>
        <p className="text-slate-500 text-sm mt-1">{deal.title}</p>
      </header>

      {/* IC Alert */}
      {icRequired && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-bold text-red-800">Delibera IC Obbligatoria</p>
            <p className="text-xs text-red-600">Fee lorda &gt; €500.000 — richiesta approvazione Investment Committee.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Service type */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Servizio Minerva</h2>
            <select value={serviceType} onChange={e => setServiceType(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37]">
              <option value="">Seleziona servizio...</option>
              {Object.entries(MINERVA_SERVICES).map(([key, svc]) => (
                <option key={key} value={key}>{svc.name} ({svc.feeRange})</option>
              ))}
            </select>
            {service && (
              <p className="text-xs text-slate-500 mt-2">{service.notes}</p>
            )}
          </div>

          {/* Fee structure */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Struttura Fee</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-1">Fee Lorda (€)</label>
                <input type="number" value={feeLorda || ""} onChange={e => setFeeLorda(Number(e.target.value))} placeholder="0" className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37]" />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-medium block mb-1">Minerva Fee (%)</label>
                <input type="number" step="0.1" min="0" max="10" value={minervaFeePct || ""} onChange={e => setMinervaFeePct(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37]" />
              </div>
            </div>
          </div>

          {/* Parties */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest">Parti Coinvolte</h2>
              <button onClick={addParty} className="text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Aggiungi
              </button>
            </div>

            {/* Pre-fill from L2 requests */}
            {l2Requests.length > 0 && parties.length <= 2 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-[10px] uppercase tracking-widest text-blue-700 font-bold mb-2">Da Richieste L2 Approvate</p>
                {l2Requests.map(r => (
                  <button
                    key={r.id}
                    onClick={() => setParties([...parties,
                      { role: "Richiedente", name: r.requester_name, percentage: "", amount: "", type: "success", trigger: "closing" },
                      { role: "Cliente", name: `${r.l2_client_name} ${r.l2_client_surname}`, percentage: "", amount: "", type: "success", trigger: "closing" },
                    ])}
                    className="text-xs text-blue-700 hover:underline block"
                  >
                    + {r.requester_name} → {r.l2_client_name} {r.l2_client_surname} ({r.l2_client_company})
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {parties.map((p, i) => (
                <div key={i} className="bg-slate-50 rounded-xl p-4 relative">
                  {parties.length > 1 && (
                    <button onClick={() => removeParty(i)} className="absolute top-2 right-2 text-slate-400 hover:text-red-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Ruolo</label>
                      <input value={p.role} onChange={e => updateParty(i, "role", e.target.value)} placeholder="Es: Originator" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37]" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Nome</label>
                      <input value={p.name} onChange={e => updateParty(i, "name", e.target.value)} placeholder="Nome completo" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37]" />
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">% Net Pool</label>
                      <input value={p.percentage} onChange={e => updateParty(i, "percentage", e.target.value)} placeholder="%" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37]" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Importo €</label>
                      <input value={p.amount} onChange={e => updateParty(i, "amount", e.target.value)} placeholder="€" className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37]" />
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Tipo</label>
                      <select value={p.type} onChange={e => updateParty(i, "type", e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37]">
                        <option value="success">Success</option>
                        <option value="retainer">Retainer</option>
                        <option value="milestone">Milestone</option>
                        <option value="mix">Mix</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1">Trigger</label>
                      <select value={p.trigger} onChange={e => updateParty(i, "trigger", e.target.value)} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 outline-none focus:border-[#D4AF37]">
                        <option value="signing">Signing</option>
                        <option value="closing">Closing</option>
                        <option value="milestone">Milestone</option>
                        <option value="data">Data</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Note e Condizioni</h2>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Condizioni particolari, clausole aggiuntive..." className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#D4AF37] resize-none" />
          </div>

          {/* Save button */}
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving || !serviceType || !feeLorda} className="flex-1 bg-[#D4AF37] text-white py-3.5 rounded-xl text-xs font-bold tracking-widest uppercase hover:bg-[#b8962d] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
              {saving ? "Salvataggio..." : saved ? "Salvato" : "Salva Fee Agreement"}
            </button>
          </div>
        </div>

        {/* Right: Auto-calc summary */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm sticky top-6">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">Riepilogo Calcolo</h2>
            <div className="space-y-3 text-xs">
              <Row label="Fee Lorda" value={fmt(feeLorda)} bold />
              <div className="border-t border-slate-100 pt-3">
                <Row label={`Minerva Fee (${minervaFeePct}%)`} value={`- ${fmt(minervaFeeAmount)}`} />
                <Row label="Residuo" value={fmt(residuo)} />
              </div>
              <div className="border-t border-slate-100 pt-3">
                <Row label={`Fondo Strategico (${fondoPct}%)`} value={noFondo ? "N/A" : `- ${fmt(fondoAmount)}`} />
                <Row label="Net Pool" value={fmt(netPool)} bold />
              </div>
              {service && (
                <div className="border-t border-slate-100 pt-3">
                  <Row label="Origination Pool (10-35%)" value={`${fmt(netPool * 0.1)} — ${fmt(netPool * 0.35)}`} />
                  <Row label="Execution Pool (65-90%)" value={`${fmt(netPool * 0.65)} — ${fmt(netPool * 0.9)}`} />
                </div>
              )}
            </div>
          </div>

          {/* Formula reference */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-[10px] text-slate-500 leading-relaxed">
            <p className="font-bold text-slate-700 mb-1">Formula Codice Retributivo:</p>
            <p>Fee Lorda (100%)</p>
            <p>→ Minerva Fee (1-5%)</p>
            <p>→ Residuo = FL - Minerva Fee</p>
            <p>→ Fondo = {feeLorda <= 500000 ? "3%" : "2%"} Residuo</p>
            <p>→ Net Pool = Residuo - Fondo</p>
            <p>→ Origination (10-35% NP)</p>
            <p>→ Execution (65-90% NP)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={bold ? "font-bold text-slate-900" : "text-slate-700"}>{value}</span>
    </div>
  );
}

function fmt(n: number): string {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
}
