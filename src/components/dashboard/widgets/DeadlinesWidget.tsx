'use client';

import { useMemo } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import { useCockpitData } from '../CockpitDataContext';
import WidgetWrapper from '../WidgetWrapper';

interface Props { config: WidgetConfig; }

interface Deadline { id: string; label: string; date: string; type: string; }

export default function DeadlinesWidget({ config }: Props) {
  config = config || { title: 'Scadenze Imminenti' };
  const { data: cockpit, loading } = useCockpitData();

  const deadlines = useMemo(() => {
    if (!cockpit) return [];
    const items: Deadline[] = [];
    (Array.isArray(cockpit.upcoming_deadlines) ? cockpit.upcoming_deadlines : []).forEach((dl: any) => {
      const date = dl.due_date || dl.end_date;
      if (date) items.push({ id: dl.id || crypto.randomUUID(), label: dl.title || dl.deal_title || 'Scadenza', date, type: dl.type || 'task' });
    });
    (Array.isArray(cockpit.tasks_today) ? cockpit.tasks_today : []).forEach((t: any) => {
      if (t.due_date && new Date(t.due_date) < new Date()) {
        items.push({ id: t.id || crypto.randomUUID(), label: t.title || 'Task', date: t.due_date, type: 'task' });
      }
    });
    items.sort((a, b) => {
      const ta = new Date(a.date).getTime();
      const tb = new Date(b.date).getTime();
      if (isNaN(ta) && isNaN(tb)) return 0;
      if (isNaN(ta)) return 1;
      if (isNaN(tb)) return -1;
      return ta - tb;
    });
    return items.slice(0, config.limit || 5);
  }, [cockpit, config.limit]);

  function daysUntil(dateStr: string) {
    if (!dateStr) return 999;
    const t = new Date(dateStr).getTime();
    if (isNaN(t)) return 999;
    return Math.ceil((t - Date.now()) / 86400000);
  }

  return (
    <WidgetWrapper title={config.title} loading={loading} empty={deadlines.length === 0} emptyMessage="Nessuna scadenza">
      <div className="divide-y divide-slate-50">
        {deadlines.map(dl => {
          const days = daysUntil(dl.date);
          const colorClass = days < 0 ? 'text-red-500 bg-red-50' : days <= 3 ? 'text-amber-600 bg-amber-50' : days <= 7 ? 'text-blue-600 bg-blue-50' : 'text-slate-600 bg-slate-50';
          return (
            <div key={dl.id} className="px-5 py-3 flex items-center gap-3">
              <span className={"text-xs font-black px-2.5 py-1 rounded-lg flex-shrink-0 " + colorClass}>
                {days < 0 ? `${Math.abs(days)}g fa` : days === 0 ? 'Oggi' : `${days}g`}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{dl.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(dl.date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetWrapper>
  );
}
