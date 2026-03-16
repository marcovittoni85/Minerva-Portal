'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TaskPriority, TaskCategory, PRIORITY_CONFIG, CATEGORY_CONFIG } from '@/types/cockpit';

interface AddTaskModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  prefillDealId?: string;
  prefillDealTitle?: string;
  prefillContactId?: string;
  prefillContactName?: string;
}

export default function AddTaskModal({
  open, onClose, onSaved,
  prefillDealId, prefillDealTitle,
  prefillContactId, prefillContactName,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('normal');
  const [category, setCategory] = useState<TaskCategory>('other');
  const [dueDate, setDueDate] = useState('');
  const [dealId, setDealId] = useState(prefillDealId || '');
  const [dealSearch, setDealSearch] = useState(prefillDealTitle || '');
  const [contactId, setContactId] = useState(prefillContactId || '');
  const [contactSearch, setContactSearch] = useState(prefillContactName || '');
  const [tagsStr, setTagsStr] = useState('');
  const [saving, setSaving] = useState(false);

  const [deals, setDeals] = useState<{ id: string; title: string }[]>([]);
  const [contacts, setContacts] = useState<{ id: string; full_name: string }[]>([]);

  useEffect(() => {
    if (!open) return;
    // Load deals and contacts for dropdowns
    fetch('/api/contacts?limit=100&sort=name')
      .then(r => r.json())
      .then(d => setContacts((d.contacts || []).map((c: any) => ({ id: c.id, full_name: c.full_name }))))
      .catch(() => {});
  }, [open]);

  useEffect(() => {
    setDealId(prefillDealId || '');
    setDealSearch(prefillDealTitle || '');
    setContactId(prefillContactId || '');
    setContactSearch(prefillContactName || '');
  }, [prefillDealId, prefillDealTitle, prefillContactId, prefillContactName]);

  if (!open) return null;

  const filteredDeals = deals.filter(d => d.title.toLowerCase().includes(dealSearch.toLowerCase()));
  const filteredContacts = contacts.filter(c => c.full_name.toLowerCase().includes(contactSearch.toLowerCase()));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priority,
          category,
          due_date: dueDate || null,
          deal_id: dealId || null,
          contact_id: contactId || null,
          tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
        }),
      });
      if (res.ok) {
        setTitle(''); setDescription(''); setPriority('normal'); setCategory('other');
        setDueDate(''); setDealId(''); setDealSearch(''); setContactId(''); setContactSearch(''); setTagsStr('');
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
          <h2 className="text-lg font-black uppercase tracking-wider text-slate-800">Crea Task</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Titolo */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Titolo *</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
              placeholder="es. Inviare NDA firmato, Chiamare investitore..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
          </div>

          {/* Descrizione */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Descrizione</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] resize-none" />
          </div>

          {/* Priorita */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Priorita</label>
            <div className="flex gap-2">
              {(Object.entries(PRIORITY_CONFIG) as [TaskPriority, typeof PRIORITY_CONFIG[TaskPriority]][]).map(([key, cfg]) => (
                <button key={key} type="button" onClick={() => setPriority(key)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all flex-1 justify-center ${
                    priority === key ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-100 hover:border-slate-200'
                  }`}>
                  <span>{cfg.emoji}</span>
                  <span className="text-xs">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Scadenza + Categoria */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Scadenza</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Categoria</label>
              <select value={category} onChange={e => setCategory(e.target.value as TaskCategory)}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37] bg-white">
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Deal collegato */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Deal Collegato</label>
            <div className="relative">
              <input type="text" value={dealSearch}
                onChange={e => { setDealSearch(e.target.value); if (!e.target.value) setDealId(''); }}
                placeholder="Cerca deal..."
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
              {dealSearch && !dealId && filteredDeals.length > 0 && (
                <div className="absolute z-10 top-full mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                  {filteredDeals.map(d => (
                    <button key={d.id} type="button" onClick={() => { setDealId(d.id); setDealSearch(d.title); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50">{d.title}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Contatto collegato */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Contatto Collegato</label>
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

          {/* Tags */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1 block">Tags (virgola)</label>
            <input type="text" value={tagsStr} onChange={e => setTagsStr(e.target.value)}
              placeholder="urgente, contratto, review..."
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]" />
          </div>

          <button type="submit" disabled={saving || !title.trim()}
            className="w-full bg-[#D4AF37] hover:bg-[#b8962d] text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 text-xs uppercase tracking-widest">
            {saving ? 'Creazione...' : 'Crea Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
