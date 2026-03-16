'use client';

import { useState, useEffect } from 'react';
import { WidgetConfig } from '@/types/dashboard-builder';
import { EVENT_TYPE_CONFIG } from '@/types/calendar';
import WidgetWrapper from '../WidgetWrapper';
import { Users, Phone, Video, Calendar, Clock, Bell } from 'lucide-react';
import Link from 'next/link';

const ICON_MAP: Record<string, React.ElementType> = { Users, Phone, Video, Calendar, Clock, Bell };

interface Props { config: WidgetConfig; }

export default function UpcomingEventsWidget({ config }: Props) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const today = new Date().toISOString().split('T')[0];
      const end = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
      try {
        const res = await fetch(`/api/calendar?start=${today}&end=${end}`);
        const d = await res.json();
        setEvents((d.events || []).slice(0, config.limit || 5));
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  return (
    <WidgetWrapper title={config.title} loading={loading} empty={events.length === 0} emptyMessage="Nessun evento in programma"
      headerAction={<Link href="/portal/admin/calendar" className="text-[10px] font-bold text-[#D4AF37] hover:text-[#b8962d] uppercase tracking-widest">Calendario</Link>}>
      <div className="divide-y divide-slate-50">
        {events.map(ev => {
          const cfg = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.meeting;
          const Icon = ICON_MAP[cfg.icon] || Calendar;
          const c = ev.color || cfg.defaultColor;
          return (
            <div key={ev.id} className="px-5 py-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: c + '15' }}>
                <Icon size={14} style={{ color: c }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 truncate">{ev.title}</p>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                  <span>{new Date(ev.start_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
                  <span>{new Date(ev.start_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                  {ev.contact_name && <span className="text-slate-500">{ev.contact_name}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </WidgetWrapper>
  );
}
