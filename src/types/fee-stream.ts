// ============================================================
// types/fee-stream.ts — Minerva Partners Fee Streams Types
// ============================================================

export type FeeStreamType =
  | 'retainer'
  | 'success'
  | 'advisory'
  | 'arrangement'
  | 'monitoring'
  | 'break_up'
  | 'custom';

export type FeeStreamStatus =
  | 'projected'
  | 'accrued'
  | 'invoiced'
  | 'partially_paid'
  | 'paid'
  | 'waived'
  | 'disputed';

export type FeePaymentStatus = 'pending' | 'paid' | 'overdue' | 'cancelled';

// ── Fee Stream ──────────────────────────────────────────────

export interface FeeStream {
  id: string;
  deal_id: string;
  mandate_id?: string | null;
  created_by?: string;

  fee_type: FeeStreamType;
  label: string;
  description?: string;

  projected_amount: number | null;
  accrued_amount: number | null;
  invoiced_amount: number;
  collected_amount: number;

  percentage?: number | null;
  calculation_base?: string;
  base_amount?: number | null;

  deductible_from?: string | null;
  deduction_amount: number;

  status: FeeStreamStatus;
  accrual_date?: string | null;
  due_date?: string | null;
  currency: string;

  vat_rate: number;
  vat_amount?: number | null;

  notes?: string;
  created_at: string;
  updated_at: string;

  // Relazioni (populated via join)
  deal?: { id: string; title: string; category: string; stage?: string };
  mandate?: { id: string; client_company_name: string } | null;
  payments?: FeePayment[];
  distributions?: FeeDistribution[];
}

// ── Fee Payment ─────────────────────────────────────────────

export interface FeePayment {
  id: string;
  fee_stream_id: string;
  recorded_by?: string;

  amount: number;
  vat_amount?: number | null;
  total_amount: number;

  invoice_number?: string;
  invoice_date?: string;
  invoice_url?: string;

  payment_date?: string | null;
  payment_method?: string;
  payment_ref?: string;
  status: FeePaymentStatus;
  due_date?: string | null;

  notes?: string;
  created_at: string;
  updated_at: string;
}

// ── Fee Distribution ────────────────────────────────────────

export interface FeeDistribution {
  id: string;
  fee_stream_id: string;
  recipient_id?: string | null;
  recipient_name: string;
  recipient_role?: string;

  percentage: number;
  fixed_amount?: number | null;
  calculated_amount?: number | null;

  is_paid: boolean;
  paid_date?: string | null;
  paid_amount?: number | null;

  notes?: string;
  created_at: string;
  updated_at: string;

  // Populated
  recipient?: { id: string; full_name: string; avatar_url?: string };
}

// ── Dashboard Summary (dalla view SQL) ──────────────────────

export interface FeeDashboardSummary {
  deal_id: string;
  total_streams: number;
  projected_count: number;
  accrued_count: number;
  invoiced_count: number;
  paid_count: number;
  total_projected: number;
  total_accrued: number;
  total_invoiced: number;
  total_collected: number;
}

// ── UI Configs ──────────────────────────────────────────────

export const FEE_TYPE_CONFIG: Record<FeeStreamType, { label: string; icon: string; color: string }> = {
  retainer:     { label: 'Retainer Fee',     icon: 'Wallet',       color: '#6366F1' },
  success:      { label: 'Success Fee',      icon: 'Trophy',       color: '#D4AF37' },
  advisory:     { label: 'Advisory Fee',     icon: 'Briefcase',    color: '#3B82F6' },
  arrangement:  { label: 'Arrangement Fee',  icon: 'Handshake',    color: '#8B5CF6' },
  monitoring:   { label: 'Monitoring Fee',   icon: 'Eye',          color: '#06B6D4' },
  break_up:     { label: 'Break-up Fee',     icon: 'ShieldAlert',  color: '#EF4444' },
  custom:       { label: 'Fee Personalizzata', icon: 'Settings',   color: '#64748B' },
};

export const FEE_STATUS_CONFIG: Record<FeeStreamStatus, {
  label: string; color: string; bgColor: string; dotColor: string;
}> = {
  projected:      { label: 'Prevista',      color: 'text-slate-500',   bgColor: 'bg-slate-50',    dotColor: 'bg-slate-400' },
  accrued:        { label: 'Maturata',      color: 'text-blue-600',    bgColor: 'bg-blue-50',     dotColor: 'bg-blue-500' },
  invoiced:       { label: 'Fatturata',     color: 'text-purple-600',  bgColor: 'bg-purple-50',   dotColor: 'bg-purple-500' },
  partially_paid: { label: 'Parz. Incassata', color: 'text-amber-600', bgColor: 'bg-amber-50',   dotColor: 'bg-amber-500' },
  paid:           { label: 'Incassata',     color: 'text-emerald-600', bgColor: 'bg-emerald-50',  dotColor: 'bg-emerald-500' },
  waived:         { label: 'Rinunciata',    color: 'text-red-400',     bgColor: 'bg-red-50',      dotColor: 'bg-red-300' },
  disputed:       { label: 'Contestata',    color: 'text-red-600',     bgColor: 'bg-red-50',      dotColor: 'bg-red-500' },
};

export const PAYMENT_STATUS_CONFIG: Record<FeePaymentStatus, {
  label: string; color: string; bgColor: string;
}> = {
  pending:   { label: 'In Attesa',  color: 'text-amber-600',   bgColor: 'bg-amber-50' },
  paid:      { label: 'Pagato',     color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  overdue:   { label: 'Scaduto',    color: 'text-red-600',     bgColor: 'bg-red-50' },
  cancelled: { label: 'Annullato',  color: 'text-slate-400',   bgColor: 'bg-slate-50' },
};

export const DISTRIBUTION_ROLES = [
  'Originator',
  'Co-Originator',
  'Advisor',
  'Introducer',
  'Minerva Partners',
  'External Advisor',
  'Other',
] as const;
