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
  const [data, setData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cockpit');
        const d = await res.json();
        setData({
          deals_active: d.active_deals ?? 0,
          deals_available: d.active_deals ?? 0,
          deals_involved: d.deals_in_workgroup ?? 0,
          requests_pending: d.pending_requests ?? 0,
          members_total: d.total_members ?? 0,
          workgroup_count: d.deals_in_workgroup ?? 0,
          fees_collected: d.fees_collected ?? 0,
          fees_earned: d.fees_collected ?? 0,
          events_upcoming: d.upcoming_events ?? 0,
          contacts_key: d.key_contacts ?? 0,
          pending_followups: d.pending_followups ?? 0,
          tasks_overdue: d.tasks_overdue ?? 0,
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
        const val = data[key] ?? 0;
        return (
          <div key={key} className="text-center">
            <div className="w-9 h-9 rounded-xl mx-auto mb-1.5 flex items-center justify-center" style={{ backgroundColor: kpi.color + '12' }}>
              <Icon size={16} style={{ color: kpi.color }} />
            </div>
            <p className="text-xl font-black text-slate-900">{typeof val === 'number' && val >= 1000 ? `${(val/1000).toFixed(0)}k` : val}</p>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-0.5">{kpi.label}</p>
          </div>
        );
      })}
    </div>
  );
}
