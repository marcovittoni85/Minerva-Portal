'use client';

import { useState, useEffect } from 'react';
import {
  KbItem, KbCategory, KB_CATEGORY_CONFIG, KB_VISIBILITY_CONFIG, KB_SECTORS,
} from '@/types/knowledge-base';
import KbItemDetail from './KbItemDetail';
import KbItemForm from './KbItemForm';
import {
  Search, Plus, Eye, Download, Star,
  FileText, BarChart3, TrendingUp, Scale, Calculator, Presentation,
  Target, ClipboardCheck, Coins, Shield, File,
  Lock, Users, Globe, Paperclip,
} from 'lucide-react';

const CAT_ICON_MAP: Record<string, React.ElementType> = {
  FileText, BarChart3, TrendingUp, Scale, Calculator, Presentation,
  Target, ClipboardCheck, Coins, Shield, File,
};
const VIS_ICON_MAP: Record<string, React.ElementType> = { Lock, Shield, Users, Globe };

type ViewFilter = 'all' | 'pinned' | 'mine';

export default function KnowledgeBaseList() {
  const [items, setItems] = useState<KbItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<KbCategory | ''>('');
  const [sectorFilter, setSectorFilter] = useState('');
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');

  // Category counts
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});

  // Detail / Form
  const [selectedItem, setSelectedItem] = useState<KbItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<KbItem | null>(null);

  async function fetchItems() {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (categoryFilter) params.set('category', categoryFilter);
    if (sectorFilter) params.set('sector', sectorFilter);
    if (viewFilter === 'pinned') params.set('pinned', 'true');
    if (viewFilter === 'mine') params.set('mine', 'true');

    try {
      const res = await fetch(`/api/knowledge-base?${params.toString()}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);

      // Build category counts from all items (when no category filter)
      if (!categoryFilter) {
        const counts: Record<string, number> = {};
        (data.items || []).forEach((item: KbItem) => {
          counts[item.category] = (counts[item.category] || 0) + 1;
        });
        setCategoryCounts(counts);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const t = setTimeout(fetchItems, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [search, categoryFilter, sectorFilter, viewFilter]);

  function openDetail(item: KbItem) {
    setSelectedItem(item);
  }

  function openEdit(item: KbItem) {
    setEditItem(item);
    setSelectedItem(null);
    setShowForm(true);
  }

  function openNew() {
    setEditItem(null);
    setShowForm(true);
  }

  // If viewing detail
  if (selectedItem) {
    return (
      <KbItemDetail
        item={selectedItem}
        onBack={() => { setSelectedItem(null); fetchItems(); }}
        onEdit={() => openEdit(selectedItem)}
        onRefresh={() => {
          // Refetch the item
          fetch(`/api/knowledge-base?search=${selectedItem.id}&limit=1`)
            .then(r => r.json())
            .then(d => {
              const updated = (d.items || []).find((i: KbItem) => i.id === selectedItem.id);
              if (updated) setSelectedItem(updated);
            });
        }}
      />
    );
  }

  const categories = Object.entries(KB_CATEGORY_CONFIG) as [KbCategory, typeof KB_CATEGORY_CONFIG[KbCategory]][];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#001220]">Knowledge Base</h1>
          <p className="text-sm text-slate-400 mt-1">{total} documenti</p>
        </div>
        <button
          onClick={openNew}
          className="bg-[#D4AF37] hover:bg-[#b8962d] text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-xs uppercase tracking-widest flex items-center gap-2"
        >
          <Plus size={14} /> Nuovo Documento
        </button>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca documenti, memo, template..."
          className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors shadow-sm"
        />
      </div>

      {/* Category filter pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setCategoryFilter('')}
          className={"flex items-center gap-1.5 px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap " + (
            !categoryFilter
              ? 'bg-[#D4AF37] text-white'
              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
          )}
        >
          Tutti
        </button>
        {categories.map(([key, cfg]) => {
          const Icon = CAT_ICON_MAP[cfg.icon] || File;
          const count = categoryCounts[key] || 0;
          return (
            <button
              key={key}
              onClick={() => setCategoryFilter(categoryFilter === key ? '' : key)}
              className={"flex items-center gap-1.5 px-3 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border " + (
                categoryFilter === key
                  ? 'border-current bg-opacity-10'
                  : 'border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100'
              )}
              style={categoryFilter === key ? { color: cfg.color, backgroundColor: cfg.color + '10' } : undefined}
            >
              <Icon size={12} style={{ color: cfg.color }} />
              {cfg.label}
              {count > 0 && <span className="text-[9px] opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Sector dropdown */}
        <select
          value={sectorFilter}
          onChange={e => setSectorFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#D4AF37] transition-colors"
        >
          <option value="">Tutti i settori</option>
          {KB_SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* View toggle */}
        <div className="flex border border-slate-200 rounded-xl overflow-hidden ml-auto">
          {([['all', 'Tutti'], ['pinned', 'Pinnati'], ['mine', 'Miei']] as [ViewFilter, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setViewFilter(key)}
              className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                viewFilter === key ? 'bg-[#D4AF37] text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Items grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <FileText size={40} className="text-slate-200 mx-auto mb-4" />
          <p className="text-lg font-bold text-slate-400">Nessun documento trovato</p>
          <p className="text-sm text-slate-400 mt-1">Crea il primo documento nella Knowledge Base</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {items.map(item => {
            const cfg = KB_CATEGORY_CONFIG[item.category] || KB_CATEGORY_CONFIG.other;
            const CatIcon = CAT_ICON_MAP[cfg.icon] || File;
            const visCfg = KB_VISIBILITY_CONFIG[item.visibility];
            const VisIcon = VIS_ICON_MAP[visCfg.icon] || Shield;

            return (
              <div
                key={item.id}
                onClick={() => openDetail(item)}
                className={"bg-white border rounded-2xl p-5 cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all group " + (
                  item.is_pinned ? 'border-[#D4AF37]/40 ring-1 ring-[#D4AF37]/10' : 'border-slate-100'
                )}
              >
                {/* Top row: icon + category + visibility */}
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: cfg.color + '15' }}
                  >
                    <CatIcon size={18} style={{ color: cfg.color }} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {item.is_pinned && <Star size={12} className="text-[#D4AF37] fill-[#D4AF37]" />}
                    <VisIcon size={12} style={{ color: visCfg.color }} />
                    {item.file_url && <Paperclip size={12} className="text-slate-400" />}
                  </div>
                </div>

                {/* Category label */}
                <span
                  className="text-[9px] font-bold uppercase tracking-widest"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>

                {/* Title */}
                <h3 className="text-sm font-bold text-slate-900 mt-1 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                  {item.title}
                </h3>

                {/* Description */}
                {item.description && (
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                )}

                {/* Tags */}
                {item.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[9px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 3 && (
                      <span className="text-[9px] text-slate-400">+{item.tags.length - 3}</span>
                    )}
                  </div>
                )}

                {/* Footer meta */}
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-50 text-[10px] text-slate-400">
                  <span className="font-medium">{item.creator?.full_name || '—'}</span>
                  <span>{new Date(item.updated_at).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' })}</span>
                  <div className="flex items-center gap-1 ml-auto">
                    <Eye size={10} /> {item.view_count}
                  </div>
                  {item.download_count > 0 && (
                    <div className="flex items-center gap-1">
                      <Download size={10} /> {item.download_count}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <KbItemForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditItem(null); }}
        onSaved={() => { setShowForm(false); setEditItem(null); fetchItems(); }}
        item={editItem}
      />
    </div>
  );
}
