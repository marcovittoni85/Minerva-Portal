// ============================================================
// types/mandate.ts — Minerva Partners Mandate Types
// ============================================================

export type MandateStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'sent'
  | 'signed'
  | 'expired'
  | 'revoked';

export type MandateFeeType =
  | 'retainer_success'
  | 'success_only'
  | 'flat_fee'
  | 'custom';

export interface ScopeSection {
  title: string;         // es. "Strutturazione operazioni di Liquidità"
  items: string[];       // bullet points della sezione
}

export interface MandateData {
  id?: string;
  deal_id: string;
  status: MandateStatus;

  // Dati Cliente
  client_company_name: string;
  client_legal_form: string;
  client_registered_office: string;
  client_cf: string;
  client_piva: string;
  client_registry_office: string;
  client_registry_number: string;
  client_legal_rep_name: string;
  client_legal_rep_role: string;
  client_pec: string;
  client_short_name: string;

  // Premesse
  client_description: string;
  operation_description: string;
  operation_amount_min: number | null;
  operation_amount_max: number | null;
  operation_type: string;
  minerva_scope_summary: string;

  // Compensi
  fee_type: MandateFeeType;
  retainer_amount: number | null;
  retainer_description: string;
  retainer_deductible: boolean;
  success_fee_percentage: number | null;
  success_fee_base: string;
  success_fee_description: string;
  custom_fee_text: string;

  // Durata
  start_date: string;
  expiry_date: string;
  notice_period_days: number;

  // Comunicazioni
  client_comm_address: string;
  client_comm_pec: string;

  // Allegato
  scope_of_work: ScopeSection[];
  scope_notes: string;

  // Foro
  jurisdiction: string;

  // Meta
  document_url?: string;
  document_version?: number;
  signed_document_url?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

// Form step definitions
export interface MandateFormStep {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
}

export const MANDATE_FORM_STEPS: MandateFormStep[] = [
  { id: 'client',    title: 'Dati Cliente',    subtitle: 'Anagrafica della controparte',  icon: 'Building2' },
  { id: 'operation', title: 'Operazione',      subtitle: 'Premesse e descrizione',        icon: 'FileText' },
  { id: 'fees',      title: 'Compensi',        subtitle: 'Retainer e Success Fee',         icon: 'Coins' },
  { id: 'terms',     title: 'Termini',         subtitle: 'Durata, foro, comunicazioni',   icon: 'Scale' },
  { id: 'scope',     title: 'Allegato SOW',    subtitle: 'Scope of Work dettagliato',     icon: 'ClipboardList' },
  { id: 'review',    title: 'Revisione',       subtitle: 'Anteprima e generazione',       icon: 'Eye' },
];

export const MANDATE_STATUS_CONFIG: Record<MandateStatus, { label: string; color: string; bgColor: string }> = {
  draft:    { label: 'Bozza',          color: 'text-slate-600',  bgColor: 'bg-slate-100' },
  pending:  { label: 'In Approvazione', color: 'text-amber-600',  bgColor: 'bg-amber-50' },
  approved: { label: 'Approvato',      color: 'text-blue-600',   bgColor: 'bg-blue-50' },
  sent:     { label: 'Inviato',        color: 'text-purple-600', bgColor: 'bg-purple-50' },
  signed:   { label: 'Firmato',        color: 'text-emerald-600',bgColor: 'bg-emerald-50' },
  expired:  { label: 'Scaduto',        color: 'text-red-600',    bgColor: 'bg-red-50' },
  revoked:  { label: 'Revocato',       color: 'text-red-800',    bgColor: 'bg-red-100' },
};

export const FEE_TYPE_LABELS: Record<MandateFeeType, string> = {
  retainer_success: 'Retainer + Success Fee',
  success_only:     'Solo Success Fee',
  flat_fee:         'Compenso Fisso',
  custom:           'Struttura Personalizzata',
};

// Default empty mandate for form initialization
export const DEFAULT_MANDATE: Omit<MandateData, 'deal_id'> = {
  status: 'draft',
  client_company_name: '',
  client_legal_form: 'Srl',
  client_registered_office: '',
  client_cf: '',
  client_piva: '',
  client_registry_office: '',
  client_registry_number: '',
  client_legal_rep_name: '',
  client_legal_rep_role: 'legale rappresentante',
  client_pec: '',
  client_short_name: '',
  client_description: '',
  operation_description: '',
  operation_amount_min: null,
  operation_amount_max: null,
  operation_type: '',
  minerva_scope_summary: '',
  fee_type: 'retainer_success',
  retainer_amount: null,
  retainer_description: '',
  retainer_deductible: true,
  success_fee_percentage: null,
  success_fee_base: 'Enterprise Value',
  success_fee_description: '',
  custom_fee_text: '',
  start_date: new Date().toISOString().split('T')[0],
  expiry_date: '',
  notice_period_days: 30,
  client_comm_address: '',
  client_comm_pec: '',
  scope_of_work: [{ title: '', items: [''] }],
  scope_notes: '',
  jurisdiction: 'Bergamo',
};
