'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CockpitData, Task, PRIORITY_CONFIG } from '@/types/cockpit';
import { INTERACTION_TYPE_CONFIG } from '@/types/relationship';
import AddTaskModal from './AddTaskModal';
import MiniCalendar from '@/components/calendar/MiniCalendar';
import { CalendarEvent, EVENT_TYPE_CONFIG } from '@/types/calendar';
import {
  CheckSquare, Clock, Users, Briefcase, TrendingUp, MessageSquare,
  Plus, AlertTriangle, FileText, DollarSign,
  Phone, Video, Send, Mail, StickyNote, UserPlus, Calendar,
  MoreHorizontal,
} from 'lucide-react';

const INTERACTION_ICON_MAP: Record<string, React.ElementType> = {
  Users, Phone, Video, Send, Mail, StickyNote, UserPlus,
  Calendar, Briefcase, FileText, Clock, MoreHorizontal,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m fa`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h fa`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}g fa`;
  return `${Math.floor(days / 30)} mesi fa`;
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function formatDayHeader(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Buongiorno';
  if (h < 18) return 'Buon pomeriggio';
  return 'Buonasera';
}

const stageLabels: Record<string, string> = {
  board: 'Board', in_review: 'In Review', workgroup: 'Workgroup',
  in_progress: 'In Progress', closed_won: 'Won', closed_lost: 'Lost',
};

const stageColors: Record<string, string> = {
  board: 'bg-slate-100 text-slate-600',
  in_review: 'bg-amber-50 text-amber-700',
  workgroup: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-emerald-50 text-emerald-700',
  closed_won: 'bg-green-50 text-green-700',
  closed_lost: 'bg-red-50 text-red-600',
};

function getMacroColor(sector: string): string {
  if (sector?.includes('estate') || sector?.includes('Real')) return '#D4AF37';
  if (sector?.includes('Utility') || sector?.includes('Energia') || sector?.includes('Energy')) return '#10B981';
  if (sector?.includes('finanziari') || sector?.includes('Finance')) return '#3B82F6';
  return '#001220';
}

export default function CockpitDashboard() {
  const router = useRouter();
  const [data, setData] = useState<CockpitData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [upcomingEvents, setUpcomingEvents] = useState<CalendarEvent[]>([]);
  const [quickTask, setQuickTask] = useState('');
  const [completing, setCompleting] = useState<Set<string>>(new Set());
  const quickRef = useRef<HTMLInputElement>(null);

  async function fetchData() {
    try {
      const res = await fetch('/api/cockpit');
      const json = await res.json();
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // Fetch next 3 events
    const today = new Date().toISOString().slice(0, 10);
    const nextMonth = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
    fetch(`/api/calendar?start=${today}&end=${nextMonth}`)
      .then(r => r.json())
      .then(d => setUpcomingEvents((d.events || []).slice(0, 3)))
      .catch(() => {});
  }, []);

  async function toggleTask(taskId: string, completed: boolean) {
    setCompleting(prev => new Set(prev).add(taskId));
    await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, is_completed: completed }),
    });
    // Optimistic: remove from lists
    if (completed && data) {
      setData({
        ...data,
        tasks_today: data.tasks_today.filter(t => t.id !== taskId),
        tasks_upcoming: data.tasks_upcoming.filter(t => t.id !== taskId),
      });
    }
    setCompleting(prev => { const s = new Set(prev); s.delete(taskId); return s; });
  }

  async function handleQuickTask(e: React.FormEvent) {
    e.preventDefault();
    if (!quickTask.trim()) return;
    const today = new Date().toISOString().slice(0, 10);
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: quickTask.trim(), due_date: today, priority: 'normal', category: 'other' }),
    });
    setQuickTask('');
    fetchData();
  }

  if (loading || !data) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Group upcoming tasks by day
  const upcomingByDay: Record<string, Task[]> = {};
  data.tasks_upcoming.forEach(t => {
    const day = t.due_date || 'no-date';
    if (!upcomingByDay[day]) upcomingByDay[day] = [];
    upcomingByDay[day].push(t);
  });

  const openTaskCount = data.tasks_today.length + data.tasks_upcoming.length;

  function renderTask(task: Task) {
    const pri = PRIORITY_CONFIG[task.priority];
    const isOverdue = task.due_date && daysUntil(task.due_date) < 0;
    const isCompleting = completing.has(task.id);

    return (
      <div
        key={task.id}
        className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all group ${
          isOverdue ? 'bg-red-50/60' : 'hover:bg-slate-50/50'
        } ${isCompleting ? 'opacity-50' : ''}`}
      >
        {/* Checkbox */}
        <button
          onClick={() => toggleTask(task.id, true)}
          className="w-5 h-5 rounded-md border-2 border-slate-300 hover:border-[#D4AF37] flex items-center justify-center flex-shrink-0 transition-colors"
        >
          {isCompleting && <CheckSquare size={12} className="text-[#D4AF37]" />}
        </button>

        {/* Priority dot */}
        <span className="text-sm flex-shrink-0">{pri.emoji}</span>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <span className="text-sm text-slate-800">{task.title}</span>
          <div className="flex items-center gap-2 mt-0.5">
            {task.deal?.title && (
              <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{task.deal.title}</span>
            )}
            {task.contact?.full_name && (
              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{task.contact.full_name}</span>
            )}
          </div>
        </div>

        {/* Due info */}
        {task.due_date && (
          <span className={`text-[10px] font-medium flex-shrink-0 ${isOverdue ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
            {isOverdue ? `${Math.abs(daysUntil(task.due_date))}g scaduto` : daysUntil(task.due_date) === 0 ? 'Oggi' : `tra ${daysUntil(task.due_date)}g`}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-[#001220] tracking-tight">
          {getGreeting()}, <span className="text-[#D4AF37]">{data.user_name?.split(' ')[0]}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1 capitalize">{todayStr}</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Task Aperti', value: openTaskCount, icon: CheckSquare, color: 'text-slate-700' },
          { label: 'Scaduti', value: data.overdue_count, icon: AlertTriangle, color: data.overdue_count > 0 ? 'text-red-600' : 'text-slate-400', bg: data.overdue_count > 0 ? 'bg-red-50 border-red-100' : '' },
          { label: 'Follow-up', value: data.followup_count, icon: Clock, color: 'text-amber-600' },
          { label: 'Deal Attivi', value: data.active_deals.length, icon: Briefcase, color: 'text-blue-600' },
          { label: 'Contatti Key', value: data.key_contacts_count, icon: Users, color: 'text-emerald-600' },
          { label: 'Interaz. Sett.', value: data.interactions_this_week, icon: MessageSquare, color: 'text-purple-600' },
        ].map(kpi => (
          <div key={kpi.label} className={`bg-white border border-slate-100 rounded-2xl p-4 ${kpi.bg || ''}`}>
            <div className="flex items-center gap-2 mb-2">
              <kpi.icon size={14} className="text-slate-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{kpi.label}</span>
            </div>
            <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* LEFT — 3 cols */}
        <div className="lg:col-span-3 space-y-6">

          {/* Tasks Today */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-50 flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Task di Oggi</h3>
              <button onClick={() => setShowTaskModal(true)}
                className="flex items-center gap-1 text-[#D4AF37] hover:text-[#b8962d] text-xs font-bold uppercase tracking-widest transition-colors">
                <Plus size={14} /> Nuovo
              </button>
            </div>

            <div className="p-3">
              {data.tasks_today.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">Nessun task per oggi</p>
              ) : (
                <div className="space-y-1">
                  {data.tasks_today.map(renderTask)}
                </div>
              )}

              {/* Quick add */}
              <form onSubmit={handleQuickTask} className="mt-3 pt-3 border-t border-slate-50">
                <div className="flex items-center gap-2 px-3">
                  <Plus size={14} className="text-slate-300" />
                  <input
                    ref={quickRef}
                    type="text"
                    value={quickTask}
                    onChange={e => setQuickTask(e.target.value)}
                    placeholder="Aggiungi task..."
                    className="flex-1 text-sm text-slate-700 placeholder:text-slate-300 outline-none bg-transparent py-2"
                  />
                </div>
              </form>
            </div>
          </div>

          {/* Tasks Next 7 Days */}
          {Object.keys(upcomingByDay).length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-50">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Prossimi 7 Giorni</h3>
              </div>
              <div className="p-3">
                {Object.entries(upcomingByDay).map(([day, tasks]) => (
                  <div key={day} className="mb-4 last:mb-0">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-1 capitalize">
                      {formatDayHeader(day)}
                    </p>
                    <div className="space-y-1">
                      {tasks.map(renderTask)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — 2 cols */}
        <div className="lg:col-span-2 space-y-6">

          {/* Mini Calendar */}
          <MiniCalendar />

          {/* Prossimi Appuntamenti */}
          {upcomingEvents.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-50">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Prossimi Appuntamenti</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {upcomingEvents.map(ev => {
                  const cfg = EVENT_TYPE_CONFIG[ev.event_type] || EVENT_TYPE_CONFIG.meeting;
                  const EvIcon = INTERACTION_ICON_MAP[cfg.icon] || Calendar;
                  const c = ev.color || cfg.defaultColor;
                  const d = new Date(ev.start_at);
                  return (
                    <div key={ev.id} onClick={() => router.push('/portal/admin/calendar')}
                      className="flex items-center gap-3 p-4 hover:bg-slate-50/50 cursor-pointer transition-colors">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: c + '15' }}>
                        <EvIcon size={14} style={{ color: c }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{ev.title}</p>
                        <p className="text-[10px] text-slate-400">
                          {d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })} · {d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
                          {ev.contact_name && ` · ${ev.contact_name}`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Deal Caldi */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Deal Caldi</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {data.active_deals.length === 0 ? (
                <p className="p-5 text-sm text-slate-400">Nessun deal attivo</p>
              ) : (
                data.active_deals.map(deal => (
                  <div
                    key={deal.id}
                    onClick={() => router.push(`/portal/deal-manage/${deal.id}`)}
                    className="flex items-center gap-3 p-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    <div className="w-1 h-10 rounded-full flex-shrink-0" style={{ backgroundColor: getMacroColor(deal.sector) }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{deal.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${stageColors[deal.deal_stage] || 'bg-slate-100 text-slate-500'}`}>
                          {stageLabels[deal.deal_stage] || deal.deal_stage}
                        </span>
                        {deal.estimated_ev && (
                          <span className="text-[10px] text-slate-400">{deal.estimated_ev}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Scadenze Imminenti */}
          {data.upcoming_deadlines.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-50">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Scadenze Imminenti</h3>
              </div>
              <div className="divide-y divide-slate-50">
                {data.upcoming_deadlines.map((dl, i) => {
                  const days = daysUntil(dl.due_date);
                  const deadlineIcon = dl.type === 'document' ? FileText
                    : dl.type === 'follow_up' ? Clock
                    : dl.type === 'fee' ? DollarSign
                    : AlertTriangle;
                  const DeadlineIcon = deadlineIcon;
                  const countdownColor = days < 3 ? 'text-red-500' : days < 7 ? 'text-amber-500' : 'text-emerald-500';

                  return (
                    <div key={i} className="flex items-center gap-3 p-4">
                      <DeadlineIcon size={16} className="text-slate-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800 truncate">{dl.title}</p>
                        {dl.deal_title && <p className="text-[10px] text-slate-400">{dl.deal_title}</p>}
                      </div>
                      <span className={`text-xs font-bold flex-shrink-0 ${countdownColor}`}>
                        {days === 0 ? 'Oggi' : days === 1 ? 'Domani' : `tra ${days}g`}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Ultime Interazioni */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-50">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Ultime Interazioni</h3>
            </div>
            <div className="divide-y divide-slate-50">
              {data.recent_interactions.length === 0 ? (
                <p className="p-5 text-sm text-slate-400">Nessuna interazione recente</p>
              ) : (
                data.recent_interactions.map(inter => {
                  const typeCfg = INTERACTION_TYPE_CONFIG[inter.interaction_type as keyof typeof INTERACTION_TYPE_CONFIG];
                  const Icon = typeCfg ? INTERACTION_ICON_MAP[typeCfg.icon] || MoreHorizontal : MoreHorizontal;
                  const color = typeCfg?.color || '#94A3B8';

                  return (
                    <div
                      key={inter.id}
                      onClick={() => router.push(`/portal/admin/relationships/${inter.contact_id}`)}
                      className="flex items-center gap-3 p-4 hover:bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: color + '15' }}>
                        <Icon size={14} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-800">
                          <span className="font-bold">{inter.contact_name}</span>
                          {inter.contact_company && <span className="text-slate-400"> · {inter.contact_company}</span>}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{inter.title}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 flex-shrink-0">
                        {timeAgo(inter.interaction_date)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
      <AddTaskModal
        open={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSaved={fetchData}
      />
    </div>
  );
}
