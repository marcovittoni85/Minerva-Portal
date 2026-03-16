'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import WidgetWrapper from '../WidgetWrapper';
import { CheckSquare } from 'lucide-react';

interface Props { config: WidgetConfig; }

export default function PendingTasksWidget({ config }: Props) {
  config = config || { title: 'Task Urgenti' };
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
    <WidgetWrapper title={config.title} loading={loading} empty={tasks.length === 0} emptyMessage="Nessun task urgente">
      <div className="divide-y divide-slate-50">
        {tasks.map(task => {
          const isOverdue = task.due_date && new Date(task.due_date) < new Date();
          return (
            <div key={task.id} className="px-5 py-3 flex items-start gap-3">
              <button
                onClick={() => toggleComplete(task.id)}
                className="w-5 h-5 rounded border-2 border-slate-300 hover:border-[#D4AF37] flex-shrink-0 mt-0.5 transition-colors flex items-center justify-center"
              >
                <CheckSquare size={0} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {task.due_date && (
                    <span className={"text-[10px] font-bold uppercase tracking-widest " + (isOverdue ? 'text-red-500' : 'text-slate-400')}>
                      {new Date(task.due_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                  {task.priority && (
                    <span className={"text-[9px] font-bold uppercase tracking-widest " + (
                      task.priority === 'urgent' ? 'text-red-500' : task.priority === 'high' ? 'text-amber-500' : 'text-slate-400'
                    )}>{task.priority}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetWrapper>
  );
}
