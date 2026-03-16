'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Plus } from 'lucide-react';
import {
  KbItem, KbCategory, KbVisibility,
  KB_CATEGORY_CONFIG, KB_VISIBILITY_CONFIG, KB_SECTORS,
} from '@/types/knowledge-base';
import {
  FileText, BarChart3, TrendingUp, Scale, Calculator, Presentation,
  Target, ClipboardCheck, Coins, Shield, File,
  Lock, Users, Globe,
} from 'lucide-react';

const CAT_ICON_MAP: Record<string, React.ElementType> = {
  FileText, BarChart3, TrendingUp, Scale, Calculator, Presentation,
  Target, ClipboardCheck, Coins, Shield, File,
};
const VIS_ICON_MAP: Record<string, React.ElementType> = { Lock, Shield, Users, Globe };

const GEOGRAPHIES = ['Italia', 'Europa', 'Global', 'USA', 'UK', 'MENA', 'Asia'];

interface KbItemFormProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  item?: KbItem | null;
  prefillDealId?: string;
  prefillDealTitle?: string;
  prefillContactId?: string;
  prefillContactName?: string;
}

export default function KbItemForm({
  open, onClose, onSaved, item,
  prefillDealId, prefillDealTitle,
  prefillContactId, prefillContactName,
}: KbItemFormProps) {
  const isEdit = !!item;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<KbCategory>('investment_memo');
  const [visibility, setVisibility] = useState<KbVisibility>('admin');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [sector, setSector] = useState('');
  const [geography, setGeography] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);

  // Deal search
  const [dealId, setDealId] = useState('');
  const [dealSearch, setDealSearch] = useState('');
  const [dealResults, setDealResults] = useState<any[]>([]);
  const [dealLabel, setDealLabel] = useState('');

  // Contact search
  const [contactId, setContactId] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [contactResults, setContactResults] = useState<any[]>([]);
  const [contactLabel, setContactLabel] = useState('');

  useEffect(() => {
    if (!open) return;
    if (item) {
      setTitle(item.title);
      setDescription(item.description || '');
      setContent(item.content || '');
      setCategory(item.category);
      setVisibility(item.visibility);
      setTags(item.tags || []);
      setSector(item.sector || '');
      setGeography(item.geography || '');
      setIsPinned(item.is_pinned);
      setDealId(item.deal_id || '');
      setDealLabel(item.deal?.title || '');
      setContactId(item.contact_id || '');
    } else {
      setTitle('');
      setDescription('');
      setContent('');
      setCategory('investment_memo');
      setVisibility('admin');
      setTags([]);
      setSector('');
      setGeography('');
      setIsPinned(false);
      setFile(null);
      setDealId(prefillDealId || '');
      setDealLabel(prefillDealTitle || '');
      setContactId(prefillContactId || '');
      setContactLabel(prefillContactName || '');
    }
    setNewTag('');
    setDealSearch('');
    setContactSearch('');
  }, [open, item]);

  // Deal search
  useEffect(() => {
    if (dealSearch.length < 2) { setDealResults([]); return; }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/knowledge-base?search=${dealSearch}&limit=5`);
      // We need to search deals directly — use a lightweight approach
      try {
        const r = await fetch(`/api/calendar?search_deals=${dealSearch}`);
        // Fallback: just search from the KB API which joins deals
      } catch { /* silent */ }
    }, 300);
    return () => clearTimeout(t);
  }, [dealSearch]);

  function addTag() {
    const t = newTag.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setNewTag('');
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag));
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);

    const payload: any = {
      title: title.trim(),
      description: description.trim() || null,
      content: content.trim() || null,
      category,
      visibility,
      tags,
      sector: sector || null,
      geography: geography || null,
      is_pinned: isPinned,
      deal_id: dealId || null,
      contact_id: contactId || null,
    };

    try {
      if (isEdit) {
        await fetch('/api/knowledge-base', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item!.id, ...payload }),
        });
      } else if (file) {
        const formData = new FormData();
        formData.append('data', JSON.stringify(payload));
        formData.append('file', file);
        await fetch('/api/knowledge-base', { method: 'POST', body: formData });
      } else {
        await fetch('/api/knowledge-base', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      onSaved();
      onClose();
    } catch { /* silent */ }
    finally { setSaving(false); }
  }

  if (!open) return null;

  const categories = Object.entries(KB_CATEGORY_CONFIG) as [KbCategory, typeof KB_CATEGORY_CONFIG[KbCategory]][];
  const visibilities = Object.entries(KB_VISIBILITY_CONFIG) as [KbVisibility, typeof KB_VISIBILITY_CONFIG[KbVisibility]][];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[520px] bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-widest">
            {isEdit ? 'Modifica Documento' : 'Nuovo Documento'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Titolo *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Es. Investment Memo — Operazione Alpha"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
            />
          </div>

          {/* Category grid */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Categoria</label>
            <div className="grid grid-cols-3 gap-1.5">
              {categories.map(([key, cfg]) => {
                const Icon = CAT_ICON_MAP[cfg.icon] || File;
                return (
                  <button
                    key={key}
                    onClick={() => setCategory(key)}
                    className={"flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold transition-all border " + (
                      category === key
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-slate-900'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                    )}
                  >
                    <Icon size={13} style={{ color: cfg.color }} />
                    <span className="truncate">{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Descrizione</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={2}
              placeholder="Breve descrizione del documento..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors resize-none"
            />
          </div>

          {/* Content (markdown) */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Contenuto (Markdown)</label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              placeholder="Scrivi qui il contenuto del documento in markdown..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors resize-none font-mono text-xs"
            />
          </div>

          {/* File upload */}
          {!isEdit && (
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">File Allegato</label>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={"border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors " + (
                  dragOver ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-slate-200 hover:border-slate-300'
                )}
              >
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText size={16} className="text-[#D4AF37]" />
                    <span className="text-sm font-medium text-slate-700">{file.name}</span>
                    <button onClick={e => { e.stopPropagation(); setFile(null); }} className="text-slate-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">Trascina un file qui o clicca per selezionare</p>
                    <p className="text-[10px] text-slate-400 mt-1">PDF, DOCX, XLSX, PPTX, immagini</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Tags</label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-medium">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="text-slate-400 hover:text-red-500"><X size={10} /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={e => setNewTag(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Aggiungi tag..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
              />
              <button onClick={addTag} disabled={!newTag.trim()} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors disabled:opacity-30">
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Sector + Geography row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Settore</label>
              <select
                value={sector}
                onChange={e => setSector(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#D4AF37] transition-colors"
              >
                <option value="">— Nessuno —</option>
                {KB_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Geografia</label>
              <select
                value={geography}
                onChange={e => setGeography(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 outline-none focus:border-[#D4AF37] transition-colors"
              >
                <option value="">— Nessuna —</option>
                {GEOGRAPHIES.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-2 block">Visibilità</label>
            <div className="grid grid-cols-4 gap-1.5">
              {visibilities.map(([key, cfg]) => {
                const Icon = VIS_ICON_MAP[cfg.icon] || Shield;
                return (
                  <button
                    key={key}
                    onClick={() => setVisibility(key)}
                    className={"flex flex-col items-center gap-1 px-3 py-2.5 rounded-xl text-[10px] font-bold transition-all border " + (
                      visibility === key
                        ? 'border-[#D4AF37] bg-[#D4AF37]/5 text-slate-900'
                        : 'border-slate-100 text-slate-500 hover:border-slate-200'
                    )}
                  >
                    <Icon size={14} style={{ color: cfg.color }} />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deal linked */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Deal Collegato</label>
            {dealId ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                <span className="text-sm text-slate-900 flex-1">{dealLabel || dealId}</span>
                <button onClick={() => { setDealId(''); setDealLabel(''); }} className="text-slate-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={dealSearch}
                onChange={e => setDealSearch(e.target.value)}
                placeholder="Cerca deal..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
              />
            )}
          </div>

          {/* Contact linked */}
          <div>
            <label className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1.5 block">Contatto Collegato</label>
            {contactId ? (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5">
                <span className="text-sm text-slate-900 flex-1">{contactLabel || contactId}</span>
                <button onClick={() => { setContactId(''); setContactLabel(''); }} className="text-slate-400 hover:text-red-500">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <input
                type="text"
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Cerca contatto..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
              />
            )}
          </div>

          {/* Pin toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-slate-900">Fissa in alto</p>
              <p className="text-[10px] text-slate-400">Il documento apparirà sempre in cima alla lista</p>
            </div>
            <button
              onClick={() => setIsPinned(!isPinned)}
              className={"w-11 h-6 rounded-full transition-colors relative " + (isPinned ? "bg-[#D4AF37]" : "bg-slate-200")}
            >
              <div className={"w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform " + (isPinned ? "translate-x-[22px]" : "translate-x-0.5")} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !title.trim()}
            className="bg-[#D4AF37] text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors disabled:opacity-50"
          >
            {saving ? 'Salvataggio...' : isEdit ? 'Aggiorna' : 'Salva'}
          </button>
        </div>
      </div>
    </>
  );
}
