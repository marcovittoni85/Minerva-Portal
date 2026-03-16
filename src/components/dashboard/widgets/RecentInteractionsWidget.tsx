'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import WidgetWrapper from '../WidgetWrapper';
import { INTERACTION_TYPE_CONFIG } from '@/types/relationship';
import { Users, Phone, Video, Send, Mail, StickyNote, UserPlus, Calendar, Briefcase, FileText, Clock, MoreHorizontal } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Users, Phone, Video, Send, Mail, StickyNote, UserPlus,
  Calendar, Briefcase, FileText, Clock, MoreHorizontal,
};

interface Props { config: WidgetConfig; }

export default function RecentInteractionsWidget({ config }: Props) {
  config = config || { title: 'Ultime Interazioni' };
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/interactions?limit=' + (config.limit || 5));
        if (!res.ok) return;
        const d = await res.json();
        setInteractions(Array.isArray(d.interactions) ? d.interactions : []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <WidgetWrapper title={config.title} loading={loading} empty={interactions.length === 0} emptyMessage="Nessuna interazione">
      <div className="divide-y divide-slate-50">
        {interactions.map((i: any) => {
          const cfg = INTERACTION_TYPE_CONFIG[i.interaction_type as keyof typeof INTERACTION_TYPE_CONFIG];
          const Icon = cfg ? (ICON_MAP[cfg.icon] || MoreHorizontal) : MoreHorizontal;
          return (
            <div key={i.id} className="px-5 py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: (cfg?.color || '#94A3B8') + '15' }}>
                <Icon size={14} style={{ color: cfg?.color || '#94A3B8' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{i.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                  <span>{cfg?.label}</span>
                  <span>{new Date(i.interaction_date).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
                  {i.contact?.full_name && <span className="font-medium text-slate-500">{i.contact.full_name}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetWrapper>
  );
}
