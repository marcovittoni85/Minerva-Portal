'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import WidgetWrapper from '../WidgetWrapper';

interface Props { config: WidgetConfig; }

export default function MyTasksWidget({ config }: Props) {
  config = config || { title: 'I Miei Task' };
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/tasks?completed=false&sort=due_date&limit=' + (config.limit || 5));
        if (!res.ok) return;
        const d = await res.json();
        setTasks(Array.isArray(d.tasks) ? d.tasks : []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function toggleComplete(id: string) {
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_completed: true }),
    });
    setTasks(prev => prev.filter(t => t.id !== id));
  }

  return (
    <WidgetWrapper title={config.title} loading={loading} empty={tasks.length === 0} emptyMessage="Nessun task assegnato">
      <div className="divide-y divide-slate-50">
        {tasks.map(task => (
          <div key={task.id} className="px-5 py-3 flex items-start gap-3">
            <button
              onClick={() => toggleComplete(task.id)}
              className="w-5 h-5 rounded border-2 border-slate-300 hover:border-emerald-400 flex-shrink-0 mt-0.5 transition-colors"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {task.due_date && (
                  <span className="text-[10px] text-slate-400">
                    {new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                  </span>
                )}
                {task.deal_title && <span className="text-[10px] text-[#D4AF37] font-medium truncate">{task.deal_title}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
