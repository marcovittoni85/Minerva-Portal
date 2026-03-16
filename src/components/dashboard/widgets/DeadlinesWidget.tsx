'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import WidgetWrapper from '../WidgetWrapper';

interface Props { config: WidgetConfig; }

interface Deadline { id: string; label: string; date: string; type: string; }

export default function DeadlinesWidget({ config }: Props) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/cockpit');
        const d = await res.json();
        const items: Deadline[] = [];
        (d.upcoming_deadlines || []).forEach((dl: any) => {
          items.push({ id: dl.id, label: dl.title || dl.deal_title || 'Scadenza', date: dl.due_date || dl.end_date, type: dl.type || 'task' });
        });
        // Also check tasks with due_date
        (d.overdue_tasks || []).forEach((t: any) => {
          items.push({ id: t.id, label: t.title, date: t.due_date, type: 'task' });
        });
        items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        setDeadlines(items.slice(0, config.limit || 5));
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  function daysUntil(dateStr: string) {
    const diff = Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
    return diff;
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
