'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import WidgetWrapper from '../WidgetWrapper';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';

interface Props { config: WidgetConfig; }

export default function DealBoardPreviewWidget({ config }: Props) {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from('deals')
        .select('id, title, sector, deal_type, ev_range, deal_stage, is_visible_board')
        .eq('active', true)
        .eq('is_visible_board', true)
        .order('created_at', { ascending: false })
        .limit(config.limit || 6);
      setDeals(data || []);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <WidgetWrapper title={config.title} loading={loading} empty={deals.length === 0} emptyMessage="Nessun deal in bacheca"
      headerAction={<Link href="/portal/board" className="text-[10px] font-bold text-[#D4AF37] hover:text-[#b8962d] uppercase tracking-widest">Vedi tutti</Link>}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
        {deals.map(deal => (
          <Link key={deal.id} href={`/portal/deals/${deal.id}`}
            className="border border-slate-100 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <span className="text-[9px] font-bold uppercase tracking-widest text-[#D4AF37]">{deal.sector || deal.deal_type}</span>
            <p className="text-sm font-bold text-slate-900 mt-1 line-clamp-2">{deal.title}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-400">{deal.deal_stage}</span>
              {deal.ev_range && <span className="text-[10px] font-bold text-slate-600">{deal.ev_range}</span>}
            </div>
          </Link>
        ))}
      </div>
    </WidgetWrapper>
  );
}
