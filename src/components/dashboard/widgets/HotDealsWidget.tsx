'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import WidgetWrapper from '../WidgetWrapper';
import Link from 'next/link';

interface Props { config: WidgetConfig; }

export default function HotDealsWidget({ config }: Props) {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cockpit');
        const d = await res.json();
        setDeals(d.hot_deals || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const limit = config.limit || 5;

  return (
    <WidgetWrapper title={config.title} loading={loading} empty={deals.length === 0} emptyMessage="Nessun deal attivo">
      <div className="divide-y divide-slate-50">
        {deals.slice(0, limit).map((deal: any) => (
          <Link key={deal.id} href={`/portal/deal-manage/${deal.id}`} className="block px-5 py-3 hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">{deal.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]">{deal.sector || deal.deal_type}</span>
                  <span className="text-[10px] text-slate-400">{deal.deal_stage}</span>
                </div>
              </div>
              {deal.ev_range && <span className="text-xs font-bold text-slate-600 flex-shrink-0 ml-2">{deal.ev_range}</span>}
            </div>
          </Link>
        ))}
      </div>
    </WidgetWrapper>
  );
}
