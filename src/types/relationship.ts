// ============================================================
// types/relationship.ts — Minerva Relationship Intelligence
// ============================================================

export type InteractionType =
  | 'meeting' | 'call' | 'video_call'
  | 'email_sent' | 'email_received'
  | 'note' | 'introduction' | 'event'
  | 'deal_mention' | 'document_shared'
  | 'follow_up' | 'other';

export type ContactRelationshipType =
  | 'client' | 'prospect' | 'investor' | 'advisor'
  | 'banker' | 'lawyer' | 'accountant' | 'entrepreneur'
  | 'family_office' | 'institutional' | 'introducer'
  | 'partner' | 'other';

export type RelationshipStrength = 'cold' | 'warm' | 'active' | 'strong' | 'key';

// ── Contact ─────────────────────────────────────────────────

export interface Contact {
  id: string;
  profile_id?: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  email?: string;
  phone?: string;
  linkedin_url?: string;
  company?: string;
  job_title?: string;
  location?: string;

  relationship_type: ContactRelationshipType;
  strength: RelationshipStrength;
  tags: string[];

  investor_ticket_min?: number | null;
  investor_ticket_max?: number | null;
  sector_interests: string[];
  geography_interests: string[];

  interaction_count: number;
  last_interaction_at?: string | null;
  last_interaction_type?: InteractionType | null;
  deals_involved: number;
  score: number;

  source?: string;
  referred_by?: string | null;
  notes?: string;
  avatar_url?: string;

  created_by?: string;
  created_at: string;
  updated_at: string;

  // Populated
  interactions?: Interaction[];
  linked_deals?: ContactDeal[];
  referrer?: { id: string; full_name: string } | null;
}

// ── Interaction ─────────────────────────────────────────────

export interface Interaction {
  id: string;
  contact_id: string;
  created_by?: string;

  interaction_type: InteractionType;
  title: string;
  description?: string;
  outcome?: string;

  interaction_date: string;
  duration_minutes?: number;

  deal_id?: string | null;
  participants: string[];

  follow_up_date?: string | null;
  follow_up_done: boolean;
  follow_up_notes?: string;

  sentiment?: 'positive' | 'neutral' | 'negative';
  is_important: boolean;

  attachments: { name: string; url: string; type: string }[];

  created_at: string;
  updated_at: string;

  // Populated
  deal?: { id: string; title: string } | null;
  creator?: { id: string; full_name: string } | null;
}

// ── Contact-Deal Link ───────────────────────────────────────

export interface ContactDeal {
  id: string;
  contact_id: string;
  deal_id: string;
  role?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;

  // Populated
  deal?: { id: string; title: string; category: string; estimated_ev?: string };
  contact?: { id: string; full_name: string; company?: string };
}

// ── UI Configs ──────────────────────────────────────────────

export const INTERACTION_TYPE_CONFIG: Record<InteractionType, {
  label: string; icon: string; color: string;
}> = {
  meeting:          { label: 'Meeting',           icon: 'Users',         color: '#3B82F6' },
  call:             { label: 'Telefonata',        icon: 'Phone',         color: '#10B981' },
  video_call:       { label: 'Videocall',         icon: 'Video',         color: '#8B5CF6' },
  email_sent:       { label: 'Email Inviata',     icon: 'Send',          color: '#F59E0B' },
  email_received:   { label: 'Email Ricevuta',    icon: 'Mail',          color: '#F59E0B' },
  note:             { label: 'Nota',              icon: 'StickyNote',    color: '#64748B' },
  introduction:     { label: 'Introduzione',      icon: 'UserPlus',      color: '#06B6D4' },
  event:            { label: 'Evento',            icon: 'Calendar',      color: '#EC4899' },
  deal_mention:     { label: 'Menzione Deal',     icon: 'Briefcase',     color: '#001220' },
  document_shared:  { label: 'Documento',         icon: 'FileText',      color: '#78716C' },
  follow_up:        { label: 'Follow-up',         icon: 'Clock',         color: '#EF4444' },
  other:            { label: 'Altro',             icon: 'MoreHorizontal',color: '#94A3B8' },
};

export const RELATIONSHIP_TYPE_CONFIG: Record<ContactRelationshipType, {
  label: string; color: string;
}> = {
  client:        { label: 'Cliente',         color: '#F5A623' },
  prospect:      { label: 'Prospect',        color: '#94A3B8' },
  investor:      { label: 'Investitore',     color: '#10B981' },
  advisor:       { label: 'Advisor',         color: '#3B82F6' },
  banker:        { label: 'Banker',          color: '#001220' },
  lawyer:        { label: 'Avvocato',        color: '#78716C' },
  accountant:    { label: 'Commercialista',  color: '#78716C' },
  entrepreneur:  { label: 'Imprenditore',    color: '#8B5CF6' },
  family_office: { label: 'Family Office',   color: '#EC4899' },
  institutional: { label: 'Istituzionale',   color: '#06B6D4' },
  introducer:    { label: 'Segnalatore',     color: '#F59E0B' },
  partner:       { label: 'Partner',         color: '#001220' },
  other:         { label: 'Altro',           color: '#94A3B8' },
};

export const STRENGTH_CONFIG: Record<RelationshipStrength, {
  label: string; color: string; bgColor: string; emoji: string;
}> = {
  cold:   { label: 'Freddo',   color: 'text-slate-400',   bgColor: 'bg-slate-50',    emoji: '❄️' },
  warm:   { label: 'Tiepido',  color: 'text-amber-500',   bgColor: 'bg-amber-50',    emoji: '🌤' },
  active: { label: 'Attivo',   color: 'text-blue-600',    bgColor: 'bg-blue-50',     emoji: '🔵' },
  strong: { label: 'Forte',    color: 'text-emerald-600', bgColor: 'bg-emerald-50',  emoji: '💚' },
  key:    { label: 'Chiave',   color: 'text-[#F5A623]',   bgColor: 'bg-[#F5A623]/10',emoji: '⭐' },
};

export const CONTACT_ROLES_IN_DEAL = [
  'Buyer', 'Seller', 'Advisor', 'Investor',
  'Introducer', 'Legal Counsel', 'Auditor',
  'Board Member', 'Consultant', 'Other',
] as const;

export const SENTIMENT_CONFIG = {
  positive: { label: 'Positivo', color: '#10B981', icon: '😊' },
  neutral:  { label: 'Neutro',   color: '#94A3B8', icon: '😐' },
  negative: { label: 'Negativo', color: '#EF4444', icon: '😟' },
};
