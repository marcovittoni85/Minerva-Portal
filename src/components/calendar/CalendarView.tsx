'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { CalendarEvent, EVENT_TYPE_CONFIG } from '@/types/calendar';
import EventForm from './EventForm';
import EventDetail from './EventDetail';
import {
  ChevronLeft, ChevronRight, Plus,
  Users, Phone, Video, Calendar, Clock, Bell,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = { Users, Phone, Video, Calendar, Clock, Bell };
const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8); // 8-22

type ViewMode = 'month' | 'week' | 'day';

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;
  const days: (Date | null)[] = [];
  for (let i = 0; i < startWeekday; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

function getWeekDays(date: Date): Date[] {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarView() {
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date');

  const [currentDate, setCurrentDate] = useState(initialDate ? new Date(initialDate + 'T00:00:00') : new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showEventForm, setShowEventForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [prefillDate, setPrefillDate] = useState<string>('');

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    let start: string, end: string;

    if (viewMode === 'month') {
      const y = currentDate.getFullYear(), m = currentDate.getMonth();
      start = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const lastDay = new Date(y, m + 1, 0);
      end = formatDateKey(lastDay);
    } else if (viewMode === 'week') {
      const weekDays = getWeekDays(currentDate);
      start = formatDateKey(weekDays[0]);
      end = formatDateKey(weekDays[6]);
    } else {
      start = formatDateKey(currentDate);
      end = start;
    }

    try {
      const res = await fetch(`/api/calendar?start=${start}&end=${end}`);
      const data = await res.json();
      setEvents(data.events || []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [currentDate, viewMode]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  function navigate(dir: number) {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + dir);
    else if (viewMode === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  }

  function goToday() { setCurrentDate(new Date()); }

  function openNewEvent(date?: string) {
    setPrefillDate(date || formatDateKey(currentDate));
    setEditEvent(null);
    setShowEventForm(true);
  }

  function openEditEvent(ev: CalendarEvent) {
    setEditEvent(ev);
    setSelectedEvent(null);
    setShowEventForm(true);
  }

  const today = new Date();

  // Group events by date key
  const eventsByDate: Record<string, CalendarEvent[]> = {};
  events.forEach(ev => {
    const key = formatDateKey(new Date(ev.start_at));
    if (!eventsByDate[key]) eventsByDate[key] = [];
    eventsByDate[key].push(ev);
  });

  // Header title
  let headerTitle = '';
  if (viewMode === 'month') {
    headerTitle = currentDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });
  } else if (viewMode === 'week') {
    const wd = getWeekDays(currentDate);
    headerTitle = `${wd[0].getDate()} ${wd[0].toLocaleDateString('it-IT', { month: 'short' })} - ${wd[6].getDate()} ${wd[6].toLocaleDateString('it-IT', { month: 'short', year: 'numeric' })}`;
  } else {
    headerTitle = currentDate.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }

  function renderEventPill(ev: CalendarEvent, compact = false) {
    const cfg = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.meeting;
    const Icon = ICON_MAP[cfg.icon] || Calendar;
    const c = ev.color || cfg.defaultColor;
    const time = new Date(ev.start_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });

    return (
      <button
        key={ev.id}
        onClick={e => { e.stopPropagation(); setSelectedEvent(ev); }}
        className="w-full text-left flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:opacity-80 transition-opacity text-[10px] truncate"
        style={{ backgroundColor: c + '18', borderLeft: `3px solid ${c}` }}
      >
        {!compact && <Icon size={10} style={{ color: c }} className="flex-shrink-0" />}
        {!compact && <span className="font-medium text-slate-600">{time}</span>}
        <span className="font-bold text-slate-800 truncate">{ev.title}</span>
      </button>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronLeft size={20} className="text-slate-500" />
            </button>
            <button onClick={() => navigate(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <ChevronRight size={20} className="text-slate-500" />
            </button>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-[#001220] capitalize">{headerTitle}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={goToday}
            className="border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors">
            Oggi
          </button>

          {/* View toggle */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden">
            {(['month', 'week', 'day'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setViewMode(v)}
                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                  viewMode === v ? 'bg-[#D4AF37] text-white' : 'text-slate-500 hover:bg-slate-50'
                }`}>
                {v === 'month' ? 'Mese' : v === 'week' ? 'Settimana' : 'Giorno'}
              </button>
            ))}
          </div>

          <button onClick={() => openNewEvent()}
            className="bg-[#D4AF37] hover:bg-[#b8962d] text-white font-bold px-4 py-2 rounded-xl transition-colors text-xs uppercase tracking-widest flex items-center gap-1.5">
            <Plus size={14} /> Evento
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* MONTH VIEW */}
          {viewMode === 'month' && (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100">
                {DAYS_IT.map(d => (
                  <div key={d} className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-400 py-3">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7">
                {getMonthDays(currentDate.getFullYear(), currentDate.getMonth()).map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} className="min-h-[90px] border-b border-r border-slate-50" />;
                  const key = formatDateKey(date);
                  const dayEvents = eventsByDate[key] || [];
                  const isToday = isSameDay(date, today);

                  return (
                    <div key={key}
                      onClick={() => { setViewMode('day'); setCurrentDate(date); }}
                      className="min-h-[90px] border-b border-r border-slate-50 p-1.5 cursor-pointer hover:bg-slate-50/30 transition-colors">
                      <div className={`text-xs font-bold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${
                        isToday ? 'bg-[#D4AF37] text-white' : 'text-slate-600'
                      }`}>
                        {date.getDate()}
                      </div>
                      <div className="space-y-0.5">
                        {dayEvents.slice(0, 3).map(ev => renderEventPill(ev, true))}
                        {dayEvents.length > 3 && (
                          <p className="text-[9px] font-bold text-slate-400 pl-1">+{dayEvents.length - 3}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {viewMode === 'week' && (() => {
            const weekDays = getWeekDays(currentDate);
            return (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                {/* Week header */}
                <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100">
                  <div />
                  {weekDays.map(d => {
                    const isToday = isSameDay(d, today);
                    return (
                      <div key={formatDateKey(d)} className="text-center py-3 border-l border-slate-50">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                          {DAYS_IT[d.getDay() === 0 ? 6 : d.getDay() - 1]}
                        </p>
                        <p className={`text-lg font-black ${isToday ? 'text-[#D4AF37]' : 'text-slate-800'}`}>
                          {d.getDate()}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Time grid */}
                <div className="relative max-h-[600px] overflow-y-auto">
                  {HOURS.map(hour => (
                    <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] min-h-[50px] border-b border-slate-50">
                      <div className="text-[10px] text-slate-400 font-medium text-right pr-2 pt-1">
                        {String(hour).padStart(2, '0')}:00
                      </div>
                      {weekDays.map(d => {
                        const key = formatDateKey(d);
                        const hourEvents = (eventsByDate[key] || []).filter(ev => {
                          const h = new Date(ev.start_at).getHours();
                          return h === hour;
                        });
                        return (
                          <div key={`${key}-${hour}`}
                            onClick={() => openNewEvent(key)}
                            className="border-l border-slate-50 p-0.5 cursor-pointer hover:bg-slate-50/30 transition-colors">
                            {hourEvents.map(ev => renderEventPill(ev))}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* DAY VIEW */}
          {viewMode === 'day' && (() => {
            const key = formatDateKey(currentDate);
            const dayEvents = eventsByDate[key] || [];
            return (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                <div className="relative max-h-[600px] overflow-y-auto">
                  {HOURS.map(hour => {
                    const hourEvents = dayEvents.filter(ev => new Date(ev.start_at).getHours() === hour);
                    return (
                      <div key={hour} className="grid grid-cols-[60px_1fr] min-h-[60px] border-b border-slate-50">
                        <div className="text-[10px] text-slate-400 font-medium text-right pr-3 pt-2">
                          {String(hour).padStart(2, '0')}:00
                        </div>
                        <div
                          onClick={() => openNewEvent(key)}
                          className="p-1.5 cursor-pointer hover:bg-slate-50/30 transition-colors border-l border-slate-50">
                          {hourEvents.map(ev => {
                            const cfg = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.meeting;
                            const Icon = ICON_MAP[cfg.icon] || Calendar;
                            const c = ev.color || cfg.defaultColor;
                            const startTime = new Date(ev.start_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
                            const endTime = ev.end_at ? new Date(ev.end_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : '';

                            return (
                              <button key={ev.id} onClick={e => { e.stopPropagation(); setSelectedEvent(ev); }}
                                className="w-full text-left p-3 rounded-xl mb-1 hover:opacity-90 transition-opacity"
                                style={{ backgroundColor: c + '12', borderLeft: `4px solid ${c}` }}>
                                <div className="flex items-center gap-2">
                                  <Icon size={14} style={{ color: c }} />
                                  <span className="text-sm font-bold text-slate-900">{ev.title}</span>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-0.5">
                                  {startTime}{endTime ? ` - ${endTime}` : ''}
                                  {ev.contact_name && ` · ${ev.contact_name}`}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </>
      )}

      {/* Event Form Modal */}
      <EventForm
        open={showEventForm}
        onClose={() => { setShowEventForm(false); setEditEvent(null); }}
        onSaved={fetchEvents}
        event={editEvent}
        prefillDate={prefillDate}
      />

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetail
          event={selectedEvent}
          open={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onUpdated={fetchEvents}
          onEdit={() => openEditEvent(selectedEvent)}
        />
      )}
    </div>
  );
}
