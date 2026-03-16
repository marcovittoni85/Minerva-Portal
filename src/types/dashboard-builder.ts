// ============================================================
// types/dashboard-builder.ts — Minerva Dashboard Builder
// ============================================================

// ── Widget position in grid ─────────────────────────────────
export interface WidgetPosition {
  id: string;           // Unique widget instance ID
  widget: string;       // Widget type key (from WIDGET_CATALOG)
  x: number;            // Grid column (0-11, 12-column grid)
  y: number;            // Grid row
  w: number;            // Width in columns (1-12)
  h: number;            // Height in rows (1-6)
  config: WidgetConfig; // Widget-specific configuration
}

export interface WidgetConfig {
  title: string;        // Editable label
  limit?: number;       // Max items to show
  items?: string[];     // For KPI strip: which KPIs to show
  showChart?: boolean;
  chartType?: string;
  filters?: Record<string, string>;
  [key: string]: any;   // Widget-specific extra config
}

// ── Dashboard configuration ─────────────────────────────────
export interface DashboardConfig {
  id: string;
  role: string;
  name: string;
  layout: WidgetPosition[];
  updated_by?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ── Widget catalog ──────────────────────────────────────────
export interface WidgetDefinition {
  key: string;
  label: string;
  description: string;
  icon: string;
  category: 'kpi' | 'deals' | 'tasks' | 'relationships' | 'fees' | 'calendar' | 'content';
  defaultW: number;     // Default width
  defaultH: number;     // Default height
  minW: number;
  minH: number;
  maxW: number;
  maxH: number;
  defaultConfig: WidgetConfig;
  availableFor: string[]; // Roles that can see this widget
}

export const WIDGET_CATALOG: WidgetDefinition[] = [
  // ── KPI ────────────────────────────────
  {
    key: 'kpi_strip',
    label: 'KPI Strip',
    description: 'Barra di indicatori numerici chiave',
    icon: 'BarChart3',
    category: 'kpi',
    defaultW: 12, defaultH: 1, minW: 6, minH: 1, maxW: 12, maxH: 2,
    defaultConfig: {
      title: 'KPI',
      items: ['deals_active', 'members_total', 'fees_collected'],
    },
    availableFor: ['admin', 'partner', 'advisor', 'friend'],
  },

  // ── DEALS ──────────────────────────────
  {
    key: 'hot_deals',
    label: 'Deal Caldi',
    description: 'Deal in fase attiva con attività recente',
    icon: 'Flame',
    category: 'deals',
    defaultW: 7, defaultH: 3, minW: 4, minH: 2, maxW: 12, maxH: 6,
    defaultConfig: { title: 'Deal in Corso', limit: 5 },
    availableFor: ['admin'],
  },
  {
    key: 'deal_board_preview',
    label: 'Bacheca Deal (Preview)',
    description: 'Anteprima delle ultime operazioni in bacheca',
    icon: 'LayoutGrid',
    category: 'deals',
    defaultW: 12, defaultH: 4, minW: 6, minH: 2, maxW: 12, maxH: 6,
    defaultConfig: { title: 'Opportunità Recenti', limit: 6 },
    availableFor: ['admin', 'partner', 'advisor', 'friend'],
  },
  {
    key: 'my_deals',
    label: 'I Miei Deal',
    description: 'Deal dove sei coinvolto nel workgroup',
    icon: 'Briefcase',
    category: 'deals',
    defaultW: 7, defaultH: 3, minW: 4, minH: 2, maxW: 12, maxH: 6,
    defaultConfig: { title: 'I Miei Deal', limit: 5 },
    availableFor: ['admin', 'partner', 'advisor'],
  },
  {
    key: 'deal_pipeline',
    label: 'Pipeline Deal',
    description: 'Conteggio deal per stage',
    icon: 'GitBranch',
    category: 'deals',
    defaultW: 12, defaultH: 2, minW: 6, minH: 2, maxW: 12, maxH: 3,
    defaultConfig: { title: 'Pipeline', showChart: true },
    availableFor: ['admin'],
  },

  // ── TASKS ──────────────────────────────
  {
    key: 'pending_tasks',
    label: 'Task Urgenti',
    description: 'Task in scadenza o scaduti',
    icon: 'CheckSquare',
    category: 'tasks',
    defaultW: 5, defaultH: 3, minW: 4, minH: 2, maxW: 8, maxH: 6,
    defaultConfig: { title: 'Task Urgenti', limit: 5 },
    availableFor: ['admin', 'partner', 'advisor'],
  },
  {
    key: 'my_tasks',
    label: 'I Miei Task',
    description: 'Task assegnati a te',
    icon: 'ListTodo',
    category: 'tasks',
    defaultW: 6, defaultH: 3, minW: 4, minH: 2, maxW: 8, maxH: 6,
    defaultConfig: { title: 'I Miei Task', limit: 5 },
    availableFor: ['admin', 'partner', 'advisor'],
  },

  // ── RELATIONSHIPS ──────────────────────
  {
    key: 'recent_interactions',
    label: 'Ultime Interazioni',
    description: 'Timeline delle interazioni recenti',
    icon: 'MessageSquare',
    category: 'relationships',
    defaultW: 6, defaultH: 3, minW: 4, minH: 2, maxW: 8, maxH: 6,
    defaultConfig: { title: 'Ultime Interazioni', limit: 5 },
    availableFor: ['admin', 'advisor'],
  },
  {
    key: 'pending_followups',
    label: 'Follow-up Pendenti',
    description: 'Follow-up da completare',
    icon: 'Clock',
    category: 'relationships',
    defaultW: 5, defaultH: 3, minW: 4, minH: 2, maxW: 8, maxH: 6,
    defaultConfig: { title: 'Follow-up Pendenti', limit: 5 },
    availableFor: ['admin', 'advisor'],
  },
  {
    key: 'key_contacts',
    label: 'Contatti Chiave',
    description: 'Contatti con score più alto',
    icon: 'Star',
    category: 'relationships',
    defaultW: 6, defaultH: 3, minW: 4, minH: 2, maxW: 8, maxH: 6,
    defaultConfig: { title: 'Contatti Chiave', limit: 5 },
    availableFor: ['admin', 'advisor'],
  },
  {
    key: 'dormant_contacts',
    label: 'Contatti Dormienti',
    description: 'Relazioni forti senza interazioni da 90+ giorni',
    icon: 'UserMinus',
    category: 'relationships',
    defaultW: 6, defaultH: 3, minW: 4, minH: 2, maxW: 8, maxH: 6,
    defaultConfig: { title: 'Contatti Dormienti', limit: 5 },
    availableFor: ['admin'],
  },

  // ── FEES ───────────────────────────────
  {
    key: 'fee_overview',
    label: 'Revenue Overview',
    description: 'Panoramica fee: previste, maturate, incassate',
    icon: 'CircleDollarSign',
    category: 'fees',
    defaultW: 12, defaultH: 2, minW: 6, minH: 2, maxW: 12, maxH: 4,
    defaultConfig: { title: 'Revenue Overview', showChart: true },
    availableFor: ['admin'],
  },
  {
    key: 'fees_earned',
    label: 'Fee Guadagnate',
    description: 'Le tue fee da deal chiusi',
    icon: 'Coins',
    category: 'fees',
    defaultW: 6, defaultH: 2, minW: 4, minH: 2, maxW: 8, maxH: 4,
    defaultConfig: { title: 'Le Mie Fee' },
    availableFor: ['admin', 'partner', 'advisor'],
  },

  // ── CALENDAR ───────────────────────────
  {
    key: 'upcoming_events',
    label: 'Prossimi Appuntamenti',
    description: 'I prossimi eventi in calendario',
    icon: 'Calendar',
    category: 'calendar',
    defaultW: 6, defaultH: 3, minW: 4, minH: 2, maxW: 8, maxH: 6,
    defaultConfig: { title: 'Prossimi Appuntamenti', limit: 5 },
    availableFor: ['admin', 'partner', 'advisor', 'friend'],
  },
  {
    key: 'mini_calendar',
    label: 'Mini Calendario',
    description: 'Calendario compatto con eventi',
    icon: 'CalendarDays',
    category: 'calendar',
    defaultW: 4, defaultH: 3, minW: 3, minH: 3, maxW: 6, maxH: 4,
    defaultConfig: { title: 'Calendario' },
    availableFor: ['admin', 'partner', 'advisor', 'friend'],
  },

  // ── CONTENT ────────────────────────────
  {
    key: 'deadlines',
    label: 'Scadenze',
    description: 'Mandati, fee, follow-up in scadenza',
    icon: 'AlertTriangle',
    category: 'content',
    defaultW: 6, defaultH: 3, minW: 4, minH: 2, maxW: 8, maxH: 6,
    defaultConfig: { title: 'Scadenze Imminenti', limit: 5 },
    availableFor: ['admin'],
  },
  {
    key: 'recent_documents',
    label: 'Documenti Recenti',
    description: 'Ultimi documenti nella Knowledge Base',
    icon: 'BookOpen',
    category: 'content',
    defaultW: 6, defaultH: 3, minW: 4, minH: 2, maxW: 8, maxH: 4,
    defaultConfig: { title: 'Documenti Recenti', limit: 5 },
    availableFor: ['admin', 'partner', 'advisor'],
  },
  {
    key: 'welcome_text',
    label: 'Testo di Benvenuto',
    description: 'Testo personalizzabile (annunci, messaggi)',
    icon: 'Type',
    category: 'content',
    defaultW: 12, defaultH: 1, minW: 4, minH: 1, maxW: 12, maxH: 3,
    defaultConfig: {
      title: 'Benvenuto',
      content: 'Benvenuto nel portale Minerva Partners.',
    },
    availableFor: ['admin', 'partner', 'advisor', 'friend'],
  },
  {
    key: 'requests_pending',
    label: 'Richieste Pendenti',
    description: 'Richieste accesso e presentazione in attesa',
    icon: 'Bell',
    category: 'content',
    defaultW: 5, defaultH: 3, minW: 4, minH: 2, maxW: 8, maxH: 5,
    defaultConfig: { title: 'Richieste Pendenti', limit: 5 },
    availableFor: ['admin'],
  },
];

// ── KPI items catalog ───────────────────────────────────────
export const KPI_ITEMS_CATALOG: Record<string, {
  label: string; icon: string; color: string;
  availableFor: string[];
}> = {
  deals_active:       { label: 'Deal Attivi',         icon: 'Briefcase',       color: '#3B82F6', availableFor: ['admin'] },
  deals_available:    { label: 'Deal Disponibili',    icon: 'LayoutGrid',      color: '#3B82F6', availableFor: ['partner', 'advisor', 'friend'] },
  deals_involved:     { label: 'Deal Coinvolto',      icon: 'Briefcase',       color: '#8B5CF6', availableFor: ['partner', 'advisor'] },
  requests_pending:   { label: 'Richieste Pendenti',  icon: 'Bell',            color: '#F5A623', availableFor: ['admin'] },
  members_total:      { label: 'Membri Totali',       icon: 'Users',           color: '#64748B', availableFor: ['admin'] },
  workgroup_count:    { label: 'In Workgroup',        icon: 'UserCheck',       color: '#10B981', availableFor: ['admin'] },
  fees_collected:     { label: 'Fee Incassate',       icon: 'CircleDollarSign',color: '#10B981', availableFor: ['admin'] },
  fees_earned:        { label: 'Fee Guadagnate',      icon: 'Coins',           color: '#F5A623', availableFor: ['partner', 'advisor'] },
  events_upcoming:    { label: 'Prossimi Eventi',     icon: 'Calendar',        color: '#EC4899', availableFor: ['admin', 'partner', 'advisor', 'friend'] },
  contacts_key:       { label: 'Contatti Chiave',     icon: 'Star',            color: '#F5A623', availableFor: ['admin', 'advisor'] },
  pending_followups:  { label: 'Follow-up Pendenti',  icon: 'Clock',           color: '#EF4444', availableFor: ['admin', 'advisor'] },
  tasks_overdue:      { label: 'Task Scaduti',        icon: 'AlertTriangle',   color: '#EF4444', availableFor: ['admin', 'advisor'] },
};

// ── Widget category labels ──────────────────────────────────
export const WIDGET_CATEGORIES: Record<string, { label: string; icon: string }> = {
  kpi:           { label: 'KPI',           icon: 'BarChart3' },
  deals:         { label: 'Deal',          icon: 'Briefcase' },
  tasks:         { label: 'Task',          icon: 'CheckSquare' },
  relationships: { label: 'Relazioni',     icon: 'Users' },
  fees:          { label: 'Fee & Revenue', icon: 'CircleDollarSign' },
  calendar:      { label: 'Calendario',    icon: 'Calendar' },
  content:       { label: 'Contenuto',     icon: 'FileText' },
};
