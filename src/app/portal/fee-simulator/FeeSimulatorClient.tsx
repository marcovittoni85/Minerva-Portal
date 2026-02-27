"use client";

import { useState, useMemo, useEffect } from "react";
import { Plus, Trash2, Save, Loader2, Check, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

/* ─── Types ─────────────────────────────────────────────────── */

type Mode = "A" | "B" | "C" | "D";

interface Member {
  id: string;
  name: string;
  pool: "origination" | "execution";
  pct: number;
}

interface WF {
  fl: number;
  advisorPct: number;
  advisor: number;
  minervaPct: number;
  minervaFee: number;
  fondoPct: number;
  fondo: number;
  np: number;
  epPct: number;
  epPool: number;
  origPct: number;
  origPool: number;
  execPct: number;
  execPool: number;
  bufferIcPct: number;
  bufferIc: number;
}

/* ─── Helpers ───────────────────────────────────────────────── */

const fmt = (n: number) =>
  "€ " + Math.abs(n).toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function calcWF(
  fl: number,
  advisorPct: number,
  minervaPct: number,
  epPct: number,
  origPct: number,
  bufferIcPct = 0,
): WF {
  const advisor = fl * advisorPct / 100;
  const minervaFee = fl * minervaPct / 100;
  const afterDed = fl - advisor - minervaFee;
  const fondoPct = fl <= 500_000 ? 3 : 2;
  const fondo = afterDed * fondoPct / 100;
  const np = afterDed - fondo;
  const bufferIc = np * bufferIcPct / 100;
  const epPool = np * epPct / 100;
  const origPool = np * origPct / 100;
  const execPct = Math.max(0, 100 - epPct - origPct - bufferIcPct);
  const execPool = np * execPct / 100;
  return {
    fl, advisorPct, advisor, minervaPct, minervaFee,
    fondoPct, fondo, np, epPct, epPool,
    origPct, origPool, execPct, execPool,
    bufferIcPct, bufferIc,
  };
}

let _id = 0;
const nextId = () => "m" + ++_id;

const inputCls = "w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-[#D4AF37] transition-colors";
const labelCls = "text-[9px] uppercase tracking-widest text-slate-400 font-bold block mb-1.5";

const modeOptions: { key: Mode; title: string; desc: string }[] = [
  { key: "A", title: "Singolo stream", desc: "Un solo lato" },
  { key: "B", title: "Due stream separati", desc: "Entrambi via Minerva" },
  { key: "C", title: "Minerva + Esterno", desc: "Un stream + fee esterna" },
  { key: "D", title: "Pool unico", desc: "Entrambi mandati Minerva" },
];

/* ─── Sub-components ────────────────────────────────────────── */

function Slider({ label, value, min, max, step = 1, onChange, disabled = false }: {
  label: string; value: number; min: number; max: number;
  step?: number; onChange: (v: number) => void; disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">{label}</span>
        <span className="text-sm font-bold text-slate-900">{value}%</span>
      </div>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        disabled={disabled}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-[#D4AF37] bg-slate-200 disabled:cursor-not-allowed"
      />
    </div>
  );
}

function WFRow({ label, amount, bold, sub }: { label: string; amount: number; bold?: boolean; sub?: boolean }) {
  return (
    <div className="flex justify-between text-sm">
      <span className={sub ? "text-slate-500" : bold ? "font-medium text-slate-800" : "text-slate-700"}>{label}</span>
      <span className={`font-mono ${sub ? "text-red-400" : bold ? "font-medium text-slate-900" : "text-slate-700"}`}>
        {sub ? `− ${fmt(amount)}` : fmt(amount)}
      </span>
    </div>
  );
}

function SubRow({ name, pct, amount }: { name: string; pct: number; amount: number }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{name || "—"} ({pct}%)</span>
      <span className="font-mono text-slate-600">{fmt(amount)}</span>
    </div>
  );
}

function WFCard({ w, members, label, showBuffer, modeDOrig }: {
  w: WF;
  members: Member[];
  label?: string;
  showBuffer?: boolean;
  modeDOrig?: { sellName: string; sellPct: number; buyName: string; buyPct: number };
}) {
  const origM = members.filter(m => m.pool === "origination");
  const execM = members.filter(m => m.pool === "execution");

  return (
    <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
      {label && (
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
          <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500">{label}</p>
        </div>
      )}

      <div className="bg-[#001220] px-5 py-3.5 flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]">Fee Lorda</span>
        <span className="text-base font-bold text-[#D4AF37] font-mono">{fmt(w.fl)}</span>
      </div>

      <div className="px-5 py-3 space-y-2 border-b border-slate-100 bg-slate-50/50">
        {w.advisorPct > 0 && <WFRow label={`− Advisor Esterno (${w.advisorPct}%)`} amount={w.advisor} sub />}
        <WFRow label={`− Minerva Fee (${w.minervaPct}%)`} amount={w.minervaFee} sub />
        <WFRow label={`− Fondo Minerva (${w.fondoPct}%)`} amount={w.fondo} sub />
      </div>

      <div className="bg-[#D4AF37]/10 px-5 py-3.5 flex justify-between items-center">
        <span className="text-[10px] uppercase tracking-widest font-bold text-[#001220]">Net Pool</span>
        <span className="text-base font-bold text-[#001220] font-mono">{fmt(w.np)}</span>
      </div>

      <div className="px-5 py-4 space-y-4">
        <WFRow label={`EP Pool (${w.epPct}%)`} amount={w.epPool} bold />

        {showBuffer && w.bufferIcPct > 0 && (
          <WFRow label={`Buffer IC (${w.bufferIcPct}%)`} amount={w.bufferIc} bold />
        )}

        <div>
          <WFRow label={`Origination Pool (${w.origPct}%)`} amount={w.origPool} bold />
          {modeDOrig ? (
            <div className="mt-2 ml-4 space-y-1 border-l-2 border-[#D4AF37]/20 pl-3">
              <SubRow name={modeDOrig.sellName || "Sell Originator"} pct={modeDOrig.sellPct} amount={w.origPool * modeDOrig.sellPct / 100} />
              <SubRow name={modeDOrig.buyName || "Buy Originator"} pct={modeDOrig.buyPct} amount={w.origPool * modeDOrig.buyPct / 100} />
            </div>
          ) : origM.length > 0 && (
            <div className="mt-2 ml-4 space-y-1 border-l-2 border-[#D4AF37]/20 pl-3">
              {origM.map(m => <SubRow key={m.id} name={m.name} pct={m.pct} amount={w.origPool * m.pct / 100} />)}
            </div>
          )}
        </div>

        <div>
          <WFRow label={`Execution Pool (${w.execPct.toFixed(0)}%)`} amount={w.execPool} bold />
          {execM.length > 0 && (
            <div className="mt-2 ml-4 space-y-1 border-l-2 border-[#D4AF37]/20 pl-3">
              {execM.map(m => <SubRow key={m.id} name={m.name} pct={m.pct} amount={w.execPool * m.pct / 100} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MemberRows({ members, origPool, execPool, hidePoolSelect, onUpdate, onRemove, onAdd }: {
  members: Member[];
  origPool: number;
  execPool: number;
  hidePoolSelect?: boolean;
  onUpdate: (id: string, field: keyof Member, value: string | number) => void;
  onRemove: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="space-y-2">
      {members.map(m => {
        const poolAmt = m.pool === "origination" && !hidePoolSelect ? origPool : execPool;
        const amount = poolAmt * m.pct / 100;
        return (
          <div key={m.id} className="flex items-center gap-2">
            <input
              type="text" value={m.name} onChange={e => onUpdate(m.id, "name", e.target.value)}
              placeholder="Nome" className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#D4AF37] transition-colors min-w-0"
            />
            {!hidePoolSelect && (
              <select
                value={m.pool} onChange={e => onUpdate(m.id, "pool", e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-xs outline-none focus:border-[#D4AF37]"
              >
                <option value="origination">Orig.</option>
                <option value="execution">Exec.</option>
              </select>
            )}
            <div className="flex items-center gap-1">
              <input
                type="number" value={m.pct} onChange={e => onUpdate(m.id, "pct", Number(e.target.value) || 0)}
                className="w-16 bg-slate-50 border border-slate-200 rounded-lg px-2 py-2 text-sm text-right outline-none focus:border-[#D4AF37]" min={0} max={100}
              />
              <span className="text-[10px] text-slate-400">%</span>
            </div>
            <span className="text-xs font-mono text-slate-500 w-28 text-right flex-shrink-0">{fmt(amount)}</span>
            <button onClick={() => onRemove(m.id)} className="p-1 text-slate-300 hover:text-red-400 transition-colors flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#D4AF37] hover:text-[#b8962d] transition-colors mt-2"
      >
        <Plus className="w-3.5 h-3.5" /> Aggiungi membro
      </button>
    </div>
  );
}

function SummaryRow({ label, amount, gold }: { label: string; amount: number; gold?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-slate-50 last:border-0">
      <span className={`text-sm ${gold ? "font-bold text-[#D4AF37]" : "text-slate-700"}`}>{label}</span>
      <span className={`text-sm font-mono ${gold ? "font-bold text-[#D4AF37]" : "font-medium text-slate-900"}`}>{fmt(amount)}</span>
    </div>
  );
}

/* ─── Main Component ────────────────────────────────────────── */

export default function FeeSimulatorClient() {
  const [mode, setMode] = useState<Mode>("A");
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Fees
  const [fl1, setFl1] = useState(100000);
  const [fl2, setFl2] = useState(100000);

  // Advisors
  const [advisorPct1, setAdvisorPct1] = useState(0);
  const [advisorPct2, setAdvisorPct2] = useState(0);

  // Global percentages
  const [minervaPct, setMinervaPct] = useState(3);
  const [epPct, setEpPct] = useState(10);
  const [origPct, setOrigPct] = useState(20);

  // Mode D specific
  const [bufferIcPct, setBufferIcPct] = useState(5);
  const [sellOrigName, setSellOrigName] = useState("");
  const [sellOrigPct, setSellOrigPct] = useState(50);
  const [buyOrigName, setBuyOrigName] = useState("");
  const [buyOrigPct, setBuyOrigPct] = useState(50);

  // Mode C specific
  const [extPersonName, setExtPersonName] = useState("");

  // Members
  const [members1, setMembers1] = useState<Member[]>([]);
  const [members2, setMembers2] = useState<Member[]>([]);

  // Computed waterfalls
  const effectiveEp = mode === "D" ? 15 : epPct;

  const w1 = useMemo(() =>
    calcWF(fl1, advisorPct1, minervaPct, effectiveEp, origPct),
    [fl1, advisorPct1, minervaPct, effectiveEp, origPct],
  );

  const w2 = useMemo(() =>
    calcWF(fl2, advisorPct2, minervaPct, effectiveEp, origPct),
    [fl2, advisorPct2, minervaPct, effectiveEp, origPct],
  );

  const wD = useMemo(() =>
    calcWF(fl1 + fl2, advisorPct1, minervaPct, 15, origPct, bufferIcPct),
    [fl1, fl2, advisorPct1, minervaPct, origPct, bufferIcPct],
  );

  const activeW = mode === "D" ? wD : w1;

  // Execution pct warning
  const execPctCheck = mode === "D"
    ? 100 - 15 - origPct - bufferIcPct
    : 100 - effectiveEp - origPct;

  // Member helpers
  const addMember = (list: 1 | 2) => {
    const m: Member = { id: nextId(), name: "", pool: mode === "D" ? "execution" : "origination", pct: 0 };
    if (list === 1) setMembers1(prev => [...prev, m]);
    else setMembers2(prev => [...prev, m]);
  };

  const updateMember = (list: 1 | 2, id: string, field: keyof Member, value: string | number) => {
    const setter = list === 1 ? setMembers1 : setMembers2;
    setter(prev => prev.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const removeMember = (list: 1 | 2, id: string) => {
    const setter = list === 1 ? setMembers1 : setMembers2;
    setter(prev => prev.filter(m => m.id !== id));
  };

  // Summary
  const summary = useMemo(() => {
    const memberTotals: Record<string, number> = {};
    let totalMinervaFee = 0, totalFondo = 0, totalEp = 0, totalBufferIc = 0;

    if (mode === "A") {
      totalMinervaFee = w1.minervaFee; totalFondo = w1.fondo; totalEp = w1.epPool;
      members1.forEach(m => {
        const pool = m.pool === "origination" ? w1.origPool : w1.execPool;
        const key = m.name || `Membro ${m.id}`;
        memberTotals[key] = (memberTotals[key] || 0) + pool * m.pct / 100;
      });
    } else if (mode === "B") {
      totalMinervaFee = w1.minervaFee + w2.minervaFee;
      totalFondo = w1.fondo + w2.fondo;
      totalEp = w1.epPool + w2.epPool;
      members1.forEach(m => {
        const pool = m.pool === "origination" ? w1.origPool : w1.execPool;
        const key = m.name || `Sell-${m.id}`;
        memberTotals[key] = (memberTotals[key] || 0) + pool * m.pct / 100;
      });
      members2.forEach(m => {
        const pool = m.pool === "origination" ? w2.origPool : w2.execPool;
        const key = m.name || `Buy-${m.id}`;
        memberTotals[key] = (memberTotals[key] || 0) + pool * m.pct / 100;
      });
    } else if (mode === "C") {
      totalMinervaFee = w1.minervaFee; totalFondo = w1.fondo; totalEp = w1.epPool;
      members1.forEach(m => {
        const pool = m.pool === "origination" ? w1.origPool : w1.execPool;
        const key = m.name || `Membro ${m.id}`;
        memberTotals[key] = (memberTotals[key] || 0) + pool * m.pct / 100;
      });
      if (extPersonName) {
        memberTotals[extPersonName] = (memberTotals[extPersonName] || 0) + fl2;
      }
    } else {
      totalMinervaFee = wD.minervaFee; totalFondo = wD.fondo; totalEp = wD.epPool; totalBufferIc = wD.bufferIc;
      if (sellOrigName) memberTotals[sellOrigName] = wD.origPool * sellOrigPct / 100;
      if (buyOrigName) memberTotals[buyOrigName] = (memberTotals[buyOrigName] || 0) + wD.origPool * buyOrigPct / 100;
      members1.forEach(m => {
        const key = m.name || `Membro ${m.id}`;
        memberTotals[key] = (memberTotals[key] || 0) + wD.execPool * m.pct / 100;
      });
    }

    return { minervaFee: totalMinervaFee, fondo: totalFondo, ep: totalEp, bufferIc: totalBufferIc, members: memberTotals };
  }, [mode, w1, w2, wD, members1, members2, fl2, extPersonName, sellOrigName, sellOrigPct, buyOrigName, buyOrigPct]);

  // ─── Render ────────────────────────────────────────────────

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <header className="mb-8 pb-8 border-b border-slate-100">
        <p className="text-[#D4AF37] text-[10px] uppercase tracking-[0.5em] font-medium mb-2">Amministrazione</p>
        <h1 className="text-3xl font-bold text-slate-900">Simulatore <span className="text-[#D4AF37]">Fee</span></h1>
        <p className="text-slate-500 text-sm mt-2">Calcolo waterfall e ripartizione compensi</p>
      </header>

      {/* Mode selector */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {modeOptions.map(opt => (
          <button
            key={opt.key}
            onClick={() => setMode(opt.key)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              mode === opt.key ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-slate-100 hover:border-slate-200"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                mode === opt.key ? "border-[#D4AF37]" : "border-slate-300"
              }`}>
                {mode === opt.key && <span className="w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />}
              </span>
              <span className="text-xs font-bold text-slate-900">Modo {opt.key}</span>
            </div>
            <p className="text-sm font-medium text-slate-700 ml-7">{opt.title}</p>
            <p className="text-[10px] text-slate-400 ml-7">{opt.desc}</p>
          </button>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-8 items-start">
        {/* ─── LEFT: Inputs ───────────────────────────────── */}
        <div className="space-y-6">
          {/* Fee amounts */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
            <p className="text-[9px] uppercase tracking-widest font-bold text-[#D4AF37] mb-1">Importi</p>

            {mode === "A" && (
              <>
                <div>
                  <label className={labelCls}>Fee Lorda</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    <input type="number" value={fl1 || ""} onChange={e => setFl1(Number(e.target.value) || 0)} className={inputCls + " pl-8"} min={0} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Advisor Esterno %</label>
                  <input type="number" value={advisorPct1} onChange={e => setAdvisorPct1(Number(e.target.value) || 0)} className={inputCls} min={0} max={100} />
                </div>
              </>
            )}

            {mode === "B" && (
              <>
                <div>
                  <label className={labelCls}>Fee Lorda — Sell</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    <input type="number" value={fl1 || ""} onChange={e => setFl1(Number(e.target.value) || 0)} className={inputCls + " pl-8"} min={0} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Advisor Sell %</label>
                  <input type="number" value={advisorPct1} onChange={e => setAdvisorPct1(Number(e.target.value) || 0)} className={inputCls} min={0} max={100} />
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <label className={labelCls}>Fee Lorda — Buy</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    <input type="number" value={fl2 || ""} onChange={e => setFl2(Number(e.target.value) || 0)} className={inputCls + " pl-8"} min={0} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Advisor Buy %</label>
                  <input type="number" value={advisorPct2} onChange={e => setAdvisorPct2(Number(e.target.value) || 0)} className={inputCls} min={0} max={100} />
                </div>
              </>
            )}

            {mode === "C" && (
              <>
                <div>
                  <label className={labelCls}>Fee Minerva</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    <input type="number" value={fl1 || ""} onChange={e => setFl1(Number(e.target.value) || 0)} className={inputCls + " pl-8"} min={0} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Advisor Minerva %</label>
                  <input type="number" value={advisorPct1} onChange={e => setAdvisorPct1(Number(e.target.value) || 0)} className={inputCls} min={0} max={100} />
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <label className={labelCls}>Fee Esterna (fuori Minerva)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    <input type="number" value={fl2 || ""} onChange={e => setFl2(Number(e.target.value) || 0)} className={inputCls + " pl-8"} min={0} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Titolare Fee Esterna</label>
                  <input type="text" value={extPersonName} onChange={e => setExtPersonName(e.target.value)} placeholder="Nome e cognome" className={inputCls} />
                </div>
              </>
            )}

            {mode === "D" && (
              <>
                <div>
                  <label className={labelCls}>Fee Sell</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    <input type="number" value={fl1 || ""} onChange={e => setFl1(Number(e.target.value) || 0)} className={inputCls + " pl-8"} min={0} />
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Fee Buy</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">€</span>
                    <input type="number" value={fl2 || ""} onChange={e => setFl2(Number(e.target.value) || 0)} className={inputCls + " pl-8"} min={0} />
                  </div>
                </div>
                <div className="bg-[#D4AF37]/10 px-4 py-3 rounded-lg flex justify-between items-center">
                  <span className="text-[9px] uppercase tracking-widest font-bold text-slate-500">Fee Lorda Combinata</span>
                  <span className="text-sm font-bold text-[#D4AF37] font-mono">{fmt(fl1 + fl2)}</span>
                </div>
                <div>
                  <label className={labelCls}>Advisor Esterno %</label>
                  <input type="number" value={advisorPct1} onChange={e => setAdvisorPct1(Number(e.target.value) || 0)} className={inputCls} min={0} max={100} />
                </div>
              </>
            )}
          </div>

          {/* Percentages */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-5">
            <p className="text-[9px] uppercase tracking-widest font-bold text-[#D4AF37] mb-1">Percentuali</p>
            <Slider label="Minerva Fee" value={minervaPct} min={1} max={5} step={0.5} onChange={setMinervaPct} />
            <Slider label="EP Pool" value={mode === "D" ? 15 : epPct} min={10} max={15} onChange={setEpPct} disabled={mode === "D"} />
            <Slider label="Origination Pool" value={origPct} min={10} max={35} onChange={setOrigPct} />
            {mode === "D" && (
              <Slider label="Buffer IC" value={bufferIcPct} min={0} max={10} onChange={setBufferIcPct} />
            )}
            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
              <span className="text-slate-400">Execution Pool (auto)</span>
              <span className={`font-bold ${execPctCheck < 0 ? "text-red-500" : "text-slate-700"}`}>{execPctCheck}%</span>
            </div>
            {execPctCheck < 0 && (
              <p className="text-[10px] text-red-500">La somma delle percentuali supera il 100% del Net Pool.</p>
            )}
          </div>

          {/* Mode D: Originators */}
          {mode === "D" && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5 space-y-4">
              <p className="text-[9px] uppercase tracking-widest font-bold text-[#D4AF37] mb-1">Originator</p>
              <div className="grid grid-cols-[1fr_80px] gap-2 items-end">
                <div>
                  <label className={labelCls}>Sell Originator</label>
                  <input type="text" value={sellOrigName} onChange={e => setSellOrigName(e.target.value)} placeholder="Nome" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>% Pool</label>
                  <input type="number" value={sellOrigPct} onChange={e => setSellOrigPct(Number(e.target.value) || 0)} className={inputCls + " text-right"} min={0} max={100} />
                </div>
              </div>
              <div className="grid grid-cols-[1fr_80px] gap-2 items-end">
                <div>
                  <label className={labelCls}>Buy Originator</label>
                  <input type="text" value={buyOrigName} onChange={e => setBuyOrigName(e.target.value)} placeholder="Nome" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>% Pool</label>
                  <input type="number" value={buyOrigPct} onChange={e => setBuyOrigPct(Number(e.target.value) || 0)} className={inputCls + " text-right"} min={0} max={100} />
                </div>
              </div>
              {sellOrigPct + buyOrigPct !== 100 && (
                <p className="text-[10px] text-amber-500">Le percentuali originator sommano {sellOrigPct + buyOrigPct}% (consigliato: 100%)</p>
              )}
            </div>
          )}

          {/* Members - Stream 1 */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <p className="text-[9px] uppercase tracking-widest font-bold text-[#D4AF37] mb-3">
              {mode === "B" ? "Membri Stream Sell" : mode === "D" ? "Membri Execution" : "Membri"}
            </p>
            <MemberRows
              members={members1}
              origPool={activeW.origPool}
              execPool={activeW.execPool}
              hidePoolSelect={mode === "D"}
              onUpdate={(id, field, val) => updateMember(1, id, field, val)}
              onRemove={(id) => removeMember(1, id)}
              onAdd={() => addMember(1)}
            />
          </div>

          {/* Members - Stream 2 (Mode B only) */}
          {mode === "B" && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <p className="text-[9px] uppercase tracking-widest font-bold text-[#D4AF37] mb-3">Membri Stream Buy</p>
              <MemberRows
                members={members2}
                origPool={w2.origPool}
                execPool={w2.execPool}
                hidePoolSelect={false}
                onUpdate={(id, field, val) => updateMember(2, id, field, val)}
                onRemove={(id) => removeMember(2, id)}
                onAdd={() => addMember(2)}
              />
            </div>
          )}
        </div>

        {/* ─── RIGHT: Output ──────────────────────────────── */}
        <div className="space-y-4">
          {/* Mode A: single waterfall */}
          {mode === "A" && <WFCard w={w1} members={members1} />}

          {/* Mode B: two parallel waterfalls */}
          {mode === "B" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <WFCard w={w1} members={members1} label="Stream Sell" />
              <WFCard w={w2} members={members2} label="Stream Buy" />
            </div>
          )}

          {/* Mode C: Minerva + external */}
          {mode === "C" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <WFCard w={w1} members={members1} label="Minerva" />
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-2 bg-slate-50 border-b border-slate-100">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-slate-500">Esterno</p>
                </div>
                <div className="bg-[#001220] px-5 py-3.5 flex justify-between items-center">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]">Fee Esterna (fuori Minerva)</span>
                  <span className="text-base font-bold text-[#D4AF37] font-mono">{fmt(fl2)}</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                  <div className="bg-slate-50 rounded-lg px-4 py-3">
                    <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-1">Nessuna trattenuta Minerva</p>
                    <p className="text-xs text-slate-500">Questa fee non transita dal waterfall Minerva.</p>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Titolare</span>
                    <span className="font-medium text-slate-900">{extPersonName || "—"}</span>
                  </div>
                  <div className="border-t border-slate-100 pt-3 flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#001220]">Compenso netto</span>
                    <span className="text-base font-bold text-[#001220] font-mono">{fmt(fl2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Mode D: single combined waterfall */}
          {mode === "D" && (
            <WFCard
              w={wD}
              members={members1.map(m => ({ ...m, pool: "execution" as const }))}
              label="Pool Unico (Sell + Buy)"
              showBuffer
              modeDOrig={{ sellName: sellOrigName, sellPct: sellOrigPct, buyName: buyOrigName, buyPct: buyOrigPct }}
            />
          )}

          {/* Summary */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <p className="text-[9px] uppercase tracking-widest font-bold text-[#D4AF37] mb-4">Riepilogo</p>
            <div className="space-y-1">
              <SummaryRow label="Minerva Fee Totale" amount={summary.minervaFee} gold />
              <SummaryRow label="Fondo Minerva Totale" amount={summary.fondo} />
              <SummaryRow label="EP Pool Totale" amount={summary.ep} />
              {mode === "D" && summary.bufferIc > 0 && (
                <SummaryRow label="Buffer IC" amount={summary.bufferIc} />
              )}
            </div>

            {Object.keys(summary.members).length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mb-2">Compensi Membri</p>
                <div className="space-y-1">
                  {Object.entries(summary.members).map(([name, amt]) => (
                    <SummaryRow key={name} label={name} amount={amt} />
                  ))}
                </div>
              </div>
            )}

            {/* Grand total */}
            {mode === "B" && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[#001220]">Fee Lorda Totale Combinata</span>
                  <span className="text-base font-bold text-[#001220] font-mono">{fmt(fl1 + fl2)}</span>
                </div>
              </div>
            )}
            {mode === "C" && (
              <div className="mt-4 pt-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-[#001220]">Totale Fee (Minerva + Esterna)</span>
                  <span className="text-base font-bold text-[#001220] font-mono">{fmt(fl1 + fl2)}</span>
                </div>
              </div>
            )}

            {/* Save as Fee Stream */}
            {w1.fl > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setShowSaveModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#b8962d] text-white text-[10px] font-bold uppercase tracking-widest hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all"
                >
                  <Save size={14} /> Salva come Fee Stream
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Save Fee Stream Modal */}
      {showSaveModal && (
        <SaveFeeStreamModal
          feeData={{
            projected_amount: w1.fl,
            percentage: w1.minervaPct > 0 ? w1.minervaPct : undefined,
            calculation_base: "Enterprise Value",
            fee_type: w1.advisorPct > 0 ? "advisory" : "success",
          }}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
}

/* ─── Save Fee Stream Modal ───────────────────────────────── */

function SaveFeeStreamModal({
  feeData,
  onClose,
  onSaved,
}: {
  feeData: { projected_amount: number; percentage?: number; calculation_base: string; fee_type: string };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [deals, setDeals] = useState<{ id: string; title: string }[]>([]);
  const [selectedDeal, setSelectedDeal] = useState("");
  const [label, setLabel] = useState(
    feeData.percentage
      ? `Success Fee ${feeData.percentage}%`
      : `Advisory Fee ${fmt(feeData.projected_amount)}`
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("deals")
      .select("id, title")
      .eq("active", true)
      .order("title")
      .then(({ data }) => setDeals(data || []));
  }, []);

  const handleSave = async () => {
    if (!selectedDeal) return;
    setSaving(true);
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: selectedDeal,
          fee_type: feeData.fee_type,
          label,
          projected_amount: feeData.projected_amount,
          percentage: feeData.percentage || null,
          calculation_base: feeData.percentage ? feeData.calculation_base : null,
          vat_rate: 22.0,
          status: "projected",
        }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(onSaved, 1200);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#001220]">Salva come Fee Stream</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={20} />
          </button>
        </div>

        {saved ? (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 text-emerald-700">
            <Check size={20} />
            <span className="font-medium">Fee Stream salvato con successo!</span>
          </div>
        ) : (
          <>
            <div>
              <label className={labelCls}>Deal *</label>
              <select
                className={inputCls}
                value={selectedDeal}
                onChange={e => setSelectedDeal(e.target.value)}
              >
                <option value="">Seleziona un deal...</option>
                {deals.map(d => (
                  <option key={d.id} value={d.id}>{d.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Etichetta</label>
              <input className={inputCls} value={label} onChange={e => setLabel(e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Importo Previsto</label>
                <p className="text-lg font-bold text-[#001220]">{fmt(feeData.projected_amount)}</p>
              </div>
              {feeData.percentage && (
                <div>
                  <label className={labelCls}>Percentuale</label>
                  <p className="text-lg font-bold text-[#D4AF37]">{feeData.percentage}%</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
                Annulla
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !selectedDeal}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#b8962d] text-white text-sm font-medium hover:shadow-lg hover:shadow-[#D4AF37]/25 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Salva
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
