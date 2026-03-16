'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent, EVENT_TYPE_CONFIG } from '@/types/calendar';
import { Users, Phone, Video, Calendar, Clock, Bell } from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = { Users, Phone, Video, Calendar, Clock, Bell };

interface DealEventsProps {
  dealId: string;
  refresh?: number;
}

export default function DealEvents({ dealId, refresh }: DealEventsProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/calendar?deal_id=${dealId}`);
        const data = await res.json();
        setEvents(data.events || []);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, [dealId, refresh]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-5 h-5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (events.length === 0) {
    return <p className="text-sm text-slate-400 py-4">Nessun evento collegato</p>;
  }

  return (
    <div className="divide-y divide-slate-50">
      {events.map(ev => {
        const cfg = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.meeting;
        const Icon = ICON_MAP[cfg.icon] || Calendar;
        const c = ev.color || cfg.defaultColor;
        const startTime = new Date(ev.start_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        const startDate = new Date(ev.start_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
        const isPast = new Date(ev.start_at) < new Date();

        return (
          <div key={ev.id} className={"p-3 flex items-center gap-3 " + (isPast ? "opacity-60" : "")}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: c + '15' }}
            >
              <Icon size={14} style={{ color: c }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">{ev.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-slate-500">{startDate} · {startTime}</span>
                {ev.contact_name && (
                  <span className="text-[10px] text-slate-400">· {ev.contact_name}</span>
                )}
              </div>
            </div>
            {ev.outcome && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                Esito
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
