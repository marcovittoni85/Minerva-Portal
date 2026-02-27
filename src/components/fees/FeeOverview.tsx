// ============================================================
// components/fees/FeeOverview.tsx
// Dashboard overview di tutte le fee — per admin dashboard
// Mostra: KPI globali, breakdown per deal, aging, pipeline
// ============================================================

'use client';

import { useState, useEffect } from 'react';
import {
  TrendingUp, BarChart3, Receipt, CircleDollarSign,
  ArrowUpRight, ArrowDownRight, AlertTriangle,
  ChevronRight, Loader2,
} from 'lucide-react';
import type { FeeStream, FeeDashboardSummary } from '@/types/fee-stream';
import { FEE_STATUS_CONFIG, FEE_TYPE_CONFIG } from '@/types/fee-stream';

const NAVY = '#001220';
const GOLD = '#D4AF37';

function formatEuro(amount: number): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
}

interface FeeOverviewProps {
  onNavigateToDeal?: (dealId: string) => void;
}

export default function FeeOverview({ onNavigateToDeal }: FeeOverviewProps) {
  const [streams, setStreams] = useState<FeeStream[]>([]);
  const [summaries, setSummaries] = useState<FeeDashboardSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      // Fetch all streams
      const [streamsRes, summaryRes] = await Promise.all([
        fetch('/api/fees'),
        fetch('/api/fees?summary=true'),
      ]);
      const streamsData = await streamsRes.json();
      const summaryData = await summaryRes.json();
      setStreams(streamsData.fee_streams || []);
      setSummaries(summaryData.summary || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={32} className="animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  // ── Calcoli globali ───────────────────────────────────────
  const globalProjected = summaries.reduce((s, d) => s + (d.total_projected || 0), 0);
  const globalAccrued = summaries.reduce((s, d) => s + (d.total_accrued || 0), 0);
  const globalInvoiced = summaries.reduce((s, d) => s + (d.total_invoiced || 0), 0);
  const globalCollected = summaries.reduce((s, d) => s + (d.total_collected || 0), 0);
  const globalPending = globalInvoiced - globalCollected;
  const collectionRate = globalAccrued > 0 ? (globalCollected / globalAccrued) * 100 : 0;

  // Fee per tipo
  const byType = streams.reduce((acc, s) => {
    if (!acc[s.fee_type]) acc[s.fee_type] = { count: 0, projected: 0, collected: 0 };
    acc[s.fee_type].count++;
    acc[s.fee_type].projected += s.projected_amount || 0;
    acc[s.fee_type].collected += s.collected_amount || 0;
    return acc;
  }, {} as Record<string, { count: number; projected: number; collected: number }>);

  // Fee overdue (fatturate ma non pagate e scadute)
  const overdueStreams = streams.filter(s =>
    s.status === 'invoiced' &&
    s.due_date &&
    new Date(s.due_date) < new Date()
  );

  // Top deals by fee value
  const dealSummaries = summaries
    .map(s => ({
      ...s,
      deal: streams.find(st => st.deal_id === s.deal_id)?.deal,
    }))
    .sort((a, b) => b.total_projected - a.total_projected);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold" style={{ color: NAVY }}>Fee Overview</h2>
        <p className="text-sm text-slate-400 mt-0.5">
          Panoramica globale delle fee su tutti i deal
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          label="Pipeline Fee"
          value={formatEuro(globalProjected)}
          icon={<TrendingUp size={20} />}
          color="text-slate-700" bgIcon="bg-slate-100"
        />
        <KpiCard
          label="Maturate"
          value={formatEuro(globalAccrued)}
          icon={<BarChart3 size={20} />}
          color="text-blue-600" bgIcon="bg-blue-50"
        />
        <KpiCard
          label="Fatturate"
          value={formatEuro(globalInvoiced)}
          icon={<Receipt size={20} />}
          color="text-purple-600" bgIcon="bg-purple-50"
        />
        <KpiCard
          label="Incassate"
          value={formatEuro(globalCollected)}
          icon={<CircleDollarSign size={20} />}
          color="text-emerald-600" bgIcon="bg-emerald-50"
          sub={`${collectionRate.toFixed(0)}% collection rate`}
        />
        <KpiCard
          label="Da Incassare"
          value={formatEuro(globalPending)}
          icon={<AlertTriangle size={20} />}
          color={globalPending > 0 ? 'text-amber-600' : 'text-slate-400'}
          bgIcon={globalPending > 0 ? 'bg-amber-50' : 'bg-slate-50'}
          sub={overdueStreams.length > 0 ? `${overdueStreams.length} scadute` : undefined}
        />
      </div>

      {/* Waterfall Pipeline Bar */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-slate-600 mb-4">Fee Pipeline</h3>
        <div className="flex h-8 rounded-lg overflow-hidden bg-slate-100">
          {globalProjected > 0 && (
            <>
              <div
                className="bg-emerald-500 transition-all duration-700 flex items-center justify-center text-[10px] text-white font-semibold"
                style={{ width: `${(globalCollected / globalProjected) * 100}%` }}
              >
                {(globalCollected / globalProjected * 100).toFixed(0)}%
              </div>
              <div
                className="bg-purple-400 transition-all duration-700 flex items-center justify-center text-[10px] text-white font-semibold"
                style={{ width: `${((globalInvoiced - globalCollected) / globalProjected) * 100}%` }}
              >
                {globalInvoiced > globalCollected ? `${((globalInvoiced - globalCollected) / globalProjected * 100).toFixed(0)}%` : ''}
              </div>
              <div
                className="bg-blue-300 transition-all duration-700 flex items-center justify-center text-[10px] text-white font-semibold"
                style={{ width: `${((globalAccrued - globalInvoiced) / globalProjected) * 100}%` }}
              >
                {globalAccrued > globalInvoiced ? `${((globalAccrued - globalInvoiced) / globalProjected * 100).toFixed(0)}%` : ''}
              </div>
            </>
          )}
        </div>
        <div className="flex gap-6 mt-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-500" /> Incassate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-purple-400" /> Fatturate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-300" /> Maturate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-slate-200" /> Previste
          </span>
        </div>
      </div>

      {/* Two columns: by type + by deal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fee per tipo */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-4">Per Tipo</h3>
          <div className="space-y-3">
            {Object.entries(byType)
              .sort((a, b) => b[1].projected - a[1].projected)
              .map(([type, data]) => {
                const conf = FEE_TYPE_CONFIG[type as keyof typeof FEE_TYPE_CONFIG];
                const pct = globalProjected > 0 ? (data.projected / globalProjected) * 100 : 0;
                return (
                  <div key={type} className="flex items-center gap-3">
                    <div className="w-20 text-xs font-medium text-slate-500 truncate">
                      {conf?.label || type}
                    </div>
                    <div className="flex-1 h-6 bg-slate-50 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: conf?.color || '#94A3B8',
                        }}
                      />
                    </div>
                    <div className="text-right min-w-[90px]">
                      <span className="text-sm font-semibold text-slate-700">
                        {formatEuro(data.projected)}
                      </span>
                    </div>
                    <span className="text-xs text-slate-300 w-8">{data.count}</span>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Fee per deal */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-4">Per Deal</h3>
          <div className="space-y-2">
            {dealSummaries.slice(0, 8).map(ds => {
              const pct = ds.total_projected > 0
                ? (ds.total_collected / ds.total_projected) * 100 : 0;
              return (
                <div
                  key={ds.deal_id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => onNavigateToDeal?.(ds.deal_id)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {ds.deal?.title || ds.deal_id}
                    </p>
                    <p className="text-xs text-slate-400">
                      {ds.total_streams} fee · {ds.paid_count} incassate
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-[#001220]">
                      {formatEuro(ds.total_projected)}
                    </p>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full mt-1">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-300" />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Overdue alert */}
      {overdueStreams.length > 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle size={20} className="text-red-500" />
            <h3 className="text-sm font-semibold text-red-700">
              Fee Scadute ({overdueStreams.length})
            </h3>
          </div>
          <div className="space-y-2">
            {overdueStreams.map(s => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium text-red-800">{s.label}</span>
                  <span className="text-red-400 ml-2">
                    {s.deal?.title || ''}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-red-600 font-semibold">
                    {formatEuro(s.accrued_amount || s.projected_amount || 0)}
                  </span>
                  <span className="text-xs text-red-400">
                    Scad. {s.due_date ? new Date(s.due_date).toLocaleDateString('it-IT') : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── KPI Card ────────────────────────────────────────────────

function KpiCard({
  label, value, icon, color, bgIcon, sub,
}: {
  label: string; value: string; icon: React.ReactNode;
  color: string; bgIcon: string; sub?: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`${bgIcon} p-1.5 rounded-lg ${color}`}>{icon}</div>
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
          {label}
        </span>
      </div>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}
