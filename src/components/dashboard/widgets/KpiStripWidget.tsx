'use client';

import { WidgetConfig, KPI_ITEMS_CATALOG } from '@/types/dashboard-builder';
import { useCockpitData } from '../CockpitDataContext';
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
  const { data: cockpit, loading } = useCockpitData();

  const data: Record<string, number> = {};
  if (cockpit) {
    const activeDealsCount = Array.isArray(cockpit.active_deals) ? cockpit.active_deals.length : (typeof cockpit.active_deals === 'number' ? cockpit.active_deals : 0);
    Object.assign(data, {
      deals_active: activeDealsCount,
      deals_available: activeDealsCount,
      deals_involved: typeof cockpit.deals_in_workgroup === 'number' ? cockpit.deals_in_workgroup : 0,
      requests_pending: typeof cockpit.pending_requests === 'number' ? cockpit.pending_requests : 0,
      members_total: typeof cockpit.total_members === 'number' ? cockpit.total_members : 0,
      workgroup_count: typeof cockpit.deals_in_workgroup === 'number' ? cockpit.deals_in_workgroup : 0,
      fees_collected: typeof cockpit.fees_collected === 'number' ? cockpit.fees_collected : 0,
      fees_earned: typeof cockpit.fees_collected === 'number' ? cockpit.fees_collected : 0,
      events_upcoming: typeof cockpit.upcoming_events === 'number' ? cockpit.upcoming_events : 0,
      contacts_key: typeof cockpit.key_contacts_count === 'number' ? cockpit.key_contacts_count : 0,
      pending_followups: typeof cockpit.followup_count === 'number' ? cockpit.followup_count : 0,
      tasks_overdue: typeof cockpit.overdue_count === 'number' ? cockpit.overdue_count : 0,
    });
  }

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
