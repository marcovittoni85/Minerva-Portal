'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import WidgetWrapper from '../WidgetWrapper';
import { Check } from 'lucide-react';

interface Props { config: WidgetConfig; }

export default function PendingFollowupsWidget({ config }: Props) {
  const [followups, setFollowups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/interactions?pending_followups=true&limit=' + (config.limit || 5));
        const d = await res.json();
        setFollowups(d.interactions || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function markDone(id: string) {
    await fetch('/api/interactions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, follow_up_done: true }),
    });
    setFollowups(prev => prev.filter(f => f.id !== id));
  }

  return (
    <WidgetWrapper title={config.title} loading={loading} empty={followups.length === 0} emptyMessage="Nessun follow-up pendente">
      <div className="divide-y divide-slate-50">
        {followups.map(fu => (
          <div key={fu.id} className="px-5 py-3 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{fu.title}</p>
              {fu.follow_up_date && (
                <p className={"text-[10px] font-bold uppercase tracking-widest mt-0.5 " + (
                  new Date(fu.follow_up_date) < new Date() ? 'text-red-500' : 'text-amber-500'
                )}>
                  {new Date(fu.follow_up_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}
                </p>
              )}
            </div>
            <button
              onClick={() => markDone(fu.id)}
              className="w-6 h-6 rounded-full border-2 border-emerald-400 text-emerald-400 hover:bg-emerald-400 hover:text-white flex items-center justify-center transition-all flex-shrink-0"
            >
              <Check size={12} />
            </button>
          </div>
        ))}
      </div>
    </WidgetWrapper>
  );
}
