// ============================================================
// types/calendar.ts — Minerva Calendar Types
// ============================================================

export interface CalendarEvent {
  id: string;
  created_by: string;
  title: string;
  description?: string;
  location?: string;
  event_type: string;
  start_at: string;
  end_at?: string | null;
  all_day: boolean;
  color?: string;
  deal_id?: string | null;
  contact_id?: string | null;
  task_id?: string | null;
  participant_ids: string[];
  google_event_id?: string | null;
  outlook_event_id?: string | null;
  external_link?: string;
  reminder_minutes: number;
  is_recurring: boolean;
  recurrence_rule?: string;
  recurrence_end?: string | null;
  parent_event_id?: string | null;
  is_cancelled: boolean;
  outcome?: string | null;
  created_at: string;
  updated_at: string;
  // Populated
  deal_title?: string;
  contact_name?: string;
  contact_company?: string;
}

export const EVENT_TYPE_CONFIG: Record<string, {
  label: string; icon: string; color: string; defaultColor: string;
}> = {
  meeting:    { label: 'Meeting',     icon: 'Users',    color: '#3B82F6', defaultColor: '#3B82F6' },
  call:       { label: 'Telefonata',  icon: 'Phone',    color: '#10B981', defaultColor: '#10B981' },
  video_call: { label: 'Videocall',   icon: 'Video',    color: '#8B5CF6', defaultColor: '#8B5CF6' },
  event:      { label: 'Evento',      icon: 'Calendar', color: '#F5A623', defaultColor: '#F5A623' },
  deadline:   { label: 'Scadenza',    icon: 'Clock',    color: '#EF4444', defaultColor: '#EF4444' },
  reminder:   { label: 'Promemoria',  icon: 'Bell',     color: '#64748B', defaultColor: '#64748B' },
};

export const CALENDAR_COLORS = [
  { value: '#001220', label: 'Navy' },
  { value: '#F5A623', label: 'Gold' },
  { value: '#3B82F6', label: 'Blu' },
  { value: '#10B981', label: 'Verde' },
  { value: '#8B5CF6', label: 'Viola' },
  { value: '#EF4444', label: 'Rosso' },
  { value: '#F59E0B', label: 'Amber' },
  { value: '#06B6D4', label: 'Cyan' },
  { value: '#EC4899', label: 'Rosa' },
  { value: '#64748B', label: 'Grigio' },
];
