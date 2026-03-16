'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig, KPI_ITEMS_CATALOG } from '@/types/dashboard-builder';
import {
  Briefcase, LayoutGrid, Bell, Users, UserCheck, CircleDollarSign,
  Coins, Calendar, Star, Clock, AlertTriangle, BarChart3,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Briefcase, LayoutGrid, Bell, Users, UserCheck, CircleDollarSign,
  Coins, Calendar, Star, Clock, AlertTriangle, BarChart3,
};

interface Props { config: WidgetConfig; }

export default function KpiStripWidget({ config }: Props) {
  config = config || { title: 'KPI' };
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cockpit');
        if (!res.ok) return;
        const d = await res.json();
        // active_deals is an array of objects — use .length for count
        const activeDealsCount = Array.isArray(d.active_deals) ? d.active_deals.length : (typeof d.active_deals === 'number' ? d.active_deals : 0);
        setData({
          deals_active: activeDealsCount,
          deals_available: activeDealsCount,
          deals_involved: typeof d.deals_in_workgroup === 'number' ? d.deals_in_workgroup : 0,
          requests_pending: typeof d.pending_requests === 'number' ? d.pending_requests : 0,
          members_total: typeof d.total_members === 'number' ? d.total_members : 0,
          workgroup_count: typeof d.deals_in_workgroup === 'number' ? d.deals_in_workgroup : 0,
          fees_collected: typeof d.fees_collected === 'number' ? d.fees_collected : 0,
          fees_earned: typeof d.fees_collected === 'number' ? d.fees_collected : 0,
          events_upcoming: typeof d.upcoming_events === 'number' ? d.upcoming_events : 0,
          contacts_key: typeof d.key_contacts_count === 'number' ? d.key_contacts_count : 0,
          pending_followups: typeof d.followup_count === 'number' ? d.followup_count : 0,
          tasks_overdue: typeof d.overdue_count === 'number' ? d.overdue_count : 0,
        });
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const items = config.items || ['deals_active'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 6)}, 1fr)` }}>
      {items.map(key => {
        const kpi = KPI_ITEMS_CATALOG[key];
        if (!kpi) return null;
        const Icon = ICON_MAP[kpi.icon] || BarChart3;
        const raw = data[key];
        const val = typeof raw === 'number' ? raw : 0;
        return (
          <div key={key} className="text-center">
            <div className="w-9 h-9 rounded-xl mx-auto mb-1.5 flex items-center justify-center" style={{ backgroundColor: kpi.color + '12' }}>
              <Icon size={16} style={{ color: kpi.color }} />
            </div>
            <p className="text-xl font-black text-slate-900">{val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}</p>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">{kpi.label}</p>
          </div>
        );
      })}
    </div>
  );
}
