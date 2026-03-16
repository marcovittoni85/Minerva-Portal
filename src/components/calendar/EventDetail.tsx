'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarEvent, EVENT_TYPE_CONFIG } from '@/types/calendar';
import {
  X, MapPin, ExternalLink, Users, Phone, Video,
  Calendar, Clock, Bell, Briefcase, User,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = { Users, Phone, Video, Calendar, Clock, Bell };

function formatDateTime(dateStr: string, allDay: boolean): string {
  const d = new Date(dateStr);
  if (allDay) return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' }) + ' ' +
    d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
}

interface EventDetailProps {
  event: CalendarEvent;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
  onEdit: () => void;
}

export default function EventDetail({ event, open, onClose, onUpdated, onEdit }: EventDetailProps) {
  const router = useRouter();
  const [outcome, setOutcome] = useState(event.outcome || '');
  const [savingOutcome, setSavingOutcome] = useState(false);
  const [outcomeSaved, setOutcomeSaved] = useState(false);

  if (!open) return null;

  const typeCfg = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.meeting;
  const Icon = ICON_MAP[typeCfg.icon] || Calendar;
  const eventColor = event.color || typeCfg.defaultColor;

  async function handleSaveOutcome() {
    setSavingOutcome(true);
    setOutcomeSaved(false);
    try {
      const res = await fetch('/api/calendar', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id, outcome: outcome.trim() || null }),
      });
      if (res.ok) {
        setOutcomeSaved(true);
        onUpdated();
        setTimeout(() => setOutcomeSaved(false), 2000);
      }
    } finally {
      setSavingOutcome(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Cancellare questo evento?')) return;
    await fetch(`/api/calendar?id=${event.id}`, { method: 'DELETE' });
    onUpdated();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 rounded-t-2xl" style={{ backgroundColor: eventColor + '15' }}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: eventColor + '25' }}>
                <Icon size={20} style={{ color: eventColor }} />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900">{event.title}</h2>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: eventColor }}>
                  {typeCfg.label}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Date/Time */}
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-slate-400" />
            <div>
              <p className="text-sm text-slate-800">{formatDateTime(event.start_at, event.all_day)}</p>
              {event.end_at && !event.all_day && (
                <p className="text-xs text-slate-400">fino alle {new Date(event.end_at).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</p>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-center gap-3">
              <MapPin size={16} className="text-slate-400" />
              <p className="text-sm text-slate-800">{event.location}</p>
            </div>
          )}

          {/* External link */}
          {event.external_link && (
            <a href={event.external_link} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors text-sm font-medium">
              <Video size={16} /> Apri Meet / Zoom <ExternalLink size={12} />
            </a>
          )}

          {/* Contact */}
          {event.contact_name && (
            <button onClick={() => { onClose(); router.push(`/portal/admin/relationships/${event.contact_id}`); }}
              className="flex items-center gap-3 w-full text-left hover:bg-slate-50 p-2 rounded-xl transition-colors">
              <User size={16} className="text-slate-400" />
              <div>
                <p className="text-sm font-bold text-slate-800">{event.contact_name}</p>
                {event.contact_company && <p className="text-[10px] text-slate-400">{event.contact_company}</p>}
              </div>
            </button>
          )}

          {/* Deal */}
          {event.deal_title && (
            <button onClick={() => { onClose(); router.push(`/portal/deal-manage/${event.deal_id}`); }}
              className="flex items-center gap-3 w-full text-left hover:bg-slate-50 p-2 rounded-xl transition-colors">
              <Briefcase size={16} className="text-slate-400" />
              <p className="text-sm font-bold text-blue-600">{event.deal_title}</p>
            </button>
          )}

          {/* Description */}
          {event.description && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Descrizione</p>
              <p className="text-sm text-slate-600 leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* Outcome */}
          <div className="border-t border-slate-100 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
              Outcome / Note post-meeting
            </p>
            {event.contact_id && !event.outcome && (
              <p className="text-[10px] text-amber-600 mb-2">
                Salvando l'outcome, viene creata automaticamente un'interazione nella timeline del contatto.
              </p>
            )}
            <textarea
              value={outcome}
              onChange={e => setOutcome(e.target.value)}
              rows={3}
              placeholder="Come e andato? Next steps..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] resize-none"
            />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={handleSaveOutcome} disabled={savingOutcome}
                className="bg-[#D4AF37] hover:bg-[#b8962d] text-white font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 text-xs uppercase tracking-widest">
                {savingOutcome ? '...' : 'Salva Outcome'}
              </button>
              {outcomeSaved && <span className="text-xs text-emerald-600 font-bold">Salvato!</span>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
            <button onClick={onEdit}
              className="flex-1 border border-slate-200 text-slate-600 font-bold py-2 rounded-xl transition-colors text-xs uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37]">
              Modifica
            </button>
            <button onClick={handleDelete}
              className="border border-red-200 text-red-500 font-bold px-4 py-2 rounded-xl transition-colors text-xs uppercase tracking-widest hover:bg-red-50">
              Cancella
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
