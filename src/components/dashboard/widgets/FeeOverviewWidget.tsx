'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import WidgetWrapper from '../WidgetWrapper';

interface Props { config: WidgetConfig; }

export default function FeeOverviewWidget({ config }: Props) {
  config = config || { title: 'Revenue Overview' };
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/fees');
        if (!res.ok) return;
        const d = await res.json();
        const fees = Array.isArray(d.fees) ? d.fees : [];
        const projected = fees.filter((f: any) => f.status === 'projected').reduce((s: number, f: any) => s + (f.projected_amount || 0), 0);
        const accrued = fees.filter((f: any) => f.status === 'accrued').reduce((s: number, f: any) => s + (f.projected_amount || 0), 0);
        const collected = fees.filter((f: any) => f.status === 'collected').reduce((s: number, f: any) => s + (f.projected_amount || 0), 0);
        setData({ projected, accrued, collected, total: projected + accrued + collected });
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function fmtK(n: number) {
    if (!n || isNaN(n)) return '€0';
    if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `€${(n / 1_000).toFixed(0)}k`;
    return `€${n.toFixed(0)}`;
  }

  return (
    <WidgetWrapper title={config.title} loading={loading}>
      {data && (
        <div className="p-5">
          <div className="grid grid-cols-3 gap-4 mb-4">
            {[
              { label: 'Previste', value: data.projected, color: '#94A3B8' },
              { label: 'Maturate', value: data.accrued, color: '#F5A623' },
              { label: 'Incassate', value: data.collected, color: '#10B981' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <p className="text-lg font-black text-slate-900">{fmtK(item.value)}</p>
                <p className="text-[9px] uppercase tracking-widest font-bold mt-0.5" style={{ color: item.color }}>{item.label}</p>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          {data.total > 0 && (
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
              <div className="bg-[#10B981] h-full transition-all" style={{ width: `${(data.collected / data.total) * 100}%` }} />
              <div className="bg-[#F5A623] h-full transition-all" style={{ width: `${(data.accrued / data.total) * 100}%` }} />
              <div className="bg-slate-300 h-full transition-all" style={{ width: `${(data.projected / data.total) * 100}%` }} />
            </div>
          )}
        </div>
      )}
    </WidgetWrapper>
  );
}
