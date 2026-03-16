// ============================================================
// types/knowledge-base.ts — Minerva Knowledge Base Types
// ============================================================

export type KbCategory =
  | 'investment_memo' | 'sector_analysis' | 'market_report'
  | 'legal_template' | 'financial_model' | 'presentation'
  | 'internal_strategy' | 'due_diligence' | 'valuation'
  | 'regulatory' | 'other';

export type KbVisibility = 'private' | 'admin' | 'members' | 'public';

export interface KbItem {
  id: string;
  created_by: string;
  title: string;
  description?: string;
  content?: string;
  category: KbCategory;
  visibility: KbVisibility;
  tags: string[];
  file_url?: string;
  file_name?: string;
  file_type?: string;
  file_size?: number;
  deal_id?: string | null;
  contact_id?: string | null;
  sector?: string;
  geography?: string;
  version: number;
  parent_id?: string | null;
  view_count: number;
  download_count: number;
  is_pinned: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Populated
  creator?: { id: string; full_name: string };
  deal?: { id: string; title: string } | null;
}

export const KB_CATEGORY_CONFIG: Record<KbCategory, {
  label: string; icon: string; color: string; bgColor: string;
}> = {
  investment_memo:   { label: 'Investment Memo',    icon: 'FileText',      color: '#F5A623', bgColor: 'bg-[#F5A623]/10' },
  sector_analysis:   { label: 'Analisi Settore',    icon: 'BarChart3',     color: '#3B82F6', bgColor: 'bg-blue-50' },
  market_report:     { label: 'Report di Mercato',  icon: 'TrendingUp',    color: '#10B981', bgColor: 'bg-emerald-50' },
  legal_template:    { label: 'Template Legale',    icon: 'Scale',         color: '#8B5CF6', bgColor: 'bg-violet-50' },
  financial_model:   { label: 'Modello Finanziario', icon: 'Calculator',   color: '#06B6D4', bgColor: 'bg-cyan-50' },
  presentation:      { label: 'Presentazione',      icon: 'Presentation',  color: '#EC4899', bgColor: 'bg-pink-50' },
  internal_strategy: { label: 'Strategia Interna',  icon: 'Target',        color: '#001220', bgColor: 'bg-slate-100' },
  due_diligence:     { label: 'Due Diligence',      icon: 'ClipboardCheck',color: '#D97706', bgColor: 'bg-amber-50' },
  valuation:         { label: 'Valutazione',         icon: 'Coins',         color: '#059669', bgColor: 'bg-emerald-50' },
  regulatory:        { label: 'Normativa',           icon: 'Shield',        color: '#64748B', bgColor: 'bg-slate-50' },
  other:             { label: 'Altro',               icon: 'File',          color: '#94A3B8', bgColor: 'bg-slate-50' },
};

export const KB_VISIBILITY_CONFIG: Record<KbVisibility, {
  label: string; icon: string; color: string;
}> = {
  private: { label: 'Privato',    icon: 'Lock',    color: '#64748B' },
  admin:   { label: 'Solo Admin', icon: 'Shield',  color: '#001220' },
  members: { label: 'Membri',     icon: 'Users',   color: '#3B82F6' },
  public:  { label: 'Pubblico',   icon: 'Globe',   color: '#10B981' },
};

export const KB_SECTORS = [
  'Real Estate', 'Corporate M&A', 'Energy', 'Capital Markets',
  'NPL/UTP', 'Infrastructure', 'Technology', 'Healthcare',
  'Food & Beverage', 'Fashion & Luxury', 'Industrial', 'Cross-sector',
] as const;
