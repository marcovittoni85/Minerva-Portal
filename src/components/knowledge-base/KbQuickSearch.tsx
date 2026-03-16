'use client';

import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { KbItem, KB_CATEGORY_CONFIG } from '@/types/knowledge-base';
import {
  FileText, BarChart3, TrendingUp, Scale, Calculator, Presentation,
  Target, ClipboardCheck, Coins, Shield, File,
} from 'lucide-react';

const CAT_ICON_MAP: Record<string, React.ElementType> = {
  FileText, BarChart3, TrendingUp, Scale, Calculator, Presentation,
  Target, ClipboardCheck, Coins, Shield, File,
};

interface KbQuickSearchProps {
  onSelect?: (item: KbItem) => void;
  className?: string;
}

export default function KbQuickSearch({ onSelect, className }: KbQuickSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<KbItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/knowledge-base?search=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        setResults(data.items || []);
      } catch { setResults([]); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className={"relative " + (className || '')}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Cerca nella Knowledge Base..."
          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-[#D4AF37] transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3.5 h-3.5 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-[300px] overflow-y-auto">
          {results.map(item => {
            const catCfg = KB_CATEGORY_CONFIG[item.category] || KB_CATEGORY_CONFIG.other;
            const Icon = CAT_ICON_MAP[catCfg.icon] || File;
            return (
              <button
                key={item.id}
                onClick={() => { onSelect?.(item); setOpen(false); setQuery(''); }}
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors flex items-center gap-3 border-b border-slate-50 last:border-0"
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: catCfg.color + '15' }}
                >
                  <Icon size={14} style={{ color: catCfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{item.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: catCfg.color }}>{catCfg.label}</span>
                    {item.sector && <span className="text-[10px] text-slate-400">{item.sector}</span>}
                  </div>
                </div>
                {item.is_pinned && <span className="text-[10px] text-[#D4AF37]">⭐</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
