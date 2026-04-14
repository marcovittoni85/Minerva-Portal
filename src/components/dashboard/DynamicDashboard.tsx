'use client';

import { useState, useEffect } from 'react';
import { WidgetPosition } from '@/types/dashboard-builder';
import { CockpitDataProvider } from './CockpitDataContext';
import KpiStripWidget from './widgets/KpiStripWidget';
import HotDealsWidget from './widgets/HotDealsWidget';
import DealBoardPreviewWidget from './widgets/DealBoardPreviewWidget';
import PendingTasksWidget from './widgets/PendingTasksWidget';
import MyTasksWidget from './widgets/MyTasksWidget';
import RecentInteractionsWidget from './widgets/RecentInteractionsWidget';
import PendingFollowupsWidget from './widgets/PendingFollowupsWidget';
import FeeOverviewWidget from './widgets/FeeOverviewWidget';
import UpcomingEventsWidget from './widgets/UpcomingEventsWidget';
import DeadlinesWidget from './widgets/DeadlinesWidget';
import WelcomeTextWidget from './widgets/WelcomeTextWidget';
import RequestsPendingWidget from './widgets/RequestsPendingWidget';

const WIDGET_COMPONENTS: Record<string, React.ComponentType<{ config: any }>> = {
  kpi_strip: KpiStripWidget,
  hot_deals: HotDealsWidget,
  deal_board_preview: DealBoardPreviewWidget,
  pending_tasks: PendingTasksWidget,
  my_tasks: MyTasksWidget,
  recent_interactions: RecentInteractionsWidget,
  pending_followups: PendingFollowupsWidget,
  fee_overview: FeeOverviewWidget,
  upcoming_events: UpcomingEventsWidget,
  deadlines: DeadlinesWidget,
  welcome_text: WelcomeTextWidget,
  requests_pending: RequestsPendingWidget,
};

export default function DynamicDashboard() {
  const [layout, setLayout] = useState<WidgetPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/dashboard-config');
        const data = await res.json();
        setLayout(data.config?.layout || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (layout.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-lg font-bold text-slate-400">Dashboard non configurata</p>
        <p className="text-sm text-slate-400 mt-1">Contatta l'amministratore per configurare la tua dashboard.</p>
      </div>
    );
  }

  // Sort by y then x
  const sorted = [...layout].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);

  return (
    <CockpitDataProvider>
      <div className="grid grid-cols-12 gap-4">
        {sorted.map(widget => {
          const Component = WIDGET_COMPONENTS[widget.widget];
          if (!Component) return null;

          return (
            <div
              key={widget.id}
              style={{ gridColumn: `span ${widget.w}` }}
              className="min-h-0"
            >
              <Component config={widget.config} />
            </div>
          );
        })}
      </div>
    </CockpitDataProvider>
  );
}
