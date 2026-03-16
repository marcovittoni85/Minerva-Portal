'use client';

import { useState } from 'react';
import {
  KbItem, KB_CATEGORY_CONFIG, KB_VISIBILITY_CONFIG,
} from '@/types/knowledge-base';
import {
  ArrowLeft, Download, Edit3, Star, Archive, ExternalLink,
  FileText, BarChart3, TrendingUp, Scale, Calculator, Presentation,
  Target, ClipboardCheck, Coins, Shield, File,
  Lock, Users, Globe, Eye, Tag,
} from 'lucide-react';

const CAT_ICON_MAP: Record<string, React.ElementType> = {
  FileText, BarChart3, TrendingUp, Scale, Calculator, Presentation,
  Target, ClipboardCheck, Coins, Shield, File,
};
const VIS_ICON_MAP: Record<string, React.ElementType> = { Lock, Shield, Users, Globe };

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatFileSize(bytes: number | undefined): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface KbItemDetailProps {
  item: KbItem;
  onBack: () => void;
  onEdit: () => void;
  onRefresh: () => void;
}

export default function KbItemDetail({ item, onBack, onEdit, onRefresh }: KbItemDetailProps) {
  const [archiving, setArchiving] = useState(false);
  const [pinning, setPinning] = useState(false);

  const cfg = KB_CATEGORY_CONFIG[item.category] || KB_CATEGORY_CONFIG.other;
  const CatIcon = CAT_ICON_MAP[cfg.icon] || File;
  const visCfg = KB_VISIBILITY_CONFIG[item.visibility];
  const VisIcon = VIS_ICON_MAP[visCfg.icon] || Shield;

  async function togglePin() {
    setPinning(true);
    await fetch('/api/knowledge-base', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, is_pinned: !item.is_pinned }),
    });
    setPinning(false);
    onRefresh();
  }

  async function handleArchive() {
    setArchiving(true);
    await fetch(`/api/knowledge-base?id=${item.id}`, { method: 'DELETE' });
    setArchiving(false);
    onBack();
  }

  async function handleDownload() {
    if (!item.file_url) return;
    // Increment download count
    await fetch('/api/knowledge-base', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, download_count: (item.download_count || 0) + 1 }),
    });
    window.open(item.file_url, '_blank');
  }

  // Simple markdown rendering (bold, italic, headers, lists)
  function renderMarkdown(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h3 key={i} className="text-base font-bold text-slate-900 mt-4 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-bold text-slate-900 mt-5 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-black text-slate-900 mt-6 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-sm text-slate-700 ml-4 list-disc">{line.slice(2)}</li>;
      if (line.trim() === '') return <br key={i} />;

      // Bold + italic inline
      let html = line
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');

      return <p key={i} className="text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />;
    });
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft size={16} /> Torna alla lista
      </button>

      {/* Header card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-8">
        <div className="flex items-start gap-5">
          {/* Category icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: cfg.color + '15' }}
          >
            <CatIcon size={24} style={{ color: cfg.color }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className="text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ color: cfg.color, backgroundColor: cfg.color + '12' }}
              >
                {cfg.label}
              </span>
              <span className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                <VisIcon size={11} style={{ color: visCfg.color }} />
                {visCfg.label}
              </span>
              {item.is_pinned && (
                <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-widest">⭐ Pinnato</span>
              )}
            </div>

            <h1 className="text-2xl font-black text-[#001220] mt-2">{item.title}</h1>

            {item.description && (
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{item.description}</p>
            )}

            {/* Meta */}
            <div className="flex items-center gap-4 mt-3 text-[10px] text-slate-400 uppercase tracking-widest flex-wrap">
              {item.creator && <span>{item.creator.full_name}</span>}
              <span>{formatDate(item.created_at)}</span>
              <span className="flex items-center gap-1"><Eye size={10} /> {item.view_count} views</span>
              {item.download_count > 0 && <span><Download size={10} className="inline" /> {item.download_count}</span>}
              {item.version > 1 && <span>v{item.version}</span>}
            </div>

            {/* Tags */}
            {item.tags?.length > 0 && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <Tag size={12} className="text-slate-400" />
                {item.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-50">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-widest hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors"
          >
            <Edit3 size={13} /> Modifica
          </button>
          <button
            onClick={togglePin}
            disabled={pinning}
            className={"flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-colors " + (
              item.is_pinned ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-slate-200 text-slate-600 hover:border-[#D4AF37] hover:text-[#D4AF37]'
            )}
          >
            <Star size={13} /> {item.is_pinned ? 'Rimuovi Pin' : 'Fissa'}
          </button>
          {item.file_url && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4AF37] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#b8962d] transition-colors"
            >
              <Download size={13} /> Scarica
            </button>
          )}
          <button
            onClick={handleArchive}
            disabled={archiving}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-200 text-red-500 text-[10px] font-bold uppercase tracking-widest hover:bg-red-50 transition-colors ml-auto"
          >
            <Archive size={13} /> Archivia
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Markdown content */}
          {item.content && (
            <div className="bg-white border border-slate-100 rounded-2xl p-8">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Contenuto</h3>
              <div className="prose prose-sm max-w-none">
                {renderMarkdown(item.content)}
              </div>
            </div>
          )}

          {/* File preview */}
          {item.file_url && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">File Allegato</h3>
              <div className="flex items-center gap-4 bg-slate-50 rounded-xl p-4">
                <FileText size={24} className="text-[#D4AF37] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{item.file_name}</p>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-400">
                    {item.file_type && <span>{item.file_type}</span>}
                    {item.file_size && <span>{formatFileSize(item.file_size)}</span>}
                  </div>
                </div>
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-[#D4AF37] hover:text-[#b8962d] text-xs font-bold uppercase tracking-widest transition-colors"
                >
                  <ExternalLink size={13} /> Apri
                </a>
              </div>

              {/* Inline PDF preview */}
              {item.file_type?.includes('pdf') && (
                <iframe
                  src={item.file_url}
                  className="w-full h-[500px] rounded-xl mt-4 border border-slate-100"
                  title="PDF Preview"
                />
              )}

              {/* Image preview */}
              {item.file_type?.startsWith('image/') && (
                <img src={item.file_url} alt={item.file_name || ''} className="w-full rounded-xl mt-4" />
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Linked deal */}
          {item.deal && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Deal Collegato</h3>
              <p className="text-sm font-bold text-slate-900">{item.deal.title}</p>
            </div>
          )}

          {/* Sector & Geography */}
          {(item.sector || item.geography) && (
            <div className="bg-white border border-slate-100 rounded-2xl p-5">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Classificazione</h3>
              {item.sector && (
                <div className="mb-2">
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Settore</p>
                  <p className="text-sm font-bold text-slate-900">{item.sector}</p>
                </div>
              )}
              {item.geography && (
                <div>
                  <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold">Geografia</p>
                  <p className="text-sm font-bold text-slate-900">{item.geography}</p>
                </div>
              )}
            </div>
          )}

          {/* Version info */}
          <div className="bg-white border border-slate-100 rounded-2xl p-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Versione</span>
                <span className="font-bold text-slate-700">v{item.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Creato</span>
                <span className="font-bold text-slate-700">{formatDate(item.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Aggiornato</span>
                <span className="font-bold text-slate-700">{formatDate(item.updated_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Visualizzazioni</span>
                <span className="font-bold text-slate-700">{item.view_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Download</span>
                <span className="font-bold text-slate-700">{item.download_count}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
