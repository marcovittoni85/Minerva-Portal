'use client';

import { useState, useEffect } from 'react';
import { X, Users, Phone, Video, Calendar, Clock, Bell } from 'lucide-react';
import { CalendarEvent, EVENT_TYPE_CONFIG, CALENDAR_COLORS } from '@/types/calendar';

const ICON_MAP: Record<string, React.ElementType> = { Users, Phone, Video, Calendar, Clock, Bell };

interface EventFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  event?: CalendarEvent | null;
  prefillDate?: string;
  prefillDealId?: string;
  prefillDealTitle?: string;
  prefillContactId?: string;
  prefillContactName?: string;
}

export default function EventForm({
  open, onClose, onSaved, event,
  prefillDate, prefillDealId, prefillDealTitle,
  prefillContactId, prefillContactName,
}: EventFormProps) {
  const isEdit = !!event;

  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState('meeting');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [dealId, setDealId] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [contactId, setContactId] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState(30);
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const [contacts, setContacts] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch('/api/contacts?limit=100&sort=name')
      .then(r => r.json())
      .then(d => setContacts((d.contacts || []).map((c: any) => ({ id: c.id, full_name: c.full_name }))))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setEventType(event.event_type);
      const s = new Date(event.start_at);
      setStartDate(s.toISOString().slice(0, 10));
      setStartTime(s.toTimeString().slice(0, 5));
      if (event.end_at) {
        const e = new Date(event.end_at);
        setEndDate(e.toISOString().slice(0, 10));
        setEndTime(e.toTimeString().slice(0, 5));
      }
      setAllDay(event.all_day);
      setLocation(event.location || '');
      setExternalLink(event.external_link || '');
      setColor(event.color || '#3B82F6');
      setDealId(event.deal_id || '');
      setDealSearch(event.deal_title || '');
      setContactId(event.contact_id || '');
      setContactSearch(event.contact_name || '');
      setReminderMinutes(event.reminder_minutes);
      setDescription(event.description || '');
    } else {
      const d = prefillDate || new Date().toISOString().slice(0, 10);
      setStartDate(d);
      setEndDate(d);
      setTitle('');
      setEventType('meeting');
      setStartTime('09:00');
      setEndTime('10:00');
      setAllDay(false);
      setLocation('');
      setExternalLink('');
      setColor('#3B82F6');
      setDealId(prefillDealId || '');
      setDealSearch(prefillDealTitle || '');
      setContactId(prefillContactId || '');
      setContactSearch(prefillContactName || '');
      setReminderMinutes(30);
      setDescription('');
    }
  }, [event, open, prefillDate, prefillDealId, prefillDealTitle, prefillContactId, prefillContactName]);

  if (!open) return null;

  const filteredContacts = contacts.filter(c => c.full_name.toLowerCase().includes(contactSearch.toLowerCase()));

  function handleTypeChange(type: string) {
    setEventType(type);
    const cfg = EVENT_TYPE_CONFIG[type];
    if (cfg) setColor(cfg.defaultColor);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !startDate) return;
    setSaving(true);
    try {
      const startAt = allDay ? `${startDate}T00:00:00` : `${startDate}T${startTime}:00`;
      const endAt = allDay ? `${endDate || startDate}T23:59:59` : `${endDate || startDate}T${endTime}:00`;

      const body: any = {
        title: title.trim(),
        event_type: eventType,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        all_day: allDay,
        location: location.trim() || null,
        external_link: externalLink.trim() || null,
        color,
        deal_id: dealId || null,
        contact_id: contactId || null,
        reminder_minutes: reminderMinutes,
        description: description.trim() || null,
      };

      const url = '/api/calendar';
      const method = isEdit ? 'PATCH' : 'POST';
      if (isEdit) body.id = event!.id;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        onSaved();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">
            {isEdit ? 'Modifica Evento' : 'Nuovo Evento'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titolo */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Titolo *</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
              placeholder="es. Meeting con investitore..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
          </div>

          {/* Tipo evento */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Tipo</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {Object.entries(EVENT_TYPE_CONFIG).map(([key, cfg]) => {
                const Icon = ICON_MAP[cfg.icon] || Calendar;
                return (
                  <button key={key} type="button" onClick={() => handleTypeChange(key)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-medium transition-all ${
                      eventType === key ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]' : 'border-slate-100 text-slate-500 hover:border-slate-200'
                    }`}>
                    <Icon size={16} style={{ color: eventType === key ? cfg.color : undefined }} />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* All day toggle */}
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setAllDay(!allDay)}
              className={`w-10 h-5 rounded-full transition-all relative ${allDay ? 'bg-[#D4AF37]' : 'bg-slate-200'}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${allDay ? 'left-5' : 'left-0.5'}`} />
            </button>
            <span className="text-xs font-medium text-slate-600">Tutto il giorno</span>
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Data inizio</label>
              <input type="date" required value={startDate} onChange={e => { setStartDate(e.target.value); if (!endDate || endDate < e.target.value) setEndDate(e.target.value); }}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            {!allDay && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Ora inizio</label>
                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
            )}
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Data fine</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            {!allDay && (
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Ora fine</label>
                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
            )}
          </div>

          {/* Location + External link */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Location</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="Ufficio Milano..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Link Meet/Zoom</label>
              <input type="url" value={externalLink} onChange={e => setExternalLink(e.target.value)} placeholder="https://meet.google.com/..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
          </div>

          {/* Colore */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Colore</label>
            <div className="flex gap-2">
              {CALENDAR_COLORS.map(c => (
                <button key={c.value} type="button" onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full transition-all ${color === c.value ? 'ring-2 ring-offset-2 ring-[#D4AF37] scale-110' : 'hover:scale-110'}`}
                  style={{ backgroundColor: c.value }} title={c.label} />
              ))}
            </div>
          </div>

          {/* Deal + Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Deal</label>
              <div className="relative">
                <input type="text" value={dealSearch}
                  onChange={e => { setDealSearch(e.target.value); if (!e.target.value) setDealId(''); }}
                  placeholder="Cerca deal..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Contatto</label>
              <div className="relative">
                <input type="text" value={contactSearch}
                  onChange={e => { setContactSearch(e.target.value); if (!e.target.value) setContactId(''); }}
                  placeholder="Cerca contatto..."
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
                {contactSearch && !contactId && filteredContacts.length > 0 && (
                  <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {filteredContacts.map(c => (
                      <button key={c.id} type="button" onClick={() => { setContactId(c.id); setContactSearch(c.full_name); }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50">{c.full_name}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reminder */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Promemoria</label>
            <select value={reminderMinutes} onChange={e => setReminderMinutes(parseInt(e.target.value))}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] bg-white">
              <option value={0}>Nessuno</option>
              <option value={5}>5 minuti prima</option>
              <option value={15}>15 minuti prima</option>
              <option value={30}>30 minuti prima</option>
              <option value={60}>1 ora prima</option>
              <option value={1440}>1 giorno prima</option>
            </select>
          </div>

          {/* Descrizione */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Descrizione</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] resize-none" />
          </div>

          <button type="submit" disabled={saving || !title.trim()}
            className="w-full bg-[#D4AF37] hover:bg-[#b8962d] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-xs uppercase tracking-widest">
            {saving ? 'Salvataggio...' : isEdit ? 'Aggiorna Evento' : 'Salva Evento'}
          </button>
        </form>
      </div>
    </div>
  );
}
