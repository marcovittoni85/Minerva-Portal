'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarEvent } from '@/types/calendar';

const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

  const days: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(d);
  return days;
}

interface MiniCalendarProps {
  events?: CalendarEvent[];
}

export default function MiniCalendar({ events: externalEvents }: MiniCalendarProps) {
  const router = useRouter();
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth());
  const [events, setEvents] = useState<CalendarEvent[]>(externalEvents || []);

  useEffect(() => {
    if (externalEvents) { setEvents(externalEvents); return; }
    const start = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const endDate = new Date(year, month + 1, 0);
    const end = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
    fetch(`/api/calendar?start=${start}&end=${end}`)
      .then(r => r.json())
      .then(d => setEvents(d.events || []))
      .catch(() => {});
  }, [year, month, externalEvents]);

  const days = getMonthDays(year, month);
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const monthName = new Date(year, month).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  // Map events to days
  const eventsByDay: Record<number, string[]> = {};
  events.forEach(ev => {
    const d = new Date(ev.start_at);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      if (eventsByDay[day].length < 3) eventsByDay[day].push(ev.color || '#3B82F6');
    }
  });

  function prev() {
    if (month === 0) { setMonth(11); setYear(year - 1); }
    else setMonth(month - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear(year + 1); }
    else setMonth(month + 1);
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
          <ChevronLeft size={16} className="text-slate-400" />
        </button>
        <button onClick={() => router.push('/portal/admin/calendar')}
          className="text-sm font-bold text-slate-800 capitalize hover:text-[#D4AF37] transition-colors">
          {monthName}
        </button>
        <button onClick={next} className="p-1 hover:bg-slate-50 rounded-lg transition-colors">
          <ChevronRight size={16} className="text-slate-400" />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-0 mb-1">
        {DAYS_IT.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-slate-400 uppercase tracking-wider py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-0">
        {days.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="h-8" />;
          const isToday = isCurrentMonth && day === today.getDate();
          const dayEvents = eventsByDay[day] || [];

          return (
            <button
              key={day}
              onClick={() => router.push(`/portal/admin/calendar?date=${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}
              className={`h-8 flex flex-col items-center justify-center rounded-lg text-xs transition-colors relative ${
                isToday ? 'ring-2 ring-[#D4AF37] font-black text-[#D4AF37]' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {day}
              {dayEvents.length > 0 && (
                <div className="flex gap-0.5 absolute bottom-0.5">
                  {dayEvents.map((c, j) => (
                    <div key={j} className="w-1 h-1 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
