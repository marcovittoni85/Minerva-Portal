'use client';

import { useState } from 'react';
import {
  InteractionType,
  INTERACTION_TYPE_CONFIG,
  SENTIMENT_CONFIG,
} from '@/types/relationship';
import {
  Users, Phone, Video, Send, Mail, StickyNote, UserPlus,
  Calendar, Briefcase, FileText, Clock, MoreHorizontal,
  ChevronDown, ChevronUp, X,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  Users, Phone, Video, Send, Mail, StickyNote, UserPlus,
  Calendar, Briefcase, FileText, Clock, MoreHorizontal,
};

interface Deal {
  id: string;
  title: string;
}

interface AddInteractionFormProps {
  contactId: string;
  deals?: Deal[];
  onSave: (data: any) => Promise<void>;
  onCancel: () => void;
}

export default function AddInteractionForm({ contactId, deals = [], onSave, onCancel }: AddInteractionFormProps) {
  const [type, setType] = useState<InteractionType>('meeting');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [duration, setDuration] = useState('');
  const [dealId, setDealId] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [sentiment, setSentiment] = useState<'positive' | 'neutral' | 'negative' | ''>('');
  const [isImportant, setIsImportant] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredDeals = deals.filter(d =>
    d.title.toLowerCase().includes(dealSearch.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        contact_id: contactId,
        interaction_type: type,
        title: title.trim(),
        description: description.trim() || null,
        interaction_date: new Date(date).toISOString(),
        duration_minutes: duration ? parseInt(duration) : null,
        deal_id: dealId || null,
        sentiment: sentiment || null,
        is_important: isImportant,
        follow_up_date: showFollowUp && followUpDate ? followUpDate : null,
        follow_up_notes: showFollowUp && followUpNotes ? followUpNotes : null,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">Nuova Interazione</h3>
        <button type="button" onClick={onCancel} className="text-slate-400 hover:text-slate-600">
          <X size={18} />
        </button>
      </div>

      {/* Tipo */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Tipo</label>
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {(Object.entries(INTERACTION_TYPE_CONFIG) as [InteractionType, typeof INTERACTION_TYPE_CONFIG[InteractionType]][]).map(([key, cfg]) => {
            const Icon = ICON_MAP[cfg.icon] || MoreHorizontal;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setType(key)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-[10px] font-medium transition-all ${
                  type === key
                    ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-[#D4AF37]'
                    : 'border-slate-100 text-slate-500 hover:border-slate-200'
                }`}
              >
                <Icon size={16} style={{ color: type === key ? cfg.color : undefined }} />
                <span className="truncate w-full text-center">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Titolo */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Titolo *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="es. Call introduttiva, Meeting Milano..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
          required
        />
      </div>

      {/* Descrizione */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Descrizione</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          rows={3}
          placeholder="Note dettagliate..."
          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
        />
      </div>

      {/* Data + Durata */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Data</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Durata (min)</label>
          <input
            type="number"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            placeholder="es. 45"
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
        </div>
      </div>

      {/* Deal collegato */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Deal Collegato</label>
        <div className="relative">
          <input
            type="text"
            value={dealSearch}
            onChange={e => { setDealSearch(e.target.value); setDealId(''); }}
            placeholder="Cerca deal..."
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
          />
          {dealSearch && !dealId && filteredDeals.length > 0 && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
              {filteredDeals.map(d => (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => { setDealId(d.id); setDealSearch(d.title); }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors"
                >
                  {d.title}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sentiment */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Sentiment</label>
        <div className="flex gap-2">
          {(Object.entries(SENTIMENT_CONFIG) as [string, typeof SENTIMENT_CONFIG['positive']][]).map(([key, cfg]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSentiment(sentiment === key ? '' : key as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                sentiment === key
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                  : 'border-slate-100 hover:border-slate-200'
              }`}
            >
              <span>{cfg.icon}</span>
              <span className="text-xs">{cfg.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Important toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsImportant(!isImportant)}
          className={`w-10 h-5 rounded-full transition-all relative ${
            isImportant ? 'bg-[#D4AF37]' : 'bg-slate-200'
          }`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
            isImportant ? 'left-5' : 'left-0.5'
          }`} />
        </button>
        <span className="text-xs font-medium text-slate-600">Importante</span>
      </div>

      {/* Follow-up collapsible */}
      <div>
        <button
          type="button"
          onClick={() => setShowFollowUp(!showFollowUp)}
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
        >
          {showFollowUp ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          Follow-up
        </button>
        {showFollowUp && (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-[#D4AF37]/20">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Data Follow-up</label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Note</label>
              <input
                type="text"
                value={followUpNotes}
                onChange={e => setFollowUpNotes(e.target.value)}
                placeholder="Ricorda di..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>
          </div>
        )}
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="w-full bg-[#D4AF37] hover:bg-[#b8962d] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm uppercase tracking-widest"
      >
        {saving ? 'Salvataggio...' : 'Salva Interazione'}
      </button>
    </form>
  );
}
