// ============================================================
// types/cockpit.ts — Minerva Cockpit Dashboard
// ============================================================

export type TaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type TaskCategory = 'follow_up' | 'deadline' | 'meeting_prep' | 'document' | 'call' | 'internal' | 'other';

export interface Task {
  id: string;
  created_by: string;
  assigned_to?: string | null;
  title: string;
  description?: string;
  priority: TaskPriority;
  category: TaskCategory;
  is_completed: boolean;
  completed_at?: string | null;
  due_date?: string | null;
  deal_id?: string | null;
  contact_id?: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;

  // Populated
  deal?: { id: string; title: string } | null;
  contact?: { id: string; full_name: string } | null;
  deal_title?: string;
  contact_name?: string;
}

export interface CockpitData {
  user_name: string;
  tasks_today: Task[];
  tasks_upcoming: Task[];
  overdue_count: number;
  followup_count: number;
  active_deals: { id: string; title: string; deal_stage: string; sector: string; estimated_ev: string; category?: string }[];
  key_contacts_count: number;
  interactions_this_week: number;
  recent_interactions: {
    id: string;
    interaction_type: string;
    title: string;
    interaction_date: string;
    contact_id: string;
    contact_name: string;
    contact_company: string;
  }[];
  upcoming_deadlines: {
    type: string;
    title: string;
    due_date: string;
    deal_title?: string;
  }[];
}

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; emoji: string; color: string; bgColor: string }> = {
  urgent: { label: 'Urgente', emoji: '\uD83D\uDD34', color: 'text-red-600', bgColor: 'bg-red-50' },
  high:   { label: 'Alta',    emoji: '\uD83D\uDFE0', color: 'text-orange-600', bgColor: 'bg-orange-50' },
  normal: { label: 'Normale', emoji: '\uD83D\uDD35', color: 'text-blue-600', bgColor: 'bg-blue-50' },
  low:    { label: 'Bassa',   emoji: '\u26AA', color: 'text-slate-400', bgColor: 'bg-slate-50' },
};

export const CATEGORY_CONFIG: Record<TaskCategory, { label: string; icon: string }> = {
  follow_up:    { label: 'Follow-up',    icon: 'Clock' },
  deadline:     { label: 'Scadenza',     icon: 'AlertTriangle' },
  meeting_prep: { label: 'Prep Meeting', icon: 'Users' },
  document:     { label: 'Documento',    icon: 'FileText' },
  call:         { label: 'Chiamata',     icon: 'Phone' },
  internal:     { label: 'Interno',      icon: 'Briefcase' },
  other:        { label: 'Altro',        icon: 'MoreHorizontal' },
};
